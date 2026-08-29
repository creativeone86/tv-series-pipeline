/**
 * Guards the chat-completions parameter dialect.
 *
 * Regression origin: both LLM call paths hardcoded `max_tokens`, so every
 * gpt-5 / o-series model returned 400 "Unsupported parameter". The expectations
 * below were verified live against api.openai.com.
 */
import { describe, it, expect } from 'vitest';
import {
  needsMaxCompletionTokens,
  supportsCustomTemperature,
  buildChatBody,
  isTokenParamError,
  isTemperatureParamError,
  retryBodyForParamError,
} from '@/lib/llm-params.mjs';

describe('model family detection', () => {
  it('treats gpt-5 and o-series as reasoning models', () => {
    for (const m of ['gpt-5', 'gpt-5.5', 'gpt-5.2-pro', 'gpt-5.6-sol', 'gpt-5.4-mini', 'o1', 'o3', 'o3-mini', 'o4-mini']) {
      expect(needsMaxCompletionTokens(m), m).toBe(true);
      expect(supportsCustomTemperature(m), m).toBe(false);
    }
  });

  it('leaves gpt-4 era and third-party gateway models on max_tokens', () => {
    for (const m of ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'claude-sonnet-4-6', 'deepseek-v4-pro', 'MiniMax-M2.7']) {
      expect(needsMaxCompletionTokens(m), m).toBe(false);
      expect(supportsCustomTemperature(m), m).toBe(true);
    }
  });

  it('sees through OpenRouter-style vendor prefixes', () => {
    expect(needsMaxCompletionTokens('openai/gpt-5.5')).toBe(true);
    expect(needsMaxCompletionTokens('anthropic/claude-sonnet-4')).toBe(false);
  });

  it('does not mistake gpt-4o for the o-series', () => {
    expect(needsMaxCompletionTokens('gpt-4o')).toBe(false);
  });

  it('handles empty/undefined model without throwing', () => {
    expect(needsMaxCompletionTokens(undefined)).toBe(false);
    expect(needsMaxCompletionTokens('')).toBe(false);
  });
});

describe('buildChatBody', () => {
  const base = { system: 'sys', user: 'usr', maxTokens: 1234 };

  it('keeps the legacy shape byte-for-byte for non-reasoning models', () => {
    expect(buildChatBody({ ...base, model: 'gpt-4o-mini', temperature: 0.8 })).toEqual({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'usr' }],
      max_tokens: 1234,
      temperature: 0.8,
    });
  });

  it('swaps in max_completion_tokens and drops temperature for reasoning models', () => {
    const body = buildChatBody({ ...base, model: 'gpt-5.5', temperature: 0.8 });
    expect(body.max_completion_tokens).toBe(1234);
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('temperature');
  });

  it('defaults maxTokens to 4096 on both dialects', () => {
    expect(buildChatBody({ model: 'gpt-4o' }).max_tokens).toBe(4096);
    expect(buildChatBody({ model: 'gpt-5.5' }).max_completion_tokens).toBe(4096);
  });

  it('passes json mode through for every family', () => {
    expect(buildChatBody({ ...base, model: 'gpt-5.5', jsonMode: true }).response_format).toEqual({ type: 'json_object' });
    expect(buildChatBody({ ...base, model: 'gpt-4o', jsonMode: true }).response_format).toEqual({ type: 'json_object' });
  });

  it('omits temperature when the caller did not set one', () => {
    expect(buildChatBody({ ...base, model: 'gpt-4o' })).not.toHaveProperty('temperature');
  });

  it('lets explicit messages override system/user', () => {
    const messages = [{ role: 'user', content: 'only' }];
    expect(buildChatBody({ model: 'gpt-4o', messages }).messages).toEqual(messages);
  });
});

describe('server error classification', () => {
  const tokenErr = "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.";
  const tempErr = "Unsupported value: 'temperature' does not support 0.8 with this model. Only the default (1) value is supported.";

  it('recognises the real OpenAI messages', () => {
    expect(isTokenParamError(tokenErr)).toBe(true);
    expect(isTemperatureParamError(tempErr)).toBe(true);
  });

  it('does not fire on unrelated failures', () => {
    for (const msg of [
      'The model `claude-sonnet-4-20250514` does not exist or you do not have access to it.',
      'Rate limit reached for requests',
      'insufficient_quota',
      '',
    ]) {
      expect(isTokenParamError(msg), msg).toBe(false);
      expect(isTemperatureParamError(msg), msg).toBe(false);
    }
  });
});

describe('retryBodyForParamError', () => {
  const tokenErr = "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.";
  const tempErr = "Unsupported value: 'temperature' does not support 0.8 with this model. Only the default (1) value is supported.";

  it('converts max_tokens to max_completion_tokens', () => {
    const fixed = retryBodyForParamError({ model: 'x', max_tokens: 900 }, tokenErr);
    expect(fixed).toEqual({ model: 'x', max_completion_tokens: 900 });
  });

  it('converts back for gateways that only accept max_tokens', () => {
    const fixed = retryBodyForParamError({ model: 'x', max_completion_tokens: 900 }, tokenErr);
    expect(fixed).toEqual({ model: 'x', max_tokens: 900 });
  });

  it('strips temperature on a temperature complaint', () => {
    const fixed = retryBodyForParamError({ model: 'x', max_tokens: 8, temperature: 0.8 }, tempErr);
    expect(fixed).toEqual({ model: 'x', max_tokens: 8 });
  });

  it('returns null for errors it cannot repair, so the caller falls back normally', () => {
    expect(retryBodyForParamError({ model: 'x', max_tokens: 8 }, 'model does not exist')).toBeNull();
    expect(retryBodyForParamError(null, tokenErr)).toBeNull();
  });

  it('does not mutate the original body', () => {
    const body = { model: 'x', max_tokens: 900 };
    retryBodyForParamError(body, tokenErr);
    expect(body).toEqual({ model: 'x', max_tokens: 900 });
  });

  it('never leaves a body with both token parameters set', () => {
    const fixed = retryBodyForParamError({ model: 'x', max_tokens: 900 }, tokenErr)!;
    expect('max_tokens' in fixed && 'max_completion_tokens' in fixed).toBe(false);
  });
});

describe('modelEndpointHint (health page diagnostics)', () => {
  const notFound = 'The model `claude-sonnet-4-20250514` does not exist or you do not have access to it.';

  it('names the vendor mismatch that caused the reported 404', async () => {
    const { modelEndpointHint } = await import('@/app/api/health/providers/route');
    const hint = modelEndpointHint('claude-sonnet-4-20250514', 'https://api.openai.com/v1', notFound);
    expect(hint).toContain('Anthropic');
    expect(hint).toContain('OpenAI');
    expect(hint).toContain('api.openai.com');
  });

  it('catches the deepseek-on-openai default that would break creative-fast', async () => {
    const { modelEndpointHint } = await import('@/app/api/health/providers/route');
    expect(modelEndpointHint('deepseek-v4-flash', 'https://api.openai.com/v1', notFound)).toContain('DeepSeek');
  });

  it('stays quiet unless the error is actually about an unknown model', async () => {
    const { modelEndpointHint } = await import('@/app/api/health/providers/route');
    expect(modelEndpointHint('claude-sonnet-4-6', 'https://api.openai.com/v1', 'Rate limit reached')).toBeNull();
    expect(modelEndpointHint('gpt-4o', 'https://api.openai.com/v1', '')).toBeNull();
  });

  it('falls back to a generic hint when vendor and host agree', async () => {
    const { modelEndpointHint } = await import('@/app/api/health/providers/route');
    const hint = modelEndpointHint('gpt-9-imaginary', 'https://api.openai.com/v1', notFound);
    expect(hint).toContain('api.openai.com');
    expect(hint).not.toContain('被发往');
  });

  it('does not accuse unknown aggregator gateways of a mismatch', async () => {
    const { modelEndpointHint } = await import('@/app/api/health/providers/route');
    const hint = modelEndpointHint('claude-sonnet-4-6', 'https://api.vectorengine.ai/v1', notFound);
    expect(hint).not.toContain('被发往');
  });
});

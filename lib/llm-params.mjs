/**
 * Chat-completions request-body compatibility.
 *
 * Both LLM call paths hardcoded `max_tokens`, which locks the whole app out of
 * OpenAI's reasoning-model families. Verified against api.openai.com:
 *
 *   gpt-4o / gpt-4o-mini / gpt-4.1  + max_tokens             → 200
 *   gpt-5.x / gpt-5.6-* / o3 / o4-* + max_tokens             → 400 "Unsupported
 *       parameter: 'max_tokens' is not supported with this model.
 *       Use 'max_completion_tokens' instead."
 *   gpt-5.5 + temperature 0.8                                → 400 "Unsupported
 *       value: 'temperature' does not support 0.8 with this model.
 *       Only the default (1) value is supported."
 *   gpt-5.5 + response_format json_object                    → 200
 *
 * Plain .mjs on purpose: `scripts/llm-call.mjs` runs as a spawned `node` child
 * process (Turbopack fetch workaround) and cannot import TypeScript, so both call
 * sites share this one file instead of duplicating the rules.
 *
 * Model names are matched by family because that is all we have — this app points
 * OPENAI_BASE_URL at arbitrary OpenAI-compatible gateways serving names like
 * `claude-sonnet-4-6` or `deepseek-v4-pro`, which do take `max_tokens`. For
 * gateways whose semantics disagree with the name, `retryBodyForParamError` flips
 * the parameter once based on the server's own complaint, so a wrong guess costs
 * one retry instead of failing the call.
 */

/** OpenAI reasoning families: require `max_completion_tokens`, only temperature=1. */
const REASONING_FAMILY = /^(?:[a-z0-9-]+\/)?(?:gpt-5|o[134](?:-|$))/i;

export function needsMaxCompletionTokens(model) {
  return REASONING_FAMILY.test(String(model || '').trim());
}

export function supportsCustomTemperature(model) {
  return !REASONING_FAMILY.test(String(model || '').trim());
}

/**
 * Build a chat-completions body honouring the model's parameter dialect.
 * Non-reasoning models get a byte-identical body to the previous hardcoded one.
 *
 * @param {object} opts
 * @param {string} opts.model
 * @param {string} [opts.system]
 * @param {string} [opts.user]
 * @param {Array<{role: string, content: string}>} [opts.messages] overrides system/user
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {boolean} [opts.jsonMode]
 * @returns {Record<string, any>}
 */
export function buildChatBody({ model, system, user, messages, maxTokens, temperature, jsonMode }) {
  const body = {
    model,
    messages: messages ?? [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  const tokens = maxTokens ?? 4096;
  if (needsMaxCompletionTokens(model)) body.max_completion_tokens = tokens;
  else body.max_tokens = tokens;

  // Sending temperature to a reasoning model is a hard 400, so drop it rather
  // than lose the call over a parameter the caller only expressed a preference with.
  if (temperature != null && supportsCustomTemperature(model)) body.temperature = temperature;
  if (jsonMode) body.response_format = { type: 'json_object' };

  return body;
}

/** Does this error text say we used the wrong token-limit parameter? */
export function isTokenParamError(msg) {
  const s = String(msg || '');
  return /max_completion_tokens|max_tokens/i.test(s)
    && /unsupported|not supported|unrecognized|unknown|invalid/i.test(s);
}

/** Does this error text say temperature is not adjustable on this model? */
export function isTemperatureParamError(msg) {
  const s = String(msg || '');
  return /temperature/i.test(s) && /unsupported|not supported|does not support|only the default/i.test(s);
}

/**
 * Given a body the server rejected on parameter grounds, return a corrected body
 * to retry once — or null when the error is not about these parameters.
 *
 * @param {Record<string, any> | null | undefined} body
 * @param {string} msg server error message
 * @returns {Record<string, any> | null}
 */
export function retryBodyForParamError(body, msg) {
  if (!body) return null;
  let next = null;

  if (isTokenParamError(msg)) {
    next = { ...body };
    if ('max_tokens' in next) {
      next.max_completion_tokens = next.max_tokens;
      delete next.max_tokens;
    } else if ('max_completion_tokens' in next) {
      next.max_tokens = next.max_completion_tokens;
      delete next.max_completion_tokens;
    } else {
      next = null;
    }
  }

  if (isTemperatureParamError(msg)) {
    next = { ...(next || body) };
    if ('temperature' in next) delete next.temperature;
    else if (!isTokenParamError(msg)) next = null;
  }

  return next;
}

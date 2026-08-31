import { describe, expect, it, beforeEach } from 'vitest';
import { ttsCacheKey } from '@/lib/tts-cache';
import {
  clearTTSProviders,
  dispatchTTSGenerate,
  registerTTSProvider,
} from '@/lib/tts-providers/registry';
import type { TTSProvider } from '@/lib/tts-providers/types';

import '@/lib/db';

const silentMp3 = 'data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function mockProvider(generate: TTSProvider['generate']): TTSProvider {
  return {
    id: 'cache-test',
    name: 'Cache Test',
    priority: 1,
    supportsEmotion: false,
    supportsCloning: false,
    supportsStreaming: false,
    maxTextLen: 5000,
    supportedLanguages: [],
    available: () => true,
    generate,
  };
}

describe('narrated-explainer · TTS cache', () => {
  beforeEach(() => clearTTSProviders());

  it('hashes provider + voice + text so one beat change misses the cache', () => {
    const a = ttsCacheKey({ text: 'Едно', provider: 'elevenlabs', voiceId: 'v', language: 'bg-BG' });
    const b = ttsCacheKey({ text: 'Едно', provider: 'elevenlabs', voiceId: 'v', language: 'bg-BG' });
    const c = ttsCacheKey({ text: 'Две', provider: 'elevenlabs', voiceId: 'v', language: 'bg-BG' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('hits the provider once for identical text', async () => {
    let calls = 0;
    registerTTSProvider(mockProvider(async ({ text }) => {
      calls += 1;
      return {
        audioUrl: silentMp3,
        duration: 1.2,
        subtitle: [{ start: 0, end: 1.2, text }],
        provider: 'cache-test',
        estCostEur: 0.01,
      };
    }));
    const input = { text: 'Защо Луната не пада върху Земята?', voiceId: 'narrator', language: 'bg-BG' };
    const first = await dispatchTTSGenerate(input, { prefer: 'cache-test', language: 'bg-BG' });
    const second = await dispatchTTSGenerate(input, { prefer: 'cache-test', language: 'bg-BG' });
    expect(first.result?.audioUrl).toBeTruthy();
    expect(second.tried.some((t) => t.error === 'cache-hit')).toBe(true);
    expect(calls).toBe(1);

    const third = await dispatchTTSGenerate({ ...input, text: 'Луната пада към Земята.' }, { prefer: 'cache-test', language: 'bg-BG' });
    expect(third.tried.some((t) => t.error === 'cache-hit')).toBe(false);
    expect(calls).toBe(2);
  });
});

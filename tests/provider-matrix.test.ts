/**
 * Locks the intended provider matrix:
 *   video → minimax-h3
 *   TTS   → elevenlabs
 *   image → openai-gpt-image
 *
 * Competing MiniMax/kontext providers stay registered but stay unavailable
 * unless their explicit ENABLE_* flags are on.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@/lib/video-providers/builtins';
import '@/lib/tts-providers/builtins';
import '@/lib/image-providers/builtins';
import { selectProviders as selectVideo, getVideoProvider } from '@/lib/video-providers/registry';
import { selectProviders as selectTTS, getTTSProvider } from '@/lib/tts-providers/registry';
import { selectProviders as selectImage, listImageProviders } from '@/lib/image-providers/registry';
import { parseEngineOrderEnv, resolveEngineOrder } from '@/lib/engine-order';
import { collectGptImageRefs } from '@/lib/image-providers/openai-gpt-image';
import { mapEmotionToVoiceSettings } from '@/lib/tts-providers/elevenlabs';

const SAVED = { ...process.env };

beforeEach(() => {
  process.env.MINIMAX_API_KEY = 'sk-h3-test';
  process.env.ELEVENLABS_API_KEY = 'sk_el_test';
  process.env.OPENAI_API_KEY = 'sk-oa-test';
  process.env.OPENAI_IMAGE_ENABLED = '1';
  delete process.env.ENABLE_MINIMAX_V1_VIDEO;
  delete process.env.ENABLE_MINIMAX_TTS;
  delete process.env.ENABLE_MINIMAX_IMAGE;
  delete process.env.ENABLE_MINIMAX_H3;
  delete process.env.QINGYUNTOP_API_KEY;
  delete process.env.VEO_API_KEY;
});
afterEach(() => {
  process.env = { ...SAVED };
});

describe('provider matrix', () => {
  it('video: H3 is selected; v1 Hailuo stays off without ENABLE_MINIMAX_V1_VIDEO', () => {
    const h3 = getVideoProvider('minimax-h3');
    expect(h3).toBeDefined();
    expect(h3!.available()).toBe(true);
    expect(h3!.supportsLastFrame).toBe(true);
    expect(h3!.supportsSubjectReference).toBe(true);
    expect(h3!.supportsNativeAudio).not.toBe(true);

    const v1 = getVideoProvider('minimax-video');
    expect(v1).toBeDefined();
    expect(v1!.available()).toBe(false);

    const chain = selectVideo({
      hasFirstFrame: true,
      hasLastFrame: false,
      hasSubjectReference: true,
    }).map((p) => p.id);
    expect(chain[0]).toBe('minimax-h3');
    expect(chain).not.toContain('minimax-video');
  });

  it('TTS: ElevenLabs is selected and accepts emotion; MiniMax TTS stays off', () => {
    const el = getTTSProvider('elevenlabs');
    expect(el).toBeDefined();
    expect(el!.available()).toBe(true);
    expect(el!.supportsEmotion).toBe(true);

    const mm = getTTSProvider('minimax-tts');
    expect(mm).toBeDefined();
    expect(mm!.available()).toBe(false);

    const chain = selectTTS({ language: 'bg', requiresEmotion: true }).map((p) => p.id);
    expect(chain).toContain('elevenlabs');
    expect(chain).not.toContain('minimax-tts');
  });

  it('image: gpt-image is selected with refs; kontext/minimax image stay off', () => {
    const byId = Object.fromEntries(listImageProviders().map((p) => [p.id, p]));
    const gpt = byId['openai-gpt-image'];
    expect(gpt).toBeDefined();
    expect(gpt!.available()).toBe(true);
    expect(gpt!.supportsRefs).toBe(true);
    expect(gpt!.maxRefImages).toBeGreaterThanOrEqual(8);

    expect(byId['kontext']!.available()).toBe(false);
    expect(byId['minimax-multi']!.available()).toBe(false);
    expect(byId['minimax-single']!.available()).toBe(false);

    const chain = selectImage({ refCount: 2 }).map((p) => p.id);
    expect(chain).toContain('openai-gpt-image');
    expect(chain).not.toContain('kontext');
    expect(chain).not.toContain('minimax-multi');
  });

  it('engine-order aliases resolve to h3 without changing the default order', () => {
    expect(parseEngineOrderEnv('minimax-h3,kling')).toEqual(['h3', 'kling']);
    expect(parseEngineOrderEnv('hailuo-3')).toEqual(['h3']);
    expect(resolveEngineOrder('hailuo3', ['h3', 'kling'])).toEqual(['h3', 'kling']);
    expect(resolveEngineOrder(undefined, ['h3', 'veo', 'minimax', 'kling'])).toEqual(['veo', 'minimax', 'kling']);
  });
});

describe('emotion + gpt-image helpers', () => {
  it('maps drama emotions onto ElevenLabs voice_settings.style', () => {
    expect(mapEmotionToVoiceSettings('愤怒').style).toBeGreaterThan(0.6);
    expect(mapEmotionToVoiceSettings('平静').style).toBeLessThan(0.3);
    expect(mapEmotionToVoiceSettings(undefined).stability).toBeGreaterThan(0);
  });

  it('collects and caps gpt-image refs', () => {
    const refs = collectGptImageRefs({
      prompt: 'x',
      referenceImages: ['https://a.png', 'https://a.png', 'data:image/png;base64,xx'],
      cref: 'https://b.png',
    });
    expect(refs).toEqual(['https://a.png', 'data:image/png;base64,xx', 'https://b.png']);
  });
});

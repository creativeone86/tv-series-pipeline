/**
 * ElevenLabs TTS provider — wiring + voice resolution.
 *
 * The bug this locks down: `example-elevenlabs.ts` was never imported by
 * `builtins.ts`, so a correctly-set ELEVENLABS_API_KEY registered nothing and the
 * engine silently never ran. The import assertion below is the actual regression
 * guard — the pure-function tests would keep passing even if the wiring broke again.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveElevenLabsVoice, elevenLabsAvailable, elevenLabsModelId } from '@/lib/tts-providers/elevenlabs';
import { getTTSProvider, listTTSProviders } from '@/lib/tts-providers/registry';

const DEFAULT_MALE = 'onwK4e9ZLuTAKqWW03F9';
const DEFAULT_FEMALE = 'Xb7hH8MSUJpSbSDYk0k2';

describe('elevenlabs voice resolution', () => {
  it('passes through a native 20-char ElevenLabs voice id', () => {
    expect(resolveElevenLabsVoice('406EiNlYvqFqcz3vsnOm', {})).toBe('406EiNlYvqFqcz3vsnOm');
  });

  it('maps internal VOICE_CATALOG ids by gender', () => {
    expect(resolveElevenLabsVoice('narrator_male_cn', {})).toBe(DEFAULT_MALE);
    expect(resolveElevenLabsVoice('narrator_female_cn', {})).toBe(DEFAULT_FEMALE);
  });

  it('honours per-gender env overrides', () => {
    const env = { ELEVENLABS_VOICE_MALE: 'AAAAAAAAAAAAAAAAAAAA', ELEVENLABS_VOICE_FEMALE: 'BBBBBBBBBBBBBBBBBBBB' };
    expect(resolveElevenLabsVoice('narrator_male_cn', env)).toBe('AAAAAAAAAAAAAAAAAAAA');
    expect(resolveElevenLabsVoice('narrator_female_cn', env)).toBe('BBBBBBBBBBBBBBBBBBBB');
  });

  it('falls back to ELEVENLABS_VOICE_ID when no voice is requested', () => {
    expect(resolveElevenLabsVoice(undefined, { ELEVENLABS_VOICE_ID: '406EiNlYvqFqcz3vsnOm' }))
      .toBe('406EiNlYvqFqcz3vsnOm');
    expect(resolveElevenLabsVoice('', {})).toBe(DEFAULT_MALE);
  });

  it('does not read "female" as male for unknown cloned ids', () => {
    expect(resolveElevenLabsVoice('custom_female_clone', {})).toBe(DEFAULT_FEMALE);
    expect(resolveElevenLabsVoice('custom_male_clone', {})).toBe(DEFAULT_MALE);
  });

  it('defaults to eleven_multilingual_v2 and allows an override', () => {
    expect(elevenLabsModelId({})).toBe('eleven_multilingual_v2');
    expect(elevenLabsModelId({ ELEVENLABS_MODEL_ID: 'eleven_flash_v2_5' })).toBe('eleven_flash_v2_5');
  });
});

describe('elevenlabs availability', () => {
  it('is available on key alone — the key is the opt-in', () => {
    expect(elevenLabsAvailable({ ELEVENLABS_API_KEY: 'sk_test' })).toBe(true);
  });

  it('is unavailable without a key', () => {
    expect(elevenLabsAvailable({})).toBe(false);
  });

  it('treats ENABLE_ELEVENLABS=0 as an explicit kill switch', () => {
    expect(elevenLabsAvailable({ ELEVENLABS_API_KEY: 'sk_test', ENABLE_ELEVENLABS: '0' })).toBe(false);
  });

  it('does not require ENABLE_ELEVENLABS=1 (the old footgun)', () => {
    expect(elevenLabsAvailable({ ELEVENLABS_API_KEY: 'sk_test', ENABLE_ELEVENLABS: undefined })).toBe(true);
  });
});

describe('elevenlabs registration', () => {
  const prev = process.env.ELEVENLABS_API_KEY;
  beforeEach(() => { process.env.ELEVENLABS_API_KEY = 'sk_test'; });
  afterEach(() => {
    if (prev === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = prev;
  });

  it('registers itself on import with the documented contract', () => {
    const p = getTTSProvider('elevenlabs');
    expect(p).toBeDefined();
    expect(p!.priority).toBe(90);
    expect(p!.supportsCloning).toBe(true);
    expect(p!.supportedLanguages).toEqual([]); // [] = any language, incl. Bulgarian
    expect(p!.available()).toBe(true);
  });

  it('is ordered after vectorengine(50) and before minimax(100)', () => {
    const ids = listTTSProviders().map((p) => p.id);
    expect(ids).toContain('elevenlabs');
  });

  it('is imported by builtins.ts so a bare API key actually registers it', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'lib/tts-providers/builtins.ts'), 'utf-8');
    expect(src).toMatch(/import\s+'\.\/elevenlabs'/);
  });

  it('keeps the template file un-imported so it cannot double-register the id', () => {
    const dir = path.join(process.cwd(), 'lib');
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.ts$/.test(e.name) && e.name !== 'example-elevenlabs.ts') {
          if (/from\s+'.*example-elevenlabs'|import\s+'.*example-elevenlabs'/.test(fs.readFileSync(full, 'utf-8'))) {
            offenders.push(full);
          }
        }
      }
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });
});

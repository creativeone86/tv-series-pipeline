/**
 * ElevenLabs TTS provider (multilingual v2) — the narration engine for
 * NARRATED_EXPLAINER (Bulgarian) and available to any other mode.
 *
 * This replaces `example-elevenlabs.ts` as the *wired* implementation. That file
 * stays as a third-party extension template (docs/tts-providers.md links it), but
 * it was never imported by `builtins.ts`, so setting ELEVENLABS_API_KEY registered
 * nothing and the engine silently never ran.
 *
 * Two other things the template got wrong for real use:
 *   - it gated registration on `ENABLE_ELEVENLABS === '1'` at module load, unlike
 *     every sibling provider which registers unconditionally and gates in
 *     `available()`. Env is now read per call, and the provider is always visible
 *     to `listTTSProviders()` for diagnostics.
 *   - it assumed `input.voiceId` was already an ElevenLabs voice id. Callers pass
 *     internal VOICE_CATALOG ids (`narrator_male_cn`, …), which ElevenLabs rejects
 *     with a 400. `resolveElevenLabsVoice` maps them.
 */

import { registerTTSProvider } from './registry';
import type { TTSGenerateInput } from './types';
import { VOICE_CATALOG } from '@/lib/character-studio';
import { probeAudioDurationBuffer } from '@/lib/audio-duration';

/** ElevenLabs voice ids are 20-char alphanumeric (e.g. `onwK4e9ZLuTAKqWW03F9`). */
const NATIVE_VOICE_RE = /^[A-Za-z0-9]{20}$/;

/** ElevenLabs premade voices — present in every account, so safe as hard defaults. */
const DEFAULT_MALE = 'onwK4e9ZLuTAKqWW03F9';   // Daniel — steady broadcaster
const DEFAULT_FEMALE = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — clear, engaging educator

/**
 * Internal voiceId → ElevenLabs voice id. Pure, so it is unit-testable.
 *
 * Order: native id passthrough → VOICE_CATALOG gender → gender keywords →
 * ELEVENLABS_VOICE_ID → premade default. Per-gender overrides let an operator
 * pick a Bulgarian-accented narrator without touching code.
 */
export function resolveElevenLabsVoice(voiceId?: string, env: NodeJS.ProcessEnv = process.env): string {
  const id = (voiceId || '').trim();
  if (NATIVE_VOICE_RE.test(id)) return id;

  const male = env.ELEVENLABS_VOICE_MALE || env.ELEVENLABS_VOICE_ID || DEFAULT_MALE;
  const female = env.ELEVENLABS_VOICE_FEMALE || env.ELEVENLABS_VOICE_ID || DEFAULT_FEMALE;

  if (id) {
    const hit = VOICE_CATALOG.find((m) => m.id === id);
    if (hit) return hit.gender === 'female' ? female : male;
    // Cloned / unknown ids: fall back to gender keywords. Test female first —
    // "female" contains "male".
    const v = id.toLowerCase();
    if (/female|woman|girl|女/.test(v)) return female;
    if (/male|man|boy|男/.test(v)) return male;
  }
  return env.ELEVENLABS_VOICE_ID || male;
}

export function elevenLabsModelId(env: NodeJS.ProcessEnv = process.env): string {
  return env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
}

/**
 * Paid provider, so the key is the opt-in (consistent with every sibling provider)
 * and `ENABLE_ELEVENLABS=0` is an explicit kill switch. Requiring an extra
 * opt-in *flag* on top of the key is what made a correctly-set key look broken.
 */
export function elevenLabsAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.ELEVENLABS_API_KEY && env.ENABLE_ELEVENLABS !== '0';
}

/**
 * Map drama-pipeline emotion labels (Chinese + English) onto ElevenLabs
 * voice_settings. The registry drops a provider when requiresEmotion is set
 * and supportsEmotion is false — so this mapping must exist if we claim
 * supportsEmotion: true.
 */
export function mapEmotionToVoiceSettings(
  emotion?: string,
  env: NodeJS.ProcessEnv = process.env,
): { stability: number; similarity_boost: number; style: number } {
  const stability = Number(env.ELEVENLABS_STABILITY ?? 0.5);
  const similarity = Number(env.ELEVENLABS_SIMILARITY ?? 0.75);
  const e = (emotion || '').toLowerCase();
  let style = 0.35;
  if (/愤怒|怒|rage|angry|怒吼/.test(e)) style = 0.75;
  else if (/悲伤|哭|sad|grief|委屈/.test(e)) style = 0.55;
  else if (/紧张|恐惧|危机|fear|tense/.test(e)) style = 0.65;
  else if (/兴奋|高潮|爆发|excited|hype/.test(e)) style = 0.7;
  else if (/温柔|平静|calm|warm|浪漫/.test(e)) style = 0.2;
  else if (/神秘|诡异|mystery/.test(e)) style = 0.45;
  return {
    stability: Math.min(1, Math.max(0, stability)),
    similarity_boost: Math.min(1, Math.max(0, similarity)),
    style: Math.min(1, Math.max(0, style)),
  };
}

registerTTSProvider({
  id: 'elevenlabs',
  name: 'ElevenLabs (multilingual v2)',
  priority: 90, // < minimax-tts(100), > vectorengine-tts(50) — pass prefer:'elevenlabs' to force it
  supportsEmotion: true,
  supportsCloning: true,
  supportsStreaming: true,
  maxTextLen: 5_000,
  supportedLanguages: [], // [] = any language (Bulgarian included)
  available: () => elevenLabsAvailable(),
  async generate(input: TTSGenerateInput) {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error('elevenlabs: ELEVENLABS_API_KEY not set');
    const base = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
    const voice = resolveElevenLabsVoice(input.voiceId);
    const model = elevenLabsModelId();

    // `speed` is only honoured by voice_settings on newer models; clamp to the
    // documented range so an out-of-range prosody value can't 422 the whole call.
    const speed = typeof input.speed === 'number' && input.speed > 0
      ? Math.min(1.2, Math.max(0.7, input.speed))
      : undefined;

    const res = await fetch(
      `${base}/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text: input.text,
          model_id: model,
          voice_settings: {
            ...mapEmotionToVoiceSettings(input.emotion),
            ...(speed ? { speed } : {}),
          },
        }),
        signal: AbortSignal.timeout(120_000),
      },
    );
    if (!res.ok) {
      throw new Error(`elevenlabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error('elevenlabs: empty audio');
    const audioUrl = `data:audio/mpeg;base64,${buf.toString('base64')}`;

    // Real duration, not a character-count estimate — see lib/audio-duration.ts.
    let duration: number;
    try {
      duration = await probeAudioDurationBuffer(buf, 'mp3');
    } catch (e) {
      // ffprobe missing shouldn't lose usable audio; fall back to a Latin/Cyrillic
      // reading rate (~15 chars/sec) rather than the Han rate used elsewhere.
      console.warn('[elevenlabs] ffprobe failed, estimating duration:', e instanceof Error ? e.message : e);
      duration = Math.max(1, (input.text || '').length / 15);
    }

    return {
      audioUrl,
      duration,
      subtitle: [{ start: 0, end: duration, text: input.text, character: input.character }],
      provider: 'elevenlabs',
    };
  },
});

if (process.env.NODE_ENV !== 'test') {
  console.log(
    `[TTSProviders] elevenlabs registered (${elevenLabsModelId()}, priority=90, available=${elevenLabsAvailable()})`,
  );
}

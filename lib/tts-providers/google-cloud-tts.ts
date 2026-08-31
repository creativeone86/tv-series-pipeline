/**
 * Google Cloud Text-to-Speech — optional Bulgarian narration provider.
 * Registers like ElevenLabs: always visible, available() gated on API key.
 */

import { registerTTSProvider } from './registry';
import type { TTSGenerateInput } from './types';
import { probeAudioDurationBuffer } from '@/lib/audio-duration';

export function googleTtsAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.GOOGLE_CLOUD_TTS_API_KEY || env.GOOGLE_TTS_API_KEY) && env.ENABLE_GOOGLE_TTS !== '0';
}

export function googleTtsApiKey(env: NodeJS.ProcessEnv = process.env): string {
  return env.GOOGLE_CLOUD_TTS_API_KEY || env.GOOGLE_TTS_API_KEY || '';
}

export function googleTtsVoiceName(language?: string, env: NodeJS.ProcessEnv = process.env): string {
  if (env.GOOGLE_TTS_VOICE) return env.GOOGLE_TTS_VOICE;
  const lang = (language || 'bg-BG').toLowerCase();
  if (lang.startsWith('bg')) return 'bg-BG-Standard-A';
  if (lang.startsWith('en')) return 'en-US-Neural2-C';
  if (lang.startsWith('ru')) return 'ru-RU-Standard-A';
  if (lang.startsWith('de')) return 'de-DE-Standard-A';
  return 'bg-BG-Standard-A';
}

export function buildGoogleTtsBody(input: TTSGenerateInput, env: NodeJS.ProcessEnv = process.env) {
  const languageCode = input.language || 'bg-BG';
  const speakingRate = typeof input.speed === 'number' && input.speed > 0
    ? Math.min(1.5, Math.max(0.6, input.speed))
    : 1;
  return {
    input: { text: input.text },
    voice: { languageCode, name: googleTtsVoiceName(languageCode, env) },
    audioConfig: { audioEncoding: 'MP3', speakingRate },
  };
}

registerTTSProvider({
  id: 'google-cloud-tts',
  name: 'Google Cloud Text-to-Speech',
  priority: 95,
  supportsEmotion: false,
  supportsCloning: false,
  supportsStreaming: false,
  maxTextLen: 5_000,
  supportedLanguages: [],
  available: () => googleTtsAvailable(),
  async generate(input: TTSGenerateInput) {
    const key = googleTtsApiKey();
    if (!key) throw new Error('google-cloud-tts: GOOGLE_CLOUD_TTS_API_KEY not set');
    const endpoint = process.env.GOOGLE_TTS_ENDPOINT
      || 'https://texttospeech.googleapis.com/v1/text:synthesize';
    const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGoogleTtsBody(input)),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`google-cloud-tts ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json() as { audioContent?: string };
    if (!json.audioContent) throw new Error('google-cloud-tts: empty audioContent');
    const buf = Buffer.from(json.audioContent, 'base64');
    const audioUrl = `data:audio/mpeg;base64,${json.audioContent}`;
    let duration = 0;
    try { duration = await probeAudioDurationBuffer(buf, 'mp3'); }
    catch { duration = Math.max(1, (input.text || '').length / 15); }
    return {
      audioUrl,
      duration,
      subtitle: [{ start: 0, end: duration, text: input.text, character: input.character }],
      provider: 'google-cloud-tts',
    };
  },
});

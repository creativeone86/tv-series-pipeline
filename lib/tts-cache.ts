/**
 * Paid TTS cache. Keyed on text + provider + model + voice + language + settings.
 * Hooked inside dispatchTTSGenerate so every existing call site benefits.
 */

import crypto from 'crypto';
import { getDbDriver } from '@/lib/db-driver';
import { persistAsset } from '@/lib/asset-storage';
import type { TTSGenerateInput, TTSGenerateResult } from '@/lib/tts-providers/types';

export interface TtsCacheRow {
  cacheKey: string;
  provider: string;
  model: string;
  voiceId: string;
  language: string;
  normalizedText: string;
  audioUrl: string;
  audioKey: string | null;
  durationSec: number;
  estCostEur: number;
}

export function normalizeTtsText(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function ttsCacheKey(input: {
  text: string;
  provider: string;
  model?: string;
  voiceId?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
}): string {
  const payload = [
    normalizeTtsText(input.text),
    input.provider || '',
    input.model || '',
    input.voiceId || '',
    input.language || '',
    input.speed ?? '',
    input.pitch ?? '',
    (input.emotion || '').toLowerCase(),
  ].join('\0');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function lookupTtsCache(cacheKey: string): Promise<TTSGenerateResult | null> {
  if (!cacheKey) return null;
  try {
    const row = await getDbDriver().get<{
      provider: string; audio_url: string; duration_sec: number; est_cost_eur: number; normalized_text: string; alignment?: string | null;
    }>('SELECT provider, audio_url, duration_sec, est_cost_eur, normalized_text, alignment FROM tts_cache WHERE cache_key = ?', [cacheKey]);
    if (!row?.audio_url) return null;
    let alignment: TTSGenerateResult['alignment'];
    try { alignment = row.alignment ? JSON.parse(row.alignment) : undefined; } catch { alignment = undefined; }
    return {
      audioUrl: row.audio_url,
      duration: Number(row.duration_sec) || 0,
      subtitle: [{ start: 0, end: Number(row.duration_sec) || 0, text: row.normalized_text }],
      provider: row.provider,
      estCostEur: Number(row.est_cost_eur) || 0,
      alignment,
    };
  } catch {
    return null;
  }
}

export async function persistAndStoreTts(opts: {
  cacheKey: string;
  input: TTSGenerateInput;
  result: TTSGenerateResult;
  model?: string;
}): Promise<TTSGenerateResult> {
  let audioUrl = opts.result.audioUrl;
  let audioKey: string | null = null;
  try {
    const persisted = await persistAsset(opts.result.audioUrl, { contentType: 'audio/mpeg', ext: '.mp3' });
    if (persisted?.url) {
      audioUrl = persisted.url;
      audioKey = persisted.key;
    }
  } catch { /* keep original url */ }

  const stored: TTSGenerateResult = { ...opts.result, audioUrl };
  try {
    const ts = new Date().toISOString();
    await getDbDriver().run(
      `INSERT INTO tts_cache
        (cache_key, provider, model, voice_id, language, normalized_text, audio_url, audio_key, duration_sec, est_cost_eur, settings, alignment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         audio_url = excluded.audio_url, audio_key = excluded.audio_key,
         duration_sec = excluded.duration_sec, est_cost_eur = excluded.est_cost_eur,
         alignment = excluded.alignment`,
      [
        opts.cacheKey,
        opts.result.provider,
        opts.model || '',
        opts.input.voiceId || '',
        opts.input.language || '',
        normalizeTtsText(opts.input.text),
        audioUrl,
        audioKey,
        opts.result.duration || 0,
        opts.result.estCostEur || 0,
        JSON.stringify({ speed: opts.input.speed, pitch: opts.input.pitch, emotion: opts.input.emotion }),
        opts.result.alignment ? JSON.stringify(opts.result.alignment) : null,
        ts,
      ],
    );
  } catch {
    // Fallback insert-ignore. `INSERT OR IGNORE` is SQLite-only syntax (it is a syntax
    // error on Postgres), so pick the dialect-correct form; Postgres uses ON CONFLICT.
    try {
      const driver = getDbDriver();
      const cols = '(cache_key, provider, model, voice_id, language, normalized_text, audio_url, audio_key, duration_sec, est_cost_eur, settings, alignment, created_at)';
      const sql = driver.dialect === 'postgres'
        ? `INSERT INTO tts_cache ${cols} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (cache_key) DO NOTHING`
        : `INSERT OR IGNORE INTO tts_cache ${cols} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await driver.run(sql, [
        opts.cacheKey, opts.result.provider, opts.model || '', opts.input.voiceId || '',
        opts.input.language || '', normalizeTtsText(opts.input.text), audioUrl, audioKey,
        opts.result.duration || 0, opts.result.estCostEur || 0, '{}',
        opts.result.alignment ? JSON.stringify(opts.result.alignment) : null, new Date().toISOString(),
      ]);
    } catch { /* cache write must never break TTS */ }
  }
  return stored;
}

/**
 * Audio duration probing via ffprobe.
 *
 * TTS providers in this repo estimate duration from character counts
 * (`services/tts.service.ts` estimateDuration: ~4 Han chars/sec, vectorengine:
 * ~4.5 chars/sec). Those heuristics are Chinese-specific and are wrong by a wide
 * margin for Cyrillic/Latin narration. Since the timeline, subtitle starts and
 * voiceover `adelay` are all derived from these numbers, a bad estimate desyncs
 * the whole render — so anything that needs a real number probes the file.
 *
 * ffprobe path is resolved through video-composer's multi-strategy resolver
 * (`ffprobe-static` is not on PATH in CI), imported lazily to keep this module light.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

let probePathReady = false;

async function ensureProbePath(): Promise<void> {
  if (probePathReady) return;
  const { resolveFFprobePath } = await import('@/services/video-composer');
  ffmpeg.setFfprobePath(resolveFFprobePath());
  probePathReady = true;
}

/** Duration in seconds of an audio file on disk. Rejects when the file has no readable duration. */
export async function probeAudioDurationFile(filePath: string): Promise<number> {
  await ensureProbePath();
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const d = Number(data?.format?.duration ?? 0);
      if (!Number.isFinite(d) || d <= 0) return reject(new Error('ffprobe: no usable audio duration'));
      resolve(d);
    });
  });
}

/**
 * Duration in seconds of an in-memory audio buffer. Writes to a temp file because
 * ffprobe needs a seekable input to read container metadata reliably.
 */
export async function probeAudioDurationBuffer(buf: Buffer, ext = 'mp3'): Promise<number> {
  if (!buf?.length) throw new Error('probeAudioDurationBuffer: empty buffer');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qf-adur-'));
  const file = path.join(dir, `probe.${ext.replace(/^\./, '')}`);
  try {
    fs.writeFileSync(file, buf);
    return await probeAudioDurationFile(file);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* temp cleanup is best-effort */ }
  }
}

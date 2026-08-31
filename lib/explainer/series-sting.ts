import { persistAsset } from '@/lib/asset-storage';
import { listAssetsByType, upsertAsset } from '@/lib/repos/asset-repo';
import { contentHash } from './narration-track';
import type { StyleKit } from './types';

export function stingPrompt(kit: StyleKit): string {
  return [
    kit.promptPrefix,
    kit.figureRule,
    '2 second signature opening sting, the series guide silhouette steps into frame, no text, no letters',
    `avoid: ${kit.negativePrompt}`,
  ].join('. ');
}

export async function findCachedSting(projectId: string, seriesId: string | undefined, prompt: string) {
  const rows = await listAssetsByType(projectId, 'series-sting');
  const hash = contentHash([seriesId || 'solo', prompt]);
  return rows.find((a) => {
    let d: any = a.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = {}; }
    return d?.contentHash === hash && a.persistent_url;
  });
}

/** Producer-driven only. Never auto-spend MiniMax on every episode. */
export async function ensureSeriesSting(opts: {
  projectId: string;
  userId: string;
  seriesId?: string;
  kit: StyleKit;
  regenerate?: boolean;
}): Promise<string | undefined> {
  const prompt = stingPrompt(opts.kit);
  if (!opts.regenerate) {
    const cached = await findCachedSting(opts.projectId, opts.seriesId, prompt);
    if (cached?.persistent_url) return cached.persistent_url;
  }
  if (process.env.ENABLE_MINIMAX_V1_VIDEO !== '1' || !process.env.MINIMAX_API_KEY) {
    return undefined;
  }
  try {
    const { MinimaxService } = await import('@/services/minimax.service');
    const svc = new MinimaxService();
    const url = opts.kit.characterSheetUrl
      ? await svc.generateVideoS2V(prompt, opts.kit.characterSheetUrl, { duration: 3 })
      : await svc.generateVideo(opts.kit.styleAnchorUrl || '', prompt, { duration: 3, aspectRatio: '16:9' });
    if (!url) return undefined;
    await upsertAsset({
      projectId: opts.projectId,
      type: 'series-sting',
      name: 'series sting',
      data: { seriesId: opts.seriesId, contentHash: contentHash([opts.seriesId || 'solo', prompt]) },
      mediaUrls: [url],
      persistentUrl: url,
    });
    return url;
  } catch (e) {
    console.warn('[explainer] series sting skipped', e instanceof Error ? e.message : e);
    return undefined;
  }
}

/**
 * Normalise the sting to the episode's resolution / fps / codec so the concat
 * demuxer can join it with the section mp4s. Reuses the intro-outro fps + pad
 * convention. Returns a local mp4 path, or the input untouched on failure.
 */
export async function normalizeStingClip(stingUrl: string, tmp: string, w: number, h: number): Promise<string> {
  const { spawn } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');
  fs.mkdirSync(tmp, { recursive: true });
  let input = stingUrl;
  if (/^https?:\/\//.test(stingUrl)) {
    const { downloadFile } = await import('@/services/video-composer') as any;
    const local = path.join(tmp, `sting-src-${Date.now()}.mp4`);
    try { await downloadFile(stingUrl, local); input = local; } catch { return stingUrl; }
  }
  let ff = 'ffmpeg';
  try { ff = (await import('@/services/video-composer')).resolveFFmpegPath(); } catch { /* default */ }
  const out = path.join(tmp, `sting-${Date.now()}.mp4`);
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p`;
  try {
    await new Promise<void>((resolve, reject) => {
      const p = spawn(ff, [
        '-y', '-i', input,
        '-f', 'lavfi', '-t', '3', '-i', 'anullsrc=r=44100:cl=stereo',
        '-vf', vf, '-map', '0:v', '-map', '1:a', '-shortest',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        '-c:a', 'aac', '-movflags', '+faststart', out,
      ], { stdio: 'ignore' });
      p.on('error', reject);
      p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg ${c}`))));
    });
    return out;
  } catch {
    return input;
  }
}

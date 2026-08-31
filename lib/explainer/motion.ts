import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { parallaxFilter } from './parallax';
import { renderTextPng } from './typography';
import type { ShotType, StyleKit } from './types';

export function usesKenBurns(shot?: ShotType): boolean {
  return shot === 'SCENE' || shot === 'ANNOTATED_SCENE' || !shot;
}

export function wordCardImpact(shot?: ShotType): boolean {
  return shot === 'WORD_CARD';
}

export function usesParallax(shot: ShotType | undefined, kit: StyleKit | undefined): boolean {
  if (!kit || (kit.depthPlanes ?? 0) < 2) return false;
  return shot === 'SCENE' || shot === 'ANNOTATED_SCENE';
}

async function toBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    return Buffer.from(imageUrl.split(',')[1] || '', 'base64');
  }
  if (imageUrl.startsWith('/api/serve-file')) {
    const { resolveVerifiedServeFilePath } = await import('@/lib/serve-file-sign');
    const abs = resolveVerifiedServeFilePath(imageUrl);
    if (abs && fs.existsSync(abs)) return fs.readFileSync(abs);
    const { resolveByKey } = await import('@/lib/asset-storage');
    const u = new URL(imageUrl, 'http://localhost');
    const key = u.searchParams.get('key');
    const hit = key ? resolveByKey(key) : null;
    if (hit?.absPath) return fs.readFileSync(hit.absPath);
  }
  if (/^https?:\/\//.test(imageUrl)) {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(imageUrl);
}

/**
 * Split a single frame into depth planes so a paper-cut SCENE can parallax.
 * background = full frame; foreground(s) = centre-weighted radial cut-outs, so the
 * background shows through the transparent edges and drifts at a different rate.
 */
export async function buildParallaxPlanes(png: Buffer, planes: number, w: number, h: number): Promise<Buffer[]> {
  const n = Math.max(2, Math.min(4, planes));
  const base = await sharp(png).resize(w, h, { fit: 'cover' }).png().toBuffer();
  const out: Buffer[] = [await sharp(base).modulate({ brightness: 0.94 }).png().toBuffer()];
  for (let i = 1; i < n; i++) {
    const r = 62 - i * 12;
    const mask = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="50%" cy="52%" r="${r}%"><stop offset="55%" stop-color="white" stop-opacity="1"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    );
    // The rendered SVG already carries the radial falloff in its alpha; use it as a
    // dest-in mask so the plane keeps the centre and fades transparent at the edges.
    const maskPng = await sharp(mask).resize(w, h).png().toBuffer();
    const plane = await sharp(base)
      .ensureAlpha()
      .composite([{ input: maskPng, blend: 'dest-in' }])
      .png()
      .toBuffer();
    out.push(plane);
  }
  return out;
}

async function ffmpegBin(): Promise<string> {
  try {
    const mod = await import('@/services/video-composer');
    return mod.resolveFFmpegPath();
  } catch {
    return process.env.FFMPEG_PATH || 'ffmpeg';
  }
}

async function runFfmpeg(args: string[]): Promise<void> {
  const bin = await ffmpegBin();
  await new Promise<void>((resolve, reject) => {
    const p = spawn(bin, args, { stdio: 'ignore' });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
  });
}

/** Multi-plane parallax mp4 from one frame. Falls back to caller's Ken Burns on error. */
export async function stillFrameToParallaxVideo(opts: {
  imageUrl: string;
  duration: number;
  tmp: string;
  planes: number;
  w: number;
  h: number;
  fps?: number;
}): Promise<string> {
  const fps = opts.fps || 24;
  const frames = Math.max(48, Math.round(opts.duration * fps));
  const png = await toBuffer(opts.imageUrl);
  const planeBufs = await buildParallaxPlanes(png, opts.planes, opts.w, opts.h);
  const planeFiles: string[] = [];
  fs.mkdirSync(opts.tmp, { recursive: true });
  for (let i = 0; i < planeBufs.length; i++) {
    const f = path.join(opts.tmp, `plane-${Date.now()}-${i}.png`);
    fs.writeFileSync(f, planeBufs[i]!);
    planeFiles.push(f);
  }
  const out = path.join(opts.tmp, `parallax-${Date.now()}.mp4`);
  const filter = parallaxFilter(planeFiles.length, opts.w, opts.h, frames, fps);
  const args = ['-y'];
  for (const f of planeFiles) args.push('-loop', '1', '-t', String(opts.duration), '-i', f);
  args.push('-f', 'lavfi', '-t', String(opts.duration), '-i', 'anullsrc=r=44100:cl=stereo');
  args.push(
    '-filter_complex', filter,
    '-map', '[vout]',
    '-map', `${planeFiles.length}:a`,
    '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-crf', '20',
    '-c:a', 'aac', '-shortest', '-movflags', '+faststart',
    out,
  );
  await runFfmpeg(args);
  for (const f of planeFiles) { try { fs.unlinkSync(f); } catch { /* ignore */ } }
  return out;
}

/** Type-on word card: reveal words progressively, then hold; genuine motion, zero cost. */
export async function wordCardSequenceVideo(opts: {
  text: string;
  kit: StyleKit;
  duration: number;
  tmp: string;
  w: number;
  h: number;
  fps?: number;
}): Promise<string> {
  const fps = opts.fps || 24;
  const words = opts.text.trim().split(/\s+/).filter(Boolean);
  const steps = Math.min(5, Math.max(2, words.length));
  fs.mkdirSync(opts.tmp, { recursive: true });
  const stepDir = path.join(opts.tmp, `wc-${Date.now()}`);
  fs.mkdirSync(stepDir, { recursive: true });
  const paperPng = await sharp({
    create: { width: opts.w, height: opts.h, channels: 4, background: hexToRgba(opts.kit.paper) },
  }).png().toBuffer();
  const holdFrames: number[] = [];
  let idx = 0;
  for (let s = 1; s <= steps; s++) {
    const count = s === steps ? words.length : Math.max(1, Math.round((words.length * s) / steps));
    const text = words.slice(0, count).join(' ');
    const overlay = await renderTextPng({ text, kit: opts.kit, role: 'wordCard', width: opts.w, height: opts.h });
    const composed = await sharp(paperPng)
      .composite([{ input: overlay, left: 0, top: 0 }])
      .png()
      .toBuffer();
    const f = path.join(stepDir, `s-${String(idx).padStart(3, '0')}.png`);
    fs.writeFileSync(f, composed);
    holdFrames.push(idx);
    idx += 1;
  }
  // Concat each step as an equal slice; last step holds any remainder.
  const per = opts.duration / steps;
  const listFile = path.join(stepDir, 'list.txt');
  const lines = holdFrames.map((i) => `file '${path.join(stepDir, `s-${String(i).padStart(3, '0')}.png`)}'\nduration ${per.toFixed(3)}`);
  lines.push(`file '${path.join(stepDir, `s-${String(holdFrames[holdFrames.length - 1]!).padStart(3, '0')}.png`)}'`);
  fs.writeFileSync(listFile, lines.join('\n'));
  const out = path.join(opts.tmp, `wordcard-${Date.now()}.mp4`);
  await runFfmpeg([
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-f', 'lavfi', '-t', String(opts.duration), '-i', 'anullsrc=r=44100:cl=stereo',
    '-vf', `fps=${fps},scale=${opts.w}:${opts.h}:force_original_aspect_ratio=increase,crop=${opts.w}:${opts.h},format=yuv420p`,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
    '-c:a', 'aac', '-shortest', '-movflags', '+faststart',
    out,
  ]);
  try { fs.rmSync(stepDir, { recursive: true, force: true }); } catch { /* ignore */ }
  return out;
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
    alpha: 1,
  };
}

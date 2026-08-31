import sharp, { type OverlayOptions, type Sharp } from 'sharp';
import type { ComposeSpec } from './types';

export async function composeLayers(spec: ComposeSpec): Promise<Buffer> {
  const w = spec.width || 1920;
  const h = spec.height || 1080;
  let base: Sharp;
  if (spec.background.url) {
    base = sharp(await loadMaybeUrl(spec.background.url)).resize(w, h, { fit: 'cover' });
  } else {
    const color = spec.background.color || '#0B1220';
    base = sharp({
      create: { width: w, height: h, channels: 4, background: hexToRgba(color) },
    });
  }

  const composites: OverlayOptions[] = [];
  for (const layer of spec.layers) {
    let buf = layer.buffer;
    if (!buf && layer.url) buf = await loadMaybeUrl(layer.url);
    if (!buf) continue;
    let overlay = sharp(buf);
    if (layer.width || layer.height) {
      overlay = overlay.resize(layer.width || null, layer.height || null, { fit: 'inside' });
    }
    const png = await overlay.png().toBuffer();
    composites.push({ input: png, left: Math.round(layer.left), top: Math.round(layer.top) });
  }
  if (composites.length === 0) return base.png().toBuffer();
  return base.composite(composites).png().toBuffer();
}

async function loadMaybeUrl(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    const i = url.indexOf(',');
    return Buffer.from(url.slice(i + 1), /base64/i.test(url.slice(0, i)) ? 'base64' : 'utf8');
  }
  if (url.startsWith('/api/serve-file')) {
    const { resolveVerifiedServeFilePath } = await import('@/lib/serve-file-sign');
    const abs = resolveVerifiedServeFilePath(url);
    if (abs) {
      const fs = await import('fs');
      return fs.readFileSync(abs);
    }
    const { resolveByKey } = await import('@/lib/asset-storage');
    const u = new URL(url, 'http://localhost');
    const key = u.searchParams.get('key');
    if (key) {
      const hit = resolveByKey(key);
      if (hit?.absPath) {
        const fs = await import('fs');
        return fs.readFileSync(hit.absPath);
      }
    }
  }
  if (/^https?:\/\//.test(url)) {
    const { safeFetch } = await import('@/lib/ssrf-guard');
    const res = await safeFetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`compose fetch ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const fs = await import('fs');
  return fs.readFileSync(url);
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 };
}

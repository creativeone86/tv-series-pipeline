import sharp, { type OverlayOptions } from 'sharp';
import type { StyleKit } from './types';

export interface PlateResult {
  buffer: Buffer;
  profile: StyleKit['plateProfile'];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

function hexToRgba(hex: string, alpha = 1): { r: number; g: number; b: number; alpha: number } {
  const { r, g, b } = hexToRgb(hex);
  return { r, g, b, alpha };
}

async function grainTile(size: number, opacity: number): Promise<Buffer> {
  const n = size * size * 4;
  const buf = Buffer.alloc(n);
  for (let i = 0; i < size * size; i++) {
    const v = 110 + Math.floor(Math.random() * 70);
    buf[i * 4] = v;
    buf[i * 4 + 1] = v;
    buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = Math.round(255 * opacity);
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
}

async function paperLayer(w: number, h: number, color: string): Promise<Buffer> {
  return sharp({
    create: { width: w, height: h, channels: 4, background: hexToRgba(color) },
  }).png().toBuffer();
}

async function vignette(w: number, h: number): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="72%">
      <stop offset="70%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.22"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Five-colour / material normalisation plate. Applied to every frame. */
export async function applyStylePlate(input: Buffer, kit: StyleKit): Promise<PlateResult> {
  const meta = await sharp(input).metadata();
  const w = meta.width || 1920;
  const h = meta.height || 1080;
  let img = sharp(input).resize(w, h, { fit: 'cover' });

  if (kit.plateProfile === 'flat-print') {
    const paper = hexToRgb(kit.paper);
    const ink = hexToRgb(kit.ink);
    img = img.modulate({ saturation: 0.55 }).linear(1.08, -8);
    const paperBuf = await paperLayer(w, h, kit.paper);
    const grain = await grainTile(Math.max(8, kit.grainPitchPx * 16), kit.grainOpacity);
    const grainFull = await sharp(grain).resize(w, h, { kernel: 'nearest' }).png().toBuffer();
    const base = await img.png().toBuffer();
    let composed = await sharp(paperBuf)
      .composite([
        { input: base, blend: 'multiply' },
        { input: grainFull, blend: 'overlay' },
      ])
      .png()
      .toBuffer();

    if (kit.registrationOffsetPx > 0) {
      const offset = kit.registrationOffsetPx;
      const { data, info } = await sharp(composed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const shifted = Buffer.from(data);
      const accent = hexToRgb(kit.accent);
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * 4;
          const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
          const dist = Math.abs(r - accent.r) + Math.abs(g - accent.g) + Math.abs(b - accent.b);
          if (dist < 90) {
            const nx = Math.min(info.width - 1, x + offset);
            const ni = (y * info.width + nx) * 4;
            shifted[ni] = Math.min(255, shifted[ni]! + 18);
          }
        }
      }
      composed = await sharp(shifted, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    }

    const vig = await vignette(w, h);
    const out = await sharp(composed).composite([{ input: vig, blend: 'multiply' }]).png().toBuffer();
    void paper; void ink;
    return { buffer: out, profile: 'flat-print' };
  }

  const paperBuf = await paperLayer(w, h, kit.paper);
  const grain = await grainTile(Math.max(8, kit.grainPitchPx * 12), kit.grainOpacity);
  const grainFull = await sharp(grain).resize(w, h, { kernel: 'nearest' }).png().toBuffer();
  const base = await img.modulate({ saturation: 0.92, brightness: 1.02 }).png().toBuffer();
  const vig = await vignette(w, h);
  const out = await sharp(paperBuf)
    .composite([
      { input: base, blend: 'over' },
      { input: grainFull, blend: 'soft-light' },
      { input: vig, blend: 'multiply' },
    ])
    .png()
    .toBuffer();
  return { buffer: out, profile: 'material' };
}

export async function materialise(shapePng: Buffer, kit: StyleKit, substrate?: Buffer): Promise<Buffer> {
  const meta = await sharp(shapePng).metadata();
  const w = meta.width || 1920;
  const h = meta.height || 1080;
  const alpha = await sharp(shapePng).ensureAlpha().extractChannel(3).png().toBuffer();
  const fillSrc = substrate
    || await sharp({ create: { width: w, height: h, channels: 4, background: hexToRgba(kit.muted || kit.paper) } }).png().toBuffer();
  const tiled = await sharp(fillSrc).resize(w, h, { fit: 'cover' }).png().toBuffer();
  const filled = await sharp(tiled)
    .composite([{ input: await sharp(shapePng).ensureAlpha().png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const ox = Math.max(0, kit.shadowOffsetPx ?? 6);
  const blur = kit.shadowBlurPx ?? 10;
  const sop = kit.shadowOpacity ?? 0.3;
  const shadowLayer = await sharp(alpha)
    .blur(Math.max(0.3, blur))
    .linear(sop, 0)
    .png()
    .toBuffer();
  const shadowFit = ox > 0
    ? await sharp(shadowLayer).resize(Math.max(1, w - ox), Math.max(1, h - ox), { fit: 'fill' }).png().toBuffer()
    : shadowLayer;
  const filledFit = await sharp(filled).resize(w, h, { fit: 'fill' }).png().toBuffer();
  const canvas = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadowFit, left: ox, top: ox, blend: 'over' },
      { input: filledFit, left: 0, top: 0, blend: 'over' },
    ])
    .png()
    .toBuffer();
  return canvas;
}

export async function renderProofSheet(tiles: Buffer[], cols = 3, cellW = 640, cellH = 360): Promise<Buffer> {
  const rows = Math.ceil(tiles.length / cols);
  const composites: OverlayOptions[] = [];
  for (let i = 0; i < tiles.length; i++) {
    const resized = await sharp(tiles[i]!).resize(cellW, cellH, { fit: 'cover' }).png().toBuffer();
    composites.push({
      input: resized,
      left: (i % cols) * cellW,
      top: Math.floor(i / cols) * cellH,
    });
  }
  return sharp({
    create: {
      width: cols * cellW,
      height: rows * cellH,
      channels: 4,
      background: { r: 239, g: 230, b: 214, alpha: 1 },
    },
  }).composite(composites).png().toBuffer();
}

/** One-time tiling fibre/knit/felt swatch — cached on the kit, never paid per frame. */
export async function generateSubstrateSwatch(kit: StyleKit, size = 256): Promise<Buffer> {
  const paper = hexToRgb(kit.paper);
  const muted = hexToRgb(kit.muted || kit.paper);
  const ink = hexToRgb(kit.ink);
  const raw = Buffer.alloc(size * size * 4);
  const material = kit.material || 'papercut';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let t = 0.5;
      if (material === 'knit') {
        const stitch = ((x + y * 2) % 8) < 3 ? 0.18 : 0;
        t = 0.42 + Math.sin(x * 0.4) * 0.08 + stitch;
      } else if (material === 'felt') {
        t = 0.48 + ((x * 17 + y * 31) % 13) / 40;
      } else {
        t = 0.5 + Math.sin(x * 0.21 + y * 0.13) * 0.06 + ((x * 13 + y * 7) % 9) / 90;
      }
      raw[i] = Math.round(paper.r * (1 - t) + muted.r * t);
      raw[i + 1] = Math.round(paper.g * (1 - t) + muted.g * t);
      raw[i + 2] = Math.round(paper.b * (1 - t) + muted.b * t);
      raw[i + 3] = 255;
      if (((x + y) % 17) === 0) {
        raw[i] = Math.round((raw[i]! + ink.r) / 2);
        raw[i + 1] = Math.round((raw[i + 1]! + ink.g) / 2);
        raw[i + 2] = Math.round((raw[i + 2]! + ink.b) / 2);
      }
    }
  }
  return sharp(raw, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
}

export function dominantAccentRegion(buffer: Buffer, accentHex: string): Promise<{ ratio: number; clusters: number }> {
  const accent = hexToRgb(accentHex);
  return sharp(buffer).resize(160, 90, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
    let hits = 0;
    const marked = new Uint8Array(info.width * info.height);
    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * (info.channels || 3)]!;
      const g = data[i * (info.channels || 3) + 1]!;
      const b = data[i * (info.channels || 3) + 2]!;
      const dist = Math.abs(r - accent.r) + Math.abs(g - accent.g) + Math.abs(b - accent.b);
      if (dist < 80) {
        hits += 1;
        marked[i] = 1;
      }
    }
    let clusters = 0;
    const seen = new Uint8Array(marked.length);
    const stack: number[] = [];
    for (let i = 0; i < marked.length; i++) {
      if (!marked[i] || seen[i]) continue;
      clusters += 1;
      stack.push(i);
      while (stack.length) {
        const p = stack.pop()!;
        if (seen[p]) continue;
        seen[p] = 1;
        const x = p % info.width;
        const y = Math.floor(p / info.width);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue;
          const ni = ny * info.width + nx;
          if (marked[ni] && !seen[ni]) stack.push(ni);
        }
      }
    }
    return { ratio: hits / marked.length, clusters };
  });
}

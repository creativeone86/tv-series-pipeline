import fs from 'fs';
import path from 'path';
import { composeLayers } from './compositor';
import { findSubtitleFont } from '@/lib/text-control';
import type { StyleKit } from './types';

export type TypeRole = 'wordCard' | 'inSceneWord' | 'arrowLabel' | 'timelineLabels' | 'locatorChip' | 'statCallout';

export function explainerFontCandidates(): string[] {
  const root = path.join(process.cwd(), 'data', 'fonts');
  return [
    process.env.SUBTITLE_FONT_FILE || '',
    path.join(root, 'SofiaSansExtraCondensed-Black.ttf'),
    path.join(root, 'SofiaSans-ExtraCondensedBlack.ttf'),
    path.join(root, 'SofiaSans-Black.ttf'),
    path.join(root, 'SofiaSans-Bold.ttf'),
    ...cyrillicFallbacks(),
  ].filter(Boolean);
}

function cyrillicFallbacks(): string[] {
  return [
    path.join(process.cwd(), 'data', 'fonts', 'NotoSans-Regular.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
  ];
}

export function findExplainerFont(prefer?: 'display' | 'label'): string | null {
  const hits = explainerFontCandidates().filter((p) => p && fs.existsSync(p));
  if (prefer === 'label') {
    const semi = hits.find((p) => /SemiCondensed|SemiBold|SofiaSans-Semi/i.test(p));
    if (semi) return semi;
  }
  if (hits[0]) return hits[0];
  return findSubtitleFont();
}

export function fontPreflight(): { ok: boolean; font: string | null; warning?: string } {
  const font = findExplainerFont('display');
  if (!font) return { ok: false, font: null, warning: 'No Cyrillic font found. Add Sofia Sans to data/fonts.' };
  const isSofia = /Sofia/i.test(font);
  return {
    ok: true,
    font,
    warning: isSofia ? undefined : 'Using a fallback font — Bulgarian locl forms may render as Russian letterforms.',
  };
}

const _fontDataUrlCache = new Map<string, string>();

function fontDataUrl(fontPath: string): string | null {
  const hit = _fontDataUrlCache.get(fontPath);
  if (hit !== undefined) return hit;
  try {
    const b64 = fs.readFileSync(fontPath).toString('base64');
    const url = `data:font/ttf;base64,${b64}`;
    _fontDataUrlCache.set(fontPath, url);
    return url;
  } catch {
    _fontDataUrlCache.set(fontPath, '');
    return null;
  }
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Render centred Cyrillic text to a transparent PNG via SVG + sharp.
 *
 * We deliberately do NOT use ffmpeg's `drawtext`: many ffmpeg builds (e.g. Homebrew 8.x
 * without libfreetype) ship no drawtext filter, which silently broke local typography.
 * Embedding the exact Sofia Sans ttf as an @font-face data URL guarantees correct
 * Bulgarian letterforms regardless of system fonts, and sharp's rasteriser is always
 * present because the pipeline already depends on it.
 */
export async function renderTextPng(opts: {
  text: string;
  width?: number;
  height?: number;
  role?: TypeRole;
  kit?: StyleKit;
  accentWord?: string;
}): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const w = opts.width || 1920;
  const h = opts.height || 1080;
  const font = findExplainerFont(opts.role === 'wordCard' ? 'display' : 'label');
  if (!font) throw new Error('explainer typography: no font file');
  const dataUrl = fontDataUrl(font);
  if (!dataUrl) throw new Error('explainer typography: font unreadable');
  const baseSize = opts.role === 'wordCard' ? Math.round(h * 0.11) : opts.role === 'locatorChip' ? 36 : 54;
  const fill = opts.kit?.ink || '#17171B';
  const raw = opts.kit?.displayCase === 'upper' ? opts.text.toUpperCase() : opts.text;
  const text = xmlEscape(raw);
  const tracking = opts.role === 'wordCard' ? (opts.kit?.displayTracking ?? 0) : 0;
  // Shrink-to-fit: keep a single line inside 86% of the width. The advance estimate is
  // deliberately generous (0.62em) because the condensed display face is wider uppercase.
  const maxW = w * 0.86;
  const estAdvance = 0.62 * baseSize + tracking;
  const fontsize = raw.length * estAdvance > maxW
    ? Math.max(18, Math.floor(baseSize * (maxW / (raw.length * estAdvance))))
    : baseSize;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
    + `<defs><style>@font-face{font-family:'ExplainerType';src:url(${dataUrl}) format('truetype');}</style></defs>`
    + `<text x="${w / 2}" y="${h / 2}" font-family="ExplainerType, sans-serif" font-size="${fontsize}"`
    + ` fill="${fill}" text-anchor="middle" dominant-baseline="central"`
    + (tracking ? ` letter-spacing="${tracking}"` : '')
    + `>${text}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function compositeOverlay(base: Buffer, text: string, kit: StyleKit, role: TypeRole = 'inSceneWord'): Promise<Buffer> {
  const overlay = await renderTextPng({ text, kit, role });
  return composeLayers({
    width: 1920,
    height: 1080,
    background: { color: kit.paper },
    layers: [
      { buffer: base, left: 0, top: 0, width: 1920, height: 1080 },
      { buffer: overlay, left: 0, top: 0, width: 1920, height: 1080 },
    ],
  });
}

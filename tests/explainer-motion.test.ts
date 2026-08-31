import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildParallaxPlanes, usesKenBurns, usesParallax, wordCardImpact } from '@/lib/explainer/motion';
import { PAPERCUT_DIORAMA_V1, RISO_ARCHIVE_V1 } from '@/lib/explainer/style-kits';

describe('explainer motion', () => {
  it('routes shot types to the right motion', () => {
    expect(usesKenBurns('SCENE')).toBe(true);
    expect(usesKenBurns(undefined)).toBe(true);
    expect(wordCardImpact('WORD_CARD')).toBe(true);
    expect(wordCardImpact('SCENE')).toBe(false);
  });

  it('parallax only fires for depth kits on scene shots', () => {
    expect(usesParallax('SCENE', PAPERCUT_DIORAMA_V1)).toBe((PAPERCUT_DIORAMA_V1.depthPlanes ?? 0) >= 2);
    expect(usesParallax('WORD_CARD', PAPERCUT_DIORAMA_V1)).toBe(false);
    expect(usesParallax('SCENE', RISO_ARCHIVE_V1)).toBe((RISO_ARCHIVE_V1.depthPlanes ?? 0) >= 2);
  });

  it('builds N depth planes; foreground planes carry transparency', async () => {
    const src = await sharp({ create: { width: 320, height: 180, channels: 4, background: { r: 200, g: 120, b: 80, alpha: 1 } } }).png().toBuffer();
    const planes = await buildParallaxPlanes(src, 3, 320, 180);
    expect(planes.length).toBe(3);
    const bg = await sharp(planes[0]!).stats();
    expect(bg.isOpaque).toBe(true);
    const fg = await sharp(planes[2]!).ensureAlpha().stats();
    // radial-cut foreground has transparent edges → alpha channel varies
    expect(fg.channels[3]!.min).toBeLessThan(fg.channels[3]!.max);
  });
});

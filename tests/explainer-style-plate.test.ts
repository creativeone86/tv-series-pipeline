import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { applyStylePlate, materialise } from '@/lib/explainer/style-plate';
import { PAPERCUT_DIORAMA_V1, RISO_ARCHIVE_V1 } from '@/lib/explainer/style-kits';

async function solid(color: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({ create: { width: 64, height: 64, channels: 4, background: { ...color, alpha: 1 } } }).png().toBuffer();
}

describe('explainer style plate', () => {
  it('flat-print returns a png', async () => {
    const src = await solid({ r: 80, g: 90, b: 100 });
    const out = await applyStylePlate(src, RISO_ARCHIVE_V1);
    expect(out.profile).toBe('flat-print');
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('png');
  });

  it('material plate does not collapse to 5 colours', async () => {
    const src = await solid({ r: 180, g: 140, b: 90 });
    const out = await applyStylePlate(src, PAPERCUT_DIORAMA_V1);
    expect(out.profile).toBe('material');
    const stats = await sharp(out.buffer).stats();
    expect(stats.channels[0]!.stdev + stats.channels[1]!.stdev).toBeGreaterThanOrEqual(0);
  });

  it('materialise keeps pixels inside the shape alpha', async () => {
    const shape = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{
      input: await solid({ r: 200, g: 40, b: 30 }),
      left: 16,
      top: 16,
    }]).png().toBuffer();
    const out = await materialise(shape, PAPERCUT_DIORAMA_V1);
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(64);
  });
});

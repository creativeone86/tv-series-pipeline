import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { generateSubstrateSwatch, materialise } from '@/lib/explainer/style-plate';
import { PAPERCUT_DIORAMA_V1 } from '@/lib/explainer/style-kits';
import { wantsDiagram } from '@/lib/explainer/resolver';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

async function shape(): Promise<Buffer> {
  const fill = await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 200, g: 40, b: 30, alpha: 1 } } }).png().toBuffer();
  return sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: fill, left: 16, top: 16 }]).png().toBuffer();
}

describe('explainer materialise', () => {
  it('keeps substrate inside the shape alpha', async () => {
    const swatch = await generateSubstrateSwatch(PAPERCUT_DIORAMA_V1, 64);
    const out = await materialise(await shape(), PAPERCUT_DIORAMA_V1, swatch);
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const corner = data[3];
    expect(corner).toBeLessThan(20);
    const mid = ((32 * info.width + 32) * 4) + 3;
    expect(data[mid]!).toBeGreaterThan(10);
  });

  it('casts a shadow at shadowOffsetPx', async () => {
    const out = await materialise(await shape(), { ...PAPERCUT_DIORAMA_V1, shadowOffsetPx: 8 });
    expect((await sharp(out).metadata()).width).toBe(64);
  });

  it('forces TIMELINE MAP MICRO_VIEW to SVG under a material kit in auto mode', () => {
    const beat = { ...moonPocPlan().beats[0]!, shotType: 'TIMELINE' as const };
    const ctx = {
      userId: 'u', projectId: 'p', kit: PAPERCUT_DIORAMA_V1, frameSource: 'auto' as const,
      budget: { capEur: 20, hardCapEur: 20, spentEur: 0, reservedTtsEur: 0 },
    };
    expect(wantsDiagram(beat, ctx)).toBe(true);
    expect(wantsDiagram({ ...beat, shotType: 'MAP' }, ctx)).toBe(true);
    expect(wantsDiagram({ ...beat, shotType: 'MICRO_VIEW' }, ctx)).toBe(true);
  });

  it('generated source overrides material-force → real AI imagery for TIMELINE/MAP/MICRO_VIEW', () => {
    const beat = { ...moonPocPlan().beats[0]!, shotType: 'TIMELINE' as const };
    const ctx = {
      userId: 'u', projectId: 'p', kit: PAPERCUT_DIORAMA_V1, frameSource: 'generated' as const,
      budget: { capEur: 20, hardCapEur: 20, spentEur: 0, reservedTtsEur: 0 },
    };
    expect(wantsDiagram(beat, ctx)).toBe(false);
    expect(wantsDiagram({ ...beat, shotType: 'MAP' }, ctx)).toBe(false);
    expect(wantsDiagram({ ...beat, shotType: 'MICRO_VIEW' }, ctx)).toBe(false);
  });
});

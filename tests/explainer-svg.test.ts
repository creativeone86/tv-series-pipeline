import { describe, expect, it } from 'vitest';
import { composeLayers } from '@/lib/explainer/compositor';
import { lineFigure, pickDiagramKind, pickScene, rasterizeSvg, renderDiagramSvg } from '@/lib/explainer/svg';
import { defaultVisualBible } from '@/lib/explainer/types';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

describe('narrated-explainer · svg + compositor', () => {
  it('builds orbit / gravity / question diagrams from the visual bible', () => {
    const bible = defaultVisualBible();
    const svg = renderDiagramSvg({ kind: 'orbit' }, bible);
    expect(svg).toContain('<svg');
    expect(svg).toContain(bible.palette.earth);
    expect(pickDiagramKind('closed orbit path', ['PHYSICS_ARROW'])).toBe('orbit');
    expect(pickDiagramKind('question motif', ['QUESTION_MOTIF'])).toBe('question');
  });

  it('does not pick orbit for a blood-groups beat', () => {
    const scene = pickScene({
      order: 1,
      purpose: 'EXPLANATION',
      visualGoal: 'ABO blood groups',
      teachingGoal: 'four groups',
      narrationText: 'Кръвните групи са четири.',
      activeEntities: ['GUIDE_CHARACTER'],
    });
    expect(scene.kind).not.toBe('orbit');
  });

  it('assigns a unique scene + line figure to each beat order', () => {
    const plan = moonPocPlan();
    const kinds = plan.beats.map((b) => pickScene(b).kind);
    expect(new Set(kinds).size).toBe(plan.beats.length);
    const hook = renderDiagramSvg(pickScene(plan.beats[0]!));
    expect(hook).toContain('line-figure');
    expect(lineFigure(100, 200, 1, 'look-up', '#E07A3D', 3)).toContain('circle');
    expect(lineFigure(100, 200, 1, 'look-up', '#E07A3D', 3)).not.toMatch(/fill="(?!none)[^"]+"/);
  });

  it('rasterizes 12 beat scenes to 12 different PNGs', async () => {
    const { createHash } = await import('crypto');
    const hashes = [];
    for (const beat of moonPocPlan().beats) {
      const png = await rasterizeSvg(renderDiagramSvg(pickScene(beat)));
      hashes.push(createHash('sha1').update(png).digest('hex'));
    }
    expect(new Set(hashes).size).toBe(12);
  });

  it('rasterizes SVG to a 1920x1080 PNG', async () => {
    const png = await rasterizeSvg(renderDiagramSvg({ kind: 'gravity' }), 1920, 1080);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    const sharp = (await import('sharp')).default;
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });

  it('composites layers over a solid background', async () => {
    const overlay = await rasterizeSvg(renderDiagramSvg({ kind: 'circle', width: 200, height: 200 }), 200, 200);
    const out = await composeLayers({
      width: 640,
      height: 360,
      background: { color: '#0B1220' },
      layers: [{ buffer: overlay, left: 40, top: 40, width: 200, height: 200 }],
    });
    const sharp = (await import('sharp')).default;
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(360);
  });
});

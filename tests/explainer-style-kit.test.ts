import { describe, expect, it } from 'vitest';
import { applyStyleKitPatch, NOCTURNE_V1, RISO_ARCHIVE_V1, styleKitDiffersInPaletteOnly, validateStyleKitPatch, BUILTIN_STYLE_KITS } from '@/lib/explainer/style-kits';

describe('explainer style kits', () => {
  it('rejects unknown patch fields', () => {
    const r = validateStyleKitPatch({ sparkle: true });
    expect(r.ok).toBe(false);
  });

  it('forks to version+1 with parentId', () => {
    const next = applyStyleKitPatch(RISO_ARCHIVE_V1, { grainOpacity: 0.3 });
    expect(next.version).toBe(2);
    expect(next.parentId).toBe(RISO_ARCHIVE_V1.id);
    expect(RISO_ARCHIVE_V1.version).toBe(1);
    expect(next.grainOpacity).toBe(0.3);
  });

  it('NOCTURNE differs from RISO in the intended palette fields', () => {
    const diffs = styleKitDiffersInPaletteOnly(RISO_ARCHIVE_V1, NOCTURNE_V1);
    expect(diffs.sort()).toEqual(['accent', 'grainOpacity', 'ink', 'muted', 'paper', 'secondary'].sort());
  });

  it('ships five valid kits and material kits declare shadow values', () => {
    expect(BUILTIN_STYLE_KITS).toHaveLength(5);
    for (const kit of BUILTIN_STYLE_KITS) {
      expect(kit.paper).toMatch(/^#/);
      expect(kit.promptPrefix.length).toBeGreaterThan(20);
      if (kit.plateProfile === 'material') {
        expect(kit.material).toBeTruthy();
        expect(kit.shadowOffsetPx).toBeGreaterThan(0);
      }
    }
  });
});

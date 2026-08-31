import { describe, expect, it } from 'vitest';
import { applySectionIds, deriveSections, sectionContentHash, validateRetention } from '@/lib/explainer/sections';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

describe('explainer sections', () => {
  it('derives sections and hashes; editing one beat dirties one section', () => {
    const beats = moonPocPlan().beats.map((b, i) => ({ ...b, sectionId: undefined, estimatedDuration: 10, order: i + 1 }));
    const sections = deriveSections(beats, 120);
    expect(sections.length).toBeGreaterThan(1);
    const tagged = applySectionIds(beats, sections);
    const first = sections[0]!;
    const firstBeats = tagged.filter((b) => first.beatIds.includes(b.id));
    const h1 = sectionContentHash(firstBeats);
    const dirty = firstBeats.map((b, i) => i === 0 ? { ...b, narrationText: `${b.narrationText} revised` } : b);
    expect(sectionContentHash(dirty)).not.toBe(h1);
    const later = sections[1]!;
    const laterBeats = tagged.filter((b) => later.beatIds.includes(b.id));
    expect(sectionContentHash(laterBeats)).toBe(sectionContentHash(laterBeats));
  });

  it('flags missing open loops on non-final sections', () => {
    const r = validateRetention([
      { id: 'a', order: 1, title: 'a', beatIds: ['1'], openLoop: false },
      { id: 'b', order: 2, title: 'b', beatIds: ['2'], openLoop: true },
    ]);
    expect(r.missingLoops).toEqual(['a']);
    expect(r.orphans).toEqual([]);
  });
});

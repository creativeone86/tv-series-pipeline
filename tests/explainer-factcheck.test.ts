import { describe, expect, it } from 'vitest';
import { attachCitations, dedupeSources, deriveFactStatus, sourcesBlockFromCards } from '@/lib/explainer/factcheck';
import { fixRussianBleed, hasRussianBleed } from '@/lib/explainer/bulgarian-qa';
import { applyBeatRevision, lockBeat } from '@/lib/explainer/revise';
import { deriveSections, sectionContentHash } from '@/lib/explainer/sections';
import { moonPocPlan } from '@/lib/explainer/poc-moon';
import { alignmentToSrt, alignmentToVtt } from '@/lib/explainer/captions';
import { isStockUrl } from '@/lib/explainer/no-stock';
import { parallaxFilter } from '@/lib/explainer/parallax';

describe('explainer factcheck + producer helpers', () => {
  it('drops unverified claims from the sources block', () => {
    const cards = [
      { claim: 'Landsteiner 1901', sourceUrl: 'https://doi.org/10.x', status: 'VERIFIED' as const },
      { claim: 'rumour', sourceUrl: 'https://blog.example', status: 'UNVERIFIED' as const },
    ];
    const block = sourcesBlockFromCards(cards);
    expect(block).toContain('Landsteiner');
    expect(block).not.toContain('rumour');
  });

  it('dedupes URLs and attaches citations', () => {
    const cards = dedupeSources([
      { claim: 'a', sourceUrl: 'https://doi.org/10.x/' },
      { claim: 'b', sourceUrl: 'https://doi.org/10.x' },
    ]);
    expect(cards).toHaveLength(1);
    const attached = attachCitations([{ claim: 'Karl Landsteiner' }], [{ url: 'https://doi.org/10.x', title: 'Landsteiner' }]);
    expect(attached[0]!.sourceUrl).toBeTruthy();
    expect(deriveFactStatus({ claim: 'x', sourceUrl: 'https://x' }, false)).toBe('UNVERIFIED');
  });

  it('fixes Russian bleed', () => {
    expect(hasRussianBleed('одна група')).toBe(true);
    expect(fixRussianBleed('одна група')).toBe('една група');
  });

  it('section hash changes when one beat changes', () => {
    const beats = moonPocPlan().beats;
    const sections = deriveSections(beats, 90);
    const a = sectionContentHash(beats.filter((b) => sections[0]!.beatIds.includes(b.id)));
    const edited = beats.map((b) => b.id === sections[0]!.beatIds[0] ? { ...b, narrationText: 'changed' } : b);
    const b = sectionContentHash(edited.filter((x) => sections[0]!.beatIds.includes(x.id)));
    expect(a).not.toBe(b);
  });

  it('locked beats survive revision', () => {
    const plan = moonPocPlan();
    const locked = lockBeat(plan, plan.beats[0]!.id, true);
    const revised = applyBeatRevision(locked, plan.beats[0]!.id, { narrationText: 'nope' });
    expect(revised.beats[0]!.narrationText).toBe(plan.beats[0]!.narrationText);
  });

  it('emits srt/vtt and rejects stock urls', () => {
    const al = {
      characters: 'Hi.'.split(''),
      character_start_times_seconds: [0, 0.1, 0.2],
      character_end_times_seconds: [0.1, 0.2, 0.4],
    };
    expect(alignmentToSrt(al)).toContain('-->');
    expect(alignmentToVtt(al)).toContain('WEBVTT');
    expect(isStockUrl('https://www.pexels.com/x')).toBe(true);
    expect(parallaxFilter(3, 1920, 1080, 48)).toContain('overlay');
  });
});

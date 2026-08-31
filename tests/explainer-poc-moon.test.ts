import { describe, expect, it } from 'vitest';
import { beatsToScript } from '@/lib/explainer/beats';
import { looksLikeMoonTopic, moonPocPlan } from '@/lib/explainer/poc-moon';
import { decideGovernor, reserveTtsEur, canAfford } from '@/lib/explainer/budget-governor';
import { estimateImageEur } from '@/lib/explainer/cost-rates';

describe('narrated-explainer · Moon POC fixture', () => {
  it('detects the Bulgarian topic and yields 12–25 beats', () => {
    expect(looksLikeMoonTopic('Защо Луната не пада върху Земята?')).toBe(true);
    const plan = moonPocPlan();
    expect(plan.language).toBe('bg');
    expect(plan.beats.length).toBeGreaterThanOrEqual(12);
    expect(plan.beats.length).toBeLessThanOrEqual(25);
    const entities = new Set(plan.beats.flatMap((b) => b.activeEntities));
    for (const need of ['GUIDE_CHARACTER', 'EARTH', 'MOON', 'SPACE_BG', 'PHYSICS_ARROW', 'QUESTION_MOTIF']) {
      expect(entities.has(need)).toBe(true);
    }
    const script = beatsToScript(plan);
    expect(script.shots.every((s) => s.narrationText)).toBe(true);
  });

  it('reuse ratio climbs as the governor saturates', () => {
    const plan = moonPocPlan();
    const reserved = reserveTtsEur(plan.beats.map((b) => b.narrationText));
    const cap = reserved + estimateImageEur('GENERATE_NEW') * 2;
    let spent = 0;
    let paid = 0;
    const known = new Set<string>();
    for (const beat of plan.beats) {
      const decision = decideGovernor({
        capEur: cap, hardCapEur: cap, spentEur: spent, reservedTtsEur: reserved,
      }, estimateImageEur('GENERATE_NEW'));
      const hits = beat.activeEntities.filter((e) => known.has(e)).length;
      if (hits >= Math.max(1, beat.activeEntities.length - 1)) {
        beat.activeEntities.forEach((e) => known.add(e));
        continue;
      }
      if (canAfford(decision, 'GENERATE_NEW', beat.importance)) {
        spent += estimateImageEur('GENERATE_NEW');
        paid += 1;
      }
      beat.activeEntities.forEach((e) => known.add(e));
    }
    expect(known.size).toBeGreaterThanOrEqual(5);
    expect(paid).toBeLessThan(plan.beats.length);
  });
});

import { describe, expect, it } from 'vitest';
import { canAfford, decideGovernor, estimatePreflight, reserveTtsEur } from '@/lib/explainer/budget-governor';
import { elevenLabsCostEur, estimateImageEur, gptImageCostEur } from '@/lib/explainer/cost-rates';
import { moonPocPlan } from '@/lib/explainer/poc-moon';
import type { ResolveStrategy } from '@/lib/explainer/types';

function allowedOf(spent: number, cap: number, reserved = 0, pending = 0) {
  return decideGovernor({ capEur: cap, hardCapEur: cap, spentEur: spent, reservedTtsEur: reserved }, pending);
}

describe('narrated-explainer · rate table', () => {
  it('prices gpt-image and ElevenLabs in EUR', () => {
    expect(gptImageCostEur('1536', 'medium')).toBeGreaterThan(0);
    expect(elevenLabsCostEur(1000)).toBeGreaterThan(0);
    expect(estimateImageEur('REUSE_EXISTING')).toBe(0);
    // Paid strategies now cost the same env-driven size/quality per output image
    // (honest accounting), so the budget brake fires on real spend.
    expect(estimateImageEur('GENERATE_NEW')).toBeGreaterThan(0);
    expect(estimateImageEur('GENERATE_NEW')).toBe(estimateImageEur('EDIT_PREVIOUS_FRAME'));
  });
});

describe('narrated-explainer · saturation governor', () => {
  it('reserves TTS before releasing image budget', () => {
    const texts = ['Едно', 'Две', 'Три'];
    const reserved = reserveTtsEur(texts, 'elevenlabs');
    expect(reserved).toBeGreaterThan(0);
    const d = decideGovernor({ capEur: 10, hardCapEur: 10, spentEur: 0, reservedTtsEur: reserved });
    expect(d.remainingImageEur).toBeLessThan(10);
    expect(d.remainingImageEur).toBeCloseTo(10 - reserved, 4);
  });

  it('maps each guard level onto an allowed-strategy set', () => {
    const ok = allowedOf(0, 100, 0, 0);
    expect(ok.level).toBe('ok');
    expect(ok.allowed.has('GENERATE_NEW')).toBe(true);

    const warn = allowedOf(85, 100, 0, 0);
    expect(warn.level).toBe('warn');
    expect(warn.allowed.has('GENERATE_NEW')).toBe(true);
    expect(canAfford(warn, 'GENERATE_NEW', 0.5)).toBe(false);
    expect(canAfford(warn, 'GENERATE_NEW', 0.9)).toBe(true);

    const soft = allowedOf(90, 100, 0, 10);
    expect(soft.level).toBe('soft_over');
    expect(soft.allowed.has('GENERATE_NEW')).toBe(false);
    expect(soft.allowed.has('EDIT_PREVIOUS_FRAME')).toBe(true);

    const hard = allowedOf(100, 100, 0, 0);
    expect(hard.level).toBe('hard_block');
    expect(hard.allowed.has('GENERATE_NEW')).toBe(false);
    expect(hard.allowed.has('DETERMINISTIC_RENDER')).toBe(true);
  });

  it('completes a capped episode by desaturating instead of throwing', () => {
    const plan = moonPocPlan();
    const reserved = reserveTtsEur(plan.beats.map((b) => b.narrationText));
    const cap = reserved + 0.2;
    let spent = 0;
    const used: ResolveStrategy[] = [];
    for (const beat of plan.beats) {
      const decision = decideGovernor({
        capEur: cap, hardCapEur: cap, spentEur: spent, reservedTtsEur: reserved,
      }, estimateImageEur('GENERATE_NEW'));
      const ladder: ResolveStrategy[] = ['REUSE_EXISTING', 'COMPOSE_EXISTING', 'DETERMINISTIC_RENDER', 'EDIT_PREVIOUS_FRAME', 'GENERATE_NEW'];
      const pick = ladder.find((s) => canAfford(decision, s, beat.importance)) || 'UNRESOLVED';
      used.push(pick);
      spent += estimateImageEur(pick);
    }
    expect(used.length).toBe(plan.beats.length);
    expect(used.every((s) => s !== 'GENERATE_NEW' || spent <= cap + 1)).toBe(true);
    expect(used.some((s) => s === 'DETERMINISTIC_RENDER' || s === 'REUSE_EXISTING' || s === 'UNRESOLVED')).toBe(true);
    expect(spent + reserved).toBeLessThanOrEqual(cap + estimateImageEur('GENERATE_NEW'));
  });

  it('preflight counts generation vs free strategies', () => {
    const plan = moonPocPlan();
    const report = estimatePreflight({
      beats: plan.beats,
      knownEntityIds: ['EARTH', 'MOON'],
      budget: { capEur: 12, hardCapEur: 12, spentEur: 0, reservedTtsEur: 1 },
      ttsTexts: plan.beats.map((b) => b.narrationText),
    });
    expect(report.totalBeats).toBe(12);
    expect(report.projectedTtsEur).toBeGreaterThan(0);
    expect(report.fromVocabulary + report.composited + report.deterministic + report.needingGeneration).toBe(12);
  });
});

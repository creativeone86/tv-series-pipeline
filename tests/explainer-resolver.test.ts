import { describe, expect, it } from 'vitest';
import { resolveBeat, shouldPreferDiagram } from '@/lib/explainer/resolver';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

describe('narrated-explainer · resolver', () => {
  it('renders a diagram beat deterministically with paid images off', async () => {
    const beat = moonPocPlan().beats.find((b) => b.visualIntent.type === 'DIAGRAM')!;
    const res = await resolveBeat(beat, {
      userId: 'nobody',
      projectId: 'proj-test',
      allowPaidImages: false,
      budget: { capEur: 1, hardCapEur: 1, spentEur: 0, reservedTtsEur: 0.5 },
    });
    expect(res.strategy).toBe('DETERMINISTIC_RENDER');
    expect(res.imageUrl).toBeTruthy();
    expect(res.costEur).toBe(0);
  });

  it('prefers diagrams for teaching beats so vocab compose cannot stamp every frame', () => {
    const plan = moonPocPlan();
    expect(plan.beats.filter((b) => shouldPreferDiagram(b)).length).toBeGreaterThan(6);
    expect(shouldPreferDiagram(plan.beats[0]!)).toBe(true); // QUESTION_MOTIF
    expect(shouldPreferDiagram({
      ...plan.beats[2]!,
      visualIntent: { ...plan.beats[2]!.visualIntent, type: 'ILLUSTRATION' },
      activeEntities: ['EARTH', 'MOON'],
      visualGoal: 'Илюстрация на Луната в орбита около Земята.',
    })).toBe(true);
  });

  it('keeps a paid frame unless force is set', async () => {
    const beat = moonPocPlan().beats[0]!;
    const res = await resolveBeat(beat, {
      userId: 'nobody',
      projectId: 'proj-test',
      allowPaidImages: true,
      existingFrame: {
        beatId: beat.id,
        strategy: 'GENERATE_FROM_REFERENCES',
        imageUrl: '/already-paid.png',
        vocabularyIds: [],
        costEur: 0.0147,
      },
      budget: { capEur: 20, hardCapEur: 20, spentEur: 0.13, reservedTtsEur: 0.1 },
    });
    expect(res.imageUrl).toBe('/already-paid.png');
    const forced = await resolveBeat(beat, {
      userId: 'nobody',
      projectId: 'proj-test',
      allowPaidImages: false,
      force: true,
      existingFrame: {
        beatId: beat.id,
        strategy: 'GENERATE_FROM_REFERENCES',
        imageUrl: '/already-paid.png',
        vocabularyIds: [],
        costEur: 0.0147,
      },
      budget: { capEur: 20, hardCapEur: 20, spentEur: 0.13, reservedTtsEur: 0.1 },
    });
    expect(forced.strategy).toBe('DETERMINISTIC_RENDER');
    expect(forced.imageUrl).not.toBe('/already-paid.png');
  });

  it('keeps an already-paid frame for non-diagram beats', async () => {
    const base = moonPocPlan().beats[0]!;
    const beat = {
      ...base,
      visualGoal: 'portrait of the host',
      teachingGoal: 'face lock',
      narrationText: 'hello',
      activeEntities: ['GUIDE_CHARACTER'],
      visualIntent: { ...base.visualIntent, type: 'PHOTO' as const },
    };
    const res = await resolveBeat(beat, {
      userId: 'nobody',
      projectId: 'proj-test',
      allowPaidImages: true,
      existingFrame: {
        beatId: beat.id,
        strategy: 'GENERATE_FROM_REFERENCES',
        imageUrl: '/already-paid.png',
        vocabularyIds: [],
        costEur: 0.0147,
      },
      budget: { capEur: 20, hardCapEur: 20, spentEur: 0.13, reservedTtsEur: 0.1 },
    });
    expect(res.imageUrl).toBe('/already-paid.png');
    expect(res.strategy).toBe('GENERATE_FROM_REFERENCES');
  });
});

import { describe, expect, it } from 'vitest';
import { endCardSpec, questionTitles, thumbnailCandidates, youtubeDescription } from '@/lib/explainer/packaging';
import { PAPERCUT_DIORAMA_V1 } from '@/lib/explainer/style-kits';
import type { ExplainerPlan } from '@/lib/explainer/types';

const plan: ExplainerPlan = {
  title: 'Why is blood red',
  synopsis: 'A short journey through haemoglobin and light.',
  language: 'en',
  category: 'science' as any,
  titleCandidates: ['Why is your blood actually red?', 'The iron secret inside you'],
  beats: [
    { id: 'b1', order: 1, narrationText: 'Your blood is red. But why?', purpose: 'HOOK', teachingGoal: '', visualGoal: 'a drop of blood', activeEntities: [], importance: 1, visualIntent: { type: 'SCENE' } as any },
    { id: 'b2', order: 2, narrationText: 'Iron in haemoglobin absorbs light.', purpose: 'EXPLANATION', teachingGoal: '', visualGoal: 'iron atom', activeEntities: [], importance: 1, visualIntent: { type: 'SCENE' } as any },
    { id: 'b3', order: 3, narrationText: 'So what happens when oxygen leaves?', purpose: 'QUESTION', teachingGoal: '', visualGoal: 'oxygen', activeEntities: [], importance: 1, visualIntent: { type: 'SCENE' } as any },
  ],
} as any;

describe('explainer packaging', () => {
  it('question titles dedupe and cap at 6', () => {
    const titles = questionTitles(plan, ['Why is your blood actually red?']);
    expect(titles.length).toBeLessThanOrEqual(6);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('youtube description includes synopsis', () => {
    const d = youtubeDescription(plan);
    expect(d).toContain('haemoglobin');
  });

  it('thumbnail candidates carry a headline and case', () => {
    const specs = thumbnailCandidates(plan, PAPERCUT_DIORAMA_V1, ['https://x/a.png', 'https://x/b.png']);
    expect(specs.length).toBeGreaterThanOrEqual(1);
    expect(specs[0]!.headline.length).toBeGreaterThan(0);
    expect(['upper', 'sentence']).toContain(specs[0]!.overlayCase);
    expect(specs[0]!.headline.split(/\s+/).length).toBeLessThanOrEqual(5);
  });

  it('end card pulls a next-episode hook from a question beat', () => {
    const spec = endCardSpec(plan, PAPERCUT_DIORAMA_V1);
    expect(spec.title).not.toContain('?');
    expect(spec.cta.length).toBeGreaterThan(0);
    expect(spec.nextHook).toBeTruthy();
  });
});

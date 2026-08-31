import { describe, expect, it } from 'vitest';
import { applyNarrationDurations, beatsToScript, scriptToBeats } from '@/lib/explainer/beats';
import { compileFramePrompt } from '@/lib/explainer/prompt-compiler';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

describe('narrated-explainer · director beats', () => {
  it('persists explainer fields on ScriptShot', () => {
    const plan = moonPocPlan();
    const script = beatsToScript(plan);
    expect(script.title).toContain('Луната');
    expect(script.shots.length).toBe(12);
    expect(script.shots[0].narrationText).toBe(plan.beats[0].narrationText);
    expect(script.shots[0].explainerPurpose).toBe('HOOK');
    expect(script.shots[0].activeEntities).toContain('GUIDE_CHARACTER');
    expect(script.shots[2].visualIntent).toBeTruthy();
    const back = scriptToBeats(script);
    expect(back.map((b) => b.id)).toEqual(plan.beats.map((b) => b.id));
    expect(back[7].purpose).toBe('REVEAL');
  });

  it('writes probed narration durations back onto shots', () => {
    const script = beatsToScript(moonPocPlan());
    const next = applyNarrationDurations(script, { 'moon-01': 4.2 });
    expect(next.shots[0].actualNarrationDuration).toBe(4.2);
    expect(next.shots[0].duration).toBe(4.2);
  });

  it('compiles a reference-driven frame prompt without inventing a whole scene', () => {
    const beat = moonPocPlan().beats[2];
    const prompt = compileFramePrompt({ beat, entityBlocks: beat.activeEntities });
    // Leads with the beat subject ("Scene:") rather than a generic style headline.
    expect(prompt).toMatch(/^Scene:/);
    expect(prompt).toMatch(/EARTH/);
    expect(prompt).not.toMatch(/three-act|McKee/i);
  });
});

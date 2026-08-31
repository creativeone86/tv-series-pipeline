import { describe, expect, it } from 'vitest';
import { applyBeatRevision, lockBeat } from '@/lib/explainer/revise';
import { moonPocPlan } from '@/lib/explainer/poc-moon';

describe('explainer revise', () => {
  it('beat-scope revision leaves other beats byte-identical and respects locks', () => {
    const plan = moonPocPlan();
    const other = plan.beats[1]!;
    const locked = lockBeat(plan, plan.beats[0]!.id, true);
    const afterLock = applyBeatRevision(locked, locked.beats[0]!.id, { narrationText: 'should not apply' });
    expect(afterLock.beats[0]!.narrationText).toBe(locked.beats[0]!.narrationText);
    const next = applyBeatRevision(plan, other.id, { narrationText: 'rewritten only here' });
    expect(next.beats[1]!.narrationText).toBe('rewritten only here');
    expect(next.beats[0]!.narrationText).toBe(plan.beats[0]!.narrationText);
    expect(next.beats[2]!.narrationText).toBe(plan.beats[2]!.narrationText);
  });
});

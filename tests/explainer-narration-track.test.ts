import { describe, expect, it } from 'vitest';
import { computeXfadeTimeline } from '@/lib/xfade-timeline';
import {
  buildNarrationScript,
  carveFrameWindows,
  frameCountForBeat,
  isAlignmentMonotonic,
  preCompensateForXfade,
  proportionalWindows,
  windowsFromAlignment,
  xfadeInvariantHolds,
} from '@/lib/explainer/narration-track';

const alignment = {
  characters: 'Hello world. Next beat here.'.split(''),
  character_start_times_seconds: Array.from({ length: 27 }, (_, i) => i * 0.08),
  character_end_times_seconds: Array.from({ length: 27 }, (_, i) => i * 0.08 + 0.07),
};

describe('explainer narration-track', () => {
  it('joins beats with separator offsets', () => {
    const { script, offsets } = buildNarrationScript([
      { id: 'a', narrationText: 'Hello world.' },
      { id: 'b', narrationText: 'Next beat here.' },
    ]);
    expect(script).toContain('\n\n');
    expect(offsets[0]!.startChar).toBe(0);
    expect(offsets[1]!.startChar).toBe('Hello world.'.length + 2);
  });

  it('derives windows from alignment', () => {
    const { offsets } = buildNarrationScript([
      { id: 'a', narrationText: 'Hello world.' },
      { id: 'b', narrationText: 'Next beat here.' },
    ]);
    const wins = windowsFromAlignment(offsets, alignment);
    expect(wins[0]!.startSec).toBeLessThan(wins[0]!.endSec);
    expect(wins[1]!.startSec).toBeGreaterThanOrEqual(wins[0]!.endSec - 0.9);
  });

  it('carves frames on sentence boundaries', () => {
    const frames = carveFrameWindows({ id: 'a', startSec: 0, endSec: 12 }, 3, alignment, 'Hello world. Next beat here.');
    expect(frames).toHaveLength(3);
    expect(frames[0]!.startSec).toBe(0);
    expect(frames[2]!.endSec).toBe(12);
  });

  it('td=0 preCompensate is identity', () => {
    const lens = [4, 5, 6];
    expect(preCompensateForXfade(lens, 0)).toEqual(lens);
    expect(xfadeInvariantHolds([0, 4, 9], lens, 0)).toBe(true);
  });

  it('preCompensate satisfies xfade clipStart == windowStart', () => {
    const windows = [0, 5, 10];
    const lens = [5, 5, 5];
    const td = 0.35;
    const compensated = preCompensateForXfade(lens, td);
    const tds = compensated.map((_, i) => (i === 0 ? 0 : Math.min(td, Math.min(...compensated) / 2)));
    const { clipStartSec } = computeXfadeTimeline(compensated, tds);
    clipStartSec.forEach((s, i) => expect(Math.abs(s - windows[i]!)).toBeLessThan(0.05));
  });

  it('rejects non-monotonic alignments', () => {
    expect(isAlignmentMonotonic({
      characters: ['a', 'b'],
      character_start_times_seconds: [0.2, 0.1],
      character_end_times_seconds: [0.3, 0.4],
    })).toBe(false);
    const { offsets } = buildNarrationScript([{ id: 'a', narrationText: 'Hi' }, { id: 'b', narrationText: 'There' }]);
    const wins = proportionalWindows(offsets, 10);
    expect(wins[1]!.endSec).toBeGreaterThan(wins[0]!.endSec);
  });

  it('clamps frame count 1-4', () => {
    expect(frameCountForBeat(4)).toBe(1);
    expect(frameCountForBeat(8)).toBe(2);
    expect(frameCountForBeat(20)).toBe(4);
  });
});

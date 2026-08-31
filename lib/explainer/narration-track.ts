/**
 * Voice-as-master-clock primitives. Pure functions — no I/O.
 * Alignment windows drive beat and frame timing; clip durations stay in
 * lockstep with the spoken track (hard cuts) or pre-compensate xfade.
 */

import { computeXfadeTimeline } from '@/lib/xfade-timeline';

export interface CharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface BeatCharOffset {
  beatId: string;
  startChar: number;
  endChar: number;
  text: string;
}

export interface TimeWindow {
  id: string;
  startSec: number;
  endSec: number;
}

export interface FrameWindow extends TimeWindow {
  beatId: string;
  frameIndex: number;
}

export const DEFAULT_LEAD_IN_SEC = 0.4;
export const DEFAULT_TAIL_SEC = 0.8;

export function buildNarrationScript(
  beats: Array<{ id: string; narrationText: string }>,
  separator = '\n\n',
): { script: string; offsets: BeatCharOffset[] } {
  const offsets: BeatCharOffset[] = [];
  let cursor = 0;
  const parts: string[] = [];
  for (let i = 0; i < beats.length; i++) {
    const text = (beats[i]!.narrationText || '').trim();
    if (i > 0) cursor += separator.length;
    offsets.push({
      beatId: beats[i]!.id,
      startChar: cursor,
      endChar: cursor + text.length,
      text,
    });
    parts.push(text);
    cursor += text.length;
  }
  return { script: parts.join(separator), offsets };
}

export function isAlignmentMonotonic(alignment: CharacterAlignment | null | undefined): boolean {
  if (!alignment?.character_start_times_seconds?.length) return false;
  const starts = alignment.character_start_times_seconds;
  for (let i = 1; i < starts.length; i++) {
    if ((starts[i] ?? 0) + 1e-6 < (starts[i - 1] ?? 0)) return false;
  }
  return starts.length === (alignment.characters?.length || 0)
    && starts.length === (alignment.character_end_times_seconds?.length || 0);
}

export function windowsFromAlignment(
  offsets: BeatCharOffset[],
  alignment: CharacterAlignment,
  opts?: { leadInSec?: number; tailSec?: number; totalDuration?: number },
): TimeWindow[] {
  const lead = opts?.leadInSec ?? DEFAULT_LEAD_IN_SEC;
  const tail = opts?.tailSec ?? DEFAULT_TAIL_SEC;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const lastEnd = ends[ends.length - 1] ?? opts?.totalDuration ?? 0;

  return offsets.map((off, i) => {
    const startIdx = clampIndex(off.startChar, starts.length);
    const endIdx = clampIndex(Math.max(off.startChar, off.endChar - 1), ends.length);
    const rawStart = starts[startIdx] ?? 0;
    const rawEnd = ends[endIdx] ?? rawStart;
    const prevEnd = i > 0
      ? (ends[clampIndex(offsets[i - 1]!.endChar - 1, ends.length)] ?? rawStart)
      : 0;
    const nextStart = i < offsets.length - 1
      ? (starts[clampIndex(offsets[i + 1]!.startChar, starts.length)] ?? rawEnd)
      : lastEnd;
    const startSec = Math.max(0, rawStart - (i === 0 ? lead : Math.min(lead, (rawStart - prevEnd) / 2)));
    const endSec = rawEnd + (i === offsets.length - 1 ? tail : Math.min(tail, Math.max(0, (nextStart - rawEnd) / 2)));
    return { id: off.beatId, startSec, endSec: Math.max(startSec + 0.4, endSec) };
  });
}

/** Sentence-proportional fallback when alignment is missing or non-monotonic. */
export function proportionalWindows(
  offsets: BeatCharOffset[],
  totalDuration: number,
  opts?: { leadInSec?: number; tailSec?: number },
): TimeWindow[] {
  const lead = opts?.leadInSec ?? DEFAULT_LEAD_IN_SEC;
  const tail = opts?.tailSec ?? DEFAULT_TAIL_SEC;
  const usable = Math.max(0.4, totalDuration - lead - tail);
  const weights = offsets.map((o) => Math.max(1, o.text.length));
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  let cursor = lead;
  return offsets.map((o, i) => {
    const len = usable * (weights[i]! / sum);
    const startSec = cursor;
    cursor += len;
    const endSec = i === offsets.length - 1 ? Math.max(cursor, totalDuration) : cursor;
    return { id: o.beatId, startSec, endSec };
  });
}

export function carveFrameWindows(
  beatWindow: TimeWindow,
  frameCount: number,
  alignment?: CharacterAlignment | null,
  beatText?: string,
): FrameWindow[] {
  const n = clamp(Math.round(frameCount), 1, 4);
  if (n === 1) {
    return [{ id: `${beatWindow.id}:0`, beatId: beatWindow.id, frameIndex: 0, startSec: beatWindow.startSec, endSec: beatWindow.endSec }];
  }
  const span = Math.max(0.4, beatWindow.endSec - beatWindow.startSec);
  const cuts = sentenceCutFractions(beatText || '', n, alignment, beatWindow);
  const windows: FrameWindow[] = [];
  for (let i = 0; i < n; i++) {
    const startFrac = i === 0 ? 0 : cuts[i - 1]!;
    const endFrac = i === n - 1 ? 1 : cuts[i]!;
    windows.push({
      id: `${beatWindow.id}:${i}`,
      beatId: beatWindow.id,
      frameIndex: i,
      startSec: beatWindow.startSec + span * startFrac,
      endSec: beatWindow.startSec + span * endFrac,
    });
  }
  return windows;
}

export function frameCountForBeat(beatSeconds: number): number {
  return clamp(Math.ceil((beatSeconds || 0) / 6), 1, 4);
}

/**
 * Clip durations such that computeXfadeTimeline yields clipStartSec[i] === windowStart[i].
 * With td = 0 this is the identity (hard cuts).
 */
export function preCompensateForXfade(windowLengths: number[], td: number): number[] {
  if (!(td > 0) || windowLengths.length === 0) return windowLengths.slice();
  const minLen = Math.min(...windowLengths);
  const effectiveTd = Math.min(td, minLen / 2);
  return windowLengths.map((len) => Math.max(len + effectiveTd, 2 * effectiveTd + 0.05));
}

export function xfadeInvariantHolds(windowStarts: number[], compensated: number[], td: number): boolean {
  if (!(td > 0)) {
    let acc = 0;
    for (let i = 0; i < windowStarts.length; i++) {
      if (Math.abs(acc - windowStarts[i]!) > 1e-3) return false;
      acc += compensated[i] || 0;
    }
    return true;
  }
  const tds = compensated.map((_, i) => (i === 0 ? 0 : Math.min(td, Math.min(...compensated) / 2)));
  const { clipStartSec } = computeXfadeTimeline(compensated, tds);
  return clipStartSec.every((s, i) => Math.abs(s - windowStarts[i]!) < 1e-3);
}

export function contentHash(parts: Array<string | number | undefined | null>): string {
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.createHash('sha256').update(parts.map((p) => String(p ?? '')).join('\0')).digest('hex').slice(0, 16);
}

function sentenceCutFractions(
  text: string,
  frameCount: number,
  alignment: CharacterAlignment | undefined | null,
  beatWindow: TimeWindow,
): number[] {
  const marks = [...text.matchAll(/[.!?。！？…]+\s*/g)].map((m) => (m.index || 0) + m[0].length);
  if (marks.length >= frameCount - 1 && alignment && isAlignmentMonotonic(alignment)) {
    const span = Math.max(1e-3, beatWindow.endSec - beatWindow.startSec);
    const chosen: number[] = [];
    const step = marks.length / (frameCount - 1);
    for (let i = 1; i < frameCount; i++) {
      const mark = marks[Math.min(marks.length - 1, Math.round(i * step) - 1)] || 0;
      const t = alignment.character_start_times_seconds[clampIndex(mark, alignment.character_start_times_seconds.length)] ?? 0;
      const frac = clamp((t - beatWindow.startSec) / span, 0.12, 0.88);
      chosen.push(frac);
    }
    return chosen.sort((a, b) => a - b);
  }
  return Array.from({ length: frameCount - 1 }, (_, i) => (i + 1) / frameCount);
}

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(len - 1, Math.max(0, Math.floor(i)));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

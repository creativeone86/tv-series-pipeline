import { contentHash } from './narration-track';
import type { ExplainerBeat, ExplainerSection } from './types';

export function deriveSections(beats: ExplainerBeat[], targetSeconds: number): ExplainerSection[] {
  if (beats.some((b) => b.sectionId)) {
    const byId = new Map<string, ExplainerBeat[]>();
    for (const b of beats) {
      const id = b.sectionId || `sec-${b.order}`;
      const list = byId.get(id) || [];
      list.push(b);
      byId.set(id, list);
    }
    return [...byId.entries()].map(([id, list], i) => sectionFromBeats(id, i + 1, list));
  }
  const targetSecPer = targetSeconds <= 120 ? 60 : targetSeconds <= 360 ? 70 : 75;
  const sections: ExplainerSection[] = [];
  let bucket: ExplainerBeat[] = [];
  let acc = 0;
  let n = 1;
  for (const beat of beats) {
    const dur = beat.actualNarrationDuration || beat.estimatedDuration || 10;
    if (bucket.length > 0 && acc + dur > targetSecPer && bucket.length >= 2) {
      sections.push(sectionFromBeats(`sec-${n}`, n, bucket));
      n += 1;
      bucket = [];
      acc = 0;
    }
    bucket.push({ ...beat, sectionId: `sec-${n}` });
    acc += dur;
  }
  if (bucket.length) sections.push(sectionFromBeats(`sec-${n}`, n, bucket));
  return sections;
}

export function applySectionIds(beats: ExplainerBeat[], sections: ExplainerSection[]): ExplainerBeat[] {
  const map = new Map<string, string>();
  for (const s of sections) for (const id of s.beatIds) map.set(id, s.id);
  return beats.map((b) => ({ ...b, sectionId: map.get(b.id) || b.sectionId }));
}

export function sectionContentHash(beats: ExplainerBeat[]): string {
  return contentHash(beats.flatMap((b) => [b.id, b.narrationText, b.visualGoal, b.locked ? '1' : '0', JSON.stringify(b.frames || [])]));
}

export function beatContentHash(beat: ExplainerBeat): string {
  return contentHash([beat.id, beat.narrationText, beat.visualGoal, beat.visualIntent.generationPrompt, beat.shotType]);
}

/**
 * Cache key for a rendered section video. Folds in narration-track presence and its
 * duration so a section rendered while SILENT is never reused once its voice track
 * exists (voice is the master clock), and re-timing the narration forces a rebuild.
 */
export function sectionVideoCacheKey(contentPart: string, hasAudio: boolean, trackDuration = 0): string {
  return `${contentPart}|${hasAudio ? `aud:${Math.round((trackDuration || 0) * 10)}` : 'sil'}`;
}

function sectionFromBeats(id: string, order: number, beats: ExplainerBeat[]): ExplainerSection {
  return {
    id,
    order,
    title: beats[0]?.teachingGoal?.slice(0, 60) || `Section ${order}`,
    beatIds: beats.map((b) => b.id),
    targetSeconds: beats.reduce((s, b) => s + (b.actualNarrationDuration || b.estimatedDuration || 10), 0),
    contentHash: sectionContentHash(beats),
    locked: beats.every((b) => b.locked),
    openLoop: order > 0,
  };
}

export function validateRetention(sections: ExplainerSection[]): { ok: boolean; orphans: string[]; missingLoops: string[] } {
  const orphans = sections.filter((s) => s.beatIds.length === 0).map((s) => s.id);
  const missingLoops = sections.slice(0, -1).filter((s) => s.openLoop === false).map((s) => s.id);
  return { ok: orphans.length === 0, orphans, missingLoops };
}

import { contentHash } from './narration-track';
import type { ExplainerBeat, ExplainerPlan } from './types';

export type ReviseScope = 'beat' | 'section' | 'episode';

export function applyBeatRevision(plan: ExplainerPlan, beatId: string, patch: Partial<ExplainerBeat>): ExplainerPlan {
  return {
    ...plan,
    beats: plan.beats.map((b) => {
      if (b.id !== beatId) return b;
      if (b.locked) return b;
      const next = { ...b, ...patch, id: b.id, order: b.order, locked: b.locked };
      return { ...next, contentHash: contentHash([next.narrationText, next.visualGoal, next.visualIntent.generationPrompt]) };
    }),
  };
}

export function applySectionRevision(plan: ExplainerPlan, sectionId: string, beats: ExplainerBeat[]): ExplainerPlan {
  const locked = new Set(plan.beats.filter((b) => b.locked).map((b) => b.id));
  const incoming = beats.filter((b) => !locked.has(b.id));
  const kept = plan.beats.filter((b) => b.sectionId !== sectionId || b.locked);
  const merged = [...kept, ...incoming].sort((a, b) => a.order - b.order);
  return { ...plan, beats: merged };
}

export function lockBeat(plan: ExplainerPlan, beatId: string, locked = true): ExplainerPlan {
  return { ...plan, beats: plan.beats.map((b) => b.id === beatId ? { ...b, locked } : b) };
}

export function scriptVersionPayload(plan: ExplainerPlan, note: string): Record<string, unknown> {
  return { plan, note, at: new Date().toISOString(), hash: contentHash([plan.title, ...plan.beats.map((b) => b.narrationText)]) };
}

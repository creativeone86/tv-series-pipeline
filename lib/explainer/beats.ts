import type { Script, ScriptShot } from '@/types/agents';
import type { ExplainerBeat, ExplainerPlan } from './types';

export function beatsToScript(plan: ExplainerPlan): Script {
  const shots: ScriptShot[] = plan.beats.map((b, i) => ({
    shotNumber: i + 1,
    sceneDescription: b.visualGoal || b.teachingGoal,
    action: b.visualGoal,
    emotion: b.purpose.toLowerCase(),
    characters: b.activeEntities,
    dialogue: b.narrationText,
    duration: b.actualNarrationDuration || b.estimatedDuration || 5,
    visualPrompt: b.visualIntent.generationPrompt || b.visualGoal,
    narrationBeatId: b.id,
    narrationText: b.narrationText,
    explainerPurpose: b.purpose,
    teachingGoal: b.teachingGoal,
    visualGoal: b.visualGoal,
    activeEntities: b.activeEntities,
    importance: b.importance,
    actualNarrationDuration: b.actualNarrationDuration,
    factualReviewStatus: b.factualReviewStatus || 'UNREVIEWED',
    visualIntent: b.visualIntent as unknown as Record<string, unknown>,
    sectionId: b.sectionId,
    locked: b.locked,
    frames: b.frames,
    shotType: b.shotType,
    overlayText: b.overlayText,
    claims: b.claims,
    transition: 'cut',
  }));
  return {
    title: plan.title,
    synopsis: plan.synopsis,
    shots,
  };
}

export function scriptToBeats(script: Script): ExplainerBeat[] {
  return (script.shots || []).map((s, i) => ({
    id: s.narrationBeatId || `beat-${s.shotNumber || i + 1}`,
    order: s.shotNumber || i + 1,
    narrationText: s.narrationText || s.dialogue || '',
    purpose: s.explainerPurpose || 'EXPLANATION',
    teachingGoal: s.teachingGoal || s.sceneDescription || '',
    visualGoal: s.visualGoal || s.action || '',
    activeEntities: s.activeEntities || s.characters || [],
    importance: typeof s.importance === 'number' ? s.importance : 0.5,
    visualIntent: (s.visualIntent as unknown as ExplainerBeat['visualIntent']) || {
      type: 'ILLUSTRATION',
      subject: s.sceneDescription || '',
      teachingGoal: s.teachingGoal || s.sceneDescription || '',
      activeEntities: s.activeEntities || s.characters || [],
    },
    estimatedDuration: s.duration,
    actualNarrationDuration: s.actualNarrationDuration,
    factualReviewStatus: s.factualReviewStatus,
    sectionId: (s as any).sectionId,
    locked: (s as any).locked,
    frames: (s as any).frames,
    shotType: (s as any).shotType,
    overlayText: (s as any).overlayText,
    claims: (s as any).claims,
  }));
}

export function applyNarrationDurations(script: Script, durations: Record<string, number>): Script {
  return {
    ...script,
    shots: (script.shots || []).map((s) => {
      const id = s.narrationBeatId || `beat-${s.shotNumber}`;
      const d = durations[id];
      if (!(d > 0)) return s;
      return { ...s, actualNarrationDuration: d, duration: d, dialogue: s.narrationText || s.dialogue };
    }),
  };
}

import { evaluateBudgetGuard, type BudgetGuardLevel } from '@/lib/budget-guard';
import type { ResolveStrategy } from './types';
import { estimateBeatTtsEur, estimateImageEur } from './cost-rates';
import { shouldPreferDiagram } from './svg';

export interface EpisodeBudget {
  capEur: number | null;
  hardCapEur?: number | null;
  spentEur: number;
  reservedTtsEur: number;
}

export interface GovernorDecision {
  level: BudgetGuardLevel;
  allow: boolean;
  allowed: Set<ResolveStrategy>;
  remainingImageEur: number;
  message: string;
}

const FREE: ResolveStrategy[] = [
  'REUSE_EXISTING', 'COMPOSE_EXISTING', 'DETERMINISTIC_RENDER', 'MANUAL_IMPORT', 'UNRESOLVED',
];

export function reserveTtsEur(texts: string[], provider = 'elevenlabs'): number {
  return texts.reduce((s, t) => s + estimateBeatTtsEur(t, provider), 0);
}

export function decideGovernor(budget: EpisodeBudget, pendingImageEur = 0): GovernorDecision {
  const spentForImages = Math.max(0, budget.spentEur);
  const cap = budget.capEur == null ? null : Math.max(0, budget.capEur - budget.reservedTtsEur);
  const hard = budget.hardCapEur == null ? null : Math.max(0, (budget.hardCapEur || 0) - budget.reservedTtsEur);
  // evaluateBudgetGuard is currency-agnostic (pure numeric); its param keys keep the
  // shared `*Eur` names but here they carry EUR values, consistent cap vs spend.
  const g = evaluateBudgetGuard({
    spentEur: spentForImages,
    capEur: cap,
    hardCapEur: hard,
    pendingCostEur: pendingImageEur,
  });
  const allowed = new Set<ResolveStrategy>(FREE);
  if (g.level === 'ok' || g.level === 'none') {
    allowed.add('EDIT_PREVIOUS_FRAME');
    allowed.add('GENERATE_FROM_REFERENCES');
    allowed.add('GENERATE_NEW');
  } else if (g.level === 'warn') {
    allowed.add('EDIT_PREVIOUS_FRAME');
    allowed.add('GENERATE_FROM_REFERENCES');
    allowed.add('GENERATE_NEW'); // resolver still restricts GENERATE_NEW to high-importance
  } else if (g.level === 'soft_over') {
    allowed.add('EDIT_PREVIOUS_FRAME');
  }
  const remainingImageEur = cap == null ? Number.POSITIVE_INFINITY : Math.max(0, cap - spentForImages);
  return {
    level: g.level,
    allow: g.allow,
    allowed,
    remainingImageEur,
    message: g.message,
  };
}

export function canAfford(decision: GovernorDecision, strategy: ResolveStrategy, importance = 0.5): boolean {
  if (!decision.allowed.has(strategy)) return false;
  if (strategy === 'GENERATE_NEW' && decision.level === 'warn' && importance < 0.75) return false;
  const cost = estimateImageEur(strategy);
  if (cost <= 0) return true;
  return cost <= decision.remainingImageEur + 1e-6;
}

export interface PreflightReport {
  totalBeats: number;
  fromVocabulary: number;
  composited: number;
  deterministic: number;
  needingGeneration: number;
  projectedImageEur: number;
  projectedTtsEur: number;
  projectedTotalEur: number;
  capEur: number | null;
  spentEur: number;
  remainingEur: number;
  level: BudgetGuardLevel;
}

/** Cheap pre-run estimate: vocab / diagram / paid, without calling providers. */
export function estimatePreflight(input: {
  beats: Array<{
    visualIntent?: { type?: string };
    activeEntities?: string[];
    importance?: number;
    visualGoal?: string;
    teachingGoal?: string;
    narrationText?: string;
  }>;
  knownEntityIds?: string[];
  budget: EpisodeBudget;
  ttsTexts: string[];
  ttsProvider?: string;
  frameSource?: 'generated' | 'diagram' | 'auto';
}): PreflightReport {
  const known = new Set(input.knownEntityIds || []);
  let fromVocabulary = 0;
  let composited = 0;
  let deterministic = 0;
  let needingGeneration = 0;
  let projectedImageEur = 0;
  for (const beat of input.beats) {
    const entities = beat.activeEntities || [];
    const hits = entities.filter((id) => known.has(id)).length;
    const asBeat = {
      visualIntent: beat.visualIntent || { type: 'ILLUSTRATION' as const, subject: '', teachingGoal: '' },
      activeEntities: entities,
      visualGoal: beat.visualGoal || '',
      teachingGoal: beat.teachingGoal || '',
      narrationText: beat.narrationText || '',
    };
    if (input.frameSource === 'generated') {
      needingGeneration += 1;
      projectedImageEur += estimateImageEur('GENERATE_NEW');
    } else if (shouldPreferDiagram(asBeat as any)) {
      deterministic += 1;
    } else if (hits >= Math.max(1, entities.length - 1) && hits === 1) {
      fromVocabulary += 1;
    } else if (hits >= 2) {
      composited += 1;
    } else {
      needingGeneration += 1;
      projectedImageEur += estimateImageEur('GENERATE_NEW');
    }
  }
  const projectedTtsEur = reserveTtsEur(input.ttsTexts, input.ttsProvider);
  const decision = decideGovernor(input.budget, projectedImageEur);
  const cap = input.budget.capEur;
  return {
    totalBeats: input.beats.length,
    fromVocabulary,
    composited,
    deterministic,
    needingGeneration,
    projectedImageEur: round4(projectedImageEur),
    projectedTtsEur: round4(projectedTtsEur),
    projectedTotalEur: round4(projectedImageEur + projectedTtsEur),
    capEur: cap,
    spentEur: input.budget.spentEur,
    remainingEur: cap == null ? Number.POSITIVE_INFINITY : Math.max(0, cap - input.budget.spentEur),
    level: decision.level,
  };
}

function round4(n0: number): number {
  return Math.round((n0 + Number.EPSILON) * 10000) / 10000;
}

import { getTextNegativePromptFlags } from '@/lib/text-control';
import { gateFixHint, parseShotGate, shotGatePass } from '@/lib/shot-quality-gate';
import type { ExplainerBeat, ShotType, StyleKit } from './types';

export function framePromptWithQa(prompt: string): string {
  return `${prompt}. ${getTextNegativePromptFlags()}`;
}

export function shouldFallbackToFreeShot(score: number, passAt = 0.55): boolean {
  return score < passAt;
}

export function explainerGatePass(raw: unknown): { pass: boolean; reasons: string[]; hint: string } {
  const score = parseShotGate(raw);
  if (!score) return { pass: true, reasons: [], hint: '' };
  const result = shotGatePass(score, { requirePhotoreal: false, qualityMin: 45 });
  const reasons = [...result.reasons];
  if (score.hasBakedText) reasons.push('baked-text');
  return { pass: reasons.length === 0, reasons: [...new Set(reasons)], hint: gateFixHint(reasons) };
}

const FREE_FALLBACK: ShotType[] = ['WORD_CARD', 'IN_SCENE_WORD', 'TIMELINE', 'MAP'];

export function fallbackFreeShot(current?: ShotType): ShotType {
  if (current && FREE_FALLBACK.includes(current)) return current;
  return 'WORD_CARD';
}

/** Frames carrying the locked character are always gated; others can be sampled. */
export function carriesCharacter(shot?: ShotType): boolean {
  return shot === 'SCENE' || shot === 'GUIDE_ON_VOID' || shot === 'ANNOTATED_SCENE';
}

export function shouldGateFrame(shot: ShotType | undefined, opts: { sampleRate?: number; index?: number }): boolean {
  if (carriesCharacter(shot)) return true;
  const rate = opts.sampleRate ?? 1;
  if (rate >= 1) return true;
  const every = Math.max(1, Math.round(1 / rate));
  return ((opts.index ?? 0) % every) === 0;
}

export interface FrameQaContext {
  beat?: ExplainerBeat;
  kit?: StyleKit;
  index?: number;
  sampleRate?: number;
}

export interface FrameQaResult {
  pass: boolean;
  hint: string;
  scores: { style?: number; script?: number; character?: number };
}

/**
 * Full QA stack: quality gate + style-audit + vision-audit + character consistency.
 * Any hard fail returns pass=false with a combined regen hint. Missing keys / non-http
 * URLs degrade to a soft pass so QA never blocks a render offline.
 */
export async function qaGeneratedFrame(imageUrl: string, ctx: FrameQaContext = {}): Promise<FrameQaResult | null> {
  if (process.env.MOCK_ENGINES === '1' || process.env.EXPLAINER_FRAME_QA === '0') return null;
  const shot = ctx.beat?.shotType || ctx.beat?.frames?.[ctx.index || 0]?.shotType;
  if (!shouldGateFrame(shot, { sampleRate: ctx.sampleRate, index: ctx.index })) return null;

  const scores: FrameQaResult['scores'] = {};
  const hints: string[] = [];
  let pass = true;

  try {
    const { scoreShotStyle } = await import('@/lib/shot-quality-gate');
    const gate = await scoreShotStyle(imageUrl);
    if (gate) {
      const g = explainerGatePass(gate);
      if (!g.pass) { pass = false; if (g.hint) hints.push(g.hint); }
    }
  } catch { /* gate optional */ }

  if (ctx.kit?.styleAnchorUrl && imageUrl.startsWith('http')) {
    try {
      const { auditShotStyle, buildRegenHintFromAudit } = await import('@/lib/style-audit');
      const audit = await auditShotStyle(imageUrl, ctx.kit.styleAnchorUrl);
      if (audit) {
        scores.style = audit.score;
        if (audit.score < 70) { pass = false; hints.push(buildRegenHintFromAudit(audit)); }
      }
    } catch { /* style audit optional */ }
  }

  if (ctx.beat && imageUrl.startsWith('http')) {
    try {
      const { auditShotVsScript } = await import('@/lib/vision-audit');
      const res = await auditShotVsScript(imageUrl, {
        shotNumber: ctx.beat.order,
        sceneDescription: ctx.beat.visualGoal,
        action: ctx.beat.visualGoal,
        mood: ctx.beat.purpose,
      });
      if (res) {
        scores.script = res.score;
        if (res.verdict === 'fail') { pass = false; hints.push(`show ${ctx.beat.visualGoal}`); }
      }
    } catch { /* vision audit optional */ }
  }

  if (carriesCharacter(shot) && ctx.kit?.characterSheetUrl && imageUrl.startsWith('http')) {
    try {
      const { scoreShotConsistencyBest } = await import('@/lib/cameo-vision');
      const cons = await scoreShotConsistencyBest(imageUrl, ctx.kit.characterSheetUrl, 'series guide');
      if (cons) {
        scores.character = cons.score;
        if (cons.score < 60) { pass = false; hints.push('match the series guide character sheet exactly'); }
      }
    } catch { /* consistency optional */ }
  }

  return { pass, hint: hints.join('. '), scores };
}

/** Back-compat shim used by the resolver before the full stack landed. */
export async function scoreGeneratedFrame(imageUrl: string, ctx: FrameQaContext = {}): Promise<{ pass: boolean; hint: string } | null> {
  const r = await qaGeneratedFrame(imageUrl, ctx);
  return r ? { pass: r.pass, hint: r.hint } : null;
}

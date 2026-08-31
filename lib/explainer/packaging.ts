import { sourcesBlockFromCards } from './factcheck';
import type { ExplainerPlan, FactCard, StyleKit } from './types';

export function questionTitles(plan: ExplainerPlan, extra: string[] = []): string[] {
  const fromPlan = plan.titleCandidates || [];
  const fallback = plan.title.includes('?') ? [plan.title] : [`${plan.title}?`];
  return [...new Set([...fromPlan, ...extra, ...fallback])].slice(0, 6);
}

export function youtubeDescription(plan: ExplainerPlan, cards?: FactCard[]): string {
  const sources = plan.sourcesBlock || sourcesBlockFromCards(cards || plan.factCards || []);
  return [
    plan.synopsis,
    '',
    plan.beats.slice(0, 3).map((b) => b.narrationText.split(/[.!?]/)[0]).filter(Boolean).join(' '),
    '',
    sources,
  ].filter((x, i, a) => x || a[i - 1]).join('\n');
}

export interface ThumbnailSpec {
  backdropUrl?: string;
  headline: string;
  overlayCase: 'upper' | 'sentence';
}

/** A few strong thumbnail directions: shortest question fragment over the best SCENE frames. */
export function thumbnailCandidates(plan: ExplainerPlan, kit: StyleKit, frameUrls: string[]): ThumbnailSpec[] {
  const headlineSource = questionTitles(plan);
  const short = headlineSource
    .map((t) => t.replace(/[?？]+$/, '').trim())
    .map((t) => (t.split(/\s+/).length > 5 ? t.split(/\s+/).slice(0, 5).join(' ') : t))
    .filter(Boolean);
  const backdrops = frameUrls.filter(Boolean).slice(0, 3);
  const specs: ThumbnailSpec[] = [];
  const n = Math.max(1, Math.min(3, short.length || 1));
  for (let i = 0; i < n; i++) {
    specs.push({
      backdropUrl: backdrops[i % Math.max(1, backdrops.length)],
      headline: short[i] || plan.title,
      overlayCase: kit.displayCase,
    });
  }
  return specs;
}

export interface EndCardSpec {
  title: string;
  cta: string;
  nextHook?: string;
}

/** End card copy: pull the strongest open-loop turn phrase as the "next episode" tease. */
export function endCardSpec(plan: ExplainerPlan, kit: StyleKit): EndCardSpec {
  const turn = kit.narrativeVoice?.turnPhrases?.[0];
  const nextHook = plan.beats.slice().reverse().find((b) => b.purpose === 'QUESTION' || b.purpose === 'REVEAL')?.narrationText
    || plan.titleCandidates?.slice(-1)[0]
    || turn;
  return {
    title: plan.title.replace(/[?？]+$/, ''),
    cta: kit.narrativeVoice?.bans?.length ? 'Subscribe for the next episode' : 'Subscribe',
    nextHook: nextHook?.split(/[.!?]/)[0]?.trim(),
  };
}

/** Render the end card to a PNG using the kit typography + paper. */
export async function renderEndCard(spec: EndCardSpec, kit: StyleKit, w = 1920, h = 1080): Promise<Buffer> {
  const { composeLayers } = await import('./compositor');
  const { renderTextPng } = await import('./typography');
  const title = await renderTextPng({ text: spec.title, kit, role: 'wordCard', width: w, height: Math.round(h * 0.4) });
  const layers: Array<{ buffer: Buffer; left: number; top: number; width?: number }> = [
    { buffer: title, left: 0, top: Math.round(h * 0.18) },
  ];
  if (spec.nextHook) {
    const hook = await renderTextPng({ text: spec.nextHook, kit, role: 'inSceneWord', width: w, height: Math.round(h * 0.2) });
    layers.push({ buffer: hook, left: 0, top: Math.round(h * 0.58) });
  }
  const cta = await renderTextPng({ text: spec.cta, kit, role: 'arrowLabel', width: w, height: Math.round(h * 0.12) });
  layers.push({ buffer: cta, left: 0, top: Math.round(h * 0.8) });
  return composeLayers({ width: w, height: h, background: { color: kit.paper }, layers });
}

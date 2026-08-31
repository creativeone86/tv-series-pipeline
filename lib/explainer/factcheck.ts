import { callLLMWithFallback } from '@/lib/llm-client';
import { robustJsonParse } from '@/lib/polish-json';
import type { ExplainerBeat, FactCard } from './types';

const AUTHORITY = [
  /doi\.org/i, /nih\.gov/i, /who\.int/i, /nature\.com/i, /science\.org/i,
  /edu\//i, /ac\.uk/i, /museum/i, /jstor/i, /pubmed/i, /arxiv/i,
];

export interface CitationAnnotation {
  url: string;
  title?: string;
  startIndex?: number;
  endIndex?: number;
}

export function deriveFactStatus(card: FactCard, live: boolean): FactCard['status'] {
  if (card.status === 'DISPUTED') return 'DISPUTED';
  if (card.sourceUrl && live) return 'VERIFIED';
  return 'UNVERIFIED';
}

export function rankSourceUrl(url: string): number {
  const i = AUTHORITY.findIndex((re) => re.test(url));
  return i === -1 ? 80 : i;
}

export function dedupeSources(cards: FactCard[]): FactCard[] {
  const seen = new Set<string>();
  const out: FactCard[] = [];
  const sorted = [...cards].sort((a, b) => rankSourceUrl(a.sourceUrl || '') - rankSourceUrl(b.sourceUrl || ''));
  for (const c of sorted) {
    const key = normalizeSourceKey(c.sourceUrl || c.claim);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export function normalizeSourceKey(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

export function sourcesBlockFromCards(cards: FactCard[]): string {
  const verified = dedupeSources(cards.filter((c) => c.status === 'VERIFIED' && c.sourceUrl));
  if (!verified.length) return '';
  return ['Sources', ...verified.map((c, i) => `${i + 1}. ${c.claim} — ${c.sourceTitle || c.sourceUrl} ${c.sourceUrl}`)].join('\n');
}

export async function checkUrlLive(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    if (res.ok || (res.status >= 300 && res.status < 400)) return true;
    if (res.status === 405 || res.status === 403) {
      const getCtl = new AbortController();
      const t2 = setTimeout(() => getCtl.abort(), timeoutMs);
      const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-64' }, signal: getCtl.signal });
      clearTimeout(t2);
      return get.ok;
    }
    return false;
  } catch {
    return false;
  }
}

export function attachCitations(cards: FactCard[], annotations: CitationAnnotation[]): FactCard[] {
  return cards.map((c) => {
    if (c.sourceUrl) return c;
    const hit = annotations.find((a) => c.claim && a.title && c.claim.toLowerCase().includes((a.title || '').toLowerCase().slice(0, 24)))
      || annotations.find((a) => a.url);
    return hit ? { ...c, sourceUrl: hit.url, sourceTitle: hit.title } : c;
  });
}

export async function runFactPass(input: {
  beats: ExplainerBeat[];
  factCards?: FactCard[];
  language: string;
}): Promise<{ cards: FactCard[]; beats: ExplainerBeat[]; sourcesBlock: string }> {
  const cards = input.factCards?.length
    ? input.factCards.slice()
    : input.beats.flatMap((b) => b.claims || extractClaimsFromBeat(b));
  let annotations: CitationAnnotation[] = [];
  if (process.env.MOCK_ENGINES !== '1' && (process.env.OPENAI_API_KEY || process.env.CREATIVE_API_KEY)) {
    const r = await callLLMWithFallback({
      system: 'You are a documentary fact sourcer. Return JSON { cards: FactCard[], annotations: {url,title}[] }. Prefer DOI / journal / university / museum URLs. Never invent a URL.',
      user: `Language: ${input.language}\nClaims:\n${cards.map((c, i) => `${i + 1}. ${c.claim}`).join('\n')}`,
      jsonMode: true,
      model: process.env.EXPLAINER_FACTCHECK_MODEL || 'gpt-5-search-api',
      maxTokens: 4000,
      timeoutMs: 90_000,
    });
    if (r.ok && r.content) {
      const parsed = robustJsonParse(r.content) as any;
      if (Array.isArray(parsed?.annotations)) annotations = parsed.annotations;
      if (Array.isArray(parsed?.cards)) {
        for (const c of parsed.cards) {
          const i = cards.findIndex((x) => x.claim === c.claim);
          if (i >= 0) cards[i] = { ...cards[i], ...c };
        }
      }
    }
  }
  const attached = attachCitations(cards, annotations);
  const liveChecked: FactCard[] = [];
  for (const card of attached) {
    const live = card.sourceUrl ? await checkUrlLive(card.sourceUrl) : false;
    liveChecked.push({ ...card, status: deriveFactStatus(card, live) });
  }
  const beats = input.beats.map((b) => {
    const mine = liveChecked.filter((c) => (b.claims || []).some((x) => x.claim === c.claim) || b.narrationText.includes(c.claim.slice(0, 18)));
    const status = mine.some((c) => c.status === 'DISPUTED')
      ? 'DISPUTED'
      : mine.some((c) => c.status === 'VERIFIED')
        ? 'VERIFIED'
        : mine.length
          ? 'UNVERIFIED'
          : b.factualReviewStatus || 'UNREVIEWED';
    return { ...b, claims: mine.length ? mine : b.claims, factualReviewStatus: status };
  });
  return { cards: liveChecked, beats, sourcesBlock: sourcesBlockFromCards(liveChecked) };
}

function extractClaimsFromBeat(beat: ExplainerBeat): FactCard[] {
  const years = beat.narrationText.match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || [];
  if (!years.length) return [];
  return [{ claim: beat.narrationText.slice(0, 180), year: years[0], confidence: 0.4 }];
}

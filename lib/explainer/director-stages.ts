import { callLLMWithFallback } from '@/lib/llm-client';
import { robustJsonParse } from '@/lib/polish-json';
import { languageDisplayName, normalizeLanguage, type TargetLanguage } from '@/lib/language-detect';
import { llmCostEur } from './cost-rates';
import { deriveSections } from './sections';
import { runFactPass } from './factcheck';
import { runBulgarianQa } from './bulgarian-qa';
import type { ExplainerBeat, ExplainerPlan, ExplainerSection, FactCard, ShotType, VisualIntent } from './types';
import type { ExplainerCategory } from '@/types/agents';

export interface StagedDirectorInput {
  topic: string;
  category?: ExplainerCategory;
  language?: string;
  targetSeconds?: number;
}

export interface StageCost {
  stage: string;
  model?: string;
  promptTokens: number;
  completionTokens: number;
  costEur: number;
}

const PURPOSES = new Set([
  'HOOK', 'QUESTION', 'EXPLANATION', 'ANALOGY', 'DEMONSTRATION',
  'MISCONCEPTION', 'REVEAL', 'EXAMPLE', 'RECAP', 'TRANSITION',
]);

const SHOTS = new Set<ShotType>([
  'WORD_CARD', 'IN_SCENE_WORD', 'TIMELINE', 'MAP', 'MICRO_VIEW',
  'GUIDE_ON_VOID', 'PROP_ON_VOID', 'SCENE', 'ANNOTATED_SCENE', 'ARTIFACT_INSET',
]);

export async function runStagedDirector(input: StagedDirectorInput): Promise<{ plan: ExplainerPlan; costs: StageCost[] }> {
  const language = normalizeLanguage(input.language || 'bg', input.topic);
  const category = input.category || 'GENERAL';
  const targetSeconds = Math.max(60, Math.min(20 * 60, input.targetSeconds || 120));
  const native = languageDisplayName(language);
  const model = process.env.EXPLAINER_DIRECTOR_MODEL || 'gpt-5.6-sol';
  const costs: StageCost[] = [];

  const research = await stageJson({
    stage: 'research',
    model,
    maxTokens: 4000,
    system: `You are a documentary researcher. Return JSON { factCards: FactCard[] }.
FactCard: { claim, person?, year?, place?, number?, mechanism?, surprise, confidence }.
Named people, years, places, mechanisms. No filler. Language of claims: English.`,
    user: `Topic: ${input.topic}\nCategory: ${category}\nTarget: ${targetSeconds}s documentary.`,
  }, costs);

  const factCards: FactCard[] = Array.isArray(research?.factCards) ? research.factCards : [];

  const outline = await stageJson({
    stage: 'outline',
    model,
    maxTokens: 8000,
    system: `You are a documentary outline editor. Structure the episode using four PROVEN, widely-used frameworks (do not invent a bespoke arc):

1) ABT (And, But, Therefore) — Randy Olson's science-communication spine. The WHOLE episode reduces to ONE sentence: "AND [familiar setup]… BUT [the conflict/mystery]… THEREFORE [the resolution]". Each section is itself a small ABT.
2) Problem Stack — order sections as rungs: a surface problem that hides a deeper problem that hides the real resolution. Each section is one rung deeper.
3) Open loops (Zeigarnik effect) — ONE macro loop opened in the first section (~first 15s) and paid off in the last section, PLUS a micro-loop per section: each section closes its own question and immediately seeds the next.
4) Pixar Story Spine — mark ONE section near the resolution as the concrete illustrative story ("Once there was… Every day… Until one day… Because of that… Until finally… Ever since then…").

Return JSON {
  abtThesis: string,            // the single AND/BUT/THEREFORE sentence for the whole episode
  macroOpenLoop: string,        // the promise opened early and paid off at the end
  title, synopsis,
  titleCandidates: string[],    // curiosity-gap questions
  sections: { id, order, title, function, targetSeconds, factIndexes: number[], abt: string, openLoop: string, payoff: string, pixarSpine: boolean }[]
}.
Every non-final section MUST have a non-empty openLoop (the question it hands forward) and a payoff (what it resolves from the previous rung). Register: second-person present, conversational documentary.`,
    user: `Topic: ${input.topic}\nSeconds: ${targetSeconds}\nFacts:\n${factCards.map((c, i) => `${i}. ${c.claim}`).join('\n')}`,
  }, costs);

  const abtThesis = String(outline?.abtThesis || '').trim();
  const macroOpenLoop = String(outline?.macroOpenLoop || '').trim();

  interface SectionMeta { abt: string; openLoop: string; payoff: string; pixarSpine: boolean }
  const sectionMeta = new Map<string, SectionMeta>();
  const sectionsIn: ExplainerSection[] = Array.isArray(outline?.sections)
    ? outline.sections.map((s: any, i: number) => {
      const id = String(s.id || `sec-${i + 1}`);
      sectionMeta.set(id, {
        abt: String(s.abt || '').trim(),
        openLoop: String(s.openLoop || '').trim(),
        payoff: String(s.payoff || '').trim(),
        pixarSpine: s.pixarSpine === true,
      });
      return {
        id,
        order: Number(s.order) || i + 1,
        title: String(s.title || `Section ${i + 1}`),
        function: s.function,
        targetSeconds: Number(s.targetSeconds) || Math.round(targetSeconds / Math.max(1, outline.sections.length)),
        beatIds: [],
        openLoop: typeof s.openLoop === 'string' ? s.openLoop.trim().length > 0 : s.openLoop !== false,
      };
    })
    : [];

  const beats: ExplainerBeat[] = [];
  const sectionList = sectionsIn.length ? sectionsIn : [{ id: 'sec-1', order: 1, title: input.topic, beatIds: [], targetSeconds }];
  for (const section of sectionList) {
    const meta = sectionMeta.get(section.id);
    const isLast = section.order >= sectionList.length;
    const written = await stageJson({
      stage: `beats-${section.id}`,
      model,
      maxTokens: 16000,
      system: `Write spoken documentary narration in ${native}. You are also the "retention wizard": accessible, curiosity-driven, never lecturing.
Return JSON { beats: ExplainerBeat[] }.

PACING & ACCESSIBILITY (hard rules):
- Plain, conversational language for a wide age range. Cut anything you would not say out loud.
- Target ~140-150 words per minute (relaxed, clear — NOT a fast read).
- Each beat is 3-5 spoken sentences, roughly 12-18 seconds. Prefer fuller narration over telegraphic fragments so the voice track reaches the section's target length.
- Ban jargon and over-specific phrasing. If a term is unavoidable, define it inline with an everyday analogy the first time.
- No filler ("as we all know", "in this video", "let us explore").

STRUCTURE (follow the section's frameworks):
- This section's ABT: ${meta?.abt || '(derive one: AND setup, BUT tension, THEREFORE resolution)'}.
- Open its own question, then ${isLast ? 'PAY OFF the macro loop and give a short satisfying recap' : `close it and SEED the next question: ${meta?.openLoop || 'hand a fresh question forward'}`}.
${meta?.payoff ? `- Resolve from the previous rung: ${meta.payoff}.` : ''}
${meta?.pixarSpine ? '- This is the ILLUSTRATIVE STORY section: tell one concrete mini-story using the Pixar Story Spine (Once there was… / Every day… / Until one day… / Because of that… / Until finally… / Ever since then…) as a group of consecutive beats.' : ''}

purpose one of HOOK QUESTION EXPLANATION ANALOGY DEMONSTRATION MISCONCEPTION REVEAL EXAMPLE RECAP TRANSITION.`,
      user: `Episode ABT thesis: ${abtThesis || '(none provided)'}\nMacro open loop: ${macroOpenLoop || '(none provided)'}\nSection: ${section.title} (${section.function || ''})\nTarget seconds: ${section.targetSeconds}\nTopic: ${input.topic}\nFacts: ${JSON.stringify(factCards.slice(0, 12))}`,
    }, costs);
    const chunk = coerceBeats(written?.beats, input.topic, section.id, beats.length);
    section.beatIds = chunk.map((b) => b.id);
    beats.push(...chunk);
  }

  for (const section of sectionList) {
    const mine = beats.filter((b) => b.sectionId === section.id);
    const visual = await stageJson({
      stage: `visual-${section.id}`,
      model,
      maxTokens: 8000,
      system: `Visual pass. Entire output in English. Return JSON { frames: { beatId, frameIndex, shotType, generationPrompt, overlayText, styleTokens }[] }.
shotType one of ${[...SHOTS].join(' ')}.
generationPrompt English only, no on-image text, no letters.
overlayText is in the narration language for the typography layer.`,
      user: mine.map((b) => `${b.id}: ${b.narrationText} | see: ${b.visualGoal}`).join('\n'),
    }, costs);
    const frames = Array.isArray(visual?.frames) ? visual.frames : [];
    for (const b of mine) {
      const own = frames.filter((f: any) => f.beatId === b.id);
      const built = own.length
        ? own.map((f: any, i: number) => ({
          beatId: b.id,
          frameIndex: Number(f.frameIndex) || i,
          shotType: SHOTS.has(f.shotType) ? f.shotType : guessShot(b),
          generationPrompt: String(f.generationPrompt || '').replace(/[\u0400-\u04FF]/g, '').trim() || b.visualIntent.generationPrompt,
          overlayText: f.overlayText,
          styleTokens: f.styleTokens,
        }))
        : [{ beatId: b.id, frameIndex: 0, shotType: guessShot(b), generationPrompt: b.visualIntent.generationPrompt }];
      b.frames = built;
      b.shotType = built[0]?.shotType;
      b.overlayText = built[0]?.overlayText;
      if (built[0]?.generationPrompt) b.visualIntent.generationPrompt = built[0].generationPrompt;
    }
  }

  const fact = await runFactPass({ beats, factCards, language });
  let plan: ExplainerPlan = {
    title: String(outline?.title || input.topic).slice(0, 120),
    synopsis: String(outline?.synopsis || abtThesis || input.topic),
    language,
    category,
    beats: fact.beats,
    sections: sectionList.length ? sectionList : deriveSections(fact.beats, targetSeconds),
    factCards: fact.cards,
    sourcesBlock: fact.sourcesBlock,
    titleCandidates: Array.isArray(outline?.titleCandidates) ? outline.titleCandidates.map(String) : [],
  };
  if (language === 'bg') plan = { ...plan, beats: runBulgarianQa(plan.beats) };
  if (plan.beats.length < 4) {
    plan = { ...plan, beats: fallbackBeats(input.topic, language, category, targetSeconds) };
  }
  try {
    const { auditHooks } = await import('@/lib/hook-audit');
    const { beatsToScript } = await import('./beats');
    auditHooks(beatsToScript(plan));
  } catch { /* retention is validated separately */ }
  return { plan, costs };
}

function guessShot(beat: ExplainerBeat): ShotType {
  const t = `${beat.visualGoal} ${beat.teachingGoal}`.toLowerCase();
  if (/timeline|годин|year/.test(t)) return 'TIMELINE';
  if (/map|карта/.test(t)) return 'MAP';
  if (beat.purpose === 'HOOK' || beat.purpose === 'RECAP') return 'WORD_CARD';
  if (/object|prop|стъкло|книга/.test(t)) return 'PROP_ON_VOID';
  return 'SCENE';
}

async function stageJson(opts: { stage: string; model: string; system: string; user: string; maxTokens: number }, costs: StageCost[]): Promise<any> {
  if (process.env.MOCK_ENGINES === '1' || !hasLlmKey()) return null;
  const r = await callLLMWithFallback({
    system: opts.system,
    user: opts.user,
    jsonMode: true,
    model: opts.model,
    maxTokens: opts.maxTokens,
    timeoutMs: 120_000,
    useCreative: true,
  });
  const promptTokens = Math.round((opts.system.length + opts.user.length) / 4);
  const completionTokens = Math.round((r.content || '').length / 4);
  costs.push({
    stage: opts.stage,
    model: r.model || opts.model,
    promptTokens,
    completionTokens,
    costEur: llmCostEur(promptTokens, completionTokens),
  });
  if (!r.ok || !r.content) return null;
  return robustJsonParse(r.content);
}

function hasLlmKey(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.CREATIVE_API_KEY || process.env.DEEPSEEK_API_KEY);
}

function coerceBeats(raw: any, topic: string, sectionId: string, start: number): ExplainerBeat[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b: any, i: number) => {
    const purpose = PURPOSES.has(String(b?.purpose)) ? b.purpose : 'EXPLANATION';
    const entities = Array.isArray(b?.activeEntities) ? b.activeEntities.map(String) : ['GUIDE_CHARACTER'];
    const vi = b?.visualIntent && typeof b.visualIntent === 'object' ? b.visualIntent : {};
    const visual: VisualIntent = {
      type: vi.type || 'ILLUSTRATION',
      subject: String(vi.subject || b?.visualGoal || topic),
      teachingGoal: String(vi.teachingGoal || b?.teachingGoal || ''),
      generationPrompt: String(vi.generationPrompt || b?.visualGoal || topic),
      activeEntities: entities,
      motion: vi.motion || { type: 'PUSH_IN' },
    };
    return {
      id: String(b?.id || `beat-${start + i + 1}`),
      order: start + i + 1,
      narrationText: String(b?.narrationText || b?.narration || '').trim(),
      purpose,
      teachingGoal: String(b?.teachingGoal || '').trim(),
      visualGoal: String(b?.visualGoal || visual.subject),
      activeEntities: entities,
      importance: clamp01(b?.importance),
      visualIntent: visual,
      estimatedDuration: Number(b?.estimatedDuration) || 10,
      factualReviewStatus: 'UNREVIEWED' as const,
      sectionId,
    };
  }).filter((b: ExplainerBeat) => b.narrationText.length > 0);
}

function fallbackBeats(topic: string, language: TargetLanguage, _category: ExplainerCategory, targetSeconds: number): ExplainerBeat[] {
  const n = Math.max(8, Math.min(22, Math.round(targetSeconds / 11)));
  return Array.from({ length: n }, (_, i) => ({
    id: `beat-${i + 1}`,
    order: i + 1,
    narrationText: language === 'bg' ? `${topic}. Част ${i + 1}.` : `${topic}. Part ${i + 1}.`,
    purpose: i === 0 ? 'HOOK' : i === n - 1 ? 'RECAP' : 'EXPLANATION',
    teachingGoal: topic,
    visualGoal: topic,
    activeEntities: ['GUIDE_CHARACTER'],
    importance: i === 0 ? 0.9 : 0.5,
    visualIntent: { type: 'ILLUSTRATION', subject: topic, teachingGoal: topic, generationPrompt: `simple educational illustration of ${topic}` },
    estimatedDuration: 10,
    factualReviewStatus: 'UNREVIEWED',
    sectionId: `sec-${Math.floor(i / 4) + 1}`,
  })) as ExplainerBeat[];
}

function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(1, Math.max(0, v));
}

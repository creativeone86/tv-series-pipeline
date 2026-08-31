import { normalizeLanguage } from '@/lib/language-detect';
import { looksLikeMoonTopic, moonPocPlan } from './poc-moon';
import { runStagedDirector } from './director-stages';
import { explainerDirectorSystemPrompt, explainerDirectorUserPrompt } from './director-prompt';
import { callLLMWithFallback } from '@/lib/llm-client';
import { robustJsonParse } from '@/lib/polish-json';
import type { ExplainerBeat, ExplainerPlan, VisualIntent } from './types';
import type { ExplainerCategory } from '@/types/agents';
import { languageDisplayName, type TargetLanguage } from '@/lib/language-detect';

export interface DirectExplainerInput {
  topic: string;
  category?: ExplainerCategory;
  language?: string;
  targetSeconds?: number;
}

const PURPOSES = new Set([
  'HOOK', 'QUESTION', 'EXPLANATION', 'ANALOGY', 'DEMONSTRATION',
  'MISCONCEPTION', 'REVEAL', 'EXAMPLE', 'RECAP', 'TRANSITION',
]);

export async function directExplainer(input: DirectExplainerInput): Promise<ExplainerPlan> {
  const language = normalizeLanguage(input.language || 'bg', input.topic);
  const category = input.category || 'GENERAL';
  const targetSeconds = Math.max(45, Math.min(20 * 60, input.targetSeconds || 120));

  if (looksLikeMoonTopic(input.topic) && (process.env.MOCK_ENGINES === '1' || process.env.EXPLAINER_USE_POC_FIXTURE === '1')) {
    return { ...moonPocPlan(), language, category: category === 'GENERAL' ? 'PHYSICS' : category };
  }

  if (process.env.EXPLAINER_STAGED_DIRECTOR !== '0' && process.env.MOCK_ENGINES !== '1') {
    try {
      const staged = await runStagedDirector({ ...input, language, category, targetSeconds });
      if (staged.plan.beats.length >= 4) return { ...staged.plan, llmCosts: staged.costs };
    } catch (e) {
      console.warn('[explainer] staged director failed, falling back', e instanceof Error ? e.message : e);
    }
  }

  if (process.env.MOCK_ENGINES === '1' || !hasLlmKey()) {
    return fallbackPlan(input.topic, language, category, targetSeconds);
  }

  const native = languageDisplayName(language);
  const r = await callLLMWithFallback({
    system: explainerDirectorSystemPrompt(native),
    user: explainerDirectorUserPrompt({ topic: input.topic, category, targetSeconds, language }),
    useCreative: true,
    jsonMode: true,
    model: process.env.EXPLAINER_DIRECTOR_MODEL || 'gpt-5.6-sol',
    maxTokens: 8000,
    timeoutMs: 90_000,
  });
  if (!r.ok || !r.content) return fallbackPlan(input.topic, language, category, targetSeconds);
  const parsed = robustJsonParse(r.content);
  const plan = coercePlan(parsed, input.topic, language, category);
  return plan.beats.length >= 4 ? plan : fallbackPlan(input.topic, language, category, targetSeconds);
}

function hasLlmKey(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.CREATIVE_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.LLM_FALLBACK_API_KEY);
}

function fallbackPlan(topic: string, language: TargetLanguage, category: ExplainerCategory, targetSeconds: number): ExplainerPlan {
  if (looksLikeMoonTopic(topic)) return { ...moonPocPlan(), language, category: 'PHYSICS' };
  const hook = language === 'bg' ? `Защо ${topic}?` : `Why ${topic}?`;
  const recap = language === 'bg' ? 'Ето го отново с едно изречение.' : 'Here it is again in one sentence.';
  const beats: ExplainerBeat[] = [
    simpleBeat('b1', 1, 'HOOK', hook, topic),
    simpleBeat('b2', 2, 'EXPLANATION', topic, topic),
    simpleBeat('b3', 3, 'ANALOGY', topic, topic),
    simpleBeat('b4', 4, 'RECAP', recap, topic),
  ];
  void targetSeconds;
  return { title: topic.slice(0, 80), synopsis: topic, language, category, beats };
}

function simpleBeat(id: string, order: number, purpose: ExplainerBeat['purpose'], narration: string, topic: string): ExplainerBeat {
  const visual: VisualIntent = {
    type: 'ILLUSTRATION',
    subject: topic,
    teachingGoal: narration,
    generationPrompt: `simple educational illustration of: ${topic}`,
    activeEntities: ['GUIDE_CHARACTER'],
    motion: { type: 'PUSH_IN' },
  };
  return {
    id, order, narrationText: narration, purpose,
    teachingGoal: narration, visualGoal: visual.subject,
    activeEntities: ['GUIDE_CHARACTER'], importance: purpose === 'HOOK' ? 0.8 : 0.5,
    visualIntent: visual, estimatedDuration: 8, factualReviewStatus: 'UNREVIEWED',
  };
}

function coercePlan(raw: any, topic: string, language: TargetLanguage, category: ExplainerCategory): ExplainerPlan {
  const beatsIn = Array.isArray(raw?.beats) ? raw.beats : [];
  const beats: ExplainerBeat[] = beatsIn.map((b: any, i: number) => {
    const purpose = PURPOSES.has(String(b?.purpose)) ? b.purpose : 'EXPLANATION';
    const entities = Array.isArray(b?.activeEntities)
      ? b.activeEntities.map((x: unknown) => String(x || '').trim()).filter(Boolean)
      : [];
    const vi = b?.visualIntent && typeof b.visualIntent === 'object' ? b.visualIntent : {};
    return {
      id: String(b?.id || `beat-${i + 1}`),
      order: Number(b?.order) || i + 1,
      narrationText: String(b?.narrationText || b?.narration || '').trim(),
      purpose,
      teachingGoal: String(b?.teachingGoal || '').trim(),
      visualGoal: String(b?.visualGoal || vi.subject || '').trim(),
      activeEntities: entities,
      importance: clamp01(b?.importance),
      visualIntent: {
        type: vi.type || 'ILLUSTRATION',
        subject: String(vi.subject || b?.visualGoal || topic),
        teachingGoal: String(vi.teachingGoal || b?.teachingGoal || ''),
        searchQueries: Array.isArray(vi.searchQueries) ? vi.searchQueries.map(String) : undefined,
        motion: vi.motion,
        generationPrompt: vi.generationPrompt || b?.visualGoal,
        activeEntities: entities,
      },
      estimatedDuration: Number(b?.estimatedDuration) || 8,
      factualReviewStatus: 'UNREVIEWED',
    };
  }).filter((b: ExplainerBeat) => b.narrationText.length > 0);
  return {
    title: String(raw?.title || topic).slice(0, 120),
    synopsis: String(raw?.synopsis || topic),
    language,
    category,
    beats,
  };
}

function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(1, Math.max(0, v));
}

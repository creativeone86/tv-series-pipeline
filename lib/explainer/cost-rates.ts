/**
 * Provider-accurate rates for explainer preflight. Env-overridable.
 * Values are EUR — the explainer episode budget is denominated in EUR.
 */

const n = (envName: string, fallback: number) => {
  const v = Number(process.env[envName]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const usdToEur = () => n('USD_EUR_RATE', 0.92);

export function gptImageCostEur(size: '1024' | '1536' | '2048' = '1536', quality: 'low' | 'medium' | 'high' = 'medium'): number {
  // gpt-image-1 approximate USD list, converted to EUR.
  const usd: Record<string, number> = {
    '1024-low': 0.011, '1024-medium': 0.042, '1024-high': 0.167,
    '1536-low': 0.016, '1536-medium': 0.063, '1536-high': 0.25,
    '2048-low': 0.02, '2048-medium': 0.08, '2048-high': 0.32,
  };
  const override = n('EXPLAINER_IMAGE_EUR', 0);
  if (override > 0) return override;
  return round4((usd[`${size}-${quality}`] ?? 0.063) * usdToEur());
}

export function elevenLabsCostEur(chars: number, model = 'eleven_multilingual_v2'): number {
  const perK = n('EXPLAINER_ELEVENLABS_EUR_PER_1K', model.includes('turbo') ? 0.09 : 0.14);
  return round4((Math.max(0, chars) / 1000) * perK);
}

export function googleTtsCostEur(chars: number): number {
  return round4((Math.max(0, chars) / 1_000_000) * n('EXPLAINER_GOOGLE_TTS_EUR_PER_M', 3.6));
}

export function llmCostEur(promptTokens: number, completionTokens: number): number {
  const inRate = n('EXPLAINER_LLM_IN_EUR_PER_1K', 0.0026);
  const outRate = n('EXPLAINER_LLM_OUT_EUR_PER_1K', 0.01);
  return round4((promptTokens / 1000) * inRate + (completionTokens / 1000) * outRate);
}

export function estimateBeatTtsEur(text: string, provider = 'elevenlabs'): number {
  const chars = (text || '').length;
  return provider === 'google-cloud-tts' ? googleTtsCostEur(chars) : elevenLabsCostEur(chars);
}

/** Map an explicit size string ('1024x1024', '1536x1024', ...) to the cost-table bucket. */
function sizeBucket(size?: string): '1024' | '1536' | '2048' {
  const s = (size || process.env.EXPLAINER_IMAGE_SIZE || '1024x1024').toLowerCase();
  if (s.includes('2048')) return '2048';
  if (s.includes('1536')) return '1536';
  return '1024';
}

function qualityBucket(q?: string): 'low' | 'medium' | 'high' {
  const v = (q || process.env.EXPLAINER_IMAGE_QUALITY || 'medium').toLowerCase();
  if (v === 'low') return 'low';
  if (v === 'high') return 'high';
  return 'medium'; // treat 'auto' as medium for estimation
}

/**
 * Estimate the true EUR cost of an image op using the SAME size/quality the
 * provider will actually request (env-driven), so cost_log and the budget
 * governor brake reflect reality instead of a fake-cheap constant.
 */
export function estimateImageEur(strategy: string, opts?: { size?: string; quality?: string }): number {
  if (strategy !== 'GENERATE_NEW' && strategy !== 'GENERATE_FROM_REFERENCES' && strategy !== 'EDIT_PREVIOUS_FRAME') {
    return 0;
  }
  return gptImageCostEur(sizeBucket(opts?.size), qualityBucket(opts?.quality));
}

function round4(n0: number): number {
  return Math.round((n0 + Number.EPSILON) * 10000) / 10000;
}

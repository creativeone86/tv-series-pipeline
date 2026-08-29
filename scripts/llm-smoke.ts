/**
 * LLM smoke test — exercises the real call path (attempt chain + parameter dialect)
 * against the configured endpoints, so a bad model/base-URL pairing shows up here
 * instead of mid-pipeline.
 *
 *   npm run llm:smoke              # general + creative + creative-fast
 *   npm run llm:smoke -- creative  # one lane only
 */
import { resolve } from 'node:path';

try { process.loadEnvFile(resolve('.env.local')); } catch { /* fall back to real env */ }

type Lane = 'general' | 'creative' | 'fast';

async function main() {
  const { API_CONFIG } = await import('../lib/config');
  const { buildLLMAttempts, callLLMWithFallback } = await import('../lib/llm-client');
  const cfg = API_CONFIG.openai;

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-')) as Lane[];
  const lanes: Lane[] = only.length ? only : ['general', 'creative', 'fast'];

  console.log('=== resolved config ===');
  console.log(`general  : ${cfg.model}   @ ${cfg.baseURL}`);
  console.log(`creative : ${cfg.creativeModel}   @ ${cfg.creativeBaseURL}`);
  console.log(`fast     : ${cfg.creativeFastModel}   @ ${cfg.creativeBaseURL}`);
  console.log(`fallback : ${cfg.fallbackModel}   @ ${cfg.fallbackBaseURL}  (key=${cfg.fallbackApiKey ? 'set' : 'none'})`);

  let failed = 0;

  for (const lane of lanes) {
    const useCreative = lane !== 'general';
    const fast = lane === 'fast';
    const chain = buildLLMAttempts(useCreative, cfg, fast);

    console.log(`\n=== ${lane} ===`);
    console.log(`chain: ${chain.map((a) => `${a.label}(${a.model})`).join(' → ') || '(empty)'}`);

    const t0 = Date.now();
    const res = await callLLMWithFallback({
      system: 'You reply with strict JSON only.',
      user: 'Reply with exactly {"ok":true} and nothing else.',
      useCreative,
      fast,
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.7, // dropped automatically for reasoning models
      timeoutMs: 90_000,
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    if (res.ok) {
      console.log(`PASS  ${secs}s  model=${res.model}  fallback=${res.usedFallback}  ${String(res.content).trim().slice(0, 80)}`);
    } else {
      failed++;
      console.log(`FAIL  ${secs}s  ${res.error}`);
      console.log(`      tried: ${(res.attemptsTried || []).join(', ')}`);
    }
  }

  console.log(`\n${failed === 0 ? 'All lanes OK' : `${failed} lane(s) failing`}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

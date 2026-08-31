# Explainer Cost Model

> Currency: **all money in this app is EUR**. Both drama and narrated-explainer modes write
> EUR into the shared `cost_log.cost_eur` ledger, and every read/compare is EUR-consistent.
> (Historical CNY rows and caps were migrated in `lib/db.ts` at 1 CNY ≈ €0.1278.)

## Rates

[`lib/explainer/cost-rates.ts`](../lib/explainer/cost-rates.ts) — provider-shaped, env-overridable, always EUR:

| Kind | Function | Env override |
|---|---|---|
| gpt-image-1 | `gptImageCostEur(size, quality)` | `EXPLAINER_IMAGE_EUR`, `USD_EUR_RATE` |
| ElevenLabs | `elevenLabsCostEur(chars)` | `EXPLAINER_ELEVENLABS_EUR_PER_1K` |
| Google TTS | `googleTtsCostEur(chars)` | `EXPLAINER_GOOGLE_TTS_EUR_PER_M` |
| LLM | `llmCostEur(in, out)` | `EXPLAINER_LLM_IN_EUR_PER_1K` / `_OUT_` |

`estimateImageEur('GENERATE_NEW')` uses medium 1536; edit / ref-generate uses low.

## Episode cap

`projects.output_config.explainer.capEur` / `hardCapEur`. Live spend is `listCostLogByProject`.

## Governor

[`lib/explainer/budget-governor.ts`](../lib/explainer/budget-governor.ts) subtracts projected TTS (`reserveTtsEur`) from the cap before releasing image budget, then maps `evaluateBudgetGuard` levels (that guard is currency-agnostic — its `*Cny` param keys carry EUR values here):

| Level | Allowed paid strategies |
|---|---|
| `ok` / `none` | edit, generate-from-refs, generate-new |
| `warn` | same, but `GENERATE_NEW` only if `importance >= 0.75` |
| `soft_over` | `EDIT_PREVIOUS_FRAME` only |
| `hard_block` | free rungs only |

A beat that cannot pay is `UNRESOLVED` with `blockedCostEur` — visible in the review tab, never a silent upgrade or a thrown pipeline.

Preflight (`estimatePreflight`) is shown in the beat tab header: vocab / compose / svg / generate counts and projected totals. Real spend lands in `cost_log` (`tts-*`, `image-*`) and is attributed per beat.

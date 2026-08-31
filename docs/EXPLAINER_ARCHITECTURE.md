# Explainer Architecture

`narrated-explainer` is a sixth `CreationMode`. It reuses WindComic projects, assets, image/TTS registries, the duration-driven composer, and `cost_log`. It does not run the McKee drama loop, lipsync, or video engines.

## Pipeline

```
Topic + language + category
  → Explainer Director (1 LLM call, or Moon fixture)
  → ScriptShot[] in project_assets type=script
  → project_review_status gate
  → dispatchTTSGenerate (tts_cache + persistAsset)
  → Vocabulary resolver (governor ∩ ladder)
  → stillFrameToVideo Ken Burns
  → composeVideo (dialogue = narrationText, optional 1920×1080)
```

Entry points:

- `runCreatePipeline` branches when `mode === 'narrated-explainer'` ([`lib/create-pipeline.ts`](../lib/create-pipeline.ts)).
- `runExplainerPipeline` in [`lib/explainer/pipeline.ts`](../lib/explainer/pipeline.ts) is the staged runner (`skipTts` / `skipResolve` / `skipRender`).
- HTTP: `POST /api/explainer/create`, `POST /api/create-stream`, and `/api/projects/[id]/explainer/{plan,tts,resolve,promote,render}`.

## What is reused

- `projects.mode` + `projects.output_config.explainer`
- `project_assets` script / storyboard / shot-audio / final_video
- `dispatchImageGenerate` / `dispatchTTSGenerate`
- `composeVideo` + `stillFrameToVideo` + Ken Burns
- `evaluateBudgetGuard` levels
- `global_assets` + `series_anchors.canonicalEntities`
- Review states in `project_review_status`

## What is new

| Piece | Path |
|---|---|
| Director | `lib/explainer/director.ts` |
| Vocabulary helpers | `lib/explainer/vocabulary-repo.ts` |
| SVG + compositor | `lib/explainer/svg.ts`, `lib/explainer/compositor.ts` |
| Governor + rates | `lib/explainer/budget-governor.ts`, `lib/explainer/cost-rates.ts` |
| Resolver | `lib/explainer/resolver.ts` |
| TTS cache | `tts_cache` table + `lib/tts-cache.ts` |

Drama paths are byte-identical unless they opt into `ComposeOptions.outputSize`. Default 16:9 remains 1280×720.

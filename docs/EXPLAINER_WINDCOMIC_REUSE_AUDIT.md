# Explainer WindComic Reuse Audit

Local source is the authority. This document maps every `NARRATED_EXPLAINER` requirement onto the current repo as of the audit date. Classification:

- **REUSE_UNCHANGED** — call as-is
- **EXTEND_EXISTING** — additive change to an existing type, table, or function
- **ADAPTER_REQUIRED** — wrap existing machinery with explainer-specific policy
- **NEW_COMPONENT_REQUIRED** — no existing abstraction can represent this cleanly

Drama mode is not rewritten. McKee prompts, cameo retry, per-shot vision audit, lipsync, and the video-engine chain stay untouched.

---

## 1. Project / domain model

| Requirement | Class | Evidence |
|---|---|---|
| Production mode discriminator | **EXTEND_EXISTING** | `CreationMode` in [`types/agents.ts`](../types/agents.ts) already has `episodic \| mv \| quick \| comic-to-video \| ip-derivative`. Stored in `projects.mode` ([`lib/db.ts`](../lib/db.ts) `addColumnIfMissing`). Add `'narrated-explainer'`. |
| Category | **NEW_COMPONENT_REQUIRED** (type only) | No category enum exists. Add `ExplainerCategory` as a string union; persist inside `projects.output_config` (existing JSON column). Do not add a table. |
| Episode settings (language, duration, budget cap) | **EXTEND_EXISTING** | [`ProjectOutputConfig`](../types/agents.ts) already has `resolution`, `aspectRatio`, `targetDuration`. Extend it. Persist via `projects.output_config`. |
| Script / shot persistence | **REUSE_UNCHANGED** | No `shots` table. Scripts live in `project_assets` (`type='script'`) and `projects.script_data`. |
| Review states | **REUSE_UNCHANGED** | [`lib/review-status.ts`](../lib/review-status.ts): `draft → in_review → approved \| changes_requested`. |

## 2. Agents / Director / Writer

| Requirement | Class | Evidence |
|---|---|---|
| Drama 8-agent loop | **NOT REUSED** | [`services/hybrid-orchestrator.ts`](../services/hybrid-orchestrator.ts) + McKee prompts in [`lib/mckee-skill.ts`](../lib/mckee-skill.ts). Wrong assumptions (three-act drama, character sheets, video producer). |
| Pipeline skip pattern | **ADAPTER_REQUIRED** | [`lib/create-pipeline.ts`](../lib/create-pipeline.ts) already skips Director/Writer when `replicaScript` is set. Explainer mode uses the same early-branch pattern. |
| LLM plumbing | **REUSE_UNCHANGED** | [`lib/llm-client.ts`](../lib/llm-client.ts) `callLLMWithFallback` + [`lib/polish-json.ts`](../lib/polish-json.ts) `robustJsonParse`. |
| Explainer Director | **NEW_COMPONENT_REQUIRED** | One structured call. No existing strategy registry. |

## 3. Semantic beats / storyboard

| Requirement | Class | Evidence |
|---|---|---|
| Beat as a shot | **EXTEND_EXISTING** | [`ScriptShot`](../types/agents.ts) already has `dialogue`, `duration`, `visualPrompt`, `transition`. Add optional explainer fields (`narrationText`, `purpose`, `teachingGoal`, `visualIntent`, …). Existing storyboard / timeline / regen tools keep working. |
| Storyboard editor | **REUSE_UNCHANGED** | `/projects/[id]` storyboard + workshop tabs consume `script.shots`. |

## 4. Visual vocabulary / asset memory

| Requirement | Class | Evidence |
|---|---|---|
| Canonical named entities | **EXTEND_EXISTING** | [`global_assets`](../lib/db.ts) + [`GlobalAsset.metadata`](../types/agents.ts). Types already include `character \| scene \| style \| prop \| template`. Vocabulary lives in `metadata.vocabulary`. **No new table.** |
| Cross-episode memory | **EXTEND_EXISTING** | [`series_anchors.data`](../lib/repos/series-repo.ts) already carries `lockedCharacters`, `styleAnchorUrl`. Add `canonicalEntities`. |
| Semantic search | **REUSE_UNCHANGED** | [`findSimilarGlobalAssets`](../lib/repos/global-asset-repo.ts) cosine search + [`embedAsset`](../lib/asset-embedding.ts). Today only `upsertCharacterBible` embeds — promotion must call `embedAsset`. |
| Character lock / cref-sref | **REUSE_UNCHANGED** | [`pickConsistencyRefs`](../lib/consistency-policy.ts) + [`prependStyleAnchor`](../lib/style-bible.ts). |
| Approval / promotion | **NEW_COMPONENT_REQUIRED** (helpers only) | `global_assets` has no `approved` / scope. `project_assets.confirmed` is per-project, not vocabulary. Helpers wrap existing repo. |
| Runtime auto-load of vocabulary | **ADAPTER_REQUIRED** | Global assets are not injected into the orchestrator today. Explainer resolver loads them explicitly. |

## 5. Image generation

| Requirement | Class | Evidence |
|---|---|---|
| Provider interface | **REUSE_UNCHANGED** | [`ImageGenerateInput`](../lib/image-providers/types.ts): `prompt`, `referenceImages[]`, `cref`, `sref`, `cw`. `openai-gpt-image` supports `/images/edits` i2i, `maxRefImages: 16`. |
| ComfyUI | **REUSE_UNCHANGED** | [`services/comfyui.service.ts`](../services/comfyui.service.ts) exists, not registered as `ImageProvider`. Later GPU path wraps it; domain logic stays provider-agnostic. |
| Prompt compiler | **ADAPTER_REQUIRED** | [`getUnifiedStoryboardRenderPrompt`](../lib/mckee-skill.ts) is drama-shaped. Explainer compiles bible + entities + beat, then calls `dispatchImageGenerate`. |
| Layer compositor | **NEW_COMPONENT_REQUIRED** | `sharp` is used only for comic panel crop ([`lib/comic-crop.ts`](../lib/comic-crop.ts)). No `.composite()` in production. |

## 6. Deterministic graphics

| Requirement | Class | Evidence |
|---|---|---|
| SVG / diagram / chess / math | **NEW_COMPONENT_REQUIRED** | No diagram, chess, or math renderer exists. `sharp` can rasterize SVG — no new dependency. |

## 7. TTS / narration

| Requirement | Class | Evidence |
|---|---|---|
| TTS plugin interface | **REUSE_UNCHANGED** | [`dispatchTTSGenerate`](../lib/tts-providers/registry.ts). ElevenLabs `supportedLanguages: []` already accepts Bulgarian. |
| Google Cloud TTS | **NEW_COMPONENT_REQUIRED** | No provider file. Add `lib/tts-providers/google-cloud-tts.ts` in the existing registry. |
| TTS cache | **NEW_COMPONENT_REQUIRED** | Confirmed absent. `persistAsset` only content-hashes *after* synthesis. Hook cache inside `dispatchTTSGenerate` so every call site benefits. |
| Narration track | **REUSE_UNCHANGED** | [`lib/narration-timeline.ts`](../lib/narration-timeline.ts), [`lib/narration-synth.ts`](../lib/narration-synth.ts), `ComposerClip.voiceoverUrl`. |
| Duration probe | **REUSE_UNCHANGED** | [`probeAudioDurationBuffer`](../lib/audio-duration.ts). ElevenLabs already uses it. |
| Bulgarian language routing | **EXTEND_EXISTING** | [`TargetLanguage`](../lib/language-detect.ts) has no `bg`. `detectLanguage()` returns `'zh'` for Cyrillic (neither CJK nor Latin). Silent `zh-CN` TTS. `sniffTextLanguage` already counts Cyrillic. |

## 8. Timeline / FFmpeg / subtitles

| Requirement | Class | Evidence |
|---|---|---|
| Per-clip duration | **REUSE_UNCHANGED** | [`ComposerClip.duration`](../services/video-composer.ts). Composer trims to it. |
| Image motion | **REUSE_UNCHANGED** | `stillFrameToVideo` + `kenBurnsFilter` (`in` / `out` / `pan`). MV compose already feeds `(image, duration, motion)` tuples. |
| Narration-led timing | **ADAPTER_REQUIRED** | Editor currently *fits TTS into* `shot.duration` (`fitSpeechToShot`). Explainer sets `duration = probed audio`. |
| Subtitles | **REUSE_UNCHANGED** | `clip.dialogue` → `buildSrt` → libass. Put `narrationText` in `dialogue`. |
| 1920×1080 | **EXTEND_EXISTING** | [`dimsForAspect`](../lib/video-reframe.ts) hardcodes 16:9 → 1280×720. Add optional explicit size on `ComposeOptions`. Default unchanged so drama is byte-identical. |
| Cyrillic font | **EXTEND_EXISTING** | [`findCjkFont`](../lib/text-control.ts). Noto Sans CJK includes Cyrillic; add a general subtitle-font resolver + `SUBTITLE_FONT_FILE`. |
| BGM ducking | **REUSE_UNCHANGED** | [`lib/audio-ducking.ts`](../lib/audio-ducking.ts) `sidechaincompress`. |
| Paid music | **NOT USED** | MiniMax music stays drama-only. Explainer uses local/free BGM. |

## 9. Cost / budget

| Requirement | Class | Evidence |
|---|---|---|
| Spend ledger | **REUSE_UNCHANGED** | `cost_log` + [`recordCostLog`](../lib/repos/cost-log-repo.ts) + [`listCostLogByProject`](../lib/repos/cost-log-repo.ts). |
| Saturation gradient | **REUSE_UNCHANGED** (function) | [`evaluateBudgetGuard`](../lib/budget-guard.ts): `none \| ok \| warn \| soft_over \| hard_block`. |
| Monthly user cap | **REUSE_UNCHANGED** | `users.budget_cap_eur` / `budget_hard_cap_eur` via `assertBudget` (all money app-wide is EUR). |
| Per-episode cap | **EXTEND_EXISTING** | Does not exist. Store `capEur` / `hardCapEur` (EUR) in `output_config`. |
| Accurate rate table | **NEW_COMPONENT_REQUIRED** | [`estimatePipelineCostEur`](../lib/budget-estimate.ts) uses drama placeholders (`IMAGE_EUR_PER_SHOT = 0.0575`, `AUDIO_EUR_PER_SHOT = 0.0128`). Unusable per-beat. |
| Live mid-run governor | **NEW_COMPONENT_REQUIRED** | Spend is pre-flight + post-hoc only. |

## 10. Jobs / persistence / UI

| Requirement | Class | Evidence |
|---|---|---|
| SSE pipeline | **REUSE_UNCHANGED** | `/api/create-stream` + optional `PIPELINE_QUEUE=1`. |
| Asset blob storage | **REUSE_UNCHANGED** | [`persistAsset`](../lib/asset-storage.ts) + `/api/serve-file`. |
| Create UI pattern | **ADAPTER_REQUIRED** | New `/dashboard/explainer` following `/dashboard/short-video`. Sidebar + `lib/i18n.ts`. |
| Beat review | **ADAPTER_REQUIRED** | New tab on `/projects/[id]` reusing cinema cards. Existing `cost-attribution-panel` is the meter model. |
| Mode picker | **EXTEND_EXISTING** | [`MODE_PRESETS`](../components/creation/ModeCard.tsx) / `ALL_MODES`. |

## 11. Files to add

```
docs/EXPLAINER_WINDCOMIC_REUSE_AUDIT.md   (this file)
docs/EXPLAINER_ARCHITECTURE.md
docs/VISUAL_VOCABULARY.md
docs/VISUAL_CONTINUITY.md
docs/EXPLAINER_PROVIDER_STRATEGY.md
docs/EXPLAINER_COST_MODEL.md
docs/EXPLAINER_POC.md

lib/explainer/types.ts
lib/explainer/director-prompt.ts
lib/explainer/director.ts
lib/explainer/beats.ts
lib/explainer/vocabulary-repo.ts
lib/explainer/svg.ts
lib/explainer/compositor.ts
lib/explainer/cost-rates.ts
lib/explainer/budget-governor.ts
lib/explainer/resolver.ts
lib/explainer/prompt-compiler.ts
lib/explainer/pipeline.ts
lib/explainer/poc-moon.ts
lib/tts-cache.ts
lib/tts-providers/google-cloud-tts.ts
app/dashboard/explainer/page.tsx
app/api/explainer/create/route.ts
app/api/projects/[id]/explainer/route.ts
app/api/projects/[id]/explainer/plan/route.ts
app/api/projects/[id]/explainer/tts/route.ts
app/api/projects/[id]/explainer/resolve/route.ts
app/api/projects/[id]/explainer/promote/route.ts
app/api/projects/[id]/explainer/render/route.ts
components/project/explainer-beats-tab.tsx
tests/explainer-*.test.ts
```

## 12. Files to modify (additive)

- [`types/agents.ts`](../types/agents.ts) — `CreationMode`, `ScriptShot`, `ProjectOutputConfig`
- [`lib/language-detect.ts`](../lib/language-detect.ts) — `bg` + Cyrillic detect
- [`lib/db.ts`](../lib/db.ts) — `tts_cache` table
- [`lib/tts-providers/registry.ts`](../lib/tts-providers/registry.ts) — cache hook
- [`lib/tts-providers/builtins.ts`](../lib/tts-providers/builtins.ts) — import Google TTS
- [`lib/create-pipeline.ts`](../lib/create-pipeline.ts) — explainer branch
- [`lib/repos/project-repo.ts`](../lib/repos/project-repo.ts) — whitelist `mode`, `output_config`
- [`lib/video-reframe.ts`](../lib/video-reframe.ts) / [`services/video-composer.ts`](../services/video-composer.ts) — optional 1080p
- [`lib/text-control.ts`](../lib/text-control.ts) — subtitle font resolver
- [`components/creation/ModeCard.tsx`](../components/creation/ModeCard.tsx)
- [`components/sidebar.tsx`](../components/sidebar.tsx)
- [`lib/i18n.ts`](../lib/i18n.ts)
- [`app/projects/[id]/page.tsx`](../app/projects/[id]/page.tsx)
- [`app/api/create-stream/route.ts`](../app/api/create-stream/route.ts)
- [`tests/mode-card.test.tsx`](../tests/mode-card.test.tsx)

## 13. Migration risks

- SQLite schema evolves via `CREATE TABLE IF NOT EXISTS` + `addColumnIfMissing` in `lib/db.ts`. Postgres is re-exported by `npm run pg:migrate`. Additive only.
- `CreationMode` is a closed TypeScript union; every `Record<CreationMode, …>` (ModeCard, i18n keys, tests asserting length 5) must be updated together.
- `detectLanguage` change must keep existing tests: empty/punctuation still `'zh'`; Latin still `'en'`; CJK still `'zh'`.
- Composer canvas default stays 1280×720. Explicit size is opt-in.
- TTS cache must accept `/api/serve-file` URLs; current registry only allows `http` / `data:audio`.

## 14. Tests affected

- [`tests/mode-card.test.tsx`](../tests/mode-card.test.tsx) — `ALL_MODES` length 5 → 6
- [`tests/v12-6-1-language-detect.test.ts`](../tests/v12-6-1-language-detect.test.ts) — add bg / Cyrillic cases
- [`tests/v12-134-language-select.test.ts`](../tests/v12-134-language-select.test.ts) — registry now includes `bg`
- i18n leaf-path tests — new keys must exist on zh-CN and en (other locales deep-merge from en)
- New: `tests/explainer-*.test.ts`, `tests/tts-cache.test.ts`, `tests/google-cloud-tts.test.ts`

## 15. Answers the prompt asked for

1. **Unchanged:** composer, Ken Burns, image/TTS registries, global asset search, cost_log, budget-guard function, review-status, persistAsset, SSE, ducking, narration timeline helpers.
2. **Small extensions:** `CreationMode`, `TargetLanguage`, `ScriptShot`, `ProjectOutputConfig`, `series_anchors`, `dimsForAspect` / `ComposeOptions`, subtitle font, ModeCard, create-pipeline branch.
3. **Unavoidable new:** explainer director, vocabulary helpers, SVG renderer, sharp compositor, TTS cache table, Google TTS provider, rate table + episode governor, resolver, explainer UI.
4. **Vocabulary representation:** `global_assets.metadata.vocabulary` + `series_anchors.data.canonicalEntities`. Same files, same embeddings, same usage ledger.
5. **Director plug-in:** early branch in `runCreatePipeline` when `mode === 'narrated-explainer'`, same emit/SSE/jobs.
6. **Later ComfyUI:** wrap `ComfyUIService` as an `ImageProvider`; resolver already passes `referenceImages` / `sref`. No domain change.
7. **Smallest Moon path:** create project → director (fixture or 1 LLM call) → approve script → cached ElevenLabs TTS → resolve (seed generate + reuse/compose/SVG) → Ken Burns + `composeVideo` 1080p.

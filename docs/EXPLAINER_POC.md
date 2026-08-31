# Explainer POC — Moon

Topic: **Защо Луната не пада върху Земята?**  
Language: `bg-BG` · Category: `PHYSICS` · Target: 60–120s · 12 beats

Fixture: [`lib/explainer/poc-moon.ts`](../lib/explainer/poc-moon.ts). Used when the topic matches (`луна`/`moon` + `земя`/`earth`/`пад`) and `MOCK_ENGINES=1` or `EXPLAINER_USE_POC_FIXTURE=1`.

## Seed entities

`GUIDE_CHARACTER`, `EARTH`, `MOON`, `SPACE_BG`, `PHYSICS_ARROW`, `QUESTION_MOTIF`

Early beats generate or render these; `seedVocabularyFromFrame` promotes first sightings so later beats resolve by reuse / compose / SVG as the governor tightens.

## How to run

1. Dashboard `/dashboard/explainer` — topic is prefilled. Set a modest cap (default 12 EUR).
2. **Plan beats** creates a project and writes the script, then opens `/projects/[id]?tab=explainer`.
3. Approve the script (or check "Skip script gate"), then TTS → Resolve frames → Render 1080p.
4. **Produce** posts `mode: 'narrated-explainer'` to `/api/create-stream`.

With `MOCK_ENGINES=1` the resolver never calls paid image APIs; diagram / compose / reuse complete the episode.

## Success criteria (verified in tests)

- `tests/explainer-poc-moon.test.ts` — 12 Bulgarian beats, required entities, reuse climbing under a tight cap
- `tests/explainer-governor.test.ts` — capped run finishes with degraded strategies, no throw
- `tests/explainer-language.test.ts` — `Защо Луната…` → `bg` / `bg-BG`

Chess and Math POCs stay deferred until this physics pass shows which abstractions are still missing.

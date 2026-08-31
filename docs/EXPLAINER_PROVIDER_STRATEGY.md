# Explainer Provider Strategy

## Images

Paid image generation is a normal production input, gated by the episode governor — not a seed-batch-only switch.

Ladder in [`lib/explainer/resolver.ts`](../lib/explainer/resolver.ts):

`REUSE_EXISTING → COMPOSE_EXISTING → DETERMINISTIC_RENDER → EDIT_PREVIOUS_FRAME → GENERATE_FROM_REFERENCES → GENERATE_NEW → UNRESOLVED`

Intersected with `decideGovernor().allowed`. `openai-gpt-image` already supports `/v1/images/edits` and up to 16 refs. `GENERATE_*` / `EDIT_*` go through `dispatchImageGenerate`.

`allowPaidImages: false` stops after the free rungs. `MOCK_ENGINES=1` falls back to a local diagram so a POC never silently fails.

## TTS

`dispatchTTSGenerate` looks up `tts_cache` before every provider call. Hits persist as `/api/serve-file` URLs via `persistAsset` (no base64 data URIs in the cache).

Providers:

- ElevenLabs — `supportedLanguages: []` so `bg-BG` is not filtered out
- Optional Google Cloud TTS — `lib/tts-providers/google-cloud-tts.ts`, gated on `GOOGLE_CLOUD_TTS_API_KEY` / `GOOGLE_TTS_API_KEY`

## Video

Off. Frames become clips via `stillFrameToVideo`. Composer default 16:9 stays 1280×720; explainer passes `outputSize: { w: 1920, h: 1080 }`. Subtitles use `findSubtitleFont()` (Cyrillic-capable, then CJK).

# Visual Continuity

Continuity is a stack, not a new engine.

1. **Series visual bible** — `defaultVisualBible()` (`TI_DA_VIDISH_VISUAL_V1`) supplies palette, stroke, and forbidden styles. Stored conceptually as a `global_assets` `type: 'style'` row when promoted.
2. **Vocabulary refs** — `compileFramePrompt` in [`lib/explainer/prompt-compiler.ts`](../lib/explainer/prompt-compiler.ts) assembles bible + teaching goal + active entities + previous beat. The LLM never authors a whole-frame prompt from scratch.
3. **Reference images** — `GENERATE_FROM_REFERENCES` / `EDIT_PREVIOUS_FRAME` pass vocabulary thumbnails (and the previous frame) into existing `dispatchImageGenerate` (`referenceImages`, `sref`).
4. **Deterministic diagrams** — orbit / gravity / velocity / cannon / question SVGs rasterized by `sharp` at 1920×1080 so later beats can share the same geometry instead of regenerating.
5. **Locking** — a locked `canonicalEntityId` is reused even when generation is otherwise allowed.

Ken Burns (`stillFrameToVideo` + `motionToKenBurns`) is the only motion. There is no video generation in this mode.

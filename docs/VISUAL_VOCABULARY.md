# Visual Vocabulary

No new table. A vocabulary entry is a `global_assets` row whose `metadata.vocabulary` is:

```ts
{
  canonicalEntityId: 'EARTH',
  visualFunction: 'OBJECT', // CHARACTER | ENVIRONMENT | PROP | OBJECT | MOTIF | DIAGRAM_COMPONENT | ICON
  scope: 'SERIES',          // BEAT | EPISODE | CATEGORY | SERIES | GLOBAL
  seriesId?, category?,
  approved: true,
  locked: false,
  version: 1,
  representation: 'default',
  promptBlock?, reusePriority?, episodeUsages?
}
```

Helpers live in [`lib/explainer/vocabulary-repo.ts`](../lib/explainer/vocabulary-repo.ts):

- `promoteToVocabulary` — creates or versions a row, calls `embedAsset`, records usage
- `findVocabulary` — scope / series / category rank, then optional cosine via `findSimilarGlobalAssetsByText`
- `setVocabularyLock` — locked entities cannot be replaced by a newly invented design (resolver falls back to the locked thumbnail)
- Series-scoped entries mirror into `series_anchors.data.canonicalEntities`

The resolver treats vocabulary as the first two rungs: `REUSE_EXISTING` (one entity) and `COMPOSE_EXISTING` (sharp layer stack). The pipeline also seeds missing entities after a non-reuse resolve so later beats of the same episode accumulate a working set.

Review UI: promote from a beat's entity chips; search via `GET /api/projects/[id]/explainer/promote?q=`.

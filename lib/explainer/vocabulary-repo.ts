import type { ExplainerCategory, GlobalAsset } from '@/types/agents';
import {
  createGlobalAsset,
  findSimilarGlobalAssetsByText,
  getGlobalAssetById,
  listGlobalAssets,
  recordAssetUsage,
  updateGlobalAsset,
} from '@/lib/repos/global-asset-repo';
import { embedAsset } from '@/lib/repos/global-asset-repo';
import { getSeriesAnchor, setSeriesAnchor, type SeriesAnchor } from '@/lib/repos/series-repo';
import type { VocabularyMeta, VocabularyScope, VisualFunction } from './types';

const SCOPE_RANK: Record<VocabularyScope, number> = {
  BEAT: 1, EPISODE: 2, CATEGORY: 3, SERIES: 4, GLOBAL: 5,
};

export function readVocabularyMeta(asset: GlobalAsset): VocabularyMeta | null {
  const raw = (asset.metadata as any)?.vocabulary;
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.canonicalEntityId) return null;
  return {
    canonicalEntityId: String(raw.canonicalEntityId),
    visualFunction: (raw.visualFunction || 'OBJECT') as VisualFunction,
    scope: (raw.scope || 'EPISODE') as VocabularyScope,
    seriesId: raw.seriesId,
    category: raw.category,
    approved: raw.approved !== false,
    locked: !!raw.locked,
    version: Number(raw.version) || 1,
    representation: String(raw.representation || 'default'),
    promptBlock: raw.promptBlock,
    reusePriority: Number(raw.reusePriority) || 0,
    episodeUsages: Array.isArray(raw.episodeUsages) ? raw.episodeUsages : [],
  };
}

export async function listVocabulary(userId: string): Promise<Array<GlobalAsset & { vocabulary: VocabularyMeta }>> {
  const rows = await listGlobalAssets({ userId, limit: 200 });
  const out: Array<GlobalAsset & { vocabulary: VocabularyMeta }> = [];
  for (const a of rows) {
    const v = readVocabularyMeta(a);
    if (v) out.push(Object.assign(a, { vocabulary: v }));
  }
  return out;
}

export async function findVocabulary(
  userId: string,
  query: {
    entityId?: string;
    text?: string;
    seriesId?: string;
    category?: ExplainerCategory;
  },
): Promise<Array<GlobalAsset & { vocabulary: VocabularyMeta; score: number }>> {
  const all = await listVocabulary(userId);
  let candidates = all.filter((a) => a.vocabulary.approved);
  if (query.entityId) {
    candidates = candidates.filter((a) => a.vocabulary.canonicalEntityId === query.entityId);
  }
  const scored = candidates.map((a) => {
    let score = (a.vocabulary.reusePriority || 0) * 0.05;
    if (query.seriesId && a.vocabulary.seriesId === query.seriesId) score += 0.4;
    if (query.category && a.vocabulary.category === query.category) score += 0.15;
    score += SCOPE_RANK[a.vocabulary.scope] * 0.04;
    if (query.text) {
      const q = query.text.toLowerCase();
      const hay = `${a.name} ${a.description} ${a.vocabulary.canonicalEntityId} ${(a.tags || []).join(' ')}`.toLowerCase();
      if (hay.includes(q)) score += 0.3;
      if (a.vocabulary.canonicalEntityId.toLowerCase() === q.replace(/\s+/g, '_')) score += 0.5;
    }
    return { ...a, score };
  });
  scored.sort((a, b) => b.score - a.score);

  if (query.text && scored.length < 3) {
    try {
      const sim = await findSimilarGlobalAssetsByText(userId, query.text, { k: 5, minScore: 0.2 });
      for (const s of sim) {
        const v = readVocabularyMeta(s.asset);
        if (!v || scored.some((x) => x.id === s.asset.id)) continue;
        scored.push(Object.assign(s.asset, { vocabulary: v, score: s.score }));
      }
      scored.sort((a, b) => b.score - a.score);
    } catch { /* embeddings optional */ }
  }
  return scored;
}

export async function promoteToVocabulary(input: {
  userId: string;
  projectId: string;
  imageUrl: string;
  canonicalEntityId: string;
  name?: string;
  visualFunction?: VisualFunction;
  scope?: VocabularyScope;
  seriesId?: string;
  category?: ExplainerCategory;
  representation?: string;
  promptBlock?: string;
  locked?: boolean;
}): Promise<GlobalAsset> {
  const existing = (await listVocabulary(input.userId))
    .filter((a) => a.vocabulary.canonicalEntityId === input.canonicalEntityId)
    .sort((a, b) => b.vocabulary.version - a.vocabulary.version)[0];
  const version = existing ? existing.vocabulary.version + (existing.thumbnail === input.imageUrl ? 0 : 1) : 1;
  const meta: VocabularyMeta = {
    canonicalEntityId: input.canonicalEntityId,
    visualFunction: input.visualFunction || 'OBJECT',
    scope: input.scope || 'SERIES',
    seriesId: input.seriesId,
    category: input.category,
    approved: true,
    locked: !!input.locked,
    version,
    representation: input.representation || 'default',
    promptBlock: input.promptBlock,
    reusePriority: 1,
    episodeUsages: [input.projectId],
  };
  const type = meta.visualFunction === 'CHARACTER' ? 'character'
    : meta.visualFunction === 'ENVIRONMENT' ? 'scene'
      : meta.visualFunction === 'MOTIF' ? 'style'
        : 'prop';

  if (existing && existing.thumbnail === input.imageUrl) {
    const merged = { ...existing.metadata, vocabulary: meta };
    const updated = await updateGlobalAsset(existing.id, input.userId, { metadata: merged, thumbnail: input.imageUrl });
    if (updated) {
      await recordAssetUsage(updated.id, input.userId, input.projectId);
      await mirrorSeries(input.seriesId, updated, meta);
      return updated;
    }
  }

  const created = await createGlobalAsset({
    userId: input.userId,
    type,
    name: input.name || `${input.canonicalEntityId}_V${version}`,
    description: input.promptBlock || input.canonicalEntityId,
    tags: [input.canonicalEntityId, meta.scope, meta.visualFunction],
    thumbnail: input.imageUrl,
    visualAnchors: [input.canonicalEntityId, meta.representation],
    metadata: { vocabulary: meta, firstProjectId: input.projectId },
  });
  void embedAsset(created.id);
  await recordAssetUsage(created.id, input.userId, input.projectId);
  await mirrorSeries(input.seriesId, created, meta);
  return created;
}

export async function setVocabularyLock(userId: string, assetId: string, locked: boolean): Promise<GlobalAsset | null> {
  const asset = await getGlobalAssetById(assetId);
  if (!asset || asset.userId !== userId) return null;
  const v = readVocabularyMeta(asset);
  if (!v) return asset;
  return updateGlobalAsset(assetId, userId, { metadata: { ...asset.metadata, vocabulary: { ...v, locked } } });
}

export function isEntityLocked(
  vocab: Array<{ vocabulary: VocabularyMeta }>,
  entityId: string,
): boolean {
  return vocab.some((a) => a.vocabulary.canonicalEntityId === entityId && a.vocabulary.locked);
}

async function mirrorSeries(seriesId: string | undefined, asset: GlobalAsset, meta: VocabularyMeta) {
  if (!seriesId || meta.scope === 'BEAT' || meta.scope === 'EPISODE') return;
  const prev = (await getSeriesAnchor(seriesId)) || {};
  const list = Array.isArray((prev as SeriesAnchor & { canonicalEntities?: unknown }).canonicalEntities)
    ? ([...(prev as any).canonicalEntities] as Array<{ id: string; entityId: string; imageUrl: string }>)
    : [];
  const i = list.findIndex((x) => x.entityId === meta.canonicalEntityId);
  const row = { id: asset.id, entityId: meta.canonicalEntityId, imageUrl: asset.thumbnail };
  if (i >= 0) list[i] = row; else list.push(row);
  await setSeriesAnchor(seriesId, { ...prev, canonicalEntities: list } as SeriesAnchor);
}

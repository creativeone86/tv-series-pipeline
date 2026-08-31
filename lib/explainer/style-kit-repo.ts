import { createGlobalAsset, getGlobalAssetById, listGlobalAssets, updateGlobalAsset } from '@/lib/repos/global-asset-repo';
import type { StyleKit } from './types';
import { applyStyleKitPatch, BUILTIN_STYLE_KITS, getBuiltinKit, validateStyleKitPatch } from './style-kits';

export function readStyleKit(meta: Record<string, unknown> | undefined | null): StyleKit | null {
  const raw = (meta as any)?.styleKit;
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  return raw as StyleKit;
}

export async function listStyleKits(userId: string): Promise<StyleKit[]> {
  const rows = await listGlobalAssets({ userId, type: 'style', limit: 80 });
  const out: StyleKit[] = [];
  for (const row of rows) {
    const kit = readStyleKit(row.metadata);
    if (kit) out.push({ ...kit, styleAnchorUrl: kit.styleAnchorUrl || row.thumbnail });
  }
  for (const builtin of BUILTIN_STYLE_KITS) {
    if (!out.some((k) => k.id === builtin.id)) out.push(builtin);
  }
  return out;
}

export async function getStyleKit(userId: string, id?: string | null): Promise<StyleKit> {
  if (id) {
    try {
      const row = await getGlobalAssetById(id);
      const kit = readStyleKit(row?.metadata);
      if (kit) return { ...kit, styleAnchorUrl: kit.styleAnchorUrl || row?.thumbnail };
    } catch { /* fall through */ }
    const fromList = (await listStyleKits(userId)).find((k) => k.id === id);
    if (fromList) return fromList;
  }
  return getBuiltinKit(id);
}

export async function persistStyleKit(userId: string, kit: StyleKit, thumbnail = ''): Promise<string> {
  const existing = (await listGlobalAssets({ userId, type: 'style', limit: 80 }))
    .find((a) => readStyleKit(a.metadata)?.id === kit.id);
  if (existing) {
    await updateGlobalAsset(existing.id, userId, {
      name: kit.name,
      thumbnail: thumbnail || existing.thumbnail,
      metadata: { ...existing.metadata, styleKit: kit },
    });
    return existing.id;
  }
  const created = await createGlobalAsset({
    userId,
    type: 'style',
    name: kit.name,
    description: kit.promptPrefix.slice(0, 180),
    tags: ['explainer', kit.plateProfile, kit.material || 'print'],
    thumbnail,
    visualAnchors: [kit.paper, kit.ink, kit.accent],
    metadata: { styleKit: kit },
  });
  return created.id;
}

export async function tweakStyleKit(userId: string, kitId: string, patch: Record<string, unknown>): Promise<StyleKit> {
  const current = await getStyleKit(userId, kitId);
  const checked = validateStyleKitPatch(patch);
  if (!checked.ok) throw new Error(checked.error);
  const next = applyStyleKitPatch(current, checked.patch);
  await persistStyleKit(userId, next, next.styleAnchorUrl || '');
  return next;
}

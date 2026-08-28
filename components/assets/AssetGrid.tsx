'use client';

/**
 * AssetGrid (v2.0 Sprint 0 D6)
 *
 * Grid browse / select for the global asset memory.
 *
 * Capabilities:
 *  - fetch the current user's assets via /api/global-assets
 *  - tab by type (character / scene / style / prop)
 *  - search (q passed to the backend)
 *  - multi-select (Wizard "add to project assets")
 *  - empty state nudges "go create"
 *
 * Usage:
 *   <AssetGrid
 *     selectable
 *     selected={selectedIds}
 *     onSelectionChange={setSelectedIds}
 *   />
 */

import * as React from 'react';
import type { GlobalAsset, GlobalAssetType } from '@/types/agents';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

function typeTabs(t: Translations) {
  return [
    { key: 'all' as const, label: t.projects.filterAll, icon: '📦' },
    { key: 'character' as const, label: t.product.tabCharacters, icon: '👤' },
    { key: 'scene' as const, label: t.product.tabScenes, icon: '🏞' },
    { key: 'style' as const, label: t.sharedUi.styleRole, icon: '🎨' },
    { key: 'prop' as const, label: t.sharedUi.propRole, icon: '🗡' },
  ];
}

// ──────────────────────────────────────────────────────────
// Type tabs
// ──────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────
// Fetcher — exported separately so tests can mock it
// ──────────────────────────────────────────────────────────

export async function fetchGlobalAssets(params: {
  type?: GlobalAssetType;
  q?: string;
  token?: string;
  signal?: AbortSignal;
}): Promise<GlobalAsset[]> {
  const sp = new URLSearchParams();
  if (params.type) sp.set('type', params.type);
  if (params.q) sp.set('q', params.q);

  const res = await fetch(`/api/global-assets?${sp.toString()}`, {
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : undefined,
    signal: params.signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch assets: ${res.status}`);
  }
  const data = (await res.json()) as { assets?: GlobalAsset[] };
  return data.assets ?? [];
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export interface AssetGridProps {
  /** Allow multi-select */
  selectable?: boolean;
  /** Currently selected asset ids */
  selected?: string[];
  onSelectionChange?: (next: string[]) => void;
  /** Max selection count (default 20) */
  maxSelection?: number;
  /** Initial type filter */
  initialType?: GlobalAssetType | 'all';
  /** Custom fetcher (handy for unit-test mocks) */
  fetcher?: typeof fetchGlobalAssets;
  /** JWT token (optional; read from localStorage) */
  token?: string;
  /** Create-button callback (navigate to "new asset") */
  onCreateClick?: (type: GlobalAssetType | 'all') => void;
  className?: string;
}

export function AssetGrid({
  selectable = false,
  selected = [],
  onSelectionChange,
  maxSelection = 20,
  initialType = 'all',
  fetcher = fetchGlobalAssets,
  token,
  onCreateClick,
  className,
}: AssetGridProps) {
  const { t } = useLocale();
  const TYPE_TABS = typeTabs(t);
  const [type, setType] = React.useState<GlobalAssetType | 'all'>(initialType);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [assets, setAssets] = React.useState<GlobalAsset[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // fetch
  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcher({
      type: type === 'all' ? undefined : type,
      q: debouncedQuery || undefined,
      token,
      signal: controller.signal,
    })
      .then(list => setAssets(list))
      .catch(e => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : String(e));
        setAssets([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [type, debouncedQuery, token, fetcher]);

  const toggleSelect = (id: string) => {
    if (!selectable) return;
    const set = new Set(selected);
    if (set.has(id)) {
      set.delete(id);
    } else {
      if (set.size >= maxSelection) return; // at the cap
      set.add(id);
    }
    onSelectionChange?.(Array.from(set));
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header: tabs + search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" data-testid="asset-tabs">
          {TYPE_TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                type === t.key
                  ? 'border-[#E8C547]/60 bg-[#E8C547]/20 text-[#E8C547]'
                  : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10',
              )}
              data-testid={`asset-tab-${t.key}`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.sharedUi.searchAssets}
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none md:w-56"
          data-testid="asset-search"
        />
      </div>

      {/* Selection counter */}
      {selectable && (
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            {t.sharedUi.selectedPrefix} <span className="font-semibold text-[#E8C547]">{selected.length}</span> /{' '}
            {maxSelection}
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              className="text-neutral-400 underline hover:text-white"
              onClick={() => onSelectionChange?.([])}
            >
              {t.common.reset}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <AssetSkeletonGrid />
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
          <span>{t.sharedUi.loadAssetsFailed}</span>
          <span className="text-xs text-red-400/80">{error}</span>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState type={type} onCreate={onCreateClick} query={debouncedQuery} />
      ) : (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          data-testid="asset-grid"
        >
          {assets.map(a => (
            <AssetCard
              key={a.id}
              asset={a}
              selected={selected.includes(a.id)}
              selectable={selectable}
              onToggle={() => toggleSelect(a.id)}
              typeLabel={TYPE_TABS.find(tab => tab.key === a.type)?.label ?? a.type}
              typeIcon={TYPE_TABS.find(tab => tab.key === a.type)?.icon ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// AssetCard
// ──────────────────────────────────────────────────────────

interface AssetCardProps {
  asset: GlobalAsset;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
  typeLabel: string;
  typeIcon: string;
}

function AssetCard({ asset, selected, selectable, onToggle, typeLabel, typeIcon }: AssetCardProps) {
  const { t } = useLocale();
  const [imgError, setImgError] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 text-left transition-all duration-200',
        'aspect-[4/5]',
        selected
          ? 'border-[#E8C547] shadow-lg shadow-[#E8C547]/20 ring-2 ring-[#E8C547]/30'
          : 'border-white/10 hover:border-white/30',
      )}
      data-testid={`asset-card-${asset.id}`}
      data-selected={selected}
      aria-pressed={selected}
    >
      {asset.thumbnail && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.thumbnail}
          alt={asset.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-xs text-neutral-400">
          {asset.name}
        </div>
      )}

      {/* Type badge */}
      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
        {typeIcon}{' '}
        {typeLabel}
      </span>

      {/* Usage count badge (how many projects used this) */}
      {asset.referencedByProjects.length > 0 && (
        <span className="absolute right-2 top-2 rounded bg-[#E8C547]/90 px-1.5 py-0.5 text-[10px] font-semibold text-black">
          {t.sharedUi.usedN.replace('{n}', String(asset.referencedByProjects.length))}
        </span>
      )}

      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
        <div className="truncate text-sm font-semibold text-white">{asset.name}</div>
        {asset.description && (
          <div className="mt-0.5 line-clamp-1 text-[11px] text-neutral-300">
            {asset.description}
          </div>
        )}
      </div>

      {/* Selected check */}
      {selectable && selected && (
        <div className="absolute right-2 bottom-[4.5rem] flex h-6 w-6 items-center justify-center rounded-full bg-[#E8C547] text-black shadow-lg">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// Skeleton + Empty State
// ──────────────────────────────────────────────────────────

function AssetSkeletonGrid() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      data-testid="asset-skeleton"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] animate-pulse rounded-lg bg-white/5"
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  type: GlobalAssetType | 'all';
  onCreate?: (type: GlobalAssetType | 'all') => void;
  query?: string;
}

function EmptyState({ type, onCreate, query }: EmptyStateProps) {
  const { t } = useLocale();
  const typeInfo = typeTabs(t).find(tab => tab.key === type);
  const hasQuery = query && query.length > 0;

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/10 p-12 text-center"
      data-testid="asset-empty"
    >
      <div className="text-5xl opacity-40">{typeInfo?.icon || '📦'}</div>
      <div className="text-sm font-medium text-white">
        {hasQuery
          ? t.sharedUi.noMatchAssets.replace('{q}', query).replace('{type}', typeInfo?.label ?? '')
          : t.sharedUi.noAssetsYet.replace('{type}', type === 'all' ? '' : (typeInfo?.label ?? ''))}
      </div>
      <div className="text-xs text-neutral-400">
        {hasQuery ? t.sharedUi.tryOtherKeywords : t.sharedUi.createFirstAsset}
      </div>
      {!hasQuery && onCreate && (
        <button
          type="button"
          onClick={() => onCreate(type)}
          className="mt-2 rounded-lg bg-gradient-to-r from-[#E8C547] to-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + {t.sharedUi.createAsset}
        </button>
      )}
    </div>
  );
}

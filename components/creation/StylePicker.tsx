'use client';

/**
 * StylePicker (v2.0 Sprint 0 D5)
 *
 * Grid picker for 60 style presets.
 *  - Category tabs: all / realistic / anime / artistic / retro / experimental
 *  - Default sort: popularity desc
 *  - "Popular" shortcut (popularity >= 85)
 *  - Hover shows localized + English names and engine badge
 *  - Thumbnail load failure falls back to a gradient (keeps layout)
 *
 * Usage:
 *   <StylePicker value={styleId} onChange={setStyleId} />
 */

import * as React from 'react';
import {
  STYLE_PRESETS,
  getStylesByCategory,
  getPopularStyles,
} from '@/lib/style-presets';
import type { StylePreset, StyleCategory } from '@/types/agents';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';

type TabKey = 'all' | 'popular' | StyleCategory;

const TAB_KEYS: Array<{ key: TabKey; labelKey: string }> = [
  { key: 'all', labelKey: 'styleTabAll' },
  { key: 'popular', labelKey: 'styleTabPopular' },
  { key: 'realistic', labelKey: 'styleTabRealistic' },
  { key: 'anime', labelKey: 'styleTabAnime' },
  { key: 'artistic', labelKey: 'styleTabArtistic' },
  { key: 'retro', labelKey: 'styleTabRetro' },
  { key: 'experimental', labelKey: 'styleTabExperimental' },
];

const ENGINE_BADGE: Record<string, { labelKey?: string; fallback: string; className: string }> = {
  seedance2: { labelKey: 'engineSeedance', fallback: 'Jimeng 2.0', className: 'bg-purple-500/30 text-purple-200' },
  kling3: { fallback: 'Kling 3', className: 'bg-blue-500/30 text-blue-200' },
  viduq3: { fallback: 'Vidu Q3', className: 'bg-pink-500/30 text-pink-200' },
  veo31lite: { fallback: 'Veo 3.1', className: 'bg-green-500/30 text-green-200' },
};

export interface StylePickerProps {
  value?: string;
  onChange?: (styleId: string, preset: StylePreset) => void;
  /** Initial category tab (default all) */
  defaultTab?: TabKey;
  /** Cards per row (lg breakpoint) */
  columns?: 3 | 4 | 5 | 6;
  /** Allow clearing the selection */
  clearable?: boolean;
  className?: string;
}

export function StylePicker({
  value,
  onChange,
  defaultTab = 'all',
  columns = 4,
  clearable = false,
  className,
}: StylePickerProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};
  const [tab, setTab] = React.useState<TabKey>(defaultTab);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo<StylePreset[]>(() => {
    let list: StylePreset[];
    if (tab === 'all') list = [...STYLE_PRESETS];
    else if (tab === 'popular') list = getPopularStyles(24);
    else list = getStylesByCategory(tab);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.promptFragment.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => b.popularity - a.popularity);
  }, [tab, query]);

  const gridCols = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }[columns];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header: tabs + search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {TAB_KEYS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                tab === item.key
                  ? 'border-[#E8C547]/60 bg-[#E8C547]/20 text-[#E8C547]'
                  : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10',
              )}
              data-testid={`style-tab-${item.key}`}
            >
              {item.key === 'all' ? (w[item.labelKey] || t.dashProjects.filterAll) : (w[item.labelKey] || item.key)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={w.styleSearch || 'Search styles...'}
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none md:w-56"
          data-testid="style-search"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-neutral-400">
          {w.styleEmpty || 'No matching styles'}
        </div>
      ) : (
        <div className={cn('grid gap-3', gridCols)} data-testid="style-grid">
          {filtered.map(preset => (
            <StyleCard
              key={preset.id}
              preset={preset}
              selected={value === preset.id}
              onSelect={() => {
                if (clearable && value === preset.id) {
                  onChange?.('', preset);
                } else {
                  onChange?.(preset.id, preset);
                }
              }}
            />
          ))}
        </div>
      )}

      {value && clearable && (
        <button
          type="button"
          onClick={() => onChange?.('', STYLE_PRESETS.find(p => p.id === value)!)}
          className="self-end text-xs text-neutral-400 underline hover:text-white"
        >
          {w.styleClear || 'Clear selection'}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// StyleCard
// ──────────────────────────────────────────────────────────

interface StyleCardProps {
  preset: StylePreset;
  selected: boolean;
  onSelect: () => void;
}

function StyleCard({ preset, selected, onSelect }: StyleCardProps) {
  const { t: tRaw, locale } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};
  const [imgError, setImgError] = React.useState(false);
  const engineInfo = preset.recommendedEngine
    ? ENGINE_BADGE[preset.recommendedEngine]
    : undefined;
  const displayName = locale === 'en' ? preset.nameEn : preset.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 transition-all duration-200',
        'aspect-[4/3] text-left',
        selected
          ? 'border-[#E8C547] shadow-lg shadow-[#E8C547]/20 ring-2 ring-[#E8C547]/30'
          : 'border-white/10 hover:border-white/30',
      )}
      data-testid={`style-card-${preset.id}`}
      data-selected={selected}
      aria-pressed={selected}
      aria-label={(w.selectStyle || 'Select style {name}').replace('{name}', displayName)}
    >
      {/* Thumbnail or gradient fallback */}
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preset.thumbnail}
          alt={displayName}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-xs text-neutral-400"
          aria-hidden="true"
        >
          {preset.nameEn}
        </div>
      )}

      {/* Bottom fade + text */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
        <div className="text-sm font-semibold text-white">{displayName}</div>
        <div className="mt-0.5 text-[11px] text-neutral-300 opacity-80">
          {preset.nameEn}
        </div>
      </div>

      {/* Popularity badge */}
      {preset.popularity >= 90 && (
        <span className="absolute left-2 top-2 rounded bg-orange-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
          {w.styleTabPopular || 'Popular'}
        </span>
      )}

      {/* Engine badge */}
      {engineInfo && (
        <span
          className={cn(
            'absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm',
            engineInfo.className,
          )}
        >
          {(engineInfo.labelKey && w[engineInfo.labelKey]) || engineInfo.fallback}
        </span>
      )}

      {/* Selected check */}
      {selected && (
        <div className="absolute right-2 bottom-16 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8C547] text-black shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
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

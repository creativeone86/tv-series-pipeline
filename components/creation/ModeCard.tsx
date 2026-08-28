'use client';

/**
 * ModeCard (v2.0 Sprint 0 D5)
 *
 * Card picker for 5 creation modes. Aligns with OiiOii's create entry,
 * but keeps our original modes (this cycle: do not drop any).
 *
 * 5 modes:
 *   1. episodic       Episodic series — multi-episode narrative, tight cast/look
 *   2. mv             MV / lyrics — music-driven, beat-aligned
 *   3. quick          Quick 60s — one-tap film, short-video style
 *   4. comic-to-video Comic → video — upload boards/comic, animate
 *   5. ip-derivative  IP derivative — remix existing characters/IP
 *
 * Each card: icon, localized name, English subtitle, features, ETA.
 *
 * Usage:
 *   <ModeCardGrid value={mode} onChange={setMode} />
 *   <ModeCard preset={MODE_PRESETS.mv} selected onSelect={...} />
 */

import * as React from 'react';
import type { CreationMode } from '@/types/agents';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';

// ──────────────────────────────────────────────────────────
// Preset config (ids / icons / colors only — copy via t.workshop)
// ──────────────────────────────────────────────────────────

export interface ModePreset {
  mode: CreationMode;
  icon: string;
  name: string;
  nameEn: string;
  desc: string;
  features: string[];
  estMinutes: string;
  gradient: string;
  recommendedFor?: string;
}

export const MODE_PRESETS: Record<CreationMode, ModePreset> = {
  episodic: {
    mode: 'episodic',
    icon: '🎬',
    name: 'Episodic Series',
    nameEn: 'Episodic Series',
    desc: 'Multi-episode narrative with locked cast and world',
    features: ['Cross-episode cast lock', 'World lock', '3–20 episode batch'],
    estMinutes: '12–20 min per episode',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    recommendedFor: 'Series / serialized shorts',
  },
  mv: {
    mode: 'mv',
    icon: '🎵',
    name: 'Music Video',
    nameEn: 'Music Video',
    desc: 'Beat-driven picture, lyrics locked to the cut',
    features: ['Lyric cards on screen', 'Beat-synced cuts', 'Mood-matched palette'],
    estMinutes: '3–5 min to film',
    gradient: 'from-pink-500/20 to-rose-500/20',
    recommendedFor: 'Original MV / fan edits',
  },
  quick: {
    mode: 'quick',
    icon: '⚡',
    name: 'Quick 60s',
    nameEn: 'Quick 60s',
    desc: 'One line in, 60-second short out',
    features: ['One-tap generate', 'Auto cover', 'Vertical 9:16'],
    estMinutes: '3–8 min to film',
    gradient: 'from-orange-500/20 to-amber-500/20',
    recommendedFor: 'Daily shorts / trend follow',
  },
  'comic-to-video': {
    mode: 'comic-to-video',
    icon: '📖',
    name: 'Comic → Video',
    nameEn: 'Comic → Video',
    desc: 'Upload still comic/boards, convert to motion video',
    features: ['OCR speech bubbles', 'Camera-move generate', 'Auto VO match'],
    estMinutes: '10–25 min',
    gradient: 'from-teal-500/20 to-cyan-500/20',
    recommendedFor: 'Comic motion / picture-book adapt',
  },
  'ip-derivative': {
    mode: 'ip-derivative',
    icon: '✨',
    name: 'IP Derivative',
    nameEn: 'IP Derivative',
    desc: 'Second-create from an existing character or IP',
    features: ['Cast memory reuse', 'Style lock', 'Multi-scene batch'],
    estMinutes: '8–15 min',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    recommendedFor: 'Fan works / IP expand',
  },
};

const MODE_I18N: Record<CreationMode, {
  name: string; desc: string; f1: string; f2: string; f3: string; est: string; rec: string;
}> = {
  episodic: { name: 'modeEpisodic', desc: 'modeEpisodicDesc', f1: 'modeEpisodicF1', f2: 'modeEpisodicF2', f3: 'modeEpisodicF3', est: 'modeEpisodicEst', rec: 'modeEpisodicFor' },
  mv: { name: 'modeMv', desc: 'modeMvDesc', f1: 'modeMvF1', f2: 'modeMvF2', f3: 'modeMvF3', est: 'modeMvEst', rec: 'modeMvFor' },
  quick: { name: 'modeQuick', desc: 'modeQuickDesc', f1: 'modeQuickF1', f2: 'modeQuickF2', f3: 'modeQuickF3', est: 'modeQuickEst', rec: 'modeQuickFor' },
  'comic-to-video': { name: 'modeComic', desc: 'modeComicDesc', f1: 'modeComicF1', f2: 'modeComicF2', f3: 'modeComicF3', est: 'modeComicEst', rec: 'modeComicFor' },
  'ip-derivative': { name: 'modeIp', desc: 'modeIpDesc', f1: 'modeIpF1', f2: 'modeIpF2', f3: 'modeIpF3', est: 'modeIpEst', rec: 'modeIpFor' },
};

export function modeCopy(preset: ModePreset, workshop: Record<string, string> | undefined) {
  const keys = MODE_I18N[preset.mode];
  const w = workshop ?? {};
  return {
    name: w[keys.name] || preset.nameEn,
    desc: w[keys.desc] || preset.desc,
    features: [w[keys.f1] || preset.features[0], w[keys.f2] || preset.features[1], w[keys.f3] || preset.features[2]].filter(Boolean),
    estMinutes: w[keys.est] || preset.estMinutes,
    recommendedFor: w[keys.rec] || preset.recommendedFor,
  };
}

export const ALL_MODES: CreationMode[] = [
  'episodic',
  'mv',
  'quick',
  'comic-to-video',
  'ip-derivative',
];

// ──────────────────────────────────────────────────────────
// Single ModeCard
// ──────────────────────────────────────────────────────────

export interface ModeCardProps {
  preset: ModePreset;
  selected?: boolean;
  onSelect?: (mode: CreationMode) => void;
  className?: string;
}

export function ModeCard({ preset, selected, onSelect, className }: ModeCardProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const copy = modeCopy(preset, t.workshop);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(preset.mode)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-300',
        'bg-gradient-to-br p-5',
        preset.gradient,
        selected
          ? 'border-[#E8C547] shadow-lg shadow-[#E8C547]/20'
          : 'border-white/10 hover:border-white/40 hover:shadow-lg',
        className,
      )}
      data-testid={`mode-card-${preset.mode}`}
      data-selected={selected ? 'true' : 'false'}
      aria-pressed={selected}
    >
      {/* Selected check */}
      {selected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8C547] text-black">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Icon + title — v8.3 P6.3: gold emblem over emoji; onError falls back to emoji */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative w-12 h-12 grid place-items-center text-4xl shrink-0">
          <span aria-hidden>{preset.icon}</span>
          <img src={`/mode-icons/${preset.mode}.jpg`} alt="" aria-hidden loading="lazy"
            className="absolute inset-0 w-full h-full object-contain rounded-md"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div>
          <div className="text-lg font-bold text-white">{copy.name}</div>
          <div className="text-[11px] text-neutral-300 opacity-80">{preset.nameEn}</div>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 text-xs text-neutral-200/90 line-clamp-2">{copy.desc}</p>

      {/* Feature list */}
      <ul className="mb-3 space-y-1">
        {copy.features.map(f => (
          <li key={f} className="flex items-center gap-1.5 text-[11px] text-neutral-200/80">
            <span className="text-[#E8C547]">◆</span>
            {f}
          </li>
        ))}
      </ul>

      {/* Footer meta */}
      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
        <span className="text-neutral-300">⏱ {copy.estMinutes}</span>
        {copy.recommendedFor && (
          <span className="text-neutral-400">{copy.recommendedFor}</span>
        )}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// Grid wrapper
// ──────────────────────────────────────────────────────────

export interface ModeCardGridProps {
  value?: CreationMode;
  onChange?: (mode: CreationMode) => void;
  className?: string;
}

export function ModeCardGrid({ value, onChange, className }: ModeCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className,
      )}
      data-testid="mode-grid"
    >
      {ALL_MODES.map(m => (
        <ModeCard
          key={m}
          preset={MODE_PRESETS[m]}
          selected={value === m}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}

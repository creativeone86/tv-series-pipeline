'use client';

/**
 * components/project/export-resolution-dropdown (v2.16 P0.2)
 *
 * Project-page top-right mp4 export dropdown — pick a resolution to download.
 *   720p  → free
 *   1080p → creator+
 *   2160p → pro+
 *
 * Behavior:
 *   - Default 1080p (mainstream, does not block)
 *   - Locked tiers show a lock + tooltip; click goes to /dashboard/billing
 *   - Unlocked click → window.open(`/api/.../export?type=mp4&resolution=...`)
 *     Browser gets an attachment header and downloads
 *
 * Does not query the current user tier — Plan-gate is authoritative on the
 * route. This only renders “likely locked” hints.
 */

import { useState } from 'react';
import { Download, Lock, CaretDown as ChevronDown } from '@phosphor-icons/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ExportResolution } from '@/lib/plan-gate';
import { useLocale } from '@/hooks/use-locale';

interface ResOption {
  value: ExportResolution;
  label: string;
  descKey: 'res720Desc' | 'res1080Desc' | 'res2160Desc';
  /** Minimum tier label, display only */
  tierLabel: string;
  /** Whether plan-gate will likely block (hint only; route is source of truth) */
  likelyLocked: boolean;
}

export interface ExportResolutionDropdownProps {
  projectId: string;
  /** Current user tier — omit to show all locks. Parent gets this from SWR / store */
  userTier?: 'free' | 'creator' | 'pro' | 'enterprise';
  className?: string;
}

const TIER_RANK: Record<string, number> = {
  free: 0, creator: 1, pro: 2, enterprise: 3,
};

const OPTIONS: Array<Omit<ResOption, 'likelyLocked'>> = [
  { value: '720p',  label: '720p',  descKey: 'res720Desc',  tierLabel: 'free' },
  { value: '1080p', label: '1080p', descKey: 'res1080Desc', tierLabel: 'creator' },
  { value: '2160p', label: '2160p', descKey: 'res2160Desc', tierLabel: 'pro' },
];

export function ExportResolutionDropdown({
  projectId, userTier, className = '',
}: ExportResolutionDropdownProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const [open, setOpen] = useState(false);
  // v12.258: include open/end cards — when checked, export URL gets &intro=1
  const [withIntro, setWithIntro] = useState(false);
  const userRank = userTier ? (TIER_RANK[userTier] ?? 0) : -1;

  const optionsWithLock: ResOption[] = OPTIONS.map((o) => ({
    ...o,
    // userRank=-1 (no tier) → mark 1080p / 2160p as maybe locked;
    // when tier is known, compare ranks
    likelyLocked:
      userRank < 0
        ? o.tierLabel !== 'free'
        : userRank < (TIER_RANK[o.tierLabel] ?? 0),
  }));

  const handlePick = (opt: ResOption) => {
    if (opt.likelyLocked) {
      // Hint and go to billing — do not fire download (route would 402 anyway)
      window.location.href = '/dashboard/billing';
      return;
    }
    const url = `/api/projects/${encodeURIComponent(projectId)}/export?type=mp4&resolution=${opt.value}${withIntro ? '&intro=1' : ''}`;
    window.open(url, '_blank');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 ${className}`}
          title={t.projectPanels.downloadTitle}
        >
          <Download className="w-3.5 h-3.5" />
          {t.projectPanels.exportMp4}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="cinema-mono text-[10px] opacity-50 tracking-widest mb-2 px-1">
          EXPORT RESOLUTION
        </div>
        <div className="space-y-1">
          {optionsWithLock.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePick(opt)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md transition-colors text-left ${
                opt.likelyLocked
                  ? 'opacity-50 hover:bg-[var(--cinema-amber-glow)] hover:opacity-90'
                  : 'hover:bg-[var(--cinema-surface-hi)]'
              }`}
              title={opt.likelyLocked
                ? t.projectPanels.upgradeUnlock.replace('{tier}', opt.tierLabel)
                : t.projectPanels.downloadRes.replace('{label}', opt.label)}
            >
              <div className="flex flex-col">
                <span className="cinema-mono text-[12px] font-semibold text-[var(--cinema-text)]">
                  {opt.label}
                </span>
                <span className="text-[10px] text-[var(--cinema-text-3)]">{t.projectPanels[opt.descKey]}</span>
              </div>
              {opt.likelyLocked ? (
                <Lock className="w-3.5 h-3.5 text-[var(--cinema-amber)]" />
              ) : (
                <Download className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>
          ))}
        </div>
        {/* v12.258: include open/end cards */}
        <label className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-md hover:bg-[var(--cinema-surface-hi)] cursor-pointer">
          <input
            type="checkbox"
            checked={withIntro}
            onChange={(e) => setWithIntro(e.target.checked)}
            className="accent-[var(--cinema-amber)]"
          />
          <span className="flex flex-col">
            <span className="text-[12px] text-[var(--cinema-text)]">{t.projectPanels.withIntro}</span>
            <span className="text-[10px] text-[var(--cinema-text-3)]">{t.projectPanels.withIntroHint}</span>
          </span>
        </label>
        <div className="cinema-mono text-[9px] opacity-40 mt-2 px-1 tracking-wide">
          {t.projectPanels.lockedHint}
        </div>
      </PopoverContent>
    </Popover>
  );
}

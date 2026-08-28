'use client';

/**
 * v3.5.1 — Platform export dropdown.
 *
 * One-click export of Douyin / Kuaishou / Xiaohongshu / Bilibili landscape
 * versions (aspect + platform subtitle style).
 * POST /api/projects/[id]/export-platform.
 */

import { useState } from 'react';
import { ShareNetwork as Share2, CircleNotch as Loader2, Check, CaretDown as ChevronDown } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface Preset {
  key: string;
  aspect: '9:16' | '16:9' | '1:1' | '4:5';
  subtitlePlatform?: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'youtube';
}

const PRESETS: Preset[] = [
  { key: 'douyin', aspect: '9:16', subtitlePlatform: 'douyin' },
  { key: 'kuaishou', aspect: '9:16', subtitlePlatform: 'kuaishou' },
  { key: 'xhs', aspect: '4:5', subtitlePlatform: 'xiaohongshu' },
  { key: 'youtube', aspect: '16:9', subtitlePlatform: 'youtube' },
  { key: 'square', aspect: '1:1' },
];

export function PlatformExportDropdown({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [doneUrl, setDoneUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presetLabel = (key: string) => ({
    douyin: t.projectMisc.presetDouyin,
    kuaishou: t.projectMisc.presetKuaishou,
    xhs: t.projectMisc.presetXhs,
    youtube: t.projectMisc.presetYoutube,
    square: t.projectMisc.presetSquare,
  }[key] || key);

  const run = async (p: Preset) => {
    setBusy(p.key);
    setError(null);
    setDoneUrl(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/export-platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ aspect: p.aspect, fit: 'blur-pad', subtitlePlatform: p.subtitlePlatform }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setDoneUrl(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectMisc.exportFailed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5"
        title={t.projectMisc.exportPlatformTitle}
      >
        <Share2 className="w-3.5 h-3.5" />
        {t.projectMisc.platformExport}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 z-30 cinema-card-hi p-1.5 shadow-xl">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => run(p)}
              disabled={!!busy}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-white/80 hover:bg-white/10 inline-flex items-center justify-between gap-2 disabled:opacity-40"
            >
              {presetLabel(p.key)}
              {busy === p.key && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          ))}
          {doneUrl && (
            <a
              href={doneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 px-2.5 py-1.5 rounded-md text-[11px] text-emerald-400 hover:bg-emerald-500/10 inline-flex items-center gap-1.5"
            >
              <Check className="w-3 h-3" /> {t.projectMisc.exportDoneView}
            </a>
          )}
          {error && <div className="px-2.5 py-1.5 text-[11px] text-rose-400">✗ {error}</div>}
        </div>
      )}
    </div>
  );
}

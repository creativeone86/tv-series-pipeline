'use client';

/**
 * DemoModeBanner (v10.1.2 → v10.5.1 setup progress) — UI for "one key, graded experience".
 *
 * Older builds only warned when demoMode (missing image/video); now a **setup progress bar**:
 *   - header: engines N/5 + bar + graded copy (level: none/script/visual/film/media-only)
 *   - detail: per-stage chips marked real / mock — no false promises (acceptance)
 * Hidden when all 5 engines are ready; dismissable (localStorage).
 * Stage / level copy is localized on the client from stage.key + level
 * so a Chinese API payload never leaks into an English UI.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

const DISMISS_KEY = 'qfmj-demo-banner-dismissed';

interface StageTruth {
  key: string;
  label: string;
  real: boolean;
}

interface ReadinessView {
  readyCount: number;
  total: number;
  level?: string;
  levelLabel: string;
  stages: StageTruth[];
}

const STAGE_I18N: Record<string, keyof Translations['readiness']> = {
  script: 'stageScript',
  storyboardPlan: 'stageStoryboardPlan',
  audit: 'stageAudit',
  storyboardImage: 'stageStoryboardImage',
  shotVideo: 'stageShotVideo',
  tts: 'stageTts',
  lipsync: 'stageLipsync',
  assemble: 'stageAssemble',
};

const LEVEL_I18N: Record<string, keyof Translations['readiness']> = {
  none: 'levelNone',
  script: 'levelScript',
  visual: 'levelVisual',
  film: 'levelFilm',
  'media-only': 'levelMediaOnly',
};

export function DemoModeBanner() {
  const { t } = useLocale();
  const [report, setReport] = useState<ReadinessView | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    let alive = true;
    fetch('/api/runtime/readiness')
      .then((r) => r.json())
      .then((d: Partial<ReadinessView>) => {
        if (!alive || !d || typeof d.readyCount !== 'number' || typeof d.total !== 'number') return;
        if (d.readyCount >= d.total) return; // all configured → do not nag
        setReport({
          readyCount: d.readyCount,
          total: d.total,
          level: d.level,
          levelLabel: d.levelLabel || '',
          stages: Array.isArray(d.stages) ? d.stages : [],
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!report) return null;
  const pct = Math.round((report.readyCount / Math.max(report.total, 1)) * 100);
  const levelKey = report.level ? LEVEL_I18N[report.level] : undefined;
  const levelLabel = (levelKey && t.readiness[levelKey]) || report.levelLabel;

  return (
    <div className="mb-4 rounded-lg border border-[var(--cinema-amber-deep,#8a6d1f)] bg-[rgba(232,197,71,0.08)] px-4 py-2.5 text-[12.5px] leading-snug">
      {/* Header: progress + graded copy + how-to / dismiss */}
      <div className="flex items-center gap-3">
        <span className="text-[var(--cinema-amber,#E8C547)] shrink-0">●</span>
        <b className="text-[var(--cinema-amber,#E8C547)] shrink-0 whitespace-nowrap">
          {t.collab.readinessTitle} {report.readyCount}/{report.total}
        </b>
        <span
          className="hidden sm:block h-1.5 w-24 shrink-0 rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={report.readyCount}
          aria-valuemin={0}
          aria-valuemax={report.total}
          aria-label={t.collab.readinessTitle}
        >
          <span className="block h-full bg-[var(--cinema-amber,#E8C547)]" style={{ width: `${pct}%` }} />
        </span>
        <span className="flex-1 opacity-90 min-w-0 truncate" title={levelLabel}>{levelLabel}</span>
        <Link href="/dashboard/health" className="shrink-0 underline opacity-80 hover:opacity-100 whitespace-nowrap">
          {t.collab.demoHowToEnable} →
        </Link>
        <button
          type="button"
          aria-label={t.collab.demoHowToEnable}
          onClick={() => {
            try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
            setReport(null);
          }}
          className="shrink-0 opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>

      {/* Detail: per-stage real/mock chips */}
      {report.stages.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
          {report.stages.map((s) => {
            const sk = STAGE_I18N[s.key];
            const label = (sk && t.readiness[sk]) || s.label;
            return (
            <span
              key={s.key}
              title={`${label}:${s.real ? t.collab.readinessReal : t.collab.readinessSim}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                s.real
                  ? 'border-emerald-500/35 text-emerald-300'
                  : 'border-[var(--cinema-amber-deep,#8a6d1f)] text-[var(--cinema-amber,#E8C547)] opacity-90'
              }`}
            >
              <span aria-hidden="true">{s.real ? '✓' : '○'}</span>
              {label}
              <span className="opacity-75">· {s.real ? t.collab.readinessReal : t.collab.readinessSim}</span>
            </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * components/project/emotion-rhythm-chart (v7.5) — emotion curve + multi-track
 * rhythm heatmap (CineMatrix Emotion Curve / CineFlow rhythm heatmap).
 *
 * Four curves vs shot: emotion / tension / rhythm / brightness (0-100), plus
 * climax vertical + legend + summary.
 * Presentational; input is EmotionPoint[] from lib/emotion-curve.
 */

import { useState } from 'react';
import { Pulse as Activity } from '@phosphor-icons/react';
import { EmptyState } from '@/components/cinema/primitives';
import { curveStats, describeCurve, type EmotionPoint } from '@/lib/emotion-curve';
import { useLocale } from '@/hooks/use-locale';

const SERIES: { key: keyof EmotionPoint; color: string }[] = [
  { key: 'emotion', color: '#E8C547' },
  { key: 'tension', color: '#C8432A' },
  { key: 'rhythm', color: '#5A8FCC' },
  { key: 'brightness', color: '#22D3A5' },
];

const W = 100, H = 42, PAD = 2;

function linePath(curve: EmotionPoint[], key: keyof EmotionPoint): string {
  const n = curve.length;
  if (n === 0) return '';
  return curve
    .map((p, i) => {
      const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p[key] as number) / 100) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function EmotionRhythmChart({ curve }: { curve: EmotionPoint[] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const stats = curveStats(curve);
  const seriesLabel = (key: string) => ({
    emotion: t.projectMisc.seriesEmotion,
    tension: t.projectMisc.seriesTension,
    rhythm: t.projectMisc.seriesRhythm,
    brightness: t.projectMisc.seriesBrightness,
  }[key] || key);

  if (!curve.length) {
    return <div className="cinema-card"><EmptyState icon={Activity} title={t.projectMisc.noEmotionData} hint={t.projectMisc.noEmotionHint} /></div>;
  }

  const climaxX = stats.climaxIndex >= 0 && curve.length > 1
    ? PAD + (stats.climaxIndex / (curve.length - 1)) * (W - PAD * 2)
    : null;

  return (
    <div className="cinema-card !p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="cinema-eyebrow flex items-center gap-1.5"><Activity size={13} className="text-[var(--primary)]" /> {t.projectMisc.emotionChartTitle}</span>
        <span className="cinema-mono text-[10px] opacity-60">{describeCurve(curve)}</span>
      </div>

      {/* Legend (click to toggle) */}
      <div className="flex flex-wrap gap-2 mb-2">
        {SERIES.map((s) => (
          <button key={s.key} onClick={() => setHidden((h) => ({ ...h, [s.key]: !h[s.key] }))}
            className={`flex items-center gap-1 cinema-mono text-[10px] transition ${hidden[s.key] ? 'opacity-30' : 'opacity-90'}`}>
            <span className="w-3 h-[2px] rounded" style={{ background: s.color }} />{seriesLabel(s.key)}
          </button>
        ))}
      </div>

      {/* Curves */}
      <div className="relative w-full" style={{ aspectRatio: '100 / 42' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          {/* Grid baselines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={PAD} x2={W - PAD} y1={H - PAD - g * (H - PAD * 2)} y2={H - PAD - g * (H - PAD * 2)}
              stroke="var(--border)" strokeWidth="0.2" />
          ))}
          {/* Climax vertical */}
          {climaxX != null && (
            <line x1={climaxX} x2={climaxX} y1={PAD} y2={H - PAD} stroke="var(--primary)" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.6" />
          )}
          {/* 4 tracks */}
          {SERIES.filter((s) => !hidden[s.key]).map((s) => (
            <path key={s.key} d={linePath(curve, s.key)} fill="none" stroke={s.color} strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>

      {/* X-axis shot numbers + climax mark */}
      <div className="flex justify-between cinema-mono text-[9px] opacity-50 mt-1">
        <span>{t.visionAudit.shotUnit} 1</span>
        {stats.climaxIndex >= 0 && <span className="text-[var(--primary)]">{t.projectMisc.climaxShot.replace('{n}', String(stats.climaxIndex + 1))}</span>}
        <span>{t.visionAudit.shotUnit} {curve.length}</span>
      </div>
    </div>
  );
}

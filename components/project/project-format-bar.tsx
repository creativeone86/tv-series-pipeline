'use client';

/**
 * components/project/project-format-bar (v7.4) — project-level format bar
 * (CineFlow-style top bar).
 *
 * Aspect / color space / fps / safe area in one row + save.
 * Persists as project_assets type='project-format'.
 */

import { useState } from 'react';
import { FloppyDisk as Save, CircleNotch as Loader2, Check, FilmSlate as Clapperboard } from '@phosphor-icons/react';
import {
  FORMAT_PRESETS, COLOR_SPACES, FRAME_RATES, normalizeProjectFormat,
  type ProjectFormat,
} from '@/lib/project-format';
import { useLocale } from '@/hooks/use-locale';

export function ProjectFormatBar({ projectId, initialFormat, onSaved }: {
  projectId: string;
  initialFormat?: Partial<ProjectFormat>;
  onSaved?: (f: ProjectFormat) => void;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [f, setF] = useState<ProjectFormat>(() => normalizeProjectFormat(initialFormat));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<ProjectFormat>) => { setF((p) => ({ ...p, ...patch })); setSaved(false); };

  const aspectLabel = (p: (typeof FORMAT_PRESETS)[number]) => {
    if (locale !== 'en') return p.label;
    const en: Record<string, string> = {
      '16:9': t.projectMisc.aspect169,
      '9:16': t.projectMisc.aspect916,
      '1:1': t.projectMisc.aspect11,
      '4:3': t.projectMisc.aspect43,
    };
    return en[p.id] || p.label;
  };

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/format`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format: f }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setSaved(true); onSaved?.(j.format || f); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  }

  return (
    <div className="cinema-card-hi !p-2.5 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="cinema-eyebrow flex items-center gap-1.5 shrink-0"><Clapperboard size={13} className="text-[var(--primary)]" /> {t.projectMisc.projectFormat}</span>

      <label className="flex items-center gap-1.5 cinema-mono text-[10px] opacity-80">{t.projectMisc.aspectRatio}
        <select className="cinema-input !py-1 !text-[11px] !w-auto" value={f.aspectId} onChange={(e) => set({ aspectId: e.target.value })}>
          {FORMAT_PRESETS.map((p) => <option key={p.id} value={p.id}>{aspectLabel(p)}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5 cinema-mono text-[10px] opacity-80">{t.projectMisc.colorSpace}
        <select className="cinema-input !py-1 !text-[11px] !w-auto" value={f.colorSpaceId} onChange={(e) => set({ colorSpaceId: e.target.value })}>
          {COLOR_SPACES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5 cinema-mono text-[10px] opacity-80">{t.projectMisc.frameRate}
        <select className="cinema-input !py-1 !text-[11px] !w-auto" value={f.fps} onChange={(e) => set({ fps: Number(e.target.value) })}>
          {FRAME_RATES.map((r) => <option key={r} value={r}>{r >= 48 ? t.projectMisc.fpsOvercrank.replace('{n}', String(r)) : `${r}fps`}</option>)}
        </select>
      </label>
      <button onClick={() => set({ safeArea: !f.safeArea })}
        className={`cinema-mono text-[10px] px-2 py-1 rounded border ${f.safeArea ? 'border-[var(--accent-green)] text-[var(--accent-green)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
        {t.projectMisc.safeArea} {f.safeArea ? 'ON' : 'OFF'}
      </button>

      <button onClick={save} disabled={saving} className="cinema-btn-ghost !text-[11px] ml-auto disabled:opacity-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} className="text-[var(--accent-green)]" /> : <Save size={12} />}
        {saved ? t.projectMisc.savedShort : t.projectMisc.saveFormat}
      </button>
    </div>
  );
}

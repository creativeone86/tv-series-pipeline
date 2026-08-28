'use client';

/**
 * components/project/shot-cinematography-panel (v7.2)
 *
 * Single-shot cinematography cockpit — controlled. CineMaster/CineMatrix-style
 * per-shot panel: size (seg) · angle (seg) · lens (select) · movement (select)
 * · focus (seg) · atmosphere (chips) · motion (slider).
 *
 * Display + controlled only: value / onChange, no persist / network (parent modal).
 */

import {
  SHOT_SIZES, CAMERA_ANGLES, LENS_PRESETS, MOVEMENTS, FOCUS_PRESETS, ATMOSPHERES,
  LIGHTING_SETUPS, CONTRAST_LEVELS, COLOR_TEMPS, CAMERA_BODIES, LENS_SERIES,
  T_STOPS, ISO_OPTIONS, ND_OPTIONS, WB_PRESETS,
  type ShotSpec, type Preset, type LightingSpec, type CameraSimSpec,
} from '@/lib/cinematography';
import { useLocale } from '@/hooks/use-locale';

type Named = { label: string; short?: string; nameEn?: string; en?: string };

function libLabel(locale: string, p: Named, prefer: 'label' | 'short' = 'label') {
  if (locale === 'en') return p.nameEn || p.en || (prefer === 'short' ? (p.short || p.label) : p.label);
  return prefer === 'short' ? (p.short || p.label) : p.label;
}

function SegGroup<T extends string>({ list, value, onPick, title, locale }: {
  list: Preset<T>[]; value: T; onPick: (id: T) => void; title: string; locale: string;
}) {
  return (
    <div>
      <div className="cinema-eyebrow mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            title={libLabel(locale, p)}
            className={`cinema-mono text-[10px] px-2 py-1 rounded-md border transition ${
              value === p.id
                ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-muted)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)]'
            }`}
          >
            {libLabel(locale, p, 'short')}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShotCinematographyPanel({ value, onChange }: {
  value: ShotSpec;
  onChange: (next: ShotSpec) => void;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const set = (patch: Partial<ShotSpec>) => onChange({ ...value, ...patch });
  const setLight = (patch: Partial<LightingSpec>) => onChange({ ...value, lighting: { ...value.lighting, ...patch } });
  const setCam = (patch: Partial<CameraSimSpec>) => onChange({ ...value, camera: { ...value.camera, ...patch } });
  const contrastShort = (id: string) =>
    id === 'low' ? t.projectPanels.contrastLow : id === 'high' ? t.projectPanels.contrastHigh : t.projectPanels.contrastMed;

  return (
    <div className="flex flex-col gap-3">
      <SegGroup title={t.projectPanels.shotSize} list={SHOT_SIZES} value={value.shotSize} onPick={(shotSize) => set({ shotSize })} locale={locale} />
      <SegGroup title={t.projectPanels.angle} list={CAMERA_ANGLES} value={value.angle} onPick={(angle) => set({ angle })} locale={locale} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="cinema-eyebrow mb-1">{t.projectPanels.lens}</div>
          <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.lens} onChange={(e) => set({ lens: e.target.value as any })}>
            {LENS_PRESETS.map((p) => <option key={p.id} value={p.id}>{libLabel(locale, p)}</option>)}
          </select>
        </div>
        <div>
          <div className="cinema-eyebrow mb-1">{t.projectPanels.movement}</div>
          <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.movement} onChange={(e) => set({ movement: e.target.value as any })}>
            {MOVEMENTS.map((p) => <option key={p.id} value={p.id}>{libLabel(locale, p)} · {libLabel(locale, p, 'short')}</option>)}
          </select>
        </div>
      </div>

      <SegGroup title={t.projectPanels.focus} list={FOCUS_PRESETS} value={value.focus} onPick={(focus) => set({ focus })} locale={locale} />

      <div>
        <div className="cinema-eyebrow mb-1">{t.projectPanels.atmosphere}</div>
        <div className="flex flex-wrap gap-1">
          {ATMOSPHERES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set({ atmosphere: p.id })}
              className={`text-[10px] px-2 py-1 rounded-full border transition ${
                value.atmosphere === p.id
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(90,143,204,0.12)]'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)]'
              }`}
            >
              {libLabel(locale, p)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="cinema-eyebrow mb-1 flex justify-between">
          {t.projectPanels.motion} <span className="cinema-mono text-[var(--primary)]">{value.motion}</span>
        </label>
        <input
          type="range" min={0} max={100} value={value.motion}
          onChange={(e) => set({ motion: Number(e.target.value) })}
          className="w-full accent-[var(--primary)]"
        />
      </div>

      {/* v7.4 lighting + camera/lens sim (collapsed, advanced) */}
      <details className="rounded-lg border border-[var(--border)] p-2.5 [&_summary]:cursor-pointer">
        <summary className="cinema-eyebrow !mb-0 select-none">{t.projectPanels.advanced}</summary>
        <div className="flex flex-col gap-3 mt-3">
          {/* Lighting */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <div className="cinema-eyebrow mb-1">{t.projectPanels.lighting}</div>
              <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.lighting.setup}
                onChange={(e) => setLight({ setup: e.target.value as any })}>
                {LIGHTING_SETUPS.map((p) => <option key={p.id} value={p.id}>{libLabel(locale, p)}</option>)}
              </select>
            </div>
            <div>
              <div className="cinema-eyebrow mb-1">{t.projectPanels.colorTemp}</div>
              <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.lighting.keyTempK}
                onChange={(e) => setLight({ keyTempK: Number(e.target.value) })}>
                {COLOR_TEMPS.map((c) => <option key={c.k} value={c.k}>{libLabel(locale, c)}</option>)}
              </select>
            </div>
            <div>
              <div className="cinema-eyebrow mb-1">{t.projectPanels.contrast}</div>
              <div className="flex gap-0.5">
                {CONTRAST_LEVELS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setLight({ contrast: c.id })}
                    className={`flex-1 cinema-mono text-[10px] py-1.5 rounded border transition ${value.lighting.contrast === c.id ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-muted)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                    {contrastShort(c.id)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Camera / lens */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="cinema-eyebrow mb-1">{t.projectPanels.body}</div>
              <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.camera.body} onChange={(e) => setCam({ body: e.target.value as any })}>
                {CAMERA_BODIES.map((p) => <option key={p.id} value={p.id}>{libLabel(locale, p)}</option>)}
              </select>
            </div>
            <div>
              <div className="cinema-eyebrow mb-1">{t.projectPanels.lensSeries}</div>
              <select className="cinema-input !py-1.5 !text-[11px] w-full" value={value.camera.lensSeries} onChange={(e) => setCam({ lensSeries: e.target.value as any })}>
                {LENS_SERIES.map((p) => <option key={p.id} value={p.id}>{libLabel(locale, p)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 col-span-2 gap-2">
              <label className="cinema-mono text-[10px] opacity-70">T-Stop
                <select className="cinema-input !py-1 !text-[11px] w-full mt-0.5" value={value.camera.tStop} onChange={(e) => setCam({ tStop: Number(e.target.value) })}>
                  {T_STOPS.map((ts) => <option key={ts} value={ts}>T{ts}</option>)}
                </select>
              </label>
              <label className="cinema-mono text-[10px] opacity-70">ISO
                <select className="cinema-input !py-1 !text-[11px] w-full mt-0.5" value={value.camera.iso} onChange={(e) => setCam({ iso: Number(e.target.value) })}>
                  {ISO_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </label>
              <label className="cinema-mono text-[10px] opacity-70">ND
                <select className="cinema-input !py-1 !text-[11px] w-full mt-0.5" value={value.camera.nd} onChange={(e) => setCam({ nd: e.target.value })}>
                  {ND_OPTIONS.map((n) => <option key={n} value={n}>{n === 'none' ? t.projectPanels.ndNone : n}</option>)}
                </select>
              </label>
              <label className="cinema-mono text-[10px] opacity-70">{t.projectPanels.wb}
                <select className="cinema-input !py-1 !text-[11px] w-full mt-0.5" value={value.camera.wb} onChange={(e) => setCam({ wb: Number(e.target.value) })}>
                  {WB_PRESETS.map((w) => <option key={w} value={w}>{w}K</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

'use client';

/**
 * components/project/continuity-console (v7.3) — continuity + seed-lock console (CineFlow Continuity Pro analogue)
 *
 * Project-level continuity cockpit:
 *   - Visual gene library: character lock (FaceID) / environment lock / seed lock (main+aux, refresh)
 *   - Continuity console: link mode (hard cut / match cut / last-frame) / strength / wardrobe lock / lighting lock / FaceID strength
 *   - Board continuity preview: per-shot color chips (character / wardrobe / environment / lighting / continuity / seed)
 *
 * Settings persist as project_assets type='continuity' (POST /api/projects/[id]/continuity).
 */

import { useState } from 'react';
import { Lock, ArrowsClockwise as RefreshCw, FloppyDisk as Save, CircleNotch as Loader2, Users, Mountains as Mountain, Hash, LinkSimple as Link2, UserFocus as ScanFace, Check } from '@phosphor-icons/react';
import { EmptyState } from '@/components/cinema/primitives';
import {
  LINK_MODES, FACEID_STRENGTHS, generateSeed, normalizeContinuitySettings,
  computeContinuityTags, describeContinuity,
  type ContinuitySettings, type FaceIdStrength,
} from '@/lib/continuity';
import { useLocale } from '@/hooks/use-locale';

const TAG_COLOR: Record<string, string> = {
  character: 'var(--cinema-amber)', clothing: 'var(--cinema-green)', environment: 'var(--cinema-blue)',
  lighting: 'var(--cinema-red)', time: 'var(--cinema-violet)', seed: 'var(--cinema-magenta)',
};

export function ContinuityConsole({
  projectId, characters = [], scenes = [], storyboards = [], initialSettings, onSaved,
}: {
  projectId: string;
  characters?: any[];
  scenes?: any[];
  storyboards?: any[];
  initialSettings?: Partial<ContinuitySettings>;
  onSaved?: (s: ContinuitySettings) => void;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [s, setS] = useState<ContinuitySettings>(() => normalizeContinuitySettings(initialSettings));
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const set = (patch: Partial<ContinuitySettings>) => setS((prev) => ({ ...prev, ...patch }));

  const char0 = characters[0];
  const scene0 = scenes[0];
  const hasCharacter = characters.length > 0;
  const hasEnvironment = scenes.length > 0;
  const charName = char0
    ? (locale === 'en' ? (char0.nameEn || char0.name || 'CHAR-001') : (char0.name || 'CHAR-001'))
    : '';
  const sceneName = scene0
    ? (locale === 'en' ? (scene0.nameEn || scene0.name || 'ENV-001') : (scene0.name || 'ENV-001'))
    : '';

  async function save() {
    setSaving(true); setSavedMsg('');
    try {
      const r = await fetch(`/api/projects/${projectId}/continuity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setSavedMsg(j?.error || pt.saveFailed.replace('{status}', String(r.status)));
      else { setSavedMsg(pt.savedOk); onSaved?.(j.settings || s); setTimeout(() => setSavedMsg(''), 2500); }
    } catch (e: any) { setSavedMsg(e?.message || pt.networkError); }
    finally { setSaving(false); }
  }

  const lockRows = [
    ['clothingLock', pt.clothingLock],
    ['lightingLock', pt.lightingLock],
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Left: visual gene library + board continuity preview */}
      <div className="flex flex-col gap-4">
        <div className="cinema-card !p-4">
          <div className="cinema-eyebrow mb-3">{pt.geneLib}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Character lock */}
            <div className="rounded-lg border border-[var(--cinema-border)] p-3">
              <div className="flex items-center gap-1.5 mb-2"><ScanFace size={13} className="text-[var(--cinema-amber)]" /><span className="text-[11px] font-semibold">{pt.charLock}</span></div>
              {char0 ? (
                <>
                  <div className="cinema-mono text-[10px] opacity-70 truncate">{charName}</div>
                  <div className="cinema-mono text-[9px] opacity-50 mt-0.5">FaceID · {s.faceIdStrength.toUpperCase()}</div>
                  {characters.length > 1 && <div className="cinema-mono text-[9px] opacity-40 mt-0.5">{pt.moreChars.replace('{n}', String(characters.length - 1))}</div>}
                </>
              ) : <div className="cinema-mono text-[10px] opacity-40">{pt.noCharAsset}</div>}
            </div>
            {/* Environment lock */}
            <div className="rounded-lg border border-[var(--cinema-border)] p-3">
              <div className="flex items-center gap-1.5 mb-2"><Mountain size={13} className="text-[var(--cinema-blue)]" /><span className="text-[11px] font-semibold">{pt.envLock}</span></div>
              {scene0 ? (
                <>
                  <div className="cinema-mono text-[10px] opacity-70 truncate">{sceneName}</div>
                  <div className="cinema-mono text-[9px] opacity-50 mt-0.5">{s.lightingLock ? pt.lightingOn : pt.lightingOff}</div>
                  {scenes.length > 1 && <div className="cinema-mono text-[9px] opacity-40 mt-0.5">{pt.moreScenes.replace('{n}', String(scenes.length - 1))}</div>}
                </>
              ) : <div className="cinema-mono text-[10px] opacity-40">{pt.noSceneAsset}</div>}
            </div>
            {/* Seed lock */}
            <div className="rounded-lg border border-[var(--cinema-border)] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><Hash size={13} className="text-[var(--cinema-magenta)]" /><span className="text-[11px] font-semibold">{pt.seedLock}</span></div>
                <button onClick={() => set({ mainSeed: generateSeed(), auxSeed: generateSeed() })} title={pt.refreshSeeds} className="opacity-60 hover:opacity-100"><RefreshCw size={12} /></button>
              </div>
              <div className="cinema-mono text-sm text-[var(--cinema-amber)] tracking-wider">{s.mainSeed}</div>
              <div className="cinema-mono text-[9px] opacity-50 mt-0.5">{pt.auxSeed.replace('{n}', String(s.auxSeed))}</div>
            </div>
          </div>
        </div>

        {/* Board continuity logic preview */}
        <div className="cinema-card !p-4">
          <div className="cinema-eyebrow mb-3">{pt.boardLogic.replace('{n}', String(storyboards.length))}</div>
          {storyboards.length === 0 && <EmptyState icon={Link2} title={pt.noBoards} hint={pt.noBoardsHint} />}
          <div className="flex flex-col gap-2">
            {storyboards.slice(0, 8).map((sb: any, i: number) => {
              const tags = computeContinuityTags(s, { hasCharacter, hasEnvironment, isFirstShot: i === 0 });
              return (
                <div key={sb.id || i} className="flex items-center gap-2 py-1.5 border-b border-[var(--cinema-border)] last:border-0">
                  <span className="cinema-mono text-[10px] opacity-60 w-12 shrink-0">SHOT {String(sb.shotNumber ?? i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: TAG_COLOR[tag.id], color: TAG_COLOR[tag.id] }}>{tag.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {storyboards.length > 8 && <div className="cinema-mono text-[9px] opacity-40 mt-2">{pt.moreShotsSame.replace('{n}', String(storyboards.length - 8))}</div>}
        </div>
      </div>

      {/* Right: continuity console */}
      <aside className="cinema-card !p-4 h-fit">
        <div className="cinema-eyebrow mb-3 flex items-center gap-1.5"><Link2 size={13} /> {pt.consoleTitle}</div>

        {/* Link mode */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold mb-1.5">{pt.linkMode}</div>
          <div className="flex flex-col gap-1">
            {LINK_MODES.map((m) => (
              <button key={m.id} onClick={() => set({ linkMode: m.id })}
                className={`text-left px-2.5 py-1.5 rounded-md border transition ${s.linkMode === m.id ? 'border-[var(--cinema-amber)] bg-[var(--cinema-amber-glow)]' : 'border-[var(--cinema-border)] hover:border-[var(--cinema-border-hi)]'}`}>
                <div className="text-[11px] font-semibold">{locale === 'en' ? m.en : m.label} <span className="cinema-mono text-[9px] opacity-50">{m.en}</span></div>
                <div className="cinema-mono text-[9px] opacity-55">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Continuity strength */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold mb-1 flex justify-between">{pt.strength} <span className="cinema-mono text-[var(--cinema-amber)]">{s.continuityStrength.toFixed(2)}</span></label>
          <input type="range" min={0} max={1} step={0.05} value={s.continuityStrength}
            onChange={(e) => set({ continuityStrength: Number(e.target.value) })} className="w-full accent-[var(--cinema-amber)]" />
          <div className="flex justify-between cinema-mono text-[9px] opacity-40"><span>{pt.loose}</span><span>{pt.strict}</span></div>
        </div>

        {/* Wardrobe lock / lighting lock */}
        {lockRows.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between mb-2">
            <span className="text-[11px] flex items-center gap-1.5"><Lock size={11} className="opacity-50" />{label}</span>
            <button onClick={() => set({ [key]: !s[key] } as any)}
              className={`cinema-mono text-[10px] px-2 py-0.5 rounded border ${s[key] ? 'border-[var(--cinema-green)] text-[var(--cinema-green)]' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)]'}`}>
              {s[key] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}

        {/* FaceID strength */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <span className="text-[11px] flex items-center gap-1.5"><ScanFace size={12} className="opacity-50" />{pt.faceIdStrength}</span>
          <select value={s.faceIdStrength} onChange={(e) => set({ faceIdStrength: e.target.value as FaceIdStrength })}
            className="cinema-input !py-1 !text-[11px] !w-auto">
            {FACEID_STRENGTHS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>

        <div className="cinema-mono text-[9px] opacity-50 mb-2 leading-relaxed border-t border-[var(--cinema-border)] pt-2">{describeContinuity(s)}</div>

        <button onClick={save} disabled={saving} className="cinema-btn-primary w-full justify-center !py-2.5 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {pt.saveContinuity}
        </button>
        {savedMsg && <p className="cinema-mono text-[10px] mt-1.5 text-center flex items-center justify-center gap-1 text-[var(--cinema-green)]"><Check size={11} />{savedMsg}</p>}
      </aside>
    </div>
  );
}

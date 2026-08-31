'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleNotch as Loader2, Lock, MagnifyingGlass, Play, CurrencyEur, PencilSimple } from '@phosphor-icons/react';

interface Frame {
  beatId: string;
  frameIndex?: number;
  strategy: string;
  imageUrl?: string;
  costEur: number;
  blockedCostEur?: number;
  reason?: string;
  provider?: string;
}

interface Beat {
  id: string;
  order: number;
  narrationText: string;
  purpose: string;
  teachingGoal: string;
  visualGoal: string;
  activeEntities: string[];
  importance: number;
  actualNarrationDuration?: number;
  sectionId?: string;
  factualReviewStatus?: string;
  overlayText?: string;
  locked?: boolean;
  shotType?: string;
  claims?: Array<{ claim: string; status?: string; sourceUrl?: string }>;
}

interface Status {
  beats: Beat[];
  frames: Frame[];
  spentEur: number;
  reservedTtsEur: number;
  governor: { level: string; remainingImageEur: number; message: string; allowed: string[] };
  preflight: {
    fromVocabulary: number; composited: number; deterministic: number; needingGeneration: number;
    projectedImageEur: number; projectedTtsEur: number; projectedTotalEur: number;
    capEur: number | null; remainingEur: number; level: string;
  };
  review: { status: string };
  vocabulary: Array<{ id: string; entityId: string; imageUrl: string; locked: boolean; version: number }>;
  finalVideoUrl?: string;
  config?: { explainer?: { capEur?: number; frameSource?: string } };
  sourcesBlock?: string;
  fontPreflight?: { ok: boolean; font: string | null; warning?: string };
  claims?: { verified: number; total: number };
}

const LEVEL_CLS: Record<string, string> = {
  none: 'text-[var(--cinema-text-3)]',
  ok: 'text-[var(--cinema-green)]',
  warn: 'text-[var(--cinema-amber)]',
  soft_over: 'text-[var(--cinema-amber)]',
  hard_block: 'text-[var(--cinema-red)]',
};

export function ExplainerBeatsTab({ projectId, onRefresh }: { projectId: string; onRefresh?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Array<{ id: string; entityId: string; imageUrl: string }>>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/explainer`);
    const j = await r.json();
    if (r.ok) setStatus(j);
    else setError(j?.message || `load ${r.status}`);
  }

  useEffect(() => { void load(); }, [projectId]);

  async function act(path: string, label: string, body?: unknown) {
    setBusy(label); setError('');
    try {
      const r = await fetch(`/api/projects/${projectId}/explainer/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || j?.error || `${label} ${r.status}`);
      }
      await load();
      onRefresh?.();
    } catch (e: any) {
      setError(e?.message || `${label} failed`);
    } finally {
      setBusy(null);
    }
  }

  async function promote(frame: Frame, entityId: string) {
    if (!frame.imageUrl) return;
    await act('promote', 'promote', { imageUrl: frame.imageUrl, canonicalEntityId: entityId });
  }

  async function searchVocab() {
    const r = await fetch(`/api/projects/${projectId}/explainer/promote?q=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (r.ok) setHits(j.items || []);
  }

  async function saveNarration(beat: Beat) {
    const text = drafts[beat.id] ?? beat.narrationText;
    setBusy(`save-${beat.id}`);
    try {
      const r = await fetch(`/api/projects/${projectId}/explainer/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId: beat.id, patch: { narrationText: text }, note: 'inline edit' }),
      });
      if (!r.ok) throw new Error('revise failed');
      await load();
    } catch (e: any) {
      setError(e?.message || 'save failed');
    } finally {
      setBusy(null);
    }
  }

  async function toggleLock(beat: Beat) {
    await act('revise', beat.locked ? 'unlock' : 'lock', { lockBeatId: beat.id, locked: !beat.locked });
  }

  const sections = useMemo(() => {
    if (!status) return [];
    const map = new Map<string, Beat[]>();
    for (const b of status.beats) {
      const id = b.sectionId || 'sec-1';
      map.set(id, [...(map.get(id) || []), b]);
    }
    return [...map.entries()];
  }, [status]);

  if (!status) {
    return <div className="cinema-card p-8 text-center cinema-subhead">{error || 'Loading explainer…'}</div>;
  }

  const cap = status.preflight.capEur ?? status.config?.explainer?.capEur ?? 40;
  const spent = status.spentEur;
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const free = status.frames.filter((f) => f.costEur <= 0 && f.strategy !== 'UNRESOLVED').length;
  const paid = status.frames.filter((f) => f.costEur > 0).length;
  const framesOf = (id: string) => status.frames.filter((f) => f.beatId === id);

  return (
    <div className="space-y-4">
      <div className="cinema-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="cinema-eyebrow">Episode budget</div>
            <div className="flex items-baseline gap-2 mt-1">
              <CurrencyEur size={16} />
              <span className="cinema-headline text-lg">{spent.toFixed(2)}</span>
              <span className="opacity-50 text-sm">/ {cap} EUR</span>
              <span className={`cinema-mono text-[11px] uppercase ${LEVEL_CLS[status.governor.level] || ''}`}>
                {status.governor.level}
              </span>
            </div>
          </div>
          <div className="cinema-mono text-[11px] opacity-70">
            free {free} · paid {paid} · unresolved {status.frames.filter((f) => f.strategy === 'UNRESOLVED').length}
            {' · '}TTS reserved {status.reservedTtsEur.toFixed(2)}
            {status.claims ? ` · claims ${status.claims.verified}/${status.claims.total}` : ''}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--cinema-surface-2)] mt-3 overflow-hidden">
          <div className="h-full bg-[var(--cinema-amber)]" style={{ width: `${pct}%` }} />
        </div>
        <div className="cinema-mono text-[10px] opacity-60 mt-2">
          preflight: vocab {status.preflight.fromVocabulary} · compose {status.preflight.composited} · svg {status.preflight.deterministic} · generate {status.preflight.needingGeneration}
          {' · '}est €{status.preflight.projectedTotalEur.toFixed(2)}
        </div>
        {status.fontPreflight?.warning && (
          <div className="text-[var(--cinema-amber)] text-xs mt-2">{status.fontPreflight.warning}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => act('plan', 'plan')} disabled={!!busy} className="cinema-btn-ghost !text-xs">{busy === 'plan' ? <Loader2 size={12} className="animate-spin" /> : null} Plan</button>
        <button onClick={() => act('tts', 'tts')} disabled={!!busy} className="cinema-btn-ghost !text-xs">{busy === 'tts' ? <Loader2 size={12} className="animate-spin" /> : null} TTS</button>
        <button onClick={() => act('resolve', 'resolve')} disabled={!!busy} className="cinema-btn-ghost !text-xs">{busy === 'resolve' ? <Loader2 size={12} className="animate-spin" /> : null} Resolve frames</button>
        <button onClick={() => act('resolve', 'force-resolve', { force: true })} disabled={!!busy} className="cinema-btn-ghost !text-xs">Regenerate frames</button>
        <button onClick={() => act('render', 'render')} disabled={!!busy} className="cinema-btn-primary !text-xs">{busy === 'render' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Render</button>
        <select
          className="cinema-input !py-1 !text-xs w-36"
          value={status.config?.explainer?.frameSource || 'auto'}
          onChange={async (e) => {
            await fetch(`/api/projects/${projectId}/explainer`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ explainer: { frameSource: e.target.value } }),
            });
            await load();
          }}
        >
          <option value="auto">frames: auto</option>
          <option value="generated">frames: generated</option>
          <option value="diagram">frames: diagram</option>
        </select>
      </div>
      {error && <div className="text-[var(--cinema-red)] text-xs">{error}</div>}

      {status.finalVideoUrl && (
        <video src={status.finalVideoUrl} controls className="w-full rounded-md border border-[var(--cinema-border)]" />
      )}

      <div className="cinema-card p-3 flex gap-2 items-center">
        <MagnifyingGlass size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vocabulary" className="cinema-input !py-1 flex-1" />
        <button onClick={searchVocab} className="cinema-btn-ghost !text-xs">Search</button>
        {hits.map((h) => (
          <span key={h.id} className="cinema-chip">{h.entityId}</span>
        ))}
      </div>

      <div className="space-y-4">
        {sections.map(([sectionId, beats]) => {
          const dur = beats.reduce((s, b) => s + (b.actualNarrationDuration || 0), 0);
          const collapsed = open[sectionId] === false;
          return (
            <div key={sectionId} className="cinema-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen((o) => ({ ...o, [sectionId]: o[sectionId] === false }))}
              >
                <span className="cinema-eyebrow">{sectionId}</span>
                <span className="cinema-mono text-[10px] opacity-60">{beats.length} beats · {dur ? `${dur.toFixed(1)}s` : 'no audio'}</span>
              </button>
              {!collapsed && (
                <div className="space-y-3 p-3 pt-0">
                  {beats.map((beat) => {
                    const frames = framesOf(beat.id);
                    const frame = frames[0];
                    return (
                      <div key={beat.id} className="rounded-md border border-[var(--cinema-border)] overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto bg-[var(--cinema-surface-2)] p-2">
                          {frames.length ? frames.map((f, i) => (
                            <img key={`${f.beatId}-${i}`} src={f.imageUrl} alt="" className="h-20 w-32 object-cover rounded shrink-0" />
                          )) : (
                            <div className="h-20 w-32 grid place-items-center cinema-mono text-[10px] opacity-40">NO FRAME</div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="cinema-mono text-[10px] opacity-60">BEAT {String(beat.order).padStart(2, '0')} · {beat.purpose}{beat.shotType ? ` · ${beat.shotType}` : ''}</span>
                            <div className="flex items-center gap-1">
                              <span className="cinema-chip">{frame?.strategy || 'PENDING'}</span>
                              {beat.factualReviewStatus && <span className="cinema-chip">{beat.factualReviewStatus}</span>}
                              <button onClick={() => toggleLock(beat)} className="cinema-chip !text-[10px]" title="Lock beat">
                                <Lock size={10} className={beat.locked ? '' : 'opacity-40'} />
                              </button>
                            </div>
                          </div>
                          <textarea
                            className="cinema-input w-full text-sm min-h-[72px]"
                            value={drafts[beat.id] ?? beat.narrationText}
                            onChange={(e) => setDrafts((d) => ({ ...d, [beat.id]: e.target.value }))}
                            disabled={beat.locked}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveNarration(beat)} disabled={!!busy || beat.locked} className="cinema-btn-ghost !text-xs">
                              <PencilSimple size={10} /> Save narration
                            </button>
                            <button onClick={() => act('resolve', 'regen-beat', { force: true, beatId: beat.id })} disabled={!!busy} className="cinema-btn-ghost !text-xs">Regen frames</button>
                          </div>
                          <p className="cinema-subhead text-xs opacity-70">{beat.visualGoal}</p>
                          <div className="flex flex-wrap gap-1">
                            {beat.activeEntities.map((e) => (
                              <button key={e} onClick={() => frame && promote(frame, e)} className="cinema-chip !text-[10px]" title="Promote to vocabulary">{e}</button>
                            ))}
                            {(beat.claims || []).map((c, i) => (
                              <a key={i} href={c.sourceUrl || undefined} className="cinema-chip !text-[10px]" target="_blank" rel="noreferrer">
                                {c.status || 'UNVERIFIED'}: {c.claim.slice(0, 40)}
                              </a>
                            ))}
                          </div>
                          <div className="cinema-mono text-[10px] opacity-60">
                            {beat.actualNarrationDuration ? `${beat.actualNarrationDuration.toFixed(1)}s` : 'no audio yet'}
                            {frame ? ` · €${frame.costEur.toFixed(3)}${frame.blockedCostEur ? ` blocked €${frame.blockedCostEur.toFixed(3)}` : ''}` : ''}
                            {frame?.reason ? ` · ${frame.reason}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {status.sourcesBlock && (
        <div className="cinema-card p-3">
          <div className="cinema-eyebrow mb-2">Sources</div>
          <pre className="cinema-mono text-[10px] whitespace-pre-wrap opacity-80">{status.sourcesBlock}</pre>
        </div>
      )}

      {status.vocabulary.length > 0 && (
        <div className="cinema-card p-3">
          <div className="cinema-eyebrow mb-2">Vocabulary</div>
          <div className="flex flex-wrap gap-2">
            {status.vocabulary.map((v) => (
              <div key={v.id} className="w-20">
                {v.imageUrl && <img src={v.imageUrl} alt={v.entityId} className="w-20 h-14 object-cover rounded" />}
                <div className="cinema-mono text-[9px] truncate">{v.entityId}{v.locked ? <Lock size={8} /> : null}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

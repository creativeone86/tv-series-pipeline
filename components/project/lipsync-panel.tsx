'use client';

/**
 * v9.6.2 — Lip-sync panel (phase 16 T1). Loads /api/projects/[id]/lipsync
 * (aggregated by lib/lipsync-plan) and shows film-wide lip-sync readiness
 * (pass/warn/block) + per-line alignability + issue hints. The selected
 * dialogue line's viseme keyframe track is visualized as a mouth-open
 * sparkline plus a jaw-open mouth driven by those keyframes (▶ play).
 * Mounted on the Vision Audit tab (alongside the consistency report as a
 * film-quality signal). Hidden automatically when there is no dialogue.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Microphone, Play, Stop, ArrowsClockwise, FilmSlate, CircleNotch, SpeakerHigh, Waveform } from '@phosphor-icons/react';
import { lipSyncReshootHints } from '@/lib/lipsync-plan';
import { rmsEnvelope, scoreLipAudioAlignment, autoAlignVisemes, shiftVisemeTrack } from '@/lib/lipsync-align';
import { LipSyncBatchPanel } from './lipsync-batch-panel';
import { VoiceShelf } from './voice-shelf';
import { VoiceRetakePanel } from './voice-retake-panel';
import { useLocale } from '@/hooks/use-locale';

type Viseme = 'sil' | 'MBP' | 'FV' | 'aa' | 'E' | 'I' | 'O' | 'U';
interface VisemeKeyframe { t: number; viseme: Viseme; mouthOpen: number; }
interface LineAlignment {
  shotNumber: number; score: number; speakerOnScreen: boolean; faceVisible: boolean;
  durationFits: boolean; alignable: boolean; issues: string[];
}
interface LinePlan {
  shotNumber: number; speaker?: string; text: string;
  windowSec: { start: number; end: number }; visemes: VisemeKeyframe[]; alignment: LineAlignment;
}
interface LipSyncPlan {
  lines: number; perLine: LinePlan[]; readiness: number;
  level: 'none' | 'pass' | 'warn' | 'block'; weakest: LinePlan | null; hints: string[];
}

const LEVEL_CLS: Record<LipSyncPlan['level'], string> = {
  pass: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  warn: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  block: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  none: '',
};
const scoreColor = (s: number) => (s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-rose-400');

/** Sample mouth-open at relative time t (seconds) on a viseme keyframe track (step hold). */
function mouthOpenAt(frames: VisemeKeyframe[], t: number): number {
  if (!frames.length) return 0;
  let v = frames[0].mouthOpen;
  for (const f of frames) { if (f.t <= t) v = f.mouthOpen; else break; }
  return v;
}

export function LipSyncPanel({ projectId, onJumpToWorkshop }: { projectId: string; onJumpToWorkshop?: (shotNumbers: number[]) => void }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [plan, setPlan] = useState<LipSyncPlan | null>(null);
  const [selShot, setSelShot] = useState<number | null>(null);
  const [open, setOpen] = useState(0);      // current mouth-open (animation-driven)
  const [playing, setPlaying] = useState(false);
  const [engine, setEngine] = useState<{ configured: boolean; hint?: string } | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderMsg, setRenderMsg] = useState<{ ok: boolean; text: string; videoUrl?: string } | null>(null);
  const [synthingAudio, setSynthingAudio] = useState(false);
  const [audioMsg, setAudioMsg] = useState<string | null>(null);
  const [aligning, setAligning] = useState(false);
  const [alignResult, setAlignResult] = useState<{ shotNumber: number; score: number; verdict: string; lagSec: number; corrected?: VisemeKeyframe[]; before?: number; after?: number } | null>(null);
  const audioUrlsRef = useRef<Map<number, string>>(new Map());
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync`);
        const body = await res.json();
        if (alive && res.ok) {
          const p = body.plan as LipSyncPlan;
          setPlan(p);
          setSelShot(p.weakest?.shotNumber ?? p.perLine[0]?.shotNumber ?? null);
        }
      } catch { /* silent: enhancement info */ }
      try {
        const er = await fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync/render`);
        const eb = await er.json();
        if (alive && er.ok) setEngine({ configured: !!eb.configured, hint: eb.hint });
      } catch { /* silent */ }
      try {
        const sr = await fetch(`/api/projects/${encodeURIComponent(projectId)}/shot-audio`);
        const sb = await sr.json();
        if (alive && sr.ok && Array.isArray(sb.shots)) {
          const m = new Map<number, string>();
          for (const s of sb.shots) if (s.audioUrl) m.set(s.shotNumber, s.audioUrl);
          audioUrlsRef.current = m;
        }
      } catch { /* silent */ }
    })();
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [projectId]);

  const selected = plan?.perLine.find((l) => l.shotNumber === selShot) || plan?.perLine[0] || null;

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setOpen(0);
  }, []);

  const play = useCallback(() => {
    if (!selected || selected.visemes.length === 0) return;
    const dur = Math.max(0.3, selected.windowSec.end - selected.windowSec.start);
    setPlaying(true);
    startRef.current = 0;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      if (elapsed >= dur) { setOpen(0); setPlaying(false); rafRef.current = null; return; }
      setOpen(mouthOpenAt(selected.visemes, elapsed));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [selected]);

  const renderLipSync = useCallback(async (visemesOverride?: VisemeKeyframe[]) => {
    if (!selected) return;
    setRendering(true); setRenderMsg(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync/render`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotNumber: selected.shotNumber, visemes: visemesOverride && visemesOverride.length ? visemesOverride : selected.visemes }),
      });
      const b = await res.json();
      if (b.ok && b.videoUrl) setRenderMsg({ ok: true, text: pt.renderOk.replace('{provider}', b.provider).replace('{written}', b.writtenBack ? pt.writtenBack : ''), videoUrl: b.videoUrl });
      else setRenderMsg({ ok: false, text: b.message || b.hint || pt.renderFailed });
    } catch (e) {
      setRenderMsg({ ok: false, text: e instanceof Error ? e.message : pt.renderFailed });
    } finally { setRendering(false); }
  }, [projectId, selected, pt.renderOk, pt.writtenBack, pt.renderFailed]);

  const synthAudio = useCallback(async () => {
    setSynthingAudio(true); setAudioMsg(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/shot-audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const b = await res.json();
      if (b.ok) setAudioMsg(pt.audioSynthOk.replace('{ok}', String(b.synthesized)).replace('{total}', String(b.total)));
      else setAudioMsg(b.message || pt.audioSynthFailed);
    } catch (e) {
      setAudioMsg(e instanceof Error ? e.message : pt.audioSynthFailed);
    } finally { setSynthingAudio(false); }
  }, [projectId, pt.audioSynthOk, pt.audioSynthFailed]);

  // Lip-audio alignment score (v9.7.6): browser Web Audio decodes this shot's VO → energy envelope → correlate with mouth-open
  const measureAlign = useCallback(async () => {
    if (!selected) return;
    const url = audioUrlsRef.current.get(selected.shotNumber);
    if (!url) { setAlignResult(null); setAudioMsg(pt.noAudioAlign); return; }
    setAligning(true);
    try {
      const AC: typeof AudioContext | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) throw new Error(pt.noWebAudio);
      const ac = new AC();
      const arr = await fetch(url).then((r) => r.arrayBuffer());
      const audio = await ac.decodeAudioData(arr);
      const energy = rmsEnvelope(audio.getChannelData(0), 64);
      ac.close();
      const durationSec = audio.duration || (selected.windowSec.end - selected.windowSec.start);
      const flat = selected.visemes.map((f) => ({ t: f.t, mouthOpen: f.mouthOpen }));
      const r = scoreLipAudioAlignment({ visemes: flat, audioEnergy: energy, durationSec });
      // v9.7.11 auto drift correction: measure delay → shifted track (keep viseme field for re-render)
      const aa = autoAlignVisemes({ visemes: flat, audioEnergy: energy, durationSec });
      const corrected = Math.abs(aa.offsetSec) >= 0.05 ? shiftVisemeTrack(selected.visemes, aa.offsetSec) : undefined;
      setAlignResult({ shotNumber: selected.shotNumber, score: r.score, verdict: r.verdict, lagSec: r.lagSec, corrected, before: aa.before, after: aa.after });
      // v9.7.14: persist measured align score → publish-readiness folds it into the lip-sync-align dimension
      fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync-align`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scores: { [selected.shotNumber]: r.score } }),
      }).catch(() => {});
    } catch (e) {
      setAudioMsg(e instanceof Error ? e.message : pt.alignFailed);
    } finally { setAligning(false); }
  }, [selected, projectId, pt.noAudioAlign, pt.noWebAudio, pt.alignFailed]);

  if (!plan || plan.lines === 0) return null;
  const lvCls = LEVEL_CLS[plan.level];
  const lvLabel = plan.level === 'pass' ? pt.levelPass : plan.level === 'warn' ? pt.levelWarn : plan.level === 'block' ? pt.levelBlock : '';
  const reshoot = lipSyncReshootHints(plan); // v9.6.4 fused gate: lip-sync off → actionable reshoot hints
  // Mouth: closed ry≈1.5, fully open ry≈12
  const mouthRy = 1.5 + open * 10.5;

  const verdictText = alignResult
    ? (alignResult.verdict === 'good' ? pt.verdictGood : alignResult.verdict === 'fair' ? pt.verdictFair : pt.verdictBad)
    : '';
  const lagText = alignResult && Math.abs(alignResult.lagSec) >= 0.05
    ? pt.audioLag.replace('{dir}', alignResult.lagSec > 0 ? pt.lagBehind : pt.lagAhead).replace('{lag}', String(Math.abs(alignResult.lagSec)))
    : '';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
          <Microphone className="w-4 h-4" /> {pt.lipsyncTitle.replace('{n}', String(plan.lines))}
        </div>
        <div className="flex items-center gap-2">
          {engine && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${engine.configured ? 'text-sky-300 border-sky-400/30 bg-sky-400/10' : 'text-white/35 border-white/10'}`} title={engine.hint || ''}>
              {engine.configured ? pt.engineOn : pt.engineOff}
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${lvCls}`}>
            {pt.readiness.replace('{label}', lvLabel).replace('{n}', String(plan.readiness))}
          </span>
        </div>
      </div>

      {/* VO synth (feeds real render): synthesize film-wide dialogue TTS → shot-audio assets; render auto-picks audio */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={synthAudio}
          disabled={synthingAudio}
          className="cinema-btn !px-2.5 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50"
        >
          {synthingAudio ? <CircleNotch className="w-3 h-3 animate-spin" /> : <SpeakerHigh className="w-3 h-3" />}
          {synthingAudio ? pt.synthesizing : pt.synthAll}
        </button>
        {audioMsg && <span className="text-[10px] text-white/45 truncate">{audioMsg}</span>}
      </div>

      {/* Character voice shelf: manual pick / audition, overrides auto routing */}
      <VoiceShelf projectId={projectId} characters={plan.perLine.map((l) => l.speaker || '')} />
      {/* v10.6.4 — VO retake bench: per-line emotion retake / A·B compare / rest of the episode untouched */}
      <VoiceRetakePanel projectId={projectId} />

      {/* One-click film-wide lip-sync: VO → per-shot render → write-back (reuses oneclick orchestration) */}
      <LipSyncBatchPanel projectId={projectId} shotNumbers={plan.perLine.map((l) => l.shotNumber)} />

      {/* Selected line: animated mouth + mouth-open sparkline */}
      {selected && (
        <div className="rounded-lg bg-black/30 border border-white/5 p-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Animated mouth */}
            <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
              <rect x="6" y="6" width="44" height="44" rx="12" fill="#1a1a24" stroke="#ffffff15" />
              <circle cx="20" cy="24" r="2.5" fill="#ffffff80" />
              <circle cx="36" cy="24" r="2.5" fill="#ffffff80" />
              <ellipse cx="28" cy="38" rx="9" ry={mouthRy} fill="#E86A6A" stroke="#ffffff20" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-white/50">{pt.shotNth.replace('{n}', String(selected.shotNumber))}</span>
                {selected.speaker && <span className="text-[11px] text-white/70">{selected.speaker}</span>}
                <button
                  onClick={playing ? stop : play}
                  className="ml-auto cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1"
                >
                  {playing ? <Stop className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {playing ? pt.stop : pt.playLips}
                </button>
                <button
                  onClick={() => renderLipSync()}
                  disabled={rendering}
                  title={engine && !engine.configured ? (engine.hint || '') : pt.renderThisTitle}
                  className="cinema-btn cinema-btn-primary !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {rendering ? <CircleNotch className="w-3 h-3 animate-spin" /> : <FilmSlate className="w-3 h-3" />}
                  {rendering ? pt.rendering : pt.renderReal}
                </button>
                <button
                  onClick={measureAlign}
                  disabled={aligning}
                  title={pt.measureTitle}
                  className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {aligning ? <CircleNotch className="w-3 h-3 animate-spin" /> : <Waveform className="w-3 h-3" />}
                  {aligning ? pt.measuring : pt.measureAlign}
                </button>
              </div>
              <div className="text-xs text-white/75 truncate mb-1.5">「{selected.text}」</div>
              {alignResult && alignResult.shotNumber === selected.shotNumber && (
                <div className="text-[11px] mb-1.5 flex items-center gap-2">
                  <span className="text-white/45">{pt.avAlign}</span>
                  <span className={`font-medium ${scoreColor(alignResult.score)}`}>{alignResult.score}</span>
                  <span className="text-white/35">
                    {verdictText}
                    {lagText}
                  </span>
                  {alignResult.corrected && alignResult.corrected.length > 0 && (
                    <button
                      onClick={() => renderLipSync(alignResult.corrected)}
                      disabled={rendering}
                      title={pt.driftTitle.replace('{before}', String(alignResult.before)).replace('{after}', String(alignResult.after))}
                      className="cinema-btn !px-1.5 !py-0.5 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <ArrowsClockwise className="w-2.5 h-2.5" /> {pt.correctDrift}
                    </button>
                  )}
                </div>
              )}
              {/* Mouth-open envelope: one bar per keyframe */}
              <div className="flex items-end gap-px h-6">
                {selected.visemes.map((f, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[2px] rounded-sm bg-gradient-to-t from-rose-500/40 to-rose-300/80"
                    style={{ height: `${Math.max(6, f.mouthOpen * 100)}%` }}
                    title={pt.mouthOpenTitle.replace('{viseme}', f.viseme).replace('{n}', String(Math.round(f.mouthOpen * 100)))}
                  />
                ))}
              </div>
              {renderMsg && (
                <div className={`text-[11px] mt-1.5 ${renderMsg.ok ? 'text-emerald-400' : 'text-white/45'}`}>
                  {renderMsg.text}
                  {renderMsg.ok && renderMsg.videoUrl && (
                    <a href={renderMsg.videoUrl} target="_blank" rel="noreferrer" className="ml-1 underline text-emerald-300">{pt.viewVideo}</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Per-line alignability */}
      <div className="space-y-1.5 mb-3">
        {plan.perLine.map((l) => (
          <button
            key={l.shotNumber}
            onClick={() => { stop(); setSelShot(l.shotNumber); }}
            className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
              l.shotNumber === selShot ? 'border-white/20 bg-white/[0.06]' : 'border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-[11px] text-white/40 w-10 shrink-0">#{l.shotNumber}</span>
            <span className="text-xs text-white/70 truncate flex-1 min-w-0">
              {l.speaker ? `${l.speaker}:` : ''}{l.text}
            </span>
            {l.alignment.issues[0] && (
              <span className="text-[10px] text-white/35 truncate max-w-[40%] hidden sm:inline">{l.alignment.issues[0]}</span>
            )}
            <span className={`text-[11px] font-medium shrink-0 ${scoreColor(l.alignment.score)}`}>{l.alignment.score}</span>
          </button>
        ))}
      </div>

      {/* Lip-sync reshoot hints (fused gate: off → actionable fix + jump to workshop) */}
      {reshoot.count > 0 && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-2.5 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-amber-300/90 font-medium">{pt.reshootTitle.replace('{n}', String(reshoot.count))}</span>
            {onJumpToWorkshop && (
              <button
                onClick={() => onJumpToWorkshop(reshoot.shots.map((s) => s.shotNumber))}
                className="cinema-btn !px-2 !py-0.5 !text-[10px] inline-flex items-center gap-1"
              >
                <ArrowsClockwise className="w-3 h-3" /> {t.visionAudit.reshootButton}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {reshoot.shots.map((s) => (
              <button
                key={s.shotNumber}
                onClick={() => { stop(); setSelShot(s.shotNumber); }}
                className="w-full text-left flex items-start gap-2 text-[11px] text-white/55 hover:text-white/80"
              >
                <span className="text-white/35 shrink-0">#{s.shotNumber}</span>
                <span className="text-amber-300/70 shrink-0">{s.reason}</span>
                <span className="min-w-0">{s.focusHint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary hints */}
      <div className="space-y-1">
        {plan.hints.map((h, i) => (
          <div key={i} className="text-[11px] text-white/45 flex gap-1.5">
            <span className="text-white/25">·</span>{h}
          </div>
        ))}
      </div>
    </div>
  );
}

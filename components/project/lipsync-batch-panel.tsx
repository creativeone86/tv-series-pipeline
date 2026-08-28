'use client';

/**
 * v9.7.3 — One-click film-wide lip-sync (phase 16 T1 close-out). Reuses the
 * oneclick-film-panel closed-loop skeleton (running / live log / stopRef / confirm
 * before run): walk every dialogue shot
 *   1) synthesize VO (POST /shot-audio) → 2) per-shot real lip-sync render
 *   (POST /lipsync/render, auto-pick audio + write back boards).
 * If the engine is not configured → stop on the first shot and hint; mid-run stop
 * is supported. Lives inside the Lip-sync panel.
 */
import { useRef, useState } from 'react';
import { Lightning, CircleNotch as Loader2, X } from '@phosphor-icons/react';
import { planLipSyncQc } from '@/lib/lipsync-qc';
import { rmsEnvelope, scoreLipAudioAlignment } from '@/lib/lipsync-align';
import { useLocale } from '@/hooks/use-locale';

const QC_ALIGN_MAX_SHOTS = 40; // client-side per-shot audio decode is heavy; cap it

const QC_MAX_ROUNDS = 2;

type LogKind = 'info' | 'ok' | 'warn' | 'err';
const logColor = (k: LogKind) => (k === 'ok' ? 'text-emerald-400' : k === 'warn' ? 'text-amber-400' : k === 'err' ? 'text-rose-400' : 'text-white/45');

export function LipSyncBatchPanel({ projectId, shotNumbers }: { projectId: string; shotNumbers: number[] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [running, setRunning] = useState(false);
  const [qcEnabled, setQcEnabled] = useState(true);
  const [log, setLog] = useState<{ kind: LogKind; text: string }[]>([]);
  const stopRef = useRef(false);
  const addLog = (kind: LogKind, text: string) => setLog((l) => [...l, { kind, text }]);

  /** Render lip-sync for one shot; returns success. configured===false → throw so the parent aborts. */
  async function renderShot(n: number): Promise<boolean> {
    const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync/render`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shotNumber: n }),
    });
    const b = await r.json().catch(() => ({}));
    if (b.configured === false) throw new Error(b.message || pt.engineMissing);
    if (b.ok) { addLog('ok', pt.shotOk.replace('{n}', String(n)).replace('{written}', b.writtenBack ? pt.writtenBoard : '')); return true; }
    addLog('warn', pt.shotWarn.replace('{n}', String(n)).replace('{msg}', b.message || pt.renderFailed));
    return false;
  }

  /** Client Web Audio scores per-shot lip-audio alignment (viseme track vs VO energy). Stable across re-renders. */
  async function computeAlignScores(): Promise<Record<number, number>> {
    const out: Record<number, number> = {};
    try {
      const [pr, sr] = await Promise.all([
        fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync`).then((r) => r.json()),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/shot-audio`).then((r) => r.json()),
      ]);
      const lines = (pr?.plan?.perLine || []) as Array<{ shotNumber: number; visemes: { t: number; mouthOpen: number }[]; windowSec: { start: number; end: number } }>;
      const urls = new Map<number, string>();
      for (const s of (sr?.shots || [])) if (s.audioUrl) urls.set(s.shotNumber, s.audioUrl);
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return out;
      const ac = new AC();
      const batch = new Set(shotNumbers);
      let processed = 0;
      for (const line of lines) {
        if (!batch.has(line.shotNumber) || processed >= QC_ALIGN_MAX_SHOTS) continue;
        const url = urls.get(line.shotNumber);
        if (!url) continue;
        try {
          const arr = await fetch(url).then((r) => r.arrayBuffer());
          const audio = await ac.decodeAudioData(arr);
          const energy = rmsEnvelope(audio.getChannelData(0), 64);
          const res = scoreLipAudioAlignment({
            visemes: line.visemes.map((f) => ({ t: f.t, mouthOpen: f.mouthOpen })),
            audioEnergy: energy, durationSec: audio.duration || (line.windowSec.end - line.windowSec.start),
          });
          out[line.shotNumber] = res.score;
          processed++;
        } catch { /* skip a shot whose decode failed (it does not join the align verdict) */ }
      }
      ac.close();
      // v9.7.14: persist measured align scores → folded into the publish gate
      if (Object.keys(out).length) {
        fetch(`/api/projects/${encodeURIComponent(projectId)}/lipsync-align`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scores: out }),
        }).catch(() => {});
      }
    } catch { /* if align scores are unavailable, Vision scores alone are used */ }
    return out;
  }

  /** Lip-sync QC loop: Vision audit + A/V align scores → planLipSyncQc → auto re-render weak shots (≤ QC_MAX_ROUNDS). */
  async function qcLoop() {
    addLog('info', pt.computingAlign);
    const alignScores = await computeAlignScores();
    const alignWeak = Object.values(alignScores).filter((s) => s < 60).length;
    if (Object.keys(alignScores).length) addLog('info', pt.alignWeak.replace('{n}', String(alignWeak)));
    for (let round = 1; round <= QC_MAX_ROUNDS; round++) {
      if (stopRef.current) { addLog('warn', pt.stopped); return; }
      addLog('info', pt.qcRound.replace('{round}', String(round)).replace('{max}', String(QC_MAX_ROUNDS)));
      const ar = await fetch(`/api/projects/${encodeURIComponent(projectId)}/vision-audit/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const ab = await ar.json().catch(() => ({}));
      const audits = (ab.audits || []) as Array<{ shotNumber: number; score: number }>;
      const verdict = planLipSyncQc({ audits, round, maxRounds: QC_MAX_ROUNDS, onlyShots: shotNumbers, alignScores });
      if (verdict.decision === 'done') { addLog('ok', verdict.message); return; }
      if (verdict.decision === 'stop') { addLog('warn', verdict.message); return; }
      addLog('warn', verdict.message);
      for (const n of verdict.weakShots) {
        if (stopRef.current) { addLog('warn', pt.stopped); return; }
        addLog('info', pt.rerenderWeak.replace('{n}', String(n)));
        try { await renderShot(n); } catch (e) { addLog('err', pt.aborted.replace('{msg}', e instanceof Error ? e.message : pt.rerenderFailed)); return; }
      }
    }
  }

  async function run() {
    if (running || !shotNumbers.length) return;
    if (!window.confirm(pt.confirmRun.replace('{n}', String(shotNumbers.length)))) return;
    setRunning(true); setLog([]); stopRef.current = false;
    try {
      // Step 1: synthesize film-wide VO (the render endpoint then auto-picks audio)
      addLog('info', pt.synthAllLines.replace('{n}', String(shotNumbers.length)));
      const aRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/shot-audio`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const aBody = await aRes.json().catch(() => ({}));
      if (!aBody.ok) { addLog('err', pt.aborted.replace('{msg}', aBody.message || pt.audioFailed)); setRunning(false); return; }
      addLog('ok', pt.audioDone.replace('{ok}', String(aBody.synthesized)).replace('{total}', String(aBody.total)));

      // Step 2: per-shot real lip-sync render (auto-pick audio + write back)
      let done = 0; let engineMissing = false;
      for (const n of shotNumbers) {
        if (stopRef.current) { addLog('warn', pt.stopped); break; }
        addLog('info', pt.renderShot.replace('{n}', String(n)));
        try { if (await renderShot(n)) done++; }
        catch (e) { engineMissing = true; addLog('err', pt.aborted.replace('{msg}', e instanceof Error ? e.message : pt.renderFailed)); break; }
      }
      addLog(done ? 'ok' : 'warn', pt.renderDone.replace('{ok}', String(done)).replace('{n}', String(shotNumbers.length)).replace('{extra}', done ? pt.inTimeline : ''));

      // Step 3: optional lip-sync QC loop — Vision re-score → auto re-render weak shots
      if (qcEnabled && done > 0 && !engineMissing && !stopRef.current) {
        await qcLoop();
      }
    } catch (e) {
      addLog('err', e instanceof Error ? e.message : pt.batchFailed);
    } finally { setRunning(false); }
  }

  if (!shotNumbers.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-white/70 flex items-center gap-1.5">
          <Lightning className="w-3.5 h-3.5" /> {pt.batchTitle.replace('{n}', String(shotNumbers.length))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-[10px] text-white/45 inline-flex items-center gap-1 cursor-pointer" title={pt.qcLoopTitle}>
            <input type="checkbox" checked={qcEnabled} disabled={running} onChange={(e) => setQcEnabled(e.target.checked)} className="accent-current w-3 h-3" />
            {pt.qcLoop}
          </label>
          {running && (
            <button onClick={() => { stopRef.current = true; }} className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1">
              <X className="w-3 h-3" /> {pt.stop}
            </button>
          )}
          <button onClick={run} disabled={running} className="cinema-btn cinema-btn-primary !px-2.5 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightning className="w-3 h-3" />}
            {running ? pt.running : pt.runAll}
          </button>
        </div>
      </div>
      {log.length > 0 && (
        <div className="mt-2 max-h-40 overflow-auto space-y-0.5 font-mono text-[10px] leading-relaxed">
          {log.map((line, i) => (<div key={i} className={logColor(line.kind)}>{line.text}</div>))}
        </div>
      )}
    </div>
  );
}

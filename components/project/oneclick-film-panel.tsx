'use client';

/**
 * v9.4.6 — One-click film self-heal loop (Kling-style “one-click film”, but closed-loop).
 *
 * Runs lib/oneclick-film: each round ① Vision audit (/vision-audit/run) →
 * ② decideIteration (done/rebirth/blocked) → ③ on rebirth, auto-reshoot weak
 * shots (/regenerate-storyboard, steered by weakest dimension) → re-audit,
 * up to N rounds. Kling one-click is open-loop; we audit after generate and
 * auto-reshoot weak shots, and stop only when the gate passes.
 *
 * Real execution calls audit + reshoot (uses tokens). Triple guard: max
 * rounds / stop / confirm before run.
 */
import { useRef, useState } from 'react';
import { MagicWand, Play, CircleNotch as Loader2, CheckCircle, Warning, X } from '@phosphor-icons/react';
import { planOneClickFilm, decideIteration } from '@/lib/oneclick-film';
import { useLocale } from '@/hooks/use-locale';

interface ShotPrompt { shotNumber: number; prompt: string; }
type LogKind = 'info' | 'ok' | 'warn' | 'err';

const DIM_STEER: Record<string, string> = {
  sceneMatch: 'match the scripted scene and setting more faithfully',
  actionMatch: 'clearer, more readable character action and pose',
  moodMatch: 'stronger intended mood, lighting and atmosphere',
  composition: 'stronger composition and framing',
};

function authHeader(): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export function OneClickFilmPanel({ projectId, shotPrompts }: { projectId: string; shotPrompts: ShotPrompt[] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const plan = planOneClickFilm({ idea: t.projectPanels.currentProject, maxRebirthRounds: 2 });
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<{ kind: LogKind; text: string }[]>([]);
  const [decision, setDecision] = useState<'done' | 'blocked' | null>(null);
  const stopRef = useRef(false);

  const promptMap = new Map(shotPrompts.filter((s) => s.prompt).map((s) => [s.shotNumber, s.prompt]));
  const addLog = (kind: LogKind, text: string) => setLog((l) => [...l, { kind, text }]);

  async function run() {
    if (running) return;
    const ok = window.confirm(
      t.projectPanels.confirmRun.replace('{n}', String(plan.maxRebirthRounds + 1)),
    );
    if (!ok) return;
    setRunning(true); setLog([]); setDecision(null); stopRef.current = false;

    try {
      for (let round = 1; round <= plan.maxRebirthRounds + 1; round++) {
        if (stopRef.current) { addLog('warn', t.projectPanels.stopped); break; }
        addLog('info', t.projectPanels.roundAudit.replace('{n}', String(round)));
        const aRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/vision-audit/run`, {
          method: 'POST', headers: authHeader(),
        });
        const aBody = await aRes.json().catch(() => ({}));
        if (!aRes.ok) { addLog('err', aBody?.error || t.projectPanels.auditFailed.replace('{status}', String(aRes.status))); break; }

        const audits = aBody.audits || [];
        const summary = aBody.summary || null;
        const verdict = decideIteration(plan, { round, audits, filmAudit: summary });
        addLog(verdict.decision === 'done' ? 'ok' : verdict.decision === 'blocked' ? 'warn' : 'info', verdict.message);

        if (verdict.decision === 'done') { setDecision('done'); break; }
        if (verdict.decision === 'blocked') { setDecision('blocked'); break; }

        // rebirth — auto-reshoot weak shots from the plan
        let regen = 0;
        for (const s of verdict.rebirthShots) {
          if (stopRef.current) { addLog('warn', t.projectPanels.stopped); break; }
          const base = promptMap.get(s.shotNumber);
          if (!base) { addLog('warn', t.projectPanels.skipNoPrompt.replace('{n}', String(s.shotNumber))); continue; }
          const steer = s.weakestDimension ? DIM_STEER[s.weakestDimension] : '';
          const customPrompt = (steer ? `${base}, ${steer}` : base).slice(0, 1900);
          addLog('info', t.projectPanels.reshootShot.replace('{n}', String(s.shotNumber)).replace('{hint}', s.focusHint));
          try {
            const rRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/regenerate-storyboard`, {
              method: 'POST',
              headers: { ...authHeader(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ shotNumber: s.shotNumber, customPrompt, useStyleBible: true, useCref: true }),
            });
            // SSE: read full body, look for complete
            const txt = await rRes.text();
            if (rRes.ok && /"type"\s*:\s*"complete"/.test(txt)) regen++;
            else addLog('warn', t.projectPanels.reshootIncomplete.replace('{n}', String(s.shotNumber)));
          } catch { addLog('warn', t.projectPanels.reshootError.replace('{n}', String(s.shotNumber))); }
        }
        addLog('info', t.projectPanels.roundReshoot.replace('{n}', String(regen)));
        if (regen === 0) { addLog('warn', t.projectPanels.noAutoReshoot); setDecision('blocked'); break; }
      }
    } catch (e) {
      addLog('err', e instanceof Error ? e.message : t.projectPanels.runError);
    } finally {
      setRunning(false);
    }
  }

  const auditable = shotPrompts.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E8C547]/25 bg-[#E8C547]/[0.05] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#E8C547] text-sm font-medium">
            <MagicWand className="w-4 h-4" weight="fill" /> {t.projectPanels.oneclickTitle}
          </div>
          <span className="text-[10px] text-white/40">{t.projectPanels.oneclickBadge}</span>
        </div>
        <p className="mt-2 text-[11px] text-white/55 leading-relaxed">
          {t.projectPanels.oneclickBefore}<b className="text-white/75">{t.projectPanels.oneclickAudit}</b>{t.projectPanels.oneclickMid1}<b className="text-white/75">{t.projectPanels.oneclickGate}</b>{t.projectPanels.oneclickMid2}<b className="text-white/75">{t.projectPanels.oneclickReshoot}</b>{t.projectPanels.oneclickAfter.replace('{n}', String(plan.maxRebirthRounds + 1))}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={running ? () => { stopRef.current = true; } : run}
            disabled={auditable === 0}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
              running ? 'bg-rose-500/15 border border-rose-500/40 text-rose-200 hover:bg-rose-500/25'
                      : 'bg-[#E8C547]/15 border border-[#E8C547]/40 text-[#E8C547] hover:bg-[#E8C547]/25'
            }`}
          >
            {running ? <><X className="w-3.5 h-3.5" /> {t.projectPanels.stop}</> : <><Play className="w-3.5 h-3.5" weight="fill" /> {t.projectPanels.runLoop}</>}
          </button>
          {auditable === 0 && <span className="text-[11px] text-white/40">{t.projectPanels.needBoards}</span>}
          {decision === 'done' && <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" weight="fill" /> {t.projectPanels.passed}</span>}
          {decision === 'blocked' && <span className="text-[11px] text-amber-400 inline-flex items-center gap-1"><Warning className="w-3.5 h-3.5" weight="fill" /> {t.projectPanels.handoff}</span>}
        </div>
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] space-y-1 max-h-72 overflow-auto">
          {log.map((l, i) => (
            <div key={i} className={
              l.kind === 'ok' ? 'text-emerald-400' : l.kind === 'warn' ? 'text-amber-400' : l.kind === 'err' ? 'text-rose-400' : 'text-white/55'
            }>
              {running && i === log.length - 1 && <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />}
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

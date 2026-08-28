'use client';

/**
 * /dashboard/edit-chat · conversational edit desk (v12.251: parse → real execute)
 *
 * Tell the finished film in plain language what to change → parse into edit
 * intents → "I will: 1 2 3" confirm card → pick a project + confirm →
 * composition edits go through `POST /api/projects/[id]/recompose` and **really
 * recompose** the film.
 *
 * Safety: parse is read-only; destructive ops (drop shot / re-voice / regen shot)
 * use **two-step confirm** (arm red, then click to run). The recompose endpoint
 * also has owner guard + allowlist (defense in depth). Shot regen / pace are
 * not inside recompose; this page points honestly (regen on project page /
 * re-run the film) and does not pretend they ran.
 */

import { useEffect, useRef, useState } from 'react';
import { ChatText, PaperPlaneRight, Warning as AlertTriangle, CircleNotch as Loader2, CheckCircle, ShieldWarning, FilmSlate, Download } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast-provider';
import { api } from '@/lib/api-client';
import type { EditOp } from '@/lib/edit-intent';
import { planExecution, type ExecutionPlan } from '@/lib/edit-intent-execute';
import { useLocale } from '@/hooks/use-locale';

interface ParseResult {
  intents: EditOp[];
  describe: string[];
  destructive: boolean;
  unmatched: boolean;
  hint?: string;
}
interface ProjectLite { id: string; title: string; status?: string; }

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

const EXAMPLE_KEYS = ['ecEx1', 'ecEx2', 'ecEx3', 'ecEx4'] as const;

export default function EditChatPage() {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  // v12.251 execute state
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [projectId, setProjectId] = useState('');
  const [executing, setExecuting] = useState(false);
  const [armed, setArmed] = useState(false);
  // v12.337 per-shot regen: serial (parallel burns N budgets and is hard to attribute)
  const [shotRunning, setShotRunning] = useState<number | null>(null);
  const [shotLog, setShotLog] = useState<Array<{ shotNumber: number; status: 'ok' | 'fail' | 'running'; msg: string }>>([]);
  const [shotArmed, setShotArmed] = useState(false);           // destructive two-step: arm red, then run
  // v12.251 review: after arm, briefly disable the button (cooldown) so a **double-click**
  // second hit is a no-op — otherwise one double-click does arm→execute in one go
  // (React commits armed=true between the two click macrotasks).
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [execError, setExecError] = useState('');

  useEffect(() => {
    api.projects()
      .then((rows: any) => setProjects((Array.isArray(rows) ? rows : []).map((r: any) => ({ id: r.id, title: r.title, status: r.status }))))
      .catch(() => { /* list fetch failure is non-fatal; user can still parse */ });
  }, []);
  useEffect(() => () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); }, []);

  const plan: ExecutionPlan | null = result && !result.unmatched ? planExecution(result.intents) : null;

  // Disarm: clear armed + cooldown + timer. Reset on project change / re-parse so
  // the previous destructive instruction's armed flag is never reused.
  const disarm = () => {
    setArmed(false);
    setCooldown(false);
    if (cooldownRef.current) { clearTimeout(cooldownRef.current); cooldownRef.current = null; }
  };
  const resetExec = () => { disarm(); setResultVideoUrl(''); setExecError(''); };

  const parse = async (override?: string) => {
    const q = (override ?? text).trim();
    if (!q) { showToast({ title: t.dashPages.ecNeedText, type: 'error' }); return; }
    if (override) setText(override);
    setParsing(true);
    setErrorMsg('');
    setResult(null);
    resetExec();
    try {
      const res = await fetch('/api/edit-intent/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.message || t.dashPages.parseFailedHttp.replace('{status}', String(res.status));
        setErrorMsg(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      // Guard: 200 but odd/non-JSON body (normalized to {}) → ok is not true.
      // Surface an error instead of crashing on result.describe.length. Normalize arrays.
      if (!body || body.ok !== true) {
        const msg = t.dashPages.parseBadBody;
        setErrorMsg(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setResult({
        intents: Array.isArray(body.intents) ? body.intents : [],
        describe: Array.isArray(body.describe) ? body.describe : [],
        destructive: !!body.destructive,
        unmatched: !!body.unmatched,
        hint: typeof body.hint === 'string' ? body.hint : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.parseNetwork;
      setErrorMsg(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setParsing(false);
    }
  };

  /**
   * v12.337: run **per-shot regen**. Last item on the competitor checklist
   * (Seko-style natural-language single-shot edit).
   *
   * Contract: send the user sentence as `editNote`; the server reads the original
   * shot description and **merges**. Do not send it as a new description — that
   * wipes cast/scene/action and still "succeeds" (see lib/shot-edit-merge).
   *
   * Serial per shot: each shot is a real paid video gen; parallel = N budgets at once.
   */
  const executeShots = async () => {
    if (!plan || plan.regenShots.length === 0) return;
    if (!projectId) { showToast({ title: t.dashPages.ecNeedProject, type: 'error' }); return; }
    if (cooldown) return;
    if (!shotArmed) {           // same two-step as compose: first click only arms
      setShotArmed(true);
      setCooldown(true);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => setCooldown(false), 600);
      return;
    }
    setShotLog([]);
    for (const rs of plan.regenShots) {
      setShotRunning(rs.shotNumber);
      setShotLog((L) => [...L, { shotNumber: rs.shotNumber, status: 'running', msg: t.dashPages.ecRegenRunning }]);
      try {
        const res = await fetch(`/api/projects/${projectId}/regenerate-shot`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shotNumber: rs.shotNumber, editNote: rs.note || '' }),
        });
        if (!res.ok || !res.body) {
          const raw = await res.text().catch(() => '');
          throw new Error(raw.slice(0, 120) || `HTTP ${res.status}`);
        }
        // SSE: keep last complete/error; mid-stream status echoes the server merge note
        const reader = res.body.getReader(); const dec = new TextDecoder();
        let buf = '', done = false, lastMsg = '';
        let upstreamErr: Error | null = null;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (d) break;
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split('\n\n'); buf = chunks.pop() || '';
          for (const c of chunks) {
            const line = c.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            // v12.339 fix: a `throw new Error(...)` inside try was swallowed by the
            // "ignore half-packet / non-JSON" catch — upstream errors still marked
            // the shot "regenerated". Fail-as-success. Parse fail ≠ upstream error:
            // catch only swallows parse; upstream is stored and thrown after the loop.
            let ev: any = null;
            try { ev = JSON.parse(line.slice(6)); } catch { continue; }
            if (ev?.type === 'status' && ev.data?.message) lastMsg = String(ev.data.message);
            if (ev?.type === 'complete') { done = true; lastMsg = t.dashPages.ecRegenOk; }
            if (ev?.type === 'error') { upstreamErr = new Error(ev.data?.message || t.dashPages.ecRegenFail); done = true; break; }
          }
          if (upstreamErr) break;
        }
        if (upstreamErr) throw upstreamErr;   // outer catch records fail — never fall into ok
        setShotLog((L) => L.map((x) => x.shotNumber === rs.shotNumber ? { ...x, status: 'ok', msg: lastMsg || t.dashPages.ecRegenOk } : x));
      } catch (e) {
        const msg = e instanceof Error ? e.message : t.dashPages.ecRegenFail;
        setShotLog((L) => L.map((x) => x.shotNumber === rs.shotNumber ? { ...x, status: 'fail', msg } : x));
        // One shot failing must not skip the rest — but record it honestly
      }
    }
    setShotRunning(null);
    setShotArmed(false);
  };

  /** Run composition-level edit (recompose). Destructive ops must be armed first. */
  const execute = async () => {
    if (!plan || !plan.recompose) return;
    if (!projectId) { showToast({ title: t.dashPages.ecNeedProject, type: 'error' }); return; }
    if (cooldown) return; // ignore clicks during cooldown — blocks double-click execute
    // Two-step: destructive + not armed → arm + cooldown, do not run. Second click after cooldown runs.
    if (plan.destructive && !armed) {
      setArmed(true);
      setCooldown(true);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => setCooldown(false), 600);
      return;
    }

    setExecuting(true);
    setExecError('');
    setResultVideoUrl('');
    try {
      const res = await fetch(`/api/projects/${projectId}/recompose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan.recompose),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg = body?.message || t.dashPages.recomposeFailedHttp.replace('{status}', String(res.status));
        setExecError(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setResultVideoUrl(body.finalVideoUrl || '');
      setArmed(false);
      showToast({ title: t.dashPages.recomposeOk, type: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.recomposeNetwork;
      setExecError(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChatText className="w-6 h-6 text-[#E8C547]" weight="duotone" />
          {t.dashPages.ecTitle}
        </h1>
        <p className="text-sm text-[var(--soft)] mt-1">
          {t.dashPages.ecSubtitle}
          <span className="text-[var(--soft)]"> {t.dashPages.ecSafety}</span>
        </p>
      </div>

      {/* Input */}
      <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) parse(); }}
          placeholder={t.dashPages.ecPlaceholder}
          maxLength={2000}
          rows={3}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm resize-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_KEYS.map(k => (
            <button key={k} onClick={() => parse(t.dashPages[k])} disabled={parsing}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-[var(--muted)] disabled:opacity-40">
              {t.dashPages[k]}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--soft)] opacity-60">{t.dashPages.ecParseHint.replace('{n}', String(text.length))}</span>
          <button
            onClick={() => parse()}
            disabled={parsing || !text.trim()}
            className="px-4 py-2 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center gap-2 text-sm"
          >
            {parsing ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.parsing}</>) : (<><PaperPlaneRight className="w-4 h-4" weight="bold" /> {t.dashPages.parse}</>)}
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="mt-5">
        {errorMsg ? (
          <div className="bg-[rgba(255,255,255,0.04)] border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <div className="text-sm text-rose-300 mb-1">{t.dashPages.parseFailed}</div>
            <div className="text-[11px] text-white/50">{errorMsg}</div>
          </div>
        ) : result ? (
          result.unmatched || (result.describe?.length ?? 0) === 0 ? (
            <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5 text-[13px] text-[var(--muted)]">
              {result.hint || t.dashPages.ecUnmatched}
            </div>
          ) : (
            <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" weight="duotone" />
                <span className="text-sm text-white font-medium">{t.dashPages.ecWillDo.replace('{n}', String(result.describe.length))}</span>
              </div>
              <ol className="space-y-2 mb-4">
                {result.describe.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#E8C547]/15 text-[#E8C547] grid place-items-center text-[11px] font-mono shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[var(--text)]">{d}</span>
                  </li>
                ))}
              </ol>

              {result.destructive && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-2 mb-4">
                  <ShieldWarning className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" weight="duotone" />
                  <span className="text-[12px] text-rose-200/90">
                    {t.dashPages.ecDestructiveWarn}
                  </span>
                </div>
              )}

              {/* v12.337: per-shot regen **runs on this page** (used to only point at the project) */}
              {plan && plan.regenShots.length > 0 && (
                <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 mb-4 text-[11px] text-amber-200/85 leading-relaxed">
                  <div className="mb-2">
                    {t.dashPages.ecRegenLead.replace('{list}', plan.regenShots.map(r => r.shotNumber).join(t.dashPages.listSep))}
                    <b>{t.dashPages.ecRegenBold1}</b>
                    {t.dashPages.ecRegenMid}
                    <b>{t.dashPages.ecRegenBold2}</b>
                    {t.dashPages.ecRegenTail}
                  </div>
                  <button
                    type="button"
                    onClick={executeShots}
                    disabled={!projectId || shotRunning !== null || cooldown}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 ${
                      shotArmed ? 'bg-red-500/85 text-white hover:bg-red-500' : 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                    }`}
                  >
                    {shotRunning !== null ? t.dashPages.ecRegenShotN.replace('{n}', String(shotRunning))
                      : shotArmed ? t.dashPages.ecConfirmRegen.replace('{n}', String(plan.regenShots.length)) : t.dashPages.ecRegenThese.replace('{n}', String(plan.regenShots.length))}
                  </button>
                  {shotLog.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {shotLog.map((l) => (
                        <div key={l.shotNumber} className={l.status === 'fail' ? 'text-red-300' : l.status === 'ok' ? 'text-emerald-300' : ''}>
                          {t.dashPages.ecShotLog.replace('{n}', String(l.shotNumber)).replace('{msg}', l.msg)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {plan?.paceHint && (
                <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 mb-4 text-[11px] text-amber-200/85 leading-relaxed">
                  {t.dashPages.ecPaceHint.replace('{pace}', plan.paceHint === 'fast' ? t.dashPages.paceFast : t.dashPages.paceSlow)}
                </div>
              )}

              {/* Project pick + execute (only composition-level recompose runs here) */}
              {plan?.recompose ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-[var(--soft)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <FilmSlate className="w-3.5 h-3.5" /> {t.dashPages.ecWhichProject}
                    </label>
                    <select
                      value={projectId}
                      onChange={e => { setProjectId(e.target.value); disarm(); }}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm"
                    >
                      <option value="">{t.dashPages.ecSelectProject}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}{p.status ? ` · ${p.status}` : ''}</option>
                      ))}
                    </select>
                    {projects.length === 0 && <div className="text-[10px] text-[var(--soft)] mt-1 opacity-60">{t.dashPages.ecNoProjects}</div>}
                  </div>

                  <button
                    onClick={execute}
                    disabled={executing || !projectId || cooldown}
                    className={`w-full px-4 py-2.5 rounded-xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                      armed ? 'bg-rose-500 hover:bg-rose-500/90 text-white' : 'bg-[#E8C547] hover:bg-[#E8C547]/90 text-black'
                    }`}
                  >
                    {executing
                      ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.recomposing}</>)
                      : cooldown
                        ? (<><ShieldWarning className="w-4 h-4" weight="bold" /> {t.dashPages.ecConfirmWait}</>)
                        : armed
                          ? (<><ShieldWarning className="w-4 h-4" weight="bold" /> {t.dashPages.ecConfirmIrreversible}</>)
                          : (<><CheckCircle className="w-4 h-4" weight="bold" /> {plan.destructive ? t.dashPages.ecExecWillConfirm : t.dashPages.ecConfirmExec}</>)}
                  </button>
                  {armed && !executing && (
                    <div className="text-[11px] text-rose-300/80 text-center">
                      {cooldown ? t.dashPages.ecCooldown : t.dashPages.ecArmHint}
                      {!cooldown && <button onClick={disarm} className="underline ml-1 hover:text-rose-200">{t.common.cancel}</button>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--soft)] mt-1 opacity-70">{t.dashPages.ecNoRecompose}</p>
              )}

              {/* Execute result */}
              {execError && <div className="mt-3 text-[12px] text-rose-300">✕ {execError}</div>}
              {resultVideoUrl && (
                <div className="mt-4">
                  <div className="text-[12px] text-emerald-400 mb-2 inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4" weight="duotone" /> {t.dashPages.recomposeDone}</div>
                  <video src={resultVideoUrl} controls className="w-full rounded-xl bg-black/40 max-h-[420px]" />
                  <a href={resultVideoUrl} target="_blank" rel="noopener"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white">
                    <Download className="w-3.5 h-3.5" /> {t.dashPages.openDownloadFilm}
                  </a>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center text-[var(--soft)] text-sm opacity-60 py-10">
            {t.dashPages.ecEmpty}
          </div>
        )}
      </div>
    </div>
  );
}

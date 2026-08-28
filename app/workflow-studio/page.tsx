'use client';

/**
 * v4.1.2 — Visual editor for agent orchestration.
 *
 * Add/remove steps, pick agent type, tick dependencies, live validate + layered
 * execution preview, save, dry-run. Talks to the v4.1 / v4.1.1 API. Pure logic
 * is imported from the client-safe agent-workflow-core.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import {
  STEP_CATALOG, validateWorkflow, topoSort, defaultWorkflow,
  type WorkflowGraph, type WorkflowNode, type StepKind,
} from '@/lib/agent-workflow-core';
import { ArrowLeft, Plus, Trash as Trash2, FloppyDisk as Save, Play, TreeStructure as Workflow, CircleNotch as Loader2, CheckCircle as CheckCircle2, XCircle, Warning as AlertTriangle } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

const KINDS = Object.keys(STEP_CATALOG) as StepKind[];

function authHeaders(): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export default function WorkflowStudioPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;
  const [graph, setGraph] = useState<WorkflowGraph>(() => defaultWorkflow(ui.myWorkflow));
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [ideaInput, setIdeaInput] = useState(ui.urbanMysteryIdea);
  const [msg, setMsg] = useState<string | null>(null);
  const [runSteps, setRunSteps] = useState<Array<{ nodeId: string; kind: string; status: string; ms: number; error?: string }> | null>(null);
  const [savedList, setSavedList] = useState<Array<{ id: string; name: string }>>([]);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows', { headers: authHeaders() });
      if (res.ok) { const b = await res.json(); setSavedList((b.workflows || []).map((w: any) => ({ id: w.id, name: w.name }))); }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  const validation = useMemo(() => validateWorkflow(graph), [graph]);
  const plan = useMemo(() => topoSort(graph), [graph]);

  // ── Edit ops ──
  const setName = (name: string) => setGraph((g) => ({ ...g, name }));
  const addNode = (kind: StepKind) => setGraph((g) => ({
    ...g,
    nodes: [...g.nodes, { id: kind + '_' + nanoid(4), kind, label: STEP_CATALOG[kind].label, dependsOn: [] }],
  }));
  const removeNode = (id: string) => setGraph((g) => ({
    ...g,
    nodes: g.nodes.filter((n) => n.id !== id).map((n) => ({ ...n, dependsOn: n.dependsOn.filter((d) => d !== id) })),
  }));
  const updateNode = (id: string, patch: Partial<WorkflowNode>) => setGraph((g) => ({
    ...g, nodes: g.nodes.map((n) => n.id === id ? { ...n, ...patch } : n),
  }));
  const toggleDep = (id: string, dep: string) => setGraph((g) => ({
    ...g,
    nodes: g.nodes.map((n) => n.id !== id ? n : {
      ...n,
      dependsOn: n.dependsOn.includes(dep) ? n.dependsOn.filter((d) => d !== dep) : [...n.dependsOn, dep],
    }),
  }));

  const loadWorkflow = async (id: string) => {
    setRunSteps(null); setMsg(null);
    const res = await fetch(`/api/workflows/${encodeURIComponent(id)}`, { headers: authHeaders() });
    if (res.ok) { const b = await res.json(); setGraph(b.workflow.graph); }
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(graph),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error || (b?.errors || []).join('; ') || `HTTP ${res.status}`);
      setMsg(ui.savedOk); loadList();
    } catch (e) { setMsg(ui.saveFailedPrefix.replace('{n}', e instanceof Error ? e.message : '')); }
    finally { setSaving(false); }
  };

  const run = async (mode: 'dry-run' | 'real') => {
    setRunning(true); setMsg(null);
    // v4.1.5: seed every step as pending; SSE lights them as they run
    setRunSteps(graph.nodes.map((n) => ({ nodeId: n.id, kind: n.kind, status: 'pending', ms: 0 })));
    const tag = mode === 'real' ? ui.runReal : 'dry-run';
    try {
      // Persist first, then run (the stream reads the saved graph)
      await fetch('/api/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(graph) });
      const { parseSSEChunk } = await import('@/lib/sse');
      const res = await fetch(`/api/workflows/${encodeURIComponent(graph.id)}/execute/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mode, input: { idea: ideaInput } }),
      });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || `HTTP ${res.status}`);
      }
      const setStatus = (nodeId: string, status: string) =>
        setRunSteps((prev) => (prev || []).map((s) => s.nodeId === nodeId ? { ...s, status } : s));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSEChunk(buffer);
        buffer = parsed.rest;
        for (const ev of parsed.events) {
          if (ev.event === 'step-start') setStatus(ev.data.nodeId, 'running');
          else if (ev.event === 'step-done') setStatus(ev.data.nodeId, 'done');
          else if (ev.event === 'step-error') setStatus(ev.data.nodeId, 'failed');
          else if (ev.event === 'done') {
            if (Array.isArray(ev.data?.result?.steps)) setRunSteps(ev.data.result.steps);
            setMsg(ev.data?.result?.ok ? ui.runDone.replace('{n}', tag) : ui.runDoneWithFails.replace('{n}', tag));
            finished = true;
          } else if (ev.event === 'error') {
            throw new Error(ev.data?.error || ui.runFailed);
          }
        }
      }
    } catch (e) { setMsg(ui.runFailedPrefix.replace('{n}', e instanceof Error ? e.message : '')); }
    finally { setRunning(false); }
  };

  return (
    <div className="cinema-page min-h-screen bg-[var(--cinema-bg,#0a0a0f)] text-white p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> {ui.back}</Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold"><Workflow className="w-5 h-5 text-indigo-400" /> {ui.studioTitle}</h1>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !validation.valid} className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {t.common.save}
          </button>
          <button onClick={() => run('dry-run')} disabled={running || !validation.valid} className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} dry-run
          </button>
          <button onClick={() => run('real')} disabled={running || !validation.valid} title={ui.runRealTitle} className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} {ui.runReal}
          </button>
        </div>
      </div>

      {msg && <div className="mb-3 text-sm text-amber-300">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: editor */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <input value={graph.name} onChange={(e) => setName(e.target.value)} className="cinema-input flex-1 !text-sm" placeholder={ui.workflowNamePh} />
            {savedList.length > 0 && (
              <select onChange={(e) => e.target.value && loadWorkflow(e.target.value)} className="cinema-input !text-xs" defaultValue="">
                <option value="">{ui.loadSaved}</option>
                {savedList.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>

          {/* Idea input (real run / director step) */}
          <input value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} className="cinema-input w-full !text-sm" placeholder={ui.ideaPh} />

          {/* Palette */}
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button key={k} onClick={() => addNode(k)} title={STEP_CATALOG[k].description}
                className="px-2 py-1 rounded-md text-[11px] border border-white/15 bg-white/5 hover:bg-white/10 inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> {STEP_CATALOG[k].label}
              </button>
            ))}
          </div>

          {/* Node list */}
          <div className="space-y-2">
            {graph.nodes.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/40">{n.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">{STEP_CATALOG[n.kind]?.label || n.kind}</span>
                  </div>
                  <button onClick={() => removeNode(n.id)} className="text-rose-400/70 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <input value={n.label} onChange={(e) => updateNode(n.id, { label: e.target.value })} className="cinema-input w-full !text-xs mb-2" placeholder={ui.stepLabelPh} />
                <div className="text-[10px] text-white/40 mb-1">{ui.depsHint}</div>
                <div className="flex flex-wrap gap-1.5">
                  {graph.nodes.filter((o) => o.id !== n.id).map((o) => (
                    <label key={o.id} className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${n.dependsOn.includes(o.id) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'border-white/15 text-white/50'}`}>
                      <input type="checkbox" className="hidden" checked={n.dependsOn.includes(o.id)} onChange={() => toggleDep(n.id, o.id)} />
                      {o.label}
                    </label>
                  ))}
                  {graph.nodes.length <= 1 && <span className="text-[10px] text-white/30">{ui.noOtherSteps}</span>}
                </div>
              </div>
            ))}
            {graph.nodes.length === 0 && <div className="text-center text-white/40 text-sm py-8">{ui.emptyPalette}</div>}
          </div>
        </div>

        {/* Right: validate + plan + results */}
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="cinema-eyebrow mb-2 flex items-center gap-1.5">
              {validation.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} {ui.validate}
            </div>
            {validation.valid ? <div className="text-[11px] text-emerald-400">{ui.validateOk}</div> : (
              <ul className="text-[11px] text-rose-300 space-y-0.5 list-disc list-inside">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="cinema-eyebrow mb-2">{ui.execPlan}</div>
            {plan.ok ? (
              <div className="space-y-1.5">
                {plan.levels.map((lvl, i) => (
                  <div key={i} className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/40 w-10">{ui.layerN.replace('{n}', String(i + 1))}</span>
                    {lvl.map((id) => <span key={id} className="px-1.5 py-0.5 rounded text-[10px] bg-white/10">{graph.nodes.find((n) => n.id === id)?.label || id}</span>)}
                  </div>
                ))}
              </div>
            ) : <div className="text-[11px] text-rose-300">{plan.error}</div>}
          </div>

          {runSteps && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="cinema-eyebrow mb-2">{ui.runResults}</div>
              <div className="space-y-1">
                {runSteps.map((s) => (
                  <div key={s.nodeId} className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      {s.status === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        : s.status === 'failed' ? <XCircle className="w-3 h-3 text-rose-400" />
                        : s.status === 'running' ? <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                        : s.status === 'skipped' ? <AlertTriangle className="w-3 h-3 text-amber-400/60" />
                        : <span className="w-3 h-3 inline-block rounded-full border border-white/20" />}
                      {graph.nodes.find((n) => n.id === s.nodeId)?.label || s.nodeId}
                    </span>
                    <span className="text-white/40 tabular-nums">{s.ms ? `${s.ms}ms` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

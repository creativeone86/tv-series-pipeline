'use client';

/**
 * New-series wizard (phase 26 · v12.22.0).
 * Flow: (1) series name + optional anchor project (inherit lead / look → cross-episode consistency)
 *       (2) AI split (one-line premise + episode count → LLM outlines, editable) or fill manually
 *       (3) create series (optional "batch-generate now") → series panel.
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { FilmSlate, CircleNotch as Loader2, Sparkle, Plus, Trash, ArrowLeft } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface Ep { title: string; premise: string }
interface Proj { id: string; title: string; status: string }

export default function NewSeriesWizard() {
  const router = useRouter();
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const [seriesTitle, setSeriesTitle] = useState('');
  const [anchorProjectId, setAnchorProjectId] = useState('');
  const [projects, setProjects] = useState<Proj[]>([]);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [premise, setPremise] = useState('');
  const [episodeCount, setEpisodeCount] = useState(3);
  const [episodes, setEpisodes] = useState<Ep[]>([]);
  const [autoGen, setAutoGen] = useState(true);
  const [splitting, setSplitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState(''); // v12.24.0: soft hint when split is short

  const authHeaders = useCallback((): Record<string, string> => {
    const tok = getToken();
    return tok ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` } : { 'Content-Type': 'application/json' };
  }, []);

  // Load projects for the anchor picker (prefer completed — they have generated cast / look to inherit)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects', { headers: authHeaders() });
        const body = await res.json();
        const arr: Proj[] = Array.isArray(body) ? body : (Array.isArray(body?.projects) ? body.projects : []);
        setProjects(arr.filter((p) => p && p.id));
      } catch { /* silent */ }
    })();
  }, [authHeaders]);

  const aiSplit = async () => {
    if (splitting || !premise.trim()) return;
    setSplitting(true); setErr(''); setWarn('');
    try {
      const res = await fetch('/api/series/split', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ premise: premise.trim(), episodeCount }) });
      const body = await res.json();
      if (!res.ok || !Array.isArray(body.episodes)) { setErr(body?.error || t.dashMore.splitFailed.replace('{status}', String(res.status))); return; }
      const eps = body.episodes.map((e: any) => ({ title: e.title || '', premise: e.premise || '' }));
      setEpisodes(eps);
      // v12.24.0: short-split hint — LLM sometimes under-splits; remind user to add an episode or re-split
      if (eps.length < episodeCount) {
        setWarn(t.dashMore.splitShortWarn.replace('{n}', String(eps.length)).replace('{target}', String(episodeCount)));
      }
    } catch (e) { setErr(e instanceof Error ? e.message : t.seriesDetail.requestFailed); }
    finally { setSplitting(false); }
  };

  const setEp = (i: number, patch: Partial<Ep>) => setEpisodes((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const addEp = () => setEpisodes((es) => [...es, { title: '', premise: '' }]);
  const removeEp = (i: number) => setEpisodes((es) => es.filter((_, j) => j !== i));

  const validEpisodes = episodes.filter((e) => e.premise.trim());

  const create = async () => {
    if (creating || validEpisodes.length === 0) return;
    setCreating(true); setErr('');
    try {
      const res = await fetch('/api/series', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          seriesTitle: seriesTitle.trim() || t.dashMore.defaultSeriesTitle,
          anchorProjectId: anchorProjectId || undefined,
          episodes: validEpisodes.map((e) => ({ title: e.title.trim() || undefined, premise: e.premise.trim() })),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.seriesId) { setErr(body?.error || t.dashMore.createFailedStatus.replace('{status}', String(res.status))); setCreating(false); return; } // v12.23.0: reset on error so the button does not stick
      if (autoGen) {
        await fetch(`/api/series/${encodeURIComponent(body.seriesId)}/generate`, { method: 'POST', headers: authHeaders(), body: '{}' }).catch(() => {});
      }
      router.push(`/dashboard/series/${encodeURIComponent(body.seriesId)}`);
    } catch (e) { setErr(e instanceof Error ? e.message : t.seriesDetail.requestFailed); setCreating(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/series" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> {t.sidebar.series}</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 grid place-items-center"><FilmSlate className="w-6 h-6 text-cyan-400" /></div>
        <h1 className="text-xl font-bold text-white">{t.dashMore.newSeriesTitle}</h1>
      </div>

      {/* Series name + anchor */}
      <label className="block text-xs text-gray-400 mb-1">{t.dashMore.seriesNameLabel}</label>
      <input value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} placeholder={t.dashMore.seriesNamePlaceholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4 outline-none focus:border-cyan-500/40" />

      <label className="block text-xs text-gray-400 mb-1">{t.dashMore.anchorLabel}</label>
      <select value={anchorProjectId} onChange={(e) => setAnchorProjectId(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-5 outline-none focus:border-cyan-500/40">
        <option value="">{t.dashMore.noAnchor}</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.id}{p.status === 'completed' ? ' ✓' : ''}</option>)}
      </select>

      {/* Mode switch */}
      <div className="flex gap-2 mb-4">
        {(['ai', 'manual'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${mode === m ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}>
            {m === 'ai' ? t.dashMore.aiSplitMode : t.dashMore.manualMode}
          </button>
        ))}
      </div>

      {mode === 'ai' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
          <label className="block text-xs text-gray-400 mb-1">{t.dashMore.premiseLabel}</label>
          <textarea value={premise} onChange={(e) => setPremise(e.target.value)} rows={2} placeholder={t.dashMore.premisePlaceholder}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 mb-3" />
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">{t.dashMore.episodeCountLabel}</label>
            <input type="number" min={1} max={50} value={episodeCount} onChange={(e) => setEpisodeCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none" />
            <button onClick={aiSplit} disabled={splitting || !premise.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium disabled:opacity-40 ml-auto">
              {splitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />} {t.dashMore.aiSplitBtn}
            </button>
          </div>
        </div>
      )}

      {/* Per-episode outlines (editable after AI split or when filling manually) */}
      {(episodes.length > 0 || mode === 'manual') && (
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t.dashMore.epOutlines}</span>
            <button onClick={addEp} className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"><Plus className="w-3.5 h-3.5" />{t.dashMore.addEpisode}</button>
          </div>
          {episodes.map((ep, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-cyan-400 font-bold text-xs shrink-0">{t.seriesDetail.episodeLabel.replace('{n}', String(i + 1))}</span>
                <input value={ep.title} onChange={(e) => setEp(i, { title: e.target.value })} placeholder={t.dashMore.epTitlePlaceholder}
                  className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none" />
                <button onClick={() => removeEp(i)} className="text-gray-500 hover:text-red-400 shrink-0"><Trash className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={ep.premise} onChange={(e) => setEp(i, { premise: e.target.value })} rows={2} placeholder={t.dashMore.epPremisePlaceholder}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/40" />
            </div>
          ))}
          {episodes.length === 0 && mode === 'manual' && <button onClick={addEp} className="text-xs text-cyan-300">{t.dashMore.addFirstEpisode}</button>}
        </div>
      )}

      {warn && <div className="mb-3 text-[13px] text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">⚠️ {warn}</div>}
      {err && <div className="mb-4 text-[13px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}

      <label className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <input type="checkbox" checked={autoGen} onChange={(e) => setAutoGen(e.target.checked)} /> {t.dashMore.autoGenAfterCreate}
      </label>

      <button onClick={create} disabled={creating || validEpisodes.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium disabled:opacity-40">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilmSlate className="w-4 h-4" />}
        {validEpisodes.length > 0 ? t.dashMore.createSeriesWithN.replace('{n}', String(validEpisodes.length)) : t.dashMore.createSeries}
      </button>
    </div>
  );
}

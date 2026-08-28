'use client';

/**
 * v6.2.1 — long-form split workbench UI.
 * Paste a novel/script → auto episode preview + narration mode → send each
 * episode into the workshop (orchestrator).
 * Split logic lives in lib/story-intake (tested, client-safe); this page is
 * interaction + handing an episode + narration directive to /dashboard/create
 * via sessionStorage (avoids oversize URLs).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scroll as ScrollText, Sparkle as Sparkles, CaretRight as ChevronRight, Stack as Layers, Microphone as Mic, SpeakerHigh as Volume2, ListChecks, ArrowCounterClockwise as RotateCcw, Waveform as AudioLines, CircleNotch as Loader2, CheckCircle as CheckCircle2 } from '@phosphor-icons/react';
import {
  splitIntoEpisodes, NARRATION_MODES, getNarrationMode,
  type Episode, type NarrationMode,
} from '@/lib/story-intake';
import { buildNarrationTrack } from '@/lib/narration-track';
import {
  buildSeasonBatch, nextPending, markJob, batchProgress, type SeasonBatchPlan,
} from '@/lib/season-batch';
import { useLocale } from '@/hooks/use-locale';

const BATCH_KEY = 'qfmj-season-batch';

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

export default function StoryIntakePage() {
  const { locale, t: loc } = useLocale();
  const t = loc as DashT;
  const router = useRouter();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<NarrationMode>('dialogue');
  const [targetChars, setTargetChars] = useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  // v6.2.2: season batch (persisted in localStorage, resume across pages)
  const [batch, setBatch] = useState<SeasonBatchPlan | null>(null);
  // v6.2.3: N-episode parallel narration-track orchestration
  const [narrating, setNarrating] = useState(false);
  const [narrateReport, setNarrateReport] = useState<any | null>(null);

  const modeLabel = (m: { id: string; label: string }) =>
    locale === 'en' ? (t.dashPages[`siMode_${m.id}`] || m.label) : m.label;
  const modeDesc = (m: { id: string; description: string }) =>
    locale === 'en' ? (t.dashPages[`siModeDesc_${m.id}`] || m.description) : m.description;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BATCH_KEY);
      if (raw) setBatch(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistBatch = (b: SeasonBatchPlan | null) => {
    setBatch(b);
    try {
      if (b) localStorage.setItem(BATCH_KEY, JSON.stringify(b));
      else localStorage.removeItem(BATCH_KEY);
    } catch { /* ignore */ }
  };

  const doSplit = () => {
    const tc = parseInt(targetChars, 10);
    const eps = splitIntoEpisodes(text, { targetChars: Number.isFinite(tc) && tc > 0 ? tc : undefined });
    setEpisodes(eps);
  };

  const seedAndGo = (seed: string) => {
    try { sessionStorage.setItem('qfmj-create-seed', seed); } catch { /* ignore */ }
    router.push('/dashboard/create');
  };

  const sendToCreate = (ep: Episode) => {
    const nm = getNarrationMode(mode);
    seedAndGo(`${t.dashPages.siSeedPrefix.replace('{mode}', nm.label)}${nm.directive}\n\n${ep.title}\n${ep.text}`);
  };

  const startBatch = () => {
    if (!episodes || episodes.length === 0) return;
    persistBatch(buildSeasonBatch(episodes, { mode }));
  };

  // v6.2.3: season-parallel real narration tracks (backend orchestrateSeason, bounded concurrency)
  const narrateSeason = async () => {
    if (!episodes || episodes.length === 0) return;
    setNarrating(true); setNarrateReport(null);
    try {
      const res = await fetch('/api/season/narrate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes, mode, concurrency: 3 }),
      });
      const d = await res.json();
      setNarrateReport(res.ok ? d : { error: d?.message || t.dashPages.generateFailed });
    } catch (e: any) {
      setNarrateReport({ error: e?.message || t.dashPages.generateFailed });
    } finally {
      setNarrating(false);
    }
  };

  const sendNextBatch = () => {
    if (!batch) return;
    const job = nextPending(batch.jobs);
    if (!job) return;
    const updated = { ...batch, jobs: markJob(batch.jobs, job.episodeIndex, 'done') };
    persistBatch(updated);
    seedAndGo(job.seed);
  };

  // v12.194: AI ask-the-book — long text → cast / setting / highlight dossier (3-segment sample)
  const [profile, setProfile] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const askBook = async () => {
    if (analyzing || text.trim().length < 500) return;
    setAnalyzing(true); setProfile(null);
    try {
      const r = await fetch('/api/story-intake/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      setProfile(r.ok ? d.profile : { error: d?.message || t.dashPages.analyzeFailed });
    } catch { setProfile({ error: t.dashPages.networkError }); }
    finally { setAnalyzing(false); }
  };
  const totalChars = text.trim().length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-amber-400" />
          {t.sidebar.storyIntake}
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          {t.dashPages.siSubtitle}
        </p>
        {/* v12.194: AI ask-the-book */}
        <div className="mt-3 flex items-center gap-3">
          <button onClick={askBook} disabled={analyzing || totalChars < 500} className="px-3 py-1.5 rounded-lg text-[12px] border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 disabled:opacity-40">
            {analyzing ? t.dashPages.siReading : t.dashPages.siAskBook}
          </button>
          {profile?.sampledOnly && <span className="text-[10px] text-gray-500">{t.dashPages.siSampled}</span>}
        </div>
        {profile && !profile.error && (
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-[11px]">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="font-medium mb-1.5">{t.dashPages.siPeople.replace('{n}', String((profile.characters || []).length))}</div>
              {(profile.characters || []).slice(0, 8).map((c: any) => (
                <div key={c.name} className="mb-1.5"><span className="text-amber-300">{c.name}</span> <span className="opacity-50">{c.role}</span><div className="opacity-70">{c.traits}</div><div className="opacity-50">{c.relationships}</div></div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="font-medium mb-1.5">{t.dashPages.siSettings.replace('{n}', String((profile.settings || []).length))}</div>
              {(profile.settings || []).slice(0, 10).map((x: any) => (
                <div key={x.term} className="mb-1"><span className="text-cyan-300">{x.term}</span> <span className="opacity-70">{x.definition}</span></div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="font-medium mb-1.5">{t.dashPages.siHighlights.replace('{n}', String((profile.highlights || []).length))}</div>
              {(profile.highlights || []).slice(0, 8).map((h: any, i: number) => (
                <div key={i} className="mb-1.5"><div className="opacity-90">{h.scene}</div><div className="opacity-50">{h.why} · {h.positionHint}</div></div>
              ))}
            </div>
          </div>
        )}
        {profile?.error && <div className="mt-2 text-[11px] text-red-400">{profile.error}</div>}
      </div>

      {/* v6.2.2: season-batch progress (persisted, resume across pages) */}
      {batch && batch.jobs.length > 0 && (() => {
        const prog = batchProgress(batch.jobs);
        const next = nextPending(batch.jobs);
        return (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white flex items-center gap-1.5"><ListChecks className="w-4 h-4 text-amber-400" />{t.dashPages.siBatchTitle.replace('{mode}', batch.modeLabel)}</p>
              <button onClick={() => persistBatch(null)} className="text-[11px] text-[var(--muted)] hover:text-white inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" />{t.common.reset}</button>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${prog.pct}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--muted)]">{t.dashPages.siBatchSent.replace('{done}', String(prog.done)).replace('{total}', String(prog.total))}</span>
              {next ? (
                <button onClick={sendNextBatch} className="px-4 py-1.5 rounded-xl text-[12px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />{t.dashPages.siSendNext.replace('{n}', String(next.episodeIndex)).replace('{title}', next.title)}<ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[12px] text-emerald-400">{t.dashPages.siBatchDone}</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.dashPages.siPastePh}
        rows={10}
        className="w-full bg-black/40 border border-[var(--border)] rounded-2xl p-4 text-sm text-white placeholder:text-[var(--muted)] outline-none focus:border-amber-500/40 transition-colors resize-y"
      />

      {/* Controls */}
      <div className="mt-3 flex flex-col gap-3">
        {/* Narration mode — lib labels; en uses dashPages fallback (no nameEn on the lib row) */}
        <div>
          <p className="text-xs text-[var(--muted)] mb-1.5 flex items-center gap-1"><Mic className="w-3 h-3" /> {t.dashPages.siNarrationMode}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {NARRATION_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  mode === m.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-[var(--border)] bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`text-sm font-medium ${mode === m.id ? 'text-amber-300' : 'text-white'}`}>{modeLabel(m)}</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{modeDesc(m)}</div>
                {m.generatesNarrationTrack && <div className="text-[10px] text-violet-300/80 mt-1">{t.dashPages.siPlusTrack}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* target + split */}
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className="text-xs text-[var(--muted)] mb-1.5">{t.dashPages.siTargetChars}</p>
            <input
              type="number"
              value={targetChars}
              onChange={(e) => setTargetChars(e.target.value)}
              placeholder={t.dashPages.siTargetPh}
              className="w-40 bg-black/40 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] outline-none focus:border-amber-500/40"
            />
          </div>
          <button
            onClick={doSplit}
            disabled={totalChars === 0}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Layers className="w-4 h-4" /> {t.dashPages.siSmartSplit}
          </button>
          {totalChars > 0 && <span className="text-[11px] text-[var(--muted)] pb-2">{t.dashPages.siCharsTotal.replace('{n}', String(totalChars))}</span>}
        </div>
      </div>

      {/* Episodes */}
      {episodes && (
        <div className="mt-6">
          {episodes.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-10">{t.dashPages.siNoEpisodes}</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <p className="text-sm font-medium text-white">{t.dashPages.siSplitSummary.replace('{n}', String(episodes.length)).replace('{mode}', modeLabel(getNarrationMode(mode)))}</p>
                <div className="flex items-center gap-2">
                  {getNarrationMode(mode).generatesNarrationTrack && (
                    <button
                      onClick={narrateSeason}
                      disabled={narrating}
                      className="px-3.5 py-1.5 rounded-xl text-[12px] font-medium bg-sky-500/15 text-sky-200 border border-sky-500/30 hover:bg-sky-500/25 transition-all inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {narrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AudioLines className="w-3.5 h-3.5" />}
                      {t.dashPages.siSeasonNarrate}
                    </button>
                  )}
                  <button
                    onClick={startBatch}
                    className="px-3.5 py-1.5 rounded-xl text-[12px] font-medium bg-violet-500/15 text-violet-200 border border-violet-500/30 hover:bg-violet-500/25 transition-all inline-flex items-center gap-1.5"
                  >
                    <ListChecks className="w-3.5 h-3.5" />{t.dashPages.siSeasonBatch}
                  </button>
                </div>
              </div>

              {/* v6.2.3: season-parallel narration-track result */}
              {narrateReport && (
                <div className="mb-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.06] p-4">
                  {narrateReport.error ? (
                    <p className="text-[12px] text-rose-300">⚠ {narrateReport.error}</p>
                  ) : (() => {
                    const r = narrateReport.report;
                    const anyRendered = r.results.some((x: any) => x.output?.rendered);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white flex items-center gap-1.5"><AudioLines className="w-4 h-4 text-sky-300" />{t.dashPages.siNarrateReport.replace('{n}', String(narrateReport.concurrency))}</p>
                          <span className="text-[11px] text-[var(--muted)]">{t.dashPages.siNarrateOk.replace('{ok}', String(r.ok)).replace('{total}', String(r.total))}{r.failed ? t.dashPages.siNarrateFail.replace('{n}', String(r.failed)) : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {r.results.map((x: any) => (
                            <div key={x.episodeIndex} className="rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[12px] text-white">
                                {x.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
                                <span className="text-sky-300">EP{x.episodeIndex}</span>
                                <span className="truncate">{x.title}</span>
                              </div>
                              {x.output && (
                                <p className="mt-1 text-[10px] text-[var(--muted)]">
                                  {t.dashPages.siSegMeta.replace('{n}', String(x.output.segments)).replace('{sec}', String(x.output.durationSec)).replace('{voice}', x.output.voiceLabel)}
                                  {x.output.rendered
                                    ? <span className="text-emerald-400"> {t.dashPages.siAudioOut.replace('{n}', String(x.output.okCount))}</span>
                                    : <span className="text-amber-400"> {t.dashPages.siPlanReady}</span>}
                                </p>
                              )}
                              {x.error && <p className="mt-1 text-[10px] text-rose-300/90">{x.error}</p>}
                            </div>
                          ))}
                        </div>
                        {!anyRendered && (
                          <p className="mt-2 text-[10px] text-[var(--soft)]">
                            {t.dashPages.siNeedTtsBefore} <code className="text-amber-300">MINIMAX_API_KEY</code> {t.dashPages.siNeedTtsAfter}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {episodes.map((ep) => (
                  <div key={ep.index} className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold text-white truncate">
                        <span className="text-amber-400 mr-1.5">EP{ep.index}</span>{ep.title}
                      </h4>
                      <span className="text-[10px] text-[var(--muted)] shrink-0">{t.dashPages.siCharsN.replace('{n}', String(ep.charCount))}</span>
                    </div>
                    <p className="text-[12px] text-[var(--muted)] leading-relaxed line-clamp-3 flex-1">
                      {ep.text.slice(0, 160)}
                    </p>
                    {(() => {
                      const nt = buildNarrationTrack({ text: ep.text, mode });
                      return nt.enabled && nt.segments.length > 0 ? (
                        <p className="mt-2 text-[10px] text-violet-300/80 flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />{t.dashPages.siVoiceover.replace('{n}', String(nt.segments.length)).replace('{sec}', String(nt.totalDurationSec)).replace('{voice}', nt.voiceLabel)}
                        </p>
                      ) : null;
                    })()}
                    <button
                      onClick={() => sendToCreate(ep)}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-medium bg-[#E8C547]/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> {t.dashPages.siCreateFromEp}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

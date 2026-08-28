'use client';

/**
 * Script Polish · Polish Studio (v2.11 #5 industry upgrade)
 *
 * Lightweight tool, independent of the full Agent pipeline. Users can:
 *   1. Auto-import an existing project script (?projectId=xxx),
 *      or paste text on the left
 *   2. Choose Basic (fast) / Pro (industry) mode
 *   3. Pick a target style (literary/commercial/thriller/comedy/documentary/poetic)
 *      + intensity (light/moderate/heavy)
 *   4. Click "Start polish" → right pane shows result + change notes;
 *      Pro also emits an industry diagnosis
 *
 * Two modes:
 *   Basic → fast and cheap (15-40s), copy only
 *   Pro   → industry (60-180s), rewrite against McKee/Field/Seger + drama pacing
 *           + AIGC pipeline readiness, plus a full industry checklist
 *
 * Typical uses:
 *   - Hand-written outline/prose that needs more visual punch before Writer
 *   - Existing script whose pacing/tone is off; try another style
 *   - Pro: QA checklist before sending a full script into the pipeline
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkle as Sparkles, Copy, Check, ArrowCounterClockwise as RotateCcw, ArrowsLeftRight as ArrowRightLeft, MagicWand as Wand2, FileText, WarningCircle as AlertCircle, CircleNotch as Loader2, Download, Stethoscope, Gauge, FloppyDisk as Save, X, GitDiff as FileDiff, TextAlignJustify as AlignJustify, FileArrowDown as FileDown, ClockCounterClockwise as History, StopCircle, Books as Library } from '@phosphor-icons/react';
import IndustryAuditCard, { type PolishAudit } from '@/components/polish/IndustryAuditCard';
import DiffPanel from '@/components/polish/DiffPanel';
import PolishHistoryPanel, { type PolishHistoryEntry } from '@/components/polish/PolishHistoryPanel';
import { auditToMarkdown } from '@/lib/audit-markdown';
import { buildPolishDocxHtml } from '@/lib/polish-docx';
import { useLocale } from '@/hooks/use-locale';

type Style = 'literary' | 'commercial' | 'thriller' | 'comedy' | 'documentary' | 'poetic';
type Intensity = 'light' | 'moderate' | 'heavy';
type Mode = 'basic' | 'pro';

const STYLE_VALUES: Style[] = ['literary', 'commercial', 'thriller', 'comedy', 'documentary', 'poetic'];
const INTENSITY_VALUES: Intensity[] = ['light', 'moderate', 'heavy'];

interface PolishResult {
  polished: string;
  summary?: string;
  notes?: string[];
  audit?: PolishAudit | null;
  mode?: Mode;
  elapsedMs?: number;
  model?: string;
  /** true when model JSON was malformed and the backend fell back to regex repair */
  degraded?: boolean;
}

export default function PolishPage() {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const search = useSearchParams();
  const projectId = search.get('projectId') || '';

  const [source, setSource] = useState('');
  const [mode, setMode] = useState<Mode>('basic');
  const [style, setStyle] = useState<Style | ''>('');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null); // v12.3.3: upgrade link when billing gate rejects
  const [copied, setCopied] = useState(false);
  const [projectScriptName, setProjectScriptName] = useState<string | null>(null);
  // Write-back to project (available in both Pro and Basic)
  const [projectScriptAssetId, setProjectScriptAssetId] = useState<string | null>(null);
  const [projectScriptAssetData, setProjectScriptAssetData] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<'ok' | 'err' | null>(null);
  const [saveMsg, setSaveMsg] = useState<string>('');
  // Body view: full (block) / diff (side-by-side)
  // v2.11 #1a: default 'diff' so changes are visible immediately
  const [resultView, setResultView] = useState<'full' | 'diff'>('diff');
  // Mid-run cancel: AbortController for the in-flight request
  const abortRef = useRef<AbortController | null>(null);
  // Save to asset library
  const [savingToLib, setSavingToLib] = useState(false);
  const [savedToLib, setSavedToLib] = useState<'ok' | 'err' | null>(null);
  const [savedToLibMsg, setSavedToLibMsg] = useState<string>('');
  // History panel toggle
  const [showHistory, setShowHistory] = useState(false);
  // Marker that the visible result was loaded from history, not just generated
  const [viewingHistoryAt, setViewingHistoryAt] = useState<string | null>(null);
  // Keyword from audit-card "search"; matching spans in polished body are <mark>ed
  const [highlightKeyword, setHighlightKeyword] = useState<string>('');

  const styles = useMemo(() => STYLE_VALUES.map((value) => ({
    value,
    label: t.polishUi[`style${value[0].toUpperCase()}${value.slice(1)}`],
    hint: t.polishUi[`style${value[0].toUpperCase()}${value.slice(1)}Hint`],
  })), [t]);

  const intensities = useMemo(() => INTENSITY_VALUES.map((value) => ({
    value,
    label: t.polishUi[`intensity${value[0].toUpperCase()}${value.slice(1)}`],
    hint: t.polishUi[`intensity${value[0].toUpperCase()}${value.slice(1)}Hint`],
  })), [t]);

  // If ?projectId= is present, try to load that project's script
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await fetch(`/api/assets?projectId=${encodeURIComponent(projectId)}&type=script`);
        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) return;
        const scriptAsset = arr[0];
        const seed = assembleScript(scriptAsset.data, t);
        if (seed) {
          setSource(seed);
          setProjectScriptName(scriptAsset.name || scriptAsset.data?.title || t.polishUi.projectScript);
          setProjectScriptAssetId(scriptAsset.id);
          setProjectScriptAssetData(scriptAsset.data || {});
        }
      } catch {
        // Silent fail — manual paste still works
      }
    })();
  }, [projectId, locale]); // locale only: t is rebuilt every render via deepMerge

  const charCount = source.length;
  const overLimit = charCount > 32000;

  const canRun = useMemo(
    () => source.trim().length >= 20 && !loading && !overLimit,
    [source, loading, overLimit],
  );

  const handlePolish = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setUpgradeUrl(null);
    setResult(null);
    setViewingHistoryAt(null);
    setHighlightKeyword('');
    // v2.11 #1a: AbortController so the user can stop and change settings
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch('/api/polish-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: source,
          mode,
          style: style || undefined,
          intensity,
          focus: focus.trim() || undefined,
        }),
        signal: ac.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        // v12.3.3: billing gate (402 plan_required) → friendly hint + billing, not a key error
        if (res.status === 402 || data?.error === 'plan_required') {
          setError(mode === 'pro'
            ? t.polishUi.billingProRequired
            : (data?.message || t.polishUi.billingUpgradeRequired));
          setUpgradeUrl(data?.upgradeUrl || '/dashboard/billing');
        } else {
          setError(data?.error || t.polishUi.polishFailedStatus.replace('{status}', String(res.status)));
        }
        return;
      }
      setResult(data);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError(t.polishUi.stoppedHint);
      } else {
        setError(e?.message || t.polishUi.networkError);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  /** Abort the in-flight polish request; selected params stay as-is */
  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const handleCopy = () => {
    if (!result?.polished) return;
    navigator.clipboard.writeText(result.polished).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReplace = () => {
    if (!result?.polished) return;
    setSource(result.polished);
    setResult(null);
  };

  const handleDownload = () => {
    if (!result?.polished) return;
    const blob = new Blob([result.polished], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polished-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Export as Word (.doc) — Word-native HTML+namespace so Word/WPS/Pages/Google Docs open it.
   * No extra npm dep; size is close to markdown while keeping heading / table / list / quote styles.
   */
  const handleExportDocx = () => {
    if (!result?.polished) return;
    const html = buildPolishDocxHtml({
      projectTitle: projectScriptName || undefined,
      mode: result.mode,
      style: style || null,
      intensity,
      focus: focus.trim() || null,
      model: result.model,
      at: new Date().toISOString(),
      polished: result.polished,
      summary: result.summary,
      notes: result.notes,
      audit: result.audit,
    });
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffix = result.mode === 'pro' ? 'audit' : 'polished';
    const titleSlug = projectScriptName ? `-${projectScriptName.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)}` : '';
    a.href = url;
    a.download = `${suffix}${titleSlug}-${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Save to the global asset library as a reusable "script asset".
   * Written to global_assets as type='style' (no 'script' type; style is the generic slot);
   * actual type enum may vary — we distinguish via metadata.
   */
  const handleSaveToLibrary = async () => {
    if (!result?.polished || savingToLib) return;
    setSavingToLib(true);
    setSavedToLib(null);
    setSavedToLibMsg('');
    try {
      const name = projectScriptName
        ? `${projectScriptName} · ${result.mode === 'pro' ? t.polishUi.libNamePro : t.polishUi.libNameBasic}`
        : t.polishUi.libNameDraft.replace('{date}', new Date().toLocaleDateString(locale === 'en' ? 'en' : 'zh-CN'));
      const res = await fetch('/api/global-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'style',
          name: name.slice(0, 80),
          description: (result.summary || '').slice(0, 300),
          tags: [
            'polish',
            result.mode || 'basic',
            ...(style ? [String(style)] : []),
          ],
          metadata: {
            kind: 'polish-script',
            polished: result.polished,
            audit: result.audit,
            notes: result.notes,
            model: result.model,
            mode: result.mode,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || t.polishUi.saveFailedStatus.replace('{status}', String(res.status)));
      }
      setSavedToLib('ok');
      setSavedToLibMsg(t.polishUi.savedToLibMsg);
      setTimeout(() => setSavedToLib(null), 3500);
    } catch (e: any) {
      setSavedToLib('err');
      setSavedToLibMsg(e?.message || t.polishUi.saveFailed);
      setTimeout(() => setSavedToLib(null), 5000);
    } finally {
      setSavingToLib(false);
    }
  };

  /** Export this polish (and optional audit) as a Markdown report — Feishu / Notion / GitHub ready */
  const handleExportMarkdown = () => {
    if (!result?.polished) return;
    const md = auditToMarkdown({
      projectTitle: projectScriptName || undefined,
      mode: result.mode,
      style: style || null,
      intensity,
      focus: focus.trim() || null,
      model: result.model,
      at: new Date().toISOString(),
      polished: result.polished,
      summary: result.summary,
      notes: result.notes,
      audit: result.audit,
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffix = result.mode === 'pro' ? 'audit' : 'polished';
    const titleSlug = projectScriptName ? `-${projectScriptName.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)}` : '';
    a.href = url;
    a.download = `${suffix}${titleSlug}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSource('');
    setResult(null);
    setError(null);
    setUpgradeUrl(null);
    setMode('basic');
    setStyle('');
    setIntensity('moderate');
    setFocus('');
    setSaved(null);
    setSaveMsg('');
    setViewingHistoryAt(null);
    setHighlightKeyword('');
  };

  /**
   * Write this polish (+ optional Pro audit) back to the project script asset as a sidecar.
   *
   * Never mutate data.shots[] (shots link camera assets). Push this run into
   * data.polishHistory[] (max 10) and point data.latestPolish at the newest entry
   * so the project detail page can consume it.
   */
  const handleSaveToProject = async () => {
    if (!result?.polished || !projectId || !projectScriptAssetId) return;
    setSaving(true);
    setSaved(null);
    setSaveMsg('');
    try {
      const entry = {
        at: new Date().toISOString(),
        mode: result.mode || mode,
        style: style || null,
        intensity,
        focus: focus.trim() || null,
        polished: result.polished,
        summary: result.summary || '',
        notes: result.notes || [],
        audit: result.audit || null,
        elapsedMs: result.elapsedMs,
        model: result.model,
      };

      const prev = projectScriptAssetData || {};
      const history = Array.isArray(prev.polishHistory) ? prev.polishHistory : [];
      const newData = {
        ...prev,
        latestPolish: entry,
        // Newest first; cap at 10 so asset.data does not grow without bound
        polishHistory: [entry, ...history].slice(0, 10),
      };

      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: projectScriptAssetId, data: newData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || t.polishUi.writeFailedStatus.replace('{status}', String(res.status)));
      }

      setProjectScriptAssetData(newData);
      setSaved('ok');
      setSaveMsg(
        entry.mode === 'pro' && entry.audit?.aigcReadiness?.score != null
          ? t.polishUi.saveToProjectReady.replace('{n}', String(entry.audit.aigcReadiness.score))
          : t.polishUi.saveToProjectOk
      );
      setTimeout(() => setSaved(null), 3500);
    } catch (e: any) {
      setSaved('err');
      setSaveMsg(e?.message || t.polishUi.writeFailed);
      setTimeout(() => setSaved(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Audit card "search" — store the keyword; the result pane marks matches in <pre> / DiffPanel
   * and switches to "full" view (DiffPanel is line-based and can split a line of dialogue).
   */
  const handleAuditSearch = (keyword: string) => {
    const kw = (keyword || '').trim();
    if (!kw) return;
    setHighlightKeyword(kw);
    setResultView('full');
    // Scroll the result pane into view if needed
    if (typeof document !== 'undefined') {
      const target = document.getElementById('polish-result-body');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /** Audit card "+" — append the keyword to "special requests", "; "-separated, de-duped */
  const handleAuditAddToFocus = (keyword: string) => {
    const kw = (keyword || '').trim();
    if (!kw) return;
    setFocus((prev) => {
      const parts = (prev || '')
        .split(/[；;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.includes(kw)) return prev; // already present
      const next = [...parts, kw].join('; ');
      // 300-char cap
      return next.length > 300 ? next.slice(0, 300) : next;
    });
  };

  /**
   * Load a history entry into the right-hand result pane — client-only, no save.
   * User can read an old version, then re-polish or replace the source and iterate.
   */
  const handleViewHistory = (entry: PolishHistoryEntry) => {
    if (!entry.polished) return;
    setResult({
      polished: entry.polished,
      summary: entry.summary,
      notes: entry.notes,
      audit: entry.audit,
      mode: entry.mode,
      model: entry.model,
      elapsedMs: entry.elapsedMs,
    });
    // Sync style / intensity / focus so the params for that run are obvious
    if (entry.style !== undefined) setStyle((entry.style as Style) || '');
    if (entry.intensity) setIntensity(entry.intensity as Intensity);
    if (entry.focus !== undefined && entry.focus !== null) setFocus(entry.focus);
    if (entry.mode) setMode(entry.mode);
    setViewingHistoryAt(entry.at || null);
    setError(null);
    setUpgradeUrl(null);
  };

  /**
   * Use a history entry's polished text as the new source and keep iterating.
   * Turns "source → polish" into "this polish → next polish".
   */
  const handleRestoreHistoryAsSource = (entry: PolishHistoryEntry) => {
    if (!entry.polished) return;
    setSource(entry.polished);
    setResult(null);
    setViewingHistoryAt(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-[#E8C547]" />
            {t.nav.polish}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t.polishUi.subtitle}
            {projectScriptName ? (
              <span className="ml-2 text-[#E8C547]">{t.polishUi.importedFrom.replace('{name}', projectScriptName)}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* History: only when we have history in a project context */}
          {projectId && (projectScriptAssetData?.polishHistory?.length || 0) > 0 ? (
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 rounded-lg text-xs text-violet-200 hover:text-violet-100 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 transition-colors flex items-center gap-1.5"
              title={t.polishUi.historyTitle}
            >
              <History className="w-3.5 h-3.5" />
              {t.polishUi.historyBtn.replace('{n}', String(projectScriptAssetData.polishHistory.length))}
            </button>
          ) : null}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title={t.polishUi.resetTitle}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.common.reset}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        {/* Mode: Basic / Pro */}
        <div>
          <label className="text-[11px] text-[var(--muted)] tracking-wider uppercase block mb-2">
            {t.polishUi.modeLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setMode('basic')}
              className={`text-left p-3 rounded-xl border transition-all ${
                mode === 'basic'
                  ? 'bg-[#E8C547]/10 border-[#E8C547]/40 shadow-[0_0_0_1px_rgba(232,197,71,0.2)]'
                  : 'bg-white/3 border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Gauge className={`w-4 h-4 ${mode === 'basic' ? 'text-[#E8C547]' : 'text-white/50'}`} />
                <span className={`text-sm font-semibold ${mode === 'basic' ? 'text-[#E8C547]' : 'text-white/80'}`}>
                  Basic
                </span>
                <span className="ml-auto text-[10px] text-white/40 tabular-nums">15-40s</span>
              </div>
              <p className="text-[11px] text-white/55 leading-relaxed">
                {t.polishUi.basicHint}
              </p>
            </button>
            <button
              onClick={() => setMode('pro')}
              className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                mode === 'pro'
                  ? 'bg-gradient-to-br from-violet-500/15 to-rose-500/10 border-violet-400/40 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]'
                  : 'bg-white/3 border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Stethoscope className={`w-4 h-4 ${mode === 'pro' ? 'text-violet-300' : 'text-white/50'}`} />
                <span className={`text-sm font-semibold ${mode === 'pro' ? 'text-violet-200' : 'text-white/80'}`}>
                  {t.polishUi.proLabel}
                </span>
                <span className="ml-auto text-[10px] text-white/40 tabular-nums">60-180s</span>
              </div>
              <p className="text-[11px] text-white/55 leading-relaxed">
                {t.polishUi.proHint}
              </p>
            </button>
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="text-[11px] text-[var(--muted)] tracking-wider uppercase block mb-2">
            {t.polishUi.styleLabel} <span className="text-[#E8C547]/60 normal-case">{t.polishUi.styleOptional}</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStyle('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                style === ''
                  ? 'bg-[#E8C547]/20 text-[#E8C547] border-[#E8C547]/30'
                  : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
              }`}
            >
              {t.polishUi.keepOriginal}
            </button>
            {styles.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  style === s.value
                    ? 'bg-[#E8C547]/20 text-[#E8C547] border-[#E8C547]/30'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
                title={s.hint}
              >
                {s.label}
                <span className="ml-1.5 opacity-50 text-[10px]">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label className="text-[11px] text-[var(--muted)] tracking-wider uppercase block mb-2">
            {t.polishUi.intensityLabel}
          </label>
          <div className="flex gap-2 flex-wrap">
            {intensities.map((it) => (
              <button
                key={it.value}
                onClick={() => setIntensity(it.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  intensity === it.value
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
                title={it.hint}
              >
                {it.label}
                <span className="ml-1.5 opacity-50 text-[10px]">{it.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Special requests */}
        <div>
          <label className="text-[11px] text-[var(--muted)] tracking-wider uppercase block mb-2">
            {t.polishUi.focusLabel} <span className="text-[#E8C547]/60 normal-case">{t.polishUi.optional}</span>
          </label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder={t.polishUi.focusPlaceholder}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[var(--border)] text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#E8C547]/50"
            maxLength={300}
          />
        </div>
      </div>

      {/* Compare panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: source — same scroll treatment */}
        <div className="flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden h-[calc(100vh-220px)] min-h-[520px] max-h-[calc(100vh-220px)]">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium text-white">{t.polishUi.original}</span>
              <span className={`text-[11px] font-mono ${overLimit ? 'text-red-400' : 'text-[var(--muted)]'}`}>
                {charCount} / 32000
              </span>
            </div>
            {source ? (
              <button
                onClick={() => setSource('')}
                className="text-[11px] text-[var(--muted)] hover:text-white transition-colors"
              >
                {t.polishUi.clear}
              </button>
            ) : null}
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={t.polishUi.sourcePlaceholder}
            className="flex-1 w-full resize-none p-4 bg-transparent text-sm text-white/90 placeholder:text-white/25 leading-relaxed focus:outline-none font-[ui-monospace,SFMono-Regular,Menlo,monospace]"
            spellCheck={false}
          />
          <div className="px-4 py-3 border-t border-[var(--border)] bg-black/20 flex justify-between items-center">
            <span className="text-[11px] text-[var(--muted)]">
              {projectId ? t.polishUi.sourceFromProject : t.polishUi.sourceFromManual}
            </span>
            {loading ? (
              // v2.11 #1a: red Stop while running so the user can cancel and retune
              <button
                onClick={handleStop}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-rose-500 to-red-600 text-white hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-rose-500/25"
                title={t.polishUi.stopTitle}
              >
                <StopCircle className="w-4 h-4" />
                {mode === 'pro' ? t.polishUi.stopDiagnosing : t.polishUi.stopPolishing}
              </button>
            ) : (
              <button
                onClick={handlePolish}
                disabled={!canRun}
                className={`px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center gap-2 shadow-lg ${
                  mode === 'pro'
                    ? 'bg-gradient-to-br from-violet-500 to-rose-500 text-white shadow-violet-500/25'
                    : 'bg-gradient-to-br from-[#E8C547] to-[#D4A830] text-black shadow-[#E8C547]/20'
                }`}
              >
                {mode === 'pro' ? (
                  <>
                    <Stethoscope className="w-4 h-4" />
                    {t.polishUi.runPro}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t.polishUi.runBasic}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: result — v2.13.2 fix: max-h so inner overflow-y-auto actually scrolls */}
        <div className="flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden h-[calc(100vh-220px)] min-h-[520px] max-h-[calc(100vh-220px)]">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8C547]" />
              <span className="text-sm font-medium text-white">{t.polishUi.resultLabel}</span>
              {result?.elapsedMs ? (
                <span className="text-[11px] font-mono text-[var(--muted)]">
                  {(result.elapsedMs / 1000).toFixed(1)}s · {result.model?.slice(0, 24)}
                </span>
              ) : null}
            </div>
            {result ? (
              <div className="flex items-center gap-1 flex-wrap">
                {/* Write-back — only when imported from a project */}
                {projectId && projectScriptAssetId ? (
                  <button
                    onClick={handleSaveToProject}
                    disabled={saving}
                    className={`px-2.5 py-1 rounded-md transition-colors text-[11px] flex items-center gap-1 border ${
                      saved === 'ok'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : saved === 'err'
                          ? 'bg-red-500/15 text-red-300 border-red-500/30'
                          : 'bg-violet-500/10 text-violet-200 border-violet-500/30 hover:bg-violet-500/20'
                    } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={t.polishUi.writebackTitle.replace('{name}', projectScriptName || '')}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t.polishUi.writing}
                      </>
                    ) : saved === 'ok' ? (
                      <>
                        <Check className="w-3 h-3" />
                        {t.polishUi.writtenBack}
                      </>
                    ) : saved === 'err' ? (
                      <>
                        <X className="w-3 h-3" />
                        {t.polishUi.failed}
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        {t.polishUi.writebackProject}
                      </>
                    )}
                  </button>
                ) : null}
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-[11px] text-white/70 flex items-center gap-1"
                  title={t.polishUi.copyTitle}
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? t.polishUi.copied : t.polishUi.copy}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-[11px] text-white/70 flex items-center gap-1"
                  title={t.polishUi.downloadTxtTitle}
                >
                  <Download className="w-3 h-3" />
                  .txt
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-[11px] text-white/70 flex items-center gap-1"
                  title={t.polishUi.exportMdTitle}
                >
                  <FileDown className="w-3 h-3" />
                  .md
                </button>
                <button
                  onClick={handleExportDocx}
                  className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-[11px] text-white/70 flex items-center gap-1"
                  title={t.polishUi.exportDocTitle}
                >
                  <FileDown className="w-3 h-3" />
                  .doc
                </button>
                <button
                  onClick={handleSaveToLibrary}
                  disabled={savingToLib}
                  className={`px-2.5 py-1 rounded-md transition-colors text-[11px] flex items-center gap-1 border ${
                    savedToLib === 'ok'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : savedToLib === 'err'
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-white/5 text-white/70 border-transparent hover:bg-white/10'
                  } ${savingToLib ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={t.polishUi.saveLibTitle}
                >
                  {savingToLib ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : savedToLib === 'ok' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Library className="w-3 h-3" />
                  )}
                  {savingToLib ? t.polishUi.savingShort : savedToLib === 'ok' ? t.polishUi.savedShort : t.polishUi.saveToLib}
                </button>
                <button
                  onClick={handleReplace}
                  className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-[11px] text-white/70 flex items-center gap-1"
                  title={t.polishUi.replaceSourceTitle}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  {t.polishUi.replaceSource}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertCircle className={`w-8 h-8 ${upgradeUrl ? 'text-[#E8C547]/70' : 'text-red-400/60'}`} />
                <p className="text-sm text-red-300">{error}</p>
                {upgradeUrl ? (
                  <>
                    <a href={upgradeUrl} className="cinema-btn-primary !text-[12px]">{t.polishUi.goUpgrade}</a>
                    <p className="text-[11px] text-[var(--muted)]">{t.polishUi.upgradeHint}</p>
                  </>
                ) : (
                  <p className="text-[11px] text-[var(--muted)]">{t.polishUi.checkApiKey}</p>
                )}
              </div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
                <Loader2 className={`w-8 h-8 animate-spin ${mode === 'pro' ? 'text-violet-300' : 'text-[#E8C547]'}`} />
                <p className="text-sm text-white/70">
                  {mode === 'pro' ? t.polishUi.loadingPro : t.polishUi.loadingBasic}
                </p>
                {mode === 'pro' ? (
                  <p className="text-[11px] text-white/40 max-w-[300px] text-center">
                    {t.polishUi.loadingProHint}
                  </p>
                ) : null}
              </div>
            ) : result ? (
              <div className="p-4 flex flex-col gap-4">
                {/* History-loaded result: banner so it is not mistaken for a fresh run */}
                {viewingHistoryAt ? (
                  <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex gap-2 items-center text-[12px] leading-relaxed text-violet-100">
                    <History className="w-4 h-4 shrink-0" />
                    <span className="flex-1">
                      {t.polishUi.viewingHistory}{' '}
                      <span className="font-mono text-violet-200/80">
                        {(() => {
                          try { return new Date(viewingHistoryAt).toLocaleString(locale === 'en' ? 'en' : 'zh-CN'); }
                          catch { return viewingHistoryAt; }
                        })()}
                      </span>
                    </span>
                    <button
                      onClick={() => setViewingHistoryAt(null)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                      title={t.polishUi.gotItTitle}
                    >
                      {t.polishUi.gotIt}
                    </button>
                  </div>
                ) : null}

                {/* Write-back toast */}
                {saved && saveMsg ? (
                  <div
                    className={`p-2.5 rounded-xl flex gap-2 items-start text-[12px] leading-relaxed ${
                      saved === 'ok'
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-200'
                        : 'bg-red-500/10 border border-red-500/25 text-red-200'
                    }`}
                  >
                    {saved === 'ok' ? (
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{saveMsg}</span>
                  </div>
                ) : null}

                {result.degraded ? (
                  <div className="p-3 rounded-xl bg-orange-500/8 border border-orange-500/20 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-orange-200/85 leading-relaxed">
                      {t.polishUi.degradedHint}
                    </p>
                  </div>
                ) : null}
                {result.summary ? (
                  <div className="p-3 rounded-xl bg-[#E8C547]/8 border border-[#E8C547]/20">
                    <p className="text-[10px] text-[#E8C547] tracking-wider uppercase mb-1">{t.polishUi.changeSummary}</p>
                    <p className="text-sm text-white/90 leading-relaxed">{result.summary}</p>
                  </div>
                ) : null}

                {result.notes && result.notes.length > 0 ? (
                  <div>
                    <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase mb-2">
                      {t.polishUi.notesLabel.replace('{n}', String(result.notes.length))}
                    </p>
                    <ul className="space-y-1.5">
                      {result.notes.map((n, i) => (
                        <li key={i} className="text-[12px] text-white/75 flex gap-2 leading-relaxed">
                          <span className="text-[#E8C547]/60 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">
                      {resultView === 'diff' ? t.polishUi.diffViewLabel : t.polishUi.fullViewLabel}
                    </p>
                    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/30 border border-white/5">
                      <button
                        onClick={() => setResultView('full')}
                        className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                          resultView === 'full'
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                        title={t.polishUi.viewFullTitle}
                      >
                        <AlignJustify className="w-3 h-3" />
                        {t.polishUi.viewFull}
                      </button>
                      <button
                        onClick={() => setResultView('diff')}
                        className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                          resultView === 'diff'
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                        title={t.polishUi.viewDiffTitle}
                      >
                        <FileDiff className="w-3 h-3" />
                        {t.polishUi.viewDiff}
                      </button>
                    </div>
                  </div>
                  {highlightKeyword ? (
                    <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11.5px] text-amber-100">
                      <span>{t.polishUi.searching}</span>
                      <code className="px-1.5 py-0.5 rounded bg-black/30 text-amber-200 font-mono">{highlightKeyword}</code>
                      <span className="text-amber-300/60 text-[10.5px] ml-auto tabular-nums">
                        {t.polishUi.matchCount.replace('{n}', String(countMatches(result.polished, highlightKeyword)))}
                      </span>
                      <button
                        onClick={() => setHighlightKeyword('')}
                        className="text-[10.5px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-white/80"
                      >
                        {t.polishUi.clearHighlight}
                      </button>
                    </div>
                  ) : null}
                  {resultView === 'diff' ? (
                    <DiffPanel before={source} after={result.polished} maxHeight="55vh" />
                  ) : (
                    <pre
                      id="polish-result-body"
                      className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-[ui-monospace,SFMono-Regular,Menlo,monospace] p-3 rounded-lg bg-black/30 border border-[var(--border)]"
                    >
                      {highlightKeyword
                        ? renderHighlighted(result.polished, highlightKeyword)
                        : result.polished}
                    </pre>
                  )}
                </div>

                {/* Pro: industry audit checklist */}
                {result.mode === 'pro' && result.audit ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="w-4 h-4 text-violet-300" />
                      <p className="text-[11px] text-violet-300 tracking-widest uppercase">
                        {t.polishUi.industryAudit}
                      </p>
                      <span className="ml-auto text-[10px] text-white/30">
                        McKee · Save the Cat · AIGC pipeline
                      </span>
                    </div>
                    <IndustryAuditCard
                      audit={result.audit}
                      actions={{
                        onSearch: handleAuditSearch,
                        onAddToFocus: handleAuditAddToFocus,
                      }}
                    />
                  </div>
                ) : result.mode === 'pro' && !result.audit && !result.degraded ? (
                  <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-200/85 leading-relaxed">
                      {t.polishUi.noAuditHint}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Wand2 className="w-10 h-10 text-white/15" />
                <p className="text-sm text-[var(--muted)]">
                  {t.polishUi.emptyHint}
                </p>
                <p className="text-[11px] text-white/40 max-w-[280px]">
                  {t.polishUi.emptySubhint}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History modal */}
      {showHistory ? (
        <PolishHistoryPanel
          history={(projectScriptAssetData?.polishHistory || []) as PolishHistoryEntry[]}
          onClose={() => setShowHistory(false)}
          onView={handleViewHistory}
          onRestoreSource={handleRestoreHistoryAsSource}
        />
      ) : null}

      {/* Footer tip */}
      <div className="mt-6 text-[11px] text-[var(--muted)] flex items-center justify-between flex-wrap gap-2">
        <span>
          {t.polishUi.footerTips}
          <Link href="/dashboard/projects" className="text-[#E8C547] hover:underline mx-1">{t.polishUi.goProjects}</Link>
          {t.polishUi.footerTipsTail}
        </span>
        <span className="font-mono">max 32,000 chars · {mode === 'pro' ? 'pro: claude-sonnet@0.5°' : 'basic: claude-sonnet@0.7°'}</span>
      </div>
    </div>
  );
}

/**
 * Split raw text into [plain, match, plain, match, ...] and wrap matches in <mark>.
 * Used to highlight the keyword from the audit-card search action.
 *
 * Literal match (no regex mode); escapeRegExp so "." / "?" stay literal.
 * Case-sensitive — script/dialogue case is meaningful.
 */
function renderHighlighted(text: string, keyword: string): ReactNode {
  const kw = (keyword || '').trim();
  if (!kw) return text;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, 'g');
  const parts: ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    parts.push(
      <mark
        key={`h-${i++}`}
        className="rounded px-0.5 bg-amber-300/40 text-amber-50 ring-1 ring-amber-300/40"
      >
        {m[0]}
      </mark>
    );
    lastIdx = m.index + m[0].length;
    // Prevent zero-width match infinite loop
    if (m[0].length === 0) re.lastIndex++;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length ? parts : text;
}

function countMatches(text: string, keyword: string): number {
  const kw = (keyword || '').trim();
  if (!kw) return 0;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.match(new RegExp(escaped, 'g'));
  return matches ? matches.length : 0;
}

/**
 * Reassemble persisted ScriptData (title/synopsis/shots[]) into a human-readable
 * storyboard script string so the LLM can polish it.
 */
function assembleScript(data: any, t: { polishUi: Record<string, string> }): string {
  if (!data) return '';
  const ui = t.polishUi;
  const lines: string[] = [];
  if (data.title) lines.push(ui.bookTitle.replace('{title}', data.title));
  if (data.synopsis) lines.push(`\n${ui.synopsisPrefix} ${data.synopsis}`);
  if (data.genre || data.style) {
    lines.push(`${ui.genrePrefix} ${[data.genre, data.style].filter(Boolean).join(' · ')}`);
  }
  const shots = Array.isArray(data.shots) ? data.shots : [];
  shots.forEach((s: any) => {
    const act = s.act ? ui.actSuffix.replace('{n}', String(s.act)) : '';
    lines.push(`\n── Shot ${s.shotNumber ?? '?'}${act} ──`);
    if (s.sceneDescription) lines.push(`${ui.tagScene} ${s.sceneDescription}`);
    if (s.characters?.length) lines.push(`${ui.tagChars} ${s.characters.join('、')}`);
    if (s.action) lines.push(`${ui.tagAction} ${s.action}`);
    if (s.emotion) lines.push(`${ui.tagEmotion} ${s.emotion}`);
    if (s.dialogue) lines.push(`${ui.tagDialogue} ${s.dialogue}`);
  });
  return lines.join('\n');
}

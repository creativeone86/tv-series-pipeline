'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleNotch as Loader2, Lightning, WarningCircle as AlertCircle, ChalkboardTeacher, FilmStrip as Film, ArrowRight } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';
import { listSupportedLanguages } from '@/lib/language-detect';
import { api } from '@/lib/api-client';

const CATEGORIES = ['PHYSICS', 'CHESS', 'MATH', 'TECHNOLOGY', 'SPACE', 'BIOLOGY', 'ECONOMICS', 'HISTORY', 'GENERAL'] as const;
const MOON = 'Защо Луната не пада върху Земята?';
// The budget engine is EUR-denominated; the studio field is labelled in USD.
const USD_EUR_RATE = 0.92;
const DEFAULT_CAP_USD = 20;
const usdToEur = (usd: number) => Math.round(usd * USD_EUR_RATE);

interface StyleKitOption { id: string; name: string; plateProfile?: string; parentId?: string }

export default function ExplainerStudioPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [topic, setTopic] = useState(MOON);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('PHYSICS');
  const [language, setLanguage] = useState('bg');
  const [targetSeconds, setTargetSeconds] = useState(300);
  const [styleKitId, setStyleKitId] = useState('LINE_TOON_V1');
  const [styleKits, setStyleKits] = useState<StyleKitOption[]>([]);
  const [capUsd, setCapUsd] = useState(DEFAULT_CAP_USD);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState<'plan' | 'produce' | null>(null);
  const [error, setError] = useState('');
  const [episodes, setEpisodes] = useState<any[] | null>(null);
  const [tweakInstruction, setTweakInstruction] = useState('');
  const [tweaking, setTweaking] = useState(false);

  // Per-video budget in EUR (what the engine enforces), derived from the USD field.
  const capEur = usdToEur(capUsd);

  useEffect(() => {
    api.projects()
      .then((d: any) => {
        if (Array.isArray(d)) setEpisodes(d.filter((p) => p.mode === 'narrated-explainer'));
        else setEpisodes([]);
      })
      .catch(() => setEpisodes([]));
  }, []);

  useEffect(() => {
    api.styleKits()
      .then((d: any) => {
        const kits: StyleKitOption[] = Array.isArray(d?.kits) ? d.kits : [];
        setStyleKits(kits);
        if (d?.defaultId && kits.some((k) => k.id === d.defaultId)) setStyleKitId(d.defaultId);
        else if (kits.length && !kits.some((k) => k.id === styleKitId)) setStyleKitId(kits[0]!.id);
      })
      .catch(() => setStyleKits([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyTweak() {
    if (!tweakInstruction.trim()) return;
    setTweaking(true); setError('');
    try {
      const d: any = await api.tweakStyleKit(styleKitId, { instruction: tweakInstruction.trim() });
      const newKit = d?.kit;
      const list: any = await api.styleKits();
      const kits: StyleKitOption[] = Array.isArray(list?.kits) ? list.kits : [];
      setStyleKits(kits);
      if (newKit?.id) setStyleKitId(newKit.id);
      setTweakInstruction('');
    } catch (e: any) {
      setError(e?.message || 'Tweak failed');
    } finally {
      setTweaking(false);
    }
  }

  async function createProject() {
    const r = await fetch('/api/explainer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.trim(),
        category,
        language,
        capEur,
        hardCapEur: capEur,
        autoApprove,
        targetSeconds,
        styleKitId,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.message || `create ${r.status}`);
    return j.projectId as string;
  }

  async function planOnly() {
    if (topic.trim().length < 4) { setError('Topic is too short'); return; }
    setLoading('plan'); setError('');
    try {
      const projectId = await createProject();
      const r = await fetch(`/api/projects/${projectId}/explainer/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category, language }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `plan ${r.status}`);
      }
      router.push(`/projects/${projectId}?tab=explainer`);
    } catch (e: any) {
      setError(e?.message || 'Plan failed');
    } finally {
      setLoading(null);
    }
  }

  async function produce() {
    if (topic.trim().length < 4) { setError('Topic is too short'); return; }
    setLoading('produce'); setError('');
    try {
      const projectId = await createProject();
      const r = await fetch('/api/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: topic.trim(),
          projectId,
          mode: 'narrated-explainer',
          language,
          aspect: '16:9',
          explainer: { category, language, capEur, hardCapEur: capEur, autoApprove: true, styleKitId, targetDuration: targetSeconds },
        }),
      });
      if (!r.ok && r.status !== 200) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `produce ${r.status}`);
      }
      router.push(`/projects/${projectId}?tab=explainer`);
    } catch (e: any) {
      setError(e?.message || 'Produce failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="cinema-page min-h-screen text-white px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ChalkboardTeacher size={28} className="text-[var(--cinema-amber)]" />
          <div>
            <div className="cinema-eyebrow">NARRATED EXPLAINER</div>
            <h1 className="cinema-headline text-2xl">{t.workshop.modeExplainer}</h1>
            <p className="cinema-subhead text-sm mt-1 opacity-80">{t.workshop.modeExplainerDesc}</p>
          </div>
        </div>

        <div className="cinema-card p-5 space-y-4">
          <label className="block">
            <span className="cinema-eyebrow">Topic</span>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="cinema-input w-full mt-1.5"
            />
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="block">
              <span className="cinema-eyebrow">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="cinema-input w-full mt-1.5">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="cinema-eyebrow">Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="cinema-input w-full mt-1.5">
                {listSupportedLanguages().map((l) => (
                  <option key={l.code} value={l.code}>{l.nativeName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="cinema-eyebrow">Length</span>
              <select value={targetSeconds} onChange={(e) => setTargetSeconds(Number(e.target.value))} className="cinema-input w-full mt-1.5">
                <option value={90}>90 seconds</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1200}>20 minutes</option>
              </select>
            </label>
            <label className="block">
              <span className="cinema-eyebrow">Style kit</span>
              <select value={styleKitId} onChange={(e) => setStyleKitId(e.target.value)} className="cinema-input w-full mt-1.5">
                {styleKits.length === 0 && <option value={styleKitId}>{styleKitId}</option>}
                {styleKits.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}{k.parentId ? ' (custom)' : ''}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="cinema-eyebrow">Episode cap (USD)</span>
              <input type="number" min={1} step={1} value={capUsd} onChange={(e) => setCapUsd(Math.max(1, Number(e.target.value) || DEFAULT_CAP_USD))} className="cinema-input w-full mt-1.5" />
              <span className="cinema-mono text-[10px] opacity-50 block mt-1">≈ €{capEur} hard cap / video</span>
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
              <span className="text-xs opacity-80">Skip script gate</span>
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
            <label className="block flex-1">
              <span className="cinema-eyebrow">Tweak style (natural language → saves a new preset)</span>
              <input
                type="text"
                value={tweakInstruction}
                onChange={(e) => setTweakInstruction(e.target.value)}
                placeholder="e.g. warmer palette, thicker outlines, night sky background"
                className="cinema-input w-full mt-1.5"
              />
            </label>
            <button onClick={applyTweak} disabled={tweaking || !tweakInstruction.trim()} className="cinema-btn-ghost inline-flex items-center gap-2 whitespace-nowrap">
              {tweaking ? <Loader2 size={14} className="animate-spin" /> : null}
              Save as new preset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={planOnly} disabled={!!loading} className="cinema-btn-ghost inline-flex items-center gap-2">
              {loading === 'plan' ? <Loader2 size={14} className="animate-spin" /> : null}
              Plan beats
            </button>
            <button onClick={produce} disabled={!!loading} className="cinema-btn-primary inline-flex items-center gap-2">
              {loading === 'produce' ? <Loader2 size={14} className="animate-spin" /> : <Lightning size={14} />}
              Produce
            </button>
            <button onClick={() => setTopic(MOON)} className="cinema-btn-ghost text-xs">Moon POC</button>
          </div>
          {error && <div className="flex items-center gap-2 text-[var(--cinema-red)] text-xs"><AlertCircle size={14} />{error}</div>}
        </div>

        {episodes && episodes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film size={16} className="text-[var(--cinema-amber)]" />
                <span className="cinema-eyebrow">Your episodes</span>
                <span className="cinema-mono text-[10px] opacity-50">{episodes.length}</span>
              </div>
              <Link href="/dashboard/projects" className="cinema-btn-ghost text-xs inline-flex items-center gap-1">
                All projects <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {episodes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}?tab=explainer`)}
                  className="cinema-card w-full text-left p-3 flex items-center justify-between gap-3 hover:border-[var(--cinema-amber)] transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="cinema-headline text-sm truncate group-hover:text-[var(--cinema-amber)] transition-colors">
                      {p.title || 'Untitled episode'}
                    </div>
                    {p.description && (
                      <div className="cinema-subhead text-xs opacity-60 truncate mt-0.5">{p.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="cinema-mono text-[10px] opacity-50 uppercase">{p.status}</span>
                    <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:text-[var(--cinema-amber)] transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

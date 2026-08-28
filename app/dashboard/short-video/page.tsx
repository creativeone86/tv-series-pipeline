'use client';

/**
 * Storyboard Desk · 15s CineSpark (v7.6) — CineSpark 15s counterpart
 *
 * Short-video cockpit: one idea → three-act (HOOK/BODY/CLIMAX) structured plan.
 *   - Left: 15s camera-move vocab (hook / body / climax) — click to swap a shot's move
 *   - Mid: three-act color timeline + shot table (tc / size / move / frame / AI prompt)
 *   - Right: short-video params (motion / look / output) + one-click generate
 *   - Bottom: total duration + rhythm bars + export
 *
 * Structure / duration / camera are owned by lib/short-video (testable); LLM only
 * writes frame content + AI prompt. Changing move/size recompiles that shot's
 * prompt on the client (compileShotToVideoPrompt) — structured-control feel.
 */

import { useMemo, useState } from 'react';
import { getSystemLanguage } from '@/lib/system-language';
import { useRouter } from 'next/navigation';
import { Lightning as Zap, FilmStrip as Film, FilmSlate as Clapperboard, Flame, Sparkle as Sparkles, Copy, Check, Download, CircleNotch as Loader2, WarningCircle as AlertCircle, MagicWand as Wand2, Eye, Gauge, Image as ImageUp, ShareNetwork as Share2, ArrowRight } from '@phosphor-icons/react';
import {
  RHYTHM_TEMPLATES, SHORT_DURATIONS, CAMERA_MOVE_VOCAB, ACT_LABEL_ZH,
  SHOT_SIZE_LABEL_ZH, cameraMovesByPhase, getCameraMove, getRhythmTemplate,
  compileShotToVideoPrompt,
  type ShortVideoPlan, type ShortVideoShot, type ShortVideoParams,
  type ActPhase, type ShotSize, type CameraSpeed, type UpscaleFactor,
} from '@/lib/short-video';
import { useLocale } from '@/hooks/use-locale';

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

// v12.x restyle: three-act colors from gold/orange/yellow (cheap/AI) to restrained blue / mid-grey / dark red (Frame.io/Runway).
const PHASE_COLOR: Record<ActPhase, string> = { hook: '#3B82F6', body: '#52525B', climax: '#B91C1C' };
const PHASE_TAG: Record<ActPhase, string> = { hook: 'HOOK', body: 'BODY', climax: 'CLIMAX' };
const SHOT_SIZES: ShotSize[] = ['ELS', 'WS', 'LS', 'MS', 'CU'];
const ACT_LABEL_EN: Record<ActPhase, string> = { hook: 'Hook', body: 'Core', climax: 'Climax' };

export default function ShortVideoStudioPage() {
  const { locale, t: loc } = useLocale();
  const t = loc as DashT;
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [durationS, setDurationS] = useState<number>(15);
  const [rhythmId, setRhythmId] = useState<string>('suspense');
  const [style, setStyle] = useState('');
  const [language, setLanguage] = useState<string>(() => getSystemLanguage()); // v12.165 production language (inherit system)
  const [plan, setPlan] = useState<ShortVideoPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<number, { loading?: boolean; url?: string; err?: string }>>({});

  const rhythm = getRhythmTemplate(rhythmId);
  const isEn = locale === 'en';
  const actLabel = (phase: ActPhase) => (isEn ? ACT_LABEL_EN[phase] : ACT_LABEL_ZH[phase]);
  const shotSizeLabel = (sz: ShotSize) => (isEn ? sz : SHOT_SIZE_LABEL_ZH[sz]);
  const moveLabel = (m: { label: string; labelZh: string }) => (isEn ? m.label : m.labelZh);
  const rhythmName = (r: { label: string; en: string }) => (isEn ? r.en : r.label);

  async function generate() {
    if (idea.trim().length < 5) { setError(t.dashPages.svIdeaMin); return; }
    setLoading(true); setError(''); setPreviews({});
    try {
      const r = await fetch('/api/short-video/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: language !== 'auto' ? language : undefined, idea: idea.trim(), durationS, rhythmId, style: style.trim() }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j?.error || t.dashPages.generateFailedStatus.replace('{status}', String(r.status))); setPlan(null); }
      else setPlan(j.plan);
    } catch (e: any) {
      setError(e?.message || t.dashPages.networkError);
    } finally { setLoading(false); }
  }

  // Change a shot's move / size → recompile that shot's AI prompt immediately
  function patchShot(index: number, patch: Partial<Pick<ShortVideoShot, 'cameraMoveId' | 'shotSize'>>) {
    setPlan((prev) => {
      if (!prev) return prev;
      const shots = prev.shots.map((s) => {
        if (s.index !== index) return s;
        const next = { ...s, ...patch };
        const move = getCameraMove(next.cameraMoveId);
        return {
          ...next,
          cameraMoveLabel: move ? moveLabel(move) : next.cameraMoveLabel,
          cameraType: move?.cameraType ?? next.cameraType,
          motion: move?.motion ?? next.motion,
          aiPrompt: compileShotToVideoPrompt({
            frameContent: s.frameContent,
            shotSize: next.shotSize,
            cameraMove: move,
            style: prev.style,
            cameraSpeed: prev.params.cameraSpeed,
          }),
        };
      });
      return { ...prev, shots };
    });
  }

  function patchParams(patch: Partial<ShortVideoParams>) {
    setPlan((prev) => (prev ? { ...prev, params: { ...prev.params, ...patch } } : prev));
  }

  function copyPrompt(shot: ShortVideoShot) {
    navigator.clipboard?.writeText(shot.aiPrompt).then(() => {
      setCopied(shot.index); setTimeout(() => setCopied(null), 1500);
    });
  }

  async function previewShot(shot: ShortVideoShot) {
    setPreviews((p) => ({ ...p, [shot.index]: { loading: true } }));
    try {
      const r = await fetch('/api/preview-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: `${shot.frameContent}. ${shot.aiPrompt}`.slice(0, 1000),
          style: plan?.style || 'cinematic',
          aspect: plan?.params.aspectRatio || '9:16',
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.imageUrl) setPreviews((p) => ({ ...p, [shot.index]: { err: j?.error || t.dashPages.previewFailed } }));
      else setPreviews((p) => ({ ...p, [shot.index]: { url: j.imageUrl } }));
    } catch (e: any) {
      setPreviews((p) => ({ ...p, [shot.index]: { err: e?.message || t.dashPages.networkError } }));
    }
  }

  function exportMarkdown() {
    if (!plan) return;
    const rt = getRhythmTemplate(plan.rhythmTemplateId);
    const md = [
      `# ${plan.title}`,
      `> ${t.dashPages.svMdMeta.replace('{idea}', plan.idea).replace('{dur}', String(plan.durationS)).replace('{rhythm}', rhythmName(rt))}`,
      '',
      ...plan.shots.map((s) =>
        `## ${PHASE_TAG[s.phase]} ${String(s.index).padStart(2, '0')} (${s.timeStartS}s–${s.timeEndS}s)\n` +
        `- ${t.dashPages.svMdShot.replace('{size}', shotSizeLabel(s.shotSize)).replace('{move}', s.cameraMoveLabel).replace('{motion}', String(s.motion))}\n` +
        `- ${t.dashPages.svMdFrame.replace('{frame}', s.frameContent)}\n- AI Prompt:\n\n\`\`\`\n${s.aiPrompt}\n\`\`\`\n`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${plan.title || 'shortvideo'}-storyboard.md`;
    a.click();
  }

  function sendToCreate() {
    if (!plan) return;
    const seed = `${plan.idea}\n\n${t.dashPages.svSeedHead}\n` +
      plan.shots.map((s) => `${PHASE_TAG[s.phase]} ${s.frameContent}${t.dashPages.svSeedMove.replace('{move}', s.cameraMoveLabel)}`).join('\n');
    try { sessionStorage.setItem('qfmj-create-seed', seed); } catch { /* ignore */ }
    router.push('/dashboard/create');
  }

  return (
    <div className="cinema-page min-h-screen px-5 py-5 max-w-[1680px] mx-auto">
      {/* Top: brand + idea + duration + rhythm */}
      <header className="cinema-card-hi !p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-md grid place-items-center bg-zinc-800 border border-zinc-700">
              <Zap size={17} weight="fill" className="text-blue-400" />
            </div>
            <div>
              <div className="cinema-headline !text-lg leading-none">{t.dashPages.svTitle} <span className="cinema-mono text-blue-400">15s</span></div>
              <div className="cinema-eyebrow !mt-0.5">{t.dashPages.svEyebrow}</div>
            </div>
          </div>

          <div className="flex-1 min-w-[280px]">
            <input
              className="cinema-input w-full"
              placeholder={t.dashPages.svIdeaPh}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) generate(); }}
            />
          </div>

          {/* Duration lock */}
          <div className="shrink-0">
            <div className="cinema-eyebrow mb-1">{t.dashPages.svDurationLock}</div>
            <div className="flex gap-1">
              {SHORT_DURATIONS.map((d) => (
                <button key={d} onClick={() => setDurationS(d)}
                  className={`cinema-mono text-xs px-2.5 py-1.5 rounded-md border transition ${durationS === d ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)] hover:border-[var(--cinema-border-hi)]'}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rhythm + style + generate */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {RHYTHM_TEMPLATES.map((tmpl) => {
            const active = rhythmId === tmpl.id;
            const Icon = tmpl.id === 'suspense' ? Flame : tmpl.id === 'blockbuster' ? Film : Sparkles;
            return (
              <button key={tmpl.id} onClick={() => setRhythmId(tmpl.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition ${active ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--cinema-border)] hover:border-[var(--cinema-border-hi)]'}`}>
                <Icon size={15} className={active ? 'text-blue-400' : 'text-[var(--cinema-text-3)]'} />
                <span className="leading-tight">
                  <span className="block text-xs font-medium">{rhythmName(tmpl)}</span>
                  <span className="block cinema-mono text-[10px] opacity-60">{isEn ? (t.dashPages[`svRhythmDesc_${tmpl.id}`] || tmpl.desc) : tmpl.desc}</span>
                </span>
              </button>
            );
          })}
          <input className="cinema-input !py-1.5 !text-xs w-40" placeholder={t.dashPages.svStylePh} value={style} onChange={(e) => setStyle(e.target.value)} />
          {/* v12.165: production language (dialogue/titles; default inherits system) */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title={t.dashPages.svLangTitle}
            className="cinema-input !py-1.5 !text-xs w-28"
            data-testid="sv-language"
          >
            <option value="auto">{t.dashPages.svLangAuto}</option>
            {['zh', 'en', 'ja', 'ko', 'ru', 'es', 'fr', 'de', 'pt'].map((c) => (
              <option key={c} value={c}>{c === 'zh' ? t.dashPages.langZh : c === 'en' ? 'English' : c === 'ja' ? t.dashPages.langJa : c === 'ko' ? '한국어' : c === 'ru' ? 'Русский' : c.toUpperCase()}</option>
            ))}
          </select>
          <button onClick={generate} disabled={loading} className="ml-auto inline-flex items-center justify-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-medium text-sm rounded-sm px-5 py-2 transition disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {loading ? t.dashPages.svGenerating : t.dashPages.svGenerate}
          </button>
        </div>
        {error && <div className="mt-2 flex items-center gap-1.5 text-[var(--secondary)] text-xs"><AlertCircle size={13} />{error}</div>}
      </header>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_270px] gap-4">
        {/* Left: camera-move vocab */}
        <aside className="cinema-card !p-3 h-fit">
          <div className="cinema-eyebrow mb-2">{t.dashPages.svVocab}</div>
          {(['hook', 'body', 'climax'] as ActPhase[]).map((phase, gi) => (
            <div key={phase} className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: PHASE_COLOR[phase] }} />
                <span className="text-[11px] font-medium">{gi + 1}. {actLabel(phase)}</span>
              </div>
              <div className="flex flex-col gap-1">
                {cameraMovesByPhase(phase).map((m) => {
                  const usedBy = plan?.shots.find((s) => s.cameraMoveId === m.id);
                  return (
                    <button key={m.id}
                      onClick={() => { const tgt = plan?.shots.find((s) => s.phase === phase); if (tgt) patchShot(tgt.index, { cameraMoveId: m.id }); }}
                      disabled={!plan}
                      title={plan ? t.dashPages.svApplyMove.replace('{phase}', PHASE_TAG[phase]) : t.dashPages.svNeedPlan}
                      className={`text-left px-2 py-1 rounded-md border text-[11px] transition disabled:opacity-40 ${usedBy ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--cinema-border)] hover:border-[var(--cinema-border-hi)]'}`}>
                      <span className="block leading-tight">{moveLabel(m)}</span>
                      <span className="block cinema-mono text-[9px] opacity-50">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Mid: three-act timeline + shot table */}
        <main className="min-w-0">
          {!plan && !loading && (
            <div className="cinema-card grid place-items-center text-center py-20">
              <div>
                <Clapperboard size={40} className="mx-auto text-[var(--cinema-text-3)] mb-3" />
                <div className="cinema-subhead">{t.dashPages.svEmptyTitle}</div>
                <div className="cinema-mono text-[11px] opacity-50 mt-1">{t.dashPages.svEmptySub}</div>
              </div>
            </div>
          )}
          {loading && (
            <div className="cinema-card grid place-items-center py-20">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
          )}

          {plan && (
            <>
              {/* Three-act timeline */}
              <div className="cinema-card !p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="cinema-eyebrow">{t.dashPages.svTimeline.replace('{n}', String(plan.durationS))}</span>
                  <span className="cinema-mono text-[11px] text-blue-400">{plan.title}</span>
                </div>
                <div className="flex gap-px h-7 rounded-sm overflow-hidden">
                  {plan.acts.map((a) => (
                    <div key={a.phase} className="grid place-items-center" style={{ width: `${a.pct}%`, background: PHASE_COLOR[a.phase] }}>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/90">{PHASE_TAG[a.phase]} · {a.startS}–{a.endS}s</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shot table — v8.3 P3: stagger in */}
              <div className="flex flex-col gap-3 stagger">
                {plan.shots.map((s) => {
                  const pv = previews[s.index];
                  return (
                    <div key={s.index} className="cinema-card !p-3">
                      <div className="grid grid-cols-[44px_1fr] gap-3">
                        {/* Shot no. + act color */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="cinema-mono text-lg font-medium">{String(s.index).padStart(2, '0')}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm text-white/90" style={{ background: PHASE_COLOR[s.phase] }}>{PHASE_TAG[s.phase]}</span>
                          <span className="cinema-mono text-[9px] opacity-60">{s.timeStartS}–{s.timeEndS}s</span>
                        </div>

                        <div className="min-w-0">
                          {/* Row 1: size + move + Motion */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                              {SHOT_SIZES.map((sz) => (
                                <button key={sz} onClick={() => patchShot(s.index, { shotSize: sz })}
                                  className={`cinema-mono text-[10px] px-1.5 py-0.5 rounded border transition ${s.shotSize === sz ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)] hover:border-[var(--cinema-border-hi)]'}`}
                                  title={shotSizeLabel(sz)}>{sz}</button>
                              ))}
                            </div>
                            <select value={s.cameraMoveId} onChange={(e) => patchShot(s.index, { cameraMoveId: e.target.value })}
                              className="cinema-input !py-1 !text-[11px] !w-auto">
                              {cameraMovesByPhase(s.phase).map((m) => <option key={m.id} value={m.id}>{moveLabel(m)} · {m.label}</option>)}
                            </select>
                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded-sm px-1.5 py-0.5">Motion {s.motion}</span>
                            <span className="cinema-chip !text-[10px]">Camera: {s.cameraType}</span>
                          </div>

                          {/* Row 2: frame content */}
                          <p className="text-xs text-[var(--text)] mb-2 leading-relaxed">{s.frameContent}</p>

                          {/* Row 3: AI prompt (collapsed) + preview */}
                          <div className="flex gap-2">
                            <details className="flex-1 min-w-0">
                              <summary className="cursor-pointer select-none text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 py-0.5">{t.dashPages.svExpandPrompt}</summary>
                              <code className="mt-1.5 block cinema-mono text-[10px] leading-relaxed text-zinc-400 bg-[var(--cinema-surface)] rounded-sm p-2 max-h-40 overflow-auto custom-scrollbar">{s.aiPrompt}</code>
                            </details>
                            {pv?.url && <img loading="lazy" decoding="async" src={pv.url} alt="" className="w-16 h-28 object-cover rounded-sm border border-zinc-700" />}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => previewShot(s)} disabled={pv?.loading} className="cinema-btn-ghost !text-[11px] !py-1">
                              {pv?.loading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} {t.dashPages.svPreview}
                            </button>
                            <button onClick={() => copyPrompt(s)} className="cinema-btn-ghost !text-[11px] !py-1">
                              {copied === s.index ? <Check size={12} className="text-[var(--cinema-green)]" /> : <Copy size={12} />} {t.dashPages.svCopyPrompt}
                            </button>
                            {pv?.err && <span className="text-[10px] text-[var(--secondary)]">{pv.err}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* Right: short-video params */}
        <aside className="cinema-card !p-3 h-fit">
          <div className="cinema-eyebrow mb-3 flex items-center gap-1.5"><Gauge size={13} /> {t.dashPages.svParams}</div>
          {!plan && <div className="cinema-mono text-[11px] opacity-50">{t.dashPages.svParamsLocked}</div>}
          {plan && (
            <div className="flex flex-col gap-4">
              {/* Motion */}
              <div>
                <div className="text-[11px] font-medium mb-1.5">{t.dashPages.svMotion}</div>
                <label className="cinema-mono text-[10px] opacity-60 flex justify-between">Motion Intensity <span className="text-blue-400">{plan.params.motionIntensity}%</span></label>
                <input type="range" min={0} max={100} value={plan.params.motionIntensity}
                  onChange={(e) => patchParams({ motionIntensity: Number(e.target.value) })} className="w-full accent-blue-500" />
                <div className="flex gap-1 mt-1.5">
                  {(['slow', 'normal', 'fast'] as CameraSpeed[]).map((sp) => (
                    <button key={sp} onClick={() => patchParams({ cameraSpeed: sp })}
                      className={`flex-1 text-[10px] py-1 rounded border transition ${plan.params.cameraSpeed === sp ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)]'}`}>
                      {sp === 'slow' ? t.dashPages.speedSlow : sp === 'normal' ? t.dashPages.speedNormal : t.dashPages.speedFast}
                    </button>
                  ))}
                </div>
              </div>

              {/* Look enhance */}
              <div>
                <div className="text-[11px] font-medium mb-1.5">{t.dashPages.svLook}</div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="cinema-mono text-[10px] opacity-60">{t.dashPages.svInterp} Interpolation</span>
                  <button onClick={() => patchParams({ interpolation: !plan.params.interpolation })}
                    className={`cinema-mono text-[10px] px-2 py-0.5 rounded border ${plan.params.interpolation ? 'border-[var(--cinema-green)] text-[var(--cinema-green)]' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)]'}`}>
                    {plan.params.interpolation ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="cinema-mono text-[10px] opacity-60">{t.dashPages.svUpscale}</span>
                  <div className="flex gap-1">
                    {([1, 2, 4] as UpscaleFactor[]).map((u) => (
                      <button key={u} onClick={() => patchParams({ upscale: u })}
                        className={`cinema-mono text-[10px] px-2 py-0.5 rounded border ${plan.params.upscale === u ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-[var(--cinema-border)] text-[var(--cinema-text-3)]'}`}>{u}x</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="text-[11px] font-medium mb-1.5">{t.dashPages.svOutput}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={plan.params.resolution} onChange={(e) => patchParams({ resolution: e.target.value })} className="cinema-input !py-1 !text-[11px]">
                    {['1080P', '4K', '8K'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={plan.params.aspectRatio} onChange={(e) => patchParams({ aspectRatio: e.target.value as any })} className="cinema-input !py-1 !text-[11px]">
                    {['9:16', '16:9', '1:1', '2.39:1'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={plan.params.fps} onChange={(e) => patchParams({ fps: Number(e.target.value) })} className="cinema-input !py-1 !text-[11px] col-span-2">
                    {[24, 30, 60].map((f) => <option key={f} value={f}>{f} fps</option>)}
                  </select>
                </div>
              </div>

              {/* Rhythm mix — thin bar + numbers (replaces donut) */}
              <div>
                <div className="text-[11px] font-medium mb-2 text-zinc-400">{t.dashPages.svRhythmMix}</div>
                <div className="flex h-1.5 rounded-sm overflow-hidden mb-2">
                  {plan.acts.map((a) => (
                    <div key={a.phase} style={{ width: `${a.pct}%`, background: PHASE_COLOR[a.phase] }} />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {plan.acts.map((a) => (
                    <div key={a.phase} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-sm" style={{ background: PHASE_COLOR[a.phase] }} />
                        {PHASE_TAG[a.phase]}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={sendToCreate} className="w-full inline-flex items-center justify-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-medium text-sm rounded-sm py-2.5 transition">
                <Sparkles size={15} /> {t.dashPages.svSendCreate} <ArrowRight size={14} />
              </button>
              <div className="flex gap-1.5">
                <button onClick={exportMarkdown} className="cinema-btn-ghost flex-1 justify-center !text-[11px]"><Download size={12} /> {t.dashPages.svExport}</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Status bar */}
      {plan && (
        <div className="cinema-statusbar mt-4 flex-wrap">
          <span className="cinema-statusbar-item"><span className="cinema-statusbar-dot" /> {t.dashPages.svTotalDur.replace('{n}', String(plan.durationS))}</span>
          <span className="cinema-statusbar-item">{t.dashPages.svShotCount.replace('{n}', String(plan.shots.length))}</span>
          <span className="cinema-statusbar-item">{plan.params.resolution} · {plan.params.aspectRatio} · {plan.params.fps}fps</span>
          <span className="cinema-statusbar-item">{t.dashPages.svRhythmStat.replace('{label}', rhythmName(getRhythmTemplate(plan.rhythmTemplateId)))}</span>
          <span className="cinema-statusbar-item ml-auto cinema-mono opacity-60">CineSpark v7.6</span>
        </div>
      )}
    </div>
  );
}

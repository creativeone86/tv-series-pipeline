'use client';

/**
 * v6.4 — Director Console. v12.44 dashboard: top KPI (progress / boards / clips / film)
 * + next-step badge + cinema-meter + 4-stage pipeline (script → assets → boards → film)
 * (status / edit / rerun downstream). Logic in lib/pipeline-stages; full cinema system.
 */

import { useState } from 'react';
import {
  FileText, Users, FilmSlate as Clapperboard, FilmStrip as Film, Pencil,
  ArrowsClockwise as RefreshCw, Warning as AlertTriangle, CaretRight as ChevronRight,
  CheckCircle as CheckCircle2, CircleNotch as Loader2, Lightning,
} from '@phosphor-icons/react';
import {
  derivePipelineStages, downstreamStages, pipelineProgress,
  type StageAsset, type StageId, type StageStatus,
} from '@/lib/pipeline-stages';
import { healthTone } from '@/lib/quality-report';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

const STAGE_ICON: Record<StageId, typeof FileText> = {
  script: FileText, assets: Users, storyboard: Clapperboard, final: Film,
};
const STATUS_CHIP: Record<StageStatus, string> = {
  empty: 'cinema-chip',
  ready: 'cinema-chip cinema-chip-green',
  stale: 'cinema-chip cinema-chip-amber',
};

function stageLabel(id: StageId, t: Translations): string {
  return {
    script: t.product.tabScript,
    assets: t.sharedUi.stageAssets,
    storyboard: t.product.storyboard,
    final: t.sharedUi.stageFinal,
  }[id] ?? id;
}

function stageDesc(id: StageId, t: Translations): string {
  return {
    script: t.sharedUi.stageScriptDesc,
    assets: t.sharedUi.stageAssetsDesc,
    storyboard: t.sharedUi.stageBoardDesc,
    final: t.sharedUi.stageFinalDesc,
  }[id] ?? '';
}

export function DirectorConsole({
  assets,
  onEditStage,
  projectId,
  onReran,
}: {
  assets: StageAsset[];
  onEditStage: (tab: string) => void;
  /** v6.4.1: when set, Rerun hits /api/projects/[id]/rerun */
  projectId?: string;
  /** v6.4.1: callback after a rerun is persisted (refresh project data) */
  onReran?: () => void;
}) {
  const { t } = useLocale();
  const stages = derivePipelineStages(assets);
  const prog = pipelineProgress(stages);
  const [impact, setImpact] = useState<StageId | null>(null);
  const [rerunning, setRerunning] = useState<StageId | null>(null);
  const [rerunMsg, setRerunMsg] = useState('');
  // v12.100: one-click ad workshop (hook ammo → variants + dual card → copy → pack)
  const [workshopBusy, setWorkshopBusy] = useState(false);
  const [workshopMsg, setWorkshopMsg] = useState('');
  // v12.116: structured workshop result (clickable variants / health / title), not just one line
  const [workshopResult, setWorkshopResult] = useState<{
    finalVideoUrl?: string | null;
    variants: Array<{ variant: number; hookTitle?: string; url: string | null; chosen?: boolean }>;
    title?: string;
    healthScore?: number | null;
  } | null>(null);

  // v12.44: derive KPI overview from assets by type
  const cnt = (typ: string) => (assets as Array<{ type?: string }>).filter((a) => a?.type === typ).length;
  const kpis: Array<{ label: string; value: string; sub: string; color?: string; tip?: string }> = [
    { label: 'PROGRESS', value: `${prog.pct}%`, sub: t.sharedUi.stagesDone.replace('{n}', String(prog.produced)).replace('{total}', String(prog.total)) },
    { label: 'SHOTS', value: String(cnt('storyboard')), sub: t.product.storyboard },
    { label: 'CLIPS', value: String(cnt('video')), sub: t.sharedUi.shotVideos },
    { label: 'FILM', value: cnt('final_video') > 0 ? '✓' : '—', sub: t.sharedUi.stageFinal },
  ];
  // v12.115: QC health KPI when a quality_report asset exists — hover for a one-line summary
  const qr = (assets as Array<{ type?: string; data?: { healthScore?: number; summary?: string } }>).find((a) => a?.type === 'quality_report');
  const health = typeof qr?.data?.healthScore === 'number' ? qr.data.healthScore : null;
  if (health !== null) {
    kpis.push({ label: 'HEALTH', value: String(health), sub: t.sharedUi.qcHealth, color: healthTone(health).color, tip: qr?.data?.summary });
  }
  const nextStage = stages.find((s) => s.status === 'empty') || stages.find((s) => s.status === 'stale');
  const nextHint = nextStage
    ? (nextStage.status === 'empty' ? t.sharedUi.nextGen.replace('{name}', stageLabel(nextStage.id, t)) : t.sharedUi.suggestRegen.replace('{name}', stageLabel(nextStage.id, t)))
    : t.sharedUi.pipelineReady;

  // v12.199: pick a winning variant — POST ab-variant/choose, then mark chosen locally and refresh the main film
  const [choosingVariant, setChoosingVariant] = useState<number | null>(null);
  const chooseVariant = async (variant: number) => {
    if (!projectId || choosingVariant !== null) return;
    setChoosingVariant(variant);
    try {
      const res = await fetch(`/api/projects/${projectId}/ab-variant/choose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || t.sharedUi.chooseFailed);
      setWorkshopResult((prev) => prev ? {
        ...prev,
        finalVideoUrl: d.finalVideoUrl || prev.finalVideoUrl,
        variants: prev.variants.map((v) => ({ ...v, chosen: v.variant === variant })),
      } : prev);
      setWorkshopMsg(t.sharedUi.variantChosen.replace('{n}', String(variant)));
      onReran?.();
    } catch (e: unknown) {
      setWorkshopMsg(e instanceof Error ? e.message : t.sharedUi.chooseFailed);
    } finally {
      setChoosingVariant(null);
    }
  };

  const doWorkshop = async () => {
    if (!projectId || workshopBusy) return;
    setWorkshopBusy(true); setWorkshopMsg(t.sharedUi.packingHint);
    try {
      const res = await fetch(`/api/projects/${projectId}/ad-workshop`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'douyin', aspect: '9:16' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || t.sharedUi.packFailed);
      const st = d.steps || {};
      setWorkshopMsg(
        t.sharedUi.packSummary.replace('{ok}', String(d.okSteps)).replace('{total}', String(d.totalSteps)) +
        `${st.hookIdeas?.ok ? ` Hook×${(st.hookIdeas.hooks || []).length}` : ' Hook✗'}` +
        `${st.recompose?.ok ? ` · ${t.sharedUi.variantUnit}×${(st.recompose.variants || []).length}` : ` · ${t.sharedUi.composeFail}`}` +
        `${st.publishCopy?.ok ? ` · ${t.sharedUi.copyOk}` : ` · ${t.sharedUi.copyFail}`}` +
        `${st.package?.ok ? ` · ${t.sharedUi.packOk}` : ` · ${t.sharedUi.packFail}`}`,
      );
      setWorkshopResult({
        finalVideoUrl: st.recompose?.finalVideoUrl || null,
        variants: Array.isArray(st.package?.abVariants) ? st.package.abVariants : [],
        title: st.publishCopy?.copy?.titles?.[0] || '',
        healthScore: st.package?.qualityHealthScore ?? null,
      });
      onReran?.();
    } catch (e: unknown) {
      setWorkshopMsg(e instanceof Error ? e.message : t.sharedUi.packFailed);
    } finally {
      setWorkshopBusy(false);
      setTimeout(() => setWorkshopMsg(''), 12000);
    }
  };

  const doRerun = async (sid: StageId) => {
    if (!projectId) return;
    setRerunning(sid); setRerunMsg('');
    try {
      const res = await fetch(`/api/projects/${projectId}/rerun`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: sid }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || t.sharedUi.rerunFailed);
      const n = d.plan?.invalidates?.length ?? 0;
      setRerunMsg(
        d.dispatched
          ? t.sharedUi.reranDispatched.replace('{name}', stageLabel(sid, t))
          : t.sharedUi.reranMarked.replace('{name}', stageLabel(sid, t)).replace('{extra}', n ? t.sharedUi.downstreamStale.replace('{n}', String(n)) : ''),
      );
      setImpact(null);
      onReran?.();
    } catch (e: unknown) {
      setRerunMsg(e instanceof Error ? e.message : t.sharedUi.rerunFailed);
    } finally {
      setRerunning(null);
      setTimeout(() => setRerunMsg(''), 4000);
    }
  };

  return (
    <div className="cinema-card-hi p-5">
      {/* header + next-step hint */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="cinema-headline text-base flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-[var(--cinema-amber)]" />{t.sharedUi.directorDesk}
          </h3>
          <p className="cinema-subhead text-xs opacity-65 mt-0.5">{t.sharedUi.directorDeskHint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {cnt('final_video') > 0 && projectId && (
            <button
              onClick={doWorkshop}
              disabled={workshopBusy}
              className="cinema-chip cinema-chip-amber hover:brightness-110 disabled:opacity-50 cursor-pointer"
              title={t.sharedUi.adWorkshopTitle}
            >
              🎁 {workshopBusy ? t.sharedUi.packing : t.sharedUi.adWorkshop}
            </button>
          )}
          <span className={`cinema-chip shrink-0 ${nextStage ? 'cinema-chip-amber' : 'cinema-chip-green'}`}>
            {nextStage ? <Lightning className="w-3 h-3" weight="fill" /> : <CheckCircle2 className="w-3 h-3" weight="fill" />}
            {nextHint}
          </span>
        </div>
      </div>

      {workshopMsg && (
        <div className="mb-3 text-xs cinema-subhead px-3 py-2 rounded-lg bg-white/5 border border-white/10">{workshopMsg}</div>
      )}

      {/* v12.116: workshop result — film/variants clickable, health tinted, preferred title */}
      {workshopResult && (
        <div className="mb-4 rounded-[3px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {workshopResult.finalVideoUrl && (
              <a href={workshopResult.finalVideoUrl} target="_blank" rel="noreferrer" className="cinema-chip cinema-chip-green hover:brightness-110">▶ {t.sharedUi.mainFilm}</a>
            )}
            {workshopResult.variants.filter((v) => v.url).map((v) => (
              <span key={v.variant} className="inline-flex items-center gap-0.5">
                <a href={v.url as string} target="_blank" rel="noreferrer"
                   className={`cinema-chip hover:brightness-110 ${v.chosen ? 'cinema-chip-amber' : ''}`}
                   title={v.hookTitle || ''}>
                  {v.chosen ? '★' : '▶'} {t.sharedUi.variantN.replace('{n}', String(v.variant))}{v.hookTitle ? ` · ${v.hookTitle.slice(0, 10)}` : ''}
                </a>
                {/* v12.199: pick as hero — ab-variant/choose had no UI before */}
                {!v.chosen && (
                  <button
                    onClick={() => chooseVariant(v.variant)}
                    disabled={choosingVariant !== null}
                    className="cinema-chip text-[10px] opacity-70 hover:opacity-100 disabled:opacity-30"
                    title={t.sharedUi.setAsHero}
                  >
                    {choosingVariant === v.variant ? '…' : t.sharedUi.pickAsHero}
                  </button>
                )}
              </span>
            ))}
            {typeof workshopResult.healthScore === 'number' && (
              <span className="cinema-mono text-[11px] tabular-nums" style={{ color: healthTone(workshopResult.healthScore).color }}>
                HEALTH {workshopResult.healthScore}
              </span>
            )}
          </div>
          {workshopResult.title && (
            <p className="cinema-mono text-[11px] opacity-70">{t.sharedUi.prefTitle}:{workshopResult.title}</p>
          )}
        </div>
      )}

      {/* KPI overview */}
      <div className={`grid grid-cols-2 ${kpis.length >= 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2 mb-4`}>
        {kpis.map((k) => (
          <div key={k.label} title={k.tip} className="rounded-[3px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] px-3 py-2.5">
            <div className="cinema-eyebrow !text-[8px] opacity-50">{k.label}</div>
            <div className="cinema-mono text-xl tabular-nums leading-tight mt-0.5" style={{ color: k.color || 'var(--cinema-amber)' }}>{k.value}</div>
            <div className="cinema-mono text-[9px] opacity-45">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className={`cinema-meter ${rerunMsg ? 'mb-2' : 'mb-5'}`}>
        <div className="cinema-meter-fill" style={{ width: `${prog.pct}%` }} />
      </div>
      {rerunMsg && <p className="cinema-mono text-[11px] text-[var(--cinema-amber)] mb-4">{rerunMsg}</p>}

      {/* Stage pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((s, i) => {
          const Icon = STAGE_ICON[s.id];
          const statusLabel = s.status === 'empty' ? t.sharedUi.statusEmpty : s.status === 'ready' ? t.sharedUi.statusReady : t.sharedUi.statusStale;
          const down = downstreamStages(s.id);
          return (
            <div key={s.id} className="relative cinema-card p-4 flex flex-col">
              {/* Connector arrow (lg+) */}
              {i < stages.length - 1 && (
                <ChevronRight className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cinema-text-3)] z-10" />
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-[3px] grid place-items-center ${s.status === 'empty' ? 'bg-[var(--cinema-surface-2)] text-[var(--cinema-text-3)]' : 'bg-[var(--cinema-amber)]/15 text-[var(--cinema-amber)]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="cinema-headline text-sm">{stageLabel(s.id, t)}</div>
                  <div className="cinema-mono text-[10px] opacity-50">{stageDesc(s.id, t)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`${STATUS_CHIP[s.status]} !text-[10px]`}>{statusLabel}</span>
                {s.count > 0 && <span className="cinema-mono text-[10px] opacity-50">{t.sharedUi.itemsN.replace('{n}', String(s.count))}</span>}
              </div>

              {s.status === 'stale' && (
                <p className="cinema-mono text-[10px] text-[var(--cinema-amber)] opacity-90 flex items-start gap-1 mb-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{t.sharedUi.upstreamStale}
                </p>
              )}

              <div className="mt-auto flex gap-1.5">
                <button onClick={() => onEditStage(s.editTab)} className="cinema-btn-ghost !text-[11px] !py-1.5 flex-1">
                  <Pencil className="w-3 h-3" />{s.status === 'empty' ? t.sharedUi.generate : t.common.edit}
                </button>
                {s.status !== 'empty' && (
                  <button
                    onClick={() => setImpact(impact === s.id ? null : s.id)}
                    title={t.sharedUi.rerunStage}
                    className={`cinema-btn-ghost !text-[11px] !py-1.5 ${impact === s.id ? '!text-[var(--cinema-amber)] !border-[var(--cinema-amber-deep)]' : ''}`}
                  >
                    <RefreshCw className="w-3 h-3" />{t.sharedUi.rerun}
                  </button>
                )}
              </div>

              {impact === s.id && s.status !== 'empty' && (
                <div className="mt-2 rounded-[3px] bg-[var(--cinema-amber)]/[0.06] border border-[var(--cinema-amber-deep)] p-2">
                  <p className="cinema-mono text-[10px] text-[var(--cinema-amber)] opacity-90 leading-relaxed">
                    {down.length > 0
                      ? <>{t.sharedUi.rerunDownstream.replace('{name}', stageLabel(s.id, t)).replace('{list}', down.map((id) => stageLabel(id, t)).join(' → '))}</>
                      : <>{t.sharedUi.rerunLast.replace('{name}', stageLabel(s.id, t))}</>}
                  </p>
                  {projectId && (
                    <button
                      onClick={() => doRerun(s.id)}
                      disabled={rerunning === s.id}
                      className="cinema-btn-primary !text-[10px] !py-1 mt-1.5 disabled:opacity-50"
                    >
                      {rerunning === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {t.sharedUi.confirmRerun}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

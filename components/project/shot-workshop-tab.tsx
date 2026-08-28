'use client';

/**
 * components/project/shot-workshop-tab (v2.16 P1.4)
 *
 * Project page "Shot workshop" tab — gathers v2.14 P0.3 (FLF) / P0.4 (duration routing) /
 * v2.16 P0.2 (4K export) / P1.3 (4K Kling Master re-render) per-shot actions
 * onto one surface instead of scattering them across the nav bar / videos tab / dashboard/create.
 *
 * Design:
 *   - List every shot in the project, one row + thumbnail + current quality badge
 *   - Inline action: "4K re-render" (v2.16 P1.3, plan-gate pro+)
 *   - Top-level: export resolution picker (reuses ExportResolutionDropdown)
 *   - Outbound links: /dashboard/u2v / /dashboard/u2v-flf for V2.14 single-shot tools
 */

import { useState } from 'react';
import { ArrowsClockwise as RefreshCw, CircleNotch as Loader2, Sparkle as Sparkles, ArrowSquareOut as ExternalLink, Lock, FilmStrip as Film, Pencil, SquaresFour as Grid } from '@phosphor-icons/react';
import { EmptyState } from '@/components/cinema/primitives';
import { ExportResolutionDropdown } from './export-resolution-dropdown';
import { StoryboardRegenModal } from './storyboard-regen-modal';
import { CandidateGridModal } from './candidate-grid-modal'; // v12.35.0 9-grid candidate frames
import { useLocale } from '@/hooks/use-locale';

interface Video {
  shotNumber: number;
  videoUrl?: string;
  imageUrl?: string;
  /** Metadata stuffed into the DB data field: quality / engine etc. */
  meta?: { quality?: string; engine?: string; [k: string]: any };
}

export interface ShotWorkshopTabProps {
  projectId: string;
  videos: Video[];
  storyboards: Array<{ shotNumber?: number; imageUrl?: string }>;
  /** User tier, used for a local 4K lock shortcut; real auth is decided by the route */
  userTier?: 'free' | 'creator' | 'pro' | 'enterprise';
  onShotRegenerated?: (shotNumber: number, newVideoUrl: string) => void;
}

export function ShotWorkshopTab({
  projectId,
  videos,
  storyboards,
  userTier,
  onShotRegenerated,
}: ShotWorkshopTabProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [busyShot, setBusyShot] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ shotNumber: number; pct: number; msg: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // local override of the url after 4K-regen so the UI updates before the parent refreshes
  const [localOverrides, setLocalOverrides] = useState<Record<number, { url: string; quality: string }>>({});
  // v2.23 P0.2: single-shot board regen — user edits the prompt then re-renders
  const [regenModalShot, setRegenModalShot] = useState<number | null>(null);
  const [gridModalShot, setGridModalShot] = useState<number | null>(null); // v12.35.0 9-grid candidate frames
  // Local board override (swap the thumb immediately after regen)
  const [sbOverrides, setSbOverrides] = useState<Record<number, string>>({});

  const canDo4K = !userTier || userTier === 'pro' || userTier === 'enterprise';

  const regenAt4K = async (shotNumber: number) => {
    if (busyShot !== null) return;
    if (!canDo4K) {
      window.location.href = '/dashboard/billing';
      return;
    }
    setBusyShot(shotNumber);
    setError(null);
    setProgress({ shotNumber, pct: 0, msg: pt.preparing });

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/regenerate-shot-4k`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotNumber, duration: 5 }),
      });
      if (res.status === 402) {
        setError(pt.needPro4k);
        window.location.href = '/dashboard/billing';
        return;
      }
      if (!res.ok && !res.body) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody.error || pt.requestFailed.replace('{status}', String(res.status)));
        return;
      }
      // SSE stream
      const reader = res.body?.getReader();
      if (!reader) {
        setError(pt.streamReadFailed);
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'progress') {
              setProgress({ shotNumber, pct: evt.data.progress || 0, msg: evt.data.status || pt.rendering });
            } else if (evt.type === 'completed') {
              setLocalOverrides((prev) => ({
                ...prev,
                [shotNumber]: { url: evt.data.videoUrl, quality: evt.data.quality || '4k' },
              }));
              onShotRegenerated?.(shotNumber, evt.data.videoUrl);
            } else if (evt.type === 'error') {
              setError(evt.data.error || pt.regen4kFailed);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : pt.regen4kFailed);
    } finally {
      setBusyShot(null);
      setProgress(null);
    }
  };

  // Sort by shotNumber; pair storyboard thumbs by shotNumber
  const sortedShots = [...videos].sort((a, b) => a.shotNumber - b.shotNumber);
  const sbByShot = new Map(storyboards.map((s) => [s.shotNumber, s.imageUrl]));
  const getShotImage = (shotNumber: number): string | undefined => {
    return sbOverrides[shotNumber] || sbByShot.get(shotNumber);
  };

  return (
    <div className="space-y-5">
      {/* Top: workshop intro + global export */}
      <div className="cinema-card-hi p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[var(--cinema-amber)]" />
            <h3 className="cinema-headline text-base">{t.product.tabWorkshop}</h3>
            <span className="cinema-mono text-[10px] opacity-50">SHOT WORKSHOP · v2.16</span>
          </div>
          <p className="cinema-subhead text-[12px] mt-1 opacity-75">
            {pt.workshopSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportResolutionDropdown projectId={projectId} userTier={userTier} />
          <a
            href="/dashboard/u2v"
            className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5"
            title={pt.u2vTitle}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {pt.u2vTool}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="cinema-card p-3 border-[var(--cinema-red)]/40">
          <span className="cinema-mono text-[11px] text-[var(--cinema-red)]">✗ {error}</span>
        </div>
      )}

      {/* per-shot list */}
      {sortedShots.length === 0 ? (
        <div className="cinema-card">
          <EmptyState icon={Film} title={pt.emptyShots} hint={pt.emptyShotsHint} />
        </div>
      ) : (
        <div className="space-y-2">
          {sortedShots.map((v) => {
            const overridden = localOverrides[v.shotNumber];
            const currentQuality = overridden?.quality || v.meta?.quality || 'standard';
            const isBusy = busyShot === v.shotNumber;
            const sbImg = getShotImage(v.shotNumber) || v.imageUrl;
            const sbRegenerated = !!sbOverrides[v.shotNumber];
            return (
              <div
                key={v.shotNumber}
                className="cinema-card-hi p-3 flex items-center gap-3"
              >
                {/* v12.41 square neutral frame + object-contain: any aspect (incl. 9:16) shows the full frame, no crop/distort */}
                <div className="w-14 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0 grid place-items-center">
                  {sbImg && /^https?:|^\/api\//i.test(sbImg) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img loading="lazy" decoding="async" src={sbImg} alt={`shot ${v.shotNumber}`} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="cinema-mono text-[10px] opacity-40">—</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="cinema-mono text-[11px] tracking-widest opacity-60">
                      SHOT {String(v.shotNumber).padStart(2, '0')}
                    </span>
                    {currentQuality === '4k' ? (
                      <span className="cinema-chip cinema-chip-amber !px-1.5 !py-0.5 !text-[9px]">4K</span>
                    ) : (
                      <span className="cinema-chip !px-1.5 !py-0.5 !text-[9px] opacity-70">{currentQuality}</span>
                    )}
                    {overridden && <span className="cinema-mono text-[9px] text-[var(--cinema-green)]">✓ {pt.regen4kDone}</span>}
                    {sbRegenerated && <span className="cinema-mono text-[9px] text-[var(--cinema-amber)] inline-flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />{pt.boardRegenDone}</span>}
                  </div>
                  {isBusy && progress && progress.shotNumber === v.shotNumber && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-[var(--cinema-surface-2)] rounded overflow-hidden">
                        <div
                          className="h-full bg-[var(--cinema-amber)] transition-[width]"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                      <span className="cinema-mono text-[10px] opacity-60 whitespace-nowrap">
                        {progress.pct}% · {progress.msg}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* v2.23 P0.2: edit prompt & regen the board */}
                  <button
                    onClick={() => setRegenModalShot(v.shotNumber)}
                    disabled={busyShot !== null}
                    title={pt.regenPromptTitle}
                    className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Pencil className="w-3 h-3" />
                    {pt.regenPrompt}
                  </button>
                  {/* v12.35.0: 9-grid candidates — N compositions per shot, pick the best as first frame */}
                  <button
                    onClick={() => setGridModalShot(v.shotNumber)}
                    disabled={busyShot !== null}
                    title={pt.gridTitle}
                    className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Grid className="w-3 h-3" />
                    {pt.gridPick}
                  </button>
                  <button
                    onClick={() => regenAt4K(v.shotNumber)}
                    disabled={isBusy || busyShot !== null}
                    title={canDo4K ? pt.klingTitle : pt.needProTitle}
                    className={`cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40 ${
                      canDo4K ? '' : 'opacity-60'
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : canDo4K ? (
                      <RefreshCw className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3 text-[var(--cinema-amber)]" />
                    )}
                    {pt.regen4k}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* v2.23 P0.2: edit-prompt regen modal */}
      {regenModalShot !== null && (
        <StoryboardRegenModal
          projectId={projectId}
          shotNumber={regenModalShot}
          currentImageUrl={getShotImage(regenModalShot)}
          currentPrompt={
            (videos.find((v) => v.shotNumber === regenModalShot)?.meta as any)?.prompt
            || (storyboards.find((sb) => sb.shotNumber === regenModalShot) as any)?.prompt
            || ''
          }
          onComplete={(newUrl) => {
            setSbOverrides((prev) => ({ ...prev, [regenModalShot]: newUrl }));
            setRegenModalShot(null);
          }}
          onCancel={() => setRegenModalShot(null)}
        />
      )}

      {/* v12.35.0: 9-grid candidate modal */}
      {gridModalShot !== null && (
        <CandidateGridModal
          projectId={projectId}
          shotNumber={gridModalShot}
          basePrompt={
            (videos.find((v) => v.shotNumber === gridModalShot)?.meta as any)?.prompt
            || (storyboards.find((sb) => sb.shotNumber === gridModalShot) as any)?.prompt
            || ''
          }
          onPick={(newUrl) => {
            setSbOverrides((prev) => ({ ...prev, [gridModalShot]: newUrl }));
            setGridModalShot(null);
          }}
          onCancel={() => setGridModalShot(null)}
        />
      )}

      <div className="cinema-mono text-[10px] opacity-50 leading-relaxed">
        {pt.workshopFooter1}
        <br />
        {pt.workshopFooter2}
      </div>
    </div>
  );
}

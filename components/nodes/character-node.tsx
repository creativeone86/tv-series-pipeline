'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/agents';
import { NodeShell } from './node-shell';
import { Users, CircleNotch as Loader2, CheckCircle as CheckCircle2, ArrowsClockwise as RefreshCw, Clock, Dna, Sparkle as Sparkles } from '@phosphor-icons/react';
import { ZoomableImage } from '@/components/ui/image-lightbox';
import { useProjectWorkspaceStore } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

function CharacterNodeComponent({ data }: NodeProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const d = data as unknown as PipelineNodeData;
  const characters = d.assets?.filter(a => a.type === 'character') || [];
  // v2.24 D: DNA re-extract state
  const [dnaBusy, setDnaBusy] = useState<string | null>(null);
  const [dnaLocal, setDnaLocal] = useState<Record<string, any>>({});
  const [dnaError, setDnaError] = useState<string | null>(null);
  // v12.10.0(#1): single character-image regen state
  const [regenBusy, setRegenBusy] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  const regenImage = async (charName: string, assetId: string, projectId: string) => {
    if (regenBusy) return;
    setRegenBusy(charName); setRegenError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/regenerate-asset-image`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'character', name: charName }),
      });
      const body = await res.json();
      if (!res.ok || !body.imageUrl) { setRegenError(body?.error || t.seriesDetail.resumeFailStatus.replace('{status}', String(res.status))); return; }
      useProjectWorkspaceStore.getState().updateAsset(assetId, { mediaUrls: [body.imageUrl] });
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : t.seriesDetail.requestFailed);
    } finally { setRegenBusy(null); }
  };

  const reExtractDna = async (charName: string, projectId: string) => {
    if (dnaBusy) return;
    setDnaBusy(charName);
    setDnaError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/extract-character-dna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: charName }),
      });
      const body = await res.json();
      if (!res.ok) {
        setDnaError(body?.error || t.seriesDetail.resumeFailStatus.replace('{status}', String(res.status)));
        return;
      }
      setDnaLocal((prev) => ({ ...prev, [charName]: body.dna }));
    } catch (e) {
      setDnaError(e instanceof Error ? e.message : t.seriesDetail.requestFailed);
    } finally {
      setDnaBusy(null);
    }
  };

  return (
    <NodeShell status={d.status} color="amber" className="min-w-[380px] max-w-[480px]" agentRole={d.agentRole}>
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-amber-500 !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 grid place-items-center">
          <Users className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            {t.product.characterDesign}
            {d.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" />}
            {d.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
            {d.status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
          </div>
          <div className="text-[11px] text-gray-400">{t.projectMisc.characterAssetsSub}</div>
        </div>
        {d.status === 'running' && <span className="text-[10px] text-green-400 font-medium">{d.progress}%</span>}
      </div>

      {characters.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {characters.map((c) => {
            // v2.23 P0.3 + v2.24 D: DNA hit rate (prefer local re-extract)
            const dnaSource = dnaLocal[c.name] || (c.data as any)?.dna;
            const dna = dnaSource;
            const dnaFilled = dna?.filledCount;
            const dnaTotal = dna?.totalCount;
            const dnaMissing: string[] = dna?.missing || [];
            const dnaStrong = dnaFilled != null && dnaTotal != null && dnaFilled >= dnaTotal * 0.75;
            const isReExtracting = dnaBusy === c.name;
            const projectId = c.projectId; // ProjectAsset includes projectId
            return (
            <div key={c.id} className="bg-black/30 border border-white/5 rounded-xl overflow-hidden group">
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                    {c.name}
                    {/* v2.23 P0.3 + v2.24 D: DNA coverage chip + re-extract */}
                    {dnaFilled != null && dnaTotal != null && (
                      <span
                        title={dnaMissing.length > 0
                          ? t.projectMisc.dnaPartial.replace('{filled}', String(dnaFilled)).replace('{total}', String(dnaTotal)).replace('{missing}', dnaMissing.join(', '))
                          : t.projectMisc.dnaComplete.replace('{n}', String(dnaTotal))}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] ${
                          dnaStrong
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        <Dna className="w-2.5 h-2.5" />
                        {dnaFilled}/{dnaTotal}
                      </span>
                    )}
                    {/* v2.24 D: re-extract DNA — hover only to save space */}
                    {projectId && !isReExtracting && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          reExtractDna(c.name, projectId);
                        }}
                        disabled={dnaBusy !== null}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-white/5 hover:bg-white/15 text-white/70 hover:text-white disabled:opacity-30"
                        title={t.projectMisc.reextractDnaTitle}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {t.projectMisc.reextract}
                      </button>
                    )}
                    {isReExtracting && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/60">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        {t.projectMisc.reextracting}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{c.data?.description || ''}</div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (projectId) regenImage(c.name, c.id, projectId); }}
                  disabled={regenBusy !== null || !projectId}
                  title={t.projectMisc.regenCharTitle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 flex-shrink-0 disabled:opacity-30">
                  {regenBusy === c.name ? <Loader2 className="w-3 h-3 text-amber-400 animate-spin" /> : <RefreshCw className="w-3 h-3 text-gray-400" />}
                </button>
              </div>
              {c.mediaUrls?.length > 0 && (
                <div className="px-1 pb-1">
                  <ZoomableImage
                    src={c.mediaUrls[0]}
                    alt={t.projectMisc.threeView.replace('{name}', c.name)}
                    title={t.projectMisc.threeViewTitle.replace('{name}', c.name)}
                    className="aspect-[16/9] rounded-lg overflow-hidden bg-white/5"
                  />
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-xs">
          {d.status === 'pending' ? t.projectMisc.waitWriter : d.status === 'running' ? t.projectMisc.designingCharacters : ''}
        </div>
      )}

      {d.status === 'running' && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${d.progress}%` }} />
          </div>
        </div>
      )}

      {/* v2.24 D: DNA re-extract error */}
      {dnaError && (
        <div className="mt-2 text-[10px] text-red-300/80 bg-red-900/20 border border-red-500/20 rounded px-2 py-1">
          {t.projectMisc.dnaFailedPrefix.replace('{error}', dnaError)}
        </div>
      )}
      {/* v12.10.0(#1): single-image regen error */}
      {regenError && (
        <div className="mt-2 text-[10px] text-red-300/80 bg-red-900/20 border border-red-500/20 rounded px-2 py-1">
          {t.projectMisc.regenFailedPrefix.replace('{error}', regenError)}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-amber-500 !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform" />
    </NodeShell>
  );
}

export const CharacterNode = memo(CharacterNodeComponent);

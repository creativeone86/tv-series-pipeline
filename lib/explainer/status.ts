import { listAssetsByType } from '@/lib/repos/asset-repo';
import { listCostLogByProject } from '@/lib/repos/cost-log-repo';
import { getReviewStatus } from '@/lib/review-status';
import { decideGovernor, estimatePreflight, reserveTtsEur, type PreflightReport } from './budget-governor';
import { readOutputConfig } from './pipeline';
import { scriptToBeats } from './beats';
import { listVocabulary } from './vocabulary-repo';
import type { ExplainerBeat, FrameResolution } from './types';
import type { ProjectOutputConfig, Script } from '@/types/agents';

export interface ExplainerProjectStatus {
  projectId: string;
  config: ProjectOutputConfig;
  review: Awaited<ReturnType<typeof getReviewStatus>>;
  script: Script | null;
  beats: ExplainerBeat[];
  frames: FrameResolution[];
  spentEur: number;
  reservedTtsEur: number;
  governor: {
    level: ReturnType<typeof decideGovernor>['level'];
    remainingImageEur: number;
    message: string;
    allowed: string[];
  };
  preflight: PreflightReport;
  vocabulary: Array<{ id: string; entityId: string; imageUrl: string; locked: boolean; version: number }>;
  finalVideoUrl?: string;
  sourcesBlock?: string;
  fontPreflight?: { ok: boolean; font: string | null; warning?: string };
  claims?: { verified: number; total: number };
}

export async function loadExplainerStatus(projectId: string, userId: string): Promise<ExplainerProjectStatus> {
  const cfg = await readOutputConfig(projectId);
  const expl = cfg.explainer || {};
  const script = await loadScript(projectId);
  const beats = script ? scriptToBeats(script) : [];
  const frames = await loadFrames(projectId);
  const costs = await listCostLogByProject(projectId);
  // r.costEur is the generic ledger column; for explainer projects these values are EUR.
  const spentEur = costs.reduce((s, r) => s + (Number(r.costEur) || 0), 0);
  const reservedTtsEur = reserveTtsEur(beats.map((b) => b.narrationText), expl.ttsProvider);
  const budget = {
    capEur: expl.capEur ?? 40,
    hardCapEur: expl.hardCapEur ?? expl.capEur ?? 40,
    spentEur,
    reservedTtsEur,
  };
  const vocab = await listVocabulary(userId);
  const seriesVocab = vocab.filter((v) => !expl.seriesId || v.vocabulary.seriesId === expl.seriesId);
  const governor = decideGovernor(budget);
  const preflight = estimatePreflight({
    beats,
    knownEntityIds: seriesVocab.map((v) => v.vocabulary.canonicalEntityId),
    budget,
    ttsTexts: beats.map((b) => b.narrationText),
    ttsProvider: expl.ttsProvider,
    frameSource: expl.frameSource,
  });
  const finals = await listAssetsByType(projectId, 'final_video');
  const finalVideoUrl = finals[0]?.persistent_url || (() => {
    try { return JSON.parse(finals[0]?.media_urls || '[]')[0]; } catch { return undefined; }
  })();
  return {
    projectId,
    config: cfg,
    review: await getReviewStatus(projectId),
    script,
    beats,
    frames,
    spentEur,
    reservedTtsEur,
    governor: {
      level: governor.level,
      remainingImageEur: governor.remainingImageEur,
      message: governor.message,
      allowed: [...governor.allowed],
    },
    preflight,
    vocabulary: seriesVocab.map((v) => ({
      id: v.id,
      entityId: v.vocabulary.canonicalEntityId,
      imageUrl: v.thumbnail,
      locked: v.vocabulary.locked,
      version: v.vocabulary.version,
    })),
    finalVideoUrl,
    sourcesBlock: (script as any)?.explainerPlan?.sourcesBlock,
    fontPreflight: (await import('./typography')).fontPreflight(),
    claims: {
      total: beats.flatMap((b) => b.claims || []).length,
      verified: beats.flatMap((b) => b.claims || []).filter((c) => c.status === 'VERIFIED').length,
    },
  };
}

async function loadScript(projectId: string): Promise<Script | null> {
  const rows = await listAssetsByType(projectId, 'script');
  const raw = rows[0]?.data;
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch { data = null; }
  }
  if (data && typeof data === 'object' && Array.isArray((data as Script).shots)) return data as Script;
  return null;
}

async function loadFrames(projectId: string): Promise<FrameResolution[]> {
  const rows = await listAssetsByType(projectId, 'storyboard');
  return rows.map((row) => {
    let data: any = row.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = {}; }
    }
    const url = row.persistent_url || (() => {
      try { return JSON.parse(row.media_urls || '[]')[0]; } catch { return undefined; }
    })();
    return {
      beatId: data?.beatId || `beat-${row.shot_number}`,
      frameIndex: data?.frameIndex || 0,
      strategy: data?.strategy || 'UNRESOLVED',
      imageUrl: url,
      provider: data?.provider,
      vocabularyIds: data?.vocabularyIds || [],
      costEur: Number(data?.costEur) || 0,
      blockedCostEur: data?.blockedCostEur,
      reason: data?.reason,
    } as FrameResolution;
  });
}

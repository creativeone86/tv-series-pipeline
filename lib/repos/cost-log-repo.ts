/**
 * v9.7.2 — cost_log 写入仓库(async,双驱动)。
 *
 * v9.3 的成本可观测一直只「读」cost_log,没有生产写入路径 → T3 成本面板实际常空。
 * 本 repo 是**首个生产写入器**:TTS 配音 / 口型渲染各记一笔,T3 `attributeCost` 自动归类显示。
 * engine 串带类目关键词(`tts-*` / `lipsync-*`)以命中 `classifyEngineCategory`。
 * 记账失败绝不阻断主流程(try/catch 吞错)。单测 tests/v9-7-2-cost-log-repo.test.ts。
 */
import { nanoid } from 'nanoid';
import { getDbDriver } from '../db-driver';

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export interface CostLogInput {
  /** 必填:FK users(无则跳过,不违反约束)。 */
  userId: string | null | undefined;
  projectId?: string | null;
  /** 供 classifyEngineCategory 归类(应含 tts/lip/video/image/llm 关键词)。 */
  engine: string;
  resolution?: string;
  durationSec?: number;
  costEur: number;
  metadata?: Record<string, unknown>;
}

/** 记一笔成本。userId 缺失 / 负成本 / 异常 → 返回 false 且不抛(成本记账不阻断主流程)。 */
export async function recordCostLog(input: CostLogInput): Promise<boolean> {
  if (!input.userId) return false;
  const cost = round2(input.costEur);
  if (!(cost >= 0)) return false;
  try {
    await getDbDriver().run(
      `INSERT INTO cost_log (id, user_id, project_id, engine, resolution, duration_sec, cost_eur, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'cl_' + nanoid(12), input.userId, input.projectId ?? null,
        (input.engine || 'unknown').slice(0, 80), input.resolution ?? '',
        Number(input.durationSec) || 0, cost,
        JSON.stringify(input.metadata ?? {}), new Date().toISOString(),
      ],
    );
    return true;
  } catch {
    return false;
  }
}

/** v12.37.0(决策日志):按项目读 cost_log(只读,双驱动)。 */
export interface CostLogRow {
  id: string; engine: string; resolution: string;
  durationSec: number; costEur: number;
  metadata: Record<string, unknown>; createdAt: string;
}
export async function listCostLogByProject(projectId: string): Promise<CostLogRow[]> {
  if (!projectId) return [];
  try {
    const rows = await getDbDriver().query(
      `SELECT id, engine, resolution, duration_sec, cost_eur, metadata, created_at
       FROM cost_log WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId],
    ) as Array<Record<string, unknown>>;
    return (rows || []).map((r) => ({
      id: String(r.id || ''),
      engine: String(r.engine || ''),
      resolution: String(r.resolution || ''),
      durationSec: Number(r.duration_sec) || 0,
      costEur: Number(r.cost_eur) || 0,
      metadata: (() => { try { return typeof r.metadata === 'string' ? JSON.parse(r.metadata as string) : ((r.metadata as Record<string, unknown>) || {}); } catch { return {}; } })(),
      createdAt: String(r.created_at || ''),
    }));
  } catch { return []; }
}

/** TTS 成本估算(€):有时长按 ~€0.0026/s,否则兜底按字 ~€0.0005/字。 */
export function estimateTtsCostEur(durationSec?: number, textLen?: number): number {
  const sec = Number(durationSec) || 0;
  if (sec > 0) return round2(sec * 0.0026);
  return round2((Number(textLen) || 0) * 0.0005);
}

/** 口型渲染成本估算(€):引擎给了用引擎值,否则 ~€0.0192/s、最低 €0.0128。 */
export function estimateLipsyncCostEur(provided?: number, durationSec?: number): number {
  if (typeof provided === 'number' && provided > 0) return round2(provided);
  const sec = Number(durationSec) || 0;
  return round2(Math.max(0.0128, sec * 0.0192));
}

// v12.4.0(阶段二十三):主管线视频/图像成本此前从不落库 → cost-attribution 两大类目永远 0、
// 预算护栏对主创作链零拦截。下面两个估算器堵这个洞;费率保守(宁高勿低,上线前对账单校准)。

/** 视频引擎 → €/s 保守费率。精确匹配先于子串,避免 minimax-h3 命中旧 minimax 档。 */
const VIDEO_RATE_EUR_PER_SEC_EXACT: Record<string, number> = {
  veo: 0.0767,
  kling: 0.0256,
  minimax: 0.0422,
  vidu: 0.0383,
  grok: 0.0102,
  h3: 0.1201,
  'minimax-h3': 0.1201,
};
const VIDEO_RATE_EUR_PER_SEC: Record<string, number> = { veo: 0.0767, kling: 0.0256, 'minimax-h3': 0.1201, h3: 0.1201, minimax: 0.0422, vidu: 0.0383, grok: 0.0102 };
export function videoRateForProvider(providerId?: string): number {
  if (!providerId) return 0.0383;
  const id = providerId.toLowerCase();
  if (VIDEO_RATE_EUR_PER_SEC_EXACT[id] != null) return VIDEO_RATE_EUR_PER_SEC_EXACT[id];
  // 较长的键先匹配,避免 'minimax-h3'.includes('minimax') 落到旧档。
  const keys = Object.keys(VIDEO_RATE_EUR_PER_SEC).sort((a, b) => b.length - a.length);
  for (const k of keys) if (id.includes(k)) return VIDEO_RATE_EUR_PER_SEC[k];
  return 0.0383;
}

export function estimateH3CostUsd(
  usage?: { total_seconds?: number; input_image_count?: number } | null,
  resolution: '768P' | '2K' = '2K',
  env: NodeJS.ProcessEnv = process.env,
): number {
  const sec = Number(usage?.total_seconds);
  const images = Number(usage?.input_image_count) || 0;
  const rate = resolution === '768P'
    ? (Number(env.MINIMAX_H3_USD_PER_SEC_768P) || 0.08)
    : (Number(env.MINIMAX_H3_USD_PER_SEC_2K) || 0.13);
  const extraImg = Number(env.MINIMAX_H3_USD_PER_EXTRA_IMAGE) || 0.04;
  const freeImages = Number(env.MINIMAX_H3_FREE_INPUT_IMAGES ?? 5);
  const seconds = Number.isFinite(sec) && sec > 0 ? sec : 0;
  return Number((seconds * rate + Math.max(0, images - freeImages) * extraImg).toFixed(4));
}

export function usdToEur(usd: number, env: NodeJS.ProcessEnv = process.env): number {
  const fx = Number(env.USD_EUR_RATE) || 0.92;
  return round2(usd * fx);
}

/** 视频成本估算(€):durationSec × €/s 费率(缺时长按 5s、缺费率按 €0.0383/s 保守兜底)。 */
export function estimateVideoCostEur(durationSec?: number, ratePerSec?: number): number {
  const sec = Number(durationSec) || 5;
  const rate = typeof ratePerSec === 'number' && ratePerSec > 0 ? ratePerSec : 0.0383;
  return round2(sec * rate);
}

/** 图像成本估算(€):引擎给了用引擎值,否则保守每张 €0.04。 */
export function estimateImageCostEur(provided?: number): number {
  if (typeof provided === 'number' && provided > 0) return round2(provided);
  return 0.04;
}

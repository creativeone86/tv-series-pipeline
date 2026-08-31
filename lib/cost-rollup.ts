/**
 * lib/cost-rollup (v9.3.0) — 成本归集 (用量与成本可观测的纯逻辑核心).
 *
 * 把 cost_log 行 (每次生成的引擎/分辨率/时长/成本) 归集成
 *   - per-engine / per-day / per-project 成本卷积
 *   - 预算数学: 已用 vs 上限 + 按当前速率线性预测周期末
 * 纯函数, 不碰 DB (API 层把 cost_log 行映射成 CostLogRow 喂进来), client 可直引。
 *
 * 主成本源 = cost_log (全量生成成本); api_usage_events 是失败/配额日志 (v9.0.4d 已处理), 不在此。
 *
 * 单测: tests/v9-3-0-cost-rollup.test.ts。
 */

/** cost_log 行的归一化视图 (字段对齐 db schema, 容忍缺省)。 */
export interface CostLogRow {
  engine: string;
  resolution?: string | null;
  durationSec?: number | null;
  costEur: number;
  projectId?: string | null;
  userId?: string | null;
  createdAt: string; // ISO 8601
}

export interface EngineRollup {
  engine: string;
  count: number;
  costEur: number;
  durationSecTotal: number;
}
export interface DayRollup {
  day: string; // YYYY-MM-DD
  count: number;
  costEur: number;
}
export interface ProjectRollup {
  projectId: string;
  count: number;
  costEur: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function num(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** 总成本 (EUR, 2 位小数)。 */
export function totalCostEur(rows: CostLogRow[]): number {
  return round2(rows.reduce((s, r) => s + num(r.costEur), 0));
}

/** 按引擎归集, 成本降序。 */
export function rollupByEngine(rows: CostLogRow[]): EngineRollup[] {
  const m = new Map<string, EngineRollup>();
  for (const r of rows) {
    const engine = (r.engine || 'unknown').trim() || 'unknown';
    const cur = m.get(engine) || { engine, count: 0, costEur: 0, durationSecTotal: 0 };
    cur.count += 1;
    cur.costEur += num(r.costEur);
    cur.durationSecTotal += num(r.durationSec);
    m.set(engine, cur);
  }
  return [...m.values()]
    .map((e) => ({ ...e, costEur: round2(e.costEur), durationSecTotal: round2(e.durationSecTotal) }))
    .sort((a, b) => b.costEur - a.costEur || a.engine.localeCompare(b.engine));
}

/** 按天 (createdAt 前 10 位 YYYY-MM-DD) 归集, 日期升序。 */
export function rollupByDay(rows: CostLogRow[]): DayRollup[] {
  const m = new Map<string, DayRollup>();
  for (const r of rows) {
    const day = (r.createdAt || '').slice(0, 10);
    if (!day) continue;
    const cur = m.get(day) || { day, count: 0, costEur: 0 };
    cur.count += 1;
    cur.costEur += num(r.costEur);
    m.set(day, cur);
  }
  return [...m.values()]
    .map((d) => ({ ...d, costEur: round2(d.costEur) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** 按项目归集 (无 projectId 的行不计入项目视图), 成本降序。 */
export function rollupByProject(rows: CostLogRow[]): ProjectRollup[] {
  const m = new Map<string, ProjectRollup>();
  for (const r of rows) {
    const projectId = (r.projectId || '').trim();
    if (!projectId) continue;
    const cur = m.get(projectId) || { projectId, count: 0, costEur: 0 };
    cur.count += 1;
    cur.costEur += num(r.costEur);
    m.set(projectId, cur);
  }
  return [...m.values()]
    .map((p) => ({ ...p, costEur: round2(p.costEur) }))
    .sort((a, b) => b.costEur - a.costEur || a.projectId.localeCompare(b.projectId));
}

// ── 预算数学 ────────────────────────────────────────────────

export type BudgetStatusLevel = 'none' | 'ok' | 'warn' | 'over';

export interface BudgetInput {
  spentEur: number;
  /** 周期预算上限 (EUR); null/缺省 = 无上限 */
  capEur?: number | null;
  /** 周期起点 epoch ms */
  periodStartMs: number;
  /** 当前 epoch ms (调用方传, 保持纯函数确定) */
  nowMs: number;
  /** 周期长度 (天), 默认 30 */
  periodDays?: number;
  /** 告警阈值 (0..1), 默认 0.8 */
  warnThreshold?: number;
}

export interface BudgetStatus {
  spentEur: number;
  capEur: number | null;
  remainingEur: number | null;
  /** 已用占比 0..1+ (可超 1); 无上限 → null */
  pctUsed: number | null;
  /** 按当前速率线性外推到周期末的预计总花费 */
  projectedPeriodEndEur: number;
  status: BudgetStatusLevel;
  warnThreshold: number;
}

/**
 * 预算状态 + 周期末线性预测。
 *   projected = spent / min(1, elapsed/period)  (已过周期越久, 预测越接近已用)
 *   status: 无上限→none; spent≥cap→over; pctUsed≥warn→warn; 否则 ok
 */
export function computeBudget(input: BudgetInput): BudgetStatus {
  const spentEur = round2(num(input.spentEur));
  const capEur = input.capEur == null ? null : num(input.capEur);
  const periodDays = input.periodDays && input.periodDays > 0 ? input.periodDays : 30;
  const warnThreshold = input.warnThreshold && input.warnThreshold > 0 ? input.warnThreshold : 0.8;

  const periodMs = periodDays * 86_400_000;
  const elapsedMs = Math.max(1, input.nowMs - input.periodStartMs);
  const fraction = Math.min(1, elapsedMs / periodMs); // 0..1
  const projectedPeriodEndEur = round2(spentEur / fraction);

  const pctUsed = capEur && capEur > 0 ? spentEur / capEur : null;
  const remainingEur = capEur == null ? null : round2(capEur - spentEur);

  let status: BudgetStatusLevel = 'none';
  if (capEur != null && capEur > 0) {
    if (spentEur >= capEur) status = 'over';
    else if (pctUsed != null && pctUsed >= warnThreshold) status = 'warn';
    else status = 'ok';
  }

  return { spentEur, capEur, remainingEur, pctUsed, projectedPeriodEndEur, status, warnThreshold };
}

// ── 汇总 ────────────────────────────────────────────────────

export interface CostSummary {
  totals: { count: number; costEur: number; failureUnused?: never };
  byEngine: EngineRollup[];
  byDay: DayRollup[];
  byProject: ProjectRollup[];
  budget?: BudgetStatus;
}

/** 一次性产出可观测汇总; 传 budget 输入则附预算状态 (spentEur 自动取总成本)。 */
export function buildCostSummary(opts: {
  rows: CostLogRow[];
  budget?: Omit<BudgetInput, 'spentEur'>;
}): CostSummary {
  const rows = opts.rows || [];
  const costEur = totalCostEur(rows);
  const summary: CostSummary = {
    totals: { count: rows.length, costEur },
    byEngine: rollupByEngine(rows),
    byDay: rollupByDay(rows),
    byProject: rollupByProject(rows),
  };
  if (opts.budget) {
    summary.budget = computeBudget({ ...opts.budget, spentEur: costEur });
  }
  return summary;
}

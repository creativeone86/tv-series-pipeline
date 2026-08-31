/**
 * lib/budget-guard (v9.3.3) — 预算护栏: 当月花费对软/硬上限的判定 + 本次操作放行裁决.
 *
 * 在 v9.3.0 computeBudget(状态展示)之上加「操作级护栏」:
 *   - 软上限 capEur(预算目标): 用量到 warnThreshold(默认 0.8)→ 告警; 触及/越过 → 强提示但放行
 *   - 硬上限 hardCapEur(绝对线, 缺省 = capEur, 且不低于软上限): 已达 / 本次会越过 → 拦截(plan-gate 风格)
 *   - pendingCostEur = 本次操作预估成本, 用于「这次生成会不会让你超」
 *
 * 与 lib/plan-gate(订阅档位 gate)正交: 借鉴其 allow + upgradeUrl 形态, 但按金额裁决。
 * 纯函数, 单测 tests/v9-3-3-budget-guard.test.ts。
 */

import { apiT } from './api-i18n';
import type { Locale } from './i18n';

export type BudgetGuardLevel = 'none' | 'ok' | 'warn' | 'soft_over' | 'hard_block';

export interface BudgetGuardInput {
  /** 当月已花 (EUR) */
  spentEur: number;
  /** 软上限 / 预算目标 (EUR); null 或 <=0 = 不设防, 永远放行 */
  capEur: number | null;
  /** 硬上限 / 绝对线 (EUR); 缺省 = capEur; 内部强制不低于软上限 */
  hardCapEur?: number | null;
  /** 本次操作预估成本 (EUR), 默认 0 */
  pendingCostEur?: number;
  /** 软上限内的告警阈值 0..1, 默认 0.8 */
  warnThreshold?: number;
  /** UI locale for `message`. Defaults to English. */
  locale?: Locale;
}

export interface BudgetGuardResult {
  /** 是否放行本次操作 */
  allow: boolean;
  level: BudgetGuardLevel;
  spentEur: number;
  pendingCostEur: number;
  /** spent + pending */
  projectedAfterEur: number;
  capEur: number | null;
  hardCapEur: number | null;
  /** spent / cap; 无上限 → null */
  pctUsed: number | null;
  /** User-facing hint (localized via input.locale) */
  message: string;
  /** 引导(调预算 / 去计费), 借鉴 plan-gate */
  upgradeUrl: string;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function num(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

const UPGRADE_URL = '/dashboard/billing';

/** 评估当月花费 + 本次操作成本对预算护栏的裁决。 */
export function evaluateBudgetGuard(input: BudgetGuardInput): BudgetGuardResult {
  const locale = input.locale ?? 'en';
  const spentEur = round2(Math.max(0, num(input.spentEur)));
  const pendingCostEur = round2(Math.max(0, num(input.pendingCostEur)));
  const projectedAfterEur = round2(spentEur + pendingCostEur);
  const cap = input.capEur == null ? null : num(input.capEur);
  const warnThreshold = input.warnThreshold && input.warnThreshold > 0 ? input.warnThreshold : 0.8;

  // 不设防
  if (cap == null || cap <= 0) {
    return {
      allow: true, level: 'none', spentEur, pendingCostEur, projectedAfterEur,
      capEur: null, hardCapEur: null, pctUsed: null,
      message: apiT(locale, 'budgetNone'), upgradeUrl: UPGRADE_URL,
    };
  }

  // 硬上限不低于软上限
  const rawHard = input.hardCapEur != null && input.hardCapEur > 0 ? num(input.hardCapEur) : cap;
  const hardCap = Math.max(cap, rawHard);
  const pctUsed = round2(spentEur / cap);

  let allow: boolean;
  let level: BudgetGuardLevel;
  let message: string;

  if (spentEur >= hardCap) {
    allow = false; level = 'hard_block';
    message = apiT(locale, 'budgetHardReached', { hard: round2(hardCap) });
  } else if (projectedAfterEur > hardCap) {
    allow = false; level = 'hard_block';
    message = apiT(locale, 'budgetWouldExceed', { pending: pendingCostEur, hard: round2(hardCap), spent: spentEur });
  } else if (projectedAfterEur >= cap) {
    allow = true; level = 'soft_over';
    message = apiT(locale, 'budgetSoftOver', { cap: round2(cap), projected: projectedAfterEur });
  } else if (pctUsed >= warnThreshold) {
    allow = true; level = 'warn';
    message = apiT(locale, 'budgetWarn', { pct: Math.round(pctUsed * 100), spent: spentEur, cap: round2(cap) });
  } else {
    allow = true; level = 'ok';
    message = apiT(locale, 'budgetOk', { spent: spentEur, cap: round2(cap) });
  }

  return {
    allow, level, spentEur, pendingCostEur, projectedAfterEur,
    capEur: round2(cap), hardCapEur: round2(hardCap), pctUsed,
    message, upgradeUrl: UPGRADE_URL,
  };
}

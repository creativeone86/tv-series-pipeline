/**
 * v9.3.3 — lib/budget-guard 单测 (预算护栏: 软/硬上限 + 阈值告警 + 本次成本预判).
 */
import { describe, it, expect } from 'vitest';
import { evaluateBudgetGuard } from '@/lib/budget-guard';

describe('v9.3.3 · evaluateBudgetGuard', () => {
  it('无上限 (null / 0) → none, 放行, pctUsed null', () => {
    const a = evaluateBudgetGuard({ spentEur: 50, capEur: null });
    expect(a).toMatchObject({ allow: true, level: 'none', pctUsed: null, capEur: null, hardCapEur: null });
    expect(evaluateBudgetGuard({ spentEur: 50, capEur: 0 }).level).toBe('none');
  });

  it('ok: 用量低于告警阈值', () => {
    const r = evaluateBudgetGuard({ spentEur: 30, capEur: 100 });
    expect(r).toMatchObject({ allow: true, level: 'ok', pctUsed: 0.3, capEur: 100, hardCapEur: 100 });
    expect(r.message).toContain('€30');
  });

  it('warn: 达到告警阈值(默认 0.8)但本次不越软上限', () => {
    const r = evaluateBudgetGuard({ spentEur: 85, capEur: 100 });
    expect(r).toMatchObject({ allow: true, level: 'warn', pctUsed: 0.85 });
    expect(r.message).toMatch(/85%/);
  });

  it('soft_over: 本次会触及/越过软上限但未破硬上限 → 放行 + 强提示', () => {
    const r = evaluateBudgetGuard({ spentEur: 90, capEur: 100, hardCapEur: 150, pendingCostEur: 20 });
    expect(r).toMatchObject({ allow: true, level: 'soft_over', projectedAfterEur: 110 });
    // spent==cap 但硬上限更高 → 仍 soft_over 放行
    expect(evaluateBudgetGuard({ spentEur: 100, capEur: 100, hardCapEur: 150 }).level).toBe('soft_over');
  });

  it('hard_block: 已达硬上限(软=硬时到 cap 即拦)→ 不放行', () => {
    const r = evaluateBudgetGuard({ spentEur: 100, capEur: 100 });
    expect(r).toMatchObject({ allow: false, level: 'hard_block', hardCapEur: 100 });
    expect(r.upgradeUrl).toBe('/dashboard/billing');
    expect(r.message).toMatch(/hard cap|硬上限/);
  });

  it('hard_block: 本次预估会越过硬上限 → 拦截', () => {
    const r = evaluateBudgetGuard({ spentEur: 140, capEur: 100, hardCapEur: 150, pendingCostEur: 20 });
    expect(r).toMatchObject({ allow: false, level: 'hard_block', projectedAfterEur: 160 });
  });

  it('硬上限强制不低于软上限 (hardCap < cap 时取 cap)', () => {
    const r = evaluateBudgetGuard({ spentEur: 100, capEur: 100, hardCapEur: 50 });
    expect(r.hardCapEur).toBe(100);
    expect(r.level).toBe('hard_block');
  });

  it('自定义告警阈值', () => {
    expect(evaluateBudgetGuard({ spentEur: 60, capEur: 100, warnThreshold: 0.5 }).level).toBe('warn');
    expect(evaluateBudgetGuard({ spentEur: 40, capEur: 100, warnThreshold: 0.5 }).level).toBe('ok');
  });

  it('负值/缺省 pending 夹紧; projectedAfter = spent + pending', () => {
    expect(evaluateBudgetGuard({ spentEur: -10, capEur: 100, pendingCostEur: -5 }))
      .toMatchObject({ spentEur: 0, pendingCostEur: 0, projectedAfterEur: 0, level: 'ok' });
    expect(evaluateBudgetGuard({ spentEur: 30, capEur: 100, pendingCostEur: 15 }).projectedAfterEur).toBe(45);
  });
});

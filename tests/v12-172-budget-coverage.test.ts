/**
 * v12.172 — 预算护栏全覆盖:动态估算纯函数 + 三路由接线锁 + 超限拒绝集成闭环。
 */
import { describe, it, expect } from 'vitest';
import { estimatePipelineCostEur } from '@/lib/budget-estimate';
import fs from 'fs';

describe('v12.172 · estimatePipelineCostEur', () => {
  it('按引擎单价与镜数缩放;未知引擎按最贵档保守', () => {
    const kling8 = estimatePipelineCostEur({ shotCount: 8, videoProvider: 'kling', secondsPerShot: 6 });
    expect(kling8).toBeGreaterThan(1);             // 8镜×6s×€0.0256 + 图 + 音 ≈ €1.8
    expect(kling8).toBeLessThan(3);
    const kling20 = estimatePipelineCostEur({ shotCount: 20, videoProvider: 'kling', secondsPerShot: 8 });
    expect(kling20).toBeGreaterThan(4);            // 20镜×8s → ≈ €5.6
    const unknown = estimatePipelineCostEur({ shotCount: 8, videoProvider: 'mystery' });
    expect(unknown).toBeGreaterThanOrEqual(estimatePipelineCostEur({ shotCount: 8, videoProvider: 'minimax' }));
    // 补渲(不重出图)应低于全片
    expect(estimatePipelineCostEur({ shotCount: 8, skipImages: true })).toBeLessThan(estimatePipelineCostEur({ shotCount: 8 }));
    expect(estimatePipelineCostEur({})).toBeGreaterThan(2); // 默认估 ≈ €2.5
  });
  it('接线锁:create-stream/regenerate-shot/series 三口全走动态估;regenerate 超限 402', () => {
    const cs = fs.readFileSync('app/api/create-stream/route.ts', 'utf-8');
    expect(cs).toContain('estimatePipelineCostEur({ videoProvider })');
    expect(cs).not.toContain('pendingCostEur: 6');
    const rg = fs.readFileSync('app/api/regenerate-shot/route.ts', 'utf-8');
    expect(rg).toContain('assertBudget');
    expect(rg).toContain("code: 'budget_exceeded'");
    expect(rg).toContain('dryRun !== true'); // dryRun 零成本免检
    const sg = fs.readFileSync('app/api/series/[id]/generate/route.ts', 'utf-8');
    expect(sg).toContain('targets.length * estimatePipelineCostEur({})');
  });
  it('集成闭环:设 hard cap 后动态估算触发拒绝(同驱动)', async () => {
    const { getDbDriver } = await import('@/lib/db-driver');
    const { assertBudget } = await import('@/lib/budget-enforce');
    const uid = 'test-budget-' + Date.now();
    const drv = getDbDriver();
    await drv.run(
      `INSERT INTO users (id, email, password_hash, name, role, avatar_url, locale, created_at, budget_cap_eur, budget_hard_cap_eur) VALUES (?, ?, 'x', 'T', 'member', '', 'zh', ?, 1, 1)`,
      [uid, `${uid}@t.io`, new Date().toISOString()],
    );
    const pending = estimatePipelineCostEur({ videoProvider: 'kling' }); // > €1 硬上限
    const b = await assertBudget({ userId: uid, pendingCostEur: pending });
    expect(b.allow).toBe(false); // force 批量补渲同一路径 → 路由返回 402
    await drv.run('DELETE FROM users WHERE id = ?', [uid]);
  });
});

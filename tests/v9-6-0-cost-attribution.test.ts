/**
 * v9.6.0 — lib/cost-attribution 单测(阶段十六开篇:项目级成本归因 + 省钱提示)。
 */
import { describe, it, expect } from 'vitest';
import { attributeCost, evaluateCostGuard, COST_CATEGORY_LABEL, type CostEvent } from '@/lib/cost-attribution';

describe('v9.6.0 · attributeCost', () => {
  it('空 → total 0 / 无类目 / topCategory null / 提示先跑一单', () => {
    const r = attributeCost([]);
    expect(r.totalEur).toBe(0);
    expect(r.byCategory).toEqual([]);
    expect(r.topCategory).toBeNull();
    expect(r.hints[0]).toMatch(/尚无|跑一单/);
  });

  it('混合 → 总价 + 降序 + 占比 + 最贵类目', () => {
    const ev: CostEvent[] = [
      { category: 'video', costEur: 7 },
      { category: 'image', costEur: 2 },
      { category: 'llm', costEur: 1 },
    ];
    const r = attributeCost(ev);
    expect(r.totalEur).toBe(10);
    expect(r.byCategory.map((c) => c.category)).toEqual(['video', 'image', 'llm']); // 降序
    expect(r.byCategory[0].pct).toBe(70);
    expect(r.byCategory[1].pct).toBe(20);
    expect(r.topCategory?.category).toBe('video');
    expect(r.topCategory?.label).toBe(COST_CATEGORY_LABEL.video);
  });

  it('视频 ≥50% → 视频省钱提示', () => {
    const r = attributeCost([{ category: 'video', costEur: 8 }, { category: 'llm', costEur: 2 }]);
    expect(r.hints.join()).toMatch(/视频生成占 80%/);
    expect(r.hints.join()).toMatch(/缩短单镜|竞速/);
  });

  it('同类目累加 + count 计有效计费数', () => {
    const r = attributeCost([
      { category: 'image', costEur: 1.5 }, { category: 'image', costEur: 2.5 }, { category: 'image', costEur: 0 },
    ]);
    expect(r.totalEur).toBe(4);
    expect(r.byCategory[0].costEur).toBe(4);
    expect(r.byCategory[0].count).toBe(2); // 第三条 0 不计 count
  });

  it('未知类目 → other;负/NaN 成本 → 忽略', () => {
    const r = attributeCost([
      { category: 'mystery' as any, costEur: 3 },
      { category: 'llm', costEur: -5 },
      { category: 'tts', costEur: NaN as unknown as number },
    ]);
    expect(r.byCategory.map((c) => c.category)).toEqual(['other']);
    expect(r.totalEur).toBe(3);
  });

  it('图像最大头 ≥40% → 图像提示;视频第二大头追加提示', () => {
    const r = attributeCost([{ category: 'image', costEur: 5 }, { category: 'video', costEur: 4 }, { category: 'llm', costEur: 1 }]);
    expect(r.topCategory?.category).toBe('image');
    expect(r.hints.join()).toMatch(/图像分镜占 50%/);
    expect(r.hints.join()).toMatch(/视频也占 40%/);
  });
});

describe('v9.7.17 · evaluateCostGuard', () => {
  it('无上限 → none', () => {
    expect(evaluateCostGuard({ totalEur: 50 }).level).toBe('none');
    expect(evaluateCostGuard({ totalEur: 50, capEur: 0 }).level).toBe('none');
  });
  it('预算内 → ok + 占比/剩余', () => {
    const g = evaluateCostGuard({ totalEur: 50, capEur: 100 });
    expect(g.level).toBe('ok');
    expect(g.pctUsed).toBe(50);
    expect(g.remainingEur).toBe(50);
  });
  it('达告警阈值(默认 0.8)→ warn', () => {
    expect(evaluateCostGuard({ totalEur: 80, capEur: 100 }).level).toBe('warn');
    expect(evaluateCostGuard({ totalEur: 65, capEur: 100, warnThreshold: 0.6 }).level).toBe('warn');
  });
  it('超上限 → over', () => {
    const g = evaluateCostGuard({ totalEur: 120, capEur: 100 });
    expect(g.level).toBe('over');
    expect(g.message).toMatch(/已超预算/);
  });
});

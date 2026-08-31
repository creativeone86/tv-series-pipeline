/**
 * v12.4.0(阶段二十三)— 视频/图像成本估算器(主管线成本落库的纯函数地基)。
 */
import { describe, it, expect } from 'vitest';
import { estimateVideoCostEur, estimateImageCostEur, videoRateForProvider, estimateH3CostUsd, usdToEur } from '@/lib/repos/cost-log-repo';

describe('v12.4.0 · 成本估算器', () => {
  it('videoRateForProvider:按引擎给保守 €/s,未知 0.0383 兜底', () => {
    expect(videoRateForProvider('veo')).toBe(0.0767);
    expect(videoRateForProvider('kling')).toBe(0.0256);
    expect(videoRateForProvider('minimax')).toBe(0.0422);
    expect(videoRateForProvider('minimax-h3')).toBe(0.1201);
    expect(videoRateForProvider('h3')).toBe(0.1201);
    expect(videoRateForProvider('video-minimax-h3')).toBe(0.1201);
    expect(videoRateForProvider('vidu')).toBe(0.0383);
    expect(videoRateForProvider('video-veo')).toBe(0.0767); // 含子串也命中
    expect(videoRateForProvider('unknown')).toBe(0.0383);
    expect(videoRateForProvider(undefined)).toBe(0.0383);
  });

  it('estimateVideoCostEur:时长×费率,缺省保守兜底', () => {
    expect(estimateVideoCostEur(8, 0.6)).toBe(4.8);
    expect(estimateVideoCostEur(8, videoRateForProvider('minimax'))).toBe(0.34);
    expect(estimateVideoCostEur()).toBe(0.19);      // 缺时长 5s × 缺费率 0.0383
    expect(estimateVideoCostEur(0, 0)).toBe(0.19);  // 0 视为缺,走兜底
  });

  it('estimateH3CostUsd:官方价 2K $0.13/s、768P $0.08/s、前 5 张参考图免费', () => {
    expect(estimateH3CostUsd({ total_seconds: 5, input_image_count: 1 }, '2K')).toBe(0.65);
    expect(estimateH3CostUsd({ total_seconds: 5, input_image_count: 1 }, '768P')).toBe(0.4);
    expect(estimateH3CostUsd({ total_seconds: 5, input_image_count: 7 }, '2K')).toBe(0.73);
    expect(usdToEur(0.65, { USD_EUR_RATE: '0.92' } as NodeJS.ProcessEnv)).toBe(0.6);
  });

  it('estimateImageCostEur:引擎值优先,否则每张 €0.04', () => {
    expect(estimateImageCostEur()).toBe(0.04);
    expect(estimateImageCostEur(0.12)).toBe(0.12);
    expect(estimateImageCostEur(0)).toBe(0.04);
  });
});

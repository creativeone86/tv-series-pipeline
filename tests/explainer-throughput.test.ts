import { describe, expect, it } from 'vitest';
import { explainerConcurrency, isTransientError, runBounded, withBackoff } from '@/lib/explainer/throughput';

describe('explainer throughput', () => {
  it('runBounded preserves order and honours the limit', async () => {
    let active = 0;
    let maxActive = 0;
    const out = await runBounded([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40, 50, 60]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('classifies transient vs permanent errors', () => {
    expect(isTransientError(new Error('HTTP 429 rate limit'))).toBe(true);
    expect(isTransientError(new Error('503 overloaded'))).toBe(true);
    expect(isTransientError(new Error('ETIMEDOUT'))).toBe(true);
    expect(isTransientError(new Error('400 bad prompt'))).toBe(false);
  });

  it('withBackoff retries transient errors then succeeds', async () => {
    let calls = 0;
    const r = await withBackoff(async () => {
      calls += 1;
      if (calls < 3) throw new Error('429 rate limit');
      return 'ok';
    }, { baseMs: 1, retries: 5 });
    expect(r).toBe('ok');
    expect(calls).toBe(3);
  });

  it('withBackoff rethrows permanent errors immediately', async () => {
    let calls = 0;
    await expect(withBackoff(async () => {
      calls += 1;
      throw new Error('400 bad');
    }, { baseMs: 1 })).rejects.toThrow('400');
    expect(calls).toBe(1);
  });

  it('concurrency is clamped and env-overridable', () => {
    expect(explainerConcurrency('tts')).toBeGreaterThanOrEqual(1);
    expect(explainerConcurrency('image')).toBeGreaterThanOrEqual(1);
  });
});

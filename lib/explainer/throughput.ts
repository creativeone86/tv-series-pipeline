/**
 * Bounded-parallel helpers for the explainer pipeline. TTS sections and (non-continuity)
 * image frames are independent network calls; running a few at once cuts wall-clock time
 * without hammering providers. Backoff retries transient 429/5xx so a flaky call does not
 * fail a whole episode. Resume is handled by the caller's asset-reuse (already-persisted
 * frames/tracks are skipped), so these helpers only cover the "not yet produced" work.
 */

export function isTransientError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return /429|rate.?limit|timeout|timed out|econnreset|etimedout|socket hang up|502|503|504|overloaded|temporarily/.test(msg);
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number; maxMs?: number; label?: string } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseMs ?? 500;
  const max = opts.maxMs ?? 8000;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      attempt += 1;
      if (attempt > retries || !isTransientError(e)) throw e;
      const jitter = Math.random() * base;
      const delay = Math.min(max, base * 2 ** (attempt - 1) + jitter);
      if (opts.label) console.warn(`[explainer] retry ${opts.label} attempt ${attempt}/${retries} in ${Math.round(delay)}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** Order-preserving concurrency-limited map. Errors reject the whole run (caller decides). */
export async function runBounded<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const n = items.length;
  const results = new Array<R>(n);
  const width = Math.max(1, Math.min(limit, n));
  let cursor = 0;
  async function pump(): Promise<void> {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= n) return;
      results[i] = await worker(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: width }, () => pump()));
  return results;
}

export function explainerConcurrency(kind: 'tts' | 'image'): number {
  const env = kind === 'tts' ? process.env.EXPLAINER_TTS_CONCURRENCY : process.env.EXPLAINER_IMAGE_CONCURRENCY;
  const n = Number(env);
  if (Number.isFinite(n) && n >= 1) return Math.min(6, Math.floor(n));
  return kind === 'tts' ? 2 : 3;
}

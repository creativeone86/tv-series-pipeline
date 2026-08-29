/**
 * MiniMax-H3 视频生成 V2 客户端。
 *
 * 与 services/minimax.service.ts 的 /v1 Hailuo-2.3 路径无关:
 *   POST /v2/video_generation  +  GET /v2/query/video_generation/{task_id}
 *   多模态 content[]、小写 succeeded/failed、OpenAI 形 HTTP 错误、content.url 直出。
 *
 * 硬规则(platform.minimax.io, 2026-08-28):
 *   - 每请求必须有一条非空 text
 *   - i2va(first/last_frame) 与 r2va(reference_*) 互斥,混传 400
 *   - resolution 只有 768P / 2K
 *   - duration 整数 4–15
 *   - t2va 的 ratio 必须是具体比例,禁止 adaptive
 */

import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { normalizeBaseURL } from '@/lib/base-url';
import type { VideoGenerateInput } from '@/lib/video-providers/types';

export type H3Role = 'first_frame' | 'last_frame' | 'reference_image' | 'reference_video' | 'reference_audio';
export type H3Mode = 't2va' | 'i2va' | 'r2va';
export type H3Resolution = '768P' | '2K';

export interface H3ContentItem {
  type: 'text' | 'image_url' | 'video_url' | 'audio_url';
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
  audio_url?: { url: string };
  role?: H3Role;
}

export interface H3Usage {
  total_seconds?: number;
  input_seconds?: number;
  output_seconds?: number;
  input_image_count?: number;
  input_audio_seconds?: number;
}

export interface H3GenerateResult {
  videoUrl: string;
  taskId: string;
  totalSeconds?: number;
  usage?: H3Usage;
  resolution?: H3Resolution;
}

const T2VA_RATIOS = new Set(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']);

function isUsableImageUrl(u?: string): u is string {
  return !!u && (/^https?:\/\//.test(u) || /^data:image\//.test(u));
}

export function hasMinimaxH3(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.MINIMAX_API_KEY && env.ENABLE_MINIMAX_H3 !== '0';
}

export function h3Duration(sec?: number): number {
  const n = Math.round(Number(sec));
  if (!Number.isFinite(n)) return 8;
  return Math.min(15, Math.max(4, n));
}

export function h3Resolution(env: NodeJS.ProcessEnv = process.env): H3Resolution {
  return env.MINIMAX_H3_RESOLUTION === '768P' ? '768P' : '2K';
}

export function h3Mode(input: VideoGenerateInput): H3Mode {
  const hasRef = !!(
    (input.subjectReferences && input.subjectReferences.length > 0)
    || (input.referenceImages && input.referenceImages.length > 0)
  );
  if (hasRef) return 'r2va';
  if (input.firstFrameUrl) return 'i2va';
  return 't2va';
}

export function h3Ratio(mode: H3Mode, aspect?: string, env: NodeJS.ProcessEnv = process.env): string {
  if (mode === 'i2va') return 'adaptive';
  const fromEnv = (env.MINIMAX_H3_RATIO || '').trim();
  if (mode === 't2va') {
    const candidate = (aspect || fromEnv || '16:9').trim();
    return T2VA_RATIOS.has(candidate) ? candidate : '16:9';
  }
  if (aspect && (aspect === 'adaptive' || T2VA_RATIOS.has(aspect))) return aspect;
  if (fromEnv && (fromEnv === 'adaptive' || T2VA_RATIOS.has(fromEnv))) return fromEnv;
  return 'adaptive';
}

export function buildH3Content(input: VideoGenerateInput): H3ContentItem[] {
  const text = (input.prompt || '').trim();
  if (!text) throw new Error('h3: prompt is required');
  const items: H3ContentItem[] = [{ type: 'text', text: text.slice(0, 7000) }];
  const mode = h3Mode(input);

  if (mode === 't2va') return items;

  if (mode === 'i2va') {
    if (isUsableImageUrl(input.firstFrameUrl)) {
      items.push({ type: 'image_url', image_url: { url: input.firstFrameUrl }, role: 'first_frame' });
    }
    if (isUsableImageUrl(input.lastFrameUrl)) {
      items.push({ type: 'image_url', image_url: { url: input.lastFrameUrl }, role: 'last_frame' });
    }
    return items;
  }

  // r2va: subjects first, then first frame demoted to a reference, then extras. Cap 9, dedupe.
  const seen = new Set<string>();
  const pushRef = (url?: string) => {
    if (!isUsableImageUrl(url) || seen.has(url) || seen.size >= 9) return;
    seen.add(url);
    items.push({ type: 'image_url', image_url: { url }, role: 'reference_image' });
  };
  for (const s of input.subjectReferences || []) {
    pushRef(s.imageUrl);
    for (const extra of s.refImageUrls || []) pushRef(extra);
  }
  pushRef(input.firstFrameUrl);
  for (const u of input.referenceImages || []) pushRef(u);
  return items;
}

export function buildH3RequestBody(
  input: VideoGenerateInput,
  env: NodeJS.ProcessEnv = process.env,
): Record<string, unknown> {
  const mode = h3Mode(input);
  const content = buildH3Content(input);
  const roles = content.map((c) => c.role).filter(Boolean);
  const hasFrame = roles.some((r) => r === 'first_frame' || r === 'last_frame');
  const hasRef = roles.some((r) => r === 'reference_image' || r === 'reference_video' || r === 'reference_audio');
  if (hasFrame && hasRef) {
    throw new Error('h3: first/last_frame and reference_* are mutually exclusive');
  }
  return {
    model: env.MINIMAX_H3_MODEL || 'MiniMax-H3',
    content,
    resolution: h3Resolution(env),
    duration: h3Duration(input.durationSec),
    ratio: h3Ratio(mode, input.aspectRatio, env),
  };
}

export function parseH3Task(json: unknown): {
  status: string;
  videoUrl: string;
  durationSec?: number;
  totalSeconds?: number;
  usage?: H3Usage;
  resolution?: H3Resolution;
  errorCode?: string;
  errorMessage?: string;
} {
  const root = (json || {}) as any;
  const task = root.task || root;
  const status = String(task.status || '').toLowerCase();
  const usage = (task.usage || {}) as H3Usage;
  const res = task.resolution === '768P' || task.resolution === '2K' ? task.resolution as H3Resolution : undefined;
  return {
    status,
    videoUrl: String(task.content?.url || ''),
    durationSec: typeof task.duration === 'number' ? task.duration : undefined,
    totalSeconds: typeof usage.total_seconds === 'number' ? usage.total_seconds : undefined,
    usage,
    resolution: res,
    errorCode: task.error?.code != null ? String(task.error.code) : undefined,
    errorMessage: task.error?.message ? String(task.error.message) : undefined,
  };
}

export function classifyH3Error(httpStatus: number, body: unknown): {
  message: string;
  retryable: boolean;
  fatal: boolean;
} {
  const j = (body || {}) as any;
  const detail = j?.error?.message || j?.message || (typeof body === 'string' ? body : JSON.stringify(body || {}).slice(0, 200));
  const message = `h3 HTTP ${httpStatus}: ${String(detail).slice(0, 240)}`;
  const retryable = httpStatus === 429 || httpStatus === 529 || httpStatus >= 500;
  const fatal = httpStatus === 401 || httpStatus === 402 || httpStatus === 403;
  return { message, retryable, fatal };
}

function h3Base(env: NodeJS.ProcessEnv = process.env): string {
  return normalizeBaseURL(
    env.MINIMAX_H3_BASE_URL || env.MINIMAX_BASE_URL || 'https://api.minimax.io',
    { stripApiVersion: true },
  );
}

let lastH3Result: H3GenerateResult | null = null;

export function takeLastH3Result(): H3GenerateResult | null {
  const r = lastH3Result;
  lastH3Result = null;
  return r;
}

export class MinimaxH3Service {
  async generateVideo(input: VideoGenerateInput): Promise<H3GenerateResult> {
    if (!hasMinimaxH3()) throw new Error('h3: MINIMAX_API_KEY not set');
    const key = process.env.MINIMAX_API_KEY!;
    const base = h3Base();
    const body = buildH3RequestBody(input);

    const created = await fetchWithTimeout(`${base}/v2/video_generation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 30_000);
    const createdJson = await created.json().catch(() => ({}));
    if (!created.ok) {
      throw new Error(classifyH3Error(created.status, createdJson).message);
    }
    const taskId = String(createdJson.task_id || createdJson.task?.id || '');
    if (!taskId) throw new Error('h3: create returned no task_id');

    const timeoutMs = Number(process.env.MINIMAX_H3_POLL_TIMEOUT_MS) || 10 * 60_000;
    const started = Date.now();
    let attempt = 0;
    while (Date.now() - started < timeoutMs) {
      await new Promise((r) => setTimeout(r, 5_000));
      attempt++;
      input.onProgress?.(Math.min(0.95, attempt * 0.05), `h3: polling ${taskId}`);
      const q = await fetchWithTimeout(`${base}/v2/query/video_generation/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
      }, 20_000);
      const qj = await q.json().catch(() => ({}));
      if (!q.ok) {
        const cls = classifyH3Error(q.status, qj);
        if (!cls.retryable) throw new Error(cls.message);
        continue;
      }
      const parsed = parseH3Task(qj);
      if (parsed.status === 'succeeded') {
        if (!parsed.videoUrl) throw new Error('h3: succeeded but no content.url');
        input.onProgress?.(1, 'h3: succeeded');
        void persistH3Output(parsed.videoUrl);
        const result: H3GenerateResult = {
          videoUrl: parsed.videoUrl,
          taskId,
          totalSeconds: parsed.totalSeconds,
          usage: parsed.usage,
          resolution: parsed.resolution || h3Resolution(),
        };
        lastH3Result = result;
        return result;
      }
      if (parsed.status === 'failed' || parsed.status === 'cancelled') {
        throw new Error(`h3 task ${parsed.status}: ${parsed.errorMessage || parsed.errorCode || 'unknown'}`);
      }
    }
    throw new Error(`h3: poll timeout after ${timeoutMs}ms (task ${taskId})`);
  }

  async cancelTask(taskId: string): Promise<void> {
    const key = process.env.MINIMAX_API_KEY;
    if (!key) throw new Error('h3: MINIMAX_API_KEY not set');
    const base = h3Base();
    const r = await fetchWithTimeout(`${base}/v2/video_generation/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    }, 15_000);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(classifyH3Error(r.status, j).message);
    }
  }
}

/** CDN URL 有时效,后台落盘;调用方仍拿 http URL(dispatch 不认 /api/serve-file)。 */
function persistH3Output(url: string): void {
  import('@/lib/asset-storage').then((m) => m.persistAsset(url, { contentType: 'video/mp4', ext: '.mp4' }))
    .catch((e) => console.warn('[h3] persist failed:', e instanceof Error ? e.message : e));
}

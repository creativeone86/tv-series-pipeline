import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-guard';
import {
  isPlaceholder, classifyHttp, classifyMinimax, extractGatewayBalance, overallHealth,
  type ProviderHealth, type ProviderKind,
} from '@/lib/provider-health';
import { buildChatBody, retryBodyForParamError } from '@/lib/llm-params.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROBE_TIMEOUT = 10_000;
const CACHE_TTL = 60_000;
let cache: { at: number; payload: any } | null = null;

async function timedFetch(url: string, opts: RequestInit = {}): Promise<{ httpStatus?: number; body?: string; error?: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), PROBE_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal });
    return { httpStatus: res.status, body: await res.text() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  } finally { clearTimeout(t); }
}

function tryJson(s?: string): any { try { return s ? JSON.parse(s) : null; } catch { return null; } }

/** 一个 provider 探测 — 返回 ProviderHealth, 永不回传 key. */
async function probeChatLLM(id: string, label: string, baseUrl: string, key: string | undefined, model: string): Promise<ProviderHealth> {
  const base = { id, label, kind: 'llm' as ProviderKind, baseUrl };
  if (isPlaceholder(key)) return { ...base, status: 'not_configured', detail: '未配置 key' };
  const t0 = Date.now();
  // 探针必须和真实调用用同一套参数方言(lib/llm-params.mjs),否则 gpt-5/o 系列会被
  // 误报成 unreachable(400 Unsupported parameter),明明生成链路是好的。
  const body = buildChatBody({ model, messages: [{ role: 'user', content: 'hi' }], maxTokens: 16 });
  let r = await timedFetch(`${baseUrl}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  let j = tryJson(r.body);
  if (r.httpStatus === 400) {
    const fixed = retryBodyForParamError(body, j?.error?.message || r.body || '');
    if (fixed) {
      r = await timedFetch(`${baseUrl}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(fixed),
      });
      j = tryJson(r.body);
    }
  }
  const cls = j?.base_resp ? classifyMinimax(j.base_resp) : classifyHttp(r);
  const hint = modelEndpointHint(model, baseUrl, j?.error?.message || '');
  return { ...base, ...cls, ...(hint ? { detail: `${cls.detail ?? ''}${cls.detail ? ' — ' : ''}${hint}` } : {}), latencyMs: Date.now() - t0 };
}

/**
 * "model does not exist" 是最常被误读的 LLM 错误:真正的原因通常不是模型名打错,
 * 而是**模型和端点不是一家的** —— 比如把 claude-* 发去 api.openai.com。creative 线
 * 尤其容易踩:它没有自己的 base,CREATIVE_BASE_URL/DEEPSEEK_BASE_URL 未设时会一路
 * 回退到 OPENAI_BASE_URL,而配置里只看得到一个模型名,看不出它被发去了哪。
 * 这里把这层因果直接写进体检详情,省掉一轮猜测。
 */
export function modelEndpointHint(model: string, baseUrl: string, errMsg: string): string | null {
  if (!/does not exist|do not have access|model_not_found|unknown model|invalid model/i.test(errMsg)) return null;
  const host = (() => { try { return new URL(baseUrl).host; } catch { return baseUrl; } })();
  const m = String(model || '');

  const vendorOf = (name: string): string | null => {
    if (/^(?:[a-z0-9-]+\/)?claude-/i.test(name)) return 'Anthropic';
    if (/^(?:[a-z0-9-]+\/)?deepseek-/i.test(name)) return 'DeepSeek';
    if (/^(?:[a-z0-9-]+\/)?(?:gpt-|o[134](?:-|$)|text-embedding-)/i.test(name)) return 'OpenAI';
    if (/^MiniMax/i.test(name)) return 'MiniMax';
    return null;
  };
  const hostVendor = /(^|\.)openai\.com$/i.test(host) ? 'OpenAI'
    : /(^|\.)anthropic\.com$/i.test(host) ? 'Anthropic'
    : /(^|\.)deepseek\.com$/i.test(host) ? 'DeepSeek'
    : /(minimaxi?\.com|minimax\.io)$/i.test(host) ? 'MiniMax'
    : null;

  const modelVendor = vendorOf(m);
  if (hostVendor && modelVendor && hostVendor !== modelVendor) {
    return `${modelVendor} 模型被发往 ${hostVendor} 端点 (${host}) —— 换成 ${hostVendor} 自己的模型,或把该线的 base/key 指向能转发 ${modelVendor} 的网关`;
  }
  return `确认 ${host} 提供 "${m}" 且该 key 有权限`;
}

async function probeMinimaxTTS(): Promise<ProviderHealth> {
  const base = { id: 'minimax-tts', label: 'MiniMax TTS (兜底·主走 vectorengine)', kind: 'tts' as ProviderKind, baseUrl: process.env.MINIMAX_BASE_URL };
  const key = process.env.MINIMAX_API_KEY;
  if (isPlaceholder(key)) return { ...base, status: 'not_configured', detail: '未设置 MINIMAX_API_KEY' };
  // v7.0.1: 新 sk-cp- key 走 t2a_v2 无需 GroupId; 用账户 plan 支持的模型 (speech-02-hd)
  const t0 = Date.now();
  const ttsModel = process.env.MINIMAX_TTS_MODEL || 'speech-02-hd';
  const r = await timedFetch(`${process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com'}/v1/t2a_v2`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: ttsModel, text: '测试', stream: false, voice_setting: { voice_id: 'male-qn-qingse', speed: 1, vol: 1, pitch: 0 }, audio_setting: { format: 'mp3' } }),
  });
  const j = tryJson(r.body);
  const cls = j?.base_resp ? classifyMinimax(j.base_resp) : classifyHttp(r);
  return { ...base, ...cls, latencyMs: Date.now() - t0 };
}

/**
 * ElevenLabs 探针。此前 ElevenLabs 只在 `optionalProvider` 里露脸,而那个函数
 * **配了 key 就返回 null**(注释说"已配置的会单独探测"),却从来没有对应的探针 ——
 * 于是填上 key 之后 ElevenLabs 直接从体检页消失,看起来像"没生效"。
 */
async function probeElevenLabs(): Promise<ProviderHealth> {
  const baseUrl = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
  const base = { id: 'elevenlabs', label: 'ElevenLabs TTS (multilingual v2)', kind: 'tts' as ProviderKind, baseUrl };
  const key = process.env.ELEVENLABS_API_KEY;
  if (isPlaceholder(key)) return { ...base, status: 'not_configured', detail: 'ELEVENLABS_API_KEY not set' };
  if (process.env.ENABLE_ELEVENLABS === '0') {
    return { ...base, status: 'misconfigured', detail: 'key present but disabled by ENABLE_ELEVENLABS=0' };
  }
  const t0 = Date.now();
  const r = await timedFetch(`${baseUrl}/v1/user/subscription`, { headers: { 'xi-api-key': key! } });
  const cls = classifyHttp(r);
  const latencyMs = Date.now() - t0;
  if (cls.status !== 'ok') return { ...base, ...cls, latencyMs };
  // 字符配额不是美元,塞进 balance(*Usd)会误导 —— 放 detail。
  const j = tryJson(r.body);
  const used = Number(j?.character_count);
  const limit = Number(j?.character_limit);
  const quota = Number.isFinite(used) && Number.isFinite(limit)
    ? ` · chars ${used}/${limit}${limit > 0 && used >= limit ? ' (exhausted)' : ''}`
    : '';
  const tier = typeof j?.tier === 'string' ? ` · tier ${j.tier}` : '';
  // 免费档不含商用授权 —— 频道要变现,这条得在体检页显性提示。
  const commercial = j?.tier === 'free' ? ' · free tier has no commercial licence' : '';
  return { ...base, status: 'ok', detail: `HTTP 200${tier}${quota}${commercial}`, latencyMs };
}

async function probeMinimaxH3(): Promise<ProviderHealth> {
  const raw = process.env.MINIMAX_H3_BASE_URL || process.env.MINIMAX_BASE_URL || 'https://api.minimax.io';
  const baseUrl = raw.replace(/\/+$/, '').replace(/\/v\d+$/, '');
  const base = { id: 'minimax-h3', label: 'MiniMax H3 (video)', kind: 'video' as ProviderKind, baseUrl };
  const key = process.env.MINIMAX_API_KEY;
  if (isPlaceholder(key)) return { ...base, status: 'not_configured', detail: 'MINIMAX_API_KEY not set' };
  if (process.env.ENABLE_MINIMAX_H3 === '0') {
    return { ...base, status: 'misconfigured', detail: 'key present but disabled by ENABLE_MINIMAX_H3=0' };
  }
  const t0 = Date.now();
  const r = await timedFetch(`${baseUrl}/v2/query/video_generation`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const latencyMs = Date.now() - t0;
  const j = tryJson(r.body);
  if (j?.error?.code === 2049 || /invalid api key/i.test(j?.error?.message || r.body || '')) {
    return { ...base, status: 'auth_error', detail: 'invalid api key — check MINIMAX_BASE_URL is api.minimax.io', latencyMs };
  }
  return { ...base, ...classifyHttp(r), latencyMs };
}

async function probeGateway(id: string, label: string, baseUrl: string, key?: string): Promise<ProviderHealth> {
  const base = { id, label, kind: 'gateway' as ProviderKind, baseUrl };
  if (isPlaceholder(key)) return { ...base, status: 'not_configured', detail: '未设置 API Key' };
  const auth = { Authorization: `Bearer ${key}` };
  const t0 = Date.now();
  const [models, sub, usage] = await Promise.all([
    timedFetch(`${baseUrl}/v1/models`, { headers: auth }),
    timedFetch(`${baseUrl}/v1/dashboard/billing/subscription`, { headers: auth }),
    timedFetch(`${baseUrl}/v1/dashboard/billing/usage?start_date=2020-01-01&end_date=2099-01-01`, { headers: auth }),
  ]);
  const cls = classifyHttp(models);
  const subJ = tryJson(sub.body);
  const usageJ = tryJson(usage.body);
  const balance = extractGatewayBalance(subJ, typeof usageJ?.total_usage === 'number' ? usageJ.total_usage : undefined);
  return { ...base, ...cls, balance, latencyMs: Date.now() - t0 };
}

/** 可选/未接入的 provider — 仅看 key 是否配置, 不打网络. */
function optionalProvider(id: string, label: string, kind: ProviderKind, key?: string): ProviderHealth | null {
  if (!isPlaceholder(key)) return null; // 已配置的会单独探测
  return { id, label, kind, status: 'not_configured', detail: '未接入 (可选)' };
}

export async function GET(request: NextRequest) {
  // v12.218(安全止血):此端点暴露所有 provider 的 baseUrl(含内部网关域名)/余额/密钥状态,不该匿名。
  const _g = requireUser(request);
  if (!_g.ok) return NextResponse.json({ message: _g.message }, { status: _g.status });
  const fresh = request.nextUrl.searchParams.get('fresh') === '1';
  if (!fresh && cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json({ ...cache.payload, cached: true });
  }

  // v6.9: vectorengine = 补全网关 (TTS/MJ/Kling). 探测用 VECTORENGINE_* (回退 KELING_*)
  const veBase = process.env.VECTORENGINE_BASE_URL || process.env.KELING_BASE_URL || 'https://api.vectorengine.ai';
  const veKey = process.env.VECTORENGINE_API_KEY || process.env.KELING_API_KEY || process.env.VEO_API_KEY;

  // v7.0: 三条 LLM 线 —— 通用(主网关) / 创意(编剧/导演) / MiniMax 全局兜底
  // ⚠️ 探针的 base/key 解析必须与 lib/config.ts 的 creativeBaseURL/creativeApiKey 同序,
  // 否则探针用错 key 会误报 auth_error(实际生成是好的)。两处都是 CREATIVE_* 优先。
  // 末位默认此前是 api.deepseek.com,而 lib/config.ts 是 api.openai.com —— 同序注释在,
  // 但默认值早已漂移,两处对"创意线打去哪"的说法能互相矛盾。以 config.ts 为准。
  const creativeBase = process.env.CREATIVE_BASE_URL || process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const creativeKey = process.env.CREATIVE_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const fbBase = process.env.LLM_FALLBACK_BASE_URL || 'https://api.minimaxi.com/v1';
  const fbKey = process.env.LLM_FALLBACK_API_KEY || process.env.MINIMAX_API_KEY;

  const probes = await Promise.all([
    probeChatLLM('primary-llm', `通用 LLM · ${process.env.OPENAI_MODEL || '?'}`, process.env.OPENAI_BASE_URL || 'https://api.minimaxi.com/v1', process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'claude-sonnet-4-6'),
    probeChatLLM('creative-llm', `创意 LLM · ${process.env.OPENAI_CREATIVE_MODEL || 'deepseek-v4-pro'} (编剧/导演)`, creativeBase, creativeKey, process.env.OPENAI_CREATIVE_MODEL || 'deepseek-v4-pro'),
    probeChatLLM('minimax-llm-fallback', `MiniMax LLM 兜底 · ${process.env.LLM_FALLBACK_MODEL || 'MiniMax-M2.7'}`, fbBase, fbKey, process.env.LLM_FALLBACK_MODEL || 'MiniMax-M2.7'),
    probeMinimaxTTS(),
    probeElevenLabs(),
    probeMinimaxH3(),
    probeGateway('qingyuntop', 'qingyuntop 网关 (Vidu/聚合视频)', process.env.QINGYUNTOP_BASE_URL || 'https://api.qingyuntop.top', process.env.QINGYUNTOP_API_KEY),
    probeGateway('vectorengine', 'vectorengine 网关 (补全: TTS/MJ/Kling/图像)', veBase, veKey),
  ]);

  // 未接入的可选 provider (仅提示)
  const optionals = [
    optionalProvider('midjourney', 'Midjourney (图像)', 'image', process.env.MJ_API_KEY),
    optionalProvider('fal-flux', 'fal / FLUX (图像一致性)', 'image', process.env.FAL_KEY),
    // elevenlabs 走上面的 probeElevenLabs(),不再走 optional(配了 key 就消失)
    optionalProvider('runway', 'Runway (视频)', 'video', process.env.RUNWAY_API_KEY),
  ].filter(Boolean) as ProviderHealth[];

  const providers = [...probes, ...optionals];
  const payload = {
    overall: overallHealth(probes), // 整体只看已配置的核心 provider
    checkedAt: new Date().toISOString(),
    providers,
  };
  cache = { at: Date.now(), payload };
  return NextResponse.json({ ...payload, cached: false });
}

/**
 * lib/engine-readiness (v10.1.2 · v10.5.1 分级扩展) — 媒体引擎「演示模式就绪度」归一(纯函数,可单测)。
 *
 * 背景:除口型(v10.1.0 已零配置)外,LLM/图像/视频/TTS 引擎均需 BYO key;没配时
 * 对应环节退化为模板/占位资产。本模块把"各引擎是否配了真实引擎"归一成:
 *   - 就绪度报告(engines + demoMode)—— v10.1.2 原有
 *   - v10.5.1「一把 key 分级」:level(none/script/visual/film/media-only)+
 *     levelLabel + 各创作环节真/占位明细(stages)—— 供「配置进度条」如实标注,
 *     UI 无一处虚假承诺(验收条款)。
 * 这里只做判定与文案,绝不碰密钥。
 */
export type EngineKind = 'llm' | 'image' | 'video' | 'tts' | 'lipsync';

export interface EngineState {
  kind: EngineKind;
  ready: boolean;
  label: string;
  /** 未就绪时,启用真实引擎要配置的 env 提示 */
  enableHint: string;
}

/**
 * 一把 key 分级:
 *   film       LLM+图像+视频 —— 全链真实成片
 *   visual     LLM+图像 —— 剧本+分镜图全真,视频示意
 *   script     仅 LLM —— 剧本/分镜规划/审计全真,画面示意
 *   media-only 有图像或视频但没 LLM —— 画面真,剧本走基础模板
 *   none       什么都没配 —— 全流程示意占位
 */
export type ReadinessLevel = 'none' | 'script' | 'visual' | 'film' | 'media-only';

export interface StageTruth {
  key: string;
  label: string;
  /** true = 该环节产出为真实内容;false = 模板/示意占位 */
  real: boolean;
  /** real=false 时,补齐该环节需要的引擎 */
  dependsOn: EngineKind | null;
}

export interface ReadinessReport {
  engines: EngineState[];
  /** 真实成片至少需要 图像 + 视频 引擎;缺任一 → 演示模式(产出占位/示意资产) */
  demoMode: boolean;
  readyCount: number;
  total: number;
  level: ReadinessLevel;
  levelLabel: string;
  stages: StageTruth[];
}

export type ReadinessLocale = 'en' | 'zh';

export function readinessLocale(locale?: string | null): ReadinessLocale {
  return locale && locale.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const META: Record<ReadinessLocale, Record<EngineKind, { label: string; enableHint: string }>> = {
  en: {
    llm: { label: 'Script LLM', enableHint: 'Set OPENAI_API_KEY (any OpenAI-compatible gateway)' },
    image: { label: 'Image generation', enableHint: 'Set MINIMAX_API_KEY / VIDU_API_KEY or another image engine' },
    video: { label: 'Video generation', enableHint: 'Set MINIMAX_API_KEY / VIDU_API_KEY / RUNWAY_API_KEY or another video engine' },
    tts: { label: 'Voice TTS', enableHint: 'Set a TTS key (MiniMax / ElevenLabs / …)' },
    lipsync: { label: 'Lip-sync', enableHint: 'Works locally (2D) with no key; set LIPSYNC_API_URL for a real engine' },
  },
  zh: {
    llm: { label: '剧本 LLM', enableHint: '配置 OPENAI_API_KEY(任意 OpenAI 兼容网关)' },
    image: { label: '图像生成', enableHint: '配置 MINIMAX_API_KEY / VIDU_API_KEY 等图像引擎' },
    video: { label: '视频生成', enableHint: '配置 MINIMAX_API_KEY / VIDU_API_KEY / RUNWAY_API_KEY 等视频引擎' },
    tts: { label: '配音 TTS', enableHint: '配置 TTS 引擎密钥(MiniMax / ElevenLabs 等)' },
    lipsync: { label: '口型渲染', enableHint: '已零配置可用(本地 2D);配 LIPSYNC_API_URL 可换真引擎' },
  },
};

// llm 放首位 —— 「一把 key」推荐的第一把就是它(剧本/分镜/审计立刻全真)
const KINDS: EngineKind[] = ['llm', 'image', 'video', 'tts', 'lipsync'];

const LEVEL_LABEL: Record<ReadinessLocale, Record<ReadinessLevel, string>> = {
  en: {
    none: 'No engines configured — the full pipeline uses placeholders (you can still browse demos)',
    script: 'Script / boards / pacing audit are real; pictures and video are placeholders',
    visual: 'Script + storyboard frames are real; shot video is a placeholder',
    film: 'Full pipeline is live — real finished film',
    'media-only': 'Picture/video engines are ready; script uses the basic template (add OPENAI_API_KEY for the full stack)',
  },
  zh: {
    none: '尚未配置引擎 —— 全流程为示意占位(可先逛演示工程)',
    script: '剧本 / 分镜规划 / 节奏审计全真;画面与视频为示意占位',
    visual: '剧本 + 分镜图全真;镜头视频为示意占位',
    film: '全链真实成片',
    'media-only': '画面/视频引擎已就绪;剧本走基础模板(配 OPENAI_API_KEY 即全真)',
  },
};

const STAGE_DEFS: Array<{ key: string; dependsOn: EngineKind | null }> = [
  { key: 'script', dependsOn: 'llm' },
  { key: 'storyboardPlan', dependsOn: 'llm' },
  { key: 'audit', dependsOn: 'llm' },
  { key: 'storyboardImage', dependsOn: 'image' },
  { key: 'shotVideo', dependsOn: 'video' },
  { key: 'tts', dependsOn: 'tts' },
  { key: 'lipsync', dependsOn: 'lipsync' },
  { key: 'assemble', dependsOn: null },
];

const STAGE_LABEL: Record<ReadinessLocale, Record<string, string>> = {
  en: {
    script: 'Script',
    storyboardPlan: 'Board plan',
    audit: 'Pacing / McKee audit',
    storyboardImage: 'Board render',
    shotVideo: 'Shot video',
    tts: 'Voiceover',
    lipsync: 'Lip-sync',
    assemble: 'Edit / assemble',
  },
  zh: {
    script: '剧本创作',
    storyboardPlan: '分镜规划',
    audit: '节奏/麦基审计',
    storyboardImage: '分镜图渲染',
    shotVideo: '镜头视频',
    tts: '配音',
    lipsync: '口型',
    assemble: '剪辑合成',
  },
};

/**
 * v12.76.0 存储就绪度(纯函数):local vs s3 决定「产物是否公网可达」——
 * 抠图参考图/跨镜产品一致性要喂外部图像/视频引擎,local(serve-file=localhost)引擎够不到,
 * 只有 S3(配齐 endpoint/bucket/keys)才真正解锁。之前这个坑只在代码注释里,用户看不到。
 */
export function computeStorageReadiness(env: NodeJS.ProcessEnv = process.env, locale?: string | null): {
  driver: 'local' | 's3';
  publicReachable: boolean;
  hint: string;
} {
  const loc = readinessLocale(locale);
  const wantS3 = env.STORAGE_DRIVER === 's3';
  const s3Complete = !!(env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
  if (wantS3 && s3Complete) {
    return {
      driver: 's3',
      publicReachable: true,
      hint: loc === 'zh'
        ? 'S3 已配齐,产物公网可达(抠图参考可喂外部引擎)'
        : 'S3 is configured — assets are publicly reachable (cutout refs can feed external engines)',
    };
  }
  if (wantS3 && !s3Complete) {
    return {
      driver: 'local',
      publicReachable: false,
      hint: loc === 'zh'
        ? 'STORAGE_DRIVER=s3 但 S3_* 未配齐,已降级 local;抠图参考仅本地可用'
        : 'STORAGE_DRIVER=s3 but S3_* is incomplete — fell back to local; cutout refs stay on this machine',
    };
  }
  return {
    driver: 'local',
    publicReachable: false,
    hint: loc === 'zh'
      ? 'local 存储:成片/UI 正常;抠图参考图喂外部引擎需配 S3(STORAGE_DRIVER=s3 + S3_*)'
      : 'Local storage: films/UI work; cutout refs for external engines need S3 (STORAGE_DRIVER=s3 + S3_*)',
  };
}

export function computeLevel(flags: Record<EngineKind, boolean>): ReadinessLevel {
  if (flags.llm && flags.image && flags.video) return 'film';
  if (flags.llm && flags.image) return 'visual';
  if (flags.llm) return 'script';
  if (flags.image || flags.video) return 'media-only';
  return 'none';
}

export function computeReadiness(flags: Record<EngineKind, boolean>, locale?: string | null): ReadinessReport {
  const loc = readinessLocale(locale);
  const meta = META[loc];
  const engines = KINDS.map<EngineState>((kind) => ({
    kind,
    ready: !!flags[kind],
    label: meta[kind].label,
    enableHint: meta[kind].enableHint,
  }));
  const readyCount = engines.filter((e) => e.ready).length;
  const demoMode = !(flags.image && flags.video);
  const level = computeLevel(flags);
  const stages = STAGE_DEFS.map<StageTruth>((s) => ({
    key: s.key,
    label: STAGE_LABEL[loc][s.key] || s.key,
    real: s.dependsOn ? !!flags[s.dependsOn] : true,
    dependsOn: s.dependsOn,
  }));
  return { engines, demoMode, readyCount, total: engines.length, level, levelLabel: LEVEL_LABEL[loc][level], stages };
}

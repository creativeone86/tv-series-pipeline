/**
 * Server-side API / pipeline strings.
 * UI chrome stays in lib/i18n.ts — this file is request-scoped and stays small.
 */
import { normalizeLocale, resolveLocaleFromHeader, t as uiT, type Locale } from './i18n';

export { type Locale };

/** Cookie (locale switcher) > x-locale header > Accept-Language > en. */
export function localeFromRequest(req: Request): Locale {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)qfmj-locale=([^;]+)/);
  if (m?.[1]) return normalizeLocale(decodeURIComponent(m[1]));
  const explicit = req.headers.get('x-locale') || req.headers.get('x-wind-locale');
  if (explicit) return normalizeLocale(explicit);
  return resolveLocaleFromHeader(req.headers.get('accept-language'));
}

type Dict = Record<string, string>;

const en: Dict = {
  missingCredentials: 'Missing credentials',
  loginTooMany: 'Too many sign-in attempts. Try again later.',
  invalidCredentials: 'Invalid credentials',
  registerMissing: 'Missing required fields',
  registerTooMany: 'Too many registration attempts. Try again later.',
  inviteRequiredBody: 'Beta access requires an invite code. You can apply on the waitlist.',
  emailTaken: 'This email is already registered',
  registerFailed: 'Registration failed. Please try again later.',

  ideaRequired: 'Please provide a story idea',
  loginRequired: 'Sign in to create',
  thinIdeaTooShort: 'The idea is only {n} characters — even a genre keyword needs at least 10 to form a complete intent.',
  thinIdeaNoGenre: 'The idea is {n} characters and no genre cue was detected. Generating now would produce placeholders.',
  thinIdeaHint: 'Add at least 30 characters of specifics: who the lead is, where/when, and what conflict they face. Or run a 1-shot preview first, then pick a story template.',

  sensitive: 'The prompt still hits a safety filter after an automatic rewrite. Please edit the description.',
  timeout: 'The upstream service timed out. Retry this step later.',
  network: 'Network error. Check your connection and retry this step.',
  invalidResponse: 'Unexpected upstream response. A fallback engine was selected.',
  engineUnavailable: 'This engine is unavailable. Check the API key configuration.',
  ffmpeg: 'Video compose failed. Check the assets and retry.',
  unknownError: 'Unknown error',
  projectCreateFailed: 'Could not create the project. Please retry.',
  directorPlanFailed: 'Director plan generation failed',
  scriptFailed: 'Script generation failed',

  imgGenFailed: '{model} image generation failed ({status})',
  imgNoUrl: '{model} returned no image URL',
  kontextFailed: 'flux.1-kontext-pro failed ({status})',
  kontextNoUrl: 'flux.1-kontext-pro returned no image URL',
  engineNotConfigured: '{engine} is not configured',

  planRequired: 'This feature needs the {required} plan or higher. You are on {current}.',
  budgetNone: 'No budget cap set',
  budgetHardReached: 'Monthly hard cap of ¥{hard} reached. Spending paused — raise your budget or go to billing.',
  budgetWouldExceed: 'This action (~¥{pending}) would exceed the hard cap of ¥{hard} (now ¥{spent}). Blocked.',
  budgetSoftOver: 'This action will hit the budget cap of ¥{cap} (projected ¥{projected}). Allowed, but watch spend.',
  budgetWarn: 'You have used {pct}% this month (¥{spent}/¥{cap}). Approaching budget.',
  budgetOk: 'Budget healthy (¥{spent}/¥{cap})',
  budgetExceeded: 'Monthly usage cap reached',

  agentDirector: 'Director',
  agentWriter: 'Writer',
  agentCharacter: 'Character Designer',
  agentScene: 'Scene Designer',
  agentStoryboard: 'Storyboard Artist',
  agentVideo: 'Video Producer',
  agentEditor: 'Editor',
  agentProducer: 'Producer',

  llmFallback: 'Primary LLM failed; continuing with {label}.',
  llmQuota: 'LLM quota exhausted. Cannot continue.',
  llmQuotaStatus: 'LLM API quota exhausted (primary + fallback failed)',
  llmTimeout: 'LLM timed out. Skipping this step...',
  llmError: 'LLM error: {msg}',
  llmMissingKey: 'OPENAI_API_KEY is not set. Using a basic template. Add an LLM key in .env.local and retry.',
  directorQuotaFallback: 'LLM quota is exhausted, so a full script cannot be generated. Top up the provider or change OPENAI_API_KEY. Continuing with a basic template (placeholder cast/scenes).',
  directorCallFailed: 'LLM call failed ({msg}). Continuing with a basic template (placeholder cast/scenes). Check OPENAI_API_KEY / OPENAI_BASE_URL.',

  taskDirectorPlan: 'Analyzing the idea and drafting a shoot plan',
  taskDirectorQuality: 'Checking quality bars and filling gaps',
  taskStyleBible: 'Rendering a Style Bible frame — locking the film look',
  taskDesignChars: 'Designing {n} character turnarounds',
  taskDesignChar: 'Designing {name} (turnaround)',
  taskDesignScenes: 'Designing {n} scenes',
  taskSceneDone: 'Finished {done}/{total} scenes',
  taskPlanBoards: 'Planning {n} storyboard descriptions',
  taskRenderBoards: 'Rendering {n} storyboard frames',
  taskRenderShot: 'Rendering shot {n} (character + look consistency)',
  taskMakeVideos: 'Producing {n} clips',
  taskMakeShot: 'Producing shot {n} ({provider})',
  taskExtractCover: 'Extracting keyframe covers...',
  taskReview100: 'Full 100-point review',
  taskPolishBoard: 'Polishing storyboard shot {n}',
  taskRegenVideo: 'Regenerating shot {n} video',
  taskRegenShot: 'Regenerating shot {n}',

  stSketchLock: 'Storyboard sketch lock on: composition sketch first, then locked-layout render',
  stSeriesAnchor: 'Series continuity: inheriting locked characters {names} (from episode {ep})',
  stLang: 'Script language: {lang}',
  stLangTtsDegrade: ' (voice degraded: subtitles / approximate timbre only)',
  stLensPack: 'Genre lens pack "{pack}" injected ({applied}; explicit picks unchanged)',
  stStyleRef: 'Multi-ref: style element anchored the film look (sref)',
  stSceneRefs: 'Multi-ref: {n} scene/prop elements attached as composition refs',
  stCharRef: 'Multi-ref: character element locked the lead (cref + DNA{extra})',
  stProductCutout: 'Product reference cut out — subject locked for cross-shot reuse',
  stResumeLoaded: '[Resume] Restored checkpoint assets: {summary}',
  stResumePlan: '[Resume] Director plan ready, skipped',
  stReplicaPlan: 'Replica: composing a director plan from the source structure (skipping creative director)...',
  stDirector: 'AI director is analyzing the idea...',
  stDirectorFallback: 'Director analysis failed; using a default plan...',
  stResumeBible: '[Resume] Style Bible ready, skipped',
  stStyleBible: 'Rendering Style Bible frame — locking the film look...',
  stResumeScript: '[Resume] Script ready, skipped',
  stReplicaScript: 'Replica: building the script from the source structure (skipping creative writer)...',
  stWriter: 'AI writer is drafting the script with McKee method...',
  stAdReplace: 'Ad compliance: replaced {n} banned phrases ({cats})',
  stAdCta: 'Added an ad CTA closer: "{cta}"',
  stWriterFallback: 'Writer failed; continuing to the next step...',
  stResumeChars: '[Resume] Characters ready (×{n}), skip redraw',
  stChars: 'AI character designer is drawing turnarounds...',
  stCharsSaved: 'Registered {n} new characters in the library',
  stCharsFallback: 'Character design failed; continuing...',
  stResumeScenes: '[Resume] Scenes ready (×{n}), skip redraw',
  stScenes: 'AI scene designer is painting concept art...',
  stScenesFallback: 'Scene design failed; continuing...',
  stParallel: 'Character and scene design starting in parallel...',
  stResumeBoardPlans: '[Resume] Storyboard plans ready (×{n}), skipped',
  stBoardPlans: 'AI storyboard artist is planning shot descriptions...',
  stBoardPlansFallback: 'Storyboard planning failed; continuing...',
  stResumeBoards: '[Resume] All storyboard frames rendered (×{n}), skipped',
  stResumeBoardsPartial: '[Resume] {done} frames already rendered; finishing {pending}',
  stBoards: 'AI storyboard artist is rendering frames (character + scene consistency)...',
  stBoardsFallback: 'Storyboard render failed; continuing with text boards...',
  stResumeVideos: '[Resume] All shot videos ready (×{n}), skipped',
  stResumeVideosPartial: '[Resume] {done} clips already exist; generating {pending} more',
  stVideos: 'AI video producer is generating clips ({provider}, {n} shots)...',
  stVideosFallback: 'Video generation failed; continuing...',
  stResumeEdit: '[Resume] Final cut already exists; skipping edit',
  stEdit: 'AI editor is assembling the film and scoring music...',
  stPublishWarn: 'Publish preflight: {issues}',
  stPublishOk: 'Publish preflight: Douyin / Xiaohongshu / Video Accounts hard checks passed',
  stEditFallback: 'Edit failed; continuing to review...',
  stSeriesUpdated: 'Series anchors updated ({n} characters for later episodes)',
  stResumeReview: '[Resume] Review ready, skipped',
  stReview: 'AI producer is running a 100-point review...',
  stReviewFallback: 'Producer review failed...',
  stReviewRetry: 'Director review failed; auto-optimizing...',
  stReview2: 'AI director is running a second review...',
};

const zhCN: Dict = {
  missingCredentials: '缺少登录信息',
  loginTooMany: '登录尝试过于频繁,请稍后再试',
  invalidCredentials: '邮箱或密码不正确',
  registerMissing: '缺少必填字段',
  registerTooMany: '注册过于频繁,请稍后再试',
  inviteRequiredBody: 'Beta 版需要邀请码才能注册，可在首页申请 waitlist',
  emailTaken: '该邮箱已被注册',
  registerFailed: '注册失败，请稍后重试',

  ideaRequired: '请提供故事创意',
  loginRequired: '创作需要登录',
  thinIdeaTooShort: '创意只有 {n} 字 — 即使是题材关键词也至少需要 10 字才能构成完整意图',
  thinIdeaNoGenre: '创意 {n} 字且没识别出题材线索, 直接生成会得到占位内容',
  thinIdeaHint: '建议补充至少 30 字的具体设定: 主角是谁, 在什么时空, 面对什么冲突. 或者先试拍 1 镜, 选个故事模板补足设定再开机.',

  sensitive: '内容含敏感词,已自动改写但仍被拦截,请手动调整描述',
  timeout: '上游服务响应超时,请稍后重试此步',
  network: '网络异常,请检查连接后重试此步',
  invalidResponse: '上游返回格式异常,已自动切换备用引擎',
  engineUnavailable: '该引擎不可用,请检查 API Key 配置',
  ffmpeg: '视频合成失败,请检查素材完整性后重试',
  unknownError: '未知错误',
  projectCreateFailed: '项目创建失败，请重试',
  directorPlanFailed: '导演计划生成失败',
  scriptFailed: '剧本生成失败',

  imgGenFailed: '{model} 图像生成失败 ({status})',
  imgNoUrl: '{model} 未返回图像 URL',
  kontextFailed: 'flux.1-kontext-pro 失败 ({status})',
  kontextNoUrl: 'flux.1-kontext-pro 未返回图像 URL',
  engineNotConfigured: '{engine} 引擎未配置',

  planRequired: '本功能需要 {required} 档及以上, 你当前是 {current}',
  budgetNone: '未设预算上限',
  budgetHardReached: '本月已达硬上限 ¥{hard},已暂停消耗,请调高预算或前往计费',
  budgetWouldExceed: '本次预估 ¥{pending} 将越过硬上限 ¥{hard}(当前 ¥{spent}),已拦截',
  budgetSoftOver: '本次将触及预算上限 ¥{cap}(预计 ¥{projected}),仍放行但请留意',
  budgetWarn: '本月已用 {pct}%(¥{spent}/¥{cap}),接近预算',
  budgetOk: '预算健康(¥{spent}/¥{cap})',
  budgetExceeded: '已达本月用量上限',

  agentDirector: '张导',
  agentWriter: '李编剧',
  agentCharacter: '王设计师',
  agentScene: '陈场景师',
  agentStoryboard: '赵分镜师',
  agentVideo: '孙制作',
  agentEditor: '周剪辑',
  agentProducer: '钱制片',

  llmFallback: '主 LLM 异常,已自动兜底到 {label} 继续',
  llmQuota: '❌ LLM 余额不足,无法继续创作。',
  llmQuotaStatus: '⚠️ LLM API 余额不足 (主+兜底均失败)',
  llmTimeout: 'LLM 响应超时,跳过此步骤...',
  llmError: 'LLM 出错: {msg}',
  llmMissingKey: '⚠️ 未配置 OPENAI_API_KEY,使用基础模板生成。请在 .env.local 配置 LLM 后重试。',
  directorQuotaFallback: '⚠️ LLM 余额/quota 不足,无法生成完整剧本。请去 vectorengine 后台充值后重试,或换 OPENAI_API_KEY。当前先按基础模板继续,角色/场景为占位内容。',
  directorCallFailed: '⚠️ LLM 调用失败({msg}),按基础模板继续,角色/场景为占位内容。建议检查 OPENAI_API_KEY / OPENAI_BASE_URL 后重试。',

  taskDirectorPlan: '分析创意，制定拍摄计划',
  taskDirectorQuality: '检查质量标准，补充不足内容',
  taskStyleBible: '渲染 Style Bible 帧 — 锁定全片视觉锚点',
  taskDesignChars: '设计 {n} 个角色三视图',
  taskDesignChar: '设计角色：{name}（三视图）',
  taskDesignScenes: '设计 {n} 个场景',
  taskSceneDone: '已完成 {done}/{total} 个场景',
  taskPlanBoards: '规划 {n} 个分镜描述',
  taskRenderBoards: '统一渲染 {n} 个分镜图',
  taskRenderShot: '渲染第 {n} 镜（角色一致性 + 画风一致性）',
  taskMakeVideos: '制作 {n} 个视频',
  taskMakeShot: '制作第 {n} 镜视频（{provider}）',
  taskExtractCover: '提取关键帧封面图...',
  taskReview100: '100分制全面审核',
  taskPolishBoard: '优化第 {n} 镜分镜',
  taskRegenVideo: '重新生成第 {n} 镜视频',
  taskRegenShot: '重新生成第 {n} 镜',

  stSketchLock: '📐 分镜草图锁已开启:每镜先出构图草图,再按草图锁构图渲染',
  stSeriesAnchor: '🔗 跨集一致性:继承系列角色锚 {names}(来自第 {ep} 集)',
  stLang: '🌐 剧本语言:{lang}',
  stLangTtsDegrade: '(配音降级:仅字幕/近似音色)',
  stLensPack: '🎬 题材镜头包「{pack}」已注入({applied};显式选择不受影响)',
  stStyleRef: '多参:风格元素已锚定整片画风 (sref)',
  stSceneRefs: '多参:{n} 个场景/道具元素已挂为构图参考',
  stCharRef: '多参:角色元素已锁主角 (cref + DNA{extra})',
  stProductCutout: '产品参考图已抠净背景 → 锁主体跨镜复用保一致',
  stResumeLoaded: '[续跑] 已装载断点产物:{summary}',
  stResumePlan: '[续跑] 导演计划已就绪,跳过',
  stReplicaPlan: '拉片复刻:按原片结构合成导演计划(跳过创意导演)...',
  stDirector: 'AI 导演正在分析创意...',
  stDirectorFallback: '导演分析出错，使用默认计划...',
  stResumeBible: '[续跑] Style Bible 已就绪,跳过',
  stStyleBible: '渲染 Style Bible 帧 — 锁定全片画风...',
  stResumeScript: '[续跑] 剧本已就绪,跳过',
  stReplicaScript: '拉片复刻:按原片结构构建脚本(跳过创意编剧)...',
  stWriter: 'AI 编剧正在运用麦基方法论创作剧本...',
  stAdReplace: '⚖️ 广告合规:已替换 {n} 处违禁用语({cats})',
  stAdCta: '📣 已为广告补 CTA 收尾:「{cta}」',
  stWriterFallback: '编剧创作出错，继续下一步...',
  stResumeChars: '[续跑] 角色已就绪(×{n}),跳过重绘',
  stChars: 'AI 角色设计师正在绘制角色三视图...',
  stCharsSaved: '已把 {n} 个新角色登记到角色库',
  stCharsFallback: '角色设计出错，继续下一步...',
  stResumeScenes: '[续跑] 场景已就绪(×{n}),跳过重绘',
  stScenes: 'AI 场景设计师正在设计场景概念图...',
  stScenesFallback: '场景设计出错，继续下一步...',
  stParallel: '🚀 角色与场景设计并行启动...',
  stResumeBoardPlans: '[续跑] 分镜规划已就绪(×{n}),跳过',
  stBoardPlans: 'AI 分镜师正在规划分镜描述...',
  stBoardPlansFallback: '分镜规划出错，继续下一步...',
  stResumeBoards: '[续跑] 分镜图已全部渲染(×{n}),跳过',
  stResumeBoardsPartial: '[续跑] 已有 {done} 镜分镜图,补渲染 {pending} 镜',
  stBoards: 'AI 分镜师正在渲染分镜图（角色+场景一致性）...',
  stBoardsFallback: '分镜图渲染出错，使用文本分镜继续...',
  stResumeVideos: '[续跑] 镜头视频已全部生成(×{n}),跳过',
  stResumeVideosPartial: '[续跑] 已有 {done} 镜视频,补生成 {pending} 镜',
  stVideos: 'AI 视频制作正在逐条生成视频（{provider}，共 {n} 个镜头）...',
  stVideosFallback: '视频生成出错，继续下一步...',
  stResumeEdit: '[续跑] 已有成片,跳过剪辑合成',
  stEdit: 'AI 剪辑师正在剪辑合成完整视频并生成配乐...',
  stPublishWarn: '⚠️ 发布预检:{issues}',
  stPublishOk: '✅ 发布预检:抖音/小红书/视频号 三平台硬指标全过',
  stEditFallback: '剪辑出错，继续审核...',
  stSeriesUpdated: '🔗 系列锚点已更新(角色 {n} 位,供后续集继承)',
  stResumeReview: '[续跑] 审核结论已就绪,跳过',
  stReview: 'AI 制片人正在进行100分制全面审核...',
  stReviewFallback: '制片人审核出错...',
  stReviewRetry: '导演审核未通过，正在自动优化...',
  stReview2: 'AI 导演正在进行二次审核...',
};

const zhTW: Dict = {
  ...zhCN,
  missingCredentials: '缺少登入資訊',
  loginTooMany: '登入嘗試過於頻繁，請稍後再試',
  invalidCredentials: '郵箱或密碼不正確',
  registerMissing: '缺少必填欄位',
  registerTooMany: '註冊過於頻繁，請稍後再試',
  inviteRequiredBody: 'Beta 版需要邀請碼才能註冊，可在首頁申請 waitlist',
  emailTaken: '此郵箱已被註冊',
  registerFailed: '註冊失敗，請稍後再試',
  ideaRequired: '請提供故事創意',
  loginRequired: '創作需要登入',
  planRequired: '本功能需要 {required} 檔及以上，你目前是 {current}',
  budgetExceeded: '已達本月用量上限',
};

const TABLES: Record<string, Dict> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function apiT(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const table = TABLES[locale] || en;
  let s = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

const INVITE_KEY: Record<string, string> = {
  NOT_FOUND: 'auth.inviteNotFound',
  ALREADY_USED: 'auth.inviteUsed',
  EXPIRED: 'auth.inviteExpired',
  REVOKED: 'auth.inviteRevoked',
  INVALID: 'auth.inviteInvalid',
};

export function authInviteMessage(locale: Locale, code: string): string {
  return uiT(locale, INVITE_KEY[code] || 'auth.inviteGenericInvalid');
}

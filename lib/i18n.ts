// 国际化 (i18n) 基础设施

export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'ru'; // v12.186:ko/ru 就位(文案先以 en 兜底渐进补)

/** Nested optional so zhTW/ja/ko/ru can omit new keys; getTranslations deep-merges en. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface Translations {
  collab: {
    notifTitle: string; markAllRead: string; justNow: string; mentioned: string; replied: string; notifEmpty: string; loginPrompt: string;
    reply: string; deleted: string; commentPlaceholder: string; commentEmpty: string; send: string; confirmDelete: string;
    demoMode: string; demoEnginesOff: string; demoPlaceholder: string; demoLipsyncReady: string; demoHowToEnable: string; demoImage: string; demoVideo: string;
    readinessTitle: string; readinessReal: string; readinessSim: string;
  };
  common: {
    create: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    share: string;
    download: string;
    loading: string;
    error: string;
    success: string;
    viewAll: string;
    backHome: string;
    saveChanges: string;
    saving: string;
    reset: string;
  };
  brand: {
    studio: string;
  };
  nav: {
    home: string;
    projects: string;
    create: string;
    pricing: string;
    profile: string;
    settings: string;
    polish: string;
    workbench: string;
    cases: string;
    userCenter: string;
    newProject: string;
  };
  auth: {
    brand: string;
    welcomeBack: string;
    createAccount: string;
    loginSubtitle: string;
    registerSubtitle: string;
    username: string;
    usernamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    demoHint: string;
    login: string;
    register: string;
    loginSuccess: string;
    registerSuccess: string;
    actionFailed: string;
    noAccount: string;
    hasAccount: string;
    registerNow: string;
    loginNow: string;
    inviteCode: string;
    inviteRequired: string;
    inviteNotFound: string;
    inviteUsed: string;
    inviteExpired: string;
    inviteRevoked: string;
    inviteInvalid: string;
    inviteGenericInvalid: string;
    inviteValid: string;
    inviteChecking: string;
    inviteValidateFailed: string;
    noInvite: string;
    applyBeta: string;
    waitlistTitle: string;
    waitlistDesc: string;
    waitlistPurpose: string;
    waitlistPurposePlaceholder: string;
    waitlistSubmit: string;
    waitlistSubmitting: string;
    waitlistDefaultOk: string;
    waitlistSubmitFailed: string;
    waitlistNetworkError: string;
  };
  sidebar: {
    overview: string;
    myProjects: string;
    workshop: string;
    shortVideo: string;
    storyIntake: string;
    series: string;
    polish: string;
    u2v: string;
    mv: string;
    comic: string;
    editChat: string;
    assets: string;
    characters: string;
    ipMarket: string;
    workflows: string;
    masterPrompt: string;
    styles: string;
    cases: string;
    templates: string;
    account: string;
    team: string;
    health: string;
    usage: string;
    jobs: string;
    billing: string;
    logout: string;
    expand: string;
    collapse: string;
    backHome: string;
  };
  errors: {
    title: string;
    description: string;
    retry: string;
    backHome: string;
    pageTitle: string;
    unknown: string;
    backWorkbench: string;
    loading: string;
  };
  dashProjects: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newCreate: string;
    filterAll: string;
    filterActive: string;
    filterCompleted: string;
    filterDraft: string;
    filterArchived: string;
    emptyAll: string;
    emptyFiltered: string;
    emptyHint: string;
    startCreate: string;
    importing: string;
    importDemo: string;
    importDemoHint: string;
    untitled: string;
    deleteConfirm: string;
    restoreTitle: string;
    archiveTitle: string;
    deleteTitle: string;
    shotsUnit: string;
    polished: string;
    polishBtn: string;
    polishTitle: string;
    statusCompleted: string;
    statusActive: string;
    statusDraft: string;
    statusArchived: string;
  };
  dashBanner: {
    title: string;
    itemsUnit: string;
    autoFallback: string;
    billingLink: string;
    dismiss: string;
    exhausted: string;
    saturated: string;
    rateLimited: string;
    authFailed: string;
    modelUnavailable: string;
    kling: string;
    qingyuntop: string;
  };
  continueCard: {
    eyebrow: string;
    statusActive: string;
    statusDraft: string;
    statusCompleted: string;
    draftReadyLabel: string;
    draftReadyHint: string;
    draftEmptyLabel: string;
    draftEmptyHint: string;
    activeLabel: string;
    activeHint: string;
    completedLabel: string;
    completedHint: string;
    openLabel: string;
    openHint: string;
  };
  product: {
    director: string;
    writer: string;
    characterDesign: string;
    sceneDesign: string;
    storyboard: string;
    videoGen: string;
    editor: string;
    producer: string;
    untitled: string;
    creating: string;
    collapseChat: string;
    expandChat: string;
    timeline: string;
    shotsUnit: string;
    generating: string;
    pending: string;
    shotN: string;
    tabDirector: string;
    tabScript: string;
    tabCharacters: string;
    tabScenes: string;
    tabStoryboard: string;
    tabContinuity: string;
    tabVideos: string;
    tabWorkshop: string;
    tabTimeline: string;
    tabPacing: string;
    tabPullsheet: string;
    tabVision: string;
    tabOneclick: string;
    tabMonitor: string;
    tabParam: string;
    tabComments: string;
    tabDistribution: string;
    tabPlay: string;
    groupCreate: string;
    groupRefine: string;
    groupReview: string;
    groupDeliver: string;
    statShots: string;
    statCast: string;
    statScore: string;
    statStatus: string;
    statusDone: string;
    statusMaking: string;
    emptyCharacters: string;
    emptyScenes: string;
    emptyVideos: string;
    saved: string;
    undone: string;
    nothingToUndo: string;
    hotkeys: string;
    hotkeysDesc: string;
    videoPreview: string;
    openNewWindow: string;
    close: string;
    videoLoadFail: string;
    dropUploading: string;
    dropFailed: string;
    dropRetry: string;
    dropHint: string;
    dropHintSub: string;
    dropHere: string;
    phasePlan: string;
    phaseScript: string;
    phaseCharacters: string;
    phaseScenes: string;
    phaseStoryboardPlans: string;
    phaseStoryboards: string;
    phaseVideo: string;
    phasePacing: string;
    phaseEdit: string;
    phaseReview: string;
    phaseComplete: string;
  };
  create: {
    badge: string;
    title: string;
    subtitle: string;
    ideaLabel: string;
    ideaPlaceholder: string;
    videoProviderLabel: string;
    startButton: string;
  };
  projects: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterCompleted: string;
    filterCreating: string;
    filterFailed: string;
    noResults: string;
    createNew: string;
    shotsUnit: string;
  };
  dashboard: {
    systemOnline: string;
    title: string;
    subtitle: string;
    quickStartTitle: string;
    quickStartSubtitle: string;
    statProjects: string;
    statProjectsSub: string;
    statGenerations: string;
    statGenerationsSub: string;
    statCases: string;
    statCasesSub: string;
    recentCreations: string;
    noRecords: string;
    startFirst: string;
    systemStatus: string;
    recentActivity: string;
    statusCompleted: string;
    statusCreating: string;
    statusDraft: string;
  };
  settings: {
    title: string;
    subtitle: string;
    general: string;
    generalDesc: string;
    language: string;
    appearance: string;
    appearanceDesc: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    themeAuto: string;
    notifications: string;
    notificationsDesc: string;
    projectDone: string;
    projectDoneDesc: string;
    performance: string;
    performanceDesc: string;
    videoQuality: string;
    qualityHigh: string;
    qualityMedium: string;
    qualityLow: string;
    privacy: string;
    privacyDesc: string;
    changePassword: string;
    enable2fa: string;
    manageDevices: string;
    billing: string;
    billingDesc: string;
    freePlan: string;
    currentPlan: string;
    freeQuota: string;
    upgradePro: string;
    saved: string;
    savedDesc: string;
    resetDone: string;
  };
  profile: {
    title: string;
    subtitle: string;
    avatar: string;
    uploadAvatar: string;
    basicInfo: string;
    basicInfoDesc: string;
    username: string;
    email: string;
    bio: string;
    bioPlaceholder: string;
    stats: string;
    totalProjects: string;
    inProgress: string;
    totalShots: string;
    saveSuccess: string;
    saveSuccessDesc: string;
    role: string;
    accountPrefs: string;
    visualPref: string;
    collabSpace: string;
  };
  billing: {
    title: string;
    currentTier: string;
    paymentNote: string;
    recommended: string;
    currentBadge: string;
    contactUs: string;
    perMonth: string;
    alreadyThis: string;
    freeNoPurchase: string;
    businessTalk: string;
    upgradeTo: string;
    portalNote: string;
    openPortal: string;
    checkoutFailed: string;
    paymentCanceled: string;
    upgradedPrefix: string;
    upgradedSuffix: string;
  };
  cases: {
    title: string;
    titlePublic: string;
    subtitle: string;
    subtitleReuse: string;
    copyPrompt: string;
    copied: string;
    usePrompt: string;
  };
  home: {
    heroTagline1: string;
    heroTagline2: string;
    heroCtaCreate: string;
    heroCtaCases: string;
    heroEngines: string;
    featureTitle: string;
    featureSubtitle: string;
    agentsTitle: string;
    agentsSubtitle: string;
    lensCaption: string;
    lensTitle: string;
    lensDesc: string;
    frameTitle: string;
    frameSubtitle: string;
    frameSteps: { title: string; desc: string }[];
    frameCta: string;
    vibeKicker: string;
    vibeTitle: string;
    vibeDesc: string;
    casesTitle: string;
    casesSubtitle: string;
    casesTryNow: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaButton: string;
  };
  pricing: {
    enterWorkbench: string;
    badge: string;
    titleLead: string;
    titleHighlight: string;
    subtitle: string;
    custom: string;
    customNote: string;
    free: string;
    startUsing: string;
    apiAccess: string;
    commercialLicense: string;
    footnote: string;
    faqTitle: string;
    faq: { q: string; a: string }[];
    moreTitle: string;
    moreDesc: string;
    contactSupport: string;
    alertPayment: string;
  };
  help: {
    examples: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    quickGuides: string;
    guides: { title: string; description: string }[];
    faqTitle: string;
    faqs: { q: string; a: string }[];
    moreTitle: string;
    moreDesc: string;
    sendEmail: string;
    liveChat: string;
  };
  examples: {
    title: string;
    subtitle: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaButton: string;
  };

  visionAudit: {
    verdictExcellent: string;
    verdictGood: string;
    verdictNeedsWork: string;
    verdictPoor: string;
    noDataMessage: string;
    panelTitle: string;
    avgScore: string;
    shotUnit: string;
    passLabel: string;
    warnLabel: string;
    failLabel: string;
    weakestShotsTitle: string;
    rebirthPlanPrefix: string;
    rebirthPlanSuffix: string;
    reshootButton: string;
    dimScene: string;
    dimAction: string;
    dimMood: string;
    dimComposition: string;
  };
  usagePage: {
    eyebrow: string;
    headline: string;
    budgetLabel: string;
    budgetPlaceholder: string;
    nearDays: string;
    daySuffix: string;
    daysCostSuffix: string;
    refreshTitle: string;
    loading: string;
    loadFailed: string;
    activeAlertsBanner: string;
    goBilling: string;
    statusOk: string;
    statusWarn: string;
    statusOver: string;
    statusNone: string;
    alertExhausted: string;
    alertSaturated: string;
    alertRateLimited: string;
    alertAuthFailed: string;
    alertModelUnavailable: string;
    thisMonthBudget: string;
    quotaTitle: string;
    quotaUnlimited: string;
    quotaExceeded: string;
    quotaNearLimit: string;
    quotaOfCeiling: string;
    projectedEndPrefix: string;
    noCapSuffix: string;
    statGenerations: string;
    statEngines: string;
    engineCostPrefix: string;
    engineNoData: string;
    dailyTrendTitle: string;
    dailyNoData: string;
    countSuffix: string;
  };
  healthPage: {
    title: string;
    subtitle: string;
    refreshBtn: string;
    loadFailed: string;
    kindLlm: string;
    kindTts: string;
    kindVideo: string;
    kindImage: string;
    kindGateway: string;
    overallHealthy: string;
    overallWarning: string;
    overallCritical: string;
    balanceUsed: string;
    balanceAbundant: string;
    balanceRemaining: string;
    balanceLimit: string;
    radarTitle: string;
    radarDesc: string;
    scanBtn: string;
    upgradeBtn: string;
    statusUpgradable: string;
    statusUpToDate: string;
    statusFamilyN: string;
    statusSourceUnavail: string;
    overridesTitle: string;
    rollbackBtn: string;
    rollbackDefault: string;
    checkedAt: string;
    cachedNote: string;
    footer: string;
    scanFailed: string;
    upgradeFailed: string;
    upgradeFailedLogin: string;
    upgradeNone: string;
    upgradedSummary: string;
    upgradeSkippedNote: string;
    upgradeSomeSkipped: string;
    rolledBack: string;
  };
  seriesDetail: {
    statusDraft: string;
    statusActive: string;
    statusCompleted: string;
    statusFailed: string;
    backLink: string;
    pageTitle: string;
    statTotal: string;
    statCompleted: string;
    statGenerating: string;
    statFailed: string;
    statPending: string;
    batchGenerateBtn: string;
    batchGeneratePendingHint: string;
    regenerateAll: string;
    seasonAssetsTitle: string;
    seasonCoverAlt: string;
    genCoverBtn: string;
    regenCoverBtn: string;
    exportSeasonBtn: string;
    reexportSeasonBtn: string;
    exportFirstEpisodeHint: string;
    watchSeasonVideo: string;
    seasonVideoDesc: string;
    seasonFixBusyLabel: string;
    seasonFixLabel: string;
    seasonFixProgressMsg: string;
    seasonFixDoneMsg: string;
    resumeStuckBtn: string;
    loading: string;
    noEpisodes: string;
    episodeLabel: string;
    healthCheckAllGreen: string;
    shotsDowngradedLabel: string;
    openEpisodeLink: string;
    loadFailStatus: string;
    loadFailNetwork: string;
    requestFailed: string;
    exportingSeasonMsg: string;
    exportCanceledMsg: string;
    exportFailedStatus: string;
    exportDoneMsg: string;
    coverGeneratingMsg: string;
    coverFailedStatus: string;
    coverDoneMsg: string;
    resumeCheckedMsg: string;
    resumeFailedMsg: string;
    resumeFailStatus: string;
    batchQueuedMsg: string;
    batchStartedMsg: string;
    noPendingEpisodes: string;
    healthGateIssuePrefix: string;
    healthGateEpisodeDetail: string;
    healthGateConfirmHint: string;
    dramaPackageBtn: string;
    dramaPackageFetching: string;
    dramaPackageTitle: string;
    dramaPackageDownload: string;
    dramaPackageCoverAlt: string;
    dramaPackageLangEpisodes: string;
    dramaPackageTotalMin: string;
    dramaPackageEpFree: string;
    dramaPackageEpCoins: string;
    dramaPackageGuideTitle: string;
    dramaPackageErrPrefix: string;
    dramaPackageNetworkErr: string;
    dramaPackageViewVideo: string;
    dramaPackageAiDeclaration: string;
    dramaPackageAiRequiredHint: string;
  };
  workshop: {
    poeticMist: string;
    poeticMistDesc: string;
    neoNoir: string;
    neoNoirDesc: string;
    inkWash: string;
    inkWashDesc: string;
    dreamwave: string;
    dreamwaveDesc: string;
    cyberNeon: string;
    cyberNeonDesc: string;
    anime3d: string;
    anime3dDesc: string;
    cinematic: string;
    cinematicDesc: string;
    ghibli: string;
    ghibliDesc: string;
    americanComic: string;
    americanComicDesc: string;
    mihoyoGame: string;
    mihoyoGameDesc: string;
    wushanInk: string;
    wushanInkDesc: string;
    haitangEthereal: string;
    haitangEtherealDesc: string;
    ideaCyberpunkTitle: string;
    ideaCyberpunkContent: string;
    ideaPalaceTitle: string;
    ideaPalaceContent: string;
    ideaWastelandTitle: string;
    ideaWastelandContent: string;
    ideaMagicTitle: string;
    ideaMagicContent: string;
    urlExtractFailed: string;
    invalidInput: string;
    draftAdopted: string;
    chatReceivedIdea: string;
    createFailed: string;
    streamReadFailed: string;
    currentImage: string;
    assetSceneN: string;
    chatPlanReady: string;
    chatScriptDone: string;
    chatCharsDone: string;
    chatScenesDone: string;
    chatBoardsPlanned: string;
    assetSketchN: string;
    chatBoardsDone: string;
    assetVideoN: string;
    chatVideosDone: string;
    chatContinuityIssues: string;
    chatContinuityMore: string;
    chatEditDone: string;
    chatReviewDone: string;
    chatReviewItems: string;
    chatReviewNone: string;
    chatReviewPass: string;
    chatReviewFail: string;
    chatComplete: string;
    stepFailed: string;
    stageLabel: string;
    retryShot: string;
    createError: string;
    retryCurrentStep: string;
    previewSeeded: string;
    slateNotes: string;
    createModeAria: string;
    modeSimple: string;
    modePro: string;
    previewShot: string;
    previewShotTitle: string;
    needTenChars: string;
    enterWorkshop: string;
    rollReady: string;
    awaitingIdea: string;
    noInspiration: string;
    noInspirationTitle: string;
    act1: string;
    act2: string;
    act3: string;
    urlPlaceholder: string;
    extracting: string;
    extract: string;
    scriptEyebrow: string;
    ideaPlaceholder: string;
    templateNeedIdea: string;
    templateNamePrompt: string;
    templateNameDefault: string;
    templateDesc: string;
    customTemplateHint: string;
    templateSaveFailed: string;
    templateSaved: string;
    lookEyebrow: string;
    durationEyebrow: string;
    aspectEyebrow: string;
    engineEyebrow: string;
    klingLabel: string;
    klingSub: string;
    editStyleTitle: string;
    editStyleDefault: string;
    editStyleFast: string;
    editStyleSlow: string;
    editStylePlaceholder: string;
    scriptLanguageLabel: string;
    sketchLockTitle: string;
    sketchLockBadge: string;
    sketchLockDesc: string;
    styleApplied: string;
    draftsEyebrow: string;
    draftDirect: string;
    draftCompare: string;
    draftDirectTitle: string;
    draftCompareTitle: string;
    draftCompareHint: string;
    readoutEyebrow: string;
    previewEyebrow: string;
    inspirationEyebrow: string;
    modeEpisodic: string;
    modeEpisodicDesc: string;
    modeEpisodicF1: string;
    modeEpisodicF2: string;
    modeEpisodicF3: string;
    modeEpisodicEst: string;
    modeEpisodicFor: string;
    modeMv: string;
    modeMvDesc: string;
    modeMvF1: string;
    modeMvF2: string;
    modeMvF3: string;
    modeMvEst: string;
    modeMvFor: string;
    modeQuick: string;
    modeQuickDesc: string;
    modeQuickF1: string;
    modeQuickF2: string;
    modeQuickF3: string;
    modeQuickEst: string;
    modeQuickFor: string;
    modeComic: string;
    modeComicDesc: string;
    modeComicF1: string;
    modeComicF2: string;
    modeComicF3: string;
    modeComicEst: string;
    modeComicFor: string;
    modeIp: string;
    modeIpDesc: string;
    modeIpF1: string;
    modeIpF2: string;
    modeIpF3: string;
    modeIpEst: string;
    modeIpFor: string;
    resolutionTitle: string;
    resolutionHint: string;
    tier360Desc: string;
    tier480Desc: string;
    tierRecommended: string;
    tier720Desc: string;
    estimated: string;
    aspectTitle: string;
    aspectLocked: string;
    aspectLandscape: string;
    aspectPortrait: string;
    aspectSquare: string;
    styleTabAll: string;
    styleTabPopular: string;
    styleTabRealistic: string;
    styleTabAnime: string;
    styleTabArtistic: string;
    styleTabRetro: string;
    styleTabExperimental: string;
    styleSearch: string;
    styleEmpty: string;
    styleClear: string;
    selectStyle: string;
    engineSeedance: string;
    wizardStepMode: string;
    wizardStepModeDesc: string;
    wizardStepStyle: string;
    wizardStepStyleDesc: string;
    wizardStepAssets: string;
    wizardStepAssetsDesc: string;
    wizardStepDetails: string;
    wizardStepDetailsDesc: string;
    wizardStepReview: string;
    wizardStepReviewDesc: string;
    wizardPrev: string;
    wizardNext: string;
    wizardSubmitting: string;
    wizardLaunch: string;
    wizardTitleLabel: string;
    wizardTitlePlaceholder: string;
    wizardPromptLabel: string;
    wizardPromptPlaceholder: string;
    wizardPromptHint: string;
    wizardDurationLabel: string;
    wizardUnset: string;
    wizardUnfilled: string;
    wizardStylePreset: string;
    wizardGlobalAssets: string;
    wizardAssetsPicked: string;
    wizardNonePicked: string;
    wizardResAspect: string;
    wizardDurationShort: string;
    wizardPromptPreview: string;
    wizardEmpty: string;
  };
  workshopCreate: {
    searchPlaceholder: string;
    cloneNameSuffix: string;
    cloneFailed: string;
    deletePersonalConfirm: string;
    importInvalidSchema: string;
    importMissingName: string;
    importNameSuffix: string;
    importFailed: string;
    importSuccess: string;
    importParseFailed: string;
    importParseFailedWith: string;
    shareLinkFailed: string;
    shareExpiresOn: string;
    shareForever: string;
    shareCopied: string;
    shareManual: string;
    templateLibraryTitle: string;
    templateCounts: string;
    filterByTags: string;
    filter: string;
    filterAndHint: string;
    clearFilters: string;
    sort: string;
    sortDefault: string;
    sortPersonalFirst: string;
    sortBuiltinFirst: string;
    saveAsTemplateHint: string;
    saveAsTemplate: string;
    importJsonHint: string;
    importJson: string;
    noMatchingTemplates: string;
    tryClearSearch: string;
    tryClearFilter: string;
    expandDetails: string;
    details: string;
    cloneAsMine: string;
    clone: string;
    saveToMyLibrary: string;
    shareHint: string;
    linkExpiry: string;
    expiry1Day: string;
    expiry7Days: string;
    expiry30Days: string;
    expiryForever: string;
    expiryNote: string;
    exportJsonHint: string;
    loadingPersonal: string;
    cameoLockTitle: string;
    cameoLockHeading: string;
    cameoLockOptional: string;
    cameoLockHint: string;
    cameoLockHintShort: string;
    pickFromLibrary: string;
    loadingLibrary: string;
    libraryEmpty: string;
    pickNamed: string;
    slotsFull: string;
    roleLead: string;
    roleAntagonist: string;
    roleSupporting: string;
    roleCameo: string;
    reusedSimilar: string;
    reusedBible: string;
    traitsLowConfidence: string;
    imageOnly: string;
    imageTooLarge: string;
    urlMustHttp: string;
    urlFetchFailed: string;
    bibleFound: string;
    bibleUsedIn: string;
    reuseOnce: string;
    similarHint: string;
    similarity: string;
    hasDna: string;
    reuseLook: string;
    characterAlt: string;
    characterNamePlaceholder: string;
    characterNameAria: string;
    characterRoleAria: string;
    uploadFile: string;
    useUrl: string;
    clear: string;
    fetchUrl: string;
    extractingTraits: string;
    genderMale: string;
    genderFemale: string;
    aiTraits: string;
    lowConfidence: string;
    previewQuotaDone: string;
    requestFailed: string;
    previewFailed: string;
    deletePreviewConfirm: string;
    previewTitle: string;
    quotaChipTitle: string;
    toggleHistory: string;
    history: string;
    quotaRefreshBefore: string;
    upgradeAccount: string;
    quotaRefreshAfter: string;
    historyHeading: string;
    refresh: string;
    noHistory: string;
    noImage: string;
    previewLoadingVideo: string;
    previewLoadingImage: string;
    previewLoadingHint: string;
    previewImageAlt: string;
    includeVideo: string;
    tryAgain: string;
    abandon: string;
    acceptPreview: string;
    acceptPreviewHint: string;
    guideStep1Title: string;
    guideStep1Desc: string;
    guideStep2Title: string;
    guideStep2Desc: string;
    guideStep3Title: string;
    guideStep3Desc: string;
    guideAria: string;
    skipGuide: string;
    prevStep: string;
    startShoot: string;
    nextStep: string;
    languageLabel: string;
    languageHint: string;
    setDefaultLangHint: string;
    defaultSaved: string;
    systemDefault: string;
    setAsDefault: string;
    langAuto: string;
    ttsDegraded: string;
    providerMinimax: string;
    providerVeo: string;
    providerMidjourney: string;
    gatewayCooldown: string;
    recentFailures: string;
    engineWeather: string;
    engineWeatherHint: string;
    styleSaveFailed: string;
    deleteStyleConfirm: string;
    styleLibraryTitle: string;
    saveCurrentHint: string;
    saveCurrentDisabledHint: string;
    saveCurrent: string;
    styleNamePlaceholder: string;
    currentStyle: string;
    currentCamera: string;
    styleLibraryEmpty: string;
    draftsFailed: string;
    draftsTitle: string;
    draftsStats: string;
    regenerate: string;
    draftsLoading: string;
    draftsFooter: string;
    adoptDraft: string;
    tempAggressive: string;
    tempMedium: string;
    tempSteady: string;
    genFailed: string;
    approxWords: string;
    cameraLanguage: string;
    cameraDefault: string;
    cameraPresetsAria: string;
  };
  projectView: {
    loadingTimeline: string;
    loadingProject: string;
    projectNotFound: string;
    rerenderStarting: string;
    rerenderShotDone: string;
    rerenderShotFail: string;
    rerenderBatchDone: string;
    rerenderBatchFailSuffix: string;
    rerenderRequestFail: string;
    saveFailed: string;
    saveFailedStatus: string;
    checkNetwork: string;
    themeLabel: string;
    castLocked: string;
    faceConsistency: string;
    workflowGroupsAria: string;
    stagesAria: string;
    sceneDescription: string;
    dialogue: string;
    beatLabel: string;
    emptyCharactersHint: string;
    editDescription: string;
    emptyScenesHint: string;
    cameoRetryFail: string;
    cameoRetryDone: string;
    networkError: string;
    inspector: string;
    cineDeskTitle: string;
    directorStageTitle: string;
    stagedOn: string;
    stagedOff: string;
    subtitleSafeArea: string;
    rerenderBusy: string;
    rerenderBatchBtn: string;
    emptyVideosHint: string;
    videoGenFailed: string;
    noSceneDesc: string;
    expandComments: string;
    costDetails: string;
    costTimes: string;
    costTotal: string;
    querying: string;
    filmHealth: string;
    probing: string;
    recheckHealth: string;
    audioHealed: string;
    audioMissingHint: string;
    boardFallback: string;
    noVideo: string;
    shotOf: string;
    exitFullscreen: string;
    watchFullscreen: string;
    fullscreen: string;
    noVideosYet: string;
    playFromStart: string;
    reviewPassed: string;
    needsWork: string;
    dimNarrative: string;
    dimVisualConsistency: string;
    dimPacing: string;
    dimPerformance: string;
    dimVisualQuality: string;
    dimAudio: string;
    cannotRetakeSegment: string;
    canRetake: string;
    retakePlanDesc: string;
    dryRunFailed: string;
    defaultNarration: string;
    anotherUser: string;
    anonymous: string;
    emptyTimeline: string;
    shotsDuration: string;
    virtualOn: string;
    undoTitle: string;
    redoTitle: string;
    rippleTitle: string;
    rippleOn: string;
    rippleOff: string;
    unsaved: string;
    shotsTrackHint: string;
    bgmTrackTitle: string;
    subtitleTrackTitle: string;
    regenNarration: string;
    genNarration: string;
    narrationHint: string;
    narrationTrack: string;
    playDownload: string;
    lockToast: string;
    rewriteSubtitle: string;
    timelineHelp: string;
    segmentsCount: string;
    noSegments: string;
    lockWait: string;
    muted: string;
    edited: string;
    editingNow: string;
    resizeLeft: string;
    resizeRight: string;
    unmute: string;
    mute: string;
    editSubText: string;
    resetDefault: string;
    emptyPacing: string;
    emptyPacingHint: string;
    dramaConflictPass: string;
    stdConflictPass: string;
    timesUnit: string;
    dramaReversalPass: string;
    stdReversalPass: string;
    needsFix: string;
    dramaMode: string;
    stdMode: string;
    hookAudit: string;
    heuristicLlm: string;
    heuristicOnly: string;
    openingHook: string;
    episodeCliff: string;
    bgmSync: string;
    cutsCount: string;
    noBgm: string;
    openingPrefix: string;
    cliffPrefix: string;
    shotsCount: string;
    noShotData: string;
    emotionReversalAria: string;
    strong7: string;
    mid46: string;
    weak4: string;
    reversalPoint: string;
    styleBible: string;
    styleAvg: string;
    retriedTitle: string;
    styleStrong: string;
    styleMid: string;
    styleWeak: string;
    dialogueCoverage: string;
    dialogueScenes: string;
    missingReverse: string;
    reverseHint: string;
    missingCU: string;
    cuHint: string;
    rewriteHints: string;
    pacingDiagV2: string;
    curve: string;
    shapeEscalating: string;
    shapeFrontLoaded: string;
    shapeNoClimax: string;
    shapeFlat: string;
    slopePeak: string;
    dragSegments: string;
    dragRange: string;
    opening: string;
    openingStats: string;
    openingFailNote: string;
    durationRhythm: string;
    cvLabel: string;
  };
  projectTools: {
    sourceFactory: string;
    sourceVision: string;
    sourceSkeleton: string;
    groupNarrative: string;
    groupTime: string;
    groupCamera: string;
    groupImage: string;
    groupSound: string;
    fieldDialogue: string;
    fieldDuration: string;
    fieldStart: string;
    fieldEnd: string;
    fieldShotSize: string;
    fieldCameraMove: string;
    fieldLens: string;
    fieldLighting: string;
    fieldEdit: string;
    fieldScoreMood: string;
    fieldSoundDesign: string;
    fieldStoryBeat: string;
    fieldWhyChoice: string;
    rerenderShotProgress: string;
    rerenderDone: string;
    generatingSheet: string;
    noShotData: string;
    pullAnalysis: string;
    sheetMeta: string;
    exportCsv: string;
    scriptBookMd: string;
    scriptBookPdf: string;
    importCsv: string;
    importing: string;
    importFailed: string;
    importApplied: string;
    unknownShotsSkipped: string;
    badLines: string;
    importNetworkFail: string;
    rerendering: string;
    rerenderAffected: string;
    shotBoardAlt: string;
    noFrame: string;
    externalTitle: string;
    externalHint: string;
    externalUrlAria: string;
    urlPlaceholder: string;
    pullAction: string;
    refresh: string;
    queuedSplit: string;
    splitDone: string;
    visionLabeled: string;
    skeletonTable: string;
    splitFailed: string;
    sheetShotsMeta: string;
    truncated: string;
    collapse: string;
    expand: string;
    sketchNeedDesc: string;
    sketchGenFailedStatus: string;
    sketchGenFailed: string;
    sketchTooLarge: string;
    persistFailed: string;
    sketchUploadFailed: string;
    refTooLarge: string;
    promptTooShort: string;
    regenStarting: string;
    requestFailedDetail: string;
    streamReadFailed: string;
    processing: string;
    noNewImage: string;
    regenFailed: string;
    regenTitle: string;
    promptPlaceholder: string;
    refImageOptional: string;
    remove: string;
    refUploaded: string;
    refUsedAsSref: string;
    dropRefHint: string;
    lockStyleBible: string;
    lockLeadFace: string;
    aspect: string;
    sketchLockTitle: string;
    sketchLockOptional: string;
    genSketchTitle: string;
    genSketch: string;
    uploadSketch: string;
    lockCompOnRegen: string;
    sketchAlt: string;
    sketchSoftHint: string;
    footerHint: string;
    regenInProgress: string;
    regenThisShot: string;
    preflightUnavailable: string;
    preflightUnavailableShort: string;
    pickOnePlatform: string;
    genFailed: string;
    networkError: string;
    preflightFailConfirm: string;
    publishing: string;
    publishNeedCreator: string;
    qualityGateBlocked: string;
    pleaseLogin: string;
    publishFailed: string;
    scheduledAt: string;
    ytUploaded: string;
    packedWithMsg: string;
    packedWithShare: string;
    exportFilename: string;
    multiPlatform: string;
    regenerate: string;
    genPack: string;
    exportTxt: string;
    llmDegraded: string;
    scheduleOptional: string;
    clearSchedule: string;
    ytRealUpload: string;
    emptyHint: string;
    copy: string;
    preflightPass: string;
    preflightPassTips: string;
    preflightFailItems: string;
    labelTitle: string;
    labelAlt: string;
    labelTags: string;
    labelHook: string;
    labelDesc: string;
    labelTips: string;
    publishPack: string;
    sharePage: string;
    platformLink: string;
    renderOk: string;
    writtenBack: string;
    renderFailed: string;
    audioSynthOk: string;
    audioSynthFailed: string;
    noAudioAlign: string;
    noWebAudio: string;
    alignFailed: string;
    levelPass: string;
    levelWarn: string;
    levelBlock: string;
    lipsyncTitle: string;
    engineOn: string;
    engineOff: string;
    readiness: string;
    synthesizing: string;
    synthAll: string;
    shotNth: string;
    stop: string;
    playLips: string;
    renderThisTitle: string;
    rendering: string;
    renderReal: string;
    measureTitle: string;
    measuring: string;
    measureAlign: string;
    verdictGood: string;
    verdictFair: string;
    verdictBad: string;
    audioLag: string;
    lagBehind: string;
    lagAhead: string;
    avAlign: string;
    driftTitle: string;
    correctDrift: string;
    mouthOpenTitle: string;
    viewVideo: string;
    reshootTitle: string;
    preparing: string;
    needPro4k: string;
    requestFailed: string;
    regen4kFailed: string;
    workshopSubtitle: string;
    u2vTitle: string;
    u2vTool: string;
    emptyShots: string;
    emptyShotsHint: string;
    regen4kDone: string;
    boardRegenDone: string;
    regenPromptTitle: string;
    regenPrompt: string;
    gridTitle: string;
    gridPick: string;
    klingTitle: string;
    needProTitle: string;
    regen4k: string;
    workshopFooter1: string;
    workshopFooter2: string;
    saveFailed: string;
    savedOk: string;
    geneLib: string;
    charLock: string;
    moreChars: string;
    noCharAsset: string;
    envLock: string;
    lightingOn: string;
    lightingOff: string;
    moreScenes: string;
    noSceneAsset: string;
    seedLock: string;
    refreshSeeds: string;
    auxSeed: string;
    boardLogic: string;
    noBoards: string;
    noBoardsHint: string;
    moreShotsSame: string;
    consoleTitle: string;
    linkMode: string;
    strength: string;
    loose: string;
    strict: string;
    clothingLock: string;
    lightingLock: string;
    faceIdStrength: string;
    saveContinuity: string;
    engineMissing: string;
    shotOk: string;
    writtenBoard: string;
    shotWarn: string;
    computingAlign: string;
    alignWeak: string;
    stopped: string;
    qcRound: string;
    rerenderWeak: string;
    aborted: string;
    rerenderFailed: string;
    confirmRun: string;
    synthAllLines: string;
    audioFailed: string;
    audioDone: string;
    renderShot: string;
    renderDone: string;
    inTimeline: string;
    batchFailed: string;
    batchTitle: string;
    qcLoopTitle: string;
    qcLoop: string;
    running: string;
    runAll: string;
    roleViewer: string;
    roleCommenter: string;
    roleEditor: string;
    loadFailed: string;
    createFailed: string;
    failed: string;
    revokeConfirm: string;
    removeConfirm: string;
    inviteTitle: string;
    joined: string;
    newLink: string;
    roleViewerOpt: string;
    roleCommenterOpt: string;
    roleEditorOpt: string;
    expiry1d: string;
    expiry7d: string;
    expiry30d: string;
    expiryForever: string;
    generateCopy: string;
    sentLinks: string;
    visitStats: string;
    copyLink: string;
    revokeLink: string;
  };
  projectPanels: {
    pickSampleFirst: string;
    sampleTooLarge: string;
    consentRequired: string;
    consentOwnerDeclaration: string;
    cloneFailed: string;
    cloneTag: string;
    cloneSuccess: string;
    auditionFailedNeedTts: string;
    auditionFailed: string;
    voicesSaved: string;
    saveFailed: string;
    voiceShelfTitle: string;
    manual: string;
    auto: string;
    audition: string;
    saveVoices: string;
    cloneHint: string;
    cloneNamePlaceholder: string;
    clonePurposeTitle: string;
    purposeDrama: string;
    purposeAd: string;
    purposePersonal: string;
    purposeOther: string;
    consentLead: string;
    consentBold: string;
    consentTail: string;
    cloneVoice: string;
    cloningWait: string;
    consentThenClone: string;
    withVoiceover: string;
    voiceoverMuted: string;
    nativeTrack: string;
    nativeMuted: string;
    noIndependentTrack: string;
    audioBlocked: string;
    audiblePreview: string;
    audibleOnTitle: string;
    mutedTitle: string;
    muted: string;
    previewFailed: string;
    replicateStarted: string;
    replicateFailed: string;
    templateSaved: string;
    saveTemplateFailed: string;
    replicateTitle: string;
    replicateHint: string;
    kindGlobal: string;
    kindProp: string;
    kindCostume: string;
    replaceKindAria: string;
    fromPlaceholderGlobal: string;
    fromPlaceholderOther: string;
    fromAria: string;
    toPlaceholder: string;
    toAria: string;
    refImagePlaceholder: string;
    refImageAria: string;
    deleteRuleAria: string;
    addRule: string;
    previewRewrite: string;
    replicateStart: string;
    savePrivateTemplate: string;
    saveTemplateHint: string;
    fidelityTitle: string;
    fidOverall: string;
    fidPacing: string;
    fidHook: string;
    fidCompare: string;
    promptListTitle: string;
    shotDur: string;
    refImageCount: string;
    shotPromptAria: string;
    actorFallback: string;
    stageSaved: string;
    saveFailedWith: string;
    saveStageFailed: string;
    sketchDone: string;
    sketchFailedWith: string;
    stageTitle: string;
    stageTitleNamed: string;
    topViewHint: string;
    cameraMark: string;
    yaw: string;
    camHeight: string;
    focal: string;
    fov: string;
    cameraViewHint: string;
    noCompositionWarn: string;
    promptLineSummary: string;
    sketchAlt: string;
    saveBlocking: string;
    renderSketch: string;
    renderSketchHint: string;
    retakeDone: string;
    retakeFailed: string;
    batchQueued: string;
    batchDone: string;
    batchFailed: string;
    adoptedNotice: string;
    adoptFailed: string;
    retakeTitle: string;
    retakeTitleTakes: string;
    retakeTitleHint: string;
    selectShotAria: string;
    shotN: string;
    emotionAria: string;
    retake: string;
    retakeOneHint: string;
    versions: string;
    abListen: string;
    sideA: string;
    sideAEmotion: string;
    sideB: string;
    sideBEmotion: string;
    noFullDub: string;
    noRetakes: string;
    adoptedBadge: string;
    adoptThis: string;
    batchRetake: string;
    adoptHint: string;
    loadFailedHttp: string;
    loadFailed: string;
    rangeFailed: string;
    inspectTitle: string;
    thinned: string;
    decodeFailed: string;
    extracting: string;
    noFrames: string;
    frameAlt: string;
    pickStart: string;
    selectedOne: string;
    selectedRange: string;
    clearSelection: string;
    ranging: string;
    resolveRange: string;
    useForRetake: string;
    currentProject: string;
    confirmRun: string;
    stopped: string;
    roundAudit: string;
    auditFailed: string;
    skipNoPrompt: string;
    reshootShot: string;
    reshootIncomplete: string;
    reshootError: string;
    roundReshoot: string;
    noAutoReshoot: string;
    runError: string;
    oneclickTitle: string;
    oneclickBadge: string;
    oneclickBefore: string;
    oneclickAudit: string;
    oneclickMid1: string;
    oneclickGate: string;
    oneclickMid2: string;
    oneclickReshoot: string;
    oneclickAfter: string;
    stop: string;
    runLoop: string;
    needBoards: string;
    passed: string;
    handoff: string;
    promptTooShort: string;
    generatingN: string;
    requestFailed: string;
    streamReadFailed: string;
    processing: string;
    completePick: string;
    generateFailed: string;
    pickFailedHttp: string;
    gridTitle: string;
    candidateCount: string;
    aspect: string;
    regenBatch: string;
    generateCandidates: string;
    emptyHint: string;
    pick: string;
    readyFooter: string;
    crossOrigin: string;
    imageLoadFail: string;
    exportTitle: string;
    exportEdl: string;
    exportFcpxml: string;
    exportAaf: string;
    exportHint: string;
    scopesTitle: string;
    scopeStats: string;
    noBoards: string;
    hist: string;
    waveform: string;
    renderLoop: string;
    renderEmpty: string;
    etaAvg: string;
    failedN: string;
    stageVideo: string;
    stageBoard: string;
    res720Desc: string;
    res1080Desc: string;
    res2160Desc: string;
    downloadTitle: string;
    exportMp4: string;
    upgradeUnlock: string;
    downloadRes: string;
    withIntro: string;
    withIntroHint: string;
    lockedHint: string;
    costTitle: string;
    noCostTitle: string;
    noCostHint: string;
    budgetCap: string;
    capUnset: string;
    perSec: string;
    perCall: string;
    cogsTitle: string;
    salePrice: string;
    salePlaceholder: string;
    unitQtySec: string;
    unitQtyCall: string;
    totalCogs: string;
    marginLine: string;
    marginPct: string;
    inspectorAria: string;
    closeInspector: string;
    shotAlt: string;
    emotionLine: string;
    sceneDesc: string;
    emDash: string;
    dialogue: string;
    camera: string;
    shotActions: string;
    cinemaDesk: string;
    frameInspect: string;
    workshopActions: string;
    shotSize: string;
    angle: string;
    lens: string;
    movement: string;
    focus: string;
    atmosphere: string;
    motion: string;
    advanced: string;
    lighting: string;
    colorTemp: string;
    contrast: string;
    contrastLow: string;
    contrastMed: string;
    contrastHigh: string;
    body: string;
    lensSeries: string;
    ndNone: string;
    wb: string;
    descUpdated: string;
    descUpdatedNone: string;
    ledgerTitle: string;
    registerPropPh: string;
    registerPropAria: string;
    register: string;
    ledgerHint: string;
    emptyEntries: string;
    citedShots: string;
    citedNone: string;
    descAria: string;
    editDescTitle: string;
    noDesc: string;
  };
  projectMisc: {
    auditTabTitle: string;
    auditRunning: string;
    auditRerun: string;
    auditRun: string;
    auditDoneMsg: string;
    auditSkippedSuffix: string;
    auditRunFailed: string;
    cineModalTitle: string;
    cineAutoSuggest: string;
    cineEmotionPrefix: string;
    cineRulesApplied: string;
    cineNoRules: string;
    saveFailedStatus: string;
    cineSaved: string;
    cineSummary: string;
    copyPrompt: string;
    saveCamera: string;
    templateListed: string;
    saveFailed: string;
    saveTemplateDesc: string;
    saveAsTemplate: string;
    reviewStatusTitle: string;
    currentLabel: string;
    submittedLabel: string;
    reviewedLabel: string;
    reviewNoteLabel: string;
    changesNoteRequired: string;
    noteOptional: string;
    submitReview: string;
    requestChanges: string;
    withdraw: string;
    dimOk: string;
    dimWeak: string;
    dimNa: string;
    dimVisualVsScript: string;
    dimConsistency: string;
    dimLipAlignable: string;
    dimLipMeasured: string;
    dimReadyN: string;
    dimAvgScore: string;
    publishGateTitle: string;
    notPublishReady: string;
    weakestShotsLabel: string;
    projectFormat: string;
    aspectRatio: string;
    colorSpace: string;
    frameRate: string;
    fpsOvercrank: string;
    safeArea: string;
    savedShort: string;
    saveFormat: string;
    aspect169: string;
    aspect916: string;
    aspect11: string;
    aspect43: string;
    exportFailed: string;
    exportPlatformTitle: string;
    platformExport: string;
    exportDoneView: string;
    presetDouyin: string;
    presetKuaishou: string;
    presetXhs: string;
    presetYoutube: string;
    presetSquare: string;
    neverSynced: string;
    syncFailedStatus: string;
    syncedMsg: string;
    paramLinkageTitle: string;
    shotCard: string;
    params: string;
    unsyncedChanges: string;
    liveSynced: string;
    lastSyncAt: string;
    paramJsonN: string;
    jsonValid: string;
    pendingSyncShots: string;
    plusFormat: string;
    plusContinuity: string;
    pendingSyncSuffix: string;
    revert: string;
    syncNow: string;
    paramJsonHint: string;
    genFailed: string;
    musicGenTitle: string;
    musicGenDesc: string;
    musicGenPlaceholder: string;
    composing: string;
    genBgm: string;
    musicSaved: string;
    localizeFailed: string;
    localizeTitle: string;
    localizeDesc: string;
    localizing: string;
    genLocalizedScript: string;
    applyingDub: string;
    applyAndDub: string;
    ttsUnreliable: string;
    localizeResult: string;
    localizeApplied: string;
    localizePending: string;
    healFailed: string;
    serverReturned: string;
    healDoneTitle: string;
    healFailedCount: string;
    healSkippedCount: string;
    healAllFixed: string;
    healUnsuccessful: string;
    healUnsuccessfulDesc: string;
    healNoneTitle: string;
    healNoneSkipped: string;
    healNoneOk: string;
    healRequestFailed: string;
    healing: string;
    healButton: string;
    seriesEmotion: string;
    seriesTension: string;
    seriesRhythm: string;
    seriesBrightness: string;
    noEmotionData: string;
    noEmotionHint: string;
    emotionChartTitle: string;
    climaxShot: string;
    decisionLogTitle: string;
    decisionLogMeta: string;
    querying: string;
    noDecisionData: string;
    colShot: string;
    colEngine: string;
    colCost: string;
    colConsistency: string;
    projectQualityScore: string;
    genFailedRetry: string;
    coverPanelTitle: string;
    hideSafeArea: string;
    showSafeArea: string;
    regenCovers: string;
    genCoverCandidates: string;
    coverDegraded: string;
    coverEmptyHint: string;
    imageFailed: string;
    titleSafeZone: string;
    coverPortrait: string;
    coverDramatic: string;
    coverSymbolic: string;
    consistencyTrend: string;
    weakestDim: string;
    roundN: string;
    compositionFraming: string;
    compositionHints: string;
    hintSubject: string;
    hintHeadroom: string;
    hintLookRoom: string;
    hintBalance: string;
    cameraPath: string;
    cameraPos: string;
    focusPoint: string;
    movePushIn: string;
    movePullOut: string;
    movePan: string;
    moveTilt: string;
    moveDolly: string;
    moveCrane: string;
    moveOrbit: string;
    moveHandheld: string;
    moveStatic: string;
    castSavedTitle: string;
    castSavedDesc: string;
    castTitle: string;
    castDesc: string;
    saveCast: string;
    videoNodeSub: string;
    regenerating: string;
    clickToPlay: string;
    clickRetry: string;
    cameraFollowScript: string;
    cameraTitle: string;
    tailFramePlaceholder: string;
    tailFrameTitle: string;
    regenerate: string;
    waitStoryboard: string;
    videoGenerating: string;
    storyboardArtist: string;
    storyboardSub: string;
    sketchAlt: string;
    sketchTitle: string;
    mustShow: string;
    waitScenes: string;
    writingBoards: string;
    scriptWorldSub: string;
    scriptSynopsis: string;
    characterList: string;
    shotDescriptions: string;
    sceneConcept: string;
    regenSceneTitle: string;
    waitCharacters: string;
    designingScenes: string;
    regenFailedPrefix: string;
    editStage: string;
    directorMonitorSub: string;
    producerReviewSub: string;
    directorGuiding: string;
    monitorDone: string;
    monitorAll: string;
    overallScoreLabel: string;
    qualityExcellent: string;
    qualityNeedsWork: string;
    qualityRework: string;
    dimNarrative: string;
    dimVisualConsistency: string;
    dimPacing: string;
    dimPerformance: string;
    dimVisualQuality: string;
    dimAudio: string;
    suggestionPrefix: string;
    selectPartialRedo: string;
    redoAll: string;
    selectRedoHint: string;
    redoFromStage: string;
    redoing: string;
    startRedo: string;
    completeProject: string;
    selectOptimizeHint: string;
    waitEdit: string;
    producerReviewing: string;
    reviewComplete: string;
    noProjectInfo: string;
    feedbackSubmitted: string;
    submitFailedRetry: string;
    confirmed: string;
    confirmSave: string;
    tweak: string;
    feedbackPlaceholder: string;
    filmPreviewMuxed: string;
    filmPreview: string;
    editorSub: string;
    shotCountN: string;
    totalDuration: string;
    playFilm: string;
    bgm: string;
    playing: string;
    clickPreview: string;
    moveUp: string;
    moveDown: string;
    timelineDirty: string;
    undo: string;
    saveToProject: string;
    reEdit: string;
    reEditFailed: string;
    reEditFailedWith: string;
    waitVideos: string;
    editing: string;
    unknownShort: string;
    characterAssetsSub: string;
    dnaPartial: string;
    dnaComplete: string;
    reextractDnaTitle: string;
    reextract: string;
    reextracting: string;
    regenCharTitle: string;
    threeView: string;
    threeViewTitle: string;
    waitWriter: string;
    designingCharacters: string;
    dnaFailedPrefix: string;
  };
  polishUi: {
    styleLiterary: string;
    styleLiteraryHint: string;
    styleCommercial: string;
    styleCommercialHint: string;
    styleThriller: string;
    styleThrillerHint: string;
    styleComedy: string;
    styleComedyHint: string;
    styleDocumentary: string;
    styleDocumentaryHint: string;
    stylePoetic: string;
    stylePoeticHint: string;
    intensityLight: string;
    intensityLightHint: string;
    intensityModerate: string;
    intensityModerateHint: string;
    intensityHeavy: string;
    intensityHeavyHint: string;
    projectScript: string;
    billingProRequired: string;
    billingUpgradeRequired: string;
    polishFailedStatus: string;
    stoppedHint: string;
    networkError: string;
    libNamePro: string;
    libNameBasic: string;
    libNameDraft: string;
    saveFailedStatus: string;
    savedToLibMsg: string;
    saveFailed: string;
    saveToProjectReady: string;
    saveToProjectOk: string;
    writeFailedStatus: string;
    writeFailed: string;
    subtitle: string;
    importedFrom: string;
    historyTitle: string;
    historyBtn: string;
    resetTitle: string;
    modeLabel: string;
    basicHint: string;
    proLabel: string;
    proHint: string;
    styleLabel: string;
    styleOptional: string;
    keepOriginal: string;
    intensityLabel: string;
    focusLabel: string;
    optional: string;
    focusPlaceholder: string;
    original: string;
    clear: string;
    sourcePlaceholder: string;
    sourceFromProject: string;
    sourceFromManual: string;
    stopTitle: string;
    stopDiagnosing: string;
    stopPolishing: string;
    runPro: string;
    runBasic: string;
    resultLabel: string;
    writebackTitle: string;
    writing: string;
    writtenBack: string;
    failed: string;
    writebackProject: string;
    copyTitle: string;
    copied: string;
    copy: string;
    downloadTxtTitle: string;
    exportMdTitle: string;
    exportDocTitle: string;
    saveLibTitle: string;
    savingShort: string;
    savedShort: string;
    saveToLib: string;
    replaceSourceTitle: string;
    replaceSource: string;
    goUpgrade: string;
    upgradeHint: string;
    checkApiKey: string;
    loadingPro: string;
    loadingBasic: string;
    loadingProHint: string;
    viewingHistory: string;
    gotIt: string;
    gotItTitle: string;
    degradedHint: string;
    changeSummary: string;
    notesLabel: string;
    diffViewLabel: string;
    fullViewLabel: string;
    viewFullTitle: string;
    viewFull: string;
    viewDiffTitle: string;
    viewDiff: string;
    searching: string;
    matchCount: string;
    clearHighlight: string;
    industryAudit: string;
    noAuditHint: string;
    emptyHint: string;
    emptySubhint: string;
    footerTips: string;
    goProjects: string;
    footerTipsTail: string;
    bookTitle: string;
    synopsisPrefix: string;
    genrePrefix: string;
    actSuffix: string;
    tagScene: string;
    tagChars: string;
    tagAction: string;
    tagEmotion: string;
    tagDialogue: string;
    changeRate: string;
    totalLinesBefore: string;
    totalLinesAfter: string;
    polishedAfter: string;
    noDiff: string;
    readinessGreen: string;
    readinessAmber: string;
    readinessRed: string;
    latestPolish: string;
    proIndustry: string;
    notesCount: string;
    collapseAuditTitle: string;
    expandAuditTitle: string;
    collapse: string;
    viewAudit: string;
    polishAgainTitle: string;
    polishAgain: string;
    searchInResult: string;
    addToFocusTitle: string;
    aigcReadiness: string;
    stylePortrait: string;
    fieldGenre: string;
    fieldTone: string;
    fieldRhythm: string;
    fieldArt: string;
    hookTitle: string;
    hookWeak: string;
    hookOk: string;
    hookStrong: string;
    hookStrength: string;
    actTitle: string;
    beatInciting: string;
    beatMidpoint: string;
    beatClimax: string;
    beatResolution: string;
    missingBeats: string;
    missingBeatsHint: string;
    fillBeat: string;
    dialogueTitle: string;
    onTheNose: string;
    abstractEmotion: string;
    charAnchorsTitle: string;
    faceLock: string;
    speechStyle: string;
    arc: string;
    lightingTitle: string;
    colLightDir: string;
    colQuality: string;
    colColorTemp: string;
    colMood: string;
    continuityTitle: string;
    catPacing: string;
    catDialogue: string;
    catStructure: string;
    catCharacter: string;
    catAigc: string;
    catOther: string;
    issuesTitle: string;
    historyAria: string;
    historyHeading: string;
    maxKeep: string;
    trendTitle: string;
    historyEmpty: string;
    historyEmptyHint: string;
    view: string;
    footerViewHint: string;
    footerReplaceHint: string;
    noSummary: string;
    charsNotes: string;
    viewTitle: string;
  };
  dashPages: {
    imagesOnly: string;
    imageTooLargeMb: string;
    uploadNetwork: string;
    urlMustHttp: string;
    urlFetchFailed: string;
    urlFetchNetwork: string;
    uploadFile: string;
    useUrl: string;
    fetchUrl: string;
    clickOrUrl: string;
    clickOrDropOrUrl: string;
    dropToUpload: string;
    clear: string;
    remove: string;
    addClip: string;
    clipUrlInvalid: string;
    composeFailedHttp: string;
    composeNetwork: string;
    musicUrlPh: string;
    musicDroppedHint: string;
    generateFailed: string;
    generateFailedHttp: string;
    generateFailedStatus: string;
    generateNetwork: string;
    generateOk: string;
    generateTimeout: string;
    networkError: string;
    networkAbnormal: string;
    saveFailed: string;
    saveCharacter: string;
    charName: string;
    charNamePh: string;
    charDesc: string;
    charDescPh: string;
    charAppearance: string;
    charAppearancePh: string;
    charStyleKw: string;
    charStyleKwPh: string;
    visualTags: string;
    tagPh: string;
    refImageUrl: string;
    imageUrlPh: string;
    autoFillNeedImage: string;
    recognizeFailed: string;
    genderMale: string;
    genderFemale: string;
    skinToneOf: string;
    temperamentPrefix: string;
    costumePrefix: string;
    markPrefix: string;
    recognizedHigh: string;
    recognizedLow: string;
    nameRequired: string;
    autoFillTitle: string;
    recognizing: string;
    recognizedRedo: string;
    autoFillFromImage: string;
    autoFillHint: string;
    appearanceTraits: string;
    usedNTimes: string;
    usedNShort: string;
    profileSection: string;
    autoBio: string;
    boundVoice: string;
    voiceDefault: string;
    turnaroundTitle: string;
    promptReady: string;
    noImageYet: string;
    noProfileYet: string;
    generateProfile: string;
    refreshProfile: string;
    generateTurnaround: string;
    generateTurnaroundTitle: string;
    turnaroundNoEngine: string;
    copiedClipboard: string;
    useCharacterCopy: string;
    copyName: string;
    copyDesc: string;
    copyLook: string;
    copyStyle: string;
    copyTags: string;
    deleteConfirm: string;
    pageSubtitle: string;
    searchChars: string;
    noMatch: string;
    noChars: string;
    emptyHint: string;
    viewDetails: string;
    deleteCharacter: string;
    comicTitle: string;
    comicSubtitle: string;
    comicImage: string;
    needComicImage: string;
    panelFailedHttp: string;
    panelNetwork: string;
    panelsDetected: string;
    detecting: string;
    autoDetect: string;
    panelResult: string;
    panelFailed: string;
    colPanel: string;
    colRowCol: string;
    colSize: string;
    noPanels: string;
    cropFailedHttp: string;
    cropNetwork: string;
    cropNoneHint: string;
    cropNone: string;
    croppedN: string;
    cropping: string;
    cropPanels: string;
    croppedList: string;
    panelAlt: string;
    panelN: string;
    downloadPanel: string;
    sendToU2v: string;
    motionFx: string;
    comicFlowHint: string;
    dramaTitle: string;
    dramaHint: string;
    clipUrlPh: string;
    needTwoClips: string;
    dramaDoneNoMusic: string;
    dramaDone: string;
    stitching: string;
    composeDrama: string;
    dramaReady: string;
    openDownloadDrama: string;
    comicEmpty: string;
    mvTitle: string;
    mvSubtitle: string;
    musicDurationSec: string;
    bpmLabel: string;
    beatsPerShot: string;
    beatsHint: string;
    planning: string;
    genTimeline: string;
    planFailed: string;
    planFailedHttp: string;
    planNetwork: string;
    plannedShots: string;
    noPlannedShots: string;
    planEmptyHint: string;
    timelineAria: string;
    shotStripTitle: string;
    colShot: string;
    colStart: string;
    colEnd: string;
    colDur: string;
    colSection: string;
    colOnBeat: string;
    mvSec_chorus: string;
    mvSec_verse: string;
    mvSec_bridge: string;
    mvSec_intro: string;
    mvSec_outro: string;
    mvSec_unknown: string;
    composeTitle: string;
    composeSourcesLead: string;
    composeRealClips: string;
    composeRealClipsDesc: string;
    composeStills: string;
    composeStillsDesc: string;
    composeSourcesTail: string;
    realClipsLabel: string;
    videoClipUrlPh: string;
    pictureAlt: string;
    uploadPictures: string;
    needTimeline: string;
    needPicturesOrClips: string;
    fileTooLargeSkip: string;
    fileUploadFailed: string;
    fileUploadNetwork: string;
    composingWait: string;
    genMvClips: string;
    genMvStills: string;
    mvDoneNoMusic: string;
    mvDone: string;
    mvReady: string;
    mvShortHint: string;
    openDownloadMv: string;
    mvClipHint: string;
    mvEmpty: string;
    u2vTitle: string;
    u2vSubtitle: string;
    inputImage: string;
    needImageAndPrompt: string;
    tailFrameOptional: string;
    dropTail: string;
    clickOrDropTail: string;
    flfModeHint: string;
    describeMotion: string;
    motionPlaceholder: string;
    duration: string;
    durationEngineHint: string;
    generatingPct: string;
    generateVideo: string;
    resultPreview: string;
    waited: string;
    engineGenerating: string;
    progressEstimateHint: string;
    resultsHere: string;
    downloadMp4: string;
    addToMvTitle: string;
    addToMv: string;
    svTitle: string;
    svEyebrow: string;
    svIdeaPh: string;
    svIdeaMin: string;
    svDurationLock: string;
    svStylePh: string;
    svLangTitle: string;
    svLangAuto: string;
    langZh: string;
    langJa: string;
    svGenerating: string;
    svGenerate: string;
    svVocab: string;
    svApplyMove: string;
    svNeedPlan: string;
    svEmptyTitle: string;
    svEmptySub: string;
    svTimeline: string;
    svExpandPrompt: string;
    svPreview: string;
    svCopyPrompt: string;
    previewFailed: string;
    svParams: string;
    svParamsLocked: string;
    svMotion: string;
    speedSlow: string;
    speedNormal: string;
    speedFast: string;
    svLook: string;
    svInterp: string;
    svUpscale: string;
    svOutput: string;
    svRhythmMix: string;
    svSendCreate: string;
    svExport: string;
    svTotalDur: string;
    svShotCount: string;
    svRhythmStat: string;
    svMdMeta: string;
    svMdShot: string;
    svMdFrame: string;
    svSeedHead: string;
    svSeedMove: string;
    svRhythmDesc_suspense: string;
    svRhythmDesc_blockbuster: string;
    svRhythmDesc_emotion: string;
    siSubtitle: string;
    siReading: string;
    siAskBook: string;
    siSampled: string;
    siPeople: string;
    siSettings: string;
    siHighlights: string;
    analyzeFailed: string;
    siBatchTitle: string;
    siBatchSent: string;
    siSendNext: string;
    siBatchDone: string;
    siPastePh: string;
    siNarrationMode: string;
    siPlusTrack: string;
    siTargetChars: string;
    siTargetPh: string;
    siSmartSplit: string;
    siCharsTotal: string;
    siCharsN: string;
    siNoEpisodes: string;
    siSplitSummary: string;
    siSeasonNarrate: string;
    siSeasonBatch: string;
    siNarrateReport: string;
    siNarrateOk: string;
    siNarrateFail: string;
    siSegMeta: string;
    siAudioOut: string;
    siPlanReady: string;
    siNeedTtsBefore: string;
    siNeedTtsAfter: string;
    siVoiceover: string;
    siCreateFromEp: string;
    siSeedPrefix: string;
    siMode_dialogue: string;
    siMode_first_person: string;
    siMode_narrator: string;
    siModeDesc_dialogue: string;
    siModeDesc_first_person: string;
    siModeDesc_narrator: string;
    ecTitle: string;
    ecSubtitle: string;
    ecSafety: string;
    ecPlaceholder: string;
    ecEx1: string;
    ecEx2: string;
    ecEx3: string;
    ecEx4: string;
    ecParseHint: string;
    parse: string;
    parsing: string;
    parseFailed: string;
    parseFailedHttp: string;
    parseNetwork: string;
    parseBadBody: string;
    ecNeedText: string;
    ecNeedProject: string;
    ecUnmatched: string;
    ecWillDo: string;
    ecDestructiveWarn: string;
    ecRegenLead: string;
    ecRegenBold1: string;
    ecRegenMid: string;
    ecRegenBold2: string;
    ecRegenTail: string;
    listSep: string;
    ecRegenRunning: string;
    ecRegenOk: string;
    ecRegenFail: string;
    ecRegenShotN: string;
    ecConfirmRegen: string;
    ecRegenThese: string;
    ecShotLog: string;
    ecPaceHint: string;
    paceFast: string;
    paceSlow: string;
    ecWhichProject: string;
    ecSelectProject: string;
    ecNoProjects: string;
    recomposing: string;
    ecConfirmWait: string;
    ecConfirmIrreversible: string;
    ecExecWillConfirm: string;
    ecConfirmExec: string;
    ecCooldown: string;
    ecArmHint: string;
    ecNoRecompose: string;
    recomposeFailedHttp: string;
    recomposeNetwork: string;
    recomposeOk: string;
    recomposeDone: string;
    openDownloadFilm: string;
    ecEmpty: string;
  };
  dashMore: {
    seriesSubtitle: string;
    newSeries: string;
    noSeries: string;
    noSeriesHint: string;
    seriesEpMeta: string;
    newSeriesTitle: string;
    seriesNameLabel: string;
    seriesNamePlaceholder: string;
    anchorLabel: string;
    noAnchor: string;
    aiSplitMode: string;
    manualMode: string;
    premiseLabel: string;
    premisePlaceholder: string;
    episodeCountLabel: string;
    aiSplitBtn: string;
    epOutlines: string;
    addEpisode: string;
    epTitlePlaceholder: string;
    epPremisePlaceholder: string;
    addFirstEpisode: string;
    autoGenAfterCreate: string;
    createSeries: string;
    createSeriesWithN: string;
    defaultSeriesTitle: string;
    splitFailed: string;
    createFailedStatus: string;
    splitShortWarn: string;
    templatesSubtitle: string;
    searchTemplates: string;
    search: string;
    favOnly: string;
    noTemplates: string;
    qualityN: string;
    favorite: string;
    rateNStars: string;
    noRatings: string;
    usedNTimes: string;
    useTemplate: string;
    styleRole: string;
    propRole: string;
    motionRole: string;
    voiceRole: string;
    teamWorkspace: string;
    teamWorkspaceDesc: string;
    creditsPool: string;
    creditsUnit: string;
    used: string;
    allocatedUnused: string;
    allocatedUsed: string;
    overBy: string;
    remainingAlloc: string;
    memberEmailPlaceholder: string;
    member: string;
    admin: string;
    owner: string;
    add: string;
    noMembers: string;
    colMember: string;
    colRole: string;
    colQuota: string;
    colLeft: string;
    remove: string;
    inviteMembers: string;
    inviteEmailPlaceholder: string;
    initialQuota: string;
    quota: string;
    genInviteLink: string;
    copyLink: string;
    inviteHint: string;
    persistHint: string;
    invalidQuota: string;
    memberExists: string;
    cannotRemove: string;
    saveFailed: string;
    savedOk: string;
    enterInviteEmail: string;
    genFailed: string;
    inviteCreated: string;
    linkCopied: string;
    invitePending: string;
    inviteAccepted: string;
    inviteRevoked: string;
    inviteExpired: string;
    inviteQuotaN: string;
    missingToken: string;
    acceptFailed: string;
    acceptTitle: string;
    acceptDesc: string;
    joinedTeam: string;
    joinedMeta: string;
    goTeam: string;
    loginFirst: string;
    loginFirstHint: string;
    acceptInvite: string;
    missingCredential: string;
    jobsSubtitle: string;
    queueOffLead: string;
    queueOffTail: string;
    noJobs: string;
    stagePrefix: string;
    attemptsN: string;
    viewProject: string;
    unknownError: string;
    retryResume: string;
    queued: string;
    running: string;
    failedDead: string;
    stepDirector: string;
    stepStyleBible: string;
    stepWriter: string;
    stepDesign: string;
    stepVideo: string;
    stepFinalize: string;
    assetsSubtitle: string;
    deleteAssetConfirm: string;
    deleteFailed: string;
    noAssets: string;
    noAssetsOfType: string;
    assetsEmptyHint: string;
    deleteAssetTitle: string;
    music: string;
    finalFilm: string;
    masterTitle: string;
    masterEyebrow: string;
    roleLabel: string;
    taskLabel: string;
    conceptLabel: string;
    conceptPlaceholder: string;
    filmLookTitle: string;
    lutTitle: string;
    movementTitle: string;
    aspectLabel: string;
    extraLabel: string;
    optional: string;
    refinedPrompt: string;
    copy: string;
    refinePrompt: string;
    restore: string;
    useToCreate: string;
    glossaryTitle: string;
    refineFailed: string;
    networkError: string;
    stylesSubtitle: string;
    searchStyles: string;
    noStyleMatch: string;
    recEngine: string;
    applied: string;
    applyStyle: string;
    genTask: string;
    genDone: string;
    aiEngine: string;
    imageGen: string;
    noActivity: string;
    chinese: string;
    defaultStyle: string;
    colorPref: string;
    teamStudio: string;
    permCreatePublish: string;
    demoClip: string;
    playWithAudio: string;
    casesCopyrightLead: string;
    casesCopyrightStrong: string;
    casesCopyrightTail: string;
    polishedNoScore: string;
    aigcReadiness: string;
    freeTier: string;
  };
  publicUi: {
    waitSec: string;
    waitMinSec: string;
    waitMin: string;
    loginRateLimited: string;
    loginRateLimitedSoon: string;
    badCredentials: string;
    cooldownHint: string;
    retryAfter: string;
    licenseView: string;
    licenseRemix: string;
    licenseCommercial: string;
    reuseMessage: string;
    alreadyInLibrary: string;
    importedToLibrary: string;
    grantPending: string;
    grantRecorded: string;
    back: string;
    marketTitle: string;
    marketIntro: string;
    loadingMarket: string;
    marketEmpty: string;
    perUse: string;
    reusedN: string;
    importToLibrary: string;
    requestGrant: string;
    imagesOnly: string;
    imageTooLargeMb: string;
    visionDisabled: string;
    cameoScoreLow: string;
    scoreFailed: string;
    invalidInput: string;
    connectingTeam: string;
    createFailed: string;
    streamUnreadable: string;
    createDone: string;
    createRetry: string;
    ideaPlaceholderLong: string;
    charCount: string;
    scriptMode: string;
    ideaHint: string;
    cameoFaceLabel: string;
    cameoLockBadge: string;
    cameoLockHint: string;
    cameoUploadHint: string;
    cameoUploadSub: string;
    cameoPreviewAlt: string;
    cameoLocked: string;
    cameoClearAria: string;
    engineFast: string;
    engineQuality: string;
    klingAi: string;
    engineChinese: string;
    editStyleLabel: string;
    editStyleHint: string;
    editStyleDefault: string;
    editStyleFast: string;
    editStyleSlow: string;
    editStyleFastVal: string;
    editStyleSlowVal: string;
    editStyleCustomPh: string;
    tryIdeas: string;
    createDoneTitle: string;
    createDoneDesc: string;
    createNewWork: string;
    teamCreating: string;
    ideaCyberTitle: string;
    ideaCyberContent: string;
    ideaPalaceTitle: string;
    ideaPalaceContent: string;
    ideaWastelandTitle: string;
    ideaWastelandContent: string;
    ideaMagicTitle: string;
    ideaMagicContent: string;
    projCyberSynopsis: string;
    projPalaceSynopsis: string;
    projWastelandSynopsis: string;
    genreAll: string;
    genreScifi: string;
    genreGufeng: string;
    genreThriller: string;
    genreYouth: string;
    genreFantasy: string;
    genreRomance: string;
    exCyberDesc: string;
    exXianxiaTitle: string;
    exXianxiaDesc: string;
    exSurvivalTitle: string;
    exSurvivalDesc: string;
    exCampusTitle: string;
    exCampusDesc: string;
    exMagicDesc: string;
    exRomanceTitle: string;
    exRomanceDesc: string;
    metaDesc: string;
    heroBrandLead: string;
    heroBrandTrail: string;
    playAria: string;
    previewClip: string;
    playWithAudio: string;
    demoName: string;
    demoBio: string;
    langZhCN: string;
    langZhTW: string;
    langJa: string;
    invalidInvite: string;
    loadFailed: string;
    acceptFailed: string;
    loadingInvite: string;
    inviteInvalidTitle: string;
    inviteExpiredHint: string;
    backToProjects: string;
    expiresOn: string;
    neverExpires: string;
    invitedByPrefix: string;
    invitedBySuffix: string;
    loginToAcceptHint: string;
    loginToAcceptCta: string;
    accepting: string;
    acceptJoin: string;
    roleViewer: string;
    roleViewerDesc: string;
    roleCommenter: string;
    roleCommenterDesc: string;
    roleEditor: string;
    roleEditorDesc: string;
    untitledWork: string;
    synopsis: string;
    storyboardsN: string;
    shareFooter: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    textGen: string;
    textGenDesc: string;
    imageGen: string;
    imageGenDesc: string;
    videoGen: string;
    videoGenDesc: string;
    recentProjects: string;
    projectN: string;
    lastEditedHours: string;
    templateShare: string;
    shareLinkExpired: string;
    untitledTemplate: string;
    cloneHintOg: string;
    shareLinkUnavailableTitle: string;
    tagsPrefix: string;
    ogTemplateTitle: string;
    ogTemplateDesc: string;
    cloneFailed: string;
    loadingTemplate: string;
    linkUnavailable: string;
    templateGone: string;
    goCreateOwn: string;
    backToWorkshop: string;
    clonesN: string;
    clonedToLibrary: string;
    clonedDetail: string;
    goUse: string;
    cloneToLibraryEyebrow: string;
    cloneToLibraryHint: string;
    cloning: string;
    cloneToMyLibrary: string;
    exampleIdeaLabel: string;
    structureLabel: string;
    recommendedLabel: string;
    styleLook: string;
    duration: string;
    aspect: string;
    camera: string;
    myWorkflow: string;
    urbanMysteryIdea: string;
    savedOk: string;
    saveFailedPrefix: string;
    runReal: string;
    runDone: string;
    runDoneWithFails: string;
    runFailed: string;
    runFailedPrefix: string;
    studioTitle: string;
    runRealTitle: string;
    workflowNamePh: string;
    loadSaved: string;
    ideaPh: string;
    stepLabelPh: string;
    depsHint: string;
    noOtherSteps: string;
    emptyPalette: string;
    validate: string;
    validateOk: string;
    execPlan: string;
    layerN: string;
    runResults: string;
  };
  sharedUi: {
    switchLanguage: string;
    brandShort: string;
    skipToContent: string;
    footerProduct: string;
    footerFeatures: string;
    footerPricing: string;
    footerCases: string;
    footerCompany: string;
    footerAbout: string;
    footerCareers: string;
    footerPrivacy: string;
    footerResources: string;
    footerDocs: string;
    footerSupport: string;
    exportBtn: string;
    toggleParams: string;
    canvasHint: string;
    openProject: string;
    sceneN: string;
    addScene: string;
    workshopBusyTitle: string;
    workshopBusy: string;
    genParams: string;
    promptLabel: string;
    promptPlaceholder: string;
    styleLabel: string;
    styleJapanese: string;
    styleAmerican: string;
    styleChinese: string;
    styleWebtoon: string;
    sizeLabel: string;
    widthPh: string;
    heightPh: string;
    advanced: string;
    quality: string;
    qualityDraft: string;
    qualityStd: string;
    qualityHigh: string;
    generate: string;
    toolText: string;
    toolImage: string;
    toolVideo: string;
    toolEffect: string;
    toolAssets: string;
    toolTextDesc: string;
    toolImageDesc: string;
    toolVideoDesc: string;
    toolEffectDesc: string;
    toolAssetsDesc: string;
    toolComingSoon: string;
    progress: string;
    somethingWentWrong: string;
    statusIdle: string;
    statusThinking: string;
    statusWorking: string;
    aiDirector: string;
    aiWriter: string;
    aiCharacterDesigner: string;
    aiSceneDesigner: string;
    aiStoryboard: string;
    aiVideoProducer: string;
    aiEditor: string;
    aiProducer: string;
    unknownRole: string;
    newCharacter: string;
    charConsistency: string;
    addCharacter: string;
    charNamePh: string;
    charDescPh: string;
    charAppearPh: string;
    charTagsPh: string;
    noDescription: string;
    clickAboveToAdd: string;
    cameoAnalyzing: string;
    cameoScoreUnavailable: string;
    verdictExcellent: string;
    verdictGood: string;
    verdictFair: string;
    verdictPoor: string;
    cameoFit: string;
    dimClarity: string;
    dimLighting: string;
    dimAngle: string;
    dimSize: string;
    continuityPending: string;
    continuityMonitor: string;
    cameoLocked: string;
    cameoUnusedTip: string;
    cameoUsedTip: string;
    shotChain: string;
    shotChainTip: string;
    globalAnchor: string;
    globalAnchorTip: string;
    mentionCandidates: string;
    candidatesN: string;
    anonymous: string;
    onlineN: string;
    youTab: string;
    otherTab: string;
    morePeople: string;
    shotAutoRetried: string;
    sceneTooltip: string;
    takeTooltip: string;
    visionDisabled: string;
    cameoLowScore: string;
    scoreFailed: string;
    imagesOnly: string;
    imageTooLarge: string;
    cameoLockedOk: string;
    cameoUnlockConfirm: string;
    unlockFailed: string;
    cameoUnlocked: string;
    cameoUnlockedTitle: string;
    cameoEmptyHint: string;
    uploadCameo: string;
    cameoLockedAlt: string;
    cameoLockedTitle: string;
    cameoLockedHint: string;
    replace: string;
    unlock: string;
    scoreFitTitle: string;
    rescore: string;
    scoreFit: string;
    readinessHigh: string;
    readinessMid: string;
    readinessLow: string;
    genReadiness: string;
    storyboardEditor: string;
    shotMeta: string;
    addShot: string;
    preview: string;
    shotDescPh: string;
    dialoguePh: string;
    seconds: string;
    clickEditShot: string;
    duplicate: string;
    noShotsYet: string;
    camCloseup: string;
    camMediumClose: string;
    camMedium: string;
    camFull: string;
    camWide: string;
    camHigh: string;
    camLow: string;
    camFollow: string;
    mascotWait1: string;
    mascotWait2: string;
    mascotWait3: string;
    mascotWait4: string;
    mascotWait5: string;
    mascotWait6: string;
    mascotWait7: string;
    mascotWait8: string;
    mascotWait9: string;
    mascotWait10: string;
    mascotWork1: string;
    mascotWork2: string;
    mascotWork3: string;
    mascotWork4: string;
    mascotWork5: string;
    mascotWork6: string;
    mascotDone1: string;
    mascotDone2: string;
    mascotDone3: string;
    mascotDone4: string;
    mascotDone5: string;
    mascotDone6: string;
    mascotErr1: string;
    mascotErr2: string;
    mascotErr3: string;
    mascotErr4: string;
    mascotErr5: string;
    styleRole: string;
    propRole: string;
    mentionHint: string;
    atHint: string;
    atHintN: string;
    hideCompile: string;
    compilePreview: string;
    compiledPromptHint: string;
    emptyParen: string;
    unresolvedMentions: string;
    motionRole: string;
    voiceRole: string;
    unsupportedFile: string;
    fileOver25: string;
    readFailed: string;
    badMediaUrl: string;
    multiRefOptional: string;
    lockByRole: string;
    refLimits: string;
    uploadFile: string;
    pasteMediaUrl: string;
    removeRef: string;
    elementRole: string;
    cwTitle: string;
    elementComplete: string;
    agentWriterDesc: string;
    agentCharDesc: string;
    agentSceneDesc: string;
    agentBoardDesc: string;
    agentVideoDesc: string;
    agentDirectorDesc: string;
    agentEditorDesc: string;
    agentProducerDesc: string;
    requestFailed: string;
    streamUnreadable: string;
    startChatWith: string;
    agentThinking: string;
    typeMessage: string;
    uploadImage: string;
    attachment: string;
    showThinking: string;
    noReply: string;
    clearChatConfirm: string;
    aiAssistantSidebar: string;
    aiAssistant: string;
    chatWithContext: string;
    clearLocalView: string;
    chatEmptyHint: string;
    chatExample1: string;
    chatExample2: string;
    enterToSend: string;
    chatContextHint: string;
    openAssistantHotkey: string;
    openAssistantChat: string;
    stageAssets: string;
    stageFinal: string;
    stageScriptDesc: string;
    stageAssetsDesc: string;
    stageBoardDesc: string;
    stageFinalDesc: string;
    stagesDone: string;
    shotVideos: string;
    qcHealth: string;
    nextGen: string;
    suggestRegen: string;
    pipelineReady: string;
    chooseFailed: string;
    variantChosen: string;
    packingHint: string;
    packFailed: string;
    packSummary: string;
    variantUnit: string;
    composeFail: string;
    copyOk: string;
    copyFail: string;
    packOk: string;
    packFail: string;
    rerunFailed: string;
    reranDispatched: string;
    reranMarked: string;
    downstreamStale: string;
    directorDesk: string;
    directorDeskHint: string;
    adWorkshopTitle: string;
    packing: string;
    adWorkshop: string;
    mainFilm: string;
    variantN: string;
    setAsHero: string;
    pickAsHero: string;
    prefTitle: string;
    statusEmpty: string;
    statusReady: string;
    statusStale: string;
    itemsN: string;
    upstreamStale: string;
    rerunStage: string;
    rerun: string;
    rerunDownstream: string;
    rerunLast: string;
    confirmRerun: string;
    searchAssets: string;
    selectedPrefix: string;
    loadAssetsFailed: string;
    usedN: string;
    noMatchAssets: string;
    noAssetsYet: string;
    tryOtherKeywords: string;
    createFirstAsset: string;
    createAsset: string;
    cameoConsistency: string;
    characterN: string;
    autoRetriedN: string;
    firstPassOk: string;
    finalCw: string;
    cameoNoScores: string;
    consistencyMeter: string;
    average: string;
    shotsNeedRegen: string;
    autoRetriedShots: string;
    batchRetryTitle: string;
    retrying: string;
    batchRetryN: string;
    allShotsPass: string;
    weakestFirst: string;
    attMax6: string;
    attOver10: string;
    uploadFailedStatus: string;
    sendFailedStatus: string;
    deleteFailed: string;
    liveSyncOn: string;
    liveSyncConnecting: string;
    liveSyncOff: string;
    live: string;
    offline: string;
    commentsN: string;
    replyToName: string;
    removeAttachment: string;
    attCap6: string;
    uploadMediaHint: string;
    sendComment: string;
    hintWriter: string;
    hintChar: string;
    hintScene: string;
    hintBoard: string;
    hintDirector: string;
    hintEditor: string;
    hintProducer: string;
  };
  kitUi: {
    toggleTheme: string;
    switchToLight: string;
    switchToDark: string;
    playFailed: string;
    musicPreview: string;
    musicDefault: string;
    closeEsc: string;
    pause: string;
    play: string;
    spacePlayEsc: string;
    audioLoadFail: string;
    dialogAria: string;
    imagePreview: string;
    prevImage: string;
    nextImage: string;
    imageLoadFail: string;
    retryLoad: string;
    stageDirector: string;
    stageWriter: string;
    stageStoryboard: string;
    parallelStages: string;
    safeTop: string;
    safeSide: string;
    safeBottom: string;
    safeBelt: string;
    expandAll: string;
    collapseAll: string;
    shotN: string;
    sceneDesc: string;
    dialogue: string;
    action: string;
    emotionMood: string;
    scriptView: string;
    scriptShotCount: string;
    polishTitle: string;
    polish: string;
    copyFull: string;
    copied: string;
    copy: string;
    downloadTxt: string;
    noShots: string;
    actN: string;
    beatSheet: string;
    beatSheetPlain: string;
    scene: string;
    characters: string;
    emotion: string;
    emotionTemp: string;
    camera: string;
    lighting: string;
    composition: string;
    sound: string;
    subtext: string;
    dialogueLabel: string;
    synopsis: string;
    genre: string;
    visualPrompt: string;
    duration: string;
    overSizeMb: string;
    unsupportedFormat: string;
    dropRejected: string;
    localComposeGone: string;
    oldTmpCompose: string;
    fixRerunWorkshop: string;
    cdnExpired: string;
    fixRegenShot: string;
    emptyComposeUrl: string;
    fixCheckBilling: string;
    sourceUnreachable: string;
    openVideoNewWindow: string;
    assetLost: string;
    assetForbidden: string;
    assetHttp: string;
    videoLoadNetwork: string;
  };
  readiness: {
    levelNone: string;
    levelScript: string;
    levelVisual: string;
    levelFilm: string;
    levelMediaOnly: string;
    stageScript: string;
    stageStoryboardPlan: string;
    stageAudit: string;
    stageStoryboardImage: string;
    stageShotVideo: string;
    stageTts: string;
    stageLipsync: string;
    stageAssemble: string;
    engineLlm: string;
    engineImage: string;
    engineVideo: string;
    engineTts: string;
    engineLipsync: string;
    hintLlm: string;
    hintImage: string;
    hintVideo: string;
    hintTts: string;
    hintLipsync: string;
    storageS3Ok: string;
    storageS3Partial: string;
    storageLocal: string;
  };
  providerHealth: Record<string, string>;
}

const zhCN: Translations = {
  collab: { notifTitle: '通知', markAllRead: '全部标已读', justNow: '刚刚', mentioned: '提到了你', replied: '回复了你', notifEmpty: '暂无通知', loginPrompt: '登录后查看通知', reply: '回复', deleted: '[已删除]', commentPlaceholder: '写评论… @ 提及他人', commentEmpty: '还没有评论,来抢沙发', send: '发送', confirmDelete: '确认删除这条评论?', demoMode: '演示模式', demoEnginesOff: '引擎未配置', demoPlaceholder: '生成将使用占位 / 示意资产', demoLipsyncReady: '口型渲染已零配置可用', demoHowToEnable: '如何启用', demoImage: '图像生成', demoVideo: '视频生成', readinessTitle: '引擎配置', readinessReal: '真', readinessSim: '示意' },
  common: {
    create: '创建',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    share: '分享',
    download: '下载',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    viewAll: '查看全部',
    backHome: '返回首页',
    saveChanges: '保存更改',
    saving: '保存中...',
    reset: '重置',
  },
  brand: {
    studio: 'AI 漫剧工作室',
  },
  nav: {
    home: '首页',
    projects: '我的项目',
    create: '开始创作',
    pricing: '定价',
    profile: '个人资料',
    settings: '设置',
    polish: '剧本润色',
    workbench: '工作台',
    cases: '作品案例',
    userCenter: '用户中心',
    newProject: '新建项目',
  },
  auth: {
    brand: '青枫漫剧',
    welcomeBack: '欢迎回到青枫漫剧',
    createAccount: '创建账户',
    loginSubtitle: '使用账号进入创作工作台',
    registerSubtitle: '注册开始你的创作之旅',
    username: '用户名',
    usernamePlaceholder: '输入用户名',
    email: '邮箱',
    emailPlaceholder: '输入邮箱地址',
    password: '密码',
    passwordPlaceholder: '输入密码',
    demoHint: '演示账号:demo@qfmanju.ai(密码由部署方 DEMO_PASSWORD 提供)',
    login: '登录',
    register: '注册',
    loginSuccess: '登录成功',
    registerSuccess: '注册成功',
    actionFailed: '操作失败',
    noAccount: '还没有账户？',
    hasAccount: '已有账户？',
    registerNow: '立即注册',
    loginNow: '立即登录',
    inviteCode: '邀请码',
    inviteRequired: '(Beta 版必填)',
    inviteNotFound: '邀请码不存在',
    inviteUsed: '该邀请码已被使用',
    inviteExpired: '邀请码已过期',
    inviteRevoked: '邀请码已被撤销',
    inviteInvalid: '邀请码格式无效',
    inviteGenericInvalid: '邀请码无效',
    inviteValid: '邀请码有效',
    inviteChecking: '校验中...',
    inviteValidateFailed: '验证失败，请稍后重试',
    noInvite: '没有邀请码？',
    applyBeta: '申请内测',
    waitlistTitle: '申请内测',
    waitlistDesc: '留下邮箱，我们会在审核通过后发送邀请码',
    waitlistPurpose: '使用场景 (可选)',
    waitlistPurposePlaceholder: '例如：想做自己的连载漫剧 / 用来给客户做广告片 / 学习 AI 视频...',
    waitlistSubmit: '加入 Waitlist',
    waitlistSubmitting: '提交中...',
    waitlistDefaultOk: '已加入等待列表，审核结果将通过邮件通知',
    waitlistSubmitFailed: '提交失败，请稍后重试',
    waitlistNetworkError: '网络错误',
  },
  sidebar: {
    overview: '创作总览',
    myProjects: '我的项目',
    workshop: '创作工坊',
    shortVideo: '极速分镜台',
    storyIntake: '长篇拆解',
    series: '我的系列',
    polish: '剧本润色',
    u2v: '单图变视频',
    mv: 'MV 卡点',
    comic: '漫转视频',
    editChat: '对话式编辑',
    assets: '素材库',
    characters: '角色库',
    ipMarket: 'IP 市场',
    workflows: '工作流',
    masterPrompt: 'MasterPrompt',
    styles: '风格画廊',
    cases: '灵感库',
    templates: '模板市场',
    account: '账户',
    team: '团队',
    health: 'API 健康',
    usage: '用量成本',
    jobs: '任务队列',
    billing: '订阅 / 计费',
    logout: '退出',
    expand: '展开侧边栏',
    collapse: '收起侧边栏',
    backHome: '返回首页',
  },
  errors: {
    title: '出错了',
    description: '应用遇到了一个意外错误,我们已经记录了这个问题。',
    retry: '重试',
    backHome: '返回首页',
    pageTitle: '页面出错了',
    unknown: '发生了未知错误,请重试。',
    backWorkbench: '回工作台',
    loading: 'Loading',
  },
  dashProjects: {
    eyebrow: '项目库',
    title: '我的项目',
    subtitle: '管理和追踪你的 AI 漫剧创作',
    newCreate: '新建创作',
    filterAll: '全部',
    filterActive: '创作中',
    filterCompleted: '已完成',
    filterDraft: '草稿',
    filterArchived: '已下架',
    emptyAll: '还没有创作项目',
    emptyFiltered: '没有符合条件的项目',
    emptyHint: '输入你的创意，AI 团队将自动为你完成从剧本到成片的全流程创作',
    startCreate: '开始创作',
    importing: '导入中…',
    importDemo: '导入演示工程《雨夜信号》',
    importDemoHint: '演示工程无需任何 API key — 4 镜悬疑短剧,成片/审计/导出即刻可看',
    untitled: '未命名',
    deleteConfirm: '确定删除「{title}」?此操作不可恢复(连同分镜/视频/配音等全部资产)。',
    restoreTitle: '恢复到主列表',
    archiveTitle: '下架(从主列表移走,可恢复)',
    deleteTitle: '删除项目(不可恢复)',
    shotsUnit: '镜',
    polished: '已润色',
    polishBtn: '润色',
    polishTitle: '用 Polish Studio 对该项目剧本做润色/行业诊断',
    statusCompleted: '已完成',
    statusActive: '创作中',
    statusDraft: '草稿',
    statusArchived: '已下架',
  },
  dashBanner: {
    title: 'API 状态告警',
    itemsUnit: '项',
    autoFallback: '创作流程会自动降级到备选引擎; 如需充值, 请联系管理员或查看',
    billingLink: '计费页',
    dismiss: '本次会话不再提示',
    exhausted: '余额耗尽',
    saturated: '上游饱和',
    rateLimited: '触发限流',
    authFailed: '鉴权失败',
    modelUnavailable: '套餐不支持此模型',
    kling: '可灵 (视频)',
    qingyuntop: '青云顶 (聚合网关)',
  },
  continueCard: {
    eyebrow: '继续创作',
    statusActive: '创作中',
    statusDraft: '草稿',
    statusCompleted: '已完成',
    draftReadyLabel: '回到工坊,开机 ROLL',
    draftReadyHint: '剧本草稿已就绪,还没跑完整流水线',
    draftEmptyLabel: '补全设定,开机 ROLL',
    draftEmptyHint: '这部还停在创意阶段 —— 30 字创意即可开拍',
    activeLabel: '查看创作进度',
    activeHint: '流水线进行中;阶段细节可在「任务队列」查看',
    completedLabel: '看成片 · 跑审计 · 导出',
    completedHint: '试试节奏审计与 EDL/AAF 导出,弱镜可单镜 4K 重渲',
    openLabel: '打开项目',
    openHint: '从上次停下的地方继续',
  },
  product: {
    director: '导演', writer: '编剧', characterDesign: '角色设计', sceneDesign: '场景设计',
    storyboard: '分镜', videoGen: '视频生成', editor: '剪辑师', producer: '制片人',
    untitled: '未命名项目', creating: '创作中', collapseChat: '收起对话面板', expandChat: '展开对话面板',
    timeline: '时间线', shotsUnit: '镜头', generating: '生成中...', pending: '待生成', shotN: '镜头 {n}',
    tabDirector: '导演台', tabScript: '剧本', tabCharacters: '角色', tabScenes: '场景', tabStoryboard: '分镜',
    tabContinuity: '连贯性', tabVideos: '视频', tabWorkshop: '镜头工坊', tabTimeline: 'Cinema 时间线',
    tabPacing: '节奏分析', tabPullsheet: '拉片', tabVision: '成片质检', tabOneclick: '一键成片',
    tabMonitor: '技术监看', tabParam: '参数联动', tabComments: '评论协作', tabDistribution: '分发', tabPlay: '完整播放',
    groupCreate: '创作', groupRefine: '精修', groupReview: '审校', groupDeliver: '交付',
    statShots: '镜头', statCast: '角色', statScore: '评分', statStatus: '状态', statusDone: '已完成', statusMaking: '制作中',
    emptyCharacters: '还没有角色', emptyScenes: '还没有场景', emptyVideos: '还没有镜头视频',
    saved: '项目已自动保存', undone: '已撤销', nothingToUndo: '暂无可撤销操作',
    hotkeys: '快捷键', hotkeysDesc: 'Ctrl/⌘+S 保存 · Ctrl/⌘+Z 撤销 · Space 播放 · ? 帮助',
    videoPreview: '视频预览', openNewWindow: '在新窗口中打开', close: '关闭', videoLoadFail: '视频加载失败',
    dropUploading: '上传中...', dropFailed: '上传失败', dropRetry: '上传失败,请重试',
    dropHint: '拖拽文件到这里，或点击选择文件', dropHintSub: '支持图片和视频，最大 50MB', dropHere: '放开以上传文件...',
    phasePlan: '导演规划', phaseScript: '编写剧本', phaseCharacters: '设计角色', phaseScenes: '构建场景',
    phaseStoryboardPlans: '分镜规划', phaseStoryboards: '渲染分镜', phaseVideo: '生成视频',
    phasePacing: '节奏审计', phaseEdit: '剪辑合成', phaseReview: '导演审核', phaseComplete: '完成',
  },
  create: {
    badge: 'AI 创作工作台',
    title: '开始你的创作之旅',
    subtitle: '描述你的故事创意，AI 团队将为你打造完整的漫剧作品',
    ideaLabel: '故事创意',
    ideaPlaceholder: '例如：一个关于时间旅行者的爱情故事...',
    videoProviderLabel: '视频生成引擎',
    startButton: '开始创作',
  },
  projects: {
    title: '我的项目',
    subtitle: '管理你的所有 AI 漫剧创作',
    searchPlaceholder: '搜索项目标题或描述...',
    filterAll: '全部',
    filterCompleted: '已完成',
    filterCreating: '创作中',
    filterFailed: '失败',
    noResults: '没有找到匹配的项目',
    createNew: '创建新项目',
    shotsUnit: '个镜头',
  },
  dashboard: {
    systemOnline: '系统在线',
    title: '创作总览',
    subtitle: 'AI 多智能体协作引擎，从创意到成片的一站式漫剧生产线',
    quickStartTitle: '开始创作',
    quickStartSubtitle: '输入创意，AI 七人团队自动接力创作',
    statProjects: '我的项目',
    statProjectsSub: '创作中的漫剧项目',
    statGenerations: '生成次数',
    statGenerationsSub: '累计 AI 生成调用',
    statCases: '案例库',
    statCasesSub: '可参考的模版案例',
    recentCreations: '最近创作',
    noRecords: '还没有创作记录',
    startFirst: '开始第一次创作 →',
    systemStatus: '系统状态',
    recentActivity: '最近动态',
    statusCompleted: '已完成',
    statusCreating: '创作中',
    statusDraft: '草稿',
  },
  settings: {
    title: '设置',
    subtitle: '管理你的应用偏好和账户设置',
    general: '通用设置',
    generalDesc: '语言和地区偏好',
    language: '语言',
    appearance: '外观',
    appearanceDesc: '自定义界面主题',
    theme: '主题',
    themeDark: '深色模式',
    themeLight: '浅色模式',
    themeAuto: '跟随系统',
    notifications: '通知',
    notificationsDesc: '管理通知偏好',
    projectDone: '项目完成通知',
    projectDoneDesc: '当项目创作完成时接收通知',
    performance: '性能',
    performanceDesc: '优化应用性能',
    videoQuality: '视频质量',
    qualityHigh: '高质量',
    qualityMedium: '中等质量',
    qualityLow: '低质量（节省流量）',
    privacy: '隐私与安全',
    privacyDesc: '保护你的账户安全',
    changePassword: '修改密码',
    enable2fa: '启用两步验证',
    manageDevices: '管理已登录设备',
    billing: '账单与订阅',
    billingDesc: '管理你的订阅计划',
    freePlan: '免费计划',
    currentPlan: '当前计划',
    freeQuota: '每月 10 个项目额度',
    upgradePro: '升级到专业版',
    saved: '设置已保存',
    savedDesc: '你的偏好设置已更新',
    resetDone: '设置已重置',
  },
  profile: {
    title: '个人资料',
    subtitle: '管理你的个人信息和偏好设置',
    avatar: '头像',
    uploadAvatar: '上传头像',
    basicInfo: '基本信息',
    basicInfoDesc: '更新你的个人资料',
    username: '用户名',
    email: '邮箱',
    bio: '个人简介',
    bioPlaceholder: '介绍一下你自己...',
    stats: '创作统计',
    totalProjects: '总项目数',
    inProgress: '进行中',
    totalShots: '总镜头数',
    saveSuccess: '保存成功',
    saveSuccessDesc: '个人资料已更新',
    role: '角色',
    accountPrefs: '账号与偏好设置',
    visualPref: '视觉偏好',
    collabSpace: '协作空间',
  },
  billing: {
    title: '订阅管理',
    currentTier: '当前档位：',
    paymentNote: '支付走 Stripe Checkout(国际版),取消 / 改卡走 Stripe Customer Portal',
    recommended: '推荐',
    currentBadge: '当前档位',
    contactUs: '联系我们',
    perMonth: '/月',
    alreadyThis: '已是此档位',
    freeNoPurchase: '免费 · 无需购买',
    businessTalk: '商务洽谈',
    upgradeTo: '升级到',
    portalNote: '升级 / 降级 / 取消 / 改支付方式都在 Stripe Customer Portal 完成;自托管需配置 STRIPE_PORTAL_LINK。',
    openPortal: '打开 Stripe Customer Portal',
    checkoutFailed: 'Checkout 失败',
    paymentCanceled: '已取消支付',
    upgradedPrefix: '已升级到',
    upgradedSuffix: '!订阅已激活',
  },
  cases: {
    title: '案例库',
    titlePublic: '案例精选',
    subtitle: '来自青枫漫剧合作伙伴与创作者',
    subtitleReuse: '来自青枫漫剧合作伙伴与创作者 · 点击一键复用创意',
    copyPrompt: '复制提示词',
    copied: '已复制',
    usePrompt: '用这个创作',
  },
  home: {
    heroTagline1: '/ AI 短剧制作台 · 不止生成',
    heroTagline2: '节奏审计 · 质量门禁 · 角色锁脸一致性 · AAF/EDL 进剪辑线 · 团队协作 — 把「能出片」变成「能交付」',
    heroEngines: '生成层 · 接入当下最强引擎(BYO Key)',
    heroCtaCreate: '开始创作 →',
    heroCtaCases: '查看作品',
    featureTitle: '像导演一样掌控节奏',
    featureSubtitle: '脚本、分镜、动画、音效全流程可视化协作。',
    agentsTitle: '一支 AI 动画 Agent 团队',
    agentsSubtitle: '每一个角色都在实时协作。',
    lensCaption: '镜头盒：自定义镜头运动、焦段、视角',
    lensTitle: '镜头语言统一到每一帧',
    lensDesc: '统一风格、色彩与镜头运动规则。',
    frameTitle: '分镜由 AI 快速生成',
    frameSubtitle: '从一句话出发，得到可编辑的多镜头序列。',
    frameSteps: [
      { title: '脚本结构', desc: '智能拆解剧情节奏' },
      { title: '镜头拆解', desc: '自动生成多镜头分镜' },
      { title: '角色设定', desc: '保持角色与风格一致' },
    ],
    frameCta: '生成分镜',
    vibeKicker: '氛围板：实时更新视觉和音效',
    vibeTitle: '氛围与节奏实时预览',
    vibeDesc: '画面、镜头、配乐同时驱动情绪。',
    casesTitle: '案例精选',
    casesSubtitle: '来自青枫漫剧合作伙伴与创作者。',
    casesTryNow: '立即体验',
    ctaTitle: '把故事变成动画',
    ctaDesc: '现在就开始你的第一部 AI 漫剧',
    ctaButton: '进入工作台',
  },
  pricing: {
    enterWorkbench: '进入工作台',
    badge: '定价方案',
    titleLead: '选择适合你的',
    titleHighlight: '创作套餐',
    subtitle: '从免费体验到企业私有化部署，青枫漫剧为每位创作者提供最合适的 AI 漫剧制作方案',
    custom: '定制',
    customNote: '按需报价，联系销售',
    free: '免费',
    startUsing: '开始使用',
    apiAccess: 'API 访问',
    commercialLicense: '商业授权',
    footnote: '所有套餐均包含 7×24 小时 AI 引擎支持 · 付款后立即生效 · 随时可取消',
    faqTitle: '常见问题',
    faq: [
      { q: '免费版有哪些限制？', a: '免费版每月可创建 3 个项目，角色库最多存储 5 个角色，视频导出分辨率为 720p，并包含青枫水印。适合个人体验使用。' },
      { q: '升级后能立即使用新功能吗？', a: '是的，付款成功后系统将立即激活对应套餐的权益，无需等待审核。' },
      { q: '专业版的商业授权包含哪些范围？', a: '专业版商业授权允许将使用青枫漫剧生成的内容用于商业目的，包括广告、品牌宣传、影视发行等，但不包含源模型的二次训练权利。' },
      { q: '企业版与专业版的主要区别是什么？', a: '企业版支持私有化部署，可将整套 AI 系统部署在您的私有服务器上，并提供自定义 AI 智能体开发、SLA 保障和专属客户成功经理服务。' },
      { q: '可以随时取消订阅吗？', a: '可以，您可以随时在账户设置中取消订阅。取消后，当前付费周期结束前仍可正常使用所有功能。' },
    ],
    moreTitle: '还有其他问题？',
    moreDesc: '我们的团队随时为你解答疑问',
    contactSupport: '联系支持团队',
    alertPayment: '支付尚未接入，当前为免费 / 自托管版本。',
  },
  help: {
    examples: '示例作品',
    title: '帮助中心',
    subtitle: '找到你需要的答案，快速上手 AI 漫剧创作',
    searchPlaceholder: '搜索帮助文档...',
    quickGuides: '快速指南',
    guides: [
      { title: '快速开始', description: '5分钟学会创作你的第一个 AI 漫剧' },
      { title: '创作指南', description: '掌握 AI 漫剧创作的技巧和最佳实践' },
      { title: '社区教程', description: '来自创作者社区的经验分享' },
    ],
    faqTitle: '常见问题',
    faqs: [
      { q: '如何开始创作我的第一个项目？', a: '点击「开始创作」按钮，输入你的故事创意，选择视频生成引擎，AI 会自动为你生成完整的漫剧作品。' },
      { q: '支持哪些视频生成引擎？', a: '我们支持 Minimax、Vidu 和可灵 AI 等多个视频生成引擎，你可以根据需求选择最适合的引擎。' },
      { q: '生成一个项目需要多长时间？', a: '通常需要 5-15 分钟，具体时间取决于项目复杂度和所选的视频生成引擎。' },
      { q: '可以编辑 AI 生成的内容吗？', a: '是的，你可以编辑剧本、调整角色设计、修改分镜图，完全掌控创作过程。' },
      { q: '生成的作品可以商用吗？', a: '生成素材的版权归属各底层生成引擎(Kling / MiniMax 等),是否可商用取决于各引擎的服务条款,请自行核对。青枫仅提供多智能体编排与后期编辑工具,不对生成素材的商用权利作担保。' },
      { q: '如何导出我的作品？', a: '在项目详情页点击「下载」按钮，可以导出视频、图片和剧本等所有素材。' },
    ],
    moreTitle: '还有其他问题？',
    moreDesc: '我们的支持团队随时为你提供帮助',
    sendEmail: '发送邮件',
    liveChat: '在线客服',
  },
  examples: {
    title: '精选作品',
    subtitle: '探索由 AI 创作的精彩漫剧作品',
    ctaTitle: '准备好创作你的作品了吗？',
    ctaDesc: '加入数千位创作者，开始你的 AI 漫剧创作之旅',
    ctaButton: '立即开始创作',
  },

    visionAudit: {
      verdictExcellent: "优秀",
      verdictGood: "良好",
      verdictNeedsWork: "待优化",
      verdictPoor: "需重做",
      noDataMessage: "还没有成片质检数据。生成成片后即可对每镜画面做「是否对得上剧本」的 AI 评分。",
      panelTitle: "成片质检 · 画面 vs 剧本",
      avgScore: "平均分",
      shotUnit: "镜",
      passLabel: "通过",
      warnLabel: "偏差",
      failLabel: "跑题",
      weakestShotsTitle: "最需关注 (优先重生):",
      rebirthPlanPrefix: "重生计划 · ",
      rebirthPlanSuffix: " 个弱镜建议重拍",
      reshootButton: "一键去工坊重拍",
      dimScene: "场景",
      dimAction: "动作",
      dimMood: "情绪",
      dimComposition: "构图",
    },
    usagePage: {
      eyebrow: "用量与成本",
      headline: "成本可观测",
      budgetLabel: "月预算 ¥",
      budgetPlaceholder: "不限",
      nearDays: "近",
      daySuffix: "天",
      daysCostSuffix: "天花费",
      refreshTitle: "刷新",
      loading: "加载中…",
      loadFailed: "加载失败",
      activeAlertsBanner: "活跃配额告警 · 近 1 小时",
      goBilling: "去计费",
      statusOk: "预算健康",
      statusWarn: "接近上限",
      statusOver: "已超预算",
      statusNone: "未设上限",
      alertExhausted: "额度耗尽",
      alertSaturated: "上游饱和",
      alertRateLimited: "限流",
      alertAuthFailed: "鉴权失败",
      alertModelUnavailable: "模型不可用",
      thisMonthBudget: "本月预算",
      quotaTitle: "本月配额",
      quotaUnlimited: "无上限",
      quotaExceeded: "已超档上限,请充值或改用经济引擎",
      quotaNearLimit: "接近档上限",
      quotaOfCeiling: "档上限",
      projectedEndPrefix: "预计月末",
      noCapSuffix: " · 未设上限",
      statGenerations: "生成次数",
      statEngines: "引擎数",
      engineCostPrefix: "引擎花费 · 近",
      engineNoData: "该窗口暂无成本记录。",
      dailyTrendTitle: "每日成本趋势",
      dailyNoData: "暂无每日数据。",
      countSuffix: "次",
    },
    healthPage: {
      title: "API 健康",
      subtitle: "各模型 / 网关实时状态 · 一眼看谁欠费或掉线",
      refreshBtn: "重新探测",
      loadFailed: "探测失败",
      kindLlm: "大模型",
      kindTts: "语音",
      kindVideo: "视频",
      kindImage: "图像",
      kindGateway: "网关",
      overallHealthy: "全部正常",
      overallWarning: "有警告",
      overallCritical: "有故障 / 欠费",
      balanceUsed: "已用",
      balanceAbundant: "额度充裕(充值制)",
      balanceRemaining: "剩余",
      balanceLimit: "上限",
      radarTitle: "模型雷达",
      radarDesc: "扫描各 API 支持的最新模型 · 同家族才升级 · LLM 先 1-token 实测 · 留回滚 · 免重启生效",
      scanBtn: "扫描最新模型",
      upgradeBtn: "一键升级到最新最强",
      statusUpgradable: "可升级",
      statusUpToDate: "已最新",
      statusFamilyN: "· 家族 {n} 款",
      statusSourceUnavail: "来源不可用",
      overridesTitle: "现行覆盖(可回滚到升级前):",
      rollbackBtn: "回滚",
      rollbackDefault: "(回代码默认)",
      checkedAt: "探测于",
      cachedNote: "· 缓存结果 (点「重新探测」强制刷新)",
      footer: "· 仪表盘只读各家额度,不存储/不回传任何 API Key。",
      scanFailed: "扫描失败",
      upgradeFailed: "升级失败",
      upgradeFailedLogin: "升级失败(需登录)",
      upgradeNone: "没有可升级项",
      upgradedSummary: "已升级 {n} 项:{list}{skipped} — 免重启已生效",
      upgradeSkippedNote: "({n} 项实测未过维持原值)",
      upgradeSomeSkipped: "{n} 项候选实测未通过,维持现配置",
      rolledBack: "{envKey} 已回滚",
    },
    seriesDetail: {
      statusDraft: "待生成",
      statusActive: "生成中",
      statusCompleted: "已完成",
      statusFailed: "失败·可重试",
      backLink: "返回",
      pageTitle: "系列剧 · 批量生成",
      statTotal: "共 {n} 集",
      statCompleted: "已完成 {n}",
      statGenerating: "生成中 {n}",
      statFailed: "失败 {n}",
      statPending: "待生成 {n}",
      batchGenerateBtn: "一键批量生成",
      batchGeneratePendingHint: "({n} 集待生成)",
      regenerateAll: "全部重生",
      seasonAssetsTitle: "季级产物",
      seasonCoverAlt: "季封面",
      genCoverBtn: "生成季封面",
      regenCoverBtn: "重生季封面",
      exportSeasonBtn: "导出整季合集",
      reexportSeasonBtn: "重导整季合集",
      exportFirstEpisodeHint: "先生成至少一集",
      watchSeasonVideo: "看整季合集",
      seasonVideoDesc: "合集 = 已完成各集成片按集号拼接(归一画幅 + 重编码)。",
      seasonFixBusyLabel: "⏳ 全季补渲中…",
      seasonFixLabel: "⚡ 全季补渲降级镜({n} 集受影响)",
      seasonFixProgressMsg: "第 {episode} 集补渲中({current}/{total})…",
      seasonFixDoneMsg: "全季补渲完成({n} 集),重新体检…",
      resumeStuckBtn: "🛟 恢复卡死的集(30 分钟无进展 → 重置待生成)",
      loading: "加载中…",
      noEpisodes: "该系列暂无剧集",
      episodeLabel: "第{n}集",
      healthCheckAllGreen: "体检全绿",
      shotsDowngradedLabel: "{n}镜降级",
      openEpisodeLink: "打开 →",
      loadFailStatus: "加载失败 {status},请刷新重试",
      loadFailNetwork: "加载失败,请检查网络后刷新",
      requestFailed: "请求失败",
      exportingSeasonMsg: "整季合集生成中(下载各集 + 拼接重编码,最长约 5 分钟,请勿关闭页面)…",
      exportCanceledMsg: "已取消导出 —— 可先全季补渲再导",
      exportFailedStatus: "导出失败 {status}",
      exportDoneMsg: "整季合集已生成({n} 集)",
      coverGeneratingMsg: "季封面生成中…",
      coverFailedStatus: "封面生成失败 {status}",
      coverDoneMsg: "季封面已生成",
      resumeCheckedMsg: "已检查",
      resumeFailedMsg: "恢复请求失败",
      resumeFailStatus: "失败 {status}",
      batchQueuedMsg: "已入队批量生成 {n} 集(持久队列,逐集进行中…)",
      batchStartedMsg: "已开始批量生成 {n} 集(并发 {concurrency},逐集进行中…)",
      noPendingEpisodes: "没有待生成的剧集",
      healthGateIssuePrefix: "问题集:",
      healthGateEpisodeDetail: "第{ep}集({shots}镜降级)",
      healthGateConfirmHint: "仍要导出吗?(建议先点「全季补渲降级镜」)",
      dramaPackageBtn: "📦 出海打包",
      dramaPackageFetching: "正在获取打包数据…",
      dramaPackageTitle: "出海打包 · TikTok Drama Center",
      dramaPackageDownload: "下载 JSON",
      dramaPackageCoverAlt: "系列封面",
      dramaPackageLangEpisodes: "语言:{lang} · 共 {n} 集",
      dramaPackageTotalMin: "总时长:{n} 分钟",
      dramaPackageEpFree: "免费",
      dramaPackageEpCoins: "{coins} coins",
      dramaPackageGuideTitle: "上传步骤",
      dramaPackageErrPrefix: "获取失败:",
      dramaPackageNetworkErr: "网络错误",
      dramaPackageViewVideo: "查看视频",
      dramaPackageAiDeclaration: "我确认本片由 AI 生成 / 深度合成技术制作,导出时将随包声明",
      dramaPackageAiRequiredHint: "请先勾选 AI 声明",
    },
  workshop: {
    poeticMist: "诗意水墨",
    poeticMistDesc: "朦胧意境",
    neoNoir: "新黑色",
    neoNoirDesc: "暗黑悬疑",
    inkWash: "水墨丹青",
    inkWashDesc: "东方写意",
    dreamwave: "梦境波浪",
    dreamwaveDesc: "迷幻梦境",
    cyberNeon: "赛博霓虹",
    cyberNeonDesc: "未来科幻",
    anime3d: "3D国创",
    anime3dDesc: "国漫风格",
    cinematic: "电影写实",
    cinematicDesc: "院线品质",
    ghibli: "吉卜力风",
    ghibliDesc: "温暖治愈",
    americanComic: "美漫",
    americanComicDesc: "美式超英漫画",
    mihoyoGame: "原神崩坏",
    mihoyoGameDesc: "游戏 CG 二次元",
    wushanInk: "雾山水墨",
    wushanInkDesc: "水墨飞白动作",
    haitangEthereal: "海棠唯美",
    haitangEtherealDesc: "唯美梦幻国漫",
    ideaCyberpunkTitle: "赛博朋克侦探",
    ideaCyberpunkContent: "2077年的新东京，一位赛博侦探接到神秘委托，调查连环失踪案，却发现背后隐藏着惊天阴谋",
    ideaPalaceTitle: "古代宫廷",
    ideaPalaceContent: "大唐盛世，一位才女入宫，凭借智慧在后宫中周旋，最终成为影响朝政的关键人物",
    ideaWastelandTitle: "末日废土",
    ideaWastelandContent: "核战后的世界，幸存者们在废墟中寻找希望，一个神秘信号指引他们前往传说中的避难所",
    ideaMagicTitle: "魔法学院",
    ideaMagicContent: "魔法学院新生入学，发现自己拥有罕见的魔法天赋，却也因此卷入了一场古老的魔法战争",
    urlExtractFailed: "自动提取失败,请手动输入",
    invalidInput: "输入无效",
    draftAdopted: "已采用草稿 #{id}, 进入完整创作流程",
    chatReceivedIdea: "收到创意：「{idea}」\n\n正在为你构思剧本、角色和分镜...",
    createFailed: "创作失败",
    streamReadFailed: "无法读取响应流",
    currentImage: "当前图像",
    assetSceneN: "场景{n}",
    chatPlanReady: "导演已制定计划：{genre}风格，{chars}个角色，{scenes}个场景。",
    chatScriptDone: "剧本「{title}」创作完成！\n\n{synopsis}\n\n共 {n} 个镜头。",
    chatCharsDone: "{n}个角色设计完成！",
    chatScenesDone: "{n}个场景概念图设计完成！",
    chatBoardsPlanned: "{n}个分镜描述规划完成，正在统一渲染分镜图...",
    assetSketchN: "镜头 {n} 草图",
    chatBoardsDone: "{n}个分镜图渲染完成！角色/场景/画风一致性已确保 ✅",
    assetVideoN: "视频 {n}",
    chatVideosDone: "{n}个视频片段全部生成完成！如需重新生成，请告诉我镜头编号和时长。",
    chatContinuityIssues: "连续性主表:{n} 处隐患 —— {list}{more}",
    chatContinuityMore: " 等 {n} 处",
    chatEditDone: "剪辑完成！{n}个镜头，总时长{sec}秒 ✂️",
    chatReviewDone: "审核完成！综合评分：{score}/100 {emoji}\n\n{summary}\n\n{items}{pass}",
    chatReviewItems: "发现 {n} 个改进建议。",
    chatReviewNone: "没有需要改进的地方。",
    chatReviewPass: "\n\n✅ 审核通过！",
    chatReviewFail: "\n\n⚠️ 未通过，正在自动优化...",
    chatComplete: "创作流程全部完成！所有资产已保存到项目中。\n\n你可以在「我的资产」中查看已确认的数字资产，或继续和各 Agent 对话进行调整。",
    stepFailed: "步骤失败",
    stageLabel: "阶段:{stage}",
    retryShot: "重试镜头 {n}",
    createError: "创作出错",
    retryCurrentStep: "重新开始当前步骤",
    previewSeeded: "已复用试拍图作为第 1 镜首帧, 进入完整创作",
    slateNotes: "从一句创意到完整短剧 — 设定文本 · 角色 · 风格 · 时长后开机",
    createModeAria: "创作模式",
    modeSimple: "简易",
    modePro: "专业",
    previewShot: "试拍 1 镜",
    previewShotTitle: "生成 1 张图 + 5s 视频, 30-60s, 不消耗完整 pipeline 算力",
    needTenChars: "至少输入 10 个字符",
    enterWorkshop: "进入创作工坊",
    rollReady: "开机 · ROLL",
    awaitingIdea: "待输入创意",
    noInspiration: "没灵感?用创意生成器搭一段导演级提示词 →",
    noInspirationTitle: "结构化导演级提示词 · 影片 look / LUT / 导演运镜预设 · 专业术语表",
    act1: "ACT 1 · 创意 + 设定",
    act2: "ACT 2 · 镜头规格",
    act3: "ACT 3 · 灵感库",
    urlPlaceholder: "贴商品/品牌页链接,自动提取创意",
    extracting: "提取中…",
    extract: "提取",
    scriptEyebrow: "Script · 创意 / 剧本",
    ideaPlaceholder: "支持两种输入:\n1. 简短创意:暮色城市中的旅人,霓虹雨夜...\n2. 完整剧本:直接粘贴含场景、角色对白、△画面描述的剧本文本",
    templateNeedIdea: "至少输入 10 字 idea 后才能存为模板",
    templateNamePrompt: "给这个模板起个名字 (≤40 字)",
    templateNameDefault: "我的模板",
    templateDesc: "自定义模板 · {style} · {duration} · {aspect}",
    customTemplateHint: "基于用户当前 idea 的自定义模板, 无预设结构提示, Director/Writer 按 idea 自由发挥",
    templateSaveFailed: "保存失败: {error}",
    templateSaved: "已保存模板「{name}」, 下次创作直接选",
    lookEyebrow: "Look · 画风预设",
    durationEyebrow: "Duration · 单镜时长",
    aspectEyebrow: "Aspect · 画幅",
    engineEyebrow: "Engine · 视频引擎",
    klingLabel: "可灵 AI",
    klingSub: "官方API · 已接入",
    editStyleTitle: "剪辑风格 · 一句话调节奏",
    editStyleDefault: "默认中速",
    editStyleFast: "⚡ 快节奏燃向",
    editStyleSlow: "🌙 慢叙抒情",
    editStylePlaceholder: "或自定义:「抖音爆款卡点」「王家卫式留白」(配 LLM key 智能解析)",
    scriptLanguageLabel: "剧本语言 · 台词/旁白/配音语种",
    sketchLockTitle: "分镜草图锁",
    sketchLockBadge: "(实验 · 构图更可控)",
    sketchLockDesc: "每镜先出黑白构图草图,再按草图锁构图/机位渲染分镜 —— 输出更贴镜头语言设计;代价:每镜多一次出图。草图会保存,可在镜头工坊逐镜查看/替换。",
    styleApplied: "已应用风格: {style}",
    draftsEyebrow: "Drafts · 草稿对比",
    draftDirect: "直跑 ×1",
    draftCompare: "对比 ×{n}",
    draftDirectTitle: "直接生成 1 个剧本",
    draftCompareTitle: "先生成 {n} 个版本对比, 选完再走完整流程",
    draftCompareHint: "↑ 点 ROLL 后会先弹 {n} 个剧本草稿对比, 选完再走完整流程 (额外 +30-60s)",
    readoutEyebrow: "Readout · 设定预览",
    previewEyebrow: "Live Preview · 实时预览",
    inspirationEyebrow: "Inspiration · 灵感库",
    modeEpisodic: "连续剧集",
    modeEpisodicDesc: "多集连续叙事，角色与世界观强一致",
    modeEpisodicF1: "跨集角色一致",
    modeEpisodicF2: "世界观锁定",
    modeEpisodicF3: "3-20 集批量",
    modeEpisodicEst: "每集 12-20 分钟",
    modeEpisodicFor: "番剧 / 连载短剧",
    modeMv: "MV 音乐视频",
    modeMvDesc: "音乐节拍驱动，歌词与画面精准对齐",
    modeMvF1: "歌词分段上屏",
    modeMvF2: "节拍同步切镜",
    modeMvF3: "情绪匹配配色",
    modeMvEst: "3-5 分钟出片",
    modeMvFor: "原创 MV / 二创饭制",
    modeQuick: "速创 60s",
    modeQuickDesc: "一句话直出 60 秒短视频，抖音快手风格",
    modeQuickF1: "一键生成",
    modeQuickF2: "自动封面",
    modeQuickF3: "竖屏 9:16",
    modeQuickEst: "3-8 分钟出片",
    modeQuickFor: "日更短视频 / 热点跟拍",
    modeComic: "漫画转动画",
    modeComicDesc: "上传静态漫画/分镜，转换为动态视频",
    modeComicF1: "OCR 识别气泡",
    modeComicF2: "镜头运动生成",
    modeComicF3: "配音自动匹配",
    modeComicEst: "10-25 分钟",
    modeComicFor: "漫画动态化 / 绘本改编",
    modeIp: "IP 衍生创作",
    modeIpDesc: "基于已有角色/IP 进行二次创作",
    modeIpF1: "角色记忆复用",
    modeIpF2: "风格锁定",
    modeIpF3: "多场景批产",
    modeIpEst: "8-15 分钟",
    modeIpFor: "粉丝二创 / IP 拓展",
    resolutionTitle: "分辨率",
    resolutionHint: "创建最高 720P · 成片后单镜可「4K 重渲」(Kling Master · plan-gated)",
    tier360Desc: "草稿档，快速验证分镜",
    tier480Desc: "标准档，社交分发可用",
    tierRecommended: "推荐",
    tier720Desc: "高清档，适合成片",
    estimated: "预估",
    aspectTitle: "画面比例",
    aspectLocked: "此模式强制固定比例",
    aspectLandscape: "横屏 16:9",
    aspectPortrait: "竖屏 9:16",
    aspectSquare: "方形 1:1",
    styleTabAll: "全部",
    styleTabPopular: "热门",
    styleTabRealistic: "写实",
    styleTabAnime: "动画",
    styleTabArtistic: "艺术",
    styleTabRetro: "复古",
    styleTabExperimental: "实验",
    styleSearch: "搜索风格...",
    styleEmpty: "没有找到匹配的风格",
    styleClear: "清空选择",
    selectStyle: "选择风格 {name}",
    engineSeedance: "即梦 2.0",
    wizardStepMode: "创作模式",
    wizardStepModeDesc: "选择你想生成的内容类型",
    wizardStepStyle: "视觉风格",
    wizardStepStyleDesc: "从 60 个预设中挑选",
    wizardStepAssets: "资产复用",
    wizardStepAssetsDesc: "从记忆库选已有角色/场景/道具",
    wizardStepDetails: "内容细节",
    wizardStepDetailsDesc: "Prompt + 分辨率 + 时长",
    wizardStepReview: "确认提交",
    wizardStepReviewDesc: "预览并启动生成",
    wizardPrev: "上一步",
    wizardNext: "下一步",
    wizardSubmitting: "提交中...",
    wizardLaunch: "启动生成",
    wizardTitleLabel: "项目标题",
    wizardTitlePlaceholder: "例：灵眸·短篇漫剧 第 1 集",
    wizardPromptLabel: "创作 Prompt",
    wizardPromptPlaceholder: "描述你想生成的画面/故事。例：晨雾中的古镇，一位身着汉服的少女抱着古琴漫步石板路...",
    wizardPromptHint: "{n} 字 · 至少 5 个字符",
    wizardDurationLabel: "单镜头时长（秒）",
    wizardUnset: "(未选择)",
    wizardUnfilled: "(未填写)",
    wizardStylePreset: "风格预设",
    wizardGlobalAssets: "全局资产",
    wizardAssetsPicked: "已选 {n} 个",
    wizardNonePicked: "未选择",
    wizardResAspect: "分辨率 / 比例",
    wizardDurationShort: "单镜头时长",
    wizardPromptPreview: "最终 Prompt 预览",
    wizardEmpty: "(空)",
  },
  workshopCreate: {
    searchPlaceholder: "搜索模板名 / 标签 / 类别",
    cloneNameSuffix: "{name} (副本)",
    cloneFailed: "模板克隆失败",
    deletePersonalConfirm: "删除个人模板 \"{name}\" ?",
    importInvalidSchema: "不是 Wind Comic 模板 JSON. 请用 \"导出\" 按钮生成的文件.",
    importMissingName: "JSON 里缺 name 字段, 无法导入",
    importNameSuffix: "{name} (导入)",
    importFailed: "导入失败 ({status})",
    importSuccess: "已导入: {name}",
    importParseFailed: "JSON 解析失败",
    importParseFailedWith: "JSON 解析失败: {message}",
    shareLinkFailed: "生成分享链接失败",
    shareExpiresOn: "此链接 {date} 过期",
    shareForever: "永久有效",
    shareCopied: "分享链接已复制到剪贴板:\n{url}\n\n任何人打开都能看到这个模板, 也能克隆到自己库。{expiry}",
    shareManual: "分享链接 (请手动复制):\n{url}{expiry}",
    templateLibraryTitle: "Genre · 故事模板库",
    templateCounts: "{builtin} 内置 · {personal} 个人 · 当前显示 {visible}",
    filterByTags: "按标签筛选",
    filter: "筛选",
    filterAndHint: "FILTER · 选 1 个或多个 (AND)",
    clearFilters: "清空筛选",
    sort: "排序",
    sortDefault: "默认顺序",
    sortPersonalFirst: "个人优先",
    sortBuiltinFirst: "内置优先",
    saveAsTemplateHint: "把当前选定的画风 + idea + 镜头设置存为个人模板",
    saveAsTemplate: "存为模板",
    importJsonHint: "从 JSON 文件导入模板 (绕开分享链接, 适合离线协作)",
    importJson: "导入 JSON",
    noMatchingTemplates: "没有匹配的模板。",
    tryClearSearch: "试着清空搜索",
    tryClearFilter: "/筛选",
    expandDetails: "展开详情",
    details: "详情",
    cloneAsMine: "克隆为我的模板",
    clone: "克隆",
    saveToMyLibrary: "保存到我的库",
    shareHint: "生成公开分享链接, 让别人能看到 + 克隆这个模板",
    linkExpiry: "链接有效期",
    expiry1Day: "1 天",
    expiry7Days: "7 天 (推荐)",
    expiry30Days: "30 天",
    expiryForever: "永久 ♾️",
    expiryNote: "过期后链接自动失效, 已克隆的副本不受影响",
    exportJsonHint: "导出为 JSON 文件 (可分享给团队 / 备份)",
    loadingPersonal: "加载个人模板…",
    cameoLockTitle: "CAMEO LOCK · 角色锁脸",
    cameoLockHeading: "角色锁脸",
    cameoLockOptional: "(可选 · 最多 3 人)",
    cameoLockHint: "上传后,该角色在全片所有镜头里脸都会锁定",
    cameoLockHintShort: "UP TO 3 · 全片锁脸",
    pickFromLibrary: "从角色库带出",
    loadingLibrary: "加载角色库…",
    libraryEmpty: "角色库还是空的 —— 在「角色工坊」里保存角色,或完片后手动入库,下次这里一键带出",
    pickNamed: "带出「{name}」",
    slotsFull: "3 个槽位已满,先清空一个再带出",
    roleLead: "主角",
    roleAntagonist: "对手",
    roleSupporting: "配角",
    roleCameo: "客串",
    reusedSimilar: "已复用库里相似角色「{name}」的形象",
    reusedBible: "已复用「{name}」的历史档案",
    traitsLowConfidence: "自动识别置信度低,可手动调整",
    imageOnly: "只能上传图片",
    imageTooLarge: "图片太大(上限 10MB)",
    urlMustHttp: "URL 必须以 http:// 或 https:// 开头",
    urlFetchFailed: "URL 抓取失败",
    bibleFound: "已找到「{name}」",
    bibleUsedIn: "{n} 个历史项目用过",
    reuseOnce: "一键复用",
    similarHint: "你库里有相似角色,复用可保跨集一致",
    similarity: "相似度 {n}%",
    hasDna: " · 带 DNA",
    reuseLook: "复用形象",
    characterAlt: "角色 {slot}",
    characterNamePlaceholder: "角色名(例如 李长安)",
    characterNameAria: "角色名",
    characterRoleAria: "角色定位",
    uploadFile: "上传文件",
    useUrl: "用 URL",
    clear: "清除",
    fetchUrl: "抓取",
    extractingTraits: "AI 正在从这张脸抽取角色档案...",
    genderMale: "男",
    genderFemale: "女",
    aiTraits: "AI 抽取档案",
    lowConfidence: "置信度低",
    previewQuotaDone: "今天的试拍次数已用完",
    requestFailed: "请求失败 ({status})",
    previewFailed: "试拍失败",
    deletePreviewConfirm: "删除这条试拍记录?",
    previewTitle: "试拍 · 1 镜端到端",
    quotaChipTitle: "{tier} 档每天上限 {limit} 次",
    toggleHistory: "显示/隐藏 试拍历史",
    history: "历史",
    quotaRefreshBefore: "明天 0:00 (UTC) 配额刷新, 或",
    upgradeAccount: "升级账户",
    quotaRefreshAfter: "获得更高额度.",
    historyHeading: "HISTORY · 你之前的试拍 ({n})",
    refresh: "刷新",
    noHistory: "还没有历史记录",
    noImage: "无图",
    previewLoadingVideo: "出图 + 5s 视频生成中, 通常 30-60s ...",
    previewLoadingImage: "出图中, 通常 15-30s ...",
    previewLoadingHint: "试拍只动 1 镜 + MJ + Minimax I2V, 不消耗完整 pipeline 算力",
    previewImageAlt: "试拍图",
    includeVideo: "包含 5s 视频 (慢一点, 但能看到运镜效果)",
    tryAgain: "再试一次",
    abandon: "放弃",
    acceptPreview: "用这张图走全流程",
    acceptPreviewHint: "第 1 镜直接用这张图, 后续镜头以它为画风基准",
    guideStep1Title: "① 写下你的创意",
    guideStep1Desc: "30 字以上、带题材线索(悬疑/爱情/古风…)效果最好;也可以直接粘贴完整剧本。",
    guideStep2Title: "② 选一个画风",
    guideStep2Desc: "画风决定全片视觉基调 —— 横向滑动挑一张顺眼的;之后还能在风格画廊里换。",
    guideStep3Title: "③ 开机 · ROLL",
    guideStep3Desc: "AI 团队接管剩下的一切:剧本 → 分镜 → 视频 → 成片;进度随时可在「任务队列」查看。",
    guideAria: "创作工坊首跑引导",
    skipGuide: "跳过引导",
    prevStep: "上一步",
    startShoot: "开拍 🎬",
    nextStep: "下一步",
    languageLabel: "制作语言 · 台词/旁白/配音语种",
    languageHint: "仅中/英有原生口型;日/韩/俄等语种剧本+字幕+配音全链,口型近似",
    setDefaultLangHint: "设为系统默认语言(各制作入口自动继承)",
    defaultSaved: "✓ 已设为默认",
    systemDefault: "⭐ 系统默认",
    setAsDefault: "☆ 设为默认",
    langAuto: "自动检测(按创意文字)",
    ttsDegraded: " · 配音降级",
    providerMinimax: "MiniMax(视频/图)",
    providerVeo: "Veo(视频)",
    providerMidjourney: "Midjourney(图)",
    gatewayCooldown: "网关 {host} 配额冷却(约 {n} 分钟)",
    recentFailures: "{provider} 近10分钟失败 {n} 次(不稳)",
    engineWeather: "引擎天气:",
    engineWeatherHint: "—— 受影响链路会自动降级/换引擎,可先创作或稍后重试",
    styleSaveFailed: "风格保存失败",
    deleteStyleConfirm: "删除风格 \"{name}\" ?",
    styleLibraryTitle: "STYLE LIBRARY · 我的风格库",
    saveCurrentHint: "把当前风格存进我的库",
    saveCurrentDisabledHint: "先选个画风再保存",
    saveCurrent: "保存当前",
    styleNamePlaceholder: "给风格起个名字",
    currentStyle: "当前: {style}",
    currentCamera: " · 镜头 {camera}",
    styleLibraryEmpty: "暂无收藏。挑个画风 + 镜头, 点 \"保存当前\" 入库, 下次一键复用。",
    draftsFailed: "草稿生成失败",
    draftsTitle: "剧本草稿对比 · {n} 版本",
    draftsStats: "{ok}/{n} 成功",
    regenerate: "重新生成",
    draftsLoading: "LLM 并行生成 {n} 个版本中, 通常 30-60s ...",
    draftsFooter: "每个版本的温度 (T) 不同 — 数字越大风格越激进。点 {adopt} 进入完整创作流程, 编剧 agent 会基于它做高质量改编。",
    adoptDraft: "采用此版",
    tempAggressive: "激进",
    tempMedium: "中等",
    tempSteady: "稳健",
    genFailed: "生成失败",
    approxWords: "~{n} 字",
    cameraLanguage: "CAMERA · 镜头语言",
    cameraDefault: "默认 · 轻微推近",
    cameraPresetsAria: "镜头语言预设",
  },
  projectView: {
    loadingTimeline: "加载时间线…",
    loadingProject: "加载项目中...",
    projectNotFound: "项目不存在",
    rerenderStarting: "启动批量补渲…",
    rerenderShotDone: "镜头 {n} 补渲完成 ✅",
    rerenderShotFail: "镜头 {n} 失败:{error}",
    rerenderBatchDone: "补渲完成:成功 {ok}/{total}",
    rerenderBatchFailSuffix: ",失败 {n}(引擎仍不可用?看创作页引擎天气)",
    rerenderRequestFail: "批量补渲请求失败,稍后再试",
    saveFailed: "保存失败",
    saveFailedStatus: "保存失败 {status}",
    checkNetwork: "请检查网络后重试",
    themeLabel: "主题 · {theme}",
    castLocked: "Cast Lock · 已锁定 {n} 角色",
    faceConsistency: "全片脸部一致性",
    workflowGroupsAria: "工作流分组",
    stagesAria: "{group} 环节",
    sceneDescription: "场景描述",
    dialogue: "对白",
    beatLabel: "节拍 · {beat}",
    emptyCharactersHint: "生成剧本后,AI 角色设计师会自动产出角色设定与立绘",
    editDescription: "编辑描述",
    emptyScenesHint: "生成剧本后,AI 场景设计师会自动产出场景视觉方案",
    cameoRetryFail: "重生失败 ({status})",
    cameoRetryDone: "批量重生完成: {upgraded} 镜提升, {unchanged} 镜未变, {failed} 镜失败",
    networkError: "网络异常",
    inspector: "检查器",
    cineDeskTitle: "单镜头摄影台 — 景别/机位/镜头/运镜/焦点/氛围",
    directorStageTitle: "导演台 — 拖人摆位、定机位、实时构图体检",
    stagedOn: "已摆位 · 导演台",
    stagedOff: "导演台 · 摆位",
    subtitleSafeArea: "字幕安全区 {state}",
    rerenderBusy: "⏳ 补渲中…",
    rerenderBatchBtn: "⚡ 批量补渲 {n} 个失败/降级镜头",
    emptyVideosHint: "完成分镜后,在镜头工坊或主管线生成每镜视频",
    videoGenFailed: "视频生成失败 · 显示分镜图",
    noSceneDesc: "(无场景描述)",
    expandComments: "展开评论 →",
    costDetails: "💰 成本明细",
    costTimes: "{n} 次",
    costTotal: "合计({n} 条)",
    querying: "查询中…",
    filmHealth: "🩺 成片体检",
    probing: "探测中…",
    recheckHealth: "↻ 重新体检",
    audioHealed: "已自愈补音轨",
    audioMissingHint: "— 缺配乐/配音?去「镜头工坊」合成配音或重生成片补音",
    boardFallback: "分镜图（视频生成失败）",
    noVideo: "无视频",
    shotOf: "镜头 {n} / {total}",
    exitFullscreen: "退出全屏",
    watchFullscreen: "全屏观看",
    fullscreen: "全屏",
    noVideosYet: "暂无视频",
    playFromStart: "从头播放",
    reviewPassed: "审核通过",
    needsWork: "需要优化",
    dimNarrative: "叙事",
    dimVisualConsistency: "画风",
    dimPacing: "节奏",
    dimPerformance: "角色",
    dimVisualQuality: "视觉",
    dimAudio: "音频",
    cannotRetakeSegment: "这段不能单独重拍",
    canRetake: "可以重拍",
    retakePlanDesc: "生成 {gen}s、补 {patch}s,该镜总时长不变",
    dryRunFailed: "预演失败",
    defaultNarration: "本集旁白。",
    anotherUser: "另一位用户",
    anonymous: "匿名",
    emptyTimeline: "暂无时间线 — 等编剧完成本项目后这里会显示镜头序列",
    shotsDuration: "{n} 镜 · {sec}s 总时长",
    virtualOn: "· virtual 已启 ({start}-{end} / {total})",
    undoTitle: "撤销 (Ctrl/Cmd+Z)",
    redoTitle: "重做 (Ctrl/Cmd+Shift+Z)",
    rippleTitle: "联动模式: 拖/改一段时后段一起移动",
    rippleOn: "联动开",
    rippleOff: "联动关",
    unsaved: "● 未保存",
    shotsTrackHint: "SHOTS · 拖卡片重排 · 点时长改变",
    bgmTrackTitle: "BGM · 按幕段 · 拖中间平移 / 拖边沿改时长 / 点轨首图标静音",
    subtitleTrackTitle: "SUBTITLE · 字幕段 · 拖边沿改时长 / 双击改文字 / 点轨首图标静音",
    regenNarration: "重生解说音轨",
    genNarration: "生成解说音轨",
    narrationHint: "由分镜旁白真出 TTS + 落盘 + 串进时间线 (字幕并入 SUBTITLE)",
    narrationTrack: "NARRATION · 解说音轨 (只读) · 字幕已并入 SUBTITLE 轨",
    playDownload: "播放 / 下载",
    lockToast: "正在编辑这一段, 你需要等他/她改完",
    rewriteSubtitle: "改写字幕",
    timelineHelp: "拖 shot 重排 · 时长下拉改单镜时长 · BGM / 字幕段拖移位 · 双击字幕段改文字 · 轨首图标静音 / 重置. 保存后下次成片合成用新数据.",
    segmentsCount: "({n} 段)",
    noSegments: "(无段)",
    lockWait: "🔒 {name} 正在编辑这段, 等一下",
    muted: "静音",
    edited: "已编辑",
    editingNow: "🔒 {name} 编辑中",
    resizeLeft: "拖左边沿改起点 (右端固定)",
    resizeRight: "拖右边沿改时长 (起点固定)",
    unmute: "取消静音",
    mute: "静音",
    editSubText: "改字幕文字",
    resetDefault: "重置为默认",
    emptyPacing: "暂无节奏数据",
    emptyPacingHint: "等编剧完成本项目后这里会显示节奏分析",
    dramaConflictPass: "短剧 ≥3.5 合格",
    stdConflictPass: "普通 ≥2.5 合格",
    timesUnit: "次",
    dramaReversalPass: "短剧 ≥2 合格",
    stdReversalPass: "普通 ≥1 合格",
    needsFix: "待改",
    dramaMode: "短剧模式",
    stdMode: "普通模式",
    hookAudit: "钩子审计",
    heuristicLlm: "启发式 + LLM 复核",
    heuristicOnly: "确定性启发式",
    openingHook: "开场 3 秒钩子",
    episodeCliff: "集尾悬念",
    bgmSync: "BGM 卡点对齐",
    cutsCount: "{aligned}/{total} 切点",
    noBgm: "未生成 BGM,暂不可测",
    openingPrefix: "开场:{reason}",
    cliffPrefix: "集尾:{reason}",
    shotsCount: "{n} 镜",
    noShotData: "无镜头数据",
    emotionReversalAria: "情绪反转",
    strong7: "强 ≥7",
    mid46: "中 4-6",
    weak4: "弱 <4",
    reversalPoint: "情绪反转点",
    styleBible: "STYLE BIBLE 一致性 (每镜 vision 审计)",
    styleAvg: "平均 {avg}/100 · {n} 镜重生",
    retriedTitle: "已重生 (vision 修偏: {reason})",
    styleStrong: "强 ≥85",
    styleMid: "中 70-84",
    styleWeak: "弱 <70 (已触发重生)",
    dialogueCoverage: "对话覆盖度 (正反打 / 反应特写)",
    dialogueScenes: "{scenes} 个对话场景 · {multi} 个多角色对话",
    missingReverse: "缺正反打 ({n} 处)",
    reverseHint: "· Shot 群 #{n}: {chars} — 仅 1 镜, 缺反应切镜",
    missingCU: "📷 缺反应特写 ({n} 处)",
    cuHint: "· Shot 群 #{n}: {chars} — 全 wide shot, 缺 CU/MCU",
    rewriteHints: "改写建议",
    pacingDiagV2: "节奏诊断 v2",
    curve: "曲线",
    shapeEscalating: "层层递进",
    shapeFrontLoaded: "高开低走",
    shapeNoClimax: "无明显高潮",
    shapeFlat: "平铺",
    slopePeak: "斜率 {slope} · 高潮在第 {n} 镜",
    dragSegments: "拖沓段(观众最易划走)",
    dragRange: "S{from}–{to}(均分 {avg})",
    opening: "开场",
    openingStats: "前 {n} 镜均分 {avg}",
    openingFailNote: " — 完播率主要由开场决定",
    durationRhythm: "时长节奏",
    cvLabel: "变异系数 {cv}",
  },
  projectTools: {
    sourceFactory: "出厂真值",
    sourceVision: "Vision 打标",
    sourceSkeleton: "骨架(配 Vision key 可逐镜打标)",
    groupNarrative: "叙事要素",
    groupTime: "时间",
    groupCamera: "镜头语言",
    groupImage: "影像处理",
    groupSound: "声音",
    fieldDialogue: "台词对白",
    fieldDuration: "时长",
    fieldStart: "开始",
    fieldEnd: "结束",
    fieldShotSize: "景别",
    fieldCameraMove: "运镜方法",
    fieldLens: "焦距与景深",
    fieldLighting: "光影与色调",
    fieldEdit: "剪辑",
    fieldScoreMood: "音乐情绪",
    fieldSoundDesign: "音效设计",
    fieldStoryBeat: "分镜功能",
    fieldWhyChoice: "镜头叙事功能",
    rerenderShotProgress: "重渲镜头 {shot}({ok}/{n})…",
    rerenderDone: "重渲完成 {ok}/{n} 镜",
    generatingSheet: "拉片表生成中…",
    noShotData: "暂无镜头数据 — 项目生成剧本后这里会出现逐镜拉片表",
    pullAnalysis: "拉片分析",
    sheetMeta: "{n} 镜 · 全片 {sec}s · 出厂参数真值(流水线生成时的真实摄影语言,非 AI 看图反推)",
    exportCsv: "导出 CSV",
    scriptBookMd: "剧本册 MD",
    scriptBookPdf: "剧本册 PDF",
    importCsv: "回灌 CSV",
    importing: "回灌中…",
    importFailed: "回灌失败:{msg}",
    importApplied: "已应用 {n} 处修改({rows} 行)",
    unknownShotsSkipped: "未知镜号跳过:{list}",
    badLines: "坏行 {n}",
    importNetworkFail: "回灌失败:网络或文件读取错误",
    rerendering: "⏳ 重渲中…",
    rerenderAffected: "🎬 重渲受影响的 {n} 镜(S{list})",
    shotBoardAlt: "镜 {n} 分镜图",
    noFrame: "无画面",
    externalTitle: "参考片拉片(外部视频)",
    externalHint: "贴视频 URL → ffmpeg 场景切分出骨架表(切点/时长/缩略图全真);配 Vision key 后逐镜打标镜头语言。请确认你对参考素材的使用权 —— 拉片用于结构学习与二次创作,不复制原片内容。",
    externalUrlAria: "参考片视频 URL",
    urlPlaceholder: "https://… 或 /api/serve-file?key=…",
    pullAction: "拉片",
    refresh: "刷新",
    queuedSplit: "已入队拆条(任务 {id})— 完成后自动出现在下方",
    splitDone: "拆条完成:{n} 镜{extra}",
    visionLabeled: ",Vision 打标 {n} 镜",
    skeletonTable: "(骨架表)",
    splitFailed: "拆条失败",
    sheetShotsMeta: "{n} 镜 · {sec}s",
    truncated: " · 超长截断",
    collapse: "收起 ▲",
    expand: "展开 ▼",
    sketchNeedDesc: "先填画面描述(≥5 字)再生成草图",
    sketchGenFailedStatus: "草图生成失败 ({status})",
    sketchGenFailed: "草图生成失败",
    sketchTooLarge: "草图过大 (上限 10MB)",
    persistFailed: "草图落库失败 ({status})",
    sketchUploadFailed: "草图上传失败",
    refTooLarge: "参考图过大 (上限 10MB)",
    promptTooShort: "prompt 不能短于 5 字",
    regenStarting: "启动重生...",
    requestFailedDetail: "请求失败 ({status}): {msg}",
    streamReadFailed: "无法读取响应流",
    processing: "处理中...",
    noNewImage: "上游未返新图",
    regenFailed: "重生失败",
    regenTitle: "改 prompt 重生 · Shot {n}",
    promptPlaceholder: "改写镜头描述... 例: 把主角换成俯拍角度, 加强情绪冲击",
    refImageOptional: "参考图 (可选, 优先于 Style Bible)",
    remove: "移除",
    refUploaded: "已上传参考图",
    refUsedAsSref: "本次重生会以这张图作 sref (替代 Style Bible)",
    dropRefHint: "拖一张参考图到此 (或点击选择) — 模型会按这张图风格出",
    lockStyleBible: "锁 Style Bible 画风 (推荐, 防画风跳脱)",
    lockLeadFace: "锁主角脸 (用 primaryCharacterRef 作 cref)",
    aspect: "画幅:",
    sketchLockTitle: "镜头语言草图锁",
    sketchLockOptional: "(可选 · 用草图锁构图/机位)",
    genSketchTitle: "AI 按上方画面描述出一张粗线稿构图草图",
    genSketch: "AI 生成草图",
    uploadSketch: "上传草图",
    lockCompOnRegen: "重生时用草图锁构图",
    sketchAlt: "构图草图",
    sketchSoftHint: "软构图约束:草图定布局/机位,细节配色仍按 prompt(非默认,勾选生效)",
    footerHint: "走完整 image 路由 (multi-ref + style bible + 文字负向 prompt)",
    regenInProgress: "重生中...",
    regenThisShot: "重生这一镜",
    preflightUnavailable: "预检不可用 ({status})",
    preflightUnavailableShort: "预检不可用",
    pickOnePlatform: "至少选一个平台",
    genFailed: "生成失败 ({status})",
    networkError: "网络错误",
    preflightFailConfirm: "预检未通过({label}):\n{issues}\n\n仍要发布吗?",
    publishing: "发布中…",
    publishNeedCreator: "发布需 creator 档及以上,去升级",
    qualityGateBlocked: "质量门禁未通过(block),先修复最弱镜",
    pleaseLogin: "请先登录",
    publishFailed: "发布失败 ({status})",
    scheduledAt: "已排定定时发布 · {date}",
    ytUploaded: "已真上传到 YouTube(默认私有,去后台改公开)",
    packedWithMsg: "已打包 · {msg}",
    packedWithShare: "已打包 + 生成分享链接(可下载素材手动上传)",
    exportFilename: "分发包-{id}.txt",
    multiPlatform: "多平台分发 · DISTRIBUTION",
    regenerate: "重新生成",
    genPack: "一键生成分发包",
    exportTxt: "导出 .txt",
    llmDegraded: "LLM 输出已尽力解析 (部分降级)",
    scheduleOptional: "定时发布(可选)",
    clearSchedule: "清除(改立即)",
    ytRealUpload: "真上传到 YouTube(需已配 token,会公开到你频道)",
    emptyHint: "选好平台 → 一键生成。基于本片剧本/钩子, 为每个平台产出标题候选 · 标签 · 封面钩子 · 简介 · 发布建议。",
    copy: "复制",
    preflightPass: "预检通过",
    preflightPassTips: "预检通过 · {n} 条建议",
    preflightFailItems: "预检未过 · {n} 项",
    labelTitle: "标题",
    labelAlt: "备选",
    labelTags: "标签",
    labelHook: "钩子",
    labelDesc: "简介",
    labelTips: "建议",
    publishPack: "发布 / 打包",
    sharePage: "分享页",
    platformLink: "平台链接",
    renderOk: "口型视频已生成({provider}){written}",
    writtenBack: " · 已写回分镜/时间线",
    renderFailed: "渲染失败",
    audioSynthOk: "已合成 {ok}/{total} 句配音 —— 现在「真渲染口型」可自动取音",
    audioSynthFailed: "配音合成失败",
    noAudioAlign: "该镜尚无配音 —— 先「合成全片配音」再测对齐",
    noWebAudio: "浏览器不支持 Web Audio",
    alignFailed: "对齐测量失败",
    levelPass: "口型就绪",
    levelWarn: "部分对不上",
    levelBlock: "多处对不上",
    lipsyncTitle: "配音口型 · {n} 句对白",
    engineOn: "引擎已配置",
    engineOff: "引擎未配置",
    readiness: "{label} · 就绪度 {n}",
    synthesizing: "合成中…",
    synthAll: "合成全片配音",
    shotNth: "第 {n} 镜",
    stop: "停止",
    playLips: "播放口型",
    renderThisTitle: "调用口型引擎真渲染这一镜",
    rendering: "渲染中…",
    renderReal: "真渲染口型",
    measureTitle: "浏览器解码该镜配音 → 测「嘴开合 vs 声音能量」对齐度",
    measuring: "测量中…",
    measureAlign: "测音画对齐",
    verdictGood: "口型跟得上声音",
    verdictFair: "基本同步",
    verdictBad: "明显对不上",
    audioLag: " · 音频{dir} {lag}s",
    lagBehind: "滞后",
    lagAhead: "超前",
    avAlign: "音画对齐",
    driftTitle: "检出漂移,平移补偿后重渲(裸对齐 {before}→{after})",
    correctDrift: "校正漂移重渲",
    mouthOpenTitle: "{viseme} · 张口 {n}%",
    viewVideo: "查看视频",
    reshootTitle: "口型重拍建议 · {n}",
    preparing: "准备中...",
    needPro4k: "4K 重渲需 pro 档及以上",
    requestFailed: "请求失败 ({status})",
    regen4kFailed: "4K 重渲失败",
    workshopSubtitle: "单镜操作集中地: 4K 重渲 / 首尾帧融合 / 镜头语言定向调整 / 多分辨率导出。",
    u2vTitle: "独立 U2V 工具 (单图变视频, 镜头语言可选)",
    u2vTool: "U2V 工具",
    emptyShots: "还没有视频镜头",
    emptyShotsHint: "完成主管线创作后回来看这里",
    regen4kDone: "4K 已重渲",
    boardRegenDone: "分镜图已重生",
    regenPromptTitle: "改 prompt 重生这一镜的分镜图 (走 image 路由, 不重生视频)",
    regenPrompt: "改 prompt 重生",
    gridTitle: "一镜出 4/6/9 个构图各异的候选帧,挑最优作首帧 seed(走 image 路由)",
    gridPick: "九宫格选帧",
    klingTitle: "用 Kling Master 重新渲染这一镜 (60-90s)",
    needProTitle: "需要 pro 档及以上",
    regen4k: "4K 重渲",
    workshopFooter1: "4K 重渲走 Kling Master, 单镜头 60-90s · plan-gate: pro+",
    workshopFooter2: "镜头工坊只列出已生成的视频镜头; 想新加镜头请回到剧本 tab 编辑。",
    saveFailed: "保存失败 ({status})",
    savedOk: "已保存连贯性设置",
    geneLib: "视觉基因库 · VISUAL GENE LIBRARY",
    charLock: "角色锁定",
    moreChars: "+{n} 角色",
    noCharAsset: "无角色资产",
    envLock: "环境锁定",
    lightingOn: "光照已锁",
    lightingOff: "光照未锁",
    moreScenes: "+{n} 场景",
    noSceneAsset: "无场景资产",
    seedLock: "种子锁定",
    refreshSeeds: "刷新种子",
    auxSeed: "辅种子 {n}",
    boardLogic: "分镜连贯性逻辑 · {n} 镜",
    noBoards: "暂无分镜",
    noBoardsHint: "生成分镜后,这里可设连续性 / 种子锁 / FaceID",
    moreShotsSame: "… 其余 {n} 镜同链路设置",
    consoleTitle: "连贯性控制台",
    linkMode: "链接模式 LINK MODE",
    strength: "连贯性强度",
    loose: "0 松",
    strict: "1 严",
    clothingLock: "服装锁定",
    lightingLock: "光照锁定",
    faceIdStrength: "FaceID 强度",
    saveContinuity: "保存连贯性设置",
    engineMissing: "口型引擎未配置",
    shotOk: "镜 {n} ✓{written}",
    writtenBoard: " 已写回分镜",
    shotWarn: "镜 {n}:{msg}",
    computingAlign: "计算口型-音频对齐分…",
    alignWeak: "音画对齐:{n} 镜偏低(已并入弱镜判定)",
    stopped: "已手动停止",
    qcRound: "口型质检 第 {round}/{max} 轮:Vision 复评…",
    rerenderWeak: "重渲弱镜 {n} 口型…",
    aborted: "{msg} —— 已终止",
    rerenderFailed: "重渲失败",
    confirmRun: "「一键全片口型」将为 {n} 句对白:① 合成配音 → ② 逐镜真渲染口型 → 写回分镜/时间线。会消耗 TTS + 口型引擎算力。确认运行?",
    synthAllLines: "合成全片配音({n} 句)…",
    audioFailed: "配音合成失败",
    audioDone: "配音完成 {ok}/{total}",
    renderShot: "渲染镜 {n} 口型…",
    renderDone: "渲染完成:{ok}/{n} 镜出口型{extra}",
    inTimeline: "(已进时间线/分镜)",
    batchFailed: "批处理失败",
    batchTitle: "一键全片口型 · {n} 句对白(配音 → 渲染 → 写回)",
    qcLoopTitle: "渲染后跑 Vision 质检,弱镜自动重渲(≤2 轮)",
    qcLoop: "质检回环",
    running: "运行中…",
    runAll: "一键全片",
    roleViewer: "只读",
    roleCommenter: "可评论",
    roleEditor: "可编辑",
    loadFailed: "加载失败 {status}",
    createFailed: "失败 {status}",
    failed: "失败",
    revokeConfirm: "吊销这个邀请链接? 之后此链接将无效.",
    removeConfirm: "从协作者中移除 {name}? 已写入的评论不会删除.",
    inviteTitle: "邀请协作者",
    joined: "已加入 ({n})",
    newLink: "生成新邀请链接",
    roleViewerOpt: "只读 (viewer)",
    roleCommenterOpt: "可评论 (commenter)",
    roleEditorOpt: "可编辑 (editor)",
    expiry1d: "1 天",
    expiry7d: "7 天",
    expiry30d: "30 天",
    expiryForever: "永久",
    generateCopy: "生成 + 复制链接",
    sentLinks: "已发的链接 ({n})",
    visitStats: "{views} 次访问, {accepts} 次接受",
    copyLink: "复制链接",
    revokeLink: "吊销链接",
  },
  projectPanels: {
    pickSampleFirst: "请先选择音样文件(WAV/MP3,≥10s、≤5MB)",
    sampleTooLarge: "音样需 ≤5MB",
    consentRequired: "请先勾选授权声明:须确认已获被克隆人授权",
    consentOwnerDeclaration: "我确认已获被克隆人授权,仅用于合法用途",
    cloneFailed: "克隆失败",
    cloneTag: "[克隆]",
    cloneSuccess: "✓ 克隆成功:{id} —— 已加入下拉,选给角色后保存即生效",
    auditionFailedNeedTts: "试听失败(需 TTS 引擎)",
    auditionFailed: "试听失败",
    voicesSaved: "已保存 —— 下次「合成配音」按此音色",
    saveFailed: "保存失败",
    voiceShelfTitle: "角色音色 · {n} 角色（手动挑 / 试听,覆盖自动路由）",
    manual: "手动",
    auto: "自动",
    audition: "试听",
    saveVoices: "保存音色",
    cloneHint: "克隆专属音色(上传 ≥10s 干净人声,WAV/MP3 ≤5MB)",
    cloneNamePlaceholder: "音色名(如 老陈)",
    clonePurposeTitle: "克隆用途(合规记录)",
    purposeDrama: "用途:短剧配音",
    purposeAd: "用途:广告配音",
    purposePersonal: "用途:个人项目",
    purposeOther: "用途:其他",
    consentLead: "我确认",
    consentBold: "已获被克隆人授权",
    consentTail: ",仅用于合法用途,并已知悉深度合成合规要求(《深度合成管理规定》)。",
    cloneVoice: "克隆音色",
    cloningWait: "克隆中…(约10-30s)",
    consentThenClone: "← 勾选授权后可克隆",
    withVoiceover: "带配音",
    voiceoverMuted: "配音已静音",
    nativeTrack: "原生音轨",
    nativeMuted: "原生音已静音",
    noIndependentTrack: "片段无独立音轨 · 成片含配乐+配音",
    audioBlocked: "声音被浏览器拦截,点击画面后重试",
    audiblePreview: "带声试听",
    audibleOnTitle: "当前带声 · 点击静音",
    mutedTitle: "当前静音 · 点击带声试听",
    muted: "静音",
    previewFailed: "预览失败",
    replicateStarted: "复刻已起片 — 新项目 {id}({n} 镜并行生成中,去「我的项目」查看)",
    replicateFailed: "复刻失败",
    templateSaved: "已存为私有模板「{title}」—— 去模板市场可一键复用结构",
    saveTemplateFailed: "存模板失败",
    replicateTitle: "复刻 · 替换工作台",
    replicateHint: "换角色/场景/道具(全局指令如「老板→猫咪」一键全员换)→ 预览改写后逐镜 prompt(可编辑)→ 按原片结构并行起片新片。复刻 = 同结构新内容,不复制原片素材。",
    kindGlobal: "全局替换",
    kindProp: "道具",
    kindCostume: "服装",
    replaceKindAria: "替换类型",
    fromPlaceholderGlobal: "原词(如:老板)",
    fromPlaceholderOther: "原(空=整列)",
    fromAria: "原词",
    toPlaceholder: "换成(如:一只橘猫)",
    toAria: "替换为",
    refImagePlaceholder: "参考图 URL(可选)",
    refImageAria: "参考图",
    deleteRuleAria: "删除规则",
    addRule: "加规则",
    previewRewrite: "预览改写",
    replicateStart: "复刻起片({n} 镜)",
    savePrivateTemplate: "存为私有模板",
    saveTemplateHint: "把这张拉片表的镜头结构存成私有模板,复用爆款骨架",
    fidelityTitle: "复刻保真度(节奏 / 钩子贴合原片)",
    fidOverall: "总体",
    fidPacing: "节奏",
    fidHook: "钩子",
    fidCompare: "开场 {a}→{b} · 集尾 {c}→{d} · 反转 {e}→{f}",
    promptListTitle: "「{title}」逐镜复刻 prompt(可改):",
    shotDur: "镜 {n} · {sec}s",
    refImageCount: "{n} 参考图",
    shotPromptAria: "镜 {n} 复刻 prompt",
    actorFallback: "角色 A",
    stageSaved: "已保存 —— 该镜后续出片会带上这份站位",
    saveFailedWith: "保存失败:{msg}",
    saveStageFailed: "保存舞台失败 HTTP {status}",
    sketchDone: "草图已生成 —— 重生该镜分镜图时开启草图锁即用它锁构图",
    sketchFailedWith: "渲草图失败:{msg}",
    stageTitle: "导演台 · 第 {n} 镜",
    stageTitleNamed: "导演台 · 第 {n} 镜 — {title}",
    topViewHint: "俯视图 · 拖动人物或机位摆位",
    cameraMark: "机位",
    yaw: "朝向",
    camHeight: "机高",
    focal: "焦距",
    fov: "{n}° 视角",
    cameraViewHint: "相机视角 · 与最终草图同一套几何",
    noCompositionWarn: "构图无告警",
    promptLineSummary: "会进提示词的那句(英文)",
    sketchAlt: "第 {n} 镜布局草图",
    saveBlocking: "保存站位",
    renderSketch: "渲布局草图",
    renderSketchHint: "按当前舞台渲一张布局草图(不调引擎、不花钱)",
    retakeDone: "镜 {n} 重录完成({emotion})— 展开做 A/B 对比",
    retakeFailed: "重录失败",
    batchQueued: "已入重录队列({n} 句,任务 {id})— 完成后刷新可见",
    batchDone: "批量完成:{ok}/{total} 句",
    batchFailed: "批量重录失败",
    adoptedNotice: "已采用 — 镜 {n} 口型/成片已标待重渲({stale} 项)",
    adoptFailed: "采用失败",
    retakeTitle: "配音 retake · {n} 句对白",
    retakeTitleTakes: "({n} 个重录版)",
    retakeTitleHint: "(单句换情绪重录 / A·B 对比 / 不动整集)",
    selectShotAria: "选中镜 {n}",
    shotN: "镜 {n}",
    emotionAria: "镜 {n} 情绪标签",
    retake: "重录",
    retakeOneHint: "按所选情绪单句重录",
    versions: "{n} 版",
    abListen: "A/B 试听:",
    sideA: "A · 当前版",
    sideAEmotion: "A · 当前版({emotion})",
    sideB: "B · 重录版",
    sideBEmotion: "B · 重录版({emotion})",
    noFullDub: "(该镜还没有整集配音版,可直接采用重录版)",
    noRetakes: "还没有重录版 —— 选个情绪点「重录」试试。",
    adoptedBadge: "已采用",
    adoptThis: "采用此版本",
    batchRetake: "批量重录所选({n} 句)",
    adoptHint: "采用新配音后,该镜口型/成片会标待重渲 —— 其余镜零接触。",
    loadFailedHttp: "加载失败(HTTP {status})",
    loadFailed: "加载失败",
    rangeFailed: "无法换算重拍区间",
    inspectTitle: "逐帧检视 · 镜 {n}",
    thinned: "已抽稀:每 {n} 帧取 1(帧数过多)",
    decodeFailed: "{n} 帧解码失败,已跳过",
    extracting: "正在抽帧…",
    noFrames: "这一段没有可显示的帧。",
    frameAlt: "第 {n} 帧",
    pickStart: "点一帧开始选,再点一帧框出区间",
    selectedOne: "已选 #{lo}",
    selectedRange: "已选 #{lo}–#{hi}",
    clearSelection: "清除选区",
    ranging: "换算中…",
    resolveRange: "换算重拍区间",
    useForRetake: "用这段做片段重拍",
    currentProject: "当前项目",
    confirmRun: "「一键成片」自愈闭环将:质检每镜 → 自动重拍低分镜(消耗 token)→ 复检,最多 {n} 轮。\n确认运行?",
    stopped: "已手动停止",
    roundAudit: "第 {n} 轮 · 质检中…",
    auditFailed: "质检失败 (HTTP {status})",
    skipNoPrompt: "镜 {n} 缺分镜 prompt,跳过",
    reshootShot: "重拍镜 {n} · {hint}",
    reshootIncomplete: "镜 {n} 重拍未完成",
    reshootError: "镜 {n} 重拍出错",
    roundReshoot: "本轮重拍 {n} 镜,进入复检",
    noAutoReshoot: "无可自动重拍的镜(缺 prompt),转人工",
    runError: "运行出错",
    oneclickTitle: "一键成片 · 自愈闭环",
    oneclickBadge: "对标可灵一键成片 · 我们多了「自检 + 自动重拍」",
    oneclickBefore: "每轮 ",
    oneclickAudit: "质检每镜",
    oneclickMid1: " → ",
    oneclickGate: "门禁裁决",
    oneclickMid2: " → 低分镜 ",
    oneclickReshoot: "自动重拍",
    oneclickAfter: "(带针对最弱维度的修补 steer)→ 复检;达标(pass / warn)即停,最多 {n} 轮,到顶仍不达标转人工。",
    stop: "停止",
    runLoop: "运行自愈闭环",
    needBoards: "先生成分镜后再运行",
    passed: "已达标",
    handoff: "转人工",
    promptTooShort: "该镜基础 prompt 太短(<5 字),先在分镜里补全描述",
    generatingN: "生成 {n} 个候选…",
    requestFailed: "请求失败 ({status}): {txt}",
    streamReadFailed: "无法读取响应流",
    processing: "处理中…",
    completePick: "完成:{n} 个候选,点一张采用",
    generateFailed: "生成失败",
    pickFailedHttp: "采用失败 ({status})",
    gridTitle: "九宫格候选帧 · Shot {n}",
    candidateCount: "候选数:",
    aspect: "画幅:",
    regenBatch: "重出一批",
    generateCandidates: "生成候选",
    emptyHint: "点「生成候选」一次出 {n} 个**构图各异**的候选帧,挑最好的那张作首帧。",
    pick: "采用",
    readyFooter: "{ready}/{total} 就绪 · 点一张即设为该镜首帧",
    crossOrigin: "该素材为跨域外链, 浏览器禁止读取像素 — 示波器需同源/已落盘素材",
    imageLoadFail: "图片加载失败",
    exportTitle: "专业出片对接 · DaVinci / Premiere / Avid",
    exportEdl: "导出 EDL (CMX3600)",
    exportFcpxml: "导出 FCP7 XML",
    exportAaf: "导出 AAF (Avid)",
    exportHint: "含镜头时长 + 素材路径, 按项目帧率生成时间码",
    scopesTitle: "视频示波器",
    scopeStats: "均亮 {avg} · 高光裁切 {hi}% · 暗部 {lo}%",
    noBoards: "暂无分镜图可分析",
    hist: "直方图 HISTOGRAM",
    waveform: "亮度波形 WAVEFORM",
    renderLoop: "渲染循环 · RENDER LOOP",
    renderEmpty: "剧本 / 分镜尚未生成 — 开始创作后这里实时显示每镜渲染进度。",
    etaAvg: " · 均 {n}s/镜",
    failedN: "{n} 失败",
    stageVideo: "视频",
    stageBoard: "分镜",
    res720Desc: "HD ·  快速 · 任何用户",
    res1080Desc: "FHD · 主流 · creator+",
    res2160Desc: "4K UHD · 高清晰 · pro+",
    downloadTitle: "下载成片 — 选分辨率",
    exportMp4: "导出 mp4",
    upgradeUnlock: "升级到 {tier} 解锁",
    downloadRes: "下载 {label}",
    withIntro: "含片头片尾",
    withIntroHint: "封面+标题片头 · 角色 roster 片尾(Wind Comic 品牌)",
    lockedHint: "锁标项 → 跳转账户升级页",
    costTitle: "成本归因 · 这一单花在哪",
    noCostTitle: "暂无成本数据",
    noCostHint: "生成成片后即可看每阶段花销与省钱建议",
    budgetCap: "预算上限 ¥",
    capUnset: "未设",
    perSec: "秒",
    perCall: "次",
    cogsTitle: "COGS 报告 · 单片销货成本与毛利",
    salePrice: "参考售价 ¥",
    salePlaceholder: "填单片售价算毛利",
    unitQtySec: "{n}s",
    unitQtyCall: "{n}次",
    totalCogs: "总 COGS",
    marginLine: "售价 ¥{sale} − COGS ¥{cogs} = 毛利 ¥{profit}",
    marginPct: " · 毛利率 {n}%",
    inspectorAria: "镜头 {n} 检查器",
    closeInspector: "关闭检查器",
    shotAlt: "镜头 {n}",
    emotionLine: "情绪 · {emotion}",
    sceneDesc: "画面描述",
    emDash: "——",
    dialogue: "对白",
    camera: "机位",
    shotActions: "单镜操作",
    cinemaDesk: "单镜头摄影台 · 景别 / 机位 / 运镜 / 焦点",
    frameInspect: "逐帧检视 · 找到坏的那一段 → 只重拍那两秒",
    workshopActions: "九宫格选帧 / 4K 重渲 / 改 prompt 重生 →",
    shotSize: "景别 SHOT SIZE",
    angle: "机位 ANGLE",
    lens: "镜头 LENS",
    movement: "运镜 MOVEMENT",
    focus: "焦点 FOCUS",
    atmosphere: "氛围 ATMOSPHERE",
    motion: "运动强度 MOTION",
    advanced: "光影 + 摄影机模拟 · 高级",
    lighting: "光影 LIGHTING",
    colorTemp: "色温 K",
    contrast: "反差",
    contrastLow: "低",
    contrastMed: "中",
    contrastHigh: "高",
    body: "机身 BODY",
    lensSeries: "镜头系列 LENS",
    ndNone: "无",
    wb: "白平衡 WB",
    descUpdated: "「{name}」描述已更新 — 受影响镜头:{shots}({n} 项资产已标待重渲)",
    descUpdatedNone: "「{name}」描述已更新 — 无镜头引用该资产",
    ledgerTitle: "资产连续性台账",
    registerPropPh: "登记关键道具(如:旧照片)",
    registerPropAria: "登记关键道具",
    register: "登记",
    ledgerHint: "服装/场景/道具逐条登记 × 引用镜号;改描述会列出受影响镜头并标记待重渲。配 Vision key 后可升级为画面级漂移比对(BYO)。",
    emptyEntries: "暂无条目 —— 项目生成剧本/角色/场景后自动登记。",
    citedShots: "引用镜:{shots}",
    citedNone: "—",
    descAria: "{name} 描述",
    editDescTitle: "点击编辑描述",
    noDesc: "(无描述 — 点击补充,变更会标记受影响镜头)",
  },
  projectMisc: {
    auditTabTitle: "成片质检 · AI 看画面对不对得上剧本",
    auditRunning: "质检中…",
    auditRerun: "重新质检",
    auditRun: "运行质检",
    auditDoneMsg: "质检完成: {scored}/{requested} 镜评分",
    auditSkippedSuffix: ", {n} 镜跳过",
    auditRunFailed: "运行失败",
    cineModalTitle: "镜头摄影台 ·",
    cineAutoSuggest: "智能建议机位",
    cineEmotionPrefix: "情绪: {emotion}",
    cineRulesApplied: "已应用: {list}",
    cineNoRules: "当前镜头(情绪/景别)无匹配联动规则",
    saveFailedStatus: "保存失败 ({status})",
    cineSaved: "已保存机位",
    cineSummary: "机位摘要",
    copyPrompt: "复制提示词",
    saveCamera: "保存机位",
    templateListed: "已上架模板「{title}」(质量 {quality})— 去「模板市场」可一键复用",
    saveFailed: "保存失败",
    saveTemplateDesc: "存为模板 · 把这个项目的画风 / 多参 / 节奏沉淀成可复用模板",
    saveAsTemplate: "存为模板",
    reviewStatusTitle: "审批状态: {label} (点击操作)",
    currentLabel: "当前: ",
    submittedLabel: "提交: ",
    reviewedLabel: "审阅: ",
    reviewNoteLabel: "审阅留言:",
    changesNoteRequired: "请填改写意见 (必填)",
    noteOptional: "留言 (可选)",
    submitReview: "提交评审",
    requestChanges: "请改",
    withdraw: "撤回",
    dimOk: "达标",
    dimWeak: "偏弱",
    dimNa: "未测",
    dimVisualVsScript: "画面对剧本",
    dimConsistency: "一致性",
    dimLipAlignable: "口型可对齐",
    dimLipMeasured: "实测口型对齐",
    dimReadyN: "就绪 {n}",
    dimAvgScore: "均分 {n}",
    publishGateTitle: "发布就绪门禁",
    notPublishReady: "未达发布线",
    weakestShotsLabel: "最弱镜:",
    projectFormat: "项目格式",
    aspectRatio: "画幅",
    colorSpace: "色彩",
    frameRate: "帧率",
    fpsOvercrank: "{n}fps 升格",
    safeArea: "安全框",
    savedShort: "已保存",
    saveFormat: "保存格式",
    aspect169: "16:9 横屏",
    aspect916: "9:16 竖屏",
    aspect11: "1:1 方形",
    aspect43: "4:3 经典",
    exportFailed: "导出失败",
    exportPlatformTitle: "导出到抖音/快手/小红书等平台版本",
    platformExport: "平台导出",
    exportDoneView: "导出完成 · 点击查看",
    presetDouyin: "抖音竖屏 9:16",
    presetKuaishou: "快手竖屏 9:16",
    presetXhs: "小红书 4:5",
    presetYoutube: "YouTube 横屏 16:9",
    presetSquare: "方形 1:1",
    neverSynced: "从未",
    syncFailedStatus: "同步失败 ({status})",
    syncedMsg: "已同步 {n} 镜 + 连贯性 + 格式",
    paramLinkageTitle: "参数联动 · PARAMETER LINKAGE",
    shotCard: "分镜卡",
    params: "参数",
    unsyncedChanges: "有未同步改动",
    liveSynced: "实时同步 · 已一致",
    lastSyncAt: "上次同步 {time}",
    paramJsonN: "参数 JSON ({n} 镜)",
    jsonValid: "JSON 合法",
    pendingSyncShots: "{n} 镜",
    plusFormat: "+格式",
    plusContinuity: "+连贯性",
    pendingSyncSuffix: " 待同步",
    revert: "还原",
    syncNow: "应用并同步 (Sync Now)",
    paramJsonHint: "编辑每镜 spec / continuity / format 后点同步 → 写回分镜资产; 摄影台/连贯性/格式条的改动也会在重载后回流到这里。",
    genFailed: "生成失败",
    musicGenTitle: "AI 作曲(免版权 BGM)",
    musicGenDesc: "按剧情/风格描述生成专属背景乐(MiniMax music-2.6),存为项目配乐,重新合成时自动用作 BGM。",
    musicGenPlaceholder: "例:悬疑 noir,低频大提琴,节奏沉重",
    composing: "作曲中…(约1分钟)",
    genBgm: "生成 BGM",
    musicSaved: "已存为项目配乐,重新合成即用作 BGM。",
    localizeFailed: "译制失败",
    localizeTitle: "出海多语版",
    localizeDesc: "一键把剧本译制到目标语种(只翻台词/旁白,画面与结构不动),满意后套用并重新配音。对标阅文 ToonScroll 出海管线。",
    localizing: "译制中…",
    genLocalizedScript: "生成译制剧本",
    applyingDub: "套用+重配音中…",
    applyAndDub: "套用并重配音",
    ttsUnreliable: "{name} 的 TTS 配音可能降级(仅字幕),画面与译制字幕不受影响。",
    localizeResult: "已生成《{title}》{lang} 版剧本",
    localizeApplied: ",并已套用+重配音(可在成片区查看)",
    localizePending: "(script-{lang} 资产,点「套用并重配音」出片)",
    healFailed: "自愈失败",
    serverReturned: "服务器返回 {status}",
    healDoneTitle: "自愈完成：修复 {n} 镜",
    healFailedCount: "{n} 镜失败",
    healSkippedCount: "{n} 镜无分镜图跳过",
    healAllFixed: "全部镜头已修复",
    healUnsuccessful: "自愈未成功",
    healUnsuccessfulDesc: "{failed} 镜补拍失败，{skipped} 镜无分镜图跳过",
    healNoneTitle: "无可自愈镜",
    healNoneSkipped: "{n} 镜无分镜图，无法锚定补拍",
    healNoneOk: "成片质量良好，无需自愈",
    healRequestFailed: "自愈请求失败",
    healing: "自愈中…",
    healButton: "一键自愈",
    seriesEmotion: "情感强度",
    seriesTension: "紧张感",
    seriesRhythm: "节奏",
    seriesBrightness: "亮度",
    noEmotionData: "暂无分镜情绪数据",
    noEmotionHint: "先生成剧本 / 分镜",
    emotionChartTitle: "情感曲线 · 节奏热力图",
    climaxShot: "▲ 高潮 第 {n} 镜",
    decisionLogTitle: "决策日志(逐镜引擎/成本/一致性)",
    decisionLogMeta: "({n} 镜 · ¥{cost})",
    querying: "查询中…",
    noDecisionData: "暂无逐镜决策数据(生成成片后自动积累)。",
    colShot: "镜",
    colEngine: "出片引擎",
    colCost: "成本",
    colConsistency: "一致性",
    projectQualityScore: "项目质量分:{n}",
    genFailedRetry: "生成失败, 请稍后再试",
    coverPanelTitle: "AI 竖屏封面候选 · 9:16",
    hideSafeArea: "隐藏标题安全区",
    showSafeArea: "显示标题安全区",
    regenCovers: "重新生成",
    genCoverCandidates: "生成封面候选",
    coverDegraded: "部分封面出图失败, 已展示成功的几张 (可重新生成)",
    coverEmptyHint: "按 片名 + 主角 + 画风 生成 3 张 9:16 封面候选 (复用 MiniMax image-01)。标题不烧进图, 在「安全区」叠层预览, 避免平台 UI 遮挡。",
    imageFailed: "出图失败",
    titleSafeZone: "标题安全区",
    coverPortrait: "主角特写",
    coverDramatic: "冲突场面",
    coverSymbolic: "意象象征",
    consistencyTrend: "一致性趋势 · {n} 轮",
    weakestDim: "最弱:{label} {score}",
    roundN: "第 {n} 轮:{score}",
    compositionFraming: "构图取景 · 三分法",
    compositionHints: "构图建议",
    hintSubject: "主体位置",
    hintHeadroom: "头部空间",
    hintLookRoom: "视线空间",
    hintBalance: "画面平衡",
    cameraPath: "运镜路径 · {label}",
    cameraPos: "机位",
    focusPoint: "焦点",
    movePushIn: "推近",
    movePullOut: "拉远",
    movePan: "横摇",
    moveTilt: "纵摇",
    moveDolly: "移动",
    moveCrane: "升降",
    moveOrbit: "环绕",
    moveHandheld: "手持",
    moveStatic: "固定",
    castSavedTitle: "角色档案已保存({n} 个)",
    castSavedDesc: "后续生成/重生该镜将锁定这些人脸",
    castTitle: "角色档案(跨镜锁脸)",
    castDesc: "锁定角色人脸后,后续生成/重生该镜自动注入参考,治「每个镜头脸都不一样」。最多 3 个。",
    saveCast: "保存档案",
    videoNodeSub: "逐段分镜视频",
    regenerating: "重新生成中...",
    clickToPlay: "点击播放",
    clickRetry: "点击重试",
    cameraFollowScript: "运镜·跟随剧本",
    cameraTitle: "运镜(重生该镜视频时生效)",
    tailFramePlaceholder: "尾帧URL",
    tailFrameTitle: "尾帧参考图 URL(可灵首尾帧融合,锁定切镜构图;重生该镜时生效)",
    regenerate: "重新生成",
    waitStoryboard: "等待分镜完成...",
    videoGenerating: "视频生成中...",
    storyboardArtist: "分镜师",
    storyboardSub: "分镜脚本 · 镜头语言设计",
    sketchAlt: "构图草图",
    sketchTitle: "构图草图(草图锁)",
    mustShow: "必现",
    waitScenes: "等待场景设计完成...",
    writingBoards: "分镜脚本编写中...",
    scriptWorldSub: "剧本 · 角色 · 世界观",
    scriptSynopsis: "剧本摘要",
    characterList: "角色列表",
    shotDescriptions: "分镜描述",
    sceneConcept: "场景概念图",
    regenSceneTitle: "重新生成这张场景图(只换这一张)",
    waitCharacters: "等待角色设计完成...",
    designingScenes: "场景设计中...",
    regenFailedPrefix: "重生失败: {error}",
    editStage: "剪辑",
    directorMonitorSub: "全局监控 · 指导协调",
    producerReviewSub: "质量审核 · 成片确认",
    directorGuiding: "导演正在指导当前环节...",
    monitorDone: "全局监控完成",
    monitorAll: "监控全流程",
    overallScoreLabel: "/100 综合评分",
    qualityExcellent: "质量优秀",
    qualityNeedsWork: "有待改进",
    qualityRework: "需要返工",
    dimNarrative: "叙事",
    dimVisualConsistency: "视觉一致",
    dimPacing: "节奏",
    dimPerformance: "角色",
    dimVisualQuality: "画质",
    dimAudio: "音效",
    suggestionPrefix: "建议: {text}",
    selectPartialRedo: "选择局部重做",
    redoAll: "全部重做",
    selectRedoHint: "选择需要重做的环节（会自动重做之后的流程）：",
    redoFromStage: "将从「{label}」开始，依次重做后续所有环节",
    redoing: "重做中...",
    startRedo: "开始重做 ({n})",
    completeProject: "满意，完成项目",
    selectOptimizeHint: "选择要优化的环节：",
    waitEdit: "等待剪辑完成...",
    producerReviewing: "制片人正在审核...",
    reviewComplete: "审核完成",
    noProjectInfo: "无法获取项目信息",
    feedbackSubmitted: "已提交修改意见",
    submitFailedRetry: "提交失败，请重试",
    confirmed: "已确认",
    confirmSave: "确认保存",
    tweak: "微调",
    feedbackPlaceholder: "输入修改意见...",
    filmPreviewMuxed: "成片预览（合成版）",
    filmPreview: "成片预览",
    editorSub: "剪辑 · 配乐 · 合成",
    shotCountN: "{n} 个镜头",
    totalDuration: "总时长 {n}s",
    playFilm: "播放成片",
    bgm: "背景配乐",
    playing: "播放中",
    clickPreview: "点击试听",
    moveUp: "上移",
    moveDown: "下移",
    timelineDirty: "时间线已修改（{n} 镜头）",
    undo: "撤销",
    saveToProject: "保存到项目",
    reEdit: "重新剪辑",
    reEditFailed: "重新剪辑失败,已保留原剪辑结果",
    reEditFailedWith: "重新剪辑失败,已保留原剪辑结果:{error}",
    waitVideos: "等待视频生成完成...",
    editing: "剪辑中...",
    unknownShort: "未知错误",
    characterAssetsSub: "角色资产 · 多视角设计",
    dnaPartial: "已抽 {filled}/{total} 维; 缺: {missing}",
    dnaComplete: "DNA 全部 {n} 维已抽取",
    reextractDnaTitle: "重抽 DNA — vision 重跑 8 维, 不重生角色图 (~5-10s)",
    reextract: "重抽",
    reextracting: "重抽中",
    regenCharTitle: "重新生成这张角色图(只换这一张)",
    threeView: "{name} 三视图",
    threeViewTitle: "{name} — 三视图",
    waitWriter: "等待编剧完成...",
    designingCharacters: "角色设计中...",
    dnaFailedPrefix: "DNA 重抽失败: {error}",
  },
  polishUi: {
    styleLiterary: "文艺",
    styleLiteraryHint: "意象 · 留白",
    styleCommercial: "商业",
    styleCommercialHint: "爽点 · 节奏",
    styleThriller: "悬疑",
    styleThrillerHint: "信息差 · 压抑",
    styleComedy: "喜剧",
    styleComedyHint: "反差 · 轻盈",
    styleDocumentary: "纪实",
    styleDocumentaryHint: "客观 · 克制",
    stylePoetic: "诗意",
    stylePoeticHint: "韵律 · 象征",
    intensityLight: "轻度",
    intensityLightHint: "只改词句",
    intensityModerate: "中度",
    intensityModerateHint: "调整语序",
    intensityHeavy: "重度",
    intensityHeavyHint: "可重写段落",
    projectScript: "项目剧本",
    billingProRequired: "Pro 润色(行业级诊断 · deepseek-v4-pro)需升级到 creator / pro 档",
    billingUpgradeRequired: "本功能需升级档位",
    polishFailedStatus: "润色失败 ({status})",
    stoppedHint: "已停止 · 你可以改设置后再点\"开始润色\"",
    networkError: "网络异常",
    libNamePro: "Pro 体检",
    libNameBasic: "润色",
    libNameDraft: "润色稿 {date}",
    saveFailedStatus: "保存失败 ({status})",
    savedToLibMsg: "已存到素材库 · 之后可在新项目里直接引用",
    saveFailed: "保存失败",
    saveToProjectReady: "已写回项目 · AIGC 就绪度 {n}",
    saveToProjectOk: "已写回项目 · 下次打开还能看到",
    writeFailedStatus: "写入失败 ({status})",
    writeFailed: "写入失败",
    subtitle: "保结构不动情节 · Basic 轻打磨 / Pro 附行业级诊断",
    importedFrom: "· 已从项目《{name}》导入",
    historyTitle: "查看此项目最近 10 次润色记录, 支持恢复到任意版本",
    historyBtn: "历史 ({n})",
    resetTitle: "清空所有输入",
    modeLabel: "润色档位",
    basicHint: "快速打磨词句 · 不改结构 · 适合小改和风格切换",
    proLabel: "Pro · 行业级",
    proHint: "McKee 三幕 + 漫剧节奏 + AIGC 管线就绪度 · 附完整诊断体检单",
    styleLabel: "目标风格",
    styleOptional: "(可选, 不选则保持原风格)",
    keepOriginal: "保持原风格",
    intensityLabel: "润色力度",
    focusLabel: "特别要求",
    optional: "(可选)",
    focusPlaceholder: "例: \"强化视觉感\" / \"把第三人称改成第一人称\" / \"多加潜台词\"",
    original: "原文",
    clear: "清空",
    sourcePlaceholder: "在此粘贴剧本原文 (至少 20 字)…\n\n支持:\n  · 纯文本故事/大纲\n  · 带 \"Shot N / 场景 / 对白\" 等标签的分镜格式\n  · McKee 三幕结构\n\n润色会保留所有结构标签,只优化内文。",
    sourceFromProject: "来源: 项目导入",
    sourceFromManual: "来源: 手工输入",
    stopTitle: "中途停止本次润色 (改设置后可重新开始)",
    stopDiagnosing: "停止 · 跑诊断中…",
    stopPolishing: "停止 · 润色中…",
    runPro: "Pro 润色 + 诊断",
    runBasic: "开始润色",
    resultLabel: "润色结果",
    writebackTitle: "回写到项目《{name}》的 script asset (追加到 polishHistory, 不会覆盖 shots)",
    writing: "写入中",
    writtenBack: "已写回",
    failed: "失败",
    writebackProject: "回写项目",
    copyTitle: "复制全文",
    copied: "已复制",
    copy: "复制",
    downloadTxtTitle: "下载润色后剧本 .txt",
    exportMdTitle: "导出为 Markdown 体检报告(含 Pro 诊断), 可直接发飞书/Notion",
    exportDocTitle: "导出为 Word .doc (Word / WPS / Pages 都能直接打开)",
    saveLibTitle: "保存到我的全局素材库, 之后在新项目可作为参考剧本复用",
    savingShort: "存中…",
    savedShort: "已存",
    saveToLib: "存素材库",
    replaceSourceTitle: "把润色结果回填到左侧原文框",
    replaceSource: "替换原文",
    goUpgrade: "去升级 →",
    upgradeHint: "免费 / 入门档可用「快速润色」(基础模式),无需升级",
    checkApiKey: "请检查 OPENAI_API_KEY 配置, 或稍后重试",
    loadingPro: "正在跑行业级诊断, 一般需要 60-180 秒…",
    loadingBasic: "正在润色中, 一般需要 15-40 秒…",
    loadingProHint: "Pro 模式会同时出 Hook/三幕/对白/角色锚/光影/AIGC 就绪度 6 项体检报告",
    viewingHistory: "正在查看历史版本 ·",
    gotIt: "知道了",
    gotItTitle: "消除此提示, 但保留当前视图",
    degradedHint: "模型返回的 JSON 格式有瑕疵(常见于剧本换行未转义),已做兜底提取。若正文错位,建议点\"开始润色\"重试,或把原文拆成更短的段落。",
    changeSummary: "改动要点",
    notesLabel: "具体调整 ({n})",
    diffViewLabel: "原文 vs 润色 · 对比视图",
    fullViewLabel: "润色后全文",
    viewFullTitle: "整块展示润色后全文",
    viewFull: "整块",
    viewDiffTitle: "左右并排对比原文 / 润色, 高亮改动行",
    viewDiff: "对比",
    searching: "正在查找:",
    matchCount: "{n} 处匹配",
    clearHighlight: "清除",
    industryAudit: "行业级诊断 · Industry Audit",
    noAuditHint: "本次未拿到完整诊断结构, 可再跑一次 Pro 模式, 或切到 Basic 先快速打磨。",
    emptyHint: "在左侧输入原文 → 选择风格/力度 → 点\"开始润色\"",
    emptySubhint: "结果会保留段落与分镜结构, 只对文字进行打磨。适合做\"先打磨再进管线\"的两阶段流程。",
    footerTips: "Tips: 润色不会改动情节和角色名。Pro 模式额外出一份行业诊断, 覆盖 Hook / 三幕结构 / 对白问题 / 角色 identity 锚 / 场景光影 / AIGC 就绪度。 若想对已生成的项目剧本做润色,",
    goProjects: "去项目页",
    footerTipsTail: "点\"润色\"按钮跳转回来即可。",
    bookTitle: "《{title}》",
    synopsisPrefix: "梗概:",
    genrePrefix: "类型:",
    actSuffix: " · 第{n}幕",
    tagScene: "[场景]",
    tagChars: "[人物]",
    tagAction: "[动作]",
    tagEmotion: "[情绪]",
    tagDialogue: "[对白]",
    changeRate: "改动率",
    totalLinesBefore: "共 ",
    totalLinesAfter: " 行",
    polishedAfter: "润色后",
    noDiff: "两段内容完全一致 — 无差异可显示",
    readinessGreen: "管线就绪 · 可直接进 Director",
    readinessAmber: "基本就绪 · 建议再过一遍",
    readinessRed: "就绪度不足 · 建议先做一版重度润色",
    latestPolish: "最近一次润色",
    proIndustry: "Pro · 行业级诊断",
    notesCount: "{n} 处调整",
    collapseAuditTitle: "折叠体检单",
    expandAuditTitle: "展开完整体检单",
    collapse: "收起",
    viewAudit: "查看体检单",
    polishAgainTitle: "去 Polish Studio 再润色一次",
    polishAgain: "再润色",
    searchInResult: "在润色结果正文中高亮这段内容",
    addToFocusTitle: "加入下一轮润色的「特别要求」, 让 LLM 重点处理",
    aigcReadiness: "AIGC 管线就绪度",
    stylePortrait: "风格画像",
    fieldGenre: "类型",
    fieldTone: "基调",
    fieldRhythm: "节奏",
    fieldArt: "美术",
    hookTitle: "前 3 秒 Hook",
    hookWeak: "弱",
    hookOk: "中",
    hookStrong: "强",
    hookStrength: "强度: {label}",
    actTitle: "三幕结构 · Save the Cat 节拍",
    beatInciting: "激励事件",
    beatMidpoint: "中点反转",
    beatClimax: "高潮",
    beatResolution: "收尾",
    missingBeats: "缺失节拍 ({n})",
    missingBeatsHint: "· 可 ＋ 到下轮 focus",
    fillBeat: "补上{beat}",
    dialogueTitle: "对白问题 · 反直抒 & 情绪可视化",
    onTheNose: "直抒胸臆 (建议改 subtext) · {n}",
    abstractEmotion: "抽象情绪 (建议画面化) · {n}",
    charAnchorsTitle: "角色 Identity 锚点 · Cameo/Seedance 对齐",
    faceLock: "锁脸",
    speechStyle: "话风",
    arc: "弧光",
    lightingTitle: "场景光影表 · Prompt-ready",
    colLightDir: "光向",
    colQuality: "光质",
    colColorTemp: "色温",
    colMood: "氛围",
    continuityTitle: "跨镜一致性钩子 · Keyframes 首尾帧衔接",
    catPacing: "节奏",
    catDialogue: "对白",
    catStructure: "结构",
    catCharacter: "角色",
    catAigc: "AIGC",
    catOther: "其他",
    issuesTitle: "问题清单 ({n})",
    historyAria: "润色历史",
    historyHeading: "润色历史 · 最近 {n} 次",
    maxKeep: "· 最多保留 10 条",
    trendTitle: "AIGC 就绪度从 {from} → {to} ({n} 次)",
    historyEmpty: "还没有历史记录",
    historyEmptyHint: "跑完润色后点\"回写项目\",这里就会出现可回看/恢复的版本。",
    view: "查看",
    footerViewHint: "把这次润色填回右侧结果区 ·",
    footerReplaceHint: "把这次的润色结果作为新的原文,从它迭代",
    noSummary: "(无摘要)",
    charsNotes: "{chars} 字 · {n} 调整点",
    viewTitle: "把这次润色载入到右侧结果区",
  },
  dashPages: {
    imagesOnly: "只能上传图片",
    imageTooLargeMb: "图片太大(上限 {n}MB)",
    uploadNetwork: "上传失败,请检查网络",
    urlMustHttp: "URL 必须以 http(s):// 开头",
    urlFetchFailed: "URL 抓取失败",
    urlFetchNetwork: "URL 抓取失败,请检查网络",
    uploadFile: "上传文件",
    useUrl: "用 URL",
    fetchUrl: "抓取",
    clickOrUrl: "点击上传 或 用 URL",
    clickOrDropOrUrl: "点击 / 拖入图片 或 用 URL",
    dropToUpload: "放开即上传",
    clear: "清空",
    remove: "移除",
    addClip: "加片段",
    clipUrlInvalid: "片段 URL 需为 http(s) 或站内 serve-file",
    composeFailedHttp: "合成失败 (HTTP {status})",
    composeNetwork: "网络错误,合成失败",
    musicUrlPh: "配乐 URL(可选,http(s) 或站内 serve-file)",
    musicDroppedHint: "⚠ 配乐未生效(URL 格式不对或超 64MB 被限流)—— 成片无 BGM,其余正常。",
    generateFailed: "生成失败",
    generateFailedHttp: "生成失败 (HTTP {status})",
    generateFailedStatus: "生成失败 ({status})",
    generateNetwork: "网络错误,生成失败",
    generateOk: "生成成功!",
    generateTimeout: "生成超时 (超过 6 分钟无响应)。",
    networkError: "网络错误",
    networkAbnormal: "网络异常",
    saveFailed: "保存失败",
    saveCharacter: "保存角色",
    charName: "角色名称",
    charNamePh: "例：青枫侠客",
    charDesc: "角色描述",
    charDescPh: "角色背景、性格、故事等...",
    charAppearance: "外貌描述",
    charAppearancePh: "头发颜色、服饰、体型、面部特征...",
    charStyleKw: "风格关键词",
    charStyleKwPh: "例：古风、赛博朋克、水墨、写实",
    visualTags: "视觉标签",
    tagPh: "输入标签后按 Enter",
    refImageUrl: "参考图片 URL",
    imageUrlPh: "粘贴图片链接后按 Enter",
    autoFillNeedImage: "请先加一张参考图再点自动识别",
    recognizeFailed: "识别失败 ({status})",
    genderMale: "男",
    genderFemale: "女",
    skinToneOf: "{tone}肤色",
    temperamentPrefix: "气质: {v}",
    costumePrefix: "着装: {v}",
    markPrefix: "记号: {v}",
    recognizedHigh: "✓ 已识别 (高置信度), 已填到空字段, 已填字段不会覆盖",
    recognizedLow: "⚠️ 已识别 (低置信度, 多字段未明示), 建议手工补全",
    nameRequired: "请填写角色名称",
    autoFillTitle: "用 GPT-4o Vision 从第一张参考图自动识别角色档案 (性别/年龄/肤色/体型/外观/服饰/气质)",
    recognizing: "识别中...",
    recognizedRedo: "已识别 (再点重做)",
    autoFillFromImage: "从图自动识别 6 维档案",
    autoFillHint: "仅会填到空字段, 不覆盖你已经写的",
    appearanceTraits: "外貌特征",
    usedNTimes: "使用 {n} 次",
    usedNShort: "用 {n} 次",
    profileSection: "角色档案 · 设定图 / 小传 / 音色",
    autoBio: "自动小传",
    boundVoice: "绑定音色",
    voiceDefault: " · 默认",
    turnaroundTitle: "多视角设定图 (turnaround)",
    promptReady: "prompt 就绪",
    noImageYet: "未出图",
    noProfileYet: "还没生成档案。点「生成角色档案」从外观自动出 小传 + 绑定音色 + 多视角设定图 prompt(零成本即时);需要真出图再点「生成设定图」。",
    generateProfile: "生成角色档案",
    refreshProfile: "刷新档案",
    generateTurnaround: "生成设定图",
    generateTurnaroundTitle: "逐视角真出图 (需配置图像引擎, 可能产生费用)",
    turnaroundNoEngine: "未配置图像引擎或全部视角出图失败,已生成 prompt 档案 (可在配好引擎后重试出图)",
    copiedClipboard: "已复制到剪贴板",
    useCharacterCopy: "使用角色（复制提示词）",
    copyName: "【角色名称】",
    copyDesc: "【角色描述】",
    copyLook: "【外貌特征】",
    copyStyle: "【风格关键词】",
    copyTags: "【视觉标签】",
    deleteConfirm: "确定删除该角色？",
    pageSubtitle: "跨项目角色资产 · 共 {n} 个",
    searchChars: "搜索角色名称、标签、风格...",
    noMatch: "没有匹配的角色",
    noChars: "暂无角色",
    emptyHint: "点击「保存角色」添加你的第一个角色资产",
    viewDetails: "查看详情",
    deleteCharacter: "删除角色",
    comicTitle: "漫转视频 · 分格台",
    comicSubtitle: "传一张漫画 → 投影法自动检出每格边界(条漫/规则网格最准)。分格后每格加动效 → 拼成动态漫剧(下一步)。",
    comicImage: "漫画图",
    needComicImage: "先上传一张漫画图",
    panelFailedHttp: "分格失败 (HTTP {status})",
    panelNetwork: "网络错误,分格失败",
    panelsDetected: "检出 {n} 格",
    detecting: "分格中…",
    autoDetect: "自动分格",
    panelResult: "分格结果",
    panelFailed: "分格失败",
    colPanel: "格",
    colRowCol: "行/列",
    colSize: "宽×高",
    noPanels: "没检出格子。",
    cropFailedHttp: "裁图失败 (HTTP {status})",
    cropNetwork: "网络错误,裁图失败",
    cropNoneHint: "未裁出格子(不规则布局投影法切不准)",
    cropNone: "未裁出格子",
    croppedN: "已裁出 {n} 格",
    cropping: "裁图中…",
    cropPanels: "裁切分格图",
    croppedList: "分格图({n})—— 每格可下载,或直接送去加动效:",
    panelAlt: "分格 {n}",
    panelN: "第 {n} 格",
    downloadPanel: "下载此格",
    sendToU2v: "用此格做单图变视频",
    motionFx: "动效",
    comicFlowHint: "✦ 流程:分格 → 裁图(本页)→ 每格「单图变视频」加动效 → 下面**按分格顺序**贴回真片段拼成动态漫剧。",
    dramaTitle: "拼成动态漫剧 · 真片段按分格顺序",
    dramaHint: "把每格「单图变视频」出的成片 URL **按阅读顺序**贴进来(≥2 段),顺序拼接成动态漫剧。可选配乐。片段最好同编码/分辨率(通常同一 provider 出的就是),否则顺序拼接可能报错。",
    clipUrlPh: "第 N 格的动效片段 URL(http(s) 或站内 serve-file)",
    needTwoClips: "至少两段片段才能拼成动态漫剧",
    dramaDoneNoMusic: "动态漫剧已合成(配乐被跳过)",
    dramaDone: "动态漫剧已合成",
    stitching: "拼接中…",
    composeDrama: "拼成动态漫剧({n} 段)",
    dramaReady: "动态漫剧合成完成",
    openDownloadDrama: "打开 / 下载动态漫剧",
    comicEmpty: "上传漫画后点「自动分格」——检出的格子会框在左图上,明细列在这里。",
    mvTitle: "MV 卡点规划台",
    mvSubtitle: "给音乐时长 + BPM,AI 算出每镜落在拍上的**卡点时间轴**(副歌自动加密、末镜贴合结尾)。规划完成后,每镜配画面 → 卡点合成复用既有出片链路(下一步)。",
    musicDurationSec: "音乐时长(秒)",
    bpmLabel: "BPM(每分钟拍数)",
    beatsPerShot: "每镜拍数",
    beatsHint: "越小切得越碎;副歌会自动减半加密",
    planning: "规划中…",
    genTimeline: "生成卡点时间轴",
    planFailed: "规划失败",
    planFailedHttp: "规划失败 (HTTP {status})",
    planNetwork: "网络错误,规划失败",
    plannedShots: "已规划 {n} 个卡点镜头",
    noPlannedShots: "没有可规划的卡点镜头",
    planEmptyHint: "试试调低 BPM 或每镜拍数、或加长音乐时长。",
    timelineAria: "卡点镜头时间轴",
    shotStripTitle: "第{n}镜 · {start}–{end}s · {sec}",
    colShot: "镜",
    colStart: "起(s)",
    colEnd: "止(s)",
    colDur: "时长(s)",
    colSection: "段落",
    colOnBeat: "对齐拍",
    mvSec_chorus: "副歌",
    mvSec_verse: "主歌",
    mvSec_bridge: "过渡",
    mvSec_intro: "前奏",
    mvSec_outro: "尾奏",
    mvSec_unknown: "—",
    composeTitle: "出片 · 给每镜配画面",
    composeSourcesLead: "两种画面来源(填了**真片段**就优先用真片段):",
    composeRealClips: "真视频片段",
    composeRealClipsDesc: " —— 贴几段视频 URL(可来自「单图变视频」的成片,或你自己的片段),每段按卡点时长硬切成按拍剪辑的真片段 MV。",
    composeStills: "静帧动效",
    composeStillsDesc: " —— 传几张图,每镜做 ken-burns 动画再硬切。",
    composeSourcesTail: "不够都会循环用。可选配乐。",
    realClipsLabel: "真视频片段(优先 · 每段按拍裁切)",
    videoClipUrlPh: "视频片段 URL(http(s) 或站内 serve-file)",
    pictureAlt: "画面 {n}",
    uploadPictures: "上传画面",
    needTimeline: "先生成卡点时间轴",
    needPicturesOrClips: "先上传画面,或添加真视频片段",
    fileTooLargeSkip: "{name} 超过 10MB,跳过",
    fileUploadFailed: "{name} 上传失败",
    fileUploadNetwork: "{name} 上传失败,请检查网络",
    composingWait: "合成中…(每镜一次渲染,稍候)",
    genMvClips: "生成 MV({clips} 段真片段 × {shots} 镜)",
    genMvStills: "生成 MV({pics} 张画面 × {shots} 镜)",
    mvDoneNoMusic: "MV 已合成(配乐被跳过)",
    mvDone: "MV 已合成",
    mvReady: "MV 合成完成",
    mvShortHint: "⚠ 成片 {actual}s,短于规划的 {planned}s —— 有片段短于其镜卡点时长,已按片段实际长度用(想严格贴拍,请让每段片段 ≥ 对应镜的卡点时长)。",
    openDownloadMv: "打开 / 下载 MV",
    mvClipHint: "✦ 真片段最好每段 ≥ 对应镜的卡点时长(短了会缩短成片);片段可来自「单图变视频」成片或你自己的素材。",
    mvEmpty: "填时长与 BPM,点「生成卡点时间轴」——结果会出现在这里。",
    u2vTitle: "单图变视频(I2V)",
    u2vSubtitle: "上传一张图,写一句描述 — AI 给你 5-15s 视频(Minimax / Kling / Vidu 按时长自动选)。独立工具,不进项目管线。",
    inputImage: "输入图片",
    needImageAndPrompt: "需要先上传图片 + 写一句描述",
    tailFrameOptional: "尾帧 (可选 · 启用首尾帧融合)",
    dropTail: "放开即上传尾帧",
    clickOrDropTail: "点击 / 拖入尾帧 · Kling 自动补中间运动",
    flfModeHint: "✦ 模式: 首尾帧融合 · 引擎: Kling Master (失败回退 Minimax 单图)",
    describeMotion: "描述如何动",
    motionPlaceholder: "例如:人物缓缓抬头,风吹动头发,背景虚化",
    duration: "时长",
    durationEngineHint: "{label} · 后端走 {engine}",
    generatingPct: "生成中 {pct}% · {time}",
    generateVideo: "生成视频",
    resultPreview: "结果预览",
    waited: "已等待 {time}",
    engineGenerating: "{engine} 正在生成 — 通常 1-3 分钟",
    progressEstimateHint: "进度为时间估算,出片瞬间跳到 100%",
    resultsHere: "结果将出现在这里",
    downloadMp4: "下载 MP4",
    addToMvTitle: "把这段视频作为真片段加入 MV 卡点台",
    addToMv: "加入 MV 片段",
    svTitle: "极速分镜台",
    svEyebrow: "CINESPARK · 三幕极速短视频",
    svIdeaPh: "输入创意,如:赛博朋克侦探在雨夜发现一个改变命运的线索",
    svIdeaMin: "创意至少 5 个字符",
    svDurationLock: "时长锁定",
    svStylePh: "画风(可选)",
    svLangTitle: "制作语言:台词/标题文案语种(配音跟随)",
    svLangAuto: "语言:自动",
    langZh: "中文",
    langJa: "日本語",
    svGenerating: "生成分镜中…",
    svGenerate: "生成分镜计划",
    svVocab: "15s 运镜词库",
    svApplyMove: "应用到 {phase} 镜",
    svNeedPlan: "先生成分镜计划",
    svEmptyTitle: "输入创意,一键生成三幕分镜",
    svEmptySub: "HOOK 钩子 · BODY 核心 · CLIMAX 高潮",
    svTimeline: "{n}s 时间轴分镜",
    svExpandPrompt: "展开 AI Prompt",
    svPreview: "预览",
    svCopyPrompt: "复制 Prompt",
    previewFailed: "预览失败",
    svParams: "短视频参数",
    svParamsLocked: "生成后可调参",
    svMotion: "运动控制",
    speedSlow: "慢",
    speedNormal: "正常",
    speedFast: "快",
    svLook: "视觉增强",
    svInterp: "插帧",
    svUpscale: "放大 Upscale",
    svOutput: "输出设置",
    svRhythmMix: "节奏分布",
    svSendCreate: "用此方案去创作",
    svExport: "导出分镜表",
    svTotalDur: "总时长 {n}.0s",
    svShotCount: "{n} 镜",
    svRhythmStat: "节奏 {label}",
    svMdMeta: "创意:{idea} · 时长:{dur}s · 节奏:{rhythm}",
    svMdShot: "景别:{size} · 运镜:{move} (Motion {motion})",
    svMdFrame: "画面:{frame}",
    svSeedHead: "[15s 三幕分镜]",
    svSeedMove: "（{move}）",
    svRhythmDesc_suspense: "前慢后快",
    svRhythmDesc_blockbuster: "快切高频",
    svRhythmDesc_emotion: "长镜慢推",
    siSubtitle: "粘贴长篇小说 / 剧本 → 自动分集 + 选叙事模式 → 逐集送入创作工坊",
    siReading: "📖 通读中…",
    siAskBook: "📖 AI 问书(人物关系/设定/高光)",
    siSampled: "超长文本已三段采样(开头/中段/结尾)",
    siPeople: "👤 人物({n})",
    siSettings: "🗺 设定({n})",
    siHighlights: "✨ 高光({n})",
    analyzeFailed: "分析失败",
    siBatchTitle: "整季批量 · {mode}",
    siBatchSent: "已送 {done} / {total} 集",
    siSendNext: "送入下一集 (EP{n} {title})",
    siBatchDone: "✓ 全季已送入创作",
    siPastePh: "粘贴整部小说或长剧本…\n\n· 有「第X章 / Chapter N / ## 标题」标记 → 按标记分集\n· 没有标记 → 按目标字数自动分集",
    siNarrationMode: "叙事模式",
    siPlusTrack: "+ 解说音轨",
    siTargetChars: "单集目标字数(可选,无章节标记时生效)",
    siTargetPh: "默认 2000",
    siSmartSplit: "智能拆解",
    siCharsTotal: "共 {n} 字",
    siCharsN: "{n} 字",
    siNoEpisodes: "未识别到可拆解的内容",
    siSplitSummary: "拆出 {n} 集 · 叙事:{mode}",
    siSeasonNarrate: "整季并行解说音轨",
    siSeasonBatch: "整季批量创作",
    siNarrateReport: "解说音轨编排 · 并发 {n}",
    siNarrateOk: "成功 {ok}/{total} 集",
    siNarrateFail: " · 失败 {n}",
    siSegMeta: "{n} 句 · ~{sec}s · {voice}",
    siAudioOut: " · 已出音频 {n}",
    siPlanReady: " · 计划就绪 (待配置 TTS)",
    siNeedTtsBefore: "📌 解说音轨计划已并行编排完成;配置",
    siNeedTtsAfter: "后将真出 mp3 音频。",
    siVoiceover: "旁白 {n} 句 · ~{sec}s · {voice}",
    siCreateFromEp: "用此集创作",
    siSeedPrefix: "【叙事模式:{mode}】",
    siMode_dialogue: "对白驱动",
    siMode_first_person: "第一人称解说",
    siMode_narrator: "第三人称旁白",
    siModeDesc_dialogue: "以角色对白推进剧情,旁白最少",
    siModeDesc_first_person: "主角第一人称口吻串场解说",
    siModeDesc_narrator: "全知旁白讲述,适合快节奏短剧",
    ecTitle: "对话式编辑台",
    ecSubtitle: "对成片用大白话说要改什么 → 解析成一组编辑意图,确认后调既有 recompose / regenerate-shot。",
    ecSafety: "解析只读,破坏性操作(删镜/重配音)必须二次确认。",
    ecPlaceholder: "例如:删掉第3镜,改成竖屏卡点字幕,节奏快一点",
    ecEx1: "删掉第3镜,改成竖屏卡点字幕",
    ecEx2: "节奏快一点,适配抖音",
    ecEx3: "第2镜调暗一点",
    ecEx4: "重新配音",
    ecParseHint: "⌘/Ctrl + Enter 解析 · {n}/2000",
    parse: "解析",
    parsing: "解析中…",
    parseFailed: "解析失败",
    parseFailedHttp: "解析失败 (HTTP {status})",
    parseNetwork: "网络错误,解析失败",
    parseBadBody: "解析返回异常,请重试",
    ecNeedText: "先说一句要改什么",
    ecNeedProject: "先选一个要修改的项目",
    ecUnmatched: "没听懂这句 —— 换个说法试试(如「删掉第3镜」「改成竖屏卡点字幕」)。",
    ecWillDo: "我将执行以下 {n} 项修改:",
    ecDestructiveWarn: "含删镜 / 重生 / 重配音等**花钱或不可逆**操作 —— 需点两次确认才执行。",
    ecRegenLead: "· 第 {list} 镜将",
    ecRegenBold1: "重生画面",
    ecRegenMid: " —— 逐镜串行,每镜都是一次真实的付费视频生成。你的说明会",
    ecRegenBold2: "合并进原镜描述",
    ecRegenTail: "(不是替换),其余保持不变。",
    listSep: "、",
    ecRegenRunning: "正在重生…",
    ecRegenOk: "已重生 ✓",
    ecRegenFail: "重生失败",
    ecRegenShotN: "正在重生第 {n} 镜…",
    ecConfirmRegen: "确认重生 {n} 个镜头(要花钱)",
    ecRegenThese: "重生这 {n} 个镜头",
    ecShotLog: "第 {n} 镜:{msg}",
    ecPaceHint: "· 「节奏{pace}一点」需整片重跑(recompose 不改节奏),本页不执行。",
    paceFast: "快",
    paceSlow: "慢",
    ecWhichProject: "对哪个项目的成片执行",
    ecSelectProject: "— 选择项目 —",
    ecNoProjects: "还没有项目 —— 先去创作工坊出一片。",
    recomposing: "重合成中…",
    ecConfirmWait: "确认删改?稍候…",
    ecConfirmIrreversible: "确认执行(含不可逆操作)",
    ecExecWillConfirm: "执行(将二次确认)",
    ecConfirmExec: "确认执行",
    ecCooldown: "请稍候,确认按钮即将就绪…",
    ecArmHint: "这条含不可逆操作,再刻意点一次确认;或",
    ecNoRecompose: "本条指令没有可在此直接执行的组合级编辑(见上方指路)。",
    recomposeFailedHttp: "重合成失败 (HTTP {status})",
    recomposeNetwork: "网络错误,重合成失败",
    recomposeOk: "已重合成成片",
    recomposeDone: "重合成完成",
    openDownloadFilm: "打开 / 下载成片",
    ecEmpty: "说一句要改什么,或点上面的示例 —— 解析出的意图会以确认卡形式出现在这里。",
  },
  dashMore: {
    seriesSubtitle: "系列剧 · 跨集一致 · 一键批量出片",
    newSeries: "新建系列",
    noSeries: "还没有系列剧。",
    noSeriesHint: "在任一项目里「设为系列锚点」,后续集数将自动继承它的角色、画风与锁脸设定,保持整季一致。",
    seriesEpMeta: "{n} 集 · 已完成 {done}/{total}",
    newSeriesTitle: "新建系列剧",
    seriesNameLabel: "系列名",
    seriesNamePlaceholder: "如:冷焰笼",
    anchorLabel: "锚点项目(可选 —— 续集继承其主角/画风,跨集一致)",
    noAnchor: "不设锚点(从零开始,各集独立设定)",
    aiSplitMode: "AI 自动拆集",
    manualMode: "手动逐集",
    premiseLabel: "一句系列设定",
    premisePlaceholder: "如:被囚铁笼的格斗者,每集挑战一名守笼者,终极目标是揭穿笼主的阴谋。",
    episodeCountLabel: "集数",
    aiSplitBtn: "AI 拆集",
    epOutlines: "各集梗概(可逐集微调)",
    addEpisode: "加一集",
    epTitlePlaceholder: "本集标题(可空)",
    epPremisePlaceholder: "本集剧情梗概",
    addFirstEpisode: "+ 添加第一集",
    autoGenAfterCreate: "创建后立即批量生成",
    createSeries: "创建系列",
    createSeriesWithN: "创建系列({n} 集)",
    defaultSeriesTitle: "我的系列剧",
    splitFailed: "拆集失败 {status}",
    createFailedStatus: "创建失败 {status}",
    splitShortWarn: "AI 只拆出 {n} 集(目标 {target} 集)。可下方「加一集」手动补足,或精简设定后重拆。",
    templatesSubtitle: "把出片好的项目沉淀成可复用模板 —— 画风 · 多参元素 · 节奏一键带走,直接起片。",
    searchTemplates: "搜画风 / 类型 / 标签…",
    search: "搜索",
    favOnly: "只看收藏",
    noTemplates: "还没有模板 —— 在项目「技术监看」里把出片好的项目「存为模板」即可上架。",
    qualityN: "质量 {n}",
    favorite: "收藏",
    rateNStars: "评 {n} 星",
    noRatings: "暂无评分",
    usedNTimes: "已被起片 {n} 次",
    useTemplate: "用此模板起片",
    styleRole: "画风",
    propRole: "道具",
    motionRole: "运镜",
    voiceRole: "配音",
    teamWorkspace: "团队工作区",
    teamWorkspaceDesc: "主账号管理团队积分池 · 按成员分配额度",
    creditsPool: "团队积分池",
    creditsUnit: "积分",
    used: "已用",
    allocatedUnused: "已分配未用",
    allocatedUsed: "已分配 {allocated} · 已用 {used}",
    overBy: "超额 {n}",
    remainingAlloc: "剩余可分 {n}",
    memberEmailPlaceholder: "成员邮箱 / ID",
    member: "成员",
    admin: "管理员",
    owner: "主账号",
    add: "添加",
    noMembers: "还没有团队成员,添加后即可分配积分额度",
    colMember: "成员",
    colRole: "角色",
    colQuota: "额度",
    colLeft: "剩余",
    remove: "移除",
    inviteMembers: "邀请成员加入团队",
    inviteEmailPlaceholder: "被邀请人邮箱",
    initialQuota: "接受后初始额度",
    quota: "额度",
    genInviteLink: "生成邀请链接",
    copyLink: "复制链接",
    inviteHint: "被邀请人需用自己的已有账号登录后打开链接接受(系统不代为创建账号);接受后以其真实账号进团队。",
    persistHint: "成员消费已按额度实时扣减(随生成成本计入各成员 used,余额不足将被拒绝);额度分配 + 真·多用户邀请均已持久化。",
    invalidQuota: "额度无效",
    memberExists: "成员已存在",
    cannotRemove: "无法移除该成员",
    saveFailed: "保存失败",
    savedOk: "✓ 已保存",
    enterInviteEmail: "请填邀请邮箱",
    genFailed: "生成失败",
    inviteCreated: "✓ 邀请已生成",
    linkCopied: "✓ 链接已复制",
    invitePending: "待接受",
    inviteAccepted: "已加入",
    inviteRevoked: "已撤销",
    inviteExpired: "已过期",
    inviteQuotaN: "{n} 额度",
    missingToken: "链接缺少邀请 token",
    acceptFailed: "接受失败",
    acceptTitle: "接受团队邀请",
    acceptDesc: "用你自己的账号加入对方的团队工作区,即可共享积分额度。",
    joinedTeam: "已加入团队",
    joinedMeta: "初始额度 {n} · 角色 {role}",
    goTeam: "前往团队工作区 →",
    loginFirst: "请先登录你的账号",
    loginFirstHint: "系统不会代为创建账号。登录后回到本链接即可接受。",
    acceptInvite: "接受邀请",
    missingCredential: "链接缺少邀请凭证",
    jobsSubtitle: "流水线进度与死信可见;失败任务可一键重投 —— 续跑只补缺失阶段,不重复生成已出产物。",
    queueOffLead: "当前未启用队列模式(",
    queueOffTail: ")— 创作走请求内联执行;重投的任务会入队等待队列模式开启。",
    noJobs: "暂无任务记录。队列模式下在创作工坊 ROLL 即产生任务。",
    stagePrefix: "阶段:",
    attemptsN: "尝试 {n} 次",
    viewProject: "查看项目 →",
    unknownError: "未知错误",
    retryResume: "重投(断点续跑)",
    queued: "排队中",
    running: "执行中",
    failedDead: "失败(死信)",
    stepDirector: "导演分析",
    stepStyleBible: "画风锚点",
    stepWriter: "剧本",
    stepDesign: "角色/场景",
    stepVideo: "镜头视频",
    stepFinalize: "收尾",
    assetsSubtitle: "创作产生的数字资产 · 共 {n} 个",
    deleteAssetConfirm: "确定删除资产「{name}」?此操作不可恢复。",
    deleteFailed: "删除失败",
    noAssets: "暂无素材",
    noAssetsOfType: "该类型暂无素材",
    assetsEmptyHint: "完成一次创作后，生成的角色、场景、分镜等素材会自动入库",
    deleteAssetTitle: "删除资产(不可恢复)",
    music: "配乐",
    finalFilm: "成片",
    masterTitle: "顶级创意生成器",
    masterEyebrow: "MASTER PROMPT GENERATOR · 结构化导演级提示词",
    roleLabel: "Role · 角色设定",
    taskLabel: "Task · 任务",
    conceptLabel: "Core Concept · 核心概念",
    conceptPlaceholder: "本片的核心创意 / 情绪 / 卖点…",
    filmLookTitle: "影片 LOOK · 光影参考",
    lutTitle: "色彩 LUT",
    movementTitle: "导演运镜风格",
    aspectLabel: "画幅",
    extraLabel: "额外参数",
    optional: "可选",
    refinedPrompt: "优化后 Prompt",
    copy: "复制",
    refinePrompt: "优化 Prompt",
    restore: "还原",
    useToCreate: "用此创作",
    glossaryTitle: "专业术语对照表",
    refineFailed: "优化失败 ({status})",
    networkError: "网络错误",
    stylesSubtitle: "{n} 个命名风格预设 · 一键套用到创作工坊,锁定全片画风",
    searchStyles: "搜索风格名 / 英文名 / 关键词…",
    noStyleMatch: "没有匹配的风格",
    recEngine: "推荐引擎",
    applied: "已套用",
    applyStyle: "套用此风格",
    genTask: "生成任务",
    genDone: "生成完成",
    aiEngine: "AI 引擎",
    imageGen: "图像生成",
    noActivity: "还没有动态 —— 创建第一个项目后,这里会显示你的真实进度",
    chinese: "中文",
    defaultStyle: "默认风格：Poetic Mist",
    colorPref: "色彩：Film Warm",
    teamStudio: "团队：青枫漫剧 Studio",
    permCreatePublish: "权限：创作 + 发布",
    demoClip: "示意片段",
    playWithAudio: "有声播放",
    casesCopyrightLead: "⚠️ 部分卡片的「示意片段」引用自公开影视作品(如《英雄联盟：双城之战 / Arcane》，版权归 Riot Games · Fortiche · Netflix），仅用于个人学习与画风参考、",
    casesCopyrightStrong: "非商业用途",
    casesCopyrightTail: "，版权归原作者所有。正式上线请替换为自有或已授权素材。",
    polishedNoScore: "该项目最近润色过, 但未生成 Pro 体检分数",
    aigcReadiness: "AIGC 就绪度: {score}/100 · {label}",
    freeTier: "免费版",
  },
  publicUi: {
    waitSec: "{n} 秒",
    waitMinSec: "{m} 分 {s} 秒",
    waitMin: "{n} 分钟",
    loginRateLimited: "登录尝试过于频繁,请 {n} 后再试(密码可能是对的 —— 锁定期内即使输对也会被拒)",
    loginRateLimitedSoon: "登录尝试过于频繁,请稍后再试(密码可能是对的 —— 锁定期内即使输对也会被拒)",
    badCredentials: "邮箱或密码不正确",
    cooldownHint: "这是防爆破限流,不是密码错误。锁定窗口固定,重试既不会延长也不会缩短它。",
    retryAfter: "{n}后可重试",
    licenseView: "仅查看",
    licenseRemix: "可二创",
    licenseCommercial: "可商用",
    reuseMessage: "希望在我的项目里复用这个角色",
    alreadyInLibrary: "该角色已在你的角色库中, 创作时可直接选用",
    importedToLibrary: "已导入到你的角色库! 新建项目时即可选用此角色",
    grantPending: "已提交申请, 等作者审批",
    grantRecorded: "申请已记录",
    back: "返回",
    marketTitle: "Cameo IP 市场",
    marketIntro: "浏览创作者公开的角色 IP。可二创/可商用的角色直接复用；仅查看的需申请作者授权。",
    loadingMarket: "加载市场…",
    marketEmpty: "市场还没有公开的角色 IP。",
    perUse: "¥{n}/次",
    reusedN: "· 已复用 {n}",
    importToLibrary: "导入到角色库",
    requestGrant: "申请授权",
    imagesOnly: "只能上传图片文件",
    imageTooLargeMb: "图片太大(上限 {n}MB)",
    visionDisabled: "vision 服务暂未启用",
    cameoScoreLow: "照片评分偏低 ({n}),建议优化后再锁脸",
    scoreFailed: "评分失败",
    invalidInput: "输入无效",
    connectingTeam: "正在连接 AI 团队...",
    createFailed: "创作失败",
    streamUnreadable: "无法读取响应流",
    createDone: "创作完成！",
    createRetry: "创作失败，请重试",
    ideaPlaceholderLong: "支持两种输入方式：\n\n方式一：简短创意（50-500字）\n例如：一个关于时间旅行者的爱情故事，主角是一位物理学家...\n\n方式二：完整剧本（直接粘贴）\n支持标准剧本格式：场景标头、角色对白、△画面描述等，系统将自动解析并忠实改编\n\n输入 @ 可引用角色 / 场景 / 风格资产",
    charCount: "{n} 字符",
    scriptMode: "(剧本模式)",
    ideaHint: "简短创意 50-500 字 / 完整剧本可达 100000 字",
    cameoFaceLabel: "主角脸参考图（可选）",
    cameoLockBadge: "Cameo 锁脸",
    cameoLockHint: "上传后全片所有镜头锁定同一张脸",
    cameoUploadHint: "点击上传主角脸照片（JPG / PNG，≤10MB）",
    cameoUploadSub: "不上传也可以 — 系统会自动生成一个锁定的形象",
    cameoPreviewAlt: "主角脸预览",
    cameoLocked: "✓ 已锁定主角脸",
    cameoClearAria: "清除主角脸",
    engineFast: "速度快",
    engineQuality: "质量高",
    klingAi: "可灵 AI",
    engineChinese: "中文好",
    editStyleLabel: "剪辑风格",
    editStyleHint: "一句话调节奏与转场,可留空(默认中速)",
    editStyleDefault: "默认中速",
    editStyleFast: "⚡ 快节奏燃向",
    editStyleSlow: "🌙 慢叙抒情",
    editStyleFastVal: "快节奏燃向",
    editStyleSlowVal: "慢叙抒情",
    editStyleCustomPh: "或自定义:如「抖音爆款卡点」「王家卫式留白」(配 LLM key 时智能解析)",
    tryIdeas: "试试这些创意灵感",
    createDoneTitle: "创作完成！",
    createDoneDesc: "你的 AI 漫剧已经准备好了",
    createNewWork: "创作新作品",
    teamCreating: "AI 团队正在为你创作",
    ideaCyberTitle: "赛博朋克侦探",
    ideaCyberContent: "2077年的新东京，一位赛博侦探接到神秘委托，调查连环失踪案，却发现背后隐藏着惊天阴谋",
    ideaPalaceTitle: "古代宫廷",
    ideaPalaceContent: "大唐盛世，一位才女入宫，凭借智慧在后宫中周旋，最终成为影响朝政的关键人物",
    ideaWastelandTitle: "末日废土",
    ideaWastelandContent: "核战后的世界，幸存者们在废墟中寻找希望，一个神秘信号指引他们前往传说中的避难所",
    ideaMagicTitle: "魔法学院",
    ideaMagicContent: "魔法学院新生入学，发现自己拥有罕见的魔法天赋，却也因此卷入了一场古老的魔法战争",
    projCyberSynopsis: "2077年的新东京，一位赛博侦探接到神秘委托...",
    projPalaceSynopsis: "大唐盛世，一位才女入宫，凭借智慧在后宫中周旋...",
    projWastelandSynopsis: "核战后的世界，幸存者们在废墟中寻找希望...",
    genreAll: "全部",
    genreScifi: "科幻",
    genreGufeng: "古风",
    genreThriller: "惊悚",
    genreYouth: "青春",
    genreFantasy: "奇幻",
    genreRomance: "爱情",
    exCyberDesc: "2077年的新东京，一位赛博侦探接到神秘委托",
    exXianxiaTitle: "古风仙侠传",
    exXianxiaDesc: "修仙世界中的爱恨情仇",
    exSurvivalTitle: "末日求生录",
    exSurvivalDesc: "丧尸末日中的人性挣扎",
    exCampusTitle: "校园青春物语",
    exCampusDesc: "高中生活的酸甜苦辣",
    exMagicDesc: "魔法世界的冒险之旅",
    exRomanceTitle: "都市爱情故事",
    exRomanceDesc: "现代都市中的浪漫邂逅",
    metaDesc: "你的 AI 动画/漫剧团队，从灵感到成片一步到位",
    heroBrandLead: "青枫",
    heroBrandTrail: "漫剧",
    playAria: "播放",
    previewClip: "示意片段",
    playWithAudio: "有声播放",
    demoName: "张三",
    demoBio: "热爱创作的 AI 漫剧制作人",
    langZhCN: "简体中文",
    langZhTW: "繁體中文",
    langJa: "日本語",
    invalidInvite: "邀请无效",
    loadFailed: "加载失败",
    acceptFailed: "接受失败",
    loadingInvite: "加载邀请...",
    inviteInvalidTitle: "邀请无效",
    inviteExpiredHint: "此邀请链接已过期 / 已被吊销 / 项目已删除",
    backToProjects: "返回我的项目",
    expiresOn: "{n} 过期",
    neverExpires: "永久有效",
    invitedByPrefix: "由",
    invitedBySuffix: "邀请你",
    loginToAcceptHint: "需要先登录才能接受邀请.",
    loginToAcceptCta: "登录后接受邀请 →",
    accepting: "接受中...",
    acceptJoin: "接受邀请, 加入协作",
    roleViewer: "只读",
    roleViewerDesc: "查看剧本/分镜/视频, 不能改不能评论",
    roleCommenter: "可评论",
    roleCommenterDesc: "查看 + 发评论 + @ 提及成员",
    roleEditor: "可编辑",
    roleEditorDesc: "完整编辑权限 (改 storyboard / 时间线 / 删评论)",
    untitledWork: "未命名作品",
    synopsis: "简介",
    storyboardsN: "分镜 ({n})",
    shareFooter: "由 AI Comic Studio 生成 · 仅作者可编辑",
    welcomeTitle: "欢迎来到 AI 漫剧工作室",
    welcomeSubtitle: "使用左侧工具栏开始创作，右侧面板调整参数",
    textGen: "文本生成",
    textGenDesc: "使用 AI 生成漫画脚本和对话",
    imageGen: "图片生成",
    imageGenDesc: "生成漫画场景和角色图片",
    videoGen: "视频生成",
    videoGenDesc: "将场景转换为动态视频",
    recentProjects: "最近项目",
    projectN: "项目 {n}",
    lastEditedHours: "最后编辑：{n} 小时前",
    templateShare: "模板分享",
    shareLinkExpired: "这个分享链接不存在或已过期",
    untitledTemplate: "未命名模板",
    cloneHintOg: "点击克隆这个模板到你的库 →",
    shareLinkUnavailableTitle: "分享链接不可用 · Wind Comic",
    tagsPrefix: "标签: {n}",
    ogTemplateTitle: "{icon} {name} · Wind Comic 模板",
    ogTemplateDesc: "分享了一个 Wind Comic 故事模板 — 一键克隆到你的模板库. {n}",
    cloneFailed: "克隆失败",
    loadingTemplate: "加载分享模板...",
    linkUnavailable: "链接不可用",
    templateGone: "该分享模板不存在或已过期",
    goCreateOwn: "去自己创建一个",
    backToWorkshop: "返回创作工坊",
    clonesN: "{n} 克隆",
    clonedToLibrary: "已克隆到你的模板库",
    clonedDetail: "新模板:「{name}」(id: {id}...) 已保存到你的个人库, 下次创作时在「故事模板库」里就能看到。",
    goUse: "去使用 →",
    cloneToLibraryEyebrow: "克隆到自己的模板库",
    cloneToLibraryHint: "克隆后这个模板会出现在你的个人库, 后续可改可删, 不影响原作者。",
    cloning: "克隆中…",
    cloneToMyLibrary: "克隆到我的库",
    exampleIdeaLabel: "EXAMPLE IDEA · 示例创意",
    structureLabel: "STRUCTURE · 结构提示",
    recommendedLabel: "RECOMMENDED · 推荐设置",
    styleLook: "画风",
    duration: "时长",
    aspect: "画幅",
    camera: "运镜",
    myWorkflow: "我的工作流",
    urbanMysteryIdea: "一个都市悬疑短剧",
    savedOk: "已保存",
    saveFailedPrefix: "保存失败: {n}",
    runReal: "真实运行",
    runDone: "{n} 执行完成 ✓",
    runDoneWithFails: "{n} 完成 (有失败步骤)",
    runFailed: "执行失败",
    runFailedPrefix: "执行失败: {n}",
    studioTitle: "Agent 编排工作室",
    runRealTitle: "真跑 orchestrator (需配置 LLM key)",
    workflowNamePh: "工作流名称",
    loadSaved: "载入已存…",
    ideaPh: "创意 idea (真实运行时喂给 AI 导演)",
    stepLabelPh: "步骤标签",
    depsHint: "依赖 (勾选先决步骤):",
    noOtherSteps: "无其他步骤",
    emptyPalette: "点上方调色板添加步骤",
    validate: "校验",
    validateOk: "通过 ✓",
    execPlan: "执行计划 (层内并行)",
    layerN: "第{n}层",
    runResults: "运行结果",
  },
  sharedUi: {
    switchLanguage: "切换语言 / Language",
    brandShort: "青枫",
    skipToContent: "跳到主内容",
    footerProduct: "产品",
    footerFeatures: "功能概览",
    footerPricing: "价格计划",
    footerCases: "案例库",
    footerCompany: "公司",
    footerAbout: "关于我们",
    footerCareers: "加入我们",
    footerPrivacy: "隐私政策",
    footerResources: "资源",
    footerDocs: "使用文档",
    footerSupport: "支持中心",
    exportBtn: "导出",
    toggleParams: "切换参数面板",
    canvasHint: "从左侧工具栏选择一个工具开始创作你的漫剧",
    openProject: "打开项目",
    sceneN: "场景 {n}",
    addScene: "添加场景",
    workshopBusyTitle: "工坊任务进行中 — 点击返回",
    workshopBusy: "工坊任务进行中",
    genParams: "生成参数",
    promptLabel: "提示词",
    promptPlaceholder: "描述你想要创作的内容...",
    styleLabel: "风格",
    styleJapanese: "日式漫画",
    styleAmerican: "美式漫画",
    styleChinese: "国漫",
    styleWebtoon: "韩漫",
    sizeLabel: "尺寸",
    widthPh: "宽度",
    heightPh: "高度",
    advanced: "高级设置",
    quality: "质量",
    qualityDraft: "草稿",
    qualityStd: "标准",
    qualityHigh: "高质量",
    generate: "生成",
    toolText: "文本生成",
    toolImage: "图片生成",
    toolVideo: "视频生成",
    toolEffect: "特效",
    toolAssets: "资产库",
    toolTextDesc: "使用 AI 生成漫画脚本、对话和故事",
    toolImageDesc: "生成漫画场景、角色和背景图片",
    toolVideoDesc: "将漫画场景转换为动态视频",
    toolEffectDesc: "为漫画添加视觉特效和滤镜",
    toolAssetsDesc: "管理角色、场景和素材资源",
    toolComingSoon: "工具内容开发中...",
    progress: "进度",
    somethingWentWrong: "出错了",
    statusIdle: "待命中",
    statusThinking: "思考中",
    statusWorking: "工作中",
    aiDirector: "AI 导演",
    aiWriter: "AI 编剧",
    aiCharacterDesigner: "AI 角色设计师",
    aiSceneDesigner: "AI 场景设计师",
    aiStoryboard: "AI 分镜师",
    aiVideoProducer: "AI 视频制作",
    aiEditor: "AI 剪辑师",
    aiProducer: "AI 制片人",
    unknownRole: "未知角色",
    newCharacter: "新角色",
    charConsistency: "角色一致性管理",
    addCharacter: "添加角色",
    charNamePh: "角色名称",
    charDescPh: "角色描述（性格、背景）",
    charAppearPh: "外观描述（用于保持跨镜头一致性）",
    charTagsPh: "标签（逗号分隔）",
    noDescription: "未设置描述",
    clickAboveToAdd: "，点击上方按钮添加",
    cameoAnalyzing: "正在分析这张脸的适配度…",
    cameoScoreUnavailable: "评分暂不可用({error}),不影响锁脸。",
    verdictExcellent: "非常适合",
    verdictGood: "适合",
    verdictFair: "勉强可用",
    verdictPoor: "不建议",
    cameoFit: "Cameo 适配度",
    dimClarity: "清晰度",
    dimLighting: "光线",
    dimAngle: "角度",
    dimSize: "尺寸",
    continuityPending: "连续性检测将在镜头生成中逐条上报…",
    continuityMonitor: "连续性监控",
    cameoLocked: "主角脸锁定",
    cameoUnusedTip: "本次未使用 Cameo(可在项目详情页上传主角脸锁死全片 IP)",
    cameoUsedTip: "{n} 个镜头使用了同一张主角脸参考",
    shotChain: "镜头间衔接",
    shotChainTip: "{n} 个镜头从上一条 clip 末帧做了视觉锚定",
    globalAnchor: "全局风格锚",
    globalAnchorTip: "{n} 个镜头引用了全局风格锚点,抗链式漂移",
    mentionCandidates: "提及用户候选",
    candidatesN: "{n} 候选",
    anonymous: "匿名",
    onlineN: "{n} 人在线",
    youTab: "{name} (你){tab}",
    otherTab: "{name}{tab}",
    morePeople: "还有 {n} 人",
    shotAutoRetried: "本镜触发过自动重生",
    sceneTooltip: "场号 · 当前在剧本里的第几场",
    takeTooltip: "本场已写第几遍 · 按字数自动递增",
    visionDisabled: "vision 服务暂未启用",
    cameoLowScore: "这张照片评分偏低 ({n}),建议优化后重传",
    scoreFailed: "评分失败",
    imagesOnly: "只能上传图片",
    imageTooLarge: "图片太大（上限 10MB）",
    cameoLockedOk: "主角脸已锁定 ✓",
    cameoUnlockConfirm: "确认解锁主角脸？后续镜头将由 Character Designer 自行决定角色外观。",
    unlockFailed: "解锁失败",
    cameoUnlocked: "已解锁主角脸",
    cameoUnlockedTitle: "主角脸未锁定",
    cameoEmptyHint: "上传一张主角照片，全片所有镜头都会锁定同一张脸 —— 告别\"每句台词换张脸\"的跳脸问题。",
    uploadCameo: "上传主角脸",
    cameoLockedAlt: "已锁定主角脸",
    cameoLockedTitle: "主角脸已锁定",
    cameoLockedHint: "全片所有镜头都会用这张脸作主角参考；重新生成任意镜头都会继续锁定。",
    replace: "替换",
    unlock: "解锁",
    scoreFitTitle: "让 AI 评估这张脸的适配度",
    rescore: "重新评分",
    scoreFit: "评估适配度",
    readinessHigh: "已就绪,可以开始创作",
    readinessMid: "基本就绪,补齐下面几项更稳",
    readinessLow: "建议先补齐关键项再生成",
    genReadiness: "生成就绪度",
    storyboardEditor: "分镜编辑器",
    shotMeta: "{n} 个镜头 · 总时长 {sec}s",
    addShot: "添加镜头",
    preview: "预览",
    shotDescPh: "镜头描述...",
    dialoguePh: "对白...",
    seconds: "秒",
    clickEditShot: "点击编辑镜头描述...",
    duplicate: "复制",
    noShotsYet: "还没有分镜，点击上方按钮添加或通过 AI 自动生成",
    camCloseup: "特写",
    camMediumClose: "近景",
    camMedium: "中景",
    camFull: "全景",
    camWide: "远景",
    camHigh: "俯拍",
    camLow: "仰拍",
    camFollow: "跟拍",
    mascotWait1: "太慢了吧...我都快睡着了💤",
    mascotWait2: "进度条：我尽力了😭",
    mascotWait3: "做完你的做你的，我先摸鱼🐟",
    mascotWait4: "等一个亿年...不是，等一分钟",
    mascotWait5: "我去泡杯咖啡先☕",
    mascotWait6: "这进度条是不是卡住了🤔",
    mascotWait7: "别急别急，好饭不怕晚🍚",
    mascotWait8: "摸鱼时间到！🐠",
    mascotWait9: "我数到三，进度条你给我动！",
    mascotWait10: "在？说句话？进度条？",
    mascotWork1: "嘿嘿，正在努力中~💪",
    mascotWork2: "别催别催，艺术需要时间🎨",
    mascotWork3: "这波操作有点东西👀",
    mascotWork4: "AI们正在疯狂输出中...",
    mascotWork5: "创作灵感爆发！✨",
    mascotWork6: "各位数字员工辛苦了~",
    mascotDone1: "搞定！我就说我行吧✌️",
    mascotDone2: "这波操作我给满分💯",
    mascotDone3: "又是完美的一天~🌟",
    mascotDone4: "大功告成！鼓掌👏",
    mascotDone5: "这效果，绝了！🔥",
    mascotDone6: "完美收工，下班下班~",
    mascotErr1: "啊这...翻车了🚗",
    mascotErr2: "别慌，让我想想🤔",
    mascotErr3: "重来重来，当无事发生",
    mascotErr4: "出了点小状况，稳住！",
    mascotErr5: "这个锅我不背😤",
    styleRole: "风格",
    propRole: "道具",
    mentionHint: "引用资产 · ↑↓ 选择 · Enter 确认 · Esc 关闭",
    atHint: "输入 @ 引用角色 / 场景 / 风格资产",
    atHintN: "输入 @ 引用角色 / 场景 / 风格资产({n} 个可用)",
    hideCompile: "收起编译预览",
    compilePreview: "编译预览",
    compiledPromptHint: "编译后 prompt(@引用已展开,交给图像引擎的实际文本)",
    emptyParen: "（空）",
    unresolvedMentions: "未匹配引用(将按裸名输出,建议先在角色库/资产库创建):",
    motionRole: "运镜",
    voiceRole: "配音",
    unsupportedFile: "不支持的文件类型:{name}",
    fileOver25: "{name} 超过 25MB,请用 URL 引用",
    readFailed: "读取失败:{name}",
    badMediaUrl: "无法识别该 URL 的媒体类型(需 图 / 音 / 视频)",
    multiRefOptional: "多参元素(可选)",
    lockByRole: "按角色锁一致性",
    refLimits: "图 {img} · 音 {aud} · 视频 {vid}",
    uploadFile: "上传文件",
    pasteMediaUrl: "或粘贴 图/音/视频 链接后回车",
    removeRef: "移除参考",
    elementRole: "元素角色",
    cwTitle: "角色强度 cw(25-125,越大越锁脸)",
    elementComplete: "元素完整度",
    agentWriterDesc: "剧本 · 对白 · 世界观",
    agentCharDesc: "角色资产 · 多视角",
    agentSceneDesc: "场景概念图",
    agentBoardDesc: "分镜 · 镜头规划",
    agentVideoDesc: "逐段视频",
    agentDirectorDesc: "全局监控 · 协调",
    agentEditorDesc: "剪辑 · 配乐 · 合成",
    agentProducerDesc: "质量审核 · 成片",
    requestFailed: "请求失败",
    streamUnreadable: "无法读取响应流",
    startChatWith: "和{name}开始对话...",
    agentThinking: "{name}正在思考...",
    typeMessage: "输入消息...",
    uploadImage: "上传图片",
    attachment: "附件",
    showThinking: "展示思考过程",
    noReply: "_(无回应, 可能是后端配置缺 OPENAI_API_KEY)_",
    clearChatConfirm: "清空与「{name}」的本地对话? (服务端历史不受影响)",
    aiAssistantSidebar: "AI 助手侧栏",
    aiAssistant: "AI 助手",
    chatWithContext: "基于本项目上下文 · 与 {name} 对话",
    clearLocalView: "清空本地视图(不影响服务端历史)",
    chatEmptyHint: "这里的回复会基于该项目的剧本/角色/分镜上下文。试试:",
    chatExample1: "\"把第 3 镜的对白改得更克制一点\"",
    chatExample2: "\"林小满的服装该怎么定?\"",
    enterToSend: "Enter 发送 · Shift+Enter 换行",
    chatContextHint: "服务端会保留最近 10 条对话作为上下文 · 切换 agent 是不同的话题线",
    openAssistantHotkey: "打开 AI 助手 (alt+/)",
    openAssistantChat: "打开 AI 助手聊天",
    stageAssets: "角色 / 场景",
    stageFinal: "成片",
    stageScriptDesc: "剧情结构 + 分场",
    stageAssetsDesc: "角色设定 + 场景设定",
    stageBoardDesc: "逐镜画面",
    stageFinalDesc: "视频成片",
    stagesDone: "{n}/{total} 环节",
    shotVideos: "镜头视频",
    qcHealth: "质检健康分",
    nextGen: "下一步 · 生成「{name}」",
    suggestRegen: "建议 · 重生「{name}」",
    pipelineReady: "全链路就绪 · 可导出成片",
    chooseFailed: "选定失败",
    variantChosen: "✓ 变体{n} 已设为正式成片",
    packingHint: "包装中…(hook→变体→文案→并包,约 1-3 分钟)",
    packFailed: "包装失败",
    packSummary: "✓ 包装 {ok}/{total}:",
    variantUnit: "变体",
    composeFail: "合成✗",
    copyOk: "文案✓",
    copyFail: "文案✗",
    packOk: "并包✓",
    packFail: "并包✗",
    rerunFailed: "重跑失败",
    reranDispatched: "✓ 已重跑「{name}」并派发管线重生",
    reranMarked: "✓ 已标记「{name}」重跑{extra}",
    downstreamStale: ",下游 {n} 环节置为待更新",
    directorDesk: "导演台 · 全链路控片",
    directorDeskHint: "逐环节查看状态 · 进入任意节点编辑 / 重生 · 了解重跑的下游影响",
    adWorkshopTitle: "一键后期:Hook 弹药 → A/B 变体 + 双卡 → 发布文案 → 发布包",
    packing: "包装中…",
    adWorkshop: "广告包装车间",
    mainFilm: "主成片",
    variantN: "变体{n}",
    setAsHero: "把该变体设为正式成片",
    pickAsHero: "选为正片",
    prefTitle: "首选标题",
    statusEmpty: "未生成",
    statusReady: "就绪",
    statusStale: "待更新",
    itemsN: "{n} 项",
    upstreamStale: "上游已更新,建议重生本环节",
    rerunStage: "重跑此环节",
    rerun: "重跑",
    rerunDownstream: "重跑「{name}」后,下游需重新生成:{list}",
    rerunLast: "重跑「{name}」(末环节,无下游影响)",
    confirmRerun: "确认重跑此环节",
    searchAssets: "搜索资产...",
    selectedPrefix: "已选",
    loadAssetsFailed: "加载资产失败",
    usedN: "用过 {n}",
    noMatchAssets: "没有匹配 \"{q}\" 的{type}资产",
    noAssetsYet: "还没有{type}资产",
    tryOtherKeywords: "试试其它关键词",
    createFirstAsset: "创建你的第一个全局资产，跨项目复用",
    createAsset: "创建资产",
    cameoConsistency: "Cameo 一致性",
    characterN: "角色 {n}",
    autoRetriedN: "已自动重生 {n} 次",
    firstPassOk: "首次生成达标",
    finalCw: "最终 cw",
    cameoNoScores: "本项目分镜暂无 Cameo 一致性评分(早于 v2.12 创建 / 未配置 OPENAI_API_KEY)",
    consistencyMeter: "一致性仪表",
    average: "平均",
    shotsNeedRegen: "镜需重生",
    autoRetriedShots: "本次已自动重生 {n} 镜",
    batchRetryTitle: "触发 cameo 自动重生流程, 加强 cw 重画这 {n} 镜",
    retrying: "重生中…",
    batchRetryN: "批量重生 ({n})",
    allShotsPass: "所有镜头已达标",
    weakestFirst: "最弱镜头优先",
    attMax6: "附件最多 6 个",
    attOver10: "{name} 超过 10MB 上限",
    uploadFailedStatus: "上传失败 ({status})",
    sendFailedStatus: "发送失败 ({status})",
    deleteFailed: "删除失败",
    liveSyncOn: "实时同步已开 (Yjs WS)",
    liveSyncConnecting: "正在连接实时同步...",
    liveSyncOff: "WS 已断, 走轮询兜底 — 检查 npm run dev:ws",
    live: "实时",
    offline: "离线",
    commentsN: "{n} 条",
    replyToName: "回复 {name}... ⌘+Enter 发送",
    removeAttachment: "移除附件",
    attCap6: "已达 6 附件上限",
    uploadMediaHint: "上传图片/视频 (≤10MB, 最多 6 个)",
    sendComment: "发送评论",
    hintWriter: "剧本 · 对白",
    hintChar: "人物 · 锁脸",
    hintScene: "场景 · 美术",
    hintBoard: "镜头规划",
    hintDirector: "全局把控",
    hintEditor: "剪辑 · 配乐",
    hintProducer: "审核 · 成片",
  },
  kitUi: {
    toggleTheme: "切换主题",
    switchToLight: "切换到浅色模式",
    switchToDark: "切换到深色模式",
    playFailed: "播放失败",
    musicPreview: "配乐试听",
    musicDefault: "配乐",
    closeEsc: "关闭 (ESC)",
    pause: "暂停",
    play: "播放",
    spacePlayEsc: "SPACE 播放 / 暂停 · ESC 关闭",
    audioLoadFail: "音频加载失败,可能是链接已过期或格式不支持",
    dialogAria: "对话框",
    imagePreview: "图片预览",
    prevImage: "上一张",
    nextImage: "下一张",
    imageLoadFail: "图片加载失败",
    retryLoad: "重试加载",
    stageDirector: "导演分析",
    stageWriter: "编剧创作",
    stageStoryboard: "分镜绘制",
    parallelStages: "并行 {n} 阶段",
    safeTop: "顶部 UI 区",
    safeSide: "互动列",
    safeBottom: "字幕/操作区 · 主体勿入",
    safeBelt: "安全带",
    expandAll: "展开全部",
    collapseAll: "收起全部",
    shotN: "第 {n} 镜",
    sceneDesc: "场景描述",
    dialogue: "对话",
    action: "动作",
    emotionMood: "情绪氛围",
    scriptView: "剧本查看",
    scriptShotCount: "剧本 · {n} 个镜头",
    polishTitle: "打开剧本润色工具, 自动导入本剧本",
    polish: "润色",
    copyFull: "复制全文",
    copied: "已复制",
    copy: "复制",
    downloadTxt: "下载 .txt",
    noShots: "剧本尚未生成具体镜头",
    actN: "第{n}幕",
    beatSheet: "逐秒分镜 Beat Sheet",
    beatSheetPlain: "逐秒分镜",
    scene: "场景",
    characters: "人物",
    emotion: "情绪",
    emotionTemp: " (温度 {n})",
    camera: "镜头",
    lighting: "光影",
    composition: "构图",
    sound: "声音",
    subtext: "潜台词",
    dialogueLabel: "对白",
    synopsis: "梗概",
    genre: "类型",
    visualPrompt: "视觉 Prompt",
    duration: "时长",
    overSizeMb: "超过 {n}MB",
    unsupportedFormat: "格式不支持",
    dropRejected: "已拒绝:{list}",
    localComposeGone: "本地合成视频文件已失效。",
    oldTmpCompose: "这是 v2.18.1 之前的老成片 (写在 /tmp 里, 已被系统清理)。v2.18.1 起新成片写在持久化 data/composed/ 下, 不再消失。",
    fixRerunWorkshop: "解决方案:回创作工坊重跑该项目, 新成片会自动持久化。",
    cdnExpired: "上游 CDN URL 已过期(Minimax 视频通常 24h 后失效)。",
    fixRegenShot: "解决方案:点项目页\"重新生成此镜\"重跑视频环节。",
    emptyComposeUrl: "成片地址为空 — 上游视频 API 全部失败(可能是 quota 不足或网络异常)。",
    fixCheckBilling: "解决方案:去 /dashboard/billing 检查 Minimax / Veo / Kling 余额,补充后重跑。",
    sourceUnreachable: "视频源不可访问。可能是 CORS / 文件不存在 / 网络异常。",
    openVideoNewWindow: "在新窗口中打开视频",
    assetLost: "素材文件已丢失(可能被定时清理删除),需重新生成这一镜",
    assetForbidden: "素材链接已过期或无权访问",
    assetHttp: "素材不可用(HTTP {n})",
    videoLoadNetwork: "视频加载失败:网络不可达",
  },
  readiness: {
    levelNone: "尚未配置引擎 —— 全流程为示意占位(可先逛演示工程)",
    levelScript: "剧本 / 分镜规划 / 节奏审计全真;画面与视频为示意占位",
    levelVisual: "剧本 + 分镜图全真;镜头视频为示意占位",
    levelFilm: "全链真实成片",
    levelMediaOnly: "画面/视频引擎已就绪;剧本走基础模板(配 OPENAI_API_KEY 即全真)",
    stageScript: "剧本创作",
    stageStoryboardPlan: "分镜规划",
    stageAudit: "节奏/麦基审计",
    stageStoryboardImage: "分镜图渲染",
    stageShotVideo: "镜头视频",
    stageTts: "配音",
    stageLipsync: "口型",
    stageAssemble: "剪辑合成",
    engineLlm: "剧本 LLM",
    engineImage: "图像生成",
    engineVideo: "视频生成",
    engineTts: "配音 TTS",
    engineLipsync: "口型渲染",
    hintLlm: "配置 OPENAI_API_KEY(任意 OpenAI 兼容网关)",
    hintImage: "配置 MINIMAX_API_KEY / VIDU_API_KEY 等图像引擎",
    hintVideo: "配置 MINIMAX_API_KEY / VIDU_API_KEY / RUNWAY_API_KEY 等视频引擎",
    hintTts: "配置 TTS 引擎密钥(MiniMax / ElevenLabs 等)",
    hintLipsync: "已零配置可用(本地 2D);配 LIPSYNC_API_URL 可换真引擎",
    storageS3Ok: "S3 已配齐,产物公网可达(抠图参考可喂外部引擎)",
    storageS3Partial: "STORAGE_DRIVER=s3 但 S3_* 未配齐,已降级 local;抠图参考仅本地可用",
    storageLocal: "local 存储:成片/UI 正常;抠图参考图喂外部引擎需配 S3(STORAGE_DRIVER=s3 + S3_*)",
  },
  providerHealth: {
    ok: "正常",
    outOfCredits: "额度用尽",
    authError: "鉴权失败",
    misconfigured: "配置缺失",
    down: "不可达",
    notConfigured: "未配置",
    recharge: "去充值",
    checkKey: "检查 Key",
    addConfig: "补配置",
    checkNetwork: "检查网络/服务",
    optionalSetup: "可选接入",
  },
};

const en: Translations = {
  collab: { notifTitle: 'Notifications', markAllRead: 'Mark all read', justNow: 'just now', mentioned: 'mentioned you', replied: 'replied to you', notifEmpty: 'No notifications', loginPrompt: 'Sign in to see notifications', reply: 'Reply', deleted: '[deleted]', commentPlaceholder: 'Write a comment… @ to mention', commentEmpty: 'No comments yet — be the first', send: 'Send', confirmDelete: 'Delete this comment?', demoMode: 'Demo mode', demoEnginesOff: 'engine(s) not configured', demoPlaceholder: 'generations will use placeholder assets', demoLipsyncReady: 'lip-sync render works out of the box', demoHowToEnable: 'How to enable', demoImage: 'image', demoVideo: 'video', readinessTitle: 'Engine setup', readinessReal: 'real', readinessSim: 'mock' },
  common: {
    create: 'Create',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    download: 'Download',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    viewAll: 'View all',
    backHome: 'Back to Home',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    reset: 'Reset',
  },
  brand: {
    studio: 'AI Comic Studio',
  },
  nav: {
    home: 'Home',
    projects: 'My Projects',
    create: 'Create',
    pricing: 'Pricing',
    profile: 'Profile',
    settings: 'Settings',
    polish: 'Script Polish',
    workbench: 'Workbench',
    cases: 'Showcase',
    userCenter: 'Dashboard',
    newProject: 'New Project',
  },
  auth: {
    brand: 'Wind Comic',
    welcomeBack: 'Welcome back to Wind Comic',
    createAccount: 'Create an account',
    loginSubtitle: 'Sign in to enter the studio',
    registerSubtitle: 'Register to start creating',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    email: 'Email',
    emailPlaceholder: 'Enter email address',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    demoHint: 'Demo account: demo@qfmanju.ai (password from DEMO_PASSWORD)',
    login: 'Sign in',
    register: 'Sign up',
    loginSuccess: 'Signed in',
    registerSuccess: 'Account created',
    actionFailed: 'Something went wrong',
    noAccount: 'No account yet?',
    hasAccount: 'Already have an account?',
    registerNow: 'Sign up',
    loginNow: 'Sign in',
    inviteCode: 'Invite code',
    inviteRequired: '(required for Beta)',
    inviteNotFound: 'Invite code not found',
    inviteUsed: 'This invite code has already been used',
    inviteExpired: 'Invite code expired',
    inviteRevoked: 'Invite code revoked',
    inviteInvalid: 'Invalid invite code format',
    inviteGenericInvalid: 'Invalid invite code',
    inviteValid: 'Invite code valid',
    inviteChecking: 'Checking...',
    inviteValidateFailed: 'Validation failed, try again later',
    noInvite: 'No invite code?',
    applyBeta: 'Request beta access',
    waitlistTitle: 'Request beta access',
    waitlistDesc: 'Leave your email and we will send an invite after review',
    waitlistPurpose: 'Use case (optional)',
    waitlistPurposePlaceholder: 'e.g. serial comics / client ads / learning AI video...',
    waitlistSubmit: 'Join waitlist',
    waitlistSubmitting: 'Submitting...',
    waitlistDefaultOk: 'You are on the waitlist. We will email you after review.',
    waitlistSubmitFailed: 'Submit failed, try again later',
    waitlistNetworkError: 'Network error',
  },
  sidebar: {
    overview: 'Overview',
    myProjects: 'My Projects',
    workshop: 'Workshop',
    shortVideo: 'Storyboard Desk',
    storyIntake: 'Long-form Split',
    series: 'My Series',
    polish: 'Script Polish',
    u2v: 'Image to Video',
    mv: 'MV Beats',
    comic: 'Comic to Video',
    editChat: 'Edit Chat',
    assets: 'Assets',
    characters: 'Characters',
    ipMarket: 'IP Market',
    workflows: 'Workflows',
    masterPrompt: 'MasterPrompt',
    styles: 'Style Gallery',
    cases: 'Inspiration',
    templates: 'Templates',
    account: 'Account',
    team: 'Team',
    health: 'API Health',
    usage: 'Usage & Cost',
    jobs: 'Job Queue',
    billing: 'Billing',
    logout: 'Sign out',
    expand: 'Expand sidebar',
    collapse: 'Collapse sidebar',
    backHome: 'Back to home',
  },
  errors: {
    title: 'Something went wrong',
    description: 'The app hit an unexpected error. We have logged it.',
    retry: 'Retry',
    backHome: 'Back to home',
    pageTitle: 'This page failed',
    unknown: 'An unknown error occurred. Please retry.',
    backWorkbench: 'Back to studio',
    loading: 'Loading',
  },
  dashProjects: {
    eyebrow: 'Library',
    title: 'My Projects',
    subtitle: 'Manage and track your AI short-drama work',
    newCreate: 'New project',
    filterAll: 'All',
    filterActive: 'In progress',
    filterCompleted: 'Completed',
    filterDraft: 'Draft',
    filterArchived: 'Archived',
    emptyAll: 'No projects yet',
    emptyFiltered: 'No projects match this filter',
    emptyHint: 'Enter an idea and the AI team will take it from script to finished film',
    startCreate: 'Start creating',
    importing: 'Importing…',
    importDemo: 'Import demo: Rain Signal',
    importDemoHint: 'No API key needed — 4-shot mystery short with film, audit, and export ready',
    untitled: 'Untitled',
    deleteConfirm: 'Delete “{title}”? This cannot be undone (storyboards, video, and voiceover included).',
    restoreTitle: 'Restore to main list',
    archiveTitle: 'Archive (remove from main list, can restore)',
    deleteTitle: 'Delete project (cannot undo)',
    shotsUnit: 'shots',
    polished: 'Polished',
    polishBtn: 'Polish',
    polishTitle: 'Polish this script in Polish Studio',
    statusCompleted: 'Completed',
    statusActive: 'In progress',
    statusDraft: 'Draft',
    statusArchived: 'Archived',
  },
  dashBanner: {
    title: 'API status alerts',
    itemsUnit: 'items',
    autoFallback: 'The pipeline will fall back to backup engines automatically. To top up, contact an admin or open',
    billingLink: 'Billing',
    dismiss: 'Hide for this session',
    exhausted: 'Out of credits',
    saturated: 'Upstream saturated',
    rateLimited: 'Rate limited',
    authFailed: 'Auth failed',
    modelUnavailable: 'Plan does not include this model',
    kling: 'Kling (video)',
    qingyuntop: 'Qingyuntop (gateway)',
  },
  continueCard: {
    eyebrow: 'Continue',
    statusActive: 'In progress',
    statusDraft: 'Draft',
    statusCompleted: 'Completed',
    draftReadyLabel: 'Back to workshop — ROLL',
    draftReadyHint: 'Script draft is ready; the full pipeline has not run yet',
    draftEmptyLabel: 'Finish setup — ROLL',
    draftEmptyHint: 'Still at the idea stage — about 30 characters is enough to start',
    activeLabel: 'View generation progress',
    activeHint: 'Pipeline is running; check Job Queue for stage detail',
    completedLabel: 'Watch · audit · export',
    completedHint: 'Try pacing audit and EDL/AAF export; weak shots can be 4K re-rendered',
    openLabel: 'Open project',
    openHint: 'Pick up where you left off',
  },
  product: {
    director: 'Director', writer: 'Writer', characterDesign: 'Character Design', sceneDesign: 'Scene Design',
    storyboard: 'Storyboard', videoGen: 'Video', editor: 'Editor', producer: 'Producer',
    untitled: 'Untitled project', creating: 'In production', collapseChat: 'Collapse chat', expandChat: 'Expand chat',
    timeline: 'Timeline', shotsUnit: 'shots', generating: 'Generating...', pending: 'Pending', shotN: 'Shot {n}',
    tabDirector: 'Director', tabScript: 'Script', tabCharacters: 'Cast', tabScenes: 'Scenes', tabStoryboard: 'Boards',
    tabContinuity: 'Continuity', tabVideos: 'Video', tabWorkshop: 'Shot Workshop', tabTimeline: 'Cinema Timeline',
    tabPacing: 'Pacing', tabPullsheet: 'Pull sheet', tabVision: 'QC', tabOneclick: 'One-click film',
    tabMonitor: 'Monitor', tabParam: 'Params', tabComments: 'Comments', tabDistribution: 'Distribute', tabPlay: 'Play',
    groupCreate: 'Create', groupRefine: 'Refine', groupReview: 'Review', groupDeliver: 'Deliver',
    statShots: 'Shots', statCast: 'Cast', statScore: 'Score', statStatus: 'Status', statusDone: 'Done', statusMaking: 'In progress',
    emptyCharacters: 'No characters yet', emptyScenes: 'No scenes yet', emptyVideos: 'No shot videos yet',
    saved: 'Project auto-saved', undone: 'Undone', nothingToUndo: 'Nothing to undo',
    hotkeys: 'Shortcuts', hotkeysDesc: 'Ctrl/⌘+S save · Ctrl/⌘+Z undo · Space play · ? help',
    videoPreview: 'Video preview', openNewWindow: 'Open in new window', close: 'Close', videoLoadFail: 'Video failed to load',
    dropUploading: 'Uploading...', dropFailed: 'Upload failed', dropRetry: 'Upload failed, try again',
    dropHint: 'Drop files here, or click to choose', dropHintSub: 'Images and video, max 50MB', dropHere: 'Release to upload...',
    phasePlan: 'Directing', phaseScript: 'Writing', phaseCharacters: 'Characters', phaseScenes: 'Scenes',
    phaseStoryboardPlans: 'Board plan', phaseStoryboards: 'Rendering boards', phaseVideo: 'Generating video',
    phasePacing: 'Pacing audit', phaseEdit: 'Edit & mux', phaseReview: 'Director review', phaseComplete: 'Done',
  },
  create: {
    badge: 'AI Creation Studio',
    title: 'Start Your Creative Journey',
    subtitle: 'Describe your story idea, and our AI team will create a complete comic drama for you',
    ideaLabel: 'Story Idea',
    ideaPlaceholder: 'e.g., A love story about a time traveler...',
    videoProviderLabel: 'Video Generation Engine',
    startButton: 'Start Creating',
  },
  projects: {
    title: 'My Projects',
    subtitle: 'Manage all your AI comic drama creations',
    searchPlaceholder: 'Search project title or description...',
    filterAll: 'All',
    filterCompleted: 'Completed',
    filterCreating: 'Creating',
    filterFailed: 'Failed',
    noResults: 'No matching projects found',
    createNew: 'Create New Project',
    shotsUnit: 'shots',
  },
  dashboard: {
    systemOnline: 'System Online',
    title: 'Creation Overview',
    subtitle: 'Multi-agent AI engine — an end-to-end comic production line from idea to finished film',
    quickStartTitle: 'Start Creating',
    quickStartSubtitle: 'Enter an idea and a 7-agent AI team creates it for you',
    statProjects: 'My Projects',
    statProjectsSub: 'Comic projects in progress',
    statGenerations: 'Generations',
    statGenerationsSub: 'Total AI generation calls',
    statCases: 'Showcase',
    statCasesSub: 'Reference template cases',
    recentCreations: 'Recent Creations',
    noRecords: 'No creations yet',
    startFirst: 'Start your first creation →',
    systemStatus: 'System Status',
    recentActivity: 'Recent Activity',
    statusCompleted: 'Completed',
    statusCreating: 'Creating',
    statusDraft: 'Draft',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your app preferences and account settings',
    general: 'General',
    generalDesc: 'Language and region preferences',
    language: 'Language',
    appearance: 'Appearance',
    appearanceDesc: 'Customize the interface theme',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeAuto: 'System',
    notifications: 'Notifications',
    notificationsDesc: 'Manage notification preferences',
    projectDone: 'Project completion alerts',
    projectDoneDesc: 'Get notified when a project finishes',
    performance: 'Performance',
    performanceDesc: 'Optimize app performance',
    videoQuality: 'Video Quality',
    qualityHigh: 'High',
    qualityMedium: 'Medium',
    qualityLow: 'Low (save data)',
    privacy: 'Privacy & Security',
    privacyDesc: 'Protect your account',
    changePassword: 'Change Password',
    enable2fa: 'Enable 2FA',
    manageDevices: 'Manage logged-in devices',
    billing: 'Billing & Subscription',
    billingDesc: 'Manage your subscription plan',
    freePlan: 'Free Plan',
    currentPlan: 'Current plan',
    freeQuota: '10 projects per month',
    upgradePro: 'Upgrade to Pro',
    saved: 'Settings saved',
    savedDesc: 'Your preferences have been updated',
    resetDone: 'Settings reset',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage your personal info and preferences',
    avatar: 'Avatar',
    uploadAvatar: 'Upload Avatar',
    basicInfo: 'Basic Info',
    basicInfoDesc: 'Update your profile',
    username: 'Username',
    email: 'Email',
    bio: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
    stats: 'Creation Stats',
    totalProjects: 'Total Projects',
    inProgress: 'In Progress',
    totalShots: 'Total Shots',
    saveSuccess: 'Saved',
    saveSuccessDesc: 'Profile updated',
    role: 'Role',
    accountPrefs: 'Account and preferences',
    visualPref: 'Visual Preferences',
    collabSpace: 'Collaboration Space',
  },
  billing: {
    title: 'Subscription',
    currentTier: 'Current plan: ',
    paymentNote: 'Payments via Stripe Checkout; cancel or change card via the Stripe Customer Portal',
    recommended: 'Recommended',
    currentBadge: 'Current',
    contactUs: 'Contact Us',
    perMonth: '/mo',
    alreadyThis: 'Current plan',
    freeNoPurchase: 'Free · no purchase',
    businessTalk: 'Contact Sales',
    upgradeTo: 'Upgrade to',
    portalNote: 'Upgrade, downgrade, cancel, or change payment in the Stripe Customer Portal; self-hosting requires STRIPE_PORTAL_LINK.',
    openPortal: 'Open Stripe Customer Portal',
    checkoutFailed: 'Checkout failed',
    paymentCanceled: 'Payment canceled',
    upgradedPrefix: 'Upgraded to',
    upgradedSuffix: '! Subscription active',
  },
  cases: {
    title: 'Showcase',
    titlePublic: 'Featured Cases',
    subtitle: 'From QingFeng partners and creators',
    subtitleReuse: 'From QingFeng partners and creators · click to reuse the idea',
    copyPrompt: 'Copy Prompt',
    copied: 'Copied',
    usePrompt: 'Use This',
  },
  home: {
    heroTagline1: '/ The AI short-drama production console — beyond generation',
    heroTagline2: 'Pacing audits · quality gates · character-lock consistency · AAF/EDL into your NLE · team workflow — turning "it generates" into "it ships".',
    heroEngines: 'Generation layer · plug in today\'s strongest engines (BYO key)',
    heroCtaCreate: 'Start Creating →',
    heroCtaCases: 'View Work',
    featureTitle: 'Direct the pacing like a filmmaker',
    featureSubtitle: 'Visual, collaborative workflow across script, storyboard, animation and sound.',
    agentsTitle: 'An AI animation agent team',
    agentsSubtitle: 'Every role collaborating in real time.',
    lensCaption: 'Lens box: customize camera movement, focal length and angle',
    lensTitle: 'Cinematic language, unified to every frame',
    lensDesc: 'Consistent style, color and camera-movement rules.',
    frameTitle: 'Storyboards generated fast by AI',
    frameSubtitle: 'From a single sentence to an editable multi-shot sequence.',
    frameSteps: [
      { title: 'Script structure', desc: 'Smartly parse story pacing' },
      { title: 'Shot breakdown', desc: 'Auto-generate multi-shot storyboards' },
      { title: 'Character setup', desc: 'Keep characters and style consistent' },
    ],
    frameCta: 'Generate Storyboard',
    vibeKicker: 'Mood board: live visual and audio updates',
    vibeTitle: 'Preview mood and rhythm in real time',
    vibeDesc: 'Visuals, camera and score drive the emotion together.',
    casesTitle: 'Featured Cases',
    casesSubtitle: 'From QingFeng partners and creators.',
    casesTryNow: 'Try Now',
    ctaTitle: 'Turn your story into animation',
    ctaDesc: 'Start your first AI comic drama now',
    ctaButton: 'Enter Workbench',
  },
  pricing: {
    enterWorkbench: 'Enter Workbench',
    badge: 'Pricing',
    titleLead: 'Choose the ',
    titleHighlight: 'plan that fits you',
    subtitle: 'From free trials to enterprise self-hosting, QingFeng offers every creator the right AI comic-production plan.',
    custom: 'Custom',
    customNote: 'Quote on request, contact sales',
    free: 'Free',
    startUsing: 'Get Started',
    apiAccess: 'API access',
    commercialLicense: 'Commercial license',
    footnote: 'All plans include 24/7 AI engine support · effective immediately after payment · cancel anytime',
    faqTitle: 'FAQ',
    faq: [
      { q: 'What are the limits of the Free plan?', a: 'The Free plan allows 3 projects per month, up to 5 characters in the library, 720p video export, and includes a QingFeng watermark. Best for individual trials.' },
      { q: 'Can I use new features right after upgrading?', a: 'Yes. Once payment succeeds, the corresponding plan benefits activate immediately — no review wait.' },
      { q: 'Can I use generated content commercially?', a: "Copyright of generated assets belongs to the underlying engines (Kling, MiniMax, etc.). Whether you may use them commercially depends on each engine's terms of service — please verify them yourself. QingFeng only provides multi-agent orchestration and post-production tooling; it does not grant or guarantee commercial rights over generated content." },
      { q: 'How does Enterprise differ from Pro?', a: 'Enterprise supports self-hosting — deploying the full AI system on your own private servers — plus custom AI-agent development, SLA guarantees, and a dedicated customer success manager.' },
      { q: 'Can I cancel my subscription anytime?', a: 'Yes. You can cancel anytime in account settings. After canceling, you keep full access until the end of the current billing cycle.' },
    ],
    moreTitle: 'Still have questions?',
    moreDesc: 'Our team is always here to help',
    contactSupport: 'Contact Support',
    alertPayment: 'Payments are not yet integrated — this is currently free / self-hosted.',
  },
  help: {
    examples: 'Examples',
    title: 'Help Center',
    subtitle: 'Find the answers you need and get started with AI comic creation',
    searchPlaceholder: 'Search help docs...',
    quickGuides: 'Quick Guides',
    guides: [
      { title: 'Quick Start', description: 'Create your first AI comic drama in 5 minutes' },
      { title: 'Creation Guide', description: 'Master the techniques and best practices of AI comic creation' },
      { title: 'Community Tutorials', description: 'Tips shared by the creator community' },
    ],
    faqTitle: 'FAQ',
    faqs: [
      { q: 'How do I start my first project?', a: 'Click "Start Creating", enter your story idea, pick a video engine, and the AI generates a complete comic drama for you.' },
      { q: 'Which video engines are supported?', a: 'We support Minimax, Vidu and Kling AI, among others — pick the engine that best fits your needs.' },
      { q: 'How long does it take to generate a project?', a: 'Usually 5–15 minutes, depending on project complexity and the chosen video engine.' },
      { q: 'Can I edit AI-generated content?', a: 'Yes — you can edit the script, adjust character designs and revise the storyboard, staying fully in control.' },
      { q: 'Can I use the work commercially?', a: 'Pro and Enterprise users can use their work commercially. The Free plan is for personal learning only.' },
      { q: 'How do I export my work?', a: 'On the project detail page, click "Download" to export video, images, script and all assets.' },
    ],
    moreTitle: 'Still have questions?',
    moreDesc: 'Our support team is always ready to help',
    sendEmail: 'Send Email',
    liveChat: 'Live Chat',
  },
  examples: {
    title: 'Featured Work',
    subtitle: 'Explore stunning comic dramas created by AI',
    ctaTitle: 'Ready to create your own?',
    ctaDesc: 'Join thousands of creators and start your AI comic journey',
    ctaButton: 'Start Creating Now',
  },

    visionAudit: {
      verdictExcellent: "Excellent",
      verdictGood: "Good",
      verdictNeedsWork: "Needs Work",
      verdictPoor: "Poor",
      noDataMessage: "No quality check data yet. After generating the final video, each shot will be AI-scored on how well it matches the script.",
      panelTitle: "Quality Check · Visual vs Script",
      avgScore: "Avg Score",
      shotUnit: "Shot",
      passLabel: "Pass",
      warnLabel: "Warn",
      failLabel: "Off-script",
      weakestShotsTitle: "Priority shots (needs attention):",
      rebirthPlanPrefix: "Rebirth Plan · ",
      rebirthPlanSuffix: " weak shots suggested for reshoot",
      reshootButton: "Go to Workshop for Reshoot",
      dimScene: "Scene",
      dimAction: "Action",
      dimMood: "Mood",
      dimComposition: "Comp",
    },
    usagePage: {
      eyebrow: "Usage & Cost",
      headline: "Cost Observability",
      budgetLabel: "Monthly Budget ¥",
      budgetPlaceholder: "Unlimited",
      nearDays: "Last",
      daySuffix: "days",
      daysCostSuffix: "day spend",
      refreshTitle: "Refresh",
      loading: "Loading…",
      loadFailed: "Failed to load",
      activeAlertsBanner: "Active quota alerts · Last 1 hour",
      goBilling: "Go to billing",
      statusOk: "Budget healthy",
      statusWarn: "Near limit",
      statusOver: "Over budget",
      statusNone: "No limit set",
      alertExhausted: "Quota exhausted",
      alertSaturated: "Upstream saturated",
      alertRateLimited: "Rate limited",
      alertAuthFailed: "Auth failed",
      alertModelUnavailable: "Model unavailable",
      thisMonthBudget: "This month's budget",
      quotaTitle: "Monthly quota",
      quotaUnlimited: "Unlimited",
      quotaExceeded: "Over plan ceiling — top up or switch to an economy engine",
      quotaNearLimit: "Near plan ceiling",
      quotaOfCeiling: "plan ceiling",
      projectedEndPrefix: "Projected month-end",
      noCapSuffix: " · No cap set",
      statGenerations: "Generations",
      statEngines: "Engines",
      engineCostPrefix: "Engine spend · Last",
      engineNoData: "No cost records in this window.",
      dailyTrendTitle: "Daily cost trend",
      dailyNoData: "No daily data available.",
      countSuffix: "calls",
    },
    healthPage: {
      title: "API Health",
      subtitle: "Real-time status of models / gateways · spot quota issues and outages at a glance",
      refreshBtn: "Re-probe",
      loadFailed: "Probe failed",
      kindLlm: "LLM",
      kindTts: "TTS",
      kindVideo: "Video",
      kindImage: "Image",
      kindGateway: "Gateway",
      overallHealthy: "All Healthy",
      overallWarning: "Warning",
      overallCritical: "Outage / Overdue",
      balanceUsed: "Used",
      balanceAbundant: "Quota ample (prepaid)",
      balanceRemaining: "Remaining",
      balanceLimit: "Limit",
      radarTitle: "Model Radar",
      radarDesc: "Scan each API for the latest models · upgrade within same family only · 1-token live test for LLMs · rollback preserved · no restart needed",
      scanBtn: "Scan Latest Models",
      upgradeBtn: "Upgrade to Latest",
      statusUpgradable: "Upgradable",
      statusUpToDate: "Up to date",
      statusFamilyN: "· {n} in family",
      statusSourceUnavail: "Source unavailable",
      overridesTitle: "Active overrides (rollback available):",
      rollbackBtn: "Rollback",
      rollbackDefault: "(restore code default)",
      checkedAt: "Probed at",
      cachedNote: "· Cached result (click \"Re-probe\" to force refresh)",
      footer: "· Dashboard is read-only for quotas; no API keys stored or transmitted.",
      scanFailed: "Scan failed",
      upgradeFailed: "Upgrade failed",
      upgradeFailedLogin: "Upgrade failed (login required)",
      upgradeNone: "No upgrades available",
      upgradedSummary: "Upgraded {n} item(s): {list}{skipped} — applied without restart",
      upgradeSkippedNote: " ({n} skipped: live test failed, keeping original)",
      upgradeSomeSkipped: "{n} candidate(s) failed live test, keeping current config",
      rolledBack: "{envKey} rolled back",
    },
    seriesDetail: {
      statusDraft: "Pending",
      statusActive: "Generating",
      statusCompleted: "Completed",
      statusFailed: "Failed · Retry",
      backLink: "Back",
      pageTitle: "Series · Batch Generate",
      statTotal: "{n} episodes total",
      statCompleted: "Completed {n}",
      statGenerating: "Generating {n}",
      statFailed: "Failed {n}",
      statPending: "Pending {n}",
      batchGenerateBtn: "Batch Generate",
      batchGeneratePendingHint: "({n} pending)",
      regenerateAll: "Regenerate All",
      seasonAssetsTitle: "Season Assets",
      seasonCoverAlt: "Season Cover",
      genCoverBtn: "Generate Cover",
      regenCoverBtn: "Regenerate Cover",
      exportSeasonBtn: "Export Full Season",
      reexportSeasonBtn: "Re-export Full Season",
      exportFirstEpisodeHint: "Generate at least one episode first",
      watchSeasonVideo: "Watch Full Season",
      seasonVideoDesc: "Compilation = finished episodes concatenated in order (normalized aspect ratio + re-encoded).",
      seasonFixBusyLabel: "⏳ Fixing season…",
      seasonFixLabel: "⚡ Fix downgraded shots ({n} episode(s) affected)",
      seasonFixProgressMsg: "Fixing episode {episode} ({current}/{total})…",
      seasonFixDoneMsg: "Season fix done ({n} episodes), re-checking…",
      resumeStuckBtn: "🛟 Resume stuck episodes (no progress in 30 min → reset to pending)",
      loading: "Loading…",
      noEpisodes: "No episodes in this series",
      episodeLabel: "Ep.{n}",
      healthCheckAllGreen: "All checks passed",
      shotsDowngradedLabel: "{n} shots downgraded",
      openEpisodeLink: "Open →",
      loadFailStatus: "Load failed {status}, please refresh",
      loadFailNetwork: "Load failed, please check your network and refresh",
      requestFailed: "Request failed",
      exportingSeasonMsg: "Exporting full season (downloading episodes + concatenating & re-encoding, up to ~5 min, don't close the page)…",
      exportCanceledMsg: "Export canceled — fix downgraded shots first, then re-export",
      exportFailedStatus: "Export failed {status}",
      exportDoneMsg: "Full season exported ({n} episodes)",
      coverGeneratingMsg: "Generating season cover…",
      coverFailedStatus: "Cover generation failed {status}",
      coverDoneMsg: "Season cover generated",
      resumeCheckedMsg: "Checked",
      resumeFailedMsg: "Resume request failed",
      resumeFailStatus: "Failed {status}",
      batchQueuedMsg: "Queued {n} episodes for batch generation (persistent queue, processing one by one…)",
      batchStartedMsg: "Started batch generation for {n} episodes (concurrency {concurrency}, processing…)",
      noPendingEpisodes: "No episodes pending generation",
      healthGateIssuePrefix: "Problem episodes: ",
      healthGateEpisodeDetail: "Ep.{ep} ({shots} shots downgraded)",
      healthGateConfirmHint: "Still export? (Recommended: fix downgraded shots first)",
      dramaPackageBtn: "📦 Export Package",
      dramaPackageFetching: "Fetching package…",
      dramaPackageTitle: "Drama Package · TikTok Drama Center",
      dramaPackageDownload: "Download JSON",
      dramaPackageCoverAlt: "Series cover",
      dramaPackageLangEpisodes: "Language: {lang} · {n} episodes",
      dramaPackageTotalMin: "Total: {n} min",
      dramaPackageEpFree: "Free",
      dramaPackageEpCoins: "{coins} coins",
      dramaPackageGuideTitle: "Upload steps",
      dramaPackageErrPrefix: "Fetch failed: ",
      dramaPackageNetworkErr: "Network error",
      dramaPackageViewVideo: "View video",
      dramaPackageAiDeclaration: "I confirm this film is AI-generated / synthetic media; the declaration ships with the package",
      dramaPackageAiRequiredHint: "Please confirm the AI declaration first",
    },
  workshop: {
    poeticMist: "Poetic Mist",
    poeticMistDesc: "Hazy mood",
    neoNoir: "Neo Noir",
    neoNoirDesc: "Dark suspense",
    inkWash: "Ink Wash",
    inkWashDesc: "Eastern xieyi",
    dreamwave: "Dreamwave",
    dreamwaveDesc: "Psychedelic dream",
    cyberNeon: "Cyber Neon",
    cyberNeonDesc: "Future sci-fi",
    anime3d: "Anime 3D",
    anime3dDesc: "Donghua look",
    cinematic: "Cinematic",
    cinematicDesc: "Theatrical grade",
    ghibli: "Ghibli",
    ghibliDesc: "Warm healing",
    americanComic: "American Comic",
    americanComicDesc: "US superhero comic",
    mihoyoGame: "Game Anime (miHoYo)",
    mihoyoGameDesc: "Game CG anime",
    wushanInk: "Ink-Wash Action",
    wushanInkDesc: "Ink-splash action",
    haitangEthereal: "Ethereal Donghua",
    haitangEtherealDesc: "Ethereal donghua",
    ideaCyberpunkTitle: "Cyberpunk detective",
    ideaCyberpunkContent: "Neo-Tokyo, 2077. A cyber detective takes a mysterious case of serial disappearances — and finds a conspiracy underneath.",
    ideaPalaceTitle: "Imperial court",
    ideaPalaceContent: "High Tang. A gifted woman enters the palace, outmaneuvers the inner court, and becomes the one who shapes policy.",
    ideaWastelandTitle: "Wasteland",
    ideaWastelandContent: "After the nuclear war, survivors hunt for hope in the ruins. A mysterious signal points them to a legendary shelter.",
    ideaMagicTitle: "Magic academy",
    ideaMagicContent: "A first-year discovers a rare gift — and is pulled into an ancient war of magic.",
    urlExtractFailed: "Auto-extract failed, please enter manually",
    invalidInput: "Invalid input",
    draftAdopted: "Adopted draft #{id}, starting full pipeline",
    chatReceivedIdea: "Got your idea: “{idea}”\n\nWriting script, characters, and boards...",
    createFailed: "Creation failed",
    streamReadFailed: "Could not read response stream",
    currentImage: "Current image",
    assetSceneN: "Scene {n}",
    chatPlanReady: "Director planned: {genre} look, {chars} characters, {scenes} scenes.",
    chatScriptDone: "Script “{title}” is ready!\n\n{synopsis}\n\n{n} shots.",
    chatCharsDone: "{n} character designs ready!",
    chatScenesDone: "{n} scene concepts ready!",
    chatBoardsPlanned: "{n} board descriptions planned, rendering boards...",
    assetSketchN: "Shot {n} sketch",
    chatBoardsDone: "{n} boards rendered! Cast/scene/look consistency locked ✅",
    assetVideoN: "Video {n}",
    chatVideosDone: "{n} video clips ready! Ask for a shot number and duration to regenerate.",
    chatContinuityIssues: "Continuity sheet: {n} issues — {list}{more}",
    chatContinuityMore: " and {n} more",
    chatEditDone: "Edit done! {n} shots, {sec}s total ✂️",
    chatReviewDone: "Review done! Score: {score}/100 {emoji}\n\n{summary}\n\n{items}{pass}",
    chatReviewItems: "Found {n} suggestions.",
    chatReviewNone: "Nothing to improve.",
    chatReviewPass: "\n\n✅ Review passed!",
    chatReviewFail: "\n\n⚠️ Did not pass, auto-optimizing...",
    chatComplete: "Pipeline finished! All assets saved.\n\nOpen My Assets for confirmed assets, or keep chatting with agents to adjust.",
    stepFailed: "Step failed",
    stageLabel: "stage:{stage}",
    retryShot: "Retry shot {n}",
    createError: "Creation error",
    retryCurrentStep: "Restart current step",
    previewSeeded: "Reused test-shot as shot 1 first frame, starting full pipeline",
    slateNotes: "From one idea to a full short — set copy, cast, look, and duration, then ROLL",
    createModeAria: "Creation mode",
    modeSimple: "Simple",
    modePro: "Pro",
    previewShot: "Test shot ×1",
    previewShotTitle: "1 image + 5s video, 30–60s, no full pipeline",
    needTenChars: "Enter at least 10 characters",
    enterWorkshop: "Enter workshop",
    rollReady: "ROLL",
    awaitingIdea: "Awaiting idea",
    noInspiration: "No idea? Build a director-grade prompt →",
    noInspirationTitle: "Director-grade prompts · film look / LUT / camera presets · glossary",
    act1: "ACT 1 · Idea + setup",
    act2: "ACT 2 · Shot specs",
    act3: "ACT 3 · Inspiration",
    urlPlaceholder: "Paste a product/brand URL to extract an idea",
    extracting: "Extracting…",
    extract: "Extract",
    scriptEyebrow: "Script · Idea / screenplay",
    ideaPlaceholder: "Two ways to start:\n1. Short idea: a traveler in a dusk city, neon rain...\n2. Full script: paste scenes, dialogue, and action lines",
    templateNeedIdea: "Enter at least 10 characters before saving a template",
    templateNamePrompt: "Name this template (≤40 chars)",
    templateNameDefault: "My template",
    templateDesc: "Custom template · {style} · {duration} · {aspect}",
    customTemplateHint: "Custom template from the current idea; no preset structure — Director/Writer follow the idea",
    templateSaveFailed: "Save failed: {error}",
    templateSaved: "Saved template “{name}”. Pick it next time you create.",
    lookEyebrow: "Look · Style presets",
    durationEyebrow: "Duration · Shot length",
    aspectEyebrow: "Aspect · Frame",
    engineEyebrow: "Engine · Video engine",
    klingLabel: "Kling AI",
    klingSub: "Official API · connected",
    editStyleTitle: "Edit style · one-line pacing",
    editStyleDefault: "Default mid-tempo",
    editStyleFast: "⚡ Fast & punchy",
    editStyleSlow: "🌙 Slow & lyrical",
    editStylePlaceholder: "Or custom: “beat-cut shorts” “Wong Kar-wai pauses” (needs LLM key)",
    scriptLanguageLabel: "Script language · dialogue / VO / TTS",
    sketchLockTitle: "Storyboard sketch lock",
    sketchLockBadge: "(experimental · more controllable framing)",
    sketchLockDesc: "Each shot gets a B/W framing sketch first, then boards lock to that framing/camera — closer to the designed lens language; cost: +1 image per shot. Sketches are saved and can be viewed/replaced per shot in Shot Workshop.",
    styleApplied: "Applied style: {style}",
    draftsEyebrow: "Drafts · Compare",
    draftDirect: "Direct ×1",
    draftCompare: "Compare ×{n}",
    draftDirectTitle: "Generate 1 script directly",
    draftCompareTitle: "Generate {n} versions, then pick one",
    draftCompareHint: "↑ After ROLL, compare {n} drafts first (+30–60s)",
    readoutEyebrow: "Readout · Setup preview",
    previewEyebrow: "Live Preview",
    inspirationEyebrow: "Inspiration",
    modeEpisodic: "Episodic Series",
    modeEpisodicDesc: "Multi-episode narrative with locked cast and world",
    modeEpisodicF1: "Cross-episode cast lock",
    modeEpisodicF2: "World lock",
    modeEpisodicF3: "3–20 episode batch",
    modeEpisodicEst: "12–20 min per episode",
    modeEpisodicFor: "Series / serialized shorts",
    modeMv: "Music Video",
    modeMvDesc: "Beat-driven picture, lyrics locked to the cut",
    modeMvF1: "Lyric cards on screen",
    modeMvF2: "Beat-synced cuts",
    modeMvF3: "Mood-matched palette",
    modeMvEst: "3–5 min to film",
    modeMvFor: "Original MV / fan edits",
    modeQuick: "Quick 60s",
    modeQuickDesc: "One line in, 60-second short out",
    modeQuickF1: "One-tap generate",
    modeQuickF2: "Auto cover",
    modeQuickF3: "Vertical 9:16",
    modeQuickEst: "3–8 min to film",
    modeQuickFor: "Daily shorts / trend follow",
    modeComic: "Comic → Video",
    modeComicDesc: "Upload still comic/boards, convert to motion video",
    modeComicF1: "OCR speech bubbles",
    modeComicF2: "Camera-move generate",
    modeComicF3: "Auto VO match",
    modeComicEst: "10–25 min",
    modeComicFor: "Comic motion / picture-book adapt",
    modeIp: "IP Derivative",
    modeIpDesc: "Second-create from an existing character or IP",
    modeIpF1: "Cast memory reuse",
    modeIpF2: "Style lock",
    modeIpF3: "Multi-scene batch",
    modeIpEst: "8–15 min",
    modeIpFor: "Fan works / IP expand",
    resolutionTitle: "Resolution",
    resolutionHint: "Create max 720P · per-shot 4K re-render after film (Kling Master · plan-gated)",
    tier360Desc: "Draft tier, fast board checks",
    tier480Desc: "Standard tier, social-ready",
    tierRecommended: "Recommended",
    tier720Desc: "HD tier, for the finished film",
    estimated: "Est.",
    aspectTitle: "Aspect ratio",
    aspectLocked: "This mode locks the ratio",
    aspectLandscape: "Landscape 16:9",
    aspectPortrait: "Portrait 9:16",
    aspectSquare: "Square 1:1",
    styleTabAll: "All",
    styleTabPopular: "Popular",
    styleTabRealistic: "Realistic",
    styleTabAnime: "Anime",
    styleTabArtistic: "Art",
    styleTabRetro: "Retro",
    styleTabExperimental: "Experimental",
    styleSearch: "Search styles...",
    styleEmpty: "No matching styles",
    styleClear: "Clear selection",
    selectStyle: "Select style {name}",
    engineSeedance: "Jimeng 2.0",
    wizardStepMode: "Creation mode",
    wizardStepModeDesc: "Pick the kind of content you want",
    wizardStepStyle: "Visual style",
    wizardStepStyleDesc: "Choose from 60 presets",
    wizardStepAssets: "Reuse assets",
    wizardStepAssetsDesc: "Pick existing cast / scenes / props from memory",
    wizardStepDetails: "Details",
    wizardStepDetailsDesc: "Prompt + resolution + duration",
    wizardStepReview: "Review & submit",
    wizardStepReviewDesc: "Preview and start generate",
    wizardPrev: "Back",
    wizardNext: "Next",
    wizardSubmitting: "Submitting...",
    wizardLaunch: "Start generate",
    wizardTitleLabel: "Project title",
    wizardTitlePlaceholder: "e.g. Bright Eyes · short ep. 1",
    wizardPromptLabel: "Creation prompt",
    wizardPromptPlaceholder: "Describe the picture or story. e.g. A misty old town at dawn, a girl in hanfu walking the stone path with a qin...",
    wizardPromptHint: "{n} chars · at least 5",
    wizardDurationLabel: "Shot duration (sec)",
    wizardUnset: "(not set)",
    wizardUnfilled: "(empty)",
    wizardStylePreset: "Style preset",
    wizardGlobalAssets: "Global assets",
    wizardAssetsPicked: "Picked {n}",
    wizardNonePicked: "None",
    wizardResAspect: "Resolution / ratio",
    wizardDurationShort: "Shot duration",
    wizardPromptPreview: "Final prompt preview",
    wizardEmpty: "(empty)",
  },
  workshopCreate: {
    searchPlaceholder: "Search templates / tags / category",
    cloneNameSuffix: "{name} (copy)",
    cloneFailed: "Template clone failed",
    deletePersonalConfirm: "Delete personal template \"{name}\"?",
    importInvalidSchema: "Not a Wind Comic template JSON. Use a file from the Export button.",
    importMissingName: "JSON is missing a name field; cannot import",
    importNameSuffix: "{name} (imported)",
    importFailed: "Import failed ({status})",
    importSuccess: "Imported: {name}",
    importParseFailed: "JSON parse failed",
    importParseFailedWith: "JSON parse failed: {message}",
    shareLinkFailed: "Failed to create share link",
    shareExpiresOn: "This link expires on {date}",
    shareForever: "Never expires",
    shareCopied: "Share link copied to clipboard:\n{url}\n\nAnyone who opens it can view this template and clone it into their library.{expiry}",
    shareManual: "Share link (copy manually):\n{url}{expiry}",
    templateLibraryTitle: "Genre · Story templates",
    templateCounts: "{builtin} built-in · {personal} personal · showing {visible}",
    filterByTags: "Filter by tags",
    filter: "Filter",
    filterAndHint: "FILTER · pick 1 or more (AND)",
    clearFilters: "Clear filters",
    sort: "Sort",
    sortDefault: "Default order",
    sortPersonalFirst: "Personal first",
    sortBuiltinFirst: "Built-in first",
    saveAsTemplateHint: "Save the current style + idea + shot settings as a personal template",
    saveAsTemplate: "Save as template",
    importJsonHint: "Import a template from JSON (offline share, no link needed)",
    importJson: "Import JSON",
    noMatchingTemplates: "No matching templates.",
    tryClearSearch: " Try clearing search",
    tryClearFilter: "/filters",
    expandDetails: "Expand details",
    details: "Details",
    cloneAsMine: "Clone as my template",
    clone: "Clone",
    saveToMyLibrary: "Save to my library",
    shareHint: "Create a public share link so others can view and clone this template",
    linkExpiry: "Link expiry",
    expiry1Day: "1 day",
    expiry7Days: "7 days (recommended)",
    expiry30Days: "30 days",
    expiryForever: "Forever ♾️",
    expiryNote: "Expired links stop working; clones already made are unaffected",
    exportJsonHint: "Export as JSON (share with the team / backup)",
    loadingPersonal: "Loading personal templates…",
    cameoLockTitle: "CAMEO LOCK · Face lock",
    cameoLockHeading: "Face lock",
    cameoLockOptional: "(optional · up to 3)",
    cameoLockHint: "After upload, this face is locked in every shot",
    cameoLockHintShort: "UP TO 3 · film-wide face lock",
    pickFromLibrary: "Pull from character library",
    loadingLibrary: "Loading character library…",
    libraryEmpty: "Library is empty — save a character in Character Workshop, or add one after a film, then pull it here in one tap",
    pickNamed: "Pull in “{name}”",
    slotsFull: "All 3 slots are full — clear one first",
    roleLead: "Lead",
    roleAntagonist: "Antagonist",
    roleSupporting: "Supporting",
    roleCameo: "Cameo",
    reusedSimilar: "Reused the look of similar library character “{name}”",
    reusedBible: "Reused the archive for “{name}”",
    traitsLowConfidence: "Auto-detect confidence is low — you can adjust manually",
    imageOnly: "Images only",
    imageTooLarge: "Image too large (10MB max)",
    urlMustHttp: "URL must start with http:// or https://",
    urlFetchFailed: "Failed to fetch URL",
    bibleFound: "Found “{name}”",
    bibleUsedIn: "Used in {n} past projects",
    reuseOnce: "Reuse",
    similarHint: "Similar characters in your library — reuse to keep series consistent",
    similarity: "{n}% similar",
    hasDna: " · has DNA",
    reuseLook: "Reuse look",
    characterAlt: "Character {slot}",
    characterNamePlaceholder: "Name (e.g. Li Changan)",
    characterNameAria: "Character name",
    characterRoleAria: "Character role",
    uploadFile: "Upload file",
    useUrl: "Use URL",
    clear: "Clear",
    fetchUrl: "Fetch",
    extractingTraits: "AI is extracting a character dossier from this face...",
    genderMale: "Male",
    genderFemale: "Female",
    aiTraits: "AI dossier",
    lowConfidence: "Low confidence",
    previewQuotaDone: "Today's preview quota is used up",
    requestFailed: "Request failed ({status})",
    previewFailed: "Preview failed",
    deletePreviewConfirm: "Delete this preview record?",
    previewTitle: "Preview · 1-shot end-to-end",
    quotaChipTitle: "{tier} tier: {limit} per day",
    toggleHistory: "Show/hide preview history",
    history: "History",
    quotaRefreshBefore: "Quota resets at 00:00 UTC, or",
    upgradeAccount: "upgrade your plan",
    quotaRefreshAfter: "for a higher limit.",
    historyHeading: "HISTORY · your previous previews ({n})",
    refresh: "Refresh",
    noHistory: "No history yet",
    noImage: "No image",
    previewLoadingVideo: "Still + 5s video generating, usually 30–60s ...",
    previewLoadingImage: "Generating still, usually 15–30s ...",
    previewLoadingHint: "Preview runs 1 shot + MJ + Minimax I2V only — not a full pipeline",
    previewImageAlt: "Preview still",
    includeVideo: "Include 5s video (slower, but you see camera move)",
    tryAgain: "Try again",
    abandon: "Abandon",
    acceptPreview: "Use this still for the full run",
    acceptPreviewHint: "Shot 1 uses this still; later shots follow its look",
    guideStep1Title: "① Write your idea",
    guideStep1Desc: "30+ characters with a genre cue (mystery / romance / period) work best; you can also paste a full script.",
    guideStep2Title: "② Pick a look",
    guideStep2Desc: "Look sets the film-wide visual tone — swipe sideways for one you like; you can change it later in the style gallery.",
    guideStep3Title: "③ ROLL",
    guideStep3Desc: "The AI team takes the rest: script → boards → video → film; track progress anytime in the job queue.",
    guideAria: "Create workshop first-run guide",
    skipGuide: "Skip guide",
    prevStep: "Back",
    startShoot: "Roll 🎬",
    nextStep: "Next",
    languageLabel: "Production language · dialogue / narration / VO",
    languageHint: "Only Chinese/English have native lip-sync; ja/ko/ru get full script+subs+VO, lip-sync is approximate",
    setDefaultLangHint: "Set as the system default (other create entries inherit it)",
    defaultSaved: "✓ Set as default",
    systemDefault: "⭐ System default",
    setAsDefault: "☆ Set as default",
    langAuto: "Auto-detect (from idea text)",
    ttsDegraded: " · VO fallback",
    providerMinimax: "MiniMax (video/image)",
    providerVeo: "Veo (video)",
    providerMidjourney: "Midjourney (image)",
    gatewayCooldown: "Gateway {host} quota cooldown (~{n} min)",
    recentFailures: "{provider} failed {n} times in 10 min (unstable)",
    engineWeather: "Engine weather:",
    engineWeatherHint: "—— affected paths auto-fallback / switch engines; you can create now or retry later",
    styleSaveFailed: "Failed to save style",
    deleteStyleConfirm: "Delete style \"{name}\"?",
    styleLibraryTitle: "STYLE LIBRARY · My styles",
    saveCurrentHint: "Save the current style to my library",
    saveCurrentDisabledHint: "Pick a look before saving",
    saveCurrent: "Save current",
    styleNamePlaceholder: "Name this style",
    currentStyle: "Current: {style}",
    currentCamera: " · camera {camera}",
    styleLibraryEmpty: "Nothing saved yet. Pick a look + camera, then Save current — reuse in one tap next time.",
    draftsFailed: "Draft generation failed",
    draftsTitle: "Script draft compare · {n} versions",
    draftsStats: "{ok}/{n} succeeded",
    regenerate: "Regenerate",
    draftsLoading: "LLM generating {n} versions in parallel, usually 30–60s ...",
    draftsFooter: "Each version uses a different temperature (T) — higher is bolder. Click {adopt} to start the full pipeline; the writer agent will adapt it.",
    adoptDraft: "Use this draft",
    tempAggressive: "Bold",
    tempMedium: "Medium",
    tempSteady: "Steady",
    genFailed: "Generation failed",
    approxWords: "~{n} words",
    cameraLanguage: "CAMERA · Camera language",
    cameraDefault: "Default · gentle push-in",
    cameraPresetsAria: "Camera language presets",
  },
  projectView: {
    loadingTimeline: "Loading timeline…",
    loadingProject: "Loading project...",
    projectNotFound: "Project not found",
    rerenderStarting: "Starting batch re-render…",
    rerenderShotDone: "Shot {n} re-render done ✅",
    rerenderShotFail: "Shot {n} failed: {error}",
    rerenderBatchDone: "Re-render done: {ok}/{total} succeeded",
    rerenderBatchFailSuffix: ", {n} failed (engine still down? check engine weather on Create)",
    rerenderRequestFail: "Batch re-render request failed, try again later",
    saveFailed: "Save failed",
    saveFailedStatus: "Save failed {status}",
    checkNetwork: "Check your network and try again",
    themeLabel: "Theme · {theme}",
    castLocked: "Cast Lock · {n} characters locked",
    faceConsistency: "Face consistency across the film",
    workflowGroupsAria: "Workflow groups",
    stagesAria: "{group} stages",
    sceneDescription: "Scene description",
    dialogue: "Dialogue",
    beatLabel: "Beat · {beat}",
    emptyCharactersHint: "After the script is written, the AI character designer produces designs and key art",
    editDescription: "Edit description",
    emptyScenesHint: "After the script is written, the AI scene designer produces visual treatments",
    cameoRetryFail: "Retry failed ({status})",
    cameoRetryDone: "Batch retry done: {upgraded} improved, {unchanged} unchanged, {failed} failed",
    networkError: "Network error",
    inspector: "Inspector",
    cineDeskTitle: "Single-shot cine desk — size / angle / lens / move / focus / mood",
    directorStageTitle: "Director stage — block talent, set camera, live composition check",
    stagedOn: "Blocked · Director",
    stagedOff: "Director · Block",
    subtitleSafeArea: "Subtitle safe area {state}",
    rerenderBusy: "⏳ Re-rendering…",
    rerenderBatchBtn: "⚡ Batch re-render {n} failed/downgraded shots",
    emptyVideosHint: "After boards are done, generate per-shot video in Shot Workshop or the main pipeline",
    videoGenFailed: "Video generation failed · showing board",
    noSceneDesc: "(no scene description)",
    expandComments: "Expand comments →",
    costDetails: "💰 Cost breakdown",
    costTimes: "{n} calls",
    costTotal: "Total ({n} entries)",
    querying: "Querying…",
    filmHealth: "🩺 Film health check",
    probing: "Probing…",
    recheckHealth: "↻ Recheck",
    audioHealed: "Audio track auto-healed",
    audioMissingHint: "— Missing score/VO? Go to Shot Workshop to mix VO or regenerate the film",
    boardFallback: "Board (video generation failed)",
    noVideo: "No video",
    shotOf: "Shot {n} / {total}",
    exitFullscreen: "Exit fullscreen",
    watchFullscreen: "Watch fullscreen",
    fullscreen: "Fullscreen",
    noVideosYet: "No videos yet",
    playFromStart: "Play from start",
    reviewPassed: "Review passed",
    needsWork: "Needs work",
    dimNarrative: "Story",
    dimVisualConsistency: "Look",
    dimPacing: "Pacing",
    dimPerformance: "Cast",
    dimVisualQuality: "Visual",
    dimAudio: "Audio",
    cannotRetakeSegment: "This segment cannot be retaken alone",
    canRetake: "Ready to retake",
    retakePlanDesc: "Generate {gen}s, patch {patch}s, shot duration unchanged",
    dryRunFailed: "Dry run failed",
    defaultNarration: "Episode narration.",
    anotherUser: "Another user",
    anonymous: "Anonymous",
    emptyTimeline: "No timeline yet — the shot sequence appears after the writer finishes this project",
    shotsDuration: "{n} shots · {sec}s total",
    virtualOn: "· virtual on ({start}-{end} / {total})",
    undoTitle: "Undo (Ctrl/Cmd+Z)",
    redoTitle: "Redo (Ctrl/Cmd+Shift+Z)",
    rippleTitle: "Ripple mode: later clips move when you drag/edit one",
    rippleOn: "Ripple on",
    rippleOff: "Ripple off",
    unsaved: "● Unsaved",
    shotsTrackHint: "SHOTS · drag cards to reorder · click duration to change",
    bgmTrackTitle: "BGM · by act · drag middle to slide / drag edge to retime / click track icon to mute",
    subtitleTrackTitle: "SUBTITLE · subtitle clips · drag edge to retime / double-click to edit / click track icon to mute",
    regenNarration: "Regenerate narration track",
    genNarration: "Generate narration track",
    narrationHint: "TTS from shot narration, write to disk, splice into the timeline (subs go on SUBTITLE)",
    narrationTrack: "NARRATION · narration track (read-only) · subs already on SUBTITLE",
    playDownload: "Play / download",
    lockToast: "is editing this clip — wait until they finish",
    rewriteSubtitle: "Rewrite subtitle",
    timelineHelp: "Drag shots to reorder · duration dropdown changes one shot · drag BGM / subtitle clips · double-click a subtitle to edit · track icon mutes / resets. Saved data is used on the next film mux.",
    segmentsCount: "({n} clips)",
    noSegments: "(no clips)",
    lockWait: "🔒 {name} is editing this clip, wait a moment",
    muted: "muted",
    edited: "edited",
    editingNow: "🔒 {name} editing",
    resizeLeft: "Drag left edge to change start (right end stays)",
    resizeRight: "Drag right edge to change duration (start stays)",
    unmute: "Unmute",
    mute: "Mute",
    editSubText: "Edit subtitle text",
    resetDefault: "Reset to default",
    emptyPacing: "No pacing data yet",
    emptyPacingHint: "Pacing analysis appears after the writer finishes this project",
    dramaConflictPass: "Drama ≥3.5 to pass",
    stdConflictPass: "Standard ≥2.5 to pass",
    timesUnit: "×",
    dramaReversalPass: "Drama ≥2 to pass",
    stdReversalPass: "Standard ≥1 to pass",
    needsFix: "Needs fix",
    dramaMode: "Drama mode",
    stdMode: "Standard mode",
    hookAudit: "Hook audit",
    heuristicLlm: "Heuristic + LLM review",
    heuristicOnly: "Deterministic heuristic",
    openingHook: "Opening 3s hook",
    episodeCliff: "Episode-end cliffhanger",
    bgmSync: "BGM hit alignment",
    cutsCount: "{aligned}/{total} cuts",
    noBgm: "No BGM yet, cannot measure",
    openingPrefix: "Open:{reason}",
    cliffPrefix: "End:{reason}",
    shotsCount: "{n} shots",
    noShotData: "No shot data",
    emotionReversalAria: "Emotion reversal",
    strong7: "Strong ≥7",
    mid46: "Mid 4-6",
    weak4: "Weak <4",
    reversalPoint: "Emotion reversal",
    styleBible: "STYLE BIBLE consistency (per-shot vision audit)",
    styleAvg: "Avg {avg}/100 · {n} shots retried",
    retriedTitle: "Retried (vision correction: {reason})",
    styleStrong: "Strong ≥85",
    styleMid: "Mid 70-84",
    styleWeak: "Weak <70 (retry triggered)",
    dialogueCoverage: "Dialogue coverage (shot/reverse / reaction CU)",
    dialogueScenes: "{scenes} dialogue scenes · {multi} multi-character",
    missingReverse: "Missing shot/reverse ({n})",
    reverseHint: "· Shot group #{n}: {chars} — only 1 shot, missing reaction cut",
    missingCU: "📷 Missing reaction CU ({n})",
    cuHint: "· Shot group #{n}: {chars} — all wide, missing CU/MCU",
    rewriteHints: "Rewrite hints",
    pacingDiagV2: "Pacing diagnosis v2",
    curve: "Curve",
    shapeEscalating: "Escalating",
    shapeFrontLoaded: "Front-loaded",
    shapeNoClimax: "No clear climax",
    shapeFlat: "Flat",
    slopePeak: "Slope {slope} · climax at shot {n}",
    dragSegments: "Draggy stretches (where viewers drop)",
    dragRange: "S{from}–{to} (avg {avg})",
    opening: "Open",
    openingStats: "First {n} shots avg {avg}",
    openingFailNote: " — completion rate is mostly decided by the open",
    durationRhythm: "Duration rhythm",
    cvLabel: "CV {cv}",
  },
  projectTools: {
    sourceFactory: "Factory truth",
    sourceVision: "Vision labeled",
    sourceSkeleton: "Skeleton (Vision key enables per-shot labels)",
    groupNarrative: "Narrative",
    groupTime: "Time",
    groupCamera: "Camera language",
    groupImage: "Image treatment",
    groupSound: "Sound",
    fieldDialogue: "Dialogue",
    fieldDuration: "Duration",
    fieldStart: "Start",
    fieldEnd: "End",
    fieldShotSize: "Shot size",
    fieldCameraMove: "Camera move",
    fieldLens: "Focal length & DoF",
    fieldLighting: "Light & color",
    fieldEdit: "Edit",
    fieldScoreMood: "Score mood",
    fieldSoundDesign: "Sound design",
    fieldStoryBeat: "Board function",
    fieldWhyChoice: "Narrative function",
    rerenderShotProgress: "Re-rendering shot {shot} ({ok}/{n})…",
    rerenderDone: "Re-rendered {ok}/{n} shots",
    generatingSheet: "Building pull sheet…",
    noShotData: "No shot data yet — the per-shot pull sheet appears after the script is generated",
    pullAnalysis: "Pull-sheet analysis",
    sheetMeta: "{n} shots · {sec}s total · factory camera language (real pipeline params, not AI reverse-engineered)",
    exportCsv: "Export CSV",
    scriptBookMd: "Script book MD",
    scriptBookPdf: "Script book PDF",
    importCsv: "Import CSV",
    importing: "Importing…",
    importFailed: "Import failed:{msg}",
    importApplied: "Applied {n} edits ({rows} rows)",
    unknownShotsSkipped: "skipped unknown shots:{list}",
    badLines: "bad lines {n}",
    importNetworkFail: "Import failed: network or file read error",
    rerendering: "⏳ Re-rendering…",
    rerenderAffected: "🎬 Re-render {n} affected shots (S{list})",
    shotBoardAlt: "Shot {n} board",
    noFrame: "No frame",
    externalTitle: "Reference pull-sheet (external video)",
    externalHint: "Paste a video URL → ffmpeg scene-cuts a skeleton (cuts/duration/thumbs are real); with a Vision key, each shot is labeled. Confirm you have rights to the reference — pull-sheet is for structure study, not copying the original.",
    externalUrlAria: "Reference video URL",
    urlPlaceholder: "https://… or /api/serve-file?key=…",
    pullAction: "Pull",
    refresh: "Refresh",
    queuedSplit: "Queued for split (job {id}) — appears below when done",
    splitDone: "Split done: {n} shots{extra}",
    visionLabeled: ", Vision labeled {n} shots",
    skeletonTable: "(skeleton)",
    splitFailed: "Split failed",
    sheetShotsMeta: "{n} shots · {sec}s",
    truncated: " · truncated",
    collapse: "Collapse ▲",
    expand: "Expand ▼",
    sketchNeedDesc: "Fill the scene description (≥5 chars) before generating a sketch",
    sketchGenFailedStatus: "Sketch generation failed ({status})",
    sketchGenFailed: "Sketch generation failed",
    sketchTooLarge: "Sketch too large (10MB max)",
    persistFailed: "Failed to persist sketch ({status})",
    sketchUploadFailed: "Sketch upload failed",
    refTooLarge: "Reference image too large (10MB max)",
    promptTooShort: "Prompt must be at least 5 characters",
    regenStarting: "Starting regen...",
    requestFailedDetail: "Request failed ({status}): {msg}",
    streamReadFailed: "Could not read response stream",
    processing: "Processing...",
    noNewImage: "Upstream returned no new image",
    regenFailed: "Regen failed",
    regenTitle: "Edit prompt & regen · Shot {n}",
    promptPlaceholder: "Rewrite the shot... e.g. switch to a high angle, heighten the emotional hit",
    refImageOptional: "Reference image (optional, overrides Style Bible)",
    remove: "Remove",
    refUploaded: "Reference uploaded",
    refUsedAsSref: "This regen uses this image as sref (replaces Style Bible)",
    dropRefHint: "Drop a reference here (or click to choose) — the model will follow its look",
    lockStyleBible: "Lock Style Bible look (recommended, prevents style drift)",
    lockLeadFace: "Lock lead face (primaryCharacterRef as cref)",
    aspect: "Aspect:",
    sketchLockTitle: "Shot-language sketch lock",
    sketchLockOptional: "(optional · lock composition/camera from a sketch)",
    genSketchTitle: "AI draws a rough composition sketch from the description above",
    genSketch: "AI generate sketch",
    uploadSketch: "Upload sketch",
    lockCompOnRegen: "Lock composition from sketch on regen",
    sketchAlt: "Composition sketch",
    sketchSoftHint: "Soft composition constraint: sketch sets layout/camera; details and color still follow the prompt (off by default, enable with the checkbox)",
    footerHint: "Full image route (multi-ref + style bible + negative text prompt)",
    regenInProgress: "Regenerating...",
    regenThisShot: "Regen this shot",
    preflightUnavailable: "Preflight unavailable ({status})",
    preflightUnavailableShort: "Preflight unavailable",
    pickOnePlatform: "Pick at least one platform",
    genFailed: "Generation failed ({status})",
    networkError: "Network error",
    preflightFailConfirm: "Preflight failed ({label}):\n{issues}\n\nPublish anyway?",
    publishing: "Publishing…",
    publishNeedCreator: "Publishing requires creator tier or above — upgrade",
    qualityGateBlocked: "Quality gate blocked — fix the weakest shot first",
    pleaseLogin: "Please sign in",
    publishFailed: "Publish failed ({status})",
    scheduledAt: "Scheduled · {date}",
    ytUploaded: "Uploaded to YouTube (private by default — change visibility in YouTube Studio)",
    packedWithMsg: "Packed · {msg}",
    packedWithShare: "Packed + share link generated (download assets and upload manually)",
    exportFilename: "distribution-{id}.txt",
    multiPlatform: "Multi-platform distribution · DISTRIBUTION",
    regenerate: "Regenerate",
    genPack: "Generate distribution pack",
    exportTxt: "Export .txt",
    llmDegraded: "LLM output parsed best-effort (partially degraded)",
    scheduleOptional: "Scheduled publish (optional)",
    clearSchedule: "Clear (publish now)",
    ytRealUpload: "Real upload to YouTube (needs a configured token; posts to your channel)",
    emptyHint: "Pick platforms → generate. From this film's script/hooks, each platform gets title options · tags · cover hook · description · publish tips.",
    copy: "Copy",
    preflightPass: "Preflight passed",
    preflightPassTips: "Preflight passed · {n} tips",
    preflightFailItems: "Preflight failed · {n} items",
    labelTitle: "Title",
    labelAlt: "Alt",
    labelTags: "Tags",
    labelHook: "Hook",
    labelDesc: "Description",
    labelTips: "Tips",
    publishPack: "Publish / pack",
    sharePage: "Share page",
    platformLink: "Platform link",
    renderOk: "Lip-sync video ready ({provider}){written}",
    writtenBack: " · written back to boards/timeline",
    renderFailed: "Render failed",
    audioSynthOk: "Synthesized {ok}/{total} lines — “real lip-sync render” can pick up audio now",
    audioSynthFailed: "Voice synthesis failed",
    noAudioAlign: "This shot has no VO yet — synthesize film-wide VO first, then measure alignment",
    noWebAudio: "Browser does not support Web Audio",
    alignFailed: "Alignment measure failed",
    levelPass: "Lip-sync ready",
    levelWarn: "Partially off",
    levelBlock: "Many mismatches",
    lipsyncTitle: "Lip-sync · {n} dialogue lines",
    engineOn: "Engine configured",
    engineOff: "Engine not configured",
    readiness: "{label} · readiness {n}",
    synthesizing: "Synthesizing…",
    synthAll: "Synthesize film VO",
    shotNth: "Shot {n}",
    stop: "Stop",
    playLips: "Play visemes",
    renderThisTitle: "Call the lip-sync engine to really render this shot",
    rendering: "Rendering…",
    renderReal: "Real lip-sync render",
    measureTitle: "Decode this shot's VO in-browser → score mouth-open vs audio energy",
    measuring: "Measuring…",
    measureAlign: "Measure A/V align",
    verdictGood: "Mouth follows the voice",
    verdictFair: "Roughly in sync",
    verdictBad: "Clearly off",
    audioLag: " · audio {dir} {lag}s",
    lagBehind: "late",
    lagAhead: "early",
    avAlign: "A/V align",
    driftTitle: "Drift detected, re-render with shift (raw align {before}→{after})",
    correctDrift: "Correct drift & re-render",
    mouthOpenTitle: "{viseme} · open {n}%",
    viewVideo: "View video",
    reshootTitle: "Lip-sync reshoot hints · {n}",
    preparing: "Preparing...",
    needPro4k: "4K re-render requires pro or above",
    requestFailed: "Request failed ({status})",
    regen4kFailed: "4K re-render failed",
    workshopSubtitle: "Per-shot ops: 4K re-render / first-last-frame blend / camera-language tweak / multi-res export.",
    u2vTitle: "Standalone U2V tool (image-to-video, optional camera language)",
    u2vTool: "U2V tool",
    emptyShots: "No video shots yet",
    emptyShotsHint: "Come back after the main pipeline finishes",
    regen4kDone: "4K re-rendered",
    boardRegenDone: "Board regenerated",
    regenPromptTitle: "Edit prompt & regen this shot's board (image route, not video)",
    regenPrompt: "Edit prompt & regen",
    gridTitle: "Generate 4/6/9 composition candidates, pick the best as first-frame seed (image route)",
    gridPick: "Pick from grid",
    klingTitle: "Re-render this shot with Kling Master (60-90s)",
    needProTitle: "Requires pro or above",
    regen4k: "4K re-render",
    workshopFooter1: "4K re-render uses Kling Master, 60-90s per shot · plan-gate: pro+",
    workshopFooter2: "The workshop lists generated video shots only; add shots from the script tab.",
    saveFailed: "Save failed ({status})",
    savedOk: "Continuity settings saved",
    geneLib: "Visual gene library · VISUAL GENE LIBRARY",
    charLock: "Character lock",
    moreChars: "+{n} characters",
    noCharAsset: "No character assets",
    envLock: "Environment lock",
    lightingOn: "Lighting locked",
    lightingOff: "Lighting unlocked",
    moreScenes: "+{n} scenes",
    noSceneAsset: "No scene assets",
    seedLock: "Seed lock",
    refreshSeeds: "Refresh seeds",
    auxSeed: "Aux seed {n}",
    boardLogic: "Board continuity · {n} shots",
    noBoards: "No boards yet",
    noBoardsHint: "After boards generate, set continuity / seed lock / FaceID here",
    moreShotsSame: "… remaining {n} shots share this chain",
    consoleTitle: "Continuity console",
    linkMode: "Link mode LINK MODE",
    strength: "Continuity strength",
    loose: "0 loose",
    strict: "1 tight",
    clothingLock: "Clothing lock",
    lightingLock: "Lighting lock",
    faceIdStrength: "FaceID strength",
    saveContinuity: "Save continuity settings",
    engineMissing: "Lip-sync engine not configured",
    shotOk: "Shot {n} ✓{written}",
    writtenBoard: " written back",
    shotWarn: "Shot {n}:{msg}",
    computingAlign: "Computing lip-audio alignment…",
    alignWeak: "A/V align: {n} shots low (folded into weak-shot pick)",
    stopped: "Stopped manually",
    qcRound: "Lip-sync QC round {round}/{max}: Vision re-score…",
    rerenderWeak: "Re-rendering weak shot {n} lip-sync…",
    aborted: "{msg} — aborted",
    rerenderFailed: "Re-render failed",
    confirmRun: "“Film-wide lip-sync” will run {n} dialogue lines: ① synthesize VO → ② per-shot real lip-sync render → write back boards/timeline. Uses TTS + lip-sync compute. Run?",
    synthAllLines: "Synthesizing film VO ({n} lines)…",
    audioFailed: "Voice synthesis failed",
    audioDone: "VO done {ok}/{total}",
    renderShot: "Rendering shot {n} lip-sync…",
    renderDone: "Render done: {ok}/{n} shots with lip-sync{extra}",
    inTimeline: "(on timeline/boards)",
    batchFailed: "Batch failed",
    batchTitle: "Film-wide lip-sync · {n} dialogue lines (VO → render → write-back)",
    qcLoopTitle: "After render, run Vision QC and auto re-render weak shots (≤2 rounds)",
    qcLoop: "QC loop",
    running: "Running…",
    runAll: "Run film-wide",
    roleViewer: "View only",
    roleCommenter: "Can comment",
    roleEditor: "Can edit",
    loadFailed: "Load failed {status}",
    createFailed: "Failed {status}",
    failed: "Failed",
    revokeConfirm: "Revoke this invite link? It will stop working.",
    removeConfirm: "Remove {name} from collaborators? Existing comments stay.",
    inviteTitle: "Invite collaborators",
    joined: "Joined ({n})",
    newLink: "Create a new invite link",
    roleViewerOpt: "View only (viewer)",
    roleCommenterOpt: "Can comment (commenter)",
    roleEditorOpt: "Can edit (editor)",
    expiry1d: "1 day",
    expiry7d: "7 days",
    expiry30d: "30 days",
    expiryForever: "Forever",
    generateCopy: "Generate + copy link",
    sentLinks: "Sent links ({n})",
    visitStats: "{views} views, {accepts} accepts",
    copyLink: "Copy link",
    revokeLink: "Revoke link",
  },
  projectPanels: {
    pickSampleFirst: "Choose a voice sample first (WAV/MP3, ≥10s, ≤5MB)",
    sampleTooLarge: "Sample must be ≤5MB",
    consentRequired: "Check the consent box first: you must have authorization from the person being cloned",
    consentOwnerDeclaration: "I confirm I have authorization from the person being cloned, for lawful use only",
    cloneFailed: "Clone failed",
    cloneTag: "[clone]",
    cloneSuccess: "✓ Cloned: {id} — added to the list; assign to a character and save",
    auditionFailedNeedTts: "Preview failed (TTS engine required)",
    auditionFailed: "Preview failed",
    voicesSaved: "Saved — next “Synthesize dub” will use these voices",
    saveFailed: "Save failed",
    voiceShelfTitle: "Character voices · {n} characters (pick / preview, overrides auto-routing)",
    manual: "Manual",
    auto: "Auto",
    audition: "Preview",
    saveVoices: "Save voices",
    cloneHint: "Clone a custom voice (upload ≥10s clean speech, WAV/MP3 ≤5MB)",
    cloneNamePlaceholder: "Voice name (e.g. Chen)",
    clonePurposeTitle: "Clone purpose (compliance record)",
    purposeDrama: "Use: drama dubbing",
    purposeAd: "Use: ad dubbing",
    purposePersonal: "Use: personal project",
    purposeOther: "Use: other",
    consentLead: "I confirm I ",
    consentBold: "have authorization from the person being cloned",
    consentTail: ", for lawful use only, and I understand deep-synthesis compliance (Deep Synthesis Management Provisions).",
    cloneVoice: "Clone voice",
    cloningWait: "Cloning… (about 10–30s)",
    consentThenClone: "← Check consent to clone",
    withVoiceover: "With VO",
    voiceoverMuted: "VO muted",
    nativeTrack: "Native audio",
    nativeMuted: "Native muted",
    noIndependentTrack: "No separate track · final cut has score + VO",
    audioBlocked: "Browser blocked audio — click the video and retry",
    audiblePreview: "Audible preview",
    audibleOnTitle: "Sound on · click to mute",
    mutedTitle: "Muted · click for audible preview",
    muted: "Muted",
    previewFailed: "Preview failed",
    replicateStarted: "Replica started — new project {id} ({n} shots generating in parallel; see My Projects)",
    replicateFailed: "Replica failed",
    templateSaved: "Saved as private template “{title}” — reuse the structure from the template market",
    saveTemplateFailed: "Failed to save template",
    replicateTitle: "Replica · replace workbench",
    replicateHint: "Swap cast / scenes / props (global e.g. “boss→cat” replaces everyone) → preview rewritten per-shot prompts (editable) → spin up a new film on the same structure. Replica = same structure, new content — original assets are not copied.",
    kindGlobal: "Global replace",
    kindProp: "Prop",
    kindCostume: "Costume",
    replaceKindAria: "Replace type",
    fromPlaceholderGlobal: "Original (e.g. boss)",
    fromPlaceholderOther: "From (empty = whole column)",
    fromAria: "Original term",
    toPlaceholder: "Replace with (e.g. an orange cat)",
    toAria: "Replace with",
    refImagePlaceholder: "Reference image URL (optional)",
    refImageAria: "Reference image",
    deleteRuleAria: "Delete rule",
    addRule: "Add rule",
    previewRewrite: "Preview rewrite",
    replicateStart: "Start replica ({n} shots)",
    savePrivateTemplate: "Save as private template",
    saveTemplateHint: "Save this pull-sheet structure as a private template to reuse a proven skeleton",
    fidelityTitle: "Replica fidelity (pacing / hook vs original)",
    fidOverall: "Overall",
    fidPacing: "Pacing",
    fidHook: "Hook",
    fidCompare: "Open {a}→{b} · end {c}→{d} · reversals {e}→{f}",
    promptListTitle: "“{title}” per-shot replica prompts (editable):",
    shotDur: "Shot {n} · {sec}s",
    refImageCount: "{n} refs",
    shotPromptAria: "Shot {n} replica prompt",
    actorFallback: "Actor A",
    stageSaved: "Saved — later renders of this shot will use this blocking",
    saveFailedWith: "Save failed: {msg}",
    saveStageFailed: "Failed to save stage HTTP {status}",
    sketchDone: "Sketch ready — turn on sketch lock when regenerating this board to lock composition",
    sketchFailedWith: "Sketch failed: {msg}",
    stageTitle: "Director stage · shot {n}",
    stageTitleNamed: "Director stage · shot {n} — {title}",
    topViewHint: "Top view · drag actors or camera",
    cameraMark: "Cam",
    yaw: "Yaw",
    camHeight: "Height",
    focal: "Lens",
    fov: "{n}° FOV",
    cameraViewHint: "Camera view · same geometry as the final sketch",
    noCompositionWarn: "No composition warnings",
    promptLineSummary: "Line that goes into the prompt (English)",
    sketchAlt: "Shot {n} blocking sketch",
    saveBlocking: "Save blocking",
    renderSketch: "Render layout sketch",
    renderSketchHint: "Render a layout sketch from the current stage (no engine, no cost)",
    retakeDone: "Shot {n} retake done ({emotion}) — expand for A/B",
    retakeFailed: "Retake failed",
    batchQueued: "Queued retakes ({n} lines, job {id}) — refresh when done",
    batchDone: "Batch done: {ok}/{total} lines",
    batchFailed: "Batch retake failed",
    adoptedNotice: "Adopted — shot {n} lipsync/cut marked stale ({stale} items)",
    adoptFailed: "Adopt failed",
    retakeTitle: "Voice retake · {n} dialogue lines",
    retakeTitleTakes: "({n} retakes)",
    retakeTitleHint: " (line-level emotion retake / A·B compare / rest of episode untouched)",
    selectShotAria: "Select shot {n}",
    shotN: "Shot {n}",
    emotionAria: "Shot {n} emotion",
    retake: "Retake",
    retakeOneHint: "Retake this line with the selected emotion",
    versions: "{n} takes",
    abListen: "A/B listen:",
    sideA: "A · current",
    sideAEmotion: "A · current ({emotion})",
    sideB: "B · retake",
    sideBEmotion: "B · retake ({emotion})",
    noFullDub: "(This shot has no episode VO yet — you can adopt the retake directly)",
    noRetakes: "No retakes yet — pick an emotion and hit Retake.",
    adoptedBadge: "Adopted",
    adoptThis: "Adopt this take",
    batchRetake: "Batch-retake selected ({n} lines)",
    adoptHint: "After adopting, this shot’s lipsync/cut is marked stale — other shots are untouched.",
    loadFailedHttp: "Load failed (HTTP {status})",
    loadFailed: "Load failed",
    rangeFailed: "Could not resolve retake range",
    inspectTitle: "Frame inspect · shot {n}",
    thinned: "Thinned: 1 of every {n} frames (too many frames)",
    decodeFailed: "{n} frames failed to decode, skipped",
    extracting: "Extracting frames…",
    noFrames: "No displayable frames in this range.",
    frameAlt: "Frame {n}",
    pickStart: "Click a frame to start, click another to set the range",
    selectedOne: "Selected #{lo}",
    selectedRange: "Selected #{lo}–#{hi}",
    clearSelection: "Clear selection",
    ranging: "Resolving…",
    resolveRange: "Resolve retake range",
    useForRetake: "Retake this segment",
    currentProject: "Current project",
    confirmRun: "One-click film self-heal will: audit every shot → auto-reshoot low scores (uses tokens) → re-audit, up to {n} rounds.\nRun now?",
    stopped: "Stopped manually",
    roundAudit: "Round {n} · auditing…",
    auditFailed: "Audit failed (HTTP {status})",
    skipNoPrompt: "Shot {n} has no board prompt, skipped",
    reshootShot: "Reshooting shot {n} · {hint}",
    reshootIncomplete: "Shot {n} reshoot incomplete",
    reshootError: "Shot {n} reshoot error",
    roundReshoot: "Reshot {n} this round, re-auditing",
    noAutoReshoot: "No shots can auto-reshoot (missing prompts) — hand off",
    runError: "Run error",
    oneclickTitle: "One-click film · self-heal loop",
    oneclickBadge: "Kling-style one-click · plus audit + auto-reshoot",
    oneclickBefore: "Each round ",
    oneclickAudit: "audit every shot",
    oneclickMid1: " → ",
    oneclickGate: "gate decision",
    oneclickMid2: " → low scores ",
    oneclickReshoot: "auto-reshoot",
    oneclickAfter: " (steer on the weakest dimension) → re-audit; stop on pass / warn, max {n} rounds, then hand off.",
    stop: "Stop",
    runLoop: "Run self-heal loop",
    needBoards: "Generate boards first",
    passed: "Passed",
    handoff: "Hand off",
    promptTooShort: "This shot’s base prompt is too short (<5 chars). Complete the board description first.",
    generatingN: "Generating {n} candidates…",
    requestFailed: "Request failed ({status}): {txt}",
    streamReadFailed: "Could not read response stream",
    processing: "Processing…",
    completePick: "Done: {n} candidates — click one to adopt",
    generateFailed: "Generation failed",
    pickFailedHttp: "Adopt failed ({status})",
    gridTitle: "Candidate grid · Shot {n}",
    candidateCount: "Count:",
    aspect: "Aspect:",
    regenBatch: "New batch",
    generateCandidates: "Generate candidates",
    emptyHint: "Click “Generate candidates” for {n} distinct-composition frames, then pick the best as the first frame.",
    pick: "Adopt",
    readyFooter: "{ready}/{total} ready · click one to set as this shot’s first frame",
    crossOrigin: "This asset is a cross-origin URL; the browser cannot read pixels — scopes need same-origin / stored media",
    imageLoadFail: "Image failed to load",
    exportTitle: "Pro delivery · DaVinci / Premiere / Avid",
    exportEdl: "Export EDL (CMX3600)",
    exportFcpxml: "Export FCP7 XML",
    exportAaf: "Export AAF (Avid)",
    exportHint: "Includes shot duration + media paths, timecode at project frame rate",
    scopesTitle: "Video scopes",
    scopeStats: "Avg luma {avg} · highlight clip {hi}% · shadows {lo}%",
    noBoards: "No storyboards to analyze",
    hist: "HISTOGRAM",
    waveform: "WAVEFORM",
    renderLoop: "RENDER LOOP",
    renderEmpty: "Script / boards not generated yet — shot render progress appears here after you start.",
    etaAvg: " · avg {n}s/shot",
    failedN: "{n} failed",
    stageVideo: "Video",
    stageBoard: "Board",
    res720Desc: "HD ·  fast · any plan",
    res1080Desc: "FHD · standard · creator+",
    res2160Desc: "4K UHD · high detail · pro+",
    downloadTitle: "Download film — pick resolution",
    exportMp4: "Export mp4",
    upgradeUnlock: "Upgrade to {tier} to unlock",
    downloadRes: "Download {label}",
    withIntro: "Include open/end cards",
    withIntroHint: "Cover + title open · cast roster end (Wind Comic brand)",
    lockedHint: "Locked items → account upgrade page",
    costTitle: "Cost attribution · where this job spent",
    noCostTitle: "No cost data yet",
    noCostHint: "After you generate a film, see per-stage spend and savings tips",
    budgetCap: "Budget cap ¥",
    capUnset: "Unset",
    perSec: "sec",
    perCall: "call",
    cogsTitle: "COGS report · unit cost and margin",
    salePrice: "Ref. sale ¥",
    salePlaceholder: "Sale price for margin",
    unitQtySec: "{n}s",
    unitQtyCall: "{n} calls",
    totalCogs: "Total COGS",
    marginLine: "Sale ¥{sale} − COGS ¥{cogs} = profit ¥{profit}",
    marginPct: " · margin {n}%",
    inspectorAria: "Shot {n} inspector",
    closeInspector: "Close inspector",
    shotAlt: "Shot {n}",
    emotionLine: "Mood · {emotion}",
    sceneDesc: "Shot description",
    emDash: "—",
    dialogue: "Dialogue",
    camera: "Camera",
    shotActions: "Shot actions",
    cinemaDesk: "Shot cinema desk · size / angle / move / focus",
    frameInspect: "Frame inspect · find the bad beat → retake those two seconds",
    workshopActions: "Candidate grid / 4K re-render / rewrite prompt →",
    shotSize: "SHOT SIZE",
    angle: "ANGLE",
    lens: "LENS",
    movement: "MOVEMENT",
    focus: "FOCUS",
    atmosphere: "ATMOSPHERE",
    motion: "MOTION",
    advanced: "Lighting + camera sim · advanced",
    lighting: "LIGHTING",
    colorTemp: "Kelvin",
    contrast: "Contrast",
    contrastLow: "Low",
    contrastMed: "Med",
    contrastHigh: "High",
    body: "BODY",
    lensSeries: "LENS SERIES",
    ndNone: "None",
    wb: "WB",
    descUpdated: "“{name}” updated — affected shots: {shots} ({n} assets marked stale)",
    descUpdatedNone: "“{name}” updated — no shots cite this asset",
    ledgerTitle: "Asset continuity ledger",
    registerPropPh: "Register a key prop (e.g. old photo)",
    registerPropAria: "Register key prop",
    register: "Register",
    ledgerHint: "Costume / scene / prop entries × citing shot numbers; editing a description lists affected shots and marks them stale. With a Vision key this can upgrade to frame-level drift compare (BYO).",
    emptyEntries: "No entries yet — auto-registered after script / cast / scenes generate.",
    citedShots: "Cited shots: {shots}",
    citedNone: "—",
    descAria: "{name} description",
    editDescTitle: "Click to edit description",
    noDesc: "(No description — click to add; changes mark affected shots)",
  },
  projectMisc: {
    auditTabTitle: "Film QC · AI checks whether the picture matches the script",
    auditRunning: "Checking…",
    auditRerun: "Re-check",
    auditRun: "Run QC",
    auditDoneMsg: "QC done: {scored}/{requested} shots scored",
    auditSkippedSuffix: ", {n} skipped",
    auditRunFailed: "QC failed",
    cineModalTitle: "Shot cinematography ·",
    cineAutoSuggest: "Smart camera suggest",
    cineEmotionPrefix: "Mood: {emotion}",
    cineRulesApplied: "Applied: {list}",
    cineNoRules: "No matching rules for this shot (mood / size)",
    saveFailedStatus: "Save failed ({status})",
    cineSaved: "Camera saved",
    cineSummary: "Camera summary",
    copyPrompt: "Copy prompt",
    saveCamera: "Save camera",
    templateListed: "Listed template “{title}” (quality {quality}) — reuse it from Template Market",
    saveFailed: "Save failed",
    saveTemplateDesc: "Save as template · turn this project's look / multi-ref / pacing into a reusable template",
    saveAsTemplate: "Save as template",
    reviewStatusTitle: "Review status: {label} (click to act)",
    currentLabel: "Now: ",
    submittedLabel: "Submitted: ",
    reviewedLabel: "Reviewed: ",
    reviewNoteLabel: "Review note:",
    changesNoteRequired: "Change notes (required)",
    noteOptional: "Note (optional)",
    submitReview: "Submit for review",
    requestChanges: "Request changes",
    withdraw: "Withdraw",
    dimOk: "OK",
    dimWeak: "Weak",
    dimNa: "N/A",
    dimVisualVsScript: "Picture vs script",
    dimConsistency: "Consistency",
    dimLipAlignable: "Lip-sync ready",
    dimLipMeasured: "Measured lip-sync",
    dimReadyN: "Ready {n}",
    dimAvgScore: "Avg {n}",
    publishGateTitle: "Publish readiness gate",
    notPublishReady: "Below publish line",
    weakestShotsLabel: "Weakest shots:",
    projectFormat: "Project format",
    aspectRatio: "Aspect",
    colorSpace: "Color",
    frameRate: "Frame rate",
    fpsOvercrank: "{n}fps overcrank",
    safeArea: "Safe area",
    savedShort: "Saved",
    saveFormat: "Save format",
    aspect169: "16:9 landscape",
    aspect916: "9:16 portrait",
    aspect11: "1:1 square",
    aspect43: "4:3 classic",
    exportFailed: "Export failed",
    exportPlatformTitle: "Export Douyin / Kuaishou / Xiaohongshu (and more) versions",
    platformExport: "Platform export",
    exportDoneView: "Export done · view",
    presetDouyin: "Douyin vertical 9:16",
    presetKuaishou: "Kuaishou vertical 9:16",
    presetXhs: "Xiaohongshu 4:5",
    presetYoutube: "YouTube landscape 16:9",
    presetSquare: "Square 1:1",
    neverSynced: "Never",
    syncFailedStatus: "Sync failed ({status})",
    syncedMsg: "Synced {n} shots + continuity + format",
    paramLinkageTitle: "Param linkage · PARAMETER LINKAGE",
    shotCard: "Shot card",
    params: "Params",
    unsyncedChanges: "Unsynced changes",
    liveSynced: "Live sync · in sync",
    lastSyncAt: "last sync {time}",
    paramJsonN: "Params JSON ({n} shots)",
    jsonValid: "JSON valid",
    pendingSyncShots: "{n} shots",
    plusFormat: "+format",
    plusContinuity: "+continuity",
    pendingSyncSuffix: " pending sync",
    revert: "Revert",
    syncNow: "Apply & sync (Sync Now)",
    paramJsonHint: "Edit each shot spec / continuity / format, then sync → writes back to board assets; cinematography / continuity / format-bar edits also flow back here on reload.",
    genFailed: "Generation failed",
    musicGenTitle: "AI score (royalty-free BGM)",
    musicGenDesc: "Generate a custom bed from plot/style (MiniMax music-2.6). Saved as project music and used as BGM on remux.",
    musicGenPlaceholder: "e.g. noir suspense, low cello, heavy pulse",
    composing: "Composing… (~1 min)",
    genBgm: "Generate BGM",
    musicSaved: "Saved as project music; remux will use it as BGM.",
    localizeFailed: "Localization failed",
    localizeTitle: "Overseas language versions",
    localizeDesc: "Translate script copy only (dialogue/VO; picture and structure stay). Apply and re-dub when you like it. Same idea as ToonScroll overseas.",
    localizing: "Translating…",
    genLocalizedScript: "Generate localized script",
    applyingDub: "Applying + re-dubbing…",
    applyAndDub: "Apply and re-dub",
    ttsUnreliable: "{name} TTS may degrade (subs only); picture and localized captions are unaffected.",
    localizeResult: "Generated “{title}” {lang} script",
    localizeApplied: ", applied + re-dubbed (check the film area)",
    localizePending: "(script-{lang} asset; click “Apply and re-dub” to ship)",
    healFailed: "Heal failed",
    serverReturned: "Server returned {status}",
    healDoneTitle: "Heal done: fixed {n} shots",
    healFailedCount: "{n} shots failed",
    healSkippedCount: "{n} shots skipped (no board)",
    healAllFixed: "All shots repaired",
    healUnsuccessful: "Heal did not succeed",
    healUnsuccessfulDesc: "{failed} reshoots failed, {skipped} skipped (no board)",
    healNoneTitle: "Nothing to heal",
    healNoneSkipped: "{n} shots have no board; cannot anchor a reshoot",
    healNoneOk: "Film quality is fine; no heal needed",
    healRequestFailed: "Heal request failed",
    healing: "Healing…",
    healButton: "One-click heal",
    seriesEmotion: "Emotion",
    seriesTension: "Tension",
    seriesRhythm: "Rhythm",
    seriesBrightness: "Brightness",
    noEmotionData: "No shot emotion data yet",
    noEmotionHint: "Generate a script / boards first",
    emotionChartTitle: "Emotion curve · rhythm heatmap",
    climaxShot: "▲ Climax shot {n}",
    decisionLogTitle: "Decision log (per-shot engine / cost / consistency)",
    decisionLogMeta: "({n} shots · ¥{cost})",
    querying: "Querying…",
    noDecisionData: "No per-shot decisions yet (accumulates after the film is generated).",
    colShot: "Shot",
    colEngine: "Engine",
    colCost: "Cost",
    colConsistency: "Consistency",
    projectQualityScore: "Project quality: {n}",
    genFailedRetry: "Generation failed, try again later",
    coverPanelTitle: "AI vertical cover candidates · 9:16",
    hideSafeArea: "Hide title safe area",
    showSafeArea: "Show title safe area",
    regenCovers: "Regenerate",
    genCoverCandidates: "Generate cover candidates",
    coverDegraded: "Some covers failed; showing the ones that succeeded (you can regenerate)",
    coverEmptyHint: "Generate 3× 9:16 cover candidates from title + lead + look (MiniMax image-01). Title is not burned in — preview it in the safe-area overlay so platform UI will not cover it.",
    imageFailed: "Image failed",
    titleSafeZone: "Title safe area",
    coverPortrait: "Lead close-up",
    coverDramatic: "Conflict scene",
    coverSymbolic: "Symbolic image",
    consistencyTrend: "Consistency trend · {n} rounds",
    weakestDim: "Weakest: {label} {score}",
    roundN: "Round {n}: {score}",
    compositionFraming: "Framing · rule of thirds",
    compositionHints: "Composition hints",
    hintSubject: "Subject",
    hintHeadroom: "Headroom",
    hintLookRoom: "Look room",
    hintBalance: "Balance",
    cameraPath: "Camera path · {label}",
    cameraPos: "Camera",
    focusPoint: "Focus",
    movePushIn: "Push in",
    movePullOut: "Pull out",
    movePan: "Pan",
    moveTilt: "Tilt",
    moveDolly: "Dolly",
    moveCrane: "Crane",
    moveOrbit: "Orbit",
    moveHandheld: "Handheld",
    moveStatic: "Static",
    castSavedTitle: "Cast saved ({n})",
    castSavedDesc: "Later generate / reshoot will lock these faces",
    castTitle: "Cast file (cross-shot face lock)",
    castDesc: "Lock faces and later generate / reshoot injects the refs — stops “a different face every shot”. Max 3.",
    saveCast: "Save cast",
    videoNodeSub: "Per-shot board video",
    regenerating: "Regenerating...",
    clickToPlay: "Click to play",
    clickRetry: "Click to retry",
    cameraFollowScript: "Camera · follow script",
    cameraTitle: "Camera move (applies when this shot is regenerated)",
    tailFramePlaceholder: "Tail-frame URL",
    tailFrameTitle: "Tail-frame ref URL (Kling first/last-frame blend; locks cut composition; applies on regenerate)",
    regenerate: "Regenerate",
    waitStoryboard: "Waiting for boards...",
    videoGenerating: "Generating video...",
    storyboardArtist: "Storyboard artist",
    storyboardSub: "Board script · camera language",
    sketchAlt: "Composition sketch",
    sketchTitle: "Composition sketch (sketch lock)",
    mustShow: "Must-show",
    waitScenes: "Waiting for scene design...",
    writingBoards: "Writing board script...",
    scriptWorldSub: "Script · cast · world",
    scriptSynopsis: "Synopsis",
    characterList: "Cast list",
    shotDescriptions: "Shot descriptions",
    sceneConcept: "Scene concepts",
    regenSceneTitle: "Regenerate this scene image (this one only)",
    waitCharacters: "Waiting for character design...",
    designingScenes: "Designing scenes...",
    regenFailedPrefix: "Regen failed: {error}",
    editStage: "Edit",
    directorMonitorSub: "Global monitor · guide & coordinate",
    producerReviewSub: "Quality review · film sign-off",
    directorGuiding: "Director is guiding the current stage...",
    monitorDone: "Global monitor complete",
    monitorAll: "Monitoring the full pipeline",
    overallScoreLabel: "/100 overall",
    qualityExcellent: "Excellent",
    qualityNeedsWork: "Needs work",
    qualityRework: "Needs rework",
    dimNarrative: "Story",
    dimVisualConsistency: "Look match",
    dimPacing: "Pacing",
    dimPerformance: "Cast",
    dimVisualQuality: "Picture",
    dimAudio: "Audio",
    suggestionPrefix: "Suggest: {text}",
    selectPartialRedo: "Pick a partial redo",
    redoAll: "Redo all",
    selectRedoHint: "Pick stages to redo (later stages redo automatically):",
    redoFromStage: "Will start from “{label}” and redo every later stage",
    redoing: "Redoing...",
    startRedo: "Start redo ({n})",
    completeProject: "Looks good — finish project",
    selectOptimizeHint: "Pick stages to refine:",
    waitEdit: "Waiting for edit...",
    producerReviewing: "Producer is reviewing...",
    reviewComplete: "Review complete",
    noProjectInfo: "Could not load project info",
    feedbackSubmitted: "Notes submitted",
    submitFailedRetry: "Submit failed, try again",
    confirmed: "Confirmed",
    confirmSave: "Confirm & save",
    tweak: "Tweak",
    feedbackPlaceholder: "Enter change notes...",
    filmPreviewMuxed: "Film preview (muxed)",
    filmPreview: "Film preview",
    editorSub: "Edit · score · mux",
    shotCountN: "{n} shots",
    totalDuration: "Total {n}s",
    playFilm: "Play film",
    bgm: "Background score",
    playing: "Playing",
    clickPreview: "Click to preview",
    moveUp: "Move up",
    moveDown: "Move down",
    timelineDirty: "Timeline edited ({n} shots)",
    undo: "Undo",
    saveToProject: "Save to project",
    reEdit: "Re-edit",
    reEditFailed: "Re-edit failed; previous edit kept",
    reEditFailedWith: "Re-edit failed; previous edit kept:{error}",
    waitVideos: "Waiting for video...",
    editing: "Editing...",
    unknownShort: "Unknown error",
    characterAssetsSub: "Character assets · multi-view",
    dnaPartial: "Extracted {filled}/{total} dims; missing: {missing}",
    dnaComplete: "All {n} DNA dims extracted",
    reextractDnaTitle: "Re-extract DNA — vision re-runs 8 dims, no character regen (~5-10s)",
    reextract: "Re-extract",
    reextracting: "Re-extracting",
    regenCharTitle: "Regenerate this character image (this one only)",
    threeView: "{name} turnaround",
    threeViewTitle: "{name} — turnaround",
    waitWriter: "Waiting for writer...",
    designingCharacters: "Designing characters...",
    dnaFailedPrefix: "DNA re-extract failed: {error}",
  },
  polishUi: {
    styleLiterary: "Literary",
    styleLiteraryHint: "Image · space",
    styleCommercial: "Commercial",
    styleCommercialHint: "Payoff · pace",
    styleThriller: "Thriller",
    styleThrillerHint: "Info gap · tension",
    styleComedy: "Comedy",
    styleComedyHint: "Contrast · lightness",
    styleDocumentary: "Documentary",
    styleDocumentaryHint: "Objective · restrained",
    stylePoetic: "Poetic",
    stylePoeticHint: "Rhythm · symbol",
    intensityLight: "Light",
    intensityLightHint: "Wording only",
    intensityModerate: "Moderate",
    intensityModerateHint: "Reorder sentences",
    intensityHeavy: "Heavy",
    intensityHeavyHint: "May rewrite paragraphs",
    projectScript: "Project script",
    billingProRequired: "Pro polish (industry audit · deepseek-v4-pro) requires the creator / pro plan",
    billingUpgradeRequired: "This feature requires a plan upgrade",
    polishFailedStatus: "Polish failed ({status})",
    stoppedHint: "Stopped · change settings and click “Start polish” again",
    networkError: "Network error",
    libNamePro: "Pro audit",
    libNameBasic: "Polish",
    libNameDraft: "Polished draft {date}",
    saveFailedStatus: "Save failed ({status})",
    savedToLibMsg: "Saved to library · reuse it in a new project later",
    saveFailed: "Save failed",
    saveToProjectReady: "Written back · AIGC readiness {n}",
    saveToProjectOk: "Written back · still there next time you open",
    writeFailedStatus: "Write failed ({status})",
    writeFailed: "Write failed",
    subtitle: "Keep plot & structure · Basic light polish / Pro adds industry audit",
    importedFrom: "· Imported from “{name}”",
    historyTitle: "Last 10 polish runs on this project; restore any version",
    historyBtn: "History ({n})",
    resetTitle: "Clear all inputs",
    modeLabel: "Polish tier",
    basicHint: "Quick wording pass · no structure change · small edits and style swaps",
    proLabel: "Pro · Industry",
    proHint: "McKee three-act + drama pacing + AIGC readiness · full diagnosis sheet",
    styleLabel: "Target style",
    styleOptional: "(optional; leave unset to keep original)",
    keepOriginal: "Keep original style",
    intensityLabel: "Polish intensity",
    focusLabel: "Special requests",
    optional: "(optional)",
    focusPlaceholder: "e.g. “more visual” / “third person → first person” / “more subtext”",
    original: "Original",
    clear: "Clear",
    sourcePlaceholder: "Paste the script here (at least 20 characters)…\n\nSupported:\n  · Plain story / outline\n  · Board format with “Shot N / Scene / Dialogue” tags\n  · McKee three-act\n\nPolish keeps all structure tags and only rewrites the prose.",
    sourceFromProject: "Source: project import",
    sourceFromManual: "Source: pasted",
    stopTitle: "Stop this polish (change settings and start again)",
    stopDiagnosing: "Stop · diagnosing…",
    stopPolishing: "Stop · polishing…",
    runPro: "Pro polish + audit",
    runBasic: "Start polish",
    resultLabel: "Polish result",
    writebackTitle: "Write back to “{name}” script asset (append polishHistory; does not overwrite shots)",
    writing: "Writing",
    writtenBack: "Written back",
    failed: "Failed",
    writebackProject: "Write to project",
    copyTitle: "Copy full text",
    copied: "Copied",
    copy: "Copy",
    downloadTxtTitle: "Download polished script .txt",
    exportMdTitle: "Export Markdown audit (includes Pro diagnosis) for Feishu / Notion",
    exportDocTitle: "Export Word .doc (opens in Word / WPS / Pages)",
    saveLibTitle: "Save to my global library; reuse as a reference script in new projects",
    savingShort: "Saving…",
    savedShort: "Saved",
    saveToLib: "Save to library",
    replaceSourceTitle: "Put the polish result back into the left source box",
    replaceSource: "Replace source",
    goUpgrade: "Upgrade →",
    upgradeHint: "Free / starter can use “Quick polish” (Basic) without upgrading",
    checkApiKey: "Check OPENAI_API_KEY, or try again later",
    loadingPro: "Running industry audit, usually 60–180 seconds…",
    loadingBasic: "Polishing, usually 15–40 seconds…",
    loadingProHint: "Pro also produces Hook / three-act / dialogue / character anchors / lighting / AIGC readiness — 6 reports",
    viewingHistory: "Viewing a history version ·",
    gotIt: "Got it",
    gotItTitle: "Dismiss this hint; keep the current view",
    degradedHint: "Model JSON was malformed (often unescaped line breaks). Fallback extract applied. If the body is misaligned, click “Start polish” again or split the source into shorter paragraphs.",
    changeSummary: "Change highlights",
    notesLabel: "Edits ({n})",
    diffViewLabel: "Original vs polish · compare",
    fullViewLabel: "Full polished text",
    viewFullTitle: "Show the full polished text as one block",
    viewFull: "Block",
    viewDiffTitle: "Side-by-side original / polish, highlight changed lines",
    viewDiff: "Diff",
    searching: "Finding:",
    matchCount: "{n} matches",
    clearHighlight: "Clear",
    industryAudit: "Industry audit · Industry Audit",
    noAuditHint: "No complete audit this run. Try Pro again, or switch to Basic for a quick pass.",
    emptyHint: "Paste source on the left → pick style / intensity → “Start polish”",
    emptySubhint: "Results keep paragraph and board structure and only polish the prose. Good as a “polish first, then pipeline” two-step.",
    footerTips: "Tips: Polish does not change plot or character names. Pro also emits an industry audit covering Hook / three-act / dialogue / character identity anchors / scene lighting / AIGC readiness. To polish a generated project script,",
    goProjects: "go to Projects",
    footerTipsTail: "and click “Polish” to come back here.",
    bookTitle: "“{title}”",
    synopsisPrefix: "Synopsis:",
    genrePrefix: "Genre:",
    actSuffix: " · Act {n}",
    tagScene: "[Scene]",
    tagChars: "[Cast]",
    tagAction: "[Action]",
    tagEmotion: "[Emotion]",
    tagDialogue: "[Dialogue]",
    changeRate: "Change rate",
    totalLinesBefore: "Total ",
    totalLinesAfter: " lines",
    polishedAfter: "Polished",
    noDiff: "Both sides are identical — nothing to show",
    readinessGreen: "Pipeline ready · send to Director",
    readinessAmber: "Mostly ready · one more pass recommended",
    readinessRed: "Not ready · run a heavy polish first",
    latestPolish: "Latest polish",
    proIndustry: "Pro · industry audit",
    notesCount: "{n} edits",
    collapseAuditTitle: "Collapse audit",
    expandAuditTitle: "Expand full audit",
    collapse: "Collapse",
    viewAudit: "View audit",
    polishAgainTitle: "Polish again in Polish Studio",
    polishAgain: "Polish again",
    searchInResult: "Highlight this in the polished body",
    addToFocusTitle: "Add to next-round “special requests” so the LLM focuses on it",
    aigcReadiness: "AIGC pipeline readiness",
    stylePortrait: "Style profile",
    fieldGenre: "Genre",
    fieldTone: "Tone",
    fieldRhythm: "Pace",
    fieldArt: "Art",
    hookTitle: "First 3s Hook",
    hookWeak: "Weak",
    hookOk: "OK",
    hookStrong: "Strong",
    hookStrength: "Strength: {label}",
    actTitle: "Three-act · Save the Cat beats",
    beatInciting: "Inciting incident",
    beatMidpoint: "Midpoint turn",
    beatClimax: "Climax",
    beatResolution: "Resolution",
    missingBeats: "Missing beats ({n})",
    missingBeatsHint: "· add to next-round focus",
    fillBeat: "Add {beat}",
    dialogueTitle: "Dialogue · anti on-the-nose & visualize emotion",
    onTheNose: "On-the-nose (prefer subtext) · {n}",
    abstractEmotion: "Abstract emotion (prefer picture) · {n}",
    charAnchorsTitle: "Character identity anchors · Cameo/Seedance align",
    faceLock: "Face",
    speechStyle: "Voice",
    arc: "Arc",
    lightingTitle: "Scene lighting · Prompt-ready",
    colLightDir: "Dir",
    colQuality: "Quality",
    colColorTemp: "Temp",
    colMood: "Mood",
    continuityTitle: "Cross-shot continuity hooks · Keyframes join",
    catPacing: "Pacing",
    catDialogue: "Dialogue",
    catStructure: "Structure",
    catCharacter: "Character",
    catAigc: "AIGC",
    catOther: "Other",
    issuesTitle: "Issues ({n})",
    historyAria: "Polish history",
    historyHeading: "Polish history · last {n}",
    maxKeep: "· keep at most 10",
    trendTitle: "AIGC readiness {from} → {to} ({n} runs)",
    historyEmpty: "No history yet",
    historyEmptyHint: "After a polish, click “Write to project” and versions appear here to review / restore.",
    view: "View",
    footerViewHint: "loads this polish into the right-hand result ·",
    footerReplaceHint: "uses this polish as the new source and iterate from it",
    noSummary: "(no summary)",
    charsNotes: "{chars} chars · {n} edits",
    viewTitle: "Load this polish into the right-hand result",
  },
  dashPages: {
    imagesOnly: "Images only",
    imageTooLargeMb: "Image too large ({n}MB max)",
    uploadNetwork: "Upload failed, check your network",
    urlMustHttp: "URL must start with http(s)://",
    urlFetchFailed: "Could not fetch URL",
    urlFetchNetwork: "Could not fetch URL, check your network",
    uploadFile: "Upload file",
    useUrl: "Use URL",
    fetchUrl: "Fetch",
    clickOrUrl: "Click to upload or use a URL",
    clickOrDropOrUrl: "Click / drop an image or use a URL",
    dropToUpload: "Drop to upload",
    clear: "Clear",
    remove: "Remove",
    addClip: "Add clip",
    clipUrlInvalid: "Clip URL must be http(s) or an in-site serve-file path",
    composeFailedHttp: "Compose failed (HTTP {status})",
    composeNetwork: "Network error, compose failed",
    musicUrlPh: "Music URL (optional, http(s) or in-site serve-file)",
    musicDroppedHint: "⚠ Music was skipped (bad URL format or over 64MB) — film has no BGM; everything else is fine.",
    generateFailed: "Generation failed",
    generateFailedHttp: "Generation failed (HTTP {status})",
    generateFailedStatus: "Generation failed ({status})",
    generateNetwork: "Network error, generation failed",
    generateOk: "Generated!",
    generateTimeout: "Generation timed out (no response for over 6 minutes).",
    networkError: "Network error",
    networkAbnormal: "Network error",
    saveFailed: "Save failed",
    saveCharacter: "Save character",
    charName: "Name",
    charNamePh: "e.g. Qingfeng Swordsman",
    charDesc: "Description",
    charDescPh: "Background, personality, story…",
    charAppearance: "Appearance",
    charAppearancePh: "Hair, costume, build, face…",
    charStyleKw: "Style keywords",
    charStyleKwPh: "e.g. period, cyberpunk, ink, photoreal",
    visualTags: "Visual tags",
    tagPh: "Type a tag and press Enter",
    refImageUrl: "Reference image URL",
    imageUrlPh: "Paste an image URL and press Enter",
    autoFillNeedImage: "Add a reference image first, then auto-recognize",
    recognizeFailed: "Recognize failed ({status})",
    genderMale: "male",
    genderFemale: "female",
    skinToneOf: "{tone} skin",
    temperamentPrefix: "Presence: {v}",
    costumePrefix: "Costume: {v}",
    markPrefix: "Mark: {v}",
    recognizedHigh: "✓ Recognized (high confidence). Empty fields filled; existing text was kept.",
    recognizedLow: "⚠ Recognized (low confidence, many fields unspecified). Please fill in by hand.",
    nameRequired: "Please enter a character name",
    autoFillTitle: "Use GPT-4o Vision on the first reference image (gender / age / skin / build / look / costume / presence)",
    recognizing: "Recognizing…",
    recognizedRedo: "Recognized (click again to redo)",
    autoFillFromImage: "Auto-recognize 6 dims from image",
    autoFillHint: "Only fills empty fields; never overwrites what you wrote",
    appearanceTraits: "Look",
    usedNTimes: "Used {n} times",
    usedNShort: "×{n}",
    profileSection: "Dossier · turnaround / bio / voice",
    autoBio: "Auto bio",
    boundVoice: "Bound voice",
    voiceDefault: " · default",
    turnaroundTitle: "Turnaround sheets",
    promptReady: "Prompt ready",
    noImageYet: "No image yet",
    noProfileYet: "No dossier yet. “Generate dossier” builds bio + voice + turnaround prompts from the look (instant, no cost). Need real images? Click “Generate turnaround”.",
    generateProfile: "Generate dossier",
    refreshProfile: "Refresh dossier",
    generateTurnaround: "Generate turnaround",
    generateTurnaroundTitle: "Render each view (needs an image engine; may incur cost)",
    turnaroundNoEngine: "No image engine configured, or every view failed. Prompt dossier is ready — retry after the engine is set.",
    copiedClipboard: "Copied to clipboard",
    useCharacterCopy: "Use character (copy prompt)",
    copyName: "[Name] ",
    copyDesc: "[Description] ",
    copyLook: "[Look] ",
    copyStyle: "[Style] ",
    copyTags: "[Tags] ",
    deleteConfirm: "Delete this character?",
    pageSubtitle: "Cross-project character assets · {n} total",
    searchChars: "Search name, tags, style…",
    noMatch: "No matching characters",
    noChars: "No characters yet",
    emptyHint: "Click “Save character” to add your first asset",
    viewDetails: "View details",
    deleteCharacter: "Delete character",
    comicTitle: "Comic to video · Panel desk",
    comicSubtitle: "Upload a comic page → projection detects each panel (best on strips / regular grids). Then add motion per panel → stitch a motion comic (next).",
    comicImage: "Comic page",
    needComicImage: "Upload a comic page first",
    panelFailedHttp: "Panel detect failed (HTTP {status})",
    panelNetwork: "Network error, panel detect failed",
    panelsDetected: "Found {n} panels",
    detecting: "Detecting…",
    autoDetect: "Auto-detect panels",
    panelResult: "Panel result",
    panelFailed: "Panel detect failed",
    colPanel: "Panel",
    colRowCol: "Row/col",
    colSize: "W×H",
    noPanels: "No panels found.",
    cropFailedHttp: "Crop failed (HTTP {status})",
    cropNetwork: "Network error, crop failed",
    cropNoneHint: "No panels cropped (irregular layout; projection cannot cut it)",
    cropNone: "No panels cropped",
    croppedN: "Cropped {n} panels",
    cropping: "Cropping…",
    cropPanels: "Crop panel images",
    croppedList: "Panel images ({n}) — download each, or send for motion:",
    panelAlt: "Panel {n}",
    panelN: "Panel {n}",
    downloadPanel: "Download this panel",
    sendToU2v: "Make I2V from this panel",
    motionFx: "Motion",
    comicFlowHint: "✦ Flow: detect → crop (this page) → I2V motion per panel → paste real clips below **in reading order** to stitch a motion comic.",
    dramaTitle: "Stitch motion comic · real clips in panel order",
    dramaHint: "Paste each panel’s I2V film URL **in reading order** (≥2 clips). Optional music. Clips should share codec/resolution (same provider usually does); otherwise the stitch may fail.",
    clipUrlPh: "Panel N motion-clip URL (http(s) or in-site serve-file)",
    needTwoClips: "Need at least two clips to stitch a motion comic",
    dramaDoneNoMusic: "Motion comic composed (music skipped)",
    dramaDone: "Motion comic composed",
    stitching: "Stitching…",
    composeDrama: "Stitch motion comic ({n} clips)",
    dramaReady: "Motion comic ready",
    openDownloadDrama: "Open / download motion comic",
    comicEmpty: "Upload a comic, then “Auto-detect panels” — boxes overlay the left image; details list here.",
    mvTitle: "MV beat-plan desk",
    mvSubtitle: "Give music duration + BPM; AI builds a **beat-locked shot timeline** (chorus densifies, last shot hugs the end). Then picture each shot → beat-cut assemble on the existing pipeline (next).",
    musicDurationSec: "Music duration (sec)",
    bpmLabel: "BPM (beats per minute)",
    beatsPerShot: "Beats per shot",
    beatsHint: "Smaller = choppier; chorus auto-halves to densify",
    planning: "Planning…",
    genTimeline: "Generate beat timeline",
    planFailed: "Plan failed",
    planFailedHttp: "Plan failed (HTTP {status})",
    planNetwork: "Network error, plan failed",
    plannedShots: "Planned {n} beat-locked shots",
    noPlannedShots: "No beat-locked shots to plan",
    planEmptyHint: "Try a lower BPM or beats-per-shot, or a longer track.",
    timelineAria: "Beat-locked shot timeline",
    shotStripTitle: "Shot {n} · {start}–{end}s · {sec}",
    colShot: "Shot",
    colStart: "Start (s)",
    colEnd: "End (s)",
    colDur: "Dur (s)",
    colSection: "Section",
    colOnBeat: "On beat",
    mvSec_chorus: "Chorus",
    mvSec_verse: "Verse",
    mvSec_bridge: "Bridge",
    mvSec_intro: "Intro",
    mvSec_outro: "Outro",
    mvSec_unknown: "—",
    composeTitle: "Compose · picture each shot",
    composeSourcesLead: "Two picture sources (**real clips** win if present):",
    composeRealClips: "Real video clips",
    composeRealClipsDesc: " — paste video URLs (from I2V films or your own). Each clip is hard-cut to the beat window.",
    composeStills: "Still motion",
    composeStillsDesc: " — upload stills; each shot gets ken-burns then a hard cut.",
    composeSourcesTail: "Not enough? They loop. Music is optional.",
    realClipsLabel: "Real video clips (preferred · each beat-cut)",
    videoClipUrlPh: "Video clip URL (http(s) or in-site serve-file)",
    pictureAlt: "Still {n}",
    uploadPictures: "Upload stills",
    needTimeline: "Generate a beat timeline first",
    needPicturesOrClips: "Upload stills, or add real video clips",
    fileTooLargeSkip: "{name} is over 10MB, skipped",
    fileUploadFailed: "{name} upload failed",
    fileUploadNetwork: "{name} upload failed, check your network",
    composingWait: "Composing… (one render per shot, hang on)",
    genMvClips: "Make MV ({clips} real clips × {shots} shots)",
    genMvStills: "Make MV ({pics} stills × {shots} shots)",
    mvDoneNoMusic: "MV composed (music skipped)",
    mvDone: "MV composed",
    mvReady: "MV ready",
    mvShortHint: "⚠ Film is {actual}s, shorter than the planned {planned}s — a clip was shorter than its shot window, so the real clip length was used (to hug the beat, make each clip ≥ its shot duration).",
    openDownloadMv: "Open / download MV",
    mvClipHint: "✦ Real clips work best when each is ≥ its shot window (shorter clips shorten the film). Clips can come from I2V films or your own footage.",
    mvEmpty: "Fill duration and BPM, then “Generate beat timeline” — results show here.",
    u2vTitle: "Image to video (I2V)",
    u2vSubtitle: "Upload one image and a short motion line — AI returns 5–15s video (Minimax / Kling / Vidu by duration). Standalone; not on the project pipeline.",
    inputImage: "Input image",
    needImageAndPrompt: "Upload an image and write a short description first",
    tailFrameOptional: "Tail frame (optional · first/last-frame fusion)",
    dropTail: "Drop to upload tail frame",
    clickOrDropTail: "Click / drop a tail frame · Kling fills the in-between",
    flfModeHint: "✦ Mode: first/last-frame fusion · Engine: Kling Master (falls back to Minimax single-image)",
    describeMotion: "Describe the motion",
    motionPlaceholder: "e.g. character slowly looks up, wind in hair, background soft-focus",
    duration: "Duration",
    durationEngineHint: "{label} · backend uses {engine}",
    generatingPct: "Generating {pct}% · {time}",
    generateVideo: "Generate video",
    resultPreview: "Result preview",
    waited: "Waited {time}",
    engineGenerating: "{engine} is generating — usually 1–3 minutes",
    progressEstimateHint: "Progress is a time estimate; snaps to 100% when the film is ready",
    resultsHere: "The result will appear here",
    downloadMp4: "Download MP4",
    addToMvTitle: "Add this video as a real clip on the MV beat desk",
    addToMv: "Add to MV clips",
    svTitle: "Storyboard Desk",
    svEyebrow: "CINESPARK · three-act short",
    svIdeaPh: "Idea, e.g. a cyberpunk detective finds a fate-changing clue in the rain",
    svIdeaMin: "Idea needs at least 5 characters",
    svDurationLock: "Duration lock",
    svStylePh: "Look (optional)",
    svLangTitle: "Production language: dialogue / title copy (voice follows)",
    svLangAuto: "Language: auto",
    langZh: "Chinese",
    langJa: "Japanese",
    svGenerating: "Planning boards…",
    svGenerate: "Generate board plan",
    svVocab: "15s camera vocab",
    svApplyMove: "Apply to {phase} shot",
    svNeedPlan: "Generate a board plan first",
    svEmptyTitle: "Enter an idea, one-click three-act boards",
    svEmptySub: "HOOK · BODY · CLIMAX",
    svTimeline: "{n}s timeline boards",
    svExpandPrompt: "Expand AI Prompt",
    svPreview: "Preview",
    svCopyPrompt: "Copy Prompt",
    previewFailed: "Preview failed",
    svParams: "Short-video params",
    svParamsLocked: "Tune after generate",
    svMotion: "Motion",
    speedSlow: "Slow",
    speedNormal: "Normal",
    speedFast: "Fast",
    svLook: "Look enhance",
    svInterp: "Interp",
    svUpscale: "Upscale",
    svOutput: "Output",
    svRhythmMix: "Rhythm mix",
    svSendCreate: "Create from this plan",
    svExport: "Export boards",
    svTotalDur: "Total {n}.0s",
    svShotCount: "{n} shots",
    svRhythmStat: "Rhythm {label}",
    svMdMeta: "Idea: {idea} · Duration: {dur}s · Rhythm: {rhythm}",
    svMdShot: "Size: {size} · Move: {move} (Motion {motion})",
    svMdFrame: "Frame: {frame}",
    svSeedHead: "[15s three-act boards]",
    svSeedMove: " ({move})",
    svRhythmDesc_suspense: "Slow then snap",
    svRhythmDesc_blockbuster: "Fast cuts",
    svRhythmDesc_emotion: "Long slow push",
    siSubtitle: "Paste a novel / script → auto-split episodes + pick a narration mode → send each episode to the workshop",
    siReading: "📖 Reading…",
    siAskBook: "📖 Ask the book (cast / setting / highlights)",
    siSampled: "Long text sampled in three spans (open / mid / close)",
    siPeople: "👤 Cast ({n})",
    siSettings: "🗺 Setting ({n})",
    siHighlights: "✨ Highlights ({n})",
    analyzeFailed: "Analyze failed",
    siBatchTitle: "Season batch · {mode}",
    siBatchSent: "Sent {done} / {total} episodes",
    siSendNext: "Send next (EP{n} {title})",
    siBatchDone: "✓ Whole season sent to create",
    siPastePh: "Paste a whole novel or long script…\n\n· Markers like “Chapter N / ## title” → split on markers\n· No markers → auto-split by target length",
    siNarrationMode: "Narration mode",
    siPlusTrack: "+ narration track",
    siTargetChars: "Target chars per episode (optional; used when there are no chapter markers)",
    siTargetPh: "Default 2000",
    siSmartSplit: "Smart split",
    siCharsTotal: "{n} chars",
    siCharsN: "{n} chars",
    siNoEpisodes: "Nothing to split",
    siSplitSummary: "Split {n} episodes · Narration: {mode}",
    siSeasonNarrate: "Season-parallel narration tracks",
    siSeasonBatch: "Season batch create",
    siNarrateReport: "Narration plan · concurrency {n}",
    siNarrateOk: "OK {ok}/{total} episodes",
    siNarrateFail: " · failed {n}",
    siSegMeta: "{n} lines · ~{sec}s · {voice}",
    siAudioOut: " · audio out {n}",
    siPlanReady: " · plan ready (TTS not configured)",
    siNeedTtsBefore: "📌 Narration plans are orchestrated in parallel; set",
    siNeedTtsAfter: "to actually render mp3.",
    siVoiceover: "VO {n} lines · ~{sec}s · {voice}",
    siCreateFromEp: "Create from this episode",
    siSeedPrefix: "[Narration:{mode}]",
    siMode_dialogue: "Dialogue-driven",
    siMode_first_person: "First-person VO",
    siMode_narrator: "Third-person narrator",
    siModeDesc_dialogue: "Story moves on dialogue; VO stays minimal",
    siModeDesc_first_person: "Lead narrates in first person between scenes",
    siModeDesc_narrator: "Omniscient VO; good for fast shorts",
    ecTitle: "Conversational edit desk",
    ecSubtitle: "Tell the finished film what to change in plain words → parse into edit intents, then confirm to call recompose / regenerate-shot.",
    ecSafety: "Parse is read-only; destructive ops (drop shot / re-voice) need a second confirm.",
    ecPlaceholder: "e.g. drop shot 3, switch to vertical beat captions, pick up the pace",
    ecEx1: "Drop shot 3, switch to vertical beat captions",
    ecEx2: "Pick up the pace, fit Douyin",
    ecEx3: "Darken shot 2 a bit",
    ecEx4: "Re-voice",
    ecParseHint: "⌘/Ctrl + Enter to parse · {n}/2000",
    parse: "Parse",
    parsing: "Parsing…",
    parseFailed: "Parse failed",
    parseFailedHttp: "Parse failed (HTTP {status})",
    parseNetwork: "Network error, parse failed",
    parseBadBody: "Parse returned a bad body, please retry",
    ecNeedText: "Say what you want to change first",
    ecNeedProject: "Pick a project to edit first",
    ecUnmatched: "Didn't catch that — try another phrasing (e.g. “drop shot 3”, “vertical beat captions”).",
    ecWillDo: "I will apply {n} change(s):",
    ecDestructiveWarn: "Includes drop-shot / regen / re-voice — **paid or irreversible**. Click confirm twice to run.",
    ecRegenLead: "· Shot {list} will ",
    ecRegenBold1: "regen the picture",
    ecRegenMid: " — serial per shot; each is a real paid video gen. Your note is ",
    ecRegenBold2: "merged into the original description",
    ecRegenTail: " (not replaced); the rest stays.",
    listSep: ", ",
    ecRegenRunning: "Regenerating…",
    ecRegenOk: "Regenerated ✓",
    ecRegenFail: "Regen failed",
    ecRegenShotN: "Regenerating shot {n}…",
    ecConfirmRegen: "Confirm regen {n} shot(s) (costs credits)",
    ecRegenThese: "Regen these {n} shot(s)",
    ecShotLog: "Shot {n}: {msg}",
    ecPaceHint: "· “A bit {pace}” needs a full re-run (recompose does not change pace). Not run here.",
    paceFast: "faster",
    paceSlow: "slower",
    ecWhichProject: "Which project's film",
    ecSelectProject: "— Select a project —",
    ecNoProjects: "No projects yet — make one in the workshop first.",
    recomposing: "Recomposing…",
    ecConfirmWait: "Confirm destructive? Hang on…",
    ecConfirmIrreversible: "Confirm (includes irreversible ops)",
    ecExecWillConfirm: "Run (will confirm again)",
    ecConfirmExec: "Confirm & run",
    ecCooldown: "Hang on, confirm will be ready…",
    ecArmHint: "This includes irreversible ops — click confirm once more; or",
    ecNoRecompose: "This instruction has no composition-level edit that can run here (see the pointers above).",
    recomposeFailedHttp: "Recompose failed (HTTP {status})",
    recomposeNetwork: "Network error, recompose failed",
    recomposeOk: "Film recomposed",
    recomposeDone: "Recompose done",
    openDownloadFilm: "Open / download film",
    ecEmpty: "Say what to change, or tap an example — parsed intents show here as a confirm card.",
  },
  dashMore: {
    seriesSubtitle: "Series · cross-episode consistency · one-click batch film",
    newSeries: "New series",
    noSeries: "No series yet.",
    noSeriesHint: "Set any project as a series anchor; later episodes inherit its cast, look, and face-lock so the season stays consistent.",
    seriesEpMeta: "{n} eps · done {done}/{total}",
    newSeriesTitle: "New series",
    seriesNameLabel: "Series name",
    seriesNamePlaceholder: "e.g. Cold Flame Cage",
    anchorLabel: "Anchor project (optional — sequels inherit its leads / look for cross-episode consistency)",
    noAnchor: "No anchor (start from scratch, each episode set independently)",
    aiSplitMode: "AI episode split",
    manualMode: "Manual per episode",
    premiseLabel: "One-line series premise",
    premisePlaceholder: "e.g. A fighter trapped in an iron cage, each episode challenging a keeper, the final goal to expose the cage master's plot.",
    episodeCountLabel: "Episodes",
    aiSplitBtn: "AI split",
    epOutlines: "Episode outlines (tweak per episode)",
    addEpisode: "Add episode",
    epTitlePlaceholder: "Episode title (optional)",
    epPremisePlaceholder: "Episode plot outline",
    addFirstEpisode: "+ Add first episode",
    autoGenAfterCreate: "Batch-generate immediately after create",
    createSeries: "Create series",
    createSeriesWithN: "Create series ({n} eps)",
    defaultSeriesTitle: "My series",
    splitFailed: "Split failed {status}",
    createFailedStatus: "Create failed {status}",
    splitShortWarn: "AI only split {n} episodes (target {target}). Add an episode below, or shorten the premise and split again.",
    templatesSubtitle: "Turn a finished project into a reusable template — look · multi-ref · pacing, then start a new film in one click.",
    searchTemplates: "Search look / genre / tags…",
    search: "Search",
    favOnly: "Favorites only",
    noTemplates: "No templates yet — in a project's Monitor tab, save a finished project as a template to list it.",
    qualityN: "Quality {n}",
    favorite: "Favorite",
    rateNStars: "Rate {n} stars",
    noRatings: "No ratings yet",
    usedNTimes: "Used {n} times",
    useTemplate: "Start from this template",
    styleRole: "Look",
    propRole: "Prop",
    motionRole: "Camera",
    voiceRole: "Voice",
    teamWorkspace: "Team workspace",
    teamWorkspaceDesc: "Owner manages the team credit pool · allocate per member",
    creditsPool: "Team credit pool",
    creditsUnit: "credits",
    used: "Used",
    allocatedUnused: "Allocated unused",
    allocatedUsed: "Allocated {allocated} · used {used}",
    overBy: "Over by {n}",
    remainingAlloc: "Left to allocate {n}",
    memberEmailPlaceholder: "Member email / ID",
    member: "Member",
    admin: "Admin",
    owner: "Owner",
    add: "Add",
    noMembers: "No team members yet — add one to allocate credits",
    colMember: "Member",
    colRole: "Role",
    colQuota: "Quota",
    colLeft: "Left",
    remove: "Remove",
    inviteMembers: "Invite members to the team",
    inviteEmailPlaceholder: "Invitee email",
    initialQuota: "Initial quota after accept",
    quota: "Quota",
    genInviteLink: "Create invite link",
    copyLink: "Copy link",
    inviteHint: "The invitee must sign in with their own existing account and open the link (the system does not create accounts); after accept they join with that real account.",
    persistHint: "Members are billed against their quota in real time (generation cost counts toward each member's used; insufficient balance is rejected). Quota allocation and real multi-user invites are persisted.",
    invalidQuota: "Invalid quota",
    memberExists: "Member already exists",
    cannotRemove: "Cannot remove this member",
    saveFailed: "Save failed",
    savedOk: "Saved",
    enterInviteEmail: "Enter an invite email",
    genFailed: "Failed",
    inviteCreated: "Invite created",
    linkCopied: "Link copied",
    invitePending: "Pending",
    inviteAccepted: "Joined",
    inviteRevoked: "Revoked",
    inviteExpired: "Expired",
    inviteQuotaN: "{n} quota",
    missingToken: "Invite token missing from the link",
    acceptFailed: "Accept failed",
    acceptTitle: "Accept team invite",
    acceptDesc: "Join their team workspace with your own account and share the credit quota.",
    joinedTeam: "Joined the team",
    joinedMeta: "Initial quota {n} · role {role}",
    goTeam: "Go to team workspace →",
    loginFirst: "Sign in to your account first",
    loginFirstHint: "The system will not create an account for you. After sign-in, return to this link to accept.",
    acceptInvite: "Accept invite",
    missingCredential: "Invite credential missing from the link",
    jobsSubtitle: "Pipeline progress and dead letters are visible; failed jobs can be requeued — resume only fills missing stages, already-produced artifacts are not regenerated.",
    queueOffLead: "Queue mode is off (",
    queueOffTail: ") — create runs inline in the request; requeued jobs wait until queue mode is on.",
    noJobs: "No job records yet. In queue mode, ROLL in the workshop creates a job.",
    stagePrefix: "Stage:",
    attemptsN: "{n} attempts",
    viewProject: "View project →",
    unknownError: "Unknown error",
    retryResume: "Requeue (resume from breakpoint)",
    queued: "Queued",
    running: "Running",
    failedDead: "Failed (dead letter)",
    stepDirector: "Director analysis",
    stepStyleBible: "Style bible",
    stepWriter: "Script",
    stepDesign: "Cast / scenes",
    stepVideo: "Shot video",
    stepFinalize: "Finalize",
    assetsSubtitle: "Digital assets from creation · {n} total",
    deleteAssetConfirm: "Delete asset “{name}”? This cannot be undone.",
    deleteFailed: "Delete failed",
    noAssets: "No assets yet",
    noAssetsOfType: "No assets of this type",
    assetsEmptyHint: "After one creation, generated characters, scenes, and storyboards are stored here automatically",
    deleteAssetTitle: "Delete asset (cannot undo)",
    music: "Music",
    finalFilm: "Final film",
    masterTitle: "Master Prompt Generator",
    masterEyebrow: "MASTER PROMPT GENERATOR · structured director-grade prompts",
    roleLabel: "Role · character setup",
    taskLabel: "Task",
    conceptLabel: "Core Concept",
    conceptPlaceholder: "Core idea / mood / hook of this film…",
    filmLookTitle: "Film LOOK · lighting reference",
    lutTitle: "Color LUT",
    movementTitle: "Director camera style",
    aspectLabel: "Aspect",
    extraLabel: "Extra params",
    optional: "Optional",
    refinedPrompt: "Refined Prompt",
    copy: "Copy",
    refinePrompt: "Refine Prompt",
    restore: "Restore",
    useToCreate: "Create with this",
    glossaryTitle: "Craft glossary",
    refineFailed: "Refine failed ({status})",
    networkError: "Network error",
    stylesSubtitle: "{n} named style presets · one-click apply to the workshop, lock the whole film's look",
    searchStyles: "Search style name / English name / keywords…",
    noStyleMatch: "No matching styles",
    recEngine: "Recommended engine",
    applied: "Applied",
    applyStyle: "Apply this style",
    genTask: "Generation",
    genDone: "Done",
    aiEngine: "AI engine",
    imageGen: "Image gen",
    noActivity: "No activity yet — after you create the first project, your real progress shows here",
    chinese: "Chinese",
    defaultStyle: "Default style: Poetic Mist",
    colorPref: "Color: Film Warm",
    teamStudio: "Team: QingFeng Studio",
    permCreatePublish: "Permission: create + publish",
    demoClip: "Sample clip",
    playWithAudio: "Play with audio",
    casesCopyrightLead: "Some card clips are from public films (e.g. Arcane / League of Legends: Arcane, © Riot Games · Fortiche · Netflix), for personal study and look reference only, ",
    casesCopyrightStrong: "non-commercial",
    casesCopyrightTail: ". Copyright belongs to the original authors. Replace with owned or licensed footage before production launch.",
    polishedNoScore: "This project was polished recently, but has no Pro check score yet",
    aigcReadiness: "AIGC readiness: {score}/100 · {label}",
    freeTier: "Free",
  },
  publicUi: {
    waitSec: "{n} sec",
    waitMinSec: "{m} min {s} sec",
    waitMin: "{n} min",
    loginRateLimited: "Too many sign-in attempts. Try again in {n} (the password may be correct — the lockout window rejects even a correct password).",
    loginRateLimitedSoon: "Too many sign-in attempts. Try again shortly (the password may be correct — the lockout window rejects even a correct password).",
    badCredentials: "Email or password is incorrect",
    cooldownHint: "This is brute-force rate limiting, not a wrong password. The lockout window is fixed; retrying neither extends nor shortens it.",
    retryAfter: "Retry in {n}",
    licenseView: "View only",
    licenseRemix: "Remix allowed",
    licenseCommercial: "Commercial use",
    reuseMessage: "I'd like to reuse this character in my project",
    alreadyInLibrary: "This character is already in your library — pick it when you create",
    importedToLibrary: "Imported into your character library! Available when you create a new project",
    grantPending: "Request submitted — waiting for the author",
    grantRecorded: "Request recorded",
    back: "Back",
    marketTitle: "Cameo IP Market",
    marketIntro: "Browse characters creators made public. Remix/commercial ones can be reused directly; view-only needs the author's grant.",
    loadingMarket: "Loading market…",
    marketEmpty: "No public character IPs yet.",
    perUse: "¥{n}/use",
    reusedN: "· reused {n}",
    importToLibrary: "Import to library",
    requestGrant: "Request grant",
    imagesOnly: "Images only",
    imageTooLargeMb: "Image too large ({n}MB max)",
    visionDisabled: "Vision service is not enabled yet",
    cameoScoreLow: "Photo score is low ({n}). Improve it before locking the face.",
    scoreFailed: "Scoring failed",
    invalidInput: "Invalid input",
    connectingTeam: "Connecting the AI team…",
    createFailed: "Creation failed",
    streamUnreadable: "Could not read the response stream",
    createDone: "Creation complete!",
    createRetry: "Creation failed, please retry",
    ideaPlaceholderLong: "Two ways to start:\n\nOption 1: a short idea (50–500 characters)\ne.g. a love story about a time traveler; the lead is a physicist...\n\nOption 2: a full script (paste it)\nStandard screenplay format is fine: scene headers, dialogue, △ visual notes — the system parses and adapts faithfully.\n\nType @ to cite character / scene / style assets",
    charCount: "{n} chars",
    scriptMode: "(script mode)",
    ideaHint: "Short idea 50–500 chars / full script up to 100,000 chars",
    cameoFaceLabel: "Lead face reference (optional)",
    cameoLockBadge: "Cameo face lock",
    cameoLockHint: "After upload, every shot locks to the same face",
    cameoUploadHint: "Click to upload a lead-face photo (JPG / PNG, ≤10MB)",
    cameoUploadSub: "You can skip this — the system will generate a locked look",
    cameoPreviewAlt: "Lead face preview",
    cameoLocked: "✓ Lead face locked",
    cameoClearAria: "Clear lead face",
    engineFast: "Faster",
    engineQuality: "Higher quality",
    klingAi: "Kling AI",
    engineChinese: "Better Chinese",
    editStyleLabel: "Edit style",
    editStyleHint: "One line for pace and transitions; leave empty (default mid-tempo)",
    editStyleDefault: "Default mid-tempo",
    editStyleFast: "⚡ Fast / high-energy",
    editStyleSlow: "🌙 Slow / lyrical",
    editStyleFastVal: "fast high-energy",
    editStyleSlowVal: "slow lyrical",
    editStyleCustomPh: "Or custom: e.g. “Douyin beat-cut” / “Wong Kar-wai negative space” (parsed by LLM when a key is set)",
    tryIdeas: "Try these story sparks",
    createDoneTitle: "Creation complete!",
    createDoneDesc: "Your AI comic drama is ready",
    createNewWork: "Create another",
    teamCreating: "The AI team is creating for you",
    ideaCyberTitle: "Cyberpunk Detective",
    ideaCyberContent: "Neo-Tokyo, 2077. A cyber detective takes a mysterious case — a string of disappearances that hides a conspiracy.",
    ideaPalaceTitle: "Imperial Court",
    ideaPalaceContent: "At the height of the Tang, a gifted woman enters the palace, outmaneuvers the inner court, and becomes the one who steers the throne.",
    ideaWastelandTitle: "Wasteland",
    ideaWastelandContent: "After the war, survivors hunt for hope in the ruins. A mysterious signal points them toward a legendary shelter.",
    ideaMagicTitle: "Magic Academy",
    ideaMagicContent: "A first-year discovers a rare gift — and is pulled into an ancient magical war.",
    projCyberSynopsis: "Neo-Tokyo, 2077. A cyber detective takes a mysterious case...",
    projPalaceSynopsis: "At the height of the Tang, a gifted woman enters the palace and outmaneuvers the inner court...",
    projWastelandSynopsis: "After the war, survivors hunt for hope in the ruins...",
    genreAll: "All",
    genreScifi: "Sci-fi",
    genreGufeng: "Period",
    genreThriller: "Thriller",
    genreYouth: "Youth",
    genreFantasy: "Fantasy",
    genreRomance: "Romance",
    exCyberDesc: "Neo-Tokyo, 2077. A cyber detective takes a mysterious case",
    exXianxiaTitle: "Immortal Blade",
    exXianxiaDesc: "Love and feud in a cultivation world",
    exSurvivalTitle: "Last Stand",
    exSurvivalDesc: "Humanity under a zombie apocalypse",
    exCampusTitle: "Campus Days",
    exCampusDesc: "The bittersweet of high school",
    exMagicDesc: "An adventure through a world of magic",
    exRomanceTitle: "City Romance",
    exRomanceDesc: "A chance meeting in a modern city",
    metaDesc: "Your AI animation / comic-drama team — from spark to finished film",
    heroBrandLead: "Wind",
    heroBrandTrail: "Comic",
    playAria: "Play",
    previewClip: "Preview clip",
    playWithAudio: "Play with audio",
    demoName: "Alex Zhang",
    demoBio: "An AI comic-drama maker who loves creating",
    langZhCN: "Simplified Chinese",
    langZhTW: "Traditional Chinese",
    langJa: "Japanese",
    invalidInvite: "Invite is invalid",
    loadFailed: "Failed to load",
    acceptFailed: "Could not accept",
    loadingInvite: "Loading invite...",
    inviteInvalidTitle: "Invite invalid",
    inviteExpiredHint: "This invite has expired / been revoked / the project was deleted",
    backToProjects: "Back to my projects",
    expiresOn: "Expires {n}",
    neverExpires: "Never expires",
    invitedByPrefix: "Invited by",
    invitedBySuffix: "to collaborate",
    loginToAcceptHint: "Sign in first to accept the invite.",
    loginToAcceptCta: "Sign in to accept →",
    accepting: "Accepting...",
    acceptJoin: "Accept invite, join the collab",
    roleViewer: "Viewer",
    roleViewerDesc: "View script / boards / video — no edits, no comments",
    roleCommenter: "Commenter",
    roleCommenterDesc: "View + comment + @ mention members",
    roleEditor: "Editor",
    roleEditorDesc: "Full edit (storyboard / timeline / delete comments)",
    untitledWork: "Untitled work",
    synopsis: "Synopsis",
    storyboardsN: "Storyboards ({n})",
    shareFooter: "Made with AI Comic Studio · only the author can edit",
    welcomeTitle: "Welcome to the AI Comic Studio",
    welcomeSubtitle: "Start from the left toolbar; tune parameters in the right panel",
    textGen: "Text generation",
    textGenDesc: "Generate comic scripts and dialogue with AI",
    imageGen: "Image generation",
    imageGenDesc: "Generate comic scenes and character stills",
    videoGen: "Video generation",
    videoGenDesc: "Turn scenes into motion video",
    recentProjects: "Recent projects",
    projectN: "Project {n}",
    lastEditedHours: "Last edited: {n} hours ago",
    templateShare: "Shared template",
    shareLinkExpired: "This share link does not exist or has expired",
    untitledTemplate: "Untitled template",
    cloneHintOg: "Click to clone this template into your library →",
    shareLinkUnavailableTitle: "Share link unavailable · Wind Comic",
    tagsPrefix: "Tags: {n}",
    ogTemplateTitle: "{icon} {name} · Wind Comic template",
    ogTemplateDesc: "Shared a Wind Comic story template — clone it into your library in one tap. {n}",
    cloneFailed: "Clone failed",
    loadingTemplate: "Loading shared template...",
    linkUnavailable: "Link unavailable",
    templateGone: "This shared template does not exist or has expired",
    goCreateOwn: "Go create your own",
    backToWorkshop: "Back to workshop",
    clonesN: "{n} clones",
    clonedToLibrary: "Cloned into your template library",
    clonedDetail: "New template: “{name}” (id: {id}...) is in your personal library. You'll see it under Story Templates next time you create.",
    goUse: "Use it →",
    cloneToLibraryEyebrow: "Clone into your template library",
    cloneToLibraryHint: "After cloning, this template lives in your personal library — you can edit or delete it without affecting the author.",
    cloning: "Cloning…",
    cloneToMyLibrary: "Clone to my library",
    exampleIdeaLabel: "EXAMPLE IDEA",
    structureLabel: "STRUCTURE",
    recommendedLabel: "RECOMMENDED",
    styleLook: "Look",
    duration: "Duration",
    aspect: "Aspect",
    camera: "Camera",
    myWorkflow: "My workflow",
    urbanMysteryIdea: "An urban mystery short",
    savedOk: "Saved",
    saveFailedPrefix: "Save failed: {n}",
    runReal: "Live run",
    runDone: "{n} finished ✓",
    runDoneWithFails: "{n} finished (some steps failed)",
    runFailed: "Run failed",
    runFailedPrefix: "Run failed: {n}",
    studioTitle: "Agent orchestration studio",
    runRealTitle: "Run the orchestrator for real (needs an LLM key)",
    workflowNamePh: "Workflow name",
    loadSaved: "Load saved…",
    ideaPh: "Idea (fed to the AI director on a live run)",
    stepLabelPh: "Step label",
    depsHint: "Depends on (tick prerequisites):",
    noOtherSteps: "No other steps",
    emptyPalette: "Add a step from the palette above",
    validate: "Validate",
    validateOk: "Passed ✓",
    execPlan: "Execution plan (parallel within a layer)",
    layerN: "L{n}",
    runResults: "Run results",
  },
  sharedUi: {
    switchLanguage: "Switch language / Language",
    brandShort: "Qingfeng",
    skipToContent: "Skip to main content",
    footerProduct: "Product",
    footerFeatures: "Features",
    footerPricing: "Pricing",
    footerCases: "Cases",
    footerCompany: "Company",
    footerAbout: "About",
    footerCareers: "Careers",
    footerPrivacy: "Privacy",
    footerResources: "Resources",
    footerDocs: "Docs",
    footerSupport: "Support",
    exportBtn: "Export",
    toggleParams: "Toggle parameter panel",
    canvasHint: "Pick a tool from the left toolbar to start your comic drama",
    openProject: "Open project",
    sceneN: "Scene {n}",
    addScene: "Add scene",
    workshopBusyTitle: "Workshop task in progress — click to return",
    workshopBusy: "Workshop task in progress",
    genParams: "Generation params",
    promptLabel: "Prompt",
    promptPlaceholder: "Describe what you want to create...",
    styleLabel: "Style",
    styleJapanese: "Japanese manga",
    styleAmerican: "American comics",
    styleChinese: "Chinese comics",
    styleWebtoon: "Webtoon",
    sizeLabel: "Size",
    widthPh: "Width",
    heightPh: "Height",
    advanced: "Advanced",
    quality: "Quality",
    qualityDraft: "Draft",
    qualityStd: "Standard",
    qualityHigh: "High",
    generate: "Generate",
    toolText: "Text",
    toolImage: "Image",
    toolVideo: "Video",
    toolEffect: "Effects",
    toolAssets: "Assets",
    toolTextDesc: "Generate comic scripts, dialogue, and stories with AI",
    toolImageDesc: "Generate comic scenes, characters, and backgrounds",
    toolVideoDesc: "Turn comic scenes into motion video",
    toolEffectDesc: "Add visual effects and filters to comics",
    toolAssetsDesc: "Manage characters, scenes, and source assets",
    toolComingSoon: "Tool content coming soon...",
    progress: "Progress",
    somethingWentWrong: "Something went wrong",
    statusIdle: "Idle",
    statusThinking: "Thinking",
    statusWorking: "Working",
    aiDirector: "AI Director",
    aiWriter: "AI Writer",
    aiCharacterDesigner: "AI Character Designer",
    aiSceneDesigner: "AI Scene Designer",
    aiStoryboard: "AI Storyboard Artist",
    aiVideoProducer: "AI Video Producer",
    aiEditor: "AI Editor",
    aiProducer: "AI Producer",
    unknownRole: "Unknown role",
    newCharacter: "New character",
    charConsistency: "Character consistency",
    addCharacter: "Add character",
    charNamePh: "Character name",
    charDescPh: "Description (personality, background)",
    charAppearPh: "Appearance (keeps looks consistent across shots)",
    charTagsPh: "Tags (comma-separated)",
    noDescription: "No description",
    clickAboveToAdd: ", click the button above to add one",
    cameoAnalyzing: "Analyzing how well this face fits…",
    cameoScoreUnavailable: "Score unavailable ({error}); locking the face still works.",
    verdictExcellent: "Excellent fit",
    verdictGood: "Good fit",
    verdictFair: "Fair",
    verdictPoor: "Not recommended",
    cameoFit: "Cameo fit",
    dimClarity: "Clarity",
    dimLighting: "Lighting",
    dimAngle: "Angle",
    dimSize: "Size",
    continuityPending: "Continuity will report shot by shot as clips generate…",
    continuityMonitor: "Continuity monitor",
    cameoLocked: "Lead face lock",
    cameoUnusedTip: "Cameo unused this run (upload a lead face on the project page to lock IP)",
    cameoUsedTip: "{n} shots used the same lead-face reference",
    shotChain: "Shot-to-shot link",
    shotChainTip: "{n} shots visually anchored from the previous clip's last frame",
    globalAnchor: "Global style anchor",
    globalAnchorTip: "{n} shots referenced the global style anchor to resist drift",
    mentionCandidates: "Mention candidates",
    candidatesN: "{n} candidates",
    anonymous: "Anonymous",
    onlineN: "{n} online",
    youTab: "{name} (you){tab}",
    otherTab: "{name}{tab}",
    morePeople: "+{n} more",
    shotAutoRetried: "This shot triggered auto-retry",
    sceneTooltip: "Scene number · which scene in the script",
    takeTooltip: "Take count for this scene · increments by word count",
    visionDisabled: "Vision service is not enabled yet",
    cameoLowScore: "This photo scored low ({n}). Improve it and re-upload.",
    scoreFailed: "Scoring failed",
    imagesOnly: "Images only",
    imageTooLarge: "Image too large (10MB max)",
    cameoLockedOk: "Lead face locked ✓",
    cameoUnlockConfirm: "Unlock the lead face? Later shots will let Character Designer decide the look.",
    unlockFailed: "Unlock failed",
    cameoUnlocked: "Lead face unlocked",
    cameoUnlockedTitle: "Lead face unlocked",
    cameoEmptyHint: "Upload a lead photo and every shot locks to the same face — no more face-jumping between lines.",
    uploadCameo: "Upload lead face",
    cameoLockedAlt: "Locked lead face",
    cameoLockedTitle: "Lead face locked",
    cameoLockedHint: "Every shot uses this face as the lead reference; regenerating any shot stays locked.",
    replace: "Replace",
    unlock: "Unlock",
    scoreFitTitle: "Let AI score how well this face fits",
    rescore: "Rescore",
    scoreFit: "Score fit",
    readinessHigh: "Ready — you can start creating",
    readinessMid: "Mostly ready — fill the items below for a more stable run",
    readinessLow: "Fill the key items before generating",
    genReadiness: "Generation readiness",
    storyboardEditor: "Storyboard editor",
    shotMeta: "{n} shots · {sec}s total",
    addShot: "Add shot",
    preview: "Preview",
    shotDescPh: "Shot description...",
    dialoguePh: "Dialogue...",
    seconds: "sec",
    clickEditShot: "Click to edit the shot description...",
    duplicate: "Duplicate",
    noShotsYet: "No shots yet — add one above or let AI generate them",
    camCloseup: "Close-up",
    camMediumClose: "Medium close",
    camMedium: "Medium",
    camFull: "Full",
    camWide: "Wide",
    camHigh: "High angle",
    camLow: "Low angle",
    camFollow: "Follow",
    mascotWait1: "So slow... I'm falling asleep 💤",
    mascotWait2: "Progress bar: I'm trying 😭",
    mascotWait3: "You do you — I'll slack off first 🐟",
    mascotWait4: "Waiting a hundred million years... okay, one minute",
    mascotWait5: "Gonna grab coffee first ☕",
    mascotWait6: "Is this progress bar stuck? 🤔",
    mascotWait7: "Easy — good food takes time 🍚",
    mascotWait8: "Slack-off time! 🐠",
    mascotWait9: "I'll count to three — move, progress bar!",
    mascotWait10: "Hello? Progress bar? Say something?",
    mascotWork1: "Hehe, working hard~ 💪",
    mascotWork2: "Don't rush — art takes time 🎨",
    mascotWork3: "This one's got something 👀",
    mascotWork4: "The AIs are cranking it out...",
    mascotWork5: "Inspiration spike! ✨",
    mascotWork6: "Thanks, digital crew~",
    mascotDone1: "Done! Told you I could ✌️",
    mascotDone2: "Full marks for this one 💯",
    mascotDone3: "Another perfect day~ 🌟",
    mascotDone4: "That's a wrap! 👏",
    mascotDone5: "This look? Fire! 🔥",
    mascotDone6: "Perfect wrap — clocking out~",
    mascotErr1: "Uh... we crashed 🚗",
    mascotErr2: "Don't panic, let me think 🤔",
    mascotErr3: "Redo, redo — nothing happened",
    mascotErr4: "Small hiccup — stay calm!",
    mascotErr5: "I'm not taking this blame 😤",
    styleRole: "Style",
    propRole: "Prop",
    mentionHint: "Mention assets · ↑↓ select · Enter confirm · Esc close",
    atHint: "Type @ to mention character / scene / style assets",
    atHintN: "Type @ to mention character / scene / style assets ({n} available)",
    hideCompile: "Hide compiled preview",
    compilePreview: "Compiled preview",
    compiledPromptHint: "Compiled prompt (@mentions expanded — the text sent to the image engine)",
    emptyParen: "(empty)",
    unresolvedMentions: "Unresolved mentions (emitted as raw names; create them in the library first): ",
    motionRole: "Camera",
    voiceRole: "Voice",
    unsupportedFile: "Unsupported file type: {name}",
    fileOver25: "{name} is over 25MB — use a URL instead",
    readFailed: "Failed to read: {name}",
    badMediaUrl: "Could not detect media type for this URL (need image / audio / video)",
    multiRefOptional: "Multi-ref elements (optional)",
    lockByRole: "Lock consistency by role",
    refLimits: "Img {img} · Audio {aud} · Video {vid}",
    uploadFile: "Upload file",
    pasteMediaUrl: "Or paste an image/audio/video URL and press Enter",
    removeRef: "Remove reference",
    elementRole: "Element role",
    cwTitle: "Character weight cw (25–125; higher locks the face harder)",
    elementComplete: "Element completeness",
    agentWriterDesc: "Script · dialogue · world",
    agentCharDesc: "Character assets · multi-angle",
    agentSceneDesc: "Scene concept art",
    agentBoardDesc: "Boards · shot planning",
    agentVideoDesc: "Clip-by-clip video",
    agentDirectorDesc: "Global monitor · coordinate",
    agentEditorDesc: "Edit · score · composite",
    agentProducerDesc: "QA · final film",
    requestFailed: "Request failed",
    streamUnreadable: "Could not read the response stream",
    startChatWith: "Start chatting with {name}",
    agentThinking: "{name} is thinking...",
    typeMessage: "Type a message...",
    uploadImage: "Upload image",
    attachment: "Attachment",
    showThinking: "Show thinking",
    noReply: "_(No reply — backend may be missing OPENAI_API_KEY)_",
    clearChatConfirm: "Clear the local chat with “{name}”? (server history is unchanged)",
    aiAssistantSidebar: "AI assistant sidebar",
    aiAssistant: "AI assistant",
    chatWithContext: "Project context · chat with {name}",
    clearLocalView: "Clear local view (does not affect server history)",
    chatEmptyHint: "Replies here use this project's script / cast / board context. Try:",
    chatExample1: "\"Make shot 3's dialogue more restrained\"",
    chatExample2: "\"How should Lin Xiaoman's costume be set?\"",
    enterToSend: "Enter to send · Shift+Enter for a new line",
    chatContextHint: "The server keeps the last 10 turns as context · each agent is a separate thread",
    openAssistantHotkey: "Open AI assistant (alt+/)",
    openAssistantChat: "Open AI assistant chat",
    stageAssets: "Cast / scenes",
    stageFinal: "Film",
    stageScriptDesc: "Story structure + scenes",
    stageAssetsDesc: "Character sheets + scene sheets",
    stageBoardDesc: "Shot-by-shot frames",
    stageFinalDesc: "Finished video",
    stagesDone: "{n}/{total} stages",
    shotVideos: "Shot videos",
    qcHealth: "QC health",
    nextGen: "Next · generate “{name}”",
    suggestRegen: "Suggest · regen “{name}”",
    pipelineReady: "Pipeline ready · export the film",
    chooseFailed: "Choose failed",
    variantChosen: "✓ Variant {n} is now the hero film",
    packingHint: "Packing… (hook → variants → copy → bundle, ~1–3 min)",
    packFailed: "Pack failed",
    packSummary: "✓ Packed {ok}/{total}:",
    variantUnit: "variants",
    composeFail: "compose ✗",
    copyOk: "copy ✓",
    copyFail: "copy ✗",
    packOk: "bundle ✓",
    packFail: "bundle ✗",
    rerunFailed: "Rerun failed",
    reranDispatched: "✓ Reran “{name}” and dispatched pipeline regen",
    reranMarked: "✓ Marked “{name}” for rerun{extra}",
    downstreamStale: ", {n} downstream stages set to stale",
    directorDesk: "Director desk · full-pipeline control",
    directorDeskHint: "Check each stage · edit or regen any node · see downstream impact of a rerun",
    adWorkshopTitle: "One-click post: hook ammo → A/B variants + dual card → publish copy → pack",
    packing: "Packing…",
    adWorkshop: "Ad workshop",
    mainFilm: "Main film",
    variantN: "Variant {n}",
    setAsHero: "Set this variant as the hero film",
    pickAsHero: "Use as hero",
    prefTitle: "Preferred title",
    statusEmpty: "Not generated",
    statusReady: "Ready",
    statusStale: "Stale",
    itemsN: "{n} items",
    upstreamStale: "Upstream updated — regen this stage",
    rerunStage: "Rerun this stage",
    rerun: "Rerun",
    rerunDownstream: "Rerunning “{name}” requires regenerating downstream: {list}",
    rerunLast: "Rerun “{name}” (last stage, no downstream impact)",
    confirmRerun: "Confirm rerun of this stage",
    searchAssets: "Search assets...",
    selectedPrefix: "Selected",
    loadAssetsFailed: "Failed to load assets",
    usedN: "Used {n}",
    noMatchAssets: "No {type} assets matching \"{q}\"",
    noAssetsYet: "No {type} assets yet",
    tryOtherKeywords: "Try other keywords",
    createFirstAsset: "Create your first global asset and reuse it across projects",
    createAsset: "Create asset",
    cameoConsistency: "Cameo consistency",
    characterN: "Character {n}",
    autoRetriedN: "Auto-retried {n} times",
    firstPassOk: "First pass passed",
    finalCw: "Final cw",
    cameoNoScores: "This project's boards have no Cameo consistency scores yet (created before v2.12 / OPENAI_API_KEY not set)",
    consistencyMeter: "consistency meter",
    average: "Avg",
    shotsNeedRegen: "shots need regen",
    autoRetriedShots: "Auto-retried {n} shots this run",
    batchRetryTitle: "Trigger Cameo auto-retry and redraw these {n} shots with a stronger cw",
    retrying: "Retrying…",
    batchRetryN: "Batch retry ({n})",
    allShotsPass: "All shots passed",
    weakestFirst: "weakest shots first",
    attMax6: "At most 6 attachments",
    attOver10: "{name} exceeds the 10MB limit",
    uploadFailedStatus: "Upload failed ({status})",
    sendFailedStatus: "Send failed ({status})",
    deleteFailed: "Delete failed",
    liveSyncOn: "Live sync on (Yjs WS)",
    liveSyncConnecting: "Connecting live sync...",
    liveSyncOff: "WS down — polling fallback. Check npm run dev:ws",
    live: "Live",
    offline: "Offline",
    commentsN: "{n}",
    replyToName: "Reply to {name}... ⌘+Enter to send",
    removeAttachment: "Remove attachment",
    attCap6: "6-attachment cap reached",
    uploadMediaHint: "Upload image/video (≤10MB, max 6)",
    sendComment: "Send comment",
    hintWriter: "Script · dialogue",
    hintChar: "Cast · face lock",
    hintScene: "Scenes · art",
    hintBoard: "Shot planning",
    hintDirector: "Overall direction",
    hintEditor: "Edit · score",
    hintProducer: "Review · film",
  },
  kitUi: {
    toggleTheme: "Switch theme",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    playFailed: "Playback failed",
    musicPreview: "Music preview",
    musicDefault: "Score",
    closeEsc: "Close (ESC)",
    pause: "Pause",
    play: "Play",
    spacePlayEsc: "SPACE play / pause · ESC close",
    audioLoadFail: "Audio failed to load — the link may have expired or the format is unsupported",
    dialogAria: "Dialog",
    imagePreview: "Image preview",
    prevImage: "Previous",
    nextImage: "Next",
    imageLoadFail: "Image failed to load",
    retryLoad: "Retry load",
    stageDirector: "Director analysis",
    stageWriter: "Script writing",
    stageStoryboard: "Storyboard drawing",
    parallelStages: "{n} stages in parallel",
    safeTop: "Top UI",
    safeSide: "Action column",
    safeBottom: "Captions / controls · keep subjects out",
    safeBelt: "Safe belt",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    shotN: "Shot {n}",
    sceneDesc: "Scene",
    dialogue: "Dialogue",
    action: "Action",
    emotionMood: "Mood",
    scriptView: "Script view",
    scriptShotCount: "Script · {n} shots",
    polishTitle: "Open script polish — this script is imported automatically",
    polish: "Polish",
    copyFull: "Copy full text",
    copied: "Copied",
    copy: "Copy",
    downloadTxt: "Download .txt",
    noShots: "No shots generated yet",
    actN: "Act {n}",
    beatSheet: "Per-second beat sheet",
    beatSheetPlain: "Per-second beats",
    scene: "Scene",
    characters: "Cast",
    emotion: "Emotion",
    emotionTemp: " (temp {n})",
    camera: "Camera",
    lighting: "Lighting",
    composition: "Composition",
    sound: "Sound",
    subtext: "Subtext",
    dialogueLabel: "Dialogue",
    synopsis: "Synopsis",
    genre: "Genre",
    visualPrompt: "Visual prompt",
    duration: "Duration",
    overSizeMb: "Over {n}MB",
    unsupportedFormat: "Unsupported format",
    dropRejected: "Rejected:{list}",
    localComposeGone: "The locally composed video file is no longer available.",
    oldTmpCompose: "This is a pre-v2.18.1 export (written to /tmp and later cleaned up). From v2.18.1 on, new exports are stored under data/composed/ and persist.",
    fixRerunWorkshop: "Fix: re-run this project in the workshop — the new export will persist automatically.",
    cdnExpired: "The upstream CDN URL has expired (Minimax videos usually expire after 24h).",
    fixRegenShot: "Fix: tap “Regenerate this shot” on the project page to re-run video.",
    emptyComposeUrl: "Export URL is empty — all upstream video APIs failed (quota or network).",
    fixCheckBilling: "Fix: check Minimax / Veo / Kling balance at /dashboard/billing, top up, then re-run.",
    sourceUnreachable: "Video source is unreachable. Possible CORS / missing file / network error.",
    openVideoNewWindow: "Open video in a new window",
    assetLost: "Asset file is gone (likely cleaned up on a schedule). Regenerate this shot.",
    assetForbidden: "Asset link expired or access denied",
    assetHttp: "Asset unavailable (HTTP {n})",
    videoLoadNetwork: "Video failed to load: network unreachable",
  },
  readiness: {
    levelNone: "No engines configured — the full pipeline uses placeholders (you can still browse demos)",
    levelScript: "Script / boards / pacing audit are real; pictures and video are placeholders",
    levelVisual: "Script + storyboard frames are real; shot video is a placeholder",
    levelFilm: "Full pipeline is live — real finished film",
    levelMediaOnly: "Picture/video engines are ready; script uses the basic template (add OPENAI_API_KEY for the full stack)",
    stageScript: "Script",
    stageStoryboardPlan: "Board plan",
    stageAudit: "Pacing / McKee audit",
    stageStoryboardImage: "Board render",
    stageShotVideo: "Shot video",
    stageTts: "Voiceover",
    stageLipsync: "Lip-sync",
    stageAssemble: "Edit / assemble",
    engineLlm: "Script LLM",
    engineImage: "Image generation",
    engineVideo: "Video generation",
    engineTts: "Voice TTS",
    engineLipsync: "Lip-sync",
    hintLlm: "Set OPENAI_API_KEY (any OpenAI-compatible gateway)",
    hintImage: "Set MINIMAX_API_KEY / VIDU_API_KEY or another image engine",
    hintVideo: "Set MINIMAX_API_KEY / VIDU_API_KEY / RUNWAY_API_KEY or another video engine",
    hintTts: "Set a TTS key (MiniMax / ElevenLabs / …)",
    hintLipsync: "Works locally (2D) with no key; set LIPSYNC_API_URL for a real engine",
    storageS3Ok: "S3 is configured — assets are publicly reachable (cutout refs can feed external engines)",
    storageS3Partial: "STORAGE_DRIVER=s3 but S3_* is incomplete — fell back to local; cutout refs stay on this machine",
    storageLocal: "Local storage: films/UI work; cutout refs for external engines need S3 (STORAGE_DRIVER=s3 + S3_*)",
  },
  providerHealth: {
    ok: "Healthy",
    outOfCredits: "Out of credits",
    authError: "Auth failed",
    misconfigured: "Misconfigured",
    down: "Unreachable",
    notConfigured: "Not configured",
    recharge: "Recharge",
    checkKey: "Check Key",
    addConfig: "Add config",
    checkNetwork: "Check network/service",
    optionalSetup: "Optional",
  },
};

// v5.0: 繁体中文 (之前是 zhCN 占位)
const zhTW: DeepPartial<Translations> = {
  collab: { notifTitle: '通知', markAllRead: '全部標已讀', justNow: '剛剛', mentioned: '提到了你', replied: '回覆了你', notifEmpty: '暫無通知', loginPrompt: '登入後查看通知', reply: '回覆', deleted: '[已刪除]', commentPlaceholder: '寫評論… @ 提及他人', commentEmpty: '還沒有評論,來搶沙發', send: '發送', confirmDelete: '確認刪除這條評論?', demoMode: '示範模式', demoEnginesOff: '引擎未設定', demoPlaceholder: '生成將使用佔位 / 示意素材', demoLipsyncReady: '口型算繪已零設定可用', demoHowToEnable: '如何啟用', demoImage: '圖像生成', demoVideo: '影片生成', readinessTitle: '引擎設定', readinessReal: '真', readinessSim: '示意' },
  common: {
    create: '建立', save: '儲存', cancel: '取消', delete: '刪除', edit: '編輯',
    share: '分享', download: '下載', loading: '載入中...', error: '錯誤', success: '成功',
    viewAll: '查看全部', backHome: '返回首頁',
    saveChanges: '儲存變更', saving: '儲存中...', reset: '重置',
  },
  brand: {
    studio: 'AI 漫劇工作室',
  },
  nav: {
    home: '首頁', projects: '我的專案', create: '開始創作', pricing: '定價', profile: '個人資料', settings: '設定',
    polish: '劇本潤色', workbench: '工作台', cases: '作品案例', userCenter: '使用者中心', newProject: '新增專案',
  },
  auth: {
    brand: '青楓漫劇',
    welcomeBack: '歡迎回到青楓漫劇',
    createAccount: '建立帳戶',
    loginSubtitle: '使用帳號進入創作工作台',
    registerSubtitle: '註冊開始你的創作之旅',
    username: '使用者名稱',
    usernamePlaceholder: '輸入使用者名稱',
    email: '電子郵件',
    emailPlaceholder: '輸入電子郵件',
    password: '密碼',
    passwordPlaceholder: '輸入密碼',
    demoHint: '示範帳號:demo@qfmanju.ai(密碼由部署方 DEMO_PASSWORD 提供)',
    login: '登入',
    register: '註冊',
    loginSuccess: '登入成功',
    registerSuccess: '註冊成功',
    actionFailed: '操作失敗',
    noAccount: '還沒有帳戶？',
    hasAccount: '已有帳戶？',
    registerNow: '立即註冊',
    loginNow: '立即登入',
    inviteCode: '邀請碼',
    inviteRequired: '(Beta 版必填)',
    inviteNotFound: '邀請碼不存在',
    inviteUsed: '該邀請碼已被使用',
    inviteExpired: '邀請碼已過期',
    inviteRevoked: '邀請碼已被撤銷',
    inviteInvalid: '邀請碼格式無效',
    inviteGenericInvalid: '邀請碼無效',
    inviteValid: '邀請碼有效',
    inviteChecking: '校驗中...',
    inviteValidateFailed: '驗證失敗，請稍後重試',
    noInvite: '沒有邀請碼？',
    applyBeta: '申請內測',
    waitlistTitle: '申請內測',
    waitlistDesc: '留下電子郵件，我們會在審核通過後發送邀請碼',
    waitlistPurpose: '使用場景 (可選)',
    waitlistPurposePlaceholder: '例如：想做自己的連載漫劇 / 用來給客戶做廣告片 / 學習 AI 影片...',
    waitlistSubmit: '加入 Waitlist',
    waitlistSubmitting: '提交中...',
    waitlistDefaultOk: '已加入等待列表，審核結果將透過郵件通知',
    waitlistSubmitFailed: '提交失敗，請稍後重試',
    waitlistNetworkError: '網路錯誤',
  },
  sidebar: {
    overview: '創作總覽', myProjects: '我的專案', workshop: '創作工坊', shortVideo: '極速分鏡台',
    storyIntake: '長篇拆解', series: '我的系列', polish: '劇本潤色', u2v: '單圖變影片',
    mv: 'MV 卡點', comic: '漫轉影片', editChat: '對話式編輯', assets: '素材庫',
    characters: '角色庫', ipMarket: 'IP 市場', workflows: '工作流', masterPrompt: 'MasterPrompt',
    styles: '風格畫廊', cases: '靈感庫', templates: '模板市場', account: '帳戶',
    team: '團隊', health: 'API 健康', usage: '用量成本', jobs: '任務佇列',
    billing: '訂閱 / 計費', logout: '登出', expand: '展開側邊欄', collapse: '收起側邊欄', backHome: '返回首頁',
  },
  errors: {
    title: '出錯了', description: '應用遇到了一個意外錯誤,我們已經記錄了這個問題。',
    retry: '重試', backHome: '返回首頁', pageTitle: '頁面出錯了',
    unknown: '發生了未知錯誤,請重試。', backWorkbench: '回工作台', loading: 'Loading',
  },
  dashProjects: {
    eyebrow: '專案庫', title: '我的專案', subtitle: '管理和追蹤你的 AI 漫劇創作', newCreate: '新建創作',
    filterAll: '全部', filterActive: '創作中', filterCompleted: '已完成', filterDraft: '草稿', filterArchived: '已下架',
    emptyAll: '還沒有創作專案', emptyFiltered: '沒有符合條件的專案',
    emptyHint: '輸入你的創意，AI 團隊將自動為你完成從劇本到成片的全流程創作',
    startCreate: '開始創作', importing: '匯入中…', importDemo: '匯入示範工程《雨夜信號》',
    importDemoHint: '示範工程無需任何 API key — 4 鏡懸疑短劇,成片/審計/匯出即刻可看',
    untitled: '未命名', deleteConfirm: '確定刪除「{title}」?此操作不可恢復(連同分鏡/影片/配音等全部資產)。',
    restoreTitle: '恢復到主列表', archiveTitle: '下架(從主列表移走,可恢復)', deleteTitle: '刪除專案(不可恢復)',
    shotsUnit: '鏡', polished: '已潤色', polishBtn: '潤色', polishTitle: '用 Polish Studio 對該專案劇本做潤色/行業診斷',
    statusCompleted: '已完成', statusActive: '創作中', statusDraft: '草稿', statusArchived: '已下架',
  },
  dashBanner: {
    title: 'API 狀態告警', itemsUnit: '項',
    autoFallback: '創作流程會自動降級到備選引擎; 如需儲值, 請聯繫管理員或查看',
    billingLink: '計費頁', dismiss: '本次工作階段不再提示',
    exhausted: '餘額耗盡', saturated: '上游飽和', rateLimited: '觸發限流',
    authFailed: '鑑權失敗', modelUnavailable: '方案不支援此模型',
    kling: '可靈 (影片)', qingyuntop: '青雲頂 (聚合閘道)',
  },
  continueCard: {
    eyebrow: '繼續創作', statusActive: '創作中', statusDraft: '草稿', statusCompleted: '已完成',
    draftReadyLabel: '回到工坊,開機 ROLL', draftReadyHint: '劇本草稿已就緒,還沒跑完整流水線',
    draftEmptyLabel: '補全設定,開機 ROLL', draftEmptyHint: '這部還停在創意階段 —— 30 字創意即可開拍',
    activeLabel: '查看創作進度', activeHint: '流水線進行中;階段細節可在「任務佇列」查看',
    completedLabel: '看成片 · 跑審計 · 匯出', completedHint: '試試節奏審計與 EDL/AAF 匯出,弱鏡可單鏡 4K 重渲',
    openLabel: '打開專案', openHint: '從上次停下的地方繼續',
  },
  product: {
    director: '導演', writer: '編劇', characterDesign: '角色設計', sceneDesign: '場景設計',
    storyboard: '分鏡', videoGen: '影片生成', editor: '剪輯師', producer: '製片人',
    untitled: '未命名專案', creating: '創作中', collapseChat: '收起對話面板', expandChat: '展開對話面板',
    timeline: '時間線', shotsUnit: '鏡頭', generating: '生成中...', pending: '待生成', shotN: '鏡頭 {n}',
    tabDirector: '導演台', tabScript: '劇本', tabCharacters: '角色', tabScenes: '場景', tabStoryboard: '分鏡',
    tabContinuity: '連貫性', tabVideos: '影片', tabWorkshop: '鏡頭工坊', tabTimeline: 'Cinema 時間線',
    tabPacing: '節奏分析', tabPullsheet: '拉片', tabVision: '成片質檢', tabOneclick: '一鍵成片',
    tabMonitor: '技術監看', tabParam: '參數聯動', tabComments: '評論協作', tabDistribution: '分發', tabPlay: '完整播放',
    groupCreate: '創作', groupRefine: '精修', groupReview: '審校', groupDeliver: '交付',
    statShots: '鏡頭', statCast: '角色', statScore: '評分', statStatus: '狀態', statusDone: '已完成', statusMaking: '製作中',
    emptyCharacters: '還沒有角色', emptyScenes: '還沒有場景', emptyVideos: '還沒有鏡頭影片',
    saved: '專案已自動儲存', undone: '已撤銷', nothingToUndo: '暫無可撤銷操作',
    hotkeys: '快捷鍵', hotkeysDesc: 'Ctrl/⌘+S 儲存 · Ctrl/⌘+Z 撤銷 · Space 播放 · ? 說明',
    videoPreview: '影片預覽', openNewWindow: '在新視窗中開啟', close: '關閉', videoLoadFail: '影片載入失敗',
    dropUploading: '上傳中...', dropFailed: '上傳失敗', dropRetry: '上傳失敗,請重試',
    dropHint: '拖曳檔案到這裡，或點擊選擇檔案', dropHintSub: '支援圖片和影片，最大 50MB', dropHere: '放開以上傳檔案...',
    phasePlan: '導演規劃', phaseScript: '編寫劇本', phaseCharacters: '設計角色', phaseScenes: '建構場景',
    phaseStoryboardPlans: '分鏡規劃', phaseStoryboards: '渲染分鏡', phaseVideo: '生成影片',
    phasePacing: '節奏審計', phaseEdit: '剪輯合成', phaseReview: '導演審核', phaseComplete: '完成',
  },
  create: {
    badge: 'AI 創作工作台',
    title: '開始你的創作之旅',
    subtitle: '描述你的故事創意，AI 團隊將為你打造完整的漫劇作品',
    ideaLabel: '故事創意',
    ideaPlaceholder: '例如：一個關於時間旅行者的愛情故事...',
    videoProviderLabel: '影片生成引擎',
    startButton: '開始創作',
  },
  projects: {
    title: '我的專案', subtitle: '管理你所有的 AI 漫劇創作', searchPlaceholder: '搜尋專案標題或描述...',
    filterAll: '全部', filterCompleted: '已完成', filterCreating: '創作中', filterFailed: '失敗', noResults: '沒有找到符合的專案',
    createNew: '建立新專案', shotsUnit: '個鏡頭',
  },
  dashboard: {
    systemOnline: '系統在線',
    title: '創作總覽',
    subtitle: 'AI 多智能體協作引擎，從創意到成片的一站式漫劇生產線',
    quickStartTitle: '開始創作',
    quickStartSubtitle: '輸入創意，AI 七人團隊自動接力創作',
    statProjects: '我的專案',
    statProjectsSub: '創作中的漫劇專案',
    statGenerations: '生成次數',
    statGenerationsSub: '累計 AI 生成呼叫',
    statCases: '案例庫',
    statCasesSub: '可參考的範本案例',
    recentCreations: '最近創作',
    noRecords: '還沒有創作記錄',
    startFirst: '開始第一次創作 →',
    systemStatus: '系統狀態',
    recentActivity: '最近動態',
    statusCompleted: '已完成',
    statusCreating: '創作中',
    statusDraft: '草稿',
  },
  settings: {
    title: '設定',
    subtitle: '管理你的應用偏好與帳戶設定',
    general: '通用設定',
    generalDesc: '語言與地區偏好',
    language: '語言',
    appearance: '外觀',
    appearanceDesc: '自訂介面主題',
    theme: '主題',
    themeDark: '深色模式',
    themeLight: '淺色模式',
    themeAuto: '跟隨系統',
    notifications: '通知',
    notificationsDesc: '管理通知偏好',
    projectDone: '專案完成通知',
    projectDoneDesc: '當專案創作完成時接收通知',
    performance: '效能',
    performanceDesc: '最佳化應用效能',
    videoQuality: '影片品質',
    qualityHigh: '高品質',
    qualityMedium: '中等品質',
    qualityLow: '低品質（節省流量）',
    privacy: '隱私與安全',
    privacyDesc: '保護你的帳戶安全',
    changePassword: '修改密碼',
    enable2fa: '啟用兩步驟驗證',
    manageDevices: '管理已登入裝置',
    billing: '帳單與訂閱',
    billingDesc: '管理你的訂閱方案',
    freePlan: '免費方案',
    currentPlan: '目前方案',
    freeQuota: '每月 10 個專案額度',
    upgradePro: '升級到專業版',
    saved: '設定已儲存',
    savedDesc: '你的偏好設定已更新',
    resetDone: '設定已重置',
  },
  profile: {
    title: '個人資料',
    subtitle: '管理你的個人資訊與偏好設定',
    avatar: '頭像',
    uploadAvatar: '上傳頭像',
    basicInfo: '基本資訊',
    basicInfoDesc: '更新你的個人資料',
    username: '使用者名稱',
    email: '電子郵件',
    bio: '個人簡介',
    bioPlaceholder: '介紹一下你自己...',
    stats: '創作統計',
    totalProjects: '專案總數',
    inProgress: '進行中',
    totalShots: '鏡頭總數',
    saveSuccess: '儲存成功',
    saveSuccessDesc: '個人資料已更新',
    role: '角色',
    accountPrefs: '帳號與偏好設定',
    visualPref: '視覺偏好',
    collabSpace: '協作空間',
  },
  billing: {
    title: '訂閱管理',
    currentTier: '目前方案：',
    paymentNote: '付款走 Stripe Checkout(國際版),取消 / 改卡走 Stripe Customer Portal',
    recommended: '推薦',
    currentBadge: '目前方案',
    contactUs: '聯絡我們',
    perMonth: '/月',
    alreadyThis: '已是此方案',
    freeNoPurchase: '免費 · 無需購買',
    businessTalk: '商務洽談',
    upgradeTo: '升級到',
    portalNote: '升級 / 降級 / 取消 / 改付款方式都在 Stripe Customer Portal 完成;自架需設定 STRIPE_PORTAL_LINK。',
    openPortal: '開啟 Stripe Customer Portal',
    checkoutFailed: 'Checkout 失敗',
    paymentCanceled: '已取消付款',
    upgradedPrefix: '已升級到',
    upgradedSuffix: '!訂閱已啟用',
  },
  cases: {
    title: '案例庫',
    titlePublic: '案例精選',
    subtitle: '來自青楓漫劇合作夥伴與創作者',
    subtitleReuse: '來自青楓漫劇合作夥伴與創作者 · 點擊一鍵複用創意',
    copyPrompt: '複製提示詞',
    copied: '已複製',
    usePrompt: '用這個創作',
  },
  home: {
    heroTagline1: '/ AI 短劇製作台 · 不止生成',
    heroTagline2: '節奏審計 · 品質門禁 · 角色鎖臉一致性 · AAF/EDL 進剪輯線 · 團隊協作 — 把「能出片」變成「能交付」',
    heroEngines: '生成層 · 接入當下最強引擎(BYO Key)',
    heroCtaCreate: '開始創作 →',
    heroCtaCases: '查看作品',
    featureTitle: '像導演一樣掌控節奏',
    featureSubtitle: '腳本、分鏡、動畫、音效全流程可視化協作。',
    agentsTitle: '一支 AI 動畫 Agent 團隊',
    agentsSubtitle: '每一個角色都在即時協作。',
    lensCaption: '鏡頭盒：自訂鏡頭運動、焦段、視角',
    lensTitle: '鏡頭語言統一到每一幀',
    lensDesc: '統一風格、色彩與鏡頭運動規則。',
    frameTitle: '分鏡由 AI 快速生成',
    frameSubtitle: '從一句話出發，得到可編輯的多鏡頭序列。',
    frameSteps: [
      { title: '腳本結構', desc: '智慧拆解劇情節奏' },
      { title: '鏡頭拆解', desc: '自動生成多鏡頭分鏡' },
      { title: '角色設定', desc: '保持角色與風格一致' },
    ],
    frameCta: '生成分鏡',
    vibeKicker: '氛圍板：即時更新視覺和音效',
    vibeTitle: '氛圍與節奏即時預覽',
    vibeDesc: '畫面、鏡頭、配樂同時驅動情緒。',
    casesTitle: '案例精選',
    casesSubtitle: '來自青楓漫劇合作夥伴與創作者。',
    casesTryNow: '立即體驗',
    ctaTitle: '把故事變成動畫',
    ctaDesc: '現在就開始你的第一部 AI 漫劇',
    ctaButton: '進入工作台',
  },
  pricing: {
    enterWorkbench: '進入工作台',
    badge: '定價方案',
    titleLead: '選擇適合你的',
    titleHighlight: '創作套餐',
    subtitle: '從免費體驗到企業私有化部署，青楓漫劇為每位創作者提供最合適的 AI 漫劇製作方案',
    custom: '客製',
    customNote: '依需求報價，聯絡銷售',
    free: '免費',
    startUsing: '開始使用',
    apiAccess: 'API 存取',
    commercialLicense: '商業授權',
    footnote: '所有套餐均包含 7×24 小時 AI 引擎支援 · 付款後立即生效 · 隨時可取消',
    faqTitle: '常見問題',
    faq: [
      { q: '免費版有哪些限制？', a: '免費版每月可建立 3 個專案，角色庫最多儲存 5 個角色，影片匯出解析度為 720p，並包含青楓浮水印。適合個人體驗使用。' },
      { q: '升級後能立即使用新功能嗎？', a: '是的，付款成功後系統將立即啟用對應套餐的權益，無需等待審核。' },
      { q: '專業版的商業授權包含哪些範圍？', a: '專業版商業授權允許將使用青楓漫劇生成的內容用於商業目的，包括廣告、品牌宣傳、影視發行等，但不包含原始模型的二次訓練權利。' },
      { q: '企業版與專業版的主要區別是什麼？', a: '企業版支援私有化部署，可將整套 AI 系統部署在您的私有伺服器上，並提供自訂 AI 智慧體開發、SLA 保障和專屬客戶成功經理服務。' },
      { q: '可以隨時取消訂閱嗎？', a: '可以，您可以隨時在帳戶設定中取消訂閱。取消後，當前付費週期結束前仍可正常使用所有功能。' },
    ],
    moreTitle: '還有其他問題？',
    moreDesc: '我們的團隊隨時為你解答疑問',
    contactSupport: '聯絡支援團隊',
    alertPayment: '付款尚未接入，目前為免費 / 自架版本。',
  },
  help: {
    examples: '範例作品',
    title: '說明中心',
    subtitle: '找到你需要的答案，快速上手 AI 漫劇創作',
    searchPlaceholder: '搜尋說明文件...',
    quickGuides: '快速指南',
    guides: [
      { title: '快速開始', description: '5 分鐘學會創作你的第一個 AI 漫劇' },
      { title: '創作指南', description: '掌握 AI 漫劇創作的技巧和最佳實踐' },
      { title: '社群教學', description: '來自創作者社群的經驗分享' },
    ],
    faqTitle: '常見問題',
    faqs: [
      { q: '如何開始創作我的第一個專案？', a: '點擊「開始創作」按鈕，輸入你的故事創意，選擇影片生成引擎，AI 會自動為你生成完整的漫劇作品。' },
      { q: '支援哪些影片生成引擎？', a: '我們支援 Minimax、Vidu 和可靈 AI 等多個影片生成引擎，你可以依需求選擇最適合的引擎。' },
      { q: '生成一個專案需要多長時間？', a: '通常需要 5-15 分鐘，具體時間取決於專案複雜度和所選的影片生成引擎。' },
      { q: '可以編輯 AI 生成的內容嗎？', a: '是的，你可以編輯腳本、調整角色設計、修改分鏡圖，完全掌控創作過程。' },
      { q: '生成的作品可以商用嗎？', a: '生成素材的版權歸屬各底層生成引擎(Kling / MiniMax 等),是否可商用取決於各引擎的服務條款,請自行核對。青楓僅提供多智能體編排與後期編輯工具,不對生成素材的商用權利作擔保。' },
      { q: '如何匯出我的作品？', a: '在專案詳情頁點擊「下載」按鈕，可以匯出影片、圖片和腳本等所有素材。' },
    ],
    moreTitle: '還有其他問題？',
    moreDesc: '我們的支援團隊隨時為你提供協助',
    sendEmail: '寄送郵件',
    liveChat: '線上客服',
  },
  examples: {
    title: '精選作品',
    subtitle: '探索由 AI 創作的精彩漫劇作品',
    ctaTitle: '準備好創作你的作品了嗎？',
    ctaDesc: '加入數千位創作者，開始你的 AI 漫劇創作之旅',
    ctaButton: '立即開始創作',
  },

    visionAudit: {
      verdictExcellent: "優秀",
      verdictGood: "良好",
      verdictNeedsWork: "待優化",
      verdictPoor: "需重做",
      noDataMessage: "還沒有成片質檢資料。生成成片後即可對每鏡畫面做「是否對得上劇本」的 AI 評分。",
      panelTitle: "成片質檢 · 畫面 vs 劇本",
      avgScore: "平均分",
      shotUnit: "鏡",
      passLabel: "通過",
      warnLabel: "偏差",
      failLabel: "跑題",
      weakestShotsTitle: "最需關注（優先重生）：",
      rebirthPlanPrefix: "重生計畫 · ",
      rebirthPlanSuffix: " 個弱鏡建議重拍",
      reshootButton: "一鍵去工坊重拍",
      dimScene: "場景",
      dimAction: "動作",
      dimMood: "情緒",
      dimComposition: "構圖",
    },
    usagePage: {
      eyebrow: "用量與成本",
      headline: "成本可觀測",
      budgetLabel: "月預算 ¥",
      budgetPlaceholder: "不限",
      nearDays: "近",
      daySuffix: "天",
      daysCostSuffix: "天花費",
      refreshTitle: "重新整理",
      loading: "載入中…",
      loadFailed: "載入失敗",
      activeAlertsBanner: "活躍配額告警 · 近 1 小時",
      goBilling: "前往計費",
      statusOk: "預算健康",
      statusWarn: "接近上限",
      statusOver: "已超預算",
      statusNone: "未設上限",
      alertExhausted: "額度耗盡",
      alertSaturated: "上游飽和",
      alertRateLimited: "限流",
      alertAuthFailed: "鑑權失敗",
      alertModelUnavailable: "模型不可用",
      thisMonthBudget: "本月預算",
      quotaTitle: "本月配額",
      quotaUnlimited: "無上限",
      quotaExceeded: "已超檔上限,請儲值或改用經濟引擎",
      quotaNearLimit: "接近檔上限",
      quotaOfCeiling: "檔上限",
      projectedEndPrefix: "預計月末",
      noCapSuffix: " · 未設上限",
      statGenerations: "生成次數",
      statEngines: "引擎數",
      engineCostPrefix: "引擎花費 · 近",
      engineNoData: "此視窗暫無成本記錄。",
      dailyTrendTitle: "每日成本趨勢",
      dailyNoData: "暫無每日資料。",
      countSuffix: "次",
    },
    healthPage: {
      title: "API 健康",
      subtitle: "各模型 / 閘道即時狀態 · 一眼看誰欠費或掉線",
      refreshBtn: "重新探測",
      loadFailed: "探測失敗",
      kindLlm: "大型語言模型",
      kindTts: "語音",
      kindVideo: "影片",
      kindImage: "圖像",
      kindGateway: "閘道",
      overallHealthy: "全部正常",
      overallWarning: "有警告",
      overallCritical: "有故障 / 欠費",
      balanceUsed: "已用",
      balanceAbundant: "額度充裕(儲值制)",
      balanceRemaining: "剩餘",
      balanceLimit: "上限",
      radarTitle: "模型雷達",
      radarDesc: "掃描各 API 支援的最新模型 · 同家族才升級 · LLM 先 1-token 實測 · 留回滾 · 免重啟生效",
      scanBtn: "掃描最新模型",
      upgradeBtn: "一鍵升級到最新最強",
      statusUpgradable: "可升級",
      statusUpToDate: "已最新",
      statusFamilyN: "· 家族 {n} 款",
      statusSourceUnavail: "來源不可用",
      overridesTitle: "現行覆蓋(可回滾到升級前):",
      rollbackBtn: "回滾",
      rollbackDefault: "(回程式碼預設)",
      checkedAt: "探測於",
      cachedNote: "· 快取結果 (點「重新探測」強制刷新)",
      footer: "· 儀表板僅讀取各方額度，不儲存/不回傳任何 API Key。",
      scanFailed: "掃描失敗",
      upgradeFailed: "升級失敗",
      upgradeFailedLogin: "升級失敗(需登入)",
      upgradeNone: "沒有可升級項",
      upgradedSummary: "已升級 {n} 項：{list}{skipped} — 免重啟已生效",
      upgradeSkippedNote: "（{n} 項實測未過維持原值）",
      upgradeSomeSkipped: "{n} 項候選實測未通過，維持現設定",
      rolledBack: "{envKey} 已回滾",
    },
    seriesDetail: {
      statusDraft: "待生成",
      statusActive: "生成中",
      statusCompleted: "已完成",
      statusFailed: "失敗·可重試",
      backLink: "返回",
      pageTitle: "系列劇 · 批次生成",
      statTotal: "共 {n} 集",
      statCompleted: "已完成 {n}",
      statGenerating: "生成中 {n}",
      statFailed: "失敗 {n}",
      statPending: "待生成 {n}",
      batchGenerateBtn: "一鍵批次生成",
      batchGeneratePendingHint: "({n} 集待生成)",
      regenerateAll: "全部重新生成",
      seasonAssetsTitle: "季度產出",
      seasonCoverAlt: "季封面",
      genCoverBtn: "生成季封面",
      regenCoverBtn: "重新生成季封面",
      exportSeasonBtn: "匯出整季合集",
      reexportSeasonBtn: "重新匯出整季合集",
      exportFirstEpisodeHint: "請先生成至少一集",
      watchSeasonVideo: "看整季合集",
      seasonVideoDesc: "合集 = 已完成各集成片按集號拼接（統一畫幅 + 重編碼）。",
      seasonFixBusyLabel: "⏳ 全季補渲中…",
      seasonFixLabel: "⚡ 全季補渲降級鏡（{n} 集受影響）",
      seasonFixProgressMsg: "第 {episode} 集補渲中（{current}/{total}）…",
      seasonFixDoneMsg: "全季補渲完成（{n} 集），重新體檢…",
      resumeStuckBtn: "🛟 恢復卡死的集（30 分鐘無進展 → 重置待生成）",
      loading: "載入中…",
      noEpisodes: "此系列暫無劇集",
      episodeLabel: "第{n}集",
      healthCheckAllGreen: "體檢全綠",
      shotsDowngradedLabel: "{n}鏡降級",
      openEpisodeLink: "開啟 →",
      loadFailStatus: "載入失敗 {status}，請重新整理",
      loadFailNetwork: "載入失敗，請檢查網路後重新整理",
      requestFailed: "請求失敗",
      exportingSeasonMsg: "整季合集生成中（下載各集 + 拼接重編碼，最長約 5 分鐘，請勿關閉頁面）…",
      exportCanceledMsg: "已取消匯出 —— 可先全季補渲再導",
      exportFailedStatus: "匯出失敗 {status}",
      exportDoneMsg: "整季合集已生成（{n} 集）",
      coverGeneratingMsg: "季封面生成中…",
      coverFailedStatus: "封面生成失敗 {status}",
      coverDoneMsg: "季封面已生成",
      resumeCheckedMsg: "已檢查",
      resumeFailedMsg: "恢復請求失敗",
      resumeFailStatus: "失敗 {status}",
      batchQueuedMsg: "已入隊批次生成 {n} 集（持久佇列，逐集進行中…）",
      batchStartedMsg: "已開始批次生成 {n} 集（並發 {concurrency}，逐集進行中…）",
      noPendingEpisodes: "沒有待生成的劇集",
      healthGateIssuePrefix: "問題集：",
      healthGateEpisodeDetail: "第{ep}集（{shots}鏡降級）",
      healthGateConfirmHint: "仍要匯出嗎？（建議先點「全季補渲降級鏡」）",
      dramaPackageBtn: "📦 出海打包",
      dramaPackageFetching: "正在取得打包資料…",
      dramaPackageTitle: "出海打包 · TikTok Drama Center",
      dramaPackageDownload: "下載 JSON",
      dramaPackageCoverAlt: "系列封面",
      dramaPackageLangEpisodes: "語言:{lang} · 共 {n} 集",
      dramaPackageTotalMin: "總時長:{n} 分鐘",
      dramaPackageEpFree: "免費",
      dramaPackageEpCoins: "{coins} coins",
      dramaPackageGuideTitle: "上傳步驟",
      dramaPackageErrPrefix: "取得失敗:",
      dramaPackageNetworkErr: "網路錯誤",
      dramaPackageViewVideo: "查看影片",
      dramaPackageAiDeclaration: "我確認本片由 AI 生成 / 深度合成技術製作,匯出時將隨包聲明",
      dramaPackageAiRequiredHint: "請先勾選 AI 聲明",
    },
  providerHealth: {
    ok: "正常",
    outOfCredits: "額度用盡",
    authError: "鑑權失敗",
    misconfigured: "配置缺失",
    down: "不可達",
    notConfigured: "未配置",
    recharge: "去儲值",
    checkKey: "檢查 Key",
    addConfig: "補配置",
    checkNetwork: "檢查網路/服務",
    optionalSetup: "可選接入",
  },
};

// v5.0: 日本語 (之前是 zhCN 占位)
const ja: DeepPartial<Translations> = {
  collab: { notifTitle: '通知', markAllRead: 'すべて既読', justNow: 'たった今', mentioned: 'メンションされました', replied: '返信されました', notifEmpty: '通知はありません', loginPrompt: 'ログインして通知を表示', reply: '返信', deleted: '[削除済み]', commentPlaceholder: 'コメントを入力… @ でメンション', commentEmpty: 'まだコメントはありません', send: '送信', confirmDelete: 'このコメントを削除しますか?', demoMode: 'デモモード', demoEnginesOff: 'エンジン未設定', demoPlaceholder: '生成にはプレースホルダー素材を使用します', demoLipsyncReady: 'リップシンクはゼロ設定で利用可能', demoHowToEnable: '有効化の方法', demoImage: '画像生成', demoVideo: '動画生成', readinessTitle: 'エンジン設定', readinessReal: '実', readinessSim: 'モック' },
  common: {
    create: '作成', save: '保存', cancel: 'キャンセル', delete: '削除', edit: '編集',
    share: '共有', download: 'ダウンロード', loading: '読み込み中...', error: 'エラー', success: '成功',
    viewAll: 'すべて見る', backHome: 'ホームに戻る',
    saveChanges: '変更を保存', saving: '保存中...', reset: 'リセット',
  },
  brand: {
    studio: 'AI コミックスタジオ',
  },
  nav: {
    home: 'ホーム', projects: 'マイプロジェクト', create: '作成', pricing: '料金', profile: 'プロフィール', settings: '設定',
    polish: '脚本推敲', workbench: 'ワークベンチ', cases: '作品事例', userCenter: 'マイページ', newProject: '新規プロジェクト',
  },
  auth: {
    brand: 'Wind Comic', welcomeBack: 'Welcome back to Wind Comic', createAccount: 'Create an account',
    loginSubtitle: 'Sign in to enter the studio', registerSubtitle: 'Register to start creating',
    username: 'Username', usernamePlaceholder: 'Enter username', email: 'Email', emailPlaceholder: 'Enter email address',
    password: 'Password', passwordPlaceholder: 'Enter password',
    demoHint: 'Demo account: demo@qfmanju.ai (password from DEMO_PASSWORD)',
    login: 'Sign in', register: 'Sign up', loginSuccess: 'Signed in', registerSuccess: 'Account created',
    actionFailed: 'Something went wrong', noAccount: 'No account yet?', hasAccount: 'Already have an account?',
    registerNow: 'Sign up', loginNow: 'Sign in', inviteCode: 'Invite code', inviteRequired: '(required for Beta)',
    inviteNotFound: 'Invite code not found', inviteUsed: 'This invite code has already been used',
    inviteExpired: 'Invite code expired', inviteRevoked: 'Invite code revoked',
    inviteInvalid: 'Invalid invite code format', inviteGenericInvalid: 'Invalid invite code',
    inviteValid: 'Invite code valid', inviteChecking: 'Checking...', inviteValidateFailed: 'Validation failed, try again later',
    noInvite: 'No invite code?', applyBeta: 'Request beta access', waitlistTitle: 'Request beta access',
    waitlistDesc: 'Leave your email and we will send an invite after review',
    waitlistPurpose: 'Use case (optional)', waitlistPurposePlaceholder: 'e.g. serial comics / client ads / learning AI video...',
    waitlistSubmit: 'Join waitlist', waitlistSubmitting: 'Submitting...',
    waitlistDefaultOk: 'You are on the waitlist. We will email you after review.',
    waitlistSubmitFailed: 'Submit failed, try again later', waitlistNetworkError: 'Network error',
  },
  sidebar: {
    overview: 'Overview', myProjects: 'My Projects', workshop: 'Workshop', shortVideo: 'Storyboard Desk',
    storyIntake: 'Long-form Split', series: 'My Series', polish: 'Script Polish', u2v: 'Image to Video',
    mv: 'MV Beats', comic: 'Comic to Video', editChat: 'Edit Chat', assets: 'Assets',
    characters: 'Characters', ipMarket: 'IP Market', workflows: 'Workflows', masterPrompt: 'MasterPrompt',
    styles: 'Style Gallery', cases: 'Inspiration', templates: 'Templates', account: 'Account',
    team: 'Team', health: 'API Health', usage: 'Usage & Cost', jobs: 'Job Queue',
    billing: 'Billing', logout: 'Sign out', expand: 'Expand sidebar', collapse: 'Collapse sidebar', backHome: 'Back to home',
  },
  errors: {
    title: 'Something went wrong', description: 'The app hit an unexpected error. We have logged it.',
    retry: 'Retry', backHome: 'Back to home', pageTitle: 'This page failed',
    unknown: 'An unknown error occurred. Please retry.', backWorkbench: 'Back to studio', loading: 'Loading',
  },
  dashProjects: {
    eyebrow: 'Library', title: 'My Projects', subtitle: 'Manage and track your AI short-drama work', newCreate: 'New project',
    filterAll: 'All', filterActive: 'In progress', filterCompleted: 'Completed', filterDraft: 'Draft', filterArchived: 'Archived',
    emptyAll: 'No projects yet', emptyFiltered: 'No projects match this filter',
    emptyHint: 'Enter an idea and the AI team will take it from script to finished film',
    startCreate: 'Start creating', importing: 'Importing…', importDemo: 'Import demo: Rain Signal',
    importDemoHint: 'No API key needed — 4-shot mystery short with film, audit, and export ready',
    untitled: 'Untitled', deleteConfirm: 'Delete “{title}”? This cannot be undone (storyboards, video, and voiceover included).',
    restoreTitle: 'Restore to main list', archiveTitle: 'Archive (remove from main list, can restore)', deleteTitle: 'Delete project (cannot undo)',
    shotsUnit: 'shots', polished: 'Polished', polishBtn: 'Polish', polishTitle: 'Polish this script in Polish Studio',
    statusCompleted: 'Completed', statusActive: 'In progress', statusDraft: 'Draft', statusArchived: 'Archived',
  },
  dashBanner: {
    title: 'API status alerts', itemsUnit: 'items',
    autoFallback: 'The pipeline will fall back to backup engines automatically. To top up, contact an admin or open',
    billingLink: 'Billing', dismiss: 'Hide for this session',
    exhausted: 'Out of credits', saturated: 'Upstream saturated', rateLimited: 'Rate limited',
    authFailed: 'Auth failed', modelUnavailable: 'Plan does not include this model',
    kling: 'Kling (video)', qingyuntop: 'Qingyuntop (gateway)',
  },
  continueCard: {
    eyebrow: 'Continue', statusActive: 'In progress', statusDraft: 'Draft', statusCompleted: 'Completed',
    draftReadyLabel: 'Back to workshop — ROLL', draftReadyHint: 'Script draft is ready; the full pipeline has not run yet',
    draftEmptyLabel: 'Finish setup — ROLL', draftEmptyHint: 'Still at the idea stage — about 30 characters is enough to start',
    activeLabel: 'View generation progress', activeHint: 'Pipeline is running; check Job Queue for stage detail',
    completedLabel: 'Watch · audit · export', completedHint: 'Try pacing audit and EDL/AAF export; weak shots can be 4K re-rendered',
    openLabel: 'Open project', openHint: 'Pick up where you left off',
  },
  product: {
    director: 'Director', writer: 'Writer', characterDesign: 'Character Design', sceneDesign: 'Scene Design',
    storyboard: 'Storyboard', videoGen: 'Video', editor: 'Editor', producer: 'Producer',
    untitled: 'Untitled project', creating: 'In production', collapseChat: 'Collapse chat', expandChat: 'Expand chat',
    timeline: 'Timeline', shotsUnit: 'shots', generating: 'Generating...', pending: 'Pending', shotN: 'Shot {n}',
    tabDirector: 'Director', tabScript: 'Script', tabCharacters: 'Cast', tabScenes: 'Scenes', tabStoryboard: 'Boards',
    tabContinuity: 'Continuity', tabVideos: 'Video', tabWorkshop: 'Shot Workshop', tabTimeline: 'Cinema Timeline',
    tabPacing: 'Pacing', tabPullsheet: 'Pull sheet', tabVision: 'QC', tabOneclick: 'One-click film',
    tabMonitor: 'Monitor', tabParam: 'Params', tabComments: 'Comments', tabDistribution: 'Distribute', tabPlay: 'Play',
    groupCreate: 'Create', groupRefine: 'Refine', groupReview: 'Review', groupDeliver: 'Deliver',
    statShots: 'Shots', statCast: 'Cast', statScore: 'Score', statStatus: 'Status', statusDone: 'Done', statusMaking: 'In progress',
    emptyCharacters: 'No characters yet', emptyScenes: 'No scenes yet', emptyVideos: 'No shot videos yet',
    saved: 'Project auto-saved', undone: 'Undone', nothingToUndo: 'Nothing to undo',
    hotkeys: 'Shortcuts', hotkeysDesc: 'Ctrl/⌘+S save · Ctrl/⌘+Z undo · Space play · ? help',
    videoPreview: 'Video preview', openNewWindow: 'Open in new window', close: 'Close', videoLoadFail: 'Video failed to load',
    dropUploading: 'Uploading...', dropFailed: 'Upload failed', dropRetry: 'Upload failed, try again',
    dropHint: 'Drop files here, or click to choose', dropHintSub: 'Images and video, max 50MB', dropHere: 'Release to upload...',
    phasePlan: 'Directing', phaseScript: 'Writing', phaseCharacters: 'Characters', phaseScenes: 'Scenes',
    phaseStoryboardPlans: 'Board plan', phaseStoryboards: 'Rendering boards', phaseVideo: 'Generating video',
    phasePacing: 'Pacing audit', phaseEdit: 'Edit & mux', phaseReview: 'Director review', phaseComplete: 'Done',
  },
  create: {
    badge: 'AI 創作スタジオ',
    title: 'あなたの創作の旅を始めよう',
    subtitle: 'ストーリーのアイデアを入力すると、AIチームが完全なコミックドラマを作成します',
    ideaLabel: 'ストーリーのアイデア',
    ideaPlaceholder: '例：タイムトラベラーのラブストーリー...',
    videoProviderLabel: '動画生成エンジン',
    startButton: '作成開始',
  },
  projects: {
    title: 'マイプロジェクト', subtitle: 'すべてのAIコミックドラマ作品を管理', searchPlaceholder: 'プロジェクトのタイトルや説明を検索...',
    filterAll: 'すべて', filterCompleted: '完了', filterCreating: '作成中', filterFailed: '失敗', noResults: '一致するプロジェクトが見つかりません',
    createNew: '新しいプロジェクトを作成', shotsUnit: 'ショット',
  },
  dashboard: {
    systemOnline: 'システム稼働中',
    title: '創作概要',
    subtitle: 'AIマルチエージェント協調エンジン — アイデアから完成作品までのワンストップ制作ライン',
    quickStartTitle: '作成を始める',
    quickStartSubtitle: 'アイデアを入力すると、7人のAIチームが自動で創作します',
    statProjects: 'マイプロジェクト',
    statProjectsSub: '制作中のコミックプロジェクト',
    statGenerations: '生成回数',
    statGenerationsSub: 'AI生成呼び出しの累計',
    statCases: '事例ライブラリ',
    statCasesSub: '参考になるテンプレート事例',
    recentCreations: '最近の創作',
    noRecords: 'まだ創作記録がありません',
    startFirst: '最初の創作を始める →',
    systemStatus: 'システム状態',
    recentActivity: '最近の動き',
    statusCompleted: '完了',
    statusCreating: '作成中',
    statusDraft: '下書き',
  },
  settings: {
    title: '設定',
    subtitle: 'アプリの設定とアカウント設定を管理',
    general: '一般設定',
    generalDesc: '言語と地域の設定',
    language: '言語',
    appearance: '外観',
    appearanceDesc: 'インターフェースのテーマをカスタマイズ',
    theme: 'テーマ',
    themeDark: 'ダークモード',
    themeLight: 'ライトモード',
    themeAuto: 'システムに従う',
    notifications: '通知',
    notificationsDesc: '通知設定を管理',
    projectDone: 'プロジェクト完了通知',
    projectDoneDesc: 'プロジェクトの作成が完了したら通知を受け取る',
    performance: 'パフォーマンス',
    performanceDesc: 'アプリのパフォーマンスを最適化',
    videoQuality: '動画品質',
    qualityHigh: '高品質',
    qualityMedium: '中品質',
    qualityLow: '低品質（データ節約）',
    privacy: 'プライバシーとセキュリティ',
    privacyDesc: 'アカウントを保護',
    changePassword: 'パスワード変更',
    enable2fa: '二段階認証を有効化',
    manageDevices: 'ログイン中のデバイスを管理',
    billing: '請求と購読',
    billingDesc: '購読プランを管理',
    freePlan: '無料プラン',
    currentPlan: '現在のプラン',
    freeQuota: '月10プロジェクトまで',
    upgradePro: 'プロ版にアップグレード',
    saved: '設定を保存しました',
    savedDesc: '設定が更新されました',
    resetDone: '設定をリセットしました',
  },
  profile: {
    title: 'プロフィール',
    subtitle: '個人情報と設定を管理',
    avatar: 'アバター',
    uploadAvatar: 'アバターをアップロード',
    basicInfo: '基本情報',
    basicInfoDesc: 'プロフィールを更新',
    username: 'ユーザー名',
    email: 'メール',
    bio: '自己紹介',
    bioPlaceholder: '自己紹介を入力...',
    stats: '創作統計',
    totalProjects: 'プロジェクト総数',
    inProgress: '進行中',
    totalShots: 'ショット総数',
    saveSuccess: '保存しました',
    saveSuccessDesc: 'プロフィールを更新しました',
    role: '役割',
    accountPrefs: 'アカウントと設定',
    visualPref: 'ビジュアル設定',
    collabSpace: 'コラボレーション空間',
  },
  billing: {
    title: '購読管理',
    currentTier: '現在のプラン：',
    paymentNote: '支払いは Stripe Checkout 経由、解約 / カード変更は Stripe Customer Portal で',
    recommended: 'おすすめ',
    currentBadge: '現在',
    contactUs: 'お問い合わせ',
    perMonth: '/月',
    alreadyThis: '現在のプラン',
    freeNoPurchase: '無料 · 購入不要',
    businessTalk: '商談',
    upgradeTo: 'アップグレード:',
    portalNote: 'アップグレード / ダウングレード / 解約 / 支払い方法の変更は Stripe Customer Portal で。セルフホスト時は STRIPE_PORTAL_LINK の設定が必要です。',
    openPortal: 'Stripe Customer Portal を開く',
    checkoutFailed: 'Checkout 失敗',
    paymentCanceled: '支払いをキャンセルしました',
    upgradedPrefix: 'アップグレード:',
    upgradedSuffix: '! 購読が有効になりました',
  },
  cases: {
    title: '事例ライブラリ',
    titlePublic: '注目の事例',
    subtitle: '青楓のパートナーとクリエイターより',
    subtitleReuse: '青楓のパートナーとクリエイターより · クリックでアイデアを再利用',
    copyPrompt: 'プロンプトをコピー',
    copied: 'コピー済み',
    usePrompt: 'これで作成',
  },
  home: {
    heroTagline1: '/ AIショートドラマ制作コンソール — 生成のその先へ',
    heroTagline2: 'テンポ監査 · 品質ゲート · キャラ顔ロック一貫性 · AAF/EDLでNLEへ · チーム協業 — 「作れる」を「納品できる」に。',
    heroEngines: '生成レイヤー · 最強エンジンを接続(BYOキー)',
    heroCtaCreate: '作成を始める →',
    heroCtaCases: '作品を見る',
    featureTitle: '映画監督のようにテンポを操る',
    featureSubtitle: '脚本・絵コンテ・アニメ・効果音まで、全工程をビジュアルに共同編集。',
    agentsTitle: 'AIアニメーション・エージェントチーム',
    agentsSubtitle: 'すべての役割がリアルタイムで協働。',
    lensCaption: 'レンズボックス: カメラの動き・焦点距離・アングルをカスタマイズ',
    lensTitle: 'カメラ言語をすべてのフレームに統一',
    lensDesc: 'スタイル・色・カメラワークのルールを統一。',
    frameTitle: '絵コンテをAIが高速生成',
    frameSubtitle: '一文から、編集可能なマルチショットのシーケンスへ。',
    frameSteps: [
      { title: '脚本構成', desc: '物語のテンポをスマートに分解' },
      { title: 'ショット分解', desc: 'マルチショット絵コンテを自動生成' },
      { title: 'キャラクター設定', desc: 'キャラクターとスタイルの一貫性を保持' },
    ],
    frameCta: '絵コンテを生成',
    vibeKicker: 'ムードボード: ビジュアルと音声をリアルタイム更新',
    vibeTitle: 'ムードとリズムをリアルタイムでプレビュー',
    vibeDesc: '映像・カメラ・音楽が一体となって感情を動かす。',
    casesTitle: '注目の事例',
    casesSubtitle: '青楓のパートナーとクリエイターより。',
    casesTryNow: '今すぐ体験',
    ctaTitle: '物語をアニメーションに',
    ctaDesc: '今すぐ最初のAIコミックドラマを始めよう',
    ctaButton: 'ワークベンチへ',
  },
  pricing: {
    enterWorkbench: 'ワークベンチへ',
    badge: '料金プラン',
    titleLead: 'あなたに合った',
    titleHighlight: '制作プランを選ぶ',
    subtitle: '無料トライアルから企業向けセルフホストまで、青楓は各クリエイターに最適なAIコミック制作プランを提供します。',
    custom: 'カスタム',
    customNote: '要見積もり、営業へお問い合わせ',
    free: '無料',
    startUsing: '使ってみる',
    apiAccess: 'API アクセス',
    commercialLicense: '商用ライセンス',
    footnote: '全プランに 24 時間 365 日の AI エンジンサポート付き · 支払い後すぐ有効 · いつでも解約可能',
    faqTitle: 'よくある質問',
    faq: [
      { q: '無料プランの制限は？', a: '無料プランは月に3プロジェクト、キャラクターライブラリは最大5体、動画の書き出しは720p、青楓のウォーターマーク付きです。個人のお試しに最適です。' },
      { q: 'アップグレード後すぐ新機能を使えますか？', a: 'はい。支払いが完了すると、該当プランの特典がすぐに有効になります。審査待ちはありません。' },
      { q: '生成したコンテンツは商用利用できますか？', a: '生成された素材の著作権は各基盤エンジン(Kling / MiniMax 等)に帰属します。商用利用の可否は各エンジンの利用規約によりますので、必ずご自身でご確認ください。青楓はマルチエージェントの編集・後処理ツールを提供するのみで、生成物の商用権利を保証するものではありません。' },
      { q: '企業版とプロ版の主な違いは？', a: '企業版はセルフホストに対応し、AIシステム一式を自社のプライベートサーバーに導入できます。さらにカスタムAIエージェント開発、SLA保証、専任のカスタマーサクセスマネージャーが付きます。' },
      { q: 'いつでも解約できますか？', a: 'はい。アカウント設定からいつでも解約できます。解約後も、現在の請求期間の終了までは全機能を利用できます。' },
    ],
    moreTitle: '他にご質問は？',
    moreDesc: '私たちのチームがいつでもお答えします',
    contactSupport: 'サポートに連絡',
    alertPayment: '決済は未導入です。現在は無料 / セルフホスト版です。',
  },
  help: {
    examples: 'サンプル作品',
    title: 'ヘルプセンター',
    subtitle: '必要な答えを見つけて、AIコミック制作をすぐに始めよう',
    searchPlaceholder: 'ヘルプ記事を検索...',
    quickGuides: 'クイックガイド',
    guides: [
      { title: 'クイックスタート', description: '5分で最初のAIコミックドラマを作成' },
      { title: '制作ガイド', description: 'AIコミック制作のコツとベストプラクティスを習得' },
      { title: 'コミュニティチュートリアル', description: 'クリエイターコミュニティからの経験談' },
    ],
    faqTitle: 'よくある質問',
    faqs: [
      { q: '最初のプロジェクトはどう始めますか？', a: '「作成を始める」をクリックし、ストーリーのアイデアを入力、動画エンジンを選ぶと、AIが完全なコミックドラマを自動生成します。' },
      { q: '対応している動画エンジンは？', a: 'Minimax、Vidu、可灵 AI など複数の動画エンジンに対応しています。ニーズに合わせて選べます。' },
      { q: 'プロジェクト生成にかかる時間は？', a: '通常5〜15分です。プロジェクトの複雑さと選んだ動画エンジンによって変わります。' },
      { q: 'AIが生成した内容を編集できますか？', a: 'はい。脚本の編集、キャラクターデザインの調整、絵コンテの修正ができ、制作を完全にコントロールできます。' },
      { q: '生成した作品は商用利用できますか？', a: '生成物の著作権は各生成エンジンに帰属します。商用利用の可否は各エンジンの規約をご確認ください。青楓は編集・後処理ツールを提供するのみです。' },
      { q: '作品はどう書き出しますか？', a: 'プロジェクト詳細ページの「ダウンロード」をクリックすると、動画・画像・脚本などすべての素材を書き出せます。' },
    ],
    moreTitle: '他にご質問は？',
    moreDesc: 'サポートチームがいつでもお手伝いします',
    sendEmail: 'メールを送る',
    liveChat: 'オンラインサポート',
  },
  examples: {
    title: '注目の作品',
    subtitle: 'AIが創作した素晴らしいコミックドラマを探そう',
    ctaTitle: '自分の作品を作る準備はできましたか？',
    ctaDesc: '数千人のクリエイターに加わり、AIコミック制作の旅を始めよう',
    ctaButton: '今すぐ作成を始める',
  },

    visionAudit: {
      verdictExcellent: "優秀",
      verdictGood: "良好",
      verdictNeedsWork: "要改善",
      verdictPoor: "要やり直し",
      noDataMessage: "まだ品質チェックデータがありません。完成動画を生成した後、各ショットが脚本と一致しているかAI評価されます。",
      panelTitle: "品質チェック · 映像 vs 脚本",
      avgScore: "平均スコア",
      shotUnit: "ショット",
      passLabel: "合格",
      warnLabel: "警告",
      failLabel: "不一致",
      weakestShotsTitle: "要注意（優先的に再生成）：",
      rebirthPlanPrefix: "再生成プラン · ",
      rebirthPlanSuffix: "個の弱ショットを再撮影推奨",
      reshootButton: "ワークショップで再撮影",
      dimScene: "シーン",
      dimAction: "アクション",
      dimMood: "雰囲気",
      dimComposition: "構図",
    },
    usagePage: {
      eyebrow: "使用量とコスト",
      headline: "コスト可観測性",
      budgetLabel: "月次予算 ¥",
      budgetPlaceholder: "上限なし",
      nearDays: "過去",
      daySuffix: "日間",
      daysCostSuffix: "日間の費用",
      refreshTitle: "更新",
      loading: "読み込み中…",
      loadFailed: "読み込みに失敗しました",
      activeAlertsBanner: "アクティブなクォータアラート · 過去1時間",
      goBilling: "請求へ",
      statusOk: "予算は正常",
      statusWarn: "上限に近づいています",
      statusOver: "予算超過",
      statusNone: "上限未設定",
      alertExhausted: "クォータ枯渇",
      alertSaturated: "上流が飽和",
      alertRateLimited: "レート制限中",
      alertAuthFailed: "認証失敗",
      alertModelUnavailable: "モデル利用不可",
      thisMonthBudget: "今月の予算",
      quotaTitle: "今月のクォータ",
      quotaUnlimited: "無制限",
      quotaExceeded: "プラン上限を超過 — チャージまたは低コストエンジンへ",
      quotaNearLimit: "プラン上限に接近",
      quotaOfCeiling: "プラン上限",
      projectedEndPrefix: "月末予測",
      noCapSuffix: " · 上限なし",
      statGenerations: "生成回数",
      statEngines: "エンジン数",
      engineCostPrefix: "エンジン費用 · 過去",
      engineNoData: "この期間のコスト記録はありません。",
      dailyTrendTitle: "日次コスト推移",
      dailyNoData: "日次データがありません。",
      countSuffix: "回",
    },
    healthPage: {
      title: "API ヘルス",
      subtitle: "モデル / ゲートウェイのリアルタイム状態 · 残高切れや障害を一目で確認",
      refreshBtn: "再プローブ",
      loadFailed: "プローブ失敗",
      kindLlm: "大規模言語モデル",
      kindTts: "音声",
      kindVideo: "動画",
      kindImage: "画像",
      kindGateway: "ゲートウェイ",
      overallHealthy: "すべて正常",
      overallWarning: "警告あり",
      overallCritical: "障害 / 残高不足",
      balanceUsed: "使用済み",
      balanceAbundant: "残高十分（チャージ制）",
      balanceRemaining: "残高",
      balanceLimit: "上限",
      radarTitle: "モデルレーダー",
      radarDesc: "各 API の最新モデルをスキャン · 同ファミリーのみアップグレード · LLM は 1 トークン実検証 · ロールバック保持 · 再起動不要で反映",
      scanBtn: "最新モデルをスキャン",
      upgradeBtn: "最新最強にアップグレード",
      statusUpgradable: "アップグレード可能",
      statusUpToDate: "最新",
      statusFamilyN: "· ファミリー {n} モデル",
      statusSourceUnavail: "ソース利用不可",
      overridesTitle: "現在の上書き（アップグレード前にロールバック可能）:",
      rollbackBtn: "ロールバック",
      rollbackDefault: "（コードデフォルトに戻す）",
      checkedAt: "プローブ時刻:",
      cachedNote: "· キャッシュ結果（「再プローブ」で強制更新）",
      footer: "· ダッシュボードは残高の読み取り専用です。API キーは保存・送信されません。",
      scanFailed: "スキャン失敗",
      upgradeFailed: "アップグレード失敗",
      upgradeFailedLogin: "アップグレード失敗（ログインが必要）",
      upgradeNone: "アップグレード対象なし",
      upgradedSummary: "{n} 件アップグレード：{list}{skipped} — 再起動なしで反映済み",
      upgradeSkippedNote: "（{n} 件は実検証未通過のため元の値を維持）",
      upgradeSomeSkipped: "{n} 件の候補が実検証未通過。現在の設定を維持します",
      rolledBack: "{envKey} をロールバックしました",
    },
    seriesDetail: {
      statusDraft: "未生成",
      statusActive: "生成中",
      statusCompleted: "完了",
      statusFailed: "失敗・再試行可",
      backLink: "戻る",
      pageTitle: "シリーズ · 一括生成",
      statTotal: "全 {n} 話",
      statCompleted: "完了 {n}",
      statGenerating: "生成中 {n}",
      statFailed: "失敗 {n}",
      statPending: "未生成 {n}",
      batchGenerateBtn: "一括生成",
      batchGeneratePendingHint: "({n} 話待ち)",
      regenerateAll: "すべて再生成",
      seasonAssetsTitle: "シーズン成果物",
      seasonCoverAlt: "シーズンカバー",
      genCoverBtn: "カバー生成",
      regenCoverBtn: "カバー再生成",
      exportSeasonBtn: "フルシーズンを書き出す",
      reexportSeasonBtn: "フルシーズン再書き出し",
      exportFirstEpisodeHint: "先に少なくとも1話を生成してください",
      watchSeasonVideo: "フルシーズンを見る",
      seasonVideoDesc: "コンピレーション = 完了した各話を話数順に結合（アスペクト比統一 + 再エンコード）。",
      seasonFixBusyLabel: "⏳ シーズン修正中…",
      seasonFixLabel: "⚡ ダウングレードショット修正（{n} 話に影響）",
      seasonFixProgressMsg: "第 {episode} 話補正中（{current}/{total}）…",
      seasonFixDoneMsg: "シーズン修正完了（{n} 話）、再チェック中…",
      resumeStuckBtn: "🛟 停止した話を再開（30分間進捗なし → 保留にリセット）",
      loading: "読み込み中…",
      noEpisodes: "このシリーズにはエピソードがありません",
      episodeLabel: "第{n}話",
      healthCheckAllGreen: "全チェック通過",
      shotsDowngradedLabel: "{n}ショット降格",
      openEpisodeLink: "開く →",
      loadFailStatus: "読み込み失敗 {status}、更新してください",
      loadFailNetwork: "読み込み失敗、ネットワークを確認して更新してください",
      requestFailed: "リクエストに失敗しました",
      exportingSeasonMsg: "フルシーズン書き出し中（各話をダウンロード + 結合・再エンコード、最大約5分、ページを閉じないでください）…",
      exportCanceledMsg: "書き出しをキャンセルしました — 先にダウングレードショットを修正してから再書き出し",
      exportFailedStatus: "書き出し失敗 {status}",
      exportDoneMsg: "フルシーズン書き出し完了（{n} 話）",
      coverGeneratingMsg: "シーズンカバー生成中…",
      coverFailedStatus: "カバー生成失敗 {status}",
      coverDoneMsg: "シーズンカバーが生成されました",
      resumeCheckedMsg: "確認済み",
      resumeFailedMsg: "再開リクエストに失敗しました",
      resumeFailStatus: "失敗 {status}",
      batchQueuedMsg: "{n} 話をキューに追加（永続キュー、1話ずつ処理中…）",
      batchStartedMsg: "{n} 話の一括生成を開始（並列数 {concurrency}、処理中…）",
      noPendingEpisodes: "生成待ちのエピソードはありません",
      healthGateIssuePrefix: "問題の話：",
      healthGateEpisodeDetail: "第{ep}話（{shots}ショット降格）",
      healthGateConfirmHint: "それでも書き出しますか？（先に「ダウングレードショット修正」を推奨）",
      dramaPackageBtn: "📦 海外パッケージ",
      dramaPackageFetching: "パッケージ取得中…",
      dramaPackageTitle: "海外パッケージ · TikTok Drama Center",
      dramaPackageDownload: "JSON ダウンロード",
      dramaPackageCoverAlt: "シリーズカバー",
      dramaPackageLangEpisodes: "言語:{lang} · 全 {n} 話",
      dramaPackageTotalMin: "合計:{n} 分",
      dramaPackageEpFree: "無料",
      dramaPackageEpCoins: "{coins} coins",
      dramaPackageGuideTitle: "アップロード手順",
      dramaPackageErrPrefix: "取得失敗:",
      dramaPackageNetworkErr: "ネットワークエラー",
      dramaPackageViewVideo: "動画を見る",
      dramaPackageAiDeclaration: "本作品が AI 生成 / 深度合成技術で制作されたことを確認します(パッケージに声明を同梱)",
      dramaPackageAiRequiredHint: "先に AI 声明にチェックしてください",
    },
  providerHealth: {
    ok: "正常",
    outOfCredits: "残高切れ",
    authError: "認証失敗",
    misconfigured: "設定不足",
    down: "到達不可",
    notConfigured: "未設定",
    recharge: "チャージ",
    checkKey: "キー確認",
    addConfig: "設定追加",
    checkNetwork: "ネット/サービス確認",
    optionalSetup: "任意接続",
  },
};


// v12.213:ko/ru 全量文案包(workflow 翻译,深度合并 en 保证类型完整)
const ko: DeepPartial<Translations> = {
  "collab": {
    "notifTitle": "알림",
    "markAllRead": "모두 읽음 처리",
    "justNow": "방금",
    "mentioned": "회원님을 언급했습니다",
    "replied": "회원님에게 답글을 달았습니다",
    "notifEmpty": "알림이 없습니다",
    "loginPrompt": "로그인하면 알림을 볼 수 있습니다",
    "reply": "답글",
    "deleted": "[삭제됨]",
    "commentPlaceholder": "댓글 작성… @으로 멘션",
    "commentEmpty": "아직 댓글이 없습니다 — 첫 번째로 남겨보세요",
    "send": "전송",
    "confirmDelete": "이 댓글을 삭제할까요?",
    "demoMode": "데모 모드",
    "demoEnginesOff": "엔진이 설정되지 않음",
    "demoPlaceholder": "생성 시 자리 표시 에셋이 사용됩니다",
    "demoLipsyncReady": "립싱크 렌더링이 바로 사용 가능합니다",
    "demoHowToEnable": "활성화 방법",
    "demoImage": "이미지",
    "demoVideo": "비디오",
    "readinessTitle": "엔진 설정",
    "readinessReal": "실제",
    "readinessSim": "모의"
  },
  "common": {
    "create": "만들기",
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "편집",
    "share": "공유",
    "download": "다운로드",
    "loading": "로딩 중...",
    "error": "오류",
    "success": "성공",
    "viewAll": "전체 보기",
    "backHome": "홈으로",
    "saveChanges": "변경 저장",
    "saving": "저장 중...",
    "reset": "초기화"
  },
  "brand": {
    "studio": "AI 만화 스튜디오"
  },
  "nav": {
    "home": "홈",
    "projects": "내 프로젝트",
    "create": "만들기",
    "pricing": "요금제",
    "profile": "프로필",
    "settings": "설정",
    "polish": "스크립트 다듬기",
    "workbench": "작업대",
    "cases": "쇼케이스",
    "userCenter": "대시보드",
    "newProject": "새 프로젝트"
  },
  "auth": {
    "brand": "Wind Comic", "welcomeBack": "Welcome back to Wind Comic", "createAccount": "Create an account",
    "loginSubtitle": "Sign in to enter the studio", "registerSubtitle": "Register to start creating",
    "username": "Username", "usernamePlaceholder": "Enter username", "email": "Email", "emailPlaceholder": "Enter email address",
    "password": "Password", "passwordPlaceholder": "Enter password",
    "demoHint": "Demo account: demo@qfmanju.ai (password from DEMO_PASSWORD)",
    "login": "Sign in", "register": "Sign up", "loginSuccess": "Signed in", "registerSuccess": "Account created",
    "actionFailed": "Something went wrong", "noAccount": "No account yet?", "hasAccount": "Already have an account?",
    "registerNow": "Sign up", "loginNow": "Sign in", "inviteCode": "Invite code", "inviteRequired": "(required for Beta)",
    "inviteNotFound": "Invite code not found", "inviteUsed": "This invite code has already been used",
    "inviteExpired": "Invite code expired", "inviteRevoked": "Invite code revoked",
    "inviteInvalid": "Invalid invite code format", "inviteGenericInvalid": "Invalid invite code",
    "inviteValid": "Invite code valid", "inviteChecking": "Checking...", "inviteValidateFailed": "Validation failed, try again later",
    "noInvite": "No invite code?", "applyBeta": "Request beta access", "waitlistTitle": "Request beta access",
    "waitlistDesc": "Leave your email and we will send an invite after review",
    "waitlistPurpose": "Use case (optional)", "waitlistPurposePlaceholder": "e.g. serial comics / client ads / learning AI video...",
    "waitlistSubmit": "Join waitlist", "waitlistSubmitting": "Submitting...",
    "waitlistDefaultOk": "You are on the waitlist. We will email you after review.",
    "waitlistSubmitFailed": "Submit failed, try again later", "waitlistNetworkError": "Network error"
  },
  "sidebar": {
    "overview": "Overview", "myProjects": "My Projects", "workshop": "Workshop", "shortVideo": "Storyboard Desk",
    "storyIntake": "Long-form Split", "series": "My Series", "polish": "Script Polish", "u2v": "Image to Video",
    "mv": "MV Beats", "comic": "Comic to Video", "editChat": "Edit Chat", "assets": "Assets",
    "characters": "Characters", "ipMarket": "IP Market", "workflows": "Workflows", "masterPrompt": "MasterPrompt",
    "styles": "Style Gallery", "cases": "Inspiration", "templates": "Templates", "account": "Account",
    "team": "Team", "health": "API Health", "usage": "Usage & Cost", "jobs": "Job Queue",
    "billing": "Billing", "logout": "Sign out", "expand": "Expand sidebar", "collapse": "Collapse sidebar", "backHome": "Back to home"
  },
  "errors": {
    "title": "Something went wrong", "description": "The app hit an unexpected error. We have logged it.",
    "retry": "Retry", "backHome": "Back to home", "pageTitle": "This page failed",
    "unknown": "An unknown error occurred. Please retry.", "backWorkbench": "Back to studio", "loading": "Loading"
  },
  "dashProjects": {
    "eyebrow": "Library", "title": "My Projects", "subtitle": "Manage and track your AI short-drama work", "newCreate": "New project",
    "filterAll": "All", "filterActive": "In progress", "filterCompleted": "Completed", "filterDraft": "Draft", "filterArchived": "Archived",
    "emptyAll": "No projects yet", "emptyFiltered": "No projects match this filter",
    "emptyHint": "Enter an idea and the AI team will take it from script to finished film",
    "startCreate": "Start creating", "importing": "Importing…", "importDemo": "Import demo: Rain Signal",
    "importDemoHint": "No API key needed — 4-shot mystery short with film, audit, and export ready",
    "untitled": "Untitled", "deleteConfirm": "Delete “{title}”? This cannot be undone (storyboards, video, and voiceover included).",
    "restoreTitle": "Restore to main list", "archiveTitle": "Archive (remove from main list, can restore)", "deleteTitle": "Delete project (cannot undo)",
    "shotsUnit": "shots", "polished": "Polished", "polishBtn": "Polish", "polishTitle": "Polish this script in Polish Studio",
    "statusCompleted": "Completed", "statusActive": "In progress", "statusDraft": "Draft", "statusArchived": "Archived"
  },
  "dashBanner": {
    "title": "API status alerts", "itemsUnit": "items",
    "autoFallback": "The pipeline will fall back to backup engines automatically. To top up, contact an admin or open",
    "billingLink": "Billing", "dismiss": "Hide for this session",
    "exhausted": "Out of credits", "saturated": "Upstream saturated", "rateLimited": "Rate limited",
    "authFailed": "Auth failed", "modelUnavailable": "Plan does not include this model",
    "kling": "Kling (video)", "qingyuntop": "Qingyuntop (gateway)"
  },
  "continueCard": {
    "eyebrow": "Continue", "statusActive": "In progress", "statusDraft": "Draft", "statusCompleted": "Completed",
    "draftReadyLabel": "Back to workshop — ROLL", "draftReadyHint": "Script draft is ready; the full pipeline has not run yet",
    "draftEmptyLabel": "Finish setup — ROLL", "draftEmptyHint": "Still at the idea stage — about 30 characters is enough to start",
    "activeLabel": "View generation progress", "activeHint": "Pipeline is running; check Job Queue for stage detail",
    "completedLabel": "Watch · audit · export", "completedHint": "Try pacing audit and EDL/AAF export; weak shots can be 4K re-rendered",
    "openLabel": "Open project", "openHint": "Pick up where you left off"
  },
  "product": {
    "director": "Director", "writer": "Writer", "characterDesign": "Character Design", "sceneDesign": "Scene Design",
    "storyboard": "Storyboard", "videoGen": "Video", "editor": "Editor", "producer": "Producer",
    "untitled": "Untitled project", "creating": "In production", "collapseChat": "Collapse chat", "expandChat": "Expand chat",
    "timeline": "Timeline", "shotsUnit": "shots", "generating": "Generating...", "pending": "Pending", "shotN": "Shot {n}",
    "tabDirector": "Director", "tabScript": "Script", "tabCharacters": "Cast", "tabScenes": "Scenes", "tabStoryboard": "Boards",
    "tabContinuity": "Continuity", "tabVideos": "Video", "tabWorkshop": "Shot Workshop", "tabTimeline": "Cinema Timeline",
    "tabPacing": "Pacing", "tabPullsheet": "Pull sheet", "tabVision": "QC", "tabOneclick": "One-click film",
    "tabMonitor": "Monitor", "tabParam": "Params", "tabComments": "Comments", "tabDistribution": "Distribute", "tabPlay": "Play",
    "groupCreate": "Create", "groupRefine": "Refine", "groupReview": "Review", "groupDeliver": "Deliver",
    "statShots": "Shots", "statCast": "Cast", "statScore": "Score", "statStatus": "Status", "statusDone": "Done", "statusMaking": "In progress",
    "emptyCharacters": "No characters yet", "emptyScenes": "No scenes yet", "emptyVideos": "No shot videos yet",
    "saved": "Project auto-saved", "undone": "Undone", "nothingToUndo": "Nothing to undo",
    "hotkeys": "Shortcuts", "hotkeysDesc": "Ctrl/⌘+S save · Ctrl/⌘+Z undo · Space play · ? help",
    "videoPreview": "Video preview", "openNewWindow": "Open in new window", "close": "Close", "videoLoadFail": "Video failed to load",
    "dropUploading": "Uploading...", "dropFailed": "Upload failed", "dropRetry": "Upload failed, try again",
    "dropHint": "Drop files here, or click to choose", "dropHintSub": "Images and video, max 50MB", "dropHere": "Release to upload...",
    "phasePlan": "Directing", "phaseScript": "Writing", "phaseCharacters": "Characters", "phaseScenes": "Scenes",
    "phaseStoryboardPlans": "Board plan", "phaseStoryboards": "Rendering boards", "phaseVideo": "Generating video",
    "phasePacing": "Pacing audit", "phaseEdit": "Edit & mux", "phaseReview": "Director review", "phaseComplete": "Done"
  },
  "create": {
    "badge": "AI 창작 스튜디오",
    "title": "창작 여정을 시작하세요",
    "subtitle": "스토리 아이디어를 입력하면 AI 팀이 완성된 만화 드라마를 만들어 드립니다",
    "ideaLabel": "스토리 아이디어",
    "ideaPlaceholder": "예: 시간 여행자의 사랑 이야기...",
    "videoProviderLabel": "비디오 생성 엔진",
    "startButton": "창작 시작"
  },
  "projects": {
    "title": "내 프로젝트",
    "subtitle": "AI 만화 드라마 창작물을 모두 관리하세요",
    "searchPlaceholder": "프로젝트 제목 또는 설명 검색...",
    "filterAll": "전체",
    "filterCompleted": "완료",
    "filterCreating": "제작 중",
    "filterFailed": "실패",
    "noResults": "일치하는 프로젝트가 없습니다",
    "createNew": "새 프로젝트 만들기",
    "shotsUnit": "컷"
  },
  "dashboard": {
    "systemOnline": "시스템 온라인",
    "title": "창작 현황",
    "subtitle": "멀티 에이전트 AI 엔진 — 아이디어에서 완성작까지 원스톱 만화 제작 라인",
    "quickStartTitle": "창작 시작",
    "quickStartSubtitle": "아이디어를 입력하면 7인 AI 팀이 제작합니다",
    "statProjects": "내 프로젝트",
    "statProjectsSub": "진행 중인 만화 프로젝트",
    "statGenerations": "생성 횟수",
    "statGenerationsSub": "AI 생성 총 호출 수",
    "statCases": "쇼케이스",
    "statCasesSub": "참고 템플릿 케이스",
    "recentCreations": "최근 창작물",
    "noRecords": "아직 창작물이 없습니다",
    "startFirst": "첫 번째 창작 시작하기 →",
    "systemStatus": "시스템 상태",
    "recentActivity": "최근 활동",
    "statusCompleted": "완료",
    "statusCreating": "제작 중",
    "statusDraft": "초안"
  },
  "settings": {
    "title": "설정",
    "subtitle": "앱 환경설정 및 계정 설정을 관리하세요",
    "general": "일반",
    "generalDesc": "언어 및 지역 설정",
    "language": "언어",
    "appearance": "외관",
    "appearanceDesc": "인터페이스 테마 변경",
    "theme": "테마",
    "themeDark": "다크",
    "themeLight": "라이트",
    "themeAuto": "시스템 기본값",
    "notifications": "알림",
    "notificationsDesc": "알림 설정 관리",
    "projectDone": "프로젝트 완료 알림",
    "projectDoneDesc": "프로젝트가 완료되면 알림을 받습니다",
    "performance": "성능",
    "performanceDesc": "앱 성능 최적화",
    "videoQuality": "비디오 품질",
    "qualityHigh": "고화질",
    "qualityMedium": "중간",
    "qualityLow": "저화질 (데이터 절약)",
    "privacy": "개인정보 및 보안",
    "privacyDesc": "계정을 안전하게 보호하세요",
    "changePassword": "비밀번호 변경",
    "enable2fa": "2단계 인증 활성화",
    "manageDevices": "로그인된 기기 관리",
    "billing": "청구 및 구독",
    "billingDesc": "구독 플랜 관리",
    "freePlan": "무료 플랜",
    "currentPlan": "현재 플랜",
    "freeQuota": "월 10개 프로젝트",
    "upgradePro": "Pro로 업그레이드",
    "saved": "설정이 저장되었습니다",
    "savedDesc": "환경설정이 업데이트되었습니다",
    "resetDone": "설정이 초기화되었습니다"
  },
  "profile": {
    "title": "프로필",
    "subtitle": "개인 정보 및 환경설정을 관리하세요",
    "avatar": "아바타",
    "uploadAvatar": "아바타 업로드",
    "basicInfo": "기본 정보",
    "basicInfoDesc": "프로필을 업데이트하세요",
    "username": "사용자 이름",
    "email": "이메일",
    "bio": "소개",
    "bioPlaceholder": "자기소개를 입력하세요...",
    "stats": "창작 통계",
    "totalProjects": "총 프로젝트",
    "inProgress": "진행 중",
    "totalShots": "총 컷 수",
    "saveSuccess": "저장됨",
    "saveSuccessDesc": "프로필이 업데이트되었습니다",
    "role": "역할",
    "accountPrefs": "계정 및 환경설정",
    "visualPref": "시각적 환경설정",
    "collabSpace": "협업 공간"
  },
  "billing": {
    "title": "구독 관리",
    "currentTier": "현재 플랜: ",
    "paymentNote": "Stripe Checkout으로 결제; 취소 또는 카드 변경은 Stripe Customer Portal에서 진행",
    "recommended": "추천",
    "currentBadge": "현재",
    "contactUs": "문의하기",
    "perMonth": "/월",
    "alreadyThis": "현재 플랜",
    "freeNoPurchase": "무료 · 구매 불필요",
    "businessTalk": "영업팀 문의",
    "upgradeTo": "업그레이드:",
    "portalNote": "Stripe Customer Portal에서 업그레이드, 다운그레이드, 취소 또는 결제 수단 변경; 자체 호스팅 시 STRIPE_PORTAL_LINK 설정 필요.",
    "openPortal": "Stripe Customer Portal 열기",
    "checkoutFailed": "결제 실패",
    "paymentCanceled": "결제가 취소되었습니다",
    "upgradedPrefix": "업그레이드 완료:",
    "upgradedSuffix": "! 구독이 활성화되었습니다"
  },
  "cases": {
    "title": "쇼케이스",
    "titlePublic": "추천 케이스",
    "subtitle": "QingFeng 파트너 및 크리에이터의 작품",
    "subtitleReuse": "QingFeng 파트너 및 크리에이터 · 클릭하여 아이디어 재사용",
    "copyPrompt": "프롬프트 복사",
    "copied": "복사됨",
    "usePrompt": "이걸로 만들기"
  },
  "home": {
    "heroTagline1": "/ AI 단편 드라마 제작 콘솔 — 생성을 넘어서",
    "heroTagline2": "페이싱 감사 · 품질 게이트 · 캐릭터 일관성 고정 · AAF/EDL로 편집 라인 연동 · 팀 워크플로우 — \"생성된다\"를 \"완성된다\"로",
    "heroEngines": "생성 레이어 · 최강 엔진 직접 연결 (BYO Key)",
    "heroCtaCreate": "창작 시작 →",
    "heroCtaCases": "작품 보기",
    "featureTitle": "영화감독처럼 페이싱을 지휘하세요",
    "featureSubtitle": "스크립트, 스토리보드, 애니메이션, 음향 전반의 시각적 협업 워크플로우",
    "agentsTitle": "AI 애니메이션 에이전트 팀",
    "agentsSubtitle": "모든 역할이 실시간으로 협업합니다",
    "lensCaption": "렌즈 박스: 카메라 움직임, 초점 거리, 앵글 커스텀",
    "lensTitle": "모든 프레임에 통일된 시네마틱 언어",
    "lensDesc": "일관된 스타일, 색감, 카메라 무빙 규칙",
    "frameTitle": "AI가 빠르게 생성하는 스토리보드",
    "frameSubtitle": "한 문장에서 편집 가능한 멀티 컷 시퀀스까지",
    "frameSteps": [{
        "title": "스크립트 구조",
        "desc": "스토리 페이싱 스마트 파싱"
      }, {
        "title": "컷 분해",
        "desc": "멀티 컷 스토리보드 자동 생성"
      }, {
        "title": "캐릭터 설정",
        "desc": "캐릭터와 스타일 일관성 유지"
      }],
    "frameCta": "스토리보드 생성",
    "vibeKicker": "무드 보드: 실시간 비주얼·오디오 업데이트",
    "vibeTitle": "실시간으로 무드와 리듬 미리보기",
    "vibeDesc": "비주얼, 카메라, 음악이 함께 감정을 이끕니다",
    "casesTitle": "추천 케이스",
    "casesSubtitle": "QingFeng 파트너 및 크리에이터의 작품",
    "casesTryNow": "지금 체험",
    "ctaTitle": "스토리를 애니메이션으로",
    "ctaDesc": "지금 바로 첫 AI 만화 드라마를 시작하세요",
    "ctaButton": "작업대 입장"
  },
  "pricing": {
    "enterWorkbench": "작업대 입장",
    "badge": "요금제",
    "titleLead": "나에게 맞는 ",
    "titleHighlight": "플랜을 선택하세요",
    "subtitle": "무료 체험부터 기업 자체 호스팅까지, QingFeng이 모든 크리에이터에게 최적의 AI 만화 제작 플랜을 제공합니다",
    "custom": "맞춤형",
    "customNote": "견적 요청, 영업팀 문의",
    "free": "무료",
    "startUsing": "시작하기",
    "apiAccess": "API 액세스",
    "commercialLicense": "상업용 라이선스",
    "footnote": "모든 플랜 포함: 24/7 AI 엔진 지원 · 결제 즉시 적용 · 언제든 취소 가능",
    "faqTitle": "자주 묻는 질문",
    "faq": [{
        "q": "무료 플랜의 제한 사항은 무엇인가요?",
        "a": "무료 플랜은 월 3개 프로젝트, 캐릭터 라이브러리 최대 5개, 720p 비디오 내보내기, QingFeng 워터마크가 포함됩니다. 개인 체험에 적합합니다."
      }, {
        "q": "업그레이드 후 바로 새 기능을 사용할 수 있나요?",
        "a": "네. 결제가 완료되면 해당 플랜 혜택이 즉시 활성화됩니다 — 검토 대기 없습니다."
      }, {
        "q": "Pro 상업용 라이선스는 어디까지 적용되나요?",
        "a": "Pro 상업용 라이선스를 통해 QingFeng으로 생성한 콘텐츠를 광고, 브랜딩, 영상 배급 등 상업 목적으로 사용할 수 있습니다. 단, 소스 모델 재훈련 권리는 포함되지 않습니다."
      }, {
        "q": "Enterprise와 Pro의 차이점은 무엇인가요?",
        "a": "Enterprise는 자체 호스팅을 지원합니다 — 전체 AI 시스템을 자체 프라이빗 서버에 배포하고, 맞춤 AI 에이전트 개발, SLA 보장, 전담 고객 성공 매니저 서비스가 포함됩니다."
      }, {
        "q": "구독을 언제든 취소할 수 있나요?",
        "a": "네. 계정 설정에서 언제든 취소할 수 있습니다. 취소 후 현재 결제 주기가 끝날 때까지 모든 기능을 이용할 수 있습니다."
      }],
    "moreTitle": "더 궁금한 점이 있나요?",
    "moreDesc": "팀이 언제든 도움을 드립니다",
    "contactSupport": "고객 지원 문의",
    "alertPayment": "결제는 아직 연동되지 않았습니다 — 현재 무료 / 셀프 호스팅입니다."
  },
  "help": {
    "examples": "예시 작품",
    "title": "도움말 센터",
    "subtitle": "AI 만화 창작에 필요한 답을 찾고 시작하세요",
    "searchPlaceholder": "도움말 검색...",
    "quickGuides": "빠른 가이드",
    "guides": [{
        "title": "빠른 시작",
        "description": "5분 만에 첫 AI 만화 드라마 만들기"
      }, {
        "title": "창작 가이드",
        "description": "AI 만화 창작 기술과 모범 사례 익히기"
      }, {
        "title": "커뮤니티 튜토리얼",
        "description": "크리에이터 커뮤니티가 공유하는 팁"
      }],
    "faqTitle": "자주 묻는 질문",
    "faqs": [{
        "q": "첫 프로젝트는 어떻게 시작하나요?",
        "a": "\"창작 시작\"을 클릭하고 스토리 아이디어를 입력한 뒤 비디오 엔진을 선택하면 AI가 완성된 만화 드라마를 생성합니다."
      }, {
        "q": "지원하는 비디오 엔진은 무엇인가요?",
        "a": "Minimax, Vidu, Kling AI 등 여러 엔진을 지원합니다 — 필요에 맞는 엔진을 선택하세요."
      }, {
        "q": "프로젝트 생성에 얼마나 걸리나요?",
        "a": "보통 5~15분 정도이며, 프로젝트 복잡도와 선택한 비디오 엔진에 따라 다릅니다."
      }, {
        "q": "AI가 생성한 콘텐츠를 편집할 수 있나요?",
        "a": "네 — 스크립트 편집, 캐릭터 디자인 조정, 스토리보드 수정이 가능합니다. 창작 과정을 완전히 제어할 수 있습니다."
      }, {
        "q": "작품을 상업적으로 사용할 수 있나요?",
        "a": "생성된 자산의 저작권은 각 기반 엔진(Kling / MiniMax 등)에 귀속됩니다. 상업적 사용 가능 여부는 각 엔진의 이용약관에 따르므로 반드시 직접 확인하세요. QingFeng은 멀티 에이전트 편집·후처리 도구만 제공하며 생성물의 상업적 권리를 보장하지 않습니다."
      }, {
        "q": "작품을 어떻게 내보내나요?",
        "a": "프로젝트 상세 페이지에서 \"다운로드\"를 클릭하면 비디오, 이미지, 스크립트 및 모든 에셋을 내보낼 수 있습니다."
      }],
    "moreTitle": "더 궁금한 점이 있나요?",
    "moreDesc": "지원팀이 언제든 도움을 드릴 준비가 되어 있습니다",
    "sendEmail": "이메일 보내기",
    "liveChat": "실시간 채팅"
  },
  "examples": {
    "title": "추천 작품",
    "subtitle": "AI가 만든 멋진 만화 드라마를 탐험해 보세요",
    "ctaTitle": "나만의 작품을 만들 준비가 되셨나요?",
    "ctaDesc": "수천 명의 크리에이터와 함께 AI 만화 여정을 시작하세요",
    "ctaButton": "지금 창작 시작"
  },
  "visionAudit": {
    "verdictExcellent": "우수",
    "verdictGood": "양호",
    "verdictNeedsWork": "개선 필요",
    "verdictPoor": "미흡",
    "noDataMessage": "아직 품질 검사 데이터가 없습니다. 최종 영상 생성 후 각 컷이 스크립트와 얼마나 일치하는지 AI가 채점합니다.",
    "panelTitle": "품질 검사 · 비주얼 vs 스크립트",
    "avgScore": "평균 점수",
    "shotUnit": "컷",
    "passLabel": "통과",
    "warnLabel": "경고",
    "failLabel": "이탈",
    "weakestShotsTitle": "우선 처리 컷 (주의 필요):",
    "rebirthPlanPrefix": "재생성 계획 · ",
    "rebirthPlanSuffix": "개 약한 컷 재촬영 권장",
    "reshootButton": "워크샵에서 재촬영하기",
    "dimScene": "장면",
    "dimAction": "액션",
    "dimMood": "무드",
    "dimComposition": "구도"
  },
  "usagePage": {
    "eyebrow": "사용량 및 비용",
    "headline": "비용 가시성",
    "budgetLabel": "월 예산 ¥",
    "budgetPlaceholder": "무제한",
    "nearDays": "최근",
    "daySuffix": "일",
    "daysCostSuffix": "일 지출",
    "refreshTitle": "새로고침",
    "loading": "로딩 중…",
    "loadFailed": "로드 실패",
    "activeAlertsBanner": "활성 할당량 알림 · 최근 1시간",
    "goBilling": "청구로 이동",
    "statusOk": "예산 양호",
    "statusWarn": "한도 근접",
    "statusOver": "예산 초과",
    "statusNone": "한도 미설정",
    "alertExhausted": "할당량 소진",
    "alertSaturated": "업스트림 포화",
    "alertRateLimited": "속도 제한",
    "alertAuthFailed": "인증 실패",
    "alertModelUnavailable": "모델 사용 불가",
    "thisMonthBudget": "이번 달 예산",
    "quotaTitle": "이번 달 할당량",
    "quotaUnlimited": "무제한",
    "quotaExceeded": "플랜 상한 초과 — 충전 또는 경제형 엔진으로 전환",
    "quotaNearLimit": "플랜 상한 근접",
    "quotaOfCeiling": "플랜 상한",
    "projectedEndPrefix": "예상 월말 지출",
    "noCapSuffix": " · 한도 미설정",
    "statGenerations": "생성 횟수",
    "statEngines": "엔진 수",
    "engineCostPrefix": "엔진 지출 · 최근",
    "engineNoData": "이 기간에 비용 기록이 없습니다.",
    "dailyTrendTitle": "일별 비용 추이",
    "dailyNoData": "일별 데이터가 없습니다.",
    "countSuffix": "회"
  },
  "healthPage": {
    "title": "API 상태",
    "subtitle": "모델 / 게이트웨이 실시간 상태 · 할당량 문제와 장애를 한눈에",
    "refreshBtn": "재탐색",
    "loadFailed": "탐색 실패",
    "kindLlm": "LLM",
    "kindTts": "TTS",
    "kindVideo": "비디오",
    "kindImage": "이미지",
    "kindGateway": "게이트웨이",
    "overallHealthy": "모두 정상",
    "overallWarning": "경고",
    "overallCritical": "장애 / 요금 미납",
    "balanceUsed": "사용됨",
    "balanceAbundant": "충분한 할당량 (선불)",
    "balanceRemaining": "잔여",
    "balanceLimit": "한도",
    "radarTitle": "모델 레이더",
    "radarDesc": "각 API에서 최신 모델 스캔 · 동일 계열만 업그레이드 · LLM 1토큰 실 테스트 · 롤백 보존 · 재시작 불필요",
    "scanBtn": "최신 모델 스캔",
    "upgradeBtn": "최신 버전으로 업그레이드",
    "statusUpgradable": "업그레이드 가능",
    "statusUpToDate": "최신 상태",
    "statusFamilyN": "· 계열 {n}개",
    "statusSourceUnavail": "소스 사용 불가",
    "overridesTitle": "현재 적용 중 (롤백 가능):",
    "rollbackBtn": "롤백",
    "rollbackDefault": "(코드 기본값 복원)",
    "checkedAt": "탐색 시각",
    "cachedNote": "· 캐시된 결과 (\"재탐색\" 클릭 시 강제 새로고침)",
    "footer": "· 대시보드는 할당량 읽기 전용으로 API 키를 저장하거나 전송하지 않습니다.",
    "scanFailed": "스캔 실패",
    "upgradeFailed": "업그레이드 실패",
    "upgradeFailedLogin": "업그레이드 실패 (로그인 필요)",
    "upgradeNone": "업그레이드 가능한 항목 없음",
    "upgradedSummary": "{n}개 항목 업그레이드: {list}{skipped} — 재시작 없이 적용됨",
    "upgradeSkippedNote": " ({n}개 건너뜀: 실 테스트 실패, 기존값 유지)",
    "upgradeSomeSkipped": "{n}개 후보 실 테스트 실패, 현재 설정 유지",
    "rolledBack": "{envKey} 롤백 완료"
  },
  "seriesDetail": {
    "statusDraft": "대기 중",
    "statusActive": "생성 중",
    "statusCompleted": "완료",
    "statusFailed": "실패 · 재시도",
    "backLink": "뒤로",
    "pageTitle": "시리즈 · 일괄 생성",
    "statTotal": "총 {n}화",
    "statCompleted": "완료 {n}",
    "statGenerating": "생성 중 {n}",
    "statFailed": "실패 {n}",
    "statPending": "대기 {n}",
    "batchGenerateBtn": "일괄 생성",
    "batchGeneratePendingHint": "({n}화 대기 중)",
    "regenerateAll": "전체 재생성",
    "seasonAssetsTitle": "시즌 에셋",
    "seasonCoverAlt": "시즌 커버",
    "genCoverBtn": "커버 생성",
    "regenCoverBtn": "커버 재생성",
    "exportSeasonBtn": "전 시즌 내보내기",
    "reexportSeasonBtn": "전 시즌 재내보내기",
    "exportFirstEpisodeHint": "에피소드를 하나 이상 먼저 생성하세요",
    "watchSeasonVideo": "전 시즌 보기",
    "seasonVideoDesc": "컴필레이션 = 완성된 에피소드를 순서대로 연결한 것 (화면 비율 통일 + 재인코딩)",
    "seasonFixBusyLabel": "⏳ 시즌 수정 중…",
    "seasonFixLabel": "⚡ 다운그레이드된 컷 수정 ({n}화 영향)",
    "seasonFixProgressMsg": "{episode}화 수정 중 ({current}/{total})…",
    "seasonFixDoneMsg": "시즌 수정 완료 ({n}화), 재검사 중…",
    "resumeStuckBtn": "🛟 중단된 에피소드 재개 (30분 진행 없음 → 대기 중으로 초기화)",
    "loading": "로딩 중…",
    "noEpisodes": "이 시리즈에 에피소드가 없습니다",
    "episodeLabel": "{n}화",
    "healthCheckAllGreen": "모든 검사 통과",
    "shotsDowngradedLabel": "{n}컷 다운그레이드됨",
    "openEpisodeLink": "열기 →",
    "loadFailStatus": "로드 실패 {status}, 새로고침해 주세요",
    "loadFailNetwork": "로드 실패, 네트워크를 확인하고 새로고침해 주세요",
    "requestFailed": "요청 실패",
    "exportingSeasonMsg": "전 시즌 내보내는 중 (에피소드 다운로드 + 연결 및 재인코딩, 최대 ~5분, 페이지를 닫지 마세요)…",
    "exportCanceledMsg": "내보내기 취소됨 — 다운그레이드된 컷을 먼저 수정한 뒤 재내보내기하세요",
    "exportFailedStatus": "내보내기 실패 {status}",
    "exportDoneMsg": "전 시즌 내보내기 완료 ({n}화)",
    "coverGeneratingMsg": "시즌 커버 생성 중…",
    "coverFailedStatus": "커버 생성 실패 {status}",
    "coverDoneMsg": "시즌 커버 생성 완료",
    "resumeCheckedMsg": "확인됨",
    "resumeFailedMsg": "재개 요청 실패",
    "resumeFailStatus": "실패 {status}",
    "batchQueuedMsg": "{n}화 일괄 생성 대기열에 추가됨 (지속 큐, 한 화씩 처리 중…)",
    "batchStartedMsg": "{n}화 일괄 생성 시작됨 (동시 처리 {concurrency}, 진행 중…)",
    "noPendingEpisodes": "생성 대기 중인 에피소드가 없습니다",
    "healthGateIssuePrefix": "문제 에피소드: ",
    "healthGateEpisodeDetail": "{ep}화 ({shots}컷 다운그레이드됨)",
    "healthGateConfirmHint": "그래도 내보내시겠습니까? (권장: 다운그레이드된 컷 먼저 수정)",
    dramaPackageBtn: "📦 해외 패키지",
    dramaPackageFetching: "패키지 데이터 가져오는 중…",
    dramaPackageTitle: "해외 패키지 · TikTok Drama Center",
    dramaPackageDownload: "JSON 다운로드",
    dramaPackageCoverAlt: "시리즈 커버",
    dramaPackageLangEpisodes: "언어: {lang} · 총 {n}화",
    dramaPackageTotalMin: "총 길이: {n}분",
    dramaPackageEpFree: "무료",
    dramaPackageEpCoins: "{coins} coins",
    dramaPackageGuideTitle: "업로드 단계",
    dramaPackageErrPrefix: "가져오기 실패: ",
    dramaPackageNetworkErr: "네트워크 오류",
    dramaPackageViewVideo: "영상 보기",
    dramaPackageAiDeclaration: "본 작품이 AI 생성 / 딥합성 기술로 제작되었음을 확인합니다(패키지에 선언 포함)",
    dramaPackageAiRequiredHint: "먼저 AI 선언에 체크하세요",
  },
  "providerHealth": {
    "ok": "정상",
    "outOfCredits": "크레딧 소진",
    "authError": "인증 실패",
    "misconfigured": "설정 오류",
    "down": "연결 불가",
    "notConfigured": "미설정",
    "recharge": "충전하기",
    "checkKey": "Key 확인",
    "addConfig": "설정 추가",
    "checkNetwork": "네트워크/서비스 확인",
    "optionalSetup": "선택 사항"
  }
};
const ru: DeepPartial<Translations> = {
  "collab": {
    "notifTitle": "Уведомления",
    "markAllRead": "Отметить все прочитанными",
    "justNow": "только что",
    "mentioned": "упомянул вас",
    "replied": "ответил вам",
    "notifEmpty": "Нет уведомлений",
    "loginPrompt": "Войдите, чтобы видеть уведомления",
    "reply": "Ответить",
    "deleted": "[удалено]",
    "commentPlaceholder": "Написать комментарий… @ для упоминания",
    "commentEmpty": "Комментариев пока нет — будьте первым",
    "send": "Отправить",
    "confirmDelete": "Удалить этот комментарий?",
    "demoMode": "Демо-режим",
    "demoEnginesOff": "движок(и) не настроен(ы)",
    "demoPlaceholder": "в генерации будут использоваться placeholder-ресурсы",
    "demoLipsyncReady": "синхронизация губ работает из коробки",
    "demoHowToEnable": "Как активировать",
    "demoImage": "изображение",
    "demoVideo": "видео",
    "readinessTitle": "Настройка движка",
    "readinessReal": "реальный",
    "readinessSim": "заглушка"
  },
  "common": {
    "create": "Создать",
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить",
    "edit": "Редактировать",
    "share": "Поделиться",
    "download": "Скачать",
    "loading": "Загрузка...",
    "error": "Ошибка",
    "success": "Успешно",
    "viewAll": "Смотреть все",
    "backHome": "На главную",
    "saveChanges": "Сохранить изменения",
    "saving": "Сохранение...",
    "reset": "Сбросить"
  },
  "brand": {
    "studio": "AI Comic Studio"
  },
  "nav": {
    "home": "Главная",
    "projects": "Мои проекты",
    "create": "Создать",
    "pricing": "Тарифы",
    "profile": "Профиль",
    "settings": "Настройки",
    "polish": "Шлифовка сценария",
    "workbench": "Рабочий стол",
    "cases": "Витрина",
    "userCenter": "Панель управления",
    "newProject": "Новый проект"
  },
  "auth": {
    "brand": "Wind Comic", "welcomeBack": "Welcome back to Wind Comic", "createAccount": "Create an account",
    "loginSubtitle": "Sign in to enter the studio", "registerSubtitle": "Register to start creating",
    "username": "Username", "usernamePlaceholder": "Enter username", "email": "Email", "emailPlaceholder": "Enter email address",
    "password": "Password", "passwordPlaceholder": "Enter password",
    "demoHint": "Demo account: demo@qfmanju.ai (password from DEMO_PASSWORD)",
    "login": "Sign in", "register": "Sign up", "loginSuccess": "Signed in", "registerSuccess": "Account created",
    "actionFailed": "Something went wrong", "noAccount": "No account yet?", "hasAccount": "Already have an account?",
    "registerNow": "Sign up", "loginNow": "Sign in", "inviteCode": "Invite code", "inviteRequired": "(required for Beta)",
    "inviteNotFound": "Invite code not found", "inviteUsed": "This invite code has already been used",
    "inviteExpired": "Invite code expired", "inviteRevoked": "Invite code revoked",
    "inviteInvalid": "Invalid invite code format", "inviteGenericInvalid": "Invalid invite code",
    "inviteValid": "Invite code valid", "inviteChecking": "Checking...", "inviteValidateFailed": "Validation failed, try again later",
    "noInvite": "No invite code?", "applyBeta": "Request beta access", "waitlistTitle": "Request beta access",
    "waitlistDesc": "Leave your email and we will send an invite after review",
    "waitlistPurpose": "Use case (optional)", "waitlistPurposePlaceholder": "e.g. serial comics / client ads / learning AI video...",
    "waitlistSubmit": "Join waitlist", "waitlistSubmitting": "Submitting...",
    "waitlistDefaultOk": "You are on the waitlist. We will email you after review.",
    "waitlistSubmitFailed": "Submit failed, try again later", "waitlistNetworkError": "Network error"
  },
  "sidebar": {
    "overview": "Overview", "myProjects": "My Projects", "workshop": "Workshop", "shortVideo": "Storyboard Desk",
    "storyIntake": "Long-form Split", "series": "My Series", "polish": "Script Polish", "u2v": "Image to Video",
    "mv": "MV Beats", "comic": "Comic to Video", "editChat": "Edit Chat", "assets": "Assets",
    "characters": "Characters", "ipMarket": "IP Market", "workflows": "Workflows", "masterPrompt": "MasterPrompt",
    "styles": "Style Gallery", "cases": "Inspiration", "templates": "Templates", "account": "Account",
    "team": "Team", "health": "API Health", "usage": "Usage & Cost", "jobs": "Job Queue",
    "billing": "Billing", "logout": "Sign out", "expand": "Expand sidebar", "collapse": "Collapse sidebar", "backHome": "Back to home"
  },
  "errors": {
    "title": "Something went wrong", "description": "The app hit an unexpected error. We have logged it.",
    "retry": "Retry", "backHome": "Back to home", "pageTitle": "This page failed",
    "unknown": "An unknown error occurred. Please retry.", "backWorkbench": "Back to studio", "loading": "Loading"
  },
  "dashProjects": {
    "eyebrow": "Library", "title": "My Projects", "subtitle": "Manage and track your AI short-drama work", "newCreate": "New project",
    "filterAll": "All", "filterActive": "In progress", "filterCompleted": "Completed", "filterDraft": "Draft", "filterArchived": "Archived",
    "emptyAll": "No projects yet", "emptyFiltered": "No projects match this filter",
    "emptyHint": "Enter an idea and the AI team will take it from script to finished film",
    "startCreate": "Start creating", "importing": "Importing…", "importDemo": "Import demo: Rain Signal",
    "importDemoHint": "No API key needed — 4-shot mystery short with film, audit, and export ready",
    "untitled": "Untitled", "deleteConfirm": "Delete “{title}”? This cannot be undone (storyboards, video, and voiceover included).",
    "restoreTitle": "Restore to main list", "archiveTitle": "Archive (remove from main list, can restore)", "deleteTitle": "Delete project (cannot undo)",
    "shotsUnit": "shots", "polished": "Polished", "polishBtn": "Polish", "polishTitle": "Polish this script in Polish Studio",
    "statusCompleted": "Completed", "statusActive": "In progress", "statusDraft": "Draft", "statusArchived": "Archived"
  },
  "dashBanner": {
    "title": "API status alerts", "itemsUnit": "items",
    "autoFallback": "The pipeline will fall back to backup engines automatically. To top up, contact an admin or open",
    "billingLink": "Billing", "dismiss": "Hide for this session",
    "exhausted": "Out of credits", "saturated": "Upstream saturated", "rateLimited": "Rate limited",
    "authFailed": "Auth failed", "modelUnavailable": "Plan does not include this model",
    "kling": "Kling (video)", "qingyuntop": "Qingyuntop (gateway)"
  },
  "continueCard": {
    "eyebrow": "Continue", "statusActive": "In progress", "statusDraft": "Draft", "statusCompleted": "Completed",
    "draftReadyLabel": "Back to workshop — ROLL", "draftReadyHint": "Script draft is ready; the full pipeline has not run yet",
    "draftEmptyLabel": "Finish setup — ROLL", "draftEmptyHint": "Still at the idea stage — about 30 characters is enough to start",
    "activeLabel": "View generation progress", "activeHint": "Pipeline is running; check Job Queue for stage detail",
    "completedLabel": "Watch · audit · export", "completedHint": "Try pacing audit and EDL/AAF export; weak shots can be 4K re-rendered",
    "openLabel": "Open project", "openHint": "Pick up where you left off"
  },
  "product": {
    "director": "Director", "writer": "Writer", "characterDesign": "Character Design", "sceneDesign": "Scene Design",
    "storyboard": "Storyboard", "videoGen": "Video", "editor": "Editor", "producer": "Producer",
    "untitled": "Untitled project", "creating": "In production", "collapseChat": "Collapse chat", "expandChat": "Expand chat",
    "timeline": "Timeline", "shotsUnit": "shots", "generating": "Generating...", "pending": "Pending", "shotN": "Shot {n}",
    "tabDirector": "Director", "tabScript": "Script", "tabCharacters": "Cast", "tabScenes": "Scenes", "tabStoryboard": "Boards",
    "tabContinuity": "Continuity", "tabVideos": "Video", "tabWorkshop": "Shot Workshop", "tabTimeline": "Cinema Timeline",
    "tabPacing": "Pacing", "tabPullsheet": "Pull sheet", "tabVision": "QC", "tabOneclick": "One-click film",
    "tabMonitor": "Monitor", "tabParam": "Params", "tabComments": "Comments", "tabDistribution": "Distribute", "tabPlay": "Play",
    "groupCreate": "Create", "groupRefine": "Refine", "groupReview": "Review", "groupDeliver": "Deliver",
    "statShots": "Shots", "statCast": "Cast", "statScore": "Score", "statStatus": "Status", "statusDone": "Done", "statusMaking": "In progress",
    "emptyCharacters": "No characters yet", "emptyScenes": "No scenes yet", "emptyVideos": "No shot videos yet",
    "saved": "Project auto-saved", "undone": "Undone", "nothingToUndo": "Nothing to undo",
    "hotkeys": "Shortcuts", "hotkeysDesc": "Ctrl/⌘+S save · Ctrl/⌘+Z undo · Space play · ? help",
    "videoPreview": "Video preview", "openNewWindow": "Open in new window", "close": "Close", "videoLoadFail": "Video failed to load",
    "dropUploading": "Uploading...", "dropFailed": "Upload failed", "dropRetry": "Upload failed, try again",
    "dropHint": "Drop files here, or click to choose", "dropHintSub": "Images and video, max 50MB", "dropHere": "Release to upload...",
    "phasePlan": "Directing", "phaseScript": "Writing", "phaseCharacters": "Characters", "phaseScenes": "Scenes",
    "phaseStoryboardPlans": "Board plan", "phaseStoryboards": "Rendering boards", "phaseVideo": "Generating video",
    "phasePacing": "Pacing audit", "phaseEdit": "Edit & mux", "phaseReview": "Director review", "phaseComplete": "Done"
  },
  "create": {
    "badge": "AI-студия создания",
    "title": "Начните свой творческий путь",
    "subtitle": "Опишите идею — AI-команда создаст для вас полноценный комикс-сериал",
    "ideaLabel": "Идея истории",
    "ideaPlaceholder": "Например: история любви путешественника во времени...",
    "videoProviderLabel": "Движок генерации видео",
    "startButton": "Начать создание"
  },
  "projects": {
    "title": "Мои проекты",
    "subtitle": "Управляйте всеми своими AI-комикс проектами",
    "searchPlaceholder": "Поиск по названию или описанию...",
    "filterAll": "Все",
    "filterCompleted": "Завершённые",
    "filterCreating": "В процессе",
    "filterFailed": "Ошибка",
    "noResults": "Проекты не найдены",
    "createNew": "Создать новый проект",
    "shotsUnit": "кадров"
  },
  "dashboard": {
    "systemOnline": "Система в сети",
    "title": "Обзор создания",
    "subtitle": "Мультиагентный AI-движок — конвейер от идеи до готового фильма",
    "quickStartTitle": "Начать создание",
    "quickStartSubtitle": "Введите идею — команда из 7 AI-агентов создаст её за вас",
    "statProjects": "Мои проекты",
    "statProjectsSub": "Комикс-проекты в работе",
    "statGenerations": "Генераций",
    "statGenerationsSub": "Всего вызовов AI",
    "statCases": "Витрина",
    "statCasesSub": "Референсные шаблоны",
    "recentCreations": "Недавние работы",
    "noRecords": "Пока нет ни одной работы",
    "startFirst": "Создайте первую →",
    "systemStatus": "Состояние системы",
    "recentActivity": "Последние действия",
    "statusCompleted": "Завершено",
    "statusCreating": "Создаётся",
    "statusDraft": "Черновик"
  },
  "settings": {
    "title": "Настройки",
    "subtitle": "Управляйте предпочтениями приложения и параметрами аккаунта",
    "general": "Основные",
    "generalDesc": "Язык и региональные настройки",
    "language": "Язык",
    "appearance": "Внешний вид",
    "appearanceDesc": "Настройте тему интерфейса",
    "theme": "Тема",
    "themeDark": "Тёмная",
    "themeLight": "Светлая",
    "themeAuto": "Системная",
    "notifications": "Уведомления",
    "notificationsDesc": "Управление уведомлениями",
    "projectDone": "Уведомление о завершении проекта",
    "projectDoneDesc": "Получать уведомление, когда проект готов",
    "performance": "Производительность",
    "performanceDesc": "Оптимизировать производительность приложения",
    "videoQuality": "Качество видео",
    "qualityHigh": "Высокое",
    "qualityMedium": "Среднее",
    "qualityLow": "Низкое (экономия трафика)",
    "privacy": "Конфиденциальность и безопасность",
    "privacyDesc": "Защита вашего аккаунта",
    "changePassword": "Изменить пароль",
    "enable2fa": "Включить 2FA",
    "manageDevices": "Управление устройствами",
    "billing": "Оплата и подписка",
    "billingDesc": "Управление подпиской",
    "freePlan": "Бесплатный план",
    "currentPlan": "Текущий план",
    "freeQuota": "10 проектов в месяц",
    "upgradePro": "Перейти на Pro",
    "saved": "Настройки сохранены",
    "savedDesc": "Ваши предпочтения обновлены",
    "resetDone": "Настройки сброшены"
  },
  "profile": {
    "title": "Профиль",
    "subtitle": "Управляйте личными данными и предпочтениями",
    "avatar": "Аватар",
    "uploadAvatar": "Загрузить аватар",
    "basicInfo": "Основная информация",
    "basicInfoDesc": "Обновите профиль",
    "username": "Имя пользователя",
    "email": "Email",
    "bio": "О себе",
    "bioPlaceholder": "Расскажите о себе...",
    "stats": "Статистика",
    "totalProjects": "Всего проектов",
    "inProgress": "В процессе",
    "totalShots": "Всего кадров",
    "saveSuccess": "Сохранено",
    "saveSuccessDesc": "Профиль обновлён",
    "role": "Роль",
    "accountPrefs": "Аккаунт и настройки",
    "visualPref": "Визуальные предпочтения",
    "collabSpace": "Пространство совместной работы"
  },
  "billing": {
    "title": "Подписка",
    "currentTier": "Текущий план: ",
    "paymentNote": "Оплата через Stripe Checkout; отмена или смена карты — через Stripe Customer Portal",
    "recommended": "Рекомендовано",
    "currentBadge": "Текущий",
    "contactUs": "Связаться с нами",
    "perMonth": "/мес",
    "alreadyThis": "Текущий план",
    "freeNoPurchase": "Бесплатно · без покупки",
    "businessTalk": "Связаться с продажами",
    "upgradeTo": "Перейти на",
    "portalNote": "Повышение, понижение, отмена и смена оплаты — в Stripe Customer Portal; для self-hosting требуется STRIPE_PORTAL_LINK.",
    "openPortal": "Открыть Stripe Customer Portal",
    "checkoutFailed": "Ошибка оформления",
    "paymentCanceled": "Оплата отменена",
    "upgradedPrefix": "Переход на",
    "upgradedSuffix": "! Подписка активна"
  },
  "cases": {
    "title": "Витрина",
    "titlePublic": "Избранные работы",
    "subtitle": "От партнёров и авторов QingFeng",
    "subtitleReuse": "От партнёров и авторов QingFeng · нажмите, чтобы использовать идею",
    "copyPrompt": "Скопировать промпт",
    "copied": "Скопировано",
    "usePrompt": "Использовать"
  },
  "home": {
    "heroTagline1": "/ Консоль производства AI-сериалов — не просто генерация",
    "heroTagline2": "Аудит темпа · контроль качества · консистентность персонажей · AAF/EDL в монтаж · командная работа — от «генерирует» до «сдаёт».",
    "heroEngines": "Слой генерации · подключи лучшие движки (BYO key)",
    "heroCtaCreate": "Начать создание →",
    "heroCtaCases": "Смотреть работы",
    "featureTitle": "Управляй темпом как режиссёр",
    "featureSubtitle": "Визуальный совместный воркфлоу: сценарий, раскадровка, анимация и звук.",
    "agentsTitle": "Команда AI-агентов анимации",
    "agentsSubtitle": "Каждая роль сотрудничает в реальном времени.",
    "lensCaption": "Блок линз: настройка движения камеры, фокусного расстояния и угла",
    "lensTitle": "Кинематографический язык, единый для каждого кадра",
    "lensDesc": "Единый стиль, цвет и правила движения камеры.",
    "frameTitle": "Раскадровки быстро создаются AI",
    "frameSubtitle": "Из одного предложения — редактируемая мультикадровая последовательность.",
    "frameSteps": [{
        "title": "Структура сценария",
        "desc": "Умный разбор темпа истории"
      }, {
        "title": "Разбивка на кадры",
        "desc": "Автоматическая мультикадровая раскадровка"
      }, {
        "title": "Настройка персонажей",
        "desc": "Консистентность персонажей и стиля"
      }],
    "frameCta": "Создать раскадровку",
    "vibeKicker": "Мудборд: живые обновления визуала и звука",
    "vibeTitle": "Настроение и ритм в реальном времени",
    "vibeDesc": "Визуал, камера и музыка вместе передают эмоцию.",
    "casesTitle": "Избранные работы",
    "casesSubtitle": "От партнёров и авторов QingFeng.",
    "casesTryNow": "Попробовать",
    "ctaTitle": "Превратите историю в анимацию",
    "ctaDesc": "Создайте свой первый AI-комикс прямо сейчас",
    "ctaButton": "Перейти в рабочий стол"
  },
  "pricing": {
    "enterWorkbench": "Перейти в рабочий стол",
    "badge": "Тарифы",
    "titleLead": "Выберите ",
    "titleHighlight": "подходящий план",
    "subtitle": "От бесплатного доступа до корпоративного self-hosting — QingFeng предлагает каждому автору оптимальный план.",
    "custom": "Индивидуальный",
    "customNote": "Цена по запросу, свяжитесь с продажами",
    "free": "Бесплатно",
    "startUsing": "Начать",
    "apiAccess": "Доступ к API",
    "commercialLicense": "Коммерческая лицензия",
    "footnote": "Все планы включают поддержку AI-движка 24/7 · вступает в силу сразу после оплаты · отмена в любое время",
    "faqTitle": "Часто задаваемые вопросы",
    "faq": [{
        "q": "Каковы ограничения бесплатного плана?",
        "a": "Бесплатный план позволяет 3 проекта в месяц, до 5 персонажей в библиотеке, экспорт видео в 720p и включает водяной знак QingFeng. Подходит для личного ознакомления."
      }, {
        "q": "Могу ли я использовать новые функции сразу после перехода на платный план?",
        "a": "Да. После успешной оплаты преимущества соответствующего плана активируются немедленно — проверка не требуется."
      }, {
        "q": "Можно ли использовать сгенерированный контент в коммерческих целях?",
        "a": "Авторские права на сгенерированные материалы принадлежат базовым движкам (Kling, MiniMax и др.). Возможность коммерческого использования зависит от условий каждого движка — проверяйте их самостоятельно. QingFeng предоставляет только инструменты оркестрации и постобработки и не гарантирует коммерческих прав на контент."
      }, {
        "q": "Чем Enterprise отличается от Pro?",
        "a": "Enterprise поддерживает self-hosting — развёртывание полной AI-системы на ваших серверах — плюс разработку кастомных AI-агентов, гарантии SLA и выделенного менеджера по работе с клиентами."
      }, {
        "q": "Могу ли я отменить подписку в любое время?",
        "a": "Да. Отменить подписку можно в настройках аккаунта в любое время. После отмены доступ сохраняется до конца текущего расчётного периода."
      }],
    "moreTitle": "Остались вопросы?",
    "moreDesc": "Наша команда всегда готова помочь",
    "contactSupport": "Связаться с поддержкой",
    "alertPayment": "Оплата ещё не подключена — сейчас это бесплатная / самостоятельно размещаемая версия."
  },
  "help": {
    "examples": "Примеры",
    "title": "Справочный центр",
    "subtitle": "Найдите ответы на свои вопросы и начните создавать AI-комиксы",
    "searchPlaceholder": "Поиск по справке...",
    "quickGuides": "Быстрые руководства",
    "guides": [{
        "title": "Быстрый старт",
        "description": "Создайте первый AI-комикс за 5 минут"
      }, {
        "title": "Руководство по созданию",
        "description": "Техники и лучшие практики AI-создания комиксов"
      }, {
        "title": "Уроки сообщества",
        "description": "Советы от сообщества авторов"
      }],
    "faqTitle": "Часто задаваемые вопросы",
    "faqs": [{
        "q": "Как начать первый проект?",
        "a": "Нажмите «Начать создание», введите идею истории, выберите видеодвижок — AI создаст для вас полный комикс-сериал."
      }, {
        "q": "Какие видеодвижки поддерживаются?",
        "a": "Поддерживаются Minimax, Vidu, Kling AI и другие — выберите тот, что подходит именно вам."
      }, {
        "q": "Сколько времени занимает генерация проекта?",
        "a": "Обычно 5–15 минут, в зависимости от сложности проекта и выбранного движка."
      }, {
        "q": "Можно ли редактировать AI-контент?",
        "a": "Да — вы можете редактировать сценарий, дизайн персонажей и раскадровку, сохраняя полный контроль."
      }, {
        "q": "Можно ли использовать работы в коммерческих целях?",
        "a": "Авторские права на контент принадлежат генерирующим движкам. Проверяйте условия каждого движка для коммерческого использования; QingFeng предоставляет только инструменты редактирования и постобработки."
      }, {
        "q": "Как экспортировать работу?",
        "a": "На странице проекта нажмите «Скачать» — будут экспортированы видео, изображения, сценарий и все ресурсы."
      }],
    "moreTitle": "Остались вопросы?",
    "moreDesc": "Наша команда поддержки всегда готова помочь",
    "sendEmail": "Написать email",
    "liveChat": "Онлайн-чат"
  },
  "examples": {
    "title": "Избранные работы",
    "subtitle": "Исследуйте потрясающие комикс-сериалы, созданные AI",
    "ctaTitle": "Готовы создать своё?",
    "ctaDesc": "Присоединитесь к тысячам авторов и начните свой AI-комикс путь",
    "ctaButton": "Создать сейчас"
  },
  "visionAudit": {
    "verdictExcellent": "Отлично",
    "verdictGood": "Хорошо",
    "verdictNeedsWork": "Требует доработки",
    "verdictPoor": "Неудовлетворительно",
    "noDataMessage": "Данных проверки качества пока нет. После генерации финального видео каждый кадр будет оценён AI на соответствие сценарию.",
    "panelTitle": "Контроль качества · Видео vs Сценарий",
    "avgScore": "Средний балл",
    "shotUnit": "Кадр",
    "passLabel": "Принято",
    "warnLabel": "Предупреждение",
    "failLabel": "Не по сценарию",
    "weakestShotsTitle": "Приоритетные кадры (требуют внимания):",
    "rebirthPlanPrefix": "План переснятия · ",
    "rebirthPlanSuffix": " слабых кадров рекомендовано переснять",
    "reshootButton": "В мастерскую для переснятия",
    "dimScene": "Сцена",
    "dimAction": "Действие",
    "dimMood": "Настроение",
    "dimComposition": "Композиция"
  },
  "usagePage": {
    "eyebrow": "Использование и стоимость",
    "headline": "Наблюдаемость затрат",
    "budgetLabel": "Месячный бюджет ¥",
    "budgetPlaceholder": "Без ограничений",
    "nearDays": "За",
    "daySuffix": "дн.",
    "daysCostSuffix": "затраты за период",
    "refreshTitle": "Обновить",
    "loading": "Загрузка…",
    "loadFailed": "Ошибка загрузки",
    "activeAlertsBanner": "Активные квотные предупреждения · за последний час",
    "goBilling": "К оплате",
    "statusOk": "Бюджет в норме",
    "statusWarn": "Близко к лимиту",
    "statusOver": "Бюджет превышен",
    "statusNone": "Лимит не задан",
    "alertExhausted": "Квота исчерпана",
    "alertSaturated": "Апстрим насыщен",
    "alertRateLimited": "Превышен rate limit",
    "alertAuthFailed": "Ошибка авторизации",
    "alertModelUnavailable": "Модель недоступна",
    "thisMonthBudget": "Бюджет на месяц",
    "quotaTitle": "Месячная квота",
    "quotaUnlimited": "Без лимита",
    "quotaExceeded": "Превышен лимит плана — пополните или смените движок",
    "quotaNearLimit": "Близко к лимиту плана",
    "quotaOfCeiling": "лимит плана",
    "projectedEndPrefix": "Прогноз на конец месяца",
    "noCapSuffix": " · Лимит не задан",
    "statGenerations": "Генераций",
    "statEngines": "Движков",
    "engineCostPrefix": "Расходы по движкам · за",
    "engineNoData": "Записей о затратах за этот период нет.",
    "dailyTrendTitle": "Ежедневная динамика затрат",
    "dailyNoData": "Ежедневных данных нет.",
    "countSuffix": "вызовов"
  },
  "healthPage": {
    "title": "Здоровье API",
    "subtitle": "Статус моделей / шлюзов в реальном времени · квотные проблемы и сбои — с первого взгляда",
    "refreshBtn": "Повторная проверка",
    "loadFailed": "Проверка не удалась",
    "kindLlm": "LLM",
    "kindTts": "TTS",
    "kindVideo": "Видео",
    "kindImage": "Изображение",
    "kindGateway": "Шлюз",
    "overallHealthy": "Всё в норме",
    "overallWarning": "Предупреждения",
    "overallCritical": "Сбой / Задолженность",
    "balanceUsed": "Использовано",
    "balanceAbundant": "Квота в достатке (предоплата)",
    "balanceRemaining": "Остаток",
    "balanceLimit": "Лимит",
    "radarTitle": "Радар моделей",
    "radarDesc": "Сканирует каждый API на наличие новых моделей · обновление только в рамках одного семейства · живой тест на 1 токен для LLM · откат сохранён · без перезапуска",
    "scanBtn": "Сканировать новые модели",
    "upgradeBtn": "Обновить до последних",
    "statusUpgradable": "Доступно обновление",
    "statusUpToDate": "Актуальна",
    "statusFamilyN": "· {n} в семействе",
    "statusSourceUnavail": "Источник недоступен",
    "overridesTitle": "Активные переопределения (откат доступен):",
    "rollbackBtn": "Откат",
    "rollbackDefault": "(восстановить код по умолчанию)",
    "checkedAt": "Проверено в",
    "cachedNote": "· Кэшированный результат (нажмите «Повторная проверка» для обновления)",
    "footer": "· Панель управления читает только квоты; API-ключи не хранятся и не передаются.",
    "scanFailed": "Сканирование не удалось",
    "upgradeFailed": "Обновление не удалось",
    "upgradeFailedLogin": "Обновление не удалось (требуется вход)",
    "upgradeNone": "Нет доступных обновлений",
    "upgradedSummary": "Обновлено {n} элемент(ов): {list}{skipped} — применено без перезапуска",
    "upgradeSkippedNote": " ({n} пропущено: живой тест не прошёл, сохранено исходное значение)",
    "upgradeSomeSkipped": "{n} кандидат(ов) не прошли живой тест, текущая конфигурация сохранена",
    "rolledBack": "{envKey} откатан"
  },
  "seriesDetail": {
    "statusDraft": "Ожидает",
    "statusActive": "Генерируется",
    "statusCompleted": "Завершено",
    "statusFailed": "Ошибка · Повторить",
    "backLink": "Назад",
    "pageTitle": "Сериал · Пакетная генерация",
    "statTotal": "Всего {n} серий",
    "statCompleted": "Завершено {n}",
    "statGenerating": "Генерируется {n}",
    "statFailed": "Ошибка {n}",
    "statPending": "Ожидает {n}",
    "batchGenerateBtn": "Пакетная генерация",
    "batchGeneratePendingHint": "({n} ожидает)",
    "regenerateAll": "Регенерировать все",
    "seasonAssetsTitle": "Ресурсы сезона",
    "seasonCoverAlt": "Обложка сезона",
    "genCoverBtn": "Создать обложку",
    "regenCoverBtn": "Пересоздать обложку",
    "exportSeasonBtn": "Экспортировать весь сезон",
    "reexportSeasonBtn": "Повторный экспорт сезона",
    "exportFirstEpisodeHint": "Сначала создайте хотя бы одну серию",
    "watchSeasonVideo": "Смотреть весь сезон",
    "seasonVideoDesc": "Компиляция = завершённые серии, склеенные по порядку (нормализованное соотношение сторон + перекодирование).",
    "seasonFixBusyLabel": "⏳ Исправление сезона…",
    "seasonFixLabel": "⚡ Исправить пониженные кадры ({n} серий затронуто)",
    "seasonFixProgressMsg": "Исправление серии {episode} ({current}/{total})…",
    "seasonFixDoneMsg": "Исправление сезона завершено ({n} серий), повторная проверка…",
    "resumeStuckBtn": "🛟 Возобновить зависшие серии (нет прогресса 30 мин → сбросить в ожидание)",
    "loading": "Загрузка…",
    "noEpisodes": "В этом сериале нет серий",
    "episodeLabel": "Эп.{n}",
    "healthCheckAllGreen": "Все проверки пройдены",
    "shotsDowngradedLabel": "{n} кадров понижено",
    "openEpisodeLink": "Открыть →",
    "loadFailStatus": "Ошибка загрузки {status}, обновите страницу",
    "loadFailNetwork": "Ошибка загрузки, проверьте соединение и обновите страницу",
    "requestFailed": "Запрос не выполнен",
    "exportingSeasonMsg": "Экспорт полного сезона (скачивание серий + склейка и перекодирование, до ~5 мин, не закрывайте страницу)…",
    "exportCanceledMsg": "Экспорт отменён — сначала исправьте пониженные кадры, затем повторите экспорт",
    "exportFailedStatus": "Ошибка экспорта {status}",
    "exportDoneMsg": "Полный сезон экспортирован ({n} серий)",
    "coverGeneratingMsg": "Создание обложки сезона…",
    "coverFailedStatus": "Ошибка создания обложки {status}",
    "coverDoneMsg": "Обложка сезона создана",
    "resumeCheckedMsg": "Проверено",
    "resumeFailedMsg": "Запрос возобновления не выполнен",
    "resumeFailStatus": "Ошибка {status}",
    "batchQueuedMsg": "Добавлено {n} серий в очередь пакетной генерации (постоянная очередь, обрабатывается по одной…)",
    "batchStartedMsg": "Запущена пакетная генерация {n} серий (параллельность {concurrency}, обрабатывается…)",
    "noPendingEpisodes": "Нет серий, ожидающих генерации",
    "healthGateIssuePrefix": "Проблемные серии: ",
    "healthGateEpisodeDetail": "Эп.{ep} ({shots} кадров понижено)",
    "healthGateConfirmHint": "Всё равно экспортировать? (Рекомендуется: сначала исправить пониженные кадры)",
    dramaPackageBtn: "📦 Экспорт-пакет",
    dramaPackageFetching: "Получение пакета…",
    dramaPackageTitle: "Экспорт-пакет · TikTok Drama Center",
    dramaPackageDownload: "Скачать JSON",
    dramaPackageCoverAlt: "Обложка сериала",
    dramaPackageLangEpisodes: "Язык: {lang} · {n} серий",
    dramaPackageTotalMin: "Всего: {n} мин",
    dramaPackageEpFree: "Бесплатно",
    dramaPackageEpCoins: "{coins} coins",
    dramaPackageGuideTitle: "Шаги загрузки",
    dramaPackageErrPrefix: "Ошибка получения: ",
    dramaPackageNetworkErr: "Ошибка сети",
    dramaPackageViewVideo: "Смотреть видео",
    dramaPackageAiDeclaration: "Я подтверждаю, что этот фильм создан ИИ / синтетическими медиа; декларация войдёт в пакет",
    dramaPackageAiRequiredHint: "Сначала подтвердите декларацию об ИИ",
  },
  "providerHealth": {
    "ok": "В норме",
    "outOfCredits": "Квота исчерпана",
    "authError": "Ошибка авторизации",
    "misconfigured": "Неверная конфигурация",
    "down": "Недоступен",
    "notConfigured": "Не настроен",
    "recharge": "Пополнить",
    "checkKey": "Проверить ключ",
    "addConfig": "Добавить конфигурацию",
    "checkNetwork": "Проверить сеть/сервис",
    "optionalSetup": "Необязательно"
  }
};

const translations: Record<Locale, Translations | DeepPartial<Translations>> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
  'ja': ja,
  // v12.213:ko/ru 全量文案包已成
  'ko': ko,
  'ru': ru,
};

/** 支持的全部 locale (有序: 简/繁/英/日). */
export const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'ru'];

/** 语言切换器显示名 (各用自身语言写). */
export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'ru': 'Русский',
};

/**
 * 任意语言标签 (浏览器 / Accept-Language) → 我们支持的 Locale.
 * zh-TW / zh-Hant / zh-HK → 繁中; 其余 zh → 简中; en* → en; ja* → ja; 空/未知 → en.
 */
export function normalizeLocale(input: string | null | undefined): Locale {
  const s = (input || '').trim().toLowerCase();
  if (!s) return 'en';
  if (s.startsWith('zh-tw') || s.startsWith('zh-hant') || s.startsWith('zh-hk') || s.startsWith('zh-mo')) return 'zh-TW';
  if (s.startsWith('zh')) return 'zh-CN';
  if (s.startsWith('ja')) return 'ja';
  if (s.startsWith('ko')) return 'ko';
  if (s.startsWith('ru')) return 'ru';
  if (s.startsWith('en')) return 'en';
  // empty / unknown tags fall back to en
  return 'en';
}

/** 解析 Accept-Language 头, 按 q 权重挑第一个我们支持的语言. */
export function resolveLocaleFromHeader(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return 'en';
  const parts = acceptLanguage.split(',').map((p) => {
    const [tag, q] = p.trim().split(';q=');
    return { tag: tag.trim(), q: q ? parseFloat(q) : 1 };
  }).sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    const loc = normalizeLocale(tag);
    // normalizeLocale 兜底总返 en; 只有真匹配上才提前返回
    const s = tag.toLowerCase();
    if (s.startsWith('zh') || s.startsWith('en') || s.startsWith('ja') || s.startsWith('ko') || s.startsWith('ru')) return loc;
  }
  // v12.186:头里全是我们不支持的语言 → 该用户显然非中文用户,回退 en(原 zh-CN)
  return 'en';
}

/** 深合并: 用 locale 覆盖 en base, 缺的 key 自动回退英文. */
function deepMergeFallback(base: any, over: any): any {
  if (over == null) return base;
  if (typeof base !== 'object' || typeof over !== 'object') return over ?? base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(base)) {
    out[k] = deepMergeFallback(base[k], over[k]);
  }
  return out;
}

export function getTranslations(locale: Locale): Translations {
  // v12.186:ko/ru 文案包未成 —— 以 en 字典兜底(键级渐进补真文案零结构改动)
  const effective = (locale === 'ko' || locale === 'ru') ? 'en' : locale;
  const t = translations[effective as keyof typeof translations];
  if (!t) return en;
  // 以 en 为底回退, 防某 locale 漏 key 时出现中文(或 undefined)
  return deepMergeFallback(en, t) as Translations;
}

/** 点路径取翻译 (e.g. t('ja', 'nav.projects')). 缺失回退英文, 再缺回 path. */
export function t(locale: Locale, path: string): string {
  const get = (obj: any) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const v = get(translations[locale]) ?? get(en);
  return typeof v === 'string' ? v : path;
}

export function useTranslations(locale?: Locale) {
  const currentLocale = locale || 'en';
  return getTranslations(currentLocale);
}

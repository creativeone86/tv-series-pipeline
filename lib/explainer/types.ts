/**
 * Narrated explainer contracts. Beats persist as ScriptShot extras;
 * vocabulary persists as global_assets.metadata.vocabulary.
 */

import type { ExplainerBeatPurpose, ExplainerCategory, Script, ScriptShot } from '@/types/agents';

export type VisualFunction =
  | 'CHARACTER'
  | 'ENVIRONMENT'
  | 'PROP'
  | 'OBJECT'
  | 'MOTIF'
  | 'DIAGRAM_COMPONENT'
  | 'ICON';

export type VocabularyScope = 'BEAT' | 'EPISODE' | 'CATEGORY' | 'SERIES' | 'GLOBAL';

export type ResolveStrategy =
  | 'REUSE_EXISTING'
  | 'COMPOSE_EXISTING'
  | 'DETERMINISTIC_RENDER'
  | 'EDIT_PREVIOUS_FRAME'
  | 'GENERATE_FROM_REFERENCES'
  | 'GENERATE_NEW'
  | 'MANUAL_IMPORT'
  | 'UNRESOLVED';

export type VisualType =
  | 'PHOTO'
  | 'ARCHIVE'
  | 'ILLUSTRATION'
  | 'DIAGRAM'
  | 'CHESS_BOARD'
  | 'MATH'
  | 'TEXT'
  | 'ICON_SCENE'
  | 'COMPARISON'
  | 'TIMELINE'
  | 'MAP'
  | 'GENERATED_IMAGE';

export type ShotType =
  | 'WORD_CARD'
  | 'IN_SCENE_WORD'
  | 'TIMELINE'
  | 'MAP'
  | 'MICRO_VIEW'
  | 'GUIDE_ON_VOID'
  | 'PROP_ON_VOID'
  | 'SCENE'
  | 'ANNOTATED_SCENE'
  | 'ARTIFACT_INSET';

export type FrameSource = 'generated' | 'diagram' | 'auto';

export type PlateProfile = 'flat-print' | 'material';
export type KitMaterial = 'papercut' | 'knit' | 'felt' | 'clay' | 'woodcut';
export type TypographyMode = 'flat-overlay' | 'materialised';
export type FactualReviewStatus = 'UNREVIEWED' | 'VERIFIED' | 'UNVERIFIED' | 'DISPUTED' | 'APPROVED' | 'NEEDS_REVIEW';

export interface StyleKit {
  id: string;
  name: string;
  version: number;
  parentId?: string;
  plateProfile: PlateProfile;
  paper: string;
  ink: string;
  secondary: string;
  accent: string;
  muted: string;
  grainOpacity: number;
  grainPitchPx: number;
  registrationOffsetPx: number;
  strokeWidth: number;
  material?: KitMaterial;
  substrateTextureUrl?: string;
  shadowOffsetPx?: number;
  shadowBlurPx?: number;
  shadowOpacity?: number;
  edgeIrregularity?: number;
  depthPlanes?: number;
  promptPrefix: string;
  negativePrompt: string;
  figureRule: string;
  compositionRule: string;
  styleAnchorUrl?: string;
  characterSheetUrl?: string;
  displayFont: string;
  labelFont: string;
  displayCase: 'upper' | 'sentence';
  displayTracking: number;
  accentWordsOnly: boolean;
  typographyMode: TypographyMode;
  forbidden: string[];
  narrativeVoice?: {
    register: string;
    coldOpen: string;
    turnPhrases: string[];
    bans: string[];
  };
}

export interface FactCard {
  claim: string;
  person?: string;
  year?: string;
  place?: string;
  number?: string;
  mechanism?: string;
  surprise?: string;
  confidence?: number;
  sourceUrl?: string;
  sourceTitle?: string;
  status?: 'VERIFIED' | 'UNVERIFIED' | 'DISPUTED';
}

export interface ExplainerSection {
  id: string;
  order: number;
  title: string;
  function?: string;
  targetSeconds?: number;
  beatIds: string[];
  contentHash?: string;
  locked?: boolean;
  openLoop?: boolean;
}

export interface ExplainerFrame {
  beatId: string;
  frameIndex: number;
  shotType: ShotType;
  generationPrompt?: string;
  overlayText?: string;
  styleTokens?: string;
}

export interface VisualIntent {
  type: VisualType;
  subject: string;
  teachingGoal: string;
  searchQueries?: string[];
  composition?: string;
  labels?: string[];
  motion?: { type: 'STATIC' | 'PUSH_IN' | 'PAN' | 'REVEAL' | 'SEQUENCE' | 'HIGHLIGHT' | 'ZOOM' };
  preferredProvider?: string;
  generationPrompt?: string;
  activeEntities?: string[];
}

export interface VocabularyMeta {
  canonicalEntityId: string;
  visualFunction: VisualFunction;
  scope: VocabularyScope;
  seriesId?: string;
  category?: ExplainerCategory;
  approved: boolean;
  locked: boolean;
  version: number;
  representation: string;
  promptBlock?: string;
  reusePriority?: number;
  episodeUsages?: string[];
}

export interface SeriesVisualBible {
  id: string;
  name: string;
  palette: {
    bg: string;
    ink: string;
    accent: string;
    earth: string;
    moon: string;
    guide: string;
    arrow: string;
    warn: string;
  };
  strokeWidth: number;
  fontFamily: string;
  lineStyle: string;
  forbidden: string[];
  narrativeVoice?: {
    register: string;
    coldOpen: string;
    turnPhrases: string[];
    bans: string[];
  };
  styleTokens?: string[];
}

export interface ExplainerBeat {
  id: string;
  order: number;
  narrationText: string;
  purpose: ExplainerBeatPurpose;
  teachingGoal: string;
  visualGoal: string;
  activeEntities: string[];
  importance: number;
  visualIntent: VisualIntent;
  estimatedDuration?: number;
  actualNarrationDuration?: number;
  factualReviewStatus?: FactualReviewStatus;
  sectionId?: string;
  locked?: boolean;
  contentHash?: string;
  frames?: ExplainerFrame[];
  overlayText?: string;
  shotType?: ShotType;
  claims?: FactCard[];
}

export interface ExplainerPlan {
  title: string;
  synopsis: string;
  language: string;
  category: ExplainerCategory;
  beats: ExplainerBeat[];
  sections?: ExplainerSection[];
  factCards?: FactCard[];
  sourcesBlock?: string;
  titleCandidates?: string[];
  llmCosts?: Array<{ stage: string; model?: string; promptTokens: number; completionTokens: number; costEur: number }>;
}

export interface FrameResolution {
  beatId: string;
  frameIndex?: number;
  strategy: ResolveStrategy;
  imageUrl?: string;
  provider?: string;
  vocabularyIds: string[];
  costEur: number;
  blockedCostEur?: number;
  reason?: string;
  shotType?: ShotType;
}

export interface LayerSpec {
  url?: string;
  buffer?: Buffer;
  left: number;
  top: number;
  width?: number;
  height?: number;
}

export interface ComposeSpec {
  width: number;
  height: number;
  background: { url?: string; color?: string };
  layers: LayerSpec[];
}

export function kitToBible(kit: StyleKit): SeriesVisualBible {
  return {
    id: kit.id,
    name: kit.name,
    palette: {
      bg: kit.paper,
      ink: kit.ink,
      accent: kit.accent,
      earth: kit.secondary,
      moon: kit.muted,
      guide: kit.ink,
      arrow: kit.secondary,
      warn: kit.accent,
    },
    strokeWidth: kit.strokeWidth,
    fontFamily: kit.displayFont,
    lineStyle: kit.plateProfile === 'material' ? `material-${kit.material || 'papercut'}` : 'clean-dark-outline',
    forbidden: kit.forbidden,
  };
}

export function defaultVisualBible(): SeriesVisualBible {
  return {
    id: 'RISO_ARCHIVE_V1',
    name: 'Хартиен архив',
    palette: {
      bg: '#EFE6D6',
      ink: '#17171B',
      accent: '#D8452F',
      earth: '#2F5D62',
      moon: '#B9A88C',
      guide: '#17171B',
      arrow: '#2F5D62',
      warn: '#D8452F',
    },
    strokeWidth: 3,
    fontFamily: 'Sofia Sans ExtraCondensed, sans-serif',
    lineStyle: 'clean-dark-outline',
    forbidden: ['photorealism', '3d-style-drift', 'anime-drift', 'random-palette', 'in-image-text'],
  };
}

export function motionToKenBurns(motion?: VisualIntent['motion']): 'in' | 'out' | 'pan' {
  const t = motion?.type;
  if (t === 'PAN') return 'pan';
  if (t === 'REVEAL' || t === 'ZOOM') return 'out';
  return 'in';
}

export function explainerShotsOf(script: Script | null | undefined): ScriptShot[] {
  return Array.isArray(script?.shots) ? script!.shots : [];
}

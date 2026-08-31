import type { StyleKit } from './types';

const FIGURE_RULE = 'faceless simplified human figures with no facial features, simple head silhouette, period-correct clothing as flat shapes, figures small against the scene';
const COMPOSITION_RULE = 'one dominant subject shape, more than half the frame left as bare paper, low horizon, subject on a third, reserved margin for typography';
const FORBIDDEN = [
  'photorealism', '3d render', 'gradient mesh', 'airbrush shading',
  'facial features', 'eyes', 'mouth', 'detailed faces', 'anime',
  'stick figures', 'cartoon mascot', 'glossy highlights', 'lens flare',
  'bokeh', 'white background', 'neon', 'in-image-text', 'letters', 'watermark',
];

const NARRATIVE_VOICE = {
  register: 'second-person present, conversational documentary, never lecturing',
  coldOpen: 'place the viewer inside the topic in the first sentence',
  turnPhrases: ['here is the part nobody tells you', 'that is not what the evidence says', 'keep that number in mind'],
  bans: ['rhetorical filler', 'as we all know', 'let us explore', 'in this video'],
};

export const RISO_ARCHIVE_V1: StyleKit = {
  id: 'RISO_ARCHIVE_V1',
  name: 'Хартиен архив',
  version: 1,
  plateProfile: 'flat-print',
  paper: '#EFE6D6',
  ink: '#17171B',
  secondary: '#2F5D62',
  accent: '#D8452F',
  muted: '#B9A88C',
  grainOpacity: 0.16,
  grainPitchPx: 4,
  registrationOffsetPx: 2,
  strokeWidth: 3,
  promptPrefix: 'flat vector editorial illustration, screenprint risograph poster, strictly five flat colours, no gradients, no soft shading, coarse halftone dots only, warm bone paper background, faceless simplified human figures with no facial features, generous negative space, single dominant subject, scientific plate clarity, mid-century documentary poster, visible halftone grain, slight ink misregistration',
  negativePrompt: 'photorealism, 3d render, gradient mesh, airbrush shading, facial features, eyes, mouth, detailed faces, anime, stick figures, cartoon mascot, glossy highlights, lens flare, bokeh, drop shadow, white background, neon, text, letters, watermark, more than five colours',
  figureRule: FIGURE_RULE,
  compositionRule: COMPOSITION_RULE,
  displayFont: 'Sofia Sans ExtraCondensed',
  labelFont: 'Sofia Sans SemiCondensed',
  displayCase: 'upper',
  displayTracking: -0.02,
  accentWordsOnly: true,
  typographyMode: 'flat-overlay',
  forbidden: FORBIDDEN,
  narrativeVoice: NARRATIVE_VOICE,
};

export const NOCTURNE_V1: StyleKit = {
  ...RISO_ARCHIVE_V1,
  id: 'NOCTURNE_V1',
  name: 'Ноктюрн',
  version: 1,
  parentId: 'RISO_ARCHIVE_V1',
  paper: '#101418',
  ink: '#EDE4D3',
  secondary: '#3E7B84',
  accent: '#E0552F',
  muted: '#4A4438',
  grainOpacity: 0.22,
};

export const PAPERCUT_DIORAMA_V1: StyleKit = {
  id: 'PAPERCUT_DIORAMA_V1',
  name: 'Изрязан свят',
  version: 1,
  plateProfile: 'material',
  paper: '#E8DCC8',
  ink: '#23201C',
  secondary: '#3A6B70',
  accent: '#C64A2E',
  muted: '#A8937A',
  grainOpacity: 0.12,
  grainPitchPx: 3,
  registrationOffsetPx: 0,
  strokeWidth: 2,
  material: 'papercut',
  shadowOffsetPx: 6,
  shadowBlurPx: 10,
  shadowOpacity: 0.32,
  edgeIrregularity: 0.35,
  depthPlanes: 3,
  promptPrefix: 'layered paper cut diorama, hand-cut cardstock shapes stacked in depth, visible torn deckle edges, soft real cast shadows between paper layers, warm neutral cardstock palette, faceless cut-paper figures in silhouette, shallow shadow-box depth, museum papercraft craftsmanship, matte uncoated paper fibre texture, single dominant subject, generous negative space',
  negativePrompt: 'photorealism, 3d render, glossy paper, plastic, facial features, eyes, mouth, anime, stick figures, neon, white studio background, text, letters, watermark',
  figureRule: FIGURE_RULE,
  compositionRule: COMPOSITION_RULE,
  displayFont: 'Sofia Sans ExtraCondensed',
  labelFont: 'Sofia Sans SemiCondensed',
  displayCase: 'upper',
  displayTracking: -0.02,
  accentWordsOnly: true,
  typographyMode: 'flat-overlay',
  forbidden: FORBIDDEN,
  narrativeVoice: NARRATIVE_VOICE,
};

export const WOOL_WORKSHOP_V1: StyleKit = {
  id: 'WOOL_WORKSHOP_V1',
  name: 'Плетен свят',
  version: 1,
  plateProfile: 'material',
  paper: '#EFE4D2',
  ink: '#2A2218',
  secondary: '#4A6B5A',
  accent: '#C4532A',
  muted: '#C4B49A',
  grainOpacity: 0.18,
  grainPitchPx: 5,
  registrationOffsetPx: 0,
  strokeWidth: 2,
  material: 'knit',
  shadowOffsetPx: 5,
  shadowBlurPx: 14,
  shadowOpacity: 0.28,
  edgeIrregularity: 0.6,
  depthPlanes: 2,
  promptPrefix: 'needle-felted and knitted illustration, chunky yarn texture, visible stitch direction, soft fuzzy silhouette edges, felt substrate, warm workshop palette, faceless felted figures, handmade craft documentary, single dominant subject, generous negative space',
  negativePrompt: 'photorealism, 3d render, plastic, glossy, facial features, eyes, mouth, anime, stick figures, neon, white studio background, text, letters, watermark',
  figureRule: FIGURE_RULE,
  compositionRule: COMPOSITION_RULE,
  displayFont: 'Sofia Sans ExtraCondensed',
  labelFont: 'Sofia Sans SemiCondensed',
  displayCase: 'upper',
  displayTracking: -0.02,
  accentWordsOnly: true,
  typographyMode: 'flat-overlay',
  forbidden: FORBIDDEN,
  narrativeVoice: NARRATIVE_VOICE,
};

// LINE_TOON allows exactly what the other kits ban: friendly stick figures with
// simple faces and bold uniform outlines. It stays a flat-print profile so the
// material substrate compositor never flattens it into a paper texture.
const LINE_TOON_FIGURE_RULE = 'friendly minimalist stick-figure characters: round head, two simple dot eyes and a small curved smile, rounded stick limbs with mitten hands, clear expressive body language, one recurring guide character kept identical across the episode';
const LINE_TOON_COMPOSITION_RULE = 'one clear subject centred or on a third, bold uniform black outlines, flat solid colour fills, simple solid sky and ground bands, plenty of empty background space reserved along the top or side for a caption';
const LINE_TOON_FORBIDDEN = [
  'photorealism', '3d render', 'gradient mesh', 'gradients', 'airbrush shading',
  'realistic textures', 'glossy highlights', 'lens flare', 'bokeh',
  'busy background', 'cluttered detail', 'in-image-text', 'letters', 'watermark',
];

export const LINE_TOON_V1: StyleKit = {
  id: 'LINE_TOON_V1',
  name: 'Скицник',
  version: 1,
  plateProfile: 'flat-print',
  paper: '#FBF7EF',
  ink: '#1B1B1F',
  secondary: '#2E7DAF',
  accent: '#E8623A',
  muted: '#F2C94C',
  grainOpacity: 0.04,
  grainPitchPx: 3,
  registrationOffsetPx: 0,
  strokeWidth: 5,
  promptPrefix: 'flat 2D cartoon doodle illustration, bold uniform black hand-drawn outlines of even weight, flat solid colour fills with no gradients or shading, friendly minimalist stick-figure characters with round heads, simple dot eyes and small smiles, simple solid sky and ground, clean whiteboard-explainer look, single clear subject, generous empty background space',
  negativePrompt: 'photorealism, 3d render, gradient, gradient mesh, soft shading, airbrush, realistic textures, glossy highlights, lens flare, bokeh, busy cluttered background, tiny details, text, letters, numbers, watermark, signature',
  figureRule: LINE_TOON_FIGURE_RULE,
  compositionRule: LINE_TOON_COMPOSITION_RULE,
  displayFont: 'Sofia Sans ExtraCondensed',
  labelFont: 'Sofia Sans SemiCondensed',
  displayCase: 'upper',
  displayTracking: -0.02,
  accentWordsOnly: true,
  typographyMode: 'flat-overlay',
  forbidden: LINE_TOON_FORBIDDEN,
  narrativeVoice: NARRATIVE_VOICE,
};

export const BUILTIN_STYLE_KITS: StyleKit[] = [
  LINE_TOON_V1,
  PAPERCUT_DIORAMA_V1,
  WOOL_WORKSHOP_V1,
  RISO_ARCHIVE_V1,
  NOCTURNE_V1,
];

export const DEFAULT_STYLE_KIT_ID = process.env.DEFAULT_STYLE_KIT_ID || 'LINE_TOON_V1';

const STYLE_KIT_KEYS = new Set<keyof StyleKit>([
  'id', 'name', 'version', 'parentId', 'plateProfile', 'paper', 'ink', 'secondary',
  'accent', 'muted', 'grainOpacity', 'grainPitchPx', 'registrationOffsetPx', 'strokeWidth',
  'material', 'substrateTextureUrl', 'shadowOffsetPx', 'shadowBlurPx', 'shadowOpacity',
  'edgeIrregularity', 'depthPlanes', 'promptPrefix', 'negativePrompt', 'figureRule',
  'compositionRule', 'styleAnchorUrl', 'characterSheetUrl', 'displayFont', 'labelFont',
  'displayCase', 'displayTracking', 'accentWordsOnly', 'typographyMode', 'forbidden',
  'narrativeVoice',
]);

export function getBuiltinKit(id?: string | null): StyleKit {
  return (
    BUILTIN_STYLE_KITS.find((k) => k.id === id) ||
    BUILTIN_STYLE_KITS.find((k) => k.id === DEFAULT_STYLE_KIT_ID) ||
    LINE_TOON_V1
  );
}

export function validateStyleKitPatch(patch: Record<string, unknown>): { ok: true; patch: Partial<StyleKit> } | { ok: false; error: string } {
  const out: Partial<StyleKit> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!STYLE_KIT_KEYS.has(key as keyof StyleKit)) {
      return { ok: false, error: `unknown StyleKit field: ${key}` };
    }
    if (key === 'id' || key === 'version' || key === 'parentId') continue;
    (out as Record<string, unknown>)[key] = value;
  }
  if (out.plateProfile && out.plateProfile !== 'flat-print' && out.plateProfile !== 'material') {
    return { ok: false, error: 'plateProfile must be flat-print or material' };
  }
  return { ok: true, patch: out };
}

export function applyStyleKitPatch(base: StyleKit, patch: Partial<StyleKit>): StyleKit {
  return {
    ...base,
    ...patch,
    id: `${base.id}__v${base.version + 1}`,
    version: base.version + 1,
    parentId: base.id,
  };
}

export function styleKitDiffersInPaletteOnly(a: StyleKit, b: StyleKit): string[] {
  const paletteKeys: Array<keyof StyleKit> = ['paper', 'ink', 'secondary', 'accent', 'muted', 'grainOpacity'];
  const diffs: string[] = [];
  for (const key of Object.keys(a) as Array<keyof StyleKit>) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key]) && key !== 'id' && key !== 'name' && key !== 'parentId' && key !== 'version') {
      diffs.push(String(key));
    }
  }
  void paletteKeys;
  return diffs;
}

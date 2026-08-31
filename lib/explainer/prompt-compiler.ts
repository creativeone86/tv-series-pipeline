import type { ExplainerBeat, SeriesVisualBible, StyleKit } from './types';
import { defaultVisualBible, kitToBible } from './types';
import { getTextNegativePromptFlags } from '@/lib/text-control';

export function compileFramePrompt(input: {
  beat: ExplainerBeat;
  bible?: SeriesVisualBible;
  kit?: StyleKit;
  entityBlocks?: string[];
  previousGoal?: string;
}): string {
  const kit = input.kit;
  const bible = input.bible || (kit ? kitToBible(kit) : defaultVisualBible());

  // Beat accuracy: LEAD with what this beat needs to show, so the image is about
  // THIS beat rather than a generic on-style scene. The director's English
  // generationPrompt is the richest subject; fall back to the beat's visualGoal,
  // then the teaching goal. Style becomes a modifier, never the headline.
  const gen = input.beat.visualIntent.generationPrompt || input.beat.frames?.[0]?.generationPrompt;
  const visualGoal = input.beat.visualGoal || input.beat.visualIntent.subject;
  const teaching = input.beat.teachingGoal || input.beat.visualIntent.teachingGoal;
  const subject = pickSubject([gen, visualGoal, teaching, 'a clear illustrative scene']);

  const parts = [
    `Scene: ${subject}`,
    visualGoal && cleanForImage(visualGoal) && cleanForImage(visualGoal) !== subject ? `depicting: ${cleanForImage(visualGoal)}` : '',
    teaching && cleanForImage(teaching) && cleanForImage(teaching) !== subject ? `so the viewer grasps: ${cleanForImage(teaching)}` : '',
    // --- style as modifier ---
    `rendered in this style: ${kit?.promptPrefix || 'educational illustrated frame, simple expressive 2D, clean dark outlines, limited palette, clear silhouettes, simple background'}`,
    kit
      ? `palette paper ${kit.paper} ink ${kit.ink} secondary ${kit.secondary} accent ${kit.accent} muted ${kit.muted}`
      : `palette ${bible.palette.bg} ${bible.palette.ink} ${bible.palette.accent}`,
    `line style: ${bible.lineStyle}`,
    kit?.figureRule,
    kit?.compositionRule,
  ];
  if (input.entityBlocks?.length) parts.push(`keep these recurring elements consistent: ${input.entityBlocks.join('; ')}`);
  if (input.beat.activeEntities?.length) parts.push(`entities: ${input.beat.activeEntities.join(', ')}`);
  if (input.previousGoal) parts.push(`visually distinct from the previous frame (${cleanForImage(input.previousGoal)}) — do not repeat the same composition`);
  const avoid = [
    ...(kit?.forbidden || bible.forbidden),
    kit?.negativePrompt,
    'on-image text',
    'photorealism',
    getTextNegativePromptFlags?.() || '',
  ].filter(Boolean);
  parts.push(`avoid: ${avoid.join(', ')}`);
  return parts.filter(Boolean).join('. ');
}

/** Image prompts must be Latin/English; drop Cyrillic to avoid in-image gibberish text. */
function cleanForImage(s: string): string {
  return s.replace(/[\u0400-\u04FF]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Pick the first candidate that still has meaningful content after Cyrillic-stripping. */
function pickSubject(candidates: Array<string | undefined>): string {
  for (const c of candidates) {
    if (!c) continue;
    const cleaned = cleanForImage(c);
    if (cleaned.length >= 4) return cleaned;
  }
  return 'a clear illustrative scene';
}

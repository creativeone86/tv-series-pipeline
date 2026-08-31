import { compileFramePrompt } from './prompt-compiler';
import type { StyleKit } from './types';

/** Some kits (e.g. LINE_TOON) intentionally allow a simple friendly face; others ban it. */
export function kitAllowsFaces(kit: StyleKit): boolean {
  const banned = [...(kit.forbidden || []), kit.negativePrompt || ''].join(' ').toLowerCase();
  return !/facial features|faceless|\beyes\b|\bmouth\b|detailed faces/.test(banned);
}

export function characterSheetPrompt(kit: StyleKit, costumes: string[] = ['present-day', 'historical']): string {
  const allowsFaces = kitAllowsFaces(kit);
  return [
    kit.promptPrefix,
    kit.figureRule,
    `reference sheet of the series guide character, three-quarter poses, costumes: ${costumes.join(', ')}`,
    // Keep the same face across every pose so the guide stays recognisable episode-wide,
    // OR enforce facelessness for kits that ban faces.
    allowsFaces
      ? 'one consistent friendly guide character with the exact same simple face in every pose, no text, no letters'
      : 'no facial features, no text, no letters',
    `avoid: ${kit.negativePrompt}`,
  ].join('. ');
}

export function usesCharacterSheet(shotType?: string): boolean {
  return shotType === 'SCENE' || shotType === 'GUIDE_ON_VOID' || shotType === 'ANNOTATED_SCENE';
}

void compileFramePrompt;

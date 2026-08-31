import { describe, expect, it } from 'vitest';
import { questionTitles, youtubeDescription } from '@/lib/explainer/packaging';
import { characterSheetPrompt, usesCharacterSheet } from '@/lib/explainer/character-sheet';
import { PAPERCUT_DIORAMA_V1 } from '@/lib/explainer/style-kits';
import type { ExplainerPlan } from '@/lib/explainer/types';

describe('explainer director packaging', () => {
  it('builds question titles and a sources description', () => {
    const plan: ExplainerPlan = {
      title: 'Кръвните групи',
      synopsis: 'How blood types appeared.',
      language: 'bg',
      category: 'BIOLOGY',
      beats: [],
      titleCandidates: ['Защо кръвта не е еднаква?'],
      sourcesBlock: 'Sources\n1. Landsteiner — https://doi.org/10.x',
    };
    expect(questionTitles(plan)[0]).toContain('?');
    expect(youtubeDescription(plan)).toContain('Sources');
  });

  it('character sheet prompt stays English and faceless', () => {
    const p = characterSheetPrompt(PAPERCUT_DIORAMA_V1);
    expect(p).toMatch(/faceless/i);
    expect(usesCharacterSheet('SCENE')).toBe(true);
    expect(usesCharacterSheet('WORD_CARD')).toBe(false);
  });
});

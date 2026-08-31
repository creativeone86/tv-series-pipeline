import { describe, expect, it } from 'vitest';
import { carriesCharacter, explainerGatePass, fallbackFreeShot, framePromptWithQa, shouldGateFrame } from '@/lib/explainer/frame-qa';

describe('explainer frame QA', () => {
  it('appends negative text flags to prompts', () => {
    const p = framePromptWithQa('a felt moon over a workshop table');
    expect(p.startsWith('a felt moon')).toBe(true);
    expect(p.length).toBeGreaterThan('a felt moon over a workshop table'.length);
  });

  it('character-carrying shots are always gated', () => {
    expect(carriesCharacter('SCENE')).toBe(true);
    expect(carriesCharacter('GUIDE_ON_VOID')).toBe(true);
    expect(carriesCharacter('WORD_CARD')).toBe(false);
    expect(shouldGateFrame('SCENE', { sampleRate: 0.1, index: 1 })).toBe(true);
  });

  it('samples non-character frames by rate', () => {
    expect(shouldGateFrame('WORD_CARD', { sampleRate: 1, index: 3 })).toBe(true);
    expect(shouldGateFrame('WORD_CARD', { sampleRate: 0.5, index: 0 })).toBe(true);
    expect(shouldGateFrame('WORD_CARD', { sampleRate: 0.5, index: 1 })).toBe(false);
  });

  it('falls back to a free shot type', () => {
    expect(fallbackFreeShot('SCENE')).toBe('WORD_CARD');
    expect(fallbackFreeShot('TIMELINE')).toBe('TIMELINE');
    expect(fallbackFreeShot(undefined)).toBe('WORD_CARD');
  });

  it('gate passes when there is no score to evaluate', () => {
    const g = explainerGatePass(null);
    expect(g.pass).toBe(true);
  });
});

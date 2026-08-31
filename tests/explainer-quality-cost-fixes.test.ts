import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { estimateImageEur, gptImageCostEur } from '@/lib/explainer/cost-rates';
import { buildGptImageRequest, gptImageQuality, gptImageSize } from '@/lib/image-providers/openai-gpt-image';
import { compileFramePrompt } from '@/lib/explainer/prompt-compiler';
import { BUILTIN_STYLE_KITS, DEFAULT_STYLE_KIT_ID, LINE_TOON_V1, PAPERCUT_DIORAMA_V1, getBuiltinKit } from '@/lib/explainer/style-kits';
import { characterSheetPrompt, kitAllowsFaces } from '@/lib/explainer/character-sheet';
import { sectionVideoCacheKey } from '@/lib/explainer/sections';
import type { ExplainerBeat } from '@/lib/explainer/types';

function beat(overrides: Partial<ExplainerBeat> = {}): ExplainerBeat {
  return {
    id: 'beat-1',
    order: 1,
    narrationText: 'x',
    purpose: 'EXPLANATION' as any,
    teachingGoal: 'why the moon does not fall',
    visualGoal: 'moon circling the earth on a curved path',
    activeEntities: ['MOON', 'EARTH'],
    importance: 0.6,
    visualIntent: {
      type: 'ILLUSTRATION',
      subject: 'moon and earth',
      teachingGoal: 'orbit',
      generationPrompt: 'the Moon falling around a curved Earth horizon, arrows showing sideways motion',
    },
    ...overrides,
  } as ExplainerBeat;
}

describe('cost-truth: estimateImageEur reflects real size/quality', () => {
  it('honors explicit opts (cheap medium/1024 ≈ 5c)', () => {
    expect(estimateImageEur('GENERATE_NEW', { size: '1024x1024', quality: 'medium' }))
      .toBe(gptImageCostEur('1024', 'medium'));
    // medium/1024 is meaningfully cheaper than the old high/1536 assumption
    expect(estimateImageEur('GENERATE_NEW', { size: '1024x1024', quality: 'medium' }))
      .toBeLessThan(gptImageCostEur('1536', 'high'));
  });

  it('maps sizes and treats auto as medium', () => {
    expect(estimateImageEur('GENERATE_NEW', { size: '1536x1024', quality: 'high' }))
      .toBe(gptImageCostEur('1536', 'high'));
    expect(estimateImageEur('EDIT_PREVIOUS_FRAME', { size: '2048x2048', quality: 'auto' }))
      .toBe(gptImageCostEur('2048', 'medium'));
  });

  it('free strategies cost nothing', () => {
    expect(estimateImageEur('REUSE_EXISTING')).toBe(0);
    expect(estimateImageEur('DETERMINISTIC_RENDER')).toBe(0);
  });

  describe('env-driven defaults', () => {
    const prev = { q: process.env.EXPLAINER_IMAGE_QUALITY, s: process.env.EXPLAINER_IMAGE_SIZE };
    beforeEach(() => {
      process.env.EXPLAINER_IMAGE_QUALITY = 'medium';
      process.env.EXPLAINER_IMAGE_SIZE = '1024x1024';
    });
    afterEach(() => {
      process.env.EXPLAINER_IMAGE_QUALITY = prev.q;
      process.env.EXPLAINER_IMAGE_SIZE = prev.s;
    });
    it('falls back to env when no opts given', () => {
      expect(estimateImageEur('GENERATE_NEW')).toBe(gptImageCostEur('1024', 'medium'));
    });
  });
});

describe('cost-quality: gpt-image request carries size + quality', () => {
  it('defaults quality to medium; cheap 1024 size comes from env', () => {
    // With no env and a 16:9 aspect, size follows the aspect ratio.
    const bare = buildGptImageRequest({ prompt: 'p', aspectRatio: '16:9' }, {} as NodeJS.ProcessEnv);
    expect(bare.quality).toBe('medium');
    expect(bare.size).toBe('1536x1024');
    // The cheap default is applied via env (as configured in .env.local) or by the resolver.
    const cheap = buildGptImageRequest({ prompt: 'p', aspectRatio: '16:9' }, { EXPLAINER_IMAGE_SIZE: '1024x1024' } as unknown as NodeJS.ProcessEnv);
    expect(cheap.size).toBe('1024x1024');
    expect(cheap.quality).toBe('medium');
  });

  it('honors explicit input quality/size over aspect ratio', () => {
    const req = buildGptImageRequest({ prompt: 'p', aspectRatio: '16:9', quality: 'high', size: '1536x1024' }, {} as NodeJS.ProcessEnv);
    expect(req.quality).toBe('high');
    expect(req.size).toBe('1536x1024');
  });

  it('honors env defaults when input is silent', () => {
    const env = { EXPLAINER_IMAGE_QUALITY: 'low', EXPLAINER_IMAGE_SIZE: '1536x1024' } as unknown as NodeJS.ProcessEnv;
    expect(gptImageQuality({ prompt: 'p' }, env)).toBe('low');
    expect(gptImageSize('1:1', env.EXPLAINER_IMAGE_SIZE)).toBe('1536x1024');
  });

  it('snaps illegal sizes and falls back to aspect ratio', () => {
    expect(gptImageSize('16:9', '999x999')).toBe('1536x1024');
    expect(gptImageSize('1:1')).toBe('1024x1024');
  });
});

describe('preset-linetoon: LINE_TOON_V1 default flat-cartoon kit', () => {
  it('is registered, first, and the default', () => {
    expect(BUILTIN_STYLE_KITS[0]!.id).toBe('LINE_TOON_V1');
    expect(DEFAULT_STYLE_KIT_ID).toBe('LINE_TOON_V1');
    expect(getBuiltinKit(undefined).id).toBe('LINE_TOON_V1');
    expect(getBuiltinKit('nope').id).toBe('LINE_TOON_V1');
  });

  it('allows friendly faces + stick figures (unlike the material kits)', () => {
    expect(kitAllowsFaces(LINE_TOON_V1)).toBe(true);
    expect(kitAllowsFaces(PAPERCUT_DIORAMA_V1)).toBe(false);
    const banned = [...LINE_TOON_V1.forbidden, LINE_TOON_V1.negativePrompt].join(' ').toLowerCase();
    expect(banned).not.toContain('stick figure');
    expect(banned).not.toContain('facial features');
  });

  it('character sheet keeps a face for LINE_TOON but not for PAPERCUT', () => {
    expect(characterSheetPrompt(LINE_TOON_V1).toLowerCase()).toContain('same simple face');
    expect(characterSheetPrompt(PAPERCUT_DIORAMA_V1).toLowerCase()).toContain('no facial features');
  });
});

describe('prompt-beat-lead: compileFramePrompt leads with the beat', () => {
  it('puts the beat subject first and style as a modifier', () => {
    const out = compileFramePrompt({ beat: beat(), kit: LINE_TOON_V1 });
    expect(out.startsWith('Scene:')).toBe(true);
    const sceneIdx = out.indexOf('Scene:');
    const styleIdx = out.indexOf('rendered in this style');
    expect(sceneIdx).toBeLessThan(styleIdx);
    // the director's English generation prompt is the subject
    expect(out).toContain('sideways motion');
    // the kit style still shows up
    expect(out).toContain('cartoon doodle');
  });

  it('strips Cyrillic from the image subject', () => {
    const out = compileFramePrompt({
      beat: beat({ visualIntent: { type: 'ILLUSTRATION', subject: 'x', teachingGoal: 'y', generationPrompt: 'Луната пада около Земята curved horizon' } }),
      kit: LINE_TOON_V1,
    });
    expect(/[\u0400-\u04FF]/.test(out)).toBe(false);
    expect(out).toContain('curved horizon');
  });

  it('asks for a visually distinct frame from the previous one', () => {
    const out = compileFramePrompt({ beat: beat(), kit: LINE_TOON_V1, previousGoal: 'a wide shot of the earth' });
    expect(out.toLowerCase()).toContain('visually distinct');
  });
});

describe('render-audio-cache: section video cache key', () => {
  it('differs between silent and audio renders of the same content', () => {
    const silent = sectionVideoCacheKey('abc', false);
    const withAudio = sectionVideoCacheKey('abc', true, 42.3);
    expect(silent).not.toBe(withAudio);
    expect(silent.endsWith('sil')).toBe(true);
  });

  it('changes when the narration is re-timed', () => {
    expect(sectionVideoCacheKey('abc', true, 42.3)).not.toBe(sectionVideoCacheKey('abc', true, 55.0));
  });

  it('is stable for identical inputs', () => {
    expect(sectionVideoCacheKey('abc', true, 42.3)).toBe(sectionVideoCacheKey('abc', true, 42.3));
  });
});

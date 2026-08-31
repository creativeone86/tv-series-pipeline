import { describe, expect, it } from 'vitest';
import {
  detectLanguage,
  normalizeLanguage,
  ttsLangCode,
  isSupportedLanguage,
  listSupportedLanguages,
} from '@/lib/language-detect';

describe('narrated-explainer · Bulgarian language', () => {
  it('round-trips bg through normalize / detect / tts', () => {
    expect(normalizeLanguage('bg')).toBe('bg');
    expect(normalizeLanguage('Bulgarian')).toBe('bg');
    expect(normalizeLanguage('български')).toBe('bg');
    expect(detectLanguage('Защо Луната не пада върху Земята?')).toBe('bg');
    expect(ttsLangCode('bg')).toBe('bg-BG');
    expect(isSupportedLanguage('bg')).toBe(true);
    expect(listSupportedLanguages().some((l) => l.code === 'bg')).toBe(true);
  });

  it('does not classify Russian-specific marks as Bulgarian', () => {
    expect(detectLanguage('Это потрясающе почему луна')).toBe('ru');
  });

  it('keeps the existing zh/en detectLanguage cases', () => {
    expect(detectLanguage('纯中文')).toBe('zh');
    expect(detectLanguage('pure english')).toBe('en');
    expect(detectLanguage('')).toBe('zh');
  });
});

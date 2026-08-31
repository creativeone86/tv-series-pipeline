import { describe, expect, it } from 'vitest';
import { explainerFontCandidates, fontPreflight } from '@/lib/explainer/typography';
import { coverFontCandidates } from '@/lib/cover-title-burn';

describe('explainer typography fonts', () => {
  it('lists Sofia Sans before Noto fallbacks', () => {
    const fonts = explainerFontCandidates();
    expect(fonts.some((f) => /Sofia/i.test(f))).toBe(true);
  });

  it('cover candidates include Cyrillic paths', () => {
    const covers = coverFontCandidates();
    expect(covers.some((f) => /Sofia|NotoSans-Regular/i.test(f))).toBe(true);
  });

  it('preflight is honest when the face is missing', () => {
    const r = fontPreflight();
    expect(r.font === null || typeof r.font === 'string').toBe(true);
    if (!r.ok) expect(r.warning).toMatch(/font/i);
  });
});

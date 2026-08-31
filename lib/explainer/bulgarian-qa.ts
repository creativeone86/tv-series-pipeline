import type { ExplainerBeat } from './types';

const RUSSIAN_BLEED: Array<[RegExp, string]> = [
  [/(^|[^\u0400-\u04FF])одна(?=[^\u0400-\u04FF]|$)/g, '$1една'],
  [/(^|[^\u0400-\u04FF])это(?=[^\u0400-\u04FF]|$)/g, '$1това'],
  [/(^|[^\u0400-\u04FF])что(?=[^\u0400-\u04FF]|$)/g, '$1какво'],
  [/(^|[^\u0400-\u04FF])потому(?=[^\u0400-\u04FF]|$)/g, '$1затова'],
  [/(^|[^\u0400-\u04FF])который(?=[^\u0400-\u04FF]|$)/g, '$1който'],
  [/(^|[^\u0400-\u04FF])которая(?=[^\u0400-\u04FF]|$)/g, '$1която'],
  [/(^|[^\u0400-\u04FF])только(?=[^\u0400-\u04FF]|$)/g, '$1само'],
  [/(^|[^\u0400-\u04FF])уже(?=[^\u0400-\u04FF]|$)/g, '$1вече'],
  [/(^|[^\u0400-\u04FF])ещё(?=[^\u0400-\u04FF]|$)/g, '$1още'],
  [/(^|[^\u0400-\u04FF])еще(?=[^\u0400-\u04FF]|$)/g, '$1още'],
];

export function runBulgarianQa(beats: ExplainerBeat[]): ExplainerBeat[] {
  return beats.map((b) => ({
    ...b,
    narrationText: fixRussianBleed(b.narrationText),
    overlayText: b.overlayText ? fixRussianBleed(b.overlayText) : b.overlayText,
    frames: b.frames?.map((f) => ({
      ...f,
      overlayText: f.overlayText ? fixRussianBleed(f.overlayText) : f.overlayText,
    })),
  }));
}

export function fixRussianBleed(text: string): string {
  let out = text;
  for (const [re, repl] of RUSSIAN_BLEED) out = out.replace(re, repl);
  return out;
}

export function hasRussianBleed(text: string): boolean {
  return RUSSIAN_BLEED.some(([re]) => re.test(text));
}

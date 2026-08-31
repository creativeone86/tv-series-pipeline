import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { assertNoStockImport, isStockUrl } from '@/lib/explainer/no-stock';

describe('explainer no-stock', () => {
  it('rejects stock URLs and broll imports', () => {
    expect(isStockUrl('https://pixabay.com/x')).toBe(true);
    expect(isStockUrl('https://cdn.windcomic.test/x.png')).toBe(false);
    expect(() => assertNoStockImport('lib/broll.ts')).toThrow();
  });

  it('pipeline source never imports broll', () => {
    const src = readFileSync(path.join(process.cwd(), 'lib/explainer/pipeline.ts'), 'utf8');
    expect(src).not.toMatch(/from ['"]@\/lib\/broll|pexels|pixabay/i);
  });
});

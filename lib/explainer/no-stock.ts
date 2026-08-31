/** Explainer frames must never pull stock / b-roll. */

export function assertNoStockImport(importer: string): void {
  if (/broll|pexels|pixabay|unsplash/i.test(importer)) {
    throw new Error('explainer pipeline must not import stock sources');
  }
}

export function isStockUrl(url: string): boolean {
  return /pexels\.com|pixabay\.com|unsplash\.com|shutterstock/i.test(url || '');
}

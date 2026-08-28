/**
 * v12.339 — server API locale + chrome key presence.
 */
import { describe, it, expect } from 'vitest';
import { apiT, localeFromRequest } from '@/lib/api-i18n';
import { normalizeError } from '@/lib/pipeline-error';
import { evaluateBudgetGuard } from '@/lib/budget-guard';
import { planRejection } from '@/lib/plan-gate';
import { t } from '@/lib/i18n';

describe('v12.339 · api-i18n', () => {
  it('localeFromRequest: cookie > Accept-Language > en', () => {
    expect(localeFromRequest(new Request('http://x', { headers: { 'accept-language': 'zh-CN' } }))).toBe('zh-CN');
    expect(localeFromRequest(new Request('http://x', { headers: { cookie: 'qfmj-locale=en', 'accept-language': 'zh-CN' } }))).toBe('en');
    expect(localeFromRequest(new Request('http://x', { headers: { 'x-locale': 'ja' } }))).toBe('ja');
    expect(localeFromRequest(new Request('http://x'))).toBe('en');
  });

  it('apiT interpolates and falls back to en', () => {
    expect(apiT('en', 'loginTooMany')).toBe('Too many sign-in attempts. Try again later.');
    expect(apiT('zh-CN', 'loginTooMany')).toBe('登录尝试过于频繁,请稍后再试');
    expect(apiT('en', 'planRequired', { required: 'pro', current: 'free' })).toContain('pro');
    expect(apiT('ja', 'ideaRequired')).toBe(apiT('en', 'ideaRequired'));
  });

  it('normalizeError userMsg is English by default', () => {
    expect(normalizeError(new Error('ETIMEDOUT')).userMsg).toBe(apiT('en', 'timeout'));
    expect(normalizeError(new Error('sensitive 1026'), 'video', 'zh-CN').userMsg).toBe(apiT('zh-CN', 'sensitive'));
  });

  it('budget + plan messages default to English', async () => {
    expect(evaluateBudgetGuard({ spentCny: 0, capCny: null }).message).toBe(apiT('en', 'budgetNone'));
    expect(evaluateBudgetGuard({ spentCny: 0, capCny: null, locale: 'zh-CN' }).message).toBe(apiT('zh-CN', 'budgetNone'));
    const body = await planRejection('free', 'pro').json();
    expect(body.message).toBe(apiT('en', 'planRequired', { required: 'pro', current: 'free' }));
  });

  it('en + zh-CN still have chrome / product keys', () => {
    for (const loc of ['en', 'zh-CN'] as const) {
      expect(t(loc, 'auth.login').length).toBeGreaterThan(0);
      expect(t(loc, 'sidebar.overview').length).toBeGreaterThan(0);
      expect(t(loc, 'product.director').length).toBeGreaterThan(0);
      expect(t(loc, 'dashProjects.title').length).toBeGreaterThan(0);
    }
    expect(t('en', 'sidebar.overview')).toBe('Overview');
    expect(t('en', 'product.director')).toBeTruthy();
  });
});

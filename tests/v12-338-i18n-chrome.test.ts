/**
 * v12.338 — English-default chrome batch: auth / sidebar / errors / dashProjects.
 */
import { describe, it, expect } from 'vitest';
import { t } from '@/lib/i18n';
import fs from 'fs';

describe('v12.338 · i18n chrome', () => {
  it('en + zh-CN chrome keys are real strings', () => {
    expect(t('en', 'sidebar.overview')).toBe('Overview');
    expect(t('zh-CN', 'sidebar.overview')).toBe('创作总览');
    expect(t('en', 'auth.login')).toBe('Sign in');
    expect(t('zh-CN', 'auth.login')).toBe('登录');
    expect(t('en', 'errors.retry')).toBe('Retry');
    expect(t('en', 'dashProjects.title')).toBe('My Projects');
    expect(t('en', 'dashBanner.title')).toBe('API status alerts');
    expect(t('en', 'continueCard.eyebrow')).toBe('Continue');
  });

  it('P0 surfaces import useLocale', () => {
    for (const f of [
      'components/sidebar.tsx',
      'app/auth/page.tsx',
      'components/auth/InviteGate.tsx',
      'components/error-boundary.tsx',
      'app/error.tsx',
      'app/loading.tsx',
      'components/dashboard/continue-card.tsx',
      'components/dashboard/api-quota-banner.tsx',
      'app/dashboard/projects/page.tsx',
    ]) {
      expect(fs.readFileSync(f, 'utf-8'), f).toContain('useLocale');
    }
  });
});

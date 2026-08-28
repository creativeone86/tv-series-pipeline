'use client';

/**
 * v5.0 — 当前 locale hook.
 *
 * 优先级: localStorage('qfmj-locale') > 浏览器 navigator.language > 'en'.
 * setLocale 持久化 + cookie (API localeFromRequest) + 广播 + 设 <html lang>.
 */

import { useCallback, useEffect, useState } from 'react';
import { normalizeLocale, getTranslations, type Locale } from '@/lib/i18n';

const KEY = 'qfmj-locale';
const EVT = 'qfmj-locale-change';

function persistCookie(norm: Locale) {
  document.cookie = `${KEY}=${encodeURIComponent(norm)};path=/;max-age=31536000;samesite=lax`;
}

function readInitial(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(KEY);
  if (saved) return normalizeLocale(saved);
  return normalizeLocale(navigator.language);
}

/** Apply user.locale only when the switcher has never written qfmj-locale. */
export function applyLocaleIfUnset(userLocale?: string | null) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEY)) return;
  if (!userLocale) return;
  const norm = normalizeLocale(userLocale);
  localStorage.setItem(KEY, norm);
  persistCookie(norm);
  document.documentElement.lang = norm;
  window.dispatchEvent(new CustomEvent(EVT, { detail: norm }));
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const initial = readInitial();
    persistCookie(initial);
    setLocaleState(initial);
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Locale>).detail;
      if (next) setLocaleState(next);
    };
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    const norm = normalizeLocale(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY, norm);
      persistCookie(norm);
      document.documentElement.lang = norm;
      window.dispatchEvent(new CustomEvent(EVT, { detail: norm }));
    }
    setLocaleState(norm);
  }, []);

  return { locale, setLocale, t: getTranslations(locale) };
}

'use client';

/**
 * v10.3.5 a11y: skip link to main content.
 * Chrome often resets focus to <body> after same-page fragment activation
 * (even when the target has tabindex=-1). Real browsers dispatch click on Enter,
 * so onClick takes over: prevent default + move focus/viewport to #main-content.
 * sr-only until keyboard focus (first focusable element site-wide).
 */
import { useLocale } from '@/hooks/use-locale';

export function SkipLink() {
  const { t } = useLocale();
  return (
    <a
      href="#main-content"
      onClick={(e) => {
        const main = document.getElementById('main-content');
        if (!main) return; // no anchor on this page → fall back to default
        e.preventDefault();
        // preventScroll: avoid fight between focus-scroll and scrollIntoView
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: 'start' });
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--primary)] focus:text-black focus:font-semibold focus:shadow-lg"
    >
      {t.sharedUi.skipToContent}
    </a>
  );
}

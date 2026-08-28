'use client';

/**
 * Root-route error boundary (v10.2.1) — App Router segment fallback.
 * Replaces a blank screen / global ErrorBoundary-only: show a readable message + retry (reset re-renders this segment).
 */
import { useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLocale();
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-[var(--cinema-amber,#E8C547)] text-5xl leading-none">⚠</div>
      <h2 className="text-lg font-semibold">{t.errors.pageTitle}</h2>
      <p className="text-sm opacity-60 max-w-md break-words">{error?.message || t.errors.unknown}</p>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="btn-primary px-5 py-2 rounded-xl text-sm">
          {t.errors.retry}
        </button>
        <a href="/dashboard" className="px-5 py-2 rounded-xl text-sm border border-white/15 opacity-80 hover:opacity-100">
          {t.errors.backWorkbench}
        </a>
      </div>
    </div>
  );
}

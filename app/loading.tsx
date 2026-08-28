'use client';

import { useLocale } from '@/hooks/use-locale';

export default function RouteLoading() {
  const { t } = useLocale();
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--cinema-amber,#E8C547)] border-t-transparent animate-spin" />
        <span className="text-[11px] opacity-50 tracking-[0.3em] uppercase">{t.errors.loading}</span>
      </div>
    </div>
  );
}

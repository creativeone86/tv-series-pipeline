'use client';

/**
 * components/active-generation-indicator (v12.5.0 · #4 fix)
 *
 * Global floating "workshop job in progress" bar — mounted on the dashboard layout,
 * visible from any module. The job keeps running (SSE closure survives unmount);
 * this strip shows progress + one-click return to the workshop, and warns before
 * leave/refresh so the user does not close the tab by accident.
 */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CircleNotch, ArrowRight, FilmSlate } from '@phosphor-icons/react';
import { useActiveGenerationStore } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

export function ActiveGenerationIndicator() {
  const current = useActiveGenerationStore((s) => s.current);
  const hydrate = useActiveGenerationStore((s) => s.hydrate);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  // Restore from localStorage on mount (survives refresh / re-entry)
  useEffect(() => { hydrate(); }, [hydrate]);

  // Native beforeunload while a job is running (avoid accidental progress loss)
  useEffect(() => {
    if (!current) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [current]);

  // Already on the workshop page — do not duplicate
  if (!current || pathname === '/dashboard/create') return null;

  return (
    <button
      onClick={() => router.push('/dashboard/create')}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-[var(--cinema-amber)] bg-[var(--cinema-bg,#0c0c10)]/95 px-4 py-2.5 shadow-lg shadow-black/40 backdrop-blur transition hover:scale-[1.02]"
      title={t.sharedUi.workshopBusyTitle}
    >
      <CircleNotch size={16} className="animate-spin text-[var(--cinema-amber)]" weight="bold" />
      <span className="flex flex-col items-start leading-tight">
        <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--cinema-amber)]">
          <FilmSlate size={12} /> {t.sharedUi.workshopBusy} · {current.phase}
        </span>
        <span className="max-w-[200px] truncate text-[10px] opacity-60">{current.idea}</span>
      </span>
      <ArrowRight size={14} className="opacity-70" />
    </button>
  );
}

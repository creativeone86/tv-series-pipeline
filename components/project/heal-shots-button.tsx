'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  projectId: string;
  /** Fired after a successful heal (e.g. refresh health report) */
  onHealed?: () => void;
}

/**
 * One-click heal — POST /api/projects/[id]/heal-shots { heal: true }
 * Shown on the film-health panel when shots are downgraded / missing.
 */
export function HealShotsButton({ projectId, onHealed }: Props) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleHeal() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/heal-shots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heal: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          title: t.projectMisc.healFailed,
          description: data?.error || t.projectMisc.serverReturned.replace('{status}', String(res.status)),
          type: 'error',
          duration: 6000,
        });
        return;
      }
      const healed: number = data?.healedCount ?? data?.healed?.length ?? 0;
      const failed: number = data?.failed?.length ?? 0;
      const skipped: number = data?.skipped?.length ?? 0;
      if (healed > 0) {
        showToast({
          title: `🩺 ${t.projectMisc.healDoneTitle.replace('{n}', String(healed))}`,
          description: [
            failed > 0 ? t.projectMisc.healFailedCount.replace('{n}', String(failed)) : '',
            skipped > 0 ? t.projectMisc.healSkippedCount.replace('{n}', String(skipped)) : '',
          ].filter(Boolean).join(', ') || t.projectMisc.healAllFixed,
          type: 'success',
          duration: 7000,
        });
        onHealed?.();
      } else if (failed > 0) {
        showToast({
          title: t.projectMisc.healUnsuccessful,
          description: t.projectMisc.healUnsuccessfulDesc.replace('{failed}', String(failed)).replace('{skipped}', String(skipped)),
          type: 'warning',
          duration: 6000,
        });
      } else {
        showToast({
          title: t.projectMisc.healNoneTitle,
          description: skipped > 0 ? t.projectMisc.healNoneSkipped.replace('{n}', String(skipped)) : t.projectMisc.healNoneOk,
          type: 'info',
          duration: 5000,
        });
      }
    } catch (e) {
      showToast({
        title: t.projectMisc.healRequestFailed,
        description: e instanceof Error ? e.message : t.auth.waitlistNetworkError,
        type: 'error',
        duration: 6000,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleHeal()}
      disabled={busy}
      className="cinema-btn-ghost !text-[10px] !py-0.5 !px-2 disabled:opacity-40"
    >
      {busy ? t.projectMisc.healing : `🩺 ${t.projectMisc.healButton}`}
    </button>
  );
}

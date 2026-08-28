'use client';

/**
 * v9.6.8 — "Save as template" (phase 16 T2). Turns the current project into a
 * reusable market listing.
 * POST /api/projects/[id]/save-template (look/locked cast/boards/quality → extractTemplate → DB).
 */
import { useState } from 'react';
import { Stack, CircleNotch } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

export function SaveTemplateButton({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const save = async () => {
    setSaving(true); setMsg(null); setErr(false);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/save-template`, {
        method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setMsg(t.projectMisc.templateListed.replace('{title}', body.template?.title).replace('{quality}', String(body.template?.quality)));
    } catch (e) {
      setErr(true); setMsg(e instanceof Error ? e.message : t.projectMisc.saveFailed);
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/70 min-w-0">
          <Stack className="w-4 h-4 shrink-0" />
          <span className="truncate">{t.projectMisc.saveTemplateDesc}</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          {saving ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Stack className="w-3.5 h-3.5" />}
          {saving ? t.common.saving : t.projectMisc.saveAsTemplate}
        </button>
      </div>
      {msg && <div className={`text-[11px] mt-2 ${err ? 'text-rose-400' : 'text-emerald-400'}`}>{msg}</div>}
    </div>
  );
}

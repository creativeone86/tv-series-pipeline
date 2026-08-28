'use client';

/**
 * MusicGenPanel (v12.203) — AI score / BGM generate entry.
 *
 * MiniMax music-2.6 (generateMusic) existed with no UI. This panel generates
 * royalty-free BGM from plot/style → music asset (recompose uses it as bed).
 * Honest degrade: failures get a clear message.
 */

import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

export function MusicGenPanel({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const gen = async () => {
    setBusy(true); setErr(null); setUrl(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/music`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message || t.projectMisc.genFailed);
      setUrl(d.musicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.projectMisc.genFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cinema-card p-4 mb-4">
      <h3 className="text-sm font-semibold text-white/90 mb-1">🎵 {t.projectMisc.musicGenTitle}</h3>
      <p className="text-[11px] text-white/45 mb-3">
        {t.projectMisc.musicGenDesc}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          placeholder={t.projectMisc.musicGenPlaceholder}
          className="cinema-input !text-xs !py-1.5 flex-1 min-w-[200px]"
        />
        <button onClick={gen} disabled={busy || prompt.trim().length < 4} className="cinema-btn-ghost !text-xs !py-1.5">
          {busy ? t.projectMisc.composing : t.projectMisc.genBgm}
        </button>
      </div>
      {err && <p className="text-[11px] text-red-400 mt-2">{err}</p>}
      {url && (
        <div className="mt-2">
          <audio src={url} controls className="w-full h-8" />
          <p className="text-[10px] text-emerald-400/80 mt-1">✓ {t.projectMisc.musicSaved}</p>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * LocalizePanel (v12.202) — one-click overseas language versions.
 *
 * POST /api/projects/:id/localize (v12.187: LLM translates copy fields only +
 * byte-identical structure check + script-<lang> asset; apply:true then apply +
 * re-dub) had no UI — the overseas path was undelivered.
 * Mounted in distribute/deliver: pick target language → generate localized
 * script (preview first) → "Apply and re-dub" when happy.
 * Login required (cookie). Languages with unreliable TTS are labeled honestly.
 */

import { useState } from 'react';
import { listSupportedLanguages } from '@/lib/language-detect';
import { useLocale } from '@/hooks/use-locale';

const LANGS = listSupportedLanguages().filter((l) => l.code !== 'zh'); // native zh needs no localize

export function LocalizePanel({ projectId }: { projectId: string }) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState<'idle' | 'gen' | 'apply'>('idle');
  const [result, setResult] = useState<{ language: string; title?: string; applied: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const call = async (apply: boolean) => {
    setBusy(apply ? 'apply' : 'gen'); setErr(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/localize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, apply }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message || t.projectMisc.localizeFailed);
      setResult({ language: d.language, title: d.title, applied: !!d.applied });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.projectMisc.localizeFailed);
    } finally {
      setBusy('idle');
    }
  };

  const picked = LANGS.find((l) => l.code === lang);
  const langLabel = (l: (typeof LANGS)[number]) =>
    locale === 'en' ? l.enName : l.nativeName;

  return (
    <div className="cinema-card p-4 mb-4">
      <h3 className="text-sm font-semibold text-white/90 mb-1">🌏 {t.projectMisc.localizeTitle}</h3>
      <p className="text-[11px] text-white/45 mb-3">
        {t.projectMisc.localizeDesc}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={lang}
          onChange={(e) => { setLang(e.target.value); setResult(null); }}
          disabled={busy !== 'idle'}
          className="cinema-input !text-xs !py-1.5 max-w-[160px]"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{langLabel(l)} · {l.enName}</option>
          ))}
        </select>
        <button
          onClick={() => call(false)}
          disabled={busy !== 'idle'}
          className="cinema-btn-ghost !text-xs !py-1.5"
        >
          {busy === 'gen' ? t.projectMisc.localizing : t.projectMisc.genLocalizedScript}
        </button>
        {result && !result.applied && (
          <button
            onClick={() => call(true)}
            disabled={busy !== 'idle'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/80 hover:bg-cyan-500 text-white disabled:opacity-40"
          >
            {busy === 'apply' ? t.projectMisc.applyingDub : t.projectMisc.applyAndDub}
          </button>
        )}
      </div>
      {picked && !picked.ttsReliable && (
        <p className="text-[10px] text-amber-400/80 mt-2">⚠️ {t.projectMisc.ttsUnreliable.replace('{name}', langLabel(picked))}</p>
      )}
      {err && <p className="text-[11px] text-red-400 mt-2">{err}</p>}
      {result && (
        <p className="text-[11px] text-emerald-400/90 mt-2">
          ✓ {t.projectMisc.localizeResult.replace('{title}', result.title || '—').replace('{lang}', result.language)}
          {result.applied
            ? t.projectMisc.localizeApplied
            : t.projectMisc.localizePending.replace('{lang}', result.language)}
        </p>
      )}
    </div>
  );
}

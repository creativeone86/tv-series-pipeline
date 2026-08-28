'use client';

/**
 * Production-language picker (v12.165.0, shared) — reused by create workshop / shorts.
 * Driven by listSupportedLanguages (zh/en/ja/ko/ru/es/fr/de/pt). The chosen language
 * is sent with the request → Writer script lock + TTS voice language
 * (ttsReliable voices speak that language).
 * "Set as default" writes the current choice as the system default; other entries inherit it.
 */
import { useState } from 'react';
import { listSupportedLanguages } from '@/lib/language-detect';
import { getSystemLanguage, setSystemLanguage, type SystemLanguage } from '@/lib/system-language';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
}

export function LanguagePicker({ value, onChange, label, hint }: Props) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [savedTick, setSavedTick] = useState(false);
  const isSystemDefault = getSystemLanguage() === (value as SystemLanguage);
  const resolvedLabel = label ?? t.workshopCreate.languageLabel;
  const resolvedHint = hint ?? t.workshopCreate.languageHint;
  return (
    <div className="cinema-card-hi p-3" data-testid="language-picker">
      <div className="flex items-center justify-between mb-1.5">
        <div className="cinema-mono text-[10px] opacity-50 tracking-wider">{resolvedLabel}</div>
        <button
          type="button"
          title={t.workshopCreate.setDefaultLangHint}
          onClick={() => { setSystemLanguage(value as SystemLanguage); setSavedTick(true); setTimeout(() => setSavedTick(false), 1500); }}
          className={`cinema-mono text-[9px] ${isSystemDefault ? 'text-[var(--cinema-amber)]' : 'opacity-40 hover:opacity-90'}`}
        >
          {savedTick ? t.workshopCreate.defaultSaved : isSystemDefault ? t.workshopCreate.systemDefault : t.workshopCreate.setAsDefault}
        </button>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[var(--cinema-amber)] transition-colors"
      >
        <option value="auto">{t.workshopCreate.langAuto}</option>
        {listSupportedLanguages().map((l) => (
          <option key={l.code} value={l.code}>
            {locale === 'en' ? l.enName : l.nativeName}{l.ttsReliable ? '' : t.workshopCreate.ttsDegraded}
          </option>
        ))}
      </select>
      <div className="cinema-mono text-[9px] opacity-40 mt-1.5">{resolvedHint}</div>
    </div>
  );
}

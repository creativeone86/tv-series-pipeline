'use client';

/**
 * v6.1.1 — Prompt IDE UI.
 *
 * textarea + `@` mention autocomplete + compile preview. Pure logic lives in
 * lib/prompt-ide (unit-tested); this file is interaction only (caret / dropdown /
 * keyboard / insert). Assets come from /api/prompt-ide/assets.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { At as AtSign, Eye, EyeSlash as EyeOff, X } from '@phosphor-icons/react';
import {
  activeMention, suggestAssets, insertMention, compilePrompt,
  type MentionableAsset,
} from '@/lib/prompt-ide';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

function kindLabel(kind: MentionableAsset['kind'], t: Translations): string {
  return {
    character: t.product.tabCharacters,
    scene: t.product.tabScenes,
    style: t.sharedUi.styleRole,
    prop: t.sharedUi.propRole,
  }[kind];
}
const KIND_COLOR: Record<MentionableAsset['kind'], string> = {
  character: 'text-amber-300 bg-amber-500/15 border-amber-500/25',
  scene: 'text-sky-300 bg-sky-500/15 border-sky-500/25',
  style: 'text-violet-300 bg-violet-500/15 border-violet-500/25',
  prop: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25',
};

export function PromptEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const { t } = useLocale();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [assets, setAssets] = useState<MentionableAsset[]>([]);
  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const pendingCaret = useRef<number | null>(null);

  // Load mentionable assets (fail silently — editor still works as a plain textarea)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/prompt-ide/assets')
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d?.assets)) setAssets(d.assets); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Restore caret after an insert
  useEffect(() => {
    if (pendingCaret.current != null && taRef.current) {
      const pos = pendingCaret.current;
      pendingCaret.current = null;
      taRef.current.focus();
      taRef.current.setSelectionRange(pos, pos);
      setCaret(pos);
    }
  }, [value]);

  const active = open ? activeMention(value, caret) : null;
  const suggestions = active ? suggestAssets(active.name, assets, 8) : [];
  const dropdownVisible = open && active != null && suggestions.length > 0;

  const syncCaret = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    setCaret(pos);
    const am = activeMention(el.value, pos);
    setOpen(am != null);
    setHighlight(0);
  }, []);

  const pick = useCallback((asset: MentionableAsset) => {
    const el = taRef.current;
    const pos = el?.selectionStart ?? caret;
    const am = activeMention(value, pos);
    if (!am) return;
    const { text, caret: newCaret } = insertMention(value, am, asset.name);
    pendingCaret.current = newCaret;
    setOpen(false);
    onChange(text);
  }, [value, caret, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!dropdownVisible) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(suggestions[highlight]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const compiled = showPreview ? compilePrompt(value, assets) : null;

  return (
    <div className="relative">
      <div className="relative">
        <textarea
          ref={taRef}
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => { onChange(e.target.value); }}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onSelect={syncCaret}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={className}
        />

        {/* @ autocomplete dropdown */}
        {dropdownVisible && (
          <div className="absolute left-3 right-3 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-[rgba(20,20,24,0.98)] backdrop-blur-xl shadow-2xl">
            <div className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-white/5 flex items-center gap-1">
              <AtSign className="w-3 h-3" /> {t.sharedUi.mentionHint}
            </div>
            {suggestions.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(a); }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${i === highlight ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] border ${KIND_COLOR[a.kind]}`}>{kindLabel(a.kind, t)}</span>
                <span className="text-sm text-white truncate">{a.name}</span>
                <span className="text-[11px] text-gray-500 truncate ml-auto max-w-[45%]">{a.expansion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar: hint + preview toggle */}
      <div className="mt-1.5 flex items-center justify-between text-[11px]">
        <span className="text-gray-500 flex items-center gap-1">
          <AtSign className="w-3 h-3" /> {assets.length > 0 ? t.sharedUi.atHintN.replace('{n}', String(assets.length)) : t.sharedUi.atHint}
        </span>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? t.sharedUi.hideCompile : t.sharedUi.compilePreview}
        </button>
      </div>

      {/* Compile preview panel */}
      {compiled && (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[12px]">
          <p className="text-[10px] text-gray-500 mb-1.5">{t.sharedUi.compiledPromptHint}</p>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">{compiled.prompt || <span className="text-gray-600">{t.sharedUi.emptyParen}</span>}</p>
          {compiled.used.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {compiled.used.map((a) => (
                <span key={a.id} className={`px-1.5 py-0.5 rounded-md text-[10px] border ${KIND_COLOR[a.kind]}`}>
                  {kindLabel(a.kind, t)} {a.name}
                </span>
              ))}
            </div>
          )}
          {compiled.unresolved.length > 0 && (
            <p className="mt-2 text-[11px] text-amber-300/90 flex items-start gap-1">
              <X className="w-3 h-3 mt-0.5 shrink-0" />
              {t.sharedUi.unresolvedMentions}{compiled.unresolved.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

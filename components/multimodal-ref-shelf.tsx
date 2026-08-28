'use client';

/**
 * v6.1.2 — multimodal reference shelf. Attach image / audio / video refs (file or URL)
 * before creating. v9.4.6 (Kling Elements-style): each ref can take a structured
 * element role (character / style / scene / prop / motion / voice), routed through
 * lib/reference-elements into the cref/sref/DNA pipeline, plus an "element completeness"
 * guide. Pure logic in lib/multimodal-ref + lib/reference-elements (unit-tested).
 */

import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Image as ImageIcon, MusicNotes as Music, Video, Plus, X, Paperclip } from '@phosphor-icons/react';
import {
  classifyRef, validateRefs, ACCEPT_ATTR, KIND_LABEL, MAX_PER_KIND,
  type ReferenceAsset, type RefKind,
} from '@/lib/multimodal-ref';
import {
  inferElementRole, elementCompleteness, clampElementWeight,
  ELEMENT_WEIGHT_MIN, ELEMENT_WEIGHT_MAX, ELEMENT_WEIGHT_DEFAULT,
  type ElementRole, type ReferenceElement,
} from '@/lib/reference-elements';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

function elementRoleLabel(role: ElementRole, t: Translations): string {
  return {
    character: t.product.tabCharacters,
    style: t.sharedUi.styleRole,
    scene: t.product.tabScenes,
    prop: t.sharedUi.propRole,
    motion: t.sharedUi.motionRole,
    voice: t.sharedUi.voiceRole,
  }[role];
}

const KIND_ICON: Record<RefKind, typeof ImageIcon> = { image: ImageIcon, audio: Music, video: Video };
const ELEMENT_ROLES: ElementRole[] = ['character', 'style', 'scene', 'prop', 'motion', 'voice'];

export function MultimodalRefShelf({
  refs,
  onChange,
}: {
  refs: ReferenceAsset[];
  onChange: (refs: ReferenceAsset[]) => void;
}) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [err, setErr] = useState('');

  const elements = refs as ReferenceElement[];

  const apply = (next: ReferenceAsset[]) => {
    const v = validateRefs(next);
    setErr(v.ok ? '' : v.errors[0]);
    onChange(next);
  };

  const setRole = (id: string, role: ElementRole) =>
    apply(elements.map((r) => (r.id === id ? { ...r, elementRole: role } : r)));

  // v9.4.9: character element strength (cref cw)
  const setWeight = (id: string, weight: number) =>
    apply(elements.map((r) => (r.id === id ? { ...r, weight: clampElementWeight(weight) } : r)));

  const addFromFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr('');
    const additions: ReferenceAsset[] = [];
    for (const f of Array.from(files)) {
      const kind = classifyRef({ mime: f.type, name: f.name });
      if (!kind) { setErr(t.sharedUi.unsupportedFile.replace('{name}', f.name)); continue; }
      if (f.size > 25 * 1024 * 1024) { setErr(t.sharedUi.fileOver25.replace('{name}', f.name)); continue; }
      try {
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        additions.push({ id: nanoid(), kind, url: dataUrl, name: f.name });
      } catch { setErr(t.sharedUi.readFailed.replace('{name}', f.name)); }
    }
    if (additions.length) apply([...refs, ...additions]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addFromUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const kind = classifyRef({ url });
    if (!kind) { setErr(t.sharedUi.badMediaUrl); return; }
    apply([...refs, { id: nanoid(), kind, url, name: url.split('/').pop()?.split('?')[0] || url }]);
    setUrlInput('');
  };

  const remove = (id: string) => apply(refs.filter((r) => r.id !== id));

  const completeness = elements.length > 0 ? elementCompleteness(elements) : null;
  const barColor = completeness
    ? completeness.level === 'rich' ? 'bg-emerald-500' : completeness.level === 'good' ? 'bg-sky-500' : 'bg-amber-500'
    : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-[#E8C547]" />
          {t.sharedUi.multiRefOptional}
          <span className="px-2 py-0.5 bg-[#E8C547]/10 text-[#E8C547] text-xs rounded-full">{t.sharedUi.lockByRole}</span>
        </label>
        <span className="text-xs text-gray-400">{t.sharedUi.refLimits.replace('{img}', String(MAX_PER_KIND.image)).replace('{aud}', String(MAX_PER_KIND.audio)).replace('{vid}', String(MAX_PER_KIND.video))}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-all inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> {t.sharedUi.uploadFile}
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} multiple className="hidden" onChange={(e) => addFromFiles(e.target.files)} />
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFromUrl())}
          placeholder={t.sharedUi.pasteMediaUrl}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E8C547]/40 transition-all"
        />
      </div>

      {err && <p className="mt-1.5 text-[11px] text-amber-300/90">{err}</p>}

      {elements.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {elements.map((r) => {
            const Icon = KIND_ICON[r.kind];
            const role = r.elementRole ?? inferElementRole(r);
            return (
              <div key={r.id} className="relative group w-20">
                <div className="w-20 h-20 rounded-lg border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
                  {r.kind === 'image' ? (
                    <img src={r.url} alt={r.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Icon className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t.sharedUi.removeRef}
                >
                  <X className="w-3 h-3" />
                </button>
                {/* v9.4.6: element role — which cref/sref/DNA path this ref routes into */}
                <select
                  value={role}
                  onChange={(e) => setRole(r.id, e.target.value as ElementRole)}
                  title={`${t.sharedUi.elementRole} · ${r.name}`}
                  className="mt-1 w-20 bg-black/60 border border-white/10 rounded text-[10px] text-gray-200 px-1 py-0.5 focus:outline-none focus:border-[#E8C547]/40 cursor-pointer"
                >
                  {ELEMENT_ROLES.map((er) => (
                    <option key={er} value={er}>{elementRoleLabel(er, t)}</option>
                  ))}
                </select>
                {/* v9.4.9: character strength (cref cw; higher = tighter face lock) */}
                {role === 'character' && (
                  <div className="mt-1 flex items-center gap-1" title={t.sharedUi.cwTitle}>
                    <span className="text-[9px] text-gray-500 shrink-0">cw</span>
                    <input
                      type="range" min={ELEMENT_WEIGHT_MIN} max={ELEMENT_WEIGHT_MAX} step={5}
                      value={r.weight ?? ELEMENT_WEIGHT_DEFAULT}
                      onChange={(e) => setWeight(r.id, Number(e.target.value))}
                      className="w-10 h-1 accent-[#E8C547] cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-300 tabular-nums w-5 text-right">{r.weight ?? ELEMENT_WEIGHT_DEFAULT}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* v9.4.6: element completeness guide (Kling-style "add elements") */}
      {completeness && (
        <div className="mt-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-400">{t.sharedUi.elementComplete}</span>
            <span className="text-[11px] font-medium text-gray-300 tabular-nums">{completeness.score}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full ${barColor} transition-all`} style={{ width: `${completeness.score}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500">{completeness.hints[0]}</p>
        </div>
      )}
    </div>
  );
}

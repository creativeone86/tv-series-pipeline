'use client';

/**
 * CharacterLockSection (v2.12 Phase 1)
 *
 * Pre-create "cameo lock" block — upload 1–3 lead faces before the project
 * starts so those faces stay consistent across the film.
 *
 * Per-card fields:
 *   - name (text)             — e.g. "Li Changan"
 *   - role (preset)           — lead / antagonist / supporting / cameo — drives cw
 *   - avatar (file or URL)    — local upload or paste an external URL
 *
 * Phase 1 behavior:
 *   Persist only; the orchestrator uses lockedCharacters[0] as the film-wide
 *   cameoFaceUrl (fallback for the existing single-character lock path).
 *   Phase 2 will route per-shot cref by matching Writer-tagged character names.
 */

import { useEffect, useRef, useState } from 'react';
import { Upload, Link as LinkIcon, X, CircleNotch as Loader2, UserCircle as UserCircle2, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';
import type { CharacterTraits } from '@/lib/character-traits';

/** Sentinel used by lib/character-traits when a dimension is unspecified. */
const TRAIT_UNSPECIFIED = '\u672a\u660e\u793a';

export interface LockedCharacter {
  /** Character name — required (empty string means the slot is unused) */
  name: string;
  /** Role tag — drives cw */
  role: 'lead' | 'antagonist' | 'supporting' | 'cameo';
  /** Midjourney --cw, derived from role */
  cw: number;
  /** Stable URL after persistAsset */
  imageUrl: string;
  /**
   * v2.12 Sprint A.2: 6–8 dim dossier auto-extracted via /api/character-traits/from-face.
   * When confident=false, prompt the user to review. Passed through create-stream →
   * orchestrator and merged into the Character Bible for recognition / consistency.
   */
  traits?: CharacterTraits;
}

interface Props {
  value: LockedCharacter[];
  onChange: (next: LockedCharacter[]) => void;
}

const MAX_SLOTS = 3;

const ROLE_PRESETS: Array<{
  id: LockedCharacter['role'];
  cw: number;
}> = [
  { id: 'lead',        cw: 125 },
  { id: 'antagonist',  cw: 125 },
  { id: 'supporting',  cw: 100 },
  { id: 'cameo',       cw:  80 },
];

const DEFAULT_SLOT: LockedCharacter = { name: '', role: 'lead', cw: 125, imageUrl: '' };

/**
 * v12.147 (Agent Memory): fill the first empty slot (both name and imageUrl blank)
 * from a library pick. No empty slot → null (caller asks the user to clear one).
 * Pure function so it is easy to unit-test.
 */
export function fillFirstEmptySlot(
  slots: LockedCharacter[],
  pick: { name: string; imageUrl: string; traits?: CharacterTraits },
): { next: LockedCharacter[]; idx: number } | null {
  const idx = slots.findIndex((s) => !s.name.trim() && !s.imageUrl);
  if (idx === -1) return null;
  const next = [...slots];
  next[idx] = { ...next[idx], name: pick.name, imageUrl: pick.imageUrl, traits: pick.traits };
  return { next, idx };
}

export function CharacterLockSection({ value, onChange }: Props) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  // Always keep 3 slots internally; onChange filters out empty ones (missing name or imageUrl)
  const [slots, setSlots] = useState<LockedCharacter[]>(() => {
    const padded = [...value];
    while (padded.length < MAX_SLOTS) padded.push({ ...DEFAULT_SLOT });
    return padded.slice(0, MAX_SLOTS);
  });

  // Sync when the external value changes (e.g. after reset)
  useEffect(() => {
    const padded = [...value];
    while (padded.length < MAX_SLOTS) padded.push({ ...DEFAULT_SLOT });
    setSlots(padded.slice(0, MAX_SLOTS));
  }, [value.length]); // length only, to avoid a loop

  const updateSlot = (idx: number, patch: Partial<LockedCharacter>) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      // role change → cw follows (Phase 1 does not expose manual cw)
      if (patch.role) {
        const preset = ROLE_PRESETS.find(p => p.id === patch.role);
        if (preset) next[idx].cw = preset.cw;
      }
      // Notify parent
      onChange(next.filter(s => s.name.trim() && s.imageUrl));
      return next;
    });
  };

  const clearSlot = (idx: number) => {
    updateSlot(idx, { name: '', imageUrl: '' });
  };

  // v12.147: pull from the character library (global_assets). Fetch on first expand; collapsed by default.
  const [libOpen, setLibOpen] = useState(false);
  const [libAssets, setLibAssets] = useState<Array<{ id: string; name: string; thumbnail: string; metadata?: any }> | null>(null);
  const [libHint, setLibHint] = useState('');
  const toggleLibrary = async () => {
    const opening = !libOpen;
    setLibOpen(opening);
    if (!opening || libAssets !== null) return;
    try {
      const res = await fetch('/api/global-assets?type=character&limit=12');
      const data = await res.json();
      setLibAssets(Array.isArray(data.assets) ? data.assets.filter((a: any) => a.thumbnail) : []);
    } catch { setLibAssets([]); }
  };
  const pickFromLibrary = (a: { id: string; name: string; thumbnail: string; metadata?: any }) => {
    const filled = fillFirstEmptySlot(slots, { name: a.name, imageUrl: a.thumbnail, traits: a.metadata?.traits });
    if (!filled) { setLibHint(t.workshopCreate.slotsFull); return; }
    setLibHint('');
    setSlots(filled.next);
    onChange(filled.next.filter(s => s.name.trim() && s.imageUrl));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-3.5 h-3.5 text-[#E8C547] cinema-page:text-[var(--cinema-amber)]" />
          {/* cinema-page: mono eyebrow; otherwise the original h3 */}
          <span className="cinema-eyebrow tracking-widest hidden [.cinema-page_&]:inline">{t.workshopCreate.cameoLockTitle}</span>
          <h3 className="text-sm font-semibold [.cinema-page_&]:hidden">
            {t.workshopCreate.cameoLockHeading} <span className="text-xs text-gray-400">{t.workshopCreate.cameoLockOptional}</span>
          </h3>
        </div>
        <span className="text-[11px] text-gray-400 [.cinema-page_&]:cinema-mono [.cinema-page_&]:tracking-wider">
          <span className="[.cinema-page_&]:hidden">🔒 {t.workshopCreate.cameoLockHint}</span>
          <span className="hidden [.cinema-page_&]:inline">{t.workshopCreate.cameoLockHintShort}</span>
        </span>
      </div>
      {/* v12.147: cross-project character memory — one tap to fill a lock slot */}
      <div>
        <button
          type="button"
          onClick={toggleLibrary}
          className="text-[11px] text-cyan-300/80 hover:text-cyan-200 transition-colors cinema-mono"
          data-testid="char-library-toggle"
        >
          📚 {t.workshopCreate.pickFromLibrary}{libOpen ? ' ▲' : ' ▼'}
        </button>
        {libOpen && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {libAssets === null ? (
              <span className="text-[10px] text-gray-500">{t.workshopCreate.loadingLibrary}</span>
            ) : libAssets.length === 0 ? (
              <span className="text-[10px] text-gray-500">{t.workshopCreate.libraryEmpty}</span>
            ) : (
              libAssets.map((a) => (
                <button key={a.id} type="button" onClick={() => pickFromLibrary(a)} title={t.workshopCreate.pickNamed.replace('{name}', a.name)} className="shrink-0 text-center group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.thumbnail}
                    alt={a.name}
                    className="w-12 h-12 rounded-lg object-cover border border-white/10 group-hover:border-cyan-400/60 transition-colors"
                    onError={(e) => { const b = e.currentTarget.closest('button'); if (b) (b as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="text-[9px] text-gray-400 mt-0.5 max-w-12 truncate">{a.name}</div>
                </button>
              ))
            )}
          </div>
        )}
        {libHint && <div className="text-[10px] text-amber-400/80 mt-1">{libHint}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {slots.map((slot, idx) => (
          <CharacterCard
            key={idx}
            slotLabel={String.fromCharCode(65 + idx) /* A / B / C */}
            slot={slot}
            onUpdate={patch => updateSlot(idx, patch)}
            onClear={() => clearSlot(idx)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

interface CardProps {
  slotLabel: string;
  slot: LockedCharacter;
  onUpdate: (patch: Partial<LockedCharacter>) => void;
  onClear: () => void;
}

function CharacterCard({ slotLabel, slot, onUpdate, onClear }: CardProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const { showToast } = useToast();

  const roleLabel = (id: LockedCharacter['role']) => {
    if (id === 'lead') return t.workshopCreate.roleLead;
    if (id === 'antagonist') return t.workshopCreate.roleAntagonist;
    if (id === 'supporting') return t.workshopCreate.roleSupporting;
    return t.workshopCreate.roleCameo;
  };

  // v2.12 Sprint A.3: cross-project Bible lookup (debounced)
  const [bibleHit, setBibleHit] = useState<{
    bible: {
      role: LockedCharacter['role'];
      cw: number;
      imageUrl: string;
      traits?: CharacterTraits | null;
      sampleFaces?: string[];
    };
    usedInProjectsCount: number;
  } | null>(null);
  const [bibleDismissed, setBibleDismissed] = useState(false);
  // v12.2.3 series reuse: when the exact name misses, show similar library characters
  const [similarHits, setSimilarHits] = useState<Array<{
    id: string; name: string; score: number;
    bible?: { imageUrl: string; role: LockedCharacter['role']; sampleFaces?: string[]; hasDna?: boolean };
  }>>([]);

  useEffect(() => {
    // Already has a face, or the user dismissed → skip lookup
    if (slot.imageUrl || bibleDismissed) {
      setBibleHit(null);
      setSimilarHits([]);
      return;
    }
    const trimmed = slot.name.trim();
    if (trimmed.length < 2) {
      setBibleHit(null);
      setSimilarHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/characters/bible/${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        const json = res.ok ? await res.json() : null;
        if (json && json.found) {
          setBibleHit({ bible: json.bible, usedInProjectsCount: json.usedInProjectsCount });
          setSimilarHits([]);
          return;
        }
        setBibleHit(null);
        // v12.2.3 no exact hit → similar (vector first, text fallback); keep rows that have a face
        const sim = await fetch(`/api/global-assets/similar?q=${encodeURIComponent(trimmed)}&type=character&k=3`, { signal: ctrl.signal });
        if (sim.ok) {
          const sj = await sim.json();
          const hits = (Array.isArray(sj.results) ? sj.results : []).filter((r: any) => r?.bible?.imageUrl && r.name !== trimmed);
          setSimilarHits(hits);
        } else {
          setSimilarHits([]);
        }
      } catch { /* abort/network — silent */ }
    }, 600);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [slot.name, slot.imageUrl, bibleDismissed]);

  const reuseSimilar = (hit: { name: string; bible?: { imageUrl: string; role: LockedCharacter['role'] } }) => {
    if (!hit.bible?.imageUrl) return;
    onUpdate({ role: hit.bible.role || 'supporting', cw: hit.bible.role === 'lead' ? 125 : 100, imageUrl: hit.bible.imageUrl });
    setSimilarHits([]);
    showToast({ title: t.workshopCreate.reusedSimilar.replace('{name}', hit.name), type: 'success' });
  };

  const reuseBible = () => {
    if (!bibleHit) return;
    onUpdate({
      role: bibleHit.bible.role,
      cw: bibleHit.bible.cw,
      imageUrl: bibleHit.bible.imageUrl,
      traits: bibleHit.bible.traits ?? undefined,
    });
    setBibleHit(null);
    showToast({ title: t.workshopCreate.reusedBible.replace('{name}', slot.name), type: 'success' });
  };

  /**
   * v2.12 Sprint A.2: after a successful upload, fire-and-forget GPT-4o Vision
   * to extract a 6–8 dim dossier as chips. Failures are silent (no chips, flow continues).
   */
  const extractTraits = async (imageUrl: string) => {
    setExtracting(true);
    try {
      const res = await fetch('/api/character-traits/from-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, defaultName: slot.name || undefined }),
      });
      if (res.ok) {
        const traits: CharacterTraits = await res.json();
        onUpdate({ traits });
        if (traits.confident === false) {
          showToast({ title: t.workshopCreate.traitsLowConfidence, type: 'info' });
        }
      }
    } catch {
      /* Silent — vision down should not block create; we just skip the 6-dim dossier */
    } finally {
      setExtracting(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ title: t.workshopCreate.imageOnly, type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: t.workshopCreate.imageTooLarge, type: 'error' });
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/character-face', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) {
        showToast({ title: body.error || t.product.dropFailed, type: 'error' });
        return;
      }
      onUpdate({ imageUrl: body.url });
      extractTraits(body.url);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.product.dropFailed, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleUrl = async () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      showToast({ title: t.workshopCreate.urlMustHttp, type: 'error' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/upload/character-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: trimmed }),
      });
      const body = await res.json();
      if (!res.ok) {
        showToast({ title: body.error || t.workshopCreate.urlFetchFailed, type: 'error' });
        return;
      }
      onUpdate({ imageUrl: body.url });
      setShowUrlInput(false);
      setUrlDraft('');
      extractTraits(body.url);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.workshopCreate.urlFetchFailed, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const hasImage = !!slot.imageUrl;

  return (
    <div className={`relative rounded-2xl border p-3 transition ${
      hasImage
        ? 'border-[#E8C547]/35 bg-[#E8C547]/5'
        : 'border-dashed border-white/15 bg-white/[0.02]'
    }`}>
      {/* Slot badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#E8C547] text-black text-[11px] font-bold flex items-center justify-center shadow">
        {slotLabel}
      </div>

      {/* v2.12 Sprint A.3: historical Bible hit */}
      {bibleHit && !hasImage && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-[10.5px]">
          <img loading="lazy" decoding="async" 
            src={bibleHit.bible.imageUrl}
            alt=""
            className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-emerald-200 font-semibold truncate">
              📚 {t.workshopCreate.bibleFound.replace('{name}', slot.name.trim())}
            </div>
            <div className="text-emerald-200/60 text-[9.5px]">
              {t.workshopCreate.bibleUsedIn.replace('{n}', String(bibleHit.usedInProjectsCount))}
            </div>
          </div>
          <button
            type="button"
            onClick={reuseBible}
            className="px-2 py-0.5 rounded bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-100 text-[10px] font-medium flex-shrink-0"
          >
            {t.workshopCreate.reuseOnce}
          </button>
          <button
            type="button"
            onClick={() => setBibleDismissed(true)}
            className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white flex-shrink-0"
            aria-label="dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* v12.2.3: no exact name → similar library recs (avoid dupes + series drift) */}
      {!bibleHit && !hasImage && similarHits.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[10.5px]" data-testid="similar-character-rec">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sky-200/80 text-[9.5px]">🔁 {t.workshopCreate.similarHint}</span>
            <button type="button" onClick={() => setSimilarHits([])} className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white" aria-label="dismiss similar"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex flex-col gap-1">
            {similarHits.map((hit) => (
              <div key={hit.id} className="flex items-center gap-2">
                <img loading="lazy" decoding="async" src={hit.bible!.imageUrl} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sky-100 font-medium truncate">{hit.name}</div>
                  <div className="text-sky-200/50 text-[9px]">{t.workshopCreate.similarity.replace('{n}', String(Math.round(hit.score * 100)))}{hit.bible!.hasDna ? t.workshopCreate.hasDna : ''}</div>
                </div>
                <button
                  type="button"
                  onClick={() => reuseSimilar(hit)}
                  className="px-2 py-0.5 rounded bg-sky-500/25 hover:bg-sky-500/40 text-sky-100 text-[10px] font-medium flex-shrink-0"
                >
                  {t.workshopCreate.reuseLook}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview / upload */}
      <div className="flex items-start gap-3">
        <div
          onClick={() => !busy && !hasImage && inputRef.current?.click()}
          className={`relative w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${
            !hasImage ? 'cursor-pointer hover:bg-white/10 bg-white/5' : ''
          } flex items-center justify-center`}
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : hasImage ? (
            <img loading="lazy" decoding="async" src={slot.imageUrl} alt={slot.name || t.workshopCreate.characterAlt.replace('{slot}', slotLabel)} className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="text"
            value={slot.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={t.workshopCreate.characterNamePlaceholder}
            aria-label={t.workshopCreate.characterNameAria}
            className="w-full px-2 py-1.5 text-xs bg-black/30 border border-white/10 rounded-md focus:outline-none focus:border-[#E8C547]/50"
          />
          <select
            value={slot.role}
            onChange={e => onUpdate({ role: e.target.value as LockedCharacter['role'] })}
            aria-label={t.workshopCreate.characterRoleAria}
            className="w-full px-2 py-1.5 text-xs bg-black/30 border border-white/10 rounded-md focus:outline-none focus:border-[#E8C547]/50"
          >
            {ROLE_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {roleLabel(p.id)} · cw={p.cw}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
        {!hasImage && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex-1 px-2 py-1 text-[11px] rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 inline-flex items-center justify-center gap-1"
            >
              <Upload className="w-3 h-3" />
              {t.workshopCreate.uploadFile}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(v => !v)}
              disabled={busy}
              className="flex-1 px-2 py-1 text-[11px] rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 inline-flex items-center justify-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              {t.workshopCreate.useUrl}
            </button>
          </>
        )}
        {hasImage && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="px-2 py-1 text-[11px] rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-40 inline-flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" />
            {t.workshopCreate.clear}
          </button>
        )}
      </div>

      {showUrlInput && !hasImage && (
        <div className="mt-2 flex gap-1">
          <input
            type="url"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUrl(); }}
            placeholder="https://..."
            className="flex-1 px-2 py-1 text-[11px] bg-black/30 border border-white/10 rounded focus:outline-none focus:border-[#E8C547]/50"
          />
          <button
            type="button"
            onClick={handleUrl}
            disabled={busy || !urlDraft.trim()}
            className="px-2 py-1 text-[11px] rounded bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 disabled:opacity-40"
          >
            {t.workshopCreate.fetchUrl}
          </button>
        </div>
      )}

      {/* v2.12 Sprint A.2: auto-extracted 6-dim dossier chips */}
      {hasImage && (extracting || slot.traits) && (
        <TraitChips traits={slot.traits} extracting={extracting} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TraitChips — 6–8 dim dossier chips extracted from the face
// ─────────────────────────────────────────────────────────────────────

function TraitChips({
  traits,
  extracting,
}: {
  traits?: CharacterTraits;
  extracting: boolean;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };

  if (extracting) {
    return (
      <div className="mt-2.5 pt-2 border-t border-white/8 flex items-center gap-1.5 text-[10.5px] text-violet-300/80">
        <Sparkles className="w-3 h-3 animate-pulse" />
        <span>{t.workshopCreate.extractingTraits}</span>
      </div>
    );
  }

  if (!traits) return null;

  // Map gender; only show dimensions that have real values
  const genderText = traits.gender === 'male' ? t.workshopCreate.genderMale : traits.gender === 'female' ? t.workshopCreate.genderFemale : null;
  const chips: Array<{ label: string; full?: string }> = [];
  if (genderText) chips.push({ label: genderText });
  if (traits.ageGroup && traits.ageGroup !== TRAIT_UNSPECIFIED) chips.push({ label: traits.ageGroup });
  if (traits.skinTone && traits.skinTone !== TRAIT_UNSPECIFIED) chips.push({ label: traits.skinTone });
  if (traits.appearance && traits.appearance !== TRAIT_UNSPECIFIED) {
    chips.push({ label: traits.appearance.length > 8 ? traits.appearance.slice(0, 8) + '…' : traits.appearance, full: traits.appearance });
  }
  if (traits.costume && traits.costume !== TRAIT_UNSPECIFIED) {
    chips.push({ label: traits.costume.length > 8 ? traits.costume.slice(0, 8) + '…' : traits.costume, full: traits.costume });
  }
  if (traits.personality && traits.personality !== TRAIT_UNSPECIFIED) {
    chips.push({ label: traits.personality.length > 8 ? traits.personality.slice(0, 8) + '…' : traits.personality, full: traits.personality });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-white/8">
      <div className="flex items-center gap-1 text-[9.5px] uppercase tracking-widest text-violet-300/70 mb-1.5">
        <Sparkles className="w-2.5 h-2.5" />
        <span>{t.workshopCreate.aiTraits}</span>
        {traits.confident === false && (
          <span className="ml-1 px-1 rounded bg-amber-500/15 text-amber-300 normal-case tracking-normal text-[9px]">{t.workshopCreate.lowConfidence}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {chips.map((c, i) => (
          <span
            key={i}
            title={c.full}
            className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-200/85 text-[10.5px] border border-violet-500/20"
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

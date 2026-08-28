'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';
import { Users, Plus, X, Clipboard, Check, Tag, Eye, Trash as Trash2, MagnifyingGlass as Search, MagicWand as Wand2, CircleNotch as Loader2, Sparkle as Sparkles } from '@phosphor-icons/react';

/** API trait sentinel "unspecified" (zh). */
const TRAIT_UNSPECIFIED = '\u672a\u660e\u793a';

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

interface CharacterItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  appearance: string;
  visualTags: string[];
  imageUrls: string[];
  styleKeywords: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// v6.0.2 character dossier (matches lib/character-studio CharacterProfile; UI-readonly subset)
interface CharacterProfileView {
  name: string;
  bio: string;
  voiceId: string;
  voiceLabel: string;
  voiceMatched: boolean;
  identityBlock: string;
  turnaround: Array<{ id: string; label: string; prompt: string; imageUrl?: string }>;
}

// ─── Save Character Modal ────────────────────────────────────────────────────

function SaveCharacterModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (character: CharacterItem) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [appearance, setAppearance] = useState('');
  const [styleKeywords, setStyleKeywords] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [visualTags, setVisualTags] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Sprint A.2: reverse-extract state
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState<string>('');
  const [autoFilledFlag, setAutoFilledFlag] = useState(false);

  /**
   * Sprint A.2 — reverse-extract a 6–8 dim character sheet from the first
   * reference image and auto-fill empty fields. User can still tweak; already
   * edited fields are not overwritten.
   */
  const handleAutoFillFromFace = async () => {
    if (imageUrls.length === 0) {
      setAutoFillMsg(t.dashPages.autoFillNeedImage);
      setTimeout(() => setAutoFillMsg(''), 4000);
      return;
    }
    setAutoFilling(true);
    setAutoFillMsg('');
    try {
      const res = await fetch('/api/character-traits/from-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrls[0],
          defaultName: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAutoFillMsg(data?.error || t.dashPages.recognizeFailed.replace('{status}', String(res.status)));
        setTimeout(() => setAutoFillMsg(''), 5000);
        return;
      }
      // Apply only to empty fields so hand-written copy is never swallowed
      if (!name.trim() && data.name) setName(data.name);
      // description / appearance: assemble readable trait text
      const descParts: string[] = [];
      const genderLabel = data.gender === 'male' ? t.dashPages.genderMale : data.gender === 'female' ? t.dashPages.genderFemale : '';
      const ageLabel = data.ageGroup && data.ageGroup !== TRAIT_UNSPECIFIED ? data.ageGroup : '';
      if (genderLabel || ageLabel) descParts.push(`${ageLabel}${genderLabel}`.trim() || (genderLabel || ageLabel));
      if (data.build && data.build !== TRAIT_UNSPECIFIED) descParts.push(data.build);
      if (data.skinTone && data.skinTone !== TRAIT_UNSPECIFIED) descParts.push(t.dashPages.skinToneOf.replace('{tone}', data.skinTone));
      if (data.personality && data.personality !== TRAIT_UNSPECIFIED) descParts.push(t.dashPages.temperamentPrefix.replace('{v}', data.personality));
      const newDescription = descParts.join(' · ');

      const appearanceParts: string[] = [];
      if (data.appearance && data.appearance !== TRAIT_UNSPECIFIED) appearanceParts.push(data.appearance);
      if (data.costume && data.costume !== TRAIT_UNSPECIFIED) appearanceParts.push(t.dashPages.costumePrefix.replace('{v}', data.costume));
      if (data.signature && data.signature !== TRAIT_UNSPECIFIED) appearanceParts.push(t.dashPages.markPrefix.replace('{v}', data.signature));
      const newAppearance = appearanceParts.join(' · ');

      if (!description.trim() && newDescription) setDescription(newDescription);
      if (!appearance.trim() && newAppearance) setAppearance(newAppearance);
      // Auto-add up to 2 personality tags; skip duplicates
      if (data.personality && data.personality !== TRAIT_UNSPECIFIED) {
        const newTags = data.personality.split(/[\s,，;；]+/).filter((tag: string) => tag && !visualTags.includes(tag)).slice(0, 2);
        if (newTags.length) setVisualTags([...visualTags, ...newTags]);
      }
      setAutoFilledFlag(true);
      setAutoFillMsg(data.confident ? t.dashPages.recognizedHigh : t.dashPages.recognizedLow);
      setTimeout(() => setAutoFillMsg(''), 8000);
    } catch (e: any) {
      setAutoFillMsg(e?.message || t.dashPages.networkAbnormal);
      setTimeout(() => setAutoFillMsg(''), 5000);
    } finally {
      setAutoFilling(false);
    }
  };

  // Scroll lock (Escape is handled by useFocusTrap)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // v10.3.6 a11y: Escape + focus trap + restore focus
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !visualTags.includes(tag)) {
      setVisualTags([...visualTags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setVisualTags(visualTags.filter((t) => t !== tag));
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
    }
    setImageUrlInput('');
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t.dashPages.nameRequired);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          appearance: appearance.trim(),
          styleKeywords: styleKeywords.trim(),
          visualTags,
          imageUrls,
        }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || t.dashPages.saveFailed);
      }
      const character = await res.json();
      onSaved(character);
      onClose();
    } catch (e: any) {
      setError(e.message || t.dashPages.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.dashPages.saveCharacter}
        tabIndex={-1}
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col outline-none"
        style={{ background: 'rgba(18,18,20,0.98)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">{t.dashPages.saveCharacter}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">
              {t.dashPages.charName} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.dashPages.charNamePh}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">{t.dashPages.charDesc}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.dashPages.charDescPh}
              rows={3}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>

          {/* Appearance */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">{t.dashPages.charAppearance}</label>
            <textarea
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder={t.dashPages.charAppearancePh}
              rows={3}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>

          {/* Style Keywords */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">{t.dashPages.charStyleKw}</label>
            <input
              type="text"
              value={styleKeywords}
              onChange={(e) => setStyleKeywords(e.target.value)}
              placeholder={t.dashPages.charStyleKwPh}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Visual Tags */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">{t.dashPages.visualTags}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={t.dashPages.tagPh}
                className="flex-1 bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-xl bg-white/10 text-xs text-[var(--muted)] hover:bg-white/20 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {visualTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {visualTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] border border-amber-500/20"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5 font-medium">{t.dashPages.refImageUrl}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                placeholder={t.dashPages.imageUrlPh}
                className="flex-1 bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/50 transition-colors"
              />
              <button
                onClick={addImageUrl}
                className="px-3 py-2 rounded-xl bg-white/10 text-xs text-[var(--muted)] hover:bg-white/20 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageUrls.map((url) => (
                  <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] group">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <button
                      onClick={() => removeImageUrl(url)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Sprint A.2 — one-click LLM Vision reverse-extract (6 dims) */}
            {imageUrls.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAutoFillFromFace}
                  disabled={autoFilling}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11.5px] border transition-colors ${
                    autoFilledFlag
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25'
                  } ${autoFilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={t.dashPages.autoFillTitle}
                >
                  {autoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : autoFilledFlag ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {autoFilling ? t.dashPages.recognizing : autoFilledFlag ? t.dashPages.recognizedRedo : t.dashPages.autoFillFromImage}
                </button>
                <span className="text-[10.5px] text-[var(--muted)]">{t.dashPages.autoFillHint}</span>
              </div>
            )}
            {autoFillMsg && (
              <p className="mt-2 text-[11px] text-violet-200/85 px-1 leading-relaxed">{autoFillMsg}</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-400 px-1">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[var(--muted)] hover:text-white hover:bg-white/10 transition-all"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t.common.saving : t.dashPages.saveCharacter}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Character Detail Modal ──────────────────────────────────────────────────

function CharacterDetailModal({
  character,
  onClose,
}: {
  character: CharacterItem;
  onClose: () => void;
}) {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const [copied, setCopied] = useState(false);
  // v6.0.2 character dossier (turnaround / bio / bound voice) — /api/characters/[id]/studio
  const [profile, setProfile] = useState<CharacterProfileView | null>(null);
  const [genMode, setGenMode] = useState<null | 'profile' | 'images'>(null);
  const [profileErr, setProfileErr] = useState('');

  // Scroll lock (Escape is handled by useFocusTrap)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // v10.3.6 a11y: Escape + focus trap + restore focus
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  // Load persisted dossier when the detail modal opens
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/characters/${character.id}/studio`);
        const data = await res.json();
        if (!cancelled && res.ok && data.persisted) setProfile(data.profile);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [character.id]);

  const generateProfile = async (withImages: boolean) => {
    setGenMode(withImages ? 'images' : 'profile');
    setProfileErr('');
    try {
      const res = await fetch(`/api/characters/${character.id}/studio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: withImages, style: character.styleKeywords || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t.dashPages.generateFailed);
      setProfile(data.profile);
      if (withImages && data.generated === 0) {
        setProfileErr(t.dashPages.turnaroundNoEngine);
      }
    } catch (e: any) {
      setProfileErr(e?.message || t.dashPages.generateFailed);
    } finally {
      setGenMode(null);
    }
  };

  const handleCopy = async () => {
    const text = [
      `${t.dashPages.copyName}${character.name}`,
      character.description ? `${t.dashPages.copyDesc}${character.description}` : '',
      character.appearance ? `${t.dashPages.copyLook}${character.appearance}` : '',
      character.styleKeywords ? `${t.dashPages.copyStyle}${character.styleKeywords}` : '',
      character.visualTags.length > 0 ? `${t.dashPages.copyTags}${character.visualTags.join('、')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Increment usage count in background
      fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usageCount: character.usageCount + 1 }),
      }).catch(() => {});
    } catch {
      // fallback: select text
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={character.name}
        tabIndex={-1}
        className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col outline-none"
        style={{ background: 'rgba(18,18,20,0.98)', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <h3 className="text-base font-semibold text-white truncate pr-2">{character.name}</h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Images */}
          {character.imageUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {character.imageUrls.map((url, i) => (
                <img loading="lazy" decoding="async" 
                  key={i}
                  src={url}
                  alt={character.name}
                  className="w-20 h-20 object-cover rounded-xl border border-[var(--border)]" />
              ))}
            </div>
          )}

          {character.description && (
            <div>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">{t.dashPages.charDesc}</p>
              <p className="text-sm text-[var(--soft)] leading-relaxed">{character.description}</p>
            </div>
          )}

          {character.appearance && (
            <div>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">{t.dashPages.appearanceTraits}</p>
              <p className="text-sm text-[var(--soft)] leading-relaxed">{character.appearance}</p>
            </div>
          )}

          {character.styleKeywords && (
            <div>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">{t.dashPages.charStyleKw}</p>
              <p className="text-sm text-amber-300/80">{character.styleKeywords}</p>
            </div>
          )}

          {character.visualTags.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5">{t.dashPages.visualTags}</p>
              <div className="flex flex-wrap gap-1.5">
                {character.visualTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 text-[11px] border border-amber-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] pt-1">
            <span>{t.dashPages.usedNTimes.replace('{n}', String(character.usageCount))}</span>
            <span>·</span>
            <span>{new Date(character.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* v6.0.2 — character dossier (turnaround / bio / bound voice) */}
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {t.dashPages.profileSection}
            </p>

            {profile ? (
              <div className="flex flex-col gap-3">
                {/* Bio */}
                <div>
                  <p className="text-[10px] text-[var(--muted)] mb-0.5">{t.dashPages.autoBio}</p>
                  <p className="text-[13px] text-[var(--soft)] leading-relaxed">{profile.bio}</p>
                </div>
                {/* Bound voice */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted)]">{t.dashPages.boundVoice}</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 text-[11px] border border-violet-500/25">
                    {profile.voiceLabel}{!profile.voiceMatched && t.dashPages.voiceDefault}
                  </span>
                </div>
                {/* Turnaround sheets */}
                <div>
                  <p className="text-[10px] text-[var(--muted)] mb-1.5">{t.dashPages.turnaroundTitle}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {profile.turnaround.map((v) => (
                      <div key={v.id} className="flex flex-col items-center gap-1">
                        <div className="aspect-square w-full rounded-lg border border-[var(--border)] bg-black/30 overflow-hidden flex items-center justify-center" title={v.prompt}>
                          {v.imageUrl ? (
                            <img loading="lazy" decoding="async" src={v.imageUrl} alt={v.label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8.5px] text-[var(--muted)] text-center px-1 leading-tight">{t.dashPages.promptReady}<br />{t.dashPages.noImageYet}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--soft)]">{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                {t.dashPages.noProfileYet}
              </p>
            )}

            {profileErr && <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">{profileErr}</p>}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => generateProfile(false)}
                disabled={genMode !== null}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {genMode === 'profile' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {profile ? t.dashPages.refreshProfile : t.dashPages.generateProfile}
              </button>
              <button
                onClick={() => generateProfile(true)}
                disabled={genMode !== null}
                title={t.dashPages.generateTurnaroundTitle}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-medium bg-violet-500/15 text-violet-200 border border-violet-500/25 hover:bg-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {genMode === 'images' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {t.dashPages.generateTurnaround}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[var(--border)]">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t.dashPages.copiedClipboard}
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" />
                {t.dashPages.useCharacterCopy}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      setCharacters(Array.isArray(data) ? data : []);
    } catch {
      setCharacters([]);
    }
    setLoading(false);
  };

  const handleSaved = (character: CharacterItem) => {
    setCharacters((prev) => [character, ...prev]);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t.dashPages.deleteConfirm)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      if (selectedCharacter?.id === id) setSelectedCharacter(null);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim()
    ? characters.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()) ||
          c.visualTags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          c.styleKeywords.toLowerCase().includes(search.toLowerCase())
      )
    : characters;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            {t.sidebar.characters}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t.dashPages.pageSubtitle.replace('{n}', String(characters.length))}
          </p>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t.dashPages.saveCharacter}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.dashPages.searchChars}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[var(--muted)] outline-none focus:border-amber-500/40 transition-colors"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          {t.common.loading}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {search.trim() ? t.dashPages.noMatch : t.dashPages.noChars}
          </p>
          {!search.trim() && (
            <p className="text-xs mt-1 text-gray-600">
              {t.dashPages.emptyHint}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((character) => (
            <div
              key={character.id}
              className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedCharacter(character)}
            >
              {/* Image area */}
              <div className="h-[140px] bg-black/30 relative overflow-hidden">
                {character.imageUrls.length > 0 ? (
                  <img
                    src={character.imageUrls[0]}
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-amber-400/20" />
                  </div>
                )}

                {/* Usage badge */}
                {character.usageCount > 0 && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 text-[9px] text-amber-300">
                    {t.dashPages.usedNShort.replace('{n}', String(character.usageCount))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCharacter(character); }}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                    title={t.dashPages.viewDetails}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(character.id, e)}
                    disabled={deletingId === character.id}
                    className="p-2 rounded-full bg-rose-500/30 text-rose-300 hover:bg-rose-500/50 transition-all disabled:opacity-50"
                    title={t.dashPages.deleteCharacter}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="text-sm font-semibold text-white truncate">{character.name}</h4>

                {character.description && (
                  <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                    {character.description}
                  </p>
                )}

                {/* Visual tags */}
                {character.visualTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {character.visualTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 text-[10px] border border-amber-500/15"
                      >
                        <Tag className="w-2 h-2" />
                        {tag}
                      </span>
                    ))}
                    {character.visualTags.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[var(--muted)] text-[10px]">
                        +{character.visualTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-[var(--muted)]">
                    {new Date(character.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  {character.styleKeywords && (
                    <span className="text-[10px] text-amber-400/60 truncate max-w-[100px]">
                      {character.styleKeywords}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showSaveModal && (
        <SaveCharacterModal
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
        />
      )}

      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}

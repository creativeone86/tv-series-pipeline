'use client';

/**
 * CameoPanel (v2.10)
 *
 * "Lead face lock" card on the project detail page — Cameo closed loop UI.
 *
 * States:
 *   - empty: "upload lead face" CTA + why locking matters
 *   - locked: thumbnail + replace / unlock buttons
 *
 * Backend: GET/POST/DELETE /api/projects/:id/cameo
 *
 * Why it lives on project detail:
 *   Users often forget to upload at create time, or only notice after generation
 *   that every shot has a different face. Put the lock in the most visible spot
 *   and pair it with shot regen so the loop closes.
 */

import { useEffect, useRef, useState } from 'react';
import { UserCircle as UserCircle2, Upload, Trash as Trash2, CircleNotch as Loader2, Lock, CheckCircle as CheckCircle2, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useToast } from './ui/toast-provider';
import { CameoScoreBadge, type CameoScoreBadgeData } from './CameoScoreBadge';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  projectId: string;
  /** Parent-known Cameo URL from the initial projects/:id load; may be null */
  initialUrl?: string | null;
  /** Notify the parent so it can refresh project data */
  onChange?: (nextUrl: string | null) => void;
}

export function CameoPanel({ projectId, initialUrl = null, onChange }: Props) {
  const { t } = useLocale();
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [busy, setBusy] = useState<'idle' | 'upload' | 'delete'>('idle');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  // v2.11 #2: score asynchronously after upload and show the fit badge
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<CameoScoreBadgeData | null>(null);

  useEffect(() => {
    setUrl(initialUrl || null);
    // Clear stale scores when the initial URL changes (do not auto-score —
    // avoid burning quota on every page open; user must click rescore or replace)
    setScoreData(null);
    setScoreError(null);
  }, [initialUrl]);

  /** Run vision scoring against a persisted URL */
  const runPreviewScore = async (imageUrl: string) => {
    setScoreLoading(true);
    setScoreError(null);
    setScoreData(null);
    try {
      const res = await fetch('/api/cameo/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.status === 503) {
        setScoreError(t.sharedUi.visionDisabled);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setScoreError(body.error || `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setScoreData(data);
      // Toast on a poor score so the user does not miss it
      if (data.verdict === 'poor') {
        showToast({
          title: t.sharedUi.cameoLowScore.replace('{n}', String(data.score)),
          type: 'warning',
        });
      }
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : t.sharedUi.scoreFailed);
    } finally {
      setScoreLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ title: t.sharedUi.imagesOnly, type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: t.sharedUi.imageTooLarge, type: 'error' });
      return;
    }
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/projects/${projectId}/cameo`, {
        method: 'POST',
        body: form,
      });
      const body = await res.json();
      if (!res.ok) {
        showToast({ title: body.error || t.product.dropFailed, type: 'error' });
        return;
      }
      setUrl(body.url);
      onChange?.(body.url);
      showToast({ title: t.sharedUi.cameoLockedOk, type: 'success' });
      // Fire-and-forget score after a successful upload; do not block UI
      runPreviewScore(body.url);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.product.dropFailed, type: 'error' });
    } finally {
      setBusy('idle');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.sharedUi.cameoUnlockConfirm)) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/projects/${projectId}/cameo`, { method: 'DELETE' });
      if (!res.ok) {
        showToast({ title: t.sharedUi.unlockFailed, type: 'error' });
        return;
      }
      setUrl(null);
      onChange?.(null);
      setScoreData(null);
      setScoreError(null);
      showToast({ title: t.sharedUi.cameoUnlocked, type: 'info' });
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.sharedUi.unlockFailed, type: 'error' });
    } finally {
      setBusy('idle');
    }
  };

  // Empty: not uploaded
  if (!url) {
    return (
      <div className="mb-6 p-5 bg-white/5 border border-dashed border-white/15 rounded-2xl [.cinema-page_&]:bg-[var(--cinema-surface)] [.cinema-page_&]:border [.cinema-page_&]:border-dashed [.cinema-page_&]:border-[var(--cinema-border-hi)] [.cinema-page_&]:rounded-none">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8C547]/10 flex items-center justify-center flex-shrink-0 [.cinema-page_&]:rounded-sm [.cinema-page_&]:bg-[var(--cinema-amber-glow)]">
            <UserCircle2 className="w-6 h-6 text-[#E8C547] [.cinema-page_&]:text-[var(--cinema-amber)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm [.cinema-page_&]:hidden">{t.sharedUi.cameoUnlockedTitle}</h3>
              <span className="hidden [.cinema-page_&]:inline cinema-eyebrow tracking-widest">CAMEO · {t.sharedUi.cameoUnlockedTitle}</span>
              <span className="px-1.5 py-0.5 bg-[#E8C547]/15 text-[#E8C547] text-[10px] rounded [.cinema-page_&]:hidden">Cameo</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed [.cinema-page_&]:cinema-subhead [.cinema-page_&]:opacity-80">
              {t.sharedUi.cameoEmptyHint}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                if (inputRef.current) inputRef.current.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== 'idle'}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E8C547]/10 hover:bg-[#E8C547]/20 text-[#E8C547] text-xs font-medium transition disabled:opacity-50 [.cinema-page_&]:rounded-sm [.cinema-page_&]:bg-[var(--cinema-amber)] [.cinema-page_&]:text-black [.cinema-page_&]:font-semibold [.cinema-page_&]:hover:bg-[#D6B270]"
            >
              {busy === 'upload' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span className="[.cinema-page_&]:hidden">{t.sharedUi.uploadCameo}</span>
              <span className="hidden [.cinema-page_&]:inline cinema-mono tracking-wider text-[11px]">▲ UPLOAD CAMEO</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Locked
  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-[#E8C547]/5 to-transparent border border-[#E8C547]/20 rounded-2xl [.cinema-page_&]:bg-none [.cinema-page_&]:bg-[var(--cinema-surface-2)] [.cinema-page_&]:border [.cinema-page_&]:border-[var(--cinema-amber-deep)] [.cinema-page_&]:rounded-none">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={url}
            alt={t.sharedUi.cameoLockedAlt}
            className="w-20 h-20 rounded-xl object-cover border-2 border-[#E8C547]/40 [.cinema-page_&]:rounded-sm [.cinema-page_&]:border-[var(--cinema-amber)]"
            loading="lazy"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#E8C547] flex items-center justify-center border-2 border-[var(--background)] [.cinema-page_&]:rounded-sm [.cinema-page_&]:bg-[var(--cinema-amber)] [.cinema-page_&]:border-[var(--cinema-bg)]">
            <Lock className="w-3 h-3 text-black" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#E8C547] [.cinema-page_&]:text-[var(--cinema-amber)]" />
            <h3 className="font-semibold text-sm text-[#E8C547] [.cinema-page_&]:hidden">{t.sharedUi.cameoLockedTitle}</h3>
            <span className="hidden [.cinema-page_&]:inline cinema-eyebrow tracking-widest text-[var(--cinema-amber)] opacity-90">CAMEO · {t.sharedUi.cameoLockedTitle}</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed [.cinema-page_&]:cinema-subhead [.cinema-page_&]:opacity-80">
            {t.sharedUi.cameoLockedHint}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                if (inputRef.current) inputRef.current.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== 'idle'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition disabled:opacity-50"
            >
              {busy === 'upload' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {t.sharedUi.replace}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy !== 'idle'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition disabled:opacity-50"
            >
              {busy === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {t.sharedUi.unlock}
            </button>
            <button
              type="button"
              onClick={() => url && runPreviewScore(url)}
              disabled={busy !== 'idle' || scoreLoading || !url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition disabled:opacity-50"
              title={t.sharedUi.scoreFitTitle}
            >
              {scoreLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {scoreData ? t.sharedUi.rescore : t.sharedUi.scoreFit}
            </button>
          </div>
        </div>
      </div>
      {/* v2.11 #2: score card — auto after upload; toast on a poor score */}
      {(scoreLoading || scoreError || scoreData) && (
        <CameoScoreBadge
          loading={scoreLoading}
          error={scoreError}
          data={scoreData}
        />
      )}
    </div>
  );
}

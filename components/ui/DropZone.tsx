'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  /** v12.300: upload-failure callback — parent can own the prompt (e.g. toast); omit to show an inline error */
  onError?: (error: unknown) => void;
}

/** Flatten an accept map into extension/MIME tokens for both <input accept> and on-disk validation. */
export const DEFAULT_ACCEPT: Record<string, string[]> = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi'],
};
export const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

export function acceptToTokens(accept: Record<string, string[]>): string[] {
  const out: string[] = [];
  for (const [mime, exts] of Object.entries(accept || {})) {
    if (mime) out.push(mime);
    for (const e of exts || []) if (e) out.push(e.toLowerCase());
  }
  return [...new Set(out)];
}

/**
 * v12.339: **actually enforce accept / maxSize**.
 *
 * Previously these two props lived only on the interface and in destructured defaults
 * and were **never used to validate any file** — while the UI still hard-coded
 * "images and video, max 50MB", promising a check that did not exist:
 * a 500MB file or a .exe would still be handed to the parent. Declaring a prop
 * and not enforcing it is worse than not having the prop, because callers assume
 * they are already protected.
 *
 * Returns rejected files with a reason; the caller can then name the file and why,
 * instead of a generic "upload failed".
 */
export function filterFiles(
  files: File[],
  accept: Record<string, string[]>,
  maxSize: number,
  reasonText?: { overMb: string; unsupported: string },
): { ok: File[]; rejected: Array<{ name: string; reason: string }> } {
  const overTpl = reasonText?.overMb ?? 'Over {n}MB';
  const unsupported = reasonText?.unsupported ?? 'Unsupported format';
  const tokens = acceptToTokens(accept);
  const ok: File[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  for (const f of files || []) {
    if (maxSize > 0 && f.size > maxSize) {
      rejected.push({ name: f.name, reason: overTpl.replace('{n}', (maxSize / 1048576).toFixed(0)) });
      continue;
    }
    if (tokens.length) {
      const name = (f.name || '').toLowerCase();
      const type = (f.type || '').toLowerCase();
      const hit = tokens.some((tok) =>
        tok.startsWith('.') ? name.endsWith(tok)
          : tok.endsWith('/*') ? type.startsWith(tok.slice(0, -1))
            : type === tok);
      if (!hit) { rejected.push({ name: f.name, reason: unsupported }); continue; }
    }
    ok.push(f);
  }
  return { ok, rejected };
}

/**
 * v12.339: extract "drop + on-disk validate" into a hook.
 *
 * Why not drop DropZone into every page: most upload slots here (e.g. u2v first/last
 * frame) **already look like drop zones**, they just do not support drop; DropZone
 * brings a generic grey skin that would look out of place on cinema-themed pages.
 * What should be reused is **behavior**, not appearance — so behavior lives in the hook,
 * appearance stays with each caller. DropZone itself uses this hook too; one source of truth.
 */
export function useFileDrop(opts: {
  onFiles: (files: File[]) => void | Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  onError?: (msg: string) => void;
}) {
  const { onFiles, accept = DEFAULT_ACCEPT, maxSize = DEFAULT_MAX_SIZE, onError } = opts;
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = useCallback(async (files: File[]) => {
    if (!files?.length) return;
    const { ok, rejected } = filterFiles(files, accept, maxSize, {
      overMb: t.kitUi.overSizeMb,
      unsupported: t.kitUi.unsupportedFormat,
    });
    if (rejected.length) {
      const msg = t.kitUi.dropRejected.replace('{list}', rejected.map((r) => `${r.name}(${r.reason})`).join('、')).slice(0, 160);
      setError(msg); onError?.(msg);
      if (!ok.length) return;
    } else setError(null);
    setBusy(true);
    try {
      await onFiles(ok);
    } catch (e) {
      const m = e instanceof Error ? e.message : t.product.dropRetry;
      setError(m.slice(0, 120)); onError?.(m);
    } finally { setBusy(false); }
  }, [accept, maxSize, onFiles, onError, t]);

  /** Spread onto the target element to get drop behavior; appearance is entirely the caller's. */
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); },
    onDragLeave: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault(); setIsDragging(false);
      await take(Array.from(e.dataTransfer.files));
    },
  };
  return { dropProps, isDragging, busy, error, take, setError };
}

export default function DropZone({
  onFilesAccepted,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  onError,
}: DropZoneProps) {
  const { t } = useLocale();
  // v12.339: id used to be hard-coded "file-upload" — two DropZones on one page
  // meant the second label pointed at the first input, so clicking the second
  // zone opened the first picker.
  const inputId = useId();
  const inputAccept = useMemo(() => acceptToTokens(accept).join(','), [accept]);

  // v12.339: component and hook share **one source** — two copies of drop/validate is how drift starts.
  // Keep the fork's error forwarding: wrap the hook's message in Error for the parent's onError.
  const { dropProps, isDragging, busy: uploading, error: uploadError, take } = useFileDrop({
    onFiles: onFilesAccepted, accept, maxSize, onError: (msg) => onError?.(new Error(msg)),
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await take(Array.from(e.target.files || []));
      e.target.value = '';   // allow picking the same file again (otherwise change does not fire)
    },
    [take],
  );

  return (
    <div
      {...dropProps}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id={inputId}
        accept={inputAccept || undefined}
        disabled={uploading}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          {uploading ? (
            <p className="text-blue-500">{t.product.dropUploading}</p>
          ) : uploadError ? (
            <p className="text-red-500" role="alert">{t.product.dropFailed}:{uploadError}</p>
          ) : isDragging ? (
            <p className="text-blue-500">{t.product.dropHere}</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                {t.product.dropHint}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t.product.dropHintSub}
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}

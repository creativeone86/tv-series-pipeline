'use client';

/**
 * v3.0 P0.1 — CommentThread for one (projectId, targetType, targetId).
 *
 * Behavior:
 *   - GET /api/projects/[id]/comments?targetType=&targetId= for the list
 *   - 30s poll (v3.0 P0.2 will switch to Yjs live)
 *   - input is MentionTextarea; submit POSTs a comment
 *   - each root can "Reply" → nested input
 *   - own comments can be 🗑️ deleted (soft-delete, UI shows [deleted])
 *
 * Display:
 *   - soft-deleted: content becomes "[deleted]", hide delete, still render replies
 *   - mentions: @Name highlighted cinema-amber
 */

import { useCallback, useEffect, useState } from 'react';
import { Trash as Trash2, ChatCircle as MessageCircle, PaperPlaneTilt as Send, CircleNotch as Loader2, Radio, Radio as RadioReceiver, Paperclip, X as XIcon } from '@phosphor-icons/react';
import { MentionTextarea } from './mention-textarea';
import type { CommentRowShape as CommentRow, CommentTargetType, CommentAttachmentShape } from '@/lib/comments-shared';
import { useYjs } from '@/hooks/use-yjs';
import { subscribeSSE } from '@/lib/sse-client';
import { useLocale } from '@/hooks/use-locale';

import { mergeYjsComments } from '@/lib/comment-merge';

interface FetchedComment extends CommentRow {}
interface Thread { root: FetchedComment; replies: FetchedComment[] }

export interface CommentThreadProps {
  projectId: string;
  targetType: CommentTargetType;
  targetId: string;
  /** Label above the card — e.g. "PROJECT" / "SHOT 3" */
  contextLabel?: string;
  /** Current user id, used to decide who can delete */
  currentUserId?: string | null;
  /**
   * v3.0 P0.1: auto-poll interval; 0 = no poll (child threads default 0 to save power).
   * After v3.0 P0.2 this is a fallback — the main path is Yjs live. Poll is for:
   *   1. first page load (server history)
   *   2. refresh when WS drops
   */
  pollIntervalMs?: number;
  /**
   * v3.0 P0.2: set false to skip Yjs (e.g. SSR / static preview).
   * Default true — live sync.
   */
  enableRealtime?: boolean;
}

function groupByThread(comments: FetchedComment[]): Thread[] {
  const byId = new Map<string, FetchedComment>();
  for (const c of comments) byId.set(c.id, c);
  const roots: FetchedComment[] = [];
  const repliesOf = new Map<string, FetchedComment[]>();
  for (const c of comments) {
    if (c.parentId && byId.has(c.parentId)) {
      const arr = repliesOf.get(c.parentId) || [];
      arr.push(c);
      repliesOf.set(c.parentId, arr);
    } else {
      roots.push(c);
    }
  }
  return roots.map((r) => ({ root: r, replies: repliesOf.get(r.id) || [] }));
}

function renderContent(content: string, deleted: boolean, deletedLabel = '[deleted]'): React.ReactNode {
  if (deleted) {
    return <span className="opacity-40 italic">{deletedLabel}</span>;
  }
  // Highlight @name as a cinema-amber chip
  const parts: React.ReactNode[] = [];
  const re = /(@[\u4e00-\u9fa5A-Za-z0-9_]{1,30})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push(content.slice(last, m.index));
    parts.push(
      <span key={key++} className="text-[var(--cinema-amber)] font-medium">
        {m[1]}
      </span>,
    );
    last = m.index + m[1].length;
  }
  if (last < content.length) parts.push(content.slice(last));
  return parts;
}

function formatTime(iso: string, locale: string = 'zh-CN'): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diff < 60) return rtf.format(-Math.floor(diff), 'second');
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
  if (diff < 604800) return rtf.format(-Math.floor(diff / 86400), 'day');
  return d.toLocaleDateString(locale);
}

interface ItemProps {
  comment: FetchedComment;
  currentUserId?: string | null;
  onReplyClick?: () => void;
  onDeleteClick?: () => void;
  indent?: boolean;
}

function CommentItem({ comment, currentUserId, onReplyClick, onDeleteClick, indent }: ItemProps) {
  const { t, locale } = useLocale();
  const deleted = !!comment.deletedAt;
  const canDelete = !deleted && currentUserId && comment.authorUserId === currentUserId;
  return (
    <div className={`flex gap-3 ${indent ? 'ml-8 pl-3 border-l border-white/10' : ''}`}>
      {comment.authorAvatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img loading="lazy" decoding="async" src={comment.authorAvatarUrl} alt={comment.authorName} className="w-7 h-7 rounded-full flex-shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[var(--cinema-amber)]/30 grid place-items-center cinema-mono text-[11px] flex-shrink-0">
          {comment.authorName.slice(0, 1)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="cinema-mono text-[11px] font-medium">{comment.authorName}</span>
          <span className="cinema-mono text-[10px] opacity-50">{formatTime(comment.createdAt, locale)}</span>
          {deleted && <span className="cinema-mono text-[9px] opacity-40">{t.collab.deleted}</span>}
        </div>
        <div className="cinema-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
          {renderContent(comment.content, deleted, t.collab.deleted)}
        </div>
        {/* v3.x E.1: attachments — image thumbs / video controls / file links */}
        {!deleted && Array.isArray((comment as any).attachments) && (comment as any).attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {((comment as any).attachments as Array<{ url: string; type: string; filename?: string }>).map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-[180px] rounded border border-white/10 overflow-hidden hover:border-[var(--cinema-amber)]/50"
                title={att.filename}
              >
                {att.type === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img loading="lazy" decoding="async" src={att.url} alt={att.filename || 'attachment'} className="w-full max-h-32 object-cover" />
                ) : att.type === 'video' ? (
                  <video src={att.url} className="w-full max-h-32" controls muted />
                ) : (
                  <div className="px-2 py-3 text-[10px] opacity-70 break-all">
                    📎 {att.filename || 'file'}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
        {!deleted && (
          <div className="flex items-center gap-2 mt-1">
            {onReplyClick && (
              <button
                onClick={onReplyClick}
                className="cinema-mono text-[10px] opacity-50 hover:opacity-100 hover:text-[var(--cinema-amber)] inline-flex items-center gap-1"
              >
                <MessageCircle className="w-2.5 h-2.5" />
                {t.collab.reply}
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDeleteClick}
                className="cinema-mono text-[10px] opacity-50 hover:opacity-100 hover:text-[var(--cinema-red)] inline-flex items-center gap-1"
              >
                <Trash2 className="w-2.5 h-2.5" />
                {t.common.delete}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread({
  projectId, targetType, targetId, contextLabel, currentUserId,
  pollIntervalMs = 30_000, enableRealtime = true,
}: CommentThreadProps) {
  const { t } = useLocale();
  const [comments, setComments] = useState<FetchedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  // v3.x E.1: attachment state
  const [draftAttachments, setDraftAttachments] = useState<CommentAttachmentShape[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const uploadAttachment = async (file: File) => {
    if (uploadingAttachment) return;
    if (draftAttachments.length >= 6) {
      setError(t.sharedUi.attMax6);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t.sharedUi.attOver10.replace('{name}', file.name));
      return;
    }
    setUploadingAttachment(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/comment-attachment', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok || !body?.url) {
        setError(body?.error || t.sharedUi.uploadFailedStatus.replace('{status}', String(res.status)));
        return;
      }
      setDraftAttachments((prev) => [...prev, { url: body.url, type: body.type, size: body.size, filename: body.filename }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.product.dropFailed);
    } finally {
      setUploadingAttachment(false);
    }
  };

  // v3.0 P0.2: Yjs live — one doc per project; all target comments share one Y.Array
  // Filter here by targetType+targetId to the subset this component cares about.
  const yjs = useYjs(enableRealtime ? `project-${projectId}` : null);

  const fetchComments = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ targetType, targetId, limit: '200' });
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setComments(Array.isArray(body.comments) ? body.comments : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [projectId, targetType, targetId]);

  // First load + WS reconnect: pull the authoritative server list (Yjs is live push only)
  useEffect(() => {
    fetchComments();
    // v10.2.0: without Yjs, SSE on the project comments channel replaces fixed polling; poll is a slow fallback.
    if (!enableRealtime) {
      const sub = subscribeSSE(`/api/projects/${encodeURIComponent(projectId)}/comments/stream`, {
        onEvent: (ev) => { if (ev.event === 'comment') fetchComments(); },
      });
      const fallbackMs = pollIntervalMs > 0 ? Math.max(pollIntervalMs, 90_000) : 0;
      const t = fallbackMs > 0 ? setInterval(fetchComments, fallbackMs) : null;
      return () => { sub.close(); if (t) clearInterval(t); };
    }
    // Yjs live: keep a low-frequency poll as WS-drop fallback, interval stretched to save power
    if (enableRealtime && pollIntervalMs > 0) {
      const fallbackInterval = Math.max(pollIntervalMs, 60_000) * 4; // ≥4 minutes
      const t = setInterval(fetchComments, fallbackInterval);
      return () => clearInterval(t);
    }
  }, [fetchComments, pollIntervalMs, enableRealtime, projectId]);

  // Yjs Y.Array observer — incoming comments, filter by targetId, merge into state
  useEffect(() => {
    if (!yjs) return;
    const arr = yjs.doc.getArray<{ [k: string]: unknown }>('comments');
    const onChange = () => {
      // v12.327: this used to be `arr.toArray() as unknown as FetchedComment[]`, then
      // `{ ...prev, ...yc }` let the Yjs copy **fully overwrite** the server copy. Y.Array is a CRDT,
      // so any collaborator can push any object — a payload with an existing id could
      // rewrite another author's name and body on every client. That cast hid "this is untrusted".
      // New comments must pass validation; existing ids only absorb deletedAt/updatedAt.
      const raw = arr.toArray() as unknown[];
      if (raw.length === 0) return;
      setComments((prev) => mergeYjsComments<FetchedComment>(
        prev,
        raw,
        (c) => c.targetType === targetType && c.targetId === targetId,
      ));
    };
    arr.observe(onChange);
    // Also run once to merge existing Y.Array contents
    onChange();
    return () => arr.unobserve(onChange);
  }, [yjs, targetType, targetId]);

  const post = async (content: string, parentId: string | null) => {
    const trimmed = content.trim();
    // v3.x E.1: allow attachment-only comments (no text)
    const isMainComment = parentId === null;
    const attachmentsForPost = isMainComment ? draftAttachments : [];
    if (!trimmed && attachmentsForPost.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType, targetId, content: trimmed, parentId,
          attachments: attachmentsForPost,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || t.sharedUi.sendFailedStatus.replace('{status}', String(res.status)));
        return;
      }
      if (parentId) {
        setReplyTo(null);
        setReplyDraft('');
      } else {
        setDraft('');
        setDraftAttachments([]); // v3.x E.1: clear attachments
      }
      // Optimistic refresh
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t.collab.confirmDelete)) return;
    const qs = new URLSearchParams({ commentId });
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments?${qs}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || t.sharedUi.deleteFailed);
      return;
    }
    await fetchComments();
  };

  const threads = groupByThread(comments);

  return (
    <div className="cinema-card-hi p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="cinema-eyebrow flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />
          COMMENTS{contextLabel ? ` · ${contextLabel}` : ''}
        </div>
        <div className="flex items-center gap-2">
          {/* v3.0 P0.2: WS connection chip */}
          {enableRealtime && yjs && (
            <span
              className={`cinema-mono text-[9px] inline-flex items-center gap-1 ${
                yjs.status === 'connected' ? 'text-[var(--cinema-green)]'
                : yjs.status === 'connecting' ? 'opacity-50'
                : 'text-[var(--cinema-amber)]'
              }`}
              title={
                yjs.status === 'connected' ? t.sharedUi.liveSyncOn
                : yjs.status === 'connecting' ? t.sharedUi.liveSyncConnecting
                : t.sharedUi.liveSyncOff
              }
            >
              {yjs.status === 'connected' ? <Radio className="w-2.5 h-2.5" /> : <RadioReceiver className="w-2.5 h-2.5" />}
              {yjs.status === 'connected' ? t.sharedUi.live : yjs.status === 'connecting' ? '...' : t.sharedUi.offline}
            </span>
          )}
          <span className="cinema-mono text-[10px] opacity-50">
            {t.sharedUi.commentsN.replace('{n}', String(comments.filter((c) => !c.deletedAt).length))}
          </span>
        </div>
      </div>

      {error && (
        <div className="cinema-mono text-[10px] text-[var(--cinema-red)] opacity-80">✗ {error}</div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="cinema-mono text-[11px] opacity-50 py-4 text-center inline-flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> {t.common.loading}
          </div>
        ) : threads.length === 0 ? (
          <div className="cinema-mono text-[11px] opacity-50 py-4 text-center">
            {t.collab.commentEmpty}
          </div>
        ) : (
          threads.map(({ root, replies }) => (
            <div key={root.id} className="space-y-2">
              <CommentItem
                comment={root}
                currentUserId={currentUserId}
                onReplyClick={() => {
                  setReplyTo(root.id);
                  setReplyDraft('');
                }}
                onDeleteClick={() => handleDelete(root.id)}
              />
              {replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  currentUserId={currentUserId}
                  onDeleteClick={() => handleDelete(r.id)}
                  indent
                />
              ))}
              {replyTo === root.id && (
                <div className="ml-8 pl-3 border-l border-[var(--cinema-amber)]/30 space-y-2">
                  <MentionTextarea
                    value={replyDraft}
                    onChange={setReplyDraft}
                    rows={2}
                    placeholder={t.sharedUi.replyToName.replace('{name}', root.authorName)}
                    onSubmit={() => post(replyDraft, root.id)}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => post(replyDraft, root.id)}
                      disabled={!replyDraft.trim() || submitting}
                      className="cinema-btn cinema-btn-primary !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1 disabled:opacity-40"
                    >
                      {submitting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                      {t.collab.send}
                    </button>
                    <button
                      onClick={() => { setReplyTo(null); setReplyDraft(''); }}
                      className="cinema-mono text-[10px] opacity-50 hover:opacity-100"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      <div
        className="space-y-2 pt-2 border-t border-white/5"
        onDrop={async (e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files || []);
          for (const f of files) {
            if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
              await uploadAttachment(f);
            }
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <MentionTextarea
          value={draft}
          onChange={setDraft}
          rows={3}
          placeholder={t.collab.commentPlaceholder}
          onSubmit={() => post(draft, null)}
        />
        {/* v3.x E.1: attachment preview */}
        {draftAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draftAttachments.map((att, i) => (
              <div
                key={i}
                className="relative max-w-[120px] rounded border border-white/10 overflow-hidden group/att"
              >
                {att.type === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img loading="lazy" decoding="async" src={att.url} alt={att.filename} className="w-full max-h-20 object-cover" />
                ) : att.type === 'video' ? (
                  <video src={att.url} className="w-full max-h-20" muted />
                ) : (
                  <div className="px-2 py-3 text-[10px]">📎 {att.filename}</div>
                )}
                <button
                  onClick={() => setDraftAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white/80 opacity-0 group-hover/att:opacity-100 transition-opacity"
                  title={t.sharedUi.removeAttachment}
                >
                  <XIcon className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label
              className={`cinema-mono text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--cinema-border)] cursor-pointer hover:border-[var(--cinema-amber)] transition-colors ${
                uploadingAttachment || draftAttachments.length >= 6 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={draftAttachments.length >= 6 ? t.sharedUi.attCap6 : t.sharedUi.uploadMediaHint}
            >
              {uploadingAttachment ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Paperclip className="w-3 h-3" />
              )}
              {t.sharedUi.attachment}
              <input
                type="file"
                accept="image/*,video/*"
                disabled={uploadingAttachment || draftAttachments.length >= 6}
                multiple={false}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await uploadAttachment(f);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            <span className="cinema-mono text-[9px] opacity-40">{draft.length}/2000</span>
          </div>
          <button
            onClick={() => post(draft, null)}
            disabled={(!draft.trim() && draftAttachments.length === 0) || submitting}
            className="cinema-btn cinema-btn-primary !px-3 !py-1 !text-[11px] inline-flex items-center gap-1 disabled:opacity-40"
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {t.sharedUi.sendComment}
          </button>
        </div>
      </div>
    </div>
  );
}

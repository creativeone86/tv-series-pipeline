'use client';

/**
 * v3.x — InviteProjectButton: invite button + popover on the project nav bar.
 *
 * Behavior:
 *   - Owner: sees "Invite collaborators", opens popover, picks a role, generates a copyable link
 *   - Shows current collaborator list + remove
 *   - Non-owner: hidden
 */

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Copy, Check, Trash as Trash2, CircleNotch as Loader2, X as XIcon } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocale } from '@/hooks/use-locale';

type ProjectRole = 'viewer' | 'commenter' | 'editor';

interface InviteToken {
  token: string;
  url: string;
  role: ProjectRole;
  expiresAt: string | null;
  viewCount: number;
  acceptCount: number;
  createdAt: string;
}

interface CollaboratorEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  role: ProjectRole;
  joinedAt: string;
}

interface InviteData {
  tokens: InviteToken[];
  collaborators: CollaboratorEntry[];
}

export interface InviteProjectButtonProps {
  projectId: string;
  isOwner: boolean;
}

function roleLabel(role: ProjectRole, pt: Record<string, string>): string {
  if (role === 'viewer') return pt.roleViewer;
  if (role === 'commenter') return pt.roleCommenter;
  return pt.roleEditor;
}

export function InviteProjectButton({ projectId, isOwner }: InviteProjectButtonProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ProjectRole>('viewer');
  const [expiresInDays, setExpiresInDays] = useState<string>('7'); // '0' = forever
  const [busy, setBusy] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/invite`);
      if (res.ok) setData(await res.json());
      else setError(pt.loadFailed.replace('{status}', String(res.status)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [projectId, isOwner, pt.loadFailed]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!isOwner) return null;

  const createInvite = async () => {
    setBusy(true);
    setError(null);
    try {
      const days = expiresInDays === '0' ? null : parseInt(expiresInDays, 10);
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expiresInDays: days }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || pt.createFailed.replace('{status}', String(res.status)));
        return;
      }
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(body.url);
        setCopiedToken(body.token);
        setTimeout(() => setCopiedToken(null), 3000);
      } catch { /* ignore */ }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : pt.failed);
    } finally {
      setBusy(false);
    }
  };

  const revokeToken = async (token: string) => {
    if (!confirm(pt.revokeConfirm)) return;
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/invite?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      );
      if (res.ok) await refresh();
    } catch { /* ignore */ }
  };

  const removeCollab = async (userId: string, userName: string) => {
    if (!confirm(pt.removeConfirm.replace('{name}', userName))) return;
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/invite?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      );
      if (res.ok) await refresh();
    } catch { /* ignore */ }
  };

  const updateCollabRole = async (userId: string, newRole: ProjectRole) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/invite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) await refresh();
    } catch { /* ignore */ }
  };

  const copyUrl = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch { /* ignore */ }
  };

  return (
    <Popover>
      <PopoverTrigger
        className="cinema-btn-ghost cinema-btn !p-2 inline-flex items-center gap-1.5"
        title={pt.inviteTitle}
      >
        <UserPlus className="w-4 h-4" />
        {data && data.collaborators.length > 0 && (
          <span className="cinema-mono text-[10px] opacity-70">{data.collaborators.length}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar">
        <div className="cinema-eyebrow flex items-center gap-1.5">
          <UserPlus className="w-3 h-3" />
          PROJECT COLLABORATORS
        </div>

        {/* Current collaborators */}
        {data && data.collaborators.length > 0 && (
          <div className="space-y-1">
            <div className="cinema-mono text-[10px] opacity-60">{pt.joined.replace('{n}', String(data.collaborators.length))}</div>
            {data.collaborators.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5">
                {c.userAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img loading="lazy" decoding="async" src={c.userAvatarUrl} alt={c.userName} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--cinema-amber)]/30 grid place-items-center cinema-mono text-[10px]">
                    {c.userName.slice(0, 1)}
                  </div>
                )}
                <span className="cinema-mono text-[11px] flex-1 truncate">{c.userName}</span>
                <select
                  value={c.role}
                  onChange={(e) => updateCollabRole(c.userId, e.target.value as ProjectRole)}
                  className="cinema-mono text-[10px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded px-1 py-0.5"
                >
                  <option value="viewer">{pt.roleViewer}</option>
                  <option value="commenter">{pt.roleCommenter}</option>
                  <option value="editor">{pt.roleEditor}</option>
                </select>
                <button
                  onClick={() => removeCollab(c.userId, c.userName)}
                  className="opacity-60 hover:opacity-100 hover:text-[var(--cinema-red)]"
                  title={pt.remove}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create a new invite */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="cinema-mono text-[10px] opacity-60">{pt.newLink}</div>
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="cinema-mono text-[10px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded px-1.5 py-1 flex-1"
            >
              <option value="viewer">{pt.roleViewerOpt}</option>
              <option value="commenter">{pt.roleCommenterOpt}</option>
              <option value="editor">{pt.roleEditorOpt}</option>
            </select>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="cinema-mono text-[10px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded px-1.5 py-1"
            >
              <option value="1">{pt.expiry1d}</option>
              <option value="7">{pt.expiry7d}</option>
              <option value="30">{pt.expiry30d}</option>
              <option value="0">{pt.expiryForever}</option>
            </select>
          </div>
          <button
            onClick={createInvite}
            disabled={busy}
            className="cinema-btn cinema-btn-primary w-full !text-[11px] inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
            {pt.generateCopy}
          </button>
        </div>

        {/* Generated token list */}
        {data && data.tokens.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="cinema-mono text-[10px] opacity-60">{pt.sentLinks.replace('{n}', String(data.tokens.length))}</div>
            {data.tokens.slice(0, 8).map((tok) => {
              const isCopied = copiedToken === tok.token;
              return (
                <div key={tok.token} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5">
                  <span className="cinema-mono text-[10px] opacity-50 flex-shrink-0">{roleLabel(tok.role, pt)}</span>
                  <span className="cinema-mono text-[10px] opacity-70 flex-1 truncate">
                    /{tok.token.slice(0, 12)}...
                  </span>
                  <span className="cinema-mono text-[9px] opacity-50" title={pt.visitStats.replace('{views}', String(tok.viewCount)).replace('{accepts}', String(tok.acceptCount))}>
                    👁{tok.viewCount} ✓{tok.acceptCount}
                  </span>
                  <button
                    onClick={() => copyUrl(tok.url, tok.token)}
                    className="opacity-60 hover:opacity-100"
                    title={pt.copyLink}
                  >
                    {isCopied ? <Check className="w-3 h-3 text-[var(--cinema-green)]" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => revokeToken(tok.token)}
                    className="opacity-60 hover:opacity-100 hover:text-[var(--cinema-red)]"
                    title={pt.revokeLink}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="cinema-mono text-[10px] text-[var(--cinema-red)] pt-1">✗ {error}</div>
        )}
        {loading && (
          <div className="cinema-mono text-[10px] opacity-50 inline-flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            {t.common.loading}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

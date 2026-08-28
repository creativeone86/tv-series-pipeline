'use client';

/**
 * /project-invite/[token] · v3.x — project-invite landing page.
 *
 * Behavior:
 *   - GET invite details (public, no login) → project card + role + owner
 *   - Signed out: "Sign in to accept" + jump to login
 *   - Signed in: "Accept invite" → POST writes collaborators → project page
 *   - Error states: expired / owner self / already a collaborator upgrade hint
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Warning as AlertTriangle, CheckCircle as CheckCircle2, CircleNotch as Loader2, Users, Crown } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

type ProjectRole = 'viewer' | 'commenter' | 'editor';

interface InviteData {
  project: { id: string; title: string; description: string; coverUrl: string | null };
  role: ProjectRole;
  expiresAt: string | null;
  owner: { name: string; avatarUrl: string | null } | null;
}

export default function ProjectInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [authNeeded, setAuthNeeded] = useState(false);

  const roleCfg = (role: ProjectRole) => {
    if (role === 'viewer') return { text: ui.roleViewer, desc: ui.roleViewerDesc };
    if (role === 'commenter') return { text: ui.roleCommenter, desc: ui.roleCommenterDesc };
    return { text: ui.roleEditor, desc: ui.roleEditorDesc };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/project-invite/${encodeURIComponent(token)}`);
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || ui.invalidInvite);
          return;
        }
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : ui.loadFailed);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, ui.invalidInvite, ui.loadFailed]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/project-invite/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (res.status === 401) {
        setAuthNeeded(true);
        return;
      }
      if (!res.ok) {
        setError(body?.error || ui.acceptFailed);
        return;
      }
      // Jump to the project page
      router.push(`/projects/${encodeURIComponent(body.projectId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.acceptFailed);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="cinema-page min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--cinema-amber)]" />
          <p className="cinema-mono text-[11px] opacity-70">{ui.loadingInvite}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cinema-page min-h-screen flex items-center justify-center text-white px-4">
        <div className="cinema-card-hi p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-[var(--cinema-amber)] mx-auto mb-3" />
          <h1 className="cinema-headline text-lg mb-2">{ui.inviteInvalidTitle}</h1>
          <p className="cinema-mono text-[11px] opacity-70 mb-4">
            {error || ui.inviteExpiredHint}
          </p>
          <Link href="/dashboard/projects" className="cinema-btn cinema-btn-primary !text-[12px]">
            {ui.backToProjects}
          </Link>
        </div>
      </div>
    );
  }

  const role = roleCfg(data.role);
  const expiresAt = data.expiresAt
    ? ui.expiresOn.replace('{n}', new Date(data.expiresAt).toLocaleDateString())
    : ui.neverExpires;

  return (
    <div className="cinema-page min-h-screen text-white">
      <nav className="sticky top-0 z-30 bg-[var(--cinema-surface)]/85 backdrop-blur-xl border-b border-[var(--cinema-border)]">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard/projects" className="cinema-btn-ghost cinema-btn !p-2 inline-flex items-center gap-1 !text-[11px]">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.nav.projects}
          </Link>
          <span className="cinema-eyebrow">PROJECT INVITE</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-5">
        {/* Project preview card */}
        <div className="cinema-card-hi p-5 space-y-4">
          {data.project.coverUrl && /^https?:|^\/api\//i.test(data.project.coverUrl) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img loading="lazy" decoding="async" 
              src={data.project.coverUrl}
              alt={data.project.title}
              className="w-full aspect-video object-cover rounded border border-[var(--cinema-border)]" />
          ) : (
            <div className="w-full aspect-video bg-black/40 rounded border border-[var(--cinema-border)] grid place-items-center">
              <Users className="w-12 h-12 opacity-30" />
            </div>
          )}
          <div>
            <div className="cinema-eyebrow mb-1">PROJECT</div>
            <h1 className="cinema-headline text-2xl">{data.project.title}</h1>
            {data.project.description && (
              <p className="cinema-subhead text-[13px] opacity-85 mt-2 leading-relaxed">
                {data.project.description}
              </p>
            )}
          </div>
          {data.owner && (
            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              <Crown className="w-3.5 h-3.5 text-[var(--cinema-amber)]" />
              {data.owner.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img loading="lazy" decoding="async" src={data.owner.avatarUrl} alt={data.owner.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--cinema-amber)]/30 grid place-items-center cinema-mono text-[10px]">
                  {data.owner.name.slice(0, 1)}
                </div>
              )}
              <span className="cinema-mono text-[11px]">
                <span className="opacity-60">{ui.invitedByPrefix}</span> {data.owner.name} <span className="opacity-60">{ui.invitedBySuffix}</span>
              </span>
            </div>
          )}
        </div>

        {/* Role + accept */}
        <div className="cinema-card-hi p-5 space-y-4">
          <div>
            <div className="cinema-eyebrow mb-1">YOUR ROLE</div>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="cinema-headline text-base text-[var(--cinema-amber)]">{role.text}</h2>
              <span className="cinema-mono text-[10px] opacity-50">· {expiresAt}</span>
            </div>
            <p className="cinema-subhead text-[12px] opacity-85 mt-1">{role.desc}</p>
          </div>

          {authNeeded ? (
            <div className="space-y-2">
              <div className="cinema-mono text-[11px] opacity-75">
                {ui.loginToAcceptHint}
              </div>
              <Link
                href={`/auth?next=${encodeURIComponent(`/project-invite/${token}`)}`}
                className="cinema-btn cinema-btn-primary w-full !text-[12px] inline-flex items-center justify-center gap-1.5"
              >
                {ui.loginToAcceptCta}
              </Link>
            </div>
          ) : (
            <button
              onClick={accept}
              disabled={accepting}
              className="cinema-btn cinema-btn-primary w-full !text-[12px] inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {accepting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {accepting ? ui.accepting : ui.acceptJoin}
            </button>
          )}

          {error && (
            <div className="cinema-mono text-[10px] text-[var(--cinema-red)]">✗ {error}</div>
          )}
        </div>
      </main>
    </div>
  );
}

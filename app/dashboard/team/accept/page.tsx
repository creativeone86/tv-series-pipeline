'use client';

/**
 * v6.5.1 — Accept team invite. Invitee (existing account, signed in) opens the link → accept → joins the team.
 * token from ?token=; real check / persist is POST /api/team/invite/accept. Does not create an account.
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UsersThree as UsersRound, CircleNotch as Loader2, CheckCircle as CheckCircle2, Warning as AlertTriangle, SignIn as LogIn } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

function AcceptInner() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    if (!token) { setError(t.dashMore.missingToken); return; }
    setBusy(true); setError(''); setNeedLogin(false);
    try {
      const res = await fetch('/api/team/invite/accept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401) { setNeedLogin(true); return; }
      if (!res.ok) throw new Error(d.message || t.dashMore.acceptFailed);
      setResult(d);
    } catch (e: any) { setError(e?.message || t.dashMore.acceptFailed); }
    finally { setBusy(false); }
  };

  const roleLabel = result?.member?.role === 'admin' ? t.dashMore.admin : t.dashMore.member;

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 grid place-items-center mx-auto mb-3">
          <UsersRound className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{t.dashMore.acceptTitle}</h2>
        <p className="text-sm text-[var(--muted)] mt-1.5">{t.dashMore.acceptDesc}</p>

        {result ? (
          <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-sm text-emerald-300">{t.dashMore.joinedTeam}</p>
            <p className="text-[12px] text-[var(--muted)] mt-1">{t.dashMore.joinedMeta.replace('{n}', String(result.allocated)).replace('{role}', roleLabel)}</p>
            <Link href="/dashboard/team" className="inline-block mt-3 text-[12px] text-amber-300 hover:underline">{t.dashMore.goTeam}</Link>
          </div>
        ) : needLogin ? (
          <div className="mt-5 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
            <LogIn className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
            <p className="text-sm text-amber-300">{t.dashMore.loginFirst}</p>
            <p className="text-[12px] text-[var(--muted)] mt-1">{t.dashMore.loginFirstHint}</p>
            <Link href={`/auth?next=${encodeURIComponent(`/dashboard/team/accept?token=${token}`)}`} className="inline-block mt-3 px-4 py-1.5 rounded-lg text-[12px] bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30">{t.auth.loginNow}</Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="mt-4 text-[12px] text-rose-300 flex items-center justify-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>
            )}
            <button
              onClick={accept} disabled={busy || !token}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{t.dashMore.acceptInvite}
            </button>
            {!token && <p className="mt-2 text-[11px] text-rose-300/80">{t.dashMore.missingCredential}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-[var(--muted)]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
      <AcceptInner />
    </Suspense>
  );
}

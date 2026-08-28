'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/ui/toast-provider';
import { IMG_AUTH_BG1, IMG_AUTH_BG2 } from '@/lib/placeholder-images';
import { useLocale } from '@/hooks/use-locale';

/** Seconds → "X min Y sec" / "Y sec" — "540 sec" is hard to parse at a glance. */
function fmtWait(sec: number, ui: Record<string, string>): string {
  if (sec < 60) return ui.waitSec.replace('{n}', String(sec));
  const m = Math.floor(sec / 60); const r = sec % 60;
  return r
    ? ui.waitMinSec.replace('{m}', String(m)).replace('{s}', String(r))
    : ui.waitMin.replace('{n}', String(m));
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@qfmanju.ai');
  const [password, setPassword] = useState(''); // v12.171: do not prefill a demo password (repo stays secret-free)
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;
  // v12.341: rate-limit cooldown. Previously 429 and 401 both showed "action failed" —
  // users thought the password was wrong and retried in vain (the lockout window is fixed;
  // retries neither extend nor shorten it).
  const [cooldownSec, setCooldownSec] = useState(0);
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const id = setInterval(() => setCooldownSec((n) => (n > 1 ? n - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownSec > 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      showToast({ title: mode === 'login' ? t.auth.loginSuccess : t.auth.registerSuccess, type: 'success' });
      router.push('/dashboard');
    } catch (err: any) {
      // The server already computed "seconds remaining" — do not drop it. Tell the user
      // the wait, instead of a generic "sign-in failed" that looks like a wrong password.
      if (err?.status === 429) {
        const sec = Number(err?.retryAfterSec) || 0;
        setCooldownSec(sec);
        setError(sec
          ? ui.loginRateLimited.replace('{n}', fmtWait(sec, ui))
          : ui.loginRateLimitedSoon);
      } else if (err?.status === 401) {
        setError(ui.badCredentials);
      } else {
        setError(err.message || t.auth.actionFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader variant="compact" />
      <main id="main-content" tabIndex={-1} className="grid grid-cols-1 md:grid-cols-2 gap-10 px-[5vw] py-20 items-center outline-none">
        {/* Login Card */}
        <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-[var(--border)] rounded-[26px] p-9 shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8C547] to-[#D4A830] grid place-items-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <span className="text-lg font-bold brand-gradient">{t.auth.brand}</span>
              <div className="text-[10px] text-[var(--soft)] tracking-widest uppercase">AI Studio</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {mode === 'login' ? t.auth.welcomeBack : t.auth.createAccount}
          </h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            {mode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <label className="flex flex-col gap-2 text-sm">
                {t.auth.username}
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:border-[#E8C547]/40 focus:outline-none focus:ring-1 focus:ring-[#E8C547]/20 transition-all placeholder:text-[var(--soft)]"
                  placeholder={t.auth.usernamePlaceholder}
                />
              </label>
            )}
            <label className="flex flex-col gap-2 text-sm">
              {t.auth.email}
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:border-[#E8C547]/40 focus:outline-none focus:ring-1 focus:ring-[#E8C547]/20 transition-all placeholder:text-[var(--soft)]"
                placeholder={t.auth.emailPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {t.auth.password}
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:border-[#E8C547]/40 focus:outline-none focus:ring-1 focus:ring-[#E8C547]/20 transition-all placeholder:text-[var(--soft)]"
                placeholder={t.auth.passwordPlaceholder}
              />
            </label>

            {mode === 'login' && (
              <div className="flex justify-between items-center text-xs text-[var(--soft)]">
                <span>{t.auth.demoHint}</span>
              </div>
            )}

            {cooldownSec > 0 && (
              <div id="login-cooldown" role="status" className="text-[11px] text-[var(--soft)] -mt-1">
                {ui.cooldownHint}
              </div>
            )}

            {error && (
              <div role="alert" className="bg-[rgba(255,88,88,0.12)] border border-[rgba(255,88,88,0.4)] px-3 py-2.5 rounded-xl text-sm">{error}</div>
            )}

            {/* v12.341: disable submit during cooldown and count down live.
                Only the button is disabled — inputs stay editable so the user can
                fix the password while waiting. */}
            <button
              type="submit"
              disabled={loading || cooldownSec > 0}
              aria-describedby={cooldownSec > 0 ? 'login-cooldown' : undefined}
              className="btn-primary py-3 rounded-xl text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldownSec > 0
                ? ui.retryAfter.replace('{n}', fmtWait(cooldownSec, ui))
                : loading ? '...' : mode === 'login' ? t.auth.login : t.auth.register}
            </button>
          </form>

          <p className="text-sm text-[var(--soft)] text-center mt-6">
            {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="ml-1 text-[var(--primary)] hover:underline">
              {mode === 'login' ? t.auth.registerNow : t.auth.loginNow}
            </button>
          </p>
        </div>

        {/* Visual */}
        <div className="relative min-h-[400px] hidden md:block">
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(232,197,71,0.4),transparent_70%)] top-[20%] left-[10%] blur-[10px]" />
          <img loading="lazy" decoding="async" src={IMG_AUTH_BG1} alt="" className="absolute w-[260px] rounded-[20px] shadow-[var(--shadow)] top-0 right-10" />
          <img loading="lazy" decoding="async" src={IMG_AUTH_BG2} alt="" className="absolute w-[260px] rounded-[20px] shadow-[var(--shadow)] bottom-0 left-5" />
        </div>
      </main>
    </div>
  );
}

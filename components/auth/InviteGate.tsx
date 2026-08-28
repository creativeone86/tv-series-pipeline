'use client';

/**
 * InviteGate (v2.0 Sprint 0 D6)
 *
 * Beta invite-code gate UI — used on register / home.
 *
 * Two subcomponents:
 *  1. <InviteCodeField>  invite-code input + live validation on the register form
 *  2. <WaitlistForm>     "request beta" form for users without a code (email + use case)
 *
 * Front-end live-validates via `/api/invite-codes/validate`; register then
 * atomically consumes the code with `consumeInviteCode`.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';

// ──────────────────────────────────────────────────────────
// InviteCodeField
// ──────────────────────────────────────────────────────────

type ValidationState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok'; source?: string }
  | { status: 'error'; message: string };

export interface InviteCodeFieldProps {
  value: string;
  onChange: (code: string) => void;
  /** Called on successful validation (parent can enable the register button) */
  onValid?: (code: string) => void;
  /** Called on failed validation */
  onInvalid?: (error: string) => void;
  className?: string;
}

export function InviteCodeField({
  value,
  onChange,
  onValid,
  onInvalid,
  className,
}: InviteCodeFieldProps) {
  const { t } = useLocale();
  const [state, setState] = React.useState<ValidationState>({ status: 'idle' });
  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: t.auth.inviteNotFound,
    ALREADY_USED: t.auth.inviteUsed,
    EXPIRED: t.auth.inviteExpired,
    REVOKED: t.auth.inviteRevoked,
    INVALID: t.auth.inviteInvalid,
  };

  // debounced validate
  React.useEffect(() => {
    if (!value || value.trim().length < 4) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: 'checking' });
      fetch('/api/invite-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value.trim() }),
        signal: controller.signal,
      })
        .then(async res => {
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            source?: string;
          };
          if (data.ok) {
            setState({ status: 'ok', source: data.source });
            onValid?.(value.trim());
          } else {
            const msg = ERROR_MESSAGES[data.error ?? 'INVALID'] ?? t.auth.inviteGenericInvalid;
            setState({ status: 'error', message: msg });
            onInvalid?.(data.error ?? 'INVALID');
          }
        })
        .catch(err => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setState({ status: 'error', message: t.auth.inviteValidateFailed });
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, onValid, onInvalid]);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor="invite-code" className="text-sm font-medium text-white">
        {t.auth.inviteCode}
        <span className="ml-1 text-xs text-neutral-400">{t.auth.inviteRequired}</span>
      </label>
      <div className="relative">
        <input
          id="invite-code"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="BETAXXXXXX"
          className={cn(
            'w-full rounded-lg border bg-black/20 px-3 py-2 pr-10 font-mono text-sm text-white placeholder:text-neutral-500 focus:outline-none',
            state.status === 'ok' && 'border-green-500/60 focus:border-green-500',
            state.status === 'error' && 'border-red-500/60 focus:border-red-500',
            (state.status === 'idle' || state.status === 'checking') &&
              'border-white/10 focus:border-[#E8C547]/60',
          )}
          data-testid="invite-code-input"
          aria-invalid={state.status === 'error'}
          aria-describedby="invite-code-feedback"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {state.status === 'checking' && (
            <span className="text-xs text-neutral-400">{t.auth.inviteChecking}</span>
          )}
          {state.status === 'ok' && (
            <span className="text-green-400" aria-label="valid">
              ✓
            </span>
          )}
          {state.status === 'error' && (
            <span className="text-red-400" aria-label="invalid">
              ✗
            </span>
          )}
        </div>
      </div>
      <div
        id="invite-code-feedback"
        className="min-h-[1rem] text-xs"
        data-testid="invite-code-feedback"
      >
        {state.status === 'ok' && (
          <span className="text-green-400">✓ {t.auth.inviteValid} {state.source ? `· ${state.source}` : ''}</span>
        )}
        {state.status === 'error' && <span className="text-red-400">{state.message}</span>}
        {state.status === 'idle' && !value && (
          <span className="text-neutral-500">
            {t.auth.noInvite}
            <a href="#waitlist" className="ml-1 text-[#E8C547] underline">
              {t.auth.applyBeta}
            </a>
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// WaitlistForm
// ──────────────────────────────────────────────────────────

type WaitlistState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export interface WaitlistFormProps {
  source?: string;
  className?: string;
}

export function WaitlistForm({ source, className }: WaitlistFormProps) {
  const { t } = useLocale();
  const [email, setEmail] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [state, setState] = React.useState<WaitlistState>({ status: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === 'submitting') return;

    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose, source }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (res.ok) {
        setState({
          status: 'success',
          message: data.message ?? t.auth.waitlistDefaultOk,
        });
        setEmail('');
        setPurpose('');
      } else {
        setState({
          status: 'error',
          message: data.error ?? t.auth.waitlistSubmitFailed,
        });
      }
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : t.auth.waitlistNetworkError,
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5',
        className,
      )}
      data-testid="waitlist-form"
    >
      <div>
        <h3 className="text-base font-semibold text-white">{t.auth.waitlistTitle}</h3>
        <p className="mt-1 text-xs text-neutral-400">
          {t.auth.waitlistDesc}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="waitlist-email" className="text-xs text-neutral-300">
          {t.auth.email}
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none"
          data-testid="waitlist-email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="waitlist-purpose" className="text-xs text-neutral-300">
          {t.auth.waitlistPurpose}
        </label>
        <textarea
          id="waitlist-purpose"
          rows={3}
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          placeholder={t.auth.waitlistPurposePlaceholder}
          className="resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none"
          data-testid="waitlist-purpose"
        />
      </div>

      <button
        type="submit"
        disabled={state.status === 'submitting' || !email}
        className={cn(
          'rounded-lg bg-gradient-to-r from-[#E8C547] to-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition-opacity',
          'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90',
        )}
        data-testid="waitlist-submit"
      >
        {state.status === 'submitting' ? t.auth.waitlistSubmitting : t.auth.waitlistSubmit}
      </button>

      {state.status === 'success' && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-300">
          ✓ {state.message}
        </div>
      )}
      {state.status === 'error' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          ✗ {state.message}
        </div>
      )}
    </form>
  );
}

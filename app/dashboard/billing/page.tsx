'use client';

/**
 * /dashboard/billing · Sprint C.2 — subscription management
 *
 * 4 cards: Free / Creator / Pro / Enterprise. Current tier is highlighted.
 * "Upgrade to X" → POST /api/stripe/checkout → redirect to Stripe Checkout.
 * Stripe returns with ?status=success or ?status=canceled; we toast that.
 *
 * No in-app downgrade / cancel — that is Stripe Customer Portal (Stripe's own page).
 * MVP treats the portal link as a placeholder until STRIPE_PORTAL_LINK is set.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircleNotch as Loader2, Check, Star, ArrowSquareOut as ExternalLink } from '@phosphor-icons/react';
import { useAuth } from '@/components/auth-provider';
import { PRICING_TIERS } from '@/lib/pricing';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

export default function BillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t: tRaw, locale } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const params = useSearchParams();
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [busy, setBusy] = useState<string | null>(null);

  // Read subscription_tier from /api/auth/me (already returned; see comment below)
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.subscriptionTier) setCurrentTier(data.subscriptionTier);
        }
      } catch { /* silent — default free */ }
    };
    fetchPlan();
  }, [user]);

  // Show status when Stripe redirects back
  useEffect(() => {
    const status = params.get('status');
    if (status === 'success') {
      const tier = params.get('tier');
      showToast({ title: `🎉 ${t.billing.upgradedPrefix} ${tier || ''}${t.billing.upgradedSuffix}`, type: 'success' });
    } else if (status === 'canceled') {
      showToast({ title: t.billing.paymentCanceled, type: 'info' });
    }
  }, [params, showToast]);

  const startCheckout = async (tier: string) => {
    if (tier === 'free') return;
    setBusy(tier);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: data.error || t.billing.checkoutFailed, type: 'error' });
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.billing.checkoutFailed, type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t.billing.title}</h1>
        <p className="text-sm text-[var(--soft)] mt-1">
          {t.billing.currentTier}<span className="text-[#E8C547] font-semibold">{tierLabel(currentTier, locale, t.dashMore.freeTier)}</span>
          <span className="text-white/30 mx-2">·</span>
          {t.billing.paymentNote}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_TIERS.map(tier => {
          const isCurrent = tier.id === currentTier;
          const isFree = tier.id === 'free';
          const isCustom = tier.price === -1;
          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border p-5 flex flex-col ${
                isCurrent
                  ? 'border-[#E8C547] bg-[#E8C547]/5'
                  : tier.recommended
                    ? 'border-[#E8C547]/40 bg-white/[0.03]'
                    : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {tier.recommended && !isCurrent && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#E8C547] text-black text-[10px] font-bold flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {t.billing.recommended}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-emerald-500 text-emerald-950 text-[10px] font-bold">
                  {t.billing.currentBadge}
                </div>
              )}
              <div className="mb-3">
                <div className="text-xs text-[var(--soft)] uppercase tracking-wider">{tier.nameEn}</div>
                <div className="text-xl font-bold mt-0.5" style={{ color: tier.color }}>
                  {locale === 'en' ? (tier.nameEn || tier.name) : tier.name}
                </div>
              </div>
              <div className="mb-4">
                {isCustom ? (
                  <div className="text-2xl font-bold">{t.billing.contactUs}</div>
                ) : (
                  <>
                    <span className="text-3xl font-bold tabular-nums">¥{tier.price}</span>
                    <span className="text-sm text-[var(--soft)] ml-1">{t.billing.perMonth}</span>
                  </>
                )}
              </div>
              <ul className="text-xs text-white/70 space-y-1.5 mb-5 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(tier.id)}
                disabled={isCurrent || isFree || busy !== null}
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isCurrent
                    ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                    : isFree
                      ? 'bg-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-[#E8C547] hover:bg-[#E8C547]/90 text-black'
                }`}
              >
                {isCurrent ? (
                  <>✓ {t.billing.alreadyThis}</>
                ) : isFree ? (
                  <>{t.billing.freeNoPurchase}</>
                ) : busy === tier.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isCustom ? (
                  <>{t.billing.businessTalk}</>
                ) : (
                  <>{t.billing.upgradeTo} {locale === 'en' ? (tier.nameEn || tier.name) : tier.name}</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
        <h2 className="text-sm font-semibold mb-2">{t.billing.title}</h2>
        <p className="text-xs text-[var(--soft)] leading-relaxed">
          {t.billing.portalNote}
        </p>
        {process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK && (
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs"
          >
            <ExternalLink className="w-3 h-3" />
            {t.billing.openPortal}
          </a>
        )}
      </div>
    </div>
  );
}

function tierLabel(id: string, locale: string, fallback: string): string {
  const tier = PRICING_TIERS.find(x => x.id === id);
  if (!tier) return fallback;
  return locale === 'en' ? (tier.nameEn || tier.name) : tier.name;
}

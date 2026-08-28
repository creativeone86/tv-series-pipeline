'use client';

/**
 * components/dashboard/api-quota-banner (v2.17 P0.3)
 *
 * Top yellow/red banner — when any external API is out of quota / saturated / auth-failed,
 * show a hint before the user hits "Start creating" (e.g. Minimax video is down, fallback to Veo).
 *
 * Source: GET /api/api-status (public, 1h active-alert window)
 * Poll: 60s — fresh enough without being noisy
 *
 * Behavior:
 *   - no active alerts → render nothing
 *   - alerts → banner listing each provider's short status
 *   - user clicks X → hide for this session (sessionStorage)
 */

import { useEffect, useState, useCallback } from 'react';
import { Warning as AlertTriangle, X, Lightning as Zap, WifiHigh as Wifi, Clock, Lock } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface AlertItem {
  provider: string;
  alertType: 'exhausted' | 'saturated' | 'rate_limited' | 'auth_failed' | 'model_unavailable';
  lastSeenAt: string;
  count: number;
}

const DISMISS_KEY = 'apiQuotaBanner.dismissed';

export function ApiQuotaBanner() {
  const { t } = useLocale();
  const PROVIDER_LABEL: Record<string, string> = {
    minimax: 'Minimax (video/image/TTS/music)',
    midjourney: 'Midjourney (cast/scene/board)',
    openai: 'Claude/OpenAI (script)',
    veo: 'Veo (video fallback)',
    kling: t.dashBanner.kling,
    vidu: 'Vidu (long video)',
    fal: 'Fal/Flux (image fallback)',
    comfyui: 'ComfyUI (image fallback)',
    qingyuntop: t.dashBanner.qingyuntop,
  };
  const ALERT_LABEL: Record<AlertItem['alertType'], { text: string; icon: any; tone: 'red' | 'amber' }> = {
    exhausted: { text: t.dashBanner.exhausted, icon: Zap, tone: 'red' },
    saturated: { text: t.dashBanner.saturated, icon: Wifi, tone: 'amber' },
    rate_limited: { text: t.dashBanner.rateLimited, icon: Clock, tone: 'amber' },
    auth_failed: { text: t.dashBanner.authFailed, icon: Lock, tone: 'red' },
    model_unavailable: { text: t.dashBanner.modelUnavailable, icon: Lock, tone: 'amber' },
  };
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Session-level dismiss
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/api-status', { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (Array.isArray(body?.alerts)) {
        setAlerts(body.alerts);
      }
    } catch {
      /* Silent — banner failure must not break the home page */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 60_000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISS_KEY, '1');
    }
  };

  if (dismissed || alerts.length === 0) return null;

  // Pick the most severe tone
  const hasRed = alerts.some((a) => ALERT_LABEL[a.alertType]?.tone === 'red');
  const bg = hasRed
    ? 'bg-rose-500/15 border-rose-500/40 text-rose-100'
    : 'bg-amber-500/15 border-amber-500/40 text-amber-100';

  return (
    <div className={`mx-4 my-2 rounded-lg border ${bg} px-4 py-2.5 flex items-start gap-3`}>
      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${hasRed ? 'text-rose-300' : 'text-amber-300'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold tracking-wide opacity-80 uppercase">
          {t.dashBanner.title} · {alerts.length} {t.dashBanner.itemsUnit}
        </div>
        <ul className="mt-1 space-y-0.5">
          {alerts.map((a) => {
            const label = ALERT_LABEL[a.alertType];
            const Icon = label?.icon || AlertTriangle;
            return (
              <li key={a.provider} className="text-[12px] flex items-center gap-1.5">
                <Icon className="w-3 h-3 opacity-70" />
                <span className="font-medium">{PROVIDER_LABEL[a.provider] || a.provider}</span>
                <span className="opacity-60">·</span>
                <span>{label?.text || a.alertType}</span>
                {a.count > 1 && (
                  <span className="opacity-60 text-[10px]">×{a.count}</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-[10.5px] opacity-60 mt-1.5">
          {t.dashBanner.autoFallback}
          <a href="/dashboard/billing" className="underline mx-1 opacity-90 hover:opacity-100">{t.dashBanner.billingLink}</a>
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-white/10 opacity-60 hover:opacity-100"
        title={t.dashBanner.dismiss}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

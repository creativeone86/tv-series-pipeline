'use client';

/**
 * Engine weather bar (v12.149.0) — show which engines are unhealthy before ROLL,
 * instead of a silent fallback after start.
 *
 * Source /api/api-status (existed in v2.17; previously unused in the UI):
 *   - alerts: DB alerts (minimax/midjourney/veo, 1h window)
 *   - gateways: in-memory gateway bankruptcy snapshot (qingyuntop/vectorengine cooldown)
 * All healthy → render nothing; otherwise one amber bar with a manual refresh.
 */
import { useEffect, useState, useCallback } from 'react';
import { useLocale } from '@/hooks/use-locale';

interface Alert { provider: string; alertType: string; lastSeenAt: string; count: number }
interface Gateway { host: string; remainingSec: number }

export interface WeatherLabels {
  providers?: Record<string, string>;
  types?: Record<string, string>;
  gatewayCooldown?: string;
  recentFailures?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  minimax: 'MiniMax (video/image)', veo: 'Veo (video)', midjourney: 'Midjourney (image)', kling: 'Kling (video)',
};
const TYPE_LABEL: Record<string, string> = {
  exhausted: 'credits exhausted', auth_failed: 'key invalid', saturated: 'upstream saturated', rate_limited: 'rate limited',
};

/** Pure: status → display segments (unit-testable). v12.161: also light up when an engine
 *  failed ≥3 times in ~10 min. v12.216: capability-boundary notes (e.g. Kling native audio). */
export function weatherSegments(
  alerts: Alert[],
  gateways: Gateway[],
  engines: Array<{ provider: string; recentFailures: number }> = [],
  capabilityNotes: Array<{ text: string }> = [],
  labels?: WeatherLabels,
): string[] {
  const providers = labels?.providers ?? PROVIDER_LABEL;
  const types = labels?.types ?? TYPE_LABEL;
  const gatewayTpl = labels?.gatewayCooldown ?? 'Gateway {host} quota cooldown (~{n} min)';
  const failTpl = labels?.recentFailures ?? '{provider} failed {n} times in 10 min (unstable)';
  const segs: string[] = [];
  for (const a of alerts) {
    segs.push(`${providers[a.provider] || a.provider} ${types[a.alertType] || a.alertType}`);
  }
  for (const g of gateways) {
    segs.push(gatewayTpl
      .replace('{host}', g.host)
      .replace('{n}', String(Math.max(1, Math.round(g.remainingSec / 60)))));
  }
  for (const e of engines) {
    if (e.recentFailures >= 3) {
      segs.push(failTpl
        .replace('{provider}', providers[e.provider] || e.provider)
        .replace('{n}', String(e.recentFailures)));
    }
  }
  for (const n of capabilityNotes) {
    segs.push(`⚙️ ${n.text}`);
  }
  return segs;
}

export function EngineWeather() {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [segs, setSegs] = useState<string[]>([]);
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/api-status');
      const data = await res.json();
      setSegs(weatherSegments(data.alerts || [], data.gateways || [], data.engines || [], data.capabilityNotes || [], {
        providers: {
          minimax: t.workshopCreate.providerMinimax,
          veo: t.workshopCreate.providerVeo,
          midjourney: t.workshopCreate.providerMidjourney,
          kling: t.dashBanner.kling,
        },
        types: {
          exhausted: t.dashBanner.exhausted,
          auth_failed: t.dashBanner.authFailed,
          saturated: t.dashBanner.saturated,
          rate_limited: t.dashBanner.rateLimited,
        },
        gatewayCooldown: t.workshopCreate.gatewayCooldown,
        recentFailures: t.workshopCreate.recentFailures,
      }));
    } catch { /* treat fetch failure as clear skies — do not nag */ }
  }, [locale]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 120_000);
    return () => clearInterval(timer);
  }, [load]);

  if (segs.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90 flex items-start gap-2" data-testid="engine-weather">
      <span className="shrink-0">🌩️</span>
      <div className="min-w-0">
        <span className="opacity-70">{t.workshopCreate.engineWeather}</span>{segs.join(' · ')}
        <span className="opacity-50"> {t.workshopCreate.engineWeatherHint}</span>
      </div>
      <button type="button" onClick={() => void load()} className="ml-auto shrink-0 opacity-60 hover:opacity-100" title={t.workshopCreate.refresh}>↻</button>
    </div>
  );
}

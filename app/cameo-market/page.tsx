'use client';

/**
 * v4.0 — Cameo IP marketplace.
 *
 * Browse public character IP tokens, see license / royalty, request reuse. Early creator economy.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkle as Sparkles, CircleNotch as Loader2, Crown, Lock, Check } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface MarketToken {
  id: string;
  name: string;
  coverUrl: string | null;
  license: 'view' | 'remix' | 'commercial';
  royaltyEur: number;
  useCount: number;
  ownerId: string;
}

export default function CameoMarketPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const licenseLabel = (license: MarketToken['license']) => {
    if (license === 'view') return ui.licenseView;
    if (license === 'remix') return ui.licenseRemix;
    return ui.licenseCommercial;
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/cameo-ip?scope=market');
      const body = await res.json();
      setTokens(body.tokens || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const callAction = useCallback(async (tokenId: string, action: 'request-grant' | 'import') => {
    setRequesting(tokenId);
    setMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch(`/api/cameo-ip/${encodeURIComponent(tokenId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, message: ui.reuseMessage }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      if (action === 'import') {
        setMsg(body.alreadyImported ? ui.alreadyInLibrary : ui.importedToLibrary);
      } else {
        setMsg(body.grant?.status === 'pending' ? ui.grantPending : ui.grantRecorded);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t.auth.actionFailed);
    } finally {
      setRequesting(null);
    }
  }, [ui, t.auth.actionFailed]);

  return (
    <div className="cinema-page min-h-screen bg-[var(--cinema-bg,#0a0a0f)] text-white p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> {ui.back}
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="w-5 h-5 text-fuchsia-400" /> {ui.marketTitle}
        </h1>
        <div className="w-16" />
      </div>

      <p className="text-white/50 text-sm mb-6">
        {ui.marketIntro}
      </p>

      {msg && <div className="mb-4 text-sm text-emerald-400">{msg}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> {ui.loadingMarket}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center text-white/40 py-16">{ui.marketEmpty}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tokens.map((tok) => {
            const open = tok.license === 'remix' || tok.license === 'commercial';
            return (
              <div key={tok.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="aspect-[3/4] bg-gradient-to-br from-fuchsia-900/40 to-indigo-900/40 flex items-center justify-center">
                  {tok.coverUrl
                    ? <img loading="lazy" decoding="async" src={tok.coverUrl} alt={tok.name} className="w-full h-full object-cover" />
                    : <Crown className="w-10 h-10 text-white/20" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{tok.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                      open ? 'text-emerald-400 border-emerald-500/40' : 'text-amber-400 border-amber-500/40'
                    }`}>
                      {licenseLabel(tok.license)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-white/40 flex items-center gap-2">
                    <span>{tok.royaltyEur > 0 ? ui.perUse.replace('{n}', String(tok.royaltyEur)) : t.pricing.free}</span>
                    <span>{ui.reusedN.replace('{n}', String(tok.useCount))}</span>
                  </div>
                  {open ? (
                    <button
                      onClick={() => callAction(tok.id, 'import')}
                      disabled={requesting === tok.id}
                      className="mt-2 w-full cinema-btn cinema-btn-primary !py-1.5 !text-[11px] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {requesting === tok.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      {ui.importToLibrary}
                    </button>
                  ) : (
                    <button
                      onClick={() => callAction(tok.id, 'request-grant')}
                      disabled={requesting === tok.id}
                      className="mt-2 w-full cinema-btn !py-1.5 !text-[11px] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {requesting === tok.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                      {ui.requestGrant}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

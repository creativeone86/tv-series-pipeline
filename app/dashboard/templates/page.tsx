'use client';

/**
 * v9.6.8 — Template market (phase 16 T2). Browse public film templates (look + multi-ref + pacing + quality),
 * "Start from this template" → POST /use to count + hand payload via sessionStorage to the workshop
 * (same handoff as style gallery "Apply this style").
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, MagicWand, MagnifyingGlass, Acorn, Star, Heart } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface ElementSummary { role: string; count: number; }
interface TemplatePayload { style?: string; styleEn?: string; genre?: string; pacingTone?: string; references?: unknown[]; lockedCharacters?: unknown[]; voiceOverrides?: Record<string, string>; previewUrl?: string; previewVideoUrl?: string; }
interface Template {
  id: string; title: string; style: string; genre?: string; pacingTone?: string;
  shotCount: number; quality: number; elements: ElementSummary[]; tags: string[];
  useCount: number; payload?: TemplatePayload | null;
  ratingAvg: number; ratingCount: number;
}

const qColor = (q: number) => (q >= 80 ? 'text-emerald-400 border-emerald-400/30' : q >= 60 ? 'text-amber-400 border-amber-400/30' : 'text-rose-400 border-rose-400/30');

export default function TemplatesMarketPage() {
  const router = useRouter();
  const { t: tRaw, locale } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const roleLabel: Record<string, string> = {
    character: t.product.tabCharacters,
    style: t.dashMore.styleRole,
    scene: t.product.tabScenes,
    prop: t.dashMore.propRole,
    motion: t.dashMore.motionRole,
    voice: t.dashMore.voiceRole,
  };
  const [templates, setTemplates] = useState<Template[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string, fav: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (fav) params.set('fav', '1');
      const res = await fetch(`/api/templates${params.toString() ? `?${params}` : ''}`);
      const body = await res.json();
      if (res.ok) { setTemplates(body.templates || []); setFavoriteIds(new Set<string>(body.favoriteIds || [])); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load('', favOnly); }, [load, favOnly]);

  const toggleFav = useCallback(async (tpl: Template) => {
    const on = !favoriteIds.has(tpl.id);
    setFavoriteIds((s) => { const n = new Set(s); if (on) n.add(tpl.id); else n.delete(tpl.id); return n; });
    try { await fetch(`/api/templates/${encodeURIComponent(tpl.id)}/favorite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on }) }); } catch { /* rollback on next refresh */ }
    if (favOnly && !on) setTemplates((ts) => ts.filter((x) => x.id !== tpl.id));
  }, [favoriteIds, favOnly]);

  const rate = useCallback(async (tpl: Template, stars: number) => {
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(tpl.id)}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: stars }) });
      const b = await res.json();
      if (b.ok) setTemplates((ts) => ts.map((x) => x.id === tpl.id ? { ...x, ratingAvg: b.avg, ratingCount: b.count } : x));
    } catch { /* ignore */ }
  }, []);

  const startFromTemplate = useCallback(async (tpl: Template) => {
    try { await fetch(`/api/templates/${encodeURIComponent(tpl.id)}/use`, { method: 'POST' }); } catch { /* count failure must not block */ }
    try {
      const payload = tpl.payload || { style: tpl.style, genre: tpl.genre, pacingTone: tpl.pacingTone };
      sessionStorage.setItem('qfmj-create-template', JSON.stringify(payload));
    } catch { /* ignore */ }
    router.push('/dashboard/create');
  }, [router]);

  const styleOf = (tpl: Template) => {
    const p = tpl.payload;
    if (locale === 'en') return p?.styleEn || tpl.style || '—';
    return tpl.style || '—';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Stack className="w-6 h-6 text-white/80" />
        <h1 className="text-xl font-semibold text-white/90">{t.sidebar.templates}</h1>
      </div>
      <p className="text-sm text-white/45 mb-5">{t.dashMore.templatesSubtitle}</p>

      <div className="flex items-center gap-2 mb-5 max-w-xl">
        <div className="flex items-center gap-2 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <MagnifyingGlass className="w-4 h-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(q, favOnly); }}
            placeholder={t.dashMore.searchTemplates}
            className="bg-transparent outline-none text-sm text-white/80 flex-1 placeholder:text-white/30"
          />
        </div>
        <button onClick={() => load(q, favOnly)} className="cinema-btn !px-3 !py-2 !text-xs">{t.dashMore.search}</button>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={`cinema-btn !px-3 !py-2 !text-xs inline-flex items-center gap-1 ${favOnly ? '!text-rose-300 !border-rose-400/40' : ''}`}
        >
          <Heart weight={favOnly ? 'fill' : 'regular'} className="w-3.5 h-3.5" /> {t.dashMore.favOnly}
        </button>
      </div>

      {loading ? (
        <div className="text-white/60 text-sm py-12 text-center">{t.common.loading}</div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-white/60 text-sm py-16">
          <Acorn className="w-8 h-8 text-white/20" />
          {t.dashMore.noTemplates}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 hover:border-white/20 transition-colors">
              {/* v9.7.12 template preview: first-shot film (muted loop) or storyboard still */}
              {(tpl.payload?.previewVideoUrl || tpl.payload?.previewUrl) && (
                <div className="rounded-lg overflow-hidden bg-black/30 h-28 -mt-1">
                  {tpl.payload?.previewVideoUrl ? (
                    <video src={tpl.payload.previewVideoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata" />
                  ) : (
                    <img loading="lazy" decoding="async" src={tpl.payload!.previewUrl} alt={tpl.title} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate">{tpl.title}</div>
                  <div className="text-[11px] text-white/45 mt-0.5">{styleOf(tpl)}{tpl.genre ? ` · ${tpl.genre}` : ''} · {tpl.shotCount} {t.dashProjects.shotsUnit}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${qColor(tpl.quality)}`}>{t.dashMore.qualityN.replace('{n}', String(tpl.quality))}</span>
                  <button onClick={() => toggleFav(tpl)} aria-label={t.dashMore.favorite} className="text-white/40 hover:text-rose-300 transition-colors">
                    <Heart weight={favoriteIds.has(tpl.id) ? 'fill' : 'regular'} className={`w-4 h-4 ${favoriteIds.has(tpl.id) ? 'text-rose-400' : ''}`} />
                  </button>
                </div>
              </div>

              {tpl.elements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tpl.elements.map((e) => (
                    <span key={e.role} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/55">
                      {roleLabel[e.role] || e.role} ×{e.count}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {tpl.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[10px] text-white/60">#{tag}</span>
                ))}
              </div>

              {/* Rating: click stars; show average + count */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => rate(tpl, s)} aria-label={t.dashMore.rateNStars.replace('{n}', String(s))} className="text-amber-400/80 hover:text-amber-300 transition-colors">
                    <Star weight={s <= Math.round(tpl.ratingAvg) ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                  </button>
                ))}
                <span className="text-[10px] text-white/60 ml-1">{tpl.ratingCount > 0 ? `${tpl.ratingAvg} (${tpl.ratingCount})` : t.dashMore.noRatings}</span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[11px] text-white/60">{t.dashMore.usedNTimes.replace('{n}', String(tpl.useCount))}</span>
                <button onClick={() => startFromTemplate(tpl)} className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1">
                  <MagicWand className="w-3.5 h-3.5" /> {t.dashMore.useTemplate}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

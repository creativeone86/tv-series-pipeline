'use client';

/**
 * My Series (phase 26 · v12.20.0) — list the user's series and open each batch-generate panel.
 */
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { FilmSlate, CircleNotch as Loader2, CaretRight, Plus } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface SeriesSummary { seriesId: string; episodeCount: number; doneCount: number; sampleTitle: string; updatedAt: string }

/** Infer series name from a sample episode title ("<series> ep N …"). */
function seriesName(sampleTitle: string, seriesId: string): string {
  const cut = (sampleTitle || '').split(' \u7b2c')[0].trim();
  return cut || seriesId;
}

export default function MySeriesPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const [series, setSeries] = useState<SeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const tok = getToken();
      const res = await fetch('/api/series', { headers: tok ? { Authorization: `Bearer ${tok}` } : {} });
      const body = await res.json();
      if (res.ok && Array.isArray(body.series)) setSeries(body.series);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 grid place-items-center"><FilmSlate className="w-6 h-6 text-cyan-400" /></div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{t.sidebar.series}</h1>
          <p className="text-xs text-gray-500">{t.dashMore.seriesSubtitle}</p>
        </div>
        <Link href="/dashboard/series/new" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> {t.dashMore.newSeries}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />{t.seriesDetail.loading}</div>
      ) : series.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {t.dashMore.noSeries}<br />
          <span className="text-gray-600 text-xs">{t.dashMore.noSeriesHint}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {series.map((s) => (
            <Link key={s.seriesId} href={`/dashboard/series/${encodeURIComponent(s.seriesId)}`}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-cyan-500/30 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{seriesName(s.sampleTitle, s.seriesId)}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{t.dashMore.seriesEpMeta.replace('{n}', String(s.episodeCount)).replace('{done}', String(s.doneCount)).replace('{total}', String(s.episodeCount))}</div>
              </div>
              <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden shrink-0">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${s.episodeCount ? Math.round((s.doneCount / s.episodeCount) * 100) : 0}%` }} />
              </div>
              <CaretRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Play, Eye, Heart, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

export default function CasesPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const [cases, setCases] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then((d) => setCases(d))
      .catch(() => {});
  }, []);

  // Vidu-style: one-click copy prompt to clipboard and navigate to create
  const handleCopyPrompt = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const promptText = c.prompt || c.description || c.title;
    navigator.clipboard.writeText(promptText).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleUsePrompt = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const promptText = c.prompt || c.description || c.title;
    // Navigate to create page with the prompt pre-filled
    router.push(`/dashboard/create?idea=${encodeURIComponent(promptText)}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t.cases.title}</h2>
        <p className="text-sm text-[var(--muted)] mt-1">{t.cases.subtitleReuse}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cases.map((c) => (
          <div key={c.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="relative h-[220px] overflow-hidden">
              {playingId === c.id && c.videoUrl ? (
                <video
                  src={c.videoUrl}
                  className="w-full h-full object-cover bg-black"
                  autoPlay loop playsInline controls
                />
              ) : (
                <>
                  {/* v9.5.5 fix: cards with video autoplay muted loop (real clip), not just a gradient placeholder */}
                  {c.videoUrl ? (
                    <video
                      src={c.videoUrl}
                      className="w-full h-full object-cover bg-black transition-transform duration-300 group-hover:scale-105"
                      autoPlay muted loop playsInline preload="metadata"
                    />
                  ) : (
                    <img loading="lazy" decoding="async" src={c.coverUrl} alt={c.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  {c.videoUrl && (
                    <>
                      <span className="absolute top-2.5 left-2.5 text-[10px] px-1.5 py-0.5 rounded bg-black/55 text-white/80 border border-white/10 backdrop-blur-sm">{t.dashMore.demoClip}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlayingId(c.id); }}
                        aria-label={t.dashMore.playWithAudio}
                        className="absolute top-2.5 right-2.5 z-10 text-[10px] px-2 py-1 rounded-full bg-black/55 text-white/90 border border-white/15 backdrop-blur-sm inline-flex items-center gap-1 cursor-pointer hover:bg-black/75 transition-all"
                      >
                        <Play weight="fill" className="w-2.5 h-2.5" /> {t.dashMore.playWithAudio}
                      </button>
                    </>
                  )}

                  {/* Vidu-style: hover overlay with copy/use prompt buttons */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={(e) => handleCopyPrompt(c, e)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-xs text-white transition-all border border-white/10"
                      >
                        {copiedId === c.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === c.id ? t.cases.copied : t.cases.copyPrompt}
                      </button>
                      <button
                        onClick={(e) => handleUsePrompt(c, e)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E8C547]/80 hover:bg-[#E8C547] text-xs text-white transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        {t.cases.usePrompt}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-4">
              <span className="text-xs text-[var(--soft)]">{c.category}</span>
              <h4 className="font-semibold mt-1 mb-2">{c.title}</h4>
              {/* Prompt preview */}
              {(c.prompt || c.description) && (
                <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 italic">
                  &ldquo;{(c.prompt || c.description).slice(0, 80)}&rdquo;
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[var(--soft)]">
                  <img loading="lazy" decoding="async" src={c.authorAvatar} alt={c.authorName} className="w-7 h-7 rounded-full" />
                  <span className="text-xs">{c.authorName}</span>
                </div>
                <div className="flex gap-2.5 text-[10px] text-[var(--soft)]">
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {c.metrics?.views || 0}</span>
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {c.metrics?.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-[var(--soft)] leading-relaxed max-w-3xl">
        {t.dashMore.casesCopyrightLead}<strong className="text-[var(--muted)]">{t.dashMore.casesCopyrightStrong}</strong>{t.dashMore.casesCopyrightTail}
      </p>
    </div>
  );
}

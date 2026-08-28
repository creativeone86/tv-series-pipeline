'use client';

/**
 * /template/[token] · v2.18 P2.3 — public landing page for a shared template (client part)
 *
 * v2.19 P0.3: split into server page.tsx (generateMetadata + OG meta) + this client.
 * Anyone can visit (no auth). "Clone to my library" POSTs the clone endpoint — that
 * endpoint requires auth; unsigned-in users are sent to login and returned here.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Eye, Users, Warning as AlertTriangle, ArrowLeft, CircleNotch as Loader2 } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface SharedTemplate {
  token: string;
  template: {
    id: string;
    name: string;
    nameEn?: string;
    icon?: string;
    description?: string;
    exampleIdea?: string;
    structureHint?: string;
    emotionCurve?: string;
    keyElements?: string[];
    styleRecommendation?: string;
    shotCount?: { min: number; max: number };
    colorPalette?: string;
    tags?: string[];
    recommendedDuration?: 5 | 6 | 10 | 15;
    recommendedAspect?: string;
    recommendedCamera?: string;
  };
  ownerName?: string;
  viewCount: number;
  cloneCount: number;
  createdAt: string;
}

export default function SharedTemplateClient({ token }: { token: string }) {
  const { t: tRaw, locale } = useLocale();
  const loc = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = loc.publicUi;
  const [data, setData] = useState<SharedTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/shared/${encodeURIComponent(token)}`);
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || ui.loadFailed);
          return;
        }
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : ui.loadFailed);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [token, ui.loadFailed]);

  const doClone = async () => {
    setCloning(true);
    try {
      const res = await fetch(`/api/templates/shared/${encodeURIComponent(token)}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || ui.cloneFailed);
        return;
      }
      setCloned({ id: body.newAssetId, name: body.newAssetName });
    } catch (e) {
      alert(e instanceof Error ? e.message : ui.cloneFailed);
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="cinema-page min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--cinema-amber)]" />
          <p className="cinema-mono text-[11px] opacity-70">{ui.loadingTemplate}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cinema-page min-h-screen flex items-center justify-center text-white px-4">
        <div className="cinema-card-hi p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-[var(--cinema-amber)] mx-auto mb-3" />
          <h1 className="cinema-headline text-lg mb-2">{ui.linkUnavailable}</h1>
          <p className="cinema-mono text-[11px] opacity-70 mb-4">{error || ui.templateGone}</p>
          <Link href="/dashboard/create" className="cinema-btn cinema-btn-primary !text-[12px]">
            {ui.goCreateOwn}
          </Link>
        </div>
      </div>
    );
  }

  const tpl = data.template;
  const displayName = locale === 'en' ? (tpl.nameEn || tpl.name) : tpl.name;

  return (
    <div className="cinema-page min-h-screen text-white">
      {/* nav */}
      <nav className="sticky top-0 z-30 bg-[var(--cinema-surface)]/85 backdrop-blur-xl border-b border-[var(--cinema-border)]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard/create" className="cinema-btn-ghost cinema-btn !p-2 inline-flex items-center gap-1 !text-[11px]">
            <ArrowLeft className="w-3.5 h-3.5" />
            {ui.backToWorkshop}
          </Link>
          <div className="flex items-center gap-2">
            <span className="cinema-chip cinema-chip-amber">
              <Eye className="w-3 h-3" />
              {data.viewCount}
            </span>
            <span className="cinema-chip">
              <Copy className="w-3 h-3" />
              {ui.clonesN.replace('{n}', String(data.cloneCount))}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Top: icon + name + author */}
        <div className="cinema-card-hi p-5 flex items-start gap-4">
          <div className="text-5xl">{tpl.icon || '📄'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="cinema-eyebrow">SHARED TEMPLATE</span>
              {data.ownerName && (
                <span className="cinema-mono text-[10px] opacity-50 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  by {data.ownerName}
                </span>
              )}
            </div>
            <h1 className="cinema-headline text-2xl truncate">{displayName}</h1>
            {tpl.nameEn && locale !== 'en' && <div className="cinema-mono text-[11px] opacity-50 mt-0.5">{tpl.nameEn}</div>}
            {tpl.description && (
              <p className="cinema-subhead text-sm mt-2 opacity-85 leading-relaxed">{tpl.description}</p>
            )}
          </div>
        </div>

        {/* Actions: clone / use now */}
        {cloned ? (
          <div className="cinema-card-hi p-5 border-[var(--cinema-green)]/40">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-[var(--cinema-green)]" />
              <h3 className="cinema-headline text-base">{ui.clonedToLibrary}</h3>
            </div>
            <p className="cinema-mono text-[11px] opacity-75 mb-4">
              {ui.clonedDetail.replace('{name}', cloned.name).replace('{id}', cloned.id.slice(0, 12))}
            </p>
            <Link href="/dashboard/create" className="cinema-btn cinema-btn-primary !text-[12px]">
              {ui.goUse}
            </Link>
          </div>
        ) : (
          <div className="cinema-card-hi p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="cinema-eyebrow mb-1">{ui.cloneToLibraryEyebrow}</div>
              <p className="cinema-mono text-[11px] opacity-70">
                {ui.cloneToLibraryHint}
              </p>
            </div>
            <button
              onClick={doClone}
              disabled={cloning}
              className="cinema-btn cinema-btn-primary !px-4 !py-2 !text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {cloning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {cloning ? ui.cloning : ui.cloneToMyLibrary}
            </button>
          </div>
        )}

        {/* Detail cards */}
        {tpl.exampleIdea && (
          <div className="cinema-card-hi p-4">
            <div className="cinema-eyebrow mb-2">{ui.exampleIdeaLabel}</div>
            <p className="cinema-subhead text-[12.5px] opacity-90 leading-relaxed">{tpl.exampleIdea}</p>
          </div>
        )}

        {tpl.structureHint && (
          <div className="cinema-card-hi p-4">
            <div className="cinema-eyebrow mb-2">{ui.structureLabel}</div>
            <p className="cinema-subhead text-[11.5px] opacity-85 leading-relaxed">{tpl.structureHint}</p>
          </div>
        )}

        {((tpl.keyElements && tpl.keyElements.length > 0) || (tpl.tags && tpl.tags.length > 0)) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {tpl.keyElements && tpl.keyElements.length > 0 && (
              <div className="cinema-card-hi p-3">
                <div className="cinema-eyebrow mb-2">KEY ELEMENTS</div>
                <div className="flex flex-wrap gap-1">
                  {tpl.keyElements.map((el) => (
                    <span key={el} className="cinema-chip cinema-chip-amber">
                      {el}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {tpl.tags && tpl.tags.length > 0 && (
              <div className="cinema-card-hi p-3">
                <div className="cinema-eyebrow mb-2">TAGS</div>
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((tg) => (
                    <span key={tg} className="cinema-chip">{tg}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="cinema-card p-4">
          <div className="cinema-eyebrow mb-2">{ui.recommendedLabel}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 cinema-mono text-[11px]">
            <div>
              <div className="opacity-50">{ui.styleLook}</div>
              <div className="opacity-90">{tpl.styleRecommendation || '—'}</div>
            </div>
            <div>
              <div className="opacity-50">{ui.duration}</div>
              <div className="opacity-90">{tpl.recommendedDuration ? `${tpl.recommendedDuration}s` : '—'}</div>
            </div>
            <div>
              <div className="opacity-50">{ui.aspect}</div>
              <div className="opacity-90">{tpl.recommendedAspect || '—'}</div>
            </div>
            <div>
              <div className="opacity-50">{ui.camera}</div>
              <div className="opacity-90">{tpl.recommendedCamera || '—'}</div>
            </div>
          </div>
        </div>

        {tpl.colorPalette && (
          <div className="cinema-card p-3">
            <div className="cinema-eyebrow mb-1">COLOR PALETTE</div>
            <p className="cinema-mono text-[11px] opacity-75">{tpl.colorPalette}</p>
          </div>
        )}
      </main>
    </div>
  );
}

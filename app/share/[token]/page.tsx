import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations, normalizeLocale } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public read-only share page. Anonymous access via shareToken; no login required.
 * Shows: title / synopsis / cover / storyboard video set (when present).
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return notFound();

  const jar = await cookies();
  const tRaw = getTranslations(normalizeLocale(jar.get('qfmj-locale')?.value));
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };

  let project: any;
  try {
    project = db.prepare(
      'SELECT id, title, description, cover_urls, script_data, director_notes FROM projects WHERE share_token = ?'
    ).get(token);
  } catch {
    project = null;
  }

  if (!project) return notFound();

  const covers = safeJson<string[]>(project.cover_urls, []);
  const script = safeJson<any>(project.script_data, {});

  // Final cut
  // v2.9: share links go to friends — a dead CDN is the worst case, so prefer the persistent copy
  const finalRow = db.prepare(
    `SELECT media_urls, persistent_url FROM project_assets WHERE project_id = ? AND type IN ('final_video','timeline') ORDER BY updated_at DESC LIMIT 1`
  ).get(project.id) as { media_urls: string; persistent_url: string | null } | undefined;
  const finalUrl = finalRow ? (finalRow.persistent_url || safeJson<string[]>(finalRow.media_urls, [])[0] || '') : '';

  // All shot clips
  const videoRows = db.prepare(
    `SELECT shot_number, media_urls, persistent_url FROM project_assets WHERE project_id = ? AND type = 'video' ORDER BY shot_number`
  ).all(project.id) as Array<{ shot_number: number; media_urls: string; persistent_url: string | null }>;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white/90 py-10">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-[11px] text-white/30 mb-2 tracking-widest uppercase">
          Shared Project · Read Only
        </div>
        <h1 className="text-3xl font-bold mb-3">{project.title || t.publicUi.untitledWork}</h1>
        {project.description && (
          <p className="text-white/60 mb-8 leading-relaxed">{project.description}</p>
        )}

        {finalUrl && (
          <div className="mb-8 rounded-xl overflow-hidden border border-white/[0.06] bg-black">
            <video src={finalUrl} controls className="w-full aspect-video" />
          </div>
        )}

        {!finalUrl && covers[0] && (
          <img loading="lazy" decoding="async" src={covers[0]} alt={project.title} className="w-full rounded-xl mb-8" />
        )}

        {script?.synopsis && (
          <section className="mb-8 p-5 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-[#E8C547] mb-2">{t.publicUi.synopsis}</h2>
            <p className="text-sm text-white/70 leading-relaxed">{script.synopsis}</p>
          </section>
        )}

        {videoRows.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-[#E8C547] mb-3">{t.publicUi.storyboardsN.replace('{n}', String(videoRows.length))}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videoRows.map(v => {
                const url = v.persistent_url || safeJson<string[]>(v.media_urls, [])[0];
                if (!url) return null;
                return (
                  <div key={v.shot_number} className="rounded-lg overflow-hidden border border-white/[0.05] bg-black">
                    <video src={url} controls muted className="w-full aspect-video" />
                    <div className="text-[10px] text-white/40 px-2 py-1">{t.product.shotN.replace('{n}', String(v.shot_number))}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="text-center text-[11px] text-white/20 pt-8 border-t border-white/[0.04]">
          {t.publicUi.shareFooter}
        </footer>
      </div>
    </div>
  );
}

function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

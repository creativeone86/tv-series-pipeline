'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { IMG_PREVIEW_DEFAULT } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import { Kanban as FolderKanban, Clock, CheckCircle as CheckCircle2, Play, FilmStrip as Film, Plus, Sparkle as Sparkles, MagnifyingGlass as Search, MagicWand as Wand2, Trash as Trash2, Archive, ArrowCounterClockwise as Restore } from '@phosphor-icons/react';
import { getToken } from '@/lib/auth';
import { FilmStripDivider } from '@/components/cinema/primitives';
import { NumberTicker, AnimatedShinyText } from '@/components/cinema/effects';
import { ScoreDonut } from '@/components/cinema/dataviz';
import { readinessLevel } from '@/lib/polish-prompts';
import { useLocale } from '@/hooks/use-locale';

export default function ProjectsPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'draft'>('all');
  const [importingDemo, setImportingDemo] = useState(false);

  // v10.5.0: one-click demo import — walk the full film workbench with 0 keys (Time-to-Wow)
  const importDemo = async () => {
    if (importingDemo) return;
    setImportingDemo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch('/api/demo-project', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const { projectId } = await res.json();
        router.push(`/projects/${projectId}`);
        return;
      }
    } catch { /* fall back to the button state */ }
    setImportingDemo(false);
  };

  useEffect(() => {
    // v5.0.x fix: go through api-client (with Authorization) so we resolve the real signed-in user, not the no-auth fallback.
    // Bare fetch without a token used to hit the first-user fallback; after test users polluted the DB that fallback resolved wrong and the list was empty.
    api.projects()
      .then((d: any) => { if (Array.isArray(d)) setProjects(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [busyId, setBusyId] = useState<string | null>(null);

  const authHeaders = () => { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

  const removeProject = async (id: string, title: string) => {
    if (!confirm(t.dashProjects.deleteConfirm.replace('{title}', title || t.dashProjects.untitled))) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setProjects((ps) => ps.filter((p) => p.id !== id));
    } finally { setBusyId(null); }
  };

  const toggleArchive = async (id: string, archived: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ status: archived ? 'archived' : 'completed' }),
      });
      if (res.ok) setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status: archived ? 'archived' : 'completed' } : p)));
    } finally { setBusyId(null); }
  };

  const statusConfig: Record<string, { label: string; dotColor: string; bgColor: string; icon: any }> = {
    completed: { label: t.dashProjects.statusCompleted, dotColor: 'bg-emerald-400', bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    active: { label: t.dashProjects.statusActive, dotColor: 'bg-[#E8C547]', bgColor: 'bg-[#E8C547]/10 text-[#E8C547] border-[#E8C547]/20', icon: Play },
    draft: { label: t.dashProjects.statusDraft, dotColor: 'bg-gray-400', bgColor: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Clock },
    archived: { label: t.dashProjects.statusArchived, dotColor: 'bg-white/30', bgColor: 'bg-white/5 text-white/40 border-white/10', icon: Archive },
  };

  // "All" excludes archived by default (archived = removed from the main list); pick "Archived" to see them
  const filtered = filter === 'all'
    ? projects.filter(p => p.status !== 'archived')
    : projects.filter(p => p.status === filter);
  const filterOptions = [
    { key: 'all', label: t.dashProjects.filterAll },
    { key: 'active', label: t.dashProjects.filterActive },
    { key: 'completed', label: t.dashProjects.filterCompleted },
    { key: 'draft', label: t.dashProjects.filterDraft },
    { key: 'archived', label: t.dashProjects.filterArchived },
  ];

  return (
    <div className="cinema-page max-w-6xl mx-auto -mx-[5vw] -my-6 px-[5vw] py-6">
      {/* Header — cinema dashboard look */}
      <div className="flex justify-between items-end mb-6 animate-fade-up gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AnimatedShinyText className="cinema-eyebrow tracking-widest">FILMOGRAPHY · {t.dashProjects.eyebrow}</AnimatedShinyText>
            <span className="cinema-mono text-[10px] opacity-50">
              <NumberTicker value={projects.length} /> titles
            </span>
          </div>
          <h1 className="cinema-headline text-3xl">{t.dashProjects.title}</h1>
          <p className="cinema-subhead text-sm mt-1 opacity-70">{t.dashProjects.subtitle}</p>
        </div>
        <Link href="/dashboard/create" className="cinema-btn cinema-btn-primary !px-5 !py-2.5 !text-[12px] whitespace-nowrap">
          <Plus className="w-4 h-4" weight="bold" />
          {t.dashProjects.newCreate}
        </Link>
      </div>

      <FilmStripDivider />

      {/* Filter Bar — cinema chips */}
      <div className="flex items-center gap-1.5 mb-6 mt-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <span className="cinema-eyebrow mr-2">FILTER</span>
        {filterOptions.map(f => {
          const count = projects.filter(p => (f.key === 'all' ? p.status !== 'archived' : p.status === f.key)).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`cinema-btn !px-3 !py-1 !text-[11px] ${active ? 'cinema-btn-primary' : ''}`}
            >
              <span>{f.label}</span>
              <span className={`cinema-mono text-[10px] ml-1 tabular-nums ${active ? 'opacity-90' : 'opacity-50'}`}>
                {String(count).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="cinema-card animate-shimmer">
              <div className="h-[160px] bg-[var(--surface)]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[var(--surface)] rounded w-2/3" />
                <div className="h-3 bg-[var(--surface)] rounded w-full" />
                <div className="h-3 bg-[var(--surface)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="cinema-card-hi text-center py-16 animate-fade-up px-6">
          <FolderKanban className="w-10 h-10 text-[var(--cinema-amber)] opacity-60 mx-auto mb-4" />
          <div className="cinema-eyebrow tracking-widest mb-2">EMPTY ROSTER</div>
          <p className="cinema-headline text-base mb-1">{filter === 'all' ? t.dashProjects.emptyAll : t.dashProjects.emptyFiltered}</p>
          <p className="cinema-subhead text-xs mb-5 opacity-65 max-w-md mx-auto">{t.dashProjects.emptyHint}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard/create" className="cinema-btn cinema-btn-primary !text-[12px]">
              <Sparkles className="w-4 h-4" weight="duotone" />
              {t.dashProjects.startCreate}
            </Link>
            <button onClick={importDemo} disabled={importingDemo} className="cinema-btn !text-[12px] disabled:opacity-60">
              <Film className="w-4 h-4" weight="duotone" />
              {importingDemo ? t.dashProjects.importing : t.dashProjects.importDemo}
            </button>
          </div>
          <p className="cinema-mono text-[10px] opacity-70 mt-3">{t.dashProjects.importDemoHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => {
            const sc = statusConfig[p.status] || statusConfig.draft;
            const StatusIcon = sc.icon;
            const cover = p.covers?.[0] || IMG_PREVIEW_DEFAULT;
            const shotCount = p.scriptData?.shots?.length || 0;

            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="cinema-card animate-fade-up group"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                {/* Cover */}
                <div className="cover h-[160px]">
                  <img loading="lazy" decoding="async" src={cover} alt={p.title} className="w-full h-full object-cover"
                    onError={(e) => {
                      // Historical cover URL dead (CDN expired / local asset cleared) → fall back to the inline placeholder so we do not show a broken icon. One-shot swap to avoid a loop.
                      const img = e.currentTarget;
                      if (img.dataset.fallback) return;
                      img.dataset.fallback = '1';
                      img.src = IMG_PREVIEW_DEFAULT;
                    }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-sm ${sc.bgColor}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                    {sc.label}
                  </div>
                  {/* v11.2.0 manage actions (hover): archive/restore + delete */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" disabled={busyId === p.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleArchive(p.id, p.status !== 'archived'); }}
                      title={p.status === 'archived' ? t.dashProjects.restoreTitle : t.dashProjects.archiveTitle}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white border border-white/10">
                      {p.status === 'archived' ? <Restore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" disabled={busyId === p.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeProject(p.id, p.title); }}
                      title={t.dashProjects.deleteTitle}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white border border-white/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {shotCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-white/80">
                      <Film className="w-3 h-3" />
                      {shotCount} {t.dashProjects.shotsUnit}
                    </div>
                  )}
                  {/* AIGC readiness badge — source is latestPolish.audit.aigcReadiness; red/amber/green shows whether the script can enter the pipeline */}
                  <ReadinessBadge entry={p.latestPolish} />
                  {p.latestPolish && !p.latestPolish?.audit?.aigcReadiness?.score ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/40 backdrop-blur-sm text-[10px] text-violet-50 border border-violet-300/30" title={t.dashMore.polishedNoScore}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {t.dashProjects.polished}
                    </div>
                  ) : null}
                  {/* Quick Polish — jump to Polish Studio with the existing script.
                      Only when the project already has a script, so empty projects are not a dead end. */}
                  {p.scriptData?.shots?.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/dashboard/polish?projectId=${encodeURIComponent(p.id)}`);
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8C547]/90 hover:bg-[#E8C547] text-black text-[10px] font-semibold shadow-lg shadow-black/30 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      title={t.dashProjects.polishTitle}
                    >
                      <Wand2 className="w-3 h-3" />
                      {t.dashProjects.polishBtn}
                    </button>
                  ) : null}
                </div>

                {/* Info — cinema readout */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="cinema-mono text-[9px] opacity-50 tracking-widest">
                      № {String(i + 1).padStart(3, '0')}
                    </span>
                    <span className="cinema-mono text-[9px] opacity-50">
                      {new Date(p.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '·')}
                    </span>
                  </div>
                  <h3 className="cinema-headline text-[14px] mb-1 truncate group-hover:text-[var(--cinema-amber)] transition-colors">{p.title}</h3>
                  <p className="cinema-subhead text-[11px] line-clamp-2 mb-2 leading-relaxed opacity-70">{p.description}</p>
                  {p.directorNotes?.overallScore && (
                    <div className="cinema-mono text-[10px] opacity-80 flex items-center justify-end gap-1">
                      <span className="opacity-50">SCORE</span>
                      <span className="text-[var(--cinema-amber)] font-semibold">{p.directorNotes.overallScore}</span>
                      <span className="opacity-40">/100</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * AIGC pipeline-readiness badge on the project card.
 *
 * Source: project.latestPolish.audit.aigcReadiness.score
 *   · no latestPolish or no score → do not render (null)
 *   · has a score → map via readinessLevel to red / amber / green
 *
 * Goal: in the project list, see at a glance which scripts have had a Pro check and at what band,
 * so the next polish / rerun priority is obvious.
 */
function ReadinessBadge({ entry }: { entry: any }) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const score = entry?.audit?.aigcReadiness?.score;
  if (typeof score !== 'number') return null;
  const lvl = readinessLevel(score);
  return (
    <div
      className="absolute bottom-2.5 right-11 flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 shadow-sm"
      title={t.dashMore.aigcReadiness.replace('{score}', String(score)).replace('{label}', lvl.label)}
    >
      <ScoreDonut score={score} size={26} thickness={2.6} showCenter={false} />
      <span className="cinema-mono text-[10px] tabular-nums font-semibold text-white/95 leading-none">
        {score}
      </span>
    </div>
  );
}

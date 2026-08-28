'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { BezelCard } from '@/components/ui/bezel-card';
// v8.3 P1: lucide → Phosphor (ultra-thin Light, weight per usage)
import { Sparkle, Kanban, Lightning, BookOpen, ArrowRight, Clock, FilmReel, TrendUp } from '@phosphor-icons/react';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useLocale } from '@/hooks/use-locale';
import { ContinueCard } from '@/components/dashboard/continue-card';
import { timeAgoZh } from '@/lib/relative-time';

export default function DashboardPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const [metrics, setMetrics] = useState({ projects: 0, generations: 0, cases: 0, uptime: 0 });
  const [generations, setGenerations] = useState<any[]>([]);

  useEffect(() => {
    api.metrics().then((d: any) => setMetrics(d)).catch(() => {});
    api.generations().then((d: any) => setGenerations(d.slice(0, 4))).catch(() => {});
  }, []);

  /**
   * v12.301: recent activity is **this user's real generation records**.
   * The generations API already filters by user_id, so records do not leak across users.
   * Status colors keep the original three-way meaning: success=green, in-progress=amber, failed=red.
   */
  const activity = generations.map((g: any, i: number) => {
    const st = String(g?.status || '');
    const ok = st === 'completed' || st === 'success';
    const failed = st === 'failed' || st === 'error';
    const label = String(g?.style || g?.prompt || t.dashMore.genTask).slice(0, 18);
    return {
      key: String(g?.id ?? i),
      text: `${label} · ${failed ? t.dashMore.genFailed : ok ? t.dashMore.genDone : t.profile.inProgress}`,
      time: timeAgoZh(g?.createdAt) || '',
      dot: failed ? 'bg-red-400' : ok ? 'bg-emerald-400' : 'bg-[#E8C547]',
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="mb-7 animate-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium tracking-wide">{t.dashboard.systemOnline}</span>
            </div>
            <h1 className="text-[2rem] font-extrabold text-white mb-1.5 tracking-tight leading-none">{t.dashboard.title}</h1>
            <p className="text-sm text-[var(--muted)]">{t.dashboard.subtitle}</p>
          </div>
          {/* v5.0: locale switcher */}
          <LocaleSwitcher />
        </div>
      </div>

      {/* v10.5.4 retention: continue-creating card — latest project + next-step hint; hidden when there are no projects */}
      <ContinueCard />

      {/* v8.3 P4: Asymmetric Bento — 12 columns, breaks the "three equal cards" AI-default layout.
          create hero spans 7×2 top-left; stats stack unevenly on the right; content/activity close 7/5. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min stagger">

        {/* 1. Create hero — lead card, two rows */}
        <Link
          href="/dashboard/create"
          className="group relative overflow-hidden rounded-[20px] p-7 flex flex-col justify-between min-h-[244px] lg:col-span-7 lg:row-span-2
                     border border-[#E8C547]/20 hover:border-[#E8C547]/45 transition-colors duration-300"
        >
          {/* Warm-gold radial glow + noise overlay */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_15%_0%,rgba(232,197,71,0.16),transparent_55%),radial-gradient(120%_120%_at_100%_100%,rgba(74,126,187,0.10),transparent_50%)]" />
          <div aria-hidden className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#E8C547]/10 blur-3xl group-hover:bg-[#E8C547]/16 transition-colors duration-500" />
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#E8C547] to-[#D4A830] grid place-items-center shadow-[0_8px_24px_-6px_rgba(232,197,71,0.5)] shrink-0">
              <Sparkle size={26} weight="duotone" className="text-[#0A0A0B]" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E8C547]/70">Studio · One idea → one film</span>
          </div>
          <div>
            <h2 className="text-2xl lg:text-[1.75rem] font-extrabold text-white tracking-tight leading-tight mb-2 text-balance">{t.dashboard.quickStartTitle}</h2>
            <p className="text-sm text-[var(--muted)] max-w-md leading-relaxed mb-5">{t.dashboard.quickStartSubtitle}</p>
            {/* nested CTA island */}
            <span className="cta cta--gold !text-[13px]">
              {t.dashboard.quickStartTitle}
              <span className="cta__island"><ArrowRight size={16} weight="bold" /></span>
            </span>
          </div>
        </Link>

        {/* 2. Primary stat — projects, right column row 1 */}
        <div className="lg:col-span-5 rounded-[20px] border border-[#E8C547]/14 bg-gradient-to-br from-[#E8C547]/12 to-transparent p-5 flex flex-col justify-between min-h-[114px]
                        hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--muted)] font-medium">{t.dashboard.statProjects}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8C547]/15 text-[#E8C547] grid place-items-center"><Kanban size={16} weight="duotone" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-[2.25rem] font-extrabold text-white tabular-nums leading-none">{metrics.projects}</strong>
            <small className="text-[var(--soft)] text-xs">{t.dashboard.statProjectsSub}</small>
          </div>
        </div>

        {/* 3. Secondary stats 2-up — generations + cases, right column row 2 */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="rounded-[20px] border border-pink-500/12 bg-gradient-to-br from-pink-500/12 to-transparent p-5 flex flex-col justify-between
                          hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-400 grid place-items-center mb-3"><Lightning size={16} weight="duotone" /></div>
            <strong className="text-[1.75rem] font-extrabold text-white tabular-nums leading-none">{metrics.generations}</strong>
            <small className="text-[var(--soft)] text-[11px] mt-1">{t.dashboard.statGenerations}</small>
          </div>
          <div className="rounded-[20px] border border-cyan-500/12 bg-gradient-to-br from-cyan-500/14 to-transparent p-5 flex flex-col justify-between
                          hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 grid place-items-center mb-3"><BookOpen size={16} weight="duotone" /></div>
            <strong className="text-[1.75rem] font-extrabold text-white tabular-nums leading-none">{metrics.cases}</strong>
            <small className="text-[var(--soft)] text-[11px] mt-1">{t.dashboard.statCases}</small>
          </div>
        </div>

        {/* 4. Recent Generations — col-span-7, true Double-Bezel */}
        <div className="lg:col-span-7">
          <BezelCard>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FilmReel size={16} weight="duotone" className="text-[#E8C547]" />
                <h3 className="font-semibold text-white">{t.dashboard.recentCreations}</h3>
              </div>
              <Link href="/dashboard/projects" className="text-xs text-[var(--muted)] hover:text-white transition-colors flex items-center gap-1">
                {t.common.viewAll} <ArrowRight size={12} weight="light" />
              </Link>
            </div>
            <div className="space-y-3 stagger">
              {generations.length > 0 ? generations.map((item) => (
                <div key={item.id} className="flex gap-3 items-center bg-[var(--surface)] hover:bg-[var(--surface-strong)] rounded-xl p-3 transition-all group cursor-pointer">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/20">
                    {item.resultUrls?.[0] ? (
                      <img loading="lazy" decoding="async" src={item.resultUrls[0]} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[var(--soft)]"><FilmReel size={20} weight="light" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-white truncate">{item.style || item.prompt?.slice(0, 20)}</h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{item.prompt}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        item.status === 'completed' ? 'badge-completed' : item.status === 'active' ? 'badge-active' : 'badge-draft'
                      }`}>{item.status === 'completed' ? t.dashboard.statusCompleted : item.status === 'active' ? t.dashboard.statusCreating : t.dashboard.statusDraft}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-[var(--soft)]">
                  <Sparkle size={32} weight="light" className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.dashboard.noRecords}</p>
                  <Link href="/dashboard/create" className="text-xs text-[#E8C547] hover:text-[#D4A830] mt-1 inline-block">{t.dashboard.startFirst}</Link>
                </div>
              )}
            </div>
          </BezelCard>
        </div>

        {/* 5. Activity & Status — col-span-5 closes the right column */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <TrendUp size={16} weight="duotone" className="text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">{t.dashboard.systemStatus}</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: t.dashMore.aiEngine, status: 'Claude 4 Opus + Veo 3.1', color: 'emerald' },
                { label: t.dashMore.imageGen, status: 'Midjourney v6.1 / Minimax', color: 'rose' },
                { label: t.product.videoGen, status: 'Google Veo 3.1', color: 'pink' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs text-[var(--muted)]">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${s.color}-400`} />
                    <span className="text-xs text-white font-medium">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} weight="duotone" className="text-amber-400" />
              <h3 className="font-semibold text-white text-sm">{t.dashboard.recentActivity}</h3>
            </div>
            <div className="space-y-2">
              {/*
                v12.301: this used to be **three hardcoded fake events** ("script split done 5 minutes ago", etc.) —
                every user, including brand-new accounts with zero jobs, saw the same copy,
                which wrecked product trust. Now it reads this user's real generation records (filtered by user_id).
                Empty state is honest instead of inventing three rows.
              */}
              {activity.length > 0 ? activity.map((a) => (
                <div key={a.key} className="flex items-start gap-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${a.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <span className="text-[13px] text-white">{a.text}</span>
                    <div className="text-[11px] text-[var(--soft)] mt-0.5">{a.time}</div>
                  </div>
                </div>
              )) : (
                <div className="py-4 text-center text-[12px] text-[var(--soft)]">
                  {t.dashMore.noActivity}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

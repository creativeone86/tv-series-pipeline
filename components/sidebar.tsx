'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  SquaresFour, Kanban, Sparkle, BookOpen, User,
  SignOut, CaretLeft, CaretRight, Package, PenNib, MagicWand, FilmReel, CreditCard, Scroll, Palette, UsersThree, Pulse, Lightning, ChartLineUp, Stack, Queue, FilmSlate,
  Storefront, FlowArrow, Brain, UserCircle, MusicNotes, GridFour, ChatText,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/dashboard', label: t.sidebar.overview, icon: SquaresFour },
    { href: '/dashboard/projects', label: t.sidebar.myProjects, icon: Kanban },
    { href: '/dashboard/create', label: t.sidebar.workshop, icon: Sparkle },
    { href: '/dashboard/short-video', label: t.sidebar.shortVideo, icon: Lightning },
    { href: '/dashboard/story-intake', label: t.sidebar.storyIntake, icon: Scroll },
    { href: '/dashboard/series', label: t.sidebar.series, icon: FilmSlate },
    { href: '/dashboard/polish', label: t.sidebar.polish, icon: MagicWand },
    { href: '/dashboard/u2v', label: t.sidebar.u2v, icon: FilmReel },
    { href: '/dashboard/mv', label: t.sidebar.mv, icon: MusicNotes },
    { href: '/dashboard/comic', label: t.sidebar.comic, icon: GridFour },
    { href: '/dashboard/edit-chat', label: t.sidebar.editChat, icon: ChatText },
    { href: '/dashboard/assets', label: t.sidebar.assets, icon: Package },
    { href: '/dashboard/characters', label: t.sidebar.characters, icon: UserCircle },
    { href: '/cameo-market', label: t.sidebar.ipMarket, icon: Storefront },
    { href: '/workflow-studio', label: t.sidebar.workflows, icon: FlowArrow },
    { href: '/dashboard/master-prompt', label: t.sidebar.masterPrompt, icon: Brain },
    { href: '/dashboard/styles', label: t.sidebar.styles, icon: Palette },
    { href: '/dashboard/cases', label: t.sidebar.cases, icon: BookOpen },
    { href: '/dashboard/templates', label: t.sidebar.templates, icon: Stack },
    { href: '/dashboard/profile', label: t.sidebar.account, icon: User },
    { href: '/dashboard/team', label: t.sidebar.team, icon: UsersThree },
    { href: '/dashboard/health', label: t.sidebar.health, icon: Pulse },
    { href: '/dashboard/usage', label: t.sidebar.usage, icon: ChartLineUp },
    { href: '/dashboard/jobs', label: t.sidebar.jobs, icon: Queue },
    { href: '/dashboard/billing', label: t.sidebar.billing, icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside
      className={`relative flex flex-col min-h-screen shrink-0 border-r border-[var(--border)] transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-[220px]'
      }`}
      style={{ background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(48px) saturate(1.2)' }}
    >
      <Link
        href="/"
        title={t.sidebar.backHome}
        className={`flex items-center gap-3 pt-5 pb-3 transition-opacity hover:opacity-80 ${collapsed ? 'justify-center px-3' : 'px-5'}`}
      >
        <div className="w-7 h-7 rounded-md grid place-items-center shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8C547] to-[#D4A830]" />
          <PenNib size={14} weight="duotone" className="text-[#0C0C0C] relative z-10" />
        </div>
        {!collapsed && (
          <span className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-[var(--text)]">{t.brand.studio}</span>
          </span>
        )}
      </Link>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        title={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        className="absolute -right-3 top-[60px] w-5 h-5 rounded-full bg-[var(--background-elevated)] border border-[var(--border)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-all z-10"
      >
        {collapsed ? <CaretRight size={10} weight="bold" /> : <CaretLeft size={10} weight="bold" />}
      </button>

      <div className="mx-4 h-px bg-[var(--border)] mb-1" />

      <nav className="flex flex-col gap-1 px-2.5 py-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} weight={isActive ? 'duotone' : 'light'} className={`shrink-0 transition-colors ${isActive ? 'text-[#E8C547]' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`px-2.5 pb-3 ${collapsed ? 'flex flex-col items-center gap-2' : 'flex flex-col gap-2'}`}>
        {user && !collapsed && (
          <div className="flex gap-2.5 items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <img loading="lazy" decoding="async" src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-[12px] truncate text-[var(--text)]">{user.name}</div>
              <div className="text-[10px] text-[var(--soft)] truncate">{user.email}</div>
            </div>
          </div>
        )}
        {user && collapsed && (
          <div className="p-1" title={user.name}>
            <img loading="lazy" decoding="async" src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--border)]" />
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 text-[12px] text-[var(--soft)] hover:text-[var(--muted)] transition-colors rounded-md hover:bg-[var(--surface)] ${
            collapsed ? 'p-2 justify-center' : 'px-3 py-1.5'
          }`}
          title={collapsed ? t.sidebar.logout : undefined}
        >
          <SignOut size={14} weight="light" />
          {!collapsed && <span>{t.sidebar.logout}</span>}
        </button>
      </div>
    </aside>
  );
}

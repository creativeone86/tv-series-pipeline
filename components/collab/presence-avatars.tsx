'use client';

/**
 * v3.0 P0.2 — PresenceAvatars: who is viewing this project right now.
 *
 * Uses Yjs awareness:
 *   - local setLocalStateField('user', {id, name, avatarUrl, color})
 *   - on awareness change → list all state.user
 *   - user leaves (close tab / network) → awareness times out after 30s, avatar gone
 *
 * Display:
 *   - at most 5 avatars in a row, then "+N"
 *   - self gets a blue border
 *   - hover shows the name
 */

import { useEffect, useState } from 'react';
import { useYjs } from '@/hooks/use-yjs';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

interface PresenceUser {
  clientId: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  /** v3.1.3 P3: tab the user is on (script/characters/.../comments). Undefined if unset. */
  activeTab?: string;
}

const AVATAR_COLORS = [
  '#E8C547', '#4DE0C2', '#F472B6', '#A78BFA',
  '#FB7185', '#34D399', '#60A5FA', '#FBBF24',
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export interface PresenceAvatarsProps {
  projectId: string;
  currentUser: { id: string; name: string; avatarUrl: string | null };
  /** v3.1.3 P3: current user's active tab key — written to awareness so others can see */
  activeTab?: string;
  maxVisible?: number;
}

function tabLabelOf(tab: string, t: Translations): string {
  const map: Record<string, string> = {
    script: t.product.tabScript,
    characters: t.product.tabCharacters,
    scenes: t.product.tabScenes,
    storyboard: t.product.tabStoryboard,
    videos: t.product.tabVideos,
    workshop: t.product.tabWorkshop,
    pacing: t.product.tabPacing,
    comments: t.product.tabComments,
    play: t.product.tabPlay,
    timeline: t.product.timeline,
  };
  return map[tab] || tab;
}

export function PresenceAvatars({ projectId, currentUser, activeTab, maxVisible = 5 }: PresenceAvatarsProps) {
  const { t } = useLocale();
  const yjs = useYjs(`project-${projectId}`);
  const [users, setUsers] = useState<PresenceUser[]>([]);

  // Set local awareness state
  useEffect(() => {
    if (!yjs) return;
    const aw = yjs.provider.awareness;
    aw.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      color: pickColor(currentUser.id),
    });
    return () => {
      // Clear self on unmount (avoid a ghost avatar hanging for 30s)
      aw.setLocalState(null);
    };
  }, [yjs, currentUser.id, currentUser.name, currentUser.avatarUrl]);

  // v3.1.3 P3: update awareness on tab change — others see "alice in Shot Workshop"
  useEffect(() => {
    if (!yjs || !activeTab) return;
    const aw = yjs.provider.awareness;
    aw.setLocalStateField('activeTab', activeTab);
  }, [yjs, activeTab]);

  // Listen for awareness changes
  useEffect(() => {
    if (!yjs) return;
    const aw = yjs.provider.awareness;
    const onChange = () => {
      const states = Array.from(aw.getStates().entries());
      const arr: PresenceUser[] = [];
      for (const [clientId, state] of states) {
        const user = (state as any)?.user;
        if (!user || !user.id) continue;
        const tabFromState = (state as any)?.activeTab;
        arr.push({
          clientId,
          id: String(user.id),
          name: String(user.name || t.sharedUi.anonymous),
          avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
          color: String(user.color || '#999'),
          activeTab: typeof tabFromState === 'string' ? tabFromState : undefined,
        });
      }
      // Same user on multiple clients (e.g. many tabs) counts as 1 — dedupe by id
      const seen = new Set<string>();
      const dedupe: PresenceUser[] = [];
      for (const u of arr) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        dedupe.push(u);
      }
      setUsers(dedupe);
    };
    aw.on('change', onChange);
    onChange();
    return () => aw.off('change', onChange);
  }, [yjs, t]);

  if (users.length === 0) return null;
  const visible = users.slice(0, maxVisible);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center -space-x-2" title={t.sharedUi.onlineN.replace('{n}', String(users.length))}>
      {visible.map((u) => {
        const isSelf = u.id === currentUser.id;
        const tabLabel = u.activeTab ? tabLabelOf(u.activeTab, t) : null;
        const tooltip = isSelf
          ? t.sharedUi.youTab.replace('{name}', u.name).replace('{tab}', tabLabel ? ` · ${tabLabel}` : '')
          : t.sharedUi.otherTab.replace('{name}', u.name).replace('{tab}', tabLabel ? ` · ${tabLabel}` : '');
        return (
          <div key={u.clientId} className="relative">
            <div
              className={`w-7 h-7 rounded-full border-2 grid place-items-center overflow-hidden ${
                isSelf ? 'border-[var(--cinema-amber)]' : 'border-[var(--cinema-surface)]'
              }`}
              style={{ background: u.color }}
              title={tooltip}
            >
              {u.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img loading="lazy" decoding="async" src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
              ) : (
                <span className="cinema-mono text-[10px] font-bold text-black">
                  {u.name.slice(0, 1)}
                </span>
              )}
            </div>
            {/* v3.1.3 P3: mini tab chip under the avatar — hide for self */}
            {!isSelf && tabLabel && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 cinema-mono text-[8px] px-1 py-0.5 rounded whitespace-nowrap pointer-events-none"
                style={{ background: u.color, color: '#000' }}
              >
                {tabLabel}
              </div>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-[var(--cinema-surface)] bg-black/60 grid place-items-center cinema-mono text-[10px]"
          title={t.sharedUi.morePeople.replace('{n}', String(overflow))}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

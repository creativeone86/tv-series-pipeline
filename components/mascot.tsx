'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

type MascotMood = 'idle' | 'waiting' | 'working' | 'completed' | 'error';

function quipPool(t: Translations, mood: Exclude<MascotMood, 'idle'> | 'working'): string[] {
  if (mood === 'waiting') {
    return [t.sharedUi.mascotWait1, t.sharedUi.mascotWait2, t.sharedUi.mascotWait3, t.sharedUi.mascotWait4, t.sharedUi.mascotWait5, t.sharedUi.mascotWait6, t.sharedUi.mascotWait7, t.sharedUi.mascotWait8, t.sharedUi.mascotWait9, t.sharedUi.mascotWait10];
  }
  if (mood === 'completed') {
    return [t.sharedUi.mascotDone1, t.sharedUi.mascotDone2, t.sharedUi.mascotDone3, t.sharedUi.mascotDone4, t.sharedUi.mascotDone5, t.sharedUi.mascotDone6];
  }
  if (mood === 'error') {
    return [t.sharedUi.mascotErr1, t.sharedUi.mascotErr2, t.sharedUi.mascotErr3, t.sharedUi.mascotErr4, t.sharedUi.mascotErr5];
  }
  return [t.sharedUi.mascotWork1, t.sharedUi.mascotWork2, t.sharedUi.mascotWork3, t.sharedUi.mascotWork4, t.sharedUi.mascotWork5, t.sharedUi.mascotWork6];
}

interface Props {
  mood?: MascotMood;
  className?: string;
}

export function Mascot({ mood = 'idle', className = '' }: Props) {
  const { t } = useLocale();
  const [quip, setQuip] = useState('');
  const [showQuip, setShowQuip] = useState(false);

  // Pop a quip on a timer based on mood
  useEffect(() => {
    if (mood === 'idle') { setShowQuip(false); return; }

    const pool = quipPool(t, mood);
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    setQuip(pick());
    setShowQuip(true);

    const interval = setInterval(() => {
      setQuip(pick());
      setShowQuip(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowQuip(false), 4000);
    }, mood === 'waiting' ? 15000 : 20000);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimer);
    };
  }, [mood, t]);

  const moodColors = {
    idle: '#a78bfa',
    waiting: '#fbbf24',
    working: '#34d399',
    completed: '#3b82f6',
    error: '#ef4444',
  };

  const color = moodColors[mood];

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Quip bubble — pops upward (2026-04) so OverallProgressBar does not cover it */}
      <AnimatePresence>
        {showQuip && quip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.9 }}
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-2xl bg-gradient-to-br from-[#E8C547] to-[#D4A830] border-2 border-white/30 text-xs font-medium text-white shadow-2xl z-[100] pointer-events-none"
            style={{
              boxShadow: '0 8px 32px rgba(232, 197, 71, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)',
            }}
          >
            {quip}
            {/* Little triangle pointing at the mascot below */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#E8C547] to-[#D4A830] border-r-2 border-b-2 border-white/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot — bear */}
      <motion.div
        animate={mood === 'working' ? { rotate: [0, -5, 5, -5, 0] } : mood === 'waiting' ? { y: [0, -3, 0] } : {}}
        transition={{ repeat: Infinity, duration: mood === 'working' ? 0.8 : 2.5 }}
        className="cursor-pointer relative"
        onClick={() => {
          const pool = quipPool(t, mood === 'idle' ? 'working' : mood);
          setQuip(pool[Math.floor(Math.random() * pool.length)]);
          setShowQuip(true);
          setTimeout(() => setShowQuip(false), 3000);
        }}
      >
        <img loading="lazy" decoding="async" src="/mascot-bear.svg" alt="mascot" width={44} height={44} className="rounded-xl" />
        {/* Mood ring */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0e14]"
          style={{ backgroundColor: color }}
        />
      </motion.div>
    </div>
  );
}

// ── Agent avatars ──
const AGENT_AVATAR_MAP: Record<string, string> = {
  director: '/avatars/beaver-crown.jpg',       // crowned beaver → director
  writer: '/avatars/beaver-happy.jpg',          // happy beaver → writer
  character_designer: '/avatars/frog-3d.jpg',   // 3D frog → character designer
  scene_designer: '/avatars/beaver-sleepy.jpg', // sleepy beaver → scene designer
  storyboard: '/avatars/frog-cartoon.jpg',      // cartoon frog → storyboard
  video_producer: '/avatars/frog-3d.jpg',       // 3D frog → video
  editor: '/avatars/beaver-crown.jpg',          // crowned beaver → editor
};

export function AgentAvatar({ role, size = 32 }: { role: string; size?: number }) {
  const src = AGENT_AVATAR_MAP[role] || '/avatars/beaver-happy.jpg';

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 border-2 border-white/10"
      style={{ width: size, height: size }}
    >
      <img loading="lazy" decoding="async" src={src} alt={role} className="w-full h-full object-cover" />
    </div>
  );
}

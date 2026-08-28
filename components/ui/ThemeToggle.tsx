'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import { useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useLayoutStore();
  const { t: loc } = useLocale();
  const t = loc as KitT;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={t.kitUi.toggleTheme}
      title={darkMode ? t.kitUi.switchToLight : t.kitUi.switchToDark}
    >
      {darkMode ? '🌙' : '☀️'}
    </button>
  );
}

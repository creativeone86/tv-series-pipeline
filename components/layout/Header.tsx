'use client';

import Link from 'next/link';
import { useLayoutStore } from '@/stores/layoutStore';
import ThemeToggle from '../ui/ThemeToggle';
import { useLocale } from '@/hooks/use-locale';

export default function Header() {
  const { toggleSidebar, togglePanel } = useLayoutStore();
  const { t } = useLocale();

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t.sidebar.expand}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" title={t.common.backHome} className="hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t.brand.studio}
          </h1>
        </Link>
      </div>

      {/* Center Section - Project Name */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={t.product.untitled}
          className="px-3 py-1 text-sm border-none bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          {t.common.save}
        </button>

        <button className="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors">
          {t.sharedUi.exportBtn}
        </button>

        <ThemeToggle />

        <button
          onClick={togglePanel}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t.sharedUi.toggleParams}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>

        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      </div>
    </header>
  );
}

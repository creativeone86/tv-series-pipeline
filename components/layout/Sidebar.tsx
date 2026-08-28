'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '@/hooks/use-locale';

interface SidebarProps {
  width: number;
}

export default function Sidebar({ width }: SidebarProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('text');

  const tools = [
    { id: 'text', icon: '📝', label: t.sharedUi.toolText },
    { id: 'image', icon: '🎨', label: t.sharedUi.toolImage },
    { id: 'video', icon: '🎬', label: t.sharedUi.toolVideo },
    { id: 'effect', icon: '✨', label: t.sharedUi.toolEffect },
    { id: 'assets', icon: '📦', label: t.sharedUi.toolAssets },
  ];

  return (
    <motion.div
      initial={{ x: -width }}
      animate={{ x: 0 }}
      exit={{ x: -width }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
      style={{ width }}
    >
      {/* Tool Tabs */}
      <div className="flex flex-col gap-2 p-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${activeTab === tool.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }
            `}
          >
            <span className="text-2xl">{tool.icon}</span>
            <span className="text-sm font-medium">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ToolContent activeTab={activeTab} />
      </div>
    </motion.div>
  );
}

function ToolContent({ activeTab }: { activeTab: string }) {
  const { t } = useLocale();
  const contentMap: Record<string, { title: string; description: string }> = {
    text: {
      title: t.sharedUi.toolText,
      description: t.sharedUi.toolTextDesc,
    },
    image: {
      title: t.sharedUi.toolImage,
      description: t.sharedUi.toolImageDesc,
    },
    video: {
      title: t.sharedUi.toolVideo,
      description: t.sharedUi.toolVideoDesc,
    },
    effect: {
      title: t.sharedUi.toolEffect,
      description: t.sharedUi.toolEffectDesc,
    },
    assets: {
      title: t.sharedUi.toolAssets,
      description: t.sharedUi.toolAssetsDesc,
    },
  };

  const content = contentMap[activeTab];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {content.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {content.description}
        </p>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-500 italic">
        {t.sharedUi.toolComingSoon}
      </div>
    </div>
  );
}

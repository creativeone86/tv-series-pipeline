'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

interface ParameterPanelProps {
  width: number;
}

export default function ParameterPanel({ width }: ParameterPanelProps) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('japanese');
  const [width_val, setWidthVal] = useState(1024);
  const [height_val, setHeightVal] = useState(1024);

  return (
    <motion.div
      initial={{ x: width }}
      animate={{ x: 0 }}
      exit={{ x: width }}
      className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
      style={{ width }}
    >
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.sharedUi.genParams}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t.sharedUi.promptLabel}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder={t.sharedUi.promptPlaceholder}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t.sharedUi.styleLabel}
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="japanese">{t.sharedUi.styleJapanese}</option>
            <option value="american">{t.sharedUi.styleAmerican}</option>
            <option value="chinese">{t.sharedUi.styleChinese}</option>
            <option value="webtoon">{t.sharedUi.styleWebtoon}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t.sharedUi.sizeLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={width_val}
              onChange={(e) => setWidthVal(Number(e.target.value))}
              placeholder={t.sharedUi.widthPh}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={height_val}
              onChange={(e) => setHeightVal(Number(e.target.value))}
              placeholder={t.sharedUi.heightPh}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
            {t.sharedUi.advanced}
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t.sharedUi.quality}
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>{t.sharedUi.qualityDraft}</option>
                <option>{t.sharedUi.qualityStd}</option>
                <option>{t.sharedUi.qualityHigh}</option>
              </select>
            </div>
          </div>
        </details>

        <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl">
          {t.sharedUi.generate}
        </button>
      </div>
    </motion.div>
  );
}

import MainLayout from '@/components/layout/MainLayout';
import { cookies } from 'next/headers';
import { getTranslations, normalizeLocale } from '@/lib/i18n';

export default async function StudioPage() {
  const jar = await cookies();
  const tRaw = getTranslations(normalizeLocale(jar.get('qfmj-locale')?.value));
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {ui.welcomeTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {ui.welcomeSubtitle}
          </p>
        </div>

        {/* Quick-start cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {ui.textGen}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {ui.textGenDesc}
            </p>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {t.home.heroCtaCreate}
            </button>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-6 rounded-lg border border-rose-200 dark:border-rose-800">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {ui.imageGen}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {ui.imageGenDesc}
            </p>
            <button className="text-sm text-[#E8C547] dark:text-[#E8C547] font-medium hover:underline">
              {t.home.heroCtaCreate}
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {ui.videoGen}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {ui.videoGenDesc}
            </p>
            <button className="text-sm text-green-600 dark:text-green-400 font-medium hover:underline">
              {t.home.heroCtaCreate}
            </button>
          </div>
        </div>

        {/* Recent projects */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {ui.recentProjects}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {ui.projectN.replace('{n}', String(i))}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ui.lastEditedHours.replace('{n}', '2')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

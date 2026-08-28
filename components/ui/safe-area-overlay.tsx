'use client';

import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

/**
 * SafeAreaOverlay (v10.6.0) — 9:16 caption / platform-UI safe-zone preview.
 *
 * Overlay on video/board preview (parent must be relative). Marks three danger
 * zones using common vertical-platform (Douyin / Kuaishou / TikTok) occlusion:
 *   - top ~10%: status bar + title / follow bar
 *   - right ~14%: like / comment / share column
 *   - bottom ~20%: caption burn-in + copy / action bar
 * The middle is the "safe belt". Display only (pointer-events-none), aria-hidden
 * (meaningless to screen readers).
 */
export function SafeAreaOverlay() {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const zone = 'absolute border border-dashed border-[#E8C547]/70 bg-[#E8C547]/10';
  const label = 'absolute text-[9px] font-mono tracking-wider text-[#E8C547] bg-black/55 px-1 py-0.5 rounded';
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-10">
      {/* Top: status bar / title */}
      <div className={`${zone} top-0 left-0 right-0 h-[10%]`} />
      <span className={`${label} top-1 left-1`}>{t.kitUi.safeTop}</span>
      {/* Right: action column */}
      <div className={`${zone} top-[10%] bottom-[20%] right-0 w-[14%]`} />
      <span className={`${label} top-[12%] right-1`}>{t.kitUi.safeSide}</span>
      {/* Bottom: captions + action bar */}
      <div className={`${zone} bottom-0 left-0 right-0 h-[20%]`} />
      <span className={`${label} bottom-1 left-1`}>{t.kitUi.safeBottom}</span>
      {/* Middle safe-belt outline */}
      <div className="absolute top-[10%] bottom-[20%] left-0 right-[14%] border border-emerald-400/50" />
      <span className={`${label} !text-emerald-300 top-[12%] left-1`}>{t.kitUi.safeBelt}</span>
    </div>
  );
}

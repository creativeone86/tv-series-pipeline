/**
 * Dashboard loading skeleton (v10.2.1) — shown when entering / switching dashboard segments, to reduce blank-page flash.
 */
export default function DashboardLoading() {
  return (
    <div className="px-[5vw] py-6 animate-pulse" aria-hidden="true">
      <div className="h-8 w-48 rounded bg-white/5 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white/[0.04] border border-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

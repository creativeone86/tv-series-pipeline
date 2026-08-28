'use client';

/**
 * v6.1.3 — pre-generate readiness preview. Live score + checklist as idea / refs
 * change, so the user can fill gaps before "Start creating". Pure logic lives in
 * lib/prompt-readiness (unit-tested); this file assembles data + UI.
 * Reuses: lib/prompt-ide compilePrompt (@ mentions) + cameo-vision try-on score.
 */

import { useEffect, useState } from 'react';
import { CheckCircle as CheckCircle2, Circle, Gauge } from '@phosphor-icons/react';
import { compilePrompt, type MentionableAsset } from '@/lib/prompt-ide';
import { summarizeRefs, type ReferenceAsset } from '@/lib/multimodal-ref';
import { assessPromptReadiness } from '@/lib/prompt-readiness';
import { useLocale } from '@/hooks/use-locale';

export function PromptReadiness({
  idea,
  hasFace,
  cameoScore,
  refs,
}: {
  idea: string;
  hasFace: boolean;
  cameoScore?: number | null;
  refs: ReferenceAsset[];
}) {
  const { t } = useLocale();
  const [assets, setAssets] = useState<MentionableAsset[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/prompt-ide/assets')
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d?.assets)) setAssets(d.assets); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!(idea || '').trim()) return null; // hide when the idea is empty

  const compiled = compilePrompt(idea, assets);
  const report = assessPromptReadiness({
    compiledPrompt: compiled.prompt,
    usedKinds: compiled.used.map((a) => a.kind),
    unresolvedCount: compiled.unresolved.length,
    hasFace,
    refs: summarizeRefs(refs),
    cameoScore: cameoScore ?? null,
  });

  const color = report.level === 'high' ? 'text-emerald-400' : report.level === 'mid' ? 'text-amber-400' : 'text-rose-400';
  const ring = report.level === 'high' ? 'border-emerald-500/40' : report.level === 'mid' ? 'border-amber-500/40' : 'border-rose-500/40';
  const blurb = report.level === 'high' ? t.sharedUi.readinessHigh : report.level === 'mid' ? t.sharedUi.readinessMid : t.sharedUi.readinessLow;

  return (
    <div className={`rounded-2xl border ${ring} bg-white/[0.03] p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full border-2 ${ring} flex items-center justify-center text-lg ${color} font-bold shrink-0`}>
          {report.score}
        </div>
        <div>
          <p className="text-sm font-medium text-white flex items-center gap-1.5"><Gauge className="w-4 h-4" />{t.sharedUi.genReadiness}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{blurb}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {report.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-[12px]">
            {c.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              : <Circle className="w-3.5 h-3.5 text-gray-600 mt-0.5 shrink-0" />}
            <span className={c.ok ? 'text-gray-300' : 'text-gray-400'}>
              {c.label}
              {!c.ok && c.hint ? <span className="text-gray-500"> — {c.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

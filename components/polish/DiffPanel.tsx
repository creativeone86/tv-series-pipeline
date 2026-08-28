'use client';

/**
 * DiffPanel — side-by-side original vs polished comparison.
 *
 * Why a separate component:
 *   The polish page is already long; extracting diff rendering + a compact
 *   status bar makes reuse easier (e.g. project detail "what last polish changed").
 *
 * Render rules:
 *   - same   → both columns show the same line, muted gray
 *   - mod    → left red (old) + right green (new), same visual row
 *   - del    → left only; right is a blank placeholder
 *   - add    → right only; left is a blank placeholder
 *
 * CSS grid-cols-2 keeps columns aligned; cells are tinted with a left color bar
 * (GitHub/GitLab-style diff panel).
 */

import { useMemo } from 'react';
import { diffLines, diffStats, type DiffRow } from '@/lib/text-diff';
import { useLocale } from '@/hooks/use-locale';

export default function DiffPanel({
  before, after, maxHeight = '60vh',
}: {
  before: string;
  after: string;
  maxHeight?: string;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const rows = useMemo(() => diffLines(before, after), [before, after]);
  const stats = useMemo(() => diffStats(rows), [rows]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/25 overflow-hidden">
      {/* Status bar: change stats */}
      <div className="px-3 py-2 bg-black/30 border-b border-[var(--border)] flex items-center gap-3 text-[11px] flex-wrap">
        <span className="text-white/45 tracking-wider uppercase">Diff</span>
        <span className="text-emerald-300 font-mono tabular-nums">+ {stats.add + stats.mod}</span>
        <span className="text-rose-300 font-mono tabular-nums">− {stats.del + stats.mod}</span>
        <span className="text-white/45 font-mono tabular-nums">= {stats.same}</span>
        <span className="ml-auto text-white/40">
          {t.polishUi.changeRate} <span className="font-mono text-white/70">{Math.round(stats.changeRatio * 100)}%</span>
          {' · '}
          {t.polishUi.totalLinesBefore}<span className="font-mono text-white/70">{stats.total}</span>{t.polishUi.totalLinesAfter}
        </span>
      </div>

      {/* Diff body */}
      <div
        className="overflow-auto font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12.5px] leading-relaxed"
        style={{ maxHeight }}
      >
        <div className="grid grid-cols-[1fr_1fr] min-w-full">
          {/* Sticky column headers */}
          <div className="sticky top-0 z-10 px-3 py-1.5 bg-black/50 backdrop-blur border-b border-white/10 text-[10px] tracking-widest uppercase text-white/45">
            {t.polishUi.original}
          </div>
          <div className="sticky top-0 z-10 px-3 py-1.5 bg-black/50 backdrop-blur border-b border-white/10 border-l border-l-white/10 text-[10px] tracking-widest uppercase text-white/45">
            {t.polishUi.polishedAfter}
          </div>

          {rows.map((r, idx) => (
            <DiffRowView key={idx} row={r} />
          ))}

          {rows.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-white/40 text-[12px]">
              {t.polishUi.noDiff}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  // Color scheme, after GitHub diff:
  //   same → neutral gray
  //   del  → left red (#f85149-ish), right empty
  //   add  → left empty, right green (#3fb950-ish)
  //   mod  → left red + right green, same visual row
  if (row.kind === 'same') {
    return (
      <>
        <LineCell tone="neutral" text={row.text} />
        <LineCell tone="neutral" text={row.text} borderLeft />
      </>
    );
  }
  if (row.kind === 'del') {
    return (
      <>
        <LineCell tone="del" text={row.text} sign="−" />
        <LineCell tone="empty" text="" borderLeft />
      </>
    );
  }
  if (row.kind === 'add') {
    return (
      <>
        <LineCell tone="empty" text="" />
        <LineCell tone="add" text={row.text} sign="+" borderLeft />
      </>
    );
  }
  // mod
  return (
    <>
      <LineCell tone="del" text={row.left} sign="−" />
      <LineCell tone="add" text={row.right} sign="+" borderLeft />
    </>
  );
}

function LineCell({
  tone, text, sign, borderLeft,
}: {
  tone: 'neutral' | 'del' | 'add' | 'empty';
  text: string;
  sign?: '+' | '−';
  borderLeft?: boolean;
}) {
  const base = 'px-3 py-1 whitespace-pre-wrap break-words';
  const toneClass =
    tone === 'del'
      ? 'bg-rose-500/10 text-rose-100 border-l-2 border-l-rose-400/60'
      : tone === 'add'
        ? 'bg-emerald-500/10 text-emerald-100 border-l-2 border-l-emerald-400/60'
        : tone === 'empty'
          ? 'bg-white/[0.02] text-white/25'
          : 'text-white/75';
  const vertDivider = borderLeft ? 'border-l border-l-white/5' : '';
  return (
    <div className={`${base} ${toneClass} ${vertDivider}`}>
      {sign ? (
        <span className={`inline-block w-3 mr-1 font-bold opacity-70 select-none ${
          sign === '+' ? 'text-emerald-300' : 'text-rose-300'
        }`}>{sign}</span>
      ) : tone === 'neutral' ? (
        <span className="inline-block w-3 mr-1 opacity-30 select-none">·</span>
      ) : (
        <span className="inline-block w-3 mr-1 select-none">{' '}</span>
      )}
      {text || (tone === 'empty' ? '\u00A0' : '')}
    </div>
  );
}

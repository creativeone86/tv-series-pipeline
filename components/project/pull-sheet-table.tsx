'use client';

/**
 * PullSheetTable (v11.1.0) — pull sheet (project page "Pull" tab).
 *
 * Five per-shot columns: narrative / time / camera language / image treatment / sound (+ narrative function).
 * Data = factory pipeline truth (ScriptShot v2.8 camera fields), not AI guessing from frames;
 * missing fields show as —. CSV export uses the same API (?format=csv).
 */
import { useCallback, useEffect, useState } from 'react';
import { DownloadSimple, FilmSlate, CircleNotch, LinkSimple } from '@phosphor-icons/react';
import type { PullSheet, PullSheetShot } from '@/lib/pull-sheet';
import { getToken } from '@/lib/auth';
import { ReplicateWorkbench } from './replicate-workbench';
import { useLocale } from '@/hooks/use-locale';

interface ExternalSheetRow { id: string; name: string; createdAt: string; sheet: PullSheet & { labeledShots?: number; truncated?: boolean } }

const SOURCE_BADGE_CLS: Record<string, string> = {
  factory: 'text-emerald-300 border-emerald-500/30',
  vision: 'text-sky-300 border-sky-500/30',
  skeleton: 'text-white/50 border-white/15',
};

const GROUP_DEFS: Array<{ titleKey: string; rows: Array<{ key: keyof PullSheetShot; labelKey: string }> }> = [
  {
    titleKey: 'groupNarrative',
    rows: [
      { key: 'scene', labelKey: 'fieldScene' },
      { key: 'characters', labelKey: 'fieldCharacters' },
      { key: 'dialogue', labelKey: 'fieldDialogue' },
    ],
  },
  {
    titleKey: 'groupTime',
    rows: [
      { key: 'durationSec', labelKey: 'fieldDuration' },
      { key: 'startSec', labelKey: 'fieldStart' },
      { key: 'endSec', labelKey: 'fieldEnd' },
    ],
  },
  {
    titleKey: 'groupCamera',
    rows: [
      { key: 'shotSize', labelKey: 'fieldShotSize' },
      { key: 'composition', labelKey: 'fieldComposition' },
      { key: 'cameraMovement', labelKey: 'fieldCameraMove' },
      { key: 'lens', labelKey: 'fieldLens' },
    ],
  },
  {
    titleKey: 'groupImage',
    rows: [
      { key: 'lightingIntent', labelKey: 'fieldLighting' },
      { key: 'editPattern', labelKey: 'fieldEdit' },
    ],
  },
  {
    titleKey: 'groupSound',
    rows: [
      { key: 'scoreMood', labelKey: 'fieldScoreMood' },
      { key: 'soundDesign', labelKey: 'fieldSoundDesign' },
      { key: 'storyBeat', labelKey: 'fieldStoryBeat' },
      { key: 'whyThisChoice', labelKey: 'fieldWhyChoice' },
    ],
  },
];

function cell(v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.join('、') : '—';
  if (typeof v === 'number') {
    // Time columns: seconds, millisecond-readable (matches pull-sheet convention)
    return `${v}s`;
  }
  const s = typeof v === 'string' ? v.trim() : '';
  return s || '—';
}

function sourceBadgeLabel(source: string, pt: Record<string, string>): string {
  if (source === 'factory') return pt.sourceFactory;
  if (source === 'vision') return pt.sourceVision;
  return pt.sourceSkeleton;
}

function fieldLabel(labelKey: string, t: { visionAudit: { dimScene: string; dimComposition: string }; product: { statCast: string }; projectTools: Record<string, string> }): string {
  if (labelKey === 'fieldScene') return t.visionAudit.dimScene;
  if (labelKey === 'fieldCharacters') return t.product.statCast;
  if (labelKey === 'fieldComposition') return t.visionAudit.dimComposition;
  return t.projectTools[labelKey];
}

export function PullSheetTable({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [importMsg, setImportMsg] = useState('');
  // v12.159: after import, one-tap re-render of shots whose visual fields changed
  const [affectedShots, setAffectedShots] = useState<number[]>([]);
  const [rerenderBusy, setRerenderBusy] = useState(false);
  const rerenderAffected = async () => {
    if (rerenderBusy || affectedShots.length === 0) return;
    setRerenderBusy(true);
    let ok = 0;
    for (const sn of affectedShots) {
      setImportMsg(pt.rerenderShotProgress.replace('{shot}', String(sn)).replace('{ok}', String(ok + 1)).replace('{n}', String(affectedShots.length)));
      try {
        const res = await fetch('/api/regenerate-shot', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, shotNumber: sn }),
        });
        await new Response(res.body).text(); // drain SSE until done
        ok++;
      } catch { /* keep going if one shot fails */ }
    }
    setImportMsg(pt.rerenderDone.replace('{ok}', String(ok)).replace('{n}', String(affectedShots.length)));
    setAffectedShots([]);
    setRerenderBusy(false);
    void load();
  };
  const [sheet, setSheet] = useState<PullSheet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet`);
      if (res.ok) setSheet(await res.json());
    } catch { /* non-critical path */ }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="cinema-card-hi p-6 text-center cinema-mono text-[11px] opacity-50">{pt.generatingSheet}</div>;
  }
  if (!sheet || sheet.shots.length === 0) {
    return (
      <div className="cinema-card-hi p-6 text-center cinema-mono text-[11px] opacity-50">
        {pt.noShotData}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="pull-sheet">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="cinema-eyebrow flex items-center gap-1.5"><FilmSlate className="w-3.5 h-3.5" />{pt.pullAnalysis}</div>
          <p className="cinema-mono text-[10px] opacity-50 mt-0.5">
            {pt.sheetMeta.replace('{n}', String(sheet.shotCount)).replace('{sec}', String(sheet.totalDurationSec))}
          </p>
        </div>
        <a
          href={`/api/projects/${encodeURIComponent(projectId)}/pull-sheet?format=csv`}
          className="cinema-btn !px-2.5 !py-1.5 !text-[11px] inline-flex items-center gap-1.5"
          download
        >
          <DownloadSimple className="w-3.5 h-3.5" />{pt.exportCsv}
        </a>
        {/* v12.152: offline script-book export (Markdown / PDF, zero image-gen API) */}
        <a
          href={`/api/projects/${encodeURIComponent(projectId)}/pull-sheet?format=md`}
          className="cinema-btn-ghost !text-[11px] !py-1 inline-flex items-center gap-1.5"
          download
        >
          <DownloadSimple className="w-3.5 h-3.5" />{pt.scriptBookMd}
        </a>
        <a
          href={`/api/projects/${encodeURIComponent(projectId)}/pull-sheet?format=pdf`}
          className="cinema-btn-ghost !text-[11px] !py-1 inline-flex items-center gap-1.5"
          download
        >
          <DownloadSimple className="w-3.5 h-3.5" />{pt.scriptBookPdf}
        </a>
        {/* v12.154: board-sheet import — export CSV → edit in Excel → POST merge back into the script */}
        <label className="cinema-btn-ghost !text-[11px] !py-1 inline-flex items-center gap-1.5 cursor-pointer">
          ⤴️ {pt.importCsv}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setImportMsg(pt.importing);
              try {
                const csv = await file.text();
                const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet/import`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }),
                });
                const d = await res.json();
                if (!res.ok) { setImportMsg(pt.importFailed.replace('{msg}', d.message || String(res.status))); return; }
                const parts = [pt.importApplied.replace('{n}', String(d.applied)).replace('{rows}', String(d.rowsParsed))];
                if (d.unknownShots?.length) parts.push(pt.unknownShotsSkipped.replace('{list}', d.unknownShots.join(',')));
                if (d.badLines) parts.push(pt.badLines.replace('{n}', String(d.badLines)));
                setImportMsg(parts.join(';'));
                setAffectedShots(Array.isArray(d.affectedShots) ? d.affectedShots : []); // v12.159
                if (d.applied > 0) void load(); // reload table with new values
              } catch { setImportMsg(pt.importNetworkFail); }
            }}
          />
        </label>
        {importMsg && <span className="cinema-mono text-[10px] opacity-70">{importMsg}</span>}
        {/* v12.159: shots whose visual fields changed — one-tap re-render from the new script (real per-shot video cost; click as needed) */}
        {affectedShots.length > 0 && (
          <button
            type="button"
            disabled={rerenderBusy}
            onClick={() => void rerenderAffected()}
            className="cinema-btn-ghost !text-[11px] !py-1 !text-[var(--cinema-amber)] !border-[var(--cinema-amber-deep)] disabled:opacity-50"
          >
            {rerenderBusy ? pt.rerendering : pt.rerenderAffected.replace('{n}', String(affectedShots.length)).replace('{list}', affectedShots.join('、S'))}
          </button>
        )}
      </div>

      <SheetView sheet={sheet} />

      {/* v11.1.2 — Replicate / replace workbench (this project's factory sheet) */}
      <ReplicateWorkbench projectId={projectId} sheetSource="factory" />

      {/* v11.1.1 — External reference split + pull sheet */}
      <ExternalPullSection projectId={projectId} />
    </div>
  );
}

function SheetView({ sheet }: { sheet: PullSheet }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  return (
    <div className="space-y-4">
      {sheet.shots.map((s) => (
        <div key={s.shotNumber} className="cinema-card-hi p-4">
          <div className="flex gap-4">
            {/* Left: thumb + shot number + picture content */}
            <div className="w-44 shrink-0">
              {s.videoUrl ? (
                <video src={s.videoUrl} poster={s.thumbnail || undefined} controls preload="metadata"
                  className="w-full aspect-video object-cover rounded-md border border-[var(--cinema-border)] bg-black" />
              ) : s.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.thumbnail} alt={pt.shotBoardAlt.replace('{n}', String(s.shotNumber))}
                  className="w-full aspect-video object-cover rounded-md border border-[var(--cinema-border)]" loading="lazy" />
              ) : (
                <div className="w-full aspect-video rounded-md border border-[var(--cinema-border)] bg-black/30 flex items-center justify-center cinema-mono text-[10px] opacity-40">{pt.noFrame}</div>
              )}
              <div className="cinema-headline text-sm mt-2">{t.product.shotN.replace('{n}', String(s.shotNumber))}</div>
              <p className="text-[11px] text-[var(--cinema-text-3)] mt-1 leading-relaxed">{cell(s.description)}</p>
            </div>

            {/* Right: five columns */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-x-5 gap-y-3 min-w-0">
              {GROUP_DEFS.map((g) => (
                <div key={g.titleKey} className="min-w-0">
                  <div className="cinema-eyebrow !text-[9px] mb-1.5 border-b border-[var(--cinema-border)] pb-1">{pt[g.titleKey]}</div>
                  <dl className="space-y-1.5">
                    {g.rows.map((r) => (
                      <div key={String(r.key)}>
                        <dt className="cinema-mono text-[9px] opacity-45">{fieldLabel(r.labelKey, t)}</dt>
                        <dd className="text-[11px] text-[var(--cinema-text-2)] leading-snug break-words">{cell(s[r.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExternalPullSection({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [sheets, setSheets] = useState<ExternalSheetRow[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet?external=1`);
      if (res.ok) setSheets((await res.json()).sheets || []);
    } catch { /* non-critical path */ }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    const videoUrl = url.trim();
    if (!videoUrl) return;
    setBusy(true); setNotice('');
    try {
      const tok = getToken();
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
        body: JSON.stringify({ videoUrl }),
      });
      const b = await res.json();
      if (res.ok) {
        setNotice(b.queued
          ? pt.queuedSplit.replace('{id}', String(b.jobId))
          : pt.splitDone.replace('{n}', String(b.done?.shots ?? 0)).replace('{extra}', b.done?.labeled ? pt.visionLabeled.replace('{n}', String(b.done.labeled)) : pt.skeletonTable));
        setUrl('');
        await refresh();
      } else setNotice(b.message || pt.splitFailed);
    } catch { setNotice(pt.splitFailed); }
    finally { setBusy(false); }
  };

  return (
    <div className="cinema-card-hi p-4 mt-6" data-testid="external-pull">
      <div className="cinema-eyebrow mb-1">{pt.externalTitle}</div>
      <p className="cinema-mono text-[10px] opacity-50 mb-3">
        {pt.externalHint}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <LinkSimple className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={pt.urlPlaceholder}
          aria-label={pt.externalUrlAria}
          className="cinema-input flex-1 min-w-[240px] !text-[12px]"
        />
        <button onClick={submit} disabled={busy || !url.trim()} className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50">
          {busy ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <FilmSlate className="w-3.5 h-3.5" />}{pt.pullAction}
        </button>
        <button onClick={refresh} className="cinema-btn !px-2.5 !py-1.5 !text-[11px]">{pt.refresh}</button>
      </div>
      {notice && <p className="mt-2 text-[11px] text-[var(--cinema-amber)]" role="status">{notice}</p>}

      {sheets.length > 0 && (
        <div className="mt-4 space-y-3">
          {sheets.map((row) => {
            const cls = SOURCE_BADGE_CLS[row.sheet.source] || SOURCE_BADGE_CLS.skeleton;
            const isOpen = expanded === row.id;
            return (
              <div key={row.id}>
                <button onClick={() => setExpanded(isOpen ? null : row.id)}
                  className="w-full flex items-center gap-2 text-left text-[12px] text-white/80 py-1.5">
                  <span className="font-medium">{row.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] border ${cls}`}>{sourceBadgeLabel(row.sheet.source, pt)}</span>
                  <span className="cinema-mono text-[10px] opacity-45">
                    {pt.sheetShotsMeta.replace('{n}', String(row.sheet.shotCount)).replace('{sec}', String(row.sheet.totalDurationSec))}{row.sheet.truncated ? pt.truncated : ''}
                  </span>
                  <span className="ml-auto text-[10px] text-white/40">{isOpen ? pt.collapse : pt.expand}</span>
                </button>
                {isOpen && <><SheetView sheet={row.sheet} /><ReplicateWorkbench projectId={projectId} sheetSource={row.id} /></>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

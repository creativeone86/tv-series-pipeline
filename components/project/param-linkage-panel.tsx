'use client';

/**
 * components/project/param-linkage-panel (v8.2) — param linkage / JSON↔visual sync
 * (CineMatrix "Parameter Linkage / JSON to Visual Sync").
 *
 * Project structured params (per-shot ShotSpec + continuity + format) as editable
 * JSON; validate then write back (Sync Now).
 * Top diagram: timeline ↔ shot card ↔ params, live sync + last-sync time.
 */

import { useMemo, useState } from 'react';
import { BracketsCurly as Braces, ArrowsClockwise as RefreshCw, Check, WarningCircle as AlertCircle, CircleNotch as Loader2, GitDiff as GitCompareArrows } from '@phosphor-icons/react';
import {
  buildParamDoc, paramDocToJson, parseParamDoc, diffParamDoc, type ParamDoc,
} from '@/lib/param-linkage';
import { useLocale } from '@/hooks/use-locale';

export function ParamLinkagePanel({ projectId, shots = [], continuity, format, onSynced }: {
  projectId: string;
  shots?: { shotNumber: number; cameraSpec?: any }[];
  continuity?: any;
  format?: any;
  onSynced?: (doc: ParamDoc) => void;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const initial = useMemo(() => buildParamDoc({ shots, continuity, format }), [shots, continuity, format]);
  const [baseDoc, setBaseDoc] = useState<ParamDoc>(initial);
  const [text, setText] = useState<string>(() => paramDocToJson(initial));
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(t.projectMisc.neverSynced);
  const [msg, setMsg] = useState('');

  const parsed = useMemo(() => parseParamDoc(text), [text]);
  const diff = useMemo(() => (parsed.ok && parsed.doc ? diffParamDoc(baseDoc, parsed.doc) : null), [parsed, baseDoc]);
  const nodeNames = [t.product.timeline, t.projectMisc.shotCard, t.projectMisc.params];

  async function sync() {
    if (!parsed.ok || !parsed.doc) return;
    setSyncing(true); setMsg('');
    try {
      const r = await fetch(`/api/projects/${projectId}/param-sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc: parsed.doc }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(j?.error || t.projectMisc.syncFailedStatus.replace('{status}', String(r.status))); }
      else {
        setBaseDoc(parsed.doc);
        setText(paramDocToJson(parsed.doc));
        setLastSync(new Date().toLocaleTimeString());
        setMsg(t.projectMisc.syncedMsg.replace('{n}', String(j.syncedShots ?? 0)));
        onSynced?.(parsed.doc);
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (e: any) { setMsg(e?.message || t.auth.waitlistNetworkError); }
    finally { setSyncing(false); }
  }

  const dirty = !!diff && diff.total > 0;
  const pendingBits = diff && diff.total > 0
    ? ` · ${t.projectMisc.pendingSyncShots.replace('{n}', String(diff.changedShots.length))}${diff.formatChanged ? t.projectMisc.plusFormat : ''}${diff.continuityChanged ? t.projectMisc.plusContinuity : ''}${t.projectMisc.pendingSyncSuffix}`
    : '';

  return (
    <div className="flex flex-col gap-4">
      {/* Linkage diagram */}
      <div className="cinema-card !p-4">
        <div className="cinema-eyebrow mb-3 flex items-center gap-1.5"><GitCompareArrows size={13} className="text-[var(--primary)]" /> {t.projectMisc.paramLinkageTitle}</div>
        <div className="flex items-center justify-center gap-3 py-2">
          {nodeNames.map((n, i) => (
            <div key={n} className="flex items-center gap-3">
              <div className="rounded-lg border border-[var(--border)] px-3 py-2 text-center min-w-[72px]">
                <div className="text-[11px] font-semibold">{n}</div>
                <div className="cinema-mono text-[9px] opacity-50">{['TIMELINE', 'SHOT CARD', 'PARAMS'][i]}</div>
              </div>
              {i < 2 && <span className="text-[var(--primary)] text-lg leading-none">⇌</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${dirty ? 'bg-[var(--secondary)]' : 'bg-[var(--accent-green)]'} ${dirty ? '' : 'animate-pulse'}`} />
          <span className="cinema-mono text-[10px] opacity-70">{dirty ? t.projectMisc.unsyncedChanges : t.projectMisc.liveSynced} · {t.projectMisc.lastSyncAt.replace('{time}', lastSync)}</span>
        </div>
      </div>

      {/* JSON editor + sync */}
      <div className="cinema-card !p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="cinema-eyebrow flex items-center gap-1.5"><Braces size={13} /> {t.projectMisc.paramJsonN.replace('{n}', String(baseDoc.shots.length))}</span>
          {parsed.ok
            ? <span className="cinema-mono text-[10px] text-[var(--accent-green)] flex items-center gap-1"><Check size={11} /> {t.projectMisc.jsonValid}{pendingBits}</span>
            : <span className="cinema-mono text-[10px] text-[var(--secondary)] flex items-center gap-1"><AlertCircle size={11} /> {parsed.error}</span>}
        </div>
        <textarea
          className="cinema-textarea w-full cinema-mono !text-[10px] leading-relaxed"
          rows={16} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => { setText(paramDocToJson(baseDoc)); }} className="cinema-btn-ghost !text-[11px]">{t.projectMisc.revert}</button>
          <button onClick={sync} disabled={!parsed.ok || !dirty || syncing} className="cinema-btn-primary !text-[11px] ml-auto disabled:opacity-50">
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {t.projectMisc.syncNow}
          </button>
        </div>
        {msg && <p className="cinema-mono text-[10px] mt-1.5 text-[var(--accent-green)]">{msg}</p>}
        <p className="cinema-mono text-[9px] opacity-40 mt-1">{t.projectMisc.paramJsonHint}</p>
      </div>
    </div>
  );
}

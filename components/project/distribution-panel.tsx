'use client';

/**
 * components/project/distribution-panel (v9.1.2) — Distribution / monetization tab.
 *
 * Multi-select platform chips → one-tap distribution pack → per-platform card
 * (title options / tags / hook / description / tips, inline copy)
 * + copy-all / export .txt. Persists as project_assets type='distribution'
 * (POST /api/projects/[id]/distribution).
 */

import { useEffect, useState } from 'react';
import { Megaphone, Copy, Check, DownloadSimple, CircleNotch as Loader2, Sparkle, PaperPlaneTilt, LinkSimple } from '@phosphor-icons/react';
import {
  PLATFORM_SPECS, distributionPackToText,
  type PlatformId, type DistributionPack, type PlatformPack,
} from '@/lib/distribution';
import { useLocale } from '@/hooks/use-locale';

const DEFAULT_PLATFORMS: PlatformId[] = ['douyin', 'xiaohongshu', 'shipinhao'];

/** Aligned with lib/publish-preflight PreflightResult (front-end is read-only display, no re-judge) */
interface PreflightRow { platform: string; label: string; pass: boolean; issues: string[]; warnings: string[] }

// v12.3.1 publish action result (per platform)
type PublishResult = { kind: 'ok' | 'plan' | 'blocked' | 'err'; msg: string; shareUrl?: string; externalUrl?: string };

export function DistributionPanel({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const [selected, setSelected] = useState<PlatformId[]>(DEFAULT_PLATFORMS);
  const [pack, setPack] = useState<DistributionPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [publishing, setPublishing] = useState<PlatformId | null>(null);
  const [pubResults, setPubResults] = useState<Record<string, PublishResult>>({});
  // v12.3.3 scheduled publish + real YouTube upload
  // v12.340: publish preflight. GET /publish-preflight existed since v12.3.x with **zero front-end consumers** —
  // so "will this cut be rejected on Douyin for duration/aspect?" was only discoverable by hitting the wall.
  const [preflight, setPreflight] = useState<PreflightRow[] | null>(null);
  const [preflightNote, setPreflightNote] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');   // datetime-local string (empty = now)
  const [ytReal, setYtReal] = useState(false);        // checked = real YouTube upload (needs a configured token)

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/distribution`)
      .then((r) => r.json()).then((j) => { if (alive && j?.pack?.platforms) setPack(j.pack); })
      .catch(() => {});
    return () => { alive = false; };
  }, [projectId]);

  // Preflight is read-only and free; fetch on enter. Failure does not block publish — badges just stay hidden.
  useEffect(() => {
    if (!projectId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : '';
    fetch(`/api/projects/${projectId}/publish-preflight`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then(async (r) => {
        if (r.ok) return r.json();
        const j = await r.json().catch(() => ({}));
        // 404 "no finished film yet" / 422 "not a local artifact" are **normal states**, not errors — say so, don't go red
        throw new Error(j?.message || pt.preflightUnavailable.replace('{status}', String(r.status)));
      })
      .then((j) => setPreflight(Array.isArray(j?.platforms) ? j.platforms : null))   // endpoint returns { ok, meta, platforms }
      .catch((e) => setPreflightNote(e instanceof Error ? e.message : pt.preflightUnavailableShort));
  }, [projectId, pt.preflightUnavailable, pt.preflightUnavailableShort]);

  function toggle(p: PlatformId) {
    setSelected((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function generate() {
    if (selected.length === 0) { setErr(pt.pickOnePlatform); return; }
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/projects/${projectId}/distribution`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selected }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.error || pt.genFailed.replace('{status}', String(r.status))); }
      else { setPack(j.pack); }
    } catch (e: any) { setErr(e?.message || pt.networkError); }
    finally { setLoading(false); }
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    } catch { /* ignore */ }
  }

  // v12.3.1+12.3.3 publish: pack + hard quality gate + billing gate + persist + share link;
  // can schedule (scheduleAt) / real-upload (YouTube with token → real upload, others honestly fall back to manual).
  async function publish(platform: PlatformId) {
    // v12.340: if preflight already failed, stop once — you can still insist (rules change,
    // preflight can be conservative), but nobody should hit the wall unaware.
    const pf = preflight?.find((r) => r.platform === platform);
    if (pf && !pf.pass) {
      const ok = window.confirm(pt.preflightFailConfirm.replace('{label}', pf.label).replace('{issues}', pf.issues.join('\n')));
      if (!ok) return;
    }
    setPublishing(platform);
    setPubResults((r) => ({ ...r, [platform]: { kind: 'ok', msg: pt.publishing } }));
    try {
      const body: any = { platform };
      if (scheduleAt) {
        const iso = new Date(scheduleAt).toISOString();
        if (new Date(iso).getTime() > Date.now()) body.scheduledAt = iso;
      }
      if (platform === 'youtube_shorts' && ytReal) { body.upload = true; body.confirmUpload = true; }
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : '';
      const r = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      let res: PublishResult;
      if (r.status === 402) res = { kind: 'plan', msg: pt.publishNeedCreator };
      else if (r.status === 422) res = { kind: 'blocked', msg: pt.qualityGateBlocked };
      else if (r.status === 401) res = { kind: 'err', msg: pt.pleaseLogin };
      else if (!r.ok) res = { kind: 'err', msg: j?.error || pt.publishFailed.replace('{status}', String(r.status)) };
      else if (j?.status === 'scheduled') res = { kind: 'ok', msg: pt.scheduledAt.replace('{date}', new Date(j?.scheduled?.scheduledAt).toLocaleString()) };
      else if (j?.status === 'published') res = { kind: 'ok', msg: pt.ytUploaded, shareUrl: j?.shareUrl, externalUrl: j?.record?.externalUrl };
      else if (j?.upload?.status === 'manual') res = { kind: 'ok', msg: pt.packedWithMsg.replace('{msg}', j.upload.message), shareUrl: j?.shareUrl };
      else res = { kind: 'ok', msg: pt.packedWithShare, shareUrl: j?.shareUrl };
      setPubResults((rr) => ({ ...rr, [platform]: res }));
    } catch (e: any) {
      setPubResults((rr) => ({ ...rr, [platform]: { kind: 'err', msg: e?.message || pt.networkError } }));
    } finally { setPublishing(null); }
  }

  function exportTxt() {
    if (!pack) return;
    const blob = new Blob([distributionPackToText(pack)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = pt.exportFilename.replace('{id}', projectId.slice(0, 8));
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Platform pick + generate */}
      <div className="cinema-card !p-4">
        <div className="cinema-eyebrow mb-3 flex items-center gap-1.5"><Megaphone size={13} className="text-[var(--cinema-amber)]" /> {pt.multiPlatform}</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {PLATFORM_SPECS.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className={`px-3 py-1.5 rounded-full border text-[12px] transition ${on ? 'border-[var(--cinema-amber)] bg-[var(--cinema-amber-glow)] text-[var(--cinema-amber)]' : 'border-[var(--cinema-border)] opacity-70 hover:opacity-100'}`}>
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={loading || selected.length === 0}
            className="cinema-btn-primary !text-[12px] disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkle size={13} />} {pack ? pt.regenerate : pt.genPack}
          </button>
          {pack && (
            <button onClick={exportTxt} className="cinema-btn-ghost !text-[12px]"><DownloadSimple size={13} /> {pt.exportTxt}</button>
          )}
          {pack?.degraded && <span className="cinema-mono text-[10px] text-[var(--secondary)]">{pt.llmDegraded}</span>}
        </div>
        {pack && (
          <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--cinema-border)]">
            <label className="cinema-mono text-[10px] opacity-70 flex items-center gap-1.5">
              {pt.scheduleOptional}
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)}
                className="bg-transparent border border-[var(--cinema-border)] rounded px-1.5 py-0.5 text-[11px]" />
            </label>
            {scheduleAt && <button onClick={() => setScheduleAt('')} className="cinema-mono text-[10px] opacity-50 hover:opacity-100 underline">{pt.clearSchedule}</button>}
            <label className="cinema-mono text-[10px] opacity-70 flex items-center gap-1.5">
              <input type="checkbox" checked={ytReal} onChange={(e) => setYtReal(e.target.checked)} />
              {pt.ytRealUpload}
            </label>
          </div>
        )}
        {err && <p className="cinema-mono text-[11px] mt-2 text-[var(--secondary)]">{err}</p>}
      </div>

      {/* Per-platform cards */}
      {pack && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pack.platforms.map((p) => (
            <PlatformCard key={p.platform} p={p} copiedKey={copiedKey} onCopy={copy}
              onPublish={() => publish(p.platform)} publishing={publishing === p.platform} result={pubResults[p.platform]}
              pf={preflight?.find((r) => r.platform === p.platform)} />
          ))}
        </div>
      )}

      {!pack && !loading && (
        <div className="cinema-card !p-6 text-center cinema-mono text-[11px] opacity-50">
          {pt.emptyHint}
        </div>
      )}
    </div>
  );
}

function PlatformCard({ p, copiedKey, onCopy, onPublish, publishing, result, pf }: {
  p: PlatformPack; copiedKey: string; onCopy: (text: string, k: string) => void;
  onPublish: () => void; publishing: boolean; result?: PublishResult;
  /** v12.340: this platform's preflight (parent already keyed by platform; child does not look it up) */
  pf?: PreflightRow;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectTools: Record<string, string> };
  const pt = t.projectTools;
  const Row = ({ k, label, value }: { k: string; label: string; value: string }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[var(--cinema-border)] last:border-0">
      <span className="cinema-mono text-[9px] opacity-50 w-10 shrink-0 pt-0.5">{label}</span>
      <span className="text-[12px] flex-1 leading-relaxed">{value}</span>
      <button onClick={() => onCopy(value, k)} className="opacity-50 hover:opacity-100 shrink-0" title={pt.copy}>
        {copiedKey === k ? <Check size={12} className="text-[var(--cinema-green)]" /> : <Copy size={12} />}
      </button>
    </div>
  );
  return (
    <div className="cinema-card !p-4">
      <div className="cinema-eyebrow mb-2 flex items-center gap-2">
        {p.label}
        {/* v12.340: preflight badge — know if the platform will reject before you publish */}
        {(() => {
          if (!pf) return null;
          return (
            <span
              data-testid={`preflight-${p.platform}`}
              className={`px-1.5 py-0.5 rounded text-[10px] ${pf.pass
                ? 'bg-[var(--cinema-green)]/15 text-[var(--cinema-green)]'
                : 'bg-[var(--cinema-red)]/15 text-[var(--cinema-red)]'}`}
              title={[...pf.issues, ...pf.warnings].join('\n') || pt.preflightPass}
            >
              {pf.pass ? (pf.warnings.length ? pt.preflightPassTips.replace('{n}', String(pf.warnings.length)) : pt.preflightPass) : pt.preflightFailItems.replace('{n}', String(pf.issues.length))}
            </span>
          );
        })()}
      </div>
      {/* When failing, spell out the reasons — badge title is hover-only; blockers should not hide in a tooltip */}
      {(() => {
        if (!pf || pf.pass || !pf.issues.length) return null;
        return (
          <ul className="mb-2 text-[11px] text-[var(--cinema-red)] leading-relaxed list-disc pl-4">
            {pf.issues.map((it: string, i: number) => <li key={i}>{it}</li>)}
          </ul>
        );
      })()}
      <Row k={`${p.platform}-title`} label={pt.labelTitle} value={p.titles[0] || ''} />
      {p.titles.slice(1).map((title, i) => <Row key={i} k={`${p.platform}-t${i}`} label={pt.labelAlt} value={title} />)}
      {p.tags.length > 0 && <Row k={`${p.platform}-tags`} label={pt.labelTags} value={p.tags.map((tag) => '#' + tag).join(' ')} />}
      {p.hook && <Row k={`${p.platform}-hook`} label={pt.labelHook} value={p.hook} />}
      {p.description && <Row k={`${p.platform}-desc`} label={pt.labelDesc} value={p.description} />}
      {p.tips && <Row k={`${p.platform}-tips`} label={pt.labelTips} value={p.tips} />}
      {/* v12.3.1 publish action: pack + hard gate + share link (honestly labeled as not a real upload) */}
      <div className="mt-3 pt-2 border-t border-[var(--cinema-border)] flex items-center gap-2">
        <button onClick={onPublish} disabled={publishing} data-testid={`publish-${p.platform}`}
          className="cinema-btn-primary !text-[11px] disabled:opacity-50">
          {publishing ? <Loader2 size={12} className="animate-spin" /> : <PaperPlaneTilt size={12} />} {pt.publishPack}
        </button>
        {result && (
          <span className={`cinema-mono text-[10px] flex items-center gap-1 ${result.kind === 'ok' ? 'text-[var(--cinema-green)]' : result.kind === 'plan' ? 'text-[var(--cinema-amber)]' : 'text-[var(--secondary)]'}`}>
            {result.msg}
            {result.shareUrl && <a href={result.shareUrl} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5"><LinkSimple size={10} /> {pt.sharePage}</a>}
            {result.externalUrl && <a href={result.externalUrl} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5"><LinkSimple size={10} /> {pt.platformLink}</a>}
          </span>
        )}
      </div>
    </div>
  );
}

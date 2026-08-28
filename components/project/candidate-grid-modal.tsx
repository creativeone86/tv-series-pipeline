'use client';

/**
 * Phase 29 v12.35.0 (3×3 grid) — candidate-frame workbench modal.
 *
 * One shot first produces N (4/6/9) **distinct-composition** candidates → SSE
 * fills the grid live → pick the best → chosen frame becomes this shot's
 * storyboard (seed for later video). Turns AI randomness from luck into a
 * glance-and-pick.
 *
 * Backend: POST /api/projects/[id]/candidates (SSE) + /candidates/pick (JSON),
 * both require login (Bearer).
 */

import { useState } from 'react';
import { X, CircleNotch as Loader2, SquaresFour as Grid, Check, ImageBroken as ImageOff, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { getToken } from '@/lib/auth';
import { gridDimensions, type CandidateCount } from '@/lib/candidate-grid';
import { useLocale } from '@/hooks/use-locale';

export interface CandidateGridModalProps {
  projectId: string;
  shotNumber: number;
  basePrompt: string;
  defaultAspectRatio?: string;
  onPick: (imageUrl: string) => void;
  onCancel: () => void;
}

interface Cell { id: string; index: number; variantLabel: string; imageUrl?: string; error?: string }

export function CandidateGridModal({ projectId, shotNumber, basePrompt, defaultAspectRatio, onPick, onCancel }: CandidateGridModalProps) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const [count, setCount] = useState<CandidateCount>(9);
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio || '16:9');
  const [cells, setCells] = useState<Cell[]>([]);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useFocusTrap<HTMLDivElement>(true, () => { if (!busy && !picking) onCancel(); });

  const authHeaders = (): Record<string, string> => {
    const tok = getToken();
    return tok ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` } : { 'Content-Type': 'application/json' };
  };

  const { cols } = gridDimensions(count);
  // v12.36.0 (visual QA): cell aspect follows the chosen frame so 9:16 is not cropped by a 16:9 cell.
  const ASPECT_CLASS: Record<string, string> = { '16:9': 'aspect-video', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '2.35:1': 'aspect-[2.35/1]' };
  const aspectClass = ASPECT_CLASS[aspectRatio] || 'aspect-video';
  // Portrait cells are taller; 3 columns get very long → drop to 2 columns when 9:16 (body still scrolls).
  const effectiveCols = aspectRatio === '9:16' ? Math.min(cols, 2) : cols;

  const cellLabel = (c: Cell) => {
    const extra = c as Cell & { nameEn?: string; en?: string };
    return locale === 'en' ? (extra.nameEn || extra.en || c.variantLabel) : c.variantLabel;
  };

  const handleGenerate = async () => {
    if (busy) return;
    const trimmed = (basePrompt || '').trim();
    if (trimmed.length < 5) { setError(t.projectPanels.promptTooShort); return; }
    setBusy(true); setError(null); setCells([]); setStatus(t.projectPanels.generatingN.replace('{n}', String(count)));
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/candidates`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ shotNumber, basePrompt: trimmed, count, aspectRatio }),
      });
      if (!res.ok && !res.body) {
        const txt = await res.text().catch(() => '');
        setError(t.projectPanels.requestFailed.replace('{status}', String(res.status)).replace('{txt}', txt.slice(0, 120))); return;
      }
      const reader = res.body?.getReader();
      if (!reader) { setError(t.projectPanels.streamReadFailed); return; }
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value);
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'status') setStatus(evt.data?.message || t.projectPanels.processing);
            else if (evt.type === 'candidate' && evt.data?.candidate) {
              const c = evt.data.candidate as Cell;
              setCells((prev) => {
                const next = prev.filter((x) => x.id !== c.id);
                next.push(c); next.sort((a, b) => a.index - b.index); return next;
              });
            } else if (evt.type === 'complete') {
              setStatus(t.projectPanels.completePick.replace('{n}', String(evt.data?.candidates?.length ?? 0)));
            } else if (evt.type === 'error') setError(evt.data?.message || t.projectPanels.generateFailed);
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectPanels.generateFailed);
    } finally { setBusy(false); }
  };

  const handlePick = async (id: string) => {
    if (busy || picking) return;
    setPicking(id); setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/candidates/pick`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ shotNumber, pickedId: id }),
      });
      const body = await res.json();
      if (!res.ok || !body.imageUrl) { setError(body?.error || t.projectPanels.pickFailedHttp.replace('{status}', String(res.status))); return; }
      onPick(body.imageUrl); // parent refreshes this shot's board, then closes
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectPanels.adoptFailed);
    } finally { setPicking(null); }
  };

  const ready = cells.filter((c) => c.imageUrl).length;
  const title = t.projectPanels.gridTitle.replace('{n}', String(shotNumber));

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 outline-none"
      role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
    >
      <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-[var(--cinema-surface)] border border-[var(--cinema-border-hi)] shadow-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-5 py-3 border-b border-[var(--cinema-border)] bg-[var(--cinema-surface-2)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[var(--cinema-amber)]" />
            <h3 className="text-sm font-semibold text-[var(--cinema-text)]">{title}</h3>
          </div>
          <button onClick={onCancel} disabled={busy || !!picking} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-40"><X className="w-4 h-4" /></button>
        </div>

        {/* controls */}
        <div className="px-5 py-3 border-b border-[var(--cinema-border)] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="cinema-mono text-[11px] opacity-60">{t.projectPanels.candidateCount}</span>
            {([4, 6, 9] as const).map((c) => (
              <button key={c} onClick={() => setCount(c)} disabled={busy}
                className={`cinema-mono text-[10px] px-2 py-0.5 rounded border ${count === c ? 'bg-[var(--cinema-amber)]/20 border-[var(--cinema-amber)] text-[var(--cinema-amber)]' : 'border-[var(--cinema-border)] opacity-60 hover:opacity-100'} disabled:opacity-30`}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="cinema-mono text-[11px] opacity-60">{t.projectPanels.aspect}</span>
            {(['16:9', '9:16', '1:1', '2.35:1'] as const).map((a) => (
              <button key={a} onClick={() => setAspectRatio(a)} disabled={busy}
                className={`cinema-mono text-[10px] px-2 py-0.5 rounded border ${aspectRatio === a ? 'bg-[var(--cinema-amber)]/20 border-[var(--cinema-amber)] text-[var(--cinema-amber)]' : 'border-[var(--cinema-border)] opacity-60 hover:opacity-100'} disabled:opacity-30`}>{a}</button>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={busy}
            className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40 ml-auto">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {busy ? t.product.generating : cells.length > 0 ? t.projectPanels.regenBatch : t.projectPanels.generateCandidates}
          </button>
        </div>

        {/* grid body */}
        <div className="flex-1 overflow-y-auto p-5">
          {cells.length === 0 && !busy ? (
            <div className="text-center py-12 cinema-mono text-[12px] opacity-50">
              {t.projectPanels.emptyHint.replace('{n}', String(count))}
            </div>
          ) : (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))` }}>
              {cells.map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.imageUrl && handlePick(c.id)}
                  disabled={!c.imageUrl || busy || !!picking}
                  className={`group relative ${aspectClass} rounded-lg overflow-hidden border border-[var(--cinema-border)] bg-black/40 hover:border-[var(--cinema-amber)] focus:outline-none focus:border-[var(--cinema-amber)] disabled:cursor-default transition-colors`}
                  title={cellLabel(c)}
                >
                  {c.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img loading="lazy" decoding="async" src={c.imageUrl} alt={cellLabel(c)} className="w-full h-full object-cover" />
                  ) : c.error ? (
                    <div className="w-full h-full grid place-items-center text-center px-1"><ImageOff className="w-5 h-5 opacity-40" /></div>
                  ) : (
                    <div className="w-full h-full grid place-items-center"><Loader2 className="w-5 h-5 animate-spin opacity-50" /></div>
                  )}
                  {/* variant label */}
                  <span className="absolute left-1.5 bottom-1.5 cinema-mono text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/85">{cellLabel(c)}</span>
                  {/* adopt state */}
                  {picking === c.id ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/50"><Loader2 className="w-6 h-6 animate-spin text-[var(--cinema-amber)]" /></div>
                  ) : c.imageUrl ? (
                    <div className="absolute inset-0 grid place-items-center bg-[var(--cinema-amber)]/0 group-hover:bg-black/40 transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 cinema-mono text-[11px] px-2 py-1 rounded bg-[var(--cinema-amber)] text-black font-semibold transition-opacity"><Check className="w-3.5 h-3.5" />{t.projectPanels.pick}</span>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          {error && <div className="cinema-card p-3 border-[var(--cinema-red)]/40 mt-4"><span className="cinema-mono text-[11px] text-[var(--cinema-red)]">✗ {error}</span></div>}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-[var(--cinema-border)] bg-[var(--cinema-surface-2)] flex items-center justify-between">
          <span className="cinema-mono text-[10px] opacity-50">
            {busy ? status : t.projectPanels.readyFooter.replace('{ready}', String(ready)).replace('{total}', String(cells.length || count))}
          </span>
          <button onClick={onCancel} disabled={busy || !!picking} className="cinema-btn !px-3 !py-1.5 !text-[11px] disabled:opacity-40">{t.product.close}</button>
        </div>
      </div>
    </div>
  );
}

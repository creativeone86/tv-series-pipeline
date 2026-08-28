'use client';

/**
 * ReplicateWorkbench (v11.1.2) — pull-sheet replica / replace workbench
 * (inside the pull-sheet tab).
 *
 * Add replace rules (global “all people→cats” / per-dimension cast · scene ·
 * prop, optional ref image) → preview rewritten per-shot prompts (all editable)
 * → start replica (new project, parallel generate).
 */
import { useCallback, useState } from 'react';
import { MagicWand, Plus, X, CircleNotch, FilmSlate, BookmarkSimple as Bookmark } from '@phosphor-icons/react';
import { getToken } from '@/lib/auth';
import { useLocale } from '@/hooks/use-locale';

type Kind = 'global' | 'character' | 'scene' | 'prop';
interface Rule { kind: Kind; from: string; to: string; refImage?: string }
interface PreviewShot { shotNumber: number; durationSec: number; characters: string[]; scene: string; prompt: string; refImages: string[] }
interface FidelityReport {
  original: { openingHook: number; cliffhanger: number; averageConflictScore: number; reversalCount: number };
  replica: { openingHook: number; cliffhanger: number; averageConflictScore: number; reversalCount: number };
  fidelity: { pacing: number; hook: number; overall: number };
  notes: string[];
}

function fidColor(v: number): string {
  if (v >= 85) return 'var(--cinema-green)';
  if (v >= 60) return 'var(--cinema-amber)';
  return 'var(--cinema-red)';
}

function authHeaders(): Record<string, string> {
  const tok = getToken();
  return { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) };
}

export function ReplicateWorkbench({ projectId, sheetSource = 'factory' }: { projectId: string; sheetSource?: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const kindLabel = (k: Kind) => ({
    global: t.projectPanels.kindGlobal,
    character: t.product.tabCharacters,
    scene: t.product.tabScenes,
    prop: t.projectPanels.kindProp,
  }[k]);
  const [rules, setRules] = useState<Rule[]>([{ kind: 'global', from: '', to: '' }]);
  const [preview, setPreview] = useState<{ title: string; shots: PreviewShot[]; fidelity?: FidelityReport } | null>(null);
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const setRule = (i: number, patch: Partial<Rule>) =>
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const body = useCallback((extra: object) => JSON.stringify({
    sheetSource,
    replacements: rules.filter((r) => r.to.trim()),
    ...extra,
  }), [rules, sheetSource]);

  const doPreview = async () => {
    setBusy(true); setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet/replicate`, {
        method: 'POST', headers: authHeaders(), body: body({ preview: true }),
      });
      const b = await res.json();
      // Keep user-edited prompts (by shotNumber) — repeat preview does not wipe edits
      if (res.ok) setPreview(b);
      else setNotice(b.message || t.projectPanels.previewFailed);
    } catch { setNotice(t.projectPanels.previewFailed); }
    finally { setBusy(false); }
  };

  const doReplicate = async () => {
    setBusy(true); setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet/replicate`, {
        method: 'POST', headers: authHeaders(), body: body({ editedPrompts: edited, title: preview?.title }),
      });
      const b = await res.json();
      if (res.ok) setNotice(t.projectPanels.replicateStarted.replace('{id}', String(b.newProjectId)).replace('{n}', String(b.shots)));
      else setNotice(b.message || t.projectPanels.replicateFailed);
    } catch { setNotice(t.projectPanels.replicateFailed); }
    finally { setBusy(false); }
  };

  const doSaveTemplate = async () => {
    setBusy(true); setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/pull-sheet/save-template`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ sheetSource, title: preview?.title }),
      });
      const b = await res.json();
      if (res.ok) setNotice(t.projectPanels.templateSaved.replace('{title}', String(b.title)));
      else setNotice(b.message || t.projectPanels.saveTemplateFailed);
    } catch { setNotice(t.projectPanels.saveTemplateFailed); }
    finally { setBusy(false); }
  };

  return (
    <div className="cinema-card-hi p-4 mt-6" data-testid="replicate-workbench">
      <div className="cinema-eyebrow flex items-center gap-1.5 mb-1"><MagicWand className="w-3.5 h-3.5" />{t.projectPanels.replicateTitle}</div>
      <p className="cinema-mono text-[10px] opacity-50 mb-3">
        {t.projectPanels.replicateHint}
      </p>

      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-2 flex-wrap">
            <select value={r.kind} onChange={(e) => setRule(i, { kind: e.target.value as Kind })}
              aria-label={t.projectPanels.replaceKindAria}
              className="cinema-input !text-[11px] !py-1 w-24 shrink-0">
              {(['global', 'character', 'scene', 'prop'] as Kind[]).map((k) => <option key={k} value={k} className="bg-[#1a1a24]">{kindLabel(k)}</option>)}
            </select>
            <input value={r.from} onChange={(e) => setRule(i, { from: e.target.value })}
              placeholder={r.kind === 'global' ? t.projectPanels.fromPlaceholderGlobal : t.projectPanels.fromPlaceholderOther}
              aria-label={t.projectPanels.fromAria}
              className="cinema-input !text-[11px] !py-1 flex-1 min-w-[100px]" />
            <span className="opacity-40 text-[11px]">→</span>
            <input value={r.to} onChange={(e) => setRule(i, { to: e.target.value })}
              placeholder={t.projectPanels.toPlaceholder}
              aria-label={t.projectPanels.toAria}
              className="cinema-input !text-[11px] !py-1 flex-1 min-w-[100px]" />
            <input value={r.refImage || ''} onChange={(e) => setRule(i, { refImage: e.target.value })}
              placeholder={t.projectPanels.refImagePlaceholder}
              aria-label={t.projectPanels.refImageAria}
              className="cinema-input !text-[11px] !py-1 w-32" />
            <button onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}
              aria-label={t.projectPanels.deleteRuleAria} className="text-white/40 hover:text-white shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button onClick={() => setRules((rs) => [...rs, { kind: 'global', from: '', to: '' }])}
          className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1"><Plus className="w-3 h-3" />{t.projectPanels.addRule}</button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button onClick={doPreview} disabled={busy} className="cinema-btn !px-2.5 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50">
          {busy ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <MagicWand className="w-3.5 h-3.5" />}{t.projectPanels.previewRewrite}
        </button>
        {preview && (
          <button onClick={doReplicate} disabled={busy} className="cinema-btn cinema-btn-primary !px-2.5 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50">
            <FilmSlate className="w-3.5 h-3.5" />{t.projectPanels.replicateStart.replace('{n}', String(preview.shots.length))}
          </button>
        )}
        <button onClick={doSaveTemplate} disabled={busy} title={t.projectPanels.saveTemplateHint}
          className="cinema-btn !px-2.5 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50">
          <Bookmark className="w-3.5 h-3.5" />{t.projectPanels.savePrivateTemplate}
        </button>
      </div>
      {notice && <p className="mt-2 text-[11px] text-[var(--cinema-amber)]" role="status">{notice}</p>}

      {preview?.fidelity && (
        <div className="mt-4 rounded-md border border-[var(--cinema-border)] bg-black/20 px-3 py-2.5" data-testid="fidelity">
          <div className="cinema-eyebrow !text-[9px] mb-2">{t.projectPanels.fidelityTitle}</div>
          <div className="grid grid-cols-3 gap-3">
            {([[t.projectPanels.fidOverall, preview.fidelity.fidelity.overall], [t.projectPanels.fidPacing, preview.fidelity.fidelity.pacing], [t.projectPanels.fidHook, preview.fidelity.fidelity.hook]] as Array<[string, number]>).map(([label, v]) => (
              <div key={label}>
                <div className="cinema-mono text-[9px] opacity-50 mb-0.5">{label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="cinema-headline text-lg" style={{ color: fidColor(v) }}>{v}</span>
                  <span className="cinema-mono text-[9px] opacity-40">/100</span>
                </div>
              </div>
            ))}
          </div>
          <div className="cinema-mono text-[9px] opacity-45 mt-2">
            {t.projectPanels.fidCompare
              .replace('{a}', String(preview.fidelity.original.openingHook))
              .replace('{b}', String(preview.fidelity.replica.openingHook))
              .replace('{c}', String(preview.fidelity.original.cliffhanger))
              .replace('{d}', String(preview.fidelity.replica.cliffhanger))
              .replace('{e}', String(preview.fidelity.original.reversalCount))
              .replace('{f}', String(preview.fidelity.replica.reversalCount))}
          </div>
          {preview.fidelity.notes.map((n, i) => (
            <p key={i} className="text-[10px] text-[var(--cinema-text-3)] mt-1">· {n}</p>
          ))}
        </div>
      )}

      {preview && (
        <div className="mt-4 space-y-2">
          <div className="cinema-mono text-[10px] opacity-50">{t.projectPanels.promptListTitle.replace('{title}', preview.title)}</div>
          {preview.shots.map((s) => (
            <div key={s.shotNumber} className="rounded-md border border-[var(--cinema-border)] bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="cinema-mono text-[10px] opacity-50">{t.projectPanels.shotDur.replace('{n}', String(s.shotNumber)).replace('{sec}', String(s.durationSec))}</span>
                {s.characters.length > 0 && <span className="text-[10px] text-[var(--cinema-text-3)]">{s.characters.join('\u3001')}</span>}
                {s.refImages.length > 0 && <span className="text-[9px] text-sky-300/70">{t.projectPanels.refImageCount.replace('{n}', String(s.refImages.length))}</span>}
              </div>
              <textarea
                value={edited[s.shotNumber] ?? s.prompt}
                onChange={(e) => setEdited((m) => ({ ...m, [s.shotNumber]: e.target.value }))}
                aria-label={t.projectPanels.shotPromptAria.replace('{n}', String(s.shotNumber))}
                rows={2}
                className="cinema-textarea w-full !text-[11px]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

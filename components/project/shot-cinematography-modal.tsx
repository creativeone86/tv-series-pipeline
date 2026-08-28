'use client';

/**
 * components/project/shot-cinematography-modal (v7.2)
 *
 * Per-board "shot cinematography" dialog on the project page: ShotCinematographyPanel
 * + live compiled prompt + save/copy.
 *   - Edit ShotSpec → live English photo-prompt fragment + summary chip
 *   - Save camera → POST /api/projects/[id]/shot-spec (into storyboard asset data.cameraSpec)
 *   - Copy prompt → paste into any generate box
 */

import { useState } from 'react';
import { X, Copy, Check, FloppyDisk as Save, CircleNotch as Loader2, FilmSlate as Clapperboard, MagicWand as Wand2 } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShotCinematographyPanel } from './shot-cinematography-panel';
import { CompositionGuide } from './composition-guide';
import {
  compileShotSpecToPrompt, describeShotSpec, normalizeShotSpec, type ShotSpec,
} from '@/lib/cinematography';
import { buildRuleContext, applyRulesToSpec } from '@/lib/auto-rules';
import { useLocale } from '@/hooks/use-locale';

export function ShotCinematographyModal({
  projectId, shotNumber, shotTitle, initialSpec, emotion, onClose, onSaved,
}: {
  projectId: string;
  shotNumber: number;
  shotTitle?: string;
  initialSpec: ShotSpec;
  /** v8.1: this shot's emotion tag, for smart linkage rules */
  emotion?: string;
  onClose: () => void;
  onSaved?: (spec: ShotSpec) => void;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [spec, setSpec] = useState<ShotSpec>(() => normalizeShotSpec(initialSpec));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const [ruleMsg, setRuleMsg] = useState('');

  function applyAutoRules() {
    const ctx = buildRuleContext({ emotion, spec });
    const { spec: next, firedLabels } = applyRulesToSpec(spec, ctx);
    setSpec(next);
    setRuleMsg(firedLabels.length ? t.projectMisc.cineRulesApplied.replace('{list}', firedLabels.join('、')) : t.projectMisc.cineNoRules);
    setTimeout(() => setRuleMsg(''), 4000);
  }

  const compiled = compileShotSpecToPrompt(spec);

  async function save() {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`/api/projects/${projectId}/shot-spec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotNumber, cameraSpec: spec }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(j?.error || t.projectMisc.saveFailedStatus.replace('{status}', String(r.status))); }
      else { setMsg(t.projectMisc.cineSaved); onSaved?.(spec); setTimeout(onClose, 600); }
    } catch (e: any) {
      setMsg(e?.message || t.auth.waitlistNetworkError);
    } finally { setSaving(false); }
  }

  function copy() {
    navigator.clipboard?.writeText(compiled).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Clapperboard size={16} className="text-[var(--primary)]" />
              {t.projectMisc.cineModalTitle} <span className="cinema-mono">SHOT {String(shotNumber).padStart(2, '0')}</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {shotTitle && <p className="text-xs text-[var(--muted)] -mt-2 mb-1 line-clamp-1">{shotTitle}</p>}

        <ShotCinematographyPanel value={spec} onChange={setSpec} />

        {/* v8.1 smart linkage: one-click camera rules from mood / shot size */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <button onClick={applyAutoRules} className="cinema-btn-ghost !text-[11px]">
            <Wand2 size={13} className="text-[var(--primary)]" /> {t.projectMisc.cineAutoSuggest}
          </button>
          {emotion && <span className="cinema-mono text-[10px] opacity-50">{t.projectMisc.cineEmotionPrefix.replace('{emotion}', emotion)}</span>}
          {ruleMsg && <span className="cinema-mono text-[10px] text-[var(--accent-green)]">{ruleMsg}</span>}
        </div>

        {/* v7.5 composition guide + camera path (live with size / angle / move) */}
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <CompositionGuide shotSize={spec.shotSize} angle={spec.angle} movement={spec.movement} />
        </div>

        {/* Summary + compiled English prompt fragment */}
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-1">
            <span className="cinema-eyebrow">{t.projectMisc.cineSummary}</span>
            <span className="cinema-mono text-[10px] text-[var(--primary)]">{describeShotSpec(spec)}</span>
          </div>
          <code className="block cinema-mono text-[10px] leading-relaxed text-[var(--accent-green)] bg-[var(--surface)] rounded-md p-2 max-h-24 overflow-auto custom-scrollbar">
            {compiled}
          </code>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button onClick={copy} className="cinema-btn-ghost !text-[11px]">
            {copied ? <Check size={13} className="text-[var(--accent-green)]" /> : <Copy size={13} />} {t.projectMisc.copyPrompt}
          </button>
          <button onClick={save} disabled={saving} className="cinema-btn-primary !text-[11px] ml-auto disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {t.projectMisc.saveCamera}
          </button>
          <button onClick={onClose} className="cinema-btn-ghost !text-[11px]"><X size={13} /> {t.product.close}</button>
        </div>
        {msg && <p className="cinema-mono text-[10px] mt-1.5 text-[var(--muted)]">{msg}</p>}
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * CreationWizard (v2.0 Sprint 0 D7)
 *
 * 5-step project create wizard, wiring the four sibling components:
 *   Step 1: pick mode (ModeCardGrid)
 *   Step 2: pick style (StylePicker)
 *   Step 3: pick assets (AssetGrid, optional)
 *   Step 4: prompt + resolution / duration (ResolutionSelector)
 *   Step 5: review → submit
 *
 * Final payload goes to the parent (usually `/app/create`) via onComplete;
 * the parent POSTs `/api/projects` and starts the orchestrator.
 *
 * Design:
 *  - Controlled stepper + prev/next
 *  - Next disabled until the current step validates
 *  - ESC / close auto-saves the draft to localStorage (key: qfmj-wizard-draft)
 */

import * as React from 'react';
import { Rocket } from '@phosphor-icons/react';
import { ModeCardGrid, MODE_PRESETS, modeCopy } from './ModeCard';
import { StylePicker } from './StylePicker';
import { ResolutionSelector } from './ResolutionSelector';
import { AssetGrid } from '@/components/assets/AssetGrid';
import type {
  CreationMode,
  ProjectOutputConfig,
} from '@/types/agents';
import { applyStyleToPrompt } from '@/lib/style-presets';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface WizardDraft {
  mode?: CreationMode;
  styleId?: string;
  globalAssetIds: string[];
  title: string;
  prompt: string;
  durationSec: number;
  output: ProjectOutputConfig;
}

export type WizardSubmitPayload = Required<Omit<WizardDraft, 'globalAssetIds'>> & {
  globalAssetIds: string[];
  /** Final prompt after style fragment injection */
  finalPrompt: string;
};

export interface CreationWizardProps {
  initialDraft?: Partial<WizardDraft>;
  onComplete: (payload: WizardSubmitPayload) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

// ──────────────────────────────────────────────────────────
// Draft defaults & localStorage persist
// ──────────────────────────────────────────────────────────

const DRAFT_KEY = 'qfmj-wizard-draft';

export const DEFAULT_DRAFT: WizardDraft = {
  mode: undefined,
  styleId: undefined,
  globalAssetIds: [],
  title: '',
  prompt: '',
  durationSec: 5,
  output: { resolution: '720p', aspectRatio: '16:9' },
};

function loadDraft(): Partial<WizardDraft> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<WizardDraft>) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: WizardDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

// ──────────────────────────────────────────────────────────
// Step keys
// ──────────────────────────────────────────────────────────

const STEP_KEYS = ['mode', 'style', 'assets', 'details', 'review'] as const;

type StepKey = (typeof STEP_KEYS)[number];

const STEP_I18N: Record<StepKey, { label: string; desc: string }> = {
  mode: { label: 'wizardStepMode', desc: 'wizardStepModeDesc' },
  style: { label: 'wizardStepStyle', desc: 'wizardStepStyleDesc' },
  assets: { label: 'wizardStepAssets', desc: 'wizardStepAssetsDesc' },
  details: { label: 'wizardStepDetails', desc: 'wizardStepDetailsDesc' },
  review: { label: 'wizardStepReview', desc: 'wizardStepReviewDesc' },
};

// ──────────────────────────────────────────────────────────
// Validation per step
// ──────────────────────────────────────────────────────────

export function isStepValid(step: StepKey, draft: WizardDraft): boolean {
  switch (step) {
    case 'mode':
      return !!draft.mode;
    case 'style':
      return !!draft.styleId;
    case 'assets':
      return true; // assets are optional
    case 'details':
      return draft.prompt.trim().length >= 5 && draft.title.trim().length > 0;
    case 'review':
      return (
        !!draft.mode &&
        !!draft.styleId &&
        draft.prompt.trim().length >= 5 &&
        draft.title.trim().length > 0
      );
  }
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export function CreationWizard({
  initialDraft,
  onComplete,
  onCancel,
  className,
}: CreationWizardProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};
  const [stepIdx, setStepIdx] = React.useState(0);
  const [draft, setDraft] = React.useState<WizardDraft>(() => ({
    ...DEFAULT_DRAFT,
    ...(loadDraft() ?? {}),
    ...(initialDraft ?? {}),
  }));
  const [submitting, setSubmitting] = React.useState(false);

  const steps = STEP_KEYS.map(key => ({
    key,
    label: w[STEP_I18N[key].label] || key,
    desc: w[STEP_I18N[key].desc] || '',
  }));

  // Auto-save draft
  React.useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const step = steps[stepIdx];
  const canAdvance = isStepValid(step.key, draft);
  const isLast = stepIdx === steps.length - 1;

  const update = <K extends keyof WizardDraft>(key: K, v: WizardDraft[K]) =>
    setDraft(prev => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    if (submitting) return;
    if (!isStepValid('review', draft)) return;
    setSubmitting(true);
    try {
      const finalPrompt = applyStyleToPrompt(draft.prompt, draft.styleId);
      await onComplete({
        mode: draft.mode!,
        styleId: draft.styleId!,
        globalAssetIds: draft.globalAssetIds,
        title: draft.title,
        prompt: draft.prompt,
        durationSec: draft.durationSec,
        output: draft.output,
        finalPrompt,
      });
      clearDraft();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-2xl border border-white/10 bg-neutral-950/60 p-6 backdrop-blur',
        className,
      )}
      data-testid="creation-wizard"
    >
      {/* Stepper */}
      <StepperHeader currentIdx={stepIdx} steps={steps} />

      {/* Title / sub */}
      <div>
        <h2 className="text-xl font-semibold text-white">{step.label}</h2>
        <p className="mt-1 text-sm text-neutral-400">{step.desc}</p>
      </div>

      {/* Content */}
      <div className="min-h-[20rem]">
        {step.key === 'mode' && (
          <ModeCardGrid value={draft.mode} onChange={m => update('mode', m)} />
        )}

        {step.key === 'style' && (
          <StylePicker
            value={draft.styleId}
            onChange={id => update('styleId', id || undefined)}
            clearable
          />
        )}

        {step.key === 'assets' && (
          <AssetGrid
            selectable
            selected={draft.globalAssetIds}
            onSelectionChange={ids => update('globalAssetIds', ids)}
            maxSelection={20}
          />
        )}

        {step.key === 'details' && <DetailsStep draft={draft} update={update} />}

        {step.key === 'review' && <ReviewStep draft={draft} />}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-neutral-400 hover:text-white"
              data-testid="wizard-cancel"
            >
              {t.common.cancel}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStepIdx(i => Math.max(0, i - 1))}
            disabled={stepIdx === 0}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="wizard-prev"
          >
            {w.wizardPrev || 'Back'}
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
              disabled={!canAdvance}
              className={cn(
                'rounded-lg bg-gradient-to-r from-[#E8C547] to-[#FF6B35] px-5 py-2 text-sm font-semibold text-white',
                'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90',
              )}
              data-testid="wizard-next"
            >
              {w.wizardNext || 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance || submitting}
              className={cn(
                'rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 text-sm font-semibold text-white',
                'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90',
              )}
              data-testid="wizard-submit"
            >
              {submitting
                ? (w.wizardSubmitting || 'Submitting...')
                : <span className="inline-flex items-center gap-1.5"><Rocket size={15} weight="duotone" /> {w.wizardLaunch || 'Start generate'}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Stepper
// ──────────────────────────────────────────────────────────

function StepperHeader({
  currentIdx,
  steps,
}: {
  currentIdx: number;
  steps: ReadonlyArray<{ key: string; label: string }>;
}) {
  return (
    <ol className="flex items-center justify-between gap-2" data-testid="wizard-stepper">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                done && 'border-green-500 bg-green-500 text-white',
                active && 'border-[#E8C547] bg-[#E8C547]/20 text-[#E8C547]',
                !done && !active && 'border-white/10 text-neutral-500',
              )}
              data-testid={`wizard-step-${s.key}`}
              data-active={active}
              data-done={done}
            >
              {done ? '✓' : i + 1}
            </div>
            <div className="hidden flex-col md:flex">
              <span
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-white' : 'text-neutral-400',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'ml-2 h-px flex-1',
                  done ? 'bg-green-500/60' : 'bg-white/10',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-steps
// ──────────────────────────────────────────────────────────

interface DetailsStepProps {
  draft: WizardDraft;
  update: <K extends keyof WizardDraft>(key: K, v: WizardDraft[K]) => void;
}

function DetailsStep({ draft, update }: DetailsStepProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">{w.wizardTitleLabel || 'Project title'}</label>
          <input
            type="text"
            value={draft.title}
            onChange={e => update('title', e.target.value)}
            placeholder={w.wizardTitlePlaceholder || 'e.g. Bright Eyes · short ep. 1'}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none"
            data-testid="wizard-title-input"
            maxLength={60}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">
            {w.wizardPromptLabel || 'Creation prompt'}
          </label>
          <textarea
            value={draft.prompt}
            onChange={e => update('prompt', e.target.value)}
            placeholder={w.wizardPromptPlaceholder || 'Describe the picture or story. e.g. A misty old town at dawn, a girl in hanfu walking the stone path with a qin...'}
            rows={8}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#E8C547]/60 focus:outline-none"
            data-testid="wizard-prompt-input"
          />
          <div className="mt-1 text-[11px] text-neutral-500">
            {(w.wizardPromptHint || '{n} chars · at least 5').replace('{n}', String(draft.prompt.length))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">
            {w.wizardDurationLabel || 'Shot duration (sec)'}
          </label>
          <div className="flex gap-2" data-testid="wizard-duration-row">
            {[4, 5, 8, 10, 15].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => update('durationSec', d)}
                className={cn(
                  'flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all',
                  draft.durationSec === d
                    ? 'border-[#E8C547] bg-[#E8C547]/10 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/30',
                )}
                data-selected={draft.durationSec === d}
                data-testid={`wizard-duration-${d}`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResolutionSelector
        value={draft.output}
        onChange={v => update('output', v)}
        durationSec={draft.durationSec}
      />
    </div>
  );
}

function ReviewStep({ draft }: { draft: WizardDraft }) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};
  const modePreset = draft.mode ? MODE_PRESETS[draft.mode] : undefined;
  const modeName = modePreset ? modeCopy(modePreset, t.workshop).name : '';
  const finalPrompt = applyStyleToPrompt(draft.prompt, draft.styleId);
  const unset = w.wizardUnset || '(not set)';
  const unfilled = w.wizardUnfilled || '(empty)';

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="wizard-review">
      <div className="space-y-3">
        <ReviewRow label={w.wizardTitleLabel || 'Project title'} value={draft.title || unfilled} />
        <ReviewRow
          label={w.wizardStepMode || 'Creation mode'}
          value={
            modePreset ? (
              <span className="flex items-center gap-2">
                <span className="relative w-5 h-5 grid place-items-center text-xl shrink-0">
                  <span aria-hidden>{modePreset.icon}</span>
                  <img src={`/mode-icons/${modePreset.mode}.jpg`} alt="" aria-hidden
                    className="absolute inset-0 w-full h-full object-contain rounded"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </span>
                {modeName} · {modePreset.nameEn}
              </span>
            ) : (
              unset
            )
          }
        />
        <ReviewRow label={w.wizardStylePreset || 'Style preset'} value={draft.styleId ?? unset} />
        <ReviewRow
          label={w.wizardGlobalAssets || 'Global assets'}
          value={
            draft.globalAssetIds.length > 0
              ? (w.wizardAssetsPicked || 'Picked {n}').replace('{n}', String(draft.globalAssetIds.length))
              : (w.wizardNonePicked || 'None')
          }
        />
        <ReviewRow
          label={w.wizardResAspect || 'Resolution / ratio'}
          value={`${draft.output.resolution.toUpperCase()} · ${draft.output.aspectRatio}`}
        />
        <ReviewRow label={w.wizardDurationShort || 'Shot duration'} value={`${draft.durationSec}s`} />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-xs font-semibold uppercase text-neutral-400">
          {w.wizardPromptPreview || 'Final prompt preview'}
        </div>
        <div className="whitespace-pre-wrap break-words text-sm text-neutral-200">
          {finalPrompt || (w.wizardEmpty || '(empty)')}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

'use client';

/**
 * FirstRunGuide (v10.5.3) — three-step first-run coach for the create workshop
 * (no extra coach-mark dependency).
 *
 * On first visit (no localStorage done flag), highlight idea → style → ROLL
 * (anchors: data-guide="idea|style|roll"): dim overlay + amber outline + nearby
 * bubble. Complete or skip writes localStorage and never shows again.
 *
 * Telemetry (completion = completed/shown): create_guide_shown / _step{N} /
 * _completed / _skipped → POST /api/telemetry/ui-event (fire-and-forget).
 * a11y: bubble role=dialog + useFocusTrap (Tab cycle, Escape=skip, restore focus).
 */
import { useCallback, useEffect, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';

const DONE_KEY = 'qfmj-create-guide-done';

const STEPS = [
  { target: 'idea' },
  { target: 'style' },
  { target: 'roll' },
] as const;

function track(event: string, meta: Record<string, unknown> = {}) {
  try {
    void fetch('/api/telemetry/ui-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* telemetry failure must not block the guide */ }
}

interface Rect { top: number; left: number; width: number; height: number }

export function FirstRunGuide() {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [step, setStep] = useState(-1); // -1 = inactive
  const [rect, setRect] = useState<Rect | null>(null);

  const stepCopy = [
    { title: t.workshopCreate.guideStep1Title, desc: t.workshopCreate.guideStep1Desc },
    { title: t.workshopCreate.guideStep2Title, desc: t.workshopCreate.guideStep2Desc },
    { title: t.workshopCreate.guideStep3Title, desc: t.workshopCreate.guideStep3Desc },
  ];

  // First-run check + impression event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(DONE_KEY) === '1') return;
    } catch { return; }
    setStep(0);
    track('create_guide_shown');
  }, []);

  // Measure target (on step / resize / scroll; jsdom or zero-size → centered fallback)
  useEffect(() => {
    if (step < 0) return;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-guide="${STEPS[step].target}"]`);
      const r = el?.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        el!.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        setRect(null);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  const finish = useCallback((how: 'completed' | 'skipped') => {
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
    track(`create_guide_${how}`, { atStep: step + 1 });
    setStep(-1);
  }, [step]);

  const dialogRef = useFocusTrap<HTMLDivElement>(step >= 0, () => finish('skipped'));

  if (step < 0) return null;
  const s = stepCopy[step];
  const last = step === STEPS.length - 1;

  // Bubble: below the target (flip above if needed); no rect → screen center
  const cardStyle: React.CSSProperties = rect
    ? (() => {
        const below = rect.top + rect.height + 12;
        const flip = typeof window !== 'undefined' && below + 180 > window.innerHeight;
        return {
          position: 'fixed',
          top: flip ? Math.max(12, rect.top - 192) : below,
          left: Math.min(Math.max(12, rect.left), typeof window !== 'undefined' ? window.innerWidth - 372 : rect.left),
        };
      })()
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-[9000]">
      {/* Overlay (blocks stray clicks; the guide is modal) */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
      {/* Target highlight outline */}
      {rect && (
        <div
          aria-hidden="true"
          className="fixed rounded-lg pointer-events-none"
          style={{
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            outline: '2px solid var(--cinema-amber, #C9A35E)',
            boxShadow: '0 0 0 6px rgba(201,163,94,0.18), 0 0 40px rgba(201,163,94,0.25)',
          }}
        />
      )}
      {/* Bubble card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.workshopCreate.guideAria}
        tabIndex={-1}
        className="w-[360px] max-w-[calc(100vw-24px)] rounded-xl border border-[var(--cinema-amber-deep,#8A6E3F)] bg-[#16130f] p-4 shadow-2xl outline-none"
        style={cardStyle}
      >
        <div className="cinema-mono text-[10px] tracking-widest text-[var(--cinema-amber,#C9A35E)] mb-1.5">
          FIRST ROLL · {step + 1}/{STEPS.length}
        </div>
        <h3 className="text-[15px] font-semibold text-white mb-1">{s.title}</h3>
        <p className="text-[12.5px] leading-relaxed text-white/75 mb-3.5">{s.desc}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => finish('skipped')}
            className="text-[11px] text-white/60 hover:text-white/90 underline"
          >
            {t.workshopCreate.skipGuide}
          </button>
          <span className="flex-1" />
          {step > 0 && (
            <button
              type="button"
              onClick={() => { setStep(step - 1); }}
              className="cinema-btn !px-3 !py-1.5 !text-[12px]"
            >
              {t.workshopCreate.prevStep}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (last) { finish('completed'); return; }
              track(`create_guide_step${step + 2}`);
              setStep(step + 1);
            }}
            className="cinema-btn cinema-btn-primary !px-4 !py-1.5 !text-[12px]"
          >
            {last ? t.workshopCreate.startShoot : t.workshopCreate.nextStep}
          </button>
        </div>
      </div>
    </div>
  );
}

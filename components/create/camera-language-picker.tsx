'use client';

/**
 * components/create/camera-language-picker (v2.14 P0.2)
 *
 * Single-select chips for the 12 camera presets, cinema-btn style. onChange(id)
 * on select; click the same chip again to clear (back to undefined / auto push-in).
 *
 * Usage:
 *   <CameraLanguagePicker value={cameraId} onChange={setCameraId} />
 *
 * Data: lib/prompt-templates#CAMERA_LANGUAGE_PRESETS — edit presets only there.
 */

import { CAMERA_LANGUAGE_PRESETS } from '@/lib/prompt-templates';
import { useLocale } from '@/hooks/use-locale';

export interface CameraLanguagePickerProps {
  value?: string | null;
  onChange: (id: string | null) => void;
  /** Default false; true disables every chip (e.g. while a run is in progress) */
  disabled?: boolean;
  /** Extra className on the outer container */
  className?: string;
  /** Show the heading + hint row; default true */
  showHeading?: boolean;
}

export function CameraLanguagePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  showHeading = true,
}: CameraLanguagePickerProps) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const active = CAMERA_LANGUAGE_PRESETS.find((p) => p.id === value);
  const chipLabel = (p: (typeof CAMERA_LANGUAGE_PRESETS)[number]) =>
    locale === 'en' ? p.en : p.label;

  return (
    <div className={className}>
      {showHeading && (
        <div className="flex items-center justify-between mb-2">
          <span className="cinema-eyebrow">{t.workshopCreate.cameraLanguage}</span>
          {active ? (
            <span className="cinema-mono text-[10px] opacity-80 truncate max-w-[60%]" title={active.desc}>
              {chipLabel(active)} · {active.desc}
            </span>
          ) : (
            <span className="cinema-mono text-[10px] opacity-70">{t.workshopCreate.cameraDefault}</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.workshopCreate.cameraPresetsAria}>
        {CAMERA_LANGUAGE_PRESETS.map((p) => {
          const isActive = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onChange(isActive ? null : p.id)}
              title={`${chipLabel(p)} (${p.en}) · ${p.desc}`}
              className={`cinema-btn !px-2.5 !py-1 !text-[11px] cinema-mono transition-all ${
                isActive ? 'cinema-btn-primary' : ''
              }`}
            >
              {chipLabel(p)}
              <span className="opacity-50 ml-1 text-[9px] tracking-wide">{p.en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

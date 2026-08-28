'use client';

/**
 * ScriptViewerModal — viewer dedicated to script assets.
 *
 * The asset library used to handle script assets with
 * `alert(asset.data.synopsis || 'no content')` — a single line of plain text,
 * no boards, dialogue, action, or camera language.
 *
 * /api/assets already returns the full data (title / synopsis / shots[]),
 * so this just renders that structured payload as a readable shot script.
 *
 * Layout (aligned with types/agents.ts#ScriptShot):
 *   - title + one-line synopsis + act count
 *   - shots in order, each showing:
 *     · shot # / act # / Beat / duration
 *     · scene + action + emotion
 *     · dialogue (highlighted when present)
 *     · camera language (shot size / lens / angle / movement / lighting)
 *     · visual prompt / subtext (collapsible)
 *
 * Also:
 *   - ESC to close
 *   - copy full text (one click)
 *   - download .txt
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Copy, Download, Check, MagicWand as Wand2 } from '@phosphor-icons/react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';
import Link from 'next/link';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

interface MicroBeat {
  ts: string; startSec?: number; endSec?: number;
  action: string; camera?: string; dialogue?: string; audio?: string;
}

interface ScriptShot {
  shotNumber: number;
  sceneDescription?: string;
  action?: string;
  emotion?: string;
  characters?: string[];
  dialogue?: string;
  act?: number;
  storyBeat?: string;
  beat?: string;
  visualPrompt?: string;
  beats?: MicroBeat[];        // v12.6.0 per-second timecode beats
  beatFunction?: string;
  subtext?: string;
  emotionTemperature?: number;
  cameraWork?: string;
  soundDesign?: string;
  duration?: number;
  // v2.8 camera language
  shotSize?: string;
  lens?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lightingIntent?: string;
  composition?: string;
  editPattern?: string;
  whyThisChoice?: string;
  diegeticSound?: string;
  scoreMood?: string;
  rhythmicSync?: string;
}

interface ScriptData {
  title?: string;
  synopsis?: string;
  description?: string;
  genre?: string;
  style?: string;
  shots?: ScriptShot[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  data: ScriptData;
  /** When set, the toolbar gains a "Polish" button to /dashboard/polish?projectId=xxx */
  projectId?: string;
}

/** Serialize ScriptData to plain text for copy / download */
function scriptToText(name: string, data: ScriptData, t: KitT): string {
  const k = t.kitUi;
  const lines: string[] = [];
  lines.push(`《${data.title || name}》`);
  if (data.synopsis) lines.push(`\n${k.synopsis}:${data.synopsis}`);
  if (data.genre || data.style) {
    lines.push(`\n${k.genre}:${[data.genre, data.style].filter(Boolean).join(' · ')}`);
  }
  lines.push('');
  (data.shots || []).forEach((s) => {
    lines.push(`\n───── Shot ${s.shotNumber}${s.act ? ` · ${k.actN.replace('{n}', String(s.act))}` : ''} ${s.storyBeat || s.beat || ''} ─────`);
    if (s.sceneDescription) lines.push(`[${k.scene}] ${s.sceneDescription}`);
    if (s.characters?.length) lines.push(`[${k.characters}] ${s.characters.join('、')}`);
    if (s.action) lines.push(`[${k.action}] ${s.action}`);
    if (s.emotion) lines.push(`[${k.emotion}] ${s.emotion}`);
    if (s.dialogue) lines.push(`[${k.dialogueLabel}] ${s.dialogue}`);
    const cam = [s.shotSize, s.lens, s.cameraAngle, s.cameraMovement].filter(Boolean).join(' / ');
    if (cam) lines.push(`[${k.camera}] ${cam}`);
    if (s.lightingIntent) lines.push(`[${k.lighting}] ${s.lightingIntent}`);
    if (s.subtext) lines.push(`[${k.subtext}] ${s.subtext}`);
    if (s.beats?.length) { lines.push(`[${k.beatSheetPlain}]`); for (const b of s.beats) lines.push(`  ${b.ts} ${b.action}${b.camera ? ` 〔${b.camera}〕` : ''}${b.dialogue ? ` 💬${b.dialogue}` : ''}`); }
    if (s.visualPrompt) lines.push(`[${k.visualPrompt}] ${s.visualPrompt}`);
    if (s.duration) lines.push(`[${k.duration}] ${s.duration}s`);
  });
  return lines.join('\n');
}

export function ScriptViewerModal({ open, onOpenChange, name, data, projectId }: Props) {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Scroll lock (Escape is handled by useFocusTrap)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // v10.3.6 a11y: Escape + focus trap + restore focus
  const dialogRef = useFocusTrap<HTMLDivElement>(open, handleClose);

  const fullText = useMemo(() => scriptToText(name, data, t), [name, data, t]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        setCopied(false);
      },
    );
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || name || 'script'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!open || !mounted) return null;

  const shots = data.shots || [];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={handleClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={data.title || name || t.kitUi.scriptView}
        tabIndex={-1}
        className="relative w-[94vw] max-w-4xl h-[86vh] rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col outline-none"
        style={{ animation: 'zoomIn 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-black/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-purple-500/15 text-purple-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-white truncate">
                《{data.title || name}》
              </h3>
              <p className="text-[11px] text-[var(--muted)] truncate">
                {t.kitUi.scriptShotCount.replace('{n}', String(shots.length))}
                {data.genre ? ` · ${data.genre}` : ''}
                {data.style ? ` · ${data.style}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {projectId ? (
              <Link
                href={`/dashboard/polish?projectId=${encodeURIComponent(projectId)}`}
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg bg-[#E8C547]/15 hover:bg-[#E8C547]/25 transition-colors text-xs text-[#E8C547] flex items-center gap-1.5 border border-[#E8C547]/20"
                title={t.kitUi.polishTitle}
              >
                <Wand2 className="w-3.5 h-3.5" />
                {t.kitUi.polish}
              </Link>
            ) : null}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs text-white/70 flex items-center gap-1.5"
              title={t.kitUi.copyFull}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t.kitUi.copied : t.kitUi.copy}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs text-white/70 flex items-center gap-1.5"
              title={t.kitUi.downloadTxt}
            >
              <Download className="w-3.5 h-3.5" />
              {t.common.download}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={t.kitUi.closeEsc}
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Synopsis */}
          {data.synopsis || data.description ? (
            <div className="mb-6 pb-6 border-b border-[var(--border)]">
              <p className="text-[11px] text-[var(--muted)] tracking-wider uppercase mb-2">Synopsis</p>
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                {data.synopsis || data.description}
              </p>
            </div>
          ) : null}

          {/* Shots */}
          {shots.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted)]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t.kitUi.noShots}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {shots.map((shot, i) => (
                <ShotBlock key={shot.shotNumber ?? i} shot={shot} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ShotBlock({ shot, t }: { shot: ScriptShot; t: KitT }) {
  const k = t.kitUi;
  const camera = [shot.shotSize, shot.lens, shot.cameraAngle, shot.cameraMovement]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="bg-black/20 border border-[var(--border)] rounded-xl p-4 hover:bg-black/30 transition-colors">
      {/* Shot header */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="px-2 py-0.5 rounded-md bg-[#E8C547]/15 text-[#E8C547] text-xs font-mono font-bold">
          Shot {shot.shotNumber}
        </span>
        {shot.act ? (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[11px]">
            {k.actN.replace('{n}', String(shot.act))}
          </span>
        ) : null}
        {shot.storyBeat || shot.beat ? (
          <span className="text-[11px] text-cyan-300/80">
            {shot.storyBeat || shot.beat}
          </span>
        ) : null}
        {shot.beatFunction ? (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-mono uppercase">
            {shot.beatFunction}
          </span>
        ) : null}
        {shot.duration ? (
          <span className="ml-auto text-[11px] text-[var(--muted)] font-mono">
            {shot.duration}s
          </span>
        ) : null}
      </div>

      {/* v12.6.0 per-second timecode beat sheet — plot + camera to the second (replaces a single blob) */}
      {shot.beats && shot.beats.length > 0 ? (
        <div className="mb-3 rounded-lg border border-[#E8C547]/25 bg-black/30 p-3">
          <p className="text-[10px] text-[#E8C547] tracking-wider uppercase mb-2">⏱ {k.beatSheet}</p>
          <div className="flex flex-col gap-2">
            {shot.beats.map((b, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="shrink-0 mt-0.5 px-1.5 py-0.5 h-fit rounded bg-[#E8C547]/15 text-[#E8C547] text-[10px] font-mono font-bold">
                  {b.ts}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[12px] text-white/90 leading-snug">{b.action}</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--muted)] font-mono">
                    {b.camera ? <span>🎥 {b.camera}</span> : null}
                    {b.dialogue ? <span className="text-[#E8C547]/80 not-italic">💬 {b.dialogue}</span> : null}
                    {b.audio ? <span>🔊 {b.audio}</span> : null}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Scene */}
      {shot.sceneDescription ? (
        <Row label={k.scene}>
          {shot.sceneDescription}
        </Row>
      ) : null}

      {/* Cast */}
      {shot.characters?.length ? (
        <Row label={k.characters}>
          {shot.characters.join('、')}
        </Row>
      ) : null}

      {/* Action */}
      {shot.action ? (
        <Row label={k.action}>
          {shot.action}
        </Row>
      ) : null}

      {/* Dialogue — highlighted */}
      {shot.dialogue ? (
        <div className="mt-3 p-3 rounded-lg bg-[#E8C547]/8 border-l-2 border-[#E8C547]/70">
          <p className="text-[10px] text-[#E8C547] tracking-wider uppercase mb-1">{k.dialogueLabel} Dialogue</p>
          <p className="text-sm text-white/90 leading-relaxed italic whitespace-pre-wrap">
            {shot.dialogue}
          </p>
        </div>
      ) : null}

      {/* Emotion */}
      {shot.emotion ? (
        <Row label={k.emotion}>
          {shot.emotion}
          {typeof shot.emotionTemperature === 'number' ? k.emotionTemp.replace('{n}', String(shot.emotionTemperature)) : ''}
        </Row>
      ) : null}

      {/* Camera language */}
      {camera ? (
        <Row label={k.camera} mono>
          {camera}
        </Row>
      ) : null}

      {/* Lighting */}
      {shot.lightingIntent ? (
        <Row label={k.lighting}>
          {shot.lightingIntent}
        </Row>
      ) : null}

      {/* Composition */}
      {shot.composition ? (
        <Row label={k.composition}>
          {shot.composition}
        </Row>
      ) : null}

      {/* Sound */}
      {shot.diegeticSound || shot.scoreMood || shot.rhythmicSync ? (
        <Row label={k.sound}>
          {[shot.diegeticSound, shot.scoreMood, shot.rhythmicSync].filter(Boolean).join(' · ')}
        </Row>
      ) : null}

      {/* Subtext */}
      {shot.subtext ? (
        <Row label={k.subtext} italic>
          {shot.subtext}
        </Row>
      ) : null}

      {/* Visual Prompt */}
      {shot.visualPrompt ? (
        <div className="mt-2 text-[11px] text-[var(--muted)] italic leading-relaxed line-clamp-3">
          <span className="text-[10px] text-white/40 tracking-wider uppercase mr-2">Prompt</span>
          {shot.visualPrompt}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, children, mono, italic }: { label: string; children: React.ReactNode; mono?: boolean; italic?: boolean }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed py-1">
      <span className="shrink-0 w-14 text-[11px] text-[var(--muted)] tracking-wider uppercase pt-0.5">
        {label}
      </span>
      <span
        className={`text-white/85 ${mono ? 'font-mono text-[12px]' : ''} ${italic ? 'italic text-white/70' : ''}`}
      >
        {children}
      </span>
    </div>
  );
}

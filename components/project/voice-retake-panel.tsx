'use client';

/**
 * VoiceRetakePanel (v10.6.4) — VO retake workbench (inside dubbing/lipsync,
 * below the voice shelf).
 *
 * Per dialogue shot: line-level emotion (EMOTION_LABELS) → single-line retake
 * (rest of episode untouched) → A/B compare (dual <audio preload>, switch <1s)
 * → adopt (marks that shot's video stale). Multi-select batch retake
 * (PIPELINE_QUEUE=1 uses the retake queue).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Microphone, Play, Pause, CircleNotch, ArrowsClockwise, CheckCircle, CaretDown, CaretRight } from '@phosphor-icons/react';
import { EMOTION_LABELS } from '@/lib/tts-prosody';
import { getToken } from '@/lib/auth';
import { useLocale } from '@/hooks/use-locale';

interface TakeRow { id: string; audioUrl: string | null; emotion: string; durationSec?: number; createdAt: string; adopted: boolean }
interface ShotState {
  shotNumber: number; text: string; speaker: string; scriptEmotion: string;
  activeUrl: string | null; activeEmotion: string | null; activeVersion: number | null;
  takes: TakeRow[];
}

function authHeaders(): Record<string, string> {
  const tok = getToken();
  return { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) };
}

export function VoiceRetakePanel({ projectId }: { projectId: string }) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const [shots, setShots] = useState<ShotState[]>([]);
  const [open, setOpen] = useState(false);
  const [emotionPick, setEmotionPick] = useState<Record<number, string>>({});
  const [busyShot, setBusyShot] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [abSide, setAbSide] = useState<'A' | 'B'>('B');
  const [pickedTake, setPickedTake] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState('');
  const [batchBusy, setBatchBusy] = useState(false);
  const audioA = useRef<HTMLAudioElement | null>(null);
  // One hidden <audio preload> per take — switching take does not change src, so A/B stays <1s
  const takeAudios = useRef<Record<string, HTMLAudioElement | null>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-retake`);
      if (res.ok) setShots((await res.json()).shots || []);
    } catch { /* non-critical */ }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const retakeOne = async (s: ShotState) => {
    setBusyShot(s.shotNumber); setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-retake`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ shotNumber: s.shotNumber, emotion: emotionPick[s.shotNumber] || undefined }),
      });
      const b = await res.json();
      setNotice(b.ok
        ? t.projectPanels.retakeDone.replace('{n}', String(s.shotNumber)).replace('{emotion}', String(b.emotion))
        : (b.error || t.projectPanels.retakeFailed));
      if (b.ok) { setExpanded(s.shotNumber); setPickedTake(b.takeId); setAbSide('B'); }
      await refresh();
    } catch { setNotice(t.projectPanels.retakeFailed); }
    finally { setBusyShot(null); }
  };

  const retakeBatch = async () => {
    if (!checked.size) return;
    setBatchBusy(true); setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-retake`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ shots: Array.from(checked).map((n) => ({ shotNumber: n, emotion: emotionPick[n] || undefined })) }),
      });
      const b = await res.json();
      setNotice(b.queued
        ? t.projectPanels.batchQueued.replace('{n}', String(b.total)).replace('{id}', String(b.jobId))
        : t.projectPanels.batchDone.replace('{ok}', String(b.done?.ok ?? 0)).replace('{total}', String(b.done?.total ?? checked.size)));
      setChecked(new Set());
      await refresh();
    } catch { setNotice(t.projectPanels.batchFailed); }
    finally { setBatchBusy(false); }
  };

  const adopt = async (takeId: string) => {
    setNotice('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-retake`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ takeId }),
      });
      const b = await res.json();
      setNotice(b.ok
        ? t.projectPanels.adoptedNotice.replace('{n}', String(b.shotNumber)).replace('{stale}', String(b.staleMarked))
        : (b.error || t.projectPanels.adoptFailed));
      await refresh();
    } catch { setNotice(t.projectPanels.adoptFailed); }
  };

  // A/B switch: all nodes already preload; only pause/play — <1s
  const playSide = (side: 'A' | 'B', takeId?: string | null) => {
    setAbSide(side);
    const b = takeId ? takeAudios.current[takeId] : null;
    const on = side === 'A' ? audioA.current : b;
    audioA.current?.pause();
    for (const el of Object.values(takeAudios.current)) el?.pause();
    if (on) { on.currentTime = 0; on.play().catch(() => { /* autoplay blocked */ }); }
  };

  const stopAll = () => {
    audioA.current?.pause();
    for (const el of Object.values(takeAudios.current)) el?.pause();
  };

  if (!shots.length) return null;
  const takeCount = shots.reduce((n, s) => n + s.takes.length, 0);
  const defaultEmotion = EMOTION_LABELS[0];
  const emotionText = (raw: string) => {
    const row = EMOTION_LABELS.find((l) => l === raw) as (typeof EMOTION_LABELS[number] & { nameEn?: string; en?: string }) | undefined;
    if (!row) return raw;
    return locale === 'en' ? ((row as { nameEn?: string; en?: string }).nameEn || (row as { en?: string }).en || raw) : raw;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3" data-testid="voice-retake">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-1.5 text-[11px] text-white/70">
        {open ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
        <Microphone className="w-3.5 h-3.5" /> {t.projectPanels.retakeTitle.replace('{n}', String(shots.length))}{takeCount ? t.projectPanels.retakeTitleTakes.replace('{n}', String(takeCount)) : ''}{t.projectPanels.retakeTitleHint}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {notice && <div className="px-2.5 py-1.5 rounded-md bg-[#E8C547]/10 border border-[#E8C547]/30 text-[11px] text-[#E8C547]" role="status">{notice}</div>}

          {shots.map((s) => {
            const isExpanded = expanded === s.shotNumber;
            const take = s.takes.find((tk) => tk.id === pickedTake) || s.takes[0] || null;
            return (
              <div key={s.shotNumber} className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="checkbox" checked={checked.has(s.shotNumber)}
                    onChange={(e) => setChecked((prev) => { const n = new Set(prev); e.target.checked ? n.add(s.shotNumber) : n.delete(s.shotNumber); return n; })}
                    aria-label={t.projectPanels.selectShotAria.replace('{n}', String(s.shotNumber))} className="accent-[#E8C547]"
                  />
                  <span className="text-[10px] text-white/50 w-9 shrink-0">{t.projectPanels.shotN.replace('{n}', String(s.shotNumber))}</span>
                  <span className="text-[11px] text-white/75 flex-1 min-w-0 truncate" title={s.text}>{s.speaker ? `${s.speaker}:` : ''}{s.text}</span>
                  <select
                    value={emotionPick[s.shotNumber] ?? (s.activeEmotion || s.scriptEmotion || defaultEmotion)}
                    onChange={(e) => setEmotionPick((m) => ({ ...m, [s.shotNumber]: e.target.value }))}
                    aria-label={t.projectPanels.emotionAria.replace('{n}', String(s.shotNumber))}
                    className="bg-white/[0.04] border border-white/10 rounded px-1 py-0.5 text-[10px] text-white/80 outline-none shrink-0"
                  >
                    {EMOTION_LABELS.map((l) => (<option key={l} value={l} className="bg-[#1a1a24]">{emotionText(l)}</option>))}
                  </select>
                  <button onClick={() => retakeOne(s)} disabled={busyShot != null} title={t.projectPanels.retakeOneHint}
                    className="cinema-btn !px-1.5 !py-0.5 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50 shrink-0">
                    {busyShot === s.shotNumber ? <CircleNotch className="w-3 h-3 animate-spin" /> : <ArrowsClockwise className="w-3 h-3" />}{t.projectPanels.retake}
                  </button>
                  <button onClick={() => { stopAll(); setAbSide('B'); setExpanded(isExpanded ? null : s.shotNumber); setPickedTake(null); }}
                    className="text-[10px] text-white/45 hover:text-white shrink-0">
                    {t.projectPanels.versions.replace('{n}', String(s.takes.length))}{isExpanded ? ' ▲' : ' ▼'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-2 pl-6 space-y-1.5">
                    {/* A/B: current vs selected take (dual audio preload, switch plays immediately) */}
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className="text-white/45">{t.projectPanels.abListen}</span>
                      <button onClick={() => playSide('A')} disabled={!s.activeUrl}
                        className={`px-2 py-0.5 rounded border text-[10px] inline-flex items-center gap-1 disabled:opacity-40 ${abSide === 'A' ? 'border-[#E8C547]/60 text-[#E8C547]' : 'border-white/15 text-white/60'}`}>
                        {abSide === 'A' ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}{s.activeEmotion ? t.projectPanels.sideAEmotion.replace('{emotion}', emotionText(s.activeEmotion)) : t.projectPanels.sideA}
                      </button>
                      <button onClick={() => playSide('B', take?.id)} disabled={!take?.audioUrl}
                        className={`px-2 py-0.5 rounded border text-[10px] inline-flex items-center gap-1 disabled:opacity-40 ${abSide === 'B' ? 'border-[#E8C547]/60 text-[#E8C547]' : 'border-white/15 text-white/60'}`}>
                        {abSide === 'B' ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}{take ? t.projectPanels.sideBEmotion.replace('{emotion}', emotionText(take.emotion)) : t.projectPanels.sideB}
                      </button>
                      {s.activeUrl && <audio ref={audioA} src={s.activeUrl} preload="auto" />}
                      {s.takes.map((tk) => tk.audioUrl && (
                        <audio key={tk.id} ref={(el) => { takeAudios.current[tk.id] = el; }} src={tk.audioUrl} preload="auto" />
                      ))}
                      {!s.activeUrl && <span className="text-white/35">{t.projectPanels.noFullDub}</span>}
                    </div>

                    {s.takes.length === 0 ? (
                      <p className="text-[10px] text-white/35">{t.projectPanels.noRetakes}</p>
                    ) : s.takes.map((tk) => (
                      <div key={tk.id} className="flex items-center gap-2 text-[10.5px] text-white/60">
                        <button onClick={() => { setPickedTake(tk.id); playSide('B', tk.id); }}
                          className={`px-1.5 py-0.5 rounded border text-[10px] ${pickedTake === tk.id || (!pickedTake && tk === s.takes[0]) ? 'border-[#E8C547]/50 text-[#E8C547]' : 'border-white/15'}`}>
                          {emotionText(tk.emotion)}{tk.durationSec ? ` · ${tk.durationSec}s` : ''}
                        </button>
                        {tk.adopted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle className="w-3 h-3" />{t.projectPanels.adoptedBadge}</span>
                        ) : (
                          <button onClick={() => adopt(tk.id)} className="text-white/50 hover:text-white border border-white/15 rounded px-1.5 py-0.5 text-[10px]">{t.projectPanels.adoptThis}</button>
                        )}
                        <span className="text-white/25 text-[9px]">{new Date(tk.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={retakeBatch} disabled={batchBusy || checked.size === 0}
              className="cinema-btn cinema-btn-primary !px-2.5 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50">
              {batchBusy ? <CircleNotch className="w-3 h-3 animate-spin" /> : <Microphone className="w-3 h-3" />}
              {t.projectPanels.batchRetake.replace('{n}', String(checked.size))}
            </button>
            <span className="text-[10px] text-white/35">{t.projectPanels.adoptHint}</span>
          </div>
        </div>
      )}
    </div>
  );
}

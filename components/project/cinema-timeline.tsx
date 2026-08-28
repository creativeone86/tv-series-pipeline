'use client';

/**
 * v3.1 F.1 + F.2 — Cinema Timeline (multi-track + virtual scroll).
 *
 * 3-track layout:
 *   ┌───────────────────────────────────────┐
 *   │ KPI: shot count / duration / save     │
 *   ├───────────────────────────────────────┤
 *   │ SHOTS    [thumb][thumb][thumb]...     │  ← drag reorder + duration select
 *   ├───────────────────────────────────────┤
 *   │ BGM      [══ Act 1 ══][══ Act 2 ══]   │  ← drag-to-retime + mute
 *   ├───────────────────────────────────────┤
 *   │ SUBTITLE [📝 line 1] [📝 line 2] ...  │  ← drag-to-retime + edit text
 *   └───────────────────────────────────────┘
 *
 * Long films (>12 shots): virtual scroll, off-viewport shot cards are not rendered.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleNotch as Loader2, DotsSixVertical as GripVertical, Clock, FloppyDisk as Save, FilmStrip as Film, Chat as MessageSquare, MusicNotes as Music, SpeakerHigh as Volume2, SpeakerSlash as VolumeX, Pencil, ArrowCounterClockwise as RotateCcw, ArrowUUpLeft as Undo2, ArrowUUpRight as Redo2, Magnet, Microphone, Play } from '@phosphor-icons/react';
import { visibleRange, shouldVirtualize } from '@/lib/timeline-virtual';
import { useYjs } from '@/hooks/use-yjs';
import { useAudioWaveform, sliceWaveform } from '@/hooks/use-audio-waveform';
import { computeSnap } from '@/lib/timeline-snap';
import { computeRipple } from '@/lib/timeline-ripple';
import { bestAlignHint } from '@/lib/timeline-align';
import { TimelineHistory } from '@/lib/timeline-history';
import { useSegmentLocks, type LockEntry } from '@/hooks/use-segment-locks';
import { useLocale } from '@/hooks/use-locale';

interface TimelineShot {
  shotNumber: number;
  duration: number;
  dialogue: string;
  action?: string;
  sceneDescription?: string;
  characters?: string[];
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

interface TrackSegment {
  id: string;
  type: 'bgm' | 'subtitle' | 'narration';
  startSec: number;
  durationSec: number;
  label: string;
  muted: boolean;
  isEdited: boolean;
  /** v3.1.2 server-derived defaults, used by the client to compute offset */
  derivedStartSec: number;
  derivedDurationSec: number;
  /** v3.1.3 P1: BGM clips hang the full-film mp3 URL; slice to draw a real waveform */
  audioUrl?: string;
}

interface TimelineData {
  shots: TimelineShot[];
  totalDuration: number;
  tracks: { bgm: TrackSegment[]; subtitle: TrackSegment[]; narration?: TrackSegment[] };
}

interface PendingTrackEdit {
  trackType: 'bgm' | 'subtitle';
  segmentKey: string;
  muted?: boolean;
  startOffsetSec?: number;
  /** v3.1.2 drag right edge to change duration — absolute value, server stores override */
  durationOverrideSec?: number;
  customText?: string;
}

export interface CinemaTimelineProps {
  projectId: string;
  /** v3.1.2 P4: current user — Yjs cursor label + skip own cursor */
  currentUser?: { id: string; name: string; avatarUrl: string | null };
}

interface RemoteCursor {
  userId: string;
  userName: string;
  timeSec: number;
  color: string;
  /** Last update time — stale cursors are not rendered */
  updatedAt: number;
}

const CURSOR_COLORS = [
  '#E8C547', '#4DE0C2', '#F472B6', '#A78BFA',
  '#FB7185', '#34D399', '#60A5FA', '#FBBF24',
];
function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CURSOR_COLORS[h % CURSOR_COLORS.length];
}

const DURATION_OPTIONS = [3, 5, 6, 8, 10, 15, 20, 30];
const SHOT_CARD_WIDTH = 160;
const SHOT_CARD_GAP = 8;
const VIRTUAL_THRESHOLD = 12;

export function CinemaTimeline({ projectId, currentUser }: CinemaTimelineProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { projectView: Record<string, string> };
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [narrating, setNarrating] = useState(false); // v6.2.4 narration-track generation in progress
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  /** v3.1 F.1: pending track edits (merge multiple client-side ops) */
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingTrackEdit>>(new Map());
  const [pendingResets, setPendingResets] = useState<Set<string>>(new Set());
  /**
   * Sub-track drag state — dragging a BGM/subtitle clip.
   * v3.1.2 three modes: move whole clip / left-edge changes startOffset keeping endSec / right-edge changes durationOverride.
   * derivedStartSec is the server-derived default; write back absoluteStart - derived as offset.
   */
  const [trackDrag, setTrackDrag] = useState<{
    trackType: 'bgm' | 'subtitle';
    segmentKey: string;
    startX: number;
    /** Segment startSec at drag start (absolute) */
    initialStartSec: number;
    /** Segment durationSec at drag start (absolute) */
    initialDurationSec: number;
    /** Derived startSec (server-side derived) */
    derivedStartSec: number;
    /** Derived durationSec (server-side derived) */
    derivedDurationSec: number;
    /** Operation type */
    mode: 'move' | 'resize-left' | 'resize-right';
  } | null>(null);
  /** Subtitle text-edit modal — simple inline edit */
  const [editingSub, setEditingSub] = useState<{ segmentKey: string; text: string } | null>(null);

  /** v3.2 F.2: virtual scroll state */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  /** v3.1.2 P4: multiplayer timeline cursors via Yjs awareness */
  const yjs = useYjs(currentUser ? `project-${projectId}` : null);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  /** v3.1.3 P2: snap hit — currently flashing segmentKey, cleared after 200ms */
  const [snapFlash, setSnapFlash] = useState<string | null>(null);
  /** v3.1.3 P4: collab segment locks — detect others' locks; also acquire on drag start */
  const segLocks = useSegmentLocks(
    currentUser ? projectId : null,
    currentUser ? { id: currentUser.id, name: currentUser.name, color: pickColor(currentUser.id) } : null,
  );
  /** Toast when lock acquire fails (auto-clear in 3s) */
  const [lockToast, setLockToast] = useState<{ segmentKey: string; lockedBy: string } | null>(null);
  /** Container ref — map mouseX to timeSec and write to awareness */
  const tracksContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorBroadcastThrottleRef = useRef<number>(0);
  const [viewportWidth, setViewportWidth] = useState(800);

  // ─── v3.3.1: undo/redo + ripple + alignment guide ───────────────────────────
  /** Edit history stack (snapshot of data + pendingEdits + pendingResets). */
  const historyRef = useRef(new TimelineHistory<TimelineSnapshot>(50));
  /** Force re-render of undo/redo enabled state when stack depth changes. */
  const [historyTick, setHistoryTick] = useState(0);
  /** ripple mode: later clips move when you drag/edit one. */
  const [rippleMode, setRippleMode] = useState(false);
  /** Alignment-guide global position (seconds) while dragging; null = hidden. */
  const [alignGuideSec, setAlignGuideSec] = useState<number | null>(null);

  type TimelineSnapshot = {
    data: TimelineData | null;
    pendingEdits: Map<string, PendingTrackEdit>;
    pendingResets: Set<string>;
  };

  /** Deep-copy snapshot of the current editable state. */
  const snapshotNow = useCallback((): TimelineSnapshot => ({
    data: data ? (typeof structuredClone === 'function'
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data))) : null,
    pendingEdits: new Map(pendingEdits),
    pendingResets: new Set(pendingResets),
  }), [data, pendingEdits, pendingResets]);

  /** Call before an edit: push current state onto the undo stack. */
  const pushHistory = useCallback(() => {
    historyRef.current.push(snapshotNow());
    setHistoryTick((t) => t + 1);
  }, [snapshotNow]);

  const applySnapshot = useCallback((s: TimelineSnapshot) => {
    setData(s.data);
    setPendingEdits(new Map(s.pendingEdits));
    setPendingResets(new Set(s.pendingResets));
    setDirty(true);
  }, []);

  const doUndo = useCallback(() => {
    const prev = historyRef.current.undo(snapshotNow());
    if (prev) { applySnapshot(prev); setHistoryTick((t) => t + 1); }
  }, [snapshotNow, applySnapshot]);

  const doRedo = useCallback(() => {
    const next = historyRef.current.redo(snapshotNow());
    if (next) { applySnapshot(next); setHistoryTick((t) => t + 1); }
  }, [snapshotNow, applySnapshot]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/timeline`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      // tracks: compatible with older payloads (empty when the field is missing)
      const tracks = body.tracks || { bgm: [], subtitle: [], narration: [] };
      setData({ ...body, tracks });
      setError(null);
      setDirty(false);
      setPendingEdits(new Map());
      setPendingResets(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  // v6.2.4: synthesize a narration track from shot copy → write to disk + splice into timeline, then refresh
  const genNarration = useCallback(async () => {
    if (!data) return;
    const text = data.shots
      .map((s) => s.sceneDescription || s.action || s.dialogue || '')
      .filter(Boolean)
      .join('\n');
    setNarrating(true);
    try {
      await fetch(`/api/projects/${encodeURIComponent(projectId)}/narration`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text || t.projectView.defaultNarration, mode: 'narrator' }),
      });
      await refresh();
    } catch { /* ignore */ }
    finally { setNarrating(false); }
  }, [data, projectId, refresh]);

  // Watch viewport resize for virtual scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setViewportWidth(el.clientWidth);
    const onResize = () => setViewportWidth(el.clientWidth);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  // shot drag
  const handleShotDragStart = (i: number) => setDragIndex(i);
  const handleShotDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragOverIndex !== i) setDragOverIndex(i);
  };
  const handleShotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex == null || dragOverIndex == null || dragIndex === dragOverIndex || !data) {
      setDragIndex(null); setDragOverIndex(null);
      return;
    }
    pushHistory();
    const next = [...data.shots];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dragOverIndex, 0, moved);
    setData({ ...data, shots: next });
    setDirty(true);
    setDragIndex(null); setDragOverIndex(null);
  };

  const updateDuration = (shotNumber: number, duration: number) => {
    if (!data) return;
    pushHistory();
    const next = data.shots.map((s) => s.shotNumber === shotNumber ? { ...s, duration } : s);
    const totalDuration = next.reduce((sum, s) => sum + (s.duration || 0), 0);
    setData({ ...data, shots: next, totalDuration });
    setDirty(true);
  };

  // Track segment ops
  const stagePendingEdit = (trackType: 'bgm' | 'subtitle', segmentKey: string, patch: Partial<PendingTrackEdit>) => {
    setPendingEdits((prev) => {
      const next = new Map(prev);
      const key = `${trackType}:${segmentKey}`;
      const existing = next.get(key) || { trackType, segmentKey };
      next.set(key, { ...existing, ...patch });
      return next;
    });
    setDirty(true);
  };

  const toggleMute = (trackType: 'bgm' | 'subtitle', segment: TrackSegment) => {
    pushHistory();
    stagePendingEdit(trackType, segment.id, { muted: !segment.muted });
    // Optimistic local state update
    if (!data) return;
    const tracks = { ...data.tracks };
    tracks[trackType] = tracks[trackType].map((s) =>
      s.id === segment.id ? { ...s, muted: !s.muted, isEdited: true } : s,
    );
    setData({ ...data, tracks });
  };

  const resetSegment = (trackType: 'bgm' | 'subtitle', segment: TrackSegment) => {
    pushHistory();
    setPendingResets((prev) => new Set(prev).add(`${trackType}:${segment.id}`));
    // Also drop any pendingEdits for this clip
    setPendingEdits((prev) => {
      const next = new Map(prev);
      next.delete(`${trackType}:${segment.id}`);
      return next;
    });
    setDirty(true);
  };

  // Subtitle text rewrite
  const commitSubText = () => {
    if (!editingSub || !data) return;
    pushHistory();
    stagePendingEdit('subtitle', editingSub.segmentKey, { customText: editingSub.text });
    const tracks = { ...data.tracks };
    tracks.subtitle = tracks.subtitle.map((s) =>
      s.id === editingSub.segmentKey ? { ...s, label: editingSub.text, isEdited: true } : s,
    );
    setData({ ...data, tracks });
    setEditingSub(null);
  };

  // Drag segment — three modes: move / resize-left / resize-right
  const handleTrackDragStart = (
    e: React.MouseEvent,
    trackType: 'bgm' | 'subtitle',
    segment: TrackSegment,
    mode: 'move' | 'resize-left' | 'resize-right' = 'move',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // v3.1.3 P4: try to acquire the collab lock; fail → someone else is editing, toast and block drag
    const acquired = segLocks.tryAcquire(segment.id);
    if (!acquired) {
      const lock = segLocks.locks[segment.id];
      setLockToast({ segmentKey: segment.id, lockedBy: lock?.userName || t.projectView.anotherUser });
      setTimeout(() => setLockToast(null), 3000);
      return;
    }
    // v3.3.1: one undo snapshot per drag gesture (not every mousemove)
    pushHistory();
    setTrackDrag({
      trackType,
      segmentKey: segment.id,
      startX: e.clientX,
      initialStartSec: segment.startSec,
      initialDurationSec: segment.durationSec,
      derivedStartSec: segment.derivedStartSec,
      derivedDurationSec: segment.derivedDurationSec,
      mode,
    });
  };
  useEffect(() => {
    if (!trackDrag || !data) return;
    const pxPerSec = (viewportWidth || 800) / Math.max(1, data.totalDuration);

    const handleMove = (e: MouseEvent) => {
      const deltaSec = (e.clientX - trackDrag.startX) / pxPerSec;
      setData((d) => {
        if (!d) return d;
        const tracks = { ...d.tracks };
        const siblings = tracks[trackDrag.trackType];

        // 1) compute proposed (no snap)
        let proposedStart: number;
        let proposedDuration: number;
        if (trackDrag.mode === 'move') {
          proposedStart = Math.max(0, trackDrag.initialStartSec + deltaSec);
          proposedDuration = trackDrag.initialDurationSec;
        } else if (trackDrag.mode === 'resize-right') {
          proposedStart = trackDrag.initialStartSec;
          proposedDuration = Math.max(0.5, trackDrag.initialDurationSec + deltaSec);
        } else {
          // resize-left
          const initialEnd = trackDrag.initialStartSec + trackDrag.initialDurationSec;
          const clampedStart = Math.max(0, Math.min(initialEnd - 0.5, trackDrag.initialStartSec + deltaSec));
          proposedStart = clampedStart;
          proposedDuration = initialEnd - clampedStart;
        }

        // 2) v3.1.3 P2: snap to neighbors + hard clamp to prevent overlap
        const snapInput = {
          selfId: trackDrag.segmentKey,
          allSegments: siblings.map((s) => ({ id: s.id, startSec: s.startSec, durationSec: s.durationSec })),
          proposedStart,
          proposedDuration,
          totalDuration: d.totalDuration,
        };
        const snap = computeSnap(snapInput);
        if (snap.snapped) {
          setSnapFlash(trackDrag.segmentKey);
          setTimeout(() => setSnapFlash((cur) => cur === trackDrag.segmentKey ? null : cur), 200);
        }

        // v3.3.1: alignment guide — nearest left/right/center candidate, draw a vertical line
        const align = bestAlignHint({
          selfId: trackDrag.segmentKey,
          allSegments: siblings.map((s) => ({ id: s.id, startSec: s.startSec, durationSec: s.durationSec })),
          proposedStart: snap.startSec,
          durationSec: snap.durationSec,
        });
        setAlignGuideSec(align ? align.guideSec : null);

        tracks[trackDrag.trackType] = siblings.map((s) => {
          if (s.id !== trackDrag.segmentKey) return s;
          if (trackDrag.mode === 'resize-right') {
            return { ...s, durationSec: snap.durationSec, isEdited: true };
          }
          return { ...s, startSec: snap.startSec, durationSec: snap.durationSec, isEdited: true };
        });
        return { ...d, tracks };
      });
    };

    const handleUp = () => {
      if (!data || !trackDrag) return;
      const trackArr = data.tracks[trackDrag.trackType];
      const seg = trackArr.find((s) => s.id === trackDrag.segmentKey);
      if (seg) {
        // v3.1.2 fix: compute absolute offset from derivedStartSec so repeated drags stay correct.
        const patch: Partial<PendingTrackEdit> = {};
        if (trackDrag.mode === 'move' || trackDrag.mode === 'resize-left') {
          patch.startOffsetSec = seg.startSec - trackDrag.derivedStartSec;
        }
        if (trackDrag.mode === 'resize-left' || trackDrag.mode === 'resize-right') {
          patch.durationOverrideSec = seg.durationSec;
        }
        if (Object.keys(patch).length > 0) {
          stagePendingEdit(trackDrag.trackType, trackDrag.segmentKey, patch);
        }

        // v3.3.1: ripple — later clips follow (only move / resize-right push downstream)
        if (rippleMode && (trackDrag.mode === 'move' || trackDrag.mode === 'resize-right')) {
          const deltaSec = trackDrag.mode === 'resize-right'
            ? seg.durationSec - trackDrag.initialDurationSec
            : seg.startSec - trackDrag.initialStartSec;
          const anchorSec = trackDrag.initialStartSec + trackDrag.initialDurationSec;
          if (Math.abs(deltaSec) > 0.01) {
            const ripple = computeRipple({
              editedId: trackDrag.segmentKey,
              allSegments: trackArr.map((s) => ({ id: s.id, startSec: s.startSec, durationSec: s.durationSec })),
              deltaSec, anchorSec, totalDuration: data.totalDuration,
            });
            if (ripple.shiftedIds.length > 0) {
              const shiftMap = new Map(ripple.segments.map((s) => [s.id, s]));
              setData((d) => {
                if (!d) return d;
                const tracks = { ...d.tracks };
                tracks[trackDrag.trackType] = d.tracks[trackDrag.trackType].map((s) => {
                  const r = shiftMap.get(s.id);
                  return r && ripple.shiftedIds.includes(s.id)
                    ? { ...s, startSec: r.startSec, isEdited: true } : s;
                });
                return { ...d, tracks };
              });
              for (const id of ripple.shiftedIds) {
                const shifted = shiftMap.get(id);
                const orig = trackArr.find((s) => s.id === id);
                if (shifted && orig) {
                  stagePendingEdit(trackDrag.trackType, id, { startOffsetSec: shifted.startSec - orig.derivedStartSec });
                }
              }
            }
          }
        }
      }
      // v3.1.3 P4: release collab lock
      if (trackDrag) segLocks.release(trackDrag.segmentKey);
      setTrackDrag(null);
      setAlignGuideSec(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [trackDrag, data, viewportWidth, rippleMode]);

  // ─── v3.3.1: undo/redo hotkeys (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z / Ctrl+Y) ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
      else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); doRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo, doRedo]);

  // ─── v3.1.2 P4: Yjs awareness timeline cursors ─────────────────────────────
  // Local: setLocalStateField('timelineCursor', { timeSec, color }) — 50ms throttle
  // Remote: awareness.on('change') → render RemoteCursor[]
  useEffect(() => {
    if (!yjs || !currentUser) return;
    const aw = yjs.provider.awareness;
    const onChange = () => {
      const states = Array.from(aw.getStates().entries());
      const now = Date.now();
      const remote: RemoteCursor[] = [];
      for (const [clientId, state] of states) {
        const u = (state as any)?.user;
        const cur = (state as any)?.timelineCursor;
        if (!u || !u.id || !cur || typeof cur.timeSec !== 'number') continue;
        if (u.id === currentUser.id) continue; // skip self
        void clientId;
        remote.push({
          userId: String(u.id),
          userName: String(u.name || t.projectView.anonymous),
          timeSec: cur.timeSec,
          color: typeof cur.color === 'string' ? cur.color : pickColor(String(u.id)),
          updatedAt: now,
        });
      }
      setRemoteCursors(remote);
    };
    aw.on('change', onChange);
    onChange();
    return () => aw.off('change', onChange);
  }, [yjs, currentUser]);

  // Local mousemove → write awareness (50ms throttle)
  const handleTracksMouseMove = useCallback((e: React.MouseEvent) => {
    if (!yjs || !currentUser || !data) return;
    const now = performance.now();
    if (now - cursorBroadcastThrottleRef.current < 50) return;
    cursorBroadcastThrottleRef.current = now;
    const container = tracksContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left + container.scrollLeft;
    const totalWidth = data.shots.length * (SHOT_CARD_WIDTH + SHOT_CARD_GAP);
    const pxPerSecLocal = data.totalDuration > 0 ? totalWidth / data.totalDuration : 0;
    if (pxPerSecLocal <= 0) return;
    const timeSec = Math.max(0, Math.min(data.totalDuration, relX / pxPerSecLocal));
    try {
      yjs.provider.awareness.setLocalStateField('timelineCursor', {
        timeSec,
        color: pickColor(currentUser.id),
      });
    } catch { /* ignore */ }
  }, [yjs, currentUser, data]);

  // Leave the timeline container → clear own cursor (others stop seeing the ghost cursor)
  const handleTracksMouseLeave = useCallback(() => {
    if (!yjs || !currentUser) return;
    try {
      yjs.provider.awareness.setLocalStateField('timelineCursor', null);
    } catch { /* ignore */ }
  }, [yjs, currentUser]);

  const save = async () => {
    if (saving || !data) return;
    setSaving(true);
    setError(null);
    try {
      const shotOrder = data.shots.map((s) => s.shotNumber);
      const durations: Record<string, number> = {};
      data.shots.forEach((s) => { durations[String(s.shotNumber)] = s.duration; });
      const trackEdits = Array.from(pendingEdits.values());
      const trackResets = Array.from(pendingResets).map((k) => {
        const [trackType, segmentKey] = k.split(':');
        return { trackType, segmentKey };
      });
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotOrder, durations, trackEdits, trackResets }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || t.projectView.saveFailedStatus.replace('{status}', String(res.status)));
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectView.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cinema-card-hi p-6 text-center inline-flex items-center justify-center gap-2 w-full">
        <Loader2 className="w-4 h-4 animate-spin opacity-50" />
        <span className="cinema-mono text-[11px] opacity-50">{t.projectView.loadingTimeline}</span>
      </div>
    );
  }

  if (!data || data.shots.length === 0) {
    return (
      <div className="cinema-card-hi p-6 text-center">
        <Film className="w-8 h-8 mx-auto opacity-30 mb-2" />
        <div className="cinema-mono text-[11px] opacity-50">
          {t.projectView.emptyTimeline}
        </div>
      </div>
    );
  }

  // v3.1 F.2: virtual scroll — only when >12 shots
  const virtualize = shouldVirtualize(data.shots.length, VIRTUAL_THRESHOLD);
  const virt = virtualize
    ? visibleRange({
        totalCount: data.shots.length,
        itemWidth: SHOT_CARD_WIDTH,
        scrollLeft,
        viewportWidth,
        gap: SHOT_CARD_GAP,
        buffer: 2,
      })
    : { startIdx: 0, endIdx: data.shots.length, leftPad: 0, rightPad: 0 };
  const visibleShots = data.shots.slice(virt.startIdx, virt.endIdx);

  // px / sec for track-clip rendering
  const totalWidth = data.shots.length * (SHOT_CARD_WIDTH + SHOT_CARD_GAP);
  const pxPerSec = data.totalDuration > 0 ? totalWidth / data.totalDuration : 0;

  return (
    <div className="space-y-3">
      {/* Header KPI */}
      <div className="cinema-card-hi p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="cinema-eyebrow flex items-center gap-1.5">
            <Film className="w-3 h-3" />
            CINEMA TIMELINE
          </div>
          <span className="cinema-mono text-[11px] opacity-70">
            {t.projectView.shotsDuration.replace('{n}', String(data.shots.length)).replace('{sec}', String(Math.round(data.totalDuration)))}
            {virtualize && (
              <span className="ml-2 opacity-50">
                {t.projectView.virtualOn.replace('{start}', String(virt.startIdx + 1)).replace('{end}', String(virt.endIdx)).replace('{total}', String(data.shots.length))}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* v3.3.1: undo / redo / ripple toggle */}
          <button
            onClick={doUndo}
            disabled={!historyRef.current.canUndo()}
            title={t.projectView.undoTitle}
            className="cinema-btn !px-2 !py-1 !text-[11px] inline-flex items-center gap-1 disabled:opacity-30"
          >
            <Undo2 className="w-3 h-3" />
          </button>
          <button
            onClick={doRedo}
            disabled={!historyRef.current.canRedo()}
            title={t.projectView.redoTitle}
            className="cinema-btn !px-2 !py-1 !text-[11px] inline-flex items-center gap-1 disabled:opacity-30"
          >
            <Redo2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setRippleMode((v) => !v)}
            title={t.projectView.rippleTitle}
            className={`cinema-btn !px-2 !py-1 !text-[11px] inline-flex items-center gap-1 ${rippleMode ? 'cinema-btn-primary' : ''}`}
          >
            <Magnet className="w-3 h-3" />
            {rippleMode ? t.projectView.rippleOn : t.projectView.rippleOff}
          </button>
          {/* historyTick forces undo/redo enabled-state re-render */}
          <span className="hidden">{historyTick}</span>
          {dirty && (
            <span className="cinema-mono text-[10px] text-[var(--cinema-amber)]">{t.projectView.unsaved}</span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="cinema-btn cinema-btn-primary !px-3 !py-1 !text-[11px] inline-flex items-center gap-1 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {t.common.save}
          </button>
        </div>
      </div>

      {error && (
        <div className="cinema-card p-2 border-[var(--cinema-red)]/40">
          <span className="cinema-mono text-[10px] text-[var(--cinema-red)]">✗ {error}</span>
        </div>
      )}

      {/* SHOTS Track — drag reorder + virtual scroll */}
      <div className="cinema-card-hi p-3">
        <div className="cinema-eyebrow mb-2 flex items-center gap-1.5">
          <Film className="w-3 h-3" />
          {t.projectView.shotsTrackHint}
        </div>
        <div
          ref={scrollRef}
          className="overflow-x-auto custom-scrollbar"
          onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
        >
          <div className="flex gap-2 min-h-[180px]" style={{ paddingLeft: virt.leftPad, paddingRight: virt.rightPad }}>
            {visibleShots.map((shot, virtI) => {
              const i = virt.startIdx + virtI;
              const isDragging = dragIndex === i;
              const isDragOver = dragOverIndex === i && dragIndex !== i;
              return (
                <div
                  key={`${shot.shotNumber}-${i}`}
                  draggable
                  onDragStart={() => handleShotDragStart(i)}
                  onDragOver={(e) => handleShotDragOver(e, i)}
                  onDrop={handleShotDrop}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  style={{ width: SHOT_CARD_WIDTH, flexShrink: 0 }}
                  className={`rounded-md border ${
                    isDragOver ? 'border-[var(--cinema-amber)] bg-[var(--cinema-amber)]/5' : 'border-[var(--cinema-border)]'
                  } ${isDragging ? 'opacity-50' : ''} cursor-move transition-all`}
                >
                  <div className="aspect-video bg-black/60 rounded-t-md overflow-hidden grid place-items-center">
                    {shot.thumbnailUrl && /^https?:|^\/api\//i.test(shot.thumbnailUrl) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img loading="lazy" decoding="async" src={shot.thumbnailUrl} alt={`shot ${shot.shotNumber}`} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <Film className="w-6 h-6 opacity-30" />
                    )}
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 opacity-40 flex-shrink-0" />
                      <span className="cinema-mono text-[10px] tracking-widest opacity-70 flex-1">
                        SHOT {String(shot.shotNumber).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 opacity-50" />
                      <select
                        value={shot.duration}
                        onChange={(e) => updateDuration(shot.shotNumber, parseInt(e.target.value, 10))}
                        className="cinema-mono text-[10px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded px-1 py-0.5 flex-1"
                      >
                        {[...new Set([...DURATION_OPTIONS, shot.duration])].sort((a, b) => a - b).map((d) => (
                          <option key={d} value={d}>{d}s</option>
                        ))}
                      </select>
                    </div>
                    {shot.dialogue && (
                      <div className="cinema-mono text-[9px] opacity-60 line-clamp-2 inline-flex items-start gap-1">
                        <MessageSquare className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                        <span>{shot.dialogue}</span>
                      </div>
                    )}
                    {shot.characters && shot.characters.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {shot.characters.slice(0, 2).map((c) => (
                          <span key={c} className="cinema-mono text-[8px] px-1 py-0.5 rounded bg-[var(--cinema-amber)]/10 text-[var(--cinema-amber)]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* v3.1.2 P4: BGM + Subtitle tracks + live cursor overlay in one ref container */}
      <div
        ref={tracksContainerRef}
        className="relative space-y-3"
        onMouseMove={handleTracksMouseMove}
        onMouseLeave={handleTracksMouseLeave}
      >
        {/* BGM Track — v3.1.2 waveform + dual-edge resize */}
        <TrackRow
          title={t.projectView.bgmTrackTitle}
          icon={<Music className="w-3 h-3" />}
          segments={data.tracks.bgm}
          totalDuration={data.totalDuration}
          pxPerSec={pxPerSec}
          trackType="bgm"
          onMuteToggle={toggleMute}
          onReset={resetSegment}
          onDragStart={handleTrackDragStart}
          showWaveform
          snapFlashId={snapFlash}
          remoteLocks={segLocks.locks}
          currentUserId={currentUser?.id}
          accentColor="amber"
        />

        {/* Subtitle Track — v3.1.2 dual-edge resize to change duration */}
        <TrackRow
          title={t.projectView.subtitleTrackTitle}
          icon={<MessageSquare className="w-3 h-3" />}
          segments={data.tracks.subtitle}
          totalDuration={data.totalDuration}
          pxPerSec={pxPerSec}
          trackType="subtitle"
          onMuteToggle={toggleMute}
          onReset={resetSegment}
          onDragStart={handleTrackDragStart}
          onEditText={(seg) => setEditingSub({ segmentKey: seg.id, text: seg.label })}
          snapFlashId={snapFlash}
          remoteLocks={segLocks.locks}
          currentUserId={currentUser?.id}
          accentColor="cyan"
        />

        {/* v6.2.4: generate / regenerate narration track (TTS from shot copy + disk + splice) */}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={genNarration}
            disabled={narrating}
            className="px-2.5 py-1 rounded text-[10px] font-medium border transition-all hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1"
            style={{ background: 'color-mix(in srgb, var(--cinema-violet) 14%, transparent)', color: 'var(--cinema-violet)', borderColor: 'color-mix(in srgb, var(--cinema-violet) 32%, transparent)' }}
          >
            <Microphone size={11} weight="fill" /> {narrating ? t.product.generating : (data.tracks.narration && data.tracks.narration.length > 0 ? t.projectView.regenNarration : t.projectView.genNarration)}
          </button>
          <span className="text-[10px] text-[var(--soft)]">{t.projectView.narrationHint}</span>
        </div>

        {/* v6.2.4: narration track (read-only) — real audio on disk; subs already on SUBTITLE for burn-in */}
        {data.tracks.narration && data.tracks.narration.length > 0 && (() => {
          const narr = data.tracks.narration;
          const narrEnd = narr.reduce((m, s) => Math.max(m, s.startSec + s.durationSec), 0);
          const laneWidth = Math.max(data.totalDuration, narrEnd) * pxPerSec;
          return (
            <div className="mt-1.5">
              <div className="flex items-center gap-1.5 text-[10px] mb-1 px-1" style={{ color: 'color-mix(in srgb, var(--cinema-violet) 88%, var(--cinema-text-2))' }}>
                <Microphone size={11} weight="fill" /><span>{t.projectView.narrationTrack}</span>
              </div>
              <div className="relative h-9 rounded-md border" style={{ width: laneWidth, background: 'color-mix(in srgb, var(--cinema-violet) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--cinema-violet) 18%, transparent)' }}>
                {narr.map((seg) => (
                  <div
                    key={seg.id}
                    className="absolute top-1 bottom-1 rounded px-1.5 flex items-center gap-1 overflow-hidden border"
                    style={{ left: seg.startSec * pxPerSec, width: Math.max(10, seg.durationSec * pxPerSec), background: 'color-mix(in srgb, var(--cinema-violet) 22%, transparent)', borderColor: 'color-mix(in srgb, var(--cinema-violet) 34%, transparent)' }}
                    title={seg.label}
                  >
                    {seg.audioUrl && (
                      <a href={seg.audioUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:brightness-125 inline-flex" style={{ color: 'var(--cinema-violet)' }} title={t.projectView.playDownload}><Play size={10} weight="fill" /></a>
                    )}
                    <span className="text-[10px] truncate" style={{ color: 'color-mix(in srgb, var(--cinema-violet) 70%, var(--cinema-text))' }}>{seg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* v3.3.1: alignment guide — left/right/center snap position while dragging */}
        {alignGuideSec != null && trackDrag && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{ left: alignGuideSec * pxPerSec, transform: 'translateX(-1px)' }}
            aria-hidden="true"
          >
            <div className="w-px h-full bg-[var(--cinema-magenta,#e879f9)] opacity-80"
              style={{ backgroundImage: 'repeating-linear-gradient(to bottom, currentColor 0 4px, transparent 4px 8px)', color: '#e879f9' }} />
          </div>
        )}

        {/* v3.1.2 P4: remote collaborator cursors — vertical line + name across both tracks */}
        {remoteCursors.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
            {remoteCursors.map((c) => {
              const left = c.timeSec * pxPerSec;
              return (
                <div
                  key={c.userId}
                  className="absolute top-0 bottom-0 flex flex-col items-start"
                  style={{ left, transform: 'translateX(-1px)' }}
                >
                  <div
                    className="w-0.5 h-full opacity-80"
                    style={{ background: c.color, boxShadow: `0 0 4px ${c.color}` }}
                  />
                  <div
                    className="absolute -top-1 left-1 px-1 py-0.5 rounded cinema-mono text-[9px] whitespace-nowrap"
                    style={{ background: c.color, color: '#000' }}
                  >
                    {c.userName}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* v3.1.3 P4: lock-conflict toast — shown when dragging a clip locked by someone else */}
      {lockToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 cinema-card-hi px-4 py-2 flex items-center gap-2 shadow-2xl border-[var(--cinema-amber)]/50">
          <span className="cinema-mono text-[11px]">
            🔒 <span className="text-[var(--cinema-amber)]">{lockToast.lockedBy}</span> {t.projectView.lockToast}
          </span>
        </div>
      )}

      {/* Subtitle rewrite modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--cinema-surface)] border border-[var(--cinema-border-hi)] p-4 space-y-3">
            <div className="cinema-eyebrow">{t.projectView.rewriteSubtitle}</div>
            <textarea
              value={editingSub.text}
              onChange={(e) => setEditingSub({ ...editingSub, text: e.target.value })}
              rows={3}
              maxLength={300}
              className="w-full px-2 py-1.5 cinema-mono text-[11px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded resize-y"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingSub(null)} className="cinema-btn !px-3 !py-1 !text-[11px]">{t.common.cancel}</button>
              <button onClick={commitSubText} className="cinema-btn cinema-btn-primary !px-3 !py-1 !text-[11px]">{t.common.save}</button>
            </div>
          </div>
        </div>
      )}

      <div className="cinema-mono text-[10px] opacity-50 leading-relaxed">
        {t.projectView.timelineHelp}
      </div>
    </div>
  );
}

// ─── Subcomponent: one track row ─────────────────────────────────────────────
interface TrackRowProps {
  title: string;
  icon: React.ReactNode;
  segments: TrackSegment[];
  totalDuration: number;
  pxPerSec: number;
  trackType: 'bgm' | 'subtitle';
  onMuteToggle: (trackType: 'bgm' | 'subtitle', segment: TrackSegment) => void;
  onReset: (trackType: 'bgm' | 'subtitle', segment: TrackSegment) => void;
  onDragStart: (
    e: React.MouseEvent,
    trackType: 'bgm' | 'subtitle',
    segment: TrackSegment,
    mode?: 'move' | 'resize-left' | 'resize-right',
  ) => void;
  onEditText?: (segment: TrackSegment) => void;
  /** v3.1.2 draw a procedural waveform under BGM clips */
  showWaveform?: boolean;
  /** v3.1.3 P2: segmentKey that just snapped, flash hint */
  snapFlashId?: string | null;
  /** v3.1.3 P4: remote collab locks — segmentKey → lock owner */
  remoteLocks?: Record<string, LockEntry>;
  /** Current user id, used to ignore own locks */
  currentUserId?: string;
  accentColor: 'amber' | 'cyan';
}

/**
 * v3.1.3 P1: BGM clip waveform.
 * audioUrl + successful decode → real waveform (Web Audio API decode + slice the clip range)
 * else → procedural fallback (hash segmentKey into an SVG path)
 *
 * Must be a component outside the loop so hook order stays stable.
 */
function SegmentWaveform({
  seg, width, height, color,
}: {
  seg: TrackSegment;
  width: number;
  height: number;
  color: string;
}) {
  const decoded = useAudioWaveform(seg.audioUrl);
  const bars = Math.min(64, Math.max(12, Math.floor(width / 8)));
  if (decoded) {
    // Real waveform: slice derivedStartSec..derivedDurationSec
    const slice = sliceWaveform(decoded, seg.derivedStartSec, seg.derivedDurationSec, bars);
    if (slice.length > 0) {
      return (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {Array.from(slice).map((amp, i) => {
            const x = (i + 0.5) * (width / slice.length);
            const a = amp * (height * 0.4); // amplitude 0..1 → 0..h*0.4
            const cy = height / 2;
            return (
              <line
                key={i}
                x1={x} y1={cy - a}
                x2={x} y2={cy + a}
                stroke={color}
                strokeWidth={1}
              />
            );
          })}
        </svg>
      );
    }
  }
  // Fallback: procedural
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={buildWaveformPath(seg.id, width, height, bars)}
        stroke={color}
        strokeWidth={1}
        fill="none"
      />
    </svg>
  );
}

/**
 * v3.1.2 procedural BGM waveform — deterministic hash of segmentKey → SVG path.
 * Does not decode the mp3, but stays visually stable for the same clip.
 * Fallback when audioUrl is missing / decode fails.
 */
function buildWaveformPath(seed: string, width: number, height: number, bars = 48): string {
  // Simple hash: char-code sum
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cy = height / 2;
  const barWidth = width / bars;
  const path: string[] = [];
  for (let i = 0; i < bars; i++) {
    // PRNG — Park-Miller LCG variant
    h = (h * 16807) % 2147483647;
    const norm = (h / 2147483647); // 0..1
    // Stronger energy near the clip middle (like a real BGM climax)
    const distFromMid = Math.abs(i - bars / 2) / (bars / 2);
    const envelope = 1 - distFromMid * 0.5;
    const amplitude = (0.2 + norm * 0.8) * envelope * (height * 0.4);
    const x = i * barWidth + barWidth / 2;
    path.push(`M${x.toFixed(1)},${(cy - amplitude).toFixed(1)} L${x.toFixed(1)},${(cy + amplitude).toFixed(1)}`);
  }
  return path.join(' ');
}

function TrackRow({
  title, icon, segments, totalDuration, pxPerSec,
  trackType, onMuteToggle, onReset, onDragStart, onEditText,
  showWaveform, snapFlashId, remoteLocks, currentUserId, accentColor,
}: TrackRowProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { projectView: Record<string, string> };
  const colorBg = accentColor === 'amber' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(77, 224, 194, 0.22)';
  const colorBorder = accentColor === 'amber' ? 'rgba(212, 175, 55, 0.55)' : 'rgba(77, 224, 194, 0.50)';
  const waveformColor = accentColor === 'amber' ? 'rgba(212, 175, 55, 0.6)' : 'rgba(77, 224, 194, 0.6)';
  const totalWidthPx = totalDuration * pxPerSec;

  return (
    <div className="cinema-card-hi p-3">
      <div className="cinema-eyebrow mb-2 flex items-center gap-1.5">
        {icon}
        {title}
        <span className="opacity-50 cinema-mono text-[10px] ml-2">{t.projectView.segmentsCount.replace('{n}', String(segments.length))}</span>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <div
          className="relative h-14 bg-black/40 rounded"
          style={{ width: Math.max(totalWidthPx, 600) + 'px', minWidth: '100%' }}
        >
          {segments.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center cinema-mono text-[10px] opacity-40">
              {t.projectView.noSegments}
            </div>
          ) : segments.map((seg) => {
            const left = seg.startSec * pxPerSec;
            const width = Math.max(40, seg.durationSec * pxPerSec);
            // v3.1.3 P4: detect remote lock — disable drag + show lock badge when owner is not self
            const lockEntry = remoteLocks?.[seg.id];
            const isLockedByOther = !!lockEntry && lockEntry.userId !== currentUserId;
            const tooltip = isLockedByOther
              ? t.projectView.lockWait.replace('{name}', lockEntry.userName)
              : `${seg.label} · ${seg.durationSec.toFixed(1)}s${seg.muted ? ' · ' + t.projectView.muted : ''}${seg.isEdited ? ' · ' + t.projectView.edited : ''}`;
            return (
              <div
                key={seg.id}
                title={tooltip}
                className={`absolute top-1 bottom-1 rounded border group/seg ${
                  seg.muted ? 'opacity-40' : ''
                } ${seg.isEdited ? 'ring-1 ring-[var(--cinema-amber)]/40' : ''} ${
                  snapFlashId === seg.id ? 'ring-2 ring-white/80 transition-shadow' : ''
                } ${isLockedByOther ? 'pointer-events-none' : ''}`}
                style={{
                  left, width,
                  background: isLockedByOther ? `rgba(150, 150, 150, 0.2)` : colorBg,
                  borderColor: isLockedByOther ? lockEntry.color : colorBorder,
                  borderStyle: isLockedByOther ? 'dashed' : 'solid',
                  cursor: isLockedByOther ? 'not-allowed' : 'grab',
                }}
                onMouseDown={(e) => !isLockedByOther && onDragStart(e, trackType, seg, 'move')}
                onDoubleClick={() => !isLockedByOther && onEditText?.(seg)}
              >
                {/* v3.1.3 P4: remote lock badge — who is editing */}
                {isLockedByOther && (
                  <div
                    className="absolute -top-2 left-1 cinema-mono text-[8px] px-1 py-0.5 rounded whitespace-nowrap pointer-events-auto z-30"
                    style={{ background: lockEntry.color, color: '#000' }}
                  >
                    {t.projectView.editingNow.replace('{name}', lockEntry.userName)}
                  </div>
                )}
                {/* v3.1.3 P1: real BGM waveform (audioUrl decoded) or procedural fallback */}
                {showWaveform && width > 20 && (
                  <SegmentWaveform seg={seg} width={width} height={48} color={waveformColor} />
                )}
                {/* v3.1.2 left-edge resize — change startOffset and shrink duration so endSec stays */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/30 transition-colors"
                  onMouseDown={(e) => onDragStart(e, trackType, seg, 'resize-left')}
                  title={t.projectView.resizeLeft}
                />
                {/* v3.1.2 right-edge resize — change duration, startSec stays */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/30 transition-colors"
                  onMouseDown={(e) => onDragStart(e, trackType, seg, 'resize-right')}
                  title={t.projectView.resizeRight}
                />
                <div className="relative h-full flex items-center gap-1 px-2.5 overflow-hidden z-[1]">
                  <span className="cinema-mono text-[9px] truncate flex-1">
                    {seg.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMuteToggle(trackType, seg); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="opacity-60 hover:opacity-100 flex-shrink-0"
                    title={seg.muted ? t.projectView.unmute : t.projectView.mute}
                  >
                    {seg.muted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                  </button>
                  {onEditText && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditText(seg); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="opacity-60 hover:opacity-100 flex-shrink-0"
                      title={t.projectView.editSubText}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {seg.isEdited && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReset(trackType, seg); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="opacity-60 hover:opacity-100 flex-shrink-0"
                      title={t.projectView.resetDefault}
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

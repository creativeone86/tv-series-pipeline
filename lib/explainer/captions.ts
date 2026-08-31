import type { CharacterAlignment } from './narration-track';

export function alignmentToSrt(alignment: CharacterAlignment, groupMs = 2800): string {
  const cues = groupAlignment(alignment, groupMs);
  return cues.map((c, i) => `${i + 1}\n${fmtSrt(c.start)} --> ${fmtSrt(c.end)}\n${c.text}\n`).join('\n');
}

export function alignmentToVtt(alignment: CharacterAlignment, groupMs = 2800): string {
  const cues = groupAlignment(alignment, groupMs);
  return `WEBVTT\n\n${cues.map((c) => `${fmtVtt(c.start)} --> ${fmtVtt(c.end)}\n${c.text}\n`).join('\n')}`;
}

function groupAlignment(alignment: CharacterAlignment, groupMs: number): Array<{ start: number; end: number; text: string }> {
  const starts = alignment.character_start_times_seconds || [];
  const ends = alignment.character_end_times_seconds || [];
  const chars = alignment.characters || [];
  const out: Array<{ start: number; end: number; text: string }> = [];
  let buf = '';
  let start = starts[0] || 0;
  let last = ends[0] || 0;
  for (let i = 0; i < chars.length; i++) {
    buf += chars[i];
    last = ends[i] ?? last;
    const long = (last - start) * 1000 >= groupMs;
    const punct = /[.!?。！？]/.test(chars[i] || '');
    if (long || punct) {
      out.push({ start, end: last, text: buf.trim() });
      buf = '';
      start = starts[i + 1] ?? last;
    }
  }
  if (buf.trim()) out.push({ start, end: last, text: buf.trim() });
  return out.filter((c) => c.text);
}

function fmtSrt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function fmtVtt(sec: number): string {
  return fmtSrt(sec).replace(',', '.');
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0');
}

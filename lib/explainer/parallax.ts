/** Multi-plane zoompan overlay chain for paper-cut SCENE depth. */

export function parallaxFilter(planes: number, w: number, h: number, frames: number, fps = 24): string {
  const n = Math.max(1, Math.min(4, planes));
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const z0 = 1 + i * 0.015;
    const z1 = z0 + 0.04 + i * 0.02;
    const zoom = `1+(${z1 - z0})*on/${frames}`;
    parts.push(`[${i}:v]scale=${w * 2}:${h * 2}:force_original_aspect_ratio=increase,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${fps}[p${i}]`);
  }
  if (n === 1) return `${parts[0]};[p0]format=yuv420p[vout]`;
  let last = 'p0';
  for (let i = 1; i < n; i++) {
    const out = i === n - 1 ? 'vout' : `m${i}`;
    parts.push(`[${last}][p${i}]overlay=0:0:format=auto[${out}]`);
    last = out;
  }
  return parts.join(';');
}

import sharp from 'sharp';
import { defaultVisualBible, type ExplainerBeat, type SeriesVisualBible } from './types';

const DIAGRAM_TYPES = new Set(['DIAGRAM', 'COMPARISON', 'MATH', 'CHESS_BOARD', 'MAP', 'TIMELINE']);
const FREE_SHOTS = new Set(['WORD_CARD', 'IN_SCENE_WORD', 'TIMELINE', 'MAP', 'MICRO_VIEW']);

/** Teaching graphics beat — SVG first so Earth+Moon vocab does not stamp every beat identically. */
export function shouldPreferDiagram(beat: Pick<ExplainerBeat, 'visualIntent' | 'activeEntities' | 'visualGoal' | 'teachingGoal' | 'narrationText'> & { shotType?: string }): boolean {
  if (beat.shotType && FREE_SHOTS.has(beat.shotType)) return true;
  if (DIAGRAM_TYPES.has(beat.visualIntent?.type)) return true;
  if (beat.activeEntities.includes('PHYSICS_ARROW') || beat.activeEntities.includes('QUESTION_MOTIF')) return true;
  return /orbit|arrow|гравит|орбит|скорост|пада|близост|инерц|привлича|разстоян|взаимод/.test(
    `${beat.visualGoal} ${beat.teachingGoal} ${beat.narrationText}`,
  );
}

export type DiagramKind =
  | 'orbit'
  | 'gravity'
  | 'velocity'
  | 'cannon'
  | 'question'
  | 'arrow'
  | 'circle'
  | 'recap-orbit'
  | 'hook-sky'
  | 'misconception-fall'
  | 'moon-moving'
  | 'moon-stopped'
  | 'no-gravity-escape'
  | 'mutual'
  | 'distance'
  | 'balance-hold'
  | 'recap-full'
  | 'icon-scene'
  | 'timeline-axis'
  | 'map-dot';

export type GuidePose =
  | 'look-up'
  | 'think'
  | 'explain'
  | 'shrug'
  | 'throw'
  | 'point'
  | 'alarm'
  | 'float'
  | 'measure'
  | 'wave';

export interface DiagramSpec {
  kind: DiagramKind;
  width?: number;
  height?: number;
  labels?: string[];
  guide?: GuidePose | false;
}

/** One unique scene per beat order so 12 beats never share a bitmap. */
const SCENE_BY_ORDER: Array<{ kind: DiagramKind; guide: GuidePose }> = [
  { kind: 'hook-sky', guide: 'look-up' },
  { kind: 'orbit', guide: 'think' },
  { kind: 'gravity', guide: 'explain' },
  { kind: 'misconception-fall', guide: 'shrug' },
  { kind: 'velocity', guide: 'throw' },
  { kind: 'moon-moving', guide: 'point' },
  { kind: 'moon-stopped', guide: 'alarm' },
  { kind: 'no-gravity-escape', guide: 'float' },
  { kind: 'mutual', guide: 'explain' },
  { kind: 'distance', guide: 'measure' },
  { kind: 'balance-hold', guide: 'point' },
  { kind: 'recap-full', guide: 'wave' },
];

const SCENE_SCORES: Array<{ kind: DiagramKind; guide: GuidePose; re: RegExp }> = [
  { kind: 'hook-sky', guide: 'look-up', re: /hook|night sky|question motif|защо луната|looks up/i },
  { kind: 'question', guide: 'think', re: /ябълка|apple|compare falling|question motif/i },
  { kind: 'gravity', guide: 'explain', re: /gravity arrow|пада към|гравит/i },
  { kind: 'misconception-fall', guide: 'shrug', re: /misconception|няма гравитация|космоса няма/i },
  { kind: 'velocity', guide: 'throw', re: /хвърляш|throw|топка|trajectory/i },
  { kind: 'cannon', guide: 'throw', re: /нютон|newton|cannon|топ,/i },
  { kind: 'moon-moving', guide: 'point', re: /страничн|sideways velocity|velocity arrow plus/i },
  { kind: 'orbit', guide: 'explain', re: /орбит|orbit|closed orbit|непрекъснато пропуска/i },
  { kind: 'mutual', guide: 'explain', re: /две стрел|two arrows|допирател/i },
  { kind: 'distance', guide: 'measure', re: /станци|iss|closer orbit/i },
  { kind: 'moon-stopped', guide: 'alarm', re: /спре да се движи|velocity is what|fall line/i },
  { kind: 'recap-full', guide: 'wave', re: /recap|завинаги|full vocabulary/i },
  { kind: 'timeline-axis', guide: 'point', re: /timeline|година|year|1901|история/i },
  { kind: 'map-dot', guide: 'point', re: /\bmap\b|карта|continent|region/i },
  { kind: 'icon-scene', guide: 'explain', re: /blood|кръв|group|клетк|cell|molecule/i },
];

export function pickScene(
  beat: Pick<ExplainerBeat, 'order' | 'purpose' | 'visualGoal' | 'teachingGoal' | 'narrationText' | 'activeEntities'> & { shotType?: string },
  used?: Set<string>,
): DiagramSpec {
  const blob = `${beat.purpose} ${beat.visualGoal} ${beat.teachingGoal} ${beat.narrationText} ${beat.activeEntities.join(' ')} ${beat.shotType || ''}`;
  if (beat.shotType === 'TIMELINE' || /timeline/i.test(blob)) return { kind: 'timeline-axis', guide: 'point' };
  if (beat.shotType === 'MAP' || /\bmap\b|карта/i.test(blob)) return { kind: 'map-dot', guide: 'point' };
  const scored = SCENE_SCORES
    .map((s) => ({ ...s, score: s.re.test(blob) ? 2 : 0 }))
    .sort((a, b) => b.score - a.score);
  const physics = beat.activeEntities.some((e) => e === 'EARTH' || e === 'MOON' || e === 'PHYSICS_ARROW' || e === 'SPACE_BG' || e === 'QUESTION_MOTIF')
    || /moon|earth|лун|зем|orbit|орбит|гравит|нютон|ябълка/.test(blob);
  if (physics) {
    const idx = Math.max(0, (Number(beat.order) || 1) - 1) % SCENE_BY_ORDER.length;
    const ordered = SCENE_BY_ORDER[idx]!;
    used?.add(ordered.kind);
    return { kind: ordered.kind, guide: ordered.guide };
  }
  const pick = scored.find((s) => s.score > 0 && (!used || !used.has(s.kind)));
  if (!pick) return { kind: 'icon-scene', guide: 'explain' };
  used?.add(pick.kind);
  return { kind: pick.kind, guide: pick.guide };
}

export function renderDiagramSvg(spec: DiagramSpec, bible: SeriesVisualBible = defaultVisualBible()): string {
  const w = spec.width || 1920;
  const h = spec.height || 1080;
  const p = bible.palette;
  const sw = bible.strokeWidth;
  const space = `<rect width="100%" height="100%" fill="${p.bg}"/>`;
  const stars = starfield(w, h, p.ink);
  const earth = (cx = w * 0.38, cy = h * 0.52, r = Math.min(w, h) * 0.14) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.earth}" stroke="${p.ink}" stroke-width="${sw}"/>`;
  const moon = (cx = w * 0.68, cy = h * 0.32, r = Math.min(w, h) * 0.045) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.moon}" stroke="${p.ink}" stroke-width="${sw}"/>`;
  const guide = (pose: GuidePose, x = w * 0.24, y = h * 0.76, scale = 1.15) =>
    spec.guide === false ? '' : lineFigure(x, y, scale, pose, p.guide, sw);

  const kind = spec.kind;
  const pose: GuidePose = spec.guide ? spec.guide : 'explain';

  if (kind === 'question') {
    return wrap(w, h, `${space}${stars}
      ${guide('think', w * 0.22, h * 0.78, 1.15)}
      <circle cx="${w * 0.62}" cy="${h * 0.42}" r="88" fill="none" stroke="${p.accent}" stroke-width="${sw * 2}"/>
      <path d="${questionMark(w * 0.62, h * 0.42)}" fill="none" stroke="${p.accent}" stroke-width="${sw * 2.2}" stroke-linecap="round"/>`);
  }
  if (kind === 'hook-sky') {
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.62, h * 0.58, 150)}
      ${moon(w * 0.78, h * 0.28, 52)}
      ${guide('look-up', w * 0.26, h * 0.80, 1.25)}
      <circle cx="${w * 0.86}" cy="${h * 0.18}" r="36" fill="none" stroke="${p.accent}" stroke-width="${sw * 1.6}"/>
      <path d="${questionMark(w * 0.86, h * 0.18)}" fill="none" stroke="${p.accent}" stroke-width="${sw * 1.6}" stroke-linecap="round"/>`);
  }
  if (kind === 'arrow') {
    return wrap(w, h, `${space}${stars}${guide('point')}${arrow(w * 0.32, h * 0.48, w * 0.82, h * 0.48, p.arrow, sw)}`);
  }
  if (kind === 'circle') {
    return wrap(w, h, `${space}${stars}${earth()}${guide('think')}`);
  }
  if (kind === 'gravity') {
    return wrap(w, h, `${space}${stars}
      ${earth()}
      ${moon()}
      ${arrow(w * 0.64, h * 0.36, w * 0.48, h * 0.48, p.arrow, sw)}
      ${guide('explain')}`);
  }
  if (kind === 'velocity') {
    return wrap(w, h, `${space}${stars}
      ${earth()}
      ${moon()}
      ${arrow(w * 0.70, h * 0.32, w * 0.84, h * 0.16, p.accent, sw)}
      ${arrow(w * 0.64, h * 0.36, w * 0.48, h * 0.48, p.arrow, sw)}
      ${guide('throw', w * 0.13, h * 0.80, 1.05)}`);
  }
  if (kind === 'cannon') {
    const path = `M ${w * 0.42} ${h * 0.40} Q ${w * 0.62} ${h * 0.18} ${w * 0.78} ${h * 0.42}`;
    return wrap(w, h, `${space}${stars}${earth()}
      <path d="${path}" fill="none" stroke="${p.accent}" stroke-width="${sw}" stroke-dasharray="12 8"/>
      ${guide('throw')}`);
  }
  if (kind === 'misconception-fall') {
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.42, h * 0.62, 160)}
      ${moon(w * 0.58, h * 0.28, 48)}
      <path d="M ${w * 0.58} ${h * 0.34} Q ${w * 0.56} ${h * 0.48} ${w * 0.50} ${h * 0.56}" fill="none" stroke="${p.warn}" stroke-width="${sw}" stroke-dasharray="10 8"/>
      ${guide('shrug', w * 0.16, h * 0.82, 1.1)}`);
  }
  if (kind === 'moon-moving') {
    const rx = Math.min(w, h) * 0.30;
    const ry = Math.min(w, h) * 0.17;
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.40, h * 0.50)}
      <ellipse cx="${w * 0.40}" cy="${h * 0.50}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.accent}" stroke-width="${sw}" transform="rotate(-22 ${w * 0.40} ${h * 0.50})"/>
      ${moon(w * 0.68, h * 0.38, 42)}
      ${arrow(w * 0.70, h * 0.34, w * 0.80, h * 0.24, p.accent, sw)}
      ${motionDashes(w * 0.58, h * 0.44, w * 0.66, h * 0.39, p.moon)}
      ${guide('point', w * 0.12, h * 0.80)}`);
  }
  if (kind === 'moon-stopped') {
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.36, h * 0.58)}
      ${moon(w * 0.64, h * 0.26, 46)}
      <path d="M ${w * 0.64} ${h * 0.32} C ${w * 0.62} ${h * 0.44} ${w * 0.52} ${h * 0.50} ${w * 0.44} ${h * 0.54}" fill="none" stroke="${p.warn}" stroke-width="${sw * 1.2}" stroke-dasharray="8 7"/>
      ${arrow(w * 0.60, h * 0.34, w * 0.46, h * 0.50, p.warn, sw)}
      ${guide('alarm', w * 0.14, h * 0.82, 1.1)}`);
  }
  if (kind === 'no-gravity-escape') {
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.30, h * 0.62, 130)}
      ${moon(w * 0.78, h * 0.22, 40)}
      <path d="M ${w * 0.42} ${h * 0.48} L ${w * 0.76} ${h * 0.24}" fill="none" stroke="${p.accent}" stroke-width="${sw}" stroke-dasharray="14 8"/>
      ${arrow(w * 0.70, h * 0.28, w * 0.86, h * 0.16, p.accent, sw)}
      ${guide('float', w * 0.16, h * 0.70, 1.05)}`);
  }
  if (kind === 'mutual') {
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.34, h * 0.50, 140)}
      ${moon(w * 0.70, h * 0.42, 50)}
      ${arrow(w * 0.46, h * 0.48, w * 0.62, h * 0.44, p.arrow, sw)}
      ${arrow(w * 0.62, h * 0.46, w * 0.48, h * 0.50, p.accent, sw)}
      ${guide('explain', w * 0.12, h * 0.80)}`);
  }
  if (kind === 'distance') {
    const y = h * 0.48;
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.22, y, 90)}
      ${moon(w * 0.84, y, 36)}
      <line x1="${w * 0.30}" y1="${y + 110}" x2="${w * 0.80}" y2="${y + 110}" stroke="${p.ink}" stroke-width="${sw}"/>
      <line x1="${w * 0.30}" y1="${y + 96}" x2="${w * 0.30}" y2="${y + 124}" stroke="${p.ink}" stroke-width="${sw}"/>
      <line x1="${w * 0.80}" y1="${y + 96}" x2="${w * 0.80}" y2="${y + 124}" stroke="${p.ink}" stroke-width="${sw}"/>
      ${[0.4, 0.5, 0.6, 0.7].map((t) => `<line x1="${w * t}" y1="${y + 104}" x2="${w * t}" y2="${y + 116}" stroke="${p.ink}" stroke-width="${sw * 0.7}"/>`).join('')}
      ${guide('measure', w * 0.48, h * 0.86, 0.95)}`);
  }
  if (kind === 'balance-hold') {
    const rx = Math.min(w, h) * 0.28;
    const ry = Math.min(w, h) * 0.16;
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.40, h * 0.52)}
      <ellipse cx="${w * 0.40}" cy="${h * 0.52}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.accent}" stroke-width="${sw}" transform="rotate(-18 ${w * 0.40} ${h * 0.52})"/>
      ${moon(w * 0.66, h * 0.36)}
      ${arrow(w * 0.68, h * 0.32, w * 0.80, h * 0.20, p.accent, sw)}
      ${arrow(w * 0.62, h * 0.40, w * 0.50, h * 0.48, p.arrow, sw)}
      ${guide('point', w * 0.12, h * 0.80)}`);
  }
  if (kind === 'recap-full') {
    const rx = Math.min(w, h) * 0.30;
    const ry = Math.min(w, h) * 0.17;
    return wrap(w, h, `${space}${stars}
      ${earth(w * 0.46, h * 0.50)}
      <ellipse cx="${w * 0.46}" cy="${h * 0.50}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.accent}" stroke-width="${sw}" transform="rotate(-16 ${w * 0.46} ${h * 0.50})"/>
      ${moon(w * 0.74, h * 0.36)}
      ${arrow(w * 0.70, h * 0.40, w * 0.56, h * 0.48, p.arrow, sw)}
      ${arrow(w * 0.76, h * 0.32, w * 0.86, h * 0.20, p.accent, sw)}
      ${guide('wave', w * 0.14, h * 0.80, 1.15)}`);
  }
  if (kind === 'icon-scene') {
    return wrap(w, h, `${space}
      <rect x="${w * 0.28}" y="${h * 0.22}" width="${w * 0.44}" height="${h * 0.44}" rx="28" fill="${p.earth}" stroke="${p.ink}" stroke-width="${sw}"/>
      <circle cx="${w * 0.50}" cy="${h * 0.44}" r="${Math.min(w, h) * 0.10}" fill="${p.accent}" stroke="${p.ink}" stroke-width="${sw}"/>
      ${guide('explain', w * 0.18, h * 0.80)}`);
  }
  if (kind === 'timeline-axis') {
    return wrap(w, h, `${space}
      <line x1="${w * 0.12}" y1="${h * 0.55}" x2="${w * 0.88}" y2="${h * 0.55}" stroke="${p.ink}" stroke-width="${sw * 1.4}"/>
      ${[0.2, 0.4, 0.6, 0.8].map((t) => `<line x1="${w * t}" y1="${h * 0.50}" x2="${w * t}" y2="${h * 0.60}" stroke="${p.accent}" stroke-width="${sw}"/>`).join('')}
      ${guide('point', w * 0.16, h * 0.82)}`);
  }
  if (kind === 'map-dot') {
    return wrap(w, h, `${space}
      <ellipse cx="${w * 0.52}" cy="${h * 0.48}" rx="${w * 0.28}" ry="${h * 0.22}" fill="${p.earth}" stroke="${p.ink}" stroke-width="${sw}"/>
      <circle cx="${w * 0.58}" cy="${h * 0.42}" r="18" fill="${p.accent}"/>
      ${guide('point', w * 0.14, h * 0.82)}`);
  }
  if (kind === 'recap-orbit' || kind === 'orbit') {
    const rx = Math.min(w, h) * 0.28;
    const ry = Math.min(w, h) * 0.16;
    const ex = w * 0.42;
    const ey = h * 0.50;
    return wrap(w, h, `${space}${stars}
      ${earth(ex, ey)}
      <ellipse cx="${ex}" cy="${ey}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.accent}" stroke-width="${sw}" transform="rotate(-18 ${ex} ${ey})"/>
      ${moon(w * 0.70, h * 0.34)}
      ${guide(pose === 'look-up' ? 'think' : pose, w * 0.12, h * 0.80)}`);
  }
  return wrap(w, h, `${space}${stars}${earth()}${moon()}${guide('explain')}`);
}

/**
 * Stroke-only personage (line figure): head circle + spine + arms + legs.
 * No fill on the body — educational stick/wire character, not a rendered person.
 */
export function lineFigure(
  x: number,
  y: number,
  scale: number,
  pose: GuidePose,
  color: string,
  sw: number,
): string {
  const s = 110 * scale;
  const headR = 16 * scale;
  const hipY = y - s * 0.42;
  const neckY = y - s * 0.72;
  const headY = neckY - headR - 2;
  const stroke = `fill="none" stroke="${color}" stroke-width="${sw * 1.15}" stroke-linecap="round" stroke-linejoin="round"`;
  const head = `<circle cx="${x}" cy="${headY}" r="${headR}" ${stroke}/>`;
  const spine = `<line x1="${x}" y1="${neckY}" x2="${x}" y2="${hipY}" ${stroke}/>`;

  let arms = '';
  let legs = `<line x1="${x}" y1="${hipY}" x2="${x - s * 0.18}" y2="${y}" ${stroke}/>
    <line x1="${x}" y1="${hipY}" x2="${x + s * 0.16}" y2="${y}" ${stroke}/>`;

  const shoulderY = neckY + s * 0.06;
  switch (pose) {
    case 'look-up':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.22}" y2="${shoulderY + s * 0.18}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.28}" y2="${shoulderY - s * 0.32}" ${stroke}/>`;
      break;
    case 'think':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.20}" y2="${shoulderY + s * 0.22}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.16}" y2="${headY + 4}" ${stroke}/>`;
      break;
    case 'explain':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.16}" y2="${shoulderY + s * 0.20}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.32}" y2="${shoulderY + s * 0.02}" ${stroke}/>`;
      break;
    case 'shrug':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.28}" y2="${shoulderY - s * 0.04}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.28}" y2="${shoulderY - s * 0.04}" ${stroke}/>`;
      break;
    case 'throw':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.18}" y2="${shoulderY + s * 0.16}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.30}" y2="${shoulderY - s * 0.22}" ${stroke}/>`;
      legs = `<line x1="${x}" y1="${hipY}" x2="${x - s * 0.22}" y2="${y}" ${stroke}/>
        <line x1="${x}" y1="${hipY}" x2="${x + s * 0.20}" y2="${y - s * 0.06}" ${stroke}/>`;
      break;
    case 'point':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.14}" y2="${shoulderY + s * 0.22}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.36}" y2="${shoulderY - s * 0.08}" ${stroke}/>`;
      break;
    case 'alarm':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.12}" y2="${headY - 8}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.14}" y2="${headY - 10}" ${stroke}/>`;
      break;
    case 'float':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.26}" y2="${shoulderY - s * 0.10}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.26}" y2="${shoulderY - s * 0.10}" ${stroke}/>`;
      legs = `<line x1="${x}" y1="${hipY}" x2="${x - s * 0.16}" y2="${y - s * 0.08}" ${stroke}/>
        <line x1="${x}" y1="${hipY}" x2="${x + s * 0.18}" y2="${y - s * 0.04}" ${stroke}/>`;
      break;
    case 'measure':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.30}" y2="${shoulderY + s * 0.04}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.30}" y2="${shoulderY + s * 0.04}" ${stroke}/>`;
      break;
    case 'wave':
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.18}" y2="${shoulderY + s * 0.20}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.22}" y2="${headY - 14}" ${stroke}/>`;
      break;
    default:
      arms = `<line x1="${x}" y1="${shoulderY}" x2="${x - s * 0.20}" y2="${shoulderY + s * 0.20}" ${stroke}/>
        <line x1="${x}" y1="${shoulderY}" x2="${x + s * 0.20}" y2="${shoulderY + s * 0.20}" ${stroke}/>`;
  }

  return `<g class="line-figure" data-pose="${pose}">${head}${spine}${arms}${legs}</g>`;
}

function questionMark(cx: number, cy: number): string {
  return `M ${cx - 10} ${cy - 18} Q ${cx - 10} ${cy - 38} ${cx} ${cy - 38} Q ${cx + 12} ${cy - 38} ${cx + 12} ${cy - 22} Q ${cx + 12} ${cy - 10} ${cx} ${cy - 2} M ${cx} ${cy + 14} L ${cx} ${cy + 16}`;
}

function starfield(w: number, h: number, color: string): string {
  const dots = [
    [0.08, 0.12], [0.18, 0.08], [0.29, 0.16], [0.41, 0.07], [0.55, 0.11],
    [0.67, 0.06], [0.81, 0.13], [0.92, 0.09], [0.12, 0.28], [0.88, 0.26],
    [0.73, 0.72], [0.93, 0.64], [0.06, 0.58],
  ];
  return dots.map(([x, y], i) =>
    `<circle cx="${w * x!}" cy="${h * y!}" r="${i % 3 === 0 ? 2.2 : 1.4}" fill="${color}" opacity="0.35"/>`,
  ).join('');
}

function motionDashes(x1: number, y1: number, x2: number, y2: number, color: string): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" stroke-dasharray="6 7" opacity="0.7"/>`;
}

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, sw: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 18;
  const l1x = x2 - head * Math.cos(a - Math.PI / 7);
  const l1y = y2 - head * Math.sin(a - Math.PI / 7);
  const l2x = x2 - head * Math.cos(a + Math.PI / 7);
  const l2y = y2 - head * Math.sin(a + Math.PI / 7);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${l1x},${l1y} ${l2x},${l2y}" fill="${color}"/>`;
}

function wrap(w: number, h: number, inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}

export function pickDiagramKind(visualGoal: string, entities: string[], purpose?: string): DiagramKind {
  const g = `${visualGoal || ''} ${purpose || ''}`.toLowerCase();
  if (/question|\?|hook|защо/.test(g) || entities.includes('QUESTION_MOTIF')) return 'question';
  if (/cannon|топ|планин/.test(g)) return 'cannon';
  if (/velocit|странич|скорост|инерц/.test(g)) return 'velocity';
  if (/без гравит|no gravity|космоса/.test(g)) return 'arrow';
  if (/разстоян|distance|map/.test(g)) return 'circle';
  if (/gravit|гравит|пада|привлича/.test(g)) return 'gravity';
  if (/orbit|орбит|recap/.test(g)) return 'orbit';
  if (entities.includes('PHYSICS_ARROW') && entities.includes('MOON')) return 'gravity';
  if (entities.includes('PHYSICS_ARROW')) return 'arrow';
  if (purpose === 'HOOK') return 'question';
  if (purpose === 'RECAP') return 'recap-orbit';
  return 'orbit';
}

export async function rasterizeSvg(svg: string, width = 1920, height = 1080): Promise<Buffer> {
  return sharp(Buffer.from(svg)).resize(width, height, { fit: 'fill' }).png().toBuffer();
}

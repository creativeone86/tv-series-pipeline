'use client';

/**
 * IndustryAuditCard — industry-audit checklist for Pro polish results.
 *
 * Renders the audit object from /api/polish-script?mode=pro and visualizes
 * the LLM "script doctor" report so a director/writer can scan:
 *   · Hook strength (red/amber/green)
 *   · Whether three-act beats landed
 *   · Dialogue issues (on-the-nose / abstract emotion)
 *   · Character identity anchors (Sora Cameo / Seedance multi-ref)
 *   · Scene lighting consistency (lightDirection + color temp + mood)
 *   · Cross-shot continuity hooks (v2.10 Keyframes first/last frame)
 *   · AIGC readiness score + issue list
 *
 * Design: render only what the model returned; hide missing fields. Never invent data.
 */

import { Pulse as Activity, Warning as AlertTriangle, Anchor, MaskHappy as Drama, ListBullets as LayoutList, Lightbulb, Quotes as MessageSquareQuote, Palette, Users, Lightning as Zap, MagnifyingGlass as Search, PlusCircle } from '@phosphor-icons/react';
import { readinessLevel } from '@/lib/polish-prompts';
import { useLocale } from '@/hooks/use-locale';

/**
 * Optional one-click action callbacks:
 *   · onSearch(keyword)      — highlight this text in the body so the editor can jump to it
 *   · onAddToFocus(keyword)  — append this text to the next-round polish focus input
 *
 * Both are optional; if the parent omits them, the buttons are not rendered.
 * Read-only audit embeds (LatestPolishBanner) therefore stay button-free.
 */
export interface AuditActions {
  onSearch?: (keyword: string) => void;
  onAddToFocus?: (keyword: string) => void;
}

export interface PolishAudit {
  hook: {
    strength: 'weak' | 'ok' | 'strong';
    at3s: string;
    rationale: string;
  } | null;
  actStructure: {
    incitingIncident: string;
    midpoint: string;
    climax: string;
    resolution: string;
    missingBeats: string[];
  } | null;
  dialogueIssues: {
    onTheNoseLines: string[];
    abstractEmotionLines: string[];
  } | null;
  characterAnchors: Array<{
    name: string;
    visualLock: string;
    speechStyle: string;
    arc: string;
  }>;
  sceneLighting: Array<{
    scene: string;
    lightDirection: string;
    quality: string;
    colorTemp: string;
    mood: string;
  }>;
  continuityAnchors: string[];
  styleProfile: {
    genre: string;
    tone: string;
    rhythm: string;
    artDirection: string;
  } | null;
  aigcReadiness: {
    score: number;
    reasoning: string;
  } | null;
  issues: Array<{
    severity: 'minor' | 'major' | 'critical';
    category: 'pacing' | 'dialogue' | 'structure' | 'character' | 'aigc' | 'other';
    text: string;
    where: string;
  }>;
}

const HOOK_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  weak:   { bg: 'bg-red-500/10',     text: 'text-red-300',     border: 'border-red-500/30' },
  ok:     { bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-500/30' },
  strong: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
};

const SEVERITY_COLOR: Record<string, string> = {
  minor:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  major:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const READINESS_BAR: Record<string, { bar: string; ring: string; label: string; text: string }> = {
  red:   { bar: 'bg-red-400',     ring: 'ring-red-500/40',     label: 'text-red-300',     text: 'text-red-200' },
  amber: { bar: 'bg-amber-400',   ring: 'ring-amber-500/40',   label: 'text-amber-300',   text: 'text-amber-200' },
  green: { bar: 'bg-emerald-400', ring: 'ring-emerald-500/40', label: 'text-emerald-300', text: 'text-emerald-200' },
};

export default function IndustryAuditCard({
  audit, actions,
}: {
  audit: PolishAudit;
  actions?: AuditActions;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top: AIGC readiness + style profile (the two faces that matter most) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audit.aigcReadiness ? <ReadinessBlock r={audit.aigcReadiness} /> : null}
        {audit.styleProfile ? <StyleProfileBlock s={audit.styleProfile} /> : null}
      </div>

      {/* Hook */}
      {audit.hook ? <HookBlock h={audit.hook} /> : null}

      {/* Three-act structure */}
      {audit.actStructure ? <ActStructureBlock a={audit.actStructure} actions={actions} /> : null}

      {/* Dialogue issues */}
      {audit.dialogueIssues &&
        (audit.dialogueIssues.onTheNoseLines.length > 0 ||
          audit.dialogueIssues.abstractEmotionLines.length > 0) ? (
        <DialogueBlock d={audit.dialogueIssues} actions={actions} />
      ) : null}

      {/* Character anchors */}
      {audit.characterAnchors.length > 0 ? (
        <CharacterAnchorsBlock anchors={audit.characterAnchors} />
      ) : null}

      {/* Scene lighting */}
      {audit.sceneLighting.length > 0 ? (
        <SceneLightingBlock scenes={audit.sceneLighting} />
      ) : null}

      {/* Cross-shot continuity hooks */}
      {audit.continuityAnchors.length > 0 ? (
        <ContinuityBlock anchors={audit.continuityAnchors} />
      ) : null}

      {/* Issue list */}
      {audit.issues.length > 0 ? <IssuesBlock issues={audit.issues} actions={actions} /> : null}
    </div>
  );
}

/**
 * Shared one-click actions — tiny search + add-to-focus buttons on each actionable row.
 * Kept small (text-[9px] / w-3) so they don't compete visually; hover still gives feedback.
 */
function ActionButtons({
  text, actions, className,
}: {
  text: string;
  actions?: AuditActions;
  className?: string;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  if (!actions || (!actions.onSearch && !actions.onAddToFocus)) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      {actions.onSearch ? (
        <button
          onClick={(e) => { e.stopPropagation(); actions.onSearch!(text); }}
          className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          title={t.polishUi.searchInResult}
        >
          <Search className="w-3 h-3" />
        </button>
      ) : null}
      {actions.onAddToFocus ? (
        <button
          onClick={(e) => { e.stopPropagation(); actions.onAddToFocus!(text); }}
          className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          title={t.polishUi.addToFocusTitle}
        >
          <PlusCircle className="w-3 h-3" />
        </button>
      ) : null}
    </span>
  );
}

// ────────────────────────────────────────────────

function SectionCard({
  icon, title, accent, children,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border bg-black/20 p-4 ${accent ?? 'border-[var(--border)]'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="shrink-0">{icon}</span>
        <h4 className="text-sm font-semibold text-white/95 tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function ReadinessBlock({ r }: { r: NonNullable<PolishAudit['aigcReadiness']> }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const lvl = readinessLevel(r.score);
  const palette = READINESS_BAR[lvl.level];
  const readinessLabel =
    lvl.level === 'green' ? t.polishUi.readinessGreen
      : lvl.level === 'amber' ? t.polishUi.readinessAmber
        : t.polishUi.readinessRed;
  return (
    <SectionCard
      icon={<Activity className={`w-4 h-4 ${palette.label}`} />}
      title={t.polishUi.aigcReadiness}
      accent={palette.ring.replace('ring-', 'border-')}
    >
      <div className="flex items-end gap-3 mb-2">
        <span className={`text-4xl font-bold ${palette.label} tabular-nums`}>{r.score}</span>
        <span className="text-xs text-white/50 mb-1.5">/ 100</span>
        <span className={`ml-auto text-[11px] ${palette.text} mb-1.5`}>{readinessLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${palette.bar}`}
          style={{ width: `${r.score}%` }}
        />
      </div>
      {r.reasoning ? (
        <p className="text-[12px] text-white/70 leading-relaxed">{r.reasoning}</p>
      ) : null}
    </SectionCard>
  );
}

function StyleProfileBlock({ s }: { s: NonNullable<PolishAudit['styleProfile']> }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const fields: Array<[string, string, string]> = [
    [t.polishUi.fieldGenre, s.genre, 'text-[#E8C547]'],
    [t.polishUi.fieldTone, s.tone, 'text-pink-300'],
    [t.polishUi.fieldRhythm, s.rhythm, 'text-cyan-300'],
    [t.polishUi.fieldArt, s.artDirection, 'text-violet-300'],
  ];
  return (
    <SectionCard icon={<Palette className="w-4 h-4 text-pink-300" />} title={t.polishUi.stylePortrait}>
      <dl className="space-y-1.5 text-[12px]">
        {fields
          .filter(([, v]) => !!v)
          .map(([k, v, color]) => (
            <div key={k} className="flex gap-2">
              <dt className={`w-10 shrink-0 text-[11px] ${color} tracking-wider`}>{k}</dt>
              <dd className="text-white/80 leading-relaxed">{v}</dd>
            </div>
          ))}
      </dl>
    </SectionCard>
  );
}

function HookBlock({ h }: { h: NonNullable<PolishAudit['hook']> }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const p = HOOK_COLOR[h.strength];
  const hookLabel =
    h.strength === 'weak' ? t.polishUi.hookWeak
      : h.strength === 'ok' ? t.polishUi.hookOk
        : t.polishUi.hookStrong;
  return (
    <SectionCard
      icon={<Zap className={`w-4 h-4 ${p.text}`} />}
      title={t.polishUi.hookTitle}
      accent={p.border}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${p.bg} ${p.text} border ${p.border} shrink-0`}
        >
          {t.polishUi.hookStrength.replace('{label}', hookLabel)}
        </span>
        <div className="flex-1 min-w-[200px] space-y-1.5">
          {h.at3s ? (
            <p className="text-[12.5px] text-white/85 leading-relaxed">
              <span className="text-[10px] text-white/40 tracking-wider uppercase mr-1.5">3s</span>
              {h.at3s}
            </p>
          ) : null}
          {h.rationale ? (
            <p className="text-[11px] text-white/50 leading-relaxed italic">{h.rationale}</p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

function ActStructureBlock({
  a, actions,
}: {
  a: NonNullable<PolishAudit['actStructure']>;
  actions?: AuditActions;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const beats: Array<[string, string, string]> = [
    [t.polishUi.beatInciting, a.incitingIncident, 'bg-blue-500/10 text-blue-200 border-blue-500/30'],
    [t.polishUi.beatMidpoint, a.midpoint,         'bg-purple-500/10 text-purple-200 border-purple-500/30'],
    [t.polishUi.beatClimax, a.climax,             'bg-amber-500/10 text-amber-200 border-amber-500/30'],
    [t.polishUi.beatResolution, a.resolution,     'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'],
  ];
  return (
    <SectionCard icon={<LayoutList className="w-4 h-4 text-cyan-300" />} title={t.polishUi.actTitle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
        {beats
          .filter(([, v]) => !!v)
          .map(([k, v, color]) => (
            <div key={k} className={`p-2.5 rounded-lg border ${color}`}>
              <div className="flex items-center gap-1 mb-1">
                <p className="text-[10px] tracking-widest uppercase opacity-70">{k}</p>
                <ActionButtons text={v} actions={actions} className="ml-auto" />
              </div>
              <p className="text-[12px] leading-relaxed">{v}</p>
            </div>
          ))}
      </div>
      {a.missingBeats.length > 0 ? (
        <div>
          <p className="text-[10px] text-amber-300/80 tracking-wider uppercase mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t.polishUi.missingBeats.replace('{n}', String(a.missingBeats.length))}
            <span className="opacity-60 ml-1 normal-case tracking-normal">{t.polishUi.missingBeatsHint}</span>
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {a.missingBeats.map((b, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/10 text-amber-200 border border-amber-500/30 flex items-center gap-1"
              >
                {b}
                <ActionButtons text={t.polishUi.fillBeat.replace('{beat}', b)} actions={actions} />
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function DialogueBlock({
  d, actions,
}: {
  d: NonNullable<PolishAudit['dialogueIssues']>;
  actions?: AuditActions;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  return (
    <SectionCard icon={<MessageSquareQuote className="w-4 h-4 text-rose-300" />} title={t.polishUi.dialogueTitle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {d.onTheNoseLines.length > 0 ? (
          <div>
            <p className="text-[10px] text-rose-300/80 tracking-wider uppercase mb-1.5">
              {t.polishUi.onTheNose.replace('{n}', String(d.onTheNoseLines.length))}
            </p>
            <ul className="space-y-1.5 text-[12px] text-white/80">
              {d.onTheNoseLines.map((l, i) => (
                <li key={i} className="flex gap-2 leading-relaxed items-start group">
                  <span className="text-rose-300/60 font-mono shrink-0">·</span>
                  <span className="italic flex-1">"{l}"</span>
                  <ActionButtons text={l} actions={actions} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {d.abstractEmotionLines.length > 0 ? (
          <div>
            <p className="text-[10px] text-orange-300/80 tracking-wider uppercase mb-1.5">
              {t.polishUi.abstractEmotion.replace('{n}', String(d.abstractEmotionLines.length))}
            </p>
            <ul className="space-y-1.5 text-[12px] text-white/80">
              {d.abstractEmotionLines.map((l, i) => (
                <li key={i} className="flex gap-2 leading-relaxed items-start group">
                  <span className="text-orange-300/60 font-mono shrink-0">·</span>
                  <span className="italic flex-1">"{l}"</span>
                  <ActionButtons text={l} actions={actions} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function CharacterAnchorsBlock({ anchors }: { anchors: PolishAudit['characterAnchors'] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  return (
    <SectionCard icon={<Users className="w-4 h-4 text-violet-300" />} title={t.polishUi.charAnchorsTitle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {anchors.map((c) => (
          <div
            key={c.name}
            className="p-3 rounded-lg border border-violet-500/20 bg-violet-500/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-violet-200">{c.name}</span>
            </div>
            <dl className="space-y-1 text-[11.5px]">
              {c.visualLock ? (
                <div className="flex gap-1.5">
                  <dt className="text-[10px] text-violet-300/70 shrink-0 w-10">{t.polishUi.faceLock}</dt>
                  <dd className="text-white/80 leading-relaxed">{c.visualLock}</dd>
                </div>
              ) : null}
              {c.speechStyle ? (
                <div className="flex gap-1.5">
                  <dt className="text-[10px] text-violet-300/70 shrink-0 w-10">{t.polishUi.speechStyle}</dt>
                  <dd className="text-white/80 leading-relaxed">{c.speechStyle}</dd>
                </div>
              ) : null}
              {c.arc ? (
                <div className="flex gap-1.5">
                  <dt className="text-[10px] text-violet-300/70 shrink-0 w-10">{t.polishUi.arc}</dt>
                  <dd className="text-white/80 leading-relaxed">{c.arc}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SceneLightingBlock({ scenes }: { scenes: PolishAudit['sceneLighting'] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  return (
    <SectionCard icon={<Lightbulb className="w-4 h-4 text-yellow-300" />} title={t.polishUi.lightingTitle}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-[11.5px] min-w-[520px]">
          <thead>
            <tr className="text-[10px] text-white/45 tracking-wider uppercase text-left">
              <th className="py-1.5 px-2 font-normal">{t.product.tabScenes}</th>
              <th className="py-1.5 px-2 font-normal">{t.polishUi.colLightDir}</th>
              <th className="py-1.5 px-2 font-normal">{t.polishUi.colQuality}</th>
              <th className="py-1.5 px-2 font-normal">{t.polishUi.colColorTemp}</th>
              <th className="py-1.5 px-2 font-normal">{t.polishUi.colMood}</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((s, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2 px-2 text-white/85">{s.scene}</td>
                <td className="py-2 px-2 text-white/70">{s.lightDirection || '—'}</td>
                <td className="py-2 px-2 text-white/70">{s.quality || '—'}</td>
                <td className="py-2 px-2 text-white/70">{s.colorTemp || '—'}</td>
                <td className="py-2 px-2 text-white/70">{s.mood || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function ContinuityBlock({ anchors }: { anchors: string[] }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  return (
    <SectionCard icon={<Anchor className="w-4 h-4 text-teal-300" />} title={t.polishUi.continuityTitle}>
      <ul className="space-y-1.5 text-[12px] text-white/80">
        {anchors.map((a, i) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className="text-teal-300/60 font-mono shrink-0 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function IssuesBlock({
  issues, actions,
}: {
  issues: PolishAudit['issues'];
  actions?: AuditActions;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const categoryLabel: Record<string, string> = {
    pacing: t.polishUi.catPacing,
    dialogue: t.polishUi.catDialogue,
    structure: t.polishUi.catStructure,
    character: t.polishUi.catCharacter,
    aigc: t.polishUi.catAigc,
    other: t.polishUi.catOther,
  };
  // Sort by severity: critical > major > minor
  const order = { critical: 0, major: 1, minor: 2 } as const;
  const sorted = [...issues].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  return (
    <SectionCard icon={<Drama className="w-4 h-4 text-orange-300" />} title={t.polishUi.issuesTitle.replace('{n}', String(issues.length))}>
      <ul className="space-y-2">
        {sorted.map((it, i) => (
          <li
            key={i}
            className={`p-2.5 rounded-lg border text-[12px] ${SEVERITY_COLOR[it.severity] || SEVERITY_COLOR.minor}`}
          >
            <div className="flex items-center gap-2 mb-1 text-[10px] tracking-wider uppercase opacity-80">
              <span>{it.severity}</span>
              <span>·</span>
              <span>{categoryLabel[it.category] || it.category}</span>
              {it.where ? (
                <>
                  <span>·</span>
                  <span className="font-mono opacity-70">{it.where}</span>
                </>
              ) : null}
              <ActionButtons text={it.text} actions={actions} className="ml-auto" />
            </div>
            <p className="leading-relaxed">{it.text}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

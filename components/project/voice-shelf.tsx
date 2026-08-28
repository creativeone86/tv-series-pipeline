'use client';

/**
 * v9.7.7 — Character voice shelf (phase 16 · manual voice override). Lists every
 * character + current voice (override / auto), pick from `VOICE_CATALOG`,
 * Preview (POST /api/voice-sample) and Save (POST /voice-overrides).
 * After save, shot-audio prefers the override. Nested in the dubbing/lipsync
 * panel, collapsed by default.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { UserSound, CaretDown, CaretRight, Play, CircleNotch, FloppyDisk, UploadSimple } from '@phosphor-icons/react';
import { VOICE_CATALOG } from '@/lib/character-studio';
import { buildVoiceRouting } from '@/lib/voice-routing';
import { useLocale } from '@/hooks/use-locale';

export function VoiceShelf({ projectId, characters }: { projectId: string; characters: string[] }) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const distinct = useMemo(() => Array.from(new Set(characters.map((c) => (c || '').trim()).filter(Boolean))), [characters]);
  const autoRouting = useMemo(() => buildVoiceRouting(distinct), [distinct]);
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [auditionId, setAuditionId] = useState<string | null>(null);
  // v12.208: voice clone — upload sample → MiniMax clone → voiceId joins the list
  const [cloned, setCloned] = useState<Array<{ id: string; label: string }>>([]);
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);
  // v12.221 compliance gate: cloning someone else's voice requires consent + purpose.
  const [consentChecked, setConsentChecked] = useState(false);
  const [clonePurpose, setClonePurpose] = useState('drama_production');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const voiceLabel = (v: { label: string; nameEn?: string; en?: string }) =>
    locale === 'en' ? (v.nameEn || v.en || v.label) : v.label;

  const doClone = useCallback(async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setSavedMsg(t.projectPanels.pickSampleFirst); return; }
    if (file.size > 5 * 1024 * 1024) { setSavedMsg(t.projectPanels.sampleTooLarge); return; }
    if (!consentChecked) { setSavedMsg(t.projectPanels.consentRequired); return; }
    setCloning(true); setSavedMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (cloneName.trim()) fd.append('name', cloneName.trim());
      // v12.221: consent payload is logged server-side before clone runs.
      fd.append('consent_authorized', 'true');
      fd.append('consent_purpose', clonePurpose);
      fd.append('consent_owner_declaration', t.projectPanels.consentOwnerDeclaration);
      const res = await fetch('/api/voice-clone', { method: 'POST', body: fd });
      const b = await res.json();
      if (!res.ok) throw new Error(b.error || t.projectPanels.cloneFailed);
      setCloned((arr) => [...arr, { id: b.voiceId, label: `${cloneName.trim() || b.voiceId} ${t.projectPanels.cloneTag}` }]);
      setSavedMsg(t.projectPanels.cloneSuccess.replace('{id}', String(b.voiceId)));
      if (fileRef.current) fileRef.current.value = '';
      setCloneName('');
    } catch (e) { setSavedMsg(e instanceof Error ? e.message : t.projectPanels.cloneFailed); }
    finally { setCloning(false); }
  }, [cloneName, consentChecked, clonePurpose, t.projectPanels]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-overrides`);
        const b = await res.json();
        if (alive && res.ok && b.overrides) setOverrides(b.overrides);
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, [projectId]);

  const voiceFor = useCallback((c: string) => overrides[c] || autoRouting.get(c) || 'narrator_male_cn', [overrides, autoRouting]);

  const audition = useCallback(async (c: string) => {
    setAuditionId(c); setSavedMsg(null);
    try {
      const res = await fetch('/api/voice-sample', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voiceId: voiceFor(c) }) });
      const b = await res.json();
      if (b.ok && b.audioUrl) { try { await new Audio(b.audioUrl).play(); } catch { /* autoplay blocked */ } }
      else setSavedMsg(b.message || t.projectPanels.auditionFailedNeedTts);
    } catch (e) { setSavedMsg(e instanceof Error ? e.message : t.projectPanels.auditionFailed); }
    finally { setAuditionId(null); }
  }, [voiceFor, t.projectPanels]);

  const save = useCallback(async () => {
    setSaving(true); setSavedMsg(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-overrides`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ overrides }),
      });
      const b = await res.json();
      setSavedMsg(b.ok ? t.projectPanels.voicesSaved : (b.message || t.projectPanels.saveFailed));
    } catch (e) { setSavedMsg(e instanceof Error ? e.message : t.projectPanels.saveFailed); }
    finally { setSaving(false); }
  }, [projectId, overrides, t.projectPanels]);

  if (!distinct.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-1.5 text-[11px] text-white/70">
        {open ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
        <UserSound className="w-3.5 h-3.5" /> {t.projectPanels.voiceShelfTitle.replace('{n}', String(distinct.length))}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {distinct.map((c) => {
            const cur = voiceFor(c);
            const overridden = !!overrides[c];
            return (
              <div key={c} className="flex items-center gap-2">
                <span className="text-[11px] text-white/70 w-20 shrink-0 truncate">{c}</span>
                <select
                  value={cur}
                  onChange={(e) => setOverrides((m) => ({ ...m, [c]: e.target.value }))}
                  className="flex-1 min-w-0 bg-white/[0.04] border border-white/10 rounded px-1.5 py-1 text-[11px] text-white/80 outline-none"
                >
                  {VOICE_CATALOG.map((v) => (<option key={v.id} value={v.id} className="bg-[#1a1a24]">{voiceLabel(v)} · {voiceLabel({ label: v.tone })}</option>))}
                  {cloned.map((v) => (<option key={v.id} value={v.id} className="bg-[#1a1a24]">{v.label}</option>))}
                </select>
                <span className={`text-[9px] shrink-0 w-6 ${overridden ? 'text-amber-300/70' : 'text-white/25'}`}>{overridden ? t.projectPanels.manual : t.projectPanels.auto}</span>
                <button onClick={() => audition(c)} disabled={!!auditionId} className="cinema-btn !px-1.5 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50" title={t.projectPanels.audition}>
                  {auditionId === c ? <CircleNotch className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
            );
          })}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving} className="cinema-btn cinema-btn-primary !px-2.5 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-50">
              {saving ? <CircleNotch className="w-3 h-3 animate-spin" /> : <FloppyDisk className="w-3 h-3" />}
              {saving ? t.common.saving : t.projectPanels.saveVoices}
            </button>
            {savedMsg && <span className="text-[10px] text-white/45 truncate">{savedMsg}</span>}
          </div>

          {/* v12.208: voice clone — upload ≥10s clean speech; voiceId binds in the dropdown above */}
          {/* v12.221: compliance gate — cloning another person's voice is deep synthesis; consent + purpose required */}
          <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[10px] text-white/45">🎤 {t.projectPanels.cloneHint}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input ref={fileRef} type="file" accept="audio/*" className="text-[10px] text-white/60 max-w-[150px]" />
              <input value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder={t.projectPanels.cloneNamePlaceholder}
                className="bg-white/[0.04] border border-white/10 rounded px-1.5 py-1 text-[11px] text-white/80 outline-none w-[100px]" />
              <select value={clonePurpose} onChange={(e) => setClonePurpose(e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded px-1.5 py-1 text-[10px] text-white/80 outline-none" title={t.projectPanels.clonePurposeTitle}>
                <option value="drama_production">{t.projectPanels.purposeDrama}</option>
                <option value="ad_production">{t.projectPanels.purposeAd}</option>
                <option value="personal_project">{t.projectPanels.purposePersonal}</option>
                <option value="other">{t.projectPanels.purposeOther}</option>
              </select>
            </div>
            <label className="flex items-start gap-1.5 text-[10px] text-white/55 cursor-pointer leading-snug">
              <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 accent-amber-400" />
              <span>{t.projectPanels.consentLead}<b className="text-white/75">{t.projectPanels.consentBold}</b>{t.projectPanels.consentTail}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button onClick={doClone} disabled={cloning || !consentChecked}
                className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                title={consentChecked ? t.projectPanels.cloneVoice : t.projectPanels.consentRequired}>
                {cloning ? <CircleNotch className="w-3 h-3 animate-spin" /> : <UploadSimple className="w-3 h-3" />}
                {cloning ? t.projectPanels.cloningWait : t.projectPanels.cloneVoice}
              </button>
              {!consentChecked && <span className="text-[9px] text-amber-300/70">{t.projectPanels.consentThenClone}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

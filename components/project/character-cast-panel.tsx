'use client';

/**
 * CharacterCastPanel (v12.198) — project-detail "cast file" multi-subject faces.
 *
 * Jimeng/Kling-style cast: after build, add/replace up to 3 face refs.
 * Reuses create-page CharacterLockSection (upload → persist → traits).
 * Persist via PUT /api/projects/:id/characters (locked_characters + normalize).
 * Orchestrator injects subject_reference by name on generate/reshoot to lock
 * cross-shot consistency.
 */

import { useEffect, useState, useCallback } from 'react';
import { CharacterLockSection, type LockedCharacter } from '@/components/create/character-lock-section';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

export function CharacterCastPanel({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [cast, setCast] = useState<LockedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/characters`);
        const data = await res.json();
        if (alive && Array.isArray(data?.characters)) setCast(data.characters);
      } catch { /* empty file if fetch fails; do not nag */ } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId]);

  const onChange = useCallback((next: LockedCharacter[]) => {
    setCast(next);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/characters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters: cast }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.projectMisc.saveFailed);
      setCast(data.characters || []);
      setDirty(false);
      showToast({ title: t.projectMisc.castSavedTitle.replace('{n}', String(data.count)), description: t.projectMisc.castSavedDesc, type: 'success', duration: 3000 });
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.projectMisc.saveFailed, type: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  }, [cast, projectId, showToast, t.projectMisc.castSavedDesc, t.projectMisc.castSavedTitle, t.projectMisc.saveFailed]);

  if (loading) return null;

  return (
    <div className="cinema-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white/90">🎭 {t.projectMisc.castTitle}</h3>
          <p className="text-[11px] text-white/45 mt-0.5">
            {t.projectMisc.castDesc}
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            saving || !dirty
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-pink-500/80 hover:bg-pink-500 text-white active:scale-95'
          }`}
        >
          {saving ? t.common.saving : dirty ? t.projectMisc.saveCast : t.projectMisc.savedShort}
        </button>
      </div>
      <CharacterLockSection value={cast} onChange={onChange} />
    </div>
  );
}

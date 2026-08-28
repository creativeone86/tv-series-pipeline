'use client';

/**
 * AssetLedgerPanel (v10.6.1) — asset-level continuity ledger (Continuity tab,
 * below the seed-lock console). Costume / scene / prop entries × citing shot
 * numbers; editing a description immediately lists affected shots (matching
 * boards / video marked stale).
 */
import { useCallback, useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { useLocale } from '@/hooks/use-locale';

interface Entry {
  id: string;
  kind: 'costume' | 'scene' | 'prop';
  name: string;
  description: string;
  shotNumbers: number[];
  source: 'auto' | 'manual';
}

const KIND_CLS: Record<Entry['kind'], string> = {
  costume: 'text-amber-300 border-amber-500/30',
  scene: 'text-sky-300 border-sky-500/30',
  prop: 'text-emerald-300 border-emerald-500/30',
};

function authHeaders(): Record<string, string> {
  const tok = getToken();
  return { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) };
}

export function AssetLedgerPanel({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const kindLabel = (k: Entry['kind']) =>
    k === 'costume' ? t.projectPanels.kindCostume : k === 'scene' ? t.product.tabScenes : t.projectPanels.kindProp;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string>('');
  const [newProp, setNewProp] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/asset-ledger`);
      if (res.ok) setEntries((await res.json()).entries || []);
    } catch { /* non-critical, silent */ }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (entry: Entry) => {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/asset-ledger`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ entryId: entry.id, description: draft }),
    });
    if (res.ok) {
      const { affectedShots, staleMarked } = await res.json();
      setNotice(
        affectedShots.length
          ? t.projectPanels.descUpdated.replace('{name}', entry.name).replace('{shots}', affectedShots.join('\u3001')).replace('{n}', String(staleMarked))
          : t.projectPanels.descUpdatedNone.replace('{name}', entry.name),
      );
      setEditing(null);
      await refresh();
    }
  };

  const addProp = async () => {
    const name = newProp.trim();
    if (!name) return;
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/asset-ledger`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ kind: 'prop', name }),
    });
    if (res.ok || res.status === 409) {
      setNewProp('');
      await refresh();
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" data-testid="asset-ledger">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-white">{t.projectPanels.ledgerTitle}</h3>
        <div className="flex items-center gap-1.5">
          <input
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addProp(); }}
            placeholder={t.projectPanels.registerPropPh}
            aria-label={t.projectPanels.registerPropAria}
            className="px-2 py-1 text-[11px] rounded-md bg-black/30 border border-white/10 focus:outline-none focus:border-[#E8C547]/50 w-44"
          />
          <button onClick={addProp} className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E8C547] text-[#0C0C0C] hover:bg-[#D4A830]">{t.projectPanels.register}</button>
        </div>
      </div>
      <p className="text-[11px] text-[var(--muted)] mb-3">
        {t.projectPanels.ledgerHint}
      </p>

      {notice && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#E8C547]/10 border border-[#E8C547]/30 text-[12px] text-[#E8C547]" role="status">
          {notice}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-xs text-[var(--muted)] py-4 text-center">{t.projectPanels.emptyEntries}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const isEditing = editing === e.id;
            return (
              <li key={e.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${KIND_CLS[e.kind]}`}>{kindLabel(e.kind)}</span>
                  <span className="text-[12.5px] font-medium text-white">{e.name}</span>
                  {e.source === 'manual' && <span className="text-[10px] text-white/60">{t.projectPanels.manual}</span>}
                  <span className="ml-auto text-[11px] text-white/70">
                    {t.projectPanels.citedShots.replace('{shots}', e.shotNumbers.length ? e.shotNumbers.join('\u3001') : t.projectPanels.citedNone)}
                  </span>
                </div>
                {isEditing ? (
                  <div className="mt-2 flex items-start gap-2">
                    <textarea
                      value={draft}
                      onChange={(ev) => setDraft(ev.target.value)}
                      rows={2}
                      aria-label={t.projectPanels.descAria.replace('{name}', e.name)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-md bg-black/30 border border-white/10 focus:outline-none focus:border-[#E8C547]/50"
                    />
                    <button onClick={() => save(e)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E8C547] text-[#0C0C0C] hover:bg-[#D4A830]">{t.common.save}</button>
                    <button onClick={() => setEditing(null)} className="px-2 py-1 rounded-md text-[11px] text-white/70 border border-white/15 hover:text-white">{t.common.cancel}</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(e.id); setDraft(e.description); setNotice(''); }}
                    className="mt-1 block w-full text-left text-[11.5px] text-white/70 hover:text-white/95 transition-colors"
                    title={t.projectPanels.editDescTitle}
                  >
                    {e.description || <span className="opacity-60">{t.projectPanels.noDesc}</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { IMG_AVATAR_DEFAULT } from '@/lib/placeholder-images';
import { useLocale } from '@/hooks/use-locale';

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  appearance: string;
  avatarUrl: string;
  tags: string[];
}

interface Props {
  characters: CharacterProfile[];
  onChange: (characters: CharacterProfile[]) => void;
}

export function CharacterManager({ characters, onChange }: Props) {
  const { t } = useLocale();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', description: '', appearance: '', tags: '' });

  const addCharacter = () => {
    const id = `char-${Date.now()}`;
    onChange([...characters, {
      id, name: t.sharedUi.newCharacter, description: '', appearance: '',
      avatarUrl: IMG_AVATAR_DEFAULT, tags: [],
    }]);
    setEditing(id);
    setDraft({ name: t.sharedUi.newCharacter, description: '', appearance: '', tags: '' });
  };

  const saveCharacter = () => {
    if (!editing) return;
    onChange(characters.map((c) =>
      c.id === editing ? { ...c, name: draft.name, description: draft.description, appearance: draft.appearance, tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean) } : c
    ));
    setEditing(null);
  };

  const removeCharacter = (id: string) => {
    onChange(characters.filter((c) => c.id !== id));
    if (editing === id) setEditing(null);
  };

  const startEdit = (c: CharacterProfile) => {
    setEditing(c.id);
    setDraft({ name: c.name, description: c.description, appearance: c.appearance, tags: c.tags.join(', ') });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{t.sharedUi.charConsistency}</h3>
        <button onClick={addCharacter} className="btn-primary px-3 py-1.5 rounded-lg text-xs">+ {t.sharedUi.addCharacter}</button>
      </div>

      <div className="grid gap-3">
        {characters.map((c) => (
          <GlassCard key={c.id} className="!p-4 !rounded-xl">
            {editing === c.id ? (
              <div className="grid gap-3">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t.sharedUi.charNamePh} className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={t.sharedUi.charDescPh} rows={2} className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none" />
                <textarea value={draft.appearance} onChange={(e) => setDraft({ ...draft, appearance: e.target.value })} placeholder={t.sharedUi.charAppearPh} rows={2} className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none" />
                <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder={t.sharedUi.charTagsPh} className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={saveCharacter} className="btn-primary px-3 py-1.5 rounded-lg text-xs">{t.common.save}</button>
                  <button onClick={() => setEditing(null)} className="btn-ghost px-3 py-1.5 rounded-lg text-xs">{t.common.cancel}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img loading="lazy" decoding="async" src={c.avatarUrl} alt={c.name} className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-[var(--muted)] line-clamp-1">{c.description || t.sharedUi.noDescription}</div>
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-[rgba(239,49,159,0.15)] text-[10px] text-[var(--primary)]">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => startEdit(c)} className="px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.08)] text-xs hover:bg-[rgba(255,255,255,0.12)] transition-colors">{t.common.edit}</button>
                  <button onClick={() => removeCharacter(c.id)} className="px-2 py-1 rounded-lg bg-[rgba(255,88,88,0.12)] text-xs text-red-400 hover:bg-[rgba(255,88,88,0.2)] transition-colors">{t.common.delete}</button>
                </div>
              </div>
            )}
          </GlassCard>
        ))}

        {characters.length === 0 && (
          <div className="text-center py-8 text-[var(--soft)] text-sm">
            {t.product.emptyCharacters}{t.sharedUi.clickAboveToAdd}
          </div>
        )}
      </div>
    </div>
  );
}

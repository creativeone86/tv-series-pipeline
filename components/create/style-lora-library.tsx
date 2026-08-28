'use client';

/**
 * components/create/style-lora-library (v2.15 G8)
 *
 * User "style fingerprint" library — reuses global_assets (type='style')
 * table + routes. No new schema.
 *
 * Payload (stored in global_assets.metadata):
 *   { stylePreset: string,   // current style selector value
 *     cameraDefault: string|null }  // current camera-language default (v2.14 P1.1)
 *
 * Usage:
 *   <StyleLoraLibrary
 *     currentStyle={style}
 *     currentCameraDefault={cameraDefault}
 *     onApply={(applied) => { setStyle(applied.stylePreset); setCameraDefault(applied.cameraDefault); }}
 *   />
 */

import { useEffect, useState } from 'react';
import { Bookmark, Plus, Trash as Trash2, CircleNotch as Loader2 } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface GlobalAssetStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  metadata: {
    stylePreset?: string;
    cameraDefault?: string | null;
    [k: string]: any;
  };
  createdAt: string;
}

export interface AppliedStyle {
  stylePreset: string;
  cameraDefault: string | null;
}

export interface StyleLoraLibraryProps {
  currentStyle: string;
  currentCameraDefault: string | null;
  onApply: (applied: AppliedStyle) => void;
  /** Optional: suggest the project's first reference still as the thumbnail */
  thumbnailSuggest?: string;
  className?: string;
}

export function StyleLoraLibrary({
  currentStyle, currentCameraDefault, onApply, thumbnailSuggest, className = '',
}: StyleLoraLibraryProps) {
  const { showToast } = useToast();   // v12.300: surface failures; do not leave them in console only
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [items, setItems] = useState<GlobalAssetStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/global-assets?type=style&limit=50');
      const body = await res.json();
      const assets = Array.isArray(body?.assets) ? body.assets : [];
      setItems(assets.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        thumbnail: a.thumbnail || '',
        metadata: a.metadata || {},
        createdAt: a.createdAt || a.created_at || '',
      })));
    } catch (e) {
      console.warn('[StyleLora] list failed:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    const name = draftName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/global-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'style',
          name,
          description: `${currentStyle}${currentCameraDefault ? ` · ${currentCameraDefault}` : ''}`,
          thumbnail: thumbnailSuggest || '',
          metadata: {
            stylePreset: currentStyle,
            cameraDefault: currentCameraDefault,
          },
        }),
      });
      if (!res.ok) {
        // v12.300: previously only console.warn — popover stayed, spinner died, no copy
        const body = await res.json().catch(() => ({}));
        console.warn('[StyleLora] save failed:', body.error);
        showToast({ title: t.workshopCreate.styleSaveFailed, description: String(body?.error || `HTTP ${res.status}`).slice(0, 120), type: 'error', duration: 4000 });
        return;
      }
      setDraftName('');
      setSaveOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t.workshopCreate.deleteStyleConfirm.replace('{name}', name))) return;
    try {
      await fetch(`/api/global-assets/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (appliedId === id) setAppliedId(null);
      await refresh();
    } catch (e) {
      console.warn('[StyleLora] delete failed:', e);
    }
  };

  const handleApply = (item: GlobalAssetStyle) => {
    const stylePreset = item.metadata.stylePreset || '';
    const cameraDefault = item.metadata.cameraDefault ?? null;
    if (!stylePreset && !cameraDefault) return;
    setAppliedId(item.id);
    onApply({ stylePreset, cameraDefault });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="cinema-eyebrow inline-flex items-center gap-1.5">
          <Bookmark className="w-3 h-3" />
          {t.workshopCreate.styleLibraryTitle}
        </span>
        <Popover open={saveOpen} onOpenChange={setSaveOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!currentStyle}
              className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-30"
              title={currentStyle ? t.workshopCreate.saveCurrentHint : t.workshopCreate.saveCurrentDisabledHint}
            >
              <Plus className="w-3 h-3" />
              {t.workshopCreate.saveCurrent}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-2">
            <h4 className="cinema-mono text-[11px] tracking-widest opacity-60">SAVE STYLE</h4>
            <input
              autoFocus
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder={t.workshopCreate.styleNamePlaceholder}
              maxLength={40}
              className="w-full px-2 py-1.5 bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded text-sm focus:outline-none focus:border-[var(--cinema-amber)]"
            />
            <div className="cinema-mono text-[10px] opacity-50">
              {t.workshopCreate.currentStyle.replace('{style}', currentStyle || '—')}
              {currentCameraDefault ? t.workshopCreate.currentCamera.replace('{camera}', currentCameraDefault) : ''}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSaveOpen(false)}
                className="cinema-btn !px-3 !py-1 !text-[11px] flex-1"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!draftName.trim() || saving}
                className="cinema-btn cinema-btn-primary !px-3 !py-1 !text-[11px] flex-1 disabled:opacity-40 inline-flex items-center justify-center gap-1"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                {t.common.save}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="cinema-mono text-[10px] opacity-75">{t.common.loading}</div>
      ) : items.length === 0 ? (
        <div className="cinema-mono text-[10px] opacity-70">
          {t.workshopCreate.styleLibraryEmpty}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const isActive = appliedId === item.id;
            return (
              <div key={item.id} className="inline-flex items-center group">
                <button
                  type="button"
                  onClick={() => handleApply(item)}
                  title={item.description || item.name}
                  className={`cinema-btn !pl-2 !pr-1.5 !py-1 !text-[11px] cinema-mono inline-flex items-center gap-1 ${
                    isActive ? 'cinema-btn-primary' : ''
                  }`}
                >
                  <Bookmark className="w-2.5 h-2.5" />
                  {item.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                  title={t.common.delete}
                  className="ml-px px-1.5 py-1 cinema-btn !text-[10px] opacity-40 hover:opacity-100 hover:text-[var(--cinema-red)] transition-opacity"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

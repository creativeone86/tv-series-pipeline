'use client';

/**
 * components/create/template-library-picker (v2.18 P1.1 + P1.2)
 *
 * Replaces the create-page horizontal template shelf with:
 *   - Top tag-chip filters (auto-collected from every template's category + tags)
 *   - Search box (full-text on name / category / tag)
 *   - Sort options (default / builtin-first / personal-first)
 *   - Personal and builtin templates in one grid; personal rows get a PERSONAL badge + delete
 *   - Clone: copy the selected template with a custom suffix into the personal library
 *     (/api/global-assets type='template')
 *   - "Save current as template" is provided by the parent (needs current form state)
 *
 * Personal-template payload (stored in global_assets.metadata):
 *   {
 *     baseTemplateId?: string,   // clone source (future: show lineage)
 *     exampleIdea: string,
 *     structureHint: string,
 *     keyElements: string[],
 *     styleRecommendation: string,
 *     shotCount: { min, max },
 *     colorPalette: string,
 *     tags?: string[],
 *     recommendedDuration?: 5|6|10|15,
 *     recommendedAspect?: '16:9'|'9:16'|'1:1'|'2.35:1',
 *     recommendedCamera?: string,
 *   }
 */

import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass as Search, X, Trash as Trash2, Copy, User, Sparkle as Sparkles, Funnel as Filter, CaretDown as ChevronDown, CaretUp as ChevronUp, ShareNetwork as Share2, Check, Download, Upload } from '@phosphor-icons/react';
import { storyTemplates, type StoryTemplate } from '@/lib/story-templates';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PersonalTemplate extends StoryTemplate {
  /** Surfaced from global_assets.id — used for DELETE */
  personalAssetId: string;
  /** Marker — PERSONAL badge in the UI */
  isPersonal: true;
}

type AnyTemplate = StoryTemplate | PersonalTemplate;

function isPersonal(tmpl: AnyTemplate): tmpl is PersonalTemplate {
  return (tmpl as any).isPersonal === true;
}

export interface TemplateLibraryPickerProps {
  /** Currently selected template id (null = none) */
  selectedId: string | null;
  /** Select / deselect (null). Parent should run handleSelectTemplate to fill the form */
  onSelect: (template: StoryTemplate | null) => void;
  /** Top-right "save current as template" — parent implements from current form state */
  onSaveCurrentAsTemplate?: () => Promise<void>;
}

export function TemplateLibraryPicker({
  selectedId, onSelect, onSaveCurrentAsTemplate,
}: TemplateLibraryPickerProps) {
  const { showToast } = useToast();   // v12.300: surface failures; do not leave them in console only
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<'default' | 'personal-first' | 'builtin-first'>('default');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [personalList, setPersonalList] = useState<PersonalTemplate[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [cloneOpenForId, setCloneOpenForId] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [savingClone, setSavingClone] = useState(false);
  // v2.18 P2.3: last copied share-link token (drives the "copied" checkmark)
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const displayName = (tmpl: AnyTemplate) =>
    locale === 'en' ? (tmpl.nameEn || tmpl.name) : tmpl.name;
  const displayNameSecondary = (tmpl: AnyTemplate) =>
    locale === 'en' ? tmpl.name : tmpl.nameEn;

  // Fetch personal templates
  const refreshPersonal = async () => {
    setLoadingPersonal(true);
    try {
      const res = await fetch('/api/global-assets?type=template&limit=100');
      const body = await res.json();
      const assets = Array.isArray(body?.assets) ? body.assets : [];
      setPersonalList(assets.map((a: any): PersonalTemplate => {
        const m = a.metadata || {};
        return {
          id: `personal-${a.id}`,
          personalAssetId: a.id,
          isPersonal: true,
          name: a.name,
          nameEn: m.nameEn || a.name,
          icon: m.icon || '⭐',
          category: 'personal',
          description: a.description || '',
          exampleIdea: m.exampleIdea || '',
          structureHint: m.structureHint || '',
          emotionCurve: m.emotionCurve || '',
          keyElements: m.keyElements || [],
          styleRecommendation: m.styleRecommendation || '',
          shotCount: m.shotCount || { min: 4, max: 8 },
          colorPalette: m.colorPalette || '',
          tags: m.tags || [],
          recommendedDuration: m.recommendedDuration,
          recommendedAspect: m.recommendedAspect,
          recommendedCamera: m.recommendedCamera,
        };
      }));
    } catch (e) {
      console.warn('[TemplateLibrary] list personal failed:', e);
      setPersonalList([]);
    } finally {
      setLoadingPersonal(false);
    }
  };
  useEffect(() => { refreshPersonal(); }, []);

  // Aggregate tags + categories from every template into filter chips
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const tmpl of storyTemplates) {
      if (tmpl.category) set.add(tmpl.category);
      if (tmpl.tags) tmpl.tags.forEach((tag) => set.add(tag));
    }
    for (const tmpl of personalList) {
      if (tmpl.tags) tmpl.tags.forEach((tag) => set.add(tag));
    }
    return Array.from(set).sort();
  }, [personalList]);

  // Merge + filter all templates
  const visibleTemplates = useMemo<AnyTemplate[]>(() => {
    const merged: AnyTemplate[] = [...storyTemplates, ...personalList];
    const q = search.trim().toLowerCase();
    return merged
      .filter((tmpl) => {
        if (q) {
          const hay = (
            tmpl.name + ' ' + tmpl.nameEn + ' ' + tmpl.category + ' ' + (tmpl.tags || []).join(' ') + ' ' + tmpl.description
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (activeTags.size > 0) {
          const tHaystack = new Set([tmpl.category, ...(tmpl.tags || [])]);
          for (const need of activeTags) {
            if (!tHaystack.has(need)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'personal-first') {
          return Number(isPersonal(b)) - Number(isPersonal(a));
        }
        if (sortMode === 'builtin-first') {
          return Number(isPersonal(a)) - Number(isPersonal(b));
        }
        return 0;
      });
  }, [personalList, search, activeTags, sortMode]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleClone = async (source: AnyTemplate) => {
    const name = cloneName.trim() || t.workshopCreate.cloneNameSuffix.replace('{name}', source.name);
    setSavingClone(true);
    try {
      const res = await fetch('/api/global-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          name,
          description: source.description,
          metadata: {
            baseTemplateId: source.id,
            nameEn: source.nameEn,
            icon: source.icon,
            exampleIdea: source.exampleIdea,
            structureHint: source.structureHint,
            emotionCurve: source.emotionCurve,
            keyElements: source.keyElements,
            styleRecommendation: source.styleRecommendation,
            shotCount: source.shotCount,
            colorPalette: source.colorPalette,
            tags: source.tags,
            recommendedDuration: source.recommendedDuration,
            recommendedAspect: source.recommendedAspect,
            recommendedCamera: source.recommendedCamera,
          },
        }),
      });
      if (!res.ok) {
        // v12.300: clone popover used to stay open with no error text
        const body = await res.json().catch(() => ({}));
        console.warn('[TemplateLibrary] clone failed:', body.error);
        showToast({ title: t.workshopCreate.cloneFailed, description: String(body?.error || `HTTP ${res.status}`).slice(0, 120), type: 'error', duration: 4000 });
        return;
      }
      setCloneOpenForId(null);
      setCloneName('');
      await refreshPersonal();
    } finally {
      setSavingClone(false);
    }
  };

  const handleDeletePersonal = async (tmpl: PersonalTemplate) => {
    if (!confirm(t.workshopCreate.deletePersonalConfirm.replace('{name}', tmpl.name))) return;
    try {
      await fetch(`/api/global-assets/${encodeURIComponent(tmpl.personalAssetId)}`, { method: 'DELETE' });
      if (selectedId === tmpl.id) onSelect(null);
      await refreshPersonal();
    } catch (e) {
      console.warn('[TemplateLibrary] delete failed:', e);
    }
  };

  /**
   * v2.19 P0.4: export one personal template as JSON — offline team share (no share link).
   * Schema matches a storyTemplates entry, plus `__windComicTemplate: 'v1'` for import checks.
   * Omits token / userId / id and other server-side fields.
   */
  const handleExportTemplate = (tmpl: AnyTemplate) => {
    const exportData = {
      __windComicTemplate: 'v1',
      __exportedAt: new Date().toISOString(),
      name: tmpl.name,
      nameEn: tmpl.nameEn,
      icon: tmpl.icon,
      description: tmpl.description,
      exampleIdea: tmpl.exampleIdea,
      structureHint: tmpl.structureHint,
      emotionCurve: tmpl.emotionCurve,
      keyElements: tmpl.keyElements,
      styleRecommendation: tmpl.styleRecommendation,
      shotCount: tmpl.shotCount,
      colorPalette: tmpl.colorPalette,
      tags: tmpl.tags,
      recommendedDuration: tmpl.recommendedDuration,
      recommendedAspect: tmpl.recommendedAspect,
      recommendedCamera: tmpl.recommendedCamera,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Filename: template name + timestamp prefix; the browser sanitizes illegal chars
    a.download = `windcomic-template-${tmpl.name.slice(0, 20)}-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /**
   * v2.19 P0.4: import JSON into the personal library. Strict checks:
   *   - must be the v1 schema marker (reject arbitrary JSON)
   *   - must have name (everything else optional)
   *   - field length caps to avoid DOS
   */
  const handleImportTemplate = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed?.__windComicTemplate !== 'v1') {
        alert(t.workshopCreate.importInvalidSchema);
        return;
      }
      if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
        alert(t.workshopCreate.importMissingName);
        return;
      }
      const safeName = String(parsed.name).slice(0, 60);
      const importedName = t.workshopCreate.importNameSuffix.replace('{name}', safeName);
      // Same path as createGlobalAsset; do not bypass server-side validation
      const res = await fetch('/api/global-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          name: importedName,
          description: typeof parsed.description === 'string' ? parsed.description.slice(0, 300) : undefined,
          metadata: {
            __importedAt: new Date().toISOString(),
            nameEn: typeof parsed.nameEn === 'string' ? parsed.nameEn.slice(0, 60) : undefined,
            icon: typeof parsed.icon === 'string' ? parsed.icon.slice(0, 10) : undefined,
            exampleIdea: typeof parsed.exampleIdea === 'string' ? parsed.exampleIdea.slice(0, 500) : undefined,
            structureHint: typeof parsed.structureHint === 'string' ? parsed.structureHint.slice(0, 500) : undefined,
            emotionCurve: typeof parsed.emotionCurve === 'string' ? parsed.emotionCurve.slice(0, 200) : undefined,
            keyElements: Array.isArray(parsed.keyElements) ? parsed.keyElements.slice(0, 10).map((x: unknown) => String(x).slice(0, 50)) : undefined,
            styleRecommendation: typeof parsed.styleRecommendation === 'string' ? parsed.styleRecommendation.slice(0, 200) : undefined,
            shotCount: parsed.shotCount && typeof parsed.shotCount === 'object' ? parsed.shotCount : undefined,
            colorPalette: typeof parsed.colorPalette === 'string' ? parsed.colorPalette.slice(0, 200) : undefined,
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10).map((x: unknown) => String(x).slice(0, 30)) : undefined,
            recommendedDuration: [5, 6, 10, 15].includes(parsed.recommendedDuration) ? parsed.recommendedDuration : undefined,
            recommendedAspect: typeof parsed.recommendedAspect === 'string' ? parsed.recommendedAspect.slice(0, 10) : undefined,
            recommendedCamera: typeof parsed.recommendedCamera === 'string' ? parsed.recommendedCamera.slice(0, 60) : undefined,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || t.workshopCreate.importFailed.replace('{status}', String(res.status)));
        return;
      }
      await refreshPersonal();
      alert(t.workshopCreate.importSuccess.replace('{name}', importedName));
    } catch (e) {
      alert(e instanceof Error
        ? t.workshopCreate.importParseFailedWith.replace('{message}', e.message)
        : t.workshopCreate.importParseFailed);
    }
  };

  /**
   * v2.18 P2.3 + v2.19 P0.3: create a share token for a personal template and copy the URL.
   * v2.19 adds expiresInDays — null means forever; otherwise set expires_at by day count.
   */
  const handleSharePersonal = async (tmpl: PersonalTemplate, expiresInDays: number | null) => {
    setSharingId(tmpl.id);
    try {
      const res = await fetch('/api/templates/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: tmpl.personalAssetId,
          // number = expire in N days; omit = forever (server default)
          ...(expiresInDays != null ? { expiresInDays } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || t.workshopCreate.shareLinkFailed);
        return;
      }
      const expiryNote = body.expiresAt
        ? `\n\n⏳ ${t.workshopCreate.shareExpiresOn.replace('{date}', new Date(body.expiresAt).toLocaleDateString())}`
        : `\n\n♾️ ${t.workshopCreate.shareForever}`;
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(body.url);
        setCopiedToken(body.token);
        setTimeout(() => setCopiedToken(null), 3000);
        alert(t.workshopCreate.shareCopied.replace('{url}', body.url).replace('{expiry}', expiryNote));
      } catch {
        // Clipboard failed — still show the URL for manual copy
        alert(t.workshopCreate.shareManual.replace('{url}', body.url).replace('{expiry}', expiryNote));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t.workshopCreate.shareLinkFailed);
    } finally {
      setSharingId(null);
    }
  };

  const expandedTemplate = visibleTemplates.find((tmpl) => tmpl.id === expandedId);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="cinema-eyebrow">{t.workshopCreate.templateLibraryTitle}</span>
        <span className="cinema-mono text-[10px] opacity-50">
          {t.workshopCreate.templateCounts
            .replace('{builtin}', String(storyTemplates.length))
            .replace('{personal}', String(personalList.length))
            .replace('{visible}', String(visibleTemplates.length))}
        </span>
      </div>

      {/* Toolbar: search + tag popover + sort + save current */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            placeholder={t.workshopCreate.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-7 py-1.5 cinema-mono text-[11px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded focus:outline-none focus:border-[var(--cinema-amber)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`cinema-btn !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1 ${
                activeTags.size > 0 ? 'cinema-btn-primary' : ''
              }`}
              title={t.workshopCreate.filterByTags}
            >
              <Filter className="w-3 h-3" />
              {t.workshopCreate.filter} {activeTags.size > 0 && `(${activeTags.size})`}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 max-h-80 overflow-y-auto">
            <div className="cinema-mono text-[10px] tracking-widest opacity-60 mb-2">
              {t.workshopCreate.filterAndHint}
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => {
                const active = activeTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`cinema-btn !px-2 !py-0.5 !text-[10px] ${active ? 'cinema-btn-primary' : ''}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {activeTags.size > 0 && (
              <button
                onClick={() => setActiveTags(new Set())}
                className="cinema-mono text-[10px] mt-2 opacity-60 hover:opacity-100"
              >
                {t.workshopCreate.clearFilters}
              </button>
            )}
          </PopoverContent>
        </Popover>

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as any)}
          className="cinema-mono text-[10px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded px-2 py-1 focus:outline-none focus:border-[var(--cinema-amber)]"
          title={t.workshopCreate.sort}
        >
          <option value="default">{t.workshopCreate.sortDefault}</option>
          <option value="personal-first">{t.workshopCreate.sortPersonalFirst}</option>
          <option value="builtin-first">{t.workshopCreate.sortBuiltinFirst}</option>
        </select>

        {onSaveCurrentAsTemplate && (
          <button
            type="button"
            onClick={() => onSaveCurrentAsTemplate()}
            className="cinema-btn !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1"
            title={t.workshopCreate.saveAsTemplateHint}
          >
            <Sparkles className="w-3 h-3" />
            {t.workshopCreate.saveAsTemplate}
          </button>
        )}

        {/* v2.19 P0.4: import template from JSON (offline team share) */}
        <label
          className="cinema-btn !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1 cursor-pointer"
          title={t.workshopCreate.importJsonHint}
        >
          <Upload className="w-3 h-3" />
          {t.workshopCreate.importJson}
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await handleImportTemplate(f);
              e.target.value = ''; // allow picking the same file again
            }}
          />
        </label>
      </div>

      {/* Template grid */}
      {visibleTemplates.length === 0 ? (
        <div className="cinema-mono text-[11px] opacity-50 py-4 text-center">
          {t.workshopCreate.noMatchingTemplates}{search && t.workshopCreate.tryClearSearch}{activeTags.size > 0 && t.workshopCreate.tryClearFilter}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-[280px] overflow-y-auto custom-scrollbar -mx-1 px-1 pb-1">
          {visibleTemplates.map((template) => {
            const isSelected = selectedId === template.id;
            const personal = isPersonal(template);
            return (
              <div key={template.id} className="flex flex-col">
                <button
                  onClick={() => onSelect(isSelected ? null : (template as StoryTemplate))}
                  className={`overflow-hidden border text-left transition-colors relative ${
                    isSelected
                      ? 'border-[var(--cinema-amber)] bg-[var(--cinema-amber-glow)]'
                      : 'border-[var(--cinema-border)] bg-[var(--cinema-surface)] hover:border-[var(--cinema-amber-deep)]'
                  }`}
                  style={{ borderRadius: 4 }}
                >
                  {personal && (
                    <span className="absolute top-1 right-1 cinema-mono text-[8px] tracking-widest bg-[var(--cinema-amber)] text-black px-1 rounded">
                      MY
                    </span>
                  )}
                  {/* v8.3 P6: AI motif icon overlays the emoji; custom templates with no art fall back via onError */}
                  <div className="relative h-[60px] flex items-center justify-center text-2xl border-b border-[var(--cinema-border)] overflow-hidden bg-[#0A0A0B]">
                    <span aria-hidden>{template.icon}</span>
                    <img
                      src={`/template-icons/${template.id}.jpg`}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="px-1.5 py-1 text-center">
                    <div className="cinema-headline text-[11px] truncate">{displayName(template)}</div>
                    <div className="cinema-mono text-[8px] opacity-50 truncate mt-0.5">{displayNameSecondary(template)}</div>
                  </div>
                </button>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="cinema-eyebrow hover:text-[var(--cinema-amber)] transition-colors flex items-center gap-0.5"
                    title={t.workshopCreate.expandDetails}
                  >
                    {expandedId === template.id ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    {t.workshopCreate.details}
                  </button>
                  <Popover open={cloneOpenForId === template.id} onOpenChange={(o) => {
                    setCloneOpenForId(o ? template.id : null);
                    if (o) setCloneName(t.workshopCreate.cloneNameSuffix.replace('{name}', template.name));
                  }}>
                    <PopoverTrigger asChild>
                      <button
                        className="cinema-eyebrow hover:text-[var(--cinema-amber)] transition-colors flex items-center gap-0.5"
                        title={t.workshopCreate.cloneAsMine}
                      >
                        <Copy className="w-2.5 h-2.5" />
                        {t.workshopCreate.clone}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-64 space-y-2">
                      <div className="cinema-mono text-[10px] tracking-widest opacity-60">CLONE TEMPLATE</div>
                      <input
                        autoFocus
                        type="text"
                        value={cloneName}
                        onChange={(e) => setCloneName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleClone(template); }}
                        maxLength={40}
                        className="w-full px-2 py-1.5 bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded text-sm focus:outline-none focus:border-[var(--cinema-amber)]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCloneOpenForId(null)}
                          className="cinema-btn !px-3 !py-1 !text-[11px] flex-1"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          onClick={() => handleClone(template)}
                          disabled={!cloneName.trim() || savingClone}
                          className="cinema-btn cinema-btn-primary !px-3 !py-1 !text-[11px] flex-1 disabled:opacity-40"
                        >
                          {savingClone ? t.common.saving : t.workshopCreate.saveToMyLibrary}
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {personal && (
                    <>
                      {/* v2.19 P0.3: share → popover to pick expiry */}
                      <Popover>
                        <PopoverTrigger
                          disabled={sharingId === template.id}
                          className="cinema-eyebrow hover:text-[var(--cinema-amber)] transition-colors flex items-center gap-0.5 disabled:opacity-50"
                          title={t.workshopCreate.shareHint}
                        >
                          {copiedToken ? (
                            <Check className="w-2.5 h-2.5 text-[var(--cinema-green)]" />
                          ) : (
                            <Share2 className="w-2.5 h-2.5" />
                          )}
                          {t.common.share}
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2">
                          <div className="cinema-mono text-[10px] opacity-60 mb-2">
                            {t.workshopCreate.linkExpiry}
                          </div>
                          <div className="flex flex-col gap-1">
                            {[
                              { label: t.workshopCreate.expiry1Day, days: 1 },
                              { label: t.workshopCreate.expiry7Days, days: 7 },
                              { label: t.workshopCreate.expiry30Days, days: 30 },
                              { label: t.workshopCreate.expiryForever, days: null as number | null },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => handleSharePersonal(template as PersonalTemplate, opt.days)}
                                disabled={sharingId === template.id}
                                className="cinema-btn !text-[11px] !py-1 hover:cinema-btn-primary text-left disabled:opacity-50"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <p className="cinema-mono text-[9px] opacity-50 mt-2 leading-relaxed">
                            {t.workshopCreate.expiryNote}
                          </p>
                        </PopoverContent>
                      </Popover>
                      {/* v2.19 P0.4: export JSON */}
                      <button
                        onClick={() => handleExportTemplate(template)}
                        className="cinema-eyebrow hover:text-[var(--cinema-amber)] transition-colors flex items-center gap-0.5"
                        title={t.workshopCreate.exportJsonHint}
                      >
                        <Download className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePersonal(template as PersonalTemplate)}
                        className="cinema-eyebrow hover:text-[var(--cinema-red)] transition-colors flex items-center gap-0.5"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded detail */}
      {expandedTemplate && (
        <div className="cinema-card-hi mt-2 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{expandedTemplate.icon}</span>
            <span className="cinema-headline text-sm">{displayName(expandedTemplate)}</span>
            <span className="cinema-mono text-[10px] opacity-60">· {displayNameSecondary(expandedTemplate)}</span>
            {isPersonal(expandedTemplate) && (
              <span className="cinema-mono text-[9px] tracking-widest bg-[var(--cinema-amber)] text-black px-1 rounded">
                <User className="w-2.5 h-2.5 inline mr-0.5" />
                PERSONAL
              </span>
            )}
          </div>
          <p className="cinema-subhead text-[11px] leading-relaxed opacity-85">{expandedTemplate.structureHint}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(expandedTemplate.keyElements || []).map((el) => (
              <span key={el} className="cinema-chip cinema-chip-amber">{el}</span>
            ))}
          </div>
          <div className="cinema-mono text-[10px] opacity-60">EMOTION CURVE · {expandedTemplate.emotionCurve}</div>
          {expandedTemplate.tags && expandedTemplate.tags.length > 0 && (
            <div className="cinema-mono text-[10px] opacity-60">
              TAGS · {expandedTemplate.tags.join(' · ')}
            </div>
          )}
        </div>
      )}

      {loadingPersonal && (
        <div className="cinema-mono text-[10px] opacity-40 mt-1">{t.workshopCreate.loadingPersonal}</div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentWorkspace } from '@/components/AgentWorkspace';
import { ConsistencyPanel } from '@/components/ConsistencyPanel';
import { CameoScoreBadge, type CameoScoreBadgeData } from '@/components/CameoScoreBadge';
import { useAgentStore } from '@/lib/store';
import { Sparkle as Sparkles, ArrowLeft, MagicWand as Wand2, Lightning as Zap, Lightbulb, CheckCircle as CheckCircle2, UserCircle as UserCircle2, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateIdea, sanitizeInput } from '@/lib/validation';
import { useToast } from '@/components/ui/toast-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useLocale } from '@/hooks/use-locale';
import { PromptEditor } from '@/components/prompt-editor';
import { MultimodalRefShelf } from '@/components/multimodal-ref-shelf';
import type { ReferenceAsset } from '@/lib/multimodal-ref';
import { PromptReadiness } from '@/components/prompt-readiness';

export default function CreatePage() {
  const [idea, setIdea] = useState('');
  const [videoProvider, setVideoProvider] = useState('minimax');
  // v12.0.4 one-line edit-style instruction — '' (default mid-tempo) / preset / free text
  const [editStyle, setEditStyle] = useState('');
  // v6.1.2: multimodal refs (image/audio/video), submitted with the create request
  const [references, setReferences] = useState<ReferenceAsset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  // v2.9 P0 Cameo: optional lead-face ref (sent as dataURI)
  const [cameoFile, setCameoFile] = useState<File | null>(null);
  const [cameoPreview, setCameoPreview] = useState<string>('');
  // v2.11 #2: try-on score (vision LLM) — immediate "can this face lock?" feedback
  const [cameoScoreLoading, setCameoScoreLoading] = useState(false);
  const [cameoScoreError, setCameoScoreError] = useState<string | null>(null);
  const [cameoScoreData, setCameoScoreData] = useState<CameoScoreBadgeData | null>(null);
  const { agents, setAgents } = useAgentStore();
  // v2.11 #1: continuity tracking
  const addConsistencyEvent = useAgentStore((s) => s.addConsistencyEvent);
  const setTotalShots = useAgentStore((s) => s.setTotalShots);
  const resetConsistency = useAgentStore((s) => s.resetConsistency);
  const router = useRouter();
  const { showToast } = useToast();
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;

  const handleCameoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ title: ui.imagesOnly, type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: ui.imageTooLargeMb.replace('{n}', '10'), type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setCameoFile(file);
      setCameoPreview(dataUri);
      // v2.11 #2: score before submit so the user sees fit before hitting Start
      runCameoPreviewScore(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const clearCameo = () => {
    setCameoFile(null);
    setCameoPreview('');
    setCameoScoreData(null);
    setCameoScoreError(null);
    setCameoScoreLoading(false);
  };

  /** v2.11 #2: score from a dataURI — no disk write, does not block the main flow */
  const runCameoPreviewScore = async (imageUrl: string) => {
    setCameoScoreLoading(true);
    setCameoScoreError(null);
    setCameoScoreData(null);
    try {
      const res = await fetch('/api/cameo/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.status === 503) {
        setCameoScoreError(ui.visionDisabled);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCameoScoreError(body.error || `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setCameoScoreData(data);
      if (data.verdict === 'poor') {
        showToast({
          title: ui.cameoScoreLow.replace('{n}', String(data.score)),
          type: 'warning',
        });
      }
    } catch (e) {
      setCameoScoreError(e instanceof Error ? e.message : ui.scoreFailed);
    } finally {
      setCameoScoreLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    const validation = validateIdea(idea);
    if (!validation.valid) {
      showToast({ title: validation.error || ui.invalidInput, type: 'error' });
      return;
    }

    // Sanitize
    const sanitizedIdea = sanitizeInput(idea);

    setIsCreating(true);
    setStatusMessage(ui.connectingTeam);
    resetConsistency();  // v2.11 #1: clear last-run continuity stats before a new run

    try {
      const response = await fetch('/api/create-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: sanitizedIdea,
          videoProvider,
          // v2.9 P0 Cameo: if the user uploaded a lead face, send it as a data URI
          // Backend persistAsset writes projects.primary_character_ref
          primaryCharacterRef: cameoPreview || undefined,
          // v6.1.2: multimodal refs (image/audio/video). Images can feed cref; audio/video stay forward-compatible.
          references: references.length ? references : undefined,
          // v12.0.4: one-line edit style (empty → default mid-tempo)
          editStyle: editStyle.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(ui.createFailed);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error(ui.streamUnreadable);
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'agents':
                  setAgents(data.data);
                  break;
                case 'status':
                  setStatusMessage(data.data.message);
                  break;
                // v2.11 #1: continuity event
                case 'consistencyStatus':
                  addConsistencyEvent({
                    shotNumber: data.data.shotNumber,
                    type: data.data.type,
                    fromShot: data.data.fromShot,
                    at: Date.now(),
                  });
                  break;
                case 'runMeta':
                  if (typeof data.data?.totalShots === 'number') {
                    setTotalShots(data.data.totalShots);
                  }
                  break;
                case 'complete':
                  setResult(data.data);
                  setStatusMessage(ui.createDone);
                  setTimeout(() => {
                    // Optional: navigate to the result page
                    // router.push('/projects/new');
                  }, 2000);
                  break;
                case 'error':
                  throw new Error(data.data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Create error:', error);
      setStatusMessage(ui.createRetry);
      alert(error instanceof Error ? error.message : ui.createRetry);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E8C547] to-[#D4A830] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">{t.brand.studio}</span>
            </Link>

            <div className="flex items-center gap-4">
              <LocaleSwitcher compact />
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t.common.backHome}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        {!isCreating && !result ? (
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Title */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8C547]/10 border border-[#E8C547]/20 rounded-full text-sm">
                  <Wand2 className="w-4 h-4 text-[#E8C547]" />
                  <span className="text-[#D4A830]">{t.create.badge}</span>
                </div>

                <h1 className="text-5xl font-bold">
                  <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {t.create.title}
                  </span>
                </h1>

                <p className="text-gray-400 text-lg">
                  {t.create.subtitle}
                </p>
              </div>

              {/* Create form */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div className="space-y-6">
                  {/* Idea input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      {t.create.ideaLabel}
                    </label>
                    {/* v6.1.1: smart prompt editor (@ asset complete + compile preview) */}
                    <PromptEditor
                      value={idea}
                      onChange={setIdea}
                      placeholder={ui.ideaPlaceholderLong}
                      rows={12}
                      className="w-full min-h-[200px] bg-black/50 border border-white/10 rounded-2xl p-6 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E8C547]/50 focus:border-[#E8C547]/50 transition-all resize-y"
                    />
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className={`${idea.length > 500 ? 'text-[#E8C547]' : 'text-gray-500'}`}>
                        {ui.charCount.replace('{n}', String(idea.length))} {idea.length > 500 ? ui.scriptMode : ''}
                      </span>
                      <span className="text-gray-500">
                        {ui.ideaHint}
                      </span>
                    </div>
                  </div>

                  {/* v2.9 P0 Cameo: optional lead-face upload */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-[#E8C547]" />
                        {ui.cameoFaceLabel}
                        <span className="px-2 py-0.5 bg-[#E8C547]/10 text-[#E8C547] text-xs rounded-full">{ui.cameoLockBadge}</span>
                      </label>
                      <span className="text-xs text-gray-500">{ui.cameoLockHint}</span>
                    </div>
                    {!cameoPreview ? (
                      <label className="block border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-[#E8C547]/50 hover:bg-white/5 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCameoSelect}
                          className="hidden"
                        />
                        <UserCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                        <div className="text-sm text-gray-400">
                          {ui.cameoUploadHint}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ui.cameoUploadSub}
                        </div>
                      </label>
                    ) : (
                      <div>
                        <div className="relative inline-flex items-center gap-4 bg-white/5 border border-[#E8C547]/30 rounded-xl p-4 w-full">
                          <img loading="lazy" decoding="async" 
                            src={cameoPreview}
                            alt={ui.cameoPreviewAlt}
                            className="w-20 h-20 rounded-lg object-cover border border-white/10" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#E8C547]">{ui.cameoLocked}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {cameoFile?.name} · {cameoFile ? (cameoFile.size / 1024).toFixed(0) : 0} KB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearCameo}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label={ui.cameoClearAria}
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        {/* v2.11 #2: Cameo try-on score — visible before Start */}
                        <CameoScoreBadge
                          loading={cameoScoreLoading}
                          error={cameoScoreError}
                          data={cameoScoreData}
                        />
                      </div>
                    )}
                  </div>

                  {/* v6.1.2: multimodal refs (image/audio/video) */}
                  <MultimodalRefShelf refs={references} onChange={setReferences} />

                  {/* Video engine */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      {t.create.videoProviderLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setVideoProvider('minimax')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          videoProvider === 'minimax'
                            ? 'border-[#E8C547] bg-[#E8C547]/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-center">
                          <Zap className={`w-6 h-6 mx-auto mb-2 ${
                            videoProvider === 'minimax' ? 'text-[#E8C547]' : 'text-gray-400'
                          }`} />
                          <div className="font-semibold mb-1">Minimax</div>
                          <div className="text-xs text-gray-400">{ui.engineFast}</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVideoProvider('vidu')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          videoProvider === 'vidu'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-center">
                          <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
                            videoProvider === 'vidu' ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                          <div className="font-semibold mb-1">Vidu</div>
                          <div className="text-xs text-gray-400">{ui.engineQuality}</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVideoProvider('keling')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          videoProvider === 'keling'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-center">
                          <Lightbulb className={`w-6 h-6 mx-auto mb-2 ${
                            videoProvider === 'keling' ? 'text-orange-400' : 'text-gray-400'
                          }`} />
                          <div className="font-semibold mb-1">{ui.klingAi}</div>
                          <div className="text-xs text-gray-400">{ui.engineChinese}</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* v12.0.4: one-line edit style (fast / lyrical / free text) → smart edit pipeline */}
                  <div data-testid="edit-style-picker">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {ui.editStyleLabel} <span className="text-xs text-gray-500">{ui.editStyleHint}</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { v: '', label: ui.editStyleDefault },
                        { v: ui.editStyleFastVal, label: ui.editStyleFast },
                        { v: ui.editStyleSlowVal, label: ui.editStyleSlow },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setEditStyle(p.v)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            editStyle === p.v
                              ? 'border-[#E8C547] bg-[#E8C547]/10 text-[#E8C547]'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value)}
                      placeholder={ui.editStyleCustomPh}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E8C547]/40 focus:border-[#E8C547]/40 transition-all"
                    />
                  </div>

                  {/* v6.1.3: pre-generate readiness preview (live) */}
                  <PromptReadiness
                    idea={idea}
                    hasFace={!!cameoPreview}
                    cameoScore={cameoScoreData?.score ?? null}
                    refs={references}
                  />

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!idea.trim()}
                    className="w-full h-14 bg-gradient-to-r from-[#E8C547] to-[#D4A830] rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-[#E8C547]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-5 h-5" />
                    {t.create.startButton}
                  </button>
                </div>
              </div>

              {/* Example ideas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>{ui.tryIdeas}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {EXAMPLE_IDEA_KEYS.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setIdea(ui[example.contentKey])}
                      className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#E8C547]/50 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E8C547]/15 to-[#D4A830]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                          <example.icon className="w-5 h-5 text-[#E8C547]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1 group-hover:text-[#E8C547] transition-colors">
                            {ui[example.titleKey]}
                          </div>
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {ui[example.contentKey]}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : result ? (
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <div>
                <h2 className="text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {ui.createDoneTitle}
                  </span>
                </h2>
                <p className="text-xl text-gray-400">
                  {ui.createDoneDesc}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/projects/1"
                  className="px-8 py-4 bg-gradient-to-r from-[#E8C547] to-[#D4A830] rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-[#E8C547]/40 transition-all"
                >
                  {t.home.heroCtaCases}
                </Link>
                <Link
                  href="/create"
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  {ui.createNewWork}
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8 text-center space-y-4">
              <h2 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {ui.teamCreating}
                </span>
              </h2>
              <p className="text-gray-400">
                {statusMessage}
              </p>
            </div>

            {/* v2.11 #1: continuity panel — live "faces locked + shot lines joined" */}
            <div className="mb-6 max-w-md mx-auto">
              <ConsistencyPanel />
            </div>

            <AgentWorkspace agents={agents} />
          </div>
        )}
      </main>
    </div>
  );
}

const EXAMPLE_IDEA_KEYS = [
  { titleKey: 'ideaCyberTitle', contentKey: 'ideaCyberContent', icon: Zap },
  { titleKey: 'ideaPalaceTitle', contentKey: 'ideaPalaceContent', icon: Sparkles },
  { titleKey: 'ideaWastelandTitle', contentKey: 'ideaWastelandContent', icon: Wand2 },
  { titleKey: 'ideaMagicTitle', contentKey: 'ideaMagicContent', icon: Lightbulb },
] as const;

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AgentChat } from '@/components/agent-chat';
import { PipelineCanvas, buildInitialNodes, initialEdges } from '@/components/pipeline-canvas';
import { Mascot } from '@/components/mascot';
import { useProjectWorkspaceStore } from '@/lib/store';
import { type Project } from '@/types/agents';
import { ArrowLineLeft as PanelLeftClose, ArrowLineRight as PanelLeftOpen, DotsThree as MoreHorizontal, Play, FilmStrip as Film, CaretDown as ChevronDown, CaretUp as ChevronUp, Download } from '@phosphor-icons/react';
import { VideoModal } from '@/components/ui/video-modal';
import { OverallProgressBar } from '@/components/ui/overall-progress';
import { WorkspaceHotkeys } from '@/components/workspace-hotkeys';
import { InviteProjectButton } from '@/components/project/invite-project-button';
import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  project: Project;
}

export function CreationWorkspace({ project }: Props) {
  const { t } = useLocale();
  // Collapse chat on mobile by default
  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [selectedVideoSrc, setSelectedVideoSrc] = useState('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { setCurrentProject, setNodes, setEdges, assets, isProducing } = useProjectWorkspaceStore();
  const { user } = useAuth();   // v12.302: share button checks project owner

  useEffect(() => {
    setCurrentProject(project);
    const nodes = buildInitialNodes(assets, {
      director: t.product.director,
      writer: t.product.writer,
      characterDesign: t.product.characterDesign,
      sceneDesign: t.product.sceneDesign,
      storyboard: t.product.storyboard,
      videoGen: t.product.videoGen,
      editor: t.product.editor,
      producer: t.product.producer,
    });
    setNodes(nodes);
    setEdges(initialEdges);
  }, [project.id, t]);

  const mascotMood = isProducing ? 'working' : 'completed';

  // Timeline shot data
  const timelineShots = useMemo(() => {
    const videoAssets = assets.filter(a => a.type === 'video' && a.mediaUrls?.[0]);
    const storyboardAssets = assets.filter(a => a.type === 'storyboard');
    return videoAssets.map(v => {
      const sb = storyboardAssets.find(s => s.shotNumber === v.shotNumber);
      return {
        shotNumber: v.shotNumber || 0,
        videoUrl: v.mediaUrls?.[0] || '',
        description: sb?.data?.description || v.name || t.product.shotN.replace('{n}', String(v.shotNumber)),
        duration: v.data?.duration || 8,
        status: v.data?.status || 'pending',
        cameraAngle: sb?.data?.planData?.cameraAngle || '',
      };
    }).sort((a, b) => a.shotNumber - b.shotNumber);
  }, [assets]);

  const handleShotPlay = (videoUrl: string, shotNumber: number) => {
    if (videoUrl && !videoUrl.startsWith('data:')) {
      setSelectedVideoSrc(videoUrl);
      setSelectedVideoTitle(t.product.shotN.replace('{n}', String(shotNumber)));
      setVideoModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <WorkspaceHotkeys />
      {/* Top toolbar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] bg-[#0A0A0B]/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
            title={chatOpen ? t.product.collapseChat : t.product.expandChat}
          >
            {chatOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div>
            <h1 className="text-sm font-medium text-white/90 tracking-tight">{project.title || t.product.untitled}</h1>
            <div className="text-[10px] text-white/25 font-medium tracking-wider uppercase">{t.product.creating}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Mascot mood={mascotMood} />
          {/*
            v12.302: this used to be a dead button with no onClick — hover highlight,
            tap did nothing, so share looked broken. InviteProjectButton already exists
            (invite token, link, collaborator roles) on the project page; wire it here
            instead of building a second share path.
          */}
          <InviteProjectButton
            projectId={project.id}
            isOwner={!!user && project.userId === user.id}
          />
          <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/60">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall progress — stage + total, instead of per-node bars */}
      <OverallProgressBar />

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {chatOpen && (
          <div className="w-full md:w-[340px] shrink-0 border-r border-white/[0.04] overflow-hidden bg-[#0C0C0C]/50 absolute md:relative inset-y-0 left-0 z-30 md:z-0">
            <AgentChat />
          </div>
        )}
        <div className="flex-1 relative flex flex-col">
          <div className="flex-1">
            <ReactFlowProvider>
              <PipelineCanvas />
            </ReactFlowProvider>
          </div>

          {/* Timeline panel */}
          {timelineShots.length > 0 && (
            <div className={`shrink-0 border-t border-white/[0.04] bg-[#0C0C0C]/95 backdrop-blur-xl transition-all duration-300 ${timelineOpen ? 'max-h-[130px]' : 'max-h-[34px]'} overflow-hidden`}>
              {/* Timeline header */}
              <button
                onClick={() => setTimelineOpen(!timelineOpen)}
                className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] text-white/40 hover:text-white/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Film className="w-3 h-3 text-[#E8C547]/60" />
                  <span className="font-medium">{t.product.timeline}</span>
                  <span className="text-[10px] text-white/20">
                    {timelineShots.length} {t.product.shotsUnit} · {timelineShots.reduce((s, sh) => s + sh.duration, 0)}s
                  </span>
                </div>
                {timelineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              {/* Timeline strip */}
              {timelineOpen && (
                <div className="px-4 pb-2.5 overflow-x-auto custom-scrollbar">
                  <div className="flex gap-1.5 min-w-min">
                    {timelineShots.map((shot, i) => {
                      const isVideoReady = shot.videoUrl && !shot.videoUrl.startsWith('data:');
                      return (
                        <div
                          key={shot.shotNumber}
                          className={`shrink-0 w-[130px] rounded-lg overflow-hidden border transition-all cursor-pointer group
                            ${isVideoReady
                              ? 'border-white/[0.06] hover:border-white/15 hover:shadow-lg'
                              : 'border-white/[0.03] opacity-40'}`}
                          onClick={() => isVideoReady && handleShotPlay(shot.videoUrl, shot.shotNumber)}
                        >
                          <div className="flex items-center justify-between px-2 py-1 bg-white/[0.02]">
                            <span className="text-[9px] font-bold text-[#E8C547]/70">S{shot.shotNumber}</span>
                            <span className="text-[8px] text-white/20">{shot.duration}s</span>
                          </div>
                          <div className="h-[55px] bg-black/30 relative flex items-center justify-center">
                            {isVideoReady ? (
                              <>
                                <video src={shot.videoUrl} muted preload="metadata" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                  <Play className="w-4 h-4 text-white/80" />
                                </div>
                              </>
                            ) : (
                              <div className="text-[8px] text-white/20">
                                {isProducing ? t.product.generating : t.product.pending}
                              </div>
                            )}
                          </div>
                          <div className="px-2 py-1 bg-white/[0.015]">
                            <div className="text-[8px] text-white/30 truncate">{shot.description.slice(0, 18)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video playback modal */}
      <VideoModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        src={selectedVideoSrc}
        title={selectedVideoTitle}
      />
    </div>
  );
}

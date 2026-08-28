'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Agent, AgentRole } from '@/types/agents';
import { Sparkle as Sparkles, CheckCircle as CheckCircle2, WarningCircle as AlertCircle, CircleNotch as Loader2, Clock } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

interface AgentWorkspaceProps {
  agents: Agent[];
}

export function AgentWorkspace({ agents }: AgentWorkspaceProps) {
  const reduce = useReducedMotion();
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all backdrop-blur-xl"
          >
            {/* Ambient hover glow */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
              agent.status === 'working' ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5' :
              agent.status === 'thinking' ? 'bg-gradient-to-r from-yellow-500/5 to-amber-500/5' :
              agent.status === 'completed' ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5' :
              ''
            }`} />

            <div className="relative flex items-start gap-6">
              {/* Agent avatar */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-white/10">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="text-white text-2xl bg-gradient-to-br from-[#E8C547]/15 to-[#D4A830]/15">
                      {agent.name[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status indicator */}
                  <motion.div
                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-black flex items-center justify-center ${
                      agent.status === 'working' ? 'bg-green-500' :
                      agent.status === 'thinking' ? 'bg-yellow-500' :
                      agent.status === 'completed' ? 'bg-blue-500' :
                      agent.status === 'error' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                    animate={!reduce && (agent.status === 'working' || agent.status === 'thinking') ? {
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(34, 197, 94, 0.7)',
                        '0 0 0 10px rgba(34, 197, 94, 0)',
                        '0 0 0 0 rgba(34, 197, 94, 0)'
                      ]
                    } : {}}
                    transition={reduce ? { duration: 0 } : { repeat: Infinity, duration: 2 }}
                  >
                    {agent.status === 'working' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                    {agent.status === 'thinking' && <Sparkles className="w-4 h-4 text-white" />}
                    {agent.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {agent.status === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
                    {agent.status === 'idle' && <Clock className="w-4 h-4 text-white" />}
                  </motion.div>
                </div>
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {getRoleName(agent.role, t)}
                    </p>
                  </div>

                  <StatusBadge status={agent.status} />
                </div>

                {/* Current task */}
                {agent.currentTask && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-black/30 border border-white/5 rounded-xl"
                  >
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                      <span>{agent.currentTask}</span>
                    </p>
                  </motion.div>
                )}

                {/* Progress */}
                {agent.status !== 'idle' && agent.status !== 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t.sharedUi.progress}</span>
                      <span className="text-white font-medium">{agent.progress}%</span>
                    </div>
                    <Progress value={agent.progress} className="h-2" />
                  </div>
                )}

                {/* Error */}
                {agent.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-300 mb-1">{t.sharedUi.somethingWentWrong}</p>
                        <p className="text-sm text-red-200/80">{agent.error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Agent['status'] }) {
  const { t } = useLocale();
  const statusConfig = {
    idle: { label: t.sharedUi.statusIdle, className: 'bg-gray-500/20 text-gray-300' },
    thinking: { label: t.sharedUi.statusThinking, className: 'bg-yellow-500/20 text-yellow-300' },
    working: { label: t.sharedUi.statusWorking, className: 'bg-green-500/20 text-green-300' },
    completed: { label: t.dashProjects.statusCompleted, className: 'bg-blue-500/20 text-blue-300' },
    error: { label: t.sharedUi.somethingWentWrong, className: 'bg-red-500/20 text-red-300' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function getRoleName(role: AgentRole, t: Translations): string {
  const roleNames: Record<string, string> = {
    [AgentRole.DIRECTOR]: t.sharedUi.aiDirector,
    [AgentRole.WRITER]: t.sharedUi.aiWriter,
    [AgentRole.CHARACTER_DESIGNER]: t.sharedUi.aiCharacterDesigner,
    [AgentRole.SCENE_DESIGNER]: t.sharedUi.aiSceneDesigner,
    [AgentRole.STORYBOARD]: t.sharedUi.aiStoryboard,
    [AgentRole.VIDEO_PRODUCER]: t.sharedUi.aiVideoProducer,
    [AgentRole.EDITOR]: t.sharedUi.aiEditor,
    [AgentRole.PRODUCER]: t.sharedUi.aiProducer,
  };

  return roleNames[role] || t.sharedUi.unknownRole;
}

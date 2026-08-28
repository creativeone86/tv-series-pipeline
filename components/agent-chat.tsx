'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentRole, type ChatMessage } from '@/types/agents';
import { useProjectWorkspaceStore } from '@/lib/store';
import { AgentAvatar } from '@/components/mascot';
import { PaperPlaneTilt as Send, CaretDown as ChevronDown, CaretUp as ChevronUp, CircleNotch as Loader2, FileText, Users, Mountains as Mountain, FilmStrip as Film, Video, Eye, Scissors, ImageIcon, Paperclip, FilmSlate as Clapperboard, Megaphone } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

function agentConfig(t: Translations): Record<string, { label: string; icon: any; color: string; desc: string; avatar: string }> {
  return {
    [AgentRole.WRITER]: { label: t.product.writer, icon: FileText, color: 'text-[#E8C547]', desc: t.sharedUi.agentWriterDesc, avatar: '/avatars/beaver-happy.jpg' },
    [AgentRole.CHARACTER_DESIGNER]: { label: t.product.characterDesign, icon: Users, color: 'text-amber-400', desc: t.sharedUi.agentCharDesc, avatar: '/avatars/beaver-happy.jpg' },
    [AgentRole.SCENE_DESIGNER]: { label: t.product.sceneDesign, icon: Mountain, color: 'text-emerald-400', desc: t.sharedUi.agentSceneDesc, avatar: '/avatars/frog-3d.jpg' },
    [AgentRole.STORYBOARD]: { label: t.product.storyboard, icon: Film, color: 'text-[#4A7EBB]', desc: t.sharedUi.agentBoardDesc, avatar: '/avatars/beaver-crown.jpg' },
    [AgentRole.VIDEO_PRODUCER]: { label: t.product.videoGen, icon: Video, color: 'text-[#C8432A]', desc: t.sharedUi.agentVideoDesc, avatar: '/avatars/frog-cartoon.jpg' },
    [AgentRole.DIRECTOR]: { label: t.product.director, icon: Megaphone, color: 'text-[#E8C547]', desc: t.sharedUi.agentDirectorDesc, avatar: '/avatars/beaver-crown.jpg' },
    [AgentRole.EDITOR]: { label: t.product.editor, icon: Scissors, color: 'text-[#4A7EBB]', desc: t.sharedUi.agentEditorDesc, avatar: '/avatars/beaver-sleepy.jpg' },
    [AgentRole.PRODUCER]: { label: t.product.producer, icon: Clapperboard, color: 'text-orange-400', desc: t.sharedUi.agentProducerDesc, avatar: '/avatars/frog-cartoon.jpg' },
  };
}

export function AgentChat() {
  const { t } = useLocale();
  const AGENT_CONFIG = agentConfig(t);
  const {
    chatMessages, activeAgent, setActiveAgent, addChatMessage,
    currentProject, isProducing,
  } = useProjectWorkspaceStore();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = chatMessages[activeAgent] || [];
  const agentCfg = AGENT_CONFIG[activeAgent] || AGENT_CONFIG[AgentRole.WRITER];
  const AgentIcon = agentCfg.icon;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const projectId = currentProject?.id;
    if (!projectId) return;

    // Append the user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      projectId,
      agentRole: activeAgent,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    addChatMessage(activeAgent, userMsg);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentRole: activeAgent, message: text }),
      });

      if (!response.ok) throw new Error(t.sharedUi.requestFailed);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error(t.sharedUi.streamUnreadable);

      let assistantContent = '';
      let thinkingContent = '';
      const assistantMsgId = `msg-${Date.now()}-assistant`;

      // Seed an empty assistant message first
      addChatMessage(activeAgent, {
        id: assistantMsgId,
        projectId,
        agentRole: activeAgent,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'thinking') {
              thinkingContent += data.content || '';
            } else if (data.type === 'content') {
              assistantContent += data.content || '';
            } else if (data.type === 'action') {
              // Agent ran an action (e.g. regen storyboard)
              // Other store listeners handle it
            }
          } catch { /* skip malformed */ }
        }

        // Update the assistant message (replace the last one)
        const currentMsgs = useProjectWorkspaceStore.getState().chatMessages[activeAgent] || [];
        const updated = currentMsgs.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: assistantContent, thinking: thinkingContent || undefined }
            : m
        );
        useProjectWorkspaceStore.getState().setChatMessages(activeAgent, updated);
      }
    } catch (error) {
      addChatMessage(activeAgent, {
        id: `msg-${Date.now()}-error`,
        projectId,
        agentRole: activeAgent,
        role: 'assistant',
        content: `${t.sharedUi.somethingWentWrong}: ${error instanceof Error ? error.message : t.errors.unknown}`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeAgent, currentProject, addChatMessage, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C]/90 backdrop-blur-xl">
      {/* Header: agent picker */}
      <div className="shrink-0 border-b border-white/[0.04]">
        <button
          onClick={() => setShowAgentPicker(!showAgentPicker)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
        >
          <AgentAvatar role={activeAgent} size={32} />
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-white">{agentCfg.label}</div>
            <div className="text-[10px] text-gray-500">{agentCfg.desc}</div>
          </div>
          {showAgentPicker ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Agent picker dropdown */}
        <AnimatePresence>
          {showAgentPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.04]"
            >
              <div className="p-2 grid grid-cols-2 gap-1">
                {Object.entries(AGENT_CONFIG).map(([role, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = role === activeAgent;
                  return (
                    <button
                      key={role}
                      onClick={() => { setActiveAgent(role as AgentRole); setShowAgentPicker(false); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                        isActive ? 'bg-white/[0.07] border border-white/[0.08]' : 'hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className="text-xs text-white">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-xs">
            {t.sharedUi.startChatWith.replace('{name}', agentCfg.label)}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} agentConfig={agentCfg} />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t.sharedUi.agentThinking.replace('{name}', agentCfg.label)}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.04] p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.sharedUi.typeMessage}
              rows={2}
              className="w-full bg-transparent px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 resize-none outline-none"
            />
            <div className="flex items-center gap-1 px-2 pb-1.5">
              <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" title={t.sharedUi.uploadImage}>
                <ImageIcon className="w-3.5 h-3.5 text-white/20" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" title={t.sharedUi.attachment}>
                <Paperclip className="w-3.5 h-3.5 text-white/20" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-lg bg-[#E8C547] text-[#0C0C0C] disabled:opacity-20 hover:bg-[#F0CE55] transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, agentConfig }: { message: ChatMessage; agentConfig: { label: string; icon: any; color: string } }) {
  const { t, locale } = useLocale();
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === 'user';
  const AgentIcon = agentConfig.icon;

  const timestamp = new Date(message.createdAt).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className={`w-7 h-7 rounded-lg bg-white/5 grid place-items-center shrink-0 ${agentConfig.color}`}>
          <AgentIcon className="w-3.5 h-3.5" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
        {/* Agent name */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[11px] font-medium ${agentConfig.color}`}>{agentConfig.label}</span>
            <span className="text-[10px] text-gray-500">{timestamp}</span>
          </div>
        )}

        {/* Content */}
        <div className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[#E8C547]/08 border border-[#E8C547]/12 text-[var(--text)]'
            : 'bg-white/[0.03] border border-white/[0.04] text-white/75'
        }`}>
          {message.content || <span className="text-gray-500">...</span>}
          {isUser && <div className="text-[10px] text-gray-400 mt-1.5 opacity-60">{timestamp}</div>}
        </div>

        {/* Thinking fold */}
        {!isUser && message.thinking && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
            >
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {t.sharedUi.showThinking}
            </button>
            <AnimatePresence>
              {showThinking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-2.5 bg-black/20 border border-white/5 rounded-xl text-[11px] text-gray-400 leading-relaxed">
                    {message.thinking}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

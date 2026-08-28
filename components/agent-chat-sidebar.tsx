'use client';

/**
 * ProjectChatSidebar — slide-out AI assistant on the project detail page.
 *
 * Why a separate component (instead of reusing components/agent-chat.tsx):
 *   AgentChat depends on useProjectWorkspaceStore currentProject / chatMessages
 *   for the CreationWorkspace canvas. On /projects/[id] the store usually has
 *   no current project, so reuse would force a store change or empty fallback.
 *   A slim projectId-only copy is cleaner.
 *
 * Shared:
 *   · SSE protocol of /api/projects/[id]/chat
 *   · agent role enum from @/types/agents
 *   · same dark / rounded visual language
 *
 * Shape:
 *   · right drawer, 380px, full height
 *   · agent switcher (default WRITER), message stream, input
 *   · close does not unmount — opacity / translate only, so context stays
 *
 * roadmap §3.2 "AI assistant sidebar" — chat existed; this wires the UI.
 */

import { useEffect, useRef, useState } from 'react';
import { AgentRole } from '@/types/agents';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { PaperPlaneTilt as Send, X, CircleNotch as Loader2, FileText, Users, Mountains as Mountain, FilmStrip as Film, Megaphone, Scissors, FilmSlate as Clapperboard, Sparkle as Sparkles, ChatCircle as MessageCircle, Trash as Trash2 } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';
import type { Translations } from '@/lib/i18n';

function sidebarAgents(t: Translations) {
  return [
    { role: AgentRole.WRITER,             label: t.product.writer,            icon: FileText,     color: 'text-[#E8C547]',  hint: t.sharedUi.hintWriter },
    { role: AgentRole.CHARACTER_DESIGNER, label: t.product.characterDesign,    icon: Users,        color: 'text-amber-300',  hint: t.sharedUi.hintChar },
    { role: AgentRole.SCENE_DESIGNER,     label: t.product.sceneDesign,        icon: Mountain,     color: 'text-emerald-300', hint: t.sharedUi.hintScene },
    { role: AgentRole.STORYBOARD,         label: t.product.storyboard,         icon: Film,         color: 'text-sky-300',     hint: t.sharedUi.hintBoard },
    { role: AgentRole.DIRECTOR,           label: t.product.director,           icon: Megaphone,    color: 'text-[#E8C547]',  hint: t.sharedUi.hintDirector },
    { role: AgentRole.EDITOR,             label: t.product.editor,             icon: Scissors,     color: 'text-blue-300',   hint: t.sharedUi.hintEditor },
    { role: AgentRole.PRODUCER,           label: t.product.producer,           icon: Clapperboard, color: 'text-orange-300', hint: t.sharedUi.hintProducer },
  ];
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export default function ProjectChatSidebar({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const AGENTS = sidebarAgents(t);
  const [agentRole, setAgentRole] = useState<AgentRole>(AgentRole.WRITER);
  // Each agent keeps its own message list, keyed in a Record
  const [messagesMap, setMessagesMap] = useState<Record<string, Msg[]>>({});
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = messagesMap[agentRole] || [];
  const cfg = AGENTS.find((a) => a.role === agentRole) || AGENTS[0];
  const Icon = cfg.icon;

  // Auto-scroll to bottom — only on new messages or agent switch
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, agentRole]);

  // v10.3.6 a11y: Escape + focus trap + restore focus (replaces window Escape); only while open
  const dialogRef = useFocusTrap<HTMLElement>(open, onClose);

  const pushMsg = (role: AgentRole, msg: Msg) => {
    setMessagesMap((prev) => ({
      ...prev,
      [role]: [...(prev[role] || []), msg],
    }));
  };

  const updateLastAssistant = (role: AgentRole, content: string) => {
    setMessagesMap((prev) => {
      const arr = [...(prev[role] || [])];
      const lastIdx = arr.findLastIndex?.((m) => m.role === 'assistant')
        ?? arr.map((m) => m.role).lastIndexOf('assistant');
      if (lastIdx < 0) return prev;
      arr[lastIdx] = { ...arr[lastIdx], content };
      return { ...prev, [role]: arr };
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming || !projectId) return;

    const now = new Date().toISOString();
    pushMsg(agentRole, { id: `u-${Date.now()}`, role: 'user', content: text, at: now });
    setInput('');
    setStreaming(true);

    // Placeholder assistant message, updated as the stream arrives
    pushMsg(agentRole, { id: `a-${Date.now()}`, role: 'assistant', content: '', at: now });

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentRole, message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content' && typeof data.content === 'string') {
              acc += data.content;
              updateLastAssistant(agentRole, acc);
            }
            // thinking / action ignored for now; a thinking fold can be added later
          } catch { /* malformed line, skip */ }
        }
      }

      if (!acc) {
        updateLastAssistant(agentRole, t.sharedUi.noReply);
      }
    } catch (e: any) {
      updateLastAssistant(agentRole, `❌ ${t.sharedUi.somethingWentWrong}: ${e?.message || t.errors.unknown}`);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearCurrent = () => {
    if (messages.length === 0) return;
    if (typeof window !== 'undefined' && !window.confirm(t.sharedUi.clearChatConfirm.replace('{name}', cfg.label))) return;
    setMessagesMap((prev) => ({ ...prev, [agentRole]: [] }));
  };

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      {/* Drawer */}
      <aside
        ref={dialogRef}
        className={`fixed top-0 right-0 z-50 h-screen w-[380px] max-w-[100vw] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col transform transition-transform duration-200 outline-none ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t.sharedUi.aiAssistantSidebar}
        tabIndex={-1}
        // Closed = translated off-screen; inert drops it from tab order and the a11y tree
        inert={!open}
      >
        {/* header */}
        <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] bg-black/30 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet-300" />
          <div className="flex-1 leading-tight">
            <p className="text-sm font-semibold text-white">{t.sharedUi.aiAssistant}</p>
            <p className="text-[10px] text-white/40">{t.sharedUi.chatWithContext.replace('{name}', cfg.label)}</p>
          </div>
          <button
            onClick={handleClearCurrent}
            className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
            title={t.sharedUi.clearLocalView}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={t.product.close + ' (Esc)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agent switcher */}
        <div className="shrink-0 px-2 py-2 border-b border-[var(--border)] bg-black/20 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {AGENTS.map((a) => {
              const ActiveIcon = a.icon;
              const isActive = a.role === agentRole;
              return (
                <button
                  key={a.role}
                  onClick={() => setAgentRole(a.role)}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11.5px] transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-white/10 border-white/15 text-white'
                      : 'bg-transparent border-transparent text-white/55 hover:text-white/85 hover:bg-white/5'
                  }`}
                  title={a.hint}
                >
                  <ActiveIcon className={`w-3.5 h-3.5 ${a.color}`} />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Icon className={`w-10 h-10 ${cfg.color} opacity-40`} />
              <p className="text-[12px] text-white/55">{t.sharedUi.startChatWith.replace('{name}', cfg.label)}</p>
              <div className="text-[10.5px] text-white/35 leading-relaxed max-w-[260px]">
                {t.sharedUi.chatEmptyHint}
                <br />
                <span className="text-white/45 italic">{t.sharedUi.chatExample1}</span>
                <br />
                <span className="text-white/45 italic">{t.sharedUi.chatExample2}</span>
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} msg={m} agentColor={cfg.color} agentLabel={cfg.label} agentIcon={Icon} />)
          )}

          {streaming ? (
            <div className="flex items-center gap-2 text-[11px] text-white/45">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t.sharedUi.agentThinking.replace('{name}', cfg.label)}</span>
            </div>
          ) : null}
        </div>

        {/* input */}
        <div className="shrink-0 border-t border-[var(--border)] p-3 bg-black/20">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={t.sharedUi.enterToSend}
              className="flex-1 bg-black/30 border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-white/25 resize-none outline-none focus:border-violet-500/40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all shrink-0"
              title={t.collab.send}
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/30">
            {t.sharedUi.chatContextHint}
          </p>
        </div>
      </aside>
    </>
  );
}

/** Floating launcher on the project detail page (controlled visibility; rendered by default) */
export function ChatLauncherButton({
  open, onClick, hasUnread,
}: {
  open: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}) {
  const { t } = useLocale();
  if (open) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white shadow-xl shadow-violet-500/30 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
      title={t.sharedUi.openAssistantHotkey}
      aria-label={t.sharedUi.openAssistantChat}
    >
      <MessageCircle className="w-5 h-5" />
      {hasUnread ? (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[var(--surface)]" />
      ) : null}
    </button>
  );
}

function Bubble({
  msg, agentColor, agentLabel, agentIcon: AIcon,
}: {
  msg: Msg;
  agentColor: string;
  agentLabel: string;
  agentIcon: any;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? null : (
        <div className={`w-6 h-6 rounded-md bg-white/5 grid place-items-center shrink-0 ${agentColor}`}>
          <AIcon className="w-3 h-3" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
        {!isUser ? (
          <p className={`text-[10px] mb-0.5 ${agentColor}`}>{agentLabel}</p>
        ) : null}
        <div
          className={`rounded-xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-violet-500/15 border border-violet-500/25 text-violet-50'
              : 'bg-white/5 border border-white/8 text-white/80'
          }`}
        >
          {msg.content || <span className="text-white/30 italic">…</span>}
        </div>
      </div>
    </div>
  );
}

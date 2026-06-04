'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAIChat } from '@/context/AIChatContext';
import { canProvisionNewBusiness } from '@/lib/accountType';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Loader2,
  X,
  ArrowUpRight,
  MessageSquare,
  RefreshCw,
  Minus
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

const renderMarkdown = (text: string, isModel: boolean) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
    let content = trimmed;
    if (isBullet) {
      content = content.replace(/^[-*]\s+/, '');
    }

    // Process bold text
    const parts = content.split('**');
    const elements = parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return (
          <strong
            key={partIdx}
            className={cn(
              "font-extrabold",
              isModel ? "text-zinc-950 dark:text-white" : "text-white dark:text-zinc-900"
            )}
          >
            {part}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <li
          key={lineIdx}
          className={cn(
            "list-disc ml-4 my-1 text-xs",
            isModel ? "text-zinc-750 dark:text-zinc-300" : "text-white dark:text-zinc-900"
          )}
        >
          <span>{elements}</span>
        </li>
      );
    }

    return (
      <p
        key={lineIdx}
        className={cn(
          "my-1 leading-normal text-xs min-h-[0.75rem]",
          isModel ? "text-zinc-750 dark:text-zinc-300" : "text-white/95 dark:text-zinc-900"
        )}
      >
        {elements}
      </p>
    );
  });
};

const getScrollTargetForMessage = (content: string): { id: string; label: string } | null => {
  const lower = content.toLowerCase();
  
  if (lower.includes("scheduler") || lower.includes("hangfire") || lower.includes("cron") || lower.includes("recur") || lower.includes("background task") || lower.includes("compiler schedule")) {
    return { id: "scheduler-jobs", label: "compiler schedules" };
  }
  
  if (lower.includes("stock") || lower.includes("replenish") || lower.includes("product") || lower.includes("item") || lower.includes("best") || lower.includes("seller") || lower.includes("driver")) {
    return { id: "detailed-insights", label: "rankings & insights" };
  }
  
  if (lower.includes("peak") || lower.includes("hour") || lower.includes("time") || lower.includes("velocity") || lower.includes("trend") || lower.includes("afternoon")) {
    return { id: "telemetry-charts", label: "trend charts" };
  }
  
  if (lower.includes("revenue") || lower.includes("average") || lower.includes("ticket") || lower.includes("volume") || lower.includes("invoice") || lower.includes("performance ratio") || lower.includes("client") || lower.includes("customer")) {
    return { id: "kpi-cards", label: "revenue cards" };
  }
  
  return null;
};

export const AIChatFloating: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    chatMessages,
    chatLoading,
    isFloatingOpen,
    setIsFloatingOpen,
    sendChatMessage,
    resetChat
  } = useAIChat();

  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check if User is allowed to see the AI chat (Owner only)
  const isOwner = user && canProvisionNewBusiness(user.accountType);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, chatLoading, isFloatingOpen]);

  if (authLoading || !isOwner) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendChatMessage(msg);
  };

  const handlePresetClick = async (text: string) => {
    if (chatLoading) return;
    await sendChatMessage(text);
  };

  return (
    <>
      {/* Pulse button trigger */}
      <button
        onClick={() => setIsFloatingOpen(!isFloatingOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 group",
          isFloatingOpen
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rotate-90"
            : "bg-gradient-to-tr from-zinc-950 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        )}
        title="Active System Insights"
      >
        {isFloatingOpen ? (
          <X size={18} />
        ) : (
          <div className="relative">
            <Sparkles className="text-amber-500 animate-pulse" size={18} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Hover Label */}
        {!isFloatingOpen && (
          <span className="absolute right-14 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md border border-zinc-800">
            Active System Insights
          </span>
        )}
      </button>

      {/* Floating Chat Drawer */}
      {isFloatingOpen && (
        <div
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 h-[500px] max-h-[calc(100vh-120px)] z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-b border-zinc-200/50 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="text-amber-500" size={14} />
                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest block">Active System Insights</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase block tracking-wider">AI Analyst Online</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {chatMessages.length > 1 && (
                <button
                  onClick={resetChat}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
                  title="Clear conversation"
                >
                  <RefreshCw size={12} />
                </button>
              )}
              <button
                onClick={() => setIsFloatingOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 rounded transition-colors"
                title="Minimize"
              >
                <Minus size={14} />
              </button>
            </div>
          </div>

          {/* Messages Panel */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
          >
            {chatMessages.map((msg, index) => {
              const isModel = msg.role === 'model';
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm font-medium",
                    isModel
                      ? "bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-300 self-start rounded-tl-none"
                      : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 self-end rounded-tr-none"
                  )}
                >
                  <div className="text-xs">
                    {renderMarkdown(msg.content, isModel)}
                  </div>
                  
                  {(() => {
                    const scrollTarget = isModel ? getScrollTargetForMessage(msg.content) : null;
                    if (!scrollTarget) return null;
                    
                    // Verify if target element is in the document DOM
                    const targetExists = typeof document !== 'undefined' && document.getElementById(scrollTarget.id);
                    if (!targetExists) return null;

                    return (
                      <button
                        onClick={() => {
                          const element = document.getElementById(scrollTarget.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="mt-2 text-[9px] font-black text-emerald-600 dark:text-emerald-450 hover:underline flex items-center gap-1 uppercase tracking-wider self-start"
                      >
                        <ArrowUpRight size={10} />
                        (Go to {scrollTarget.label})
                      </button>
                    );
                  })()}
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex items-center gap-1.5 self-start bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl rounded-tl-none text-zinc-400">
                <Loader2 className="animate-spin text-zinc-400" size={12} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Analyst is computing...</span>
              </div>
            )}
          </div>

          {/* Quick Action Pills */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto whitespace-nowrap border-t border-zinc-200/30 dark:border-zinc-800/40 bg-zinc-50/20 dark:bg-zinc-950/10 scrollbar-none">
            {[
              { label: 'Stock advice', text: 'Give me inventory stock and replenishment advice.' },
              { label: 'Peak hours', text: 'Analyze peak daily sales transaction times.' },
              { label: 'Best sellers', text: 'Show my best selling products and ranks.' },
              { label: 'Revenue audit', text: 'Summarize total orders and ticket sizes.' }
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset.text)}
                disabled={chatLoading}
                className="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[9px] font-bold uppercase text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-inner disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-2 transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={chatLoading}
                placeholder="Ask the analyst..."
                className="flex-1 text-xs bg-transparent focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-650 disabled:opacity-50 text-zinc-800 dark:text-zinc-200"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMessage.trim()}
                className={cn(
                  "flex items-center justify-center p-2 rounded-lg transition-all",
                  inputMessage.trim()
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    : "bg-zinc-100 text-zinc-450 dark:bg-zinc-800/50 dark:text-zinc-650 cursor-not-allowed"
                )}
                title="Send Message"
              >
                <Send size={14} className={inputMessage.trim() ? "translate-x-[0.5px] -translate-y-[0.5px]" : ""} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

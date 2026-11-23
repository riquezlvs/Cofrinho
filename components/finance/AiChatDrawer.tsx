"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PiggyBank, Send, X, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  context?: {
    totalBalance?: number;
    monthlySpending?: number;
    safeToSpend?: number;
  };
}

const SUGGESTIONS = [
  "Quanto posso gastar hoje?",
  "Como estão minhas metas?",
  "Onde estou gastando mais?",
];

export function AiChatDrawer({
  isOpen,
  onClose,
  initialPrompt,
  context,
}: AiChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Oi! Eu sou o **Cofrinho**, seu assistente financeiro. Como posso te ajudar hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            "Não consegui responder agora. Tente novamente.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro de conexão ao falar com o Cofrinho.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [context, isLoading, messages]);

  useEffect(() => {
    if (isOpen && initialPrompt?.trim()) {
      const promptText = initialPrompt.trim();
      queueMicrotask(() => {
        void sendMessage(promptText);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[460px] h-[82vh] bg-[#141418] border-t border-x border-white/15 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#1a1a1e]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-[#ccff00]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                Cofrinho IA
                <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
              </h3>
              <p className="text-[11px] text-gray-400">
                Assistente financeiro pessoal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar chat"
            className="p-2 rounded-full bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#ccff00] text-black font-medium rounded-br-sm"
                    : "bg-[#1f1f25] text-gray-100 border border-white/10 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-2.5 text-xs bg-[#1f1f25] text-gray-400 border border-white/10">
                Cofrinho está pensando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void sendMessage(s)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-[#ccff00]/50 hover:text-white transition cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="p-3 border-t border-white/10 bg-[#1a1a1e]/90 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Cofrinho..."
            className="flex-1 rounded-full bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensagem"
            className="w-10 h-10 rounded-full bg-[#ccff00] text-black flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

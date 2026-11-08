"use client";

import React from "react";

export type NavTab = "inicio" | "atividades" | "transferir" | "cofrinhos" | "perfil";

interface BottomNavDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickAction?: () => void;
}

export function BottomNavDock({
  activeTab,
  onTabChange,
  onQuickAction,
}: BottomNavDockProps) {
  return (
    <div
      className="fixed bottom-4 left-0 right-0 px-4 flex flex-col items-center justify-center gap-2 z-50 pointer-events-none"
      data-purpose="floating-bottom-dock"
    >
      <nav
        className="pointer-events-auto w-full max-w-[370px] bg-[#1a1a1e]/90 backdrop-blur-md border border-[#2e2e36] rounded-full px-4 py-2 flex items-center justify-around shadow-2xl"
        data-purpose="bottom-navigation-bar"
      >
        {/* Item 1: Início */}
        <button
          aria-label="Início"
          onClick={() => onTabChange("inicio")}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-full transition-colors active:scale-95 cursor-pointer ${
            activeTab === "inicio"
              ? "text-[#ccff00] bg-white/10"
              : "text-gray-400 hover:text-white"
          }`}
          type="button"
        >
          <svg
            className="w-5 h-5 stroke-[2.2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={`text-[10px] font-semibold tracking-wide mt-0.5 ${
              activeTab === "inicio" ? "text-[#ccff00]" : "text-gray-400"
            }`}
          >
            Início
          </span>
        </button>

        {/* Item 2: Atividades / Transações */}
        <button
          aria-label="Transações"
          onClick={() => onTabChange("atividades")}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-full transition-colors active:scale-95 cursor-pointer ${
            activeTab === "atividades"
              ? "text-[#ccff00] bg-white/10"
              : "text-gray-400 hover:text-white"
          }`}
          type="button"
        >
          <svg
            className="w-5 h-5 stroke-[2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={`text-[10px] font-medium tracking-wide mt-0.5 ${
              activeTab === "atividades" ? "text-[#ccff00]" : "text-gray-400"
            }`}
          >
            Atividades
          </span>
        </button>

        {/* Item 3: Transfer / AI pill button */}
        <button
          aria-label="Transferir"
          onClick={onQuickAction ?? (() => onTabChange("transferir"))}
          className="w-9 h-9 rounded-full bg-[#2a2a30] text-[#ccff00] flex items-center justify-center hover:bg-[#32323a] transition active:scale-95 cursor-pointer"
          type="button"
        >
          <svg
            className="w-4 h-4 stroke-[2.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Item 4: Cofrinhos */}
        <button
          aria-label="Cofrinhos"
          onClick={() => onTabChange("cofrinhos")}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-full transition-colors active:scale-95 cursor-pointer ${
            activeTab === "cofrinhos"
              ? "text-[#ccff00] bg-white/10"
              : "text-gray-400 hover:text-white"
          }`}
          type="button"
        >
          <svg
            className="w-5 h-5 stroke-[2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8c-3.866 0-7 2.239-7 5 0 1.83 1.39 3.42 3.5 4.3v2.7a1 1 0 001 1h1a1 1 0 001-1v-2.1c.49.07 1 .1 1.5.1s1.01-.03 1.5-.1v2.1a1 1 0 001 1h1a1 1 0 001-1v-2.7c2.11-.88 3.5-2.47 3.5-4.3 0-2.761-3.134-5-7-5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 5.5A2.5 2.5 0 0112.5 3h1A2.5 2.5 0 0116 5.5V8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="15" cy="12" fill="currentColor" r="1" />
          </svg>
          <span
            className={`text-[10px] font-medium tracking-wide mt-0.5 ${
              activeTab === "cofrinhos" ? "text-[#ccff00]" : "text-gray-400"
            }`}
          >
            Cofrinhos
          </span>
        </button>

        {/* Item 5: Perfil */}
        <button
          aria-label="Perfil"
          onClick={() => onTabChange("perfil")}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-full transition-colors active:scale-95 cursor-pointer ${
            activeTab === "perfil"
              ? "text-[#ccff00] bg-white/10"
              : "text-gray-400 hover:text-white"
          }`}
          type="button"
        >
          <svg
            className="w-5 h-5 stroke-[2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={`text-[10px] font-medium tracking-wide mt-0.5 ${
              activeTab === "perfil" ? "text-[#ccff00]" : "text-gray-400"
            }`}
          >
            Perfil
          </span>
        </button>
      </nav>
    </div>
  );
}

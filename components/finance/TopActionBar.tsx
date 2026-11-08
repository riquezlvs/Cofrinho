"use client";

import React from "react";

interface TopActionBarProps {
  userName: string;
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onNewTransaction?: () => void;
}

export function TopActionBar({
  userName,
  isPrivacyHidden,
  onTogglePrivacy,
  onNewTransaction,
}: TopActionBarProps) {
  return (
    <section
      className="px-6 pt-5 pb-3 flex justify-between items-center shrink-0"
      data-purpose="top-navigation-bar"
    >
      <div className="flex items-center gap-3">
        {/* Visibility / Eye Toggle Button */}
        <button
          aria-label={isPrivacyHidden ? "Exibir saldo" : "Ocultar saldo"}
          onClick={onTogglePrivacy}
          className="w-11 h-11 rounded-full bg-[#1c1c1f] border border-[#26262a] flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer hover:border-gray-600"
          type="button"
        >
          {isPrivacyHidden ? (
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M2 12s3.5-6.5 10-6.5 10 6.5 10 6.5-3.5 6.5-10 6.5-10-6.5z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-base font-bold tracking-tight">
              Olá, {userName}
            </span>
          </div>
        </div>
      </div>

      {/* Lime Green Action Button with Plus */}
      <button
        aria-label="Nova Transação"
        onClick={onNewTransaction}
        className="w-11 h-11 rounded-full bg-[#ccff00] flex items-center justify-center text-black shadow-lg shadow-[#ccff00]/25 active:scale-95 transition-transform cursor-pointer hover:brightness-110"
        type="button"
      >
        <svg
          className="w-5 h-5 stroke-[2.8]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 4.5v15m7.5-7.5h-15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}

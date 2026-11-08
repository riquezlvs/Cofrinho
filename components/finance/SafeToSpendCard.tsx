"use client";

import React from "react";

interface SafeToSpendCardProps {
  amount: number;
  dailyFree: number;
  status?: string;
  isPrivacyHidden: boolean;
  onNewTransaction?: () => void;
}

export function SafeToSpendCard({
  amount,
  dailyFree,
  status = "Tudo em dia",
  isPrivacyHidden,
  onNewTransaction,
}: SafeToSpendCardProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const formattedDaily = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(dailyFree);

  return (
    <section className="pt-2 pb-4">
      <div className="relative overflow-hidden rounded-3xl bg-[#121215] border border-[#232328] p-5 shadow-xl">
        {/* Signature subtle neon glow */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1c1c1f] flex items-center justify-center text-[#ccff00] border border-white/5">
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
              </svg>
            </div>
            <span className="text-gray-400 text-[11px] font-bold tracking-wider uppercase">
              SALDO LIVRE
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
            {status}
          </span>
        </div>

        {/* Currency Value with Privacy Toggle Target */}
        <div className="my-2">
          <span className="text-xs font-normal text-gray-400 block mb-0.5">
            Disponível para gastar agora
          </span>
          <div className="flex items-baseline gap-1">
            <h2
              className={`text-white text-[32px] font-bold tracking-tight font-mono transition-all duration-200 ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              {formattedAmount}
            </h2>
          </div>
        </div>

        {/* Explanatory note */}
        <p className="text-gray-400 text-xs leading-relaxed mb-4">
          Já provisionando faturas e despesas fixas{" "}
          <span className="text-white font-medium">({formattedDaily}/dia livre)</span>
        </p>

        {/* CTA Action in Vibrant Lime */}
        <button
          onClick={onNewTransaction}
          className="w-full py-3 px-4 rounded-full bg-[#ccff00] text-black hover:brightness-110 active:scale-[0.99] font-bold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-[#ccff00]/20 cursor-pointer"
          type="button"
        >
          <svg
            className="w-4 h-4 stroke-[3]"
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
          <span className="tracking-tight">Nova Transação</span>
        </button>
      </div>
    </section>
  );
}

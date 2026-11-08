"use client";

import React from "react";

interface AccountItem {
  id: string;
  name: string;
  updatedAt: string;
  amount: number;
  percentage: number;
  logoType?: "santander" | "pierre" | "other";
}

interface AccountsOverviewCardProps {
  totalBalance: number;
  isPrivacyHidden: boolean;
  accounts?: AccountItem[];
  onOpenDetails?: () => void;
}

export function AccountsOverviewCard({
  totalBalance,
  isPrivacyHidden,
  accounts = [
    {
      id: "santander-1",
      name: "Santander",
      updatedAt: "Atualizado agora",
      amount: 4.71,
      percentage: 100,
      logoType: "santander",
    },
  ],
  onOpenDetails,
}: AccountsOverviewCardProps) {
  return (
    <div className="w-full rounded-[28px] liquid-glass-card p-5 border border-white/[0.12] flex flex-col gap-4 shadow-2xl">
      {/* Header do Card: Saldo em contas > */}
      <div
        onClick={onOpenDetails}
        className="flex items-center justify-between cursor-pointer group pb-3 border-b border-white/[0.08]"
      >
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
          Saldo em contas
        </span>
        <svg
          className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Saldo Grande */}
      <div className="flex flex-col gap-3 pb-3 border-b border-white/[0.08]">
        <span
          className={`text-3xl font-extrabold tracking-tight text-white ${
            isPrivacyHidden ? "balance-blur" : ""
          }`}
        >
          R${" "}
          {totalBalance.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>

        {/* Barra de Progresso / Proporção Roxa e Verde */}
        <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full w-[95%]" />
          <div className="h-full bg-emerald-400 rounded-full w-[5%]" />
        </div>
      </div>

      {/* Lista de Bancos Vinculados */}
      <div className="flex flex-col gap-2 pt-0.5">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            className={`flex items-center justify-between py-2 group cursor-pointer ${
              index > 0 ? "border-t border-white/[0.06]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Santander Icon */}
              {acc.logoType === "santander" ? (
                <div className="w-10 h-10 rounded-full bg-[#ec0000] flex items-center justify-center text-white shadow-md shadow-red-600/30">
                  <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.8c-.8.8-2 .9-2.9.4-.9-.6-1.5-1.5-1.9-2.4l-.1-.2-.1.2c-.4.9-1 1.8-1.9 2.4-.9.5-2.1.4-2.9-.4-.7-.7-.8-1.8-.3-2.6.4-.7 1.2-1.2 2-1.4l.7-.2-.5-.5c-.8-.7-1-1.8-.5-2.7.5-.9 1.5-1.3 2.5-1.1.9.2 1.6.8 1.9 1.7l.2.6.2-.6c.3-.9 1-1.5 1.9-1.7 1-.2 2 .2 2.5 1.1.5.9.3 2-.5 2.7l-.5.5.7.2c.8.2 1.6.7 2 1.4.5.8.4 1.9-.3 2.6z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                  {acc.name[0]}
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">
                  {acc.name}
                </span>
                <span className="text-[11px] font-normal text-zinc-400">
                  {acc.updatedAt}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span
                className={`text-sm font-semibold text-white ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R${" "}
                {acc.amount.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                {acc.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

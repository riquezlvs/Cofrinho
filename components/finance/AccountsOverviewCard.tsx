"use client";

import React, { useState } from "react";
import { AccountSummary } from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";

export type AccountItem = AccountSummary;

interface AccountsOverviewCardProps {
  totalBalance: number;
  isPrivacyHidden: boolean;
  accounts?: AccountSummary[];
  onOpenDetails?: () => void;
}

function AccountLogo({ name, logoType }: { name: string; logoType?: string }) {
  const [imgError, setImgError] = useState(false);

  // Mapeia o domínio oficial do banco ou benefício
  const getDomain = (): string | null => {
    const n = (name || "").toLowerCase();
    if (logoType === "santander" || n.includes("santander")) return "santander.com.br";
    if (logoType === "nubank" || n.includes("nubank") || n.includes("nu ") || n.includes("roxinho"))
      return "nubank.com.br";
    if (
      logoType === "vr" ||
      n.includes("vr") ||
      n.includes("refeição") ||
      n.includes("refeicao") ||
      n.includes("alimentação") ||
      n.includes("alimentacao")
    )
      return "vr.com.br";
    if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
    if (n.includes("inter")) return "inter.co";
    if (n.includes("bradesco")) return "bradesco.com.br";
    if (n.includes("c6")) return "c6bank.com.br";
    if (n.includes("caixa")) return "caixa.gov.br";
    if (n.includes("brasil") || n.includes("bb")) return "bb.com.br";
    if (n.includes("alelo")) return "alelo.com.br";
    if (n.includes("sodexo") || n.includes("pluxee")) return "pluxee.com.br";
    if (n.includes("flash")) return "flashapp.com.br";
    if (n.includes("caju")) return "caju.com.br";

    const detected = detectBrand(name);
    return detected?.domain || null;
  };

  const domain = getDomain();

  // Renderiza o logo oficial em alta resolução
  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 128);
    return (
      <div
        className="w-10 h-10 rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center shadow-md shadow-black/40 shrink-0 overflow-hidden p-1.5"
        title={name}
      >
        <img
          src={faviconUrl}
          alt={name}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallbacks nativos SVG/monograma caso offline ou imagem não disponível
  if (logoType === "santander" || name.toLowerCase().includes("santander")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#ec0000] flex items-center justify-center text-white shadow-md shadow-red-600/30 shrink-0">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.8c-.8.8-2 .9-2.9.4-.9-.6-1.5-1.5-1.9-2.4l-.1-.2-.1.2c-.4.9-1 1.8-1.9 2.4-.9.5-2.1.4-2.9-.4-.7-.7-.8-1.8-.3-2.6.4-.7 1.2-1.2 2-1.4l.7-.2-.5-.5c-.8-.7-1-1.8-.5-2.7.5-.9 1.5-1.3 2.5-1.1.9.2 1.6.8 1.9 1.7l.2.6.2-.6c.3-.9 1-1.5 1.9-1.7 1-.2 2 .2 2.5 1.1.5.9.3 2-.5 2.7l-.5.5.7.2c.8.2 1.6.7 2 1.4.5.8.4 1.9-.3 2.6z" />
        </svg>
      </div>
    );
  }

  if (logoType === "nubank" || name.toLowerCase().includes("nubank")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#820AD1] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-600/30 shrink-0">
        Nu
      </div>
    );
  }

  if (logoType === "vr" || name.toLowerCase().includes("vr")) {
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {name ? name[0].toUpperCase() : "B"}
    </div>
  );
}

export function AccountsOverviewCard({
  totalBalance,
  isPrivacyHidden,
  accounts = [],
  onOpenDetails,
}: AccountsOverviewCardProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
          R$ {formatCurrency(totalBalance)}
        </span>

        {/* Barra de Progresso Proporcional Dinâmica */}
        <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex gap-0.5">
          {accounts.map((acc, i) => {
            let bgClass = "bg-gradient-to-r from-purple-500 to-fuchsia-500";
            if (acc.logoType === "vr") bgClass = "bg-emerald-400";
            else if (acc.logoType === "santander") bgClass = "bg-rose-500";
            else if (i === 1) bgClass = "bg-emerald-400";

            return (
              <div
                key={acc.id}
                style={{ width: `${Math.max(4, acc.percentage)}%` }}
                className={`h-full ${bgClass} rounded-full transition-all duration-500`}
                title={`${acc.name}: ${acc.percentage}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Lista de Bancos e Contas com Ícone Original da Empresa */}
      <div className="flex flex-col gap-2 pt-0.5">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            className={`flex items-center justify-between py-2 group cursor-pointer ${
              index > 0 ? "border-t border-white/[0.06]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Logo Oficial do Banco / Benefício */}
              <AccountLogo name={acc.name} logoType={acc.logoType} />

              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">
                  {acc.name}
                </span>
                <span className="text-[11px] font-normal text-zinc-400">
                  {acc.isIsolated ? "VR Isolado • " : ""}{acc.updatedAt}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span
                className={`text-sm font-semibold text-white ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(acc.amount)}
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

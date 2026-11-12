"use client";

import React, { useState } from "react";
import { AccountSummary } from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";
import { ChevronRight, Wallet } from "lucide-react";

export type AccountItem = AccountSummary;

interface AccountsOverviewCardProps {
  totalBalance: number;
  isPrivacyHidden: boolean;
  accounts?: AccountSummary[];
  onOpenDetails?: () => void;
}

export function formatAccountCurrency(val: number): string {
  const absFormatted = Math.abs(val).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R$ ${absFormatted}` : `R$ ${absFormatted}`;
}

export function AccountLogo({
  name,
  logoType,
  size = 40,
  className = "",
}: {
  name: string;
  logoType?: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

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
    if (n.includes("xp")) return "xpi.com.br";
    if (n.includes("btg")) return "btgpactual.com";
    if (n.includes("picpay")) return "picpay.com";
    if (n.includes("mercado pago") || n.includes("mercadopago")) return "mercadopago.com.br";

    const detected = detectBrand(name);
    return detected?.domain || null;
  };

  const domain = getDomain();
  const sizeStyle = { width: size, height: size };

  if (logoType === "santander" || name.toLowerCase().includes("santander")) {
    return (
      <div
        style={sizeStyle}
        className={`rounded-full bg-[#ec0000] flex items-center justify-center text-white shadow-md shadow-red-600/20 shrink-0 ${className}`}
        title={name}
      >
        <svg className="w-1/2 h-1/2 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.8c-.8.8-2 .9-2.9.4-.9-.6-1.5-1.5-1.9-2.4l-.1-.2-.1.2c-.4.9-1 1.8-1.9 2.4-.9.5-2.1.4-2.9-.4-.7-.7-.8-1.8-.3-2.6.4-.7 1.2-1.2 2-1.4l.7-.2-.5-.5c-.8-.7-1-1.8-.5-2.7.5-.9 1.5-1.3 2.5-1.1.9.2 1.6.8 1.9 1.7l.2.6.2-.6c.3-.9 1-1.5 1.9-1.7 1-.2 2 .2 2.5 1.1.5.9.3 2-.5 2.7l-.5.5.7.2c.8.2 1.6.7 2 1.4.5.8.4 1.9-.3 2.6z" />
        </svg>
      </div>
    );
  }

  if (logoType === "cofrinho" || name.toLowerCase().includes("pierre") || name.toLowerCase().includes("carteira")) {
    return (
      <div
        style={sizeStyle}
        className={`rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-white shadow-md shadow-black/40 shrink-0 ${className}`}
        title={name}
      >
        <Wallet className="w-[46%] h-[46%] text-white" strokeWidth={2} />
      </div>
    );
  }

  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 128);
    return (
      <div
        style={sizeStyle}
        className={`rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center shadow-md shadow-black/40 shrink-0 overflow-hidden ${className}`}
        title={name}
      >
        <img
          src={faviconUrl}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (logoType === "nubank" || name.toLowerCase().includes("nubank")) {
    return (
      <div
        style={sizeStyle}
        className={`rounded-full bg-[#820AD1] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-600/30 shrink-0 ${className}`}
        title={name}
      >
        Nu
      </div>
    );
  }

  if (logoType === "vr" || name.toLowerCase().includes("vr")) {
    return (
      <div
        style={sizeStyle}
        className={`rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0 ${className}`}
        title={name}
      >
        <svg className="w-1/2 h-1/2 fill-current" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={sizeStyle}
      className={`rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0 ${className}`}
      title={name}
    >
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
  const visibleAccounts = accounts.slice(0, 4);
  const extraCount = Math.max(0, accounts.length - 4);

  const connectedLabel =
    accounts.length === 0
      ? "Nenhuma conta conectada"
      : accounts.length === 1
      ? "1 conta conectada"
      : `${accounts.length} contas conectadas`;

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className="w-full text-left rounded-[28px] liquid-glass-card p-5 border border-white/[0.12] hover:border-white/[0.2] active:scale-[0.985] transition-all duration-200 flex flex-col justify-between gap-7 shadow-2xl group cursor-pointer"
    >
      {/* Linha Superior: Ícones sobrepostos das contas + Seta */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center -space-x-2.5">
          {visibleAccounts.length > 0 ? (
            visibleAccounts.map((acc, idx) => (
              <div
                key={acc.id}
                style={{ zIndex: visibleAccounts.length - idx }}
                className="relative rounded-full ring-2 ring-[#141417]"
              >
                <AccountLogo name={acc.name} logoType={acc.logoType} size={42} />
              </div>
            ))
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400">
              <Wallet className="w-5 h-5" />
            </div>
          )}

          {extraCount > 0 && (
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/15 ring-2 ring-[#141417] flex items-center justify-center text-xs font-bold text-zinc-200">
              +{extraCount}
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Bloco Inferior: Título, Saldo Real e Contagem */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-400">
          Saldo em contas
        </span>

        <span
          className={`text-[30px] leading-tight font-extrabold tracking-tight text-white ${
            isPrivacyHidden ? "balance-blur" : ""
          }`}
        >
          {formatAccountCurrency(totalBalance)}
        </span>

        <span className="text-sm font-normal text-zinc-400 mt-0.5">
          {connectedLabel}
        </span>
      </div>
    </button>
  );
}

"use client";

import React, { useState } from "react";
import { CreditCardSummary, SubscriptionSummary } from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";

interface BentoWidgetsProps {
  creditCard: CreditCardSummary;
  subscriptions: SubscriptionSummary;
  onManageSubscriptions?: () => void;
}

function MiniSubscriptionLogo({
  service,
}: {
  service: { name?: string; domain?: string; initial: string; bgColor: string };
}) {
  const [imgError, setImgError] = useState(false);

  const getDomain = (): string | null => {
    if (service.domain) return service.domain;
    if (service.name) {
      const b = detectBrand(service.name);
      if (b) return b.domain;
    }
    const init = (service.initial || "").toUpperCase();
    if (init === "N") return "netflix.com";
    if (init === "S") return "spotify.com";
    if (init === "G") return "google.com";
    if (init === "A") return "primevideo.com";
    return null;
  };

  const domain = getDomain();

  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 64);
    return (
      <div
        className="w-5 h-5 rounded-full bg-[#1b1c22] ring-2 ring-[#121215] flex items-center justify-center overflow-hidden shrink-0"
        title={service.name || domain}
      >
        <img
          src={faviconUrl}
          alt={service.name || domain}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      key={service.initial}
      className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#121215]"
      style={{ backgroundColor: service.bgColor }}
    >
      {service.initial}
    </div>
  );
}

export function BentoWidgets({
  creditCard,
  subscriptions,
  onManageSubscriptions,
}: BentoWidgetsProps) {
  const formatCompactCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <section className="pb-5 grid grid-cols-2 gap-3">
      {/* Widget 1: Limite do Cartão */}
      <div className="rounded-3xl bg-[#121215] border border-[#232328] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1c1c1f] flex items-center justify-center text-white border border-[#232328]">
              <svg
                className="w-4 h-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect height="12" rx="2" width="20" x="2" y="6" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-[#1c1c1f] px-2 py-0.5 rounded-full border border-[#232328]">
              {creditCard.percentage}%
            </span>
          </div>
          <h4 className="text-gray-400 text-xs font-medium">
            Limite {creditCard.cardName}
          </h4>
          <p className="text-white font-bold font-mono text-sm mt-0.5">
            {formatCompactCurrency(creditCard.spent)}
          </p>
          <p className="text-[11px] text-gray-500">
            de {formatCurrency(creditCard.limit)}
          </p>
        </div>

        {/* Gauge bar in Cofrinho Neon Accent */}
        <div className="mt-3">
          <div className="w-full bg-[#1c1c1f] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#ccff00] h-full rounded-full transition-all duration-500"
              style={{ width: `${creditCard.percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-[#ccff00] mt-2 flex items-center gap-1 font-semibold">
            <svg
              className="w-3 h-3 text-[#ccff00] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Fecha em {creditCard.closingDays} dias
          </p>
        </div>
      </div>

      {/* Widget 2: Assinaturas Recorrentes */}
      <div className="rounded-3xl bg-[#121215] border border-[#232328] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1c1c1f] flex items-center justify-center text-[#ccff00] border border-[#232328]">
              <svg
                className="w-4 h-4 text-[#ccff00]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#ccff00] bg-[#ccff00]/10 px-2 py-0.5 rounded-full border border-[#ccff00]/20">
              Fixas
            </span>
          </div>
          <h4 className="text-gray-400 text-xs font-medium">Assinaturas</h4>
          <p className="text-white font-bold font-mono text-sm mt-0.5">
            {formatCurrency(subscriptions.monthlyAmount)}
            <span className="text-[10px] text-gray-400 font-normal">/mês</span>
          </p>
          <p className="text-[11px] text-gray-500">
            {subscriptions.activeCount} ativas neste ciclo
          </p>
        </div>

        {/* Mini brand icons pile com ícones originais */}
        <div className="mt-3 pt-1 flex items-center justify-between">
          <div className="flex -space-x-1.5 overflow-hidden">
            {subscriptions.services.map((item, index) => (
              <MiniSubscriptionLogo key={index} service={item} />
            ))}
          </div>
          <button
            onClick={onManageSubscriptions}
            className="text-[10px] text-gray-400 hover:text-white transition cursor-pointer"
            type="button"
          >
            Gerenciar
          </button>
        </div>
      </div>
    </section>
  );
}

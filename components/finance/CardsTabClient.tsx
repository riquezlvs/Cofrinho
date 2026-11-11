"use client";

import React, { useState, useRef, useEffect } from "react";
import { CreditCardSummary } from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";
import {
  CreditCard as CreditCardIcon,
  Plus,
  Pencil,
  Trash2,
  Star,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  addCreditCardAction,
  updateCreditCardAction,
  deleteCreditCardAction,
} from "@/app/actions/cards";

interface CardsTabClientProps {
  cards: CreditCardSummary[];
  userName: string;
  isPrivacyHidden: boolean;
  onCardsChange?: (newCards: CreditCardSummary[]) => void;
  onOpenExtratoWithCard?: (cardId: string) => void;
}

// Presets de bancos populares brasileiros com domínios e cores oficiais
const BANK_PRESETS = [
  { name: "Nubank", domain: "nubank.com.br", color: "#820ad1" },
  { name: "Santander", domain: "santander.com.br", color: "#ec0000" },
  { name: "Itaú", domain: "itau.com.br", color: "#ec7000" },
  { name: "Inter", domain: "inter.co", color: "#ff7a00" },
  { name: "C6 Bank", domain: "c6bank.com.br", color: "#1e1e1e" },
  { name: "Bradesco", domain: "bradesco.com.br", color: "#cc092f" },
  { name: "XP Investimentos", domain: "xpi.com.br", color: "#eab308" },
  { name: "Caixa", domain: "caixa.gov.br", color: "#0066b3" },
  { name: "BTG Pactual", domain: "btgpactual.com", color: "#0d2040" },
];

const COLOR_PALETTE = [
  "#820ad1", // Nu Purple
  "#ec0000", // Santander Red
  "#ec7000", // Itaú Orange
  "#ff7a00", // Inter Amber
  "#1e1e1e", // C6 Dark / Carbon
  "#cc092f", // Bradesco Red
  "#eab308", // XP Gold
  "#0066b3", // Caixa Blue
  "#0d2040", // BTG Navy
  "#10b981", // Emerald Green
  "#06b6d4", // Cyan
  "#ccff00", // Neon Lime
];

function BankCardFavicon({ cardName, size = 32 }: { cardName: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const n = (cardName || "").toLowerCase();

  const getDomain = (): string | null => {
    if (n.includes("santander")) return "santander.com.br";
    if (n.includes("nubank") || n.includes("roxinho") || n.includes("nu")) return "nubank.com.br";
    if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
    if (n.includes("inter")) return "inter.co";
    if (n.includes("bradesco")) return "bradesco.com.br";
    if (n.includes("c6")) return "c6bank.com.br";
    if (n.includes("caixa")) return "caixa.gov.br";
    if (n.includes("bb") || n.includes("brasil")) return "bb.com.br";
    if (n.includes("xp")) return "xpi.com.br";
    if (n.includes("btg")) return "btgpactual.com";

    const detected = detectBrand(cardName);
    return detected?.domain || null;
  };

  const domain = getDomain();

  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 64);
    return (
      <div
        className="rounded-full bg-[#1b1c22]/90 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-md backdrop-blur-md"
        style={{ width: size, height: size }}
        title={cardName}
      >
        <img
          src={faviconUrl}
          alt={cardName}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-black text-xs font-black shrink-0 shadow-md border border-white/20"
    >
      {(cardName || "C")[0].toUpperCase()}
    </div>
  );
}

export function CardsTabClient({
  cards: initialCards,
  userName,
  isPrivacyHidden,
  onCardsChange,
  onOpenExtratoWithCard,
}: CardsTabClientProps) {
  const [cards, setCards] = useState<CreditCardSummary[]>(initialCards || []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardSummary | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCardSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const carouselRef = useRef<HTMLDivElement>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formClosingDay, setFormClosingDay] = useState("24");
  const [formDueDay, setFormDueDay] = useState("1");
  const [formColor, setFormColor] = useState("#820ad1");
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Travar o scroll da página de fundo quando qualquer modal de cartão estiver aberto e suportar voltar/ESC
  useEffect(() => {
    if (isModalOpen || cardToDelete !== null) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setCardToDelete(null);
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };

    const handlePopState = () => {
      setIsModalOpen(false);
      setCardToDelete(null);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isModalOpen, cardToDelete]);

  // Garante que o activeSlide esteja dentro do limite
  const safeActiveSlide = Math.min(Math.max(0, activeSlide), Math.max(0, cards.length - 1));
  const activeCard: CreditCardSummary | undefined = cards[safeActiveSlide];

  // Totais combinados
  const totalLimit = cards.reduce((acc, c) => acc + (c.limit || 0), 0);
  const totalSpent = cards.reduce((acc, c) => acc + (c.spent || 0), 0);
  const totalAvailable = Math.max(0, totalLimit - totalSpent);
  const globalPercentage =
    totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Navegar para slide específico
  const goToSlide = (index: number) => {
    setActiveSlide(index);
    if (carouselRef.current) {
      const slideEl = carouselRef.current.children[index] as HTMLElement;
      if (slideEl) {
        slideEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  };

  const handleNext = () => {
    if (activeSlide < cards.length - 1) {
      goToSlide(activeSlide + 1);
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      goToSlide(activeSlide - 1);
    }
  };

  // Sincronizar scroll com activeSlide
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.children[0]?.clientWidth || 320;
    const newIndex = Math.round(scrollLeft / (cardWidth + 16));
    if (newIndex >= 0 && newIndex < cards.length && newIndex !== activeSlide) {
      setActiveSlide(newIndex);
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    setFormName("");
    setFormLimit("5000,00");
    setFormClosingDay("24");
    setFormDueDay("1");
    setFormColor("#820ad1");
    setFormIsDefault(cards.length === 0);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (card: CreditCardSummary) => {
    setEditingCard(card);
    setFormName(card.cardName);
    setFormLimit(card.limit ? card.limit.toFixed(2).replace(".", ",") : "0,00");
    setFormClosingDay(String(card.closingDay || 24));
    setFormDueDay(String(card.dueDay || 1));
    setFormColor(card.color || "#820ad1");
    setFormIsDefault(Boolean(card.isDefault));
    setFormError("");
    setIsModalOpen(true);
  };

  const applyBankPreset = (preset: (typeof BANK_PRESETS)[0]) => {
    setFormName(preset.name);
    setFormColor(preset.color);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Informe o nome do cartão ou banco.");
      return;
    }

    const cleanedLimit = parseFloat(formLimit.replace(/\./g, "").replace(",", "."));
    if (isNaN(cleanedLimit) || cleanedLimit <= 0) {
      setFormError("Informe um limite válido maior que zero.");
      return;
    }

    const closing = parseInt(formClosingDay, 10);
    if (isNaN(closing) || closing < 1 || closing > 31) {
      setFormError("O dia de fechamento deve ser entre 1 e 31.");
      return;
    }

    const due = parseInt(formDueDay, 10);
    if (isNaN(due) || due < 1 || due > 31) {
      setFormError("O dia de vencimento deve ser entre 1 e 31.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCard && editingCard.id) {
        const res = await updateCreditCardAction(editingCard.id, {
          name: formName.trim(),
          limit: cleanedLimit,
          closingDay: closing,
          dueDay: due,
          color: formColor,
          isDefault: formIsDefault,
        });

        if (!res.success) {
          setFormError(res.error || "Não foi possível atualizar o cartão.");
          setIsSubmitting(false);
          return;
        }

        const updatedList = cards.map((c) => {
          if (c.id === editingCard.id) {
            const spent = c.spent || 0;
            const pct =
              cleanedLimit > 0 ? Math.min(100, Math.round((spent / cleanedLimit) * 100)) : 0;
            return {
              ...c,
              cardName: formName.trim(),
              limit: cleanedLimit,
              closingDay: closing,
              dueDay: due,
              color: formColor,
              isDefault: formIsDefault,
              percentage: pct,
            };
          }
          if (formIsDefault) {
            return { ...c, isDefault: false };
          }
          return c;
        });

        setCards(updatedList);
        onCardsChange?.(updatedList);
      } else {
        const res = await addCreditCardAction({
          name: formName.trim(),
          limit: cleanedLimit,
          closingDay: closing,
          dueDay: due,
          color: formColor,
          isDefault: formIsDefault,
        });

        if (!res.success || !res.data) {
          setFormError(res.error || "Não foi possível cadastrar o cartão.");
          setIsSubmitting(false);
          return;
        }

        const newCard: CreditCardSummary = res.data;
        const updatedList = formIsDefault
          ? [...cards.map((c) => ({ ...c, isDefault: false })), newCard]
          : [...cards, newCard];

        setCards(updatedList);
        onCardsChange?.(updatedList);
        goToSlide(updatedList.length - 1);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao salvar.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (card: CreditCardSummary) => {
    if (!card.id) return;
    try {
      await updateCreditCardAction(card.id, { isDefault: true });
      const updatedList = cards.map((c) => ({
        ...c,
        isDefault: c.id === card.id,
      }));
      setCards(updatedList);
      onCardsChange?.(updatedList);
    } catch (err) {
      console.error("Erro ao definir cartão padrão:", err);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete || !cardToDelete.id) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCreditCardAction(cardToDelete.id);
      if (!res.success) {
        alert(res.error || "Erro ao excluir cartão.");
        setIsSubmitting(false);
        return;
      }
      const updatedList = cards.filter((c) => c.id !== cardToDelete.id);
      setCards(updatedList);
      onCardsChange?.(updatedList);
      setCardToDelete(null);
      if (activeSlide >= updatedList.length) {
        setActiveSlide(Math.max(0, updatedList.length - 1));
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
      alert("Erro ao excluir cartão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" data-purpose="cards-management-view">
      {/* 1. TOP OVERVIEW CARD COM EFEITO LIQUID GLASS & BOTÃO ARREDONDADO */}
      <div className="w-full rounded-[32px] liquid-glass p-5 sm:p-6 relative overflow-hidden border border-white/[0.14] shadow-2xl">
        <div className="absolute -top-14 -right-14 w-48 h-48 bg-gradient-to-br from-lime-400/25 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full liquid-glass flex items-center justify-center text-lime-400 shadow-md border border-white/20">
              <CreditCardIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Meus Cartões
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-lime-300 border border-lime-400/30">
                  {cards.length} {cards.length === 1 ? "cartão" : "cartões"}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Arraste para alternar entre os cartões</p>
            </div>
          </div>

          {/* Botão Arredondado com Efeito Liquid Glass Neon */}
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full liquid-glass-btn-accent font-extrabold text-xs active:scale-95 transition-all shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Novo Cartão</span>
          </button>
        </div>

        {/* Métricas Combinadas */}
        <div className="pt-4 grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-0.5 p-3 rounded-2xl liquid-glass border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-400">Total em Faturas</span>
            <span
              className={`text-xl font-black tracking-tight text-white ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              R$ {formatCurrency(totalSpent)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-3 rounded-2xl liquid-glass border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-400">Disponível Total</span>
            <span
              className={`text-xl font-black tracking-tight text-lime-400 ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              R$ {formatCurrency(totalAvailable)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Global */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Limite Combinado Contratado</span>
            <span className={isPrivacyHidden ? "balance-blur" : ""}>
              R$ {formatCurrency(totalLimit)} ({globalPercentage}% consumido)
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.08] rounded-full overflow-hidden flex p-0.5 border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                globalPercentage >= 80
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                  : globalPercentage >= 50
                  ? "bg-gradient-to-r from-lime-400 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  : "bg-gradient-to-r from-emerald-400 to-lime-400 shadow-[0_0_12px_rgba(204,255,0,0.4)]"
              }`}
              style={{ width: `${globalPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CARROSSEL DE CARTÕES (HEIGHT AUMENTADO & NAVEGAÇÃO SUAVE) */}
      {cards.length === 0 ? (
        <div className="w-full rounded-[32px] liquid-glass p-8 text-center flex flex-col items-center justify-center gap-4 border border-dashed border-white/20">
          <div className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center text-zinc-400 border border-white/10">
            <CreditCardIcon className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhum cartão cadastrado</h3>
            <p className="text-xs text-zinc-400 max-w-[280px] mx-auto">
              Cadastre seu cartão para acompanhar limites, faturas e controle de compras em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 rounded-full liquid-glass-btn-accent font-extrabold text-xs active:scale-95 transition-transform cursor-pointer shadow-xl"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Cadastrar meu primeiro cartão</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Header do Carrossel com Indicador e Controles Arredondados */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Cartão {safeActiveSlide + 1} de {cards.length}
            </span>

            {/* Controles de Navegação Arredondados com Efeito Liquid Glass */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeSlide === 0}
                aria-label="Cartão anterior"
                className="w-9 h-9 rounded-full liquid-glass-btn flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={activeSlide === cards.length - 1}
                aria-label="Próximo cartão"
                className="w-9 h-9 rounded-full liquid-glass-btn flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Container Deslizável Snap-Scroll do Carrossel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 pt-1 px-1 scroll-smooth"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {cards.map((card, idx) => {
              const cardColor = card.color || "#820ad1";
              const isSelected = idx === safeActiveSlide;
              const due = card.dueDay || 1;
              const closing = card.closingDay || 24;

              return (
                <div
                  key={card.id || `card-slide-${idx}`}
                  onClick={() => goToSlide(idx)}
                  className={`snap-center shrink-0 w-[92%] sm:w-[94%] transition-all duration-300 cursor-pointer ${
                    isSelected ? "scale-[1.01] opacity-100" : "scale-[0.97] opacity-75 hover:opacity-90"
                  }`}
                >
                  {/* VISUAL PHYSICAL CREDIT CARD - HEIGHT SIGNIFICATIVAMENTE AUMENTADO (225px+) */}
                  <div
                    className="relative w-full rounded-[28px] p-6 overflow-hidden flex flex-col justify-between min-h-[225px] sm:min-h-[235px] shadow-2xl border border-white/25 select-none transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${cardColor} 0%, #111217 65%, #050608 100%)`,
                    }}
                  >
                    {/* Efeito Sheen Luminoso & Textura de Vidro Metálico */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.15] via-transparent to-black/50 pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-44 h-44 bg-white/[0.12] rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-white/[0.06] rounded-full blur-2xl pointer-events-none" />

                    {/* Topo do Cartão: Banco + Favicon Original + Badge de Padrão */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BankCardFavicon cardName={card.cardName} size={36} />
                        <div className="flex flex-col">
                          <span className="text-base font-black text-white tracking-wide drop-shadow-md">
                            {card.cardName}
                          </span>
                          <span className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">
                            Cartão Platinum & Crédito
                          </span>
                        </div>
                      </div>

                      {card.isDefault && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-[11px] font-extrabold text-white border border-white/30 shadow-md">
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          PADRÃO
                        </span>
                      )}
                    </div>

                    {/* Meio: Chip EMV Metálico Realista + Símbolo Contactless NFC + Número Relevo */}
                    <div className="relative z-10 my-4 flex items-center gap-4">
                      {/* Chip Metálico */}
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center border border-amber-300/40">
                        <div className="w-full h-full border border-amber-900/50 rounded-[4px] grid grid-cols-2 gap-0.5 p-1 bg-amber-400/20">
                          <div className="border-r border-b border-amber-950/40" />
                          <div className="border-b border-amber-950/40" />
                          <div className="border-r border-amber-950/40" />
                          <div />
                        </div>
                      </div>

                      {/* Símbolo de Aproximação (Contactless/NFC) */}
                      <svg
                        className="w-6 h-6 text-white/85 drop-shadow-xs"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M8.5 16.5a5 5 0 0 1 0-7" strokeLinecap="round" />
                        <path d="M12 19a8.5 8.5 0 0 1 0-12" strokeLinecap="round" />
                        <path d="M15.5 21.5a12 12 0 0 1 0-17" strokeLinecap="round" />
                      </svg>

                      {/* Número Relevo Estilizado */}
                      <span className="ml-auto text-sm sm:text-base font-mono tracking-widest text-white/90 font-bold drop-shadow-sm">
                        •••• •••• •••• {card.id ? card.id.slice(0, 4).toUpperCase() : "4028"}
                      </span>
                    </div>

                    {/* Rodapé do Cartão: Titular + Vencimento + Fechamento */}
                    <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10 text-xs font-semibold text-white/90">
                      <div>
                        <span className="text-[10px] block text-white/60 uppercase tracking-widest font-bold">
                          Titular do Cartão
                        </span>
                        <span className="font-extrabold tracking-wider uppercase drop-shadow-sm">
                          {userName}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] block text-white/60 uppercase tracking-widest font-bold">
                          Fecha {String(closing).padStart(2, "0")} • Vence {String(due).padStart(2, "0")}
                        </span>
                        <span className="font-mono font-bold tracking-wider text-sm drop-shadow-sm">
                          DIA {String(due).padStart(2, "0")} / MÊS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicadores de Paginação do Carrossel */}
          {cards.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1 pb-2">
              {cards.map((_, dotIdx) => (
                <button
                  key={`dot-${dotIdx}`}
                  type="button"
                  onClick={() => goToSlide(dotIdx)}
                  aria-label={`Ir para cartão ${dotIdx + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    dotIdx === safeActiveSlide
                      ? "w-8 h-2.5 bg-lime-400 shadow-[0_0_12px_rgba(204,255,0,0.6)]"
                      : "w-2.5 h-2.5 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* 3. DETALHAMENTO DO CARTÃO ATIVO SELECIONADO NO CARROSSEL */}
          {activeCard && (
            <div className="w-full rounded-[32px] liquid-glass p-5 sm:p-6 flex flex-col gap-4 border border-white/[0.14] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <BankCardFavicon cardName={activeCard.cardName} size={28} />
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {activeCard.cardName}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {activeCard.isDefault ? "Cartão Padrão de Compras" : "Cartão Adicional"}
                    </p>
                  </div>
                </div>

                {/* Badge de Fechamento */}
                <div className="px-3 py-1 rounded-full liquid-glass text-xs font-bold text-lime-400 border border-lime-400/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fecha em {activeCard.closingDays} dias</span>
                </div>
              </div>

              {/* Fatura Atual vs Limite Disponível */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl liquid-glass border border-white/[0.06] flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-zinc-400">Fatura Atual</span>
                  <span
                    className={`text-xl font-black tracking-tight text-white ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(activeCard.spent)}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">
                    {activeCard.percentage}% do limite utilizado
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass border border-white/[0.06] flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-zinc-400">Limite Disponível</span>
                  <span
                    className={`text-xl font-black tracking-tight text-lime-400 ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(Math.max(0, activeCard.limit - activeCard.spent))}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">
                    Limite total: R$ {formatCurrency(activeCard.limit)}
                  </span>
                </div>
              </div>

              {/* Barra de Consumo Individual */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span>Utilização deste cartão</span>
                  <span className="font-bold text-zinc-300">
                    R$ {formatCurrency(activeCard.spent)} / R$ {formatCurrency(activeCard.limit)}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeCard.percentage >= 80
                        ? "bg-gradient-to-r from-amber-500 to-rose-500"
                        : activeCard.percentage >= 50
                        ? "bg-gradient-to-r from-lime-400 to-amber-400"
                        : "bg-gradient-to-r from-emerald-400 to-lime-400"
                    }`}
                    style={{ width: `${Math.min(100, activeCard.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Datas Críticas (Fechamento, Vencimento e Melhor Compra) */}
              <div className="p-3.5 rounded-2xl liquid-glass border border-white/[0.08] grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center justify-center border-r border-white/10 pr-2">
                  <span className="text-[10px] text-zinc-400 font-semibold">Fechamento</span>
                  <span className="text-sm font-extrabold text-white mt-0.5">
                    Dia {activeCard.closingDay || 24}
                  </span>
                  <span className="text-[9px] text-lime-400 font-medium mt-0.5">
                    {activeCard.closingDays} dias
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center border-r border-white/10 px-2">
                  <span className="text-[10px] text-zinc-400 font-semibold">Vencimento</span>
                  <span className="text-sm font-extrabold text-white mt-0.5">
                    Dia {activeCard.dueDay || 1}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium mt-0.5">Pagar fatura</span>
                </div>

                <div className="flex flex-col items-center justify-center pl-2">
                  <span className="text-[10px] text-zinc-400 font-semibold">Melhor Compra</span>
                  <span className="text-sm font-extrabold text-amber-300 mt-0.5">
                    Dia {(activeCard.closingDay || 24) === 31 ? 1 : (activeCard.closingDay || 24) + 1}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium mt-0.5">Mais prazo</span>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO TOTALMENTE ARREDONDADOS COM EFEITO LIQUID GLASS */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {!activeCard.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(activeCard)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-btn text-xs font-bold text-zinc-200 hover:text-white cursor-pointer"
                      title="Definir como cartão padrão para lançamentos rápidos"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-300" />
                      <span>Tornar padrão</span>
                    </button>
                  )}

                  {onOpenExtratoWithCard && activeCard.id && (
                    <button
                      type="button"
                      onClick={() => onOpenExtratoWithCard(activeCard.id!)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-btn text-xs font-bold text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <span>Ver compras</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => openEditModal(activeCard)}
                    className="w-10 h-10 rounded-full liquid-glass-btn flex items-center justify-center text-white cursor-pointer"
                    title="Editar informações do cartão"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardToDelete(activeCard)}
                    className="w-10 h-10 rounded-full liquid-glass-btn-danger flex items-center justify-center cursor-pointer"
                    title="Excluir este cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ADICIONAR OU EDITAR CARTÃO COM BOTÕES ARREDONDADOS & LIQUID GLASS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md liquid-glass border border-white/20 rounded-[36px] p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto no-scrollbar relative bg-[#0e0f14]">
            {/* Fechar Arredondado */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full liquid-glass-btn flex items-center justify-center text-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white">
                {editingCard ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}
              </h3>
              <p className="text-xs text-zinc-400">
                {editingCard
                  ? "Ajuste limites, datas de fatura e visual deste cartão."
                  : "Cadastre um novo cartão para gerenciar limites e faturas."}
              </p>
            </div>

            {/* LIVE PREVIEW DO CARTÃO COM HEIGHT AUMENTADO */}
            <div
              className="w-full rounded-[24px] p-5 overflow-hidden flex flex-col justify-between min-h-[160px] shadow-xl border border-white/25 select-none relative transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${formColor} 0%, #111217 70%, #050608 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-white drop-shadow-md">
                  {formName.trim() || "Nome do Cartão"}
                </span>
                {formIsDefault && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full liquid-glass text-white border border-white/30">
                    PADRÃO
                  </span>
                )}
              </div>

              <div className="my-2 flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-amber-400/90 shadow-sm" />
                <span className="text-xs font-mono font-bold tracking-widest text-white/90">
                  •••• •••• •••• 4242
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-1 border-t border-white/10">
                <span>{userName.toUpperCase()}</span>
                <span>
                  Fecha dia {formClosingDay} • Vence dia {formDueDay}
                </span>
              </div>
            </div>

            {/* PRESETS DE BANCOS ARREDONDADOS */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-zinc-400">
                Bancos Populares (preenchimento rápido)
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {BANK_PRESETS.map((bp) => (
                  <button
                    key={bp.name}
                    type="button"
                    onClick={() => applyBankPreset(bp)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full liquid-glass-btn text-xs font-semibold text-zinc-200 hover:text-white shrink-0 cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: bp.color }}
                    />
                    <span>{bp.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FORMULÁRIO */}
            <form onSubmit={handleSaveCard} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Nome do Cartão / Instituição
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Nubank Ultravioleta, Santander..."
                  className="w-full liquid-glass-input rounded-full px-5 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Limite de Crédito Total (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-3 text-sm text-zinc-400 font-bold">R$</span>
                  <input
                    type="text"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    placeholder="6.000,00"
                    className="w-full liquid-glass-input rounded-full pl-12 pr-5 py-3 text-sm font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-300">Dia de Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formClosingDay}
                    onChange={(e) => setFormClosingDay(e.target.value)}
                    placeholder="24"
                    className="w-full liquid-glass-input rounded-full px-5 py-3 text-sm font-bold text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 pl-2">Dia do fechamento</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-300">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(e.target.value)}
                    placeholder="1"
                    className="w-full liquid-glass-input rounded-full px-5 py-3 text-sm font-bold text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 pl-2">Dia do vencimento</span>
                </div>
              </div>

              {/* Seletor de Cores */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-300">Cor do Cartão</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      className={`w-8 h-8 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                        formColor === col
                          ? "scale-115 ring-2 ring-white ring-offset-2 ring-offset-black shadow-lg"
                          : "hover:scale-105 opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {formColor === col && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Padrão Arredondado */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl liquid-glass border border-white/10 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded-full text-lime-400 focus:ring-0 focus:outline-none bg-black border-white/30"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Definir como cartão padrão</span>
                  <span className="text-[10px] text-zinc-400">
                    Novos lançamentos no crédito assumirão esta opção automaticamente
                  </span>
                </div>
              </label>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Botões Salvar / Cancelar Arredondados */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-full liquid-glass-btn font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-full liquid-glass-btn-accent font-black text-xs cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Salvando...</span>
                  ) : (
                    <span>{editingCard ? "Salvar Alterações" : "Cadastrar Cartão"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO ARREDONDADO */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-sm liquid-glass border border-rose-500/40 rounded-[36px] p-6 shadow-2xl flex flex-col gap-4 text-center bg-[#140e10]/90">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-md">
              <Trash2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Excluir Cartão?</h3>
              <p className="text-xs text-zinc-400">
                Tem certeza que deseja remover o cartão{" "}
                <span className="font-bold text-white">{cardToDelete.cardName}</span>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="flex-1 py-3 rounded-full liquid-glass-btn font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCard}
                className="flex-1 py-3 rounded-full liquid-glass-btn-danger font-bold text-xs cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

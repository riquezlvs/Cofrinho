"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Check,
  MinusCircle,
  PlusCircle,
  ChevronDown,
  Users,
  UserPlus,
  Calendar,
  Clock,
  AlertCircle,
  CreditCard,
  Wallet,
  Banknote,
  Layers,
  ShoppingCart,
  Car,
  Pill,
  Music,
  Home,
  Coffee,
  Utensils,
  Bike,
  ShoppingBag,
  Globe,
  Smartphone,
  Zap,
  Wifi,
  Wrench,
  Fuel,
  Bus,
  Tv,
  Ticket,
  Gamepad2,
  Plane,
  HeartPulse,
  Stethoscope,
  Dumbbell,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  RotateCcw,
  Award,
  Coins,
  Tag,
  ChevronLeft,
  ChevronRight,
  Trash2,
  History,
  Landmark,
  Receipt,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { ExtratoData, ExtratoTransaction, InstallmentScheduleItem, Person } from "@/types/finance";
import {
  addTransactionAction,
  createPersonAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/actions/transactions";
import { addMonths, formatLongPortugueseDate } from "@/lib/dateUtils";
import { getGoogleFaviconUrl } from "@/lib/brands";

export interface ExtratoClientProps {
  initialData: ExtratoData;
  embedded?: boolean;
  isPrivacyHidden?: boolean;
  onTogglePrivacy?: () => void;
  onNavigateToHome?: () => void;
  onAskCofrinho?: () => void;
  onOpenMascot?: () => void;
  onOverlayChange?: (isOpen: boolean) => void;
}

type FilterType = "all" | "income" | "expense" | "payment";
type PeriodFilter =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "last15days"
  | "currentMonth"
  | "lastMonth"
  | "last6months"
  | "thisYear"
  | "lastYear"
  | "custom";
type SortOrder = "recent" | "oldest" | "highest" | "lowest";

interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  color: string;
  parentName: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  color: string;
  iconName: string;
  type: "expense" | "income";
  items: CategoryItem[];
}

const expenseCategoryGroups: CategoryGroup[] = [
  {
    id: "grp-alimentacao",
    name: "Alimentação",
    color: "#f97316",
    iconName: "cart",
    type: "expense",
    items: [
      { id: "sub-supermercado", name: "Supermercado", iconName: "cart", color: "#f97316", parentName: "Alimentação" },
      { id: "sub-alimentos-bebidas", name: "Alimentos e bebidas", iconName: "coffee", color: "#f97316", parentName: "Alimentação" },
      { id: "sub-restaurantes", name: "Restaurantes, bares e lanchonetes", iconName: "utensils", color: "#f97316", parentName: "Alimentação" },
      { id: "sub-delivery", name: "Delivery de alimentos", iconName: "bike", color: "#f97316", parentName: "Alimentação" },
    ],
  },
  {
    id: "grp-compras",
    name: "Compras",
    color: "#ec4899",
    iconName: "bag",
    type: "expense",
    items: [
      { id: "sub-compras", name: "Compras", iconName: "bag", color: "#ec4899", parentName: "Compras" },
      { id: "sub-compras-online", name: "Compras online", iconName: "globe", color: "#ec4899", parentName: "Compras" },
      { id: "sub-eletronicos", name: "Eletrônicos", iconName: "smartphone", color: "#ec4899", parentName: "Compras" },
    ],
  },
  {
    id: "grp-moradia",
    name: "Moradia & Contas",
    color: "#f59e0b",
    iconName: "home",
    type: "expense",
    items: [
      { id: "sub-aluguel", name: "Aluguel e Condomínio", iconName: "home", color: "#f59e0b", parentName: "Moradia & Contas" },
      { id: "sub-luz-agua-gas", name: "Contas de Luz, Água e Gás", iconName: "zap", color: "#f59e0b", parentName: "Moradia & Contas" },
      { id: "sub-internet", name: "Internet e Telefonia", iconName: "wifi", color: "#f59e0b", parentName: "Moradia & Contas" },
      { id: "sub-manutencao", name: "Manutenção e Reformas", iconName: "wrench", color: "#f59e0b", parentName: "Moradia & Contas" },
    ],
  },
  {
    id: "grp-transporte",
    name: "Transporte",
    color: "#38bdf8",
    iconName: "car",
    type: "expense",
    items: [
      { id: "sub-combustivel", name: "Combustível", iconName: "fuel", color: "#38bdf8", parentName: "Transporte" },
      { id: "sub-uber", name: "Aplicativos (Uber / 99)", iconName: "car", color: "#38bdf8", parentName: "Transporte" },
      { id: "sub-transporte-pub", name: "Transporte público", iconName: "bus", color: "#38bdf8", parentName: "Transporte" },
      { id: "sub-estacionamento", name: "Estacionamento e pedágio", iconName: "ticket", color: "#38bdf8", parentName: "Transporte" },
    ],
  },
  {
    id: "grp-lazer",
    name: "Lazer & Streaming",
    color: "#a855f7",
    iconName: "music",
    type: "expense",
    items: [
      { id: "sub-streaming", name: "Streaming & Assinaturas", iconName: "tv", color: "#a855f7", parentName: "Lazer & Streaming" },
      { id: "sub-cinema", name: "Cinema, Shows e Festas", iconName: "ticket", color: "#a855f7", parentName: "Lazer & Streaming" },
      { id: "sub-jogos", name: "Jogos e Hobbies", iconName: "gamepad", color: "#a855f7", parentName: "Lazer & Streaming" },
      { id: "sub-viagens", name: "Viagens e Passeios", iconName: "plane", color: "#a855f7", parentName: "Lazer & Streaming" },
    ],
  },
  {
    id: "grp-saude",
    name: "Saúde & Cuidados",
    color: "#f43f5e",
    iconName: "heart",
    type: "expense",
    items: [
      { id: "sub-farmacia", name: "Farmácia e Medicamentos", iconName: "pill", color: "#f43f5e", parentName: "Saúde & Cuidados" },
      { id: "sub-consultas", name: "Consultas e Exames", iconName: "stethoscope", color: "#f43f5e", parentName: "Saúde & Cuidados" },
      { id: "sub-academia", name: "Academia e Esportes", iconName: "dumbbell", color: "#f43f5e", parentName: "Saúde & Cuidados" },
    ],
  },
  {
    id: "grp-outros",
    name: "Outros",
    color: "#71717a",
    iconName: "tag",
    type: "expense",
    items: [
      { id: "sub-presentes", name: "Presentes e Doações", iconName: "gift", color: "#71717a", parentName: "Outros" },
      { id: "sub-taxas", name: "Impostos e Tarifas", iconName: "tag", color: "#71717a", parentName: "Outros" },
      { id: "sub-outros", name: "Outras despesas", iconName: "tag", color: "#71717a", parentName: "Outros" },
    ],
  },
];

const incomeCategoryGroups: CategoryGroup[] = [
  {
    id: "grp-renda",
    name: "Renda & Entradas",
    color: "#52e374",
    iconName: "briefcase",
    type: "income",
    items: [
      { id: "sub-salario", name: "Salário", iconName: "briefcase", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-freelance", name: "Freelance & Serviços", iconName: "laptop", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-vr", name: "VR / VA (Benefício)", iconName: "utensils", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-investimentos", name: "Investimentos & Rendimentos", iconName: "trending-up", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-reembolso", name: "Reembolso", iconName: "rotate-ccw", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-bonus", name: "Bônus e Presentes", iconName: "award", color: "#52e374", parentName: "Renda & Entradas" },
      { id: "sub-outras-entradas", name: "Outras Entradas", iconName: "coins", color: "#52e374", parentName: "Renda & Entradas" },
    ],
  },
];

function renderCategoryItemIcon(iconName: string, color: string, className = "w-4.5 h-4.5") {
  switch (iconName) {
    case "cart":
      return <ShoppingCart className={className} style={{ color }} />;
    case "coffee":
      return <Coffee className={className} style={{ color }} />;
    case "utensils":
      return <Utensils className={className} style={{ color }} />;
    case "bike":
      return <Bike className={className} style={{ color }} />;
    case "bag":
      return <ShoppingBag className={className} style={{ color }} />;
    case "globe":
      return <Globe className={className} style={{ color }} />;
    case "smartphone":
      return <Smartphone className={className} style={{ color }} />;
    case "home":
      return <Home className={className} style={{ color }} />;
    case "zap":
      return <Zap className={className} style={{ color }} />;
    case "wifi":
      return <Wifi className={className} style={{ color }} />;
    case "wrench":
      return <Wrench className={className} style={{ color }} />;
    case "car":
      return <Car className={className} style={{ color }} />;
    case "fuel":
      return <Fuel className={className} style={{ color }} />;
    case "bus":
      return <Bus className={className} style={{ color }} />;
    case "music":
      return <Music className={className} style={{ color }} />;
    case "tv":
      return <Tv className={className} style={{ color }} />;
    case "ticket":
      return <Ticket className={className} style={{ color }} />;
    case "gamepad":
      return <Gamepad2 className={className} style={{ color }} />;
    case "plane":
      return <Plane className={className} style={{ color }} />;
    case "pill":
      return <Pill className={className} style={{ color }} />;
    case "stethoscope":
      return <Stethoscope className={className} style={{ color }} />;
    case "dumbbell":
      return <Dumbbell className={className} style={{ color }} />;
    case "gift":
      return <Gift className={className} style={{ color }} />;
    case "briefcase":
      return <Briefcase className={className} style={{ color }} />;
    case "laptop":
      return <Laptop className={className} style={{ color }} />;
    case "trending-up":
      return <TrendingUp className={className} style={{ color }} />;
    case "rotate-ccw":
      return <RotateCcw className={className} style={{ color }} />;
    case "award":
      return <Award className={className} style={{ color }} />;
    case "coins":
      return <Coins className={className} style={{ color }} />;
    default:
      return <Tag className={className} style={{ color }} />;
  }
}

function renderCategoryGroupHeaderIcon(iconName: string, className = "w-5 h-5 text-white") {
  switch (iconName) {
    case "cart":
      return <ShoppingCart className={className} />;
    case "bag":
      return <ShoppingBag className={className} />;
    case "home":
      return <Home className={className} />;
    case "car":
      return <Car className={className} />;
    case "music":
      return <Music className={className} />;
    case "heart":
      return <HeartPulse className={className} />;
    case "briefcase":
      return <Briefcase className={className} />;
    default:
      return <Tag className={className} />;
  }
}

function getPaymentMethodDetails(method?: string) {
  switch (method) {
    case "credit":
      return {
        label: "Cartão de Crédito",
        shortLabel: "Crédito",
        icon: CreditCard,
        color: "text-amber-400",
        badgeBg: "bg-amber-400/10 text-amber-300 border-amber-400/20",
      };
    case "debit":
      return {
        label: "Cartão de Débito",
        shortLabel: "Débito",
        icon: CreditCard,
        color: "text-sky-400",
        badgeBg: "bg-sky-400/10 text-sky-300 border-sky-400/20",
      };
    case "pix":
      return {
        label: "Pix",
        shortLabel: "Pix",
        icon: Zap,
        color: "text-emerald-400",
        badgeBg: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      };
    case "vr":
      return {
        label: "Vale Refeição",
        shortLabel: "VR",
        icon: Utensils,
        color: "text-orange-400",
        badgeBg: "bg-orange-400/10 text-orange-300 border-orange-400/20",
      };
    case "va":
      return {
        label: "Vale Alimentação",
        shortLabel: "VA",
        icon: Utensils,
        color: "text-lime-400",
        badgeBg: "bg-lime-400/10 text-lime-300 border-lime-400/20",
      };
    case "cash":
      return {
        label: "Dinheiro em Espécie",
        shortLabel: "Dinheiro",
        icon: Banknote,
        color: "text-emerald-400",
        badgeBg: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      };
    default:
      return {
        label: "Outros",
        shortLabel: "Outros",
        icon: Wallet,
        color: "text-zinc-400",
        badgeBg: "bg-zinc-800 text-zinc-300 border-white/10",
      };
  }
}

function getAccountTypeLabel(accountType?: string, paymentMethod?: string, accountName?: string) {
  if (paymentMethod === "cash" || accountType === "cash") {
    return "Dinheiro em Espécie";
  }
  if (accountType === "credit" || paymentMethod === "credit") {
    return "Cartão de Crédito";
  }
  if (
    accountType === "vr" ||
    accountType === "va" ||
    paymentMethod === "vr" ||
    paymentMethod === "va" ||
    (accountName && (accountName.toLowerCase().includes("vr") || accountName.toLowerCase().includes("refeição")))
  ) {
    return "Benefício (VR/VA)";
  }
  if (accountType === "savings") {
    return "Conta Poupança";
  }
  if (accountType === "checking") {
    return "Conta Corrente";
  }
  return "Conta Bancária";
}

function getAccountLogoType(
  accountName?: string,
  accountOrCard?: string,
  paymentMethod?: string
): "santander" | "nubank" | "vr" | "cash" | "itau" | "inter" | "bradesco" | "other" {
  const str = `${accountName || ""} ${accountOrCard || ""} ${paymentMethod || ""}`.toLowerCase();
  if (str.includes("santander")) return "santander";
  if (str.includes("nu") || str.includes("nubank") || str.includes("roxinho")) return "nubank";
  if (
    str.includes("vr") ||
    str.includes("refeição") ||
    str.includes("refeicao") ||
    str.includes("alimentação") ||
    str.includes("sodexo") ||
    str.includes("alelo") ||
    str.includes("flash")
  )
    return "vr";
  if (
    str.includes("dinheiro") ||
    str.includes("espécie") ||
    str.includes("especie") ||
    str.includes("cash") ||
    paymentMethod === "cash"
  )
    return "cash";
  if (str.includes("itau") || str.includes("itaú")) return "itau";
  if (str.includes("inter")) return "inter";
  if (str.includes("bradesco")) return "bradesco";
  return "other";
}

export function SantanderIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-full bg-[#ec0000] flex items-center justify-center shrink-0 shadow-sm`}
    >
      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.8c-.8.8-2 .9-2.9.4-.9-.6-1.5-1.5-1.9-2.4l-.1-.2-.1.2c-.4.9-1 1.8-1.9 2.4-.9.5-2.1.4-2.9-.4-.7-.7-.8-1.8-.3-2.6.4-.7 1.2-1.2 2-1.4l.7-.2-.5-.5c-.8-.7-1-1.8-.5-2.7.5-.9 1.5-1.3 2.5-1.1.9.2 1.6.8 1.9 1.7l.2.6.2-.6c.3-.9 1-1.5 1.9-1.7 1-.2 2 .2 2.5 1.1.5.9.3 2-.5 2.7l-.5.5.7.2c.8.2 1.6.7 2 1.4.5.8.4 1.9-.3 2.6z" />
      </svg>
    </div>
  );
}

export function CarteiraPierreIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-full bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm`}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
        <rect width="40" height="40" fill="#09090b" />
        <path d="M4 0 L8 40 M12 0 L15 40 M25 0 L28 40 M32 0 L36 40" stroke="#ffffff" strokeWidth="2.5" />
        <path
          d="M13 14 C13 11 16 11 17 14 C18 15 22 15 23 14 C24 11 27 11 27 14 C28 18 28 26 27 28 C25 31 15 31 13 28 C12 26 12 18 13 14 Z"
          fill="#09090b"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        <circle cx="17.5" cy="20" r="1.3" fill="#ffffff" />
        <circle cx="22.5" cy="20" r="1.3" fill="#ffffff" />
        <path d="M19 23 L21 23 L20 24.5 Z" fill="#ffffff" />
        <line x1="13.5" y1="21.5" x2="16.5" y2="22" stroke="#ffffff" strokeWidth="1" />
        <line x1="23.5" y1="22" x2="26.5" y2="21.5" stroke="#ffffff" strokeWidth="1" />
      </svg>
    </div>
  );
}

const filterCategoryPresets = [
  { id: "cat-alimentacao", name: "Alimentação", icon: ShoppingCart, color: "#f97316" },
  { id: "cat-compras", name: "Compras", icon: ShoppingBag, color: "#ec4899" },
  { id: "cat-transporte", name: "Transporte", icon: Car, color: "#f59e0b" },
  { id: "cat-financas", name: "Finanças", icon: Landmark, color: "#93c5fd" },
  { id: "cat-renda", name: "Renda", icon: TrendingUp, color: "#86efac" },
  { id: "cat-impostos", name: "Impostos e taxas", icon: Receipt, color: "#cbd5e1" },
  { id: "cat-seguros", name: "Seguros", icon: ShieldCheck, color: "#67e8f9" },
  { id: "cat-outros", name: "Outros", icon: MoreHorizontal, color: "#a1a1aa" },
  { id: "cat-moradia", name: "Moradia & Contas", icon: Home, color: "#f59e0b" },
  { id: "cat-lazer", name: "Lazer & Streaming", icon: Music, color: "#a855f7" },
  { id: "cat-saude", name: "Saúde", icon: HeartPulse, color: "#f43f5e" },
  { id: "cat-investimentos", name: "Investimentos", icon: Coins, color: "#38bdf8" },
];

const periodPills: { id: PeriodFilter; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "last7days", label: "Últimos 7 dias" },
  { id: "last15days", label: "Últimos 15 dias" },
  { id: "currentMonth", label: "Mês atual" },
  { id: "lastMonth", label: "Mês passado" },
  { id: "last6months", label: "Últimos 6 meses" },
  { id: "thisYear", label: "Este ano" },
  { id: "lastYear", label: "Ano passado" },
  { id: "custom", label: "Personalizado", icon: Calendar },
];

const sortOptions: { id: SortOrder; label: string }[] = [
  { id: "recent", label: "Mais recentes" },
  { id: "oldest", label: "Mais antigas" },
  { id: "highest", label: "Maior valor" },
  { id: "lowest", label: "Menor valor" },
];



export function AccountBadge({
  tx,
  customClasses,
}: {
  tx: ExtratoTransaction;
  customClasses?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const logo = getAccountLogoType(tx.accountName, tx.accountOrCard, tx.paymentMethod);
  const baseClass = customClasses || "absolute -bottom-1 -right-1 w-5 h-5";

  if (logo === "cash") {
    return (
      <div
        title="Dinheiro em Espécie"
        className={`${baseClass} rounded-full bg-emerald-600 border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
      >
        <Banknote className="w-2.5 h-2.5 text-white stroke-[2.5]" />
      </div>
    );
  }

  const bankConfigs: Record<string, { domain: string; name: string }> = {
    santander: { domain: "santander.com.br", name: "Santander" },
    nubank: { domain: "nubank.com.br", name: "Nubank" },
    vr: { domain: "vr.com.br", name: "VR Benefícios" },
    itau: { domain: "itau.com.br", name: "Itaú" },
    inter: { domain: "inter.co", name: "Banco Inter" },
    bradesco: { domain: "bradesco.com.br", name: "Bradesco" },
  };

  const config = bankConfigs[logo];

  // Se tiver domínio configurado e imagem ainda não falhou, renderiza o logo original da empresa
  if (config && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(config.domain, 64);
    return (
      <div
        title={config.name}
        className={`${baseClass} rounded-full bg-[#1b1c22] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0 overflow-hidden`}
      >
        <img
          src={faviconUrl}
          alt={config.name}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallbacks elegantes SVG/monograma
  switch (logo) {
    case "santander":
      return (
        <div
          title="Santander"
          className={`${baseClass} rounded-full bg-[#ec0000] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.8c-.8.8-2 .9-2.9.4-.9-.6-1.5-1.5-1.9-2.4l-.1-.2-.1.2c-.4.9-1 1.8-1.9 2.4-.9.5-2.1.4-2.9-.4-.7-.7-.8-1.8-.3-2.6.4-.7 1.2-1.2 2-1.4l.7-.2-.5-.5c-.8-.7-1-1.8-.5-2.7.5-.9 1.5-1.3 2.5-1.1.9.2 1.6.8 1.9 1.7l.2.6.2-.6c.3-.9 1-1.5 1.9-1.7 1-.2 2 .2 2.5 1.1.5.9.3 2-.5 2.7l-.5.5.7.2c.8.2 1.6.7 2 1.4.5.8.4 1.9-.3 2.6z" />
          </svg>
        </div>
      );
    case "nubank":
      return (
        <div
          title="Nubank"
          className={`${baseClass} rounded-full bg-[#820AD1] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <span className="text-[9px] font-black tracking-tighter text-white leading-none">Nu</span>
        </div>
      );
    case "vr":
      return (
        <div
          title="Vale Refeição / Benefício"
          className={`${baseClass} rounded-full bg-amber-500 border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
          </svg>
        </div>
      );
    case "itau":
      return (
        <div
          title="Itaú"
          className={`${baseClass} rounded-full bg-[#ec7000] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <span className="text-[8px] font-black text-white leading-none">it</span>
        </div>
      );
    case "inter":
      return (
        <div
          title="Inter"
          className={`${baseClass} rounded-full bg-[#ff7a00] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <span className="text-[8px] font-black text-white leading-none">in</span>
        </div>
      );
    case "bradesco":
      return (
        <div
          title="Bradesco"
          className={`${baseClass} rounded-full bg-[#cc092f] border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0`}
        >
          <span className="text-[9px] font-black text-white leading-none">B</span>
        </div>
      );
    default:
      const initial = (tx.accountName || tx.accountOrCard || "C")[0].toUpperCase();
      return (
        <div
          title={tx.accountName || tx.accountOrCard || "Conta"}
          className={`${baseClass} rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center shadow-md shrink-0 text-[9px] font-bold text-zinc-200`}
        >
          {initial}
        </div>
      );
  }
}

export function ExtratoClient({
  initialData,
  embedded = false,
  isPrivacyHidden: externalPrivacy,
  onTogglePrivacy: externalTogglePrivacy,
  onNavigateToHome,
  onAskCofrinho,
  onOpenMascot,
  onOverlayChange,
}: ExtratoClientProps) {
  const router = useRouter();

  // Estados principais de transações
  const [transactions, setTransactions] = useState<ExtratoTransaction[]>(
    initialData.transactions || []
  );
  const [internalPrivacy, setInternalPrivacy] = useState(false);
  const isPrivacyHidden = externalPrivacy !== undefined ? externalPrivacy : internalPrivacy;

  const handleTogglePrivacy = () => {
    if (externalTogglePrivacy) {
      externalTogglePrivacy();
    } else {
      setInternalPrivacy((prev) => !prev);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Modais
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [searchCatQuery, setSearchCatQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<ExtratoTransaction | null>(null);
  const [isEditingSelectedTxCategory, setIsEditingSelectedTxCategory] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editTxTitle, setEditTxTitle] = useState("");
  const [editTxCentsAmount, setEditTxCentsAmount] = useState(0);
  const [editTxDate, setEditTxDate] = useState("");
  const [editTxTime, setEditTxTime] = useState("");
  const [editTxPaymentMethod, setEditTxPaymentMethod] = useState<string>("credit");

  // Estado unificado de overlays para ocultar o navbar flutuante e evitar sobreposição com botões
  const isAnyOverlayOpen = Boolean(
    isNewTxModalOpen ||
    isEditTxModalOpen ||
    selectedTx !== null ||
    isCategoryPickerOpen ||
    isFilterSheetOpen ||
    isConfirmDeleteOpen
  );

  useEffect(() => {
    onOverlayChange?.(isAnyOverlayOpen);
  }, [isAnyOverlayOpen, onOverlayChange]);

  // Filtros avançados adaptados às imagens do anexo
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("currentMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [isCategoryPickerForFilter, setIsCategoryPickerForFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [showHidden, setShowHidden] = useState(false);

  // Categorias, contas e pessoas do banco de dados / fallback
  const availableCategories = useMemo(() => {
    return (
      initialData.categories || [
        { id: "cat-1", name: "Alimentação", type: "expense", color: "#ccff00" },
        { id: "cat-2", name: "Moradia & Contas", type: "expense", color: "#f59e0b" },
        { id: "cat-3", name: "Transporte", type: "expense", color: "#38bdf8" },
        { id: "cat-4", name: "Lazer & Streaming", type: "expense", color: "#a855f7" },
        { id: "cat-5", name: "Saúde", type: "expense", color: "#ec4899" },
        { id: "cat-6", name: "Salário & Freelance", type: "income", color: "#52e374" },
        { id: "cat-7", name: "Investimentos", type: "income", color: "#3b82f6" },
        { id: "cat-8", name: "Outros", type: "expense", color: "#71717a" },
      ]
    );
  }, [initialData.categories]);

  const availableAccounts = useMemo(() => {
    return (
      initialData.accounts || [
        { id: "acc-nubank", name: "Conta Nubank", type: "checking" },
        { id: "acc-vr", name: "Vale Refeição (VR)", type: "vr" },
      ]
    );
  }, [initialData.accounts]);

  const availableCards = useMemo(() => {
    return initialData.creditCards || [];
  }, [initialData.creditCards]);

  // Lista de bancos disponíveis para o filtro: apenas os essenciais Santander e Nubank
  const filterBanksList = useMemo(() => {
    return [
      { id: "acc-santander", name: "Santander", logo: "santander" },
      { id: "acc-nubank", name: "Nubank", logo: "nubank" },
    ];
  }, []);

  const toggleBankFilter = (bankId: string) => {
    setSelectedBankIds((prev) =>
      prev.includes(bankId) ? prev.filter((id) => id !== bankId) : [...prev, bankId]
    );
  };

  const toggleCardFilter = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const toggleCategoryFilter = (catName: string) => {
    setSelectedCategoryNames((prev) =>
      prev.includes(catName) ? prev.filter((n) => n !== catName) : [...prev, catName]
    );
  };

  const filterVisibleCategories = useMemo(() => {
    const base = filterCategoryPresets.slice(0, 8);
    const extraNames = selectedCategoryNames.filter(
      (name) => !base.some((b) => b.name.toLowerCase() === name.toLowerCase())
    );
    const extras = extraNames.map((name) => {
      const found = filterCategoryPresets.find((p) => p.name.toLowerCase() === name.toLowerCase());
      return found || { id: `cat-${name}`, name, icon: Tag, color: "#ccff00" };
    });
    return [...base, ...extras];
  }, [selectedCategoryNames]);

  // Lista de pessoas para rateio (splits)
  const [people, setPeople] = useState<Person[]>(
    initialData.people && initialData.people.length > 0
      ? initialData.people
      : [
          { id: "p-1", name: "Mariana", pixKey: "mariana@pix.com" },
          { id: "p-2", name: "Carlos", phone: "(11) 98765-4321" },
          { id: "p-3", name: "Lucas", pixKey: "lucas@email.com" },
        ]
  );

  // Form de nova transação (conforme campos da tela anexada e requisitos do DB)
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [centsAmount, setCentsAmount] = useState<number>(0);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("2026-11-08");
  const [newTime, setNewTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [newCategoryId, setNewCategoryId] = useState("sub-supermercado");
  const [selectedCategoryName, setSelectedCategoryName] = useState("Supermercado");
  const [selectedCategoryColor, setSelectedCategoryColor] = useState("#f97316");
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState("cart");

  const [newCurrency, setNewCurrency] = useState("BRL");
  const [newPaymentMethod, setNewPaymentMethod] = useState<
    "pix" | "credit" | "debit" | "vr" | "cash"
  >("debit");
  const [newAccountId, setNewAccountId] = useState(
    availableAccounts[0]?.id || "acc-nubank"
  );
  const [isFixedTx, setIsFixedTx] = useState(false);
  const [newInstallmentTotal, setNewInstallmentTotal] = useState<number>(1);

  // Contas e cartões filtrados pelas regras do usuário:
  // 1. Se for VR, mostra APENAS contas/cartões que são VR
  // 2. Se for Dinheiro, não mostra conta
  // 3. Se for Crédito, mostra cartões de crédito
  // 4. Se for Débito / Pix, mostra contas padrão (não isoladas)
  const filteredAccounts = useMemo(() => {
    if (newPaymentMethod === "cash") {
      return [];
    }

    if (newPaymentMethod === "vr") {
      const vrAccs = availableAccounts.filter(
        (acc) =>
          acc.type === "vr" ||
          acc.type === "va" ||
          acc.name.toLowerCase().includes("vr") ||
          acc.name.toLowerCase().includes("vale refeição") ||
          acc.name.toLowerCase().includes("refeicao") ||
          acc.name.toLowerCase().includes("alimentação") ||
          acc.name.toLowerCase().includes("sodexo") ||
          acc.name.toLowerCase().includes("alelo") ||
          acc.name.toLowerCase().includes("flash")
      );
      const vrCards = availableCards.filter(
        (card) =>
          card.name.toLowerCase().includes("vr") ||
          card.name.toLowerCase().includes("vale") ||
          card.name.toLowerCase().includes("refeicao")
      );

      const combined = [
        ...vrAccs,
        ...vrCards.map((c) => ({ id: c.id, name: c.name, type: "vr" })),
      ];

      return combined.length > 0
        ? combined
        : [{ id: "acc-vr", name: "Vale Refeição (VR)", type: "vr" }];
    }

    if (newPaymentMethod === "credit") {
      return availableCards.map((c) => ({ id: c.id, name: c.name, type: "credit" }));
    }

    const normalAccs = availableAccounts.filter((a) => a.type !== "vr" && a.type !== "va");
    return normalAccs.length > 0 ? normalAccs : availableAccounts;
  }, [newPaymentMethod, availableAccounts, availableCards]);

  // Sincroniza a conta selecionada de forma derivada, evitando cascading renders
  const effectiveAccountId = filteredAccounts.some((a) => a.id === newAccountId)
    ? newAccountId
    : (filteredAccounts[0]?.id || "");

  // Alterna tipo (Saída vs Entrada) sincronizando defaults
  const handleTypeChange = (type: "expense" | "income") => {
    setNewType(type);
    setNewInstallmentTotal(1);
    if (type === "expense") {
      setSelectedCategoryName("Supermercado");
      setSelectedCategoryColor("#f97316");
      setSelectedCategoryIcon("cart");
      setNewCategoryId("sub-supermercado");
      if (newPaymentMethod === "cash") {
        // mantém
      } else {
        setNewPaymentMethod("debit");
      }
    } else {
      setSelectedCategoryName("Salário");
      setSelectedCategoryColor("#52e374");
      setSelectedCategoryIcon("briefcase");
      setNewCategoryId("sub-salario");
      setNewPaymentMethod("pix");
    }
  };

  // Grupos de categorias filtrados pela busca
  const filteredCategoryGroups = useMemo(() => {
    const groups = isCategoryPickerForFilter
      ? [...expenseCategoryGroups, ...incomeCategoryGroups]
      : newType === "income"
      ? incomeCategoryGroups
      : expenseCategoryGroups;

    if (!searchCatQuery.trim()) return groups;

    const query = searchCatQuery.toLowerCase().trim();
    return groups
      .map((group) => {
        const groupMatches = group.name.toLowerCase().includes(query);
        const matchingItems = group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            group.name.toLowerCase().includes(query)
        );

        if (groupMatches) return group;
        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
          };
        }
        return null;
      })
      .filter((g): g is CategoryGroup => g !== null);
  }, [isCategoryPickerForFilter, newType, searchCatQuery]);

  // Campos específicos: Dividir gasto (Rachadinha / Split Múltiplo)
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(() => {
    return initialData.people && initialData.people.length > 0
      ? [initialData.people[0].id]
      : ["p-1"];
  });
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [splitPercentage, setSplitPercentage] = useState<number>(50);

  // Toggle de seleção de uma pessoa
  const togglePersonSelection = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // Selecionar todos ou limpar
  const toggleSelectAllPeople = () => {
    if (selectedPersonIds.length === people.length) {
      setSelectedPersonIds([]);
    } else {
      setSelectedPersonIds(people.map((p) => p.id));
    }
  };

  // Cadastro rápido de nova pessoa
  const [isRegisteringPerson, setIsRegisteringPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonPix, setNewPersonPix] = useState("");

  // Campos específicos: Entrada (Renda Fixa / Recorrente)
  const [isFixedIncome, setIsFixedIncome] = useState(false);
  const [incomeDayOfMonth, setIncomeDayOfMonth] = useState<number>(5);
  const [incomeAdjustBusinessDay, setIncomeAdjustBusinessDay] = useState(true);
  const [incomeShiftDirection, setIncomeShiftDirection] = useState<
    "anticipate" | "postpone"
  >("anticipate");

  // Formatador de moedas
  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Data formatada por extenso no padrão da imagem ("8 de Novembro de 2026")
  const formattedDateLabel = useMemo(() => {
    try {
      const [year, month, day] = newDate.split("-").map(Number);
      const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];
      return `${day} de ${monthNames[month - 1]} de ${year}`;
    } catch {
      return newDate;
    }
  }, [newDate]);

  // Input de valor monetário formatado dinamicamente
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits || "0", 10);
    if (num < 1000000000) {
      setCentsAmount(num);
    }
  };

  const formattedInputAmount = useMemo(() => {
    return (centsAmount / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }, [centsAmount]);

  // Cálculo da divisão de gastos (Múltiplas pessoas selecionadas)
  const numSelectedPeople = selectedPersonIds.length;
  const totalAmountNum = centsAmount / 100;

  // Divisão:
  // Modo 'equal': Você + N pessoas (total = N + 1 partes iguais)
  // Modo 'custom': Os amigos dividem splitPercentage% (ex: 50% entre si)
  const perPersonOwed = useMemo(() => {
    if (numSelectedPeople === 0 || totalAmountNum <= 0) return 0;
    if (splitMode === "equal") {
      return Number((totalAmountNum / (numSelectedPeople + 1)).toFixed(2));
    }
    const friendsTotal = (totalAmountNum * splitPercentage) / 100;
    return Number((friendsTotal / numSelectedPeople).toFixed(2));
  }, [numSelectedPeople, totalAmountNum, splitMode, splitPercentage]);

  const perPersonPercent = useMemo(() => {
    if (numSelectedPeople === 0) return 0;
    if (splitMode === "equal") {
      return Math.round(100 / (numSelectedPeople + 1));
    }
    return Math.round(splitPercentage / numSelectedPeople);
  }, [numSelectedPeople, splitMode, splitPercentage]);

  const totalOwedByFriends = useMemo(() => {
    return Number((perPersonOwed * numSelectedPeople).toFixed(2));
  }, [perPersonOwed, numSelectedPeople]);

  const myPartNum = useMemo(() => {
    return Number(Math.max(0, totalAmountNum - totalOwedByFriends).toFixed(2));
  }, [totalAmountNum, totalOwedByFriends]);

  const selectedPersonNames = useMemo(() => {
    return selectedPersonIds
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];
  }, [selectedPersonIds, people]);

  // Validação para cartão cadastrado:
  // Se a forma for crédito e não houver cartões, bloqueia e avisa
  const isCreditCardMissing = newPaymentMethod === "credit" && availableCards.length === 0;

  // Pode submeter?
  const canSubmitTransaction = useMemo(() => {
    if (centsAmount <= 0) return false;
    if (!newTitle.trim()) return false;
    if (isCreditCardMissing) return false;
    if (newType === "expense" && isSplitEnabled && numSelectedPeople === 0) return false;
    return true;
  }, [centsAmount, newTitle, isCreditCardMissing, newType, isSplitEnabled, numSelectedPeople]);

  // Quantidade de filtros aplicados
  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilter !== "all") count += 1;
    if (periodFilter !== "all" && periodFilter !== "currentMonth") count += 1;
    if (sortOrder !== "recent") count += 1;
    count += selectedBankIds.length;
    count += selectedCardIds.length;
    count += selectedCategoryNames.length;
    if (showHidden) count += 1;
    return count;
  }, [
    activeFilter,
    periodFilter,
    sortOrder,
    selectedBankIds,
    selectedCardIds,
    selectedCategoryNames,
    showHidden,
  ]);

  const isAnyFilterActive = appliedFilterCount > 0;

  // Alternar filtro rápido
  const handleFilterSelect = (type: FilterType) => {
    setActiveFilter((prev) => (prev === type ? "all" : type));
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
    setPeriodFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedBankIds([]);
    setSelectedCardIds([]);
    setSelectedCategoryNames([]);
    setSortOrder("recent");
    setShowHidden(false);
  };

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    const todayStr = "2026-11-08";
    const refDate = new Date();

    return transactions
      .filter((tx) => {
        // 0. Filtro ocultos: se showHidden for false e a transação estiver oculta, não exibe
        if (!showHidden && tx.isHidden) {
          return false;
        }

        // 1. Filtro por tipo
        if (activeFilter === "income" && tx.type !== "income") return false;
        if (activeFilter === "expense" && tx.type !== "expense") return false;
        if (activeFilter === "payment") {
          const m = (tx.paymentMethod || "").toLowerCase();
          const d = (tx.description || "").toLowerCase();
          const isPay =
            m.includes("credit") ||
            m.includes("debit") ||
            m.includes("cartão") ||
            m.includes("boleto") ||
            d.includes("cartão") ||
            d.includes("fatura");
          if (!isPay) return false;
        }

        // 2. Filtro por busca
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const title = (tx.title || "").toLowerCase();
          const desc = (tx.description || "").toLowerCase();
          const cat = (tx.categoryName || "").toLowerCase();
          const method = (tx.paymentMethod || "").toLowerCase();
          const account = (tx.accountName || tx.accountOrCard || "").toLowerCase();
          const amountStr = tx.amount.toString();
          if (
            !title.includes(query) &&
            !desc.includes(query) &&
            !cat.includes(query) &&
            !method.includes(query) &&
            !account.includes(query) &&
            !amountStr.includes(query)
          ) {
            return false;
          }
        }

        // 3. Filtro por período
        const txDateStr = tx.transactionDate?.includes("T")
          ? tx.transactionDate.split("T")[0]
          : tx.transactionDate || "";

        if (periodFilter !== "all" && txDateStr) {
          const [y, m, d] = txDateStr.split("-").map(Number);
          const txDate = new Date(y, m - 1, d);

          const refYear = refDate.getFullYear();
          const refMonth = refDate.getMonth();
          const refDay = refDate.getDate();
          const todayDate = new Date(refYear, refMonth, refDay);

          if (periodFilter === "today") {
            const isToday =
              txDateStr === todayStr ||
              (y === refYear && m - 1 === refMonth && d === refDay);
            if (!isToday) return false;
          } else if (periodFilter === "yesterday") {
            const yesterdayDate = new Date(refYear, refMonth, refDay - 1);
            const yParts = yesterdayDate.toISOString().split("T")[0];
            const isYesterday = txDateStr === "2026-11-07" || txDateStr === yParts;
            if (!isYesterday) return false;
          } else if (periodFilter === "last7days") {
            const past7 = new Date(refYear, refMonth, refDay - 7);
            if (txDate < past7 || txDate > todayDate) return false;
          } else if (periodFilter === "last15days") {
            const past15 = new Date(refYear, refMonth, refDay - 15);
            if (txDate < past15 || txDate > todayDate) return false;
          } else if (periodFilter === "currentMonth") {
            const isCurrMonth = y === refYear && m - 1 === refMonth;
            if (!isCurrMonth) return false;
          } else if (periodFilter === "lastMonth") {
            const lastMonth = refMonth === 0 ? 11 : refMonth - 1;
            const lastMonthYear = refMonth === 0 ? refYear - 1 : refYear;
            if (y !== lastMonthYear || m - 1 !== lastMonth) return false;
          } else if (periodFilter === "last6months") {
            const past6Months = new Date(refYear, refMonth - 6, refDay);
            if (txDate < past6Months || txDate > todayDate) return false;
          } else if (periodFilter === "thisYear") {
            if (y !== refYear) return false;
          } else if (periodFilter === "lastYear") {
            if (y !== refYear - 1) return false;
          } else if (periodFilter === "custom") {
            if (customStartDate && txDateStr < customStartDate) return false;
            if (customEndDate && txDateStr > customEndDate) return false;
          }
        }

        // 4. Filtro por Bancos (Apenas Santander e Nubank)
        if (selectedBankIds.length > 0) {
          const txBankName = (tx.accountName || tx.accountOrCard || "").toLowerCase();
          const matchesBank = selectedBankIds.some((selectedId) => {
            if (selectedId === "acc-santander") {
              return txBankName.includes("santander");
            }
            if (selectedId === "acc-nubank") {
              return (
                txBankName.includes("nubank") ||
                txBankName.includes("nu") ||
                txBankName.includes("roxinho")
              );
            }
            return false;
          });
          if (!matchesBank) return false;
        }

        // 5. Filtro por Cartões
        if (selectedCardIds.length > 0) {
          const txCardName = (tx.accountOrCard || tx.accountName || "").toLowerCase();
          const txCardId = tx.creditCardId || "";
          const matchesCard = selectedCardIds.some((cardId) => {
            const c = availableCards.find((card) => card.id === cardId);
            if (!c) return false;
            const cName = c.name.toLowerCase();
            return (
              txCardName.includes(cName) ||
              cName.includes(txCardName) ||
              txCardId === c.id ||
              tx.paymentMethod === "credit"
            );
          });
          if (!matchesCard) return false;
        }

        // 6. Filtro por Categorias
        if (selectedCategoryNames.length > 0) {
          const txCat = (tx.categoryName || "").toLowerCase();
          const matchesCategory = selectedCategoryNames.some((catName) => {
            const sel = catName.toLowerCase();
            if (txCat.includes(sel) || sel.includes(txCat)) return true;
            if (sel === "alimentação") {
              return /aliment|mercado|comida|restaurante|delivery|super|snack|lanche|café/i.test(txCat);
            }
            if (sel === "compras") {
              return /compra|shopping|loja|online|eletrônic|roupa/i.test(txCat);
            }
            if (sel === "transporte") {
              return /transporte|uber|carro|combust|posto|estacion|ônibus|metrô|pedágio/i.test(txCat);
            }
            if (sel === "finanças") {
              return /finan|banco|taxa|juros|tarifa|câmbio|transferência/i.test(txCat);
            }
            if (sel === "renda") {
              return /renda|salário|freelance|entrada|bônus|reembolso|ganho/i.test(txCat);
            }
            if (sel === "impostos e taxas") {
              return /imposto|tributo|taxa|tarifa|darf|tribut|ipva|iptu/i.test(txCat);
            }
            if (sel === "seguros") {
              return /seguro|vida|auto|residencial|plano/i.test(txCat);
            }
            if (sel === "moradia & contas") {
              return /moradia|aluguel|condomínio|luz|água|gás|internet|casa/i.test(txCat);
            }
            if (sel === "lazer & streaming") {
              return /lazer|stream|netflix|spotify|cinema|jogo|viagem/i.test(txCat);
            }
            if (sel === "saúde") {
              return /saúde|farmácia|médic|exame|consulta|hospital|remédio/i.test(txCat);
            }
            if (sel === "investimentos") {
              return /invest|ação|ações|cdi|rendimento|fundo|dividendo/i.test(txCat);
            }
            return false;
          });
          if (!matchesCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "highest") return b.amount - a.amount;
        if (sortOrder === "lowest") return a.amount - b.amount;
        if (sortOrder === "oldest") {
          return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        }
        return (
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
      });
  }, [
    transactions,
    activeFilter,
    searchQuery,
    periodFilter,
    customStartDate,
    customEndDate,
    selectedBankIds,
    selectedCardIds,
    selectedCategoryNames,
    sortOrder,
    showHidden,
    availableCards,
  ]);

  // Cadastrar nova pessoa inline no banco e já selecionar
  const handleQuickRegisterPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const tempId = `person-${Date.now()}`;
    const newPersonObj: Person = {
      id: tempId,
      name: newPersonName.trim(),
      pixKey: newPersonPix.trim() || undefined,
    };

    setPeople((prev) => [...prev, newPersonObj]);
    setSelectedPersonIds((prev) => [...prev, tempId]);
    setIsRegisteringPerson(false);
    setNewPersonName("");
    setNewPersonPix("");

    try {
      createPersonAction({
        name: newPersonObj.name,
        pixKey: newPersonObj.pixKey,
      }).then((res) => {
        if (res.success && res.data) {
          setPeople((prev) =>
            prev.map((p) => (p.id === tempId ? res.data! : p))
          );
          setSelectedPersonIds((prev) =>
            prev.map((id) => (id === tempId ? res.data!.id : id))
          );
        }
      });
    } catch (err) {
      console.error("Erro ao cadastrar pessoa:", err);
    }
  };



  // Formatação de data curta da transação (ex: "8 de nov")
  const formatTransactionDate = (dateStr: string) => {
    if (!dateStr) return "8 de nov";
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = dateOnly.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      const monthsShort = [
        "jan", "fev", "mar", "abr", "mai", "jun",
        "jul", "ago", "set", "out", "nov", "dez"
      ];
      return `${day} de ${monthsShort[m] || "nov"}`;
    }
    return dateStr;
  };



  // Agrupamento por data (Hoje, Ontem, e por dia/mês específico para cada parcela)
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: ExtratoTransaction[] } = {};
    const todayStr = "2026-11-08";

    filteredTransactions.forEach((tx) => {
      const rawDate = tx.transactionDate || "";
      const txDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;

      let groupKey = "Hoje";
      if (txDate === todayStr) {
        groupKey = "Hoje";
      } else if (txDate === "2026-11-07") {
        groupKey = "Ontem";
      } else if (txDate) {
        const parts = txDate.split("-");
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const m = parseInt(parts[1], 10) - 1;
          const monthsShort = [
            "jan", "fev", "mar", "abr", "mai", "jun",
            "jul", "ago", "set", "out", "nov", "dez"
          ];
          const year = parts[0];
          if (year !== "2026") {
            groupKey = `${day} de ${monthsShort[m]} de ${year}`;
          } else {
            groupKey = `${day} de ${monthsShort[m]}`;
          }
        } else {
          groupKey = txDate;
        }
      } else {
        groupKey = "Outras datas";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  // Salvar transação com suporte a Rateio (Splits) e Renda Fixa
  const handleSaveTransaction = async () => {
    const finalAmount = centsAmount / 100;
    if (!newTitle.trim() || finalAmount <= 0) return;
    if (isCreditCardMissing) return;
    if (newType === "expense" && isSplitEnabled && numSelectedPeople === 0) return;

    const tempId = `tx-${Date.now()}`;
    const parts = newDate.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : newDate;

    let methodLabel = "Pix";
    if (newPaymentMethod === "credit") methodLabel = "Cartão de Crédito";
    else if (newPaymentMethod === "debit") methodLabel = "Cartão de Débito";
    else if (newPaymentMethod === "vr") methodLabel = "Vale Refeição";
    else if (newPaymentMethod === "cash") methodLabel = "Dinheiro";

    // Informação de subtítulo
    let subtitle = `${methodLabel} • ${formattedDate} às ${newTime}`;
    if (newType === "expense" && isSplitEnabled && numSelectedPeople > 0) {
      const names = selectedPersonNames.slice(0, 2).join(", ");
      const extra = numSelectedPeople > 2 ? ` +${numSelectedPeople - 2}` : "";
      subtitle += ` • Dividido com ${names}${extra} (${numSelectedPeople} pessoas)`;
    } else if (newType === "income" && isFixedIncome) {
      subtitle += ` • Fixo dia ${incomeDayOfMonth}`;
    }

    // Identificar nome e tipo da conta/cartão para exibição no extrato
    let accountOrCardLabel = "Dinheiro em Espécie";
    let txAccountType = "cash";
    if (newPaymentMethod === "credit") {
      const selectedItem = filteredAccounts.find((a) => a.id === effectiveAccountId);
      accountOrCardLabel = selectedItem ? selectedItem.name : "Cartão de Crédito";
      txAccountType = "credit";
    } else if (newPaymentMethod === "vr") {
      const selectedItem = filteredAccounts.find((a) => a.id === effectiveAccountId);
      accountOrCardLabel = selectedItem ? selectedItem.name : "Vale Refeição";
      txAccountType = "vr";
    } else if (newPaymentMethod !== "cash") {
      const selectedItem = filteredAccounts.find((a) => a.id === effectiveAccountId);
      accountOrCardLabel = selectedItem ? selectedItem.name : "Conta Nubank";
      txAccountType = selectedItem?.type || "checking";
    }

    const isCredit = newPaymentMethod === "credit";
    const instTotal = isCredit ? newInstallmentTotal : 1;
    const parcelAmount = instTotal > 1 ? Number((finalAmount / instTotal).toFixed(2)) : finalAmount;

    // Cronograma completo de datas de parcelamento
    const schedule: InstallmentScheduleItem[] = [];
    if (instTotal > 1) {
      for (let i = 1; i <= instTotal; i++) {
        const iDate = addMonths(newDate, i - 1);
        const p = iDate.split("-");
        const f = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iDate;
        schedule.push({
          number: i,
          total: instTotal,
          date: iDate,
          formattedDate: f,
          amount: parcelAmount,
          status: i === 1 ? "paid" : "pending",
        });
      }
    }

    // Se for parcelado, gera todas as parcelas com suas respectivas datas de parcelamento
    const newItems: ExtratoTransaction[] = [];
    if (instTotal > 1) {
      for (let i = 1; i <= instTotal; i++) {
        const instDate = addMonths(newDate, i - 1);
        const parts = instDate.split("-");
        const fDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : instDate;
        newItems.push({
          id: `${tempId}-parc-${i}`,
          title: newTitle.trim(),
          description: `${methodLabel} • Parcela ${i}/${instTotal} • ${fDate}`,
          amount: parcelAmount,
          originalTotalAmount: finalAmount,
          type: newType,
          categoryIcon: selectedCategoryIcon,
          categoryName: selectedCategoryName,
          categoryColor: selectedCategoryColor,
          paymentMethod: newPaymentMethod,
          accountOrCard: accountOrCardLabel,
          accountName: accountOrCardLabel,
          accountType: txAccountType,
          installmentNumber: i,
          installmentTotal: instTotal,
          installmentSchedule: schedule,
          transactionDate: `${instDate}T${newTime}:00`,
          formattedDate: fDate,
          status: i === 1 ? "paid" : "pending",
          isFixed: false,
        });
      }
    } else {
      newItems.push({
        id: tempId,
        title: newTitle.trim(),
        description: subtitle,
        amount: finalAmount,
        type: newType,
        categoryIcon: selectedCategoryIcon,
        categoryName: selectedCategoryName,
        categoryColor: selectedCategoryColor,
        paymentMethod: newPaymentMethod,
        accountOrCard: accountOrCardLabel,
        accountName: accountOrCardLabel,
        accountType: txAccountType,
        installmentNumber: 1,
        installmentTotal: 1,
        transactionDate: `${newDate}T${newTime}:00`,
        formattedDate,
        status: "paid",
        isFixed: newType === "expense" ? isFixedTx : isFixedIncome,
      });
    }

    // Atualiza estado local imediatamente (com todas as parcelas em suas datas de vencimento)
    setTransactions((prev) => [...newItems, ...prev]);

    // Persiste no Supabase de forma assíncrona
    try {
      const matchedCategory = availableCategories.find(
        (c) =>
          c.name.toLowerCase() === selectedCategoryName.toLowerCase() ||
          c.id === newCategoryId
      );

      const splitsPayload =
        newType === "expense" && isSplitEnabled && numSelectedPeople > 0
          ? selectedPersonIds.map((pId) => ({
              personId: pId,
              amountOwed: perPersonOwed,
              percentage: perPersonPercent,
            }))
          : undefined;

      addTransactionAction({
        description: newTitle.trim(),
        amount: finalAmount,
        type: newType,
        paymentMethod: newPaymentMethod,
        transactionDate: newDate,
        categoryId: matchedCategory?.id || (newCategoryId.startsWith("sub-") ? undefined : newCategoryId),
        accountId:
          newPaymentMethod !== "cash" && newPaymentMethod !== "credit"
            ? effectiveAccountId
            : undefined,
        creditCardId: newPaymentMethod === "credit" ? effectiveAccountId : undefined,
        isFixed: newType === "expense" ? isFixedTx : isFixedIncome,
        installmentNumber: 1,
        installmentTotal: instTotal,
        splits: splitsPayload,
        fixedRule:
          newType === "income" && isFixedIncome
            ? {
                dayOfMonth: incomeDayOfMonth,
                adjustBusinessDay: incomeAdjustBusinessDay,
                shiftDirection: incomeShiftDirection,
              }
            : undefined,
      }).then((res) => {
        if (res && res.success) {
          if (res.allInstallments && res.allInstallments.length > 0) {
            setTransactions((prev) => {
              const withoutTemp = prev.filter((t) => !t.id.startsWith(tempId));
              return [...res.allInstallments!, ...withoutTemp];
            });
          } else if (res.data) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === tempId ? { ...t, id: res.data!.id } : t))
            );
          }
        }
      });
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
    }

    // Limpa formulário e fecha tela
    setNewTitle("");
    setCentsAmount(0);
    setNewInstallmentTotal(1);
    setIsSplitEnabled(false);
    setIsFixedIncome(false);
    setIsNewTxModalOpen(false);
  };

  const content = (
    <>
      {/* Conteúdo rolável principal */}
      <div className="w-full flex-1 px-4 sm:px-5 pt-4 pb-44 z-10 flex flex-col">
        {/* Top Header Bar: Eye privacy (esquerda) + Plus lime button (direita) */}
        <header className="flex items-center justify-between w-full pt-1 pb-3 select-none">
          {/* Eye Button */}
          <button
            type="button"
            onClick={handleTogglePrivacy}
            aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
            className="w-11 h-11 rounded-full bg-[#27262c] border border-white/5 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md"
          >
            {isPrivacyHidden ? (
              <EyeOff className="w-5 h-5 text-lime-400" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>

          {/* Plus neon lime circular button (abre a tela Nova Transação) */}
          <button
            type="button"
            onClick={() => {
              setNewDate("2026-11-08");
              setCentsAmount(0);
              setNewTitle("");
              setIsNewTxModalOpen(true);
            }}
            aria-label="Nova Transação"
            className="w-11 h-11 rounded-full bg-[#ccff00] text-black font-black flex items-center justify-center transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-[0_0_18px_rgba(204,255,0,0.35)]"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </header>

        {/* Título Principal "Atividades" */}
        <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-white mt-1 mb-3">
          Atividades
        </h1>

        {/* Campo de Busca "Buscar" */}
        <div className="relative w-full mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar"
            className="w-full pl-11 pr-10 py-3 rounded-full bg-[#111114] border border-white/[0.06] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pílulas de Filtro (Filtros com contador ativo, Entradas, Saídas, Pagamentos com check) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-4 select-none">
          {/* Filtros Pill: ativado e com () quando qualquer filtro estiver ativo */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
              isAnyFilterActive
                ? "bg-white text-black border-white shadow-md font-semibold"
                : "bg-[#111114] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros{isAnyFilterActive ? ` (${appliedFilterCount})` : ""}</span>
          </button>

          {/* Entradas */}
          <button
            type="button"
            onClick={() => handleFilterSelect("income")}
            className={`shrink-0 px-4.5 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              activeFilter === "income"
                ? "bg-white text-black border-white shadow-md font-semibold"
                : "bg-[#111114] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
          >
            {activeFilter === "income" && <Check className="w-4 h-4 stroke-[3]" />}
            <span>Entradas</span>
          </button>

          {/* Saídas */}
          <button
            type="button"
            onClick={() => handleFilterSelect("expense")}
            className={`shrink-0 px-4.5 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              activeFilter === "expense"
                ? "bg-white text-black border-white shadow-md font-semibold"
                : "bg-[#111114] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
          >
            {activeFilter === "expense" && <Check className="w-4 h-4 stroke-[3]" />}
            <span>Saídas</span>
          </button>

          {/* Pagamentos */}
          <button
            type="button"
            onClick={() => handleFilterSelect("payment")}
            className={`shrink-0 px-4.5 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              activeFilter === "payment"
                ? "bg-white text-black border-white shadow-md font-semibold"
                : "bg-[#111114] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
          >
            {activeFilter === "payment" && <Check className="w-4 h-4 stroke-[3]" />}
            <span>Pagamentos</span>
          </button>
        </div>

        {/* Área Central: Lista de Transações ou Estado Vazio IDÊNTICO à imagem */}
        {filteredTransactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 my-auto select-none">
            <h2 className="text-white text-base sm:text-lg font-bold tracking-tight">
              Nenhuma atividade encontrada
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-[280px] leading-relaxed">
              Tente ajustar os filtros ou buscar por outro termo.
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold text-lime-400 border border-lime-400/30 hover:bg-lime-400/10 active:scale-95 transition cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 pt-1">
            {Object.entries(groupedTransactions).map(([groupTitle, items]) => (
              <div key={groupTitle} className="flex flex-col">
                {/* Título da Seção (ex: Hoje) */}
                <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                  {groupTitle}
                </h3>

                {/* Lista de Transações daquele dia (sem bordas de card) */}
                <div className="flex flex-col">
                  {items.map((tx) => {
                    const isIncome = tx.type === "income";
                    const pmInfo = getPaymentMethodDetails(tx.paymentMethod);
                    const accountDisplay =
                      tx.accountName ||
                      tx.accountOrCard ||
                      (tx.paymentMethod === "cash" ? "Dinheiro em Espécie" : "Conta Nubank");
                    const accTypeDisplay = getAccountTypeLabel(
                      tx.accountType,
                      tx.paymentMethod,
                      accountDisplay
                    );
                    const hasInstallments = Boolean(
                      tx.installmentTotal && tx.installmentTotal > 1
                    );

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="flex items-center justify-between py-2.5 cursor-pointer group active:opacity-75 transition select-none"
                      >
                        {/* Lado Esquerdo: Ícone com Badge da Conta/Banco */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                          <div className="relative shrink-0">
                            <TransactionIcon
                              title={tx.title}
                              categoryIcon={tx.categoryIcon}
                              type={tx.type}
                              size={48}
                            />

                            {/* Badge da Conta/Cartão (Santander, Nubank, VR, Dinheiro, etc.) com Logo Original */}
                            <AccountBadge tx={tx} />
                          </div>

                          {/* Textos: 3 linhas refinadas */}
                          <div className="flex flex-col min-w-0 flex-1">
                            {/* Linha 1: Título + Badge de Parcela ou Fixa */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">
                                {tx.title}
                              </span>
                              {hasInstallments && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 font-mono tracking-tight">
                                  {tx.installmentNumber || 1}/{tx.installmentTotal}x
                                </span>
                              )}
                              {tx.isFixed && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-400/15 text-blue-300 border border-blue-400/30 tracking-tight">
                                  Fixa
                                </span>
                              )}
                              {tx.isHidden && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/80 inline-flex items-center gap-1 tracking-tight">
                                  <EyeOff className="w-2.5 h-2.5" /> Oculta
                                </span>
                              )}
                            </div>

                            {/* Linha 2: Data • Categoria • Forma de pagamento */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 leading-tight truncate">
                              {hasInstallments ? (
                                <span className="text-amber-300 font-medium">
                                  Venc. {formatTransactionDate(tx.transactionDate)}
                                </span>
                              ) : (
                                <span>{formatTransactionDate(tx.transactionDate)}</span>
                              )}
                              <span className="text-zinc-600">•</span>
                              <span className="truncate">{tx.categoryName || "Geral"}</span>
                              <span className="text-zinc-600">•</span>
                              <span className={`inline-flex items-center gap-1 font-medium ${pmInfo.color} shrink-0`}>
                                <pmInfo.icon className="w-3 h-3 stroke-[2.2]" />
                                <span>{pmInfo.shortLabel}</span>
                              </span>
                            </div>

                            {/* Linha 3: Carteira / Conta • Tipo de Conta */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 leading-tight truncate">
                              <Wallet className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="text-zinc-300 font-medium truncate">
                                {accountDisplay}
                              </span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-500 text-[11px] truncate">
                                {accTypeDisplay}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lado Direito: Valor (-R$ 65,65 em vermelho coral) */}
                        <div className="shrink-0 text-right pl-2">
                          <span
                            className={`text-[15px] font-bold font-mono tracking-tight block ${
                              isIncome ? "text-[#52e374]" : "text-[#f87171]"
                            } ${isPrivacyHidden ? "balance-blur" : ""}`}
                          >
                            {isIncome ? "+R$ " : "-R$ "}{formatCurrency(tx.amount)}
                          </span>
                          {hasInstallments && (
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              de R$ {formatCurrency(tx.originalTotalAmount || tx.amount * (tx.installmentTotal || 1))}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TELA DE NOVA TRANSAÇÃO */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-0 z-[70] bg-[#09090b] flex flex-col h-[100dvh] sm:h-full max-h-[100dvh] text-white animate-in slide-in-from-bottom duration-300 sm:rounded-[44px] overflow-hidden">
          {/* Header fixo no topo */}
          <div className="shrink-0 px-5 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-white/[0.08] relative flex items-center justify-center bg-[#09090b] z-10">
            <h2 className="text-base sm:text-[17px] font-bold text-white tracking-tight">
              Nova transação
            </h2>
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(false)}
              className="absolute right-5 sm:right-6 w-9 h-9 rounded-full bg-[#27262c] hover:bg-[#34333b] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo do formulário com scroll suave */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 flex flex-col gap-4 no-scrollbar">
            {/* Segmented Pill: Saída (⊖ Saída) vs Entrada (⊕ Entrada) */}
            <div className="w-full bg-[#141418] p-1 rounded-full flex items-center border border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newType === "expense"
                    ? "bg-[#25252c] text-white shadow-md border border-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Saída</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newType === "income"
                    ? "bg-[#25252c] text-white shadow-md border border-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Entrada</span>
              </button>
            </div>

            {/* Valor Grande: R$ 0,00 */}
            <div className="py-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formattedInputAmount}
                  onChange={handleAmountInputChange}
                  placeholder="R$ 0,00"
                  className="w-full text-4xl sm:text-[46px] font-black text-white bg-transparent tracking-tight focus:outline-none font-mono py-1 select-all"
                />
              </div>
              <div className="w-full border-b border-white/[0.08] mt-3" />
            </div>

            {/* Linhas de Campos Adaptadas às Opções de Entrada vs Saída */}
            <div className="flex flex-col divide-y divide-white/[0.06] text-sm">
              {/* Descrição */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-zinc-400 font-normal shrink-0">Descrição</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newType === "income"
                      ? "Ex: Salário de Novembro"
                      : "Nome da transação..."
                  }
                  className="w-full text-right bg-transparent text-white placeholder-zinc-600 focus:outline-none font-medium"
                />
              </div>

              {/* Data */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">Data</span>
                <div className="flex items-center gap-1.5 text-zinc-200 hover:text-white cursor-pointer relative">
                  <span className="font-medium text-sm">{formattedDateLabel}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Horário (Seleção do Horário da transação) */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">Horário</span>
                <div className="flex items-center gap-1.5 text-zinc-200 hover:text-white cursor-pointer relative">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="font-medium text-sm font-mono">{newTime}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Categoria (Abre tela de categorias idêntica à imagem) */}
              <div
                onClick={() => {
                  setSearchCatQuery("");
                  setIsCategoryPickerOpen(true);
                }}
                className="py-3.5 flex items-center justify-between gap-4 relative cursor-pointer group hover:bg-white/[0.02] rounded-lg transition"
              >
                <span className="text-zinc-400 font-normal shrink-0">Categoria</span>
                <div className="flex items-center gap-2 text-zinc-200 group-hover:text-white transition">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedCategoryColor }}
                    />
                    <span className="font-medium text-sm text-white">
                      {selectedCategoryName || "Selecione a categoria..."}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </div>
              </div>

              {/* Moeda */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">Moeda</span>
                <div className="flex items-center gap-1.5 text-zinc-200 relative">
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-white"
                  >
                    <option value="BRL" className="bg-[#1c1c22]">
                      BRL - Real Brasileiro
                    </option>
                    <option value="USD" className="bg-[#1c1c22]">
                      USD - Dólar Americano
                    </option>
                    <option value="EUR" className="bg-[#1c1c22]">
                      EUR - Euro
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">
                  {newType === "income" ? "Método de recebimento" : "Pagamento"}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-200 relative">
                  <select
                    value={newPaymentMethod}
                    onChange={(e) =>
                      setNewPaymentMethod(
                        e.target.value as "pix" | "credit" | "debit" | "vr" | "cash"
                      )
                    }
                    className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-white"
                  >
                    <option value="pix" className="bg-[#1c1c22]">
                      Pix
                    </option>
                    {newType === "expense" && (
                      <>
                        <option value="credit" className="bg-[#1c1c22]">
                          Cartão de Crédito
                        </option>
                        <option value="debit" className="bg-[#1c1c22]">
                          Cartão de Débito
                        </option>
                      </>
                    )}
                    <option value="vr" className="bg-[#1c1c22]">
                      Vale Refeição (VR)
                    </option>
                    <option value="cash" className="bg-[#1c1c22]">
                      Dinheiro / Espécie
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                </div>
              </div>

              {/* Conta ou Cartão (Se for Dinheiro, NÃO mostra a opção de conta; Se for VR, mostra apenas cartões/contas VR) */}
              {newPaymentMethod !== "cash" && (
                <div className="py-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 relative">
                    <span className="text-zinc-400 font-normal shrink-0">
                      {newPaymentMethod === "credit"
                        ? "Cartão de Crédito"
                        : newPaymentMethod === "vr"
                        ? "Cartão / Conta VR"
                        : newType === "income"
                        ? "Conta de destino"
                        : "Conta"}
                    </span>
                    {newPaymentMethod === "credit" && availableCards.length === 0 ? (
                      <span className="text-amber-400 font-medium text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Nenhum cartão cadastrado
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-200 relative">
                        <select
                          value={effectiveAccountId}
                          onChange={(e) => setNewAccountId(e.target.value)}
                          className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-white"
                        >
                          {filteredAccounts.map((item) => (
                            <option key={item.id} value={item.id} className="bg-[#1c1c22]">
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                      </div>
                    )}
                  </div>

                  {/* Opções de Parcelamento para Cartão de Crédito */}
                  {newPaymentMethod === "credit" && availableCards.length > 0 && (
                    <div className="pt-3 mt-1 border-t border-white/[0.06] flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-400 font-normal">Parcelas</span>
                        <span className="text-[11px] text-zinc-500">
                          {newInstallmentTotal > 1
                            ? `${newInstallmentTotal}x de R$ ${(centsAmount > 0 ? (centsAmount / 100 / newInstallmentTotal).toFixed(2).replace(".", ",") : "0,00")}`
                            : "À vista"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-200 relative">
                        <select
                          value={newInstallmentTotal}
                          onChange={(e) => setNewInstallmentTotal(Number(e.target.value))}
                          className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-lime-400"
                        >
                          <option value={1} className="bg-[#1c1c22]">
                            1x (À vista)
                          </option>
                          {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => {
                            const valStr = centsAmount > 0
                              ? (centsAmount / 100 / num).toFixed(2).replace(".", ",")
                              : "0,00";
                            return (
                              <option key={num} value={num} className="bg-[#1c1c22]">
                                {num}x de R$ {valStr}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                      </div>
                    </div>
                  )}

                  {/* Alerta quando não houver cartões cadastrados */}
                  {newPaymentMethod === "credit" && availableCards.length === 0 && (
                    <div className="mt-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-200">Nenhum cartão cadastrado</p>
                        <p className="text-zinc-400 mt-0.5">
                          Não foi encontrado nenhum cartão de crédito na base de dados. Cadastre um cartão ou escolha outro método (Pix, Débito ou Dinheiro) para prosseguir.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO SAÍDA: Despesa Fixa */}
              {newType === "expense" && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <span className="text-zinc-400 font-normal shrink-0">Despesa fixa</span>
                  <button
                    type="button"
                    onClick={() => setIsFixedTx(!isFixedTx)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isFixedTx ? "bg-[#ccff00]" : "bg-zinc-800 border border-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                        isFixedTx ? "right-0.5 bg-black" : "left-0.5 bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* CAMPO SAÍDA: Dividir este gasto com alguém (Rachadinha / Split) */}
              {newType === "expense" && (
                <div className="py-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-lime-400" />
                      <span className="text-zinc-300 font-medium">
                        Dividir este gasto com alguém?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSplitEnabled(!isSplitEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isSplitEnabled ? "bg-[#ccff00]" : "bg-zinc-800 border border-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                          isSplitEnabled ? "right-0.5 bg-black" : "left-0.5 bg-zinc-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Detalhes do Rateio / Split Múltiplo */}
                  {isSplitEnabled && (
                    <div className="mt-1 p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col gap-3.5 animate-in fade-in duration-200">
                      {/* Header com Ações: Selecionar Todos + Cadastrar Pessoa */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-zinc-400 font-medium">
                          Com quem você vai dividir? ({numSelectedPeople} selecionado{numSelectedPeople !== 1 ? "s" : ""})
                        </label>
                        <div className="flex items-center gap-3">
                          {people.length > 1 && !isRegisteringPerson && (
                            <button
                              type="button"
                              onClick={toggleSelectAllPeople}
                              className="text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                              {selectedPersonIds.length === people.length ? "Desmarcar todos" : "Selecionar todos"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsRegisteringPerson(!isRegisteringPerson)}
                            className="text-xs text-lime-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>
                              {isRegisteringPerson ? "Voltar à lista" : "+ Cadastrar"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Formulário inline de nova pessoa */}
                      {isRegisteringPerson ? (
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5">
                          <span className="text-xs font-semibold text-white">Cadastrar novo contato</span>
                          <input
                            type="text"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            placeholder="Nome do amigo (ex: Juliana)"
                            className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                          />
                          <input
                            type="text"
                            value={newPersonPix}
                            onChange={(e) => setNewPersonPix(e.target.value)}
                            placeholder="Chave Pix ou Telefone (opcional)"
                            className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsRegisteringPerson(false)}
                              className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleQuickRegisterPerson}
                              disabled={!newPersonName.trim()}
                              className="flex-1 py-1.5 rounded-lg bg-lime-400 text-black text-xs font-bold disabled:opacity-50 cursor-pointer"
                            >
                              Salvar contato
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Lista de pessoas cadastradas no banco de dados com suporte a multi-seleção */
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
                          {people.map((person) => {
                            const isSelected = selectedPersonIds.includes(person.id);
                            const initial = person.name ? person.name[0].toUpperCase() : "A";

                            return (
                              <div
                                key={person.id}
                                onClick={() => togglePersonSelection(person.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-white/[0.08] border-white/20 text-white shadow-sm"
                                    : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                                }`}
                              >
                                {/* Avatar + Nome + Info */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isSelected ? "bg-[#ccff00] text-black shadow-sm" : "bg-[#27262c] text-zinc-400"
                                    }`}
                                  >
                                    {initial}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {person.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                      {person.pixKey ? `Pix: ${person.pixKey}` : person.phone || "Contato da base"}
                                    </span>
                                  </div>
                                </div>

                                {/* Checkbox arredondado */}
                                <div
                                  className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all shrink-0 ${
                                    isSelected
                                      ? "bg-[#ccff00] border-[#ccff00] text-black shadow-sm"
                                      : "border-zinc-700 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Configuração da Divisão do Gasto */}
                      {numSelectedPeople === 0 ? (
                        <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Selecione ao menos uma pessoa para dividir o gasto.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                          <label className="text-xs text-zinc-400 font-medium">
                            Como dividir entre Você e os {numSelectedPeople} amigo{numSelectedPeople > 1 ? "s" : ""}?
                          </label>

                          {/* Modos rápidos de Rateio */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSplitMode("equal");
                              }}
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                splitMode === "equal"
                                  ? "bg-white text-black border-white shadow-sm font-bold"
                                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Igual p/ todos
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSplitMode("custom");
                                setSplitPercentage(50);
                              }}
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                splitMode === "custom" && splitPercentage === 50
                                  ? "bg-white text-black border-white shadow-sm font-bold"
                                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              50% p/ eles
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSplitMode("custom");
                                setSplitPercentage(100);
                              }}
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                splitMode === "custom" && splitPercentage === 100
                                  ? "bg-white text-black border-white shadow-sm font-bold"
                                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              100% p/ eles
                            </button>
                          </div>

                          {/* Ajuste de porcentagem manual quando em modo custom */}
                          {splitMode === "custom" && (
                            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs">
                              <span className="text-zinc-400">Total a repassar aos amigos:</span>
                              <div className="flex items-center gap-1 font-bold text-white">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={splitPercentage}
                                  onChange={(e) => {
                                    const v = parseInt(e.target.value || "50", 10);
                                    setSplitPercentage(Math.min(100, Math.max(1, v)));
                                  }}
                                  className="w-12 bg-transparent text-right focus:outline-none text-white font-mono"
                                />
                                <span>%</span>
                              </div>
                            </div>
                          )}

                          {/* Resumo visual do Rateio */}
                          <div className="p-3 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Cada amigo paga ({numSelectedPeople}x):</span>
                              <span className="font-bold text-lime-400 font-mono">
                                R$ {formatCurrency(perPersonOwed)} ({perPersonPercent}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/[0.04] pt-1.5">
                              <span className="text-zinc-400">Sua parte:</span>
                              <span className="font-bold text-white font-mono">
                                R$ {formatCurrency(myPartNum)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/[0.04] pt-1.5">
                              <span className="text-zinc-400">Total a receber:</span>
                              <span className="font-bold text-emerald-400 font-mono">
                                R$ {formatCurrency(totalOwedByFriends)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO ENTRADA: Recebimento Fixo (com regras de dia e dia útil) */}
              {newType === "income" && (
                <div className="py-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-lime-400" />
                      <span className="text-zinc-300 font-medium">
                        Recebimento fixo (Renda recorrente)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFixedIncome(!isFixedIncome)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isFixedIncome ? "bg-[#ccff00]" : "bg-zinc-800 border border-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                          isFixedIncome ? "right-0.5 bg-black" : "left-0.5 bg-zinc-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Opções de Ajuste de Recebimento Fixo */}
                  {isFixedIncome && (
                    <div className="mt-1 p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col gap-4 animate-in fade-in duration-200">
                      {/* Dia que vai ser pago */}
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-zinc-300 font-medium">
                          Dia do mês que vai ser pago:
                        </label>
                        <div className="relative">
                          <select
                            value={incomeDayOfMonth}
                            onChange={(e) => setIncomeDayOfMonth(Number(e.target.value))}
                            className="px-3.5 py-1.5 pr-7 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-lime-400 focus:outline-none appearance-none cursor-pointer"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d} className="bg-[#1c1c22] text-white">
                                Todo dia {d}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Ajustar em fim de semana ou feriado? */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-zinc-300">
                            Ajustar em fim de semana / feriado?
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Desloca a data para um dia útil bancário
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIncomeAdjustBusinessDay(!incomeAdjustBusinessDay)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            incomeAdjustBusinessDay
                              ? "bg-lime-400"
                              : "bg-zinc-800 border border-white/10"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                              incomeAdjustBusinessDay
                                ? "right-0.5 bg-black"
                                : "left-0.5 bg-zinc-400"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Como ajustar: Antecipar ou Postergar */}
                      {incomeAdjustBusinessDay && (
                        <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
                          <span className="text-xs text-zinc-400 font-medium">
                            Quando cair em sábado, domingo ou feriado:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setIncomeShiftDirection("anticipate")}
                              className={`p-2.5 rounded-xl text-xs font-medium border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                                incomeShiftDirection === "anticipate"
                                  ? "bg-white text-black border-white font-bold shadow-md"
                                  : "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-white/5"
                              }`}
                            >
                              <span>Antecipar</span>
                              <span
                                className={`text-[10px] ${
                                  incomeShiftDirection === "anticipate"
                                    ? "text-zinc-700"
                                    : "text-zinc-500"
                                }`}
                              >
                                Paga no dia útil anterior (ex: sexta)
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIncomeShiftDirection("postpone")}
                              className={`p-2.5 rounded-xl text-xs font-medium border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                                incomeShiftDirection === "postpone"
                                  ? "bg-white text-black border-white font-bold shadow-md"
                                  : "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-white/5"
                              }`}
                            >
                              <span>Postergar</span>
                              <span
                                className={`text-[10px] ${
                                  incomeShiftDirection === "postpone"
                                    ? "text-zinc-700"
                                    : "text-zinc-500"
                                }`}
                              >
                                Paga no próximo dia útil (ex: segunda)
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botão de ação inferior SEMPRE visível na altura do celular (sem precisar rolar) */}
          <div className="shrink-0 p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#09090b] border-t border-white/[0.08] z-10 shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={handleSaveTransaction}
              disabled={!canSubmitTransaction}
              className={`w-full py-3.5 sm:py-4 rounded-full font-semibold text-base transition-all active:scale-[0.98] cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                canSubmitTransaction
                  ? "bg-[#d4d4d8] hover:bg-white text-black"
                  : "bg-[#27272a] text-zinc-500 cursor-not-allowed"
              }`}
            >
              <span>
                {isCreditCardMissing
                  ? "Nenhum cartão cadastrado"
                  : newType === "expense" && isSplitEnabled && numSelectedPeople === 0
                  ? "Selecione quem vai dividir"
                  : "Adicionar transação"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TELA DE SELEÇÃO DE CATEGORIAS (Fiel à imagem em anexo) */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-0 z-[80] bg-[#09090b] flex flex-col p-5 sm:p-6 text-white animate-in slide-in-from-bottom duration-300 sm:rounded-[44px] overflow-hidden pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Header com botão Fechar X circular na direita */}
          <div className="flex items-center justify-end pt-1 pb-3">
            <button
              type="button"
              onClick={() => {
                setIsCategoryPickerOpen(false);
                setIsEditingSelectedTxCategory(false);
                setIsCategoryPickerForFilter(false);
              }}
              className="w-10 h-10 rounded-full bg-[#1c1c22] border border-white/5 hover:bg-[#25252c] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Campo de Busca "Buscar" */}
          <div className="relative w-full mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              value={searchCatQuery}
              onChange={(e) => setSearchCatQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full pl-11 pr-10 py-3 rounded-full bg-[#111114] border border-white/[0.06] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all shadow-inner"
            />
            {searchCatQuery && (
              <button
                type="button"
                onClick={() => setSearchCatQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Título Principal "Categorias" */}
          <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-white mb-4">
            Categorias
          </h1>

          {/* Lista Agrupada com Ícones e Checkboxes arredondados */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-6">
            {filteredCategoryGroups.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Nenhuma categoria encontrada para &ldquo;{searchCatQuery}&rdquo;
              </div>
            ) : (
              filteredCategoryGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  {/* Cabeçalho do Grupo (Alimentação, Compras, etc.) */}
                  <div className="flex items-center gap-3.5 py-3 px-3.5 rounded-2xl bg-[#141418] border border-white/[0.04]">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: group.color }}
                    >
                      {renderCategoryGroupHeaderIcon(group.iconName)}
                    </div>
                    <span className="text-[17px] font-bold text-white tracking-tight">
                      {group.name}
                    </span>
                  </div>

                  {/* Subcategorias com ícone em círculo escuro e checkbox arredondado */}
                  <div className="divide-y divide-white/[0.04]">
                    {group.items.map((item) => {
                      const isSelected = isCategoryPickerForFilter
                        ? selectedCategoryNames.some(
                            (n) => n.toLowerCase() === item.name.toLowerCase()
                          )
                        : isEditingSelectedTxCategory
                        ? selectedTx?.categoryName?.toLowerCase() === item.name.toLowerCase()
                        : selectedCategoryName.toLowerCase() === item.name.toLowerCase() ||
                          newCategoryId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isCategoryPickerForFilter) {
                              toggleCategoryFilter(item.name);
                              return;
                            }
                            if (isEditingSelectedTxCategory && selectedTx) {
                              const updatedTx = {
                                ...selectedTx,
                                categoryName: item.name,
                                categoryColor: item.color,
                                categoryIcon: item.iconName,
                              };
                              setSelectedTx(updatedTx);
                              setTransactions((prev) =>
                                prev.map((t) => (t.id === selectedTx.id ? updatedTx : t))
                              );
                              updateTransactionAction(selectedTx.id, {
                                categoryId: item.id.startsWith("sub-") ? undefined : item.id,
                              });
                              setIsEditingSelectedTxCategory(false);
                              setIsCategoryPickerOpen(false);
                              return;
                            }
                            setNewCategoryId(item.id);
                            setSelectedCategoryName(item.name);
                            setSelectedCategoryColor(item.color);
                            setSelectedCategoryIcon(item.iconName);
                            setIsCategoryPickerOpen(false);
                          }}
                          className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-white/[0.03] active:scale-[0.99] transition cursor-pointer group"
                        >
                          {/* Lado Esquerdo: Ícone escuro + Nome da Subcategoria */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:border-white/10 transition">
                              {renderCategoryItemIcon(item.iconName, item.color)}
                            </div>
                            <span className="text-[15px] font-medium text-zinc-200 group-hover:text-white transition truncate">
                              {item.name}
                            </span>
                          </div>

                          {/* Lado Direito: Checkbox arredondado (idêntico à imagem) */}
                          <div
                            className={`w-5.5 h-5.5 rounded-[6px] border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-white border-white text-black shadow-sm"
                                : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer quando aberto a partir do filtro: Concluir seleção */}
          {isCategoryPickerForFilter && (
            <div className="shrink-0 pt-3 pb-1 border-t border-white/[0.06] bg-[#09090b]">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryPickerOpen(false);
                  setIsCategoryPickerForFilter(false);
                }}
                className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-zinc-200 active:scale-[0.98] transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                Concluir {selectedCategoryNames.length > 0 ? `(${selectedCategoryNames.length})` : ""}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal / Tela de Filtros - Adaptado fielmente às imagens de referência */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-0 z-50 bg-[#09090b] flex flex-col justify-between text-white animate-in slide-in-from-bottom duration-300 sm:rounded-[44px] overflow-hidden w-full h-[100dvh] sm:h-full max-h-[100dvh] sm:max-h-full">
          {/* Header com Título Filtros e botão circular X à direita */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 shrink-0">
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white">
              Filtros
            </h2>
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-9 h-9 rounded-full bg-[#27262c] hover:bg-[#34333b] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer"
              aria-label="Fechar filtros"
            >
              <X className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Conteúdo com Scroll vertical */}
          <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-5 sm:px-6 py-2 space-y-6">
            {/* 1. SEÇÃO: Período */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-white">
                Período
              </h3>
              <div className="flex flex-wrap gap-2">
                {periodPills.map((p) => {
                  const isSelected = periodFilter === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriodFilter(p.id)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-white text-black border-white font-semibold shadow-sm"
                          : "bg-[#141418] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {Icon && (
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-black" : "text-zinc-400"}`} />
                      )}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Data personalizada caso 'Personalizado' esteja ativo */}
              {periodFilter === "custom" && (
                <div className="grid grid-cols-2 gap-2.5 pt-2 mt-1 border-t border-white/5 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      De
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Até
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. SEÇÃO: Bancos */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-white">
                Bancos
              </h3>
              <div className="flex flex-col divide-y divide-white/[0.04]">
                {filterBanksList.map((bank) => {
                  const isSelected = selectedBankIds.includes(bank.id);
                  return (
                    <div
                      key={bank.id}
                      onClick={() => toggleBankFilter(bank.id)}
                      className="flex items-center justify-between py-3 cursor-pointer group active:opacity-75 transition select-none"
                    >
                      <div className="flex items-center gap-3">
                        {bank.logo === "santander" ? (
                          <SantanderIcon className="w-8 h-8" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#820AD1] flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-[11px] font-black text-white">Nu</span>
                          </div>
                        )}
                        <span className="text-sm sm:text-[15px] font-medium text-zinc-200 group-hover:text-white transition">
                          {bank.name}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-white border-white text-black"
                            : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SEÇÃO: Cartões */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-white">
                Cartões
              </h3>
              {availableCards.length === 0 ? (
                <p className="text-sm text-zinc-500 py-1 font-normal">
                  Nenhum item disponível.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-white/[0.04]">
                  {availableCards.map((card) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        onClick={() => toggleCardFilter(card.id)}
                        className="flex items-center justify-between py-3 cursor-pointer group active:opacity-75 transition select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <span className="text-sm sm:text-[15px] font-medium text-zinc-200 group-hover:text-white transition">
                            {card.name}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-white border-white text-black"
                              : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. SEÇÃO: Categoria */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-white">
                Categoria
              </h3>
              <div className="flex flex-wrap gap-2">
                {filterVisibleCategories.map((cat) => {
                  const isSelected = selectedCategoryNames.some(
                    (n) => n.toLowerCase() === cat.name.toLowerCase()
                  );
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoryFilter(cat.name)}
                      className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? "bg-white text-black border-white font-semibold shadow-sm"
                          : "bg-[#141418] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isSelected ? "#000000" : cat.color }}
                      />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCategoryPickerForFilter(true);
                  setSearchCatQuery("");
                  setIsCategoryPickerOpen(true);
                }}
                className="text-xs sm:text-sm text-zinc-400 hover:text-white flex items-center gap-1 pt-1 transition cursor-pointer"
              >
                <span>Mostrar mais</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. SEÇÃO: Ordenar por */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-white">
                Ordenar por
              </h3>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((opt) => {
                  const isSelected = sortOrder === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortOrder(opt.id)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-white text-black border-white font-semibold shadow-sm"
                          : "bg-[#141418] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. SEÇÃO: Mostrar ocultos */}
            <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">
                  Mostrar ocultos
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">
                  Exibe transações ocultadas no extrato.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHidden((prev) => !prev)}
                aria-label="Mostrar ocultos"
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  showHidden ? "bg-white" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                    showHidden ? "translate-x-6 bg-black" : "translate-x-1 bg-zinc-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Fixo: Mostrar resultados & Limpar tudo */}
          <div className="shrink-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/98 to-transparent pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-5 sm:px-6 flex flex-col items-center gap-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-full py-3.5 sm:py-4 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-zinc-200 active:scale-[0.98] transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              Mostrar resultados
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white active:scale-95 transition cursor-pointer py-1.5"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      )}

      {/* TELA DE DETALHES DA TRANSAÇÃO (Fiel à imagem em anexo) */}
      {selectedTx && (() => {
        const selectedPm = getPaymentMethodDetails(selectedTx.paymentMethod);
        const selectedAccount =
          selectedTx.accountName ||
          selectedTx.accountOrCard ||
          (selectedTx.paymentMethod === "cash" ? "Dinheiro em Espécie" : "Carteira Pierre");
        const hasInstallments = Boolean(
          selectedTx.installmentTotal && selectedTx.installmentTotal > 1
        );
        const currentInst = selectedTx.installmentNumber || 1;
        const totalInst = selectedTx.installmentTotal || 1;
        const totalValue =
          selectedTx.originalTotalAmount || selectedTx.amount * totalInst;

        // Cronograma de datas de parcelamento
        const scheduleList: InstallmentScheduleItem[] = [];
        if (hasInstallments) {
          if (selectedTx.installmentSchedule && selectedTx.installmentSchedule.length > 0) {
            scheduleList.push(...selectedTx.installmentSchedule);
          } else {
            const baseDate = addMonths(selectedTx.transactionDate, -(currentInst - 1));
            for (let i = 1; i <= totalInst; i++) {
              const iDate = addMonths(baseDate, i - 1);
              const p = iDate.split("-");
              const f = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iDate;
              scheduleList.push({
                number: i,
                total: totalInst,
                date: iDate,
                formattedDate: f,
                amount: selectedTx.amount,
                status: i < currentInst ? "paid" : i === currentInst ? "current" : "pending",
              });
            }
          }
        }

        const handleToggleRecurring = async () => {
          const nextIsFixed = !selectedTx.isFixed;
          const updatedTx: ExtratoTransaction = { ...selectedTx, isFixed: nextIsFixed };
          setSelectedTx(updatedTx);
          setTransactions((prev) =>
            prev.map((t) => (t.id === selectedTx.id ? updatedTx : t))
          );
          await updateTransactionAction(selectedTx.id, { isFixed: nextIsFixed });
        };

        const handleStartEdit = () => {
          setEditTxTitle(selectedTx.title);
          setEditTxCentsAmount(Math.round(selectedTx.amount * 100));
          const rawDate = selectedTx.transactionDate || "";
          setEditTxDate(rawDate.includes("T") ? rawDate.split("T")[0] : rawDate || "2026-11-08");
          setEditTxTime(rawDate.includes("T") ? rawDate.split("T")[1]?.slice(0, 5) || "12:00" : "12:00");
          setEditTxPaymentMethod(selectedTx.paymentMethod || "credit");
          setIsEditTxModalOpen(true);
        };

        const handleDeleteTx = async () => {
          const txId = selectedTx.id;
          setTransactions((prev) => prev.filter((t) => t.id !== txId));
          setSelectedTx(null);
          setIsConfirmDeleteOpen(false);
          await deleteTransactionAction(txId);
        };

        const handleToggleHideSelectedTx = () => {
          const nextIsHidden = !selectedTx.isHidden;
          const updatedTx: ExtratoTransaction = { ...selectedTx, isHidden: nextIsHidden };
          setSelectedTx(updatedTx);
          setTransactions((prev) =>
            prev.map((t) => (t.id === selectedTx.id ? updatedTx : t))
          );
        };

        return (
          <div className="fixed inset-0 sm:absolute sm:inset-0 z-[70] bg-[#09090b] flex flex-col overflow-y-auto px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-white animate-in slide-in-from-right duration-200 select-none sm:rounded-[44px] w-full h-[100dvh] max-h-[100dvh]">
            {/* Top Bar: Voltar (<) na esquerda • Lixeira + Editar transação na direita */}
            <div className="flex items-center justify-between w-full pt-1 pb-3">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                aria-label="Voltar"
                className="w-11 h-11 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center text-white active:scale-95 transition cursor-pointer shadow-md hover:bg-[#25252c]"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  aria-label="Excluir transação"
                  title="Excluir transação"
                  className="w-11 h-11 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center text-zinc-300 hover:text-rose-400 active:scale-95 transition cursor-pointer shadow-md hover:bg-[#25252c]"
                >
                  <Trash2 className="w-4.5 h-4.5 stroke-[2]" />
                </button>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4.5 py-2.5 rounded-full bg-[#27262c] hover:bg-[#34333b] border border-white/5 text-xs sm:text-sm font-semibold text-white active:scale-95 transition cursor-pointer shadow-md"
                >
                  Editar transação
                </button>
              </div>
            </div>

            {/* Ícone Grande com Badge da Conta/Banco */}
            <div className="relative inline-block mt-4 self-start">
              <TransactionIcon
                title={selectedTx.title}
                categoryIcon={selectedTx.categoryIcon}
                type={selectedTx.type}
                size={64}
              />
              <AccountBadge tx={selectedTx} customClasses="w-7 h-7 -bottom-1 -right-1" />
            </div>

            {/* Título da Transação */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-4 tracking-tight leading-snug">
              {selectedTx.title}
            </h2>

            {/* Valor Grande */}
            <div
              className={`text-3xl sm:text-[34px] font-extrabold text-white mt-1 tracking-tight font-sans ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              {selectedTx.type === "income" ? "+ " : ""}R$ {formatCurrency(selectedTx.amount)}
            </div>

            {/* Data por Extenso (ex: Domingo, 8 de novembro de 2026) */}
            <p className="text-sm text-zinc-400 mt-1 capitalize leading-relaxed">
              {formatLongPortugueseDate(selectedTx.transactionDate)}
            </p>

            {/* Lista de Detalhes da Atividade */}
            <div className="flex flex-col gap-5 mt-8">
              {/* Categoria */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                    {renderCategoryItemIcon(selectedTx.categoryIcon || "cart", selectedTx.categoryColor || "#f97316", "w-5 h-5")}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400">Categoria</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedTx.categoryName || "Geral"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingSelectedTxCategory(true);
                    setSearchCatQuery("");
                    setIsCategoryPickerOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#27262c] hover:bg-[#34333b] border border-white/5 text-xs font-semibold text-white active:scale-95 transition cursor-pointer shrink-0"
                >
                  Editar
                </button>
              </div>

              {/* Conta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                    <AccountBadge tx={selectedTx} customClasses="w-7 h-7 static" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400">Conta</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedAccount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Forma de pagamento */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center text-zinc-300 shrink-0 shadow-inner">
                    <selectedPm.icon className={`w-5 h-5 ${selectedPm.color}`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400">Forma de pagamento</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedAccount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parcelamento (se houver) */}
              {hasInstallments && (
                <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-zinc-400">Parcelamento</span>
                        <span className="text-sm font-semibold text-white truncate">
                          Parcela {currentInst} de {totalInst}x • Total R$ {formatCurrency(totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cronograma de Parcelas */}
                  {scheduleList.length > 0 && (
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-zinc-400">Próximos vencimentos:</span>
                      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                        {scheduleList.map((item) => {
                          const isCurrent = item.number === currentInst;
                          return (
                            <div
                              key={item.number}
                              className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl text-xs ${
                                isCurrent
                                  ? "bg-amber-400/15 border border-amber-400/30 text-amber-200 font-semibold"
                                  : "bg-white/[0.02] border border-white/5 text-zinc-400"
                              }`}
                            >
                              <span>Parcela {item.number}/{item.total}</span>
                              <span className="font-mono">{item.formattedDate}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dividir Gasto (se houver) */}
              {selectedTx.splits && selectedTx.splits.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-zinc-400">Dividir gasto</span>
                      <span className="text-sm font-semibold text-white truncate">
                        Dividido com {selectedTx.splits.length} pessoa{selectedTx.splits.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Marcar como recorrente */}
              <div className="flex items-center justify-between pt-4 mt-1 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-zinc-400 stroke-[2]" />
                  <span className="text-sm font-medium text-white">Marcar como recorrente</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRecurring}
                  aria-label="Marcar como recorrente"
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    selectedTx.isFixed ? "bg-white" : "bg-[#27262c]"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      selectedTx.isFixed ? "translate-x-6 bg-black" : "translate-x-1 bg-zinc-400"
                    }`}
                  />
                </button>
              </div>

              {/* Ocultar transação do extrato */}
              <div className="flex items-center justify-between pt-4 mt-1 border-t border-white/5">
                <div className="flex items-center gap-3">
                  {selectedTx.isHidden ? (
                    <EyeOff className="w-5 h-5 text-zinc-400 stroke-[2]" />
                  ) : (
                    <Eye className="w-5 h-5 text-zinc-400 stroke-[2]" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Ocultar transação</span>
                    <span className="text-[11px] text-zinc-400">Não exibir no extrato por padrão</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHideSelectedTx}
                  aria-label="Ocultar transação do extrato"
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    selectedTx.isHidden ? "bg-white" : "bg-[#27262c]"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      selectedTx.isHidden ? "translate-x-6 bg-black" : "translate-x-1 bg-zinc-400"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            {isConfirmDeleteOpen && (
              <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="w-full max-w-sm bg-[#18181c] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 text-white shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Excluir atividade?</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Esta ação não poderá ser desfeita.</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 bg-black/40 p-3 rounded-xl border border-white/5">
                    &ldquo;{selectedTx.title}&rdquo; no valor de R$ {formatCurrency(selectedTx.amount)}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(false)}
                      className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTx}
                      className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white transition cursor-pointer shadow-lg shadow-rose-600/30"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Editar Transação */}
            {isEditTxModalOpen && (
              <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                <div className="w-full max-w-full sm:max-w-[420px] max-h-[85dvh] sm:max-h-[80vh] bg-[#141418] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 text-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
                  {/* Header fixo */}
                  <div className="shrink-0 flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-base font-bold text-white">Editar Transação</h3>
                    <button
                      type="button"
                      onClick={() => setIsEditTxModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Formulário com scroll interno se necessário */}
                  <div className="flex-1 overflow-y-auto py-3.5 flex flex-col gap-3.5 no-scrollbar">
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1 block">Título da compra</label>
                      <input
                        type="text"
                        value={editTxTitle}
                        onChange={(e) => setEditTxTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-white/25"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1 block">Valor (R$)</label>
                      <input
                        type="text"
                        value={(editTxCentsAmount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "");
                          setEditTxCentsAmount(parseInt(digitsOnly, 10) || 0);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-white/25 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1 block">Data</label>
                        <input
                          type="date"
                          value={editTxDate}
                          onChange={(e) => setEditTxDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1 block">Horário</label>
                        <input
                          type="time"
                          value={editTxTime}
                          onChange={(e) => setEditTxTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação Fixos no rodapé */}
                  <div className="shrink-0 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10 flex items-center gap-2 bg-[#141418]">
                    <button
                      type="button"
                      onClick={() => setIsEditTxModalOpen(false)}
                      className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold text-zinc-300 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const newAmount = editTxCentsAmount > 0 ? editTxCentsAmount / 100 : selectedTx.amount;
                        const newTitle = editTxTitle.trim() || selectedTx.title;
                        const newDate = `${editTxDate}T${editTxTime}:00`;
                        const updatedTx: ExtratoTransaction = {
                          ...selectedTx,
                          title: newTitle,
                          amount: newAmount,
                          transactionDate: newDate,
                          paymentMethod: editTxPaymentMethod,
                        };
                        setSelectedTx(updatedTx);
                        setTransactions((prev) =>
                          prev.map((t) => (t.id === selectedTx.id ? updatedTx : t))
                        );
                        setIsEditTxModalOpen(false);
                        await updateTransactionAction(selectedTx.id, {
                          description: newTitle,
                          amount: newAmount,
                          paymentMethod: editTxPaymentMethod,
                        });
                      }}
                      className="flex-1 py-3 rounded-full bg-white text-black text-sm font-bold transition cursor-pointer hover:bg-zinc-200"
                    >
                      Salvar alterações
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col relative" data-purpose="cofrinho-extrato-view">
        {content}
      </div>
    );
  }

  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-[#09090b] text-white flex flex-col relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-extrato-view"
    >
      {content}

      {/* Floating Liquid Glass Dock (activeTab="extrato", setinhas ativas, home volta para "/") */}
      <FloatingCofrinhoDock
        hidden={isAnyOverlayOpen}
        activeTab="extrato"
        onAskCofrinho={onAskCofrinho || (() => console.log("Pergunte ao Pierre"))}
        onNavigateHome={() => (onNavigateToHome ? onNavigateToHome() : router.push("/"))}
        onTransfer={() => console.log("Já está no extrato")}
        onOpenMascot={onOpenMascot || (() => console.log("Mascote Pierre"))}
        placeholder="Pergunte ao Pierre"
      />
    </main>
  );
}

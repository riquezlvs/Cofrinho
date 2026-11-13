"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bike,
  Briefcase,
  Bus,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Coffee,
  CreditCard,
  Dumbbell,
  Eye,
  EyeOff,
  Fuel,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Home,
  Music,
  Pill,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import {
  CategorySpend,
  ExtratoCategory,
  ExtratoTransaction,
} from "@/types/finance";
import { Portal } from "@/components/ui/Portal";

interface SpendingDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions?: ExtratoTransaction[];
  allCategories?: ExtratoCategory[];
  fallbackTotalSpent?: number;
  fallbackCategories?: CategorySpend[];
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onViewExtrato?: () => void;
}

const MONTH_NAMES = [
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

const FALLBACK_COLORS = [
  "#ff6b00",
  "#ccff00",
  "#38bdf8",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#22c55e",
];

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CategoryGlyph({
  iconName,
  categoryName,
  size = 18,
  color,
  className = "",
}: {
  iconName?: string;
  categoryName?: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const key = (iconName || categoryName || "").toLowerCase();
  const props = {
    size,
    strokeWidth: 2,
    style: color ? { color } : undefined,
    className,
  };

  if (key.includes("mercado") || key.includes("cart") || key.includes("alimenta") || key.includes("compra")) {
    return <ShoppingCart {...props} />;
  }
  if (key.includes("food") || key.includes("restaurante") || key.includes("utensils") || key.includes("comida")) {
    return <Utensils {...props} />;
  }
  if (key.includes("cafe") || key.includes("coffee") || key.includes("bebida")) {
    return <Coffee {...props} />;
  }
  if (key.includes("delivery") || key.includes("bike")) {
    return <Bike {...props} />;
  }
  if (key.includes("car") || key.includes("transporte") || key.includes("uber")) {
    return <Car {...props} />;
  }
  if (key.includes("fuel") || key.includes("combust") || key.includes("posto")) {
    return <Fuel {...props} />;
  }
  if (key.includes("bus") || key.includes("onibus")) {
    return <Bus {...props} />;
  }
  if (key.includes("home") || key.includes("moradia") || key.includes("casa") || key.includes("aluguel")) {
    return <Home {...props} />;
  }
  if (key.includes("zap") || key.includes("luz") || key.includes("energia")) {
    return <Zap {...props} />;
  }
  if (key.includes("wifi") || key.includes("internet")) {
    return <Wifi {...props} />;
  }
  if (key.includes("pill") || key.includes("saude") || key.includes("farmacia")) {
    return <Pill {...props} />;
  }
  if (key.includes("heart") || key.includes("bem")) {
    return <Heart {...props} />;
  }
  if (key.includes("dumbbell") || key.includes("academia")) {
    return <Dumbbell {...props} />;
  }
  if (key.includes("music") || key.includes("lazer") || key.includes("stream")) {
    return <Music {...props} />;
  }
  if (key.includes("tv")) {
    return <Tv {...props} />;
  }
  if (key.includes("game")) {
    return <Gamepad2 {...props} />;
  }
  if (key.includes("plane") || key.includes("viagem")) {
    return <Plane {...props} />;
  }
  if (key.includes("bag") || key.includes("shopping")) {
    return <ShoppingBag {...props} />;
  }
  if (key.includes("globe") || key.includes("online")) {
    return <Globe {...props} />;
  }
  if (key.includes("smartphone") || key.includes("eletron")) {
    return <Smartphone {...props} />;
  }
  if (key.includes("wrench") || key.includes("manuten")) {
    return <Wrench {...props} />;
  }
  if (key.includes("gift") || key.includes("presente")) {
    return <Gift {...props} />;
  }
  if (key.includes("briefcase") || key.includes("trabalho")) {
    return <Briefcase {...props} />;
  }
  if (key.includes("credit") || key.includes("cartao")) {
    return <CreditCard {...props} />;
  }
  return <Tag {...props} />;
}

interface CategoryItemData {
  id: string;
  name: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
  parentId?: string | null;
}

interface GroupItemData {
  id: string;
  name: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
  subcategories: CategoryItemData[];
}

interface BubblePlacement {
  item: CategoryItemData;
  diameter: number;
  left: number; // % or px offset from center
  top: number;  // px offset from center
}

function computeBubblePlacements(items: CategoryItemData[]): BubblePlacement[] {
  if (items.length === 0) return [];
  const topItems = items.slice(0, 6);

  if (topItems.length === 1) {
    return [{ item: topItems[0], diameter: 136, left: 0, top: 0 }];
  }

  // Escala diâmetros entre 64px e 126px
  const maxPct = Math.max(...topItems.map((i) => i.percentage), 1);
  const diameters = topItems.map((item) => {
    const ratio = item.percentage / maxPct;
    return Math.round(64 + ratio * 62);
  });

  // Posições relativas ao centro (x, y) para evitar sobreposição
  const presets: [number, number][] = [
    [-38, -14],
    [54, -22],
    [46, 52],
    [-54, 54],
    [-8, -76],
    [92, 16],
  ];

  return topItems.map((item, idx) => ({
    item,
    diameter: diameters[idx],
    left: presets[idx]?.[0] ?? 0,
    top: presets[idx]?.[1] ?? 0,
  }));
}

export function SpendingDetailsScreen({
  isOpen,
  onClose,
  allTransactions = [],
  allCategories = [],
  fallbackTotalSpent = 0,
  fallbackCategories = [],
  isPrivacyHidden,
  onTogglePrivacy,
  onViewExtrato,
}: SpendingDetailsScreenProps) {
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState<"categorias" | "grupos">("categorias");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handlePrevMonth = () => {
    setSelectedCategoryId(null);
    if (selectedMonthIdx === 0) {
      setSelectedMonthIdx(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedCategoryId(null);
    if (selectedMonthIdx === 11) {
      setSelectedMonthIdx(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonthIdx((m) => m + 1);
    }
  };

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonthIdx === now.getMonth();

  const { totalSpent, categoryItems, groupItems } = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, "0")}`;

    const categoryById = new Map<string, ExtratoCategory>();
    const categoryByName = new Map<string, ExtratoCategory>();
    for (const c of allCategories) {
      categoryById.set(c.id, c);
      categoryByName.set(c.name.trim().toLowerCase(), c);
    }

    const monthExpenses = allTransactions.filter((tx) => {
      if (tx.type !== "expense" || tx.isHidden) return false;
      const dateStr = (tx.dateGroup || tx.transactionDate || "").split("T")[0];
      return dateStr.startsWith(prefix);
    });

    if (monthExpenses.length === 0 && isCurrentMonth && fallbackCategories.length > 0) {
      const total = fallbackTotalSpent > 0
        ? fallbackTotalSpent
        : fallbackCategories.reduce((s, c) => s + c.amount, 0);

      const catItems: CategoryItemData[] = fallbackCategories.map((c, idx) => ({
        id: `fallback-cat-${idx}`,
        name: c.name,
        color: c.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
        amount: c.amount,
        percentage: c.percentage,
      }));

      const grpItems: GroupItemData[] = catItems.map((c) => ({
        id: `grp-${c.id}`,
        name: c.name,
        color: c.color,
        amount: c.amount,
        percentage: c.percentage,
        subcategories: [c],
      }));

      return {
        totalSpent: total,
        categoryItems: catItems,
        groupItems: grpItems,
      };
    }

    const total = Number(
      monthExpenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0).toFixed(2)
    );

    const catMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        icon?: string;
        amount: number;
        parentId?: string | null;
      }
    >();

    monthExpenses.forEach((tx, idx) => {
      const matchedCat =
        (tx.categoryId && categoryById.get(tx.categoryId)) ||
        (tx.categoryName && categoryByName.get(tx.categoryName.trim().toLowerCase())) ||
        undefined;

      const catId = matchedCat?.id || tx.categoryId || tx.categoryName || `cat-${idx}`;
      const catName = matchedCat?.name || tx.categoryName || "Outros";
      const catColor =
        matchedCat?.color ||
        tx.categoryColor ||
        FALLBACK_COLORS[catMap.size % FALLBACK_COLORS.length];
      const catIcon = matchedCat?.icon || tx.categoryIcon;
      const parentId = matchedCat?.parentId || null;

      const existing = catMap.get(catId);
      if (existing) {
        existing.amount = Number((existing.amount + Number(tx.amount || 0)).toFixed(2));
      } else {
        catMap.set(catId, {
          id: catId,
          name: catName,
          color: catColor,
          icon: catIcon,
          amount: Number(Number(tx.amount || 0).toFixed(2)),
          parentId,
        });
      }
    });

    const sortedCats: CategoryItemData[] = Array.from(catMap.values())
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
      }));

    // Agrupamento por categoria pai (Grupos)
    const grpMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        icon?: string;
        amount: number;
        subcategories: CategoryItemData[];
      }
    >();

    for (const cat of sortedCats) {
      const parentCat = cat.parentId ? categoryById.get(cat.parentId) : undefined;
      const grpId = parentCat ? parentCat.id : cat.id;
      const grpName = parentCat ? parentCat.name : cat.name;
      const grpColor = parentCat?.color || cat.color;
      const grpIcon = parentCat?.icon || cat.icon;

      const existingGrp = grpMap.get(grpId);
      if (existingGrp) {
        existingGrp.amount = Number((existingGrp.amount + cat.amount).toFixed(2));
        existingGrp.subcategories.push(cat);
      } else {
        grpMap.set(grpId, {
          id: grpId,
          name: grpName,
          color: grpColor,
          icon: grpIcon,
          amount: cat.amount,
          subcategories: [cat],
        });
      }
    }

    const sortedGroups: GroupItemData[] = Array.from(grpMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((g) => ({
        ...g,
        percentage: total > 0 ? Math.round((g.amount / total) * 100) : 0,
      }));

    return {
      totalSpent: total,
      categoryItems: sortedCats,
      groupItems: sortedGroups,
    };
  }, [
    allTransactions,
    allCategories,
    selectedYear,
    selectedMonthIdx,
    isCurrentMonth,
    fallbackCategories,
    fallbackTotalSpent,
  ]);

  const bubbles = useMemo(() => computeBubblePlacements(categoryItems), [categoryItems]);

  // Cálculos do Donut SVG (Grupos)
  const donutSegments = useMemo(() => {
    const radius = 84;
    const circumference = 2 * Math.PI * radius;
    if (groupItems.length === 0 || totalSpent <= 0) return [];

    if (groupItems.length === 1) {
      // Anel quase completo com pequena abertura no topo (como na referência)
      const arcLen = circumference * 0.96;
      return [
        {
          id: groupItems[0].id,
          color: groupItems[0].color,
          dashArray: `${arcLen.toFixed(2)} ${(circumference - arcLen).toFixed(2)}`,
          dashOffset: 0,
          rotation: -82,
        },
      ];
    }

    const gap = 14;
    const usableCirc = Math.max(10, circumference - gap * groupItems.length);
    let offset = 0;

    return groupItems.map((g) => {
      const share = g.amount / totalSpent;
      const arcLen = Math.max(8, share * usableCirc);
      const seg = {
        id: g.id,
        color: g.color,
        dashArray: `${arcLen.toFixed(2)} ${(circumference - arcLen).toFixed(2)}`,
        dashOffset: -offset,
        rotation: -85,
      };
      offset += arcLen + gap;
      return seg;
    });
  }, [groupItems, totalSpent]);

  if (!isOpen) return null;

  const monthLabel = `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear}`;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes de gastos do mês"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full sm:h-[94vh] sm:my-auto sm:rounded-[40px] sm:border sm:border-zinc-800/80 bg-[#050507] text-white flex flex-col overflow-hidden relative shadow-2xl">
          {/* Header */}
          <header className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1 bg-white/[0.08] border border-white/[0.12] rounded-full px-2 py-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mês anterior"
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-white px-2 min-w-[122px] text-center">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
              className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              {isPrivacyHidden ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </header>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-10 flex flex-col gap-5">
            {activeTab === "categorias" ? (
              <>
                {/* Resumo do Mês */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-zinc-400">
                    Gastos no mês de {MONTH_NAMES[selectedMonthIdx]}
                  </p>
                  <p
                    className={`text-3xl font-extrabold tracking-tight text-white mt-0.5 ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(totalSpent)}
                  </p>
                </div>

                {/* Gráfico de Bolhas Proporcionais */}
                <div className="relative w-full h-[220px] flex items-center justify-center">
                  {bubbles.length > 0 ? (
                    bubbles.map((b) => {
                      const isSelected = selectedCategoryId === b.item.id;
                      return (
                        <button
                          key={b.item.id}
                          type="button"
                          onClick={() =>
                            setSelectedCategoryId((prev) =>
                              prev === b.item.id ? null : b.item.id
                            )
                          }
                          style={{
                            width: `${b.diameter}px`,
                            height: `${b.diameter}px`,
                            transform: `translate(${b.left}px, ${b.top}px)`,
                            backgroundColor: `${b.item.color}24`,
                            borderColor: isSelected
                              ? b.item.color
                              : `${b.item.color}80`,
                          }}
                          className="absolute rounded-full border-[1.5px] flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg"
                        >
                          <CategoryGlyph
                            iconName={b.item.icon}
                            categoryName={b.item.name}
                            size={b.diameter >= 110 ? 22 : 16}
                            color={b.item.color}
                          />
                          <span
                            className="text-xs sm:text-sm font-semibold"
                            style={{ color: b.item.color }}
                          >
                            {b.item.percentage}%
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="w-36 h-36 rounded-full border border-dashed border-white/15 flex flex-col items-center justify-center text-center px-4">
                      <span className="text-xs text-zinc-500">
                        Sem gastos neste mês
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Aba Grupos: Gráfico Donut com Pontas Arredondadas */
              <div className="relative w-full py-4 flex items-center justify-center">
                <div className="relative w-[220px] h-[220px] flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 220 220">
                    <circle
                      cx="110"
                      cy="110"
                      r="84"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="18"
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.id}
                        cx="110"
                        cy="110"
                        r="84"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                        strokeLinecap="round"
                        transform={`rotate(${seg.rotation} 110 110)`}
                        className="transition-all duration-500"
                      />
                    ))}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <span
                      className={`text-2xl sm:text-[26px] font-extrabold tracking-tight text-white ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      R$ {Math.round(totalSpent).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5">
                      gastos esse mês
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Controle Segmentado: Categorias | Grupos */}
            <div className="w-full p-1 rounded-full bg-white/[0.07] border border-white/[0.1] grid grid-cols-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("categorias")}
                className={`py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                  activeTab === "categorias"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-300 hover:text-white font-medium"
                }`}
              >
                Categorias
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("grupos")}
                className={`py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                  activeTab === "grupos"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-300 hover:text-white font-medium"
                }`}
              >
                Grupos
              </button>
            </div>

            {/* Lista Detalhada */}
            {activeTab === "categorias" ? (
              <div className="flex flex-col gap-3 pt-1">
                {categoryItems.length > 0 ? (
                  categoryItems.map((cat) => {
                    const isHighlighted = selectedCategoryId === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() =>
                          setSelectedCategoryId((prev) =>
                            prev === cat.id ? null : cat.id
                          )
                        }
                        className={`flex items-center justify-between px-3 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                          isHighlighted
                            ? "bg-white/[0.08] border border-white/15"
                            : "hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                            <CategoryGlyph
                              iconName={cat.icon}
                              categoryName={cat.name}
                              size={18}
                              color={cat.color}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">
                              {cat.name}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-semibold text-white shrink-0 ml-3 ${
                            isPrivacyHidden ? "balance-blur" : ""
                          }`}
                        >
                          R$ {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-zinc-500 py-6">
                    Nenhuma despesa registrada neste mês.
                  </p>
                )}
              </div>
            ) : (
              /* Aba Grupos: Cards Expansíveis */
              <div className="flex flex-col gap-3 pt-1">
                {groupItems.length > 0 ? (
                  groupItems.map((grp, grpIdx) => {
                    const isExpanded =
                      expandedGroups[grp.id] !== undefined
                        ? expandedGroups[grp.id]
                        : grpIdx === 0;
                    return (
                      <div
                        key={grp.id}
                        className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGroups((prev) => ({
                              ...prev,
                              [grp.id]: !isExpanded,
                            }))
                          }
                          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm"
                              style={{ backgroundColor: grp.color }}
                            >
                              <CategoryGlyph
                                iconName={grp.icon}
                                categoryName={grp.name}
                                size={18}
                                color="#ffffff"
                              />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-sm font-semibold text-white truncate">
                                {grp.name}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {grp.percentage}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span
                              className={`text-sm font-semibold text-white ${
                                isPrivacyHidden ? "balance-blur" : ""
                              }`}
                            >
                              R$ {formatCurrency(grp.amount)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/[0.06] px-4 pt-2 pb-1 flex flex-col">
                            {grp.subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between py-2.5"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0">
                                    <CategoryGlyph
                                      iconName={sub.icon}
                                      categoryName={sub.name}
                                      size={16}
                                      color={sub.color}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-zinc-200 truncate">
                                    {sub.name}
                                  </span>
                                </div>
                                <span
                                  className={`text-sm font-semibold text-white shrink-0 ml-3 ${
                                    isPrivacyHidden ? "balance-blur" : ""
                                  }`}
                                >
                                  R$ {formatCurrency(sub.amount)}
                                </span>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewExtrato?.();
                              }}
                              className="w-full py-3 mt-1 text-center text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                            >
                              Ver detalhes
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-zinc-500 py-6">
                    Nenhum grupo de despesas neste mês.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

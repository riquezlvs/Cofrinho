"use client";

import React, { useState, useMemo } from "react";
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
  ShoppingCart,
  Car,
  Pill,
  Music,
  ArrowDownLeft,
  Home,
} from "lucide-react";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { ExtratoData, ExtratoTransaction, Person } from "@/types/finance";
import { addTransactionAction, createPersonAction } from "@/app/actions/transactions";

interface ExtratoClientProps {
  initialData: ExtratoData;
}

type FilterType = "all" | "income" | "expense" | "payment";
type PeriodFilter = "all" | "today" | "week" | "month";
type SortOrder = "recent" | "highest" | "lowest";

export function ExtratoClient({ initialData }: ExtratoClientProps) {
  const router = useRouter();

  // Estados principais de transações
  const [transactions, setTransactions] = useState<ExtratoTransaction[]>(
    initialData.transactions || []
  );
  const [isPrivacyHidden, setIsPrivacyHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Modais
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<ExtratoTransaction | null>(null);

  // Filtros avançados
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

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
    return initialData.creditCards || [{ id: "card-santander", name: "Cartão Santander" }];
  }, [initialData.creditCards]);

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
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newCurrency, setNewCurrency] = useState("BRL");
  const [newPaymentMethod, setNewPaymentMethod] = useState<
    "pix" | "credit" | "debit" | "vr" | "cash"
  >("debit");
  const [newAccountId, setNewAccountId] = useState(
    availableAccounts[0]?.id || "acc-nubank"
  );
  const [isFixedTx, setIsFixedTx] = useState(false);

  // Campos específicos: Dividir gasto (Rachadinha / Split)
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialData.people?.[0]?.id || "p-1"
  );
  const [splitPercentage, setSplitPercentage] = useState<number>(50);

  // Cadastro rápido de nova pessoa
  const [isRegisteringPerson, setIsRegisteringPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonPix, setNewPersonPix] = useState("");

  // Campos específicos: Entrada (Income Type & Renda Fixa)
  const [incomeType, setIncomeType] = useState<string>("Salário");
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

  // Cálculo da divisão de gastos (Splits)
  const totalAmountNum = centsAmount / 100;
  const personOwedNum = useMemo(() => {
    return Number(((totalAmountNum * splitPercentage) / 100).toFixed(2));
  }, [totalAmountNum, splitPercentage]);

  const myPartNum = useMemo(() => {
    return Number(Math.max(0, totalAmountNum - personOwedNum).toFixed(2));
  }, [totalAmountNum, personOwedNum]);

  const selectedPersonName = useMemo(() => {
    const p = people.find((item) => item.id === selectedPersonId);
    return p ? p.name : "Amigo";
  }, [people, selectedPersonId]);

  // Quantidade de filtros aplicados
  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilter !== "all") count += 1;
    if (periodFilter !== "all") count += 1;
    if (sortOrder !== "recent") count += 1;
    return count;
  }, [activeFilter, periodFilter, sortOrder]);

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
    setSortOrder("recent");
  };

  // Cadastrar nova pessoa inline e já selecionar
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
    setSelectedPersonId(tempId);
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
          setSelectedPersonId(res.data.id);
        }
      });
    } catch (err) {
      console.error("Erro ao cadastrar pessoa:", err);
    }
  };

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
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
          const amountStr = tx.amount.toString();
          if (
            !title.includes(query) &&
            !desc.includes(query) &&
            !cat.includes(query) &&
            !method.includes(query) &&
            !amountStr.includes(query)
          ) {
            return false;
          }
        }

        // 3. Filtro por período
        if (periodFilter === "today") {
          const today = new Date().toISOString().split("T")[0];
          if (tx.transactionDate !== today) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "highest") return b.amount - a.amount;
        if (sortOrder === "lowest") return a.amount - b.amount;
        return (
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
      });
  }, [transactions, activeFilter, searchQuery, periodFilter, sortOrder]);

  // Formatação de data curta da transação (ex: "8 de nov")
  const formatTransactionDate = (dateStr: string) => {
    if (!dateStr) return "8 de nov";
    const parts = dateStr.split("-");
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

  // Ícone específico com a cor correspondente à categoria
  const renderTransactionIcon = (tx: ExtratoTransaction) => {
    const cat = (tx.categoryName || "").toLowerCase();
    const desc = (tx.description || "").toLowerCase();
    const title = (tx.title || "").toLowerCase();

    if (
      cat.includes("supermercado") ||
      cat.includes("alimenta") ||
      cat.includes("mercado") ||
      desc.includes("mercado") ||
      title.includes("mercado")
    ) {
      return <ShoppingCart className="w-5 h-5 text-orange-400 stroke-[2]" />;
    }
    if (
      cat.includes("transporte") ||
      cat.includes("uber") ||
      desc.includes("uber") ||
      title.includes("uber")
    ) {
      return <Car className="w-5 h-5 text-sky-400 stroke-[2]" />;
    }
    if (
      cat.includes("saúde") ||
      cat.includes("saude") ||
      cat.includes("farmácia") ||
      cat.includes("farmacia") ||
      desc.includes("farmácia")
    ) {
      return <Pill className="w-5 h-5 text-rose-400 stroke-[2]" />;
    }
    if (
      cat.includes("lazer") ||
      cat.includes("streaming") ||
      cat.includes("música") ||
      desc.includes("spotify") ||
      title.includes("spotify")
    ) {
      return <Music className="w-5 h-5 text-purple-400 stroke-[2]" />;
    }
    if (
      cat.includes("moradia") ||
      cat.includes("contas") ||
      desc.includes("aluguel")
    ) {
      return <Home className="w-5 h-5 text-amber-400 stroke-[2]" />;
    }
    if (tx.type === "income" || tx.paymentMethod === "pix") {
      return <ArrowDownLeft className="w-5 h-5 text-emerald-400 stroke-[2.2]" />;
    }
    return <ShoppingCart className="w-5 h-5 text-orange-400 stroke-[2]" />;
  };

  // Agrupamento por data (Hoje, Ontem, etc.) fiel à imagem
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: ExtratoTransaction[] } = {};
    const todayStr = "2026-11-08";

    filteredTransactions.forEach((tx) => {
      let groupKey = "Hoje";
      const txDate = tx.transactionDate || "";
      if (txDate === todayStr || tx.formattedDate === "Hoje" || !txDate) {
        groupKey = "Hoje";
      } else {
        const parts = txDate.split("-");
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const m = parseInt(parts[1], 10) - 1;
          const monthsShort = [
            "jan", "fev", "mar", "abr", "mai", "jun",
            "jul", "ago", "set", "out", "nov", "dez"
          ];
          if (day === 7 && m === 10) {
            groupKey = "Ontem";
          } else {
            groupKey = `${day} de ${monthsShort[m]}`;
          }
        } else {
          groupKey = txDate;
        }
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

    const selectedCategoryObj = availableCategories.find((c) => c.id === newCategoryId);
    const selectedCatName = selectedCategoryObj
      ? selectedCategoryObj.name
      : newType === "income"
      ? incomeType
      : "Geral";

    const tempId = `tx-${Date.now()}`;
    const parts = newDate.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : newDate;

    let icon = "cart";
    if (newType === "income") {
      icon = incomeType === "VR / VA" ? "cart" : "pix";
    } else if (newPaymentMethod === "pix") {
      icon = "pix";
    } else if (
      selectedCatName.toLowerCase().includes("transporte") ||
      selectedCatName.toLowerCase().includes("uber")
    ) {
      icon = "car";
    } else if (
      selectedCatName.toLowerCase().includes("saúde") ||
      selectedCatName.toLowerCase().includes("farmácia")
    ) {
      icon = "pill";
    } else if (
      selectedCatName.toLowerCase().includes("lazer") ||
      selectedCatName.toLowerCase().includes("streaming")
    ) {
      icon = "music";
    }

    let methodLabel = "Pix";
    if (newPaymentMethod === "credit") methodLabel = "Cartão de Crédito";
    else if (newPaymentMethod === "debit") methodLabel = "Cartão de Débito";
    else if (newPaymentMethod === "vr") methodLabel = "Vale Refeição";
    else if (newPaymentMethod === "cash") methodLabel = "Dinheiro";

    // Informação de subtítulo
    let subtitle = `${methodLabel} • ${formattedDate}`;
    if (newType === "expense" && isSplitEnabled) {
      subtitle += ` • Dividido com ${selectedPersonName} (${splitPercentage}%)`;
    } else if (newType === "income" && isFixedIncome) {
      subtitle += ` • Fixo dia ${incomeDayOfMonth}`;
    }

    const newTx: ExtratoTransaction = {
      id: tempId,
      title: newTitle.trim(),
      description: subtitle,
      amount: finalAmount,
      type: newType,
      categoryIcon: icon,
      categoryName: selectedCatName,
      categoryColor: selectedCategoryObj?.color || "#ccff00",
      paymentMethod: newPaymentMethod,
      transactionDate: newDate,
      formattedDate,
      status: "paid",
      isFixed: newType === "expense" ? isFixedTx : isFixedIncome,
    };

    // Atualiza estado local imediatamente
    setTransactions((prev) => [newTx, ...prev]);

    // Persiste no Supabase de forma assíncrona
    try {
      addTransactionAction({
        description: newTitle.trim(),
        amount: finalAmount,
        type: newType,
        paymentMethod: newPaymentMethod,
        transactionDate: newDate,
        categoryId: newCategoryId || undefined,
        accountId: newPaymentMethod !== "credit" ? newAccountId : undefined,
        creditCardId: newPaymentMethod === "credit" ? newAccountId : undefined,
        isFixed: newType === "expense" ? isFixedTx : isFixedIncome,
        incomeType: newType === "income" ? incomeType : undefined,
        split:
          newType === "expense" && isSplitEnabled
            ? {
                personId: selectedPersonId,
                amountOwed: personOwedNum,
                percentage: splitPercentage,
              }
            : undefined,
        fixedRule:
          newType === "income" && isFixedIncome
            ? {
                dayOfMonth: incomeDayOfMonth,
                adjustBusinessDay: incomeAdjustBusinessDay,
                shiftDirection: incomeShiftDirection,
              }
            : undefined,
      }).then((res) => {
        if (res && res.success && res.data) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: res.data!.id } : t))
          );
        }
      });
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
    }

    // Limpa formulário e fecha tela
    setNewTitle("");
    setCentsAmount(0);
    setIsSplitEnabled(false);
    setIsFixedIncome(false);
    setIsNewTxModalOpen(false);
  };

  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-[#09090b] text-white flex flex-col relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-extrato-view"
    >
      {/* Conteúdo rolável principal */}
      <div className="w-full flex-1 px-4 sm:px-5 pt-4 pb-44 z-10 flex flex-col">
        {/* Top Header Bar: Eye privacy (esquerda) + Plus lime button (direita) */}
        <header className="flex items-center justify-between w-full pt-1 pb-3 select-none">
          {/* Eye Button */}
          <button
            type="button"
            onClick={() => setIsPrivacyHidden(!isPrivacyHidden)}
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

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="flex items-center justify-between py-2.5 cursor-pointer group active:opacity-75 transition select-none"
                      >
                        {/* Lado Esquerdo: Ícone com Badge Mascote */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-[#1b1c22] border border-white/5 flex items-center justify-center shadow-inner">
                              {renderTransactionIcon(tx)}
                            </div>

                            {/* Badge do Mascote Pierre no canto inferior direito */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#101014] border border-white/20 flex items-center justify-center shadow-md">
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                viewBox="0 0 32 32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M7 13 L6 6 L12 9.5 C13.3 9.2 14.6 9 16 9 C17.4 9 18.7 9.2 20 9.5 L26 6 L25 13 C26.3 15 27 17.4 27 20 C27 25 22 28 16 28 C10 28 5 25 5 20 C5 17.4 5.7 15 7 13 Z" />
                                <path d="M9 18 H13 V20 H9 Z" fill="white" />
                                <path d="M19 18 H23 V20 H19 Z" fill="white" />
                              </svg>
                            </div>
                          </div>

                          {/* Textos: 3 linhas */}
                          <div className="flex flex-col min-w-0">
                            {/* Linha 1: Título (ex: djjdjd) */}
                            <span className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">
                              {tx.title}
                            </span>
                            {/* Linha 2: Data • Categoria (ex: 8 de nov • Supermercado) */}
                            <span className="text-xs text-zinc-400 mt-1 leading-tight truncate">
                              {formatTransactionDate(tx.transactionDate)} • {tx.categoryName || "Supermercado"}
                            </span>
                            {/* Linha 3: Carteira / Conta (ex: Carteira Pierre) */}
                            <span className="text-xs text-zinc-400 mt-0.5 leading-tight truncate">
                              {tx.accountOrCard || "Carteira Pierre"}
                            </span>
                          </div>
                        </div>

                        {/* Lado Direito: Valor (-R$ 65,65 em vermelho coral) */}
                        <div className="shrink-0 text-right pl-3">
                          <span
                            className={`text-[15px] font-bold font-mono tracking-tight ${
                              isIncome ? "text-[#52e374]" : "text-[#f87171]"
                            } ${isPrivacyHidden ? "balance-blur" : ""}`}
                          >
                            {isIncome ? "+R$ " : "-R$ "}{formatCurrency(tx.amount)}
                          </span>
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
        <div className="absolute inset-0 z-50 bg-[#09090b] flex flex-col justify-between p-5 sm:p-6 text-white animate-in slide-in-from-bottom duration-300 sm:rounded-[44px] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-4">
            {/* Header: Título centralizado + botão fechar X circular */}
            <div className="relative flex items-center justify-center pt-2 pb-1">
              <h2 className="text-base sm:text-[17px] font-bold text-white tracking-tight">
                Nova transação
              </h2>
              <button
                type="button"
                onClick={() => setIsNewTxModalOpen(false)}
                className="absolute right-0 w-9 h-9 rounded-full bg-[#27262c] hover:bg-[#34333b] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Pill: Saída (⊖ Saída) vs Entrada (⊕ Entrada) */}
            <div className="w-full bg-[#141418] p-1 rounded-full flex items-center border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setNewType("expense")}
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
                onClick={() => setNewType("income")}
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
              {/* CAMPO ESPECÍFICO DE ENTRADA: Tipo de Entrada */}
              {newType === "income" && (
                <div className="py-3.5 flex items-center justify-between gap-4 relative">
                  <span className="text-zinc-400 font-normal shrink-0">Tipo de entrada</span>
                  <div className="flex items-center gap-1.5 text-zinc-200 relative">
                    <select
                      value={incomeType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIncomeType(val);
                        if (val === "VR / VA (Benefício)") {
                          setNewPaymentMethod("vr");
                        } else {
                          setNewPaymentMethod("pix");
                        }
                      }}
                      className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-[#ccff00]"
                    >
                      <option value="Salário" className="bg-[#1c1c22] text-white">
                        💼 Salário
                      </option>
                      <option value="Freelance" className="bg-[#1c1c22] text-white">
                        💻 Freelance
                      </option>
                      <option value="VR / VA (Benefício)" className="bg-[#1c1c22] text-white">
                        🍽️ VR / VA (Benefício)
                      </option>
                      <option value="Investimentos" className="bg-[#1c1c22] text-white">
                        📈 Investimentos / Rendimentos
                      </option>
                      <option value="Reembolso" className="bg-[#1c1c22] text-white">
                        🔄 Reembolso
                      </option>
                      <option value="Bônus / Presente" className="bg-[#1c1c22] text-white">
                        🎁 Bônus / Presente
                      </option>
                      <option value="Outros" className="bg-[#1c1c22] text-white">
                        🏷️ Outros
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-zinc-400 font-normal shrink-0">Descrição</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newType === "income"
                      ? `Ex: ${incomeType} de Novembro`
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

              {/* Categoria */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">Categoria</span>
                <div className="flex items-center gap-1.5 text-zinc-200 relative">
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-white"
                  >
                    <option value="" className="bg-[#1c1c22] text-zinc-400">
                      Selecione a categoria...
                    </option>
                    {(() => {
                      const filtered = availableCategories.filter((c) =>
                        newType === "income" ? c.type === "income" : c.type === "expense"
                      );
                      const parents = filtered.filter((c) => !c.parentId);
                      const children = filtered.filter((c) => c.parentId);

                      if (children.length === 0) {
                        return filtered.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-[#1c1c22] text-white">
                            {cat.name}
                          </option>
                        ));
                      }

                      return parents.map((parent) => {
                        const subs = children.filter((sub) => sub.parentId === parent.id);
                        if (subs.length === 0) {
                          return (
                            <option key={parent.id} value={parent.id} className="bg-[#1c1c22] text-white">
                              {parent.name}
                            </option>
                          );
                        }
                        return (
                          <optgroup key={parent.id} label={parent.name} className="bg-[#141418] text-[#ccff00] font-semibold">
                            <option value={parent.id} className="bg-[#1c1c22] text-white font-normal">
                              {parent.name} (Geral)
                            </option>
                            {subs.map((sub) => (
                              <option key={sub.id} value={sub.id} className="bg-[#1c1c22] text-white font-normal">
                                {sub.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      });
                    })()}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
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

              {/* Conta ou Cartão */}
              <div className="py-3.5 flex items-center justify-between gap-4 relative">
                <span className="text-zinc-400 font-normal shrink-0">
                  {newType === "income" ? "Conta de destino" : "Conta / Cartão"}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-200 relative">
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="appearance-none bg-transparent text-right font-medium pr-5 focus:outline-none cursor-pointer text-white"
                  >
                    {newPaymentMethod === "credit" ? (
                      availableCards.map((card) => (
                        <option key={card.id} value={card.id} className="bg-[#1c1c22]">
                          {card.name}
                        </option>
                      ))
                    ) : (
                      availableAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-[#1c1c22]">
                          {acc.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-0" />
                </div>
              </div>

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

                  {/* Detalhes do Rateio / Split */}
                  {isSplitEnabled && (
                    <div className="mt-1 p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col gap-3.5 animate-in fade-in duration-200">
                      {/* Selecionar ou cadastrar pessoa */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-zinc-400 font-medium">
                            Com quem você vai dividir?
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsRegisteringPerson(!isRegisteringPerson)}
                            className="text-xs text-lime-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>
                              {isRegisteringPerson ? "Selecionar da lista" : "+ Cadastrar nova pessoa"}
                            </span>
                          </button>
                        </div>

                        {/* Formulário inline de nova pessoa */}
                        {isRegisteringPerson ? (
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2 mt-1">
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
                                className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleQuickRegisterPerson}
                                disabled={!newPersonName.trim()}
                                className="flex-1 py-1.5 rounded-lg bg-lime-400 text-black text-xs font-bold disabled:opacity-50"
                              >
                                Salvar contato
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={selectedPersonId}
                              onChange={(e) => setSelectedPersonId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-white focus:outline-none appearance-none cursor-pointer"
                            >
                              {people.map((person) => (
                                <option
                                  key={person.id}
                                  value={person.id}
                                  className="bg-[#1c1c22] text-white"
                                >
                                  {person.name}{" "}
                                  {person.pixKey ? `(Pix: ${person.pixKey})` : ""}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                          </div>
                        )}
                      </div>

                      {/* Porcentagem ou Valor do Rateio */}
                      <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                        <label className="text-xs text-zinc-400 font-medium">
                          Quanto {selectedPersonName} vai pagar?
                        </label>

                        {/* Atalhos de Porcentagem */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: "50% (Meio a meio)", val: 50 },
                            { label: "33%", val: 33 },
                            { label: "25%", val: 25 },
                            { label: "70%", val: 70 },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setSplitPercentage(item.val)}
                              className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold border transition text-center cursor-pointer ${
                                splitPercentage === item.val
                                  ? "bg-white text-black border-white shadow-sm font-bold"
                                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Sliders / Inputs sincronizados */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs">
                            <span className="text-zinc-400">Porcentagem:</span>
                            <div className="flex items-center gap-1 font-bold text-white">
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={splitPercentage}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value || "50", 10);
                                  setSplitPercentage(Math.min(99, Math.max(1, v)));
                                }}
                                className="w-10 bg-transparent text-right focus:outline-none text-white font-mono"
                              />
                              <span>%</span>
                            </div>
                          </div>

                          <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs">
                            <span className="text-zinc-400">Valor a cobrar:</span>
                            <span className="font-bold text-lime-400 font-mono">
                              R$ {formatCurrency(personOwedNum)}
                            </span>
                          </div>
                        </div>

                        {/* Resumo da Divisão */}
                        <div className="mt-1 p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-zinc-400">
                            Sua parte:{" "}
                            <strong className="text-white font-mono">
                              R$ {formatCurrency(myPartNum)} ({100 - splitPercentage}%)
                            </strong>
                          </span>
                          <span className="text-lime-400 font-medium">
                            A receber: R$ {formatCurrency(personOwedNum)}
                          </span>
                        </div>
                      </div>
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

          {/* Botão de ação inferior: "Adicionar transação" */}
          <div className="pt-6 pb-2">
            <button
              type="button"
              onClick={handleSaveTransaction}
              disabled={centsAmount <= 0 || !newTitle.trim()}
              className={`w-full py-4 rounded-full font-semibold text-base transition-all active:scale-[0.98] cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                centsAmount > 0 && newTitle.trim()
                  ? "bg-[#d4d4d8] hover:bg-white text-black"
                  : "bg-[#27272a] text-zinc-500 cursor-not-allowed"
              }`}
            >
              <span>Adicionar transação</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Filtros Avançados */}
      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div
            className="w-full max-w-full sm:max-w-[420px] bg-[#141418] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 text-white shadow-2xl flex flex-col gap-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Filtros Avançados</h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Período
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all", label: "Todo o histórico" },
                  { id: "today", label: "Hoje" },
                  { id: "week", label: "Últimos 7 dias" },
                  { id: "month", label: "Este mês" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodFilter(p.id as PeriodFilter)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      periodFilter === p.id
                        ? "bg-[#ccff00] text-black border-[#ccff00] font-bold"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenação */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Ordenar por
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "recent", label: "Recentes" },
                  { id: "highest", label: "Maior R$" },
                  { id: "lowest", label: "Menor R$" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortOrder(s.id as SortOrder)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition ${
                      sortOrder === s.id
                        ? "bg-[#ccff00] text-black border-[#ccff00] font-bold"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setIsFilterSheetOpen(false);
                }}
                className="flex-1 py-3 rounded-full border border-white/10 text-zinc-300 text-sm font-semibold hover:bg-white/5 active:scale-95 transition"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-3 rounded-full bg-[#ccff00] text-black text-sm font-bold active:scale-95 transition shadow-md"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Transação */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-full sm:max-w-[420px] bg-[#141418] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 text-white shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Detalhes da Atividade</h3>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center py-2">
              <TransactionIcon
                title={selectedTx.title}
                categoryIcon={selectedTx.categoryIcon}
                type={selectedTx.type}
                size={56}
              />
              <span className="text-lg font-bold text-white mt-3">{selectedTx.title}</span>
              <span
                className={`text-2xl font-black font-mono mt-1 ${
                  selectedTx.type === "income" ? "text-[#52e374]" : "text-white"
                } ${isPrivacyHidden ? "balance-blur" : ""}`}
              >
                {selectedTx.type === "income" ? "+" : "-"} R${" "}
                {formatCurrency(selectedTx.amount)}
              </span>
            </div>

            <div className="space-y-2.5 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Data</span>
                <span className="text-white font-medium">
                  {selectedTx.transactionDate || "Hoje"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Categoria</span>
                <span className="text-white font-medium">
                  {selectedTx.categoryName || "Geral"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Método / Detalhe</span>
                <span className="text-white font-medium">
                  {selectedTx.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Concluído
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-full bg-zinc-800 text-white font-bold text-sm active:scale-95 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Floating Liquid Glass Dock (activeTab="extrato", setinhas ativas, home volta para "/") */}
      <FloatingCofrinhoDock
        activeTab="extrato"
        onAskCofrinho={() => console.log("Pergunte ao Pierre")}
        onNavigateHome={() => router.push("/")}
        onTransfer={() => console.log("Já está no extrato")}
        onOpenMascot={() => console.log("Mascote Pierre")}
        placeholder="Pergunte ao Pierre"
      />
    </main>
  );
}

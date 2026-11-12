"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Plus, X, Loader2 } from "lucide-react";
import { AccountSummary, Transaction } from "@/types/finance";
import { AccountLogo, formatAccountCurrency } from "@/components/finance/AccountsOverviewCard";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { Portal } from "@/components/ui/Portal";
import { addAccountAction } from "@/app/actions/accounts";

interface AccountsDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSummary[];
  totalBalance: number;
  recentTransactions: Transaction[];
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onViewAllTransactions: () => void;
  onAccountAdded?: (newAccount: AccountSummary) => void;
}

const ACCOUNT_TYPES: {
  value: AccountSummary["type"];
  label: string;
}[] = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Carteira / Dinheiro" },
  { value: "vr", label: "Vale Refeição (VR)" },
  { value: "va", label: "Vale Alimentação (VA)" },
];

export function AccountsDetailsScreen({
  isOpen,
  onClose,
  accounts,
  totalBalance,
  recentTransactions,
  isPrivacyHidden,
  onTogglePrivacy,
  onViewAllTransactions,
  onAccountAdded,
}: AccountsDetailsScreenProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountSummary["type"]>("checking");
  const [balanceInput, setBalanceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isAddModalOpen, onClose]);

  if (!isOpen) return null;

  // Prioriza transações vinculadas a contas; caso contrário exibe as últimas transações do banco
  const accountLinkedTxs = recentTransactions.filter((t) => Boolean(t.accountId));
  const displayedTransactions = (
    accountLinkedTxs.length > 0 ? accountLinkedTxs : recentTransactions
  ).slice(0, 5);

  const hasPositiveBalances = accounts.some((a) => a.amount > 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Informe o nome da conta.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const parsedBalance = parseFloat(balanceInput.replace(",", ".")) || 0;

    const result = await addAccountAction({
      name: name.trim(),
      type: accountType,
      balance: parsedBalance,
    });

    setIsSubmitting(false);

    if (!result.success || !result.data) {
      setErrorMsg(result.error || "Não foi possível adicionar a conta.");
      return;
    }

    onAccountAdded?.(result.data);
    setName("");
    setBalanceInput("");
    setAccountType("checking");
    setIsAddModalOpen(false);
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes de saldos em contas"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full bg-[#09090b] text-white flex flex-col relative sm:my-6 sm:h-[calc(100vh-3rem)] sm:rounded-[44px] sm:border sm:border-zinc-800/80 overflow-hidden shadow-2xl">
          {/* Topo: Botão Voltar + Botão Ocultar Saldo */}
          <header className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-label={isPrivacyHidden ? "Mostrar saldos" : "Ocultar saldos"}
              className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              {isPrivacyHidden ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </header>

          {/* Conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-6">
            {/* Cabeçalho de Saldo */}
            <section className="pt-2 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-zinc-400">
                  {accounts.length === 0
                    ? "Saldo em contas"
                    : `Saldo em ${accounts.length} ${
                        accounts.length === 1 ? "conta" : "contas"
                      }`}
                </span>
                <h1
                  className={`text-[36px] leading-tight font-extrabold tracking-tight text-white ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  {formatAccountCurrency(totalBalance)}
                </h1>
              </div>

              {/* Barra horizontal de proporção */}
              <div className="w-full h-2 rounded-full bg-white/[0.1] overflow-hidden flex gap-0.5">
                {hasPositiveBalances &&
                  accounts
                    .filter((a) => a.amount > 0 && a.percentage > 0)
                    .map((acc, i) => {
                      let barColor = "bg-zinc-300";
                      if (acc.logoType === "santander") barColor = "bg-[#ec0000]";
                      else if (acc.logoType === "nubank") barColor = "bg-[#820AD1]";
                      else if (acc.logoType === "vr") barColor = "bg-emerald-500";
                      else if (i === 1) barColor = "bg-emerald-400";

                      return (
                        <div
                          key={acc.id}
                          style={{ width: `${Math.max(4, acc.percentage)}%` }}
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          title={`${acc.name}: ${acc.percentage}%`}
                        />
                      );
                    })}
              </div>
            </section>

            {/* Lista de Contas */}
            <section className="flex flex-col gap-1">
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <AccountLogo
                        name={acc.name}
                        logoType={acc.logoType}
                        size={42}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-bold text-white truncate">
                          {acc.name}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          {acc.percentage}%
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[15px] font-semibold text-white shrink-0 ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      {formatAccountCurrency(acc.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-zinc-500">
                  Nenhuma conta conectada ainda.
                </div>
              )}
            </section>

            {/* Botão Adicionar Conta */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.13] active:scale-[0.99] border border-white/[0.06] text-sm font-semibold text-white transition-all cursor-pointer"
            >
              Adicionar conta
            </button>

            {/* Seção Últimos lançamentos */}
            <section className="flex flex-col gap-3 pt-2">
              <h2 className="text-sm font-medium text-zinc-400">
                Últimos lançamentos
              </h2>

              {displayedTransactions.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {displayedTransactions.map((tx) => {
                    const isExpense = tx.type === "expense";
                    const formattedSubtitle = [
                      tx.formattedDate,
                      tx.categoryName,
                    ]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-2.5 gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <TransactionIcon
                            title={tx.title}
                            categoryIcon={tx.categoryIcon}
                            domain={tx.domain}
                            type={tx.type}
                            size={42}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-bold text-white truncate">
                              {tx.title}
                            </span>
                            <span className="text-xs text-zinc-400 truncate">
                              {formattedSubtitle || tx.description}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[15px] font-semibold shrink-0 ${
                            isExpense ? "text-rose-500" : "text-emerald-400"
                          } ${isPrivacyHidden ? "balance-blur" : ""}`}
                        >
                          {isExpense
                            ? `-${formatAccountCurrency(Math.abs(tx.amount))}`
                            : formatAccountCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-zinc-500">
                  Nenhum lançamento encontrado.
                </div>
              )}

              {/* Botão Ver lançamentos */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAllTransactions();
                }}
                className="w-full mt-2 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.13] active:scale-[0.99] border border-white/[0.06] text-sm font-semibold text-white transition-all cursor-pointer"
              >
                Ver lançamentos
              </button>
            </section>
          </div>

          {/* Modal para Adicionar Conta */}
          {isAddModalOpen && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="w-full rounded-[28px] bg-[#141418] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#ccff00]" />
                    Adicionar conta
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateAccount} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Nome da conta ou banco
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Nubank, Santander, Carteira"
                      className="w-full rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Tipo de conta
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(e.target.value as AccountSummary["type"])
                      }
                      className="w-full rounded-2xl bg-[#1c1c21] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Saldo atual (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-1 py-3.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar conta"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ExtratoTransaction, Person } from "@/types/finance";
import { Portal } from "@/components/ui/Portal";
import {
  createPersonAction,
  settlePersonSplitsAction,
} from "@/app/actions/transactions";
import {
  computePeopleDebtSummary,
  getPersonAvatarColor,
  getPersonInitials,
  PersonDebtSummary,
} from "@/lib/peopleSummary";

interface PeopleDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  allTransactions?: ExtratoTransaction[];
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onPersonAdded?: (person: Person) => void;
  onSplitsSettled?: (personId: string, transactionId?: string) => void;
}

type PeopleFilter = "all" | "owing" | "settled";

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Tela de detalhes para cadastro de pessoas e acompanhamento de dívidas (rateios). */
export function PeopleDetailsScreen({
  isOpen,
  onClose,
  people,
  allTransactions = [],
  isPrivacyHidden,
  onTogglePrivacy,
  onPersonAdded,
  onSplitsSettled,
}: PeopleDetailsScreenProps) {
  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  // Estado do formulário de cadastro de pessoa
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPixKey, setNewPixKey] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSavingPerson, setIsSavingPerson] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const { summaries, totalOwed, debtorsCount } = useMemo(
    () => computePeopleDebtSummary(people, allTransactions),
    [people, allTransactions]
  );

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summaries.filter((item) => {
      if (filter === "owing" && item.totalOwed <= 0) return false;
      if (filter === "settled" && item.totalOwed > 0) return false;
      if (!q) return true;
      return (
        item.person.name.toLowerCase().includes(q) ||
        (item.person.pixKey || "").toLowerCase().includes(q) ||
        (item.person.phone || "").toLowerCase().includes(q)
      );
    });
  }, [summaries, filter, searchQuery]);

  if (!isOpen) return null;

  const handleCopyPix = async (person: Person, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!person.pixKey) return;
    try {
      await navigator.clipboard.writeText(person.pixKey);
      setCopiedPersonId(person.id);
      setTimeout(() => {
        setCopiedPersonId((curr) => (curr === person.id ? null : curr));
      }, 2000);
    } catch {
      // Clipboard indisponível
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setErrorMsg("Informe o nome da pessoa.");
      return;
    }

    setIsSavingPerson(true);
    setErrorMsg(null);
    try {
      const res = await createPersonAction({
        name: trimmedName,
        pixKey: newPixKey.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || "Não foi possível cadastrar a pessoa.");
        return;
      }

      onPersonAdded?.(res.data);
      setNewName("");
      setNewPixKey("");
      setNewPhone("");
      setIsAddOpen(false);
    } catch (err) {
      console.error("Erro ao cadastrar pessoa:", err);
      setErrorMsg("Erro inesperado ao cadastrar pessoa.");
    } finally {
      setIsSavingPerson(false);
    }
  };

  const handleSettle = async (
    personId: string,
    transactionId?: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    const key = transactionId ? `${personId}:${transactionId}` : personId;
    setSettlingKey(key);
    setErrorMsg(null);

    try {
      const res = await settlePersonSplitsAction(personId, transactionId);
      if (!res.success) {
        setErrorMsg(res.error || "Não foi possível dar baixa no rateio.");
        return;
      }
      onSplitsSettled?.(personId, transactionId);
    } catch (err) {
      console.error("Erro ao quitar rateio:", err);
      setErrorMsg("Erro inesperado ao quitar rateio.");
    } finally {
      setSettlingKey(null);
    }
  };

  const renderPersonCard = (entry: PersonDebtSummary) => {
    const { person, totalOwed: owed, totalPaid, pendingCount, splits } = entry;
    const isExpanded = expandedPersonId === person.id;
    const avatarBg = getPersonAvatarColor(person.name);
    const initials = getPersonInitials(person.name);
    const isOwing = owed > 0;
    const isSettlingAll = settlingKey === person.id;

    return (
      <div
        key={person.id}
        className="rounded-[24px] bg-white/[0.04] border border-white/[0.08] overflow-hidden transition-colors"
      >
        <div
          onClick={() => setExpandedPersonId(isExpanded ? null : person.id)}
          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ backgroundColor: avatarBg }}
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 border border-white/15 shadow-sm"
            >
              {initials}
            </div>

            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white truncate">
                {person.name}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 min-w-0">
                {person.pixKey ? (
                  <button
                    type="button"
                    onClick={(e) => handleCopyPix(person, e)}
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors truncate cursor-pointer"
                    title="Copiar chave Pix"
                  >
                    <span className="truncate">Pix: {person.pixKey}</span>
                    {copiedPersonId === person.id ? (
                      <Check className="w-3 h-3 text-[#ccff00] shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 shrink-0 opacity-70" />
                    )}
                  </button>
                ) : person.phone ? (
                  <span className="truncate">{person.phone}</span>
                ) : (
                  <span className="text-zinc-500">Sem Pix ou telefone</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              {isOwing ? (
                <>
                  <span
                    className={`block text-sm font-extrabold text-[#ccff00] tracking-tight ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(owed)}
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-medium">
                    {pendingCount}{" "}
                    {pendingCount === 1 ? "pendência" : "pendências"}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Quitado
                </span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180 text-white" : ""
              }`}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-black/25 space-y-3">
            {splits.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2 text-center">
                Nenhum rateio registrado com {person.name} ainda.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {splits.map((sp) => {
                    const itemKey = `${person.id}:${sp.transactionId}`;
                    const isSettlingItem = settlingKey === itemKey;
                    return (
                      <div
                        key={sp.transactionId}
                        className="flex items-center justify-between gap-2 py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {sp.title}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {sp.formattedDate} •{" "}
                            {sp.isPaid ? "Quitado" : "Pendente"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-bold ${
                              sp.isPaid ? "text-zinc-500 line-through" : "text-white"
                            } ${isPrivacyHidden ? "balance-blur" : ""}`}
                          >
                            R$ {formatCurrency(sp.amountOwed)}
                          </span>

                          {!sp.isPaid && (
                            <button
                              type="button"
                              disabled={isSettlingItem || isSettlingAll}
                              onClick={(e) =>
                                handleSettle(person.id, sp.transactionId, e)
                              }
                              className="px-2.5 py-1 rounded-full bg-[#ccff00]/15 hover:bg-[#ccff00]/25 text-[#ccff00] border border-[#ccff00]/30 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isSettlingItem ? "..." : "Quitar"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500">
                    Já quitado: R$ {formatCurrency(totalPaid)}
                  </span>

                  {isOwing && (
                    <button
                      type="button"
                      disabled={isSettlingAll}
                      onClick={(e) => handleSettle(person.id, undefined, e)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSettlingAll ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Quitar tudo
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Pessoas e rateios"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full bg-[#09090b] text-white flex flex-col relative sm:my-6 sm:h-[calc(100vh-3rem)] sm:rounded-[44px] sm:border sm:border-zinc-800/80 overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <header className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onTogglePrivacy}
                aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
                className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                {isPrivacyHidden ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddOpen((prev) => !prev);
                  setErrorMsg(null);
                }}
                className="h-11 px-4 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
              >
                {isAddOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    Fechar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Nova pessoa
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
            {/* Hero Summary */}
            <div className="pt-1 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pessoas & Rateios
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <h2
                  className={`text-3xl font-black tracking-tight text-white ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  R$ {formatCurrency(totalOwed)}
                </h2>
                <span className="text-xs font-medium text-zinc-400">
                  a receber
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {people.length}{" "}
                {people.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}{" "}
                •{" "}
                {debtorsCount > 0
                  ? `${debtorsCount} ${debtorsCount === 1 ? "devendo" : "devendo"}`
                  : "tudo quitado"}
              </p>
            </div>

            {errorMsg && (
              <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Formulário de Cadastro de Pessoa */}
            {isAddOpen && (
              <form
                onSubmit={handleCreatePerson}
                className="rounded-[24px] bg-white/[0.05] border border-white/[0.12] p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <UserPlus className="w-4 h-4 text-[#ccff00]" />
                  <span>Cadastrar nova pessoa</span>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Nome completo *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/50 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ccff00]/60"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Chave Pix (opcional)"
                    value={newPixKey}
                    onChange={(e) => setNewPixKey(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/50 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ccff00]/60"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone (opcional)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/50 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ccff00]/60"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPerson || !newName.trim()}
                    className="px-5 h-10 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPerson && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar pessoa
                  </button>
                </div>
              </form>
            )}

            {/* Filtros e Busca */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: "all", label: `Todos (${summaries.length})` },
                    { id: "owing", label: `Devendo (${debtorsCount})` },
                    {
                      id: "settled",
                      label: `Quitados (${summaries.length - debtorsCount})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      filter === tab.id
                        ? "bg-white text-black"
                        : "bg-white/[0.06] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {summaries.length > 3 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, Pix ou telefone..."
                    className="w-full h-10 pl-10 pr-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                  />
                </div>
              )}
            </div>

            {/* Lista de Pessoas */}
            {filteredSummaries.length === 0 ? (
              <div className="rounded-[28px] bg-white/[0.03] border border-white/[0.06] p-8 text-center flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {people.length === 0
                    ? "Nenhuma pessoa cadastrada"
                    : "Nenhum resultado encontrado"}
                </p>
                <p className="text-xs text-zinc-400 max-w-[240px]">
                  {people.length === 0
                    ? "Cadastre amigos ou familiares para dividir despesas e acompanhar quem está devendo."
                    : "Tente ajustar o filtro ou a busca."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSummaries.map(renderPersonCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

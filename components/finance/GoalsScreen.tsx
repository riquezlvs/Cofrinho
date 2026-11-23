"use client";

import React, { useState, useTransition } from "react";
import {
  PiggyBank,
  Plus,
  Trash2,
  Home,
  Plane,
  Car,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import {
  Goal,
  createGoal,
  contributeToGoal,
  deleteGoal,
} from "@/app/actions/goals";

interface GoalsScreenProps {
  initialGoals: Goal[];
  onClose?: () => void;
}

const ICON_OPTIONS = [
  { id: "piggy-bank", label: "Cofrinho", Icon: PiggyBank },
  { id: "plane", label: "Viagem", Icon: Plane },
  { id: "home", label: "Casa", Icon: Home },
  { id: "car", label: "Veículo", Icon: Car },
  { id: "shield", label: "Reserva", Icon: ShieldCheck },
  { id: "target", label: "Objetivo", Icon: Target },
];

function renderGoalIcon(iconId: string) {
  const found = ICON_OPTIONS.find((i) => i.id === iconId);
  const Icon = found?.Icon ?? PiggyBank;
  return <Icon className="w-5 h-5 text-[#ccff00]" />;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function GoalsScreen({ initialGoals, onClose }: GoalsScreenProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("piggy-bank");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedTarget = Number(targetAmount.replace(",", "."));
    if (!title.trim() || Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("Informe um título e um valor alvo válido.");
      return;
    }

    startTransition(async () => {
      const res = await createGoal({
        title: title.trim(),
        icon: selectedIcon,
        target_amount: parsedTarget,
        deadline: deadline || null,
      });

      if (!res.success || !res.goal) {
        setError(res.error ?? "Não foi possível criar a meta.");
        return;
      }

      setGoals((prev) => [res.goal!, ...prev]);
      setTitle("");
      setTargetAmount("");
      setDeadline("");
      setIsCreating(false);
    });
  };

  const handleContribute = (goalId: string, amount: number) => {
    startTransition(async () => {
      const res = await contributeToGoal(goalId, amount);
      if (res.success && res.goal) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? res.goal! : g))
        );
      }
    });
  };

  const handleDelete = (goalId: string) => {
    startTransition(async () => {
      const res = await deleteGoal(goalId);
      if (res.success) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      }
    });
  };

  return (
    <div className="w-full space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Metas & Cofrinhos
          </h2>
          <p className="text-xs text-gray-400">
            Total guardado: {formatBRL(totalSaved)} de {formatBRL(totalTarget)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreating((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#ccff00] text-black text-xs font-semibold hover:brightness-110 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar metas"
              className="p-2 rounded-full bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Form Nova Meta */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-[#1a1a1e]/90 border border-white/10 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              Criar nova meta
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <input
            type="text"
            placeholder="Ex: Viagem, Casa própria, Reserva..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00]"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="Valor alvo (R$)"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00]"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {ICON_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedIcon(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition cursor-pointer ${
                  selectedIcon === id
                    ? "border-[#ccff00] bg-[#ccff00]/15 text-[#ccff00]"
                    : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-[#ccff00] text-black font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? "Salvando..." : "Salvar Meta"}
          </button>
        </form>
      )}

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <div className="rounded-2xl bg-[#1a1a1e]/70 border border-white/10 p-6 text-center space-y-2">
          <PiggyBank className="w-8 h-8 text-[#ccff00] mx-auto" />
          <p className="text-sm font-medium text-white">
            Nenhuma meta criada ainda
          </p>
          <p className="text-xs text-gray-400">
            Crie seu primeiro cofrinho para acompanhar seus objetivos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.current_amount / goal.target_amount) * 100)
            );
            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-[#1a1a1e]/90 border border-white/10 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center">
                      {renderGoalIcon(goal.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {goal.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {formatBRL(goal.current_amount)} de{" "}
                        {formatBRL(goal.target_amount)} ({pct}%)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    aria-label={`Remover ${goal.title}`}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ccff00] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-gray-500">
                    {goal.deadline
                      ? `Prazo: ${new Date(goal.deadline).toLocaleDateString("pt-BR")}`
                      : "Sem prazo definido"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleContribute(goal.id, 100)}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#ccff00]/20 hover:text-[#ccff00] text-xs text-white transition cursor-pointer"
                    >
                      + R$ 100
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleContribute(goal.id, 500)}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#ccff00]/20 hover:text-[#ccff00] text-xs text-white transition cursor-pointer"
                    >
                      + R$ 500
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

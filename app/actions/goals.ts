"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  created_at: string;
}

export interface CreateGoalInput {
  title: string;
  icon?: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  color?: string;
}

export async function getGoals(): Promise<Goal[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error.message);
      return [];
    }

    return (data ?? []).map((g) => ({
      ...g,
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
    }));
  } catch (err) {
    console.error("Unexpected error in getGoals:", err);
    return [];
  }
}

export async function createGoal(
  input: CreateGoalInput
): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: input.title.trim(),
        icon: input.icon ?? "piggy-bank",
        target_amount: input.target_amount,
        current_amount: input.current_amount ?? 0,
        deadline: input.deadline || null,
        color: input.color ?? "#ccff00",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return {
      success: true,
      goal: {
        ...data,
        target_amount: Number(data.target_amount),
        current_amount: Number(data.current_amount),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar meta.",
    };
  }
}

export async function contributeToGoal(
  goalId: string,
  amount: number
): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("goals")
      .select("current_amount")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Meta não encontrada." };
    }

    const nextAmount = Math.max(0, Number(existing.current_amount) + amount);

    const { data, error } = await supabase
      .from("goals")
      .update({
        current_amount: nextAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return {
      success: true,
      goal: {
        ...data,
        target_amount: Number(data.target_amount),
        current_amount: Number(data.current_amount),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar meta.",
    };
  }
}

export async function deleteGoal(
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao remover meta.",
    };
  }
}

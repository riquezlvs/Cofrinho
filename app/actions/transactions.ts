"use server";

import { revalidatePath } from "next/cache";
import {
  createTransaction,
  createPerson,
  deleteTransaction,
  updateTransaction,
  settlePersonSplits,
} from "@/lib/finance";

export async function addTransactionAction(payload: Parameters<typeof createTransaction>[0]) {
  const res = await createTransaction(payload);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function createPersonAction(payload: Parameters<typeof createPerson>[0]) {
  const res = await createPerson(payload);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function settlePersonSplitsAction(personId: string, transactionId?: string) {
  const res = await settlePersonSplits(personId, transactionId);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function deleteTransactionAction(transactionId: string) {
  const res = await deleteTransaction(transactionId);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function updateTransactionAction(
  transactionId: string,
  updates: Parameters<typeof updateTransaction>[1]
) {
  const res = await updateTransaction(transactionId, updates);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

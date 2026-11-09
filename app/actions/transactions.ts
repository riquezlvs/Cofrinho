"use server";

import { createTransaction, createPerson, deleteTransaction, updateTransaction } from "@/lib/finance";

export async function addTransactionAction(payload: Parameters<typeof createTransaction>[0]) {
  return await createTransaction(payload);
}

export async function createPersonAction(payload: Parameters<typeof createPerson>[0]) {
  return await createPerson(payload);
}

export async function deleteTransactionAction(transactionId: string) {
  return await deleteTransaction(transactionId);
}

export async function updateTransactionAction(
  transactionId: string,
  updates: Parameters<typeof updateTransaction>[1]
) {
  return await updateTransaction(transactionId, updates);
}

"use server";

import { createTransaction, createPerson } from "@/lib/finance";

export async function addTransactionAction(payload: Parameters<typeof createTransaction>[0]) {
  return await createTransaction(payload);
}

export async function createPersonAction(payload: Parameters<typeof createPerson>[0]) {
  return await createPerson(payload);
}

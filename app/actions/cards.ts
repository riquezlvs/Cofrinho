"use server";

import { revalidatePath } from "next/cache";
import {
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from "@/lib/finance";

export async function addCreditCardAction(payload: Parameters<typeof createCreditCard>[0]) {
  const result = await createCreditCard(payload);
  revalidatePath("/");
  return result;
}

export async function updateCreditCardAction(
  cardId: string,
  updates: Parameters<typeof updateCreditCard>[1]
) {
  const result = await updateCreditCard(cardId, updates);
  revalidatePath("/");
  return result;
}

export async function deleteCreditCardAction(cardId: string) {
  const result = await deleteCreditCard(cardId);
  revalidatePath("/");
  return result;
}

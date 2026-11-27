"use server";

import { revalidatePath } from "next/cache";
import { createAccount, deleteAccount } from "@/lib/finance";

export async function addAccountAction(payload: Parameters<typeof createAccount>[0]) {
  const result = await createAccount(payload);
  revalidatePath("/");
  revalidatePath("/extrato");
  return result;
}

export async function deleteAccountAction(accountId: string) {
  const result = await deleteAccount(accountId);
  revalidatePath("/");
  revalidatePath("/extrato");
  return result;
}

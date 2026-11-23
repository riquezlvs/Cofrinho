const PLUGGY_BASE_URL = "https://api.pluggy.ai";

export function isPluggyConfigured(): boolean {
  return Boolean(
    process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET
  );
}

export async function getPluggyApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configuradas no .env."
    );
  }

  const res = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao autenticar na Pluggy (${res.status})`);
  }

  const data = (await res.json()) as { apiKey: string };
  return data.apiKey;
}

export async function createPluggyConnectToken(
  clientUserId: string
): Promise<string> {
  const apiKey = await getPluggyApiKey();

  const res = await fetch(`${PLUGGY_BASE_URL}/connect_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      options: { clientUserId },
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao gerar connectToken (${res.status})`);
  }

  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

export interface PluggyAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currencyCode: string;
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  type: "DEBIT" | "CREDIT";
}

export async function fetchPluggyAccounts(
  itemId: string
): Promise<PluggyAccount[]> {
  const apiKey = await getPluggyApiKey();
  const res = await fetch(`${PLUGGY_BASE_URL}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar contas (${res.status})`);
  }

  const data = (await res.json()) as { results?: PluggyAccount[] };
  return data.results ?? [];
}

export async function fetchPluggyTransactions(
  accountId: string
): Promise<PluggyTransaction[]> {
  const apiKey = await getPluggyApiKey();
  const res = await fetch(
    `${PLUGGY_BASE_URL}/transactions?accountId=${accountId}&pageSize=100`,
    {
      headers: { "X-API-KEY": apiKey },
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao buscar transações (${res.status})`);
  }

  const data = (await res.json()) as { results?: PluggyTransaction[] };
  return data.results ?? [];
}

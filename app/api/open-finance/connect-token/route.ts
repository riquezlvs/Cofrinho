import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createPluggyConnectToken,
  isPluggyConfigured,
} from "@/lib/openFinance";

export async function POST() {
  try {
    if (!isPluggyConfigured()) {
      return NextResponse.json(
        {
          error:
            "Open Finance ainda não configurado. Adicione PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no .env.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const accessToken = await createPluggyConnectToken(user.id);
    return NextResponse.json({ accessToken });
  } catch (err) {
    console.error("Open Finance connect-token error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro ao gerar token de conexão.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: {
    totalBalance?: number;
    monthlySpending?: number;
    safeToSpend?: number;
    goals?: Array<{
      title: string;
      current_amount: number;
      target_amount: number;
      deadline?: string | null;
    }>;
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = body.messages ?? [];
    const lastMessage = messages[messages.length - 1]?.content?.trim();

    if (!lastMessage) {
      return NextResponse.json(
        { error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    // Fetch user's goals from Supabase if authenticated
    let dbGoals: Array<{
      title: string;
      current_amount: number;
      target_amount: number;
      deadline: string | null;
    }> = [];

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("goals")
          .select("title, current_amount, target_amount, deadline")
          .eq("user_id", user.id);
        if (data) {
          dbGoals = data.map((g) => ({
            title: g.title,
            current_amount: Number(g.current_amount),
            target_amount: Number(g.target_amount),
            deadline: g.deadline,
          }));
        }
      }
    } catch {
      // Ignore if unauthenticated or table not yet migrated
    }

    const goals = dbGoals.length > 0 ? dbGoals : (body.context?.goals ?? []);
    const goalsSummary =
      goals.length > 0
        ? goals
            .map(
              (g) =>
                `- ${g.title}: R$ ${g.current_amount.toFixed(2)} / R$ ${g.target_amount.toFixed(2)}`
            )
            .join("\n")
        : "Nenhuma meta cadastrada ainda.";

    const systemPrompt = `Você é o Cofrinho, o assistente financeiro pessoal do app Cofrinho.
Responda sempre em português do Brasil, de forma clara, direta, amigável e prática.
Formate valores monetários em R$ (ex.: R$ 1.250,00).

Contexto financeiro atual do usuário:
- Saldo total disponível: ${
      body.context?.totalBalance !== undefined
        ? `R$ ${body.context.totalBalance.toFixed(2)}`
        : "não informado"
    }
- Gastos no mês: ${
      body.context?.monthlySpending !== undefined
        ? `R$ ${body.context.monthlySpending.toFixed(2)}`
        : "não informado"
    }
- Quanto ainda pode gastar (Safe to Spend): ${
      body.context?.safeToSpend !== undefined
        ? `R$ ${body.context.safeToSpend.toFixed(2)}`
        : "não informado"
    }
- Metas (Cofrinhos):
${goalsSummary}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Olá! Eu sou o **Cofrinho**, seu assistente financeiro. Para ativar minhas respostas com IA, adicione a variável `GEMINI_API_KEY` no arquivo `.env` do projeto.\n\nPor enquanto, já consigo ver suas metas:\n" +
          goalsSummary,
      });
    }

    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: geminiContents,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Erro ao consultar o assistente Cofrinho." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Não consegui gerar uma resposta agora. Tente novamente.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Erro interno no chat do Cofrinho." },
      { status: 500 }
    );
  }
}

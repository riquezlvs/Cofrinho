import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-pluggy-signature");
    const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;

    if (webhookSecret && signature !== webhookSecret) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const payload = (await req.json()) as {
      event?: string;
      itemId?: string;
    };

    console.log("Open Finance webhook received:", payload.event, payload.itemId);

    // O processamento assíncrono pode acionar a fila/sync para o itemId recebido
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Open Finance webhook error:", err);
    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}

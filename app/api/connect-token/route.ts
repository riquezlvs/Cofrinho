import { PluggyClient } from "pluggy-sdk";

export async function POST(req: Request) {
  const clientId = process.env.CLIENT_ID || process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error:
          "Missing CLIENT_ID or CLIENT_SECRET in environment variables (.env).",
      },
      { status: 500 }
    );
  }

  const pluggy = new PluggyClient({
    clientId,
    clientSecret,
  });

  const body = (await req.json().catch(() => ({}))) as {
    clientUserId?: string;
  };

  const connectToken = await pluggy.createConnectToken(
    undefined,
    body.clientUserId ? { clientUserId: body.clientUserId } : undefined
  );

  return Response.json({ accessToken: connectToken.accessToken });
}

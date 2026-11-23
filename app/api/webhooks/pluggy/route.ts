import { after } from "next/server";

interface PluggyWebhookEvent {
  event: string;
  eventId?: string;
  itemId?: string;
  error?: { message?: string; code?: string };
}

async function handleItemCreated(itemId?: string) {
  if (!itemId) return;
  console.log("Pluggy item created:", itemId);
}

async function handleItemUpdated(itemId?: string) {
  if (!itemId) return;
  console.log("Pluggy item updated:", itemId);
  // Heavy sync work can run here asynchronously using process.env.CLIENT_ID / CLIENT_SECRET
}

async function handleItemError(
  itemId?: string,
  error?: { message?: string; code?: string }
) {
  if (!itemId) return;
  console.error("Pluggy item error:", itemId, error);
}

export async function POST(req: Request) {
  const event = (await req.json()) as PluggyWebhookEvent;

  console.log("Received webhook:", event.event);
  console.log("Event ID:", event.eventId);

  // Process heavy work asynchronously so we always return 2XX within 5 seconds
  after(async () => {
    switch (event.event) {
      case "item/created":
        await handleItemCreated(event.itemId);
        break;
      case "item/updated":
        await handleItemUpdated(event.itemId);
        break;
      case "item/error":
        await handleItemError(event.itemId, event.error);
        break;
      default:
        break;
    }
  });

  return Response.json({ received: true });
}

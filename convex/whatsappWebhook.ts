import { httpAction } from "./_generated/server";

/**
 * Handles the initial verification request from the WhatsApp Business API.
 * When you configure the webhook in the Meta Developer Dashboard,
 * Meta sends a GET request with a challenge string that must be echoed back.
 */
export const verifyWebhook = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!WHATSAPP_VERIFY_TOKEN) {
    console.error("WHATSAPP_VERIFY_TOKEN is missing in environment variables.");
    return new Response("Server misconfiguration: missing verify token", { status: 500 });
  }

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified successfully!");
    // WhatsApp requires returning the exact challenge string as plain text
    return new Response(challenge, { status: 200 });
  }

  console.warn("❌ WhatsApp webhook verification failed. Token mismatch.");
  return new Response("Forbidden", { status: 403 });
});

/**
 * Handles incoming messages and status updates from the WhatsApp Business API.
 * This receives POST requests.
 */
export const handleIncomingMessage = httpAction(async (ctx, request) => {
  try {
    const payload = await request.json();
    console.log("📥 Received WhatsApp Webhook event:", JSON.stringify(payload, null, 2));

    // TODO: Process the actual message payload here and save it to the database
    // For now, we just acknowledge receipt so WhatsApp knows the endpoint is alive
    
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp webhook POST:", error);
    return new Response("Bad Request", { status: 400 });
  }
});

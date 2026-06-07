import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ═══════════════════════════════════════════════════
// BWR WORKS — Razorpay Webhook Handler
// Note: Uses SubtleCrypto (Web Crypto API) for HMAC
// ═══════════════════════════════════════════════════

/** Verify HMAC-SHA256 using Web Crypto API (available in Convex V8 runtime) */
async function verifyHmacSha256(secret: string, message: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Convert hex signature to Uint8Array
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)!.map(b => parseInt(b, 16))
  );

  return crypto.subtle.verify("HMAC", key, sigBytes, messageData);
}

export const razorpayWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set in Convex env vars.");
    return new Response("Config error", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("X-Razorpay-Signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // ⚠️ VERIFY HMAC SHA256 — critical security check
  const isValid = await verifyHmacSha256(webhookSecret, rawBody, signature);

  if (!isValid) {
    console.error("❌ Razorpay webhook signature mismatch — rejecting.");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: {
      payment: {
        entity: {
          order_id: string;
          id: string;
          amount: number;
        };
      };
    };
  };

  if (event.event === "payment.captured") {
    const { order_id, id: payment_id, amount } = event.payload.payment.entity;

    try {
      let resolved = false;

      // 1. Try standard order
      try {
        const order = await ctx.runMutation(internal.orders.markOrderPaid, {
          razorpayOrderId: order_id,
          razorpayPaymentId: payment_id,
        });
        await ctx.runMutation(internal.orders.recordPayment, {
          orderId: order.orderId,
          razorpayOrderId: order_id,
          razorpayPaymentId: payment_id,
          signature,
          amount,
        });
        resolved = true;
      } catch (err) {
        // ignore and fall through to custom print check
      }

      // 2. Try custom print request
      if (!resolved) {
        const customPrint = await ctx.runMutation(internal.customPrints.markCustomPrintPaid, {
          razorpayOrderId: order_id,
          razorpayPaymentId: payment_id,
        });
        await ctx.runMutation(internal.orders.recordPayment, {
          orderId: customPrint.customPrintId,
          razorpayOrderId: order_id,
          razorpayPaymentId: payment_id,
          signature,
          amount,
        });
        resolved = true;
      }

      if (!resolved) {
        throw new Error(`No catalog order or custom print order found matching razorpayOrderId: ${order_id}`);
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
      return new Response("Processing error", { status: 500 });
    }
  }

  if (event.event === "payment.failed") {
    const { order_id } = event.payload.payment.entity;
    try {
      await ctx.runMutation(internal.orders.markOrderFailed, {
        razorpayOrderId: order_id,
      });
    } catch (err) {
      console.error("Webhook payment.failed processing error:", err);
    }
  }

  return new Response("OK", { status: 200 });
});

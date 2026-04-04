import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { razorpayWebhook } from "./webhookHandler";

const http = httpRouter();

// Auth routes (Google OAuth + OTP callbacks)
auth.addHttpRoutes(http);

// Razorpay payment webhook
// ⚠️ Signature verification is done inside webhookHandler.ts
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: razorpayWebhook,
});

// ─────────────────────────────────────────────────
// RESEND INBOUND EMAIL WEBHOOK
// ─────────────────────────────────────────────────
// Configure in Resend: Domains → bwrworks.in → Inbound routing
// Webhook URL: https://<your-deployment>.convex.site/api/resend-inbound
// OR use Vercel serverless route if Convex site URL isn't set
// ─────────────────────────────────────────────────

http.route({
  path: "/api/resend-inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json() as Record<string, any>;

      // Resend inbound email payload fields:
      // { email_id, from, to, subject, text, html, headers }
      const emailId: string = payload.email_id || payload.id || "";
      const fromRaw: string = payload.from || "";
      const subject: string = payload.subject || "";
      const textBody: string = payload.text || payload.plain_text || "";

      // Extract sender email from "Name <email@example.com>" format
      const emailMatch = fromRaw.match(/<(.+?)>/) || [null, fromRaw];
      const senderEmail = (emailMatch[1] || fromRaw).trim().toLowerCase();

      // Extract thread ID from subject: [BWR-Q-xxxxxxxx]
      const threadMatch = subject.match(/\[BWR-Q-([a-z0-9]+)\]/i);
      if (!threadMatch) {
        console.warn(`[Inbound] No thread ID in subject: "${subject}" — ignoring`);
        return new Response(JSON.stringify({ ok: false, reason: "no_thread_id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const threadId = `BWR-Q-${threadMatch[1].toLowerCase().slice(0, 8)}`;

      // Strip quoted previous messages from the reply body
      // (Lines starting with > are quoted replies from email clients)
      const cleanBody = textBody
        .split("\n")
        .filter(line => !line.startsWith(">") && !line.startsWith("On "))
        .join("\n")
        .trim();

      const content = cleanBody || textBody.slice(0, 2000);

      // Store in DB via internal mutation
      await ctx.runMutation(internal.inquiries.storeInboundMessage, {
        threadId,
        senderEmail,
        content,
        resendEmailId: emailId,
        timestamp: Date.now(),
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (err) {
      console.error("[Inbound webhook error]", err);
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 200, // Always 200 so Resend doesn't retry
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Handle preflight OPTIONS for CORS
http.route({
  path: "/api/resend-inbound",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;

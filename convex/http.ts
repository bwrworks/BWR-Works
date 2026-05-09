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
      // ─── AUTH CHECK: Verify webhook secret if configured ───
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      if (webhookSecret) {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (token !== webhookSecret) {
          console.error("[Inbound] Invalid webhook secret — rejecting.");
          return new Response(JSON.stringify({ ok: false, reason: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      const payload = await request.json() as Record<string, any>;

      // ─── DEBUG: Log full payload structure ───
      console.log(`[Inbound] Raw payload keys: ${Object.keys(payload).join(', ')}`);
      console.log(`[Inbound] payload.type: ${payload.type}`);
      if (payload.data) {
        console.log(`[Inbound] payload.data keys: ${Object.keys(payload.data).join(', ')}`);
      }

      // Resend wraps inbound emails in a `data` object: { type: 'email.received', data: { ... } }
      const emailData = payload.data || payload;

      // Extract details
      const emailId: string = emailData.email_id || emailData.id || "";

      const fromRaw: string = emailData.from || "";
      const subject: string = emailData.subject || "";

      console.log(`[Inbound] emailId=${emailId}, from=${fromRaw}, subject="${subject}"`);

      // Extract sender email from "Name <email@example.com>" format
      const emailMatch = fromRaw.match(/<(.+?)>/) || [null, fromRaw];
      const senderEmail = (emailMatch[1] || fromRaw).trim().toLowerCase();

      console.log(`[Inbound] Parsed senderEmail=${senderEmail}`);

      // Extract thread ID from subject: [BWRSUP0001] or [BWR-SUP-0001] or Order IDs (BWR0001AEXL)
      const supMatch = subject.match(/\[?BWR-?SUP-?(\d+)\]?/i);
      const orderMatch = subject.match(/\[?BWR(\d{4}[A-Z0-9]{4})\]?/i) || subject.match(/\[?BWR-(\d{4}-[A-Z0-9]{4})\]?/i);
      const legacyMatch = subject.match(/\[?BWR-Q-([a-z0-9]+)\]?/i);

      console.log(`[Inbound] Regex results: supMatch=${JSON.stringify(supMatch)}, orderMatch=${JSON.stringify(orderMatch)}, legacyMatch=${JSON.stringify(legacyMatch)}`);

      if (!supMatch && !orderMatch && !legacyMatch) {
        console.warn(`[Inbound] No thread ID in subject: "${subject}" — ignoring`);
        return new Response(JSON.stringify({ ok: false, reason: "no_thread_id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      let threadId = "";
      if (supMatch) {
        threadId = `BWRSUP${supMatch[1].padStart(4, "0")}`;
      } else if (orderMatch) {
        threadId = `BWR${orderMatch[1].replace(/-/g, '')}`.toUpperCase();
      } else if (legacyMatch) {
        threadId = `BWR-Q-${legacyMatch[1].toLowerCase().slice(0, 8)}`;
      }

      console.log(`[Inbound] Resolved threadId=${threadId}`);

      let textBody: string = emailData.text || emailData.plain_text || "";

      // Sometimes the webhook payload might include HTML directly, so we can try to extract text from it
      if (!textBody && emailData.html) {
        textBody = emailData.html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<p[^>]*>/gi, '\n')
          .replace(/<[^>]*>?/gm, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      }

      // Resend webhook for email.received does NOT include the body!
      // We must fetch it via the Resend API using the email_id
      if (!textBody && emailId) {
        const apiKey = process.env.AUTH_RESEND_KEY;
        if (apiKey) {
          try {
            console.log(`[Inbound] No body in webhook — fetching from Resend API: ${emailId}`);
            let res;
            for (let i = 0; i < 5; i++) {
              res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
                headers: { "Authorization": `Bearer ${apiKey}` },
              });
              if (res.ok) break;
              if (res.status === 404) {
                console.log(`[Inbound] Resend API 404 (Attempt ${i + 1}/5) — waiting 1.5s...`);
                await new Promise(r => setTimeout(r, 1500));
              } else {
                break;
              }
            }
            
            if (res && res.ok) {
              const fullEmail = await res.json() as Record<string, any>;
              textBody = fullEmail.text || fullEmail.plain_text || "";
              if (!textBody && fullEmail.html) {
                textBody = fullEmail.html
                  .replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<p[^>]*>/gi, '\n')
                  .replace(/<[^>]*>?/gm, '')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/\n\s*\n/g, '\n')
                  .trim();
              }
              if (!textBody && fullEmail.body) {
                textBody = fullEmail.body;
              }
              console.log(`[Inbound] Fetched email body, length=${textBody.length}`);
            } else if (res) {
              const errText = await res.text();
              console.warn(`[Inbound] Resend API ${res.status}: ${errText}`);
            }
          } catch (fetchErr) {
            console.error(`[Inbound] Failed to fetch email:`, fetchErr);
          }
        }
      }

      // If still no body, store a placeholder so the message still appears
      if (!textBody) {
        textBody = `[Email reply received — view full content in Resend dashboard]`;
      }

      // Strip quoted previous messages
      let cleanBody = textBody;
      const onWroteRegex = /\nOn\s[\s\S]{1,150}wrote:/i;
      const matchIndex = cleanBody.search(onWroteRegex);
      if (matchIndex !== -1) {
        cleanBody = cleanBody.substring(0, matchIndex).trim();
      }
      
      cleanBody = cleanBody
        .split("\n")
        .filter((line: string) => !line.trim().startsWith(">") && !line.trim().startsWith("On "))
        .join("\n")
        .trim();

      if (!cleanBody) cleanBody = textBody;

      const content = cleanBody.slice(0, 5000);
      console.log(`[Inbound] Final content: "${content.slice(0, 100)}..."`);

      // Store in DB via internal mutation
      const result = await ctx.runMutation(internal.inquiries.storeInboundMessage, {
        threadId,
        senderEmail,
        content,
        resendEmailId: emailId,
        timestamp: Date.now(),
      });

      console.log(`[Inbound] storeInboundMessage result: ${JSON.stringify(result)}`);

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

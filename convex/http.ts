import { httpRouter } from "convex/server";
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

export default http;

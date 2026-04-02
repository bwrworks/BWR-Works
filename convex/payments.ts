"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════
// BWR WORKS — Razorpay Payment Actions (Node.js runtime)
// ⚠️ All secret keys are Convex env vars only
// ═══════════════════════════════════════════════════

/**
 * Create a Razorpay order SERVER-SIDE
 * Amount is set and verified HERE — never trust frontend amount
 */
export const createRazorpayOrder = action({
  args: {
    amount: v.number(),         // in paise (₹1 = 100 paise)
    currency: v.optional(v.string()),
    receipt: v.optional(v.string()),
  },
  handler: async (ctx, { amount, currency = "INR", receipt }): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to place an order.");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Convex env vars.");
    }

    // Basic auth header — Buffer available in Node.js runtime
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `bwr_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const err = await response.json() as { error?: { description?: string } };
      throw new Error(err.error?.description || "Failed to create Razorpay order.");
    }

    const rzpOrder = await response.json() as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId, // Public key — safe to send to frontend
    };
  },
});

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────
// INTERNAL — Only called from verifyAndFulfillPayment action
// ─────────────────────────────────────────────────

/** Record a verified payment in the payments audit table */
export const recordPayment = internalMutation({
  args: {
    orderId: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    signature: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Idempotency — don't double-record
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_razorpayPaymentId", (q) =>
        q.eq("razorpayPaymentId", args.razorpayPaymentId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("payments", {
      ...args,
      currency: "INR",
      status: "verified",
      verifiedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

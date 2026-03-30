import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════
// INQUIRIES ROUTER
// ═══════════════════════════════════════════════════

export const submitInquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.union(v.literal("support"), v.literal("bulk_order"), v.literal("general")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiryId = await ctx.db.insert("inquiries", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      subject: args.subject,
      message: args.message,
      status: "new",
      createdAt: Date.now(),
    });

    return inquiryId;
  },
});

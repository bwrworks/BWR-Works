"use node"; // needed for crypto in httpAction context
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Inquiries + Email Thread System
// ═══════════════════════════════════════════════════

function makeThreadId(id: string) {
  return `BWR-Q-${id.slice(0, 8)}`;
}

/** Customer submits a contact form inquiry — creates the thread */
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

    // Set threadId using the newly-created ID
    const threadId = makeThreadId(inquiryId);
    await ctx.db.patch(inquiryId, { threadId });

    // Store first message as thread entry
    await ctx.db.insert("messages", {
      inquiryId,
      sender: "user",
      content: args.message,
      timestamp: Date.now(),
    });

    return { inquiryId, threadId };
  },
});

// ─────────────────────────────────────────────────
// ADMIN QUERIES
// ─────────────────────────────────────────────────

/** Admin: list all inquiries — newest first */
export const listInquiries = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("replied"), v.literal("closed"))),
  },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("inquiries").order("desc").collect();
    return status ? all.filter(i => i.status === status) : all;
  },
});

/** Admin: get all messages for a thread */
export const getThread = query({
  args: { inquiryId: v.id("inquiries") },
  handler: async (ctx, { inquiryId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("messages")
      .withIndex("by_inquiryId", q => q.eq("inquiryId", inquiryId))
      .order("asc")
      .collect();
  },
});

/** Admin: mark an inquiry status */
export const updateInquiryStatus = mutation({
  args: {
    id: v.id("inquiries"),
    status: v.union(v.literal("new"), v.literal("replied"), v.literal("closed")),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
  },
});

/** Admin: save reply message (called after email is sent) */
export const saveAdminReply = mutation({
  args: {
    id: v.id("inquiries"),
    replyMessage: v.string(),
    repliedAt: v.number(),
  },
  handler: async (ctx, { id, replyMessage, repliedAt }) => {
    await requireAdmin(ctx);

    // Save as thread message
    await ctx.db.insert("messages", {
      inquiryId: id,
      sender: "admin",
      content: replyMessage,
      timestamp: repliedAt,
    });

    // Update inquiry record
    await ctx.db.patch(id, {
      adminReply: replyMessage,
      repliedAt,
      status: "replied",
    });
  },
});

// ─────────────────────────────────────────────────
// INBOUND EMAIL WEBHOOK (called from http.ts)
// ─────────────────────────────────────────────────

/** Internal: store an inbound email reply from a customer */
export const storeInboundMessage = internalMutation({
  args: {
    threadId: v.string(),
    senderEmail: v.string(),
    content: v.string(),
    resendEmailId: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, { threadId, senderEmail, content, resendEmailId, timestamp }) => {
    // Find inquiry by threadId
    const inquiry = await ctx.db
      .query("inquiries")
      .withIndex("by_threadId", q => q.eq("threadId", threadId))
      .first();

    if (!inquiry) {
      console.warn(`[Inbound] No inquiry found for threadId: ${threadId}`);
      return { ok: false, reason: "thread_not_found" };
    }

    // Idempotency: check if this email was already stored
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_inquiryId", q => q.eq("inquiryId", inquiry._id))
      .collect();

    if (existing.some(m => m.resendEmailId === resendEmailId)) {
      console.warn(`[Inbound] Duplicate inbound email: ${resendEmailId}`);
      return { ok: false, reason: "duplicate" };
    }

    // Verify the sender matches the inquiry email
    if (senderEmail.toLowerCase() !== inquiry.email.toLowerCase()) {
      console.warn(`[Inbound] Email mismatch: ${senderEmail} vs ${inquiry.email}`);
      // Still store it, but flag it
    }

    await ctx.db.insert("messages", {
      inquiryId: inquiry._id,
      sender: "user",
      content,
      timestamp,
      resendEmailId,
    });

    // Bump status back to 'new' so admin sees it
    if (inquiry.status === "replied" || inquiry.status === "closed") {
      await ctx.db.patch(inquiry._id, { status: "new" });
    }

    return { ok: true, inquiryId: inquiry._id };
  },
});

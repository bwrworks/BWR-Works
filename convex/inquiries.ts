// inquiries.ts
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import { getAuthUserId } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════
// BWR WORKS — Inquiries + Email Thread System
// ═══════════════════════════════════════════════════

/** Generate a human-readable sequential ticket ID like BWR-SUP-0001 */
async function makeThreadId(ctx: any): Promise<string> {
  try {
    const allInquiries = await ctx.db.query("inquiries").collect();
    const nextNum = allInquiries.length + 1;
    return `BWR-SUP-${String(nextNum).padStart(4, "0")}`;
  } catch {
    // Fallback if count fails
    return `BWR-SUP-${String(Date.now()).slice(-6)}`;
  }
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
    try {
      // ─── Input Validation ───
      const name = args.name.trim().slice(0, 100);
      const email = args.email.trim().slice(0, 254).toLowerCase();
      const phone = args.phone?.trim().slice(0, 15) || undefined;
      const message = args.message.trim().slice(0, 5000);

      if (!name || name.length < 2) throw new Error("Name must be at least 2 characters.");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
      if (!message || message.length < 10) throw new Error("Message must be at least 10 characters.");
      if (phone && !/^[\d\s\-+()]{7,15}$/.test(phone)) throw new Error("Please enter a valid phone number.");

      // Generate sequential ticket ID
      const threadId = await makeThreadId(ctx);

      const inquiryId = await ctx.db.insert("inquiries", {
        name,
        email,
        phone,
        subject: args.subject,
        message,
        status: "new",
        threadId,
        createdAt: Date.now(),
      });

      // Store first message as thread entry
      await ctx.db.insert("messages", {
        inquiryId,
        sender: "user",
        content: message,
        timestamp: Date.now(),
      });

      return { inquiryId, threadId };
    } catch (err: any) {
      console.error("[submitInquiry] Error:", err);
      throw err;
    }
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

// ─────────────────────────────────────────────────
// CUSTOMER-FACING QUERIES (for user Dashboard)
// ─────────────────────────────────────────────────

/** Customer: list my own inquiries (matched by email) */
export const getMyInquiries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    const all = await ctx.db.query("inquiries").order("desc").collect();
    return all.filter(i => i.email.toLowerCase() === user.email!.toLowerCase());
  },
});

/** Customer: get messages for one of their own threads */
export const getMyThread = query({
  args: { inquiryId: v.id("inquiries") },
  handler: async (ctx, { inquiryId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    // Verify ownership
    const inquiry = await ctx.db.get(inquiryId);
    if (!inquiry || inquiry.email.toLowerCase() !== user.email!.toLowerCase()) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_inquiryId", q => q.eq("inquiryId", inquiryId))
      .order("asc")
      .collect();
  },
});

/** Customer: reply to their own inquiry thread from the dashboard */
export const customerReply = mutation({
  args: {
    inquiryId: v.id("inquiries"),
    message: v.string(),
  },
  handler: async (ctx, { inquiryId, message }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in.");
    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("No email on account.");

    // Verify ownership
    const inquiry = await ctx.db.get(inquiryId);
    if (!inquiry || inquiry.email.toLowerCase() !== user.email!.toLowerCase()) {
      throw new Error("Not your inquiry.");
    }

    await ctx.db.insert("messages", {
      inquiryId,
      sender: "user",
      content: message,
      timestamp: Date.now(),
    });

    // Bump status back to 'new' so admin sees it
    if (inquiry.status === "replied" || inquiry.status === "closed") {
      await ctx.db.patch(inquiry._id, { status: "new" });
    }
  },
});

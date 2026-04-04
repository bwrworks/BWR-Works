import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Inquiries (Contact Form + Admin Inbox)
// ═══════════════════════════════════════════════════

/** Customer submits a contact form inquiry */
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

/** Admin: get a single inquiry with its replies */
export const getInquiry = query({
  args: { id: v.id("inquiries") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});

/** Admin: mark an inquiry as read/replied/closed */
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

/** Admin: save a reply message to an inquiry (after email is sent) */
export const saveAdminReply = mutation({
  args: {
    id: v.id("inquiries"),
    replyMessage: v.string(),
    repliedAt: v.number(),
  },
  handler: async (ctx, { id, replyMessage, repliedAt }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, {
      adminReply: replyMessage,
      repliedAt,
      status: "replied",
    });
  },
});

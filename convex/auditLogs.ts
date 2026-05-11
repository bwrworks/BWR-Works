import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════
// BWR WORKS — Admin Audit Logs
// Records all admin actions for accountability
// ═══════════════════════════════════════════════════

/** Log an admin action — called internally from admin mutations */
export const log = mutation({
  args: {
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    details: v.any(),
  },
  handler: async (ctx, { action, targetType, targetId, details }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    return await ctx.db.insert("adminLogs", {
      adminUserId: userId,
      action,
      targetType,
      targetId,
      details,
      createdAt: Date.now(),
    });
  },
});

/** Get recent admin logs — admin only */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);

    const logs = await ctx.db
      .query("adminLogs")
      .order("desc")
      .take(limit || 50);

    // Enrich with admin user info
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.adminUserId as Id<"users">);
        return {
          ...log,
          adminName: user?.name || user?.email || "Unknown",
        };
      })
    );

    return enriched;
  },
});

/** Get logs for a specific target */
export const getByTarget = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, { targetType, targetId }) => {
    await requireAdmin(ctx);

    const all = await ctx.db
      .query("adminLogs")
      .order("desc")
      .collect();

    return all.filter(
      (l) => l.targetType === targetType && l.targetId === targetId
    );
  },
});

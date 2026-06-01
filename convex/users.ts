import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Get all users with order stats for admin dashboard.
 * Returns lastOrderDate for sorting/display.
 */
export const getAllWithStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();

    return await Promise.all(users.map(async (u) => {
      const userOrders = await ctx.db
        .query("orders")
        .withIndex("by_userId", (q) => q.eq("userId", u._id as unknown as string))
        .collect();

      const paidOrders = userOrders.filter((o) => o.paymentStatus === "verified");
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
      const lastOrderDate = userOrders.length > 0
        ? Math.max(...userOrders.map((o) => o.createdAt))
        : null;

      return {
        _id:           u._id,
        name:          u.name,
        email:         u.email,
        role:          u.role,
        _creationTime: u._creationTime,
        totalOrders:   userOrders.length,
        totalRevenue,
        lastOrderDate,
      };
    }));
  },
});

/** Get orders for a specific user — admin only */
export const getOrdersForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId as unknown as string))
      .order("desc")
      .collect();
    return orders.map((o) => ({
      _id:            o._id,
      orderId:        o.orderId,
      status:         o.status,
      paymentStatus:  o.paymentStatus,
      total:          o.total,
      subtotal:       o.subtotal,
      gstAmount:      o.gstAmount,
      discountAmount: o.discountAmount,
      couponCode:     o.couponCode,
      paymentMode:    o.paymentMode,
      items: o.items.map((item) => ({
        productName: item.productName,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
      })),
      _creationTime: o._creationTime,
    }));
  },
});

/**
 * Promote or demote a user's role — admin only.
 * Prevents an admin from removing their own privileges.
 */
export const updateUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("customer")),
  },
  handler: async (ctx, { targetUserId, role }) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    await requireAdmin(ctx);

    if (callerId === targetUserId && role === "customer") {
      throw new Error("You cannot remove your own admin privileges.");
    }

    const user = await ctx.db.get(targetUserId);
    if (!user) throw new Error("User not found.");

    await ctx.db.patch(targetUserId, { role });

    // Audit log
    await ctx.db.insert("adminLogs", {
      adminUserId: callerId,
      action: role === "admin" ? "promote_to_admin" : "demote_to_customer",
      targetType: "user",
      targetId: targetUserId,
      details: { previousRole: user.role ?? "customer", newRole: role },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * Get all users with order stats for admin dashboard.
 * Uses by_userId index per user instead of full orders table scan.
 *
 * ⚠️ NOTE: At scale (100+ users), replace this with denormalized
 * orderCount + totalRevenue fields on the users table, updated
 * via triggers on order creation/payment verification.
 */
export const getAllWithStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    return await Promise.all(users.map(async (u) => {
      const userOrders = await ctx.db
        .query("orders")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .collect();

      const totalRevenue = userOrders
        .filter((o) => o.paymentStatus === "verified")
        .reduce((sum, o) => sum + o.total, 0);

      // Return only safe fields — never spread the full user object
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        _creationTime: u._creationTime,
        totalOrders: userOrders.length,
        totalRevenue,
      };
    }));
  },
});

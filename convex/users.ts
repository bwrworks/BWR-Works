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

export const getAllWithStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const allOrders = await ctx.db.query("orders").collect();

    return users.map(u => {
      const userOrders = allOrders.filter(o => o.userId === u._id);
      const totalRevenue = userOrders
        .filter(o => o.paymentStatus === "verified")
        .reduce((sum, o) => sum + o.total, 0);

      return {
        ...u,
        totalOrders: userOrders.length,
        totalRevenue
      };
    });
  }
});

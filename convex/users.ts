import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    // Requires admin authentication inline (since requireAdmin is in another file, we can duplicate the check or import it)
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Access Denied: Requires Administrator Privileges.");

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

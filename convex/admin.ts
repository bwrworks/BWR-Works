import { internalQuery, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";


// Verify user is an admin securely on the backend
export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User missing");
  if (user.role !== "admin") throw new Error("Access Denied: Requires Administrator Privileges.");
  return user;
}

// Same logic exposed as an internal query for Actions (which lack ctx.db)
export const checkIsAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await requireAdmin(ctx);
  }
});


// Admin dashboard quick stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allOrders = await ctx.db.query("orders").collect();
    const allUsers = await ctx.db.query("users").collect();

    const pendingPayment = allOrders.filter(o => o.paymentStatus === "pending").length;
    const toDispatch = allOrders.filter(o =>
      o.paymentStatus === "verified" && (o.status === "received" || o.status === "printing")
    ).length;
    const shipped = allOrders.filter(o => o.status === "shipped").length;
    const delivered = allOrders.filter(o => o.status === "delivered").length;
    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === "verified")
      .reduce((sum, o) => sum + o.total, 0);

    const recentOrders = allOrders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(o => ({
        _id: o._id,
        orderId: o.orderId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        createdAt: o.createdAt,
        customerName: o.addressSnapshot.name,
      }));

    return {
      totalOrders: allOrders.length,
      totalUsers: allUsers.length,
      pendingPayment,
      toDispatch,
      shipped,
      delivered,
      totalRevenue,
      recentOrders,
    };
  }
});

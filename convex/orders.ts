import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";
import { api } from "./_generated/api";

// ═══════════════════════════════════════════════════
// BWR WORKS — Order Queries & Mutations
// ═══════════════════════════════════════════════════

// ─────────────────────────────────────────────────
// CUSTOMER QUERIES
// ─────────────────────────────────────────────────

/** Get all orders for the logged-in customer */
export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Get a single order by orderId string (e.g. "BWR-0001") — customer-facing */
export const getOrderById = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);

    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .first();

    // Customers can only see their own orders, Admins can see all
    if (!order) return null;
    if (order.userId !== userId && user?.role !== "admin") return null;
    
    return order;
  },
});

// ─────────────────────────────────────────────────
// ORDER CREATION — Called after Razorpay order is created
// ─────────────────────────────────────────────────

/** Create a pending order (before payment) */
export const createOrder = mutation({
  args: {
    razorpayOrderId: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        productSlug: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        costBreakdown: v.object({
          material: v.number(),
          electricity: v.number(),
          machine: v.number(),
          consumables: v.number(),
          design: v.number(),
          labour: v.number(),
          packaging: v.number(),
          overheads: v.number(),
          subtotalCost: v.number(),
          riskBuffer: v.number(),
          trueCost: v.number(),
          margin: v.number(),
          sellingPrice: v.number(),
        }),
        customisations: v.any(),
        customText: v.any(),
        imageRef: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    gstAmount: v.number(),
    discountAmount: v.number(),
    couponCode: v.optional(v.string()),
    total: v.number(),
    addressSnapshot: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to place an order.");

    // Generate BWR order ID with random suffix to prevent race condition duplicates
    const orderCount = await ctx.db.query("orders").collect();
    const orderNumber = String(orderCount.length + 1).padStart(4, "0");
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderId = `BWR-${orderNumber}-${suffix}`;

    return await ctx.db.insert("orders", {
      orderId,
      userId,
      ...args,
      status: "received",
      paymentStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** Mark order as paid — called internally from Razorpay payment verification action */
export const markOrderPaid = internalMutation({
  args: {
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
  },
  handler: async (ctx, { razorpayOrderId, razorpayPaymentId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_razorpayOrderId", (q) =>
        q.eq("razorpayOrderId", razorpayOrderId)
      )
      .first();

    if (!order) throw new Error("Order not found.");

    await ctx.db.patch(order._id, {
      paymentStatus: "verified",
      razorpayPaymentId,
      updatedAt: Date.now(),
    });

    return order;
  },
});

// ─────────────────────────────────────────────────
// ADMIN MUTATIONS
// ─────────────────────────────────────────────────

/** Get ALL orders for admin dashboard */
export const getAllForAdmin = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    await requireAdmin(ctx);

    let ordersQuery = ctx.db.query("orders").order("desc");

    const orders = await ordersQuery.collect();

    // Filter by status if provided
    const filtered = status
      ? orders.filter((o) => o.status === status)
      : orders;

    return limit ? filtered.slice(0, limit) : filtered;
  },
});

/** Get a single order for admin — includes full details */
export const getOrderByIdAdmin = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .first();
  },
});

/** Update order status — admin only, triggers notification */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal("received"),
      v.literal("printing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, status, trackingNumber }) => {
    await requireAdmin(ctx);

    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .first();

    if (!order) throw new Error("Order not found.");

    const updates: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };

    if (trackingNumber) updates.trackingNumber = trackingNumber;

    await ctx.db.patch(order._id, updates);

    // Trigger status notification email to customer
    if (status !== "received") {
      const user = order.userId ? await ctx.db.get(order.userId as any) : null;
      const customerEmail = (user as any)?.email;
      const customerName = order.addressSnapshot?.name || "Customer";
      if (customerEmail) {
        await ctx.scheduler.runAfter(0, api.notifications.sendStatusUpdateEmail, {
          customerEmail,
          customerName,
          orderId,
          newStatus: status,
          trackingNumber,
        });
      }
    }

    return order._id;
  },
});

/** Add admin note to order (not visible to customer) */
export const addAdminNote = mutation({
  args: {
    orderId: v.string(),
    note: v.string(),
  },
  handler: async (ctx, { orderId, note }) => {
    await requireAdmin(ctx);

    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .first();

    if (!order) throw new Error("Order not found.");

    await ctx.db.patch(order._id, {
      adminNotes: note,
      updatedAt: Date.now(),
    });
  },
});

/** Get order stats for admin dashboard */
export const getOrderStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const orders = await ctx.db.query("orders").collect();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const todayOrders = orders.filter(
      (o) => o.createdAt >= todayStart.getTime() && o.paymentStatus === "verified"
    );
    const weekOrders = orders.filter(
      (o) => o.createdAt >= weekAgo && o.paymentStatus === "verified"
    );
    const paidOrders = orders.filter((o) => o.paymentStatus === "verified");

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);

    const byStatus = {
      received: orders.filter((o) => o.status === "received").length,
      printing: orders.filter((o) => o.status === "printing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };

    return {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      totalRevenue,
      todayOrders: todayOrders.length,
      todayRevenue,
      weekOrders: weekOrders.length,
      weekRevenue,
      byStatus,
    };
  },
});

/**
 * Record a verified payment in the payments audit table
 * Internal — called only from verifyAndFulfillPayment action
 */
export const recordPayment = internalMutation({
  args: {
    orderId: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    signature: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Idempotency — don't double-record
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_razorpayPaymentId", (q) =>
        q.eq("razorpayPaymentId", args.razorpayPaymentId)
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("payments", {
      ...args,
      currency: "INR",
      status: "verified",
      verifiedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

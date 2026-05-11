import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Strip sensitive cost breakdown from items
    return orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const { costBreakdown, ...safeItem } = item;
        return safeItem;
      })
    })) as typeof orders;
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
    
    // Strip sensitive cost breakdown for non-admins
    if (user?.role !== "admin") {
      order.items = order.items.map(item => {
        const { costBreakdown, ...safeItem } = item;
        return safeItem;
      }) as typeof order.items;
    }

    return order;
  },
});

// ─────────────────────────────────────────────────
// ORDER CREATION — Called after Razorpay order is created
// ⚠️ SECURITY: All prices re-validated server-side
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
    paymentMode: v.union(v.literal("online"), v.literal("cod")),
    balanceDue: v.number(),
    razorpayAmount: v.number(),
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

    // ═══════════════════════════════════════════════
    // 🔒 SECURITY: Server-side price validation
    // Never trust frontend-supplied prices
    // ═══════════════════════════════════════════════

    // 1. Fetch current GST rate from pricing defaults
    const pricingDefaults = await ctx.db.query("pricingDefaults").first();
    const gstPercent = pricingDefaults?.gstPercent ?? 18;

    // 2. Validate each item's price against the database
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of args.items) {
      if (item.quantity < 1 || item.quantity > 100) {
        throw new Error(`Invalid quantity for ${item.productName}.`);
      }

      // Fetch the product to verify it exists and is active
      const product = await ctx.db.get(item.productId as Id<"products">);
      if (!product) {
        throw new Error(`Product not found: ${item.productName}.`);
      }
      if (product.isActive === false) {
        throw new Error(`Product is no longer available: ${item.productName}.`);
      }

      // ─── Stock Validation ───
      const currentStock = product.stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productName}. Only ${currentStock} left.`
        );
      }

      // Fetch the server-side B2C price for this product
      const pricing = await ctx.db
        .query("productPricing")
        .withIndex("by_productId", (q) => q.eq("productId", item.productId as Id<"products">))
        .first();

      if (!pricing) {
        throw new Error(`Pricing not configured for ${item.productName}. Please contact support.`);
      }

      const serverUnitPrice = pricing.calculatedB2CPrice; // in paise, from DB
      const serverCostBreakdown = pricing.costBreakdown;

      // Use server price, not frontend price
      serverSubtotal += serverUnitPrice * item.quantity;

      validatedItems.push({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        quantity: item.quantity,
        unitPrice: serverUnitPrice, // ← SERVER price
        costBreakdown: serverCostBreakdown, // ← SERVER breakdown
        customisations: item.customisations || {},
        customText: item.customText || {},
        imageRef: item.imageRef,
      });
    }

    // 3. Re-calculate discount server-side if a coupon was applied
    let serverDiscount = 0;
    if (args.couponCode) {
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", args.couponCode!.toUpperCase().trim()))
        .first();

      if (coupon && coupon.isActive) {
        if (coupon.discountType === "flat") {
          serverDiscount = coupon.discountValue;
        } else if (coupon.discountType === "percent") {
          serverDiscount = Math.round(serverSubtotal * (coupon.discountValue / 100));
        }
        serverDiscount = Math.min(serverDiscount, serverSubtotal);
      }
      // If coupon is invalid/expired, we simply apply $0 discount — no error
    }

    // 4. Re-calculate GST and total
    const afterDiscount = serverSubtotal - serverDiscount;
    const serverGst = Math.round(afterDiscount * (gstPercent / 100));
    const serverTotal = afterDiscount + serverGst;

    // 5. Sanity check — reject if frontend total differs by more than ₹5 (500 paise)
    // This gracefully handles minor rounding differences
    if (Math.abs(serverTotal - args.total) > 500) {
      console.error(
        `[SECURITY] Price mismatch detected! Frontend total: ${args.total}, Server total: ${serverTotal}. User: ${userId}`
      );
      throw new Error("Price verification failed. Please refresh the page and try again.");
    }

    // ═══════════════════════════════════════════════
    // 🔒 STOCK VALIDATION ONLY (Deduction moved to markOrderPaid)
    // ═══════════════════════════════════════════════
    // Stock is validated above. We DO NOT decrement here to avoid
    // abandoned carts permanently locking up inventory.

    // Generate BWR order ID using atomic counter (B-02 fix)
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "orders"))
      .first();

    let nextNum: number;
    if (counter) {
      nextNum = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextNum });
    } else {
      nextNum = 1;
      await ctx.db.insert("counters", { name: "orders", value: 1 });
    }

    const orderNumber = String(nextNum).padStart(4, "0");
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderId = `BWR${orderNumber}${suffix}`;

    return await ctx.db.insert("orders", {
      orderId,
      userId,
      items: validatedItems,
      subtotal: serverSubtotal,
      gstAmount: serverGst,
      discountAmount: serverDiscount,
      couponCode: args.couponCode,
      total: serverTotal,
      paymentMode: args.paymentMode,
      balanceDue: args.balanceDue,
      razorpayAmount: args.razorpayAmount,
      razorpayOrderId: args.razorpayOrderId,
      addressSnapshot: args.addressSnapshot,
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

    // 1. Idempotency Check (crucial for racing webhooks)
    if (order.paymentStatus === "verified") {
      return order;
    }

    // 2. Patch payment status to verified
    await ctx.db.patch(order._id, {
      paymentStatus: "verified",
      razorpayPaymentId,
      updatedAt: Date.now(),
    });

    // 3. Deduct Stock safely now that payment is confirmed
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId as Id<"products">);
      if (product) {
        const newStock = (product.stock ?? 0) - item.quantity;
        // Clamp to 0 to prevent negative stock edge cases.
        await ctx.db.patch(product._id, { stock: Math.max(0, newStock) });
      }
    }

    // 4. Record Coupon Usage (if any)
    if (order.couponCode) {
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", order.couponCode!))
        .first();
      
      if (coupon && order.userId) {
        await ctx.runMutation(internal.coupons.internalRecordCouponUse, {
          couponId: coupon._id,
          userId: order.userId,
          orderId: order.orderId,
        });
      }
    }

    // 5. Schedule order confirmation email
    const user = order.userId ? await ctx.db.get(order.userId as Id<"users">) : null;
    const customerEmail = user?.email;
    if (customerEmail) {
      await ctx.scheduler.runAfter(0, api.notifications.sendOrderConfirmationEmail, {
        customerEmail,
        customerName: order.addressSnapshot.name,
        orderId: order.orderId,
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        total: order.total,
      });
    }

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

    // Audit log
    const adminUserId = await getAuthUserId(ctx);
    if (adminUserId) {
      await ctx.db.insert("adminLogs", {
        adminUserId,
        action: "update_status",
        targetType: "order",
        targetId: orderId,
        details: { from: order.status, to: status, trackingNumber },
        createdAt: Date.now(),
      });
    }

    // Trigger status notification email to customer
    if (status !== "received") {
      const user = order.userId ? await ctx.db.get(order.userId as Id<"users">) : null;
      const customerEmail = user?.email;
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

    // Audit log
    const adminUserId = await getAuthUserId(ctx);
    if (adminUserId) {
      await ctx.db.insert("adminLogs", {
        adminUserId,
        action: "add_note",
        targetType: "order",
        targetId: orderId,
        details: { note: note.slice(0, 200) },
        createdAt: Date.now(),
      });
    }
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

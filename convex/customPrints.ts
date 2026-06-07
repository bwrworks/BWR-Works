import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";
import { api, internal } from "./_generated/api";
import { calculateCostBreakdown } from "./pricing";

// ═══════════════════════════════════════════════════
// BWR WORKS — Custom Print Requests Backend
// ═══════════════════════════════════════════════════

// ─────────────────────────────────────────────────
// CUSTOMER METHODS
// ─────────────────────────────────────────────────

/** Submit a new custom print request */
export const createCustomPrintRequest = mutation({
  args: {
    description: v.string(),
    images: v.array(v.string()), // Cloudinary URLs
  },
  handler: async (ctx, { description, images }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to request a custom print.");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User profile not found.");

    // Generate BWR sequential custom ID: BWR-CUST-xxxx
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "custom_prints"))
      .first();

    let nextNum: number;
    if (counter) {
      nextNum = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextNum });
    } else {
      nextNum = 1;
      await ctx.db.insert("counters", { name: "custom_prints", value: 1 });
    }

    const numberStr = String(nextNum).padStart(4, "0");
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const customPrintId = `BWRCUST${numberStr}${suffix}`;

    await ctx.db.insert("customPrints", {
      customPrintId,
      userId,
      name: user.name || user.email?.split("@")[0] || "Customer",
      email: user.email || "",
      phone: user.phone || undefined,
      description,
      images,
      status: "requested",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule email alerts for request confirmation (non-blocking)
    await ctx.scheduler.runAfter(0, api.notifications.sendCustomPrintRequestConfirmationEmail, {
      customerEmail: user.email || "",
      customerName: user.name || user.email?.split("@")[0] || "Customer",
      customPrintId,
      description,
      images,
    });

    return customPrintId;
  },
});

/** List the authenticated customer's custom print requests */
export const getMyCustomPrints = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("customPrints")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Strip sensitive internal cost breakdowns from pricing before sending to customer
    return requests.map(req => {
      if (req.pricing) {
        const { costBreakdown, ...safePricing } = req.pricing;
        return { ...req, pricing: safePricing };
      }
      return req;
    });
  },
});

/** Get a single custom print request (customer-facing) */
export const getCustomPrintById = query({
  args: { customPrintId: v.string() },
  handler: async (ctx, { customPrintId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const req = await ctx.db
      .query("customPrints")
      .withIndex("by_customPrintId", (q) => q.eq("customPrintId", customPrintId))
      .first();

    if (!req) return null;
    
    // Check authorization: must be owner or admin
    if (req.userId !== userId && user?.role !== "admin") {
      return null;
    }

    // Strip costBreakdown for non-admins
    if (user?.role !== "admin" && req.pricing) {
      const { costBreakdown, ...safePricing } = req.pricing;
      return { ...req, pricing: safePricing };
    }

    return req;
  },
});

// ─────────────────────────────────────────────────
// ADMIN METHODS
// ─────────────────────────────────────────────────

/** Get all custom print requests for admin page */
export const getAllCustomPrintsAdmin = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);

    const requests = await ctx.db
      .query("customPrints")
      .order("desc")
      .collect();

    if (status) {
      return requests.filter(r => r.status === status);
    }
    return requests;
  },
});

/** Get single custom print with full pricing details (admin-only) */
export const getCustomPrintByIdAdmin = query({
  args: { customPrintId: v.string() },
  handler: async (ctx, { customPrintId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("customPrints")
      .withIndex("by_customPrintId", (q) => q.eq("customPrintId", customPrintId))
      .first();
  },
});

/** Submit a price quotation for a request (admin-only) */
export const submitCustomPrintQuote = mutation({
  args: {
    id: v.id("customPrints"),
    materialWeightGrams: v.number(),
    printTimeMinutes: v.number(),
    labourTimeMinutes: v.number(),
    packagingCost: v.optional(v.number()),
    customPrintExtraCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Custom print request not found.");
    if (req.status !== "requested") throw new Error("Quote has already been submitted or processed.");

    const defaults = await ctx.db.query("pricingDefaults").first();
    if (!defaults) throw new Error("Global pricing defaults not configured.");

    const finalPackagingCost = args.packagingCost ?? defaults.defaultPackagingCost;
    const finalExtraCost = args.customPrintExtraCost ?? defaults.customPrintExtraCost ?? 500;

    // Run core pricing formula using imported function
    // designCostOneTime represents customPrintExtraCost for custom items,
    // and designCostAmortizeQty is 1 (since it's a single unique print request).
    const breakdown = calculateCostBreakdown(defaults, {
      materialWeightGrams: args.materialWeightGrams,
      printTimeMinutes: args.printTimeMinutes,
      labourTimeMinutes: args.labourTimeMinutes,
      designCostOneTime: finalExtraCost,
      designCostAmortizeQty: 1,
      packagingCost: finalPackagingCost,
    });

    // Calculate GST (sellingPrice is in paise)
    const sellingPrice = breakdown.sellingPrice;
    const gstPercent = defaults.gstPercent ?? 18;
    const gstAmount = Math.round(sellingPrice * (gstPercent / 100));
    const total = sellingPrice + gstAmount;

    const pricing = {
      materialWeightGrams: args.materialWeightGrams,
      printTimeMinutes: args.printTimeMinutes,
      labourTimeMinutes: args.labourTimeMinutes,
      packagingCost: finalPackagingCost,
      customPrintExtraCost: finalExtraCost,
      subtotal: sellingPrice,
      gstAmount,
      total,
      costBreakdown: breakdown,
    };

    await ctx.db.patch(req._id, {
      status: "quoted",
      pricing,
      updatedAt: Date.now(),
    });

    // Notify customer via email (non-blocking)
    await ctx.scheduler.runAfter(0, api.notifications.sendCustomPrintQuoteEmail, {
      customerEmail: req.email,
      customerName: req.name,
      customPrintId: req.customPrintId,
      total,
    });

    return req._id;
  },
});

/** Update status of a custom order (admin-only) */
export const updateCustomPrintStatusAdmin = mutation({
  args: {
    id: v.id("customPrints"),
    status: v.union(
      v.literal("printing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
    trackingNumber: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, trackingNumber, adminNotes }) => {
    await requireAdmin(ctx);

    const req = await ctx.db.get(id);
    if (!req) throw new Error("Custom order not found.");

    const oldStatus = req.status;
    const patches: Record<string, any> = {
      status,
      updatedAt: Date.now(),
    };

    if (trackingNumber !== undefined) patches.trackingNumber = trackingNumber;
    if (adminNotes !== undefined) patches.adminNotes = adminNotes;

    await ctx.db.patch(id, patches);

    // Write audit log
    const adminUser = await getAuthUserId(ctx);
    if (adminUser) {
      await ctx.db.insert("adminLogs", {
        adminUserId: adminUser,
        action: "update_custom_status",
        targetType: "custom_print",
        targetId: req.customPrintId,
        details: { from: oldStatus, to: status, trackingNumber },
        createdAt: Date.now(),
      });
    }

    // Schedule status update email to user
    await ctx.scheduler.runAfter(0, api.notifications.sendCustomPrintStatusEmail, {
      customerEmail: req.email,
      customerName: req.name,
      customPrintId: req.customPrintId,
      newStatus: status,
      trackingNumber,
    });

    return req._id;
  },
});

// ─────────────────────────────────────────────────
// CHECKOUT / PAYMENT ACTIONS (Node context needed)
// ─────────────────────────────────────────────────

/** Initiates payment flow for a quoted custom print, creating a Razorpay order */
export const prepareCustomPrintPayment = action({
  args: {
    customPrintId: v.string(),
    address: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, { customPrintId, address }): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to complete payment.");

    // Query request data securely
    const customPrint = await ctx.runQuery(internal.customPrints.getCustomPrintInternal, { customPrintId });
    if (!customPrint) throw new Error("Request not found.");
    if (customPrint.userId !== userId) throw new Error("Access denied.");
    if (customPrint.status !== "quoted" || !customPrint.pricing) {
      throw new Error("This request is not in a payable quoted state.");
    }

    // Create the Razorpay Order on backend
    const rzpOrder = await ctx.runAction(api.payments.createRazorpayOrder, {
      amount: customPrint.pricing.total, // paise
      currency: "INR",
      receipt: customPrint.customPrintId,
    });

    // Save payment details on request
    await ctx.runMutation(internal.customPrints.savePaymentDetailsInternal, {
      id: customPrint._id,
      razorpayOrderId: rzpOrder.razorpayOrderId,
      addressSnapshot: address,
    });

    return rzpOrder;
  },
});

// ─────────────────────────────────────────────────
// INTERNAL METHODS (Queried internally/via webhook)
// ─────────────────────────────────────────────────

/** Get custom print internally (includes cost breakdown) */
export const getCustomPrintInternal = internalQuery({
  args: { customPrintId: v.string() },
  handler: async (ctx, { customPrintId }) => {
    return await ctx.db
      .query("customPrints")
      .withIndex("by_customPrintId", (q) => q.eq("customPrintId", customPrintId))
      .first();
  },
});

/** Get custom print by Razorpay Order ID */
export const getCustomPrintByRazorpayIdInternal = internalQuery({
  args: { razorpayOrderId: v.string() },
  handler: async (ctx, { razorpayOrderId }) => {
    return await ctx.db
      .query("customPrints")
      .withIndex("by_razorpayOrderId", (q) => q.eq("razorpayOrderId", razorpayOrderId))
      .first();
  },
});

/** Save Razorpay order ID and address snapshot internally before payment modal */
export const savePaymentDetailsInternal = internalMutation({
  args: {
    id: v.id("customPrints"),
    razorpayOrderId: v.string(),
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
  handler: async (ctx, { id, razorpayOrderId, addressSnapshot }) => {
    await ctx.db.patch(id, {
      razorpayOrderId,
      addressSnapshot,
      updatedAt: Date.now(),
    });
  },
});

/** Mark custom print paid (called from Webhook or frontend confirmation) */
export const markCustomPrintPaid = internalMutation({
  args: {
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
  },
  handler: async (ctx, { razorpayOrderId, razorpayPaymentId }) => {
    const customPrint = await ctx.db
      .query("customPrints")
      .withIndex("by_razorpayOrderId", (q) => q.eq("razorpayOrderId", razorpayOrderId))
      .first();

    if (!customPrint) throw new Error("Custom print order not found.");

    // Idempotency check
    if (customPrint.status !== "quoted") {
      return customPrint;
    }

    await ctx.db.patch(customPrint._id, {
      status: "ordered",
      razorpayPaymentId,
      updatedAt: Date.now(),
    });

    // Schedule payment confirmation emails (non-blocking)
    await ctx.scheduler.runAfter(0, api.notifications.sendCustomPrintPaidEmail, {
      customerEmail: customPrint.email,
      customerName: customPrint.name,
      customPrintId: customPrint.customPrintId,
      total: customPrint.pricing!.total,
    });

    return customPrint;
  },
});

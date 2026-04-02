import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Coupon Validation & Management
// ═══════════════════════════════════════════════════

/**
 * Validate a coupon code at checkout
 * Returns discount amount (paise) or throws with reason
 */
export const validateCoupon = mutation({
  args: {
    code: v.string(),
    orderSubtotal: v.number(), // in paise
  },
  handler: async (ctx, { code, orderSubtotal }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to apply a coupon.");

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase().trim()))
      .first();

    if (!coupon) throw new Error("Invalid coupon code.");
    if (!coupon.isActive) throw new Error("This coupon is no longer active.");

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
      throw new Error("This coupon has expired.");
    }

    // Check max uses
    if (coupon.maxUses !== undefined && coupon.currentUses >= coupon.maxUses) {
      throw new Error("This coupon has reached its usage limit.");
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      const minRupees = (coupon.minOrderAmount / 100).toFixed(0);
      throw new Error(`Minimum order amount of ₹${minRupees} required for this coupon.`);
    }

    // Check per-user usage
    const alreadyUsed = await ctx.db
      .query("couponUses")
      .withIndex("by_couponId_userId", (q) =>
        q.eq("couponId", coupon._id).eq("userId", userId)
      )
      .first();

    if (alreadyUsed) {
      throw new Error("You have already used this coupon.");
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue; // already in paise
    } else if (coupon.discountType === "percent") {
      discountAmount = Math.round(orderSubtotal * (coupon.discountValue / 100));
    }

    // Discount cannot exceed order total
    discountAmount = Math.min(discountAmount, orderSubtotal);

    return {
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount, // in paise — apply this to the order
    };
  },
});

/**
 * Record coupon usage after successful order
 * Called internally after payment verified
 */
export const recordCouponUse = mutation({
  args: {
    couponId: v.id("coupons"),
    orderId: v.string(),
  },
  handler: async (ctx, { couponId, orderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    // Increment usage count
    const coupon = await ctx.db.get(couponId);
    if (coupon) {
      await ctx.db.patch(couponId, {
        currentUses: coupon.currentUses + 1,
      });
    }

    // Record usage
    await ctx.db.insert("couponUses", {
      couponId,
      userId,
      orderId,
      usedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────
// ADMIN — Coupon Management
// ─────────────────────────────────────────────────

export const listCoupons = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("coupons").order("desc").collect();
  },
});

export const createCoupon = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("flat"), v.literal("percent")),
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const code = args.code.toUpperCase().trim();

    // Check uniqueness
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (existing) throw new Error(`Coupon code "${code}" already exists.`);

    return await ctx.db.insert("coupons", {
      ...args,
      code,
      currentUses: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const toggleCoupon = mutation({
  args: { id: v.id("coupons"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isActive });
  },
});

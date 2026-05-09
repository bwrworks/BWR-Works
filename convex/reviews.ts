import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Product Reviews
// All validation enforced server-side
// ═══════════════════════════════════════════════════

/**
 * Submit a review for a product.
 * - User must be authenticated
 * - Rating must be 1–5 integer
 * - Review text must be 1–500 chars
 * - One review per user per product
 */
export const submitReview = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    reviewText: v.string(),
  },
  handler: async (ctx, { productId, rating, reviewText }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be signed in to leave a review.");

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be a whole number between 1 and 5.");
    }

    // Validate review text
    const trimmed = reviewText.trim();
    if (trimmed.length < 1 || trimmed.length > 500) {
      throw new Error("Review must be between 1 and 500 characters.");
    }

    // Check product exists
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found.");

    // One review per user per product
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", userId).eq("productId", productId)
      )
      .first();
    if (existing) {
      throw new Error("You have already reviewed this product.");
    }

    // Get user name
    const user = await ctx.db.get(userId);
    const userName = user?.name || user?.email?.split("@")[0] || "Customer";

    return await ctx.db.insert("reviews", {
      productId,
      userId,
      userName,
      rating,
      reviewText: trimmed,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all reviews for a product, newest first.
 * Public query — no auth required.
 */
export const getProductReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .collect();

    // Sort newest first
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get average rating and count for a product.
 * Public query — no auth required.
 */
export const getAverageRating = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .collect();

    if (reviews.length === 0) return { avg: 0, count: 0 };

    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return {
      avg: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});

/**
 * Get top reviews (4 or 5 stars) across all products for the homepage.
 * Returns up to 10 recent top reviews.
 */
export const getTopReviews = query({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db.query("reviews").collect();
    
    // Filter for 4 or 5 stars, sort newest first, take top 10
    const topReviews = reviews
      .filter((r) => r.rating >= 4)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    // Join with product data to get product names and categories for the tags
    return Promise.all(
      topReviews.map(async (review) => {
        const product = await ctx.db.get(review.productId);
        return {
          ...review,
          productName: product?.name || "Custom Product",
          productCategory: product?.category || "Product",
        };
      })
    );
  },
});

/**
 * Delete a review (admin only).
 */
export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

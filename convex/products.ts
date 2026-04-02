import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Product Queries & Mutations
// ═══════════════════════════════════════════════════

/**
 * Get all active products for storefront
 * Includes calculated B2C price from pricing engine
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Attach prices from pricing engine
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const pricing = await ctx.db
          .query("productPricing")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .first();

        return {
          ...product,
          price: pricing?.calculatedB2CPrice ?? null,
          // 🔴 NEVER attach: costBreakdown, trueCost, margins
        };
      })
    );

    return productsWithPrices;
  },
});

/**
 * Get single product by slug (for product detail page)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!product) return null;

    const pricing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) => q.eq("productId", product._id))
      .first();

    return {
      ...product,
      price: pricing?.calculatedB2CPrice ?? null,
    };
  },
});

/**
 * Get all products for admin (includes inactive)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").collect();
    // Attach prices
    return Promise.all(products.map(async (p) => {
      const pricing = await ctx.db.query("productPricing").withIndex("by_productId", (q) => q.eq("productId", p._id)).first();
      return { ...p, price: pricing?.calculatedB2CPrice ?? null };
    }));
  },
});

/**
 * Create a new product (admin only)
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    shortTagline: v.string(),
    emotionalAngle: v.string(),
    images: v.array(v.string()),
    isActive: v.boolean(),
    stock: v.number(),
    customisationConfig: v.array(
      v.object({
        fieldId: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("select"),
          v.literal("text"),
          v.literal("toggle"),
          v.literal("file"),
          v.literal("quantity")
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        maxLength: v.optional(v.number()),
        minQty: v.optional(v.number()),
        maxQty: v.optional(v.number()),
        priceModifier: v.optional(v.number()),
        fileConfig: v.optional(
          v.object({
            maxSizeMB: v.number(),
            allowedTypes: v.array(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
    if (existing) throw new Error(`Product with slug "${args.slug}" already exists`);
    return await ctx.db.insert("products", { ...args, createdAt: Date.now(), updatedAt: Date.now() });
  },
});

/**
 * Update product (admin only)
 */
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortTagline: v.optional(v.string()),
    emotionalAngle: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    stock: v.optional(v.number()),
    customisationConfig: v.optional(
      v.array(
        v.object({
          fieldId: v.string(),
          label: v.string(),
          type: v.union(
            v.literal("select"),
            v.literal("text"),
            v.literal("toggle"),
            v.literal("file"),
            v.literal("quantity")
          ),
          required: v.boolean(),
          options: v.optional(v.array(v.string())),
          maxLength: v.optional(v.number()),
          minQty: v.optional(v.number()),
          maxQty: v.optional(v.number()),
          priceModifier: v.optional(v.number()),
          fileConfig: v.optional(
            v.object({
              maxSizeMB: v.number(),
              allowedTypes: v.array(v.string()),
            })
          ),
        })
      )
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

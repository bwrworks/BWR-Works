import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Product Queries & Mutations
// ═══════════════════════════════════════════════════
export const getProductInternal = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    return await ctx.db.get(productId);
  },
});

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
 * Get the single featured product for Hero + FeaturedDropPage
 * Falls back to the first active product if none is marked featured.
 */
export const getFeaturedProduct = query({
  args: {},
  handler: async (ctx) => {
    // Look for the product flagged as featured
    const allActive = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const featured = allActive.find((p) => p.isFeatured === true) || allActive[0] || null;
    if (!featured) return null;

    const pricing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) => q.eq("productId", featured._id))
      .first();

    return {
      ...featured,
      price: pricing?.calculatedB2CPrice ?? null,
    };
  },
});

/**
 * Search active products by name using native Convex search index
 * Returns matching products with prices
 */
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, { term }) => {
    const lower = term.toLowerCase().trim();
    if (!lower) return [];

    // Use native search index for name-based search
    const searchResults = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q.search("name", lower).eq("isActive", true)
      )
      .take(20);

    // Also do a fallback filter on description/category/tagline
    // for terms that match those but not the name
    const allActive = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const extraMatches = allActive.filter(
      (p) =>
        !searchResults.some((sr) => sr._id === p._id) &&
        (p.description.toLowerCase().includes(lower) ||
         p.category.toLowerCase().includes(lower) ||
         p.shortTagline.toLowerCase().includes(lower))
    );

    const combined = [...searchResults, ...extraMatches];

    return Promise.all(
      combined.map(async (product) => {
        const pricing = await ctx.db
          .query("productPricing")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .first();
        return {
          ...product,
          price: pricing?.calculatedB2CPrice ?? null,
        };
      })
    );
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
    isFeatured: v.optional(v.boolean()),
    specifications: v.optional(v.any()),
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

    if (args.isFeatured) {
      const allProducts = await ctx.db.query("products").collect();
      const featuredProducts = allProducts.filter(p => p.isFeatured === true);
      for (const fp of featuredProducts) {
        await ctx.db.patch(fp._id, { isFeatured: false });
      }
    }

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
    isFeatured: v.optional(v.boolean()),
    specifications: v.optional(v.any()),
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

    if (updates.isFeatured) {
      const allProducts = await ctx.db.query("products").collect();
      const featuredProducts = allProducts.filter(p => p.isFeatured === true);
      for (const fp of featuredProducts) {
        if (fp._id !== id) {
          await ctx.db.patch(fp._id, { isFeatured: false });
        }
      }
    }

    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);

    // Block deletion if there are active (non-delivered/cancelled) orders referencing this product
    const allOrders = await ctx.db.query("orders").collect();
    const activeOrders = allOrders.filter(
      (o) =>
        o.items.some((item) => item.productId === id) &&
        o.status !== "delivered"
    );
    if (activeOrders.length > 0) {
      throw new Error(
        `Cannot delete: ${activeOrders.length} active order(s) reference this product.`
      );
    }

    // Remove associated pricing
    const pricing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) => q.eq("productId", id))
      .collect();
    for (const p of pricing) await ctx.db.delete(p._id);

    // Remove associated reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", id))
      .collect();
    for (const r of reviews) await ctx.db.delete(r._id);

    await ctx.db.delete(id);
  },
});

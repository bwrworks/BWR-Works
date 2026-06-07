import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Cost-Based Pricing Engine
// Formula: Material + Electricity + Machine +
//          Consumables + Design + Labour +
//          Packaging + Overheads + Risk Buffer +
//          Profit Margin = Selling Price
// ═══════════════════════════════════════════════════

/**
 * THE CORE FORMULA
 * Calculates cost breakdown for a single unit of a product
 */
export function calculateCostBreakdown(
  defaults: {
    materialCostPerKg: number;
    electricityCostPerHour: number;
    machineDepreciationPerHour: number;
    consumablesPercent: number;
    labourCostPerHour: number;
    defaultPackagingCost: number;
    overheadsCost: number;
    riskBufferPercent: number;
    b2cMarginPercent: number;
  },
  productParams: {
    materialWeightGrams: number;
    printTimeMinutes: number;
    labourTimeMinutes: number;
    designCostOneTime: number;
    designCostAmortizeQty: number;
    packagingCost?: number;
    customOverrides?: {
      materialCostPerKg?: number;
      consumablesPercent?: number;
      overheadsCost?: number;
    };
  }
) {
  // Use product overrides if they exist, otherwise global defaults
  const materialRate =
    productParams.customOverrides?.materialCostPerKg ??
    defaults.materialCostPerKg;
  const consumablesRate =
    productParams.customOverrides?.consumablesPercent ??
    defaults.consumablesPercent;
  const overheadsRate =
    productParams.customOverrides?.overheadsCost ?? defaults.overheadsCost;

  // 1. Material cost
  const material =
    (productParams.materialWeightGrams / 1000) * materialRate;

  // 2. Electricity cost
  const electricity =
    (productParams.printTimeMinutes / 60) * defaults.electricityCostPerHour;

  // 3. Machine depreciation
  const machine =
    (productParams.printTimeMinutes / 60) *
    defaults.machineDepreciationPerHour;

  // 4. Consumables (% of material cost)
  const consumables = material * (consumablesRate / 100);

  // 5. Design cost (one-time, amortized over N units)
  const design =
    productParams.designCostAmortizeQty > 0
      ? productParams.designCostOneTime /
        productParams.designCostAmortizeQty
      : 0;

  // 6. Labour cost
  const labour =
    (productParams.labourTimeMinutes / 60) * defaults.labourCostPerHour;

  // 7. Packaging
  const packaging =
    productParams.packagingCost ?? defaults.defaultPackagingCost;

  // 8. Overheads
  const overheads = overheadsRate;

  // Subtotal
  const subtotalCost =
    material +
    electricity +
    machine +
    consumables +
    design +
    labour +
    packaging +
    overheads;

  // 9. Risk buffer
  const riskBuffer = subtotalCost * (defaults.riskBufferPercent / 100);

  // True cost
  const trueCost = subtotalCost + riskBuffer;

  // B2C selling price
  const margin = trueCost * (defaults.b2cMarginPercent / 100);
  const sellingPrice = trueCost + margin;

  return {
    material: Math.round(material * 100), // Store in paise
    electricity: Math.round(electricity * 100),
    machine: Math.round(machine * 100),
    consumables: Math.round(consumables * 100),
    design: Math.round(design * 100),
    labour: Math.round(labour * 100),
    packaging: Math.round(packaging * 100),
    overheads: Math.round(overheads * 100),
    subtotalCost: Math.round(subtotalCost * 100),
    riskBuffer: Math.round(riskBuffer * 100),
    trueCost: Math.round(trueCost * 100),
    margin: Math.round(margin * 100),
    sellingPrice: Math.round(sellingPrice * 100),
  };
}

// ─────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────

/**
 * Get the current pricing defaults
 */
export const getPricingDefaults = query({
  args: {},
  handler: async (ctx) => {
    const defaults = await ctx.db.query("pricingDefaults").first();
    return defaults;
  },
});

/**
 * Get product price for storefront display
 * Returns only the selling price — NEVER the cost breakdown
 */
export const getProductPrice = query({
  args: {
    productId: v.id("products"),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, { productId, quantity = 1 }) => {
    const pricing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .first();

    if (!pricing) return null;

    // Get customisation modifiers from product config
    const product = await ctx.db.get(productId);
    if (!product) return null;

    return {
      unitPrice: pricing.calculatedB2CPrice,
      lineTotal: pricing.calculatedB2CPrice * quantity,
      // 🔴 NEVER expose: costBreakdown, trueCost, margins
    };
  },
});

/**
 * Get prices for multiple products in a single query (batch)
 * Used by CartDrawer to refresh prices without N subscriptions.
 */
export const getBatchPrices = query({
  args: {
    productIds: v.array(v.string()),
  },
  handler: async (ctx, { productIds }) => {
    const results: Record<string, number | null> = {};

    for (const pid of productIds) {
      try {
        const pricing = await ctx.db
          .query("productPricing")
          .withIndex("by_productId", (q) => q.eq("productId", pid as Id<"products">))
          .first();
        results[pid] = pricing?.calculatedB2CPrice ?? null;
      } catch {
        results[pid] = null;
      }
    }

    return results;
  },
});

/**
 * Get product pricing for ADMIN view (includes full cost breakdown)
 */
export const getProductPricingAdmin = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await requireAdmin(ctx);
    const pricing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .first();
    return pricing;
  },
});

/**
 * Get all product prices (admin view)
 */
export const getAllProductPricingAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const allPricing = await ctx.db.query("productPricing").collect();
    return allPricing;
  },
});

// ─────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────

/**
 * Save or update global pricing defaults
 * Admin only — recalculates all product prices
 */
export const savePricingDefaults = mutation({
  args: {
    materialCostPerKg: v.number(),
    electricityCostPerHour: v.number(),
    machineDepreciationPerHour: v.number(),
    consumablesPercent: v.number(),
    labourCostPerHour: v.number(),
    defaultPackagingCost: v.number(),
    overheadsCost: v.number(),
    riskBufferPercent: v.number(),
    b2cMarginPercent: v.number(),
    b2bMarginSlabs: v.array(
      v.object({
        minQty: v.number(),
        maxQty: v.number(),
        marginPercent: v.number(),
      })
    ),
    gstPercent: v.number(),
    codAdvancePercent: v.number(),
    customPrintExtraCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db.query("pricingDefaults").first();

    const data = {
      ...args,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("pricingDefaults", data);
    }
  },
});

/**
 * Save per-product pricing parameters
 * Calculates and stores B2C/B2B prices
 */
export const saveProductPricing = mutation({
  args: {
    productId: v.id("products"),
    materialWeightGrams: v.number(),
    printTimeMinutes: v.number(),
    labourTimeMinutes: v.number(),
    designCostOneTime: v.number(),
    designCostAmortizeQty: v.number(),
    packagingCost: v.optional(v.number()),
    customOverrides: v.optional(
      v.object({
        materialCostPerKg: v.optional(v.number()),
        consumablesPercent: v.optional(v.number()),
        overheadsCost: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get global defaults
    const defaults = await ctx.db.query("pricingDefaults").first();
    if (!defaults) {
      throw new Error(
        "Pricing defaults not set. Please save global defaults first."
      );
    }

    // Calculate cost breakdown using the formula
    const costBreakdown = calculateCostBreakdown(defaults, args);

    // Calculate B2B prices for each volume slab
    const trueCostRupees = costBreakdown.trueCost / 100; // Convert back from paise
    const calculatedB2BPrices = defaults.b2bMarginSlabs.map((slab) => ({
      minQty: slab.minQty,
      maxQty: slab.maxQty,
      pricePerUnit: Math.round(
        trueCostRupees * (1 + slab.marginPercent / 100) * 100
      ), // Back to paise
    }));

    const pricingData = {
      productId: args.productId,
      materialWeightGrams: args.materialWeightGrams,
      printTimeMinutes: args.printTimeMinutes,
      labourTimeMinutes: args.labourTimeMinutes,
      designCostOneTime: args.designCostOneTime,
      designCostAmortizeQty: args.designCostAmortizeQty,
      packagingCost: args.packagingCost,
      customOverrides: args.customOverrides,
      calculatedB2CPrice: costBreakdown.sellingPrice,
      calculatedB2BPrices,
      costBreakdown,
      updatedAt: Date.now(),
    };

    // Check if pricing exists for this product
    const existing = await ctx.db
      .query("productPricing")
      .withIndex("by_productId", (q) =>
        q.eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, pricingData);
      return existing._id;
    } else {
      return await ctx.db.insert("productPricing", pricingData);
    }
  },
});

/**
 * Recalculate ALL product prices using current global defaults
 * Called when admin updates global defaults and wants all prices refreshed
 */
export const recalculateAllPrices = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const defaults = await ctx.db.query("pricingDefaults").first();
    if (!defaults) {
      throw new Error("Pricing defaults not set.");
    }

    const allPricing = await ctx.db.query("productPricing").collect();

    for (const pricing of allPricing) {
      const costBreakdown = calculateCostBreakdown(defaults, {
        materialWeightGrams: pricing.materialWeightGrams,
        printTimeMinutes: pricing.printTimeMinutes,
        labourTimeMinutes: pricing.labourTimeMinutes,
        designCostOneTime: pricing.designCostOneTime,
        designCostAmortizeQty: pricing.designCostAmortizeQty,
        packagingCost: pricing.packagingCost,
        customOverrides: pricing.customOverrides,
      });

      const trueCostRupees = costBreakdown.trueCost / 100;
      const calculatedB2BPrices = defaults.b2bMarginSlabs.map((slab) => ({
        minQty: slab.minQty,
        maxQty: slab.maxQty,
        pricePerUnit: Math.round(
          trueCostRupees * (1 + slab.marginPercent / 100) * 100
        ),
      }));

      await ctx.db.patch(pricing._id, {
        calculatedB2CPrice: costBreakdown.sellingPrice,
        calculatedB2BPrices,
        costBreakdown,
        updatedAt: Date.now(),
      });
    }

    return { recalculated: allPricing.length };
  },
});

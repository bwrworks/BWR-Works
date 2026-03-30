import { mutation } from "./_generated/server";

// ═══════════════════════════════════════════════════
// BWR WORKS — Seed Data
// Populates the database with real products and
// realistic pricing parameters from BWR strategy doc
// Run once via Convex dashboard or admin panel
// ═══════════════════════════════════════════════════

/**
 * Seed pricing defaults with realistic values
 * Based on BWR B2B pricing strategy document
 */
export const seedPricingDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("pricingDefaults").first();
    if (existing) return { message: "Already seeded", id: existing._id };

    const id = await ctx.db.insert("pricingDefaults", {
      // ── MATERIAL ──
      materialCostPerKg: 1200, // ₹1,200/kg PLA (Bambu Lab PLA)

      // ── ELECTRICITY ──
      electricityCostPerHour: 8, // ₹8/hr (avg India electricity rate)

      // ── MACHINE ──
      machineDepreciationPerHour: 15, // Bambu Lab P1S (~₹35,000, spread over 2500 hrs)

      // ── CONSUMABLES ──
      consumablesPercent: 12, // 12% of material (nozzles, bed adhesive, PTFE)

      // ── LABOUR ──
      labourCostPerHour: 200, // ₹200/hr (post-processing, QC, packaging)

      // ── PACKAGING ──
      defaultPackagingCost: 25, // ₹25/unit (matte black box, foam, card)

      // ── OVERHEADS ──
      overheadsCost: 15, // ₹15/unit (rent, internet, admin allocation)

      // ── RISK BUFFER ──
      riskBufferPercent: 15, // 15% buffer for failed prints, rework

      // ── B2C MARGIN ──
      b2cMarginPercent: 60, // 60% margin for B2C retail

      // ── B2B VOLUME SLABS ──
      b2bMarginSlabs: [
        { minQty: 1, maxQty: 20, marginPercent: 50 },     // Prototype/testing
        { minQty: 21, maxQty: 100, marginPercent: 37 },    // Standard order
        { minQty: 101, maxQty: 500, marginPercent: 27 },   // Long-term supply
        { minQty: 501, maxQty: 99999, marginPercent: 20 }, // Retainer
      ],

      // ── GST ──
      gstPercent: 18,

      updatedAt: Date.now(),
      updatedBy: "system-seed",
    });

    return { message: "Pricing defaults seeded", id };
  },
});

/**
 * Seed the 3 real BWR products with customisation configs
 * Prices are calculated by the pricing engine — NOT hardcoded
 */
export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingProducts = await ctx.db.query("products").collect();
    if (existingProducts.length > 0) {
      return { message: "Products already exist", count: existingProducts.length };
    }

    // ── PRODUCT 1: Customised Keychains ──
    const keychainId = await ctx.db.insert("products", {
      slug: "customised-keychains",
      name: "Customised Keychains",
      category: "keychain",
      description:
        "Your vehicle number plate, recreated in premium matte PLA. Every keychain is custom-designed from scratch — no templates. Printed at 0.12mm resolution on a Bambu Lab P1S for detail you can feel.",
      shortTagline: "Your plate · Your name · Your pocket",
      emotionalAngle:
        "Every time you pick up your keys, you see YOUR plate. It's not just a keychain — it's identity you carry.",
      images: [], // TODO: Add Cloudinary URLs
      isActive: true,
      stock: 50,
      customisationConfig: [
        {
          fieldId: "vehicle_type",
          label: "Vehicle Type",
          type: "select" as const,
          required: true,
          options: ["Bike", "Car"],
        },
        {
          fieldId: "number_plate_text",
          label: "Number Plate Text",
          type: "text" as const,
          required: true,
          maxLength: 12,
        },
        {
          fieldId: "color",
          label: "Color",
          type: "select" as const,
          required: true,
          options: ["Matte Black", "Matte White", "Yellow"],
        },
        {
          fieldId: "font",
          label: "Font Style",
          type: "select" as const,
          required: true,
          options: ["Standard", "Bold", "Retro"],
        },
        {
          fieldId: "quantity",
          label: "Quantity",
          type: "quantity" as const,
          required: true,
          minQty: 1,
          maxQty: 10,
        },
        {
          fieldId: "lanyard",
          label: "Add Lanyard Attachment",
          type: "toggle" as const,
          required: false,
          priceModifier: 4900, // ₹49 in paise
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ── PRODUCT 2: Car Garage Key Holder with LED ──
    const keyHolderId = await ctx.db.insert("products", {
      slug: "car-garage-key-holder",
      name: "Car Garage Key Holder with LED",
      category: "keyholder",
      description:
        "A wall-mounted key holder shaped like your car's garage silhouette. Features LED accent lighting that activates when you remove/replace keys. 3D-designed specifically for your car model.",
      shortTagline: "LED accent · Wall mount · Your car silhouette",
      emotionalAngle:
        "Your garage, your car, your moment. Every time you grab the keys, the LED lights up — like your car is calling you.",
      images: [],
      isActive: true,
      stock: 30,
      customisationConfig: [
        {
          fieldId: "car_model",
          label: "Car Model",
          type: "select" as const,
          required: true,
          options: [
            "Maruti Swift",
            "Hyundai Creta",
            "Tata Nexon",
            "Mahindra Thar",
            "Hyundai i20",
            "Toyota Fortuner",
            "Kia Seltos",
            "MG Hector",
            "Custom / Other",
          ],
        },
        {
          fieldId: "name_engraving",
          label: "Name Engraving",
          type: "text" as const,
          required: false,
          maxLength: 20,
        },
        {
          fieldId: "color",
          label: "Color",
          type: "select" as const,
          required: true,
          options: ["Matte Black", "Matte White", "Carbon"],
        },
        {
          fieldId: "led_color",
          label: "LED Color",
          type: "select" as const,
          required: true,
          options: ["Warm White", "Cool White", "Amber"],
        },
        {
          fieldId: "quantity",
          label: "Quantity",
          type: "quantity" as const,
          required: true,
          minQty: 1,
          maxQty: 5,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ── PRODUCT 3: Customizable Photo Frames ──
    const photoFrameId = await ctx.db.insert("products", {
      slug: "customizable-photo-frames",
      name: "Customizable Photo Frames",
      category: "photoframe",
      description:
        "A 3D-designed photo frame with custom text for any occasion — birthdays, weddings, anniversaries, newborns. Choose your border style, add up to 3 lines of text, and optionally upload a reference photo.",
      shortTagline: "Every occasion · Every memory · Your story",
      emotionalAngle:
        "Some moments deserve more than a flat, mass-produced frame. This is how memories should be held — with intention.",
      images: [],
      isActive: true,
      stock: 40,
      customisationConfig: [
        {
          fieldId: "occasion",
          label: "Occasion",
          type: "select" as const,
          required: true,
          options: [
            "Birthday",
            "Wedding",
            "Anniversary",
            "Newborn",
            "Graduation",
            "Custom",
          ],
        },
        {
          fieldId: "frame_size",
          label: "Frame Size",
          type: "select" as const,
          required: true,
          options: ["4x6", "5x7", "6x8"],
        },
        {
          fieldId: "text_line_1",
          label: "Text Line 1 (Name / Title)",
          type: "text" as const,
          required: true,
          maxLength: 25,
        },
        {
          fieldId: "text_line_2",
          label: "Text Line 2 (Date / Subtitle)",
          type: "text" as const,
          required: false,
          maxLength: 30,
        },
        {
          fieldId: "text_line_3",
          label: "Text Line 3 (Message)",
          type: "text" as const,
          required: false,
          maxLength: 40,
        },
        {
          fieldId: "color",
          label: "Color",
          type: "select" as const,
          required: true,
          options: ["Matte Black", "Matte White", "Natural Wood", "Gold Accent"],
        },
        {
          fieldId: "border_style",
          label: "Border Style",
          type: "select" as const,
          required: true,
          options: ["Minimal", "Ornate", "Modern Geometric"],
        },
        {
          fieldId: "photo_upload",
          label: "Upload Reference Photo",
          type: "file" as const,
          required: false,
          fileConfig: {
            maxSizeMB: 5,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          },
        },
        {
          fieldId: "quantity",
          label: "Quantity",
          type: "quantity" as const,
          required: true,
          minQty: 1,
          maxQty: 10,
        },
        {
          fieldId: "gift_wrap",
          label: "Add Gift Wrap",
          type: "toggle" as const,
          required: false,
          priceModifier: 4900, // ₹49 in paise
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      message: "3 products seeded",
      ids: { keychainId, keyHolderId, photoFrameId },
    };
  },
});

/**
 * Seed product pricing with realistic cost parameters
 * Must be run AFTER seedProducts and seedPricingDefaults
 */
export const seedProductPricing = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    if (products.length === 0) {
      throw new Error("Run seedProducts first");
    }

    const defaults = await ctx.db.query("pricingDefaults").first();
    if (!defaults) {
      throw new Error("Run seedPricingDefaults first");
    }

    const existingPricing = await ctx.db.query("productPricing").collect();
    if (existingPricing.length > 0) {
      return { message: "Product pricing already exists" };
    }

    // Helper to calculate and insert pricing
    const seedPricing = async (
      slug: string,
      params: {
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
    ) => {
      const product = products.find((p) => p.slug === slug);
      if (!product) throw new Error(`Product ${slug} not found`);

      // Calculate using the same formula as the pricing engine
      const materialRate = params.customOverrides?.materialCostPerKg ?? defaults.materialCostPerKg;
      const consumablesRate = params.customOverrides?.consumablesPercent ?? defaults.consumablesPercent;
      const overheadsRate = params.customOverrides?.overheadsCost ?? defaults.overheadsCost;

      const material = (params.materialWeightGrams / 1000) * materialRate;
      const electricity = (params.printTimeMinutes / 60) * defaults.electricityCostPerHour;
      const machine = (params.printTimeMinutes / 60) * defaults.machineDepreciationPerHour;
      const consumables = material * (consumablesRate / 100);
      const design = params.designCostAmortizeQty > 0 ? params.designCostOneTime / params.designCostAmortizeQty : 0;
      const labour = (params.labourTimeMinutes / 60) * defaults.labourCostPerHour;
      const packaging = params.packagingCost ?? defaults.defaultPackagingCost;
      const overheads = overheadsRate;

      const subtotalCost = material + electricity + machine + consumables + design + labour + packaging + overheads;
      const riskBuffer = subtotalCost * (defaults.riskBufferPercent / 100);
      const trueCost = subtotalCost + riskBuffer;
      const margin = trueCost * (defaults.b2cMarginPercent / 100);
      const sellingPrice = trueCost + margin;

      const costBreakdown = {
        material: Math.round(material * 100),
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

      const calculatedB2BPrices = defaults.b2bMarginSlabs.map((slab) => ({
        minQty: slab.minQty,
        maxQty: slab.maxQty,
        pricePerUnit: Math.round(trueCost * (1 + slab.marginPercent / 100) * 100),
      }));

      await ctx.db.insert("productPricing", {
        productId: product._id,
        ...params,
        calculatedB2CPrice: costBreakdown.sellingPrice,
        calculatedB2BPrices,
        costBreakdown,
        updatedAt: Date.now(),
      });
    };

    // ── KEYCHAIN: ~20g, ~25 min print, ~5 min labour ──
    await seedPricing("customised-keychains", {
      materialWeightGrams: 20,
      printTimeMinutes: 25,
      labourTimeMinutes: 5,
      designCostOneTime: 500, // ₹500 one-time design
      designCostAmortizeQty: 100, // Amortize over 100 units
      packagingCost: 15, // Smaller packaging
    });

    // ── KEY HOLDER: ~80g, ~120 min print, ~15 min labour ──
    await seedPricing("car-garage-key-holder", {
      materialWeightGrams: 80,
      printTimeMinutes: 120,
      labourTimeMinutes: 15,
      designCostOneTime: 2000, // Complex 3D design ₹2000
      designCostAmortizeQty: 50, // Amortize over 50
      packagingCost: 45, // Bigger box + foam
      customOverrides: {
        overheadsCost: 25, // LED component adds to overheads
      },
    });

    // ── PHOTO FRAME: ~50g, ~60 min print, ~10 min labour ──
    await seedPricing("customizable-photo-frames", {
      materialWeightGrams: 50,
      printTimeMinutes: 60,
      labourTimeMinutes: 10,
      designCostOneTime: 1000, // ₹1000 one-time design
      designCostAmortizeQty: 80, // Amortize over 80
      packagingCost: 35, // Gift-quality packaging
    });

    return { message: "Product pricing seeded for all 3 products" };
  },
});

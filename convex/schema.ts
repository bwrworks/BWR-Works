import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════
// BWR WORKS — Complete Database Schema
// Source of truth for ALL data
// ═══════════════════════════════════════════════════

export default defineSchema({
  ...authTables,

  // ─────────────────────────────────────────────────
  // RATE LIMITS (Auth)
  // ─────────────────────────────────────────────────
  rateLimits: defineTable({
    identifier: v.string(), // e.g. email or ip
    attempts: v.number(),
    lastAttempt: v.number(),
  }).index("identifier", ["identifier"]),

  // ─────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom Fields
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"))),
    createdAt: v.optional(v.number()),
  }).index("email", ["email"]),

  // ─────────────────────────────────────────────────
  // ADDRESSES
  // ─────────────────────────────────────────────────
  addresses: defineTable({
    userId: v.string(),
    name: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    phone: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ─────────────────────────────────────────────────
  // PRODUCTS — Dynamic customisation via config
  // ─────────────────────────────────────────────────
  products: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    shortTagline: v.string(),
    emotionalAngle: v.string(),
    // ❌ NO hardcoded basePrice — comes from productPricing
    images: v.array(v.string()),
    isActive: v.boolean(),
    stock: v.number(),
    // 🔴 DYNAMIC CUSTOMISATION
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
        priceModifier: v.optional(v.number()), // paise
        fileConfig: v.optional(
          v.object({
            maxSizeMB: v.number(),
            allowedTypes: v.array(v.string()),
          })
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["isActive"],
    }),

  // ─────────────────────────────────────────────────
  // PRICING DEFAULTS — Global cost parameters
  // Singleton table (only one row)
  // ─────────────────────────────────────────────────
  pricingDefaults: defineTable({
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
    updatedAt: v.number(),
    updatedBy: v.string(),
  }),

  // ─────────────────────────────────────────────────
  // PRODUCT PRICING — Per-product cost parameters
  // ─────────────────────────────────────────────────
  productPricing: defineTable({
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
    // Calculated fields — auto-updated by pricing engine
    calculatedB2CPrice: v.number(),
    calculatedB2BPrices: v.array(
      v.object({
        minQty: v.number(),
        maxQty: v.number(),
        pricePerUnit: v.number(),
      })
    ),
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
    updatedAt: v.number(),
  }).index("by_productId", ["productId"]),

  // ─────────────────────────────────────────────────
  // ORDERS — Full item snapshots
  // ─────────────────────────────────────────────────
  orders: defineTable({
    orderId: v.string(), // "BWR-0001" format
    userId: v.string(),
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
    status: v.union(
      v.literal("received"),
      v.literal("printing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed")
    ),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.optional(v.string()),
    addressSnapshot: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
      phone: v.string(),
    }),
    trackingNumber: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_razorpayOrderId", ["razorpayOrderId"]),

  // ─────────────────────────────────────────────────
  // PAYMENTS — Full audit trail
  // ─────────────────────────────────────────────────
  payments: defineTable({
    orderId: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    signature: v.string(),
    amount: v.number(),
    currency: v.literal("INR"),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed")
    ),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_razorpayOrderId", ["razorpayOrderId"])
    .index("by_razorpayPaymentId", ["razorpayPaymentId"]),

  // ─────────────────────────────────────────────────
  // CMS CONTENT — Admin-editable text
  // ─────────────────────────────────────────────────
  cmsContent: defineTable({
    section: v.string(),
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_section_key", ["section", "key"]),

  // ─────────────────────────────────────────────────
  // CONTACT INQUIRIES — Customer support & B2B
  // ─────────────────────────────────────────────────
  inquiries: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.union(v.literal("support"), v.literal("bulk_order"), v.literal("general")),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("replied"), v.literal("closed")),
    threadId: v.optional(v.string()),    // "BWR-Q-xxxxxxxx" used in email subjects
    adminReply: v.optional(v.string()),
    repliedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_threadId", ["threadId"]),

  // ─────────────────────────────────────────────────
  // COUPONS
  // ─────────────────────────────────────────────────
  coupons: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("flat"), v.literal("percent")),
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    currentUses: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // ─────────────────────────────────────────────────
  // COUPON USES — Track per-user usage
  // ─────────────────────────────────────────────────
  couponUses: defineTable({
    couponId: v.id("coupons"),
    userId: v.string(),
    orderId: v.string(),
    usedAt: v.number(),
  })
    .index("by_couponId_userId", ["couponId", "userId"]),

  // ─────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────
  notifications: defineTable({
    userId: v.string(),
    orderId: v.optional(v.string()),
    type: v.string(), // "order_confirmed" | "status_update" | "shipped"
    channel: v.string(), // "email" | "whatsapp"
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ─────────────────────────────────────────────────
  // ADMIN LOGS — Audit trail for admin actions
  // ─────────────────────────────────────────────────
  adminLogs: defineTable({
    adminUserId: v.string(),
    action: v.string(),
    targetType: v.string(), // "order" | "product" | "pricing" | "coupon"
    targetId: v.string(),
    details: v.any(), // before/after values
    createdAt: v.number(),
  }).index("by_adminUserId", ["adminUserId"]),

  // ─────────────────────────────────────────────────
  // REVIEWS — Product reviews from verified users
  // ─────────────────────────────────────────────────
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.string(),
    userName: v.string(),
    rating: v.number(),       // 1–5 integer
    reviewText: v.string(),   // 1–500 chars
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_userId_productId", ["userId", "productId"]),

  // ─────────────────────────────────────────────────
  // MESSAGES — Full two-way email thread per inquiry
  // ─────────────────────────────────────────────────
  messages: defineTable({
    inquiryId: v.id("inquiries"),
    sender: v.union(v.literal("user"), v.literal("admin")),
    content: v.string(),
    timestamp: v.number(),
    resendEmailId: v.optional(v.string()), // dedup incoming webhooks
  }).index("by_inquiryId", ["inquiryId"]),
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyAddresses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addAddress = mutation({
  args: {
    name: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    phone: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // If making default, unset other defaults
    if (args.isDefault) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
        
      for (const addr of existing) {
        if (addr.isDefault) {
          await ctx.db.patch(addr._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("addresses", {
      userId,
      name: args.name,
      line1: args.line1,
      line2: args.line2,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      phone: args.phone,
      isDefault: args.isDefault,
      createdAt: Date.now(),
    });
  },
});

export const deleteAddress = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const address = await ctx.db.get(args.id);
    if (!address || address.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.delete(args.id);
  }
});

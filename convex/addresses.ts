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

    // ─── Input Validation ───
    const name = args.name.trim().slice(0, 100);
    const line1 = args.line1.trim().slice(0, 200);
    const line2 = args.line2?.trim().slice(0, 200) || undefined;
    const city = args.city.trim().slice(0, 100);
    const state = args.state.trim().slice(0, 100);
    const pincode = args.pincode.trim();
    const phone = args.phone.trim();

    if (!name || name.length < 2) throw new Error("Name is required.");
    if (!line1 || line1.length < 5) throw new Error("Address line 1 is required.");
    if (!city) throw new Error("City is required.");
    if (!state) throw new Error("State is required.");
    if (!/^\d{6}$/.test(pincode)) throw new Error("Pincode must be exactly 6 digits.");
    if (!/^[\d\s\-+()]{10,15}$/.test(phone)) throw new Error("Please enter a valid phone number (10-15 digits).");

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
      name,
      line1,
      line2,
      city,
      state,
      pincode,
      phone,
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

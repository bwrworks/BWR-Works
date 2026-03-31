import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Limit to 5 attempts per rolling hour
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

export const checkAndRecord = internalMutation({
  args: { identifier: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.identifier) return true; // Can't limit what we don't know
    
    // Auth uses stringified objects sometimes, let's normalize
    const key = String(args.identifier).toLowerCase();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("identifier", (q) => q.eq("identifier", key))
      .first();

    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("rateLimits", {
        identifier: key,
        attempts: 1,
        lastAttempt: now,
      });
      return true;
    }

    if (now - existing.lastAttempt > WINDOW_MS) {
      // Reset after window expires
      await ctx.db.patch(existing._id, {
        attempts: 1,
        lastAttempt: now,
      });
      return true;
    }

    if (existing.attempts >= MAX_ATTEMPTS) {
      return false; // RATE LIMITED
    }

    // Increment attempts
    await ctx.db.patch(existing._id, {
      attempts: existing.attempts + 1,
      lastAttempt: now,
    });

    return true;
  },
});

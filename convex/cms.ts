import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — CMS Content Management
// Admin-editable site text stored in DB
// ═══════════════════════════════════════════════════

/** Get all content entries (public — frontend reads these) */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cmsContent").collect();
  },
});

/** Get a single content value by section + key */
export const get = query({
  args: { section: v.string(), key: v.string() },
  handler: async (ctx, { section, key }) => {
    return await ctx.db
      .query("cmsContent")
      .withIndex("by_section_key", (q) => q.eq("section", section).eq("key", key))
      .first();
  },
});

/** Get all content for a specific section */
export const getSection = query({
  args: { section: v.string() },
  handler: async (ctx, { section }) => {
    const all = await ctx.db.query("cmsContent").collect();
    return all.filter((c) => c.section === section);
  },
});

/** Set (create or update) a content entry — admin only */
export const set = mutation({
  args: {
    section: v.string(),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, { section, key, value }) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("cmsContent")
      .withIndex("by_section_key", (q) => q.eq("section", section).eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
      return existing._id;
    }

    return await ctx.db.insert("cmsContent", {
      section,
      key,
      value,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });
  },
});

/** Delete a content entry — admin only */
export const remove = mutation({
  args: { section: v.string(), key: v.string() },
  handler: async (ctx, { section, key }) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("cmsContent")
      .withIndex("by_section_key", (q) => q.eq("section", section).eq("key", key))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

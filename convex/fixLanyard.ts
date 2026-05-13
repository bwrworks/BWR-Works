import { mutation } from "./_generated/server";

export const removeLanyardPrice = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    for (const p of products) {
      if (!p.customisationConfig) continue;
      let changed = false;
      const newConfig = p.customisationConfig.map(f => {
        if (f.label.toLowerCase().includes('lanyard') && f.priceModifier) {
          changed = true;
          const { priceModifier, ...rest } = f;
          return { ...rest, priceModifier: 0 };
        }
        return f;
      });
      if (changed) {
        await ctx.db.patch(p._id, { customisationConfig: newConfig });
      }
    }
  }
});

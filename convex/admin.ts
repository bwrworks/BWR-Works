import { mutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ADMIN_EMAIL = "bwrworks.in@gmail.com";

// Verify user is an admin securely on the backend
export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User missing");
  }

  if (user.role !== "admin") {
    throw new Error("Access Denied: Requires Administrator Privileges.");
  }

  return user;
}

// Same logic exposed as an internal query for Actions (which lack ctx.db)
export const checkIsAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await requireAdmin(ctx);
  }
});

// Check and upgrade the master admin email account automatically
export const ensureAdminRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    
    const user = await ctx.db.get(userId);
    if (!user || user.email !== ADMIN_EMAIL) return false;
    
    if (user.role !== "admin") {
      await ctx.db.patch(userId, { role: "admin" });
    }
    
    return true;
  }
});

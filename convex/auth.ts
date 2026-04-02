import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./auth/ResendOTP";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Google from "@auth/core/providers/google";

const authBundle = convexAuth({
  providers: [
    ResendOTP,
    Google,   // Auto-reads AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET from Convex env vars
  ],
  session: {
    totalDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 Day Session Expiry
  }
});

export const auth = authBundle.auth;
export const signOut = authBundle.signOut;
export const store = authBundle.store;
export const isAuthenticated = authBundle.isAuthenticated;

// Wrap signIn Action for Rate Limiting!
export const signIn = action({
  // @ts-ignore - The args perfectly align but TS might complain about complex generic unpacking
  args: authBundle.signIn.args,
  handler: async (ctx, args) => {
    // 1. Get the email or identifier being submitted
    let identifierToLimit = "unknown";
    if (args.params && typeof args.params === 'object' && 'email' in args.params) {
      identifierToLimit = String(args.params.email);
    }
    
    // 2. Check internal DB rate limits
    if (identifierToLimit !== "unknown") {
      const canProceed = await ctx.runMutation(internal.rateLimits.checkAndRecord, { 
        identifier: identifierToLimit 
      });
      
      if (!canProceed) {
        throw new Error("Too many authentication attempts. Please try again later.");
      }
    }

    // 3. Proceed to default auth pipeline
    // @ts-expect-error - Convex internal RegisteredAction doesn't explicitly type .handler
    return authBundle.signIn.handler(ctx, args);
  }
});

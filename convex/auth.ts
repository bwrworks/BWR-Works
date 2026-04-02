import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./auth/ResendOTP";
import Google from "@auth/core/providers/google";

// ═══════════════════════════════════════════════════
// BWR WORKS — Auth Configuration
//
// Google credentials: AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET (Convex env vars)
// OTP email: RESEND_API_KEY (Convex env var)
// ═══════════════════════════════════════════════════

export const {
  auth,
  signIn,
  signOut,
  store,
  isAuthenticated,
} = convexAuth({
  providers: [
    ResendOTP,
    Google,  // Auto-reads AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
  ],
  session: {
    totalDurationMs: 30 * 24 * 60 * 60 * 1000, // 30-day session
  },
});

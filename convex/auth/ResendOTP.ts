import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes
  
  // 1. Generate an 8-character alphanumeric code for OTP
  async generateVerificationToken() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // 2. Send the code via Resend
  async sendVerificationRequest({ identifier: email, provider, token }) {
    if (!provider.apiKey) {
      console.warn("AUTH_RESEND_KEY missing. Simulating sending OTP:", token, "to", email);
      return;
    }
    const resend = new ResendAPI(provider.apiKey);
    
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL_FROM ?? "BWR Works <onboarding@resend.dev>",
      to: [email],
      subject: `Your sign-in code for BWR Works`,
      text: `Your distinct access code is: ${token}\n\nDo not share this code with anyone.`,
      html: `
        <div style="font-family: monospace; padding: 20px; background: #111; color: #f5f0e8; text-align: center;">
          <h2 style="color: #C9963A; text-transform: uppercase;">BWR Works Authentication</h2>
          <p>Your one-time access code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">${token}</div>
          <p style="color: #888070; font-size: 12px;">If you didn't request this, please ignore.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error("Could not send verification email: " + JSON.stringify(error));
    }
  },
});

/// <reference types="node" />
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
      from: process.env.AUTH_EMAIL_FROM ?? "BWR Works <auth@bwrworks.com>",
      to: [email],
      subject: `Your sign-in code for BWR Works`,
      text: `Your distinct access code is: ${token}\n\nDo not share this code with anyone.`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#111111;border-radius:4px;overflow:hidden;border:1px solid #2a2a2a;">
            <div style="height:4px;background:linear-gradient(to right,#FF5C1A,#C9963A,#6B21FF);"></div>
            <div style="padding:40px 32px;text-align:center;">
              <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:900;letter-spacing:4px;margin-bottom:8px;">
                <span style="color:#FFFFFF;">B.W.</span><span style="color:#FF5C1A;">R</span>
                <span style="color:#FF5C1A;font-style:italic;font-weight:600;letter-spacing:1px;margin-left:4px;font-size:18px;">Works</span>
              </div>
              <div style="font-family:monospace;font-size:10px;letter-spacing:3px;color:#888070;text-transform:uppercase;margin-bottom:32px;">Authentication</div>
              <div style="width:40px;height:1px;background:#C9963A;margin:0 auto 28px;"></div>
              <p style="color:#F5F0E8;font-size:14px;margin:0 0 24px;line-height:1.6;">Your one-time access code is:</p>
              <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;padding:20px;margin:0 auto 28px;max-width:260px;">
                <div style="font-family:'Courier New',monospace;font-size:36px;font-weight:bold;letter-spacing:8px;color:#FFFFFF;text-align:center;">${token}</div>
              </div>
              <p style="color:#888070;font-size:12px;margin:0 0 8px;line-height:1.5;">This code expires in 20 minutes.</p>
              <p style="color:#555;font-size:11px;margin:0;line-height:1.5;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
              <p style="color:#555;font-size:10px;letter-spacing:1px;margin:0;">BWR Works &middot; Premium Functional Design &middot; Bengaluru, India</p>
            </div>
          </div>
        </body></html>`,
    });

    if (error) {
      throw new Error("Could not send verification email: " + JSON.stringify(error));
    }
  },
});

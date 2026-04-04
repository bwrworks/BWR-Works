"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// ═══════════════════════════════════════════════════
// BWR WORKS — Email Notifications via Resend
// ═══════════════════════════════════════════════════

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set in Convex env vars.");
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM_EMAIL || "orders@bwrworks.in";
const SITE_URL = process.env.SITE_URL || "https://bwr-works-gjkhdumae-bwrworks-projects.vercel.app";

/** Order confirmation email to customer */
export const sendOrderConfirmationEmail = action({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderId: v.string(),
    items: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    total: v.number(),
  },
  handler: async (_ctx, { customerEmail, customerName, orderId, items, total }) => {
    const resend = getResend();
    const totalRupees = (total / 100).toLocaleString("en-IN");

    const itemsHtml = items
      .map(i => `<tr>
        <td style="padding:8px 0; font-family: Arial; font-size:14px; color:#222;">${i.productName}</td>
        <td style="padding:8px 0; font-family: Arial; font-size:14px; color:#222; text-align:center;">${i.quantity}</td>
        <td style="padding:8px 0; font-family: Arial; font-size:14px; color:#222; text-align:right;">₹${((i.unitPrice * i.quantity) / 100).toLocaleString("en-IN")}</td>
      </tr>`)
      .join("");

    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Order Confirmed — ${orderId} | BWR Works`,
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0; padding:0; background:#F5F0E8; font-family:Arial,sans-serif;">
        <div style="max-width:560px; margin:40px auto; background:#fff; border:1px solid #E8E3DB;">
          <!-- Header -->
          <div style="background:#111; padding:28px 32px;">
            <div style="font-size:22px; font-weight:800; color:#fff; letter-spacing:2px;">
              BW<span style="color:#FF5C1A;">R</span> WORKS
            </div>
          </div>
          <!-- Body -->
          <div style="padding:32px;">
            <h1 style="font-size:24px; color:#111; margin:0 0 8px;">Order Confirmed ✅</h1>
            <p style="color:#888; font-size:14px; margin:0 0 24px;">Hi ${customerName}, your order is in our hands.</p>

            <div style="background:#F5F0E8; padding:16px; border-radius:4px; margin-bottom:24px;">
              <div style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Order ID</div>
              <div style="font-size:18px; font-weight:700; color:#111;">${orderId}</div>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
              <thead>
                <tr style="border-bottom:1px solid #E8E3DB;">
                  <th style="text-align:left; padding:8px 0; font-size:11px; letter-spacing:1px; color:#888; text-transform:uppercase;">Item</th>
                  <th style="text-align:center; padding:8px 0; font-size:11px; letter-spacing:1px; color:#888; text-transform:uppercase;">Qty</th>
                  <th style="text-align:right; padding:8px 0; font-size:11px; letter-spacing:1px; color:#888; text-transform:uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody style="border-bottom:1px solid #E8E3DB;">${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 0 0; font-size:14px; font-weight:700; color:#111;">TOTAL PAID</td>
                  <td style="padding:12px 0 0; font-size:20px; font-weight:700; color:#FF5C1A; text-align:right;">₹${totalRupees}</td>
                </tr>
              </tfoot>
            </table>

            <p style="color:#888; font-size:13px; line-height:1.7;">
              Your custom piece will be ready in <strong>5–7 working days</strong>. 
              We'll send you a WhatsApp update at every stage.
            </p>

            <a href="${SITE_URL}/dashboard" 
               style="display:inline-block; margin-top:20px; background:#FF5C1A; color:#fff; text-decoration:none; padding:14px 28px; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
              TRACK YOUR ORDER →
            </a>
          </div>
          <!-- Footer -->
          <div style="padding:20px 32px; border-top:1px solid #E8E3DB; text-align:center;">
            <p style="color:#aaa; font-size:11px; margin:0;">BWR Works · Made in Bengaluru · Never mass-made.</p>
            <p style="color:#aaa; font-size:11px; margin:4px 0 0;">
              Questions? WhatsApp us: <a href="https://wa.me/917019427272" style="color:#FF5C1A;">+91 70194 27272</a>
            </p>
          </div>
        </div>
        </body></html>
      `,
    });

    return { sent: true };
  },
});

/** Order status update email */
export const sendStatusUpdateEmail = action({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderId: v.string(),
    newStatus: v.string(),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (_ctx, { customerEmail, customerName, orderId, newStatus, trackingNumber }) => {
    const resend = getResend();

    const statusMessages: Record<string, string> = {
      printing: "Great news! Your order is now being printed. Our team is crafting your custom piece right now.",
      shipped: `Your order has been shipped! ${trackingNumber ? `Tracking number: <strong>${trackingNumber}</strong>` : ""}`,
      delivered: "Your order has been delivered! We hope you love it. 🎉",
    };

    const message = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;

    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Order ${orderId} — Status Update | BWR Works`,
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0; padding:0; background:#F5F0E8; font-family:Arial,sans-serif;">
        <div style="max-width:560px; margin:40px auto; background:#fff; border:1px solid #E8E3DB;">
          <div style="background:#111; padding:28px 32px;">
            <div style="font-size:22px; font-weight:800; color:#fff; letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:22px; color:#111; margin:0 0 16px;">Order Update — ${orderId}</h1>
            <p style="color:#444; font-size:14px; line-height:1.7;">Hi ${customerName}, ${message}</p>
            <a href="${SITE_URL}/order/${orderId}" 
               style="display:inline-block; margin-top:20px; background:#FF5C1A; color:#fff; text-decoration:none; padding:14px 28px; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
              VIEW ORDER STATUS →
            </a>
          </div>
          <div style="padding:20px 32px; border-top:1px solid #E8E3DB; text-align:center;">
            <p style="color:#aaa; font-size:11px; margin:0;">BWR Works · Made in Bengaluru · Never mass-made.</p>
          </div>
        </div>
        </body></html>
      `,
    });
    return { sent: true };
  },
});

/** Contact form: notify admin + send auto-reply to customer */
export const sendContactFormEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, { name, email, phone, subject, message }) => {
    const resend = getResend();
    const adminEmail = process.env.ADMIN_EMAIL || "bwrworks.in@gmail.com";

    const subjectLabels: Record<string, string> = {
      support: "Support Request",
      bulk_order: "Bulk Order Enquiry",
      general: "General Enquiry",
    };
    const subjectLabel = subjectLabels[subject] || subject;

    // 1. Notify admin
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `New ${subjectLabel} from ${name} | BWR Works`,
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0; padding:0; background:#F5F0E8; font-family:Arial,sans-serif;">
        <div style="max-width:560px; margin:40px auto; background:#fff; border:1px solid #E8E3DB;">
          <div style="background:#111; padding:24px 32px;">
            <div style="font-size:20px; font-weight:800; color:#fff; letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS — New Inquiry</div>
          </div>
          <div style="padding:28px 32px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr><td style="padding:6px 0; font-size:13px; color:#666; width:100px;">Name</td><td style="padding:6px 0; font-size:13px; color:#111; font-weight:600;">${name}</td></tr>
              <tr><td style="padding:6px 0; font-size:13px; color:#666;">Email</td><td style="padding:6px 0; font-size:13px; color:#111;">${email}</td></tr>
              ${phone ? `<tr><td style="padding:6px 0; font-size:13px; color:#666;">Phone</td><td style="padding:6px 0; font-size:13px; color:#111;">${phone}</td></tr>` : ''}
              <tr><td style="padding:6px 0; font-size:13px; color:#666;">Type</td><td style="padding:6px 0; font-size:13px; color:#FF5C1A; font-weight:600;">${subjectLabel}</td></tr>
            </table>
            <div style="background:#F9FAFB; padding:16px; border-left:3px solid #FF5C1A; font-size:14px; color:#333; line-height:1.7;">${message}</div>
            <a href="${SITE_URL}/admin/content" style="display:inline-block; margin-top:20px; background:#111; color:#fff; text-decoration:none; padding:12px 24px; font-size:12px; letter-spacing:1px; text-transform:uppercase;">
              View in Admin →
            </a>
          </div>
        </div>
        </body></html>
      `,
    });

    // 2. Auto-reply to customer
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `We got your message — BWR Works`,
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0; padding:0; background:#F5F0E8; font-family:Arial,sans-serif;">
        <div style="max-width:560px; margin:40px auto; background:#fff; border:1px solid #E8E3DB;">
          <div style="background:#111; padding:28px 32px;">
            <div style="font-size:22px; font-weight:800; color:#fff; letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:20px; color:#111; margin:0 0 16px;">Hi ${name}, we received your message!</h1>
            <p style="color:#444; font-size:14px; line-height:1.7;">
              Thank you for reaching out. We typically respond within 24 hours on business days.
            </p>
            <p style="color:#444; font-size:14px; line-height:1.7;">
              Your message: <em style="color:#666;">"${message.slice(0, 140)}${message.length > 140 ? '...' : ''}"</em>
            </p>
            <p style="color:#444; font-size:14px; line-height:1.7; margin-top:16px;">
              Need urgent help? WhatsApp us at <a href="https://wa.me/917019427272" style="color:#FF5C1A;">+91 70194 27272</a>
            </p>
          </div>
          <div style="padding:20px 32px; border-top:1px solid #E8E3DB; text-align:center;">
            <p style="color:#aaa; font-size:11px; margin:0;">BWR Works · Made in Bengaluru · Never mass-made.</p>
          </div>
        </div>
        </body></html>
      `,
    });

    return { sent: true };
  },
});

/** Admin replies to an inquiry — sends email from admin to customer */
export const sendAdminReplyEmail = action({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    originalMessage: v.string(),
    replyMessage: v.string(),
  },
  handler: async (_ctx, { customerEmail, customerName, originalMessage, replyMessage }) => {
    const resend = getResend();

    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Reply from BWR Works`,
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0; padding:0; background:#F5F0E8; font-family:Arial,sans-serif;">
        <div style="max-width:560px; margin:40px auto; background:#fff; border:1px solid #E8E3DB;">
          <div style="background:#111; padding:28px 32px;">
            <div style="font-size:22px; font-weight:800; color:#fff; letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:20px; color:#111; margin:0 0 16px;">Hi ${customerName},</h1>
            <div style="font-size:14px; color:#333; line-height:1.7; white-space:pre-wrap;">${replyMessage}</div>
            <hr style="border:none; border-top:1px solid #E8E3DB; margin:24px 0;" />
            <p style="font-size:11px; color:#999; font-style:italic;">Your original message: "${originalMessage.slice(0, 200)}${originalMessage.length > 200 ? '...' : ''}"</p>
          </div>
          <div style="padding:16px 32px; border-top:1px solid #E8E3DB; background:#F9FAFB;">
            <p style="color:#888; font-size:11px; margin:0;">
              BWR — Black &amp; White Rogue Works · <a href="https://wa.me/917019427272" style="color:#FF5C1A;">WhatsApp</a>
            </p>
          </div>
        </div>
        </body></html>
      `,
    });

    return { sent: true };
  },
});

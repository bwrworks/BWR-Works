// notifications.ts

"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ═══════════════════════════════════════════════════
// BWR WORKS — Email Notifications via Resend
// ═══════════════════════════════════════════════════

function getResend() {
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) throw new Error("AUTH_RESEND_KEY not set in Convex env vars.");
  return new Resend(apiKey);
}

// ─── EMAIL FROM ADDRESSES ───
// Each alias must exist in Hostinger (bwrworks.com) AND the domain must be verified in Resend
// Aliases: support@, orders@, auth@, contact@
const FROM_SUPPORT = "BWR Works Support <support@bwrworks.com>";
const FROM_ORDERS = "BWR Works <orders@bwrworks.com>";
const REPLY_TO_SUPPORT = "support@bwrworks.com";
const REPLY_TO_ORDERS = "orders@bwrworks.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "bwrworks.in@gmail.com";
const SITE_URL = process.env.SITE_URL || "https://bwrworks.com";

/** Escape HTML special chars to prevent injection in email templates */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────
// ORDER EMAILS
// ─────────────────────────────────────────────────

/** Generate a simple PDF invoice using pdf-lib */
async function generateInvoicePdf(orderId: string, customerName: string, items: any[], totalRupees: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = height - 50;
  
  page.drawText('BWR WORKS - TAX INVOICE', { x: 50, y, size: 20, font: boldFont, color: rgb(0, 0, 0) });
  y -= 30;
  
  page.drawText(`Order ID: ${orderId}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Customer: ${customerName}`, { x: 50, y, size: 12, font });
  y -= 40;
  
  page.drawText('Items:', { x: 50, y, size: 14, font: boldFont });
  y -= 20;
  
  for (const item of items) {
    const itemTotal = `Rs. ${((item.unitPrice * item.quantity) / 100).toLocaleString("en-IN")}`;
    page.drawText(`${item.quantity}x ${item.productName}`, { x: 50, y, size: 11, font });
    page.drawText(itemTotal, { x: width - 150, y, size: 11, font });
    y -= 20;
  }
  
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 20;
  
  page.drawText('GRAND TOTAL:', { x: 50, y, size: 14, font: boldFont });
  page.drawText(`Rs. ${totalRupees}`, { x: width - 150, y, size: 14, font: boldFont });
  
  return await pdfDoc.saveAsBase64();
}

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

    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:8px 0;font-family:Arial;font-size:14px;color:#222;">${esc(i.productName)}</td>
        <td style="padding:8px 0;font-family:Arial;font-size:14px;color:#222;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 0;font-family:Arial;font-size:14px;color:#222;text-align:right;">₹${((i.unitPrice * i.quantity) / 100).toLocaleString("en-IN")}</td>
      </tr>`
    ).join("");

    const pdfBase64 = await generateInvoicePdf(orderId, customerName, items, totalRupees);

    const { error } = await resend.emails.send({
      from: FROM_ORDERS,
      replyTo: REPLY_TO_ORDERS,
      to: customerEmail,
      subject: `Order Confirmed — ${orderId}`,
      attachments: [
        {
          filename: `Invoice-${orderId}.pdf`,
          content: pdfBase64,
        }
      ],
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E8E3DB;">
          <div style="background:#111;padding:28px 32px;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:24px;color:#111;margin:0 0 8px;">Order Confirmed ✅</h1>
            <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${esc(customerName)}, your order is in our hands.</p>
            <div style="background:#F5F0E8;padding:16px;border-radius:4px;margin-bottom:24px;">
              <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;">Order ID</div>
              <div style="font-size:18px;font-weight:700;color:#111;">${orderId}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr style="border-bottom:2px solid #111;">
                  <th style="padding:8px 0;font-size:11px;letter-spacing:1px;text-align:left;text-transform:uppercase;">Item</th>
                  <th style="padding:8px 0;font-size:11px;letter-spacing:1px;text-align:center;text-transform:uppercase;">Qty</th>
                  <th style="padding:8px 0;font-size:11px;letter-spacing:1px;text-align:right;text-transform:uppercase;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr style="border-top:2px solid #111;">
                  <td colspan="2" style="padding:12px 0;font-size:14px;font-weight:700;color:#111;">TOTAL</td>
                  <td style="padding:12px 0;font-size:16px;font-weight:800;color:#FF5C1A;text-align:right;">₹${totalRupees}</td>
                </tr>
              </tfoot>
            </table>
            <a href="${SITE_URL}/order/${orderId}" style="display:inline-block;background:#FF5C1A;color:#fff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-right:12px;">
              TRACK YOUR ORDER →
            </a>
            <br />
            <a href="${SITE_URL}/invoice/${orderId}" style="display:inline-block;margin-top:16px;color:#111;text-decoration:underline;font-size:13px;font-weight:600;">
              View full Invoice online 🖨️
            </a>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #E8E3DB;text-align:center;">
            <p style="color:#aaa;font-size:11px;margin:0;">BWR Works · Made in Bengaluru · Never mass-made.</p>
            <p style="color:#aaa;font-size:11px;margin:4px 0 0;">Questions? WhatsApp: <a href="https://wa.me/918431797007" style="color:#FF5C1A;">+91 84317 97007</a></p>
          </div>
        </div>
      </body></html>`,
    });

    if (error) console.error("[Resend Error] sendOrderConfirmationEmail failed:", error);

    return { sent: !error };
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
      shipped: `Your order has been shipped! ${trackingNumber ? `Tracking number: <strong>${esc(trackingNumber)}</strong>` : ""}`,
      delivered: "Your order has been delivered! We hope you love it. 🎉",
    };
    const message = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;

    const { error } = await resend.emails.send({
      from: FROM_ORDERS,
      replyTo: REPLY_TO_SUPPORT,
      to: customerEmail,
      subject: `Order ${orderId} — Status Update | BWR Works`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E8E3DB;">
          <div style="background:#111;padding:28px 32px;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:22px;color:#111;margin:0 0 16px;">Order Update — ${orderId}</h1>
            <p style="color:#444;font-size:14px;line-height:1.7;">Hi ${esc(customerName)}, ${message}</p>
            <a href="${SITE_URL}/order/${orderId}" style="display:inline-block;margin-top:20px;background:#FF5C1A;color:#fff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              VIEW ORDER STATUS →
            </a>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #E8E3DB;text-align:center;">
            <p style="color:#aaa;font-size:11px;margin:0;">BWR Works · Made in Bengaluru · Never mass-made.</p>
          </div>
        </div>
      </body></html>`,
    });

    if (error) console.error("[Resend Error] sendStatusUpdateEmail failed:", error);

    return { sent: !error };
  },
});

// ─────────────────────────────────────────────────
// INQUIRY / CONTACT FORM EMAILS
// ─────────────────────────────────────────────────

/** Contact form: notify admin + auto-reply to customer with thread ID */
export const sendContactFormEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    threadId: v.string(), // "BWR-Q-xxxxxxxx" — embedded in subject for reply tracking
  },
  handler: async (_ctx, { name, email, phone, subject, message, threadId }) => {
    const resend = getResend();

    const subjectLabels: Record<string, string> = {
      support: "Order Support",
      bulk_order: "Bulk Order Enquiry",
      general: "General Enquiry",
    };
    const subjectLabel = subjectLabels[subject] || subject;

    // 1. Notify admin
    const { error: adminError } = await resend.emails.send({
      from: FROM_SUPPORT,
      replyTo: email,
      to: ADMIN_EMAIL,
      subject: `New ${subjectLabel} from ${name} [${threadId}]`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E8E3DB;">
          <div style="background:#111;padding:24px 32px;">
            <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:28px 32px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;font-size:13px;color:#666;width:110px;">Name</td><td style="padding:6px 0;font-size:13px;color:#111;font-weight:600;">${esc(name)}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#666;">Email</td><td style="padding:6px 0;font-size:13px;color:#111;">${esc(email)}</td></tr>
              ${phone ? `<tr><td style="padding:6px 0;font-size:13px;color:#666;">Phone</td><td style="padding:6px 0;font-size:13px;color:#111;">${esc(phone)}</td></tr>` : ""}
              <tr><td style="padding:6px 0;font-size:13px;color:#666;">Type</td><td style="padding:6px 0;font-size:13px;color:#FF5C1A;font-weight:600;">${esc(subjectLabel)}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#666;">Ref</td><td style="padding:6px 0;font-size:11px;color:#999;font-family:monospace;">${threadId}</td></tr>
            </table>
            <div style="background:#F9FAFB;padding:16px;border-left:3px solid #FF5C1A;font-size:14px;color:#333;line-height:1.7;">${esc(message)}</div>
            <a href="${SITE_URL}/admin/inquiries" style="display:inline-block;margin-top:20px;background:#111;color:#fff;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Manage in Admin →</a>
          </div>
        </div>
      </body></html>`,
    });

    // 2. Auto-reply to customer — ticket tag in subject enables inbound reply tracking
    const { error: customerError } = await resend.emails.send({
      from: FROM_SUPPORT,
      replyTo: REPLY_TO_SUPPORT,
      to: email,
      subject: `We received your inquiry — BWR Works [${threadId}]`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E8E3DB;">
          <div style="background:#111;padding:28px 32px;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:20px;color:#111;margin:0 0 16px;">Hi ${esc(name)}, we received your message!</h1>
            <p style="color:#444;font-size:14px;line-height:1.7;">Thank you for reaching out. We typically respond within 24 hours on business days.</p>
            <p style="color:#444;font-size:14px;line-height:1.7;">Your message: <em style="color:#666;">"${esc(message.slice(0, 140))}${message.length > 140 ? "..." : ""}"</em></p>
            <p style="color:#444;font-size:14px;line-height:1.7;margin-top:16px;">
              Need urgent help? WhatsApp us at <a href="https://wa.me/918431797007" style="color:#FF5C1A;">+91 84317 97007</a>
            </p>
            <p style="color:#888;font-size:11px;margin-top:24px;">💬 You can reply to this email directly and we'll see it in our inbox.</p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #E8E3DB;text-align:center;">
            <p style="color:#aaa;font-size:11px;margin:0;">BWR Works · Made in Bengaluru · Ref: ${threadId}</p>
          </div>
        </div>
      </body></html>`,
    });

    if (adminError) console.error("[Resend Error] notify admin failed:", adminError);
    if (customerError) console.error("[Resend Error] auto-reply to customer failed:", customerError);

    return { sent: !adminError && !customerError };
  },
});

/** Admin replies to a customer inquiry — thread ID kept in subject for future reply tracking */
export const sendAdminReplyEmail = action({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    threadId: v.string(),
    replyMessage: v.string(),
    previousMessages: v.optional(v.array(v.object({
      sender: v.union(v.literal("user"), v.literal("admin")),
      content: v.string(),
      timestamp: v.number(),
    }))),
  },
  handler: async (_ctx, { customerEmail, customerName, threadId, replyMessage, previousMessages }) => {
    const resend = getResend();

    const threadHtml = (previousMessages || []).slice(-4).map(m =>
      `<div style="margin:16px 0;padding:16px 20px;border-radius:12px;background:${m.sender === "admin" ? "#FFF8F5" : "#F9FAFB"};border:1px solid ${m.sender === "admin" ? "rgba(255,92,26,0.15)" : "#E5E7EB"};">
        <div style="font-size:11px;color:${m.sender === "admin" ? "#FF5C1A" : "#6B7280"};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
          <strong>${m.sender === "admin" ? "BWR Works" : esc(customerName)}</strong> • ${new Date(m.timestamp).toLocaleDateString("en-IN", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
        </div>
        <div style="font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap;">${esc(m.content.slice(0, 300))}${m.content.length > 300 ? "..." : ""}</div>
      </div>`
    ).join("");

    const { error } = await resend.emails.send({
      from: FROM_SUPPORT,
      replyTo: REPLY_TO_SUPPORT,
      to: customerEmail,
      subject: `Reply from BWR Works Support [${threadId}]`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:560px;margin:20px auto;border:1px solid #eaeaea;border-radius:8px;overflow:hidden;">
          <div style="background:#111;padding:24px 32px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:2px;">BW<span style="color:#FF5C1A;">R</span> WORKS</div>
          </div>
          <div style="padding:32px;">
            <h1 style="font-size:18px;color:#111;margin:0 0 20px;">Hi ${esc(customerName)},</h1>
            <div style="font-size:15px;color:#222;line-height:1.7;white-space:pre-wrap;">${esc(replyMessage)}</div>
            
            ${threadHtml ? `
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eaeaea;">
              <div style="font-size:10px;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Conversation History</div>
              ${threadHtml}
            </div>` : ""}
            
            <div style="margin-top:32px;padding:16px;background:#f9f9f9;border-radius:6px;text-align:center;">
              <p style="font-size:13px;color:#555;margin:0;">💬 <strong>Reply directly to this email</strong> to continue the conversation.</p>
            </div>
          </div>
          <div style="padding:16px 32px;background:#f5f5f5;text-align:center;border-top:1px solid #eaeaea;">
            <p style="color:#888;font-size:12px;margin:0;">BWR Works • <a href="https://wa.me/918431797007" style="color:#FF5C1A;text-decoration:none;font-weight:bold;">WhatsApp Us</a> • Ref: ${threadId}</p>
          </div>
        </div>
      </body></html>`,
    });

    if (error) console.error("[Resend Error] sendAdminReplyEmail failed:", error);

    return { sent: !error };
  },
});

// ─────────────────────────────────────────────────
// WHATSAPP NOTIFICATIONS
// Uses WhatsApp API link format for automated messages
// Admin can trigger these from the dashboard
// ─────────────────────────────────────────────────



/** Generate a WhatsApp deep-link for order confirmation */
export const sendWhatsAppOrderConfirmation = action({
  args: {
    customerPhone: v.string(),
    customerName: v.string(),
    orderId: v.string(),
    total: v.number(),
  },
  handler: async (_ctx, { customerPhone, customerName, orderId, total }) => {
    const totalRupees = (total / 100).toLocaleString("en-IN");

    // Clean phone number — remove spaces, dashes, and leading 0
    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, "").replace(/^0/, "");
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const message = encodeURIComponent(
      `Hi ${customerName}! 🎉\n\n` +
      `Your BWR Works order *${orderId}* has been confirmed!\n` +
      `Total: ₹${totalRupees}\n\n` +
      `Track your order: ${SITE_URL}/order/${orderId}\n\n` +
      `Thank you for choosing BWR Works! 🙏`
    );

    const whatsappUrl = `https://wa.me/${fullPhone}?text=${message}`;

    console.log(`[WhatsApp] Order confirmation link generated for ${orderId}: ${whatsappUrl}`);

    return { whatsappUrl, phone: fullPhone };
  },
});

/** Generate a WhatsApp deep-link for order status updates */
export const sendWhatsAppStatusUpdate = action({
  args: {
    customerPhone: v.string(),
    customerName: v.string(),
    orderId: v.string(),
    newStatus: v.string(),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (_ctx, { customerPhone, customerName, orderId, newStatus, trackingNumber }) => {
    const statusEmojis: Record<string, string> = {
      printing: "🖨️",
      shipped: "📦",
      delivered: "✅",
    };

    const statusMessages: Record<string, string> = {
      printing: "Your order is now being printed! Our team is crafting your custom piece.",
      shipped: `Your order has been shipped!${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`,
      delivered: "Your order has been delivered! We hope you love it! 🎉",
    };

    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, "").replace(/^0/, "");
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const emoji = statusEmojis[newStatus] || "📋";
    const msg = statusMessages[newStatus] || `Status updated to: ${newStatus}`;

    const message = encodeURIComponent(
      `Hi ${customerName}! ${emoji}\n\n` +
      `*Order ${orderId} Update*\n` +
      `${msg}\n\n` +
      `Track: ${SITE_URL}/order/${orderId}\n\n` +
      `— BWR Works`
    );

    const whatsappUrl = `https://wa.me/${fullPhone}?text=${message}`;

    console.log(`[WhatsApp] Status update link generated for ${orderId}: ${whatsappUrl}`);

    return { whatsappUrl, phone: fullPhone };
  },
});

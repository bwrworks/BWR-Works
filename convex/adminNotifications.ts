import { query } from "./_generated/server";
import { requireAdmin } from "./admin";

// ═══════════════════════════════════════════════════
// BWR WORKS — Admin Notification Counts
// Aggregates all items needing admin attention
// ═══════════════════════════════════════════════════

/** Get counts of all items needing admin attention */
export const getNotificationCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // 1. New orders (received status, not yet printing)
    const allOrders = await ctx.db.query("orders").collect();
    const newOrders = allOrders.filter(o => o.status === "received");
    const pendingPayments = allOrders.filter(o => o.paymentStatus === "pending");

    // 2. New/unanswered inquiries
    const allInquiries = await ctx.db.query("inquiries").collect();
    const newInquiries = allInquiries.filter(i => i.status === "new");

    // 3. Low stock products
    const allProducts = await ctx.db.query("products").collect();
    const lowStock = allProducts.filter(p => (p.stock ?? 0) <= 5 && p.isActive);
    const outOfStock = allProducts.filter(p => (p.stock ?? 0) === 0 && p.isActive);

    const totalAttention = newOrders.length + newInquiries.length + outOfStock.length + pendingPayments.length;

    return {
      newOrders: newOrders.length,
      pendingPayments: pendingPayments.length,
      newInquiries: newInquiries.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalAttention,
    };
  },
});

/** Get recent notification items for the panel */
export const getNotificationItems = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const items: Array<{
      id: string;
      type: "order" | "inquiry" | "stock" | "payment";
      title: string;
      subtitle: string;
      time: number;
      link: string;
      urgent: boolean;
    }> = [];

    // New orders
    const allOrders = await ctx.db.query("orders").order("desc").collect();
    for (const order of allOrders.filter(o => o.status === "received").slice(0, 5)) {
      items.push({
        id: order._id,
        type: "order",
        title: `New Order ${order.orderId}`,
        subtitle: `₹${(order.total / 100).toLocaleString("en-IN")}`,
        time: order.createdAt,
        link: "/admin/orders",
        urgent: false,
      });
    }

    // Pending payments
    for (const order of allOrders.filter(o => o.paymentStatus === "pending").slice(0, 3)) {
      items.push({
        id: `pay-${order._id}`,
        type: "payment",
        title: `Payment Pending — ${order.orderId}`,
        subtitle: `₹${(order.total / 100).toLocaleString("en-IN")}`,
        time: order.createdAt,
        link: "/admin/orders",
        urgent: true,
      });
    }

    // New inquiries
    const allInquiries = await ctx.db.query("inquiries").order("desc").collect();
    for (const inq of allInquiries.filter(i => i.status === "new").slice(0, 5)) {
      const subjectLabels: Record<string, string> = {
        support: "Support",
        bulk_order: "Bulk Order",
        general: "General",
      };
      items.push({
        id: inq._id,
        type: "inquiry",
        title: `${subjectLabels[inq.subject] || "Inquiry"} from ${inq.name}`,
        subtitle: inq.threadId || "New ticket",
        time: inq.createdAt,
        link: "/admin/inquiries",
        urgent: false,
      });
    }

    // Out of stock products
    const allProducts = await ctx.db.query("products").collect();
    for (const prod of allProducts.filter(p => (p.stock ?? 0) === 0 && p.isActive)) {
      items.push({
        id: prod._id,
        type: "stock",
        title: `${prod.name} — Out of Stock`,
        subtitle: "Needs restocking",
        time: prod.updatedAt || Date.now(),
        link: "/admin/inventory",
        urgent: true,
      });
    }

    // Sort by time descending
    items.sort((a, b) => b.time - a.time);

    return items.slice(0, 15);
  },
});

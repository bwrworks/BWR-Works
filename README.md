# BWR Works — Custom 3D Printed Products E-Commerce

Premium e-commerce platform for customized keychains, key holders, and photo frames. Built with React + Vite on the frontend and Convex for the serverless backend/database.

**Live site:** [bwrworks.com](https://www.bwrworks.com)

---

## Tech Stack

| Layer         | Technology                                     |
|---------------|-------------------------------------------------|
| Frontend      | React 18 + TypeScript + Vite                   |
| Styling       | CSS Modules + Tailwind (utility layer)         |
| Backend / DB  | Convex (serverless functions + real-time DB)   |
| Auth          | `@convex-dev/auth` (Passwordless OTP via Resend) |
| Payments      | Razorpay (webhook-verified)                    |
| Emails        | Resend (transactional + inbound webhook)       |
| Image CDN     | Cloudinary                                      |
| Deployment    | Vercel                                          |
| Domain        | Hostinger → bwrworks.com                       |

---

## Environment Variables

### Convex Dashboard (Backend)

| Variable                    | Description                          |
|-----------------------------|--------------------------------------|
| `AUTH_RESEND_KEY`           | Resend API key for OTP emails        |
| `RESEND_WEBHOOK_SECRET`    | Secret for inbound email webhook     |
| `RAZORPAY_KEY_ID`          | Razorpay API key ID                  |
| `RAZORPAY_KEY_SECRET`      | Razorpay API secret                  |
| `RAZORPAY_WEBHOOK_SECRET`  | Razorpay webhook signing secret      |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name                |
| `CLOUDINARY_API_KEY`       | Cloudinary API key                   |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret                |
| `ADMIN_EMAIL`              | Email address for admin role          |

### Vite / Vercel (Frontend)

| Variable                    | Description                          |
|-----------------------------|--------------------------------------|
| `VITE_CONVEX_URL`          | Convex deployment URL                |
| `VITE_RAZORPAY_KEY_ID`    | Razorpay key (public, for checkout)  |

---

## Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd bwr-works

# 2. Install dependencies
npm install

# 3. Set up Convex (follow prompts to link to your deployment)
npx convex dev

# 4. Start the dev server (in a separate terminal)
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
bwr-works/
├── convex/              # Backend: serverless functions + schema
│   ├── schema.ts        # Database schema (source of truth)
│   ├── orders.ts        # Order creation, payment, admin CRUD
│   ├── products.ts      # Product queries + mutations
│   ├── pricing.ts       # Cost-based pricing engine
│   ├── notifications.ts # Email + WhatsApp notification system
│   ├── webhookHandler.ts# Razorpay payment webhooks
│   ├── http.ts          # HTTP routes (Resend inbound, etc.)
│   └── ...
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── context/         # React contexts (Cart, Auth)
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities (formatters, etc.)
├── public/              # Static assets, robots.txt, sitemap.xml
├── index.html           # Entry HTML
└── vite.config.ts       # Vite configuration
```

---

## Key Features

- **Dynamic Pricing Engine** — Cost-based B2C/B2B price calculation
- **Product Customisation** — Dynamic form fields per product
- **Razorpay Integration** — Server-verified payments with webhook
- **Admin Dashboard** — KPIs, order management, CMS, coupon system
- **Review System** — Verified-purchase-only reviews
- **Email Thread System** — Two-way email support via Resend
- **Role-Based Access Control** — Backend-enforced admin permissions

---

## Deployment

The app is deployed to Vercel with automatic deploys on push to `main`. Convex handles its own deployment via `npx convex deploy`.

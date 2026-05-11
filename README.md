# BWR Works

Premium 3D-crafted physical goods platform. Built with React, Vite, Convex, and Cloudinary.

## Tech Stack
- **Frontend**: React 18, Vite, React Router, plain CSS Modules (No Tailwind)
- **Backend & Database**: Convex (Serverless TS)
- **File Storage**: Cloudinary
- **Emails / Webhooks**: Resend
- **Payments**: Razorpay

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables (`.env.local`):
   ```env
   # Convex
   CONVEX_DEPLOYMENT=your_deployment_id
   VITE_CONVEX_URL=your_convex_url

   # Razorpay
   VITE_RAZORPAY_KEY_ID=your_rzp_key
   RAZORPAY_KEY_SECRET=your_rzp_secret
   RAZORPAY_WEBHOOK_SECRET=your_rzp_webhook_secret

   # Resend
   AUTH_RESEND_KEY=your_resend_key
   RESEND_WEBHOOK_SECRET=your_resend_webhook_secret

   # Cloudinary
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Admin
   ADMIN_EMAIL=your_admin_email@example.com
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```
   *Note: Convex dev server will run automatically in parallel.*

## Key Scripts
- `npm run dev`: Starts Vite + Convex dev servers
- `npm run build`: Type-checks and builds for production
- `npm run lint`: Runs ESLint

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as auth_ResendOTP from "../auth/ResendOTP.js";
import type * as cloudinary from "../cloudinary.js";
import type * as cms from "../cms.js";
import type * as coupons from "../coupons.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as paymentsInternal from "../paymentsInternal.js";
import type * as pricing from "../pricing.js";
import type * as products from "../products.js";
import type * as rateLimits from "../rateLimits.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as webhookHandler from "../webhookHandler.js";
import type * as whatsappWebhook from "../whatsappWebhook.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  admin: typeof admin;
  adminNotifications: typeof adminNotifications;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  "auth/ResendOTP": typeof auth_ResendOTP;
  cloudinary: typeof cloudinary;
  cms: typeof cms;
  coupons: typeof coupons;
  http: typeof http;
  inquiries: typeof inquiries;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  paymentsInternal: typeof paymentsInternal;
  pricing: typeof pricing;
  products: typeof products;
  rateLimits: typeof rateLimits;
  reviews: typeof reviews;
  seed: typeof seed;
  users: typeof users;
  webhookHandler: typeof webhookHandler;
  whatsappWebhook: typeof whatsappWebhook;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

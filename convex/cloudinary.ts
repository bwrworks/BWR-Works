"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { v2 as cloudinary } from "cloudinary";
import { api, internal } from "./_generated/api";

export const generateSignature = action({
  args: { folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Only allow admins to upload product images
    await ctx.runQuery(internal.admin.checkIsAdmin);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary secrets are missing in Convex Dashboard");
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder: args.folder || "bwr-works",
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return {
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: paramsToSign.folder,
    };
  },
});

/**
 * S-07: Secure server-side file upload verification
 * Receives base64 file data from the client, validates size/type against product config,
 * and securely uploads to Cloudinary using the backend SDK.
 */
export const uploadCustomerFile = action({
  args: {
    productId: v.id("products"),
    fieldId: v.string(),
    base64Data: v.string(),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the product to get the configuration rules
    const product: any = await ctx.runQuery(internal.products.getProductInternal, { productId: args.productId });
    if (!product) throw new Error("Product not found");

    const fieldConfig: any = product.customisationConfig.find((f: any) => f.fieldId === args.fieldId);
    if (!fieldConfig || fieldConfig.type !== "file" || !fieldConfig.fileConfig) {
      throw new Error("Invalid customisation field configuration");
    }

    const { maxSizeMB, allowedTypes } = fieldConfig.fileConfig;

    // 2. Server-side Type Validation
    // Hard whitelist — regardless of what the product config allows,
    // only accept genuine image MIME types to prevent SVG/HTML injection
    const SAFE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!SAFE_MIME_TYPES.includes(args.fileType)) {
      throw new Error(`Invalid file type. Only JPEG, PNG, and WebP images are allowed.`);
    }
    if (!allowedTypes.includes(args.fileType)) {
      throw new Error(`Invalid file type. Server only allows: ${allowedTypes.join(", ")}`);
    }

    // 3. Server-side Size Validation
    // Base64 is ~33% larger than raw binary.
    const approximateSizeBytes = (args.base64Data.length * 3) / 4;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (approximateSizeBytes > maxSizeBytes) {
      throw new Error(`File too large. Server limit is ${maxSizeMB}MB.`);
    }

    // 4. Secure Upload to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary secrets are missing in Convex Dashboard");
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const fileUri: string = `data:${args.fileType};base64,${args.base64Data}`;

    try {
      const result: any = await cloudinary.uploader.upload(fileUri, {
        folder: "bwr-works/customer-uploads",
        resource_type: "image",
        public_id: `upload_${Date.now()}_${args.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
      });

      return result.secure_url;
    } catch (error: any) {
      console.error("[Cloudinary Error]", error);
      throw new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`);
    }
  },
});

/**
 * Secure server-side file upload for Custom Print requests.
 * Receives base64 file data, validates size/type, and uploads securely using backend credentials.
 */
export const uploadCustomPrintFile = action({
  args: {
    base64Data: v.string(),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized. Must be logged in.");

    // 2. Validate MIME types (only accept JPEG, PNG, WebP)
    const SAFE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!SAFE_MIME_TYPES.includes(args.fileType)) {
      throw new Error(`Invalid file type. Only JPEG, PNG, and WebP images are allowed.`);
    }

    // 3. Validate size (limit to 10MB)
    const approximateSizeBytes = (args.base64Data.length * 3) / 4;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (approximateSizeBytes > maxSizeBytes) {
      throw new Error(`File too large. Maximum size is 10MB.`);
    }

    // 4. Secure Upload to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary secrets are missing in Convex Dashboard");
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const fileUri = `data:${args.fileType};base64,${args.base64Data}`;

    try {
      const result = await cloudinary.uploader.upload(fileUri, {
        folder: "bwr-works/custom-prints",
        resource_type: "image",
        public_id: `custom_${Date.now()}_${args.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
      });

      return result.secure_url;
    } catch (error: any) {
      console.error("[Cloudinary Error]", error);
      throw new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`);
    }
  },
});


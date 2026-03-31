"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { v2 as cloudinary } from "cloudinary";
import { internal } from "./_generated/api";

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

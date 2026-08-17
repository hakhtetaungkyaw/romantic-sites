import { v2 as cloudinary } from "cloudinary";

// Read once at module load, not lazily inside uploadPhotoToCloudinary below —
// this file is only ever imported by lib/scripts/createOrder.ts (a CLI
// script, not part of the Next.js app bundle), so failing fast here with a
// clear message beats discovering a missing/misspelled env var deep in the
// middle of an interactive order-entry session.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.",
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

/**
 * Uploads a single local image file to Cloudinary and returns its
 * `secure_url`. `folder` keeps each order's photos grouped together (see
 * lib/scripts/createOrder.ts, which passes `vowx/{order-slug}`). Throws on
 * failure — callers decide what "retry or skip" means for their own flow
 * rather than this helper swallowing errors.
 */
export async function uploadPhotoToCloudinary(localPath: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
}

"use server";

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { UserModel } from "@/app/interfaces/userModel";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ROLES: Array<UserModel["role"]> = ["staff", "admin", "superadmin"];

type UploadProductLocalImageResult = {
  url?: string;
  path?: string;
  error?: string;
};

const mimeExtensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

const getSafeExtension = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase().trim();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return mimeExtensionMap[file.type] ?? "bin";
};

export const uploadProductLocalImage = async (
  formData: FormData
): Promise<UploadProductLocalImageResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.NEXT_SECRET_KEY;

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return { error: "Missing Supabase environment variables." };
  }

  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const fileEntry = formData.get("file");

  if (!accessToken) {
    return { error: "Missing session token." };
  }

  if (!(fileEntry instanceof File)) {
    return { error: "Invalid file payload." };
  }

  if (!fileEntry.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }

  if (fileEntry.size <= 0) {
    return { error: "File is empty." };
  }

  if (fileEntry.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "File is too large. Max size is 10MB." };
  }

  const requesterClient = createClient(supabaseUrl, publishableKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: requester },
    error: requesterError,
  } = await requesterClient.auth.getUser(accessToken);

  if (requesterError || !requester) {
    return { error: "Unauthorized." };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", requester.id)
    .single<{ role: UserModel["role"] }>();

  if (profileError || !profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: "You are not allowed to upload product images." };
  }

  const extension = getSafeExtension(fileEntry);
  const objectPath = `${requester.id}/${productId || "draft"}/${Date.now()}-${randomUUID()}.${extension}`;

  const uploadBuffer = Buffer.from(await fileEntry.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(objectPath, uploadBuffer, {
      contentType: fileEntry.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(objectPath);

  if (!publicUrl) {
    return { error: "Image uploaded but failed to get URL." };
  }

  return {
    url: publicUrl,
    path: objectPath,
  };
};

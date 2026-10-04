"use server";
// =============================================================================
// app/admin/actions/images.ts — Product Image Upload / Delete Actions
// Project: MobiGear WhatsApp Store
//
// Server-side validation enforced:
//   • Owner-only authorization (requireOwner())
//   • Max 8 images per product (DB trigger + application check here)
//   • Accepted MIME types: image/jpeg, image/png, image/webp
//   • Max file size: 5 MB
//   • Path convention: products/<product_id>/<timestamp>-<filename>
// =============================================================================

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_IMAGES_PER_PRODUCT = 8;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const BUCKET = "product-images";

export type ImageActionState = {
  error: string | null;
  success: boolean;
};

// ─── Upload a single image ────────────────────────────────────────────────────

export async function uploadImageAction(
  productId: string,
  imageOrder: number,
  _prevState: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  await requireOwner();

  const file = formData.get("image");
  const altText = String(formData.get("alt_text") ?? "").trim().slice(0, 300);

  if (!(file instanceof File) || file.size === 0)
    return { error: "No file selected.", success: false };
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]))
    return { error: "Only JPEG, PNG, and WebP images are accepted.", success: false };
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { error: `File size must be 5 MB or less (uploaded: ${(file.size / 1024 / 1024).toFixed(1)} MB).`, success: false };
  if (imageOrder < 0 || imageOrder > 7)
    return { error: "Image position must be between 0 and 7.", success: false };

  const supabase = await createServerSupabaseClient();

  // Check current image count (application-layer limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (supabase as any)
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId) as { count: number | null; error: Error | null };

  if (countError) return { error: "Could not verify image count. Please try again.", success: false };
  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT)
    return { error: `This product already has ${MAX_IMAGES_PER_PRODUCT} images. Remove one before uploading another.`, success: false };

  // Build storage path
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const safeName = `${Date.now()}-${imageOrder}.${ext}`;
  const storagePath = `products/${productId}/${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadImage] storage error:", uploadError);
    return { error: "Upload failed. Please check the file and try again.", success: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (supabase as any)
    .from("product_images")
    .insert({ product_id: productId, storage_path: storagePath, alt_text: altText, image_order: imageOrder }) as { error: { code?: string; message?: string } | null };

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("[uploadImage] DB error:", dbError);
    if (dbError.code === "23505")
      return { error: `Position ${imageOrder} is already taken. Choose a different image slot.`, success: false };
    return { error: "Failed to save image record. The upload was cancelled.", success: false };
  }

  revalidatePath(`/admin/products/${productId}/images`);
  revalidatePath("/");
  return { error: null, success: true };
}

// ─── Delete an image ──────────────────────────────────────────────────────────

export async function deleteImageAction(imageId: string, productId: string): Promise<ImageActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: image, error: fetchError } = await (supabase as any)
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .single() as { data: { storage_path: string } | null; error: Error | null };

  if (fetchError || !image) return { error: "Image not found.", success: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (supabase as any)
    .from("product_images")
    .delete()
    .eq("id", imageId) as { error: Error | null };

  if (dbError) return { error: "Failed to delete image record.", success: false };

  await supabase.storage.from(BUCKET).remove([image.storage_path]);

  revalidatePath(`/admin/products/${productId}/images`);
  revalidatePath("/");
  return { error: null, success: true };
}

// ─── Update alt text ──────────────────────────────────────────────────────────

export async function updateImageAltAction(imageId: string, productId: string, altText: string): Promise<ImageActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("product_images")
    .update({ alt_text: altText.trim().slice(0, 300) })
    .eq("id", imageId) as { error: Error | null };

  if (error) return { error: "Failed to update alt text.", success: false };

  revalidatePath(`/admin/products/${productId}/images`);
  return { error: null, success: true };
}

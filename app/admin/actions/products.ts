"use server";
// =============================================================================
// app/admin/actions/products.ts — Product CRUD Server Actions
// Project: MobiGear WhatsApp Store
//
// All actions call requireOwner() as their FIRST statement.
// =============================================================================

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductInsert, ProductUpdate } from "@/lib/database.types";

export type ProductActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success: boolean;
};

// ─── Validation helpers ───────────────────────────────────────────────────────

function parseProductForm(formData: FormData): {
  data: (ProductInsert & { published: boolean }) | null;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceStr = String(formData.get("price") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "").trim();
  const compatibilityRaw = String(formData.get("compatibility") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const published = formData.get("published") === "true";

  if (!name || name.length > 120) fieldErrors.name = "Name is required (max 120 characters).";
  if (!tagline || tagline.length > 200) fieldErrors.tagline = "Tagline is required (max 200 characters).";
  if (!description || description.length > 4000) fieldErrors.description = "Description is required (max 4000 characters).";
  const priceRs = parseFloat(priceStr);
  if (isNaN(priceRs) || priceRs <= 0) fieldErrors.price = "Price must be a positive number (e.g. 2499.00).";
  if (!category_id) fieldErrors.category_id = "Please select a category.";
  if (badge && badge.length > 40) fieldErrors.badge = "Badge label must be 40 characters or fewer.";

  if (Object.keys(fieldErrors).length > 0) return { data: null, fieldErrors };

  const compatibility = compatibilityRaw.split("\n").map((s) => s.trim()).filter(Boolean);

  return {
    data: {
      name,
      tagline,
      description,
      price_paisa: Math.round(priceRs * 100),
      category_id,
      compatibility,
      badge,
      published,
    },
    fieldErrors: {},
  };
}

// ─── Create product ───────────────────────────────────────────────────────────

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireOwner();

  const { data, fieldErrors } = parseProductForm(formData);
  if (!data) return { error: "Please fix the errors below.", fieldErrors, success: false };

  const supabase = await createServerSupabaseClient();

  const insertData: ProductInsert & { published: boolean } = data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .insert(insertData)
    .select("id")
    .single() as { data: { id: string } | null; error: Error | null };

  if (error || !product) {
    console.error("[createProduct]", error);
    return { error: "Failed to create product. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/products/${product.id}/images`);
}

// ─── Update product ───────────────────────────────────────────────────────────

export async function updateProductAction(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireOwner();

  const { data, fieldErrors } = parseProductForm(formData);
  if (!data) return { error: "Please fix the errors below.", fieldErrors, success: false };

  const supabase = await createServerSupabaseClient();
  const updateData: ProductUpdate = data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .update(updateData)
    .eq("id", productId) as { error: Error | null };

  if (error) {
    console.error("[updateProduct]", error);
    return { error: "Failed to save changes. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/products/${productId}`);
  return { error: null, success: true };
}

// ─── Toggle publish / unpublish ───────────────────────────────────────────────

export async function togglePublishAction(
  productId: string,
  currentlyPublished: boolean
): Promise<ProductActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .update({ published: !currentlyPublished })
    .eq("id", productId) as { error: Error | null };

  if (error) return { error: "Failed to update publish status.", success: false };

  revalidatePath("/");
  revalidatePath("/admin");
  return { error: null, success: true };
}

// ─── Delete product ───────────────────────────────────────────────────────────

export async function deleteProductAction(productId: string): Promise<ProductActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: images } = await (supabase as any)
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId) as { data: { storage_path: string }[] | null };

  if (images && images.length > 0) {
    await supabase.storage.from("product-images").remove(images.map((i) => i.storage_path));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .delete()
    .eq("id", productId) as { error: Error | null };

  if (error) {
    console.error("[deleteProduct]", error);
    return { error: "Failed to delete product.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

"use server";
// =============================================================================
// app/admin/actions/categories.ts — Owner Category CRUD Server Actions
// =============================================================================

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type CategoryActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success: boolean;
};

function parseCategoryForm(formData: FormData): {
  data: { name: string; slug: string; display_order: number; is_active: boolean } | null;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const displayOrderStr = String(formData.get("display_order") ?? "0").trim();
  const is_active = formData.get("is_active") === "true";

  if (!name || name.length > 80) {
    fieldErrors.name = "Category name is required (max 80 characters).";
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  if (!slug || slug.length > 80) {
    fieldErrors.slug = "Valid URL-safe slug is required (max 80 characters).";
  }

  const display_order = parseInt(displayOrderStr, 10);
  if (isNaN(display_order)) {
    fieldErrors.display_order = "Display order must be a valid number.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { data: null, fieldErrors };
  }

  return {
    data: { name, slug, display_order, is_active },
    fieldErrors: {},
  };
}

// ─── Create Category ──────────────────────────────────────────────────────────

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireOwner();

  const { data, fieldErrors } = parseCategoryForm(formData);
  if (!data) {
    return { error: "Please fix the errors below.", fieldErrors, success: false };
  }

  const supabase = await createServerSupabaseClient();

  // Check slug uniqueness
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("categories")
    .select("id")
    .eq("slug", data.slug)
    .maybeSingle();

  if (existing) {
    return {
      error: "A category with this slug already exists. Please choose a different slug.",
      fieldErrors: { slug: "Slug already in use." },
      success: false,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("categories")
    .insert([data]) as { error: Error | null };

  if (error) {
    console.error("[createCategory]", error);
    return { error: "Failed to create category. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null, success: true };
}

// ─── Update Category ──────────────────────────────────────────────────────────

export async function updateCategoryAction(
  categoryId: string,
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireOwner();

  const { data, fieldErrors } = parseCategoryForm(formData);
  if (!data) {
    return { error: "Please fix the errors below.", fieldErrors, success: false };
  }

  const supabase = await createServerSupabaseClient();

  // Check slug uniqueness for other categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("categories")
    .select("id")
    .eq("slug", data.slug)
    .neq("id", categoryId)
    .maybeSingle();

  if (existing) {
    return {
      error: "Another category already uses this slug.",
      fieldErrors: { slug: "Slug already in use." },
      success: false,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("categories")
    .update(data)
    .eq("id", categoryId) as { error: Error | null };

  if (error) {
    console.error("[updateCategory]", error);
    return { error: "Failed to update category. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null, success: true };
}

// ─── Toggle Active ────────────────────────────────────────────────────────────

export async function toggleCategoryActiveAction(
  categoryId: string,
  currentlyActive: boolean
): Promise<CategoryActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("categories")
    .update({ is_active: !currentlyActive })
    .eq("id", categoryId) as { error: Error | null };

  if (error) {
    console.error("[toggleCategoryActive]", error);
    return { error: "Failed to update category active status.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null, success: true };
}

// ─── Delete Category ──────────────────────────────────────────────────────────

export async function deleteCategoryAction(
  categoryId: string
): Promise<CategoryActionState> {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // 1. Check if products are assigned to this category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (supabase as any)
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    console.error("[deleteCategory check]", countError);
    return { error: "Failed to check assigned products.", success: false };
  }

  if (count && count > 0) {
    return {
      error: `Cannot delete category: ${count} product(s) are assigned to it. Please reassign or delete those products first.`,
      success: false,
    };
  }

  // 2. Perform deletion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("categories")
    .delete()
    .eq("id", categoryId) as { error: Error | null };

  if (error) {
    console.error("[deleteCategory]", error);
    return { error: "Failed to delete category.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null, success: true };
}

// =============================================================================
// app/admin/categories/page.tsx — Admin Product Categories Page
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CategoryManager, { type CategoryWithProductCount } from "@/components/admin/CategoryManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories — VIEW STORE Admin" };

export default async function AdminCategoriesPage() {
  await requireOwner();

  const supabase = await createServerSupabaseClient();

  // Fetch all categories ordered by display_order, including count of assigned products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .select("*, products(count)")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[CategoriesPage]", error);
    return (
      <div className="admin-page">
        <p className="admin-error-banner">
          Could not load categories. Ensure migration 0004_categories.sql has been applied to your database.
        </p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: CategoryWithProductCount[] = (data || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    display_order: cat.display_order,
    is_active: cat.is_active,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
    product_count: Array.isArray(cat.products) && cat.products[0] ? cat.products[0].count : 0,
  }));

  return (
    <div className="admin-page">
      <CategoryManager initialCategories={categories} />
    </div>
  );
}

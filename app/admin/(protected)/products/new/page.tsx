// =============================================================================
// app/admin/products/new/page.tsx — Add new product
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import type { CategoryRow } from "@/lib/database.types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Product — VIEW STORE Admin" };

export default async function NewProductPage() {
  await requireOwner();

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true }) as { data: CategoryRow[] | null };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Add Product</h1>
      </div>
      <ProductForm mode="create" categories={categories || []} />
    </div>
  );
}

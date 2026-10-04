// =============================================================================
// app/admin/page.tsx — Dashboard home: product list
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductListTable from "@/components/admin/ProductListTable";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products — VIEW STORE Admin" };

export default async function AdminDashboardPage() {
  await requireOwner();

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error } = await (supabase as any)
    .from("products")
    .select("id, name, price_paisa, published, created_at, category_id, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AdminDashboardPage]", error);
    return (
      <div className="admin-page">
        <p className="admin-error-banner">
          Could not load products. Ensure migration 0004_categories.sql has been applied to your database.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">
            {products?.length ?? 0} product{products?.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
          + Add Product
        </Link>
      </div>

      {products && products.length > 0 ? (
        <ProductListTable products={products} />
      ) : (
        <div className="admin-empty">
          <p className="admin-empty-icon">📦</p>
          <p className="admin-empty-text">No products yet.</p>
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
            Add your first product
          </Link>
        </div>
      )}
    </div>
  );
}

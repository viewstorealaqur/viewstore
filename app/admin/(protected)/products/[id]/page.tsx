// =============================================================================
// app/admin/products/[id]/page.tsx — Edit existing product
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CategoryRow, ProductRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Edit Product — VIEW STORE Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("id", id)
    .single() as { data: ProductRow | null; error: Error | null };

  if (error || !product) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true }) as { data: CategoryRow[] | null };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Edit Product</h1>
          <p className="admin-page-subtitle">{product.name}</p>
        </div>
        <Link
          href={`/admin/products/${id}/images`}
          className="admin-btn admin-btn-secondary"
        >
          Manage Images
        </Link>
      </div>
      <ProductForm mode="edit" product={product} categories={categories || []} />
    </div>
  );
}

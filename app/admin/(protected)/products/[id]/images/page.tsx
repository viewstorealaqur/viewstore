// =============================================================================
// app/admin/products/[id]/images/page.tsx — Image management for a product
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ImageManager from "@/components/admin/ImageManager";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProductImageRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Product Images — VIEW STORE Admin" };

interface ImageWithUrl extends ProductImageRow {
  public_url: string;
}

export default async function ProductImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error: pError } = await (supabase as any)
    .from("products")
    .select("id, name")
    .eq("id", id)
    .single() as { data: { id: string; name: string } | null; error: Error | null };

  if (pError || !product) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: images } = await (supabase as any)
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("image_order", { ascending: true }) as { data: ProductImageRow[] | null };

  // Build public URLs for existing images
  const imagesWithUrls: ImageWithUrl[] = (images ?? []).map((img) => {
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(img.storage_path);
    return { ...img, public_url: data.publicUrl };
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Images</h1>
          <p className="admin-page-subtitle">{product.name}</p>
        </div>
        <div className="admin-header-actions">
          <Link
            href={`/admin/products/${id}`}
            className="admin-btn admin-btn-secondary"
          >
            ← Edit Details
          </Link>
          <Link href="/admin" className="admin-btn admin-btn-ghost">
            All Products
          </Link>
        </div>
      </div>

      <div className="admin-info-box">
        <strong>Image slot guide:</strong> Slot 0 is the cover shown on product
        cards. Slots 1–7 are gallery images. Max 8 images per product.
      </div>

      <ImageManager productId={id} images={imagesWithUrls} />
    </div>
  );
}

import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ProductGrid from "@/components/ProductGrid";
import CompatibilitySection from "@/components/CompatibilitySection";
import Footer from "@/components/Footer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/database.types";
import type { StorefrontProduct } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

/**
 * Public storefront — Connected to Supabase Data Foundation
 */
export default async function StorefrontPage() {
  let categories: CategoryRow[] = [];
  let products: StorefrontProduct[] = [];
  let whatsappNumber: string | null = null;
  let storeName: string = "VIEW STORE";
  let logoUrl: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch Store Settings (with graceful fallback if logo_url column is not yet migrated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: settings, error: settingsErr } = await (supabase as any)
      .from("store_settings")
      .select("store_name, whatsapp_number, logo_url")
      .eq("id", "singleton")
      .maybeSingle();

    if (settingsErr && settingsErr.message?.includes("logo_url")) {
      // Fallback query if migration 0006_store_logo.sql hasn't been applied to live database yet
      const retry = await (supabase as any)
        .from("store_settings")
        .select("store_name, whatsapp_number")
        .eq("id", "singleton")
        .maybeSingle();
      settings = retry.data;
      settingsErr = retry.error;
    }

    if (settingsErr) {
      console.warn("[StorefrontPage] Note on store settings fetch:", settingsErr.message);
    } else if (settings) {
      if (settings.store_name) storeName = settings.store_name;
      whatsappNumber = settings.whatsapp_number;
      if (settings.logo_url) logoUrl = settings.logo_url;
    }

    // 2. Fetch Active Categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catData, error: catErr } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (catErr) {
      console.error("[StorefrontPage] Failed to fetch categories:", catErr.message);
    } else if (catData && catData.length > 0) {
      categories = catData;
    }

    // 3. Fetch Published Products with Category and ALL Product Images (0-7)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prodData, error: prodErr } = await (supabase as any)
      .from("products")
      .select("*, categories!inner(*), product_images(*)")
      .eq("published", true)
      .eq("categories.is_active", true)
      .order("created_at", { ascending: false });

    if (prodErr) {
      console.error("[StorefrontPage] Failed to fetch published products:", prodErr.message);
    } else if (prodData && prodData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products = prodData.map((p: any) => {
        const rawImages = p.product_images || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedImages = [...rawImages].sort((a: any, b: any) => a.image_order - b.image_order);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const all_images = sortedImages.map((img: any) => {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(img.storage_path);
          return {
            id: img.id,
            url: urlData.publicUrl,
            alt: img.alt_text || p.name,
            image_order: img.image_order,
          };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coverImg = all_images.find((i: any) => i.image_order === 0) || all_images[0];
        const cover_image_url = coverImg ? coverImg.url : null;

        return {
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          price_paisa: p.price_paisa,
          category_id: p.category_id,
          category_name: p.categories?.name,
          category_slug: p.categories?.slug,
          compatibility: p.compatibility || [],
          badge: p.badge,
          cover_image_url,
          all_images,
          isSample: false,
        };
      });
    }
  } catch (err) {
    console.error("[StorefrontPage] Unexpected error connecting to Supabase:", err);
  }

  return (
    <main>
      <Navbar storeName={storeName} logoUrl={logoUrl} />
      <HeroBanner />
      <ProductGrid
        categories={categories}
        products={products}
        whatsappNumber={whatsappNumber}
      />
      <CompatibilitySection whatsappNumber={whatsappNumber} />
      <Footer storeName={storeName} logoUrl={logoUrl} whatsappNumber={whatsappNumber} />
    </main>
  );
}


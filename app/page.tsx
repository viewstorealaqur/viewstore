import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ProductGrid from "@/components/ProductGrid";
import CompatibilitySection from "@/components/CompatibilitySection";
import Footer from "@/components/Footer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/database.types";
import type { StorefrontProduct } from "@/components/ProductCard";
import { SAMPLE_PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

/**
 * Public storefront — Connected to Supabase Data Foundation
 */
export default async function StorefrontPage() {
  let categories: CategoryRow[] = [];
  let products: StorefrontProduct[] = [];
  let whatsappNumber: string | null = null;
  let storeName: string = "VIEW STORE";

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch Store Settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings } = await (supabase as any)
      .from("store_settings")
      .select("store_name, whatsapp_number")
      .eq("id", "singleton")
      .maybeSingle();

    if (settings) {
      if (settings.store_name) storeName = settings.store_name;
      whatsappNumber = settings.whatsapp_number;
    }

    // 2. Fetch Active Categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catData } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (catData && catData.length > 0) {
      categories = catData;
    }

    // 3. Fetch Published Products with Category and ALL Product Images (0-7)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prodData } = await (supabase as any)
      .from("products")
      .select("*, categories!inner(*), product_images(*)")
      .eq("published", true)
      .eq("categories.is_active", true)
      .order("created_at", { ascending: false });

    if (prodData && prodData.length > 0) {
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
    console.warn("[StorefrontPage] Supabase connection not available or unmigrated, falling back.", err);
  }

  // Fallback to sample categories/products if database is empty or unmigrated
  if (products.length === 0 && categories.length === 0) {
    categories = [
      { id: "cat-1", name: "Hot offers", slug: "hot-offers", display_order: 0, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-2", name: "Camping", slug: "camping", display_order: 1, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-3", name: "Electronics", slug: "electronics", display_order: 2, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-4", name: "Mobiles accessories", slug: "mobiles-accessories", display_order: 3, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-5", name: "Car accessories", slug: "car-accessories", display_order: 4, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-6", name: "Cables", slug: "cables", display_order: 5, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-7", name: "Earpods", slug: "earpods", display_order: 6, is_active: true, created_at: "", updated_at: "" },
      { id: "cat-8", name: "Camera's", slug: "cameras", display_order: 7, is_active: true, created_at: "", updated_at: "" },
    ];

    products = SAMPLE_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price_paisa: p.price * 100,
      category_id: p.category,
      category_name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
      category_slug: p.category,
      compatibility: p.compatibility,
      badge: p.badge || null,
      cover_image_url: p.image,
      all_images: [{ id: p.id + "-cover", url: p.image, alt: p.name, image_order: 0 }],
      isSample: true,
    }));
  }

  return (
    <main>
      <Navbar storeName={storeName} />
      <HeroBanner />
      <ProductGrid
        categories={categories}
        products={products}
        whatsappNumber={whatsappNumber}
      />
      <CompatibilitySection />
      <Footer storeName={storeName} whatsappNumber={whatsappNumber} />
    </main>
  );
}

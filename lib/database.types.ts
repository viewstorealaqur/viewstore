// =============================================================================
// lib/database.types.ts
// Hand-authored TypeScript types that mirror the Supabase database schema.
// =============================================================================

// ── Category row shape & helpers ──────────────────────────────────────────────

export interface CategoryRow {
  id: string;                      // uuid
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;              // ISO 8601 timestamptz
  updated_at: string;
}

export type CategoryInsert = Pick<CategoryRow, "name" | "slug"> & {
  display_order?: number;
  is_active?: boolean;
};

export type CategoryUpdate = Partial<
  Pick<CategoryRow, "name" | "slug" | "display_order" | "is_active">
>;

// ── Product row shape ─────────────────────────────────────────────────────────

export interface ProductRow {
  id: string;                      // uuid
  name: string;
  tagline: string;
  description: string;
  /** Price in smallest currency unit (paisa). Divide by 100 to display. */
  price_paisa: number;
  category_id: string;             // uuid → categories.id
  compatibility: string[];
  badge: string | null;
  published: boolean;
  created_at: string;              // ISO 8601 timestamptz
  updated_at: string;
  /** Joined category details when queried with categories relation */
  categories?: CategoryRow | null;
}

export interface ProductImageRow {
  id: string;                      // uuid
  product_id: string;              // uuid → products.id
  /** Path within the "product-images" storage bucket. */
  storage_path: string;
  alt_text: string;
  /** 0 = cover image shown on product cards; 1–7 = additional gallery images. */
  image_order: number;             // smallint 0–7
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsRow {
  /** Always "singleton" — enforced by CHECK constraint. */
  id: "singleton";
  store_name: string;
  /** E.164 digits only, no leading "+". Null means WA button is disabled. */
  whatsapp_number: string | null;
  /** Custom logo image public URL. Null defaults to public/logo.png */
  logo_url?: string | null;
  updated_at: string;
}

export interface OwnerRow {
  user_id: string;                 // uuid → auth.users.id
  created_at: string;
}

// ── Insert / update shapes ────────────────────────────────────────────────────

export type ProductInsert = Pick<
  ProductRow,
  "name" | "tagline" | "description" | "price_paisa" | "category_id" | "compatibility"
> & {
  badge?: string | null;
  published?: boolean;
};

export type ProductUpdate = Partial<
  Omit<ProductRow, "id" | "created_at" | "updated_at" | "categories">
>;

export type ProductImageInsert = Pick<
  ProductImageRow,
  "product_id" | "storage_path" | "image_order"
> & {
  alt_text?: string;
};

export type StoreSettingsUpdate = Partial<
  Pick<StoreSettingsRow, "store_name" | "whatsapp_number" | "logo_url">
>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      product_images: {
        Row: ProductImageRow;
        Insert: ProductImageInsert;
        Update: Partial<Omit<ProductImageRow, "id" | "product_id" | "created_at" | "updated_at">>;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      store_settings: {
        Row: StoreSettingsRow;
        Insert: { id?: string; store_name?: string; whatsapp_number?: string | null };
        Update: StoreSettingsUpdate;
        Relationships: [];
      };
      owners: {
        Row: OwnerRow;
        Insert: { user_id: string; created_at?: string };
        Update: Partial<OwnerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ── Derived application types ────────────────────────────────────────────────

/** A published product row with its cover image URL already resolved. */
export interface PublishedProduct extends ProductRow {
  /** Absolute public URL of the cover image, or null if no image uploaded yet. */
  cover_image_url: string | null;
  /** Resolved display price string, e.g. "Rs. 2,499". */
  display_price: string;
}

/** Image shape returned to the owner dashboard (includes storage_path). */
export type ProductImageWithUrl = ProductImageRow & {
  /** Absolute public URL built from storage_path. */
  public_url: string;
};

// =============================================================================
// lib/supabase/client.ts
// Browser-side Supabase client for use in Client Components.
//
// Uses @supabase/ssr createBrowserClient which maintains session in cookies
// and is safe to use in browser code.
//
// SECURITY:
//   • Only the publishable key is bundled here; database RLS must protect data.
//   • NEXT_PUBLIC_ means Next.js includes this value in the browser bundle.
//   • A secret key must NEVER appear in any file with NEXT_PUBLIC_
//     prefix or in any file imported by a Client Component.
//
// Usage in Client Component:
//   import { createBrowserSupabaseClient } from "@/lib/supabase/client"
//   const supabase = createBrowserSupabaseClient()
//   const { data: { session } } = await supabase.auth.getSession()
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Creates a Supabase client for use in Client Components.
 * Call once per component (or use a singleton pattern via useMemo).
 * Safe to call before Supabase credentials are configured — it will throw
 * at runtime when credentials are missing, not at import time.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "[MobiGear] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "must be set in .env.local before using the browser Supabase client."
    );
  }

  return createBrowserClient<Database>(url, publishableKey);
}

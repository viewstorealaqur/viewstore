// =============================================================================
// lib/supabase/server.ts
// Server-side Supabase client for use in Server Components, Server Actions,
// and Route Handlers.
//
// Uses @supabase/ssr createServerClient which reads/writes cookies to maintain
// the authenticated session across requests — required for the owner dashboard.
//
// SECURITY:
//   • Uses only the publishable key; RLS controls its database access.
//   • Elevated secret keys are intentionally not used by this application.
//   • Never import this from a Client Component ('use client').
// =============================================================================

import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Creates a Supabase client suitable for use in Server Components and
 * Server Actions. Reads and writes session cookies via Next.js `cookies()`.
 *
 * Must be called inside a request context (Server Component, Route Handler,
 * Server Action) — not at module top-level.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustGetEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws in Server Components (read-only context).
            // This is expected and safe — the session will still be refreshed
            // on the next mutable request (Server Action / Route Handler).
          }
        },
      },
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mustGetEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `[MobiGear] Required environment variable "${name}" is not set. ` +
        `Set the Supabase project URL and publishable key in .env.local.`
    );
  }
  return val;
}

// =============================================================================
// lib/auth.ts — Server-side authorization helpers (Data Access Layer)
// Project: MobiGear WhatsApp Store
//
// These functions are the single source of truth for session and owner
// verification in Server Components and Server Actions.
//
// PATTERN (from Next.js data-security.md):
//   Use React.cache() so that auth.getUser() is called at most once per
//   server request, regardless of how many Server Components call these
//   helpers. This avoids redundant round-trips to Supabase Auth.
//
// CRITICAL RULES:
//   • Call requireOwner() at the TOP of every admin Server Component and
//     Server Action — before any database query or data mutation.
//   • Never pass the raw session/user object to Client Components.
//   • Never use user.user_metadata for authorization decisions.
// =============================================================================

import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ─── Cached session read (one call per server request) ───────────────────────

/**
 * Returns the currently authenticated user, or null if the session is missing
 * or expired. Uses React.cache() so Supabase is called only once per request.
 */
export const getUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

// ─── Owner verification ───────────────────────────────────────────────────────

/**
 * Returns { isOwner: true } if the current user's UID is in the `owners`
 * table, otherwise returns { isOwner: false }.
 *
 * Compares the authenticated user's stable Supabase Auth UUID with a
 * server-only OWNER_USER_ID setting. Database RLS independently checks the
 * owners table for every protected data operation.
 */
export const checkIsOwner = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;

  // This value is an account identifier, not a password or API secret.
  // The database owners table and RLS remain the data-access authority.
  const ownerUid = process.env.OWNER_USER_ID;
  if (!ownerUid) {
    console.warn(
      "[MobiGear] OWNER_USER_ID is not set. Owner authorization is disabled."
    );
    return false;
  }

  return user.id === ownerUid;
});

// ─── Guard functions for use in Server Components and Server Actions ──────────

/**
 * Ensures the current request is made by an authenticated user.
 * Call at the top of any Server Component or Server Action that requires login.
 * Redirects to /admin/login if the session is missing.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * Ensures the current request is made by the authorized store owner.
 * Call at the top of every admin Server Component and Server Action.
 *
 * If the user is unauthenticated → redirects to /admin/login.
 * If the user is authenticated but NOT the owner → throws an unauthorized
 * error (HTTP 403 equivalent) rather than silently succeeding.
 *
 * Returns the authenticated user object for convenience.
 */
export async function requireOwner() {
  const user = await requireAuth();
  const isOwner = await checkIsOwner();

  if (!isOwner) {
    // Throw instead of redirect so Server Actions get a proper error response.
    // The admin layout will catch unauthorized errors at the page level.
    throw new Error(
      "Unauthorized: you are not the store owner. This action was blocked."
    );
  }

  return user;
}

// ─── Safe user DTO ────────────────────────────────────────────────────────────

/**
 * Returns a minimal, safe representation of the current user suitable for
 * passing to Client Components. Never includes tokens or sensitive metadata.
 */
export type SafeUser = {
  id: string;
  email: string | undefined;
};

export async function getSafeUser(): Promise<SafeUser | null> {
  const user = await getUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
}

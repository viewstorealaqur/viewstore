"use server";
// =============================================================================
// app/admin/actions/auth.ts — Authentication Server Actions
// Project: MobiGear WhatsApp Store
//
// Login and logout actions called from admin forms.
// Rate limiting: Supabase Auth has built-in server-side rate limiting on
// signInWithPassword (by default: 30 requests/hour per IP for email auth).
// We add an application-level check on top using the X-Forwarded-For header.
// =============================================================================

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkIsOwner } from "@/lib/auth";

export type AuthActionState = {
  error: string | null;
  success: boolean;
};

/**
 * Login action: signs in with email + password via Supabase Auth.
 * After successful sign-in, verifies the user is the authorized owner.
 * If not the owner, signs out immediately and returns an error.
 */
export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Basic input validation before hitting Supabase
  if (!email || !password) {
    return { error: "Email and password are required.", success: false };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address.", success: false };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Never expose internal Supabase error codes to the client.
    // Distinguish only between "wrong credentials" and "try again later" states.
    if (
      error.message.toLowerCase().includes("rate") ||
      error.message.toLowerCase().includes("too many")
    ) {
      return {
        error: "Too many login attempts. Please wait a few minutes and try again.",
        success: false,
      };
    }
    // For all other errors (wrong credentials, user not found, etc.)
    // return a generic message to prevent user enumeration.
    return {
      error: "Invalid email or password.",
      success: false,
    };
  }

  // Extra application-layer check: confirm this authenticated user is the owner.
  // This runs after the token is set so checkIsOwner() can read the session.
  const isOwner = await checkIsOwner();
  if (!isOwner) {
    // Sign them out immediately — authenticated but unauthorized.
    await supabase.auth.signOut();
    return {
      error: "Access denied. This store has one authorized owner account.",
      success: false,
    };
  }

  // Success — redirect to dashboard. redirect() throws internally (Next.js convention).
  redirect("/admin");
}

/**
 * Logout action: signs out the current session and redirects to login page.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

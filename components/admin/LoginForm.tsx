"use client";
// =============================================================================
// components/admin/LoginForm.tsx — Owner login form
// =============================================================================

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/app/admin/actions/auth";

const initialState: AuthActionState = { error: null, success: false };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="admin-form" noValidate>
      {state.error && (
        <div className="admin-error-banner" role="alert">
          {state.error}
        </div>
      )}

      <div className="admin-field">
        <label htmlFor="email" className="admin-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          className="admin-input"
          placeholder="owner@example.com"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="password" className="admin-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="admin-input"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="admin-btn admin-btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "12px" }}
      >
        {isPending ? (
          <>
            <span className="admin-spinner" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}

// =============================================================================
// app/admin/login/page.tsx — Owner login page
// This page is intentionally outside AdminLayout (no nav, no auth check).
// =============================================================================

import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "Sign In — MobiGear Admin",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirected?: string }>;
}) {
  void searchParams; // resolved client-side; unused server-side here
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-login-logo">📦</span>
          <h1 className="admin-login-title">MobiGear</h1>
          <p className="admin-login-sub">Store Owner Portal</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

// =============================================================================
// app/admin/login/page.tsx — Owner login page
// This page is intentionally outside AdminLayout (no nav, no auth check).
// =============================================================================

import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "@/components/admin/LoginForm";
import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "Sign In — VIEW STORE Admin",
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
          <Image
            src="/logo.png"
            alt="VIEW STORE"
            width={180}
            height={50}
            style={{ objectFit: "contain", margin: "0 auto 12px", height: "50px", width: "auto" }}
            priority
          />
          <h1 className="admin-login-title">VIEW STORE</h1>
          <p className="admin-login-sub">Store Owner Portal</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

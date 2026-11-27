"use client";
// =============================================================================
// components/admin/AdminNav.tsx — Side navigation bar
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/admin/actions/auth";

import Image from "next/image";

interface AdminNavProps {
  userEmail: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Products", icon: "📦", exact: true },
  { href: "/admin/categories", label: "Categories", icon: "🏷️", exact: false },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", exact: false },
];

export default function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : "O";

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="admin-nav-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Image
          src="/logo.png"
          alt="VIEW STORE"
          width={150}
          height={40}
          style={{ objectFit: "contain", height: "40px", width: "auto" }}
          priority
        />
        <span className="admin-nav-brand-name">VIEW STORE Admin</span>
      </div>

      <div className="admin-nav-section">
        <p className="admin-nav-label">Management</p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="admin-nav-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <p className="admin-nav-label" style={{ marginTop: 24 }}>Storefront</p>
        <Link
          href="/"
          target="_blank"
          className="admin-nav-link"
          rel="noopener noreferrer"
        >
          <span className="admin-nav-link-icon">🛒</span>
          View Store ↗
        </Link>
      </div>

      <div className="admin-nav-footer">
        <div className="admin-nav-user">
          <div className="admin-nav-avatar" aria-hidden="true">
            {initial}
          </div>
          <span className="admin-nav-user-email" title={userEmail}>
            {userEmail}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="admin-nav-logout-btn"
          type="button"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );
}

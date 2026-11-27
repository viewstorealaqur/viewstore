"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface NavbarProps {
  storeName?: string;
  logoUrl?: string | null;
}

export default function Navbar({ storeName = "VIEW STORE", logoUrl }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link href="/" className="navbar-logo" aria-label={`${storeName} Home`}>
          <Image
            src={logoUrl || "/logo.png"}
            alt={storeName}
            width={180}
            height={50}
            priority
            style={{ objectFit: "contain", height: "50px", width: "auto" }}
          />
          <span className="logo-text">{storeName}</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar-links" aria-label="Site navigation">
          <Link href="#products" className="nav-link">Shop</Link>
          <Link href="#categories" className="nav-link">Categories</Link>
          <Link href="#compatibility" className="nav-link">Find My Fit</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="mobile-menu"
          aria-label="Mobile navigation"
        >
          <Link href="#products" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link href="#categories" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Categories</Link>
          <Link href="#compatibility" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Find My Fit</Link>
        </nav>
      )}
    </header>
  );
}

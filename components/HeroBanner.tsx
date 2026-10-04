import Image from "next/image";
import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="hero" aria-label="Promotional banner">
      {/* Background image */}
      <div className="hero-bg" aria-hidden="true">
        <Image
          src="/hero-banner.jpg"
          alt="Hero background"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="hero-overlay" />
      </div>

      {/* Content */}
      <div className="hero-content container">
        <div className="hero-badge">🔥 VIEW STORE Official Catalogue</div>
        <h1 className="hero-title">
          Premium Mobile &amp; <br />
          <span className="hero-accent">Electronics Accessories</span>
        </h1>
        <p className="hero-sub">
          Hot Offers · Camping · Electronics · Accessories &amp; More
          <br />
          <em>Order directly on WhatsApp — fast delivery &amp; no hassle.</em>
        </p>
        <div className="hero-actions">
          <Link href="#products" id="hero-shop-btn" className="btn btn-primary">
            Browse Products
          </Link>
          <Link href="#categories" className="btn btn-ghost">
            Explore Categories →
          </Link>
        </div>
      </div>
    </section>
  );
}

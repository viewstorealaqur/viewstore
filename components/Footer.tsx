import Image from "next/image";

interface FooterProps {
  storeName?: string;
  logoUrl?: string | null;
  whatsappNumber?: string | null;
}

export default function Footer({
  storeName = "VIEW STORE",
  logoUrl,
  whatsappNumber,
}: FooterProps) {
  const year = new Date().getFullYear();
  const phone = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : "";
  const waUrl = phone ? `https://wa.me/${phone}` : null;

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-logo" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <Image
                src={logoUrl || "/logo.png"}
                alt={storeName}
                width={190}
                height={54}
                style={{ objectFit: "contain", height: "54px", width: "auto" }}
              />
              <span className="logo-text" style={{ fontSize: "1.35rem", fontWeight: 800 }}>{storeName}</span>
            </div>
            <p className="footer-tagline">
              Premium mobile accessories and electronics delivered to your door.
              <br />
              Order simply on WhatsApp — no accounts, no hassle.
            </p>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4 className="footer-heading">Shop</h4>
            <ul className="footer-links">
              <li><a href="#products" className="footer-link">All Products</a></li>
              <li><a href="#categories" className="footer-link">Categories</a></li>
              <li><a href="#compatibility" className="footer-link">Find My Fit</a></li>
            </ul>
          </div>

          {/* Help */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Support</h4>
            <ul className="footer-links">
              <li><a href="#compatibility" className="footer-link">Compatibility Check</a></li>
              <li><span className="footer-link">Returns &amp; Warranty</span></li>
              <li><span className="footer-link">Shipping Info</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">Order &amp; Contact</h4>
            <p className="footer-contact-note">
              Order directly through WhatsApp. Click any product or connect with us directly below:
            </p>
            <div className="footer-social" style={{ marginTop: 12 }}>
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ textDecoration: "none", display: "inline-flex", gap: 6 }}
                >
                  <span aria-hidden="true">💬</span> Chat on WhatsApp
                </a>
              ) : (
                <span className="social-badge">
                  💬 WhatsApp ordering enabled in Admin Settings
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {year} {storeName}. All rights reserved.
          </p>
          <p className="footer-legal">
            Direct WhatsApp Orders · Fast Delivery · Customer Satisfaction
          </p>
        </div>
      </div>
    </footer>
  );
}

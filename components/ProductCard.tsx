"use client";

import Image from "next/image";
import { buildWhatsAppUrl, formatPrice } from "@/lib/whatsapp";

export interface ProductImageItem {
  id: string;
  url: string;
  alt?: string;
  image_order?: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price_paisa: number;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  compatibility: string[];
  badge: string | null;
  cover_image_url?: string | null;
  all_images?: ProductImageItem[];
  isSample?: boolean;
}

interface ProductCardProps {
  product: StorefrontProduct;
  whatsappNumber?: string | null;
  onSelectProduct?: (product: StorefrontProduct) => void;
}

export default function ProductCard({
  product,
  whatsappNumber,
  onSelectProduct,
}: ProductCardProps) {
  const priceRs = product.price_paisa / 100;
  const waUrl = buildWhatsAppUrl(product.name, priceRs, whatsappNumber);
  const imageUrl = product.cover_image_url || "/product-phone-case.jpg";
  const imageCount = product.all_images?.length || 1;

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation();
    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleCardClick() {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  }

  return (
    <article
      className="product-card"
      aria-label={product.name}
      onClick={handleCardClick}
      style={{ cursor: onSelectProduct ? "pointer" : "default" }}
    >
      {/* Sample badge overlay — shown only for sample products */}
      {product.isSample && (
        <div className="sample-badge" aria-label="Sample product">
          SAMPLE
        </div>
      )}

      {/* Product badge */}
      {product.badge && (
        <div className="product-badge">{product.badge}</div>
      )}

      {/* Image */}
      <div className="product-img-wrap">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="product-img"
        />
        {imageCount > 1 && (
          <span
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "100px",
              fontWeight: 600,
            }}
          >
            📷 {imageCount} photos
          </span>
        )}
      </div>

      {/* Info */}
      <div className="product-body">
        <p className="product-category">{product.category_name || "General"}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-tagline">{product.tagline}</p>

        {/* Compatibility chips */}
        {product.compatibility && product.compatibility.length > 0 && (
          <div className="compat-chips" aria-label="Compatible with">
            {product.compatibility.slice(0, 3).map((c) => (
              <span key={c} className="compat-chip">
                {c}
              </span>
            ))}
            {product.compatibility.length > 3 && (
              <span className="compat-chip compat-chip--more">
                +{product.compatibility.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="product-footer">
          <div className="product-price-wrap">
            <span className="product-price">{formatPrice(priceRs)}</span>
            {product.isSample && <span className="price-note">Sample price</span>}
          </div>

          <button
            id={`wa-btn-${product.id}`}
            className={`btn ${waUrl ? "btn-whatsapp" : "btn-whatsapp btn-whatsapp--demo"}`}
            onClick={handleWhatsApp}
            aria-disabled={!waUrl}
            aria-label={
              waUrl
                ? `Order ${product.name} on WhatsApp`
                : `WhatsApp ordering not configured yet`
            }
          >
            <span className="wa-icon" aria-hidden="true">
              💬
            </span>
            {waUrl ? "Order" : "WhatsApp"}
          </button>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { buildWhatsAppUrl, formatPrice } from "@/lib/whatsapp";
import type { StorefrontProduct } from "./ProductCard";

interface ProductDetailModalProps {
  product: StorefrontProduct | null;
  onClose: () => void;
  whatsappNumber?: string | null;
}

export default function ProductDetailModal({
  product,
  onClose,
  whatsappNumber,
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product]);

  if (!product) return null;

  const priceRs = product.price_paisa / 100;
  const waUrl = buildWhatsAppUrl(product.name, priceRs, whatsappNumber);

  const images =
    product.all_images && product.all_images.length > 0
      ? product.all_images
      : [{ id: "default", url: product.cover_image_url || "/product-phone-case.jpg", alt: product.name }];

  const currentImage = images[activeImageIndex] || images[0];

  function handleWhatsApp() {
    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      <div
        style={{
          background: "#161922",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close details"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            fontSize: "18px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Left: Image Gallery */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#0f1117",
            }}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt || product.name}
              fill
              sizes="(max-width: 800px) 100vw, 400px"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Thumbnails (for viewing other uploaded photos of product) */}
          {images.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    border: idx === activeImageIndex ? "2px solid #4f8ef7" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    width: "56px",
                    height: "56px",
                    position: "relative",
                    flexShrink: 0,
                    cursor: "pointer",
                    background: "#0f1117",
                    padding: 0,
                  }}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="56px"
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "12px",
                  color: "#4f8ef7",
                  background: "rgba(79,142,247,0.15)",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  fontWeight: 600,
                }}
              >
                {product.category_name || "Category"}
              </span>
              {product.badge && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#34d399",
                    background: "rgba(52,211,153,0.15)",
                    padding: "4px 10px",
                    borderRadius: "100px",
                    fontWeight: 600,
                  }}
                >
                  {product.badge}
                </span>
              )}
            </div>

            <h2 id="modal-product-title" style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
              {product.name}
            </h2>

            <p style={{ fontSize: "14px", color: "#8b91a8", margin: 0 }}>
              {product.tagline}
            </p>

            <div style={{ fontSize: "24px", fontWeight: 700, color: "#34d399", margin: "8px 0" }}>
              {formatPrice(priceRs)}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
              <h4 style={{ fontSize: "12px", color: "#8b91a8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                Description
              </h4>
              <p style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            </div>

            {product.compatibility && product.compatibility.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <h4 style={{ fontSize: "12px", color: "#8b91a8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Compatibility
                </h4>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {product.compatibility.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: "12px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        color: "#e5e7eb",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
            <button
              className={`btn ${waUrl ? "btn-whatsapp" : "btn-whatsapp btn-whatsapp--demo"}`}
              onClick={handleWhatsApp}
              disabled={!waUrl}
              style={{ width: "100%", justifyContent: "center", padding: "14px" }}
            >
              <span className="wa-icon" aria-hidden="true">
                💬
              </span>
              {waUrl ? "Order on WhatsApp" : "WhatsApp Ordering"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

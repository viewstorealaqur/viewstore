"use client";

import { useState, useMemo, useCallback } from "react";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import ProductCard, { type StorefrontProduct } from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import type { CategoryRow } from "@/lib/database.types";

interface ProductGridProps {
  categories: CategoryRow[];
  products: StorefrontProduct[];
  whatsappNumber?: string | null;
}

export default function ProductGrid({
  categories,
  products,
  whatsappNumber,
}: ProductGridProps) {
  const [activeSlug, setActiveSlug] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);

  const navCategories = useMemo(() => {
    return [
      { slug: "all", name: "All Products" },
      ...categories.map((c) => ({ slug: c.slug, name: c.name })),
    ];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCategory =
        activeSlug === "all" || p.category_slug === activeSlug;
      const matchesSearch =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.compatibility &&
          p.compatibility.some((c) => c.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeSlug, query]);

  // Compute product counts per category slug
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: products.length };
    for (const cat of categories) {
      result[cat.slug] = products.filter((p) => p.category_slug === cat.slug).length;
    }
    return result;
  }, [categories, products]);

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  const handleSearchChange = useCallback(
    (q: string) => {
      setQuery(q);
      if (q !== "" && activeSlug !== "all") setActiveSlug("all");
    },
    [activeSlug]
  );

  const activeCategoryName =
    activeSlug === "all"
      ? "All Products"
      : categories.find((c) => c.slug === activeSlug)?.name || "Products";

  return (
    <>
      <CategoryNav
        categories={navCategories}
        activeSlug={activeSlug}
        onChange={handleCategoryChange}
        counts={counts}
      />

      <section
        id="products"
        className="products-section"
        aria-label="Product catalogue"
      >
        <div className="container">
          {/* Header row */}
          <div className="products-header">
            <div>
              <h2 className="section-title">{activeCategoryName}</h2>
              <p className="products-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""}
                {query ? ` matching "${query}"` : ""}
              </p>
            </div>
            <SearchBar value={query} onChange={handleSearchChange} />
          </div>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div
              id="products-grid"
              className="products-grid"
              role="tabpanel"
              aria-label={`${activeCategoryName} products`}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={whatsappNumber}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" role="status">
              <div className="empty-icon" aria-hidden="true">
                🔍
              </div>
              <h3>No products found</h3>
              <p>
                Try a different search term or browse{" "}
                <button
                  className="link-btn"
                  onClick={() => {
                    setQuery("");
                    setActiveSlug("all");
                  }}
                >
                  all products
                </button>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Lightbox & Multi-photo Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
}

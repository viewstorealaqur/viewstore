"use client";

export interface NavCategory {
  slug: string;
  name: string;
  icon?: string;
}

interface CategoryNavProps {
  categories: NavCategory[];
  activeSlug: string;
  onChange: (slug: string) => void;
  counts: Record<string, number>;
}

const DEFAULT_ICONS: Record<string, string> = {
  "all": "🛍️",
  "hot-offers": "🔥",
  "camping": "🏕️",
  "electronics": "⚡",
  "mobiles-accessories": "📱",
  "car-accessories": "🚗",
  "cables": "🔌",
  "earpods": "🎧",
  "cameras": "📷",
  "cases": "📱",
  "chargers": "⚡",
  "audio": "🎧",
  "accessories": "🎒",
};

export default function CategoryNav({
  categories,
  activeSlug,
  onChange,
  counts,
}: CategoryNavProps) {
  return (
    <section
      id="categories"
      className="cat-nav-section"
      aria-label="Product categories"
    >
      <div className="container">
        <h2 className="section-title">Browse by Category</h2>
        <div className="cat-nav" role="tablist" aria-label="Categories">
          {categories.map(({ slug, name, icon }) => {
            const displayIcon = icon || DEFAULT_ICONS[slug] || "🛍️";
            const isSelected = activeSlug === slug;
            return (
              <button
                key={slug}
                id={`cat-${slug}`}
                role="tab"
                aria-selected={isSelected}
                aria-controls="products-grid"
                className={`cat-btn ${isSelected ? "cat-btn--active" : ""}`}
                onClick={() => onChange(slug)}
              >
                <span className="cat-icon" aria-hidden="true">
                  {displayIcon}
                </span>
                <span className="cat-label">{name}</span>
                <span className="cat-count">{counts[slug] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

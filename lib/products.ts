// ─── Product Types ────────────────────────────────────────────────────────────

export type Category =
  | "all"
  | "cases"
  | "chargers"
  | "audio"
  | "cables"
  | "accessories";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // in PKR (sample only — not live pricing)
  category: Category;
  image: string; // path relative to /public
  compatibility: string[]; // e.g. ["iPhone 15", "iPhone 14"]
  badge?: string; // e.g. "New", "Best Seller"
  inStock: boolean;
  /** Always true in Stage 1 — these are local sample products only */
  isSample: true;
}

// ─── Sample Products ─────────────────────────────────────────────────────────
// NOTE: All products below are SAMPLES for UI demonstration.
// Prices, names, and images will be replaced with real inventory in Stage 2.

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "prd-001",
    name: "MagGrip Pro Case",
    tagline: "Drop protection meets magnetic style",
    description:
      "Military-grade 2m drop protection with a built-in 360° rotating ring stand. Compatible with MagSafe accessories. Slim profile, matte finish.",
    price: 2499,
    category: "cases",
    image: "/product-phone-case.jpg",
    compatibility: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"],
    badge: "Best Seller",
    inStock: true,
    isSample: true,
  },
  {
    id: "prd-002",
    name: "NanoPower 65W GaN Charger",
    tagline: "Power three devices at once — at full speed",
    description:
      "Three ports (2× USB-C + 1× USB-A) in a compact GaN body. Charges a laptop, phone, and tablet simultaneously. Compatible with PD 3.0, QC 4+.",
    price: 3999,
    category: "chargers",
    image: "/product-charger.jpg",
    compatibility: ["Universal"],
    badge: "New",
    inStock: true,
    isSample: true,
  },
  {
    id: "prd-003",
    name: "AuraSound TWS Earbuds",
    tagline: "30-hour playtime · Active noise cancellation",
    description:
      "Hybrid ANC reduces background noise by up to 30 dB. Six microphones for crystal-clear calls. IPX5 water resistance. Fast-pair Bluetooth 5.3.",
    price: 5499,
    category: "audio",
    image: "/product-earbuds.jpg",
    compatibility: ["Universal"],
    badge: "Top Pick",
    inStock: true,
    isSample: true,
  },
  {
    id: "prd-004",
    name: "ArmorBraid USB-C Cable 2m",
    tagline: "240W charging · Won't fray after 20,000 bends",
    description:
      "Military-spec nylon braid rated for 20,000+ flex cycles. Supports 240W USB-C charging and 40 Gbps data transfer. 2-metre length.",
    price: 1299,
    category: "cables",
    image: "/product-cable.jpg",
    compatibility: ["Universal USB-C"],
    inStock: true,
    isSample: true,
  },
  {
    id: "prd-005",
    name: "SlimCore 10,000 mAh Power Bank",
    tagline: "Charges your phone 3× from a pocket-sized pack",
    description:
      "Ultra-slim 10 mm profile. 22.5W two-way fast charging. Dual USB-A + USB-C output. LED fuel gauge. Airline carry-on approved.",
    price: 4299,
    category: "accessories",
    image: "/product-powerbank.jpg",
    compatibility: ["Universal"],
    inStock: true,
    isSample: true,
  },
  {
    id: "prd-006",
    name: "ClearShield 9H Glass Protector",
    tagline: "Scratch-proof, fingerprint-resistant, zero bubbles",
    description:
      "9H hardness tempered glass. Oleophobic anti-fingerprint coating. Precise laser-cut edges for full-screen coverage. Easy bubble-free install frame included.",
    price: 899,
    category: "accessories",
    image: "/product-screen-protector.jpg",
    compatibility: ["iPhone 15 Series", "iPhone 14 Series"],
    badge: "Value Pick",
    inStock: true,
    isSample: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "all", label: "All Products", icon: "🛍️" },
  { value: "cases", label: "Phone Cases", icon: "📱" },
  { value: "chargers", label: "Chargers", icon: "⚡" },
  { value: "audio", label: "Audio", icon: "🎧" },
  { value: "cables", label: "Cables", icon: "🔌" },
  { value: "accessories", label: "Accessories", icon: "🎒" },
];

export function filterProducts(
  products: Product[],
  category: Category,
  query: string
): Product[] {
  const q = query.toLowerCase().trim();
  return products.filter((p) => {
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.compatibility.some((c) => c.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

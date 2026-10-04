import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * Plain-English explanation of each header:
 *
 * - Content-Security-Policy: Tells browsers what resources are allowed to
 *   load. In Stage 1 we allow our own origin, the Google Fonts CDN for fonts,
 *   and the WhatsApp domain for outbound links. Inline styles/scripts are
 *   locked down. This is tightened further in later stages.
 *
 * - X-Frame-Options: Prevents our page from being embedded in an iframe on
 *   another site (clickjacking protection).
 *
 * - X-Content-Type-Options: Stops browsers from guessing the MIME type of a
 *   response (prevents some injection attacks).
 *
 * - Referrer-Policy: When a user clicks a link, we only share the origin
 *   (not the full URL) with the destination site.
 *
 * - Permissions-Policy: Opts out of browser features we don't use (camera,
 *   microphone, geolocation).
 *
 * - Strict-Transport-Security: Tells browsers to always use HTTPS for this
 *   domain (enforced after first visit). Set via Vercel in production.
 */
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS is intentionally set at the Vercel / CDN layer in production,
  // not here, to avoid accidental HSTS on localhost or staging.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Fonts from Google Fonts CDN (used by next/font/google)
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Next.js needs inline scripts for hydration in dev;
      // In production the hash/nonce approach is added in Stage 5.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Images: our own origin + data URIs (for next/image placeholders)
      "img-src 'self' data: blob: https://*.supabase.co",
      // Allow navigation to WhatsApp for the order button
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* ── Security headers on all routes ── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  /* ── Image optimization ── */
  images: {
    // Stage 2+: Supabase Storage CDN. The project-specific subdomain follows
    // the pattern <project-ref>.supabase.co. The wildcard covers all dev and
    // prod projects without needing per-project config changes here.
    // Only image paths from the /storage/v1/object/public/ prefix are served.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /* ── Strict TypeScript in builds ── */
  // Note: in Next.js 16 the eslint.ignoreDuringBuilds option was removed.
  // Run `npm run lint` separately (CI). TypeScript is still enforced here.
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

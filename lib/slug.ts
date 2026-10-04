/**
 * Converts a text string into a URL-safe slug.
 * Example: "Hot offers" -> "hot-offers", "Camera's" -> "cameras"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

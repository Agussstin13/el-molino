export const SITE_URL = "https://elmolinomdp.com.ar";
export const SITE_NAME = "El Molino";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function productPath(product: { id: string | number; name: string }) {
  const slug = slugify(product.name);
  return `/producto/${product.id}${slug ? `/${slug}` : ""}`;
}

export function categoryPath(category: { id: string | number; name: string }) {
  const slug = slugify(category.name);
  return `/categoria/${category.id}${slug ? `/${slug}` : ""}`;
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl || "/", SITE_URL).toString();
}

export function compactDescription(value: string, maxLength = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 110 ? lastSpace : undefined).trim()}…`;
}
/**
 * Placeholder photo services that return random/irrelevant images.
 * Any product photo_url matching these should be treated as untrusted
 * and replaced by a category-based food fallback.
 */
const PLACEHOLDER_DOMAINS = [
  "picsum.photos",
  "placeholder.com",
  "placehold.co",
  "via.placeholder",
  "loremflickr.com",
  "dummyimage.com",
];

/**
 * Returns true if the URL points to a known placeholder image service.
 * These services serve random/landscape photos instead of real food photos.
 */
export function isPlaceholderPhoto(url: string | null | undefined): boolean {
  if (!url) return false;
  return PLACEHOLDER_DOMAINS.some((domain) => url.includes(domain));
}

/**
 * Returns the photo URL only if it's NOT a placeholder.
 * Use this to sanitize product.photo_url before rendering.
 */
export function getTrustedPhotoUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  return isPlaceholderPhoto(url) ? null : url;
}

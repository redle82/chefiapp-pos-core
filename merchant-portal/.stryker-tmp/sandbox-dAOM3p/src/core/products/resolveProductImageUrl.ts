// @ts-nocheck
export type ProductImageSources = {
  custom_image_url?: string | null;
  asset_image_url?: string | null;
  photo_url?: string | null;
};

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (value && value.trim().length > 0) return value;
  }
  return null;
}

export function resolveProductImageUrl(
  sources: ProductImageSources,
): string | null {
  return firstNonEmpty(
    sources.custom_image_url,
    sources.asset_image_url,
    sources.photo_url,
  );
}

/**
 * SEO Utility Functions
 * 
 * Helper functions for generating SEO-related strings.
 * Separated from SEO component for Fast Refresh compatibility.
 */

/**
 * Generate canonical URL for a restaurant
 */
export function getCanonicalUrl(slug: string): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://cardapio.chefiapp.com';
  return `${baseUrl}/${slug}`;
}

/**
 * Generate SEO-friendly title
 */
export function generateTitle(restaurantName: string, suffix?: string): string {
  const base = `${restaurantName} - Cardápio Digital`;
  return suffix ? `${suffix} | ${base}` : base;
}

/**
 * Generate meta description
 */
export function generateDescription(
  restaurantName: string, 
  cuisine?: string,
  subtitle?: string
): string {
  let desc = `Veja o cardápio de ${restaurantName}`;
  
  if (cuisine) {
    desc += ` - ${cuisine}`;
  }
  
  if (subtitle) {
    desc += `. ${subtitle}`;
  }
  
  desc += '. Faça seu pedido online agora!';
  
  return desc;
}

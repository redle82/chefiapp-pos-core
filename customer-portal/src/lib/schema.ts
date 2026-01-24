/**
 * Schema.org Structured Data Generator
 * 
 * Generates JSON-LD structured data for restaurants and menus.
 * Improves SEO and enables rich snippets in search results.
 */

export interface RestaurantSchemaData {
  name: string;
  description?: string;
  image?: string;
  url: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  priceRange?: string;
  servesCuisine?: string;
  openingHours?: string[];
  menu?: {
    name: string;
    description?: string;
    hasMenuSection?: Array<{
      name: string;
      hasMenuItem?: Array<{
        name: string;
        description?: string;
        offers?: {
          price: number;
          priceCurrency: string;
        };
      }>;
    }>;
  };
}

/**
 * Generate Restaurant schema (JSON-LD)
 */
export function generateRestaurantSchema(data: RestaurantSchemaData): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: data.name,
    url: data.url,
  };

  if (data.description) {
    schema.description = data.description;
  }

  if (data.image) {
    schema.image = data.image;
  }

  if (data.telephone) {
    schema.telephone = data.telephone;
  }

  if (data.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...data.address,
    };
  }

  if (data.priceRange) {
    schema.priceRange = data.priceRange;
  }

  if (data.servesCuisine) {
    schema.servesCuisine = data.servesCuisine;
  }

  if (data.openingHours && data.openingHours.length > 0) {
    schema.openingHours = data.openingHours;
  }

  // Menu schema
  if (data.menu) {
    schema.hasMenu = {
      '@type': 'Menu',
      name: data.menu.name,
      ...(data.menu.description && { description: data.menu.description }),
    };

    if (data.menu.hasMenuSection) {
      schema.hasMenu.hasMenuSection = data.menu.hasMenuSection.map(section => ({
        '@type': 'MenuSection',
        name: section.name,
        ...(section.hasMenuItem && {
          hasMenuItem: section.hasMenuItem.map(item => ({
            '@type': 'MenuItem',
            name: item.name,
            ...(item.description && { description: item.description }),
            ...(item.offers && {
              offers: {
                '@type': 'Offer',
                price: item.offers.price,
                priceCurrency: item.offers.priceCurrency,
              },
            }),
          })),
        }),
      }));
    }
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Inject JSON-LD script into document head
 */
export function injectSchema(schema: object, id: string): void {
  // Remove existing
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  // Create and inject new
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Remove schema script from document head
 */
export function removeSchema(id: string): void {
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
}

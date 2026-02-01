/**
 * RestaurantSEO - Automatic SEO & Schema.org for restaurant pages
 * 
 * Reads from MenuContext and sets dynamic meta tags + structured data.
 */

import { useEffect } from 'react';
import { useMenu } from '../context/MenuContext';
import { SEO } from '../lib/seo';
import { getCanonicalUrl, generateTitle, generateDescription } from '../lib/seo-utils';
import { 
  generateRestaurantSchema, 
  generateBreadcrumbSchema, 
  injectSchema, 
  removeSchema 
} from '../lib/schema';
import { trackPageView } from '../lib/pixel';

interface RestaurantSEOProps {
  slug: string;
}

export function RestaurantSEO({ slug }: RestaurantSEOProps) {
  const { profile, categories, items } = useMenu();

  useEffect(() => {
    if (!profile) return;

    const canonicalUrl = getCanonicalUrl(slug);

    // Generate and inject Restaurant schema
    const restaurantSchema = generateRestaurantSchema({
      name: profile.hero.title,
      description: profile.hero.subtitle,
      image: profile.hero.image_url,
      url: canonicalUrl,
      menu: {
        name: `Cardápio - ${profile.hero.title}`,
        hasMenuSection: categories.map(cat => ({
          name: cat.name,
          hasMenuItem: items
            .filter(item => item.category_id === cat.id)
            .slice(0, 10) // Limit items per category for schema
            .map(item => ({
              name: item.name,
              description: item.description || undefined,
              offers: {
                price: item.price_cents / 100,
                priceCurrency: item.currency || 'EUR',
              },
            })),
        })),
      },
    });

    injectSchema(restaurantSchema, 'schema-restaurant');

    // Generate and inject Breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'ChefIApp', url: getCanonicalUrl('') },
      { name: profile.hero.title, url: canonicalUrl },
    ]);

    injectSchema(breadcrumbSchema, 'schema-breadcrumb');

    // Track page view with restaurant context
    trackPageView(canonicalUrl);

    // Cleanup on unmount
    return () => {
      removeSchema('schema-restaurant');
      removeSchema('schema-breadcrumb');
    };
  }, [profile, categories, items, slug]);

  // Early return if no profile
  if (!profile) return null;

  const canonicalUrl = getCanonicalUrl(slug);
  const title = generateTitle(profile.hero.title);
  const description = generateDescription(
    profile.hero.title,
    undefined, // cuisine (not available in current profile)
    profile.hero.subtitle
  );

  return (
    <SEO
      title={title}
      description={description}
      image={profile.hero.image_url}
      url={canonicalUrl}
      type="restaurant"
      restaurant={{
        name: profile.hero.title,
      }}
    />
  );
}

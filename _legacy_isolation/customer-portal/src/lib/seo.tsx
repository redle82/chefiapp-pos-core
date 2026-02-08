/**
 * SEO Component - Dynamic meta tags for restaurant pages
 * 
 * Updates document head with restaurant-specific SEO data.
 * Supports Open Graph, Twitter Cards, and basic meta tags.
 */

import { useEffect } from 'react';

// Note: SEO utility functions (getCanonicalUrl, generateTitle, generateDescription)
// are available in './seo-utils' - import them directly from there for Fast Refresh compatibility

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'restaurant';
  restaurant?: {
    name: string;
    cuisine?: string;
    address?: string;
    phone?: string;
    priceRange?: string;
  };
}

/**
 * SEO Component - Sets document meta tags
 */
export function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  restaurant 
}: SEOProps) {
  useEffect(() => {
    // Base title
    document.title = title;

    // Helper to set/create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    setMeta('description', description);
    
    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type === 'restaurant' ? 'restaurant.restaurant' : 'website', true);
    
    if (url) {
      setMeta('og:url', url, true);
    }
    
    if (image) {
      setMeta('og:image', image, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
    }

    // Twitter Card
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    
    if (image) {
      setMeta('twitter:image', image);
    }

    // Restaurant-specific
    if (restaurant) {
      if (restaurant.cuisine) {
        setMeta('restaurant:cuisine', restaurant.cuisine, true);
      }
      if (restaurant.priceRange) {
        setMeta('restaurant:price_range', restaurant.priceRange, true);
      }
    }

    // Cleanup on unmount (reset to defaults)
    return () => {
      document.title = 'ChefIApp - Cardápio Digital';
    };
  }, [title, description, image, url, type, restaurant]);

  return null; // This component doesn't render anything
}

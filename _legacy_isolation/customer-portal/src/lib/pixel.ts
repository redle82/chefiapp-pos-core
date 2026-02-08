/**
 * Pixel & Analytics Service
 * 
 * Integrates Meta Pixel (Facebook) and Google Analytics/Ads.
 * Tracks conversions and user behavior for marketing.
 */

// Types
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface PixelConfig {
  metaPixelId?: string;
  googleAnalyticsId?: string;
  googleAdsId?: string;
}

// Event types for tracking
export type PixelEvent = 
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'Search'
  | 'CompleteRegistration';

export interface EventData {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let config: PixelConfig = {};
let initialized = false;

/**
 * Initialize pixel tracking
 */
export function initPixels(pixelConfig?: PixelConfig): void {
  if (initialized) return;

  // Load from env if not provided
  config = pixelConfig || {
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    googleAdsId: import.meta.env.VITE_GOOGLE_ADS_ID,
  };

  // Initialize Meta Pixel
  if (config.metaPixelId) {
    initMetaPixel(config.metaPixelId);
  }

  // Initialize Google Analytics
  if (config.googleAnalyticsId) {
    initGoogleAnalytics(config.googleAnalyticsId);
  }

  initialized = true;
  
  // Track initial page view
  trackPageView();
}

/**
 * Initialize Meta Pixel (Facebook)
 */
function initMetaPixel(pixelId: string): void {
  // Meta Pixel base code (simplified without arguments keyword)
  if (window.fbq) return;
  
  // Create fbq function
  const fbqQueue: unknown[][] = [];
  const fbq = (...args: unknown[]) => {
    if ((fbq as { callMethod?: (...a: unknown[]) => void }).callMethod) {
      (fbq as { callMethod: (...a: unknown[]) => void }).callMethod(...args);
    } else {
      fbqQueue.push(args);
    }
  };
  (fbq as { push: typeof fbq }).push = fbq;
  (fbq as { loaded: boolean }).loaded = true;
  (fbq as { version: string }).version = '2.0';
  (fbq as { queue: unknown[][] }).queue = fbqQueue;
  
  window.fbq = fbq;
  
  // Load fbevents.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  window.fbq?.('init', pixelId);
  
  if (import.meta.env.DEV) {
    console.log('[Pixel] Meta Pixel initialized:', pixelId);
  }
}

/**
 * Initialize Google Analytics (GA4)
 */
function initGoogleAnalytics(measurementId: string): void {
  // gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  if (import.meta.env.DEV) {
    console.log('[Pixel] Google Analytics initialized:', measurementId);
  }
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track page view
 */
export function trackPageView(url?: string): void {
  const pageUrl = url || window.location.href;

  // Meta Pixel
  if (config.metaPixelId && window.fbq) {
    window.fbq('track', 'PageView');
  }

  // Google Analytics
  if (config.googleAnalyticsId && window.gtag) {
    window.gtag('event', 'page_view', {
      page_location: pageUrl,
    });
  }

  if (import.meta.env.DEV) {
    console.log('[Pixel] PageView:', pageUrl);
  }
}

/**
 * Track custom event
 */
export function trackEvent(event: PixelEvent, data?: EventData): void {
  // Meta Pixel
  if (config.metaPixelId && window.fbq) {
    window.fbq('track', event, data);
  }

  // Google Analytics (map to GA4 events)
  if (config.googleAnalyticsId && window.gtag) {
    const gaEvent = mapToGAEvent(event);
    window.gtag('event', gaEvent, data);
  }

  if (import.meta.env.DEV) {
    console.log('[Pixel] Event:', event, data);
  }
}

/**
 * Map Meta Pixel events to GA4 events
 */
function mapToGAEvent(event: PixelEvent): string {
  const mapping: Record<PixelEvent, string> = {
    PageView: 'page_view',
    ViewContent: 'view_item',
    AddToCart: 'add_to_cart',
    InitiateCheckout: 'begin_checkout',
    Purchase: 'purchase',
    Lead: 'generate_lead',
    Search: 'search',
    CompleteRegistration: 'sign_up',
  };
  return mapping[event] || event.toLowerCase();
}

// ============================================================================
// CONVENIENCE METHODS (E-commerce)
// ============================================================================

/**
 * Track viewing a menu item
 */
export function trackViewItem(item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
}): void {
  trackEvent('ViewContent', {
    content_name: item.name,
    content_category: item.category,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price,
    currency: item.currency || 'EUR',
  });
}

/**
 * Track adding item to cart
 */
export function trackAddToCart(item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  currency?: string;
}): void {
  trackEvent('AddToCart', {
    content_name: item.name,
    content_category: item.category,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price * item.quantity,
    currency: item.currency || 'EUR',
    num_items: item.quantity,
  });
}

/**
 * Track checkout initiation
 */
export function trackInitiateCheckout(cart: {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  currency?: string;
}): void {
  trackEvent('InitiateCheckout', {
    content_ids: cart.items.map(i => i.id),
    content_type: 'product',
    value: cart.total,
    currency: cart.currency || 'EUR',
    num_items: cart.items.reduce((sum, i) => sum + i.quantity, 0),
  });
}

/**
 * Track purchase completion
 */
export function trackPurchase(order: {
  orderId: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  currency?: string;
}): void {
  trackEvent('Purchase', {
    content_ids: order.items.map(i => i.id),
    content_type: 'product',
    value: order.total,
    currency: order.currency || 'EUR',
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
    order_id: order.orderId,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string): void {
  trackEvent('Search', {
    search_string: query,
  });
}

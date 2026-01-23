export interface PixelConfig {
    facebookPixelId?: string;
    googleTagId?: string;
}

export type PixelEvent = 'PageView' | 'AddToCart' | 'Purchase' | 'Search' | 'ViewContent';

declare global {
    interface Window {
        fbq?: any;
        gtag?: any;
    }
}

class MarketingPixelService {
    private static instance: MarketingPixelService;
    private initialized = false;
    private config: PixelConfig = {};

    private constructor() { }

    public static getInstance(): MarketingPixelService {
        if (!MarketingPixelService.instance) {
            MarketingPixelService.instance = new MarketingPixelService();
        }
        return MarketingPixelService.instance;
    }

    /**
     * Initialize Pixels with simulated or real IDs
     */
    public init(config: PixelConfig) {
        if (this.initialized) return;
        this.config = config;

        if (config.facebookPixelId || config.googleTagId) {
            console.log('[PixelService] Initializing Marketing Pixels...', config);
        }

        if (config.facebookPixelId) {
            this.injectFacebookPixel(config.facebookPixelId);
        }

        if (config.googleTagId) {
            this.injectGoogleTag(config.googleTagId);
        }

        this.initialized = true;
    }

    private injectFacebookPixel(pixelId: string) {
        if (window.fbq) return; // Already loaded

        /* eslint-disable */
        // @ts-ignore
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
            n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s)
        }(window, document, 'script',
            'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */

        window.fbq('init', pixelId);
    }

    private injectGoogleTag(tagId: string) {
        if (window.gtag) return;

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) { window.dataLayer.push(args); }
        window.gtag = gtag;
        window.gtag('js', new Date());
        window.gtag('config', tagId);
    }

    /**
     * Track Standard Events
     */
    public track(event: PixelEvent, data?: any) {
        if (!this.initialized) return;

        // Facebook
        if (this.config.facebookPixelId && window.fbq) {
            if (event === 'PageView') {
                window.fbq('track', 'PageView');
            } else {
                window.fbq('track', event, data);
            }
        }

        // Google
        if (this.config.googleTagId && window.gtag) {
            // Map FB events to GA4 events
            const gaEvent = this.mapToGA4(event);
            window.gtag('event', gaEvent, data);
        }

        if (import.meta.env.DEV) {
            console.log(`[PixelService] Tracked: ${event}`, data);
        }
    }

    private mapToGA4(event: PixelEvent): string {
        switch (event) {
            case 'PageView': return 'page_view';
            case 'AddToCart': return 'add_to_cart';
            case 'Purchase': return 'purchase';
            case 'Search': return 'search';
            case 'ViewContent': return 'view_item';
            default: return event.toLowerCase();
        }
    }
}

export const PixelService = MarketingPixelService.getInstance();

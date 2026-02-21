/**
 * SPONSORED CONTEXTUAL MENU - TYPE DEFINITIONS
 * 
 * Ethical brand sponsorship integration system.
 * Amplifies real products with real value in customer-facing channels.
 */
// @ts-nocheck


export type SponsorshipChannel = 'web' | 'qr' | 'waiter';
export type IncentiveType = 'discount' | 'combo' | 'cashback' | 'gift';
export type SponsorshipEventType = 'impression' | 'click' | 'conversion' | 'sale';

export interface IncentiveValue {
    type: 'percentage' | 'fixed_amount' | 'combo' | 'cashback' | 'gift';
    value?: number;           // For percentage/fixed/cashback
    products?: string[];      // For combo (product IDs)
    description?: string;     // For gift
}

export interface VisibilityRules {
    channels: SponsorshipChannel[];
    time_slots?: ('morning' | 'lunch' | 'afternoon' | 'night')[];
    days_of_week?: number[];  // 0=Sunday, 6=Saturday
    date_range?: [string, string];  // ISO dates
    min_order_value?: number;  // Cents
}

export interface ProductSponsorship {
    id: string;
    restaurant_id: string;
    product_id: string;

    // Campaign Identity
    brand_name: string;
    campaign_id: string;
    campaign_name: string;
    brand_logo?: string;

    // Customer Incentive
    incentive_type: IncentiveType;
    incentive_value: IncentiveValue;
    incentive_display: string;  // "15% desconto", "Grátis batatas"

    // Visibility Rules
    visibility_rules: VisibilityRules;

    // Scoring Impact
    score_boost: number;  // Added to dynamic_score (default: 5)
    priority: number;     // Campaign priority (0-10)

    // Status & Control
    active: boolean;
    owner_approved: boolean;

    // Business Metrics
    impressions: number;
    clicks: number;
    conversions: number;
    revenue_cents: number;

    // Timestamps
    created_at: string;
    updated_at: string;
    starts_at: string | null;
    ends_at: string | null;
}

export interface MenuContext {
    channel: SponsorshipChannel;
    hour: number;
    day: number;  // 0-6
    date: Date;
    cart_value_cents?: number;
}

export interface SponsoredProduct {
    id: string;
    name: string;
    category: string;
    price_cents: number;
    available: boolean;

    // Sponsorship data
    sponsorship: ProductSponsorship | null;
    sponsored_price_cents?: number;  // After discount
    score: number;
}

export interface SponsorshipEvent {
    id: string;
    sponsorship_id: string;
    event_type: SponsorshipEventType;
    payload: {
        product_id: string;
        channel: SponsorshipChannel;
        timestamp: string;
        session_id: string;
        order_id?: string;
        revenue_cents?: number;
    };
    created_at: string;
}

export interface CampaignMetrics {
    campaign_id: string;
    brand_name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue_cents: number;
    ctr: number;  // Click-through rate
    conversion_rate: number;
    avg_order_value: number;
}

export interface SponsorshipSettings {
    auto_approve: boolean;
    allowed_channels: SponsorshipChannel[];
    max_score_boost: number;
    min_discount_percentage: number;
}

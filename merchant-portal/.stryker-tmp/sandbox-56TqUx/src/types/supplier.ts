// @ts-nocheck
// src/types/supplier.ts

export interface Supplier {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    brand_color?: string;
    is_active: boolean;
    metadata?: Record<string, any>;
}

export type CampaignType = 'BRANDING' | 'PRODUCT_FOCUS' | 'SPONSORSHIP';

export interface CampaignAssets {
    banner_desktop?: string;
    banner_mobile?: string;
    badge_url?: string;
    digital_coaster_bg?: string; // Background texture
}

export interface Campaign {
    id: string;
    supplier_id: string;
    name: string;
    type: CampaignType;
    start_date?: string;
    end_date?: string;
    is_active: boolean;
    assets: CampaignAssets;
}

export type PlacementLocation = 'MENU_HEADER' | 'CATEGORY_BADGE' | 'PRODUCT_SUGGESTION' | 'DIGITAL_COASTER';

export interface Placement {
    id: string;
    campaign_id: string;
    tenant_id: string;
    location: PlacementLocation;
    context_id?: string; // e.g., category_id or product_id
    status: 'ACTIVE' | 'PAUSED' | 'REJECTED';
    campaign?: Campaign; // Joined
    supplier?: Supplier; // Joined
}

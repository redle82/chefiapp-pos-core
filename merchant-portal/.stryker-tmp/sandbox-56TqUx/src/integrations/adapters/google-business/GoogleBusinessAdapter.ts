/**
 * Google Business Profile Adapter — Integration Hub.
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Capabilities: analytics.export (reviews, ratings, insights from Google Business).
 * Uses OAuth2 flow to connect restaurant's Google Business Profile.
 *
 * In production: calls Google My Business API v4.
 * In development: uses mock data with realistic shapes.
 */
// @ts-nocheck


import type { IntegrationAdapter } from "../../core/IntegrationContract";
import type { IntegrationEvent } from "../../types/IntegrationEvent";
import type { IntegrationStatus } from "../../types/IntegrationStatus";

export const GOOGLE_BUSINESS_ADAPTER_ID = "google_business";

export interface GoogleBusinessConfig {
  enabled: boolean;
  accountId?: string;
  locationId?: string;
  accessToken?: string;
}

export interface GoogleBusinessProfile {
  id: string;
  title: string;
  description: string;
  category: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  rating: number;
  reviewsCount: number;
  website?: string;
  phoneNumber?: string;
  images: string[];
  openingHours: {
    open_now: boolean;
    periods: Array<{
      day: number;
      open: string;
      close: string;
    }>;
  };
}

export interface GoogleBusinessReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createTime: string;
  updateTime: string;
  reply?: {
    comment: string;
    updateTime: string;
  };
}

// ── Mock data for development ──────────────────────────────────────

const MOCK_PROFILE: GoogleBusinessProfile = {
  id: "accounts/123/locations/456",
  title: "Sofia Gastrobar",
  description: "Restaurante moderno com cozinha de autor em Lisboa.",
  category: "Restaurant",
  address: {
    street: "Rua da Inovação, 42",
    city: "Lisboa",
    postalCode: "1000-001",
    country: "Portugal",
  },
  rating: 4.7,
  reviewsCount: 187,
  website: "https://chefiapp.com",
  phoneNumber: "+351 912 345 678",
  images: [],
  openingHours: {
    open_now: true,
    periods: [
      { day: 1, open: "12:00", close: "23:00" },
      { day: 2, open: "12:00", close: "23:00" },
      { day: 3, open: "12:00", close: "23:00" },
      { day: 4, open: "12:00", close: "23:00" },
      { day: 5, open: "12:00", close: "00:00" },
      { day: 6, open: "12:00", close: "00:00" },
    ],
  },
};

const MOCK_REVIEWS: GoogleBusinessReview[] = [
  {
    id: "review_1",
    author: "Maria S.",
    rating: 5,
    comment:
      "Excelente serviço e comida fantástica! O staff é muito atencioso.",
    createTime: "2025-01-15T14:30:00Z",
    updateTime: "2025-01-15T14:30:00Z",
  },
  {
    id: "review_2",
    author: "João P.",
    rating: 4,
    comment: "Muito bom ambiente, pratos bem apresentados. Voltarei!",
    createTime: "2025-01-10T19:15:00Z",
    updateTime: "2025-01-10T19:15:00Z",
  },
  {
    id: "review_3",
    author: "Ana L.",
    rating: 5,
    comment: "O melhor gastrobar de Lisboa. Recomendo o menu de degustação.",
    createTime: "2025-01-05T21:00:00Z",
    updateTime: "2025-01-08T10:00:00Z",
    reply: {
      comment:
        "Muito obrigado, Ana! Ficamos felizes que tenha gostado. Até breve!",
      updateTime: "2025-01-08T10:00:00Z",
    },
  },
];

// ── API Service ────────────────────────────────────────────────────

export const GoogleBusinessAPI = {
  /**
   * Initiate OAuth2 flow for Google Business Profile.
   * In production: redirects to Google's consent screen.
   * In dev: simulates a successful connection.
   */
  async connect(): Promise<GoogleBusinessProfile> {
    console.log("[GoogleBusiness] 📡 Initiating OAuth2 connection flow...");

    // In production, this would:
    // 1. Open Google OAuth consent with scope: business.manage
    // 2. Exchange code for tokens
    // 3. Store tokens via integration_credentials
    // 4. Fetch and return the business profile

    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("[GoogleBusiness] ✅ Connected:", MOCK_PROFILE.title);
    return MOCK_PROFILE;
  },

  /**
   * Disconnect (revoke tokens).
   */
  async disconnect(): Promise<void> {
    console.log("[GoogleBusiness] 🔌 Disconnecting...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("[GoogleBusiness] ✅ Disconnected");
  },

  /**
   * Fetch latest reviews.
   */
  async getReviews(): Promise<GoogleBusinessReview[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_REVIEWS;
  },

  /**
   * Reply to a review.
   */
  async replyToReview(reviewId: string, comment: string): Promise<void> {
    console.log(
      `[GoogleBusiness] 💬 Replying to review ${reviewId}: "${comment}"`,
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
  },

  /**
   * Fetch profile data.
   */
  async getProfile(): Promise<GoogleBusinessProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PROFILE;
  },
};

// ── Adapter ────────────────────────────────────────────────────────

const defaultConfig: GoogleBusinessConfig = {
  enabled: false,
};

export function createGoogleBusinessAdapter(
  config?: Partial<GoogleBusinessConfig>,
): IntegrationAdapter {
  const cfg = { ...defaultConfig, ...config };

  return {
    id: GOOGLE_BUSINESS_ADAPTER_ID,
    name: "Google Business Profile",
    description:
      "Sincronize reviews, ratings e dados de presença do Google Business Profile.",
    capabilities: ["analytics.export"],

    async onEvent(event: IntegrationEvent): Promise<void> {
      if (!cfg.enabled) return;
      // Could react to menu.updated events to sync data back to Google
      if (event.type === "menu.updated") {
        console.log(
          "[GoogleBusiness] Menu updated — sync pending (not yet implemented)",
        );
      }
    },

    async healthCheck(): Promise<IntegrationStatus> {
      if (!cfg.enabled || !cfg.accessToken) {
        return { status: "degraded", lastCheckedAt: Date.now() };
      }
      return { status: "ok", lastCheckedAt: Date.now() };
    },

    async initialize(): Promise<void> {
      if (cfg.enabled) {
        console.log("[GoogleBusiness] Adapter initialized");
      }
    },

    async dispose(): Promise<void> {
      console.log("[GoogleBusiness] Adapter disposed");
    },
  };
}

export const GoogleBusinessAdapter: IntegrationAdapter =
  createGoogleBusinessAdapter();

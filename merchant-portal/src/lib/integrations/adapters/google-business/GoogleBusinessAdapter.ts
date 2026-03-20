/**
 * GoogleBusinessAdapter — Stub for Vite build.
 * Real implementation lives in src/integrations/adapters/google-business/.
 */

export const GOOGLE_BUSINESS_ADAPTER_ID = "google_business";

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
    periods: Array<{ day: number; open: string; close: string }>;
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

export interface GoogleBusinessConfig {
  enabled: boolean;
  accountId?: string;
  locationId?: string;
  accessToken?: string;
}

export const GoogleBusinessAPI = {
  async connect(): Promise<GoogleBusinessProfile> {
    console.warn("[GoogleBusiness stub] connect not implemented");
    return {
      id: "",
      title: "",
      description: "",
      category: "",
      address: { street: "", city: "", postalCode: "", country: "" },
      rating: 0,
      reviewsCount: 0,
      images: [],
      openingHours: { open_now: false, periods: [] },
    };
  },
  async disconnect(): Promise<void> {},
  async getReviews(): Promise<GoogleBusinessReview[]> {
    return [];
  },
  async replyToReview(_reviewId: string, _comment: string): Promise<void> {},
  async getProfile(): Promise<GoogleBusinessProfile> {
    return GoogleBusinessAPI.connect();
  },
};

interface IntegrationAdapterStub {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  onEvent: (event: unknown) => Promise<void>;
  healthCheck: () => Promise<{ status: string; lastCheckedAt: number }>;
  initialize?: () => Promise<void>;
  dispose?: () => Promise<void>;
}

export function createGoogleBusinessAdapter(
  _config?: Partial<GoogleBusinessConfig>,
): IntegrationAdapterStub {
  return {
    id: GOOGLE_BUSINESS_ADAPTER_ID,
    name: "Google Business Profile",
    description: "Stub adapter",
    capabilities: ["analytics.export"],
    async onEvent() {},
    async healthCheck() {
      return { status: "degraded", lastCheckedAt: Date.now() };
    },
    async initialize() {},
    async dispose() {},
  };
}

export const GoogleBusinessAdapter = createGoogleBusinessAdapter();

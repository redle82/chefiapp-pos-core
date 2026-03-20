/**
 * InstagramAdapter — Stub for Vite build.
 * Real implementation lives in src/integrations/adapters/instagram/.
 */

export const INSTAGRAM_ADAPTER_ID = "instagram";

export interface InstagramConfig {
  enabled: boolean;
  accountId?: string;
  accessToken?: string;
  autoPostNewDishes: boolean;
  autoPostPromotions: boolean;
}

export interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  profilePictureUrl: string;
  website?: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  permalink: string;
}

export const InstagramAPI = {
  async connect(): Promise<InstagramProfile> {
    console.warn("[Instagram stub] connect not implemented");
    return {
      id: "",
      username: "",
      name: "",
      biography: "",
      followersCount: 0,
      followsCount: 0,
      mediaCount: 0,
      profilePictureUrl: "",
    };
  },
  async disconnect(): Promise<void> {},
  async getProfile(): Promise<InstagramProfile> {
    return InstagramAPI.connect();
  },
  async getRecentPosts(): Promise<InstagramPost[]> {
    return [];
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

export function createInstagramAdapter(
  _config?: Partial<InstagramConfig>,
): IntegrationAdapterStub {
  return {
    id: INSTAGRAM_ADAPTER_ID,
    name: "Instagram",
    description: "Stub adapter",
    capabilities: ["analytics.export", "notifications.send"],
    async onEvent() {},
    async healthCheck() {
      return { status: "degraded", lastCheckedAt: Date.now() };
    },
    async initialize() {},
    async dispose() {},
  };
}

export const InstagramAdapter = createInstagramAdapter();

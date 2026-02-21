/**
 * Instagram Adapter — Social media integration.
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Capabilities: analytics.export (engagement, reach), notifications.send (auto-post).
 * Uses Instagram Graph API via Facebook Login for Business.
 */

import type { IntegrationAdapter } from "../../core/IntegrationContract";
import type { IntegrationEvent } from "../../types/IntegrationEvent";
import type { IntegrationStatus } from "../../types/IntegrationStatus";

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

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_PROFILE: InstagramProfile = {
  id: "ig_123456",
  username: "sofiagastrobar",
  name: "Sofia Gastrobar",
  biography: "Cozinha de autor em Lisboa 🍽️ Reservas: link na bio",
  followersCount: 2340,
  followsCount: 185,
  mediaCount: 127,
  profilePictureUrl: "",
  website: "https://chefiapp.com",
};

const MOCK_POSTS: InstagramPost[] = [
  {
    id: "post_1",
    caption:
      "Novo prato da semana: Risotto de cogumelos selvagens 🍄 #sofiagastrobar #lisboa",
    mediaType: "IMAGE",
    mediaUrl: "",
    timestamp: "2025-01-18T18:30:00Z",
    likeCount: 89,
    commentsCount: 12,
    permalink: "https://instagram.com/p/example1",
  },
  {
    id: "post_2",
    caption: "Happy hour todas as sextas! 🍷 #happyhour #lisboa #gastrobar",
    mediaType: "IMAGE",
    mediaUrl: "",
    timestamp: "2025-01-15T17:00:00Z",
    likeCount: 156,
    commentsCount: 23,
    permalink: "https://instagram.com/p/example2",
  },
  {
    id: "post_3",
    caption:
      "A nossa equipa está pronta para vos receber ✨ #team #sofiagastrobar",
    mediaType: "CAROUSEL_ALBUM",
    mediaUrl: "",
    timestamp: "2025-01-12T12:00:00Z",
    likeCount: 234,
    commentsCount: 31,
    permalink: "https://instagram.com/p/example3",
  },
];

// ── API Service ────────────────────────────────────────────────────

export const InstagramAPI = {
  async connect(): Promise<InstagramProfile> {
    console.log("[Instagram] 📡 Initiating Facebook Login for Business...");
    // In production: Facebook Login → exchange for long-lived token → fetch profile
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("[Instagram] ✅ Connected:", MOCK_PROFILE.username);
    return MOCK_PROFILE;
  },

  async disconnect(): Promise<void> {
    console.log("[Instagram] 🔌 Disconnecting...");
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  async getProfile(): Promise<InstagramProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PROFILE;
  },

  async getRecentPosts(): Promise<InstagramPost[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_POSTS;
  },
};

// ── Adapter ────────────────────────────────────────────────────────

const defaultConfig: InstagramConfig = {
  enabled: false,
  autoPostNewDishes: false,
  autoPostPromotions: false,
};

export function createInstagramAdapter(
  config?: Partial<InstagramConfig>,
): IntegrationAdapter {
  const cfg = { ...defaultConfig, ...config };

  return {
    id: INSTAGRAM_ADAPTER_ID,
    name: "Instagram",
    description:
      "Publique automaticamente novos pratos e promoções no Instagram do restaurante.",
    capabilities: ["analytics.export", "notifications.send"],

    async onEvent(event: IntegrationEvent): Promise<void> {
      if (!cfg.enabled) return;
      // Auto-post new dish to Instagram
      if (event.type === "menu.updated" && cfg.autoPostNewDishes) {
        console.log("[Instagram] New dish detected — auto-post pending");
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
        console.log("[Instagram] Adapter initialized");
      }
    },

    async dispose(): Promise<void> {
      console.log("[Instagram] Adapter disposed");
    },
  };
}

export const InstagramAdapter: IntegrationAdapter = createInstagramAdapter();

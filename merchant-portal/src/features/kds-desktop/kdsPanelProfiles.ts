import { KDS_LATE_THRESHOLD_MINUTES } from "../../core/kds/kdsDomain";

export type KdsPanelPresetId =
  | "kitchen"
  | "bar"
  | "delivery"
  | "late"
  | "default";

export type KdsPanelKey = "kitchen" | "bar" | "delivery" | "late";

export interface KdsPanelFilters {
  station?: "kitchen" | "bar" | "pass" | "expedicao";
  sources?: string[];
  onlyLate?: boolean;
}

export interface KdsPanelProfile {
  id: string;
  label: string;
  labelKey?: string;
  badgeKey?: string;
  icon?: string;
  description?: string;
  presetId: KdsPanelPresetId;
  panelKey?: KdsPanelKey;
  filters: KdsPanelFilters;
  viewMode?: "list" | "kanban";
}

export interface KdsPanelContext {
  panelKey: KdsPanelKey;
  icon: string;
  label: string;
  labelKey: string;
  badgeLabelKey: string;
  badgeDescriptionKey: string;
  presetId: KdsPanelPresetId;
  filters: KdsPanelFilters;
  lateThresholdMinutes?: number;
}

const PANEL_STORAGE_KEY_PREFIX = "kdsPanelProfile:";

function getStorageKey(
  appOrigin: string,
  restaurantId: string,
  panelId: string,
) {
  return `${PANEL_STORAGE_KEY_PREFIX}${appOrigin}:${restaurantId}:${panelId}`;
}

function getAppOrigin() {
  if (typeof window === "undefined" || !window.location?.origin) {
    return "unknown-origin";
  }
  return window.location.origin;
}

export const KDS_PANEL_PRESETS: Record<KdsPanelPresetId, KdsPanelProfile> = {
  default: {
    id: "kds-default",
    label: "Cozinha",
    labelKey: "panel.kitchen",
    badgeKey: "panel.badgeKitchen",
    icon: "🍳",
    presetId: "default",
    panelKey: "kitchen",
    filters: {},
  },
  kitchen: {
    id: "kds-cozinha",
    label: "Cozinha",
    labelKey: "panel.kitchen",
    badgeKey: "panel.badgeKitchen",
    icon: "🍳",
    presetId: "kitchen",
    panelKey: "kitchen",
    filters: {
      station: "kitchen",
    },
  },
  bar: {
    id: "kds-bar",
    label: "Bar",
    labelKey: "panel.bar",
    badgeKey: "panel.badgeBar",
    icon: "🍺",
    presetId: "bar",
    panelKey: "bar",
    filters: {
      station: "bar",
    },
  },
  delivery: {
    id: "kds-delivery",
    label: "Delivery / Online",
    labelKey: "panel.delivery",
    badgeKey: "panel.badgeDelivery",
    icon: "🛵",
    presetId: "delivery",
    panelKey: "delivery",
    filters: {
      // Origens normalizadas (ver resolveOrderOrigin em KDSMinimal)
      sources: ["DELIVERY", "WEB", "APP"],
    },
  },
  late: {
    id: "kds-late",
    label: `Atrasados (${KDS_LATE_THRESHOLD_MINUTES}+ min)`,
    labelKey: "panel.late",
    badgeKey: "panel.badgeLate",
    icon: "⏱️",
    presetId: "late",
    panelKey: "late",
    filters: {
      onlyLate: true,
    },
  },
};

export const KDS_PANEL_LAUNCH_ORDER: KdsPanelKey[] = [
  "kitchen",
  "bar",
  "delivery",
  "late",
];

const PANEL_CONTEXTS: Record<KdsPanelKey, KdsPanelContext> = {
  kitchen: {
    panelKey: "kitchen",
    icon: "🍳",
    label: "Cozinha",
    labelKey: "panel.kitchen",
    badgeLabelKey: "panel.badgeKitchen",
    badgeDescriptionKey: "panel.badgeKitchenDescription",
    presetId: "kitchen",
    filters: KDS_PANEL_PRESETS.kitchen.filters,
  },
  bar: {
    panelKey: "bar",
    icon: "🍺",
    label: "Bar",
    labelKey: "panel.bar",
    badgeLabelKey: "panel.badgeBar",
    badgeDescriptionKey: "panel.badgeBarDescription",
    presetId: "bar",
    filters: KDS_PANEL_PRESETS.bar.filters,
  },
  delivery: {
    panelKey: "delivery",
    icon: "🛵",
    label: "Delivery / Online",
    labelKey: "panel.delivery",
    badgeLabelKey: "panel.badgeDelivery",
    badgeDescriptionKey: "panel.badgeDeliveryDescription",
    presetId: "delivery",
    filters: KDS_PANEL_PRESETS.delivery.filters,
  },
  late: {
    panelKey: "late",
    icon: "⏱️",
    label: `Atrasados (${KDS_LATE_THRESHOLD_MINUTES}+ min)`,
    labelKey: "panel.late",
    badgeLabelKey: "panel.badgeLate",
    badgeDescriptionKey: "panel.badgeLateDescription",
    presetId: "late",
    filters: KDS_PANEL_PRESETS.late.filters,
    lateThresholdMinutes: KDS_LATE_THRESHOLD_MINUTES,
  },
};

export function resolvePanelKeyFromSlug(
  slug: string | null | undefined,
): KdsPanelKey {
  if (!slug) return "kitchen";
  const key = slug.toLowerCase();
  if (
    key === "kitchen" ||
    key === "bar" ||
    key === "delivery" ||
    key === "late"
  ) {
    return key;
  }
  return "kitchen";
}

export function resolvePanelContextBySlug(
  slug: string | null | undefined,
): KdsPanelContext {
  return PANEL_CONTEXTS[resolvePanelKeyFromSlug(slug)];
}

export function resolvePanelContextByPreset(
  presetId: KdsPanelPresetId | KdsPanelKey,
): KdsPanelContext {
  return PANEL_CONTEXTS[resolvePanelKeyFromSlug(presetId)];
}

export function getKdsWindowTitle(
  restaurantName: string | null | undefined,
  panelLabel: string,
): string {
  if (restaurantName && restaurantName.trim().length > 0) {
    return `${restaurantName} — KDS — ${panelLabel}`;
  }
  return `KDS — ${panelLabel}`;
}

export function resolvePresetBySlug(
  slug: string | null | undefined,
): KdsPanelProfile {
  const key = resolvePanelKeyFromSlug(slug);
  return KDS_PANEL_PRESETS[key];
}

export function loadPanelProfile(
  restaurantId: string,
  panelId: string,
): KdsPanelProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const origin = getAppOrigin();
    const raw = window.localStorage.getItem(
      getStorageKey(origin, restaurantId, panelId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KdsPanelProfile;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePanelProfile(
  restaurantId: string,
  profile: KdsPanelProfile,
): void {
  if (typeof window === "undefined") return;
  try {
    const origin = getAppOrigin();
    window.localStorage.setItem(
      getStorageKey(origin, restaurantId, profile.id),
      JSON.stringify(profile),
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Business presets for rapid restaurant setup.
 * Maps restaurant type + country to intelligent defaults.
 *
 * Each preset provides smart defaults for channels, schedule, service model,
 * payment methods, and which setup sections can be skipped -- enabling a
 * faster onboarding path for well-known business archetypes.
 *
 * The `menuPresetKey` maps to the PRESETS in MenuBootstrapService.ts.
 */

export type BusinessType =
  | "restaurant"
  | "bar"
  | "cafe"
  | "fast_food"
  | "fine_dining"
  | "dark_kitchen"
  | "food_truck";

export interface BusinessPreset {
  type: BusinessType;
  /** Key into MenuBootstrapService PRESETS (e.g. "RESTAURANT_V1") */
  menuPresetKey: string;
  /** Default sales channels to enable */
  defaultChannels: string[];
  /** Setup section IDs that can be skipped for this type */
  skipSections: string[];
  /** Default operating hours */
  defaultSchedule: { open: string; close: string };
  /** Estimated minutes to complete setup with this preset */
  estimatedSetupMinutes: number;
  /** Default service models */
  defaultServiceModel: string[];
  /** Default payment methods */
  defaultPaymentMethods: string[];
}

const PRESETS: Record<BusinessType, BusinessPreset> = {
  restaurant: {
    type: "restaurant",
    menuPresetKey: "RESTAURANT_V1",
    defaultChannels: ["LOCAL", "TAKEAWAY"],
    skipSections: [],
    defaultSchedule: { open: "12:00", close: "23:00" },
    estimatedSetupMinutes: 15,
    defaultServiceModel: ["dine_in", "takeaway"],
    defaultPaymentMethods: ["card", "cash"],
  },
  bar: {
    type: "bar",
    menuPresetKey: "BAR_V1",
    defaultChannels: ["LOCAL"],
    skipSections: ["inventory", "integrations"],
    defaultSchedule: { open: "17:00", close: "02:00" },
    estimatedSetupMinutes: 10,
    defaultServiceModel: ["dine_in", "bar_service"],
    defaultPaymentMethods: ["card", "cash"],
  },
  cafe: {
    type: "cafe",
    menuPresetKey: "CAFE_V1",
    defaultChannels: ["LOCAL", "TAKEAWAY"],
    skipSections: ["inventory", "integrations"],
    defaultSchedule: { open: "07:00", close: "19:00" },
    estimatedSetupMinutes: 8,
    defaultServiceModel: ["counter", "takeaway"],
    defaultPaymentMethods: ["card", "cash", "contactless"],
  },
  fast_food: {
    type: "fast_food",
    menuPresetKey: "FAST_FOOD_V1",
    defaultChannels: ["LOCAL", "TAKEAWAY", "DELIVERY"],
    skipSections: ["integrations"],
    defaultSchedule: { open: "10:00", close: "23:00" },
    estimatedSetupMinutes: 10,
    defaultServiceModel: ["counter", "takeaway", "delivery"],
    defaultPaymentMethods: ["card", "cash", "contactless"],
  },
  fine_dining: {
    type: "fine_dining",
    menuPresetKey: "FINE_DINING_V1",
    defaultChannels: ["LOCAL"],
    skipSections: [],
    defaultSchedule: { open: "19:00", close: "23:30" },
    estimatedSetupMinutes: 20,
    defaultServiceModel: ["dine_in", "reservations"],
    defaultPaymentMethods: ["card"],
  },
  dark_kitchen: {
    type: "dark_kitchen",
    menuPresetKey: "RESTAURANT_V1",
    defaultChannels: ["DELIVERY"],
    skipSections: ["staff", "integrations"],
    defaultSchedule: { open: "11:00", close: "22:00" },
    estimatedSetupMinutes: 8,
    defaultServiceModel: ["delivery"],
    defaultPaymentMethods: ["card", "online"],
  },
  food_truck: {
    type: "food_truck",
    menuPresetKey: "FAST_FOOD_V1",
    defaultChannels: ["LOCAL", "TAKEAWAY"],
    skipSections: ["inventory", "integrations", "staff"],
    defaultSchedule: { open: "11:00", close: "20:00" },
    estimatedSetupMinutes: 7,
    defaultServiceModel: ["counter", "takeaway"],
    defaultPaymentMethods: ["card", "cash", "contactless"],
  },
};

/**
 * Get the business preset for a given restaurant type.
 * Falls back to "restaurant" if the type is unknown.
 */
export function getBusinessPreset(type: BusinessType): BusinessPreset {
  return PRESETS[type] ?? PRESETS.restaurant;
}

/**
 * Get all available business types with display labels and emoji.
 */
export function getBusinessTypes(): Array<{
  type: BusinessType;
  label: string;
  emoji: string;
}> {
  return [
    { type: "restaurant", label: "Restaurante", emoji: "\uD83C\uDF7D\uFE0F" },
    { type: "cafe", label: "Caf\u00e9", emoji: "\u2615" },
    { type: "bar", label: "Bar", emoji: "\uD83C\uDF78" },
    { type: "fast_food", label: "Fast Food", emoji: "\uD83C\uDF54" },
    { type: "fine_dining", label: "Fine Dining", emoji: "\uD83E\uDD42" },
    { type: "dark_kitchen", label: "Dark Kitchen", emoji: "\uD83C\uDFED" },
    { type: "food_truck", label: "Food Truck", emoji: "\uD83D\uDE9A" },
  ];
}

/**
 * Get setup section IDs that can be skipped for a given business type.
 * These map to `SetupSection.id` in setupStates.ts.
 */
export function getSkippableSections(type: BusinessType): string[] {
  return getBusinessPreset(type).skipSections;
}

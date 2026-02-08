import { z } from 'zod';

// ============================================================================
// Enums (devem bater 1:1 com CHECK constraints do banco)
// ============================================================================

export const RestaurantWebProfileStatusEnum = ['draft', 'published'] as const;
export type RestaurantWebProfileStatus = (typeof RestaurantWebProfileStatusEnum)[number];

export const RestaurantWebThemeEnum = ['light', 'dark', 'minimal'] as const;
export type RestaurantWebTheme = (typeof RestaurantWebThemeEnum)[number];

export const WebPageLevelEnum = ['BASIC', 'PRO', 'EXPERIENCE'] as const;
export type WebPageLevel = (typeof WebPageLevelEnum)[number];

export const WebOrderSourceEnum = ['WEB'] as const;
export type WebOrderSource = (typeof WebOrderSourceEnum)[number];

export const WebOrderStatusEnum = [
  'PLACED',
  'ACCEPTED',
  'IN_PREP',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type WebOrderStatus = (typeof WebOrderStatusEnum)[number];

export const WebPaymentStatusEnum = ['REQUIRES_PAYMENT', 'PAID', 'FAILED'] as const;
export type WebPaymentStatus = (typeof WebPaymentStatusEnum)[number];

export const PickupTypeEnum = ['TAKEAWAY', 'DELIVERY', 'DINEIN'] as const;
export type PickupType = (typeof PickupTypeEnum)[number];

export const PaymentProviderEnum = ['STRIPE', 'SUMUP'] as const;
export type PaymentProvider = (typeof PaymentProviderEnum)[number];

// ============================================================================
// Schemas
// ============================================================================

export const RestaurantWebProfileSchema = z.object({
  restaurant_id: z.string().uuid(),
  slug: z.string().min(1),
  domain: z.string().min(1).optional().nullable(),
  status: z.enum(RestaurantWebProfileStatusEnum).default('draft'),
  theme: z.enum(RestaurantWebThemeEnum).default('minimal'),
  web_level: z.enum(WebPageLevelEnum).default('BASIC'),
  hero: z.unknown().optional().nullable(),
  highlights: z.unknown().optional().nullable(),
  contacts: z.unknown().optional().nullable(),
  delivery_zones: z.unknown().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type RestaurantWebProfile = z.infer<typeof RestaurantWebProfileSchema>;

export const MenuCategorySchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(1),
  position: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuItemSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price_cents: z.number().int().nonnegative(),
  currency: z.string().min(1).default('eur'),
  photo_url: z.string().min(1).optional().nullable(),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const WebOrderItemInputSchema = z.object({
  menu_item_id: z.string().uuid(),
  qty: z.number().int().positive(),
});
export type WebOrderItemInput = z.infer<typeof WebOrderItemInputSchema>;

export const WebOrderSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  source: z.enum(WebOrderSourceEnum).default('WEB'),
  status: z.enum(WebOrderStatusEnum).default('PLACED'),
  payment_status: z.enum(WebPaymentStatusEnum).default('REQUIRES_PAYMENT'),
  pickup_type: z.enum(PickupTypeEnum).default('TAKEAWAY'),
  table_ref: z.string().min(1).optional().nullable(),
  customer_contact: z.unknown().optional().nullable(),
  delivery_address: z.unknown().optional().nullable(),
  notes: z.string().optional().nullable(),
  currency: z.string().min(1).default('eur'),
  total_cents: z.number().int().nonnegative(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),

  // payload-level
  items: z.array(WebOrderItemInputSchema).min(1),
});
export type WebOrder = z.infer<typeof WebOrderSchema>;

export const PaymentIntentRefSchema = z.object({
  id: z.string().uuid().optional(),
  order_id: z.string().uuid(),
  provider: z.enum(PaymentProviderEnum),
  intent_id: z.string().min(1),
  client_secret: z.string().min(1).optional().nullable(),
  status: z.string().min(1).default('CREATED'),
  raw: z.unknown().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type PaymentIntentRef = z.infer<typeof PaymentIntentRefSchema>;

export const OnboardingStartSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  auth_provider: z.enum(['google', 'facebook', 'email']).default('email'),
});
export type OnboardingStart = z.infer<typeof OnboardingStartSchema>;

export const OnboardingConfirmSchema = z.object({
  session_token: z.string().min(1),
  restaurant_name: z.string().min(1),
  city: z.string().min(1),
  category: z.enum(['RESTAURANT', 'BAR', 'HOTEL', 'CAFE']).default('RESTAURANT'),
  slug: z.string().min(1).optional(),
});
export type OnboardingConfirm = z.infer<typeof OnboardingConfirmSchema>;

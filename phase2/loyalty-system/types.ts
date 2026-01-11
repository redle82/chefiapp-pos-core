import { v4 as uuid } from 'uuid';
import { Decimal } from 'decimal.js';

/**
 * LOYALTY SYSTEM — Core Types & Contracts
 * 
 * This is the heart of Phase 2.
 * Loyalty cards belong to restaurants.
 * Customers get points for orders.
 * Points unlock tiers and rewards.
 * 
 * RULE: Loyalty data is immutable. All changes logged to event stream.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type LoyaltyCardType = 'physical' | 'digital';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type LoyaltyCardStatus = 'active' | 'suspended' | 'expired' | 'cancelled';
export type RewardReason = 'order' | 'referral' | 'promotion' | 'birthday' | 'manual';

export interface LoyaltyCard {
  id: string; // UUID
  restaurantId: string; // UUID
  customerId?: string; // UUID (if known)
  phoneNumber?: string; // +351 91X XXX XXX (for WhatsApp/SMS)
  email?: string;
  
  // Card details
  cardType: LoyaltyCardType;
  cardNumber?: string; // Last 4 digits for physical cards
  
  // Points & tier
  currentPoints: Decimal;
  pointsEarned: Decimal; // cumulative (audit trail)
  pointsRedeemed: Decimal; // cumulative (audit trail)
  currentTier: LoyaltyTier;
  
  // Tier progression
  pointsToNextTier: Decimal; // How many more points to upgrade?
  tierUpgradedAt?: Date;
  
  // Status
  status: LoyaltyCardStatus;
  createdAt: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata?: {
    notes?: string;
    customFields?: Record<string, any>;
  };
}

export interface LoyaltyReward {
  id: string; // UUID
  cardId: string; // UUID
  restaurantId: string; // UUID
  
  points: number; // Points awarded/deducted
  reason: RewardReason;
  
  // Linked to what?
  orderId?: string; // If from an order
  referralCode?: string; // If from a referral
  promotionId?: string; // If from a promotion
  
  // Audit trail
  awardedBy: 'system' | 'staff' | 'admin'; // Who triggered this?
  awardedAt: Date;
  expiresAt?: Date; // Some points have expiry (e.g., promotional points)
  
  // Reversal (if wrong)
  reversedAt?: Date;
  reversalReason?: string;
}

export interface LoyaltyTierConfig {
  restaurantId: string;
  
  // Points required to reach each tier
  bronzeThreshold: number; // e.g., 0 (all customers start here)
  silverThreshold: number; // e.g., 100 points = 1 month of regular visits
  goldThreshold: number; // e.g., 500 points = 3–4 months
  platinumThreshold: number; // e.g., 2000 points = 1 year of regular visits
  
  // Rewards per tier
  bronzeRewards: TierReward[];
  silverRewards: TierReward[];
  goldRewards: TierReward[];
  platinumRewards: TierReward[];
  
  // Points earning
  pointsPerEuro: Decimal; // e.g., 1 point per €1 = 100% earning rate
  
  // Settings
  pointExpiryDays?: number; // e.g., 365 = points expire after 1 year
  enableAutoTierDowngrade: boolean; // If points expire, downgrade tier?
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TierReward {
  id: string;
  name: string; // e.g., "Free dessert"
  description: string;
  pointsCost: number; // Points needed to redeem
  redemptionLimit?: number; // e.g., max 1 per month
  validUntil?: Date;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACTS (What external systems see)
// ═══════════════════════════════════════════════════════════════════════════

export interface AddPointsToCardInput {
  cardId: string;
  points: number;
  reason: RewardReason;
  orderId?: string;
  awardedBy: 'system' | 'staff' | 'admin';
}

export interface AddPointsToCardOutput {
  success: boolean;
  cardId: string;
  previousPoints: Decimal;
  newPoints: Decimal;
  previousTier: LoyaltyTier;
  newTier: LoyaltyTier;
  tierUpgraded: boolean;
  rewardId: string; // for audit trail
}

export interface CreateLoyaltyCardInput {
  restaurantId: string;
  cardType: LoyaltyCardType;
  phoneNumber?: string;
  email?: string;
}

export interface CreateLoyaltyCardOutput {
  cardId: string;
  card: LoyaltyCard;
}

export interface RedeemRewardInput {
  cardId: string;
  rewardId: string;
  redemptionMethod: 'in_app' | 'qr_code' | 'manual';
}

export interface RedeemRewardOutput {
  success: boolean;
  cardId: string;
  rewardId: string;
  pointsDeducted: number;
  remainingPoints: Decimal;
  confirmationCode: string; // For verification in-store
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS (Immutable audit trail)
// ═══════════════════════════════════════════════════════════════════════════

export interface LoyaltyCardCreatedEvent {
  type: 'loyalty.card.created';
  aggregateId: string; // cardId
  restaurantId: string;
  cardType: LoyaltyCardType;
  timestamp: Date;
  version: number;
}

export interface PointsAddedEvent {
  type: 'loyalty.points.added';
  aggregateId: string; // cardId
  restaurantId: string;
  points: number;
  reason: RewardReason;
  orderId?: string;
  previousTotal: Decimal;
  newTotal: Decimal;
  tierChangedFrom?: LoyaltyTier;
  tierChangedTo?: LoyaltyTier;
  timestamp: Date;
  version: number;
}

export interface TierUpgradedEvent {
  type: 'loyalty.tier.upgraded';
  aggregateId: string; // cardId
  restaurantId: string;
  previousTier: LoyaltyTier;
  newTier: LoyaltyTier;
  currentPoints: Decimal;
  timestamp: Date;
  version: number;
}

export interface RewardRedeemedEvent {
  type: 'loyalty.reward.redeemed';
  aggregateId: string; // cardId
  restaurantId: string;
  rewardId: string;
  pointsDeducted: number;
  remainingPoints: Decimal;
  confirmationCode: string;
  timestamp: Date;
  version: number;
}

export interface PointsExpiredEvent {
  type: 'loyalty.points.expired';
  aggregateId: string; // cardId
  restaurantId: string;
  pointsExpired: number;
  remainingPoints: Decimal;
  tierChangedFrom?: LoyaltyTier;
  tierChangedTo?: LoyaltyTier;
  timestamp: Date;
  version: number;
}

export type LoyaltyEvent =
  | LoyaltyCardCreatedEvent
  | PointsAddedEvent
  | TierUpgradedEvent
  | RewardRedeemedEvent
  | PointsExpiredEvent;

// ═══════════════════════════════════════════════════════════════════════════
// FACADE (What the Order system calls to award points)
// ═══════════════════════════════════════════════════════════════════════════

export interface LoyaltyServiceFacade {
  /**
   * When an order is confirmed, award points to the customer's loyalty card
   */
  awardPointsForOrder(input: {
    restaurantId: string;
    orderId: string;
    orderTotal: Decimal;
    customerPhone?: string;
    customerEmail?: string;
  }): Promise<{ pointsAwarded: number; newTotal: Decimal; tier: LoyaltyTier }>;

  /**
   * Check if customer is eligible for any rewards (admin view)
   */
  getCustomerLoyaltyStatus(input: {
    restaurantId: string;
    phoneNumber?: string;
    email?: string;
  }): Promise<LoyaltyCard | null>;

  /**
   * Redeem a reward (customer redeems in-app or at counter)
   */
  redeemReward(input: RedeemRewardInput): Promise<RedeemRewardOutput>;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY (Create instances)
// ═══════════════════════════════════════════════════════════════════════════

export function createLoyaltyCard(input: CreateLoyaltyCardInput): LoyaltyCard {
  return {
    id: uuid(),
    restaurantId: input.restaurantId,
    cardType: input.cardType,
    phoneNumber: input.phoneNumber,
    email: input.email,

    // Start with 0 points, bronze tier
    currentPoints: new Decimal('0'),
    pointsEarned: new Decimal('0'),
    pointsRedeemed: new Decimal('0'),
    currentTier: 'bronze',
    pointsToNextTier: new Decimal('100'), // 100 points to silver

    status: 'active',
    createdAt: new Date(),
  };
}

export function calculatePointsEarned(
  orderTotal: Decimal,
  pointsPerEuro: Decimal
): Decimal {
  return orderTotal.mul(pointsPerEuro);
}

export function calculateTierUpgrade(
  totalPoints: Decimal,
  config: LoyaltyTierConfig
): LoyaltyTier {
  if (totalPoints.gte(config.platinumThreshold)) return 'platinum';
  if (totalPoints.gte(config.goldThreshold)) return 'gold';
  if (totalPoints.gte(config.silverThreshold)) return 'silver';
  return 'bronze';
}

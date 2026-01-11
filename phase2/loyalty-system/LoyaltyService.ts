import { Decimal } from 'decimal.js';
import { EventEmitter } from 'events';
import {
  LoyaltyCard,
  LoyaltyServiceFacade,
  LoyaltyTierConfig,
  LoyaltyEvent,
  RedeemRewardInput,
  RedeemRewardOutput,
  AddPointsToCardOutput,
  calculatePointsEarned,
  calculateTierUpgrade,
  createLoyaltyCard,
} from './types';

/**
 * LOYALTY SERVICE
 * 
 * Manages all loyalty operations:
 * - Create cards
 * - Award points on orders
 * - Track tier progression
 * - Redeem rewards
 * - Audit trail via events
 */

export interface LoyaltyServiceDependencies {
  eventBus: EventEmitter; // For publishing loyalty events
  database: {
    // TBD: PostgreSQL or similar
    getLoyaltyCard(cardId: string): Promise<LoyaltyCard | null>;
    saveLoyaltyCard(card: LoyaltyCard): Promise<void>;
    getLoyaltyTierConfig(restaurantId: string): Promise<LoyaltyTierConfig>;
    createReward(restaurantId: string, reward: any): Promise<string>; // Returns reward ID
  };
}

export class LoyaltyService implements LoyaltyServiceFacade {
  constructor(private deps: LoyaltyServiceDependencies) {}

  /**
   * Award points to a loyalty card for an order
   * This is called when an order is confirmed by the TPV
   */
  async awardPointsForOrder(input: {
    restaurantId: string;
    orderId: string;
    orderTotal: Decimal;
    customerPhone?: string;
    customerEmail?: string;
  }): Promise<{ pointsAwarded: number; newTotal: Decimal; tier: string }> {
    // Step 1: Find or create loyalty card
    let card = await this.findOrCreateCard(
      input.restaurantId,
      input.customerPhone,
      input.customerEmail
    );

    // Step 2: Get tier config (points per euro, thresholds)
    const config = await this.deps.database.getLoyaltyTierConfig(
      input.restaurantId
    );

    // Step 3: Calculate points earned
    const pointsEarned = calculatePointsEarned(
      input.orderTotal,
      config.pointsPerEuro
    );

    // Step 4: Update card
    const previousTier = card.currentTier;
    card.currentPoints = card.currentPoints.add(pointsEarned);
    card.pointsEarned = card.pointsEarned.add(pointsEarned);

    // Step 5: Check for tier upgrade
    const newTier = calculateTierUpgrade(card.currentPoints, config);
    if (newTier !== previousTier) {
      card.currentTier = newTier;
      card.tierUpgradedAt = new Date();

      // Publish event
      this.deps.eventBus.emit('loyalty.tier.upgraded', {
        type: 'loyalty.tier.upgraded',
        aggregateId: card.id,
        restaurantId: input.restaurantId,
        previousTier,
        newTier,
        currentPoints: card.currentPoints,
        timestamp: new Date(),
        version: 1, // TBD: version tracking
      } as LoyaltyEvent);
    }

    // Step 6: Persist
    await this.deps.database.saveLoyaltyCard(card);

    // Step 7: Publish points added event
    this.deps.eventBus.emit('loyalty.points.added', {
      type: 'loyalty.points.added',
      aggregateId: card.id,
      restaurantId: input.restaurantId,
      points: pointsEarned.toNumber(),
      reason: 'order',
      orderId: input.orderId,
      previousTotal: card.currentPoints.minus(pointsEarned),
      newTotal: card.currentPoints,
      tierChangedFrom: previousTier !== newTier ? previousTier : undefined,
      tierChangedTo: previousTier !== newTier ? newTier : undefined,
      timestamp: new Date(),
      version: 1,
    } as LoyaltyEvent);

    return {
      pointsAwarded: pointsEarned.toNumber(),
      newTotal: card.currentPoints,
      tier: newTier,
    };
  }

  /**
   * Get customer's loyalty card (for checking points, rewards, etc.)
   */
  async getCustomerLoyaltyStatus(input: {
    restaurantId: string;
    phoneNumber?: string;
    email?: string;
  }): Promise<LoyaltyCard | null> {
    // TODO: Query by phone or email to find card
    // For now, stubbed
    return null;
  }

  /**
   * Redeem a reward
   */
  async redeemReward(input: RedeemRewardInput): Promise<RedeemRewardOutput> {
    // TODO: Implement redemption logic
    // 1. Validate card exists
    // 2. Validate reward exists
    // 3. Check customer has enough points
    // 4. Deduct points
    // 5. Generate confirmation code
    // 6. Emit event
    // 7. Return result

    throw new Error('Not yet implemented');
  }

  /**
   * Private: Find or create loyalty card for customer
   */
  private async findOrCreateCard(
    restaurantId: string,
    phoneNumber?: string,
    email?: string
  ): Promise<LoyaltyCard> {
    // TODO: Query by phone/email first
    // If not found, create new card

    // For now, return a new card
    return createLoyaltyCard({
      restaurantId,
      cardType: 'digital',
      phoneNumber,
      email,
    });
  }
}

/**
 * EXPORTS
 */

export function createLoyaltyService(
  deps: LoyaltyServiceDependencies
): LoyaltyServiceFacade {
  return new LoyaltyService(deps);
}

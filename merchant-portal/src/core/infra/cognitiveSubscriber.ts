/**
 * COGNITIVE SUBSCRIBER — InsForge Event Listener
 *
 * Listens to events published to InsForge and triggers AI/Analytics processing.
 *
 * ARCHITECTURE:
 * - Runs in InsForge Edge Function (not in Core)
 * - Triggered by database inserts (gm_events table)
 * - Processes events asynchronously
 * - Updates AI state, triggers agents, generates insights
 *
 * THIS FILE IS A SPECIFICATION for the InsForge side.
 * Core does NOT run this code directly.
 */

import { Logger } from "../logger";
import type { CoreEvent } from "./eventTypes";

// ============================================================================
// SUBSCRIBER INTERFACE (for InsForge Edge Function)
// ============================================================================

export interface CognitiveSubscriberConfig {
  /**
   * Event types to subscribe to
   */
  eventTypes: string[];

  /**
   * Processing function
   */
  onEvent: (event: CoreEvent) => Promise<void>;

  /**
   * Error handler
   */
  onError?: (error: Error, event: CoreEvent) => void;

  /**
   * Batch processing (optional)
   */
  batchSize?: number;
  batchInterval?: number; // milliseconds
}

// ============================================================================
// EXAMPLE: InsForge Edge Function (to be deployed)
// ============================================================================

/**
 * This is the code that runs in InsForge as an Edge Function.
 *
 * Deployment:
 * - Deploy this as: functions/cognitive-subscriber/index.ts
 * - Trigger: Database webhook on gm_events table
 *
 * Example Edge Function:
 *
 * ```typescript
 * import { serve } from '@insforge/functions';
 * import { processEvent } from './cognitive-processor';
 *
 * serve(async (req) => {
 *   const { event } = await req.json();
 *
 *   try {
 *     await processEvent(event);
 *     return new Response(JSON.stringify({ success: true }), { status: 200 });
 *   } catch (error) {
 *     Logger.error('[COGNITIVE_SUBSCRIBER] Error:', error);
 *     return new Response(JSON.stringify({ error: error.message }), { status: 500 });
 *   }
 * });
 * ```
 */

// ============================================================================
// EVENT PROCESSORS (AI/Analytics Logic)
// ============================================================================

/**
 * Process order.created event
 *
 * AI Actions:
 * - Update product popularity score
 * - Detect ordering patterns
 * - Suggest cross-sells
 * - Update demand forecast
 */
export async function processOrderCreated(
  event: Extract<CoreEvent, { eventType: "order.created" }>,
): Promise<void> {
  Logger.debug("[COGNITIVE] Processing order.created:", {
    orderId: event.orderId,
  });

  // Cognitive layer: lightweight pattern detection
  // Full AI implementation deferred to dedicated ML service
  // For now, log event for future batch processing
  if (typeof window !== "undefined") {
    const key = `cognitive_events_${new Date().toISOString().split("T")[0]}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ type: "order.created", orderId: event.orderId, ts: Date.now() });
    if (existing.length <= 500) localStorage.setItem(key, JSON.stringify(existing));
  }
}

/**
 * Process order.paid event
 *
 * AI Actions:
 * - Update revenue forecast
 * - Detect payment method preferences
 * - Calculate tip patterns
 * - Trigger mission completion check
 */
export async function processOrderPaid(
  event: Extract<CoreEvent, { eventType: "order.paid" }>,
): Promise<void> {
  Logger.debug("[COGNITIVE] Processing order.paid:", {
    orderId: event.orderId,
  });

  // TODO: Implement AI logic
  // - Update revenue forecast model
  // - Analyze payment method trends
  // - Calculate average tip percentage
  // - Check if mission targets met
}

/**
 * Process shift.closed event
 *
 * AI Actions:
 * - Generate shift performance report
 * - Compare against goals
 * - Suggest improvements
 * - Update staff performance score
 */
export async function processShiftClosed(
  event: Extract<CoreEvent, { eventType: "shift.closed" }>,
): Promise<void> {
  Logger.debug("[COGNITIVE] Processing shift.closed:", {
    shiftId: event.shiftId,
  });

  // TODO: Implement AI logic
  // - Generate automated shift report
  // - Compare sales vs target
  // - Identify anomalies (discrepancies)
  // - Update staff performance metrics
}

/**
 * Process mission.requested event
 *
 * AI Actions:
 * - Analyze current state
 * - Generate personalized mission
 * - Set realistic targets
 * - Create achievement path
 */
export async function processMissionRequested(
  event: Extract<CoreEvent, { eventType: "mission.requested" }>,
): Promise<void> {
  Logger.debug("[COGNITIVE] Processing mission.requested");

  // TODO: Implement AI logic
  // - Analyze restaurant performance
  // - Identify growth opportunities
  // - Generate SMART mission goals
  // - Create achievement milestones
}

// ============================================================================
// MAIN EVENT ROUTER
// ============================================================================

/**
 * Route event to appropriate processor
 */
export async function processEvent(event: CoreEvent): Promise<void> {
  const processors: Partial<
    Record<CoreEvent["eventType"], (event: any) => Promise<void>>
  > = {
    "order.created": processOrderCreated,
    "order.paid": processOrderPaid,
    "shift.closed": processShiftClosed,
    "mission.requested": processMissionRequested,
    // Add more processors as needed
  };

  const processor = processors[event.eventType];

  if (processor) {
    await processor(event);
  } else {
    Logger.warn(`[COGNITIVE] No processor for event type: ${event.eventType}`);
  }
}

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================

/**
 * STEP 1: Create InsForge Edge Function
 *
 * $ cd insforge-project
 * $ insforge functions create cognitive-subscriber
 *
 * File: functions/cognitive-subscriber/index.ts
 *
 * ```typescript
 * import { serve } from '@insforge/functions';
 * import { processEvent } from './cognitive-processor';
 *
 * serve(async (req) => {
 *   const { event } = await req.json();
 *   await processEvent(event);
 *   return new Response(JSON.stringify({ success: true }));
 * });
 * ```
 *
 * STEP 2: Deploy Edge Function
 *
 * $ insforge functions deploy cognitive-subscriber
 *
 * STEP 3: Create Database Webhook
 *
 * Table: gm_events
 * Trigger: INSERT
 * Function: cognitive-subscriber
 *
 * STEP 4: Test
 *
 * - Publish event from Core
 * - Check InsForge logs
 * - Verify AI processing occurred
 */

export const DEPLOYMENT_README = `
# Cognitive Subscriber Deployment

## Overview
The Cognitive Subscriber runs as an InsForge Edge Function that listens to events from Core.

## Files to Deploy
- functions/cognitive-subscriber/index.ts (main handler)
- functions/cognitive-subscriber/cognitive-processor.ts (event processors)
- functions/cognitive-subscriber/ai-models.ts (AI logic)

## Database Setup
Create table for events:

\`\`\`sql
CREATE TABLE gm_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  restaurant_id TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by TEXT
);

CREATE INDEX idx_events_type ON gm_events(event_type);
CREATE INDEX idx_events_restaurant ON gm_events(restaurant_id);
CREATE INDEX idx_events_created ON gm_events(created_at);
\`\`\`

## Webhook Setup
- Navigate to InsForge Dashboard → Database → Webhooks
- Create webhook on gm_events table (INSERT trigger)
- Point to cognitive-subscriber edge function
- Enable retry on failure

## Monitoring
- Check InsForge logs for processing errors
- Monitor dead letter queue in Core
- Set up alerts for high failure rate (> 5%)

## Cost Estimation
- Edge function invocations: ~1000-5000/day (small restaurant)
- Database operations: ~2000-10000/day
- Estimated cost: $5-15/month (InsForge free tier covers most)
`;

/**
 * State Machine Types
 * 
 * Generated types for state machine execution.
 * Source of truth: JSON state machine definitions.
 */

// ============================================================================
// SESSION
// ============================================================================

export type SessionState = "INACTIVE" | "ACTIVE" | "CLOSED";
export type SessionEvent = "START" | "CLOSE" | "RESET";

export interface SessionStateMachine {
  initial: SessionState;
  states: Record<SessionState, SessionStateDefinition>;
  events: Record<SessionEvent, string>;
  guards: Record<string, GuardDefinition>;
}

export interface SessionStateDefinition {
  description: string;
  transitions?: Record<SessionEvent, Transition>;
  terminal?: boolean;
}

// ============================================================================
// ORDER
// ============================================================================

export type OrderState = "OPEN" | "LOCKED" | "PAID" | "CLOSED" | "CANCELED";
export type OrderEvent = "FINALIZE" | "PAY" | "CLOSE" | "CANCEL";

export interface OrderStateMachine {
  initial: OrderState;
  states: Record<OrderState, OrderStateDefinition>;
  events: Record<OrderEvent, string>;
  guards: Record<string, GuardDefinition>;
  effects: Record<string, EffectDefinition>;
}

export interface OrderStateDefinition {
  description: string;
  transitions?: Record<OrderEvent, Transition>;
  terminal?: boolean;
}

// ============================================================================
// PAYMENT
// ============================================================================

export type PaymentState = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELED";
export type PaymentEvent = "CONFIRM" | "FAIL" | "CANCEL" | "RETRY";

export interface PaymentStateMachine {
  initial: PaymentState;
  states: Record<PaymentState, PaymentStateDefinition>;
  events: Record<PaymentEvent, string>;
  effects: Record<string, EffectDefinition>;
}

export interface PaymentStateDefinition {
  description: string;
  transitions?: Record<PaymentEvent, Transition>;
  terminal?: boolean;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface Transition {
  target: string;
  description: string;
  guards?: string[];
  effects?: string[];
}

export interface GuardDefinition {
  description: string;
  type: "business-rule" | "data-constraint" | "system-constraint";
}

export interface EffectDefinition {
  description: string;
  type: "data-mutation" | "side-effect" | "notification";
}

// ============================================================================
// STATE MACHINE EXECUTION
// ============================================================================

export interface StateMachineContext {
  entityId: string;
  currentState: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionRequest {
  entity: "SESSION" | "ORDER" | "PAYMENT";
  entityId: string;
  event: string;
  context?: Record<string, unknown>;
}

export interface TransitionResult {
  success: boolean;
  previousState: string;
  newState: string;
  error?: string;
  guardFailures?: string[];
}


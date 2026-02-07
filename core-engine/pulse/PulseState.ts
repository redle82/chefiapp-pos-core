/**
 * PulseState — Types for the Operational Pulse system
 *
 * Pure types, zero dependencies.
 * The Pulse is a 0-100 score representing the restaurant's operational rhythm.
 */

/** The three operational zones derived from the pulse score */
export type PulseZone = "FLOW_ALTO" | "FLOW_PARCIAL" | "FLOW_BASE";

/** A single pulse reading at a point in time */
export interface PulseSnapshot {
  /** 0-100 composite score */
  readonly score: number;
  /** Derived zone from score */
  readonly zone: PulseZone;
  /** ISO timestamp of calculation */
  readonly timestamp: string;
  /** Breakdown of score components for debugging/analytics */
  readonly components: PulseComponents;
}

/** Individual components that compose the pulse score */
export interface PulseComponents {
  /** Contribution from active orders vs capacity (0-50) */
  readonly orderPressure: number;
  /** Contribution from order velocity in last 30min (0-30) */
  readonly flowRate: number;
  /** Contribution from time-of-day curve (0-20) */
  readonly timeBias: number;
}

/** Input signals consumed by the pulse calculator */
export interface PulseInput {
  /** Number of currently active (open) orders */
  readonly activeOrders: number;
  /** Number of orders created in the last 30 minutes */
  readonly ordersLast30min: number;
  /** Restaurant's declared simultaneous order capacity */
  readonly declaredCapacity: number;
  /** Current hour of day (0-23) */
  readonly hourOfDay: number;
}

/** Thresholds that define zone boundaries — configurable per restaurant */
export interface PulseThresholds {
  /** Score >= this → FLOW_ALTO (default: 70) */
  readonly altoMin: number;
  /** Score >= this → FLOW_PARCIAL (default: 30) */
  readonly parcialMin: number;
  // Below parcialMin → FLOW_BASE
}

/** Historical record for analytics */
export interface PulseHistoryEntry {
  readonly snapshot: PulseSnapshot;
  /** Duration in seconds this zone was sustained */
  readonly durationSec: number;
}

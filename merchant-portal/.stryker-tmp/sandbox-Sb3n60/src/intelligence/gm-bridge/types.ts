/**
 * GM Bridge Protocol
 * 
 * Defines the contract between ChefIApp POS and the external Admin Dashboard.
 * This file is purely type definitions.
 */

// ===================================
// 1. EVENT STREAM
// ===================================

export type GMSeverity = 'info' | 'warning' | 'error' | 'critical';

export type GMEventType =
    | 'ORDER_CREATED' | 'ORDER_SENT_TO_KDS' | 'ORDER_READY' | 'ORDER_CANCELLED'
    | 'STAFF_CHECKIN' | 'STAFF_TASK_ASSIGNED' | 'STAFF_TASK_DONE'
    | 'TABLE_SILENCE_RISK' | 'ITEM_FORGOTTEN_RISK' | 'STAFF_NO_RESPONSE'
    | 'PAYMENT_STATUS_CHANGED' | 'ACCESS_PAUSED' | 'ACCESS_RESTORED'
    | 'ERROR_BOUNDARY_TRIGGERED' | 'OFFLINE_QUEUE_GROWING' | 'REALTIME_DISCONNECTED';

export interface GMEvent {
    event_id: string; // UUID
    ts: number; // Unix timestamp
    project: 'ChefIApp';
    instance_id: string; // Restaurant ID
    environment: 'development' | 'production' | 'staging';
    actor: {
        id: string;
        role: string;
        name?: string;
    };
    severity: GMSeverity;
    type: GMEventType;
    payload: Record<string, any>;
    signature?: string; // HMAC
}

// ===================================
// 2. SNAPSHOT (STATE)
// ===================================

export interface GMSnapshot {
    ts: number;
    instance_id: string;

    identity: {
        name: string;
        city: string;
        timezone: string;
        version: string;
        build: string;
        uptime_seconds: number;
    };

    health: {
        status: 'online' | 'offline' | 'degraded';
        error_count_24h: number;
        latency_ms: number;
        offline_queue_size: number;
    };

    operation: {
        orders_active: number;
        orders_today_count: number;
        avg_prep_time_ms: number; // KDS -> Ready
        revenue_estimated_cents: number;
    };

    risk: {
        tables_at_risk_now: number;
        silent_tables: number;
        forgotten_items_count: number;
        waiter_vanish_count: number;
        avg_time_between_staff_interactions: number; // ms
    };

    staff_ops: {
        staff_on_floor_now: number;
        staff_idle_count: number;
        tasks_generated_count: number;
        tasks_completed_count: number;
        staff_response_score: number; // 0-100
    };

    billing: {
        plan: string;
        status: 'active' | 'past_due' | 'canceled' | 'trial';
        next_billing_at: string;
    };
}

// ===================================
// 3. CONTROL (COMMANDS)
// ===================================

export type GMCommandType =
    | 'SET_SUBSCRIPTION_STATUS'
    | 'FORCE_SYNC_QUEUE'
    | 'REQUEST_DIAGNOSTIC'
    | 'KILL_SWITCH';

export interface GMCommand {
    command_id: string;
    type: GMCommandType;
    instance_id: string;
    args: Record<string, any>;
    issued_at: number;
    signature: string;
}

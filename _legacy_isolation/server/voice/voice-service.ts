/**
 * voice-service.ts — Voice Operations Layer Service
 * 
 * Serviço para gerenciar dispositivos, eventos e rotinas de voz
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface VoiceDevice {
  id: string;
  restaurant_id: string;
  device_name: string;
  device_type: 'alexa' | 'google_home' | 'custom';
  device_id: string;
  location: string;
  enabled: boolean;
  volume: number;
  language: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceEvent {
  id: string;
  restaurant_id: string;
  device_id?: string;
  event_type: string;
  direction: 'system_to_voice' | 'voice_to_system';
  intent?: string;
  spoken_text?: string;
  response_text?: string;
  context: Record<string, any>;
  operational_event_id?: string;
  task_id?: string;
  decision_id?: string;
  status: 'pending' | 'processed' | 'acknowledged' | 'failed';
  processed_at?: string;
  acknowledged_at?: string;
  created_at: string;
  created_by?: string;
}

export interface VoiceRoutine {
  id: string;
  restaurant_id: string;
  device_id?: string;
  routine_name: string;
  routine_type: string;
  schedule_type: 'time' | 'interval' | 'event_triggered';
  schedule_config: Record<string, any>;
  announcement_text: string;
  reminder_text?: string;
  actions: Array<Record<string, any>>;
  enabled: boolean;
  last_executed_at?: string;
  next_execution_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if voice operations are enabled for a restaurant
 */
export async function isVoiceOperationsEnabled(restaurantId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT enabled FROM govern_feature_flags
     WHERE restaurant_id = $1 AND feature_key = 'voice_operations_enabled'`,
    [restaurantId]
  );
  return result.rows[0]?.enabled === true;
}

/**
 * Register a voice device
 */
export async function registerDevice(params: {
  restaurant_id: string;
  device_name: string;
  device_type: 'alexa' | 'google_home' | 'custom';
  device_id: string;
  location: string;
  volume?: number;
  language?: string;
}): Promise<VoiceDevice> {
  const result = await pool.query(
    `INSERT INTO voice_devices (
      restaurant_id, device_name, device_type, device_id, location, volume, language
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (restaurant_id, device_id) 
    DO UPDATE SET 
      device_name = EXCLUDED.device_name,
      location = EXCLUDED.location,
      volume = EXCLUDED.volume,
      language = EXCLUDED.language,
      last_seen_at = NOW(),
      updated_at = NOW()
    RETURNING *`,
    [
      params.restaurant_id,
      params.device_name,
      params.device_type,
      params.device_id,
      params.location,
      params.volume || 50,
      params.language || 'pt-BR',
    ]
  );
  return result.rows[0];
}

/**
 * Create a voice event
 */
export async function createVoiceEvent(params: {
  restaurant_id: string;
  device_id?: string;
  event_type: string;
  direction: 'system_to_voice' | 'voice_to_system';
  intent?: string;
  spoken_text?: string;
  response_text?: string;
  context?: Record<string, any>;
  created_by?: string;
}): Promise<VoiceEvent> {
  // Check feature flag
  const enabled = await isVoiceOperationsEnabled(params.restaurant_id);
  if (!enabled && params.direction === 'system_to_voice') {
    throw new Error('Voice operations are disabled for this restaurant');
  }

  const result = await pool.query(
    `INSERT INTO voice_events (
      restaurant_id, device_id, event_type, direction, intent, spoken_text, response_text, context, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      params.restaurant_id,
      params.device_id || null,
      params.event_type,
      params.direction,
      params.intent || null,
      params.spoken_text || null,
      params.response_text || null,
      params.context || {},
      params.created_by || null,
    ]
  );
  return result.rows[0];
}

/**
 * Acknowledge a voice event
 */
export async function acknowledgeVoiceEvent(
  eventId: string,
  params: {
    acknowledged_by?: string;
    acknowledgment_type: 'voice' | 'manual' | 'automatic';
    acknowledgment_text?: string;
  }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update voice event
    await client.query(
      `UPDATE voice_events
       SET status = 'acknowledged', acknowledged_at = NOW()
       WHERE id = $1`,
      [eventId]
    );

    // Create acknowledgment log
    const event = await client.query('SELECT restaurant_id, device_id FROM voice_events WHERE id = $1', [eventId]);
    if (event.rows[0]) {
      await client.query(
        `INSERT INTO voice_acknowledgments (
          restaurant_id, voice_event_id, device_id, acknowledged_by, acknowledgment_type, acknowledgment_text
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          event.rows[0].restaurant_id,
          eventId,
          event.rows[0].device_id || null,
          params.acknowledged_by || null,
          params.acknowledgment_type,
          params.acknowledgment_text || null,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Get voice routines for a restaurant
 */
export async function getVoiceRoutines(restaurantId: string): Promise<VoiceRoutine[]> {
  const result = await pool.query(
    `SELECT * FROM voice_routines
     WHERE restaurant_id = $1
     ORDER BY routine_name`,
    [restaurantId]
  );
  return result.rows;
}

/**
 * Toggle a voice routine
 */
export async function toggleVoiceRoutine(routineId: string, enabled: boolean): Promise<VoiceRoutine> {
  const result = await pool.query(
    `UPDATE voice_routines
     SET enabled = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [enabled, routineId]
  );
  return result.rows[0];
}

/**
 * Get voice status for a location
 */
export interface VoiceStatus {
  enabled: boolean;
  devices: VoiceDevice[];
  routines: VoiceRoutine[];
  pending_acks: number;
  last_triggered_routine?: {
    routine_id: string;
    routine_name: string;
    triggered_at: string;
  };
}

export async function getVoiceStatus(restaurantId: string, locationId?: string): Promise<VoiceStatus> {
  // Check if voice operations is enabled
  const enabled = await isVoiceOperationsEnabled(restaurantId);

  const devicesQuery = locationId
    ? `SELECT * FROM voice_devices WHERE restaurant_id = $1 AND location = $2 AND enabled = true`
    : `SELECT * FROM voice_devices WHERE restaurant_id = $1 AND enabled = true`;
  const devicesParams = locationId ? [restaurantId, locationId] : [restaurantId];

  const devices = await pool.query(devicesQuery, devicesParams);
  const routines = await pool.query(
    `SELECT * FROM voice_routines WHERE restaurant_id = $1 AND enabled = true`,
    [restaurantId]
  );
  const pendingAcks = await pool.query(
    `SELECT COUNT(*) as count FROM voice_events
     WHERE restaurant_id = $1 AND status = 'pending' AND direction = 'system_to_voice'`,
    [restaurantId]
  );
  const lastRoutine = await pool.query(
    `SELECT r.id, r.routine_name, r.last_executed_at
     FROM voice_routines r
     WHERE r.restaurant_id = $1 AND r.enabled = true AND r.last_executed_at IS NOT NULL
     ORDER BY r.last_executed_at DESC
     LIMIT 1`,
    [restaurantId]
  );

  return {
    enabled,
    devices: devices.rows,
    routines: routines.rows,
    pending_acks: parseInt(pendingAcks.rows[0]?.count || '0'),
    last_triggered_routine: lastRoutine.rows[0] ? {
      routine_id: lastRoutine.rows[0].id,
      routine_name: lastRoutine.rows[0].routine_name,
      triggered_at: lastRoutine.rows[0].last_executed_at,
    } : undefined,
  };
}


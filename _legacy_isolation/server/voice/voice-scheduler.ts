/**
 * voice-scheduler.ts — Voice Operations Scheduler
 * 
 * Worker que executa rotinas de voz agendadas
 */

import { Pool } from 'pg';
import { emitEvent } from '../operational-event-bus/event-bus';
import { createVoiceEvent, type VoiceRoutine } from './voice-service';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEDULER_INTERVAL_MS = 60000; // 60 segundos
const ACK_TIMEOUT_MINUTES = 5; // 5 minutos para confirmar lembrete

/**
 * Calculate next execution time for a routine
 */
function calculateNextExecution(routine: {
  schedule_type: 'time' | 'interval' | 'event_triggered';
  schedule_config: Record<string, any>;
  last_executed_at?: string;
}): Date | null {
  const now = new Date();

  if (routine.schedule_type === 'time') {
    // Daily at specific time (e.g., "08:00")
    const timeStr = routine.schedule_config.time || '08:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    // If time already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (routine.schedule_type === 'interval') {
    // Every X minutes
    const intervalMinutes = routine.schedule_config.interval_minutes || 30;
    const lastExecuted = routine.last_executed_at ? new Date(routine.last_executed_at) : now;
    const next = new Date(lastExecuted);
    next.setMinutes(next.getMinutes() + intervalMinutes);
    
    // If next execution is in the past, schedule for now + interval
    if (next <= now) {
      return new Date(now.getTime() + intervalMinutes * 60 * 1000);
    }
    return next;
  }

  // event_triggered routines are handled by event handlers, not scheduler
  return null;
}

/**
 * Generate dedupe key for a routine execution
 */
function generateDedupeKey(routineId: string, dateBucket: string, slot: string): string {
  return `voice_routine_${routineId}_${dateBucket}_${slot}`;
}

/**
 * Execute a voice routine
 */
async function executeRoutine(routine: {
  id: string;
  restaurant_id: string;
  device_id?: string;
  routine_name: string;
  announcement_text: string;
  actions: Array<Record<string, any>>;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check feature flag
    const flagResult = await client.query(
      `SELECT enabled FROM govern_feature_flags
       WHERE restaurant_id = $1 AND feature_key = 'voice_operations_enabled'`,
      [routine.restaurant_id]
    );
    if (!flagResult.rows[0]?.enabled) {
      console.log(`[Voice Scheduler] Voice operations disabled for restaurant ${routine.restaurant_id}`);
      await client.query('ROLLBACK');
      return;
    }

    // Create voice event
    const voiceEvent = await createVoiceEvent({
      restaurant_id: routine.restaurant_id,
      device_id: routine.device_id || undefined,
      event_type: routine.routine_name.toLowerCase().replace(/\s+/g, '_'),
      direction: 'system_to_voice',
      response_text: routine.announcement_text,
      context: {
        routine_id: routine.id,
        routine_name: routine.routine_name,
      },
    });

    // Emit Event Bus event
    await emitEvent({
      restaurant_id: routine.restaurant_id,
      event_type: 'voice_reminder',
      priority: 'P2',
      source_module: 'voice',
      source_id: voiceEvent.id,
      context: {
        routine_id: routine.id,
        routine_name: routine.routine_name,
        announcement_text: routine.announcement_text,
        voice_event_id: voiceEvent.id,
      },
      target_roles: ['kitchen', 'staff'],
      auto_route: true,
      dedupe_key: generateDedupeKey(
        routine.id,
        new Date().toISOString().split('T')[0],
        routine.routine_name
      ),
    });

    // Execute actions (create tasks, etc.)
    for (const action of routine.actions) {
      if (action.type === 'create_task') {
        // Task creation is handled by Event Bus routing rules
        console.log(`[Voice Scheduler] Action: create_task for ${action.target}`);
      } else if (action.type === 'emit_event') {
        await emitEvent({
          restaurant_id: routine.restaurant_id,
          event_type: action.config.event_type,
          priority: action.config.priority || 'P2',
          source_module: 'voice',
          source_id: voiceEvent.id,
          context: action.config.context || {},
          auto_route: true,
        });
      }
    }

    // Update routine
    const nextExecution = calculateNextExecution({
      schedule_type: routine.routine_name.includes('Abertura') ? 'time' : 'interval',
      schedule_config: {},
      last_executed_at: new Date().toISOString(),
    });

    await client.query(
      `UPDATE voice_routines
       SET last_executed_at = NOW(), next_execution_at = $1
       WHERE id = $2`,
      [nextExecution, routine.id]
    );

    await client.query('COMMIT');
    console.log(`[Voice Scheduler] Executed routine: ${routine.routine_name}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`[Voice Scheduler] Error executing routine ${routine.id}:`, e);
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Check for unacknowledged reminders and escalate
 */
async function checkAckTimeouts(): Promise<void> {
  const timeoutThreshold = new Date();
  timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - ACK_TIMEOUT_MINUTES);

  const unacked = await pool.query(
    `SELECT ve.*, vr.routine_name
     FROM voice_events ve
     LEFT JOIN voice_routines vr ON vr.id = (ve.context->>'routine_id')::uuid
     WHERE ve.direction = 'system_to_voice'
       AND ve.status = 'pending'
       AND ve.created_at < $1`,
    [timeoutThreshold.toISOString()]
  );

  for (const event of unacked.rows) {
    // Emit timeout event
    await emitEvent({
      restaurant_id: event.restaurant_id,
      event_type: 'voice_ack_timeout',
      priority: 'P1',
      source_module: 'voice',
      source_id: event.id,
      context: {
        voice_event_id: event.id,
        routine_name: event.routine_name,
        timeout_minutes: ACK_TIMEOUT_MINUTES,
      },
      target_roles: ['manager'],
      auto_route: true,
    });

    console.log(`[Voice Scheduler] Escalated unacknowledged reminder: ${event.id}`);
  }
}

/**
 * Main scheduler loop
 */
export async function runVoiceScheduler(): Promise<void> {
  try {
    // Get all active routines that are due
    const now = new Date();
    const dueRoutines = await pool.query(
      `SELECT * FROM voice_routines
       WHERE enabled = true
         AND (next_execution_at IS NULL OR next_execution_at <= $1)
       ORDER BY next_execution_at ASC NULLS FIRST`,
      [now.toISOString()]
    );

    for (const routine of dueRoutines.rows) {
      // Check deduplication
      const dateBucket = now.toISOString().split('T')[0];
      const slot = routine.routine_name;
      const dedupeKey = generateDedupeKey(routine.id, dateBucket, slot);

      const existing = await pool.query(
        `SELECT id FROM operational_events
         WHERE dedupe_key = $1
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [dedupeKey]
      );

      if (existing.rows.length > 0) {
        console.log(`[Voice Scheduler] Skipping duplicate: ${routine.routine_name}`);
        continue;
      }

      await executeRoutine(routine);
    }

    // Check for ack timeouts
    await checkAckTimeouts();
  } catch (e) {
    console.error('[Voice Scheduler] Error in scheduler loop:', e);
  }
}

/**
 * Start the scheduler
 */
export function startVoiceScheduler(): void {
  console.log('[Voice Scheduler] Starting scheduler (interval: 60s)');
  
  // Run immediately
  runVoiceScheduler();

  // Then run every 60 seconds
  setInterval(() => {
    runVoiceScheduler();
  }, SCHEDULER_INTERVAL_MS);
}


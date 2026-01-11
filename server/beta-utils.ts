/**
 * Beta Readiness Utilities
 * - Magic Link Authentication
 * - Structured Audit Logging
 * - Slug Validation
 */

import crypto from 'crypto';
import type { Pool, PoolClient } from 'pg';

// ============================================================================
// MAGIC LINK AUTHENTICATION
// ============================================================================

export interface MagicLinkToken {
  id: string;
  email: string;
  token: string;
  restaurant_id: string | null;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/**
 * Generate and store a magic link token
 * Returns the token to be sent via email
 */
export async function createMagicLinkToken(
  pool: Pool,
  email: string,
  expiresInMinutes: number = 15
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await pool.query(
    `insert into auth_magic_tokens (email, token, expires_at)
     values ($1, $2, $3)`,
    [email, token, expiresAt]
  );

  return token;
}

/**
 * Verify a magic link token and mark it as used
 * Returns restaurant_id if token is valid and not expired
 */
export async function verifyMagicLinkToken(
  pool: Pool,
  token: string
): Promise<{ valid: boolean; email?: string; restaurant_id?: string | null }> {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const { rows } = await client.query<MagicLinkToken>(
      `select * from auth_magic_tokens
       where token = $1
         and expires_at > now()
         and used_at is null
       limit 1`,
      [token]
    );

    if (rows.length === 0) {
      await client.query('rollback');
      return { valid: false };
    }

    const tokenRecord = rows[0];

    // Mark as used
    await client.query(
      `update auth_magic_tokens
       set used_at = now()
       where id = $1`,
      [tokenRecord.id]
    );

    await client.query('commit');

    return {
      valid: true,
      email: tokenRecord.email,
      restaurant_id: tokenRecord.restaurant_id,
    };
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Link a magic token to a restaurant (after onboarding creates one)
 */
export async function linkTokenToRestaurant(
  client: PoolClient,
  email: string,
  restaurantId: string
): Promise<void> {
  await client.query(
    `update auth_magic_tokens
     set restaurant_id = $1
     where email = $2
       and restaurant_id is null
       and created_at > now() - interval '1 hour'`,
    [restaurantId, email]
  );
}

// ============================================================================
// STRUCTURED AUDIT LOGGING
// ============================================================================

export interface AuditEvent {
  restaurant_id: string;
  event_type: string;
  event_data: Record<string, any>;
}

/**
 * Log structured event for beta observation
 * Critical events: onboarding_start, identity_complete, menu_complete, etc.
 */
export async function logAuditEvent(
  pool: Pool,
  restaurantId: string,
  eventType: string,
  eventData: Record<string, any> = {}
): Promise<void> {
  try {
    await pool.query(
      `insert into onboarding_audit_log (restaurant_id, event_type, event_data)
       values ($1, $2, $3)`,
      [restaurantId, eventType, JSON.stringify(eventData)]
    );

    // Also log to console for immediate visibility (dev/beta)
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] ${timestamp} | ${restaurantId.substring(0, 8)} | ${eventType}`, eventData);
  } catch (e) {
    // Non-blocking: if audit log fails, don't break the main flow
    console.error('[AUDIT ERROR]', e);
  }
}

/**
 * Get audit log for a restaurant (for beta dashboard)
 */
export async function getAuditLog(
  pool: Pool,
  restaurantId: string,
  limit: number = 50
): Promise<AuditEvent[]> {
  const { rows } = await pool.query(
    `select restaurant_id, event_type, event_data, created_at
     from onboarding_audit_log
     where restaurant_id = $1
     order by created_at desc
     limit $2`,
    [restaurantId, limit]
  );

  return rows.map((r: any) => ({
    restaurant_id: r.restaurant_id,
    event_type: r.event_type,
    event_data: r.event_data || {},
    created_at: r.created_at,
  }));
}

// ============================================================================
// SLUG VALIDATION
// ============================================================================

/**
 * Check if slug is already taken
 * Returns true if available, false if taken
 */
export async function isSlugAvailable(pool: Pool, slug: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from restaurant_web_profiles
     where slug = $1
     limit 1`,
    [slug]
  );

  return rows.length === 0;
}

/**
 * Generate unique slug with fallback suffix if taken
 */
export async function generateUniqueSlug(
  pool: Pool,
  baseSlug: string,
  maxAttempts: number = 10
): Promise<string> {
  // Try base slug first
  if (await isSlugAvailable(pool, baseSlug)) {
    return baseSlug;
  }

  // Try with numeric suffixes
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (await isSlugAvailable(pool, candidate)) {
      return candidate;
    }
  }

  // Last resort: add random hex
  const randomSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
  return randomSlug;
}

/**
 * Validate and reserve slug (transactional)
 * Throws error if slug is invalid or taken
 */
export async function validateAndReserveSlug(
  client: PoolClient,
  slug: string,
  restaurantId: string
): Promise<void> {
  // Check format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('SLUG_INVALID_FORMAT');
  }

  if (slug.length < 3 || slug.length > 63) {
    throw new Error('SLUG_INVALID_LENGTH');
  }

  // Reserved slugs
  const reserved = ['api', 'admin', 'internal', 'public', 'health', 'webhook'];
  if (reserved.includes(slug)) {
    throw new Error('SLUG_RESERVED');
  }

  // Check availability
  const { rows } = await client.query(
    `select restaurant_id from restaurant_web_profiles
     where slug = $1
     limit 1`,
    [slug]
  );

  if (rows.length > 0 && rows[0].restaurant_id !== restaurantId) {
    throw new Error('SLUG_TAKEN');
  }
}

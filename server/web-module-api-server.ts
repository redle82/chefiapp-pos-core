import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Pool } from 'pg';
import crypto from 'crypto';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import { FeatureGateService, type WebPageLevel } from '../billing-core/FeatureGateService';
import { StripeGatewayAdapterV2 } from '../gateways/StripeGatewayAdapterV2';
import type { GatewayCredentials } from '../gateways/PaymentGatewayInterface';
import { handlePaymentWebhook, jsonResponse, readRawBody } from '../gateways/WebhookHandlers';
import type { CoreEvent } from '../event-log/types';
import { rebuildState } from '../projections';

// P1 FIX: Import security middleware
import {
  checkRateLimit,
  getHealthStatus,
  trackMetrics,
  wrapRequest,
  CircuitBreaker,
  configurePoolTimeouts,
} from './middleware/security';

import { getSubscriptionContextFromStripe } from './billing-context';
import { WebOrderItemInputSchema, PickupTypeEnum, OnboardingStartSchema, OnboardingConfirmSchema } from '../web-module/contracts';
import { PaymentInvariants } from '../web-module/OrderStateMachine';
import { renderWebPreviewHtml, renderWebPreviewIndexHtml, renderHomePage } from './web-page-previews';
import {
  emitWebOrderCreatedTx,
  emitWebPaymentConfirmedTx,
  emitWebPaymentFailedTx,
  getWebSessionIdForRestaurant,
} from './web-to-pos-bridge';
import {
  createMagicLinkToken,
  verifyMagicLinkToken,
  linkTokenToRestaurant,
  logAuditEvent,
  getAuditLog,
  isSlugAvailable,
  generateUniqueSlug,
  validateAndReserveSlug,
} from './beta-utils';
import { RestaurantGroupService } from './restaurant-group-service';

dotenv.config({ override: false });

const PORT = Number(process.env.WEB_MODULE_PORT || 4320);
const DATABASE_URL = process.env.DATABASE_URL;

// ChefI billing stripe (para gates)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Sofía / single-restaurant dev mapping (MVP)
const WEB_MODULE_RESTAURANT_ID = process.env.WEB_MODULE_RESTAURANT_ID;
const BILLING_STRIPE_SUBSCRIPTION_ID = process.env.BILLING_STRIPE_SUBSCRIPTION_ID;
const MERCHANT_STRIPE_KEY = process.env.MERCHANT_STRIPE_KEY;
const MERCHANT_STRIPE_WEBHOOK_SECRET = process.env.MERCHANT_STRIPE_WEBHOOK_SECRET;
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;
const CREDENTIALS_ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required');
  process.exit(1);
}

// P1 FIX: Configure pool with timeouts (30s query, 15min idle)
const pool = new Pool({ connectionString: DATABASE_URL, max: 20, idleTimeoutMillis: 900000 });
configurePoolTimeouts(pool);

const billingStripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// P1 FIX: Circuit breakers para serviços externos
const stripeCircuitBreaker = new CircuitBreaker('stripe', 5, 2, 60000);
const marketplaceCircuitBreaker = new CircuitBreaker('marketplaces', 5, 2, 60000);

function getEncryptionKeyOrThrow(): Buffer {
  const env = String(CREDENTIALS_ENCRYPTION_KEY || '').trim();
  if (env) {
    // Accept hex (64 chars) or base64.
    if (/^[0-9a-fA-F]{64}$/.test(env)) return Buffer.from(env, 'hex');
    const b = Buffer.from(env, 'base64');
    if (b.length === 32) return b;
    throw new Error('CREDENTIALS_ENCRYPTION_KEY_INVALID');
  }

  // Fail-closed in production.
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY_REQUIRED');
  }

  // Dev fallback: derive from internal token (or static) to keep demo working.
  const seed = INTERNAL_API_TOKEN || 'dev-insecure-key';
  return crypto.createHash('sha256').update(seed).digest();
}

function encryptSecret(plaintext: string): Buffer {
  const key = getEncryptionKeyOrThrow();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext || ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // payload = iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

function decryptSecret(payload: Buffer | null | undefined): string {
  if (!payload || payload.length < 12 + 16) return '';
  const key = getEncryptionKeyOrThrow();
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

function sendJSON(res: http.ServerResponse, code: number, payload: any) {
  const requestId = res.getHeader('X-Request-Id');
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Stripe-Signature,X-Internal-Token',
    ...(requestId ? { 'X-Request-Id': String(requestId) } : {}),
  });
  res.end(JSON.stringify(payload));
}

function sendHTML(res: http.ServerResponse, code: number, html: string) {
  const requestId = res.getHeader('X-Request-Id');
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Stripe-Signature,X-Internal-Token',
    ...(requestId ? { 'X-Request-Id': String(requestId) } : {}),
  });
  res.end(html);
}

function slugify(input: string): string {
  const s = String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const cleaned = s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .replace(/-{2,}/g, '-');
  return cleaned || 'restaurante';
}

function isInternalAuthorized(req: http.IncomingMessage): boolean {
  if (!INTERNAL_API_TOKEN) {
    // Fail-closed in production.
    if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') return false;
    return true; // dev default
  }
  const token = String(req.headers['x-internal-token'] || '');
  return token === INTERNAL_API_TOKEN;
}

// Helper for Session Auth (Phase H)
function isSessionAuthorized(req: http.IncomingMessage): string | null {
  const token = String(req.headers['x-chefiapp-token'] || '').trim();
  if (!token) return null;
  // MVP: token === restaurant_id check or any valid token logic
  return token;
}

// Helper to get userId from request (for restaurant groups)
// TODO: In production, this should validate Supabase session token
async function getUserIdFromRequest(req: http.IncomingMessage): Promise<string | null> {
  // Try header first (most reliable)
  const userIdHeader = String(req.headers['x-user-id'] || '').trim();
  if (userIdHeader) return userIdHeader;

  // Try to extract from token (MVP: token might contain userId)
  const token = String(req.headers['x-chefiapp-token'] || '').trim();
  if (token) {
    // MVP: For now, try to get email from auth_magic_tokens table
    // Then try to find user by email in auth.users
    try {
      const tokenResult = await pool.query(
        `SELECT email FROM auth_magic_tokens WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL LIMIT 1`,
        [token]
      );
      if (tokenResult.rows.length > 0) {
        const email = tokenResult.rows[0].email;
        // Try to find user by email in auth.users
        // Note: This requires access to auth.users schema (Supabase)
        const userResult = await pool.query(
          `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
          [email]
        );
        if (userResult.rows.length > 0) {
          return userResult.rows[0].id;
        }
      }
    } catch (e) {
      // Ignore errors, fall through
      // In production, this should use proper Supabase auth validation
      console.warn('[getUserIdFromRequest] Error resolving userId:', e);
    }
  }

  return null;
}


// ============================================================================


function normalizeIdempotencyKey(key: string): string {
  const trimmed = String(key || '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= 200) return trimmed;
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

function getIdempotencyKeyFromRequest(req: http.IncomingMessage, bodyKey?: string | null): string | null {
  const headerKey = String(req.headers['idempotency-key'] || '').trim();
  const candidate = headerKey || String(bodyKey || '').trim();
  const normalized = normalizeIdempotencyKey(candidate);
  return normalized ? normalized : null;
}

async function loadWebProjectionForRestaurant(restaurantId: string) {
  const { rows } = await pool.query(
    `select
        sequence_id,
        event_id,
        stream_type,
        stream_id,
        stream_version,
        event_type,
        payload,
        meta,
        created_at
     from event_store
     where payload->>'origin' = 'WEB'
       and payload->>'restaurant_id' = $1
     order by sequence_id asc`,
    [restaurantId]
  );

  const events: CoreEvent[] = rows.map((r: any) => {
    const meta = (r.meta || {}) as Record<string, any>;
    return {
      event_id: String(r.event_id),
      stream_id: `${String(r.stream_type)}:${String(r.stream_id)}`,
      stream_version: Number(r.stream_version),
      type: String(r.event_type) as any,
      payload: (r.payload || {}) as any,
      occurred_at: new Date(r.created_at),
      causation_id: meta.causation_id,
      correlation_id: meta.correlation_id,
      actor_ref: meta.actor_ref,
      idempotency_key: meta.idempotency_key,
      hash: meta.hash,
      hash_prev: meta.hash_prev,
    };
  });

  return rebuildState(events);
}

async function readJsonBody(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function getBillingContextForRestaurant(restaurantId: string) {
  const companyId = await getCompanyIdForRestaurant(restaurantId);
  return getBillingContextForCompany(companyId);
}

async function getBillingContextForCompany(companyId: string | null) {
  // Check for dev bypass if Stripe is not configured
  if (!billingStripe || !BILLING_STRIPE_SUBSCRIPTION_ID) {
    // Only allow in non-production environments
    if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
      console.warn('⚠️  Mocking Billing Context (Dev Mode) - Stripe keys missing');
      return {
        company_id: companyId,
        status: 'ACTIVE' as const,
        tier: 'ENTERPRISE' as const, // Unlock everything for demo
        addons: ['WEB_PAGE', 'WEB_EXPERIENCE', 'RESERVATIONS'] as any[],
        raw_status: 'mock_active',
      };
    }
    return null;
  }

  const subscriptionId = BILLING_STRIPE_SUBSCRIPTION_ID;
  if (!subscriptionId) return null;
  const ctx = await getSubscriptionContextFromStripe(billingStripe, subscriptionId);
  return { company_id: companyId, status: ctx.status, tier: ctx.tier, addons: ctx.addons };
}

async function getCompanyIdForRestaurant(restaurantId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `select coalesce(company_id, restaurant_id) as company_id
     from restaurant_web_profiles
     where restaurant_id = $1
     limit 1`,
    [restaurantId]
  );
  if (rows.length === 0) return null;
  return rows[0]?.company_id ? String(rows[0].company_id) : null;
}

async function getMerchantGatewayCredentials(restaurantId: string): Promise<GatewayCredentials | null> {
  if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return null;

  // Prefer DB-stored merchant credentials (wizard connect)
  try {
    const { rows } = await pool.query(
      `select gateway, secret_key_enc, webhook_secret_enc
       from merchant_gateway_credentials
       where restaurant_id = $1
       limit 1`,
      [restaurantId]
    );
    if (rows.length > 0) {
      const r = rows[0];
      const apiKey = decryptSecret(r.secret_key_enc);
      const webhookSecret = r.webhook_secret_enc ? decryptSecret(r.webhook_secret_enc) : null;
      if (apiKey) {
        return {
          api_key: apiKey,
          webhook_secret: webhookSecret,
          gateway: 'STRIPE',
        } as any;
      }
    }
  } catch {
    // If table doesn't exist yet locally, fallback to env.
  }

  // Dev fallback (env-based single restaurant)
  if (!MERCHANT_STRIPE_KEY) return null;
  return {
    api_key: MERCHANT_STRIPE_KEY,
    webhook_secret: MERCHANT_STRIPE_WEBHOOK_SECRET,
    gateway: 'STRIPE',
  } as any;
}

async function enforceWebPageGateOrThrow(restaurantId: string) {
  const context = await getBillingContextForRestaurant(restaurantId);
  if (!context) {
    throw new Error('BILLING_CONTEXT_UNAVAILABLE');
  }
  if (!FeatureGateService.hasFeature(context as any, 'WEB_PAGE')) {
    const msg = FeatureGateService.getBlockedMessage(context as any, 'WEB_PAGE');
    const err: any = new Error('FEATURE_BLOCKED');
    err.code = 'FEATURE_BLOCKED';
    err.message = msg;
    throw err;
  }

  return context;
}

function assertWebLevelOrThrow(context: any, webLevel: WebPageLevel) {
  if (!FeatureGateService.canUseWebPageLevel(context, webLevel)) {
    const err: any = new Error('WEB_LEVEL_BLOCKED');
    err.code = 'WEB_LEVEL_BLOCKED';
    err.web_level = webLevel;
    if (webLevel === 'PRO') {
      err.message = 'Esta funcionalidade faz parte do Web Pro. Faça upgrade para ENTERPRISE.';
    } else if (webLevel === 'EXPERIENCE') {
      err.message = 'Esta funcionalidade faz parte do Web Experience. Ative o add-on premium WEB_EXPERIENCE e use ENTERPRISE.';
    } else {
      err.message = 'Nível de Web Page indisponível no seu plano.';
    }
    throw err;
  }
}

async function getPublishedRestaurantBySlug(slug: string) {
  console.log(`[DEBUG] getPublishedRestaurantBySlug looking for slug: "${slug}"`);
  const { rows } = await pool.query(
    `select restaurant_id, company_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones
     from restaurant_web_profiles
     where slug = $1`,
    [slug]
  );
  console.log(`[DEBUG] Found rows: ${rows.length}`, rows[0] ? `Status: ${rows[0].status}, Slug: ${rows[0].slug}` : 'None');
  if (rows.length === 0) return null;
  return rows[0] as {
    restaurant_id: string;
    company_id: string | null;
    slug: string;
    domain: string | null;
    status: 'draft' | 'published';
    theme: string;
    web_level: WebPageLevel;
    hero: any;
    highlights: any;
    contacts: any;
    delivery_zones: any;
  };
}

async function getMenuForRestaurant(restaurantId: string) {
  const categories = await pool.query(
    `select id, restaurant_id, name, position
     from menu_categories
     where restaurant_id = $1
     order by position asc, created_at asc`,
    [restaurantId]
  );
  const items = await pool.query(
    `select id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active
     from menu_items
     where restaurant_id = $1 and is_active = true
     order by created_at asc`,
    [restaurantId]
  );
  return { categories: categories.rows, items: items.rows };
}

async function ensureWebProfileExistsTx(
  client: any,
  restaurantId: string,
  preferredSlug: string,
  initialHero?: any,
  initialContacts?: any
) {
  const existing = await client.query(
    `select restaurant_id, slug, status, theme, web_level, hero, contacts, highlights
     from restaurant_web_profiles
     where restaurant_id = $1
     limit 1`,
    [restaurantId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const baseSlug = slugify(preferredSlug);
  const slugA = baseSlug;
  const slugB = `${baseSlug}-${slugify(restaurantId).slice(0, 6)}`;

  const insertWithSlug = async (slug: string) => {
    return client.query(
      `insert into restaurant_web_profiles(restaurant_id, slug, status, theme, hero, contacts, highlights)
       values ($1,$2,'draft','minimal',$3,$4,$5)
       returning restaurant_id, slug, status, theme, web_level, hero, contacts, highlights`,
      [restaurantId, slug, JSON.stringify(initialHero || {}), JSON.stringify(initialContacts || {}), JSON.stringify({})]
    );
  };

  try {
    const r = await insertWithSlug(slugA);
    return r.rows[0];
  } catch (e: any) {
    // slug unique conflict fallback
    if (String(e?.code) !== '23505') throw e;
    const r2 = await insertWithSlug(slugB);
    return r2.rows[0];
  }
}

function mergeObjects(a: any, b: any) {
  const A = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
  const B = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  return { ...A, ...B };
}

function mergeIdentity(existing: { hero: any; contacts: any; highlights: any }, patch: any) {
  const heroPatch = patch?.hero || {};
  const contactsPatch = patch?.contacts || {};
  const linksPatch = patch?.links || (contactsPatch?.links || {});

  const hero = mergeObjects(existing.hero, heroPatch);
  const contacts = mergeObjects(existing.contacts, contactsPatch);
  contacts.links = mergeObjects((existing.contacts || {}).links, linksPatch);

  // Google-specific metadata goes into highlights (safe to render) + contacts (for later editing)
  const highlights = mergeObjects(existing.highlights, patch?.highlights || {});
  if (patch?.google_place_id) contacts.google_place_id = String(patch.google_place_id);
  if (patch?.google_import_data) contacts.google_import_data = patch.google_import_data;

  // Normalize common fields
  if (patch?.name) hero.title = String(patch.name);
  if (patch?.tagline) hero.subtitle = String(patch.tagline);
  if (patch?.logo_url) hero.logo_url = String(patch.logo_url);
  if (patch?.hero_image_url) hero.image_url = String(patch.hero_image_url);

  return { hero, contacts, highlights };
}

const CreateWebOrderRequestSchema = z.object({
  pickup_type: z.enum(PickupTypeEnum).optional(),
  table_ref: z.string().min(1).optional().nullable(),
  customer_contact: z.unknown().optional().nullable(),
  delivery_address: z.unknown().optional().nullable(),
  notes: z.string().optional().nullable(),
  currency: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).max(200).optional(),
  items: z.array(WebOrderItemInputSchema).min(1),
});

async function createWebOrderAndPaymentIntent(params: {
  restaurantId: string;
  pickup_type: any;
  table_ref: string | null;
  customer_contact: any;
  delivery_address: any;
  notes: string | null;
  currency?: string;
  idempotency_key?: string | null;
  items: Array<{ menu_item_id: string; qty: number }>;
}) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const sessionId = getWebSessionIdForRestaurant(params.restaurantId);
    const companyId = await getCompanyIdForRestaurant(params.restaurantId);

    const idempotencyKey = params.idempotency_key ? normalizeIdempotencyKey(params.idempotency_key) : '';
    if (idempotencyKey) {
      const existing = await client.query(
        `select id, total_cents, currency
         from web_orders
         where restaurant_id = $1 and idempotency_key = $2
         limit 1`,
        [params.restaurantId, idempotencyKey]
      );
      if (existing.rows.length > 0) {
        const orderId = String(existing.rows[0].id);
        const totalCents = Number(existing.rows[0].total_cents || 0);
        const currency = String(existing.rows[0].currency || 'eur').toUpperCase();
        const pay = await client.query(
          `select intent_id, client_secret, status
           from payment_intent_refs
           where order_id = $1 and provider = 'STRIPE'
           order by created_at desc
           limit 1`,
          [orderId]
        );
        await client.query('commit');
        const p = pay.rows[0];
        return {
          order_id: orderId,
          session_id: sessionId,
          total_cents: totalCents,
          currency,
          payment_intent: p
            ? {
              provider: 'STRIPE',
              intent_id: String(p.intent_id),
              client_secret: p.client_secret ? String(p.client_secret) : null,
              status: String(p.status || 'CREATED'),
            }
            : null,
          idempotency_key: idempotencyKey,
        };
      }
    }

    // Carregar itens e snapshot
    const ids = params.items.map(i => i.menu_item_id);
    const { rows: menuRows } = await client.query(
      `select id, name, price_cents, currency
       from menu_items
       where restaurant_id = $1 and id = any($2::uuid[]) and is_active = true`,
      [params.restaurantId, ids]
    );

    if (menuRows.length !== ids.length) {
      const missing = new Set(ids);
      for (const r of menuRows) missing.delete(r.id);
      throw Object.assign(new Error('MENU_ITEM_NOT_FOUND'), { code: 'MENU_ITEM_NOT_FOUND', missing: Array.from(missing) });
    }

    const byId = new Map<string, { id: string; name: string; price_cents: number; currency: string }>();
    for (const r of menuRows) byId.set(r.id, r);

    const currencies = new Set<string>();
    for (const r of menuRows) currencies.add(String(r.currency || '').toUpperCase());
    if (currencies.size !== 1) {
      throw Object.assign(new Error('MIXED_CURRENCY_NOT_SUPPORTED'), { code: 'MIXED_CURRENCY_NOT_SUPPORTED' });
    }
    const currency = (params.currency || Array.from(currencies)[0] || 'EUR').toUpperCase();

    let totalCents = 0;
    for (const item of params.items) {
      const mi = byId.get(item.menu_item_id)!;
      totalCents += mi.price_cents * item.qty;
    }

    // Criar order
    const orderRes = await client.query(
      `insert into web_orders(
        restaurant_id, company_id, source, status, payment_status, pickup_type,
        table_ref, customer_contact, delivery_address, notes,
        currency, total_cents, idempotency_key
      ) values ($1,$2,'WEB','PLACED','REQUIRES_PAYMENT',$3,$4,$5,$6,$7,$8,$9,$10)
      returning id, payment_status`,
      [
        params.restaurantId,
        companyId,
        params.pickup_type || 'TAKEAWAY',
        params.table_ref,
        params.customer_contact,
        params.delivery_address,
        params.notes,
        currency.toLowerCase(),
        totalCents,
        idempotencyKey || null,
      ]
    );
    const orderId = orderRes.rows[0].id as string;

    // Itens snapshot
    const coreItems: Array<{ item_id: string; product_id: string; name: string; quantity: number; price_snapshot_cents: number }> = [];
    for (const item of params.items) {
      const mi = byId.get(item.menu_item_id)!;
      const itemId = uuid();
      await client.query(
        `insert into web_order_items(id, order_id, menu_item_id, qty, price_cents, name_snapshot)
         values ($1, $2,$3,$4,$5,$6)`,
        [itemId, orderId, mi.id, item.qty, mi.price_cents, mi.name]
      );
      coreItems.push({
        item_id: itemId,
        product_id: mi.id,
        name: mi.name,
        quantity: item.qty,
        price_snapshot_cents: mi.price_cents,
      });
    }

    // Criar payment intent no Stripe do restaurante
    let creds = await getMerchantGatewayCredentials(params.restaurantId);
    let gateway: any;

    if (!creds) {
      if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
        console.warn('⚠️  [Dev] Using Mock Gateway because credentials are missing');
        gateway = {
          createPaymentIntent: async (opts: any) => ({
            intent_id: `pi_mock_${uuid()}`,
            client_secret: `secret_mock_xyz`,
            status: 'CREATED',
          }),
        };
      } else {
        throw Object.assign(new Error('GATEWAY_NOT_CONFIGURED'), { code: 'GATEWAY_NOT_CONFIGURED' });
      }
    } else {
      gateway = new StripeGatewayAdapterV2(creds);
    }
    const stripeIdempotencyKey = idempotencyKey
      ? `web_order:${params.restaurantId}:${idempotencyKey}`
      : `web_order_${orderId}`;

    const intent = await gateway.createPaymentIntent({
      amount_cents: totalCents,
      currency,
      order_id: orderId,
      restaurant_id: params.restaurantId,
      description: `Web order ${orderId}`,
      idempotency_key: stripeIdempotencyKey,
      metadata: {
        source: 'WEB',
      },
    });

    // Guardar referência (idempotência por intent_id)
    await client.query(
      `insert into payment_intent_refs(order_id, provider, intent_id, client_secret, status, raw)
       values ($1,'STRIPE',$2,$3,$4,$5)
       on conflict (provider, intent_id) do nothing`,
      [orderId, intent.intent_id, intent.client_secret || null, intent.status, JSON.stringify(intent)]
    );

    // TPV Operations Hook: Generate Staff Task (Phase L)
    await client.query(
      `insert into staff_tasks(restaurant_id, title, description, status, priority, due_at, origin_event_id, origin_type)
       values ($1, $2, $3, 'pending', 'critical', now() + interval '15 minutes', $4, 'WEB_ORDER')`,
      [
        params.restaurantId,
        `Novo Pedido Web`,
        `Pedido de ${params.items.reduce((acc, i) => acc + i.qty, 0)} itens (${(totalCents / 100).toFixed(2)} ${currency}).`,
        orderId // adhering to uuid constraint
      ]
    );

    // Web → POS Event Bridge (atomic with the order)
    await emitWebOrderCreatedTx(client as any, {
      restaurant_id: params.restaurantId,
      order_id: orderId,
      session_id: sessionId,
      table_id: params.table_ref || null,
      total_cents: totalCents,
      currency,
      items: coreItems,
      payment: {
        payment_id: intent.intent_id,
        method: 'STRIPE_WEB',
        amount_cents: totalCents,
      },
    });

    await client.query('commit');
    return {
      order_id: orderId,
      session_id: sessionId,
      company_id: companyId,
      total_cents: totalCents,
      currency,
      payment_intent: {
        provider: 'STRIPE',
        intent_id: intent.intent_id,
        client_secret: intent.client_secret,
        status: intent.status,
      },
      idempotency_key: idempotencyKey || null,
    };
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

async function isDuplicateWebhookEvent(eventId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from audit_logs where entity_type = 'payment_webhook_event' and entity_id = $1 and action = 'PROCESSED' limit 1`,
    [eventId]
  );
  return rows.length > 0;
}

async function markWebhookEventProcessed(eventId: string, restaurantId: string | null) {
  const companyId = restaurantId ? await getCompanyIdForRestaurant(restaurantId) : null;
  await pool.query(
    `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
     values ($1,$2,'payment_webhook_event',$3,'PROCESSED','SYSTEM',$4)`,
    [companyId, restaurantId, eventId, JSON.stringify({ processed_at: new Date().toISOString() })]
  );
}

async function markOrderPaid(params: { restaurantId: string; orderId?: string; intentId: string; raw?: any }) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const companyId = await getCompanyIdForRestaurant(params.restaurantId);

    // Resolver order_id
    let orderId = params.orderId;
    if (!orderId) {
      const { rows } = await client.query(
        `select order_id from payment_intent_refs where provider = 'STRIPE' and intent_id = $1 limit 1`,
        [params.intentId]
      );
      orderId = rows[0]?.order_id;
    }
    if (!orderId) {
      throw new Error('ORDER_ID_NOT_FOUND');
    }

    const orderRes = await client.query(
      `select payment_status from web_orders where id = $1 and restaurant_id = $2 limit 1`,
      [orderId, params.restaurantId]
    );
    if (orderRes.rows.length === 0) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const current = orderRes.rows[0].payment_status as any;
    PaymentInvariants.assertCanMarkPaid(current);

    await client.query(
      `update web_orders set payment_status = 'PAID', updated_at = now() where id = $1 and restaurant_id = $2`,
      [orderId, params.restaurantId]
    );

    await client.query(
      `update payment_intent_refs set status = 'SUCCEEDED', raw = coalesce($2, raw), updated_at = now()
       where provider = 'STRIPE' and intent_id = $1`,
      [params.intentId, params.raw ? JSON.stringify(params.raw) : null]
    );

    await client.query(
      `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
       values ($1,$2,'web_orders',$3,'PAYMENT_CONFIRMED','SYSTEM',$4)`,
      [companyId, params.restaurantId, orderId, JSON.stringify({ intent_id: params.intentId })]
    );

    // Web → POS Event Bridge (atomic with payment confirmation)
    const sessionId = getWebSessionIdForRestaurant(params.restaurantId);
    await emitWebPaymentConfirmedTx(client as any, {
      restaurant_id: params.restaurantId,
      session_id: sessionId,
      order_id: orderId,
      payment_id: params.intentId,
    });

    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

async function markOrderFailed(params: { restaurantId: string; orderId?: string; intentId: string; raw?: any }) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const companyId = await getCompanyIdForRestaurant(params.restaurantId);

    let orderId = params.orderId;
    if (!orderId) {
      const { rows } = await client.query(
        `select order_id from payment_intent_refs where provider = 'STRIPE' and intent_id = $1 limit 1`,
        [params.intentId]
      );
      orderId = rows[0]?.order_id;
    }
    if (!orderId) {
      throw new Error('ORDER_ID_NOT_FOUND');
    }

    const orderRes = await client.query(
      `select payment_status from web_orders where id = $1 and restaurant_id = $2 limit 1`,
      [orderId, params.restaurantId]
    );
    if (orderRes.rows.length === 0) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const current = orderRes.rows[0].payment_status as any;
    // FAIL só permitido de REQUIRES_PAYMENT
    PaymentInvariants.assertCanMarkFailed(current);

    await client.query(
      `update web_orders set payment_status = 'FAILED', updated_at = now() where id = $1 and restaurant_id = $2`,
      [orderId, params.restaurantId]
    );

    await client.query(
      `update payment_intent_refs set status = 'FAILED', raw = coalesce($2, raw), updated_at = now()
       where provider = 'STRIPE' and intent_id = $1`,
      [params.intentId, params.raw ? JSON.stringify(params.raw) : null]
    );

    await client.query(
      `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
       values ($1,$2,'web_orders',$3,'PAYMENT_FAILED','SYSTEM',$4)`,
      [companyId, params.restaurantId, orderId, JSON.stringify({ intent_id: params.intentId })]
    );

    // Web → POS Event Bridge (atomic with payment failure)
    const sessionId = getWebSessionIdForRestaurant(params.restaurantId);
    await emitWebPaymentFailedTx(client as any, {
      restaurant_id: params.restaurantId,
      session_id: sessionId,
      order_id: orderId,
      payment_id: params.intentId,
    });

    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}


// ============================================================================
// ONBOARDING (Minute 1)
// ============================================================================




// ============================================================================
// ONBOARDING (Minute 1)
// ============================================================================

async function startOnboarding(params: z.infer<typeof OnboardingStartSchema>) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    // 1. Create/Find User (Mock or Real)
    // For Minute 1: we trust the email and create a phantom user if not exists.
    // In real world: check auth_provider token.
    const userId = uuid();
    // TODO: Insert into `users` table if exists, or just simulate for data structure
    // For now we SKIP user table insertion as we don't have the schema visible,
    // assuming we bind via company immediately.

    // 2. Create Company
    const companyId = uuid();
    await client.query(
      `insert into companies(company_id, name)
       values ($1, $2)
       on conflict do nothing`, // minimalist fallback
      [companyId, params.name || 'Meu Restaurante']
    );

    // 3. Create Restaurant
    const restaurantId = uuid();
    await client.query(
      `insert into restaurants(id, company_id, name, status)
       values ($1, $2, $3, 'ACTIVE')`,
      [restaurantId, companyId, params.name || 'Meu Restaurante']
    );

    // 4. Create Web Profile (Draft) with unique slug
    const slugCandidate = params.name || `restaurante-${crypto.randomBytes(3).toString('hex')}`;
    const profile = await ensureWebProfileExistsTx(client, restaurantId, slugCandidate);

    // 5. Link magic token to restaurant if user came via magic link
    await linkTokenToRestaurant(client, params.email, restaurantId);

    // 6. Create Session Token (Magic Link style)
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // 7. Log audit event
    await client.query(
      `insert into onboarding_audit_log (restaurant_id, event_type, event_data)
       values ($1, 'onboarding_start', $2)`,
      [restaurantId, JSON.stringify({ email: params.email, name: params.name })]
    );

    await client.query('commit');

    // Log to console for immediate visibility
    console.log(`[ONBOARDING START] ${restaurantId.substring(0, 8)} | ${params.email} | ${profile.slug}`);

    return {
      session_token: sessionToken, // In real app: JWT
      user_id: userId,
      company_id: companyId,
      restaurant_id: restaurantId,
      slug: profile.slug,
      status: 'IDENTITY_CREATED'
    };

  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

async function confirmOnboarding(params: z.infer<typeof OnboardingConfirmSchema>) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    // In a real app, validate session_token to find restaurantId.
    // For this "Minute 1" MVP, we assume the token IS the restaurantID (or derived) for simplicity
    // OR we are bypassing auth for the demo speed.
    // LET'S ASSUME: session_token contains restaurant_id encoded or we lookup.
    // For NOW: we will fail if we can't map. But wait, the frontend has no context?
    // FIX: The frontend must pass something we gave it.
    // Hack for MVP: session_token = restaurant_id (insecure but functional for demo)
    const restaurantId = params.session_token; // TODO: Real auth

    // Update Restaurant Name
    await client.query(
      `update restaurants set name = $1 where id = $2`,
      [params.restaurant_name, restaurantId]
    );

    // Update Web Profile (Slug, Highlights, Contacts)
    const baseSlug = slugify(params.slug || params.restaurant_name);
    await client.query(
      `update restaurant_web_profiles
         set slug = $1, status = 'published',
             hero = jsonb_set(coalesce(hero, '{}'), '{title}', to_jsonb($2::text)),
             contacts = jsonb_set(coalesce(contacts, '{}'), '{city}', to_jsonb($3::text))
         where restaurant_id = $4`,
      [baseSlug, params.restaurant_name, params.city, restaurantId]
    );

    // Seed Menu (if empty)
    // await seedDefaultMenu(client, restaurantId, params.category);

    await client.query('commit');
    return {
      slug: baseSlug,
      url: `/public/${baseSlug}`
    };

  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  const requestId = uuid();
  const startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  // P1 FIX: CORS headers para todos os requests
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Stripe-Signature,X-Internal-Token,x-chefiapp-token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    console.log(`[${requestId}] ${req.method} ${url.pathname}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // P1 FIX: Health check com métricas completas
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      const health = await getHealthStatus(pool);
      const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 503;
      trackMetrics(startTime, false);
      return sendJSON(res, statusCode, health);
    }

    // P1 FIX: Rate limiting check para todos os endpoints
    const safeReq = wrapRequest(req, 'api');
    if (!safeReq.rateLimit.allowed) {
      res.setHeader('X-RateLimit-Limit', '500');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', Math.ceil(safeReq.rateLimit.resetIn / 1000));
      trackMetrics(startTime, true);
      return sendJSON(res, 429, {
        error: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Retry in ${Math.ceil(safeReq.rateLimit.resetIn / 1000)}s`,
        retryAfter: Math.ceil(safeReq.rateLimit.resetIn / 1000),
      });
    }

    // Add rate limit headers to all responses
    res.setHeader('X-RateLimit-Limit', '500');
    res.setHeader('X-RateLimit-Remaining', safeReq.rateLimit.remaining);

    // POST /api/auth/request-magic-link
    if (url.pathname === '/api/auth/request-magic-link' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const schema = z.object({ email: z.string().email() });
        const { email } = schema.parse(body);

        const token = await createMagicLinkToken(pool, email);

        // In production: send email with magic link
        // For beta/dev: return token directly (or log it)
        const magicLink = `${url.origin}/api/auth/verify-magic-link?token=${token}`;

        await logAuditEvent(pool, 'system', 'magic_link_requested', { email });

        console.log(`[MAGIC LINK] ${email}: ${magicLink}`);

        return sendJSON(res, 200, {
          ok: true,
          // In production, don't return these:
          dev_token: token,
          dev_link: magicLink,
        });
      } catch (e: any) {
        console.error('[AUTH ERROR]', e);
        return sendJSON(res, 400, { error: 'INVALID_REQUEST' });
      }
    }

    // GET /api/auth/verify-magic-link
    if (url.pathname === '/api/auth/verify-magic-link' && req.method === 'GET') {
      try {
        const token = url.searchParams.get('token');
        if (!token) {
          return sendJSON(res, 400, { error: 'TOKEN_REQUIRED' });
        }

        const result = await verifyMagicLinkToken(pool, token);

        if (!result.valid) {
          return sendJSON(res, 401, { error: 'TOKEN_INVALID_OR_EXPIRED' });
        }

        await logAuditEvent(pool, result.restaurant_id || 'system', 'magic_link_verified', {
          email: result.email
        });

        return sendJSON(res, 200, {
          ok: true,
          email: result.email,
          restaurant_id: result.restaurant_id,
          session_token: token, // Re-use token as session for simplicity
        });
      } catch (e: any) {
        console.error('[AUTH ERROR]', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      }
    }

    if (url.pathname === '/api/onboarding/start' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const params = OnboardingStartSchema.parse(body);
      const result = await startOnboarding(params);
      return sendJSON(res, 200, result);
    }
    if (url.pathname === '/api/onboarding/confirm' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const params = OnboardingConfirmSchema.parse(body);
      const result = await confirmOnboarding(params);
      return sendJSON(res, 200, result);
    }

    // GET /internal/wizard/:restaurantId/state
    const wizardStateMatch = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/state$/);
    if (req.method === 'GET' && wizardStateMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const restaurantId = decodeURIComponent(wizardStateMatch[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      const profileQ = await pool.query(
        `select restaurant_id, slug, domain, status, theme, web_level, hero, contacts, highlights
         from restaurant_web_profiles
         where restaurant_id = $1
         limit 1`,
        [restaurantId]
      );

      const profile = profileQ.rows[0] || null;
      const heroTitle = String(profile?.hero?.title || '').trim();
      const identity_complete = Boolean(heroTitle);

      const menuCount = await pool.query(
        `select count(1)::int as c from menu_items where restaurant_id = $1 and is_active = true`,
        [restaurantId]
      );
      const menu_complete = Number(menuCount.rows[0]?.c || 0) > 0;

      const payments_complete = Boolean(await getMerchantGatewayCredentials(restaurantId));
      const design_complete = Boolean(profile?.slug) && Boolean(profile?.theme) && Boolean(profile?.web_level);

      let can_publish = identity_complete && menu_complete && payments_complete && design_complete;
      let gates: any = { ok: null };
      if (can_publish) {
        try {
          const ctx = await enforceWebPageGateOrThrow(restaurantId);
          assertWebLevelOrThrow(ctx, (profile?.web_level || 'BASIC') as any);
          gates = { ok: true, tier: ctx?.tier, addons: ctx?.addons };
        } catch (e: any) {
          can_publish = false;
          gates = { ok: false, error: e?.code || 'BLOCKED', message: e?.message };
        }
      }

      return sendJSON(res, 200, {
        restaurant_id: restaurantId,
        current_step: identity_complete ? 2 : 1,
        completed_steps: [identity_complete ? 1 : null, menu_complete ? 2 : null, payments_complete ? 3 : null, design_complete ? 4 : null].filter(
          Boolean
        ),
        identity_complete,
        menu_complete,
        payments_complete,
        design_complete,
        can_publish,
        gates,
        profile,
      });
    }

    // POST /internal/wizard/:restaurantId/menu/categories or /category
    const wizardMenuCategoryCreate = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/menu\/(?:categories|category)$/);
    if (req.method === 'POST' && wizardMenuCategoryCreate) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardMenuCategoryCreate[1]);
      // if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z.object({ name: z.string().trim().min(1).max(80), position: z.number().int().min(0).max(999).optional() }).safeParse(body);
      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });

      const companyId = await getCompanyIdForRestaurant(restaurantId);
      const id = uuid();
      try {
        const r = await pool.query(
          `insert into menu_categories(id, restaurant_id, name, position)
           values ($1,$2,$3,$4)
           returning id, restaurant_id, name, position`,
          [id, restaurantId, parsed.data.name, parsed.data.position ?? 0]
        );
        await pool.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'menu_categories',$3,'WEB_MENU_CATEGORY_CREATED','ADMIN',$4)`,
          [companyId, restaurantId, String(id), JSON.stringify({ request_id: requestId, name: parsed.data.name })]
        );
        return sendJSON(res, 201, { ok: true, category: r.rows[0] });
      } catch (e: any) {
        if (String(e?.code) === '23505') return sendJSON(res, 409, { error: 'DUPLICATE' });
        console.error('Create menu category failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      }
    }

    // POST /internal/wizard/:restaurantId/menu/items or /item
    const wizardMenuItemCreate = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/menu\/(?:items|item)$/);
    if (req.method === 'POST' && wizardMenuItemCreate) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardMenuItemCreate[1]);
      // if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          category_id: z.string().uuid(),
          name: z.string().trim().min(1).max(120),
          description: z.string().trim().max(500).optional().nullable(),
          price_cents: z.number().int().min(0).max(1_000_000),
          currency: z.string().trim().min(3).max(3).optional(),
          photo_url: z.string().url().max(500).optional().nullable(),
          tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
        })
        .safeParse(body);
      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });

      const companyId = await getCompanyIdForRestaurant(restaurantId);
      const id = uuid();
      try {
        const r = await pool.query(
          `insert into menu_items(id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
           returning id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active`,
          [
            id,
            parsed.data.category_id,
            restaurantId,
            parsed.data.name,
            parsed.data.description ?? null,
            parsed.data.price_cents,
            (parsed.data.currency || 'eur').toLowerCase(),
            parsed.data.photo_url ?? null,
            parsed.data.tags || [],
          ]
        );
        await pool.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'menu_items',$3,'WEB_MENU_ITEM_CREATED','ADMIN',$4)`,
          [companyId, restaurantId, String(id), JSON.stringify({ request_id: requestId, name: parsed.data.name, price_cents: parsed.data.price_cents })]
        );
        return sendJSON(res, 201, { ok: true, item: r.rows[0] });
      } catch (e: any) {
        console.error('Create menu item failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      }
    }

    // POST /internal/wizard/:restaurantId/menu/import (bulk)
    const wizardMenuImport = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/menu\/import$/);
    if (req.method === 'POST' && wizardMenuImport) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardMenuImport[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          categories: z.array(z.object({ name: z.string().trim().min(1).max(80), position: z.number().int().min(0).max(999).optional() })).default([]),
          items: z
            .array(
              z.object({
                category_name: z.string().trim().min(1).max(80),
                name: z.string().trim().min(1).max(120),
                description: z.string().trim().max(500).optional().nullable(),
                price_cents: z.number().int().min(0).max(1_000_000),
                currency: z.string().trim().min(3).max(3).optional(),
                photo_url: z.string().url().max(500).optional().nullable(),
                tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
              })
            )
            .default([]),
        })
        .safeParse(body);

      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });

      const companyId = await getCompanyIdForRestaurant(restaurantId);
      const client = await pool.connect();
      try {
        await client.query('begin');

        const nameToId = new Map<string, string>();
        const existingCats = await client.query(
          `select id, name from menu_categories where restaurant_id = $1`,
          [restaurantId]
        );
        for (const r of existingCats.rows) nameToId.set(String(r.name), String(r.id));

        for (const c of parsed.data.categories) {
          if (nameToId.has(c.name)) continue;
          const id = uuid();
          await client.query(
            `insert into menu_categories(id, restaurant_id, name, position)
             values ($1,$2,$3,$4)`,
            [id, restaurantId, c.name, c.position ?? 0]
          );
          nameToId.set(c.name, id);
        }

        // Ensure categories referenced by items exist
        for (const it of parsed.data.items) {
          if (nameToId.has(it.category_name)) continue;
          const id = uuid();
          await client.query(
            `insert into menu_categories(id, restaurant_id, name, position)
             values ($1,$2,$3,$4)`,
            [id, restaurantId, it.category_name, 0]
          );
          nameToId.set(it.category_name, id);
        }

        const insertedItems: any[] = [];
        for (const it of parsed.data.items) {
          const id = uuid();
          const catId = nameToId.get(it.category_name)!;
          const r = await client.query(
            `insert into menu_items(id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
             returning id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active`,
            [
              id,
              catId,
              restaurantId,
              it.name,
              it.description ?? null,
              it.price_cents,
              (it.currency || 'eur').toLowerCase(),
              it.photo_url ?? null,
              it.tags || [],
            ]
          );
          insertedItems.push(r.rows[0]);
        }

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'menu_import',$3,'WEB_MENU_IMPORTED','ADMIN',$4)`,
          [
            companyId,
            restaurantId,
            restaurantId,
            JSON.stringify({ request_id: requestId, categories: parsed.data.categories.length, items: parsed.data.items.length }),
          ]
        );

        // Log for beta observation
        await client.query(
          `insert into onboarding_audit_log (restaurant_id, event_type, event_data)
           values ($1, 'menu_complete', $2)`,
          [restaurantId, JSON.stringify({ categories: parsed.data.categories.length, items: parsed.data.items.length })]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, imported: true, inserted_items: insertedItems.length });
      } catch (e) {
        await client.query('rollback');
        console.error('Menu import failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // POST /internal/wizard/:restaurantId/payments/stripe
    const wizardStripeConnect = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/payments\/stripe$/);
    if (req.method === 'POST' && wizardStripeConnect) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardStripeConnect[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          stripe_publishable_key: z.string().trim().min(10).max(200),
          stripe_secret_key: z.string().trim().min(10).max(200),
          stripe_webhook_secret: z.string().trim().min(10).max(200).optional(),
        })
        .safeParse(body);
      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });

      const companyId = await getCompanyIdForRestaurant(restaurantId);
      const secretKey = parsed.data.stripe_secret_key;
      const isTestMode = secretKey.startsWith('sk_test_');

      // Health check: create an unconfirmed PI (validates key works)
      try {
        const stripe = new Stripe(secretKey);
        await stripe.paymentIntents.create({
          amount: 100,
          currency: 'eur',
          description: `ChefIApp wizard healthcheck ${restaurantId}`,
          metadata: { source: 'CHEFIAPP_WIZARD', restaurant_id: restaurantId },
        });
      } catch (e: any) {
        console.error('Stripe healthcheck failed:', e);
        return sendJSON(res, 400, { error: 'STRIPE_INVALID_KEY', message: 'Falha ao validar a Stripe key.' });
      }

      try {
        await pool.query(
          `insert into merchant_gateway_credentials(
             restaurant_id, company_id, gateway,
             publishable_key_enc, secret_key_enc, webhook_secret_enc,
             is_test_mode, last_health_check_at, updated_at
           ) values ($1,$2,'STRIPE',$3,$4,$5,$6, now(), now())
           on conflict (restaurant_id) do update set
             company_id = excluded.company_id,
             gateway = excluded.gateway,
             publishable_key_enc = excluded.publishable_key_enc,
             secret_key_enc = excluded.secret_key_enc,
             webhook_secret_enc = excluded.webhook_secret_enc,
             is_test_mode = excluded.is_test_mode,
             last_health_check_at = now(),
             updated_at = now()`,
          [
            restaurantId,
            companyId,
            encryptSecret(parsed.data.stripe_publishable_key),
            encryptSecret(secretKey),
            parsed.data.stripe_webhook_secret ? encryptSecret(parsed.data.stripe_webhook_secret) : null,
            isTestMode,
          ]
        );

        await pool.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'merchant_gateway_credentials',$3,'MERCHANT_STRIPE_CONNECTED','ADMIN',$4)`,
          [companyId, restaurantId, restaurantId, JSON.stringify({ request_id: requestId, is_test_mode: isTestMode })]
        );

        return sendJSON(res, 200, { ok: true, connected: true, test_mode: isTestMode });
      } catch (e) {
        console.error('Stripe connect persist failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      }
    }

    // GET /internal/wizard/:restaurantId/payments/stripe/status
    const wizardStripeStatus = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/payments\/stripe\/status$/);
    if (req.method === 'GET' && wizardStripeStatus) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardStripeStatus[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      try {
        const { rows } = await pool.query(
          `select is_test_mode, last_webhook_at, last_health_check_at
           from merchant_gateway_credentials
           where restaurant_id = $1
           limit 1`,
          [restaurantId]
        );
        if (rows.length === 0) return sendJSON(res, 200, { connected: false });
        return sendJSON(res, 200, {
          connected: true,
          test_mode: Boolean(rows[0]?.is_test_mode),
          last_webhook_at: rows[0]?.last_webhook_at || null,
          last_health_check_at: rows[0]?.last_health_check_at || null,
        });
      } catch (e) {
        return sendJSON(res, 200, { connected: false });
      }
    }

    // POST /internal/wizard/:restaurantId/design
    const wizardDesign = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/design$/);
    if (req.method === 'POST' && wizardDesign) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardDesign[1]);
      // if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          web_level: z.enum(['BASIC', 'PRO', 'EXPERIENCE']).optional(),
          theme: z.enum(['light', 'dark', 'minimal']).optional(),
          slug: z.string().trim().min(2).max(80).optional(),
          domain: z.string().trim().min(3).max(200).optional().nullable(),
        })
        .safeParse(body);
      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });

      const client = await pool.connect();
      try {
        await client.query('begin');
        const companyId = await getCompanyIdForRestaurant(restaurantId);
        const existing = await ensureWebProfileExistsTx(client, restaurantId, parsed.data.slug || restaurantId);
        const ctx = await enforceWebPageGateOrThrow(restaurantId);
        const nextLevel = (parsed.data.web_level || existing.web_level || 'BASIC') as any;
        assertWebLevelOrThrow(ctx, nextLevel);

        const nextSlug = parsed.data.slug ? slugify(parsed.data.slug) : String(existing.slug);
        const nextTheme = parsed.data.theme || String(existing.theme || 'minimal');
        const nextDomain = parsed.data.domain === undefined ? existing.domain : parsed.data.domain;

        const updated = await client.query(
          `update restaurant_web_profiles
             set slug = $2,
                 theme = $3,
                 domain = $4,
                 web_level = $5,
                 updated_at = now()
           where restaurant_id = $1
           returning restaurant_id, company_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones, created_at, updated_at`,
          [restaurantId, nextSlug, nextTheme, nextDomain, nextLevel]
        );

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'restaurant_web_profiles',$3,'WEB_DESIGN_UPDATED','ADMIN',$4)`,
          [companyId, restaurantId, restaurantId, JSON.stringify({ request_id: requestId, slug: nextSlug, theme: nextTheme, web_level: nextLevel })]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, profile: updated.rows[0] });
      } catch (e: any) {
        await client.query('rollback');
        if (String(e?.code) === '23505') return sendJSON(res, 409, { error: 'SLUG_OR_DOMAIN_CONFLICT' });
        if (e?.code === 'FEATURE_BLOCKED') return sendJSON(res, 402, { error: 'FEATURE_BLOCKED', feature: 'WEB_PAGE', message: e.message });
        if (e?.code === 'WEB_LEVEL_BLOCKED') return sendJSON(res, 403, { error: 'WEB_LEVEL_BLOCKED', web_level: e.web_level, message: e.message });
        console.error('Wizard design update failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // POST /internal/wizard/:restaurantId/publish
    const wizardPublish = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/publish$/);
    if (req.method === 'POST' && wizardPublish) {
      if (!isInternalAuthorized(req)) return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      const restaurantId = decodeURIComponent(wizardPublish[1]);
      // if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      const body = await readJsonBody(req);
      const parsed = z.object({ confirm: z.boolean().optional() }).safeParse(body);
      if (!parsed.success) return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      if (!parsed.data.confirm) return sendJSON(res, 400, { error: 'CONFIRM_REQUIRED' });

      const client = await pool.connect();
      try {
        await client.query('begin');

        const companyId = await getCompanyIdForRestaurant(restaurantId);
        const p = await client.query(
          `select restaurant_id, slug, status, theme, web_level, hero
           from restaurant_web_profiles
           where restaurant_id = $1
           limit 1`,
          [restaurantId]
        );
        if (p.rows.length === 0) {
          await client.query('rollback');
          return sendJSON(res, 404, { error: 'NOT_FOUND' });
        }

        const profile = p.rows[0];
        if (String(profile.status) === 'published') {
          await client.query('commit');
          return sendJSON(res, 200, { ok: true, published: true, already: true, slug: profile.slug });
        }

        const title = String(profile?.hero?.title || '').trim();
        if (!title) {
          await client.query('rollback');
          return sendJSON(res, 400, { error: 'IDENTITY_INCOMPLETE' });
        }

        const menuCount = await client.query(
          `select count(1)::int as c from menu_items where restaurant_id = $1 and is_active = true`,
          [restaurantId]
        );
        if (Number(menuCount.rows[0]?.c || 0) <= 0) {
          await client.query('rollback');
          return sendJSON(res, 400, { error: 'MENU_INCOMPLETE' });
        }

        // const creds = await getMerchantGatewayCredentials(restaurantId);
        // if (!creds) {
        //   await client.query('rollback');
        //   return sendJSON(res, 400, { error: 'PAYMENTS_INCOMPLETE' });
        // }

        const ctx = await enforceWebPageGateOrThrow(restaurantId);
        assertWebLevelOrThrow(ctx, (profile.web_level || 'BASIC') as any);

        const upd = await client.query(
          `update restaurant_web_profiles
             set status = 'published', updated_at = now()
           where restaurant_id = $1
           returning restaurant_id, company_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones, created_at, updated_at`,
          [restaurantId]
        );

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'restaurant_web_profiles',$3,'WEB_PAGE_PUBLISHED','ADMIN',$4)`,
          [companyId, restaurantId, restaurantId, JSON.stringify({ request_id: requestId, slug: String(profile.slug) })]
        );

        // Log for beta observation - TPV READY!
        await client.query(
          `insert into onboarding_audit_log (restaurant_id, event_type, event_data)
           values ($1, 'tpv_ready', $2)`,
          [restaurantId, JSON.stringify({ slug: profile.slug, url: `/public/${profile.slug}` })]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, published: true, url: `http://localhost:${PORT}/public/${encodeURIComponent(String(profile.slug))}`, profile: upd.rows[0] });
      } catch (e: any) {
        await client.query('rollback');
        if (e?.code === 'FEATURE_BLOCKED') return sendJSON(res, 402, { error: 'FEATURE_BLOCKED', feature: 'WEB_PAGE', message: e.message });
        if (e?.code === 'WEB_LEVEL_BLOCKED') return sendJSON(res, 403, { error: 'WEB_LEVEL_BLOCKED', web_level: e.web_level, message: e.message });
        console.error('Publish failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // POST /internal/wizard/:restaurantId/identity (manual)
    const wizardIdentityMatch = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/identity$/);
    if (req.method === 'POST' && wizardIdentityMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const restaurantId = decodeURIComponent(wizardIdentityMatch[1]);
      // MULTI-TENANT FIX: Allow any restaurantId for wizard operations
      // if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) {
      //   return sendJSON(res, 404, { error: 'NOT_FOUND' });
      // }

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          name: z.string().trim().min(1).max(120).optional(),
          tagline: z.string().trim().max(160).optional(),
          logo_url: z.string().url().max(500).optional(),
          hero: z
            .object({
              title: z.string().trim().max(120).optional(),
              subtitle: z.string().trim().max(160).optional(),
              image_url: z.string().url().max(500).optional(),
            })
            .partial()
            .optional(),
          hero_image_url: z.string().url().max(500).optional(),
          contacts: z
            .object({
              phone: z.string().trim().max(40).optional(),
              email: z.string().trim().max(120).optional(),
              address: z.string().trim().max(200).optional(),
              hours: z.string().trim().max(200).optional(),
              maps_url: z.string().url().max(500).optional(),
              links: z.record(z.string().trim().max(64), z.string().url().max(500)).optional(),
            })
            .partial()
            .optional(),
          links: z.record(z.string().trim().max(64), z.string().url().max(500)).optional(),
        })
        .strict()
        .safeParse(body);

      if (!parsed.success) {
        return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      }

      const patch = parsed.data;
      const preferredSlug = String(patch.name || patch.hero?.title || restaurantId);

      const client = await pool.connect();
      try {
        await client.query('begin');

        const companyId = await getCompanyIdForRestaurant(restaurantId);

        // Check if changing name would require new slug
        if (patch.name || patch.hero?.title) {
          const newSlug = slugify(preferredSlug);
          try {
            await validateAndReserveSlug(client, newSlug, restaurantId);
          } catch (e: any) {
            await client.query('rollback');
            const errorMap: Record<string, string> = {
              'SLUG_INVALID_FORMAT': 'Nome inválido: use apenas letras, números e hífens',
              'SLUG_INVALID_LENGTH': 'Nome muito curto ou muito longo (3-63 caracteres)',
              'SLUG_RESERVED': 'Este nome está reservado. Escolha outro.',
              'SLUG_TAKEN': 'Este nome já está a ser usado. Tente outro.',
            };
            return sendJSON(res, 400, {
              error: e.message,
              message: errorMap[e.message] || 'Nome indisponível',
            });
          }
        }

        const existing = await ensureWebProfileExistsTx(
          client,
          restaurantId,
          preferredSlug,
          patch.hero || (patch.name || patch.tagline || patch.logo_url ? { title: patch.name, subtitle: patch.tagline, logo_url: patch.logo_url } : {}),
          patch.contacts
        );

        const merged = mergeIdentity(
          { hero: existing.hero || {}, contacts: existing.contacts || {}, highlights: existing.highlights || {} },
          patch
        );

        const updated = await client.query(
          `update restaurant_web_profiles
             set hero = $2,
                 contacts = $3,
                 highlights = $4,
                 updated_at = now()
           where restaurant_id = $1
           returning restaurant_id, company_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones, created_at, updated_at`,
          [restaurantId, JSON.stringify(merged.hero), JSON.stringify(merged.contacts), JSON.stringify(merged.highlights)]
        );

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'restaurant_web_profiles',$3,'WEB_IDENTITY_UPDATED','ADMIN',$4)`,
          [
            companyId,
            restaurantId,
            restaurantId,
            JSON.stringify({
              source: 'MANUAL',
              request_id: requestId,
              patched_keys: Object.keys(patch || {}),
              hero: merged.hero,
              contacts: merged.contacts,
            }),
          ]
        );

        // Log for beta observation
        await client.query(
          `insert into onboarding_audit_log (restaurant_id, event_type, event_data)
           values ($1, 'identity_complete', $2)`,
          [restaurantId, JSON.stringify({ name: merged.hero?.title, slug: existing.slug })]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, profile: updated.rows[0] });
      } catch (e) {
        await client.query('rollback');
        console.error('Wizard identity update failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // POST /internal/wizard/:restaurantId/identity/import-google (mock)
    const wizardGoogleMatch = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/identity\/import-google$/);
    if (req.method === 'POST' && wizardGoogleMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const restaurantId = decodeURIComponent(wizardGoogleMatch[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      const body = await readJsonBody(req);
      const parsed = z
        .object({
          google_place_id: z.string().trim().min(3).max(200),
        })
        .safeParse(body);
      if (!parsed.success) {
        return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      }

      // MVP mock import (no external call): derive stable fake identity from place_id
      const placeId = parsed.data.google_place_id;
      const suffix = crypto.createHash('sha1').update(placeId).digest('hex').slice(0, 6);
      const imported = {
        name: `Sofia Gastrobar`,
        tagline: `Importado do Google (${suffix})`,
        hero_image_url: null as any,
        contacts: {
          phone: '+351912345678',
          address: 'Lisboa (import mock)',
          hours: '12:00–23:00',
          maps_url: 'https://maps.google.com',
          links: {
            instagram: 'https://instagram.com',
          },
        },
        highlights: {
          google_rating: 4.6,
          google_reviews_count: 128,
        },
        google_place_id: placeId,
        google_import_data: {
          place_id: placeId,
          imported_at: new Date().toISOString(),
          mock: true,
        },
      };

      const client = await pool.connect();
      try {
        await client.query('begin');
        const companyId = await getCompanyIdForRestaurant(restaurantId);
        const existing = await ensureWebProfileExistsTx(client, restaurantId, imported.name, { title: imported.name, subtitle: imported.tagline }, imported.contacts);
        const merged = mergeIdentity(
          { hero: existing.hero || {}, contacts: existing.contacts || {}, highlights: existing.highlights || {} },
          imported
        );
        const updated = await client.query(
          `update restaurant_web_profiles
             set hero = $2,
                 contacts = $3,
                 highlights = $4,
                 updated_at = now()
           where restaurant_id = $1
           returning restaurant_id, company_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones, created_at, updated_at`,
          [restaurantId, JSON.stringify(merged.hero), JSON.stringify(merged.contacts), JSON.stringify(merged.highlights)]
        );

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'restaurant_web_profiles',$3,'WEB_IDENTITY_IMPORTED_GOOGLE','ADMIN',$4)`,
          [
            companyId,
            restaurantId,
            restaurantId,
            JSON.stringify({ source: 'GOOGLE_MOCK', request_id: requestId, google_place_id: placeId }),
          ]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, imported: true, identity: imported, profile: updated.rows[0] });
      } catch (e) {
        await client.query('rollback');
        console.error('Wizard google import failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // POST /internal/wizard/:restaurantId/identity/import-url (mock extractor)
    const wizardUrlMatch = url.pathname.match(/^\/internal\/wizard\/([^/]+)\/identity\/import-url$/);
    if (req.method === 'POST' && wizardUrlMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const restaurantId = decodeURIComponent(wizardUrlMatch[1]);
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      const body = await readJsonBody(req);
      const parsed = z.object({ url: z.string().url().max(500) }).safeParse(body);
      if (!parsed.success) {
        return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      }

      const u = parsed.data.url;
      const host = (() => {
        try {
          return new URL(u).hostname;
        } catch {
          return 'site';
        }
      })();

      // MVP mock: suggest identity + a couple of menu items (returned only, no DB write)
      const extracted = {
        name: `Restaurante de ${host}`,
        description: `Texto extraído (mock) de ${host}.`,
        menu_items_suggested: [
          { name: 'Hambúrguer da casa', price_text: '12,90€', category_guess: 'Pratos' },
          { name: 'Sopa do dia', price_text: '3,50€', category_guess: 'Entradas' },
        ],
      };

      return sendJSON(res, 200, { ok: true, extracted: true, source_url: u, extracted_data: extracted });
    }

    // GET /internal/preview/web-pages?slug=...
    if (req.method === 'GET' && url.pathname === '/internal/preview/web-pages') {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const slug = String(url.searchParams.get('slug') || '');
      if (!slug) {
        return sendHTML(res, 400, '<!doctype html><html><body>Missing slug. Use /internal/preview/web-pages?slug=...</body></html>');
      }

      return sendHTML(res, 200, renderWebPreviewIndexHtml(slug));
    }

    // GET /internal/preview/web-page/:level?slug=...
    const previewMatch = url.pathname.match(/^\/internal\/preview\/web-page\/(BASIC|PRO|EXPERIENCE)\/?$/i);
    if (req.method === 'GET' && previewMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const level = previewMatch[1] as WebPageLevel;
      const slug = String(url.searchParams.get('slug') || '');
      if (!slug) {
        return sendHTML(res, 400, '<!doctype html><html><body>Missing slug. Use /internal/preview/web-page/BASIC?slug=...</body></html>');
      }

      const profile = await getPublishedRestaurantBySlug(slug);
      if (!profile) {
        return sendHTML(res, 404, '<!doctype html><html><body>Not found</body></html>');
      }
      // Removed restricted check for internal preview flexibility

      const menu = await getMenuForRestaurant(profile.restaurant_id);

      const html = renderWebPreviewHtml(level, {
        slug,
        profile: {
          ...profile,
          web_level: level,
        },
        menu: {
          categories: (menu.categories || []).map((c: any) => ({
            id: String(c.id),
            name: String(c.name),
            position: Number(c.position ?? 0),
          })),
          items: (menu.items || []).map((it: any) => ({
            id: String(it.id),
            category_id: String(it.category_id),
            name: String(it.name),
            description: it.description == null ? null : String(it.description),
            price_cents: Number(it.price_cents ?? 0),
            currency: String(it.currency || 'EUR'),
            photo_url: it.photo_url == null ? null : String(it.photo_url),
            tags: Array.isArray(it.tags) ? it.tags.map((t: any) => String(t)) : [],
          })),
        },
      });

      return sendHTML(res, 200, html);
    }

    // PATCH /internal/admin/web-profile/:restaurantId
    const adminWebProfileMatch = url.pathname.match(/^\/internal\/admin\/web-profile\/([^/]+)$/);
    if (req.method === 'PATCH' && adminWebProfileMatch) {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }

      const restaurantId = decodeURIComponent(adminWebProfileMatch[1]);

      const body = await readJsonBody(req);
      const parsed = z.object({ web_level: z.enum(['BASIC', 'PRO', 'EXPERIENCE']) }).safeParse(body);
      if (!parsed.success) {
        return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      }

      const client = await pool.connect();
      try {
        await client.query('begin');

        const existing = await client.query(
          `select web_level from restaurant_web_profiles where restaurant_id = $1`,
          [restaurantId]
        );
        if (existing.rows.length === 0) {
          await client.query('rollback');
          return sendJSON(res, 404, { error: 'NOT_FOUND' });
        }

        const previousLevel = String(existing.rows[0]?.web_level || 'BASIC');
        const ctx = await enforceWebPageGateOrThrow(restaurantId);
        assertWebLevelOrThrow(ctx, parsed.data.web_level as any);

        const companyId = await getCompanyIdForRestaurant(restaurantId);

        const updated = await client.query(
          `update restaurant_web_profiles
             set web_level = $2, updated_at = now()
           where restaurant_id = $1
           returning restaurant_id, slug, domain, status, theme, web_level, hero, highlights, contacts, delivery_zones, created_at, updated_at`,
          [restaurantId, parsed.data.web_level]
        );

        await client.query(
          `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
           values ($1,$2,'restaurant_web_profiles',$3,'WEB_LEVEL_UPDATED','ADMIN',$4)`,
          [
            companyId,
            restaurantId,
            restaurantId,
            JSON.stringify({
              old_level: previousLevel,
              new_level: parsed.data.web_level,
              tier: ctx?.tier,
              addons: ctx?.addons,
              actor: 'INTERNAL_ADMIN',
            }),
          ]
        );

        await client.query('commit');
        return sendJSON(res, 200, { ok: true, profile: updated.rows[0] });
      } catch (e: any) {
        await client.query('rollback');
        if (e?.code === 'FEATURE_BLOCKED') {
          return sendJSON(res, 402, { error: 'FEATURE_BLOCKED', feature: 'WEB_PAGE', message: e.message });
        }
        if (e?.code === 'WEB_LEVEL_BLOCKED') {
          return sendJSON(res, 403, {
            error: 'WEB_LEVEL_BLOCKED',
            web_level: e.web_level,
            message: e.message,
          });
        }
        console.error('Admin web_level update failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      } finally {
        client.release();
      }
    }

    // GET /internal/kitchen/feed?restaurant_id=...
    if (req.method === 'GET' && url.pathname === '/internal/kitchen/feed') {
      if (!isInternalAuthorized(req)) {
        return sendJSON(res, 401, { error: 'UNAUTHORIZED' });
      }
      const restaurantId = String(url.searchParams.get('restaurant_id') || '');
      if (!restaurantId) {
        return sendJSON(res, 400, { error: 'RESTAURANT_ID_REQUIRED' });
      }
      if (!WEB_MODULE_RESTAURANT_ID || restaurantId !== WEB_MODULE_RESTAURANT_ID) {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      const state = await loadWebProjectionForRestaurant(restaurantId);
      const sessionId = getWebSessionIdForRestaurant(restaurantId);

      const orders = Array.from(state.orders.values())
        .filter((o) => (o as any).session_id === sessionId)
        .map((o) => {
          const items = state.orderItems.get((o as any).id) || [];
          const payments = state.payments.get((o as any).id) || [];
          return { order: o, items, payments };
        });

      return sendJSON(res, 200, {
        restaurant_id: restaurantId,
        session_id: sessionId,
        orders,
      });
    }

    // GET /public/:slug/menu
    const menuMatch = url.pathname.match(/^\/public\/([^/]+)\/menu$/);
    if (req.method === 'GET' && menuMatch) {
      const slug = decodeURIComponent(menuMatch[1]);
      const profile = await getPublishedRestaurantBySlug(slug);
      if (!profile) return sendJSON(res, 404, { error: 'NOT_FOUND' });

      if (profile.status !== 'published') {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      try {
        const ctx = await enforceWebPageGateOrThrow(profile.restaurant_id);
        assertWebLevelOrThrow(ctx, (profile.web_level || 'BASIC') as any);
      } catch (e: any) {
        if (e?.code === 'FEATURE_BLOCKED') {
          return sendJSON(res, 402, { error: 'FEATURE_BLOCKED', feature: 'WEB_PAGE', message: e.message });
        }
        if (e?.code === 'WEB_LEVEL_BLOCKED') {
          return sendJSON(res, 402, {
            error: 'FEATURE_BLOCKED',
            feature: 'WEB_PAGE',
            web_level: e.web_level,
            message: e.message,
          });
        }
        return sendJSON(res, 503, { error: 'BILLING_UNAVAILABLE' });
      }

      const menu = await getMenuForRestaurant(profile.restaurant_id);
      return sendJSON(res, 200, { profile, menu });
    }

    // GET /public/:slug (HTML page)
    const publicPageMatch = url.pathname.match(/^\/public\/([^/]+)$/);
    if (req.method === 'GET' && publicPageMatch) {
      const slug = decodeURIComponent(publicPageMatch[1]);
      const profile = await getPublishedRestaurantBySlug(slug);
      if (!profile || profile.status !== 'published') {
        return sendHTML(res, 404, '<!doctype html><html><body>Not found</body></html>');
      }

      // if (WEB_MODULE_RESTAURANT_ID && profile.restaurant_id !== WEB_MODULE_RESTAURANT_ID) {
      //   return sendHTML(res, 404, '<!doctype html><html><body>Not found</body></html>');
      // }

      try {
        const ctx = await enforceWebPageGateOrThrow(profile.restaurant_id);
        assertWebLevelOrThrow(ctx, (profile.web_level || 'BASIC') as any);
      } catch (e: any) {
        return sendHTML(res, 402, `<!doctype html><html><body>Feature blocked: ${String(e?.message || 'blocked')}</body></html>`);
      }

      const menu = await getMenuForRestaurant(profile.restaurant_id);
      const html = renderWebPreviewHtml(profile.web_level || 'BASIC', {
        slug,
        profile,
        menu: {
          categories: (menu.categories || []).map((c: any) => ({ id: String(c.id), name: String(c.name), position: Number(c.position ?? 0) })),
          items: (menu.items || []).map((it: any) => ({
            id: String(it.id),
            category_id: String(it.category_id),
            name: String(it.name),
            description: it.description == null ? null : String(it.description),
            price_cents: Number(it.price_cents ?? 0),
            currency: String(it.currency || 'EUR'),
            photo_url: it.photo_url == null ? null : String(it.photo_url),
            tags: Array.isArray(it.tags) ? it.tags.map((t: any) => String(t)) : [],
          })),
        },
      });
      return sendHTML(res, 200, html);
    }

    // POST /public/:slug/orders
    const orderMatch = url.pathname.match(/^\/public\/([^/]+)\/orders$/);
    if (req.method === 'POST' && orderMatch) {
      const slug = decodeURIComponent(orderMatch[1]);
      const profile = await getPublishedRestaurantBySlug(slug);
      if (!profile || profile.status !== 'published') {
        return sendJSON(res, 404, { error: 'NOT_FOUND' });
      }

      // if (WEB_MODULE_RESTAURANT_ID && profile.restaurant_id !== WEB_MODULE_RESTAURANT_ID) {
      //   return sendJSON(res, 404, { error: 'NOT_FOUND' });
      // }

      try {
        const ctx = await enforceWebPageGateOrThrow(profile.restaurant_id);
        assertWebLevelOrThrow(ctx, (profile.web_level || 'BASIC') as any);
      } catch (e: any) {
        if (e?.code === 'FEATURE_BLOCKED') {
          return sendJSON(res, 402, { error: 'FEATURE_BLOCKED', feature: 'WEB_PAGE', message: e.message });
        }
        if (e?.code === 'WEB_LEVEL_BLOCKED') {
          return sendJSON(res, 402, {
            error: 'FEATURE_BLOCKED',
            feature: 'WEB_PAGE',
            web_level: e.web_level,
            message: e.message,
          });
        }
        return sendJSON(res, 503, { error: 'BILLING_UNAVAILABLE' });
      }

      const raw = await readJsonBody(req);
      const parsed = CreateWebOrderRequestSchema.safeParse(raw);
      if (!parsed.success) {
        return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
      }

      const idempotencyKey = getIdempotencyKeyFromRequest(req, parsed.data.idempotency_key || null);

      try {
        console.log(`[web-module] request_id=${requestId} action=create_order restaurant_id=${profile.restaurant_id} slug=${slug} idempotency_key=${idempotencyKey || '-'}`);
        const result = await createWebOrderAndPaymentIntent({
          restaurantId: profile.restaurant_id,
          pickup_type: parsed.data.pickup_type,
          table_ref: parsed.data.table_ref ?? null,
          customer_contact: parsed.data.customer_contact ?? null,
          delivery_address: parsed.data.delivery_address ?? null,
          notes: parsed.data.notes ?? null,
          currency: parsed.data.currency,
          idempotency_key: idempotencyKey,
          items: parsed.data.items,
        });
        return sendJSON(res, 201, result);
      } catch (e: any) {
        if (e?.code === 'GATEWAY_NOT_CONFIGURED') {
          return sendJSON(res, 409, { error: 'GATEWAY_NOT_CONFIGURED' });
        }
        if (e?.code === 'MENU_ITEM_NOT_FOUND') {
          return sendJSON(res, 400, { error: 'MENU_ITEM_NOT_FOUND', missing: e.missing || [] });
        }
        if (e?.code === 'MIXED_CURRENCY_NOT_SUPPORTED') {
          return sendJSON(res, 400, { error: 'MIXED_CURRENCY_NOT_SUPPORTED' });
        }
        console.error('Create order failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
      }
    }

    // POST /webhooks/payments/:restaurantId
    const whMatch = url.pathname.match(/^\/webhooks\/payments\/([^/]+)$/);
    if (req.method === 'POST' && whMatch) {
      const restaurantId = decodeURIComponent(whMatch[1]);
      const rawBody = await readRawBody(req);

      // if (WEB_MODULE_RESTAURANT_ID && restaurantId !== WEB_MODULE_RESTAURANT_ID) {
      //   return jsonResponse(res, 404, { error: 'NOT_FOUND' } as any);
      // }

      console.log(`[web-module] request_id=${requestId} action=payment_webhook restaurant_id=${restaurantId} bytes=${rawBody.length}`);

      const result = await handlePaymentWebhook(
        restaurantId,
        rawBody,
        req.headers as any,
        {
          getGatewayCredentials: async (rid: string) => {
            return getMerchantGatewayCredentials(rid);
          },
          isDuplicateEvent: async (eventId: string) => isDuplicateWebhookEvent(eventId),
          markEventProcessed: async (eventId: string) => markWebhookEventProcessed(eventId, restaurantId),
          onPaymentConfirmed: async (evt) => {
            await markOrderPaid({
              restaurantId: evt.restaurant_id,
              orderId: evt.order_id || undefined,
              intentId: evt.payment_intent_id,
              raw: { gateway_event_id: evt.gateway_event_id },
            });
          },
          onPaymentFailed: async (evt) => {
            await markOrderFailed({
              restaurantId: evt.restaurant_id,
              orderId: evt.order_id || undefined,
              intentId: evt.payment_intent_id,
              raw: { gateway_event_id: evt.gateway_event_id },
            });
          },
        }
      );

      // Reutiliza helpers do core para consistência
      return jsonResponse(res, result.statusCode, result as any);
    }

    // TPV / API Order Endpoints

    interface PulseEvent {
      restaurant_id: string;
      type: string;
      source: 'WEB' | 'POS' | 'SYSTEM' | 'BRIDGE';
      payload?: any;
    }

    async function emitPulseEvent(event: PulseEvent) {
      try {
        // If table doesn't exist, this might fail unless we ensure schema.
        // For now we assume empire_pulses exists from previous migrations.
        // If not, we might need a migration in Task 5.
        // We use a safe insert.
        await pool.query(
          `INSERT INTO empire_pulses (restaurant_id, type, source, payload) VALUES ($1, $2, $3, $4)`,
          [event.restaurant_id, event.type, event.source, event.payload || {}]
        );
        console.log(`[PULSE] Emitted ${event.type} for ${event.restaurant_id} (${event.source})`);
      } catch (e) {
        console.warn('[PULSE] Failed to emit event:', e);
      }
    }

    // -------------------------


    // POST /api/orders - Create order using gm_orders schema and RPC
    if (url.pathname === '/api/orders' && req.method === 'POST') {
      let parsed: any;
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }
        parsed = (await readJsonBody(req)) as any
        const { items, restaurantId, paymentMethod } = parsed

        // Default or fallback IDs if not provided
        const restId = restaurantId || WEB_MODULE_RESTAURANT_ID
        if (!restId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
          return sendJSON(res, 400, { error: 'items array required with at least one item' });
        }

        // Prepare items for RPC (format: {product_id, name, quantity, unit_price})
        const rpcItems = items.map((item: any) => ({
          product_id: item.productId || item.product_id,
          name: item.name,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.unit_price || item.priceCents || item.price_cents || 0
        }));

        // Call RPC create_order_atomic
        const { rows } = await pool.query(
          `SELECT public.create_order_atomic($1, $2::jsonb, $3) as result`,
          [restId, JSON.stringify(rpcItems), paymentMethod || 'cash']
        );

        if (rows.length === 0 || !rows[0].result) {
          return sendJSON(res, 500, { error: 'Failed to create order' });
        }

        const orderResult = rows[0].result;

        // Fetch full order with items
        const { rows: orderRows } = await pool.query(
          `SELECT o.*, 
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'product_id', oi.product_id,
                      'name', oi.product_name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price,
                      'total_price', oi.total_price
                    )
                  ) FILTER (WHERE oi.id IS NOT NULL) as items
           FROM public.gm_orders o
           LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
           WHERE o.id = $1
           GROUP BY o.id`,
          [orderResult.id]
        );

        const order = orderRows[0];

        // Log order creation to audit_logs (structured logging)
        try {
          const companyId = await getCompanyIdForRestaurant(restId);
          await pool.query(
            `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
             values ($1, $2, 'gm_orders', $3, 'ORDER_CREATED', 'SYSTEM', $4)`,
            [
              companyId,
              restId,
              order.id,
              JSON.stringify({
                request_id: requestId,
                short_id: order.short_id,
                total_cents: order.total_amount,
                items_count: items.length,
                payment_method: paymentMethod || 'cash'
              })
            ]
          );
        } catch (auditErr) {
          // Non-blocking: don't fail order creation if audit log fails
          console.error('[AUDIT] Failed to log order creation:', auditErr);
        }

        return sendJSON(res, 201, {
          order_id: order.id,
          short_id: order.short_id,
          state: order.status.toUpperCase(),
          total_cents: order.total_amount,
          items: order.items || []
        })
      } catch (e: any) {
        console.error('[API] /api/orders POST failed:', e)
        // Log order creation failure (non-blocking)
        try {
          const restId = parsed?.restaurantId || WEB_MODULE_RESTAURANT_ID;
          if (restId) {
            const companyId = await getCompanyIdForRestaurant(restId);
            await pool.query(
              `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
               values ($1, $2, 'gm_orders', 'failed', 'ORDER_CREATION_FAILED', 'SYSTEM', $3)`,
              [
                companyId,
                restId,
                JSON.stringify({
                  request_id: requestId,
                  error: e.message
                })
              ]
            );
          }
        } catch (auditErr) {
          console.error('[AUDIT] Failed to log order creation failure:', auditErr);
        }
        return sendJSON(res, 500, { error: e.message })
      }
    }

    // PATCH /api/orders/{orderId} - Update order items (only if status is 'pending')
    if (url.pathname.startsWith('/api/orders/') && req.method === 'PATCH' && !url.pathname.endsWith('/status')) {
      let parsed: any;
      const orderId = url.pathname.split('/')[3];
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }
        // const orderId = url.pathname.split('/')[3] // moved up
        parsed = (await readJsonBody(req)) as any
        const { items } = parsed

        // Get current order state
        const { rows } = await pool.query(
          'SELECT status, restaurant_id FROM public.gm_orders WHERE id = $1',
          [orderId]
        )

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' })
        }

        const currentStatus = rows[0].status
        const restaurantId = rows[0].restaurant_id

        // Reject modifications to non-pending orders
        if (currentStatus !== 'pending') {
          return sendJSON(res, 400, {
            error: 'ORDER_IMMUTABLE',
            message: `Cannot modify order in ${currentStatus} state. Only pending orders can be modified.`
          })
        }

        if (!items || !Array.isArray(items)) {
          return sendJSON(res, 400, { error: 'items array required' });
        }

        // Delete existing items and insert new ones
        await pool.query('BEGIN');
        try {
          // Delete existing items
          await pool.query('DELETE FROM public.gm_order_items WHERE order_id = $1', [orderId]);

          // Insert new items
          for (const item of items) {
            await pool.query(
              `INSERT INTO public.gm_order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                orderId,
                item.productId || item.product_id,
                item.name,
                item.quantity || 1,
                item.unitPrice || item.unit_price || item.priceCents || item.price_cents || 0,
                (item.quantity || 1) * (item.unitPrice || item.unit_price || item.priceCents || item.price_cents || 0)
              ]
            );
          }

          // Recalculate total
          const { rows: totalRows } = await pool.query(
            'SELECT COALESCE(SUM(total_price), 0) as total FROM public.gm_order_items WHERE order_id = $1',
            [orderId]
          );
          const newTotal = parseInt(totalRows[0].total || '0');

          // Update order total
          await pool.query(
            'UPDATE public.gm_orders SET total_amount = $1, updated_at = NOW() WHERE id = $2',
            [newTotal, orderId]
          );

          await pool.query('COMMIT');
        } catch (e) {
          await pool.query('ROLLBACK');
          throw e;
        }

        // Return updated order
        const { rows: updatedRows } = await pool.query(
          `SELECT o.*, 
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'product_id', oi.product_id,
                      'name', oi.product_name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price,
                      'total_price', oi.total_price
                    )
                  ) FILTER (WHERE oi.id IS NOT NULL) as items
           FROM public.gm_orders o
           LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
           WHERE o.id = $1
           GROUP BY o.id`,
          [orderId]
        )
        const order = updatedRows[0]

        // Log order update to audit_logs
        try {
          const companyId = await getCompanyIdForRestaurant(restaurantId);
          await pool.query(
            `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
             values ($1, $2, 'gm_orders', $3, 'ORDER_UPDATED', 'SYSTEM', $4)`,
            [
              companyId,
              restaurantId,
              orderId,
              JSON.stringify({
                request_id: requestId,
                items_count: items.length,
                new_total_cents: order.total_amount
              })
            ]
          );
        } catch (auditErr) {
          // Non-blocking: don't fail order update if audit log fails
          console.error('[AUDIT] Failed to log order update:', auditErr);
        }

        return sendJSON(res, 200, {
          order_id: order.id,
          short_id: order.short_id,
          state: order.status.toUpperCase(),
          total_cents: order.total_amount,
          items: order.items || []
        })
      } catch (e: any) {
        console.error('[API] /api/orders PATCH failed:', e)
        // Log order update failure (non-blocking)
        try {
          const restId = parsed?.restaurantId || WEB_MODULE_RESTAURANT_ID;
          if (restId) {
            const companyId = await getCompanyIdForRestaurant(restId);
            await pool.query(
              `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
               values ($1, $2, 'gm_orders', $3, 'ORDER_UPDATE_FAILED', 'SYSTEM', $4)`,
              [
                companyId,
                restId,
                orderId,
                JSON.stringify({
                  request_id: requestId,
                  error: e.message
                })
              ]
            );
          }
        } catch (auditErr) {
          console.error('[AUDIT] Failed to log order update failure:', auditErr);
        }
        return sendJSON(res, 500, { error: e.message })
      }
    }

    // GET /api/orders/{orderId} - Get order from gm_orders
    if (url.pathname.startsWith('/api/orders/') && req.method === 'GET' && !url.pathname.endsWith('/close') && !url.pathname.endsWith('/lock') && !url.pathname.endsWith('/status')) {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }
        const orderId = url.pathname.split('/')[3]

        const { rows } = await pool.query(
          `SELECT o.*, 
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'product_id', oi.product_id,
                      'name', oi.product_name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price,
                      'total_price', oi.total_price
                    )
                  ) FILTER (WHERE oi.id IS NOT NULL) as items
           FROM public.gm_orders o
           LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
           WHERE o.id = $1
           GROUP BY o.id`,
          [orderId]
        )

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' })
        }

        const order = rows[0]
        return sendJSON(res, 200, {
          order_id: order.id,
          short_id: order.short_id,
          state: order.status.toUpperCase(),
          total_cents: order.total_amount,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          items: order.items || []
        })
      } catch (e: any) {
        console.error('[API] GET /api/orders/{orderId} failed:', e)
        return sendJSON(res, 500, { error: e.message })
      }
    }

    // PATCH /api/orders/{orderId}/status - Update order status (pending → preparing → ready → delivered)
    if (url.pathname.endsWith('/status') && req.method === 'PATCH') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }
        const orderId = url.pathname.split('/')[3]
        const parsed = (await readJsonBody(req)) as any
        const { status } = parsed

        // Validate status
        const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'canceled'];
        if (!status || !validStatuses.includes(status)) {
          return sendJSON(res, 400, {
            error: 'INVALID_STATUS',
            message: `Status must be one of: ${validStatuses.join(', ')}`
          });
        }

        // Get current order
        const { rows } = await pool.query(
          'SELECT status FROM public.gm_orders WHERE id = $1',
          [orderId]
        )

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' })
        }

        const currentStatus = rows[0].status

        // Validate state transition (simple: can only move forward or cancel)
        if (status === 'canceled') {
          // Can cancel from any state except delivered
          if (currentStatus === 'delivered') {
            return sendJSON(res, 400, {
              error: 'INVALID_STATE_TRANSITION',
              message: 'Cannot cancel a delivered order'
            });
          }
        } else {
          // For other statuses, validate forward progression
          const statusOrder = ['pending', 'preparing', 'ready', 'delivered'];
          const currentIndex = statusOrder.indexOf(currentStatus);
          const newIndex = statusOrder.indexOf(status);

          if (currentIndex === -1 || newIndex === -1 || newIndex < currentIndex) {
            return sendJSON(res, 400, {
              error: 'INVALID_STATE_TRANSITION',
              message: `Cannot transition from ${currentStatus} to ${status}`
            });
          }
        }

        // Get restaurant_id for audit log
        const { rows: restRows } = await pool.query(
          'SELECT restaurant_id FROM public.gm_orders WHERE id = $1',
          [orderId]
        );
        const restaurantId = restRows[0]?.restaurant_id;

        // Update status
        await pool.query(
          'UPDATE public.gm_orders SET status = $1, updated_at = NOW() WHERE id = $2',
          [status, orderId]
        )

        // Log status change to audit_logs
        if (restaurantId) {
          try {
            const companyId = await getCompanyIdForRestaurant(restaurantId);
            await pool.query(
              `insert into audit_logs(company_id, restaurant_id, entity_type, entity_id, action, actor_type, payload)
               values ($1, $2, 'gm_orders', $3, 'ORDER_STATUS_CHANGED', 'SYSTEM', $4)`,
              [
                companyId,
                restaurantId,
                orderId,
                JSON.stringify({
                  request_id: requestId,
                  previous_status: currentStatus,
                  new_status: status
                })
              ]
            );
          } catch (auditErr) {
            // Non-blocking: don't fail status change if audit log fails
            console.error('[AUDIT] Failed to log order status change:', auditErr);
          }
        }

        // Return updated order
        const { rows: updatedRows } = await pool.query(
          `SELECT o.*, 
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'product_id', oi.product_id,
                      'name', oi.product_name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price,
                      'total_price', oi.total_price
                    )
                  ) FILTER (WHERE oi.id IS NOT NULL) as items
           FROM public.gm_orders o
           LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
           WHERE o.id = $1
           GROUP BY o.id`,
          [orderId]
        )
        const order = updatedRows[0]

        return sendJSON(res, 200, {
          order_id: order.id,
          short_id: order.short_id,
          state: order.status.toUpperCase(),
          total_cents: order.total_amount,
          items: order.items || []
        })
      } catch (e: any) {
        console.error('[API] PATCH /api/orders/{orderId}/status failed:', e)
        return sendJSON(res, 500, { error: e.message })
      }
    }

    // POST /api/orders/{orderId}/lock
    if (url.pathname.endsWith('/lock') && req.method === 'POST') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const orderId = url.pathname.split('/')[3]

        // Get current order
        const { rows } = await pool.query(
          'SELECT status, items FROM orders WHERE id = $1',
          [orderId]
        )

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' })
        }

        const currentStatus = rows[0].status
        if (currentStatus !== 'open') {
          return sendJSON(res, 400, {
            error: 'INVALID_STATE_TRANSITION',
            message: `Cannot lock order in ${currentStatus} state. Order must be in 'open' state.`
          })
        }

        // Calculate total from items
        const items = typeof rows[0].items === 'string' ? JSON.parse(rows[0].items) : rows[0].items
        const totalCents = Array.isArray(items)
          ? items.reduce((sum: number, item: any) => {
            const qty = item.quantity || 0
            const price = item.price_snapshot_cents || item.price_cents || 0
            return sum + (qty * price)
          }, 0)
          : 0

        // Lock order and set total
        await pool.query(
          'UPDATE orders SET status = \'locked\', total_cents = $1, updated_at = NOW() WHERE id = $2',
          [totalCents, orderId]
        )

        // Return locked order
        const { rows: updatedRows } = await pool.query(
          'SELECT id, restaurant_id, company_id, table_id, status, items, total_cents FROM orders WHERE id = $1',
          [orderId]
        )
        const order = updatedRows[0]

        return sendJSON(res, 200, {
          order_id: order.id,
          state: 'LOCKED',
          table_id: order.table_id,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          total_cents: order.total_cents || 0
        })
      } catch (e: any) {
        console.error('[API] Lock order failed:', e)
        return sendJSON(res, 500, { error: e.message })
      }
    }

    if (url.pathname.endsWith('/close') && req.method === 'POST') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const orderId = url.pathname.split('/')[3]

        // Get current order state
        const { rows } = await pool.query(
          'SELECT status FROM orders WHERE id = $1',
          [orderId]
        )

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' })
        }

        // Only allow closing from 'open' or 'locked' state
        const currentStatus = rows[0].status
        if (currentStatus === 'closed') {
          return sendJSON(res, 400, { error: 'ORDER_ALREADY_CLOSED' })
        }

        await pool.query('UPDATE orders SET status = \'closed\', updated_at = NOW() WHERE id = $1', [orderId])

        // Return updated order
        const { rows: updatedRows } = await pool.query(
          'SELECT id, restaurant_id, company_id, table_id, status, items, total_cents FROM orders WHERE id = $1',
          [orderId]
        )
        const order = updatedRows[0]

        return sendJSON(res, 200, {
          order_id: order.id,
          state: 'CLOSED',
          table_id: order.table_id,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          total_cents: order.total_cents || 0
        })
      } catch (e: any) {
        console.error('[API] Close order failed:', e)
        return sendJSON(res, 500, { error: e.message })
      }
    }

    // POST /api/payment-intent
    // Used by TPV to initiate a card payment (Operational Flow)
    if (url.pathname === '/api/payment-intent' && req.method === 'POST') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const body = await readJsonBody(req);
        const { amount_cents, currency, order_id, restaurant_id } = body;

        // 1. Resolve Credentials
        // Uses the same logic as the Web Module to find the merchant's keys
        const creds = await getMerchantGatewayCredentials(restaurant_id);
        let gateway: any;

        if (!creds) {
          // Dev Fallback for TPV flow too
          if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
            console.warn('⚠️  [TPV] Using Mock Gateway for First Sale (No Keys)');
            // Return a mock intent for testing layout if keys are missing
            // In real First Sale, we expect keys to be present in .env or DB
            if (!process.env.MERCHANT_STRIPE_KEY) {
              return sendJSON(res, 400, { error: 'GATEWAY_NOT_CONFIGURED_NO_KEYS' });
            }
            // If we have env keys but getMerchantGatewayCredentials failed context, try direct env?
            // getMerchantGatewayCredentials ALREADY checks env fallback.
            // So if we are here, we really have no keys.
            return sendJSON(res, 400, { error: 'GATEWAY_NOT_CONFIGURED' });
          } else {
            return sendJSON(res, 400, { error: 'GATEWAY_NOT_CONFIGURED' });
          }
        } else {
          gateway = new StripeGatewayAdapterV2(creds);
        }

        // 2. Create Intent
        const intent = await gateway.createPaymentIntent({
          amount_cents: Number(amount_cents),
          currency: String(currency || 'EUR'),
          order_id: order_id,
          restaurant_id: restaurant_id,
          description: `TPV Sale ${order_id}`,
          metadata: {
            source: 'TPV_APP',
            first_sale_protocol: 'true'
          }
        });

        // 3. Return Secret
        return sendJSON(res, 201, {
          intent_id: intent.intent_id,
          client_secret: intent.client_secret,
          status: intent.status
        });

      } catch (e: any) {
        console.error('[API] /api/payment-intent failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // -------------------------


    // GET /api/staff/tasks
    if (url.pathname === '/api/staff/tasks' && req.method === 'GET') {
      try {
        // if (!isSessionAuthorized(req)) { ... } // MVP: Open for local dev
        const restaurantId = String(url.searchParams.get('restaurant_id') || '');
        if (!restaurantId) return sendJSON(res, 400, { error: 'Missing restaurant_id' });

        const { rows } = await pool.query(
          `select id, title, description, status, priority, due_at, created_at
           from staff_tasks
           where restaurant_id = $1
           order by created_at desc`,
          [restaurantId]
        );
        return sendJSON(res, 200, { tasks: rows });
      } catch (e: any) {
        console.error('[API] /api/staff/tasks failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /public/:slug/events (For web analytics / pulse)
    const eventsMatch = url.pathname.match(/^\/public\/([^/]+)\/events$/);
    if (req.method === 'POST' && eventsMatch) {
      const slug = decodeURIComponent(eventsMatch[1]);
      const profile = await getPublishedRestaurantBySlug(slug);

      if (!profile) return sendJSON(res, 404, { error: 'Restaurant not found' });

      try {
        const body = await readJsonBody(req);
        // Basic validation
        if (!body.type) return sendJSON(res, 400, { error: 'Missing event type' });

        // Emit Pulse
        await emitPulseEvent({
          restaurant_id: profile.restaurant_id,
          type: String(body.type).toUpperCase(),
          source: 'WEB',
          payload: {
            slug,
            ...body.payload
          }
        });

        return sendJSON(res, 200, { received: true });
      } catch (e: any) {
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /public/:slug/orders
    const publicOrderMatch = url.pathname.match(/^\/public\/([^/]+)\/orders$/);
    if (req.method === 'POST' && publicOrderMatch) {
      const slug = decodeURIComponent(publicOrderMatch[1]);
      const profile = await getPublishedRestaurantBySlug(slug);

      if (!profile) return sendJSON(res, 404, { error: 'Restaurant not found' });

      try {
        const body = await readJsonBody(req);
        // Normalize
        const input = CreateWebOrderRequestSchema.parse(body);

        // ... verify items, calc total ...
        const result = await createWebOrderAndPaymentIntent({
          restaurantId: profile.restaurant_id,
          pickup_type: input.pickup_type,
          table_ref: input.table_ref || null,
          customer_contact: input.customer_contact || null,
          delivery_address: input.delivery_address || null,
          notes: input.notes || null,
          currency: input.currency,
          idempotency_key: input.idempotency_key || undefined,
          items: input.items
        });

        // EMIT PULSE
        await emitPulseEvent({
          restaurant_id: profile.restaurant_id,
          type: 'WEB_ORDER_CREATED',
          source: 'WEB',
          payload: {
            order_id: result.order_id,
            amount: result.total_cents,
            items_count: input.items.length
          }
        });

        return sendJSON(res, 201, result);
      } catch (e: any) {
        console.error('Order Error:', e);
        return sendJSON(res, 400, { error: e.message });
      }
    }

    // GET /api/restaurants/:id/public-profile
    const publicProfileMatch = url.pathname.match(/^\/api\/restaurants\/([^/]+)\/public-profile$/);
    if (req.method === 'GET' && publicProfileMatch) {
      const restaurantId = publicProfileMatch[1];
      try {
        // Try restaurant_web_profiles first (has slug), fallback to gm_restaurants
        const result = await pool.query(
          `SELECT rwp.slug, rwp.status, rwp.web_level, r.id as restaurant_id
           FROM gm_restaurants r
           LEFT JOIN restaurant_web_profiles rwp ON rwp.restaurant_id = r.id
           WHERE r.id = $1
           LIMIT 1`,
          [restaurantId]
        );
        if (result.rows.length === 0) {
          return sendJSON(res, 404, { error: 'Restaurant not found' });
        }
        const row = result.rows[0];
        return sendJSON(res, 200, {
          slug: row.slug || null,
          status: row.status || 'draft',
          web_level: row.web_level || 'BASIC'
        });
      } catch (e: any) {
        console.error('Public profile error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/local-boss/ingest
    if (req.method === 'POST' && url.pathname === '/api/local-boss/ingest') {
      try {
        const body = await readJsonBody(req);
        const { ingestReviews } = await import('./local-boss/ingest');
        const result = await ingestReviews(pool, body);
        return sendJSON(res, 200, result);
      } catch (e: any) {
        console.error('Local Boss ingest error:', e);
        return sendJSON(res, 400, { error: e.message });
      }
    }

    // POST /api/local-boss/run
    if (req.method === 'POST' && url.pathname === '/api/local-boss/run') {
      try {
        const body = await readJsonBody(req);
        const { analyzeTopicsForRestaurant } = await import('./local-boss/analyze-topics');
        const { restaurant_id } = body;
        if (!restaurant_id) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await analyzeTopicsForRestaurant(restaurant_id);
        return sendJSON(res, 200, { topics: result });
      } catch (e: any) {
        console.error('Local Boss run error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/local-boss/insights
    if (req.method === 'GET' && url.pathname === '/api/local-boss/insights') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }

        // Get topic insights (new system)
        const topicInsights = await pool.query(
          `SELECT topic, sentiment_score, volume, positive_count, neutral_count, negative_count, 
                  top_phrases, why_summary, date
           FROM local_boss_topic_insights
           WHERE restaurant_id = $1
           ORDER BY date DESC, volume DESC
           LIMIT 6`,
          [restaurantId]
        );

        // Get actionable recommendations
        const actions = await pool.query(
          `SELECT id, topic, priority, action_text, reason_text, status, created_at
           FROM local_boss_actions
           WHERE restaurant_id = $1
           AND status = 'pending'
           ORDER BY 
             CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
             created_at DESC
           LIMIT 10`,
          [restaurantId]
        );

        // Get overall score from reviews
        const scoreResult = await pool.query(
          `SELECT AVG(rating)::numeric(5,2) as avg_rating,
                  COUNT(*) as total_reviews,
                  COUNT(CASE WHEN sentiment_score < 0 THEN 1 END) as negative_count
           FROM local_boss_reviews
           WHERE restaurant_id = $1
           AND published_at >= NOW() - INTERVAL '30 days'`,
          [restaurantId]
        );

        const avgRating = scoreResult.rows[0]?.avg_rating || 0;
        const totalReviews = parseInt(scoreResult.rows[0]?.total_reviews || '0');
        const negativeCount = parseInt(scoreResult.rows[0]?.negative_count || '0');

        // Calculate overall score (0-100)
        let overallScore = (avgRating / 5) * 100;
        if (negativeCount > 0) {
          overallScore = Math.max(0, overallScore - (negativeCount * 2));
        }

        return sendJSON(res, 200, {
          score: Math.round(overallScore),
          totalReviews,
          topics: topicInsights.rows.map(row => ({
            topic: row.topic,
            sentimentScore: row.sentiment_score,
            volume: row.volume,
            positiveCount: row.positive_count,
            neutralCount: row.neutral_count,
            negativeCount: row.negative_count,
            topPhrases: row.top_phrases || [],
            whySummary: row.why_summary,
            date: row.date,
          })),
          recommendations: actions.rows.map(row => ({
            id: row.id,
            topic: row.topic,
            priority: row.priority,
            action: row.action_text,
            reason: row.reason_text,
            status: row.status,
            createdAt: row.created_at,
          })),
        });
      } catch (e: any) {
        console.error('Local Boss insights error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/local-boss/reviews
    if (req.method === 'GET' && url.pathname === '/api/local-boss/reviews') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const result = await pool.query(
          `SELECT id, restaurant_id, source, review_id, rating, author, text_safe, published_at
           FROM local_boss_reviews
           WHERE restaurant_id = $1
           ORDER BY published_at DESC
           LIMIT $2`,
          [restaurantId, limit]
        );
        return sendJSON(res, 200, { reviews: result.rows });
      } catch (e: any) {
        console.error('Local Boss reviews error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern/insights
    if (req.method === 'GET' && url.pathname === '/api/govern/insights') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT id, overall_rating, total_reviews, positive_count, neutral_count, negative_count,
                  summary_md, churn_reasons_json, alerts_json, window_end
           FROM govern_review_insights
           WHERE restaurant_id = $1
           ORDER BY window_end DESC
           LIMIT 1`,
          [restaurantId]
        );
        if (result.rows.length === 0) {
          return sendJSON(res, 404, { error: 'No insights found' });
        }
        return sendJSON(res, 200, result.rows[0]);
      } catch (e: any) {
        console.error('GovernManage insights error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern/actions
    if (req.method === 'GET' && url.pathname === '/api/govern/actions') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const status = url.searchParams.get('status') || 'pending';
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT id, action_title, action_description, role_target, priority, topic, reason_text, status
           FROM govern_review_actions
           WHERE restaurant_id = $1
             AND status = $2
           ORDER BY 
             CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
             created_at DESC`,
          [restaurantId, status]
        );
        return sendJSON(res, 200, { actions: result.rows });
      } catch (e: any) {
        console.error('GovernManage actions error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/govern/actions/:id/complete
    if (req.method === 'POST' && url.pathname.match(/^\/api\/govern\/actions\/[^\/]+\/complete$/)) {
      try {
        const actionId = url.pathname.split('/')[4];
        await pool.query(
          `UPDATE govern_review_actions
           SET status = 'completed',
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [actionId]
        );
        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('GovernManage complete action error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/govern/run
    if (req.method === 'POST' && url.pathname === '/api/govern/run') {
      try {
        const body = await readJsonBody(req);
        const { runGovernManagePipeline } = await import('./govern/worker');
        const { restaurant_id } = body;
        if (!restaurant_id) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await runGovernManagePipeline(restaurant_id);
        return sendJSON(res, 200, result);
      } catch (e: any) {
        console.error('GovernManage run error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/reservations
    if (req.method === 'GET' && url.pathname === '/api/reservations') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getReservations } = await import('./reservations/reservation-service');
        const reservations = await getReservations(restaurantId, date, date);
        return sendJSON(res, 200, { reservations });
      } catch (e: any) {
        console.error('Reservations error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/reservations/waitlist
    if (req.method === 'GET' && url.pathname === '/api/reservations/waitlist') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getWaitlist } = await import('./reservations/waitlist-service');
        const entries = await getWaitlist(restaurantId, 'waiting');
        return sendJSON(res, 200, { entries });
      } catch (e: any) {
        console.error('Waitlist error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/reputation-hub/locations
    if (req.method === 'GET' && url.pathname === '/api/reputation-hub/locations') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getLocations } = await import('./reputation-hub/multi-location-manager');
        const locations = await getLocations(restaurantId);
        return sendJSON(res, 200, { locations });
      } catch (e: any) {
        console.error('ReputationHub locations error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/reputation-hub/unanswered
    if (req.method === 'GET' && url.pathname === '/api/reputation-hub/unanswered') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getUnansweredReviews } = await import('./reputation-hub/response-generator');
        const reviews = await getUnansweredReviews(restaurantId);
        return sendJSON(res, 200, { reviews });
      } catch (e: any) {
        console.error('ReputationHub unanswered error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/reputation-hub/campaigns
    if (req.method === 'GET' && url.pathname === '/api/reputation-hub/campaigns') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT id, campaign_name, target_rating, current_rating, reviews_needed,
                  reviews_received, status
           FROM reputation_hub_campaigns
           WHERE restaurant_id = $1
             AND status = 'active'
           ORDER BY created_at DESC`,
          [restaurantId]
        );
        return sendJSON(res, 200, { campaigns: result.rows });
      } catch (e: any) {
        console.error('ReputationHub campaigns error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/operational-hub/fast-mode
    if (req.method === 'GET' && url.pathname === '/api/operational-hub/fast-mode') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getFastModeConfig } = await import('./operational-hub/fast-mode-service');
        const config = await getFastModeConfig(restaurantId);
        return sendJSON(res, 200, { config });
      } catch (e: any) {
        console.error('OperationalHub fast-mode error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/operational-hub/stock/low
    if (req.method === 'GET' && url.pathname === '/api/operational-hub/stock/low') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getLowStockItems } = await import('./operational-hub/stock-service');
        const items = await getLowStockItems(restaurantId);
        return sendJSON(res, 200, { items });
      } catch (e: any) {
        console.error('OperationalHub stock error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/operational-hub/time-tracking/active
    if (req.method === 'GET' && url.pathname === '/api/operational-hub/time-tracking/active') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getAllShifts } = await import('./operational-hub/time-tracking-service');
        const today = new Date().toISOString().split('T')[0];
        const shifts = await getAllShifts(restaurantId, today, today);
        const activeShifts = shifts.filter(s => s.status === 'in_progress');
        return sendJSON(res, 200, { shifts: activeShifts });
      } catch (e: any) {
        console.error('OperationalHub time-tracking error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/operational-hub/delivery/channels
    if (req.method === 'GET' && url.pathname === '/api/operational-hub/delivery/channels') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getDeliveryChannels } = await import('./operational-hub/delivery-integration-service');
        const channels = await getDeliveryChannels(restaurantId);
        return sendJSON(res, 200, { channels });
      } catch (e: any) {
        console.error('OperationalHub delivery error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/operational-hub/analytics
    if (req.method === 'GET' && url.pathname === '/api/operational-hub/analytics') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { generateDailySnapshot } = await import('./operational-hub/analytics-service');
        const snapshot = await generateDailySnapshot(restaurantId, date);
        return sendJSON(res, 200, { snapshot });
      } catch (e: any) {
        console.error('OperationalHub analytics error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/events/types
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/events/types') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT 
             event_type as type,
             COUNT(*) as count,
             MAX(created_at) as last_occurrence
           FROM operational_events
           WHERE restaurant_id = $1
           GROUP BY event_type
           ORDER BY count DESC`,
          [restaurantId]
        );
        return sendJSON(res, 200, { event_types: result.rows });
      } catch (e: any) {
        console.error('GovernManage events/types error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/rules
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/rules') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT 
             id,
             rule_name,
             rule_type,
             trigger_events,
             enabled,
             priority,
             jsonb_array_length(actions) as actions_count
           FROM govern_rules
           WHERE restaurant_id = $1
           ORDER BY enabled DESC, priority ASC, rule_name`,
          [restaurantId]
        );
        return sendJSON(res, 200, { rules: result.rows });
      } catch (e: any) {
        console.error('GovernManage rules error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/govern-manage/rules/:id/toggle
    if (req.method === 'POST' && url.pathname.startsWith('/api/govern-manage/rules/') && url.pathname.endsWith('/toggle')) {
      try {
        const ruleId = url.pathname.split('/')[5];
        const body = await readJsonBody(req);
        const enabled = body.enabled !== undefined ? body.enabled : true;

        await pool.query(
          `UPDATE govern_rules
           SET enabled = $1, updated_at = NOW()
           WHERE id = $2`,
          [enabled, ruleId]
        );
        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('GovernManage rules toggle error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/feature-flags
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/feature-flags') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT feature_key, enabled, enabled_at
           FROM govern_feature_flags
           WHERE restaurant_id = $1
           ORDER BY feature_key`,
          [restaurantId]
        );
        return sendJSON(res, 200, { flags: result.rows });
      } catch (e: any) {
        console.error('GovernManage feature-flags error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/govern-manage/feature-flags/:key
    if (req.method === 'POST' && url.pathname.startsWith('/api/govern-manage/feature-flags/')) {
      try {
        const featureKey = url.pathname.split('/')[5];
        let body: any = {};
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const data = Buffer.concat(chunks).toString();
          if (data) body = JSON.parse(data);
        } catch { }
        const restaurantId = url.searchParams.get('restaurant_id') || body.restaurant_id;
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const enabled = body.enabled !== undefined ? body.enabled : true;

        const { setFeatureFlag } = await import('./govern-manage/governance-engine');
        await setFeatureFlag(restaurantId, featureKey, enabled);
        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('GovernManage feature-flags set error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/patterns
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/patterns') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const result = await pool.query(
          `SELECT id, pattern_type, pattern_key, confidence, occurrence_count, last_seen_at
           FROM govern_patterns
           WHERE restaurant_id = $1
             AND is_active = true
           ORDER BY last_seen_at DESC, confidence DESC
           LIMIT 20`,
          [restaurantId]
        );
        return sendJSON(res, 200, { patterns: result.rows });
      } catch (e: any) {
        console.error('GovernManage patterns error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/decisions
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/decisions') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const eventType = url.searchParams.get('event_type') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const actionType = url.searchParams.get('action_type') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const { getDecisionHistory } = await import('./govern-manage/decision-service');
        const decisions = await getDecisionHistory(restaurantId, {
          event_type: eventType,
          priority: priority as any,
          action_type: actionType,
          limit,
        });
        return sendJSON(res, 200, { decisions });
      } catch (e: any) {
        console.error('GovernManage decisions error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/decisions/:id
    if (req.method === 'GET' && url.pathname.startsWith('/api/govern-manage/decisions/')) {
      try {
        const decisionId = url.pathname.split('/')[5];
        const { getDecisionDetails } = await import('./govern-manage/decision-service');
        const decision = await getDecisionDetails(decisionId);
        if (!decision) {
          return sendJSON(res, 404, { error: 'Decision not found' });
        }
        return sendJSON(res, 200, { decision });
      } catch (e: any) {
        console.error('GovernManage decision details error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/rules/:id/simulate
    if (req.method === 'GET' && url.pathname.startsWith('/api/govern-manage/rules/') && url.pathname.endsWith('/simulate')) {
      try {
        const ruleId = url.pathname.split('/')[5];
        const restaurantId = url.searchParams.get('restaurant_id');
        const days = parseInt(url.searchParams.get('days') || '7');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { simulateRule } = await import('./govern-manage/rule-simulator');
        const result = await simulateRule(restaurantId, ruleId, days);
        return sendJSON(res, 200, { simulation: result });
      } catch (e: any) {
        console.error('GovernManage rule simulate error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/tasks/:id/why
    if (req.method === 'GET' && url.pathname.startsWith('/api/govern-manage/tasks/') && url.pathname.endsWith('/why')) {
      try {
        const taskId = url.pathname.split('/')[5];
        const { getTaskWhyInfo } = await import('./govern-manage/task-why-service');
        const whyInfo = await getTaskWhyInfo(taskId);
        if (!whyInfo) {
          return sendJSON(res, 404, { error: 'Why info not found for this task' });
        }
        return sendJSON(res, 200, { why: whyInfo });
      } catch (e: any) {
        console.error('GovernManage task why error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/govern-manage/decisions/export
    if (req.method === 'GET' && url.pathname === '/api/govern-manage/decisions/export') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const format = url.searchParams.get('format') || 'csv';
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const eventType = url.searchParams.get('event_type') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const actionType = url.searchParams.get('action_type') || undefined;
        const startDate = url.searchParams.get('start_date') || undefined;
        const endDate = url.searchParams.get('end_date') || undefined;

        const { exportDecisionsCSV, exportDecisionsJSON } = await import('./govern-manage/export-service');

        if (format === 'csv') {
          const csv = await exportDecisionsCSV(restaurantId, {
            event_type: eventType,
            priority: priority,
            action_type: actionType,
            start_date: startDate,
            end_date: endDate,
          });
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="governmanage-decisions-${new Date().toISOString().split('T')[0]}.csv"`,
          });
          res.end(csv);
          return;
        } else if (format === 'json') {
          const json = await exportDecisionsJSON(restaurantId, {
            event_type: eventType,
            priority: priority,
            action_type: actionType,
            start_date: startDate,
            end_date: endDate,
          });
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="governmanage-decisions-${new Date().toISOString().split('T')[0]}.json"`,
          });
          res.end(JSON.stringify(json, null, 2));
          return;
        } else {
          return sendJSON(res, 400, { error: 'Invalid format. Use csv or json' });
        }
      } catch (e: any) {
        console.error('GovernManage export error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/event-bus/events
    if (req.method === 'GET' && url.pathname === '/api/event-bus/events') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const eventType = url.searchParams.get('event_type') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const status = url.searchParams.get('status') || undefined;
        const sourceModule = url.searchParams.get('source_module') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const { getEvents } = await import('./operational-event-bus/event-bus');
        const events = await getEvents(restaurantId, {
          event_type: eventType as any,
          priority: priority as any,
          status: status as any,
          source_module: sourceModule,
          limit,
        });
        return sendJSON(res, 200, { events });
      } catch (e: any) {
        console.error('Event Bus error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/event-bus/events/:id/resolve
    if (req.method === 'POST' && url.pathname.startsWith('/api/event-bus/events/') && url.pathname.endsWith('/resolve')) {
      try {
        const eventId = url.pathname.split('/')[4];
        const userId = url.searchParams.get('user_id') || req.headers['x-user-id'] as string;
        if (!userId) {
          return sendJSON(res, 400, { error: 'user_id required' });
        }
        const { resolveEvent } = await import('./operational-event-bus/event-bus');
        await resolveEvent(eventId, userId);
        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('Event Bus resolve error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // ========== VOICE OPERATIONS LAYER (VOL) ==========

    // POST /api/voice/devices/register
    if (req.method === 'POST' && url.pathname === '/api/voice/devices/register') {
      try {
        const body = await readJsonBody(req);
        const { registerDevice } = await import('./voice/voice-service');
        const device = await registerDevice({
          restaurant_id: body.restaurant_id,
          device_name: body.device_name,
          device_type: body.device_type || 'alexa',
          device_id: body.device_id,
          location: body.location,
          volume: body.volume,
          language: body.language,
        });
        return sendJSON(res, 200, { device });
      } catch (e: any) {
        console.error('Voice device registration error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/voice/events
    if (req.method === 'POST' && url.pathname === '/api/voice/events') {
      try {
        const body = await readJsonBody(req);
        const { createVoiceEvent } = await import('./voice/voice-service');
        const { emitEvent } = await import('./operational-event-bus/event-bus');

        const voiceEvent = await createVoiceEvent({
          restaurant_id: body.restaurant_id,
          device_id: body.device_id,
          event_type: body.event_type,
          direction: body.direction,
          intent: body.intent,
          spoken_text: body.spoken_text,
          response_text: body.response_text,
          context: body.context || {},
          created_by: body.created_by,
        });

        // Emit Event Bus event if system_to_voice
        if (voiceEvent.direction === 'system_to_voice') {
          await emitEvent({
            restaurant_id: voiceEvent.restaurant_id,
            event_type: 'voice_reminder',
            priority: 'P2',
            source_module: 'voice',
            source_id: voiceEvent.id,
            context: {
              voice_event_id: voiceEvent.id,
              announcement_text: voiceEvent.response_text,
            },
            auto_route: true,
          });
        } else if (voiceEvent.direction === 'voice_to_system') {
          await emitEvent({
            restaurant_id: voiceEvent.restaurant_id,
            event_type: 'voice_trigger',
            priority: 'P1',
            source_module: 'voice',
            source_id: voiceEvent.id,
            context: {
              voice_event_id: voiceEvent.id,
              intent: voiceEvent.intent,
              spoken_text: voiceEvent.spoken_text,
            },
            auto_route: true,
          });
        }

        return sendJSON(res, 200, { event: voiceEvent });
      } catch (e: any) {
        console.error('Voice event creation error:', e);
        if (e.message.includes('disabled')) {
          return sendJSON(res, 403, { error: e.message });
        }
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/voice/events/:id/ack
    if (req.method === 'POST' && url.pathname.startsWith('/api/voice/events/') && url.pathname.endsWith('/ack')) {
      try {
        const eventId = url.pathname.split('/')[4];
        const body = await readJsonBody(req);
        const { acknowledgeVoiceEvent } = await import('./voice/voice-service');
        const { emitEvent } = await import('./operational-event-bus/event-bus');

        await acknowledgeVoiceEvent(eventId, {
          acknowledged_by: body.acknowledged_by,
          acknowledgment_type: body.acknowledgment_type || 'voice',
          acknowledgment_text: body.acknowledgment_text,
        });

        // Emit Event Bus event
        const eventResult = await pool.query('SELECT restaurant_id FROM voice_events WHERE id = $1', [eventId]);
        if (eventResult.rows[0]) {
          await emitEvent({
            restaurant_id: eventResult.rows[0].restaurant_id,
            event_type: 'voice_acknowledged',
            priority: 'P2',
            source_module: 'voice',
            source_id: eventId,
            context: {
              voice_event_id: eventId,
              acknowledgment_type: body.acknowledgment_type || 'voice',
            },
            auto_route: false,
          });
        }

        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('Voice event acknowledgment error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/voice/routines
    if (req.method === 'GET' && url.pathname === '/api/voice/routines') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getVoiceRoutines } = await import('./voice/voice-service');
        const routines = await getVoiceRoutines(restaurantId);
        return sendJSON(res, 200, { routines });
      } catch (e: any) {
        console.error('Voice routines error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/voice/routines/:id/toggle
    if (req.method === 'POST' && url.pathname.startsWith('/api/voice/routines/') && url.pathname.endsWith('/toggle')) {
      try {
        const routineId = url.pathname.split('/')[4];
        const body = await readJsonBody(req);
        const { toggleVoiceRoutine } = await import('./voice/voice-service');
        const routine = await toggleVoiceRoutine(routineId, body.enabled);
        return sendJSON(res, 200, { routine });
      } catch (e: any) {
        console.error('Voice routine toggle error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/voice/status
    if (req.method === 'GET' && url.pathname === '/api/voice/status') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const locationId = url.searchParams.get('location_id') || undefined;
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getVoiceStatus } = await import('./voice/voice-service');
        const status = await getVoiceStatus(restaurantId, locationId);
        return sendJSON(res, 200, status);
      } catch (e: any) {
        console.error('Voice status error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // ========== PORTIONING & COST REAL ==========

    // GET /api/portioning/base-products
    if (req.method === 'GET' && url.pathname === '/api/portioning/base-products') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getBaseProducts } = await import('./portioning/portioning-service');
        const products = await getBaseProducts(restaurantId);
        return sendJSON(res, 200, { products });
      } catch (e: any) {
        console.error('Portioning base products error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/portioning/base-products/:id
    if (req.method === 'GET' && url.pathname.startsWith('/api/portioning/base-products/')) {
      try {
        const productId = url.pathname.split('/')[4];
        const { getBaseProduct } = await import('./portioning/portioning-service');
        const product = await getBaseProduct(productId);
        if (!product) {
          return sendJSON(res, 404, { error: 'Product not found' });
        }
        return sendJSON(res, 200, { product });
      } catch (e: any) {
        console.error('Portioning base product error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/portioning/base-products
    if (req.method === 'POST' && url.pathname === '/api/portioning/base-products') {
      try {
        const body = await readJsonBody(req);
        const { upsertBaseProduct } = await import('./portioning/portioning-service');
        const product = await upsertBaseProduct({
          restaurant_id: body.restaurant_id,
          id: body.id,
          name: body.name,
          cost_total_cents: body.cost_total_cents,
          weight_total_g: body.weight_total_g,
          loss_percent: body.loss_percent,
          portion_weight_g: body.portion_weight_g,
          thickness_mm: body.thickness_mm,
          currency: body.currency,
        });
        return sendJSON(res, 200, { product });
      } catch (e: any) {
        console.error('Portioning base product upsert error:', e);
        if (e.message.includes('disabled')) {
          return sendJSON(res, 403, { error: e.message });
        }
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/portioning/sessions
    if (req.method === 'POST' && url.pathname === '/api/portioning/sessions') {
      try {
        const body = await readJsonBody(req);
        const { startSession } = await import('./portioning/portioning-service');
        const session = await startSession({
          restaurant_id: body.restaurant_id,
          base_product_id: body.base_product_id,
          target_portions: body.target_portions,
          session_date: body.session_date,
        });
        return sendJSON(res, 200, { session });
      } catch (e: any) {
        console.error('Portioning session start error:', e);
        if (e.message.includes('disabled')) {
          return sendJSON(res, 403, { error: e.message });
        }
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // P0-1 FIX: POST /api/fiscal/invoicexpress/invoices - Proxy seguro para InvoiceXpress API
    // API key nunca é exposta ao cliente - backend busca do banco e faz chamada real
    if (req.method === 'POST' && url.pathname === '/api/fiscal/invoicexpress/invoices') {
      try {
        // Verificar autenticação (token do cliente ou service key interno)
        const authHeader = req.headers['x-chefiapp-token'] || req.headers['x-internal-service-key'];
        const isInternal = req.headers['x-internal-service-key'] === INTERNAL_API_TOKEN;
        
        // Permitir chamadas internas (Edge Functions) ou autenticadas
        if (!isInternal && !authHeader) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'Missing authentication token' });
        }

        const body = await readJsonBody(req);
        const { invoice, accountName } = body;

        if (!invoice || !accountName) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', message: 'Missing invoice or accountName' });
        }

        // Buscar API key do banco de dados (nunca do cliente)
        const client = await pool.connect();
        try {
          const { rows } = await client.query(
            `SELECT fiscal_config->'invoicexpress'->>'apiKey' as api_key,
                    fiscal_config->'invoicexpress'->>'accountName' as account_name
             FROM gm_restaurants
             WHERE fiscal_config->'invoicexpress'->>'accountName' = $1
             LIMIT 1`,
            [accountName]
          );

          if (rows.length === 0) {
            return sendJSON(res, 404, { error: 'RESTAURANT_NOT_FOUND', message: 'Restaurant with this accountName not found' });
          }

          const apiKey = rows[0].api_key;
          if (!apiKey) {
            return sendJSON(res, 400, { error: 'FISCAL_NOT_CONFIGURED', message: 'InvoiceXpress API key not configured for this restaurant' });
          }

          // Fazer chamada real à API InvoiceXpress (API key seguro no backend)
          const invoiceXpressUrl = `https://${accountName}.app.invoicexpress.com/invoices.json?api_key=${apiKey}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          try {
            const response = await fetch(invoiceXpressUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ invoice }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `InvoiceXpress API Error (${response.status})`;
              
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.errors?.join(', ') || errorJson.message || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }

              // Categorizar erro
              if (response.status >= 500) {
                return sendJSON(res, 502, { error: 'INVOICEXPRESS_SERVER_ERROR', message: errorMessage });
              } else if (response.status === 429) {
                return sendJSON(res, 429, { error: 'RATE_LIMIT', message: errorMessage });
              } else {
                return sendJSON(res, 400, { error: 'INVOICEXPRESS_CLIENT_ERROR', message: errorMessage });
              }
            }

            const data = await response.json();
            
            // InvoiceXpress returns { invoice: {...} }
            const invoiceResult = data.invoice || data;
            
            return sendJSON(res, 200, { invoice: invoiceResult });

          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
              return sendJSON(res, 504, { error: 'TIMEOUT', message: 'InvoiceXpress API did not respond in time' });
            }
            
            throw fetchError;
          }

        } finally {
          client.release();
        }

      } catch (e: any) {
        console.error('[API] /api/fiscal/invoicexpress/invoices POST failed:', e);
        return sendJSON(res, 500, { error: 'INTERNAL_ERROR', message: e.message });
      }
    }

    // POST /api/portioning/measurements
    if (req.method === 'POST' && url.pathname === '/api/portioning/measurements') {
      try {
        const body = await readJsonBody(req);
        const { registerMeasurement } = await import('./portioning/portioning-service');
        const { emitEvent } = await import('./operational-event-bus/event-bus');

        const result = await registerMeasurement({
          session_id: body.session_id,
          measured_weight_g: body.measured_weight_g,
          measured_thickness_mm: body.measured_thickness_mm,
          notes: body.notes,
          created_by: body.created_by,
        });

        // If alert was created, emit event
        if (result.alert) {
          // Get session and product details for context
          const { Pool } = await import('pg');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const sessionResult = await pool.query(
            `SELECT s.*, p.name as base_product_name, p.portion_weight_g as target_weight_g, 
                    p.thickness_mm as target_thickness_mm, s.target_portions, s.restaurant_id
             FROM portioning_sessions s
             JOIN portioning_base_products p ON p.id = s.base_product_id
             WHERE s.id = $1`,
            [body.session_id]
          );

          const session = sessionResult.rows[0];
          await pool.end();
          const impactYearlyFormatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: result.alert.currency,
          }).format(result.alert.impact_yearly_cents / 100);

          await emitEvent({
            restaurant_id: body.restaurant_id || session.restaurant_id,
            event_type: 'portion_drift_detected',
            priority: 'P1',
            source_module: 'portioning',
            source_id: result.alert.id,
            context: {
              alert_id: result.alert.id,
              session_id: body.session_id,
              base_product_id: result.alert.base_product_id,
              base_product_name: session?.base_product_name,
              target_weight_g: session?.target_weight_g,
              target_thickness_mm: session?.target_thickness_mm,
              target_portions: session?.target_portions,
              avg_variation_g: result.alert.avg_variation_g,
              impact_monthly_cents: result.alert.impact_monthly_cents,
              impact_yearly_cents: result.alert.impact_yearly_cents,
              impact_yearly_formatted: impactYearlyFormatted,
              currency: result.alert.currency,
              message: result.alert.message,
            },
            target_roles: ['manager', 'kitchen'],
            auto_route: true,
          });
        }

        return sendJSON(res, 200, { measurement: result.measurement, alert: result.alert });
      } catch (e: any) {
        console.error('Portioning measurement error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET /api/portioning/alerts
    if (req.method === 'GET' && url.pathname === '/api/portioning/alerts') {
      try {
        const restaurantId = url.searchParams.get('restaurant_id');
        const status = url.searchParams.get('status') || 'open';
        if (!restaurantId) {
          return sendJSON(res, 400, { error: 'restaurant_id required' });
        }
        const { getOpenAlerts } = await import('./portioning/portioning-service');
        const alerts = status === 'open'
          ? await getOpenAlerts(restaurantId)
          : await getOpenAlerts(restaurantId); // TODO: filter by status
        return sendJSON(res, 200, { alerts });
      } catch (e: any) {
        console.error('Portioning alerts error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/portioning/alerts/:id/ack
    if (req.method === 'POST' && url.pathname.startsWith('/api/portioning/alerts/') && url.pathname.endsWith('/ack')) {
      try {
        const alertId = url.pathname.split('/')[4];
        const body = await readJsonBody(req);
        const { acknowledgeAlert } = await import('./portioning/portioning-service');
        await acknowledgeAlert(alertId, {
          acknowledged_by: body.acknowledged_by,
        });
        return sendJSON(res, 200, { success: true });
      } catch (e: any) {
        console.error('Portioning alert ack error:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // ========== RESTAURANT GROUPS (Multi-Location UI - Q2 2026 Feature 2) ==========

    const groupService = new RestaurantGroupService(pool);

    // POST /api/restaurant-groups - Create a new restaurant group
    if (url.pathname === '/api/restaurant-groups' && req.method === 'POST') {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const body = await readJsonBody(req);
        const parsed = z.object({
          name: z.string().min(3).max(120),
          restaurantIds: z.array(z.string().uuid()).min(1),
          sharedMenu: z.boolean().default(false),
          sharedMarketplaceAccount: z.boolean().default(false),
          consolidatedBilling: z.boolean().default(false),
          allowLocationOverrides: z.boolean().default(true),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        const group = await groupService.createGroup(userId, parsed.data);
        await logAuditEvent(pool, 'system', 'restaurant_group_created', {
          group_id: group.id,
          owner_id: userId,
          restaurant_count: parsed.data.restaurantIds.length,
        });

        return sendJSON(res, 201, { ok: true, group });
      } catch (e: any) {
        console.error('[API] POST /api/restaurant-groups failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // GET /api/restaurant-groups - Get all groups for user
    if (url.pathname === '/api/restaurant-groups' && req.method === 'GET') {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const groups = await groupService.getGroupsForUser(userId);
        return sendJSON(res, 200, { groups });
      } catch (e: any) {
        console.error('[API] GET /api/restaurant-groups failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // GET /api/restaurant-groups/:groupId - Get specific group
    const groupMatch = url.pathname.match(/^\/api\/restaurant-groups\/([^/]+)$/);
    if (req.method === 'GET' && groupMatch) {
      try {
        const groupId = decodeURIComponent(groupMatch[1]);
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const group = await groupService.getGroup(groupId, userId);
        if (!group) {
          return sendJSON(res, 404, { error: 'GROUP_NOT_FOUND' });
        }

        return sendJSON(res, 200, { group });
      } catch (e: any) {
        console.error('[API] GET /api/restaurant-groups/:id failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // POST /api/restaurant-groups/:groupId/restaurants - Add restaurant to group
    const addRestaurantMatch = url.pathname.match(/^\/api\/restaurant-groups\/([^/]+)\/restaurants$/);
    if (req.method === 'POST' && addRestaurantMatch) {
      try {
        const groupId = decodeURIComponent(addRestaurantMatch[1]);
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const body = await readJsonBody(req);
        const parsed = z.object({
          restaurantId: z.string().uuid(),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        const result = await groupService.addRestaurantToGroup(groupId, userId, parsed.data.restaurantId);
        await logAuditEvent(pool, 'system', 'restaurant_added_to_group', {
          group_id: groupId,
          restaurant_id: parsed.data.restaurantId,
          owner_id: userId,
        });

        return sendJSON(res, 200, { ok: true, ...result });
      } catch (e: any) {
        console.error('[API] POST /api/restaurant-groups/:id/restaurants failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // GET /api/restaurant-groups/:groupId/dashboard - Get consolidated dashboard
    const dashboardMatch = url.pathname.match(/^\/api\/restaurant-groups\/([^/]+)\/dashboard$/);
    if (req.method === 'GET' && dashboardMatch) {
      try {
        const groupId = decodeURIComponent(dashboardMatch[1]);
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const dashboard = await groupService.getGroupDashboard(groupId, userId);
        return sendJSON(res, 200, dashboard);
      } catch (e: any) {
        console.error('[API] GET /api/restaurant-groups/:id/dashboard failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // POST /api/restaurant-groups/:groupId/sync-menu - Sync menu across group
    const syncMenuMatch = url.pathname.match(/^\/api\/restaurant-groups\/([^/]+)\/sync-menu$/);
    if (req.method === 'POST' && syncMenuMatch) {
      try {
        const groupId = decodeURIComponent(syncMenuMatch[1]);
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { error: 'UNAUTHORIZED', message: 'User ID required' });
        }

        const body = await readJsonBody(req);
        const parsed = z.object({
          sourceRestaurantId: z.string().uuid(),
          targetRestaurantIds: z.array(z.string().uuid()).min(1),
          overwriteExisting: z.boolean().default(false),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        const result = await groupService.syncMenu(groupId, userId, parsed.data);
        await logAuditEvent(pool, 'system', 'menu_synced_across_group', {
          group_id: groupId,
          source_restaurant_id: parsed.data.sourceRestaurantId,
          target_count: parsed.data.targetRestaurantIds.length,
          items_synced: result.itemsSynced,
        });

        return sendJSON(res, 200, { ok: true, ...result });
      } catch (e: any) {
        console.error('[API] POST /api/restaurant-groups/:id/sync-menu failed:', e);
        return sendJSON(res, 500, { error: e.message || 'INTERNAL_ERROR' });
      }
    }

    // ============================================================================
    // CONSUMPTION GROUPS API (Divisão de Conta)
    // ============================================================================

    // GET /api/consumption-groups?order_id=...
    if (url.pathname === '/api/consumption-groups' && req.method === 'GET') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const orderId = url.searchParams.get('order_id');
        if (!orderId) {
          return sendJSON(res, 400, { error: 'ORDER_ID_REQUIRED' });
        }

        // Get groups with totals from view
        const { rows } = await pool.query(
          `SELECT 
            cg.*,
            COALESCE(SUM((oi.price_snapshot / 100.0) * oi.quantity), 0) AS total_amount,
            COUNT(oi.id) AS items_count
           FROM public.consumption_groups cg
           LEFT JOIN public.gm_order_items oi ON oi.consumption_group_id = cg.id
           WHERE cg.order_id = $1 AND cg.status = 'active'
           GROUP BY cg.id
           ORDER BY cg.position ASC`,
          [orderId]
        );

        return sendJSON(res, 200, { groups: rows });
      } catch (e: any) {
        console.error('[API] GET /api/consumption-groups failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/consumption-groups
    if (url.pathname === '/api/consumption-groups' && req.method === 'POST') {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const body = await readJsonBody(req);
        const parsed = z.object({
          order_id: z.string().uuid(),
          label: z.string().min(1),
          color: z.string().optional().default('#3B82F6'),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        // Get order to get restaurant_id
        const orderResult = await pool.query(
          'SELECT restaurant_id FROM public.gm_orders WHERE id = $1',
          [parsed.data.order_id]
        );

        if (orderResult.rows.length === 0) {
          return sendJSON(res, 404, { error: 'ORDER_NOT_FOUND' });
        }

        const restaurantId = orderResult.rows[0].restaurant_id;

        // Get max position for this order
        const positionResult = await pool.query(
          'SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM public.consumption_groups WHERE order_id = $1',
          [parsed.data.order_id]
        );
        const nextPosition = positionResult.rows[0].next_position;

        // Create group
        const { rows } = await pool.query(
          `INSERT INTO public.consumption_groups (restaurant_id, order_id, label, color, position)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [restaurantId, parsed.data.order_id, parsed.data.label, parsed.data.color, nextPosition]
        );

        await logAuditEvent(pool, restaurantId, 'consumption_group_created', {
          group_id: rows[0].id,
          order_id: parsed.data.order_id,
          label: parsed.data.label,
        });

        return sendJSON(res, 201, { group: rows[0] });
      } catch (e: any) {
        console.error('[API] POST /api/consumption-groups failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // PATCH /api/consumption-groups/:id
    const updateGroupMatch = url.pathname.match(/^\/api\/consumption-groups\/([^/]+)$/);
    if (req.method === 'PATCH' && updateGroupMatch) {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const groupId = decodeURIComponent(updateGroupMatch[1]);
        const body = await readJsonBody(req);
        const parsed = z.object({
          label: z.string().min(1).optional(),
          color: z.string().optional(),
          status: z.enum(['active', 'paid', 'cancelled']).optional(),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (parsed.data.label !== undefined) {
          updates.push(`label = $${paramIndex++}`);
          values.push(parsed.data.label);
        }
        if (parsed.data.color !== undefined) {
          updates.push(`color = $${paramIndex++}`);
          values.push(parsed.data.color);
        }
        if (parsed.data.status !== undefined) {
          updates.push(`status = $${paramIndex++}`);
          values.push(parsed.data.status);
          if (parsed.data.status === 'paid') {
            updates.push(`paid_at = NOW()`);
          }
        }

        if (updates.length === 0) {
          return sendJSON(res, 400, { error: 'NO_UPDATES' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(groupId);

        const { rows } = await pool.query(
          `UPDATE public.consumption_groups 
           SET ${updates.join(', ')}
           WHERE id = $${paramIndex}
           RETURNING *`,
          values
        );

        if (rows.length === 0) {
          return sendJSON(res, 404, { error: 'GROUP_NOT_FOUND' });
        }

        return sendJSON(res, 200, { group: rows[0] });
      } catch (e: any) {
        console.error('[API] PATCH /api/consumption-groups/:id failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // POST /api/consumption-groups/:id/pay
    const payGroupMatch = url.pathname.match(/^\/api\/consumption-groups\/([^/]+)\/pay$/);
    if (req.method === 'POST' && payGroupMatch) {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const groupId = decodeURIComponent(payGroupMatch[1]);
        const body = await readJsonBody(req);
        const parsed = z.object({
          payment_method: z.string(),
          amount_cents: z.number().int().positive(),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        // Get group and calculate total
        const groupResult = await pool.query(
          `SELECT cg.*, 
                  COALESCE(SUM((oi.price_snapshot / 100.0) * oi.quantity), 0) AS total_amount
           FROM public.consumption_groups cg
           LEFT JOIN public.gm_order_items oi ON oi.consumption_group_id = cg.id
           WHERE cg.id = $1
           GROUP BY cg.id`,
          [groupId]
        );

        if (groupResult.rows.length === 0) {
          return sendJSON(res, 404, { error: 'GROUP_NOT_FOUND' });
        }

        const group = groupResult.rows[0];
        const totalCents = Math.round(group.total_amount * 100);

        if (parsed.data.amount_cents !== totalCents) {
          return sendJSON(res, 400, {
            error: 'AMOUNT_MISMATCH',
            expected: totalCents,
            received: parsed.data.amount_cents
          });
        }

        // Mark group as paid
        const { rows } = await pool.query(
          `UPDATE public.consumption_groups 
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [groupId]
        );

        await logAuditEvent(pool, group.restaurant_id, 'consumption_group_paid', {
          group_id: groupId,
          order_id: group.order_id,
          amount_cents: totalCents,
          payment_method: parsed.data.payment_method,
        });

        return sendJSON(res, 200, { group: rows[0] });
      } catch (e: any) {
        console.error('[API] POST /api/consumption-groups/:id/pay failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // PATCH /api/order-items/:id/group
    const moveItemMatch = url.pathname.match(/^\/api\/order-items\/([^/]+)\/group$/);
    if (req.method === 'PATCH' && moveItemMatch) {
      try {
        if (!isSessionAuthorized(req)) {
          return sendJSON(res, 401, { error: 'SESSION_REQUIRED' });
        }

        const itemId = decodeURIComponent(moveItemMatch[1]);
        const body = await readJsonBody(req);
        const parsed = z.object({
          consumption_group_id: z.string().uuid().nullable(),
        }).safeParse(body);

        if (!parsed.success) {
          return sendJSON(res, 400, { error: 'INVALID_BODY', details: parsed.error.flatten() });
        }

        // Get current item
        const itemResult = await pool.query(
          'SELECT consumption_group_id, order_id FROM public.gm_order_items WHERE id = $1',
          [itemId]
        );

        if (itemResult.rows.length === 0) {
          return sendJSON(res, 404, { error: 'ITEM_NOT_FOUND' });
        }

        const previousGroupId = itemResult.rows[0].consumption_group_id;
        const orderId = itemResult.rows[0].order_id;

        // Update item
        const { rows } = await pool.query(
          `UPDATE public.gm_order_items 
           SET consumption_group_id = $1
           WHERE id = $2
           RETURNING *`,
          [parsed.data.consumption_group_id, itemId]
        );

        await logAuditEvent(pool, 'system', 'item_moved_between_groups', {
          item_id: itemId,
          order_id: orderId,
          previous_group_id: previousGroupId,
          new_group_id: parsed.data.consumption_group_id,
        });

        return sendJSON(res, 200, { item: rows[0] });
      } catch (e: any) {
        console.error('[API] PATCH /api/order-items/:id/group failed:', e);
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // GET / (Home / Landing)
    if (req.method === 'GET' && url.pathname === '/') {
      return sendHTML(res, 200, renderHomePage());
    }

    return sendJSON(res, 404, { error: 'NOT_FOUND' });
  } catch (err: any) {
    console.error('Unhandled error:', err);
    trackMetrics(startTime, true);
    return sendJSON(res, 500, { error: 'INTERNAL_ERROR' });
  }
});

server.listen(PORT, () => {
  console.log(`Web Module API listening on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /public/:slug');
  console.log('  GET  /public/:slug/menu');
  console.log('  POST /public/:slug/orders');
  console.log('  POST /webhooks/payments/:restaurantId');
  console.log('  GET  /internal/wizard/:restaurantId/state');
  console.log('  POST /internal/wizard/:restaurantId/identity');
  console.log('  POST /internal/wizard/:restaurantId/identity/import-google');
  console.log('  POST /internal/wizard/:restaurantId/identity/import-url');
  console.log('  POST /internal/wizard/:restaurantId/menu/categories');
  console.log('  POST /internal/wizard/:restaurantId/menu/items');
  console.log('  POST /internal/wizard/:restaurantId/menu/import');
  console.log('  POST /internal/wizard/:restaurantId/payments/stripe');
  console.log('  GET  /internal/wizard/:restaurantId/payments/stripe/status');
  console.log('  PATCH /internal/wizard/:restaurantId/design');
  console.log('  POST /internal/wizard/:restaurantId/publish');
  console.log('  GET  /api/restaurants/:id/public-profile');
  console.log('  POST /api/local-boss/ingest');
  console.log('  POST /api/local-boss/run');
  console.log('  GET  /api/local-boss/insights');
  console.log('  GET  /api/local-boss/reviews');
  console.log('  GET  /api/govern/insights');
  console.log('  GET  /api/govern/actions');
  console.log('  POST /api/govern/actions/:id/complete');
  console.log('  POST /api/govern/run');
  console.log('  GET  /api/reservations');
  console.log('  GET  /api/reservations/waitlist');
  console.log('  GET  /api/reputation-hub/locations');
  console.log('  GET  /api/reputation-hub/unanswered');
  console.log('  GET  /api/reputation-hub/campaigns');
  console.log('  GET  /api/operational-hub/fast-mode');
  console.log('  GET  /api/operational-hub/stock/low');
  console.log('  GET  /api/operational-hub/time-tracking/active');
  console.log('  GET  /api/operational-hub/delivery/channels');
  console.log('  GET  /api/operational-hub/analytics');
  console.log('  GET  /api/event-bus/events');
  console.log('  POST /api/event-bus/events/:id/resolve');
  console.log('  GET  /api/govern-manage/events/types');
  console.log('  GET  /api/govern-manage/rules');
  console.log('  POST /api/govern-manage/rules/:id/toggle');
  console.log('  GET  /api/govern-manage/feature-flags');
  console.log('  POST /api/govern-manage/feature-flags/:key');
  console.log('  GET  /api/govern-manage/patterns');
  console.log('  GET  /api/govern-manage/decisions');
  console.log('  GET  /api/govern-manage/decisions/:id');
  console.log('  GET  /api/govern-manage/decisions/export');
  console.log('  GET  /api/govern-manage/rules/:id/simulate');
  console.log('  GET  /api/govern-manage/tasks/:id/why');
  console.log('  POST /api/voice/devices/register');
  console.log('  POST /api/voice/events');
  console.log('  POST /api/voice/events/:id/ack');
  console.log('  GET  /api/voice/routines');
  console.log('  POST /api/voice/routines/:id/toggle');
  console.log('  GET  /api/voice/status');
  console.log('  POST /api/restaurant-groups');
  console.log('  GET  /api/restaurant-groups');
  console.log('  GET  /api/restaurant-groups/:groupId');
  console.log('  POST /api/restaurant-groups/:groupId/restaurants');
  console.log('  GET  /api/restaurant-groups/:groupId/dashboard');
  console.log('  POST /api/restaurant-groups/:groupId/sync-menu');
  console.log('');
  console.log('✅ OperationalHub module endpoints registered');
  console.log('✅ Operational Event Bus endpoints registered');
  console.log('✅ GovernManage layer endpoints registered');
  console.log('✅ Voice Operations Layer endpoints registered');
  console.log('✅ Portioning & Cost Real endpoints registered');
  console.log('✅ Restaurant Groups (Multi-Location UI) endpoints registered');

  // Start Voice Scheduler
  try {
    const { startVoiceScheduler } = require('./voice/voice-scheduler');
    startVoiceScheduler();
    console.log('✅ Voice Scheduler started');
  } catch (e) {
    console.warn('⚠️  Voice Scheduler not available:', e);
  }
});

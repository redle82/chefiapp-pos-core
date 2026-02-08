import dotenv from 'dotenv';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

dotenv.config({ override: false });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required');
  process.exit(1);
}

const REQUESTED_RESTAURANT_ID = process.env.WEB_MODULE_RESTAURANT_ID || uuid();
const REQUESTED_COMPANY_ID = process.env.WEB_MODULE_COMPANY_ID || REQUESTED_RESTAURANT_ID;
const SLUG = process.env.WEB_MODULE_SLUG || 'sofia-gastrobar';
const WEB_LEVEL = (process.env.WEB_MODULE_WEB_LEVEL || 'BASIC').toUpperCase();

const MERCHANT_STRIPE_KEY = process.env.MERCHANT_STRIPE_KEY;
const MERCHANT_STRIPE_WEBHOOK_SECRET = process.env.MERCHANT_STRIPE_WEBHOOK_SECRET;
const MERCHANT_STRIPE_PUBLISHABLE_KEY = process.env.MERCHANT_STRIPE_PUBLISHABLE_KEY;
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;
const CREDENTIALS_ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

const pool = new Pool({ connectionString: DATABASE_URL });

function getEncryptionKeyOrThrow(): Buffer {
  const env = String(CREDENTIALS_ENCRYPTION_KEY || '').trim();
  if (env) {
    if (/^[0-9a-fA-F]{64}$/.test(env)) return Buffer.from(env, 'hex');
    const b = Buffer.from(env, 'base64');
    if (b.length === 32) return b;
    throw new Error('CREDENTIALS_ENCRYPTION_KEY_INVALID');
  }
  const seed = INTERNAL_API_TOKEN || 'dev-insecure-key';
  return crypto.createHash('sha256').update(seed).digest();
}

function encryptSecret(plaintext: string): Buffer {
  const key = getEncryptionKeyOrThrow();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext || ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

async function main() {
  const client = await pool.connect();
  try {
    // Slug is globally unique. If it already exists, reuse its restaurant/company IDs so re-running seed is safe.
    const existing = await client.query(
      `select restaurant_id, company_id
       from restaurant_web_profiles
       where slug = $1
       limit 1`,
      [SLUG]
    );

    const RESTAURANT_ID = existing.rowCount ? String(existing.rows[0].restaurant_id) : REQUESTED_RESTAURANT_ID;
    const COMPANY_ID = existing.rowCount ? String(existing.rows[0].company_id) : REQUESTED_COMPANY_ID;

    await client.query('begin');

    await client.query(
      `insert into companies(company_id, name)
       values ($1, $2)
       on conflict (company_id) do update set
         name = excluded.name,
         updated_at = now()`,
      [COMPANY_ID, 'Sofia Gastrobar Group']
    );

    await client.query(
      `insert into restaurant_web_profiles(
        restaurant_id, company_id, slug, status, theme, web_level, hero, highlights, contacts, delivery_zones
      ) values ($1,$2,$3,'published','minimal',$4,$5,$6,$7,$8)
      on conflict (restaurant_id) do update set
        company_id = excluded.company_id,
        slug = excluded.slug,
        status = excluded.status,
        theme = excluded.theme,
        web_level = excluded.web_level,
        hero = excluded.hero,
        highlights = excluded.highlights,
        contacts = excluded.contacts,
        delivery_zones = excluded.delivery_zones,
        updated_at = now()`,
      [
        RESTAURANT_ID,
        COMPANY_ID,
        SLUG,
        WEB_LEVEL,
        JSON.stringify({ title: 'Sofia Gastrobar', subtitle: 'Menu online' }),
        JSON.stringify([{ title: 'Entrega rápida' }, { title: 'Takeaway' }]),
        JSON.stringify({ phone: '+351000000000' }),
        JSON.stringify([]),
      ]
    );

    // Optional: seed merchant Stripe credentials into DB (requires migration 20251223_05_merchant_gateway_credentials.sql)
    if (MERCHANT_STRIPE_KEY) {
      const isTestMode = MERCHANT_STRIPE_KEY.startsWith('sk_test_');
      try {
        await client.query(
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
            RESTAURANT_ID,
            COMPANY_ID,
            MERCHANT_STRIPE_PUBLISHABLE_KEY ? encryptSecret(MERCHANT_STRIPE_PUBLISHABLE_KEY) : null,
            encryptSecret(MERCHANT_STRIPE_KEY),
            MERCHANT_STRIPE_WEBHOOK_SECRET ? encryptSecret(MERCHANT_STRIPE_WEBHOOK_SECRET) : null,
            isTestMode,
          ]
        );
      } catch (e) {
        // Ignore if table doesn't exist yet; env-only flow still works.
      }
    }

    const catId = uuid();
    await client.query(
      `insert into menu_categories(id, restaurant_id, name, position)
       values ($1,$2,$3,$4)
       on conflict do nothing`,
      [catId, RESTAURANT_ID, 'Destaques', 0]
    );

    const item1 = uuid();
    const item2 = uuid();
    await client.query(
      `insert into menu_items(id, category_id, restaurant_id, name, description, price_cents, currency, tags, is_active)
       values
        ($1,$2,$3,$4,$5,$6,$7,$8,true),
        ($9,$2,$3,$10,$11,$12,$7,$13,true)
       on conflict do nothing`,
      [
        item1,
        catId,
        RESTAURANT_ID,
        'Hambúrguer da Casa',
        'Pão brioche, carne 160g, queijo',
        1290,
        'eur',
        ['burger'],
        item2,
        'Batatas Fritas',
        'Porção média',
        450,
        ['sides'],
      ]
    );

    await client.query('commit');

    console.log('✅ Seed OK');
    console.log({
      company_id: COMPANY_ID,
      restaurant_id: RESTAURANT_ID,
      slug: SLUG,
      sample_menu_item_ids: [item1, item2],
    });
    console.log('Next: export WEB_MODULE_RESTAURANT_ID to reuse this restaurant_id');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

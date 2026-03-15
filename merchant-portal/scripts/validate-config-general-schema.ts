/**
 * Valida que o schema de gm_restaurants suporta /admin/config/general (leitura e escrita).
 * Usa DATABASE_URL para SELECT/UPDATE direto; não testa RLS (isso valida-se no browser com login).
 *
 * Uso: cd merchant-portal && pnpm tsx scripts/validate-config-general-schema.ts
 */
import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL não definido.");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // 1) Leitura: colunas que GeneralCardIdentity usa (select *)
    const readRes = await client.query(
      "SELECT id, name, type, country, phone, email, address, city, postal_code, state, logo_url, locale, timezone, currency, updated_at FROM gm_restaurants LIMIT 1",
    );
    if (readRes.rows.length === 0) {
      console.log("⚠️ Nenhum restaurante na base; criar um com seed-e2e-user.ts. Schema de leitura OK.");
    } else {
      const row = readRes.rows[0] as Record<string, unknown>;
      console.log("✅ Leitura (identidade + locale):", {
        id: row.id,
        name: row.name,
        type: row.type,
        city: row.city,
        country: row.country,
        locale: row.locale,
        timezone: row.timezone,
        currency: row.currency,
      });
    }

    // 2) Escrita: atualizar um restaurante com campos do GeneralCardIdentity/Locale
    const idRes = await client.query("SELECT id FROM gm_restaurants LIMIT 1");
    if (idRes.rows.length === 0) {
      console.log("⏭️ Escrita: ignorada (sem restaurante).");
      return;
    }
    const restaurantId = (idRes.rows[0] as { id: string }).id;
    await client.query(
      `UPDATE gm_restaurants SET
        phone = COALESCE(phone, ''),
        email = COALESCE(email, ''),
        postal_code = COALESCE(postal_code, ''),
        state = COALESCE(state, ''),
        updated_at = now()
      WHERE id = $1`,
      [restaurantId],
    );
    console.log("✅ Escrita (update identity/locale): OK para restaurant_id", restaurantId);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});

/**
 * Aplica a migration de colunas opcionais em gm_restaurants + restaurant_setup_status (Supabase).
 * Necessário para /admin/config/general funcionar sem fallback mínimo (city, address, type, etc.).
 *
 * Uso:
 *   DATABASE_URL no .env.local (Supabase Dashboard → Database → Connection string URI)
 *   cd merchant-portal && pnpm tsx scripts/apply-optional-restaurant-columns.ts
 *
 * Ou aplicar manualmente: copiar conteúdo de
 *   supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql
 * e executar no SQL Editor do Supabase.
 */
import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocal = path.resolve(process.cwd(), ".env.local");
const env = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config({ path: env });

function getDbUrl(): string {
  const explicit = process.env.DATABASE_URL;
  if (explicit) return explicit;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
    return supabaseUrl
      .replace(/^https?:\/\//, "")
      .replace("54321", "54322")
      .replace(/^[^@]+/, "postgres:postgres")
      .replace(/^/, "postgresql://") + "/postgres";
  }
  return "";
}

async function main() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não definido e VITE_SUPABASE_URL não é local.");
    console.error("   Para Supabase remoto: define DATABASE_URL no .env.local");
    console.error("   (Supabase Dashboard → Project Settings → Database → Connection string URI)");
    console.error("");
    console.error("   Ou aplica manualmente: copia o conteúdo de");
    console.error("   supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql");
    console.error("   e executa no SQL Editor do Dashboard.");
    process.exit(1);
  }

  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql",
  );
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration não encontrada:", migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");
  const client = new Client({ connectionString: dbUrl });
  const masked = dbUrl.replace(/:[^:@]+@/, ":****@");

  console.log("🔌 A conectar a", masked, "...");
  try {
    await client.connect();
    console.log("📜 A aplicar migration gm_restaurants colunas opcionais + restaurant_setup_status...");
    await client.query(sql);
    console.log("🔄 A recarregar schema cache do PostgREST...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Schema aplicado. /admin/config/general deve deixar de dar 400 por colunas ausentes.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Erro:", msg);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

/**
 * Aplica a migration gm_companies + company_id (fluxo soberano P0.2).
 * Uso:
 *   - Local (Supabase em 54321): VITE_SUPABASE_URL=http://127.0.0.1:54321 → usa port 54322
 *   - Remoto: definir DATABASE_URL no .env.local (Supabase Dashboard → Project Settings → Database → Connection string URI)
 *
 * Depois de aplicar, correr o seed: pnpm tsx scripts/seed-e2e-user.ts
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocal = path.resolve(process.cwd(), '.env.local');
const env = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config({ path: env });

function getDbUrl(): string {
  const explicit = process.env.DATABASE_URL;
  if (explicit) return explicit;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  // Local Supabase: http://127.0.0.1:54321 → postgres on 54322
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    return supabaseUrl
      .replace(/^https?:\/\//, '')
      .replace('54321', '54322')
      .replace(/^[^@]+/, 'postgres:postgres')
      .replace(/^/, 'postgresql://') + '/postgres';
  }
  return '';
}

async function main() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não definido e VITE_SUPABASE_URL não é local.');
    console.error('   Para Supabase remoto: define DATABASE_URL no .env.local');
    console.error('   (Supabase Dashboard → Project Settings → Database → Connection string URI)');
    console.error('');
    console.error('   Ou aplica manualmente: copia o conteúdo de');
    console.error('   supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql');
    console.error('   e executa no SQL Editor do Dashboard.');
    process.exit(1);
  }

  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration não encontrada:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const client = new Client({ connectionString: dbUrl });
  const masked = dbUrl.replace(/:[^:@]+@/, ':****@');

  console.log('🔌 A conectar a', masked, '...');
  try {
    await client.connect();
    console.log('📜 A aplicar migration gm_companies (fluxo soberano)...');
    await client.query(sql);
    console.log('🔄 A recarregar schema cache do PostgREST...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✅ Schema aplicado. Podes correr o seed: pnpm tsx scripts/seed-e2e-user.ts');
  } catch (err: any) {
    console.error('❌ Erro:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

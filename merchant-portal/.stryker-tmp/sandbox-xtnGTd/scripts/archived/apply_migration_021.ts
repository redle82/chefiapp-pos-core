
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const DB_URL = process.env.VITE_SUPABASE_URL
    ? process.env.VITE_SUPABASE_URL.replace('54321', '54322').replace('http://', 'postgresql://postgres:postgres@') + '/postgres'
    : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function applyMigration() {
    console.log(`🔌 Connecting to DB at ${DB_URL}...`);
    const client = new Client({ connectionString: DB_URL });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const migrationPath = path.resolve(__dirname, '../../supabase/migrations/021_payment_hardening.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found at: ${migrationPath}`);
            // Fallback for different project structure
            const altPath = path.resolve(__dirname, '../../../supabase/migrations/021_payment_hardening.sql');
            if (!fs.existsSync(altPath)) {
                throw new Error('Migration file lookup failed.');
            }
        }
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log(`📜 Applying migration from ${migrationPath}...`);
        await client.query(sql);
        console.log('✅ Migration 021 applied successfully.');

        // Verify RPC exists
        const res = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'process_order_payment'");
        if (res.rowCount > 0) {
            console.log('✨ RPC process_order_payment Verified.');
        } else {
            console.error('❌ RPC Verification Failed.');
        }

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();

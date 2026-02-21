
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
    console.log(`🔌 Connecting to DB...`);
    const client = new Client({ connectionString: DB_URL });

    try {
        await client.connect();

        const migrationPath = path.resolve(__dirname, '../../supabase/migrations/025_fix_payment_logic.sql');
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration not found at ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`📜 Applying migration 025...`);
        await client.query(sql);
        console.log('✅ Migration 025 applied successfully.');

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();

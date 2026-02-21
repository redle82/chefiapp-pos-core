// @ts-nocheck

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

        // Robust path finding
        const migrationPath = path.resolve(__dirname, '../../supabase/migrations/022_payment_observability.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found at: ${migrationPath}`);
            throw new Error('Migration not found');
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`📜 Applying migration 022...`);
        await client.query(sql);
        console.log('✅ Migration 022 applied successfully.');

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();

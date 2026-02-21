// @ts-nocheck

import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const DB_URL = process.env.VITE_SUPABASE_URL
    ? process.env.VITE_SUPABASE_URL.replace('54321', '54322').replace('http://', 'postgresql://postgres:postgres@') + '/postgres'
    : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function debugSchema() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    console.log('🔍 Checking gm_order_requests columns:');
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gm_order_requests';
    `);

    console.table(res.rows);

    console.log('🔄 Forcing Schema Cache Reload...');
    await client.query("NOTIFY pgrst, 'reload schema';");

    await client.end();
}

debugSchema();

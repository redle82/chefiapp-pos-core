// @ts-nocheck

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    await client.connect();
    const sql = fs.readFileSync(path.resolve(process.cwd(), '../supabase/migrations/020_fix_payments.sql'), 'utf8');
    await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Migration 020 Applied & Schema Reloaded.');
    await client.end();
}

run();

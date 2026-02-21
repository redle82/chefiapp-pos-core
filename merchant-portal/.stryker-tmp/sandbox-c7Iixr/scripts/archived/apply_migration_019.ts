
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    await client.connect();
    const sql = fs.readFileSync(path.resolve(process.cwd(), '../supabase/migrations/019_restore_cash_register.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Migration 019 Applied.');
    await client.end();
}

run();

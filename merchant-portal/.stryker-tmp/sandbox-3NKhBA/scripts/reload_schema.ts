// @ts-nocheck

import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    await client.connect();
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ NOTIFY pgrst sent.');
    await client.end();
}

run();

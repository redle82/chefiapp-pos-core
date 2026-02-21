
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    await client.connect();
    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    await client.end();
}

run();

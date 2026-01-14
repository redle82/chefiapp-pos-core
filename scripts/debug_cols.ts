import { Client } from 'pg';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    try {
        const res3 = await client.query("SELECT count(*) FROM gm_menu_categories");
        console.log('gm_menu_categories:', res3.rows[0].count);
    } catch (e) { console.error(e); } finally { client.end(); }
}
run();

import { Client } from 'pg';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    try {
        console.log('Sending reloading schema notify...');
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('✅ Sent NOTIFY pgrst');
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

run();

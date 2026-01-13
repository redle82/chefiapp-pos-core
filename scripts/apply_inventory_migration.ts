import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    try {
        const files = [
            'supabase/migrations/20260123000000_inventory_schema.sql',
            'supabase/migrations/20260123000002_add_sync_metadata.sql',
            'supabase/migrations/20260123000001_inventory_logic.sql'
        ];

        for (const file of files) {
            console.log(`Applying ${file}...`);
            const sql = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
            await client.query(sql);
            console.log(`✅ Applied ${file}`);
        }
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();

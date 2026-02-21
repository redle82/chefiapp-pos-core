
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Standard Supabase Local Config
const CONNECTION_STRING = 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

async function apply() {
    console.log('🔌 Connecting to Local DB:', CONNECTION_STRING);
    // @ts-ignore
    const client = new pg.Client({ connectionString: CONNECTION_STRING });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const sqlPath = path.resolve(process.cwd(), '../supabase/migrations/017_airlock_fields.sql');
        console.log('📄 Reading Migration:', sqlPath);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing SQL...');
        await client.query(sql);
        console.log('✅ Migration Applied Successfully.');

    } catch (err) {
        console.error('💥 Migration Failed:', err);
    } finally {
        await client.end();
    }
}

apply();

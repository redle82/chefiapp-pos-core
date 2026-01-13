import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Please provide SQL file path');
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying migration: ${filePath}`);

    try {
        await pool.query(sql);
        console.log('Migration applied successfully.');
    } catch (e: any) {
        // Ignore "already exists" for enum values if idempotent
        if (e.message.includes('already exists')) {
            console.log('Enum value already exists (Ignored).');
        } else {
            console.error('Migration failed:', e);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

applyMigration();

// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', url);
console.log('Key Length:', key?.length);

async function test() {
    try {
        const client = createClient(url!, key!);
        const { data, error } = await client.from('companies').select('count', { count: 'exact', head: true });
        console.log('Result:', { data, error });
    } catch (e: any) {
        console.error('Crash:', e.message);
        console.error('Cause:', e.cause);
    }
}

test();

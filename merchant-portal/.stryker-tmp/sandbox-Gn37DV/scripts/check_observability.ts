
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkRPCs() {
    const { data, error } = await supabase.rpc('fn_log_payment_attempt', {
        p_order_id: '00000000-0000-0000-0000-000000000000',
        p_restaurant_id: '00000000-0000-0000-0000-000000000000',
        p_amount_cents: 0,
        p_method: 'test',
        p_result: 'test'
    });

    if (error && error.message.includes('function fn_log_payment_attempt') && error.message.includes('does not exist')) {
        console.log('❌ fn_log_payment_attempt MISSING');
    } else if (error) {
        console.log('❓ Exists but error:', error.message); // Likely foreign key violation, meaning it exists!
    } else {
        console.log('✅ fn_log_payment_attempt EXISTS');
    }
}

checkRPCs();

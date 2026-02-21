// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz');

async function purge() {
    console.log('🗑️ Purging PENDING requests...');
    const { error } = await supabase.from('gm_order_requests').delete().eq('status', 'PENDING');
    if (error) console.error(error);
    else console.log('✅ Purged.');
}
purge();

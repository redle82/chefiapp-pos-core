// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Service Role Key (Hardcoded for script reliability)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reconcile() {
    console.log('🔧 RECONCILING DB...');

    // 1. Get Admin
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@goldmonkey.com');
    if (!admin) throw new Error('Admin user not found. Run seed_admin.ts first.');
    console.log('✅ Admin Found:', admin.id);

    // 2. Get Restaurant & Tenant
    const { data: restaurant, error: restError } = await supabase
        .from('gm_restaurants')
        .select('*')
        .eq('slug', 'demo-grill')
        .single();

    if (restError || !restaurant) throw new Error('Demo Grill not found. Run seed_airlock_demo.ts first.');
    console.log('✅ Restaurant Found:', restaurant.name, `(Tenant: ${restaurant.tenant_id})`);

    // 3. Link them!
    // Check if exists first
    const { data: existing } = await supabase
        .from('saas_tenants_members')
        .select('*')
        .eq('user_id', admin.id)
        .eq('tenant_id', restaurant.tenant_id)
        .maybeSingle();

    if (existing) {
        console.log('⚠️ Link already exists. Skipping.');
    } else {
        const { error: insertError } = await supabase
            .from('saas_tenants_members')
            .insert({
                user_id: admin.id,
                tenant_id: restaurant.tenant_id,
                role: 'owner'
            });

        if (insertError) throw insertError;
        console.log('🔗 SUCCESS: Admin linked to Tenant as Owner.');
    }

    // 4. UNLOCK DASHBOARD (The Birth)
    if (!restaurant.onboarding_completed_at) {
        console.log('🐣 Birthing Restaurant (Setting onboarding_completed_at)...');
        const { error: updateError } = await supabase
            .from('gm_restaurants')
            .update({ onboarding_completed_at: new Date().toISOString() })
            .eq('id', restaurant.id);

        if (updateError) throw updateError;
        console.log('✅ SUCCESS: Restaurant is BORN. Dashboard Unlocked.');
    } else {
        console.log('✅ Restaurant already born (onboarding_completed_at set).');
    }
}

reconcile().catch(e => console.error('💥 FAILED:', e));

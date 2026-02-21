
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';


// Load .env from merchant-portal root (assuming we run from merchant-portal)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Or just hardcode for this script since we know the keys
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // SERVICE ROLE KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log('🔍 DIAGNOSING DB STATE...');

    // 1. Check Users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) console.error('Error fetching users:', userError);
    const admin = users.find(u => u.email === 'admin@goldmonkey.com');
    console.log('👤 Admin User:', admin ? `✅ Found (${admin.id})` : '❌ NOT FOUND');

    // 2. Check Raw Members
    const { data: rawMembers, error: rawError } = await supabase.from('saas_tenants_members').select('*');
    if (rawError) console.error('Error fetching saas_tenants_members:', rawError);
    console.log('📋 Raw Members:', rawMembers?.length || 0);
    rawMembers?.forEach(m => console.log(`   - User: ${m.user_id} -> Tenant: ${m.tenant_id} (Role: ${m.role})`));

    // 3. Check Restaurants & Tenant Status
    const { data: restaurants, error: restError } = await supabase.from('gm_restaurants').select('*, tenant:tenant_id(*)');
    if (restError) console.error('Error fetching gm_restaurants:', restError);
    console.log('🍽️ Restaurants:', restaurants?.length || 0);
    restaurants?.forEach(r => {
        console.log(`   - ID: ${r.id} -> Tenant: ${r.tenant_id} (Name: ${r.name})`);
        if (r.tenant) {
            console.log('     Tenant Keys:', Object.keys(r.tenant));
            console.log('     Tenant Raw:', JSON.stringify(r.tenant));
        }
    });

    // 4. Check View (restaurant_members)
    // This will FAIL if the view doesn't have restaurant_id and we try to select it?
    // Or if we just select * we will see what it has.
    const { data: viewMembers, error: viewError } = await supabase.from('restaurant_members').select('*');
    if (viewError) {
        console.error('❌ Error fetching restaurant_members (View Broken?):', viewError.message);
    } else {
        console.log('👁️ View Members:', viewMembers?.length || 0);
        if (viewMembers && viewMembers.length > 0) {
            console.log('   Sample Row Keys:', Object.keys(viewMembers[0]).join(', '));
        }
    }

    // 5. Cross Check
    if (admin) {
        const linkedRaw = rawMembers?.find(m => m.user_id === admin.id);
        console.log('🔗 Admin Raw Link:', linkedRaw ? '✅ Linked to Tenant' : '❌ ORPHAN');

        if (linkedRaw) {
            const linkedRest = restaurants?.find(r => r.tenant_id === linkedRaw.tenant_id);
            console.log('🔗 Admin Restaurant Link (via Tenant):', linkedRest ? `✅ Found (${linkedRest.name})` : '❌ Tenant has no Restaurant');
        }
    }

}

diagnose();

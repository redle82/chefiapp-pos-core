
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local Service Role Key captured from start output

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyAirlock() {
    console.log("🔒 Verifying Airlock Protocol...");
    console.log(`📡 Connecting to ${SUPABASE_URL}`);

    // 1. Check if table exists by listing it (via explicit insert attempt)
    const dummyRequest = {
        tenant_id: '00000000-0000-0000-0000-000000000000', // Need a valid UUID, hoping foreign key constraints don't block us on empty DB. 
        // Wait, FKs are enforced. We need a tenant.
        // Let's try to fetch a tenant first.
    };

    const { data: tenants, error: tenantError } = await supabase.from('saas_tenants').select('id').limit(1);

    if (tenantError) {
        console.error("❌ Failed to fetch tenants:", tenantError);
        // Try creating one if none?
    }

    let tenantId = tenants?.[0]?.id;

    if (!tenantId) {
        console.log("⚠️ No tenants found. Creating a temporary tenant for verification...");
        const { data: newTenant, error: createError } = await supabase.from('saas_tenants').insert({
            name: 'Airlock Test Tenant',
            slug: 'airlock-test-' + Date.now()
        }).select().single();

        if (createError) {
            console.error("❌ Failed to create test tenant:", createError);
            return;
        }
        tenantId = newTenant.id;
        console.log("✅ Created test tenant:", tenantId);
    } else {
        console.log("✅ Using existing tenant:", tenantId);
    }

    // 2. Insert Request
    console.log("🚀 Attempting to insert into gm_order_requests...");
    const payload = {
        tenant_id: tenantId,
        items: [{ name: "Void Burger", price_cents: 0, quantity: 1, notes: "Debug" }],
        total_cents: 0,
        status: 'PENDING',
        request_source: 'VERIFICATION_SCRIPT',
        customer_contact: { name: "Ghost User" }
    };

    const { data: request, error: insertError } = await supabase
        .from('gm_order_requests')
        .insert(payload)
        .select()
        .single();

    if (insertError) {
        console.error("❌ Airlock Insertion Failed:", insertError);
        if (insertError.code === '42P01') {
            console.error("CRITICAL: Table 'gm_order_requests' does not exist.");
        }
    } else {
        console.log("✅ Airlock Insertion Successful!");
        console.log("ID:", request.id);
        console.log("Status:", request.status);

        // 3. Clean up
        console.log("🧹 Cleaning up...");
        await supabase.from('gm_order_requests').delete().eq('id', request.id);
        console.log("✨ Cleanup done.");
    }
}

verifyAirlock();

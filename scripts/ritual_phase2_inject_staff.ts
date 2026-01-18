import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectStaff() {
    console.log('👥 RITUAL PHASE 2: INJECTING STAFF');

    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'beta.sofia@chefiapp.com',
        password: 'password123'
    });

    if (authError || !authData.user) {
        console.error('❌ Login failed:', authError);
        process.exit(1);
    }
    console.log(`✅ Authenticated as: ${authData.user.email}`);

    // 2. Resolve Tenant
    const { data: rests, error: restError } = await supabase
        .from('gm_restaurants')
        .select('*')
        .eq('owner_id', authData.user.id);

    if (restError || !rests || rests.length === 0) {
        console.error('❌ No tenant found:', restError);
        process.exit(1);
    }
    const tenantId = rests[0].id;
    console.log(`✅ Tenant: ${rests[0].name} (${tenantId})`);

    // 3. Create Employee
    console.log('\n🧑‍🍳 Creating Employee: João Silva (Worker)...');
    const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
            restaurant_id: tenantId,
            name: 'João Silva',
            role: 'worker',
            position: 'waiter',
            active: true
        })
        .select()
        .single();

    if (empError) {
        console.error('❌ Employee creation failed:', empError);
        process.exit(1);
    }
    console.log(`✅ Employee created: ${employee.name} (${employee.role})`);

    // 4. Verify via Genesis Judge
    console.log('\n⚖️  Running Genesis Judge...');
    const { count: staffCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', tenantId)
        .eq('active', true);

    console.log(`📊 Active Staff Count: ${staffCount}`);

    if ((staffCount || 0) >= 1) {
        console.log('✅ TRIBE CHECK: PASSED');
        console.log('🎯 System Progress: ~80% (Staff Injected)');
        console.log('🔓 READY_FOR_REALITY: UNLOCKED');
    } else {
        console.log('❌ TRIBE CHECK: FAILED');
    }

    console.log('\n🎉 PHASE 2 COMPLETE');
}

injectStaff().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectMenu() {
    console.log('🍽️  RITUAL PHASE 1: INJECTING MENU');

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

    // 3. Create Category "Bebidas"
    console.log('\n📂 Creating Category: Bebidas...');
    const { data: category, error: catError } = await supabase
        .from('gm_menu_categories')
        .insert({
            restaurant_id: tenantId,
            name: 'Bebidas',
            sort_order: 1
        })
        .select()
        .single();

    if (catError) {
        console.error('❌ Category creation failed:', catError);
        process.exit(1);
    }
    console.log(`✅ Category created: ${category.name} (ID: ${category.id})`);

    // 4. Create Product "Coca-Cola Original"
    console.log('\n🥤 Creating Product: Coca-Cola Original...');
    const { data: product, error: prodError } = await supabase
        .from('gm_products')
        .insert({
            restaurant_id: tenantId,
            category_id: category.id,
            category: category.name,
            name: 'Coca-Cola Original',
            price_cents: 350,
            available: true
        })
        .select()
        .single();

    if (prodError) {
        console.error('❌ Product creation failed:', prodError);
        process.exit(1);
    }
    console.log(`✅ Product created: ${product.name} (€${(product.price_cents / 100).toFixed(2)})`);

    console.log('\n⚖️  Running Genesis Judge...');
    const { count: productCount } = await supabase
        .from('gm_products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', tenantId);

    console.log(`📊 Product Count: ${productCount}`);

    if ((productCount || 0) > 0) {
        console.log('✅ SUSTENANCE CHECK: PASSED');
        console.log('🎯 System Progress: ~65% (Menu Injected)');
    } else {
        console.log('❌ SUSTENANCE CHECK: FAILED');
    }

    console.log('\n🎉 PHASE 1 COMPLETE');
}

injectMenu().catch(console.error);

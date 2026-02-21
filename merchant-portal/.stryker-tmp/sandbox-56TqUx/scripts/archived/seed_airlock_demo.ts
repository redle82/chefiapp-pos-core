// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Local Dev Credentials
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local Service Role Key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDemoData() {
    console.log("🌱 Seeding Demo Data for Airlock...");

    // 1. Tenant
    console.log("1. Creating Tenant...");
    const { data: tenant, error: tenantError } = await supabase.from('saas_tenants').insert({
        name: 'Demo Grill Tenant',
        slug: 'demo-grill-tenant-' + Date.now()
    }).select().single();

    if (tenantError) { console.error("❌ Tenant Error:", tenantError); return; }

    // 2. Restaurant
    console.log("2. Creating Restaurant (Slug: demo-grill)...");

    // Check collision first
    await supabase.from('gm_restaurants').delete().eq('slug', 'demo-grill');

    const { data: restaurant, error: restError } = await supabase.from('gm_restaurants').insert({
        tenant_id: tenant.id,
        name: 'Demo Grill',
        slug: 'demo-grill',
        description: 'Flavor of the Void.',
        owner_id: tenant.id // Mock owner
    }).select().single();

    if (restError) { console.error("❌ Restaurant Error:", restError); return; }

    // 3. Menu Categories
    console.log("3. Creating Categories...");
    const { data: catBurgers } = await supabase.from('gm_menu_categories').insert({
        restaurant_id: restaurant.id,
        name: 'Burgers',
        sort_order: 1
    }).select().single();

    const { data: catDrinks } = await supabase.from('gm_menu_categories').insert({
        restaurant_id: restaurant.id,
        name: 'Drinks',
        sort_order: 2
    }).select().single();

    // 4. Products
    console.log("4. Creating Products...");

    // Burgers
    await supabase.from('gm_products').insert({
        restaurant_id: restaurant.id,
        category_id: catBurgers.id,
        name: 'Void Burger',
        description: 'Simply empty.',
        price_cents: 1000,
        available: true
    });

    await supabase.from('gm_products').insert({
        restaurant_id: restaurant.id,
        category_id: catBurgers.id,
        name: 'Sovereign Cheese',
        description: 'Royal cheese.',
        price_cents: 1500,
        available: true
    });

    // Drinks
    await supabase.from('gm_products').insert({
        restaurant_id: restaurant.id,
        category_id: catDrinks.id,
        name: 'Water',
        price_cents: 500,
        available: true
    });

    console.log("✅ Seed Complete!");
    console.log(`🌍 URL: http://localhost:5175/public/demo-grill`);
}

seedDemoData();

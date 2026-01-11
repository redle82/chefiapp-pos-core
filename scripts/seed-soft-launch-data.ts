import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load Environment
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
const loadEnv = (p: string) => fs.existsSync(p) && dotenv.config({ path: p });
loadEnv(envLocalPath);
loadEnv(envPath);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_SLUG = 'sofia-gastrobar-beta';

async function seed() {
    console.log(`🌱 Seeding Soft Launch Data for: ${TARGET_SLUG}`);

    // 1. Get Restaurant ID
    const { data: rest, error: restError } = await supabase
        .from('gm_restaurants')
        .select('id')
        .eq('slug', TARGET_SLUG)
        .single();

    if (restError || !rest) {
        console.error('❌ Restaurant not found:', restError?.message);
        return;
    }

    const restaurantId = rest.id;
    console.log(`   🏢 Found Restaurant ID: ${restaurantId}`);

    // 2. Create Categories
    const categories = [
        { name: 'Bebidas', type: 'beverages' },
        { name: 'Comidas', type: 'food' }
    ];

    const categoryMap: Record<string, string> = {};

    for (const cat of categories) {
        // Upsert by name + restaurantId
        // Assuming no unique constraints on name, we search first
        let { data: existing } = await supabase
            .from('gm_menu_categories')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('name', cat.name)
            .single();

        if (!existing) {
            const { data: created, error } = await supabase
                .from('gm_menu_categories')
                .insert({
                    restaurant_id: restaurantId,
                    name: cat.name,
                    description: cat.type
                })
                .select()
                .single();

            if (error) {
                console.error(`   ❌ Failed to create category ${cat.name}:`, error.message);
                continue;
            }
            existing = created;
            console.log(`   📂 Created Category: ${cat.name}`);
        } else {
            console.log(`   📂 Category exists: ${cat.name}`);
        }

        if (existing) {
            categoryMap[cat.name] = existing.id;
        }
    }

    // 3. Create Products
    const products = [
        { name: 'Coca-Cola', price: 500, category: 'Bebidas' },
        { name: 'X-Burger', price: 2500, category: 'Comidas' },
        { name: 'Fritas', price: 1500, category: 'Comidas' }
    ];

    for (const prod of products) {
        let { data: existing } = await supabase
            .from('gm_products')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('name', prod.name)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('gm_products')
                .insert({
                    restaurant_id: restaurantId,
                    category_id: categoryMap[prod.category],
                    name: prod.name,
                    price_cents: prod.price,
                    is_available: true
                });
            if (error) {
                console.error(`   ❌ Failed to create product ${prod.name}:`, error.message);
            } else {
                console.log(`   🍔 Created Product: ${prod.name}`);
            }
        } else {
            console.log(`   🍔 Product exists: ${prod.name}`);
        }
    }

    // 4. Create Tables
    const tables = [1, 2, 3, 4, 5];
    for (const num of tables) {
        let { data: existing } = await supabase
            .from('gm_tables')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('number', num)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('gm_tables')
                .insert({
                    restaurant_id: restaurantId,
                    number: num.toString(),
                    name: `Mesa ${num}`,
                    capacity: 4,
                    x: num * 10,
                    y: num * 10
                });
            if (error) {
                console.error(`   ❌ Failed to create table ${num}:`, error.message);
            } else {
                console.log(`   🪑 Created Table: ${num}`);
            }
        } else {
            console.log(`   🪑 Table exists: ${num}`);
        }
    }

    // 5. Create Cash Register
    // Note: Depends on if you allow multiple registers. Unique index on 'open' status might affect logic if we try to open it simultaneously.
    // Just creating the register definition if possible, or skip if register creation is dynamic on open.
    // Checking schema: gm_cash_registers usually created on opening. 
    // If we want a pre-defined register NAME/CONFIG, it might be separate. 
    // Assuming gm_cash_registers tracks SESSIONS. So we don't pre-seed an 'open' register, the user does that.

    console.log('   ✅ Seed Complete.');
}

seed().catch(console.error);

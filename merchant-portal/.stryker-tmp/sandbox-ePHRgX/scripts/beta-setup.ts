// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 🔒 STRICT MODE: Beta Setup
// This script provisions "Golden Tenants" with REAL credentials.
// It fails if strict requirements are not met.

// Load Environment
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
const loadEnv = (p: string) => fs.existsSync(p) && dotenv.config({ path: p });
loadEnv(envLocalPath);
loadEnv(envPath);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_KEY. Admin access required.');
    process.exit(1);
}

// 🔑 API Keys for Real Partners (Must be in .env.local)
const INVOICEXPRESS_KEY = process.env.INVOICEXPRESS_API_KEY_SOFIA;

if (!INVOICEXPRESS_KEY) {
    console.error('❌ Missing INVOICEXPRESS_API_KEY_SOFIA in environment.');
    console.error('   Strict provisioning requires REAL credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_TENANT = {
    email: 'sofia.real@chefiapp.com',
    password: 'Password123!', // User should change this
    name: 'Sofia Manager',
    companyName: 'Sofia Gastrobar Corp',
    restaurantName: 'Sofia Gastrobar Real',
    slug: 'sofia-gastrobar-real',
    fiscal: {
        provider: 'invoice_xpress',
        accountName: 'sofiagastrobar', // Replace with real account if different
        apiKey: INVOICEXPRESS_KEY
    }
};

async function log(msg: string) {
    console.log(`[BETA-SETUP] ${msg}`);
}

async function main() {
    log('🚀 Starting Beta Provisioning for: ' + TARGET_TENANT.restaurantName);

    // 1. User
    log('👤 Checking User...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === TARGET_TENANT.email);
    let userId = user?.id;

    if (!user) {
        log('   Creating User...');
        const { data, error } = await supabase.auth.admin.createUser({
            email: TARGET_TENANT.email,
            password: TARGET_TENANT.password,
            email_confirm: true,
            user_metadata: { name: TARGET_TENANT.name }
        });
        if (error) throw error;
        userId = data.user!.id;
        log('   ✅ User Created');
    } else {
        log('   ✅ User Exists');
    }

    // 2. Company
    log('🏢 Checking Company...');
    let { data: company } = await supabase
        .from('gm_companies')
        .select('*')
        .eq('owner_id', userId)
        .eq('name', TARGET_TENANT.companyName)
        .maybeSingle();

    if (!company) {
        log('   Creating Company...');
        const { data, error } = await supabase.from('gm_companies').insert({
            owner_id: userId,
            name: TARGET_TENANT.companyName,
            plan: 'sovereign',
            status: 'active'
        }).select().single();
        if (error) throw error;
        company = data;
        log('   ✅ Company Created');
    } else {
        log('   ✅ Company Exists');
    }

    // 3. Restaurant & Fiscal Config
    log('🍽️ Checking Restaurant...');
    let { data: restaurant } = await supabase
        .from('gm_restaurants')
        .select('*')
        .eq('company_id', company.id)
        .eq('slug', TARGET_TENANT.slug)
        .maybeSingle();

    if (!restaurant) {
        log('   Creating Restaurant...');
        const { data, error } = await supabase.from('gm_restaurants').insert({
            company_id: company.id,
            owner_id: userId,
            name: TARGET_TENANT.restaurantName,
            slug: TARGET_TENANT.slug,
            category: 'bar',
            operation_status: 'active',
            fiscal_provider: TARGET_TENANT.fiscal.provider,
            fiscal_config: {
                provider: TARGET_TENANT.fiscal.provider,
                invoicexpress: {
                    accountName: TARGET_TENANT.fiscal.accountName,
                    apiKey: TARGET_TENANT.fiscal.apiKey
                }
            }
        }).select().single();
        if (error) throw error;
        restaurant = data;
        log('   ✅ Restaurant Created with FISCAL CONFIG');
    } else {
        log('   Updating Fiscal Config...');
        const { error } = await supabase.from('gm_restaurants').update({
            fiscal_provider: TARGET_TENANT.fiscal.provider,
            fiscal_config: {
                provider: TARGET_TENANT.fiscal.provider,
                invoicexpress: {
                    accountName: TARGET_TENANT.fiscal.accountName,
                    apiKey: TARGET_TENANT.fiscal.apiKey
                }
            }
        }).eq('id', restaurant.id);
        if (error) throw error;
        log('   ✅ Fiscal Config Updated');
    }

    // 4. Menu (Strict Minimum)
    log('📜 Checking Menu...');
    const { data: menu } = await supabase.from('gm_menus').select('*').eq('restaurant_id', restaurant.id).maybeSingle();
    let menuId = menu?.id;

    if (!menu) {
        const { data, error } = await supabase.from('gm_menus').insert({
            restaurant_id: restaurant.id,
            name: 'Beta Menu',
            status: 'active'
        }).select().single();
        if (error) throw error;
        menuId = data.id;
    }

    // Category
    const { data: cat } = await supabase.from('gm_menu_categories').select('*').eq('menu_id', menuId).eq('name', 'Bebidas').maybeSingle();
    let catId = cat?.id;
    if (!cat) {
        const { data } = await supabase.from('gm_menu_categories').insert({
            menu_id: menuId,
            name: 'Bebidas',
            sort_order: 1
        }).select().single();
        catId = data!.id;
        log('   ✅ Category Created: Bebidas');
    }

    // Product
    const { data: prod } = await supabase.from('gm_products').select('*').eq('restaurant_id', restaurant.id).eq('name', 'Coca-Cola').maybeSingle();
    if (!prod) {
        const { data: newProd } = await supabase.from('gm_products').insert({
            restaurant_id: restaurant.id,
            name: 'Coca-Cola',
            price: 250, // 2.50
            tax_rate: 0.23,
            available: true
        }).select().single();

        // Link to Menu
        await supabase.from('gm_menu_items').insert({
            category_id: catId,
            product_id: newProd!.id,
            price_override: 250,
            available: true,
            sort_order: 1
        });
        log('   ✅ Product Created: Coca-Cola');
    }

    // 5. Update Registry
    log('📝 Updating Registry...');
    const regPath = path.resolve(process.cwd(), 'BETA_PARTNERS.json');
    let registry = [];
    try {
        if (fs.existsSync(regPath)) {
            const content = fs.readFileSync(regPath, 'utf8');
            if (content) registry = JSON.parse(content);
        }
    } catch (e) { }

    const entry = {
        name: TARGET_TENANT.restaurantName,
        id: restaurant.id,
        slug: TARGET_TENANT.slug,
        owner_email: TARGET_TENANT.email,
        provisioned_at: new Date().toISOString(),
        fiscal_status: 'CONFIGURED'
    };

    // Remove old if exists
    registry = registry.filter((r: any) => r.slug !== entry.slug);
    registry.push(entry);

    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2));
    log(`   ✅ Saved to ${regPath}`);

    log('✨ BETA SETUP COMPLETE');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

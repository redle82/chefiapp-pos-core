import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load Environment Variables (Priority: .env.local -> .env)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL');
    process.exit(1);
}

// Use Service Key if available, else Anon
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const CREDENTIALS_PATH = path.resolve(process.cwd(), 'tests/e2e/e2e-creds.json');

// Generate unique email to avoid Rate Limits and conflicts
const TIMESTAMP = Date.now();
const TEST_USER = {
    email: `sovereign.test.${TIMESTAMP}@chefiapp.com`,
    password: 'password123',
    name: 'Sovereign Tester'
};

async function seed() {
    console.log(`🌱 Seeding E2E User: ${TEST_USER.email}`);

    let userId = null;
    let session = null;

    if (SERVICE_KEY) {
        console.log('🔑 Using Service Key (Admin Mode)');
        // Unlikely to hit rate limits with Admin API
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_USER.email,
            password: TEST_USER.password,
            email_confirm: true,
            user_metadata: { name: TEST_USER.name }
        });
        if (error) throw error;
        userId = data.user.id;
        console.log('✨ User Created via Admin.');
    } else {
        console.log('⚠️ Using Anon Key (Public Mode)');
        const { data, error } = await supabase.auth.signUp({
            email: TEST_USER.email,
            password: TEST_USER.password,
            options: { data: { name: TEST_USER.name } }
        });

        if (error) throw error;

        userId = data.user?.id;
        session = data.session;

        if (!session) {
            console.error('❌ User created but NOT confirmed (No Session).');
            console.error('CRITICAL: Cannot proceed with E2E unless "Enable Email Confirmations" is OFF in Supabase.');
            process.exit(1);
        } else {
            console.log('✅ User created and Auto-Confirmed.');
        }
    }

    if (!userId) throw new Error('Failed to obtain User ID');
    console.log('🆔 User ID:', userId);

    // Save Credentials for E2E Test
    // Ensure dir exists
    const dir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(TEST_USER, null, 2));
    console.log(`💾 Credentials saved to: ${CREDENTIALS_PATH}`);

    // Seed Data (Company/Restaurant)
    // If Anon, we hope triggers did the work or RLS allows insert.
    // If Admin, we verify/insert.

    let restaurantId: string | undefined;

    // Attempt logic (best effort if Anon)
    if (SERVICE_KEY) {
        // ---------------------------------------------------------------------
        // Company + Restaurant + Membership (Owner)
        // ---------------------------------------------------------------------
        // Check gm_companies
        const { data: companies } = await supabase
            .from('gm_companies')
            .select('*')
            .eq('owner_id', userId);
        let companyId = companies?.[0]?.id as string | undefined;

        if (!companyId) {
            console.log('🏢 Creating Company...');
            const { data: newComp, error: compErr } = await supabase
                .from('gm_companies')
                .insert({
                    owner_id: userId,
                    name: 'GoldMonkey Corp',
                    plan: 'sovereign',
                    status: 'active'
                })
                .select()
                .single();
            if (compErr) {
                console.warn('Warning: Company create failed:', compErr.message);
            } else {
                companyId = newComp?.id;
            }
        }

        if (companyId) {
            // Check gm_restaurants
            const { data: rests } = await supabase
                .from('gm_restaurants')
                .select('*')
                .eq('owner_id', userId);
            if (!rests || rests.length === 0) {
                console.log('🍔 Creating Restaurant...');
                const { data: newRest, error: restErr } = await supabase
                    .from('gm_restaurants')
                    .insert({
                        company_id: companyId,
                        owner_id: userId,
                        name: 'Sovereign Burger Hub',
                        slug: 'sovereign-burger-hub',
                        status: 'active'
                    })
                    .select()
                    .single();
                if (restErr) {
                    console.warn('Warning: Restaurant create failed:', restErr.message);
                    // Fallback: use existing restaurant with same slug so membership can be created (re-run / shared slug)
                    const { data: existingBySlugRows } = await supabase
                        .from('gm_restaurants')
                        .select('id')
                        .eq('slug', 'sovereign-burger-hub')
                        .limit(1);
                    const existingRow = Array.isArray(existingBySlugRows) ? existingBySlugRows[0] : existingBySlugRows;
                    if (existingRow?.id) {
                        restaurantId = existingRow.id;
                        console.log('   Using existing restaurant (slug already present) for membership.');
                    }
                    if (!restaurantId) {
                        const { data: retryRests } = await supabase
                            .from('gm_restaurants')
                            .select('id')
                            .eq('owner_id', userId)
                            .limit(1);
                        const r = Array.isArray(retryRests) ? retryRests[0] : retryRests;
                        if (r?.id) restaurantId = r.id;
                    }
                } else {
                    restaurantId = newRest?.id;
                }
            } else {
                restaurantId = rests[0]?.id;
            }
        }

        // Ensure membership as OWNER for this restaurant
        if (restaurantId) {
            const { data: existingMembers, error: memberErr } = await supabase
                .from('gm_restaurant_members')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('user_id', userId);

            if (memberErr) {
                console.warn('Warning: Membership lookup failed:', memberErr.message);
            } else if (!existingMembers || existingMembers.length === 0) {
                console.log('👤 Creating OWNER membership for restaurant...');
                const { error: insertMemberErr } = await supabase
                    .from('gm_restaurant_members')
                    .insert({
                        restaurant_id: restaurantId,
                        user_id: userId,
                        role: 'owner'
                    });
                if (insertMemberErr) {
                    console.warn('Warning: Membership create failed:', insertMemberErr.message);
                }
            }
        }

        // P4.1 TPV→KDS: uma categoria + um produto para o restaurante soberano (E2E criar pedido)
        if (restaurantId) {
            const { data: existingCat } = await supabase
                .from('gm_menu_categories')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .limit(1);
            const catRow = Array.isArray(existingCat) ? existingCat[0] : existingCat;
            let categoryId = catRow?.id as string | undefined;
            if (!categoryId) {
                const { data: newCat, error: catErr } = await supabase
                    .from('gm_menu_categories')
                    .insert({
                        restaurant_id: restaurantId,
                        name: 'E2E Categoria',
                        sort_order: 0
                    })
                    .select('id')
                    .single();
                if (!catErr && newCat?.id) categoryId = newCat.id;
            }
            if (categoryId) {
                const { data: existingProd } = await supabase
                    .from('gm_products')
                    .select('id')
                    .eq('restaurant_id', restaurantId)
                    .eq('name', 'E2E Burger')
                    .limit(1);
                const prodRow = Array.isArray(existingProd) ? existingProd[0] : existingProd;
                if (!prodRow?.id) {
                    const { error: prodErr } = await supabase
                        .from('gm_products')
                        .insert({
                            restaurant_id: restaurantId,
                            category_id: categoryId,
                            name: 'E2E Burger',
                            price_cents: 999,
                            available: true,
                            station: 'KITCHEN',
                            prep_category: 'main'
                        });
                    if (!prodErr) console.log('   Produto E2E Burger criado (TPV→KDS).');
                }
                const { data: existingDrink } = await supabase
                    .from('gm_products')
                    .select('id')
                    .eq('restaurant_id', restaurantId)
                    .eq('name', 'E2E Drink')
                    .limit(1);
                const drinkRow = Array.isArray(existingDrink) ? existingDrink[0] : existingDrink;
                if (!drinkRow?.id) {
                    const { error: drinkErr } = await supabase
                        .from('gm_products')
                        .insert({
                            restaurant_id: restaurantId,
                            category_id: categoryId,
                            name: 'E2E Drink',
                            price_cents: 399,
                            available: true,
                            station: 'BAR',
                            prep_category: 'drink'
                        });
                    if (!drinkErr) console.log('   Produto E2E Drink criado (KDS Bar).');
                }
            }
            // Mesa 1 para QR Mesa E2E (/public/:slug/mesa/1) e Garçom E2E (/app/waiter/table/:id)
            const { data: existingTable } = await supabase
                .from('gm_tables')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('number', 1)
                .limit(1);
            let tableId: string | undefined;
            const tableRow = Array.isArray(existingTable) ? existingTable[0] : existingTable;
            if (tableRow?.id) {
                tableId = tableRow.id;
            } else {
                const { data: inserted, error: tableErr } = await supabase
                    .from('gm_tables')
                    .insert({ restaurant_id: restaurantId, number: 1, status: 'open' })
                    .select('id')
                    .single();
                if (!tableErr && inserted?.id) {
                    tableId = inserted.id;
                    console.log('   Mesa 1 criada (QR Mesa E2E).');
                }
            }
        }
    } else {
        console.log('ℹ️  Skipping direct DB inserts (Anon Key). Relying on Database Triggers.');
    }

    // Obter table_id para waiter E2E (mesa 1)
    let tableIdForCreds: string | undefined;
    if (SERVICE_KEY && restaurantId) {
        const { data: tableForCreds } = await supabase
            .from('gm_tables')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('number', 1)
            .limit(1)
            .maybeSingle();
        tableIdForCreds = (tableForCreds as { id?: string } | null)?.id;
    }

    // Persist full sovereign payload for smoke/E2E (user_id + restaurant_id + table_id para Garçom)
    const sovereignPayload = {
        ...TEST_USER,
        user_id: userId ?? undefined,
        restaurant_id: restaurantId,
        slug: 'sovereign-burger-hub',
        table_id: tableIdForCreds,
    };
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(sovereignPayload, null, 2));

    console.log('');
    console.log('✅ Seeding Complete.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' Owner Soberano (Supabase Backend)');
    console.log('   Email:   ', TEST_USER.email);
    console.log('   Password:', TEST_USER.password);
    console.log('   Name:    ', TEST_USER.name);
    console.log('   User ID: ', userId);
    if (SERVICE_KEY && restaurantId) {
        console.log('   Backend: Supabase (SERVICE_KEY mode)');
        console.log('   Restaurant ID:', restaurantId);
        console.log('   Restaurante: Sovereign Burger Hub (gm_restaurants, owner_id = userId)');
        console.log('   Membership: gm_restaurant_members(role = owner)');
    } else {
        console.log('   Backend: Supabase (ANON mode) — restaurantes/membership podem depender de triggers.');
    }
    console.log('');
    console.log(' Próximos passos:');
    console.log('   1) Configure a app local para usar este backend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
    console.log('   2) Faça login no Admin com o email/password acima.');
    console.log('   3) Verifique em /admin/modules que o restaurante aparece ligado a este utilizador.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(err => {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
});

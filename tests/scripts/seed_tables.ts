
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials (URL or SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seedTables() {
    console.log('Seeding Tables...');

    // 1. Get First Restaurant
    const { data: restaurants, error: rError } = await supabase
        .from('gm_restaurants')
        .select('id, name')
        .limit(1);

    if (rError || !restaurants || restaurants.length === 0) {
        console.error('No restaurant found. Please seed a restaurant first.');
        return;
    }

    const restaurant = restaurants[0];
    console.log(`Target Restaurant: ${restaurant.name} (${restaurant.id})`);

    // 2. Check existing tables
    const { count, error: cError } = await supabase
        .from('gm_tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id);

    if (count && count > 0) {
        console.log(`Restaurant already has ${count} tables. Skipping seed.`);
        return;
    }

    // 3. Insert 12 Tables
    const tables = Array.from({ length: 12 }, (_, i) => ({
        restaurant_id: restaurant.id,
        number: i + 1,
        status: 'free', // Lowercase to match Enum
        qr_code: `CODE-${i + 1}`
    }));

    const { error: iError } = await supabase
        .from('gm_tables')
        .insert(tables);

    if (iError) {
        console.error('Error inserting tables:', iError);
    } else {
        console.log('Successfully inserted 12 tables.');
    }
}

seedTables().catch(console.error);

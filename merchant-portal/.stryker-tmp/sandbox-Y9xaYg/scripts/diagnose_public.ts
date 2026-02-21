
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Using ANON key to simulate public access? But node script bypasses CORS. Let's use SERVICE KEY to debug RLS vs Query Error. Actually let's try ANON first to see RLS rejection.

const SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Use Service Key to bypass RLS initially for pure query syntax check.

// Test 1: Service Role (Syntax Check)
const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);

async function diagnosePublic() {
    const slug = 'demo-grill';
    console.log(`🔍 Diagnosing Public Query for slug: ${slug}`);

    try {
        const { data, error } = await supabaseService
            .from('gm_restaurants')
            .select(`
            restaurant_id:id,
            name,
            slug,
            description,
            menu_categories:gm_menu_categories (
              id,
              name,
              items:gm_products (
                id,
                name,
                description,
                price_cents,
                photo_url,
                available
              )
            )
          `)
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('❌ Query Error (Service Role):', error);
        } else {
            console.log('✅ Query Success (Service Role). Data found:', !!data);
        }
    } catch (e) {
        console.error('💥 Exception:', e);
    }
}

diagnosePublic();

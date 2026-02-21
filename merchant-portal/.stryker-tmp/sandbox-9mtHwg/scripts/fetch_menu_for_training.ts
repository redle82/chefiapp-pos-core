
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchMenu() {
    console.log('🍽️ Fetching Menu for Lesson Context...');

    // Login to bypass RLS if needed, or just public read if allowed.
    // Assuming products are public or we use admin.
    // Using admin for certainty.
    const ADMIN_EMAIL = 'admin@goldmonkey.com';
    const ADMIN_PASS = 'admin123';
    await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASS });

    const { data: products, error } = await supabase
        .from('gm_products')
        .select('name, category_id, description')
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('📝 MENU ITEMS:');
    products.forEach(p => console.log(`- ${p.name} (${p.description || ''})`));
}

fetchMenu();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFK() {
    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'beta.sofia@chefiapp.com',
        password: 'password123'
    });

    const { data: rests } = await supabase.from('gm_restaurants').select('*').eq('owner_id', authData!.user.id);
    console.log('gm_restaurants:', rests);

    const { data: legacy } = await supabase.from('restaurants').select('*').eq('owner_id', authData!.user.id);
    console.log('restaurants (if exists):', legacy);
}

debugFK().catch(console.error);


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
    { email: 'admin@chefiapp.com', password: 'password123' },
    { email: 'admin@chefiapp.com', password: 'password' },
    { email: 'test@chefiapp.com', password: 'password123' },
    { email: 'sofia@chefiapp.com', password: 'password123' },
    { email: 'sofia.gastrobar@chefiapp.com', password: 'password123' },
    { email: 'beta.sofia@chefiapp.com', password: 'password123' }
];

async function tryLogin() {
    for (const u of USERS) {
        console.log(`Trying login: ${u.email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: u.password
        });

        if (error) {
            console.log(`Failed: ${error.message}`);
        } else {
            console.log('✅✅✅ LOGIN SUCCESSFUL! ✅✅✅');
            console.log(`__CREDENTIALS__:${u.email}:${u.password}`);
            console.log('User ID:', data.user?.id);
            process.exit(0);
        }
    }
    console.log('❌ All login attempts failed.');
    process.exit(1);
}

tryLogin();

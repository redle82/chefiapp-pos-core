
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

async function debug() {
    console.log('🔍 Testing Supabase Connectivity...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try to login with garbage
    console.log('👉 Testing Auth Login (expected 400)...');
    const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: 'garbage@garbage.com',
        password: 'wrongpassword'
    });

    if (authError) {
        console.log('✅ Auth Response:', authError.status, authError.message);
    } else {
        console.log('❓ Unexpected Success:', data);
    }
}

debug();

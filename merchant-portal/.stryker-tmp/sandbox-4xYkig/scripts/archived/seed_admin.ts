
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Local Dev Credentials (from seed_airlock_demo.ts context)
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local Service Role Key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedAdmin() {
    console.log("🔐 Seeding Admin User for Sovereign Vault...");

    // 1. Create/Update User
    const email = 'admin@goldmonkey.com';
    const password = 'password';

    console.log(`-> Creating user: ${email}`);

    // Check if user exists first to get ID, or just upsert via admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) { console.error("❌ List Users Error:", listError); return; }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log(`-> User exists (ID: ${existingUser.id}). Updating password...`);
        const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: password,
            email_confirm: true
        });
        if (error) { console.error("❌ Update Error:", error); return; }
        userId = data.user.id;
    } else {
        console.log("-> Creating new user...");
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (error) { console.error("❌ Create Error:", error); return; }
        userId = data.user.id;
    }

    console.log("✅ User Secured in Vault.");
    console.log("------------------------------------------------");
    console.log(`Credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("------------------------------------------------");
}

seedAdmin();

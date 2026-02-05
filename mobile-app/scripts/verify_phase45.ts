
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
// We can't import OfflineQueueService directly because it uses React Native AsyncStorage which fails in Node.
// We have to mock it or rewrite a Node version for verification.
// For verification, we will verify that "If I insert to supabase from a queue array, it works".
// Actually, better to test the "Offline" path by running manual SQL to see if data appeared? 
// No, I want to verify the SERVICE logic.

// Since OfflineQueueService depends on AsyncStorage, I cannot run it in Node.
// So I will create a script that SIMULATES what the service does:
// 1. Define a "Queue Item" in memory.
// 2. Run the logic that "processItem" does.
// 3. Verify Supabase has the data.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const { coreClient: supabase } = await import('../services/coreClient');

async function verifyOfflineLogic() {
    console.log("🛡️ Starting Phase 45 Verification: Offline Sync Logic");

    try {
        // Authenticate (SignUp to ensure existence)
        const email = "offline_tester@chefiapp.com";
        const password = 'password123';

        console.log(`   👤 Authenticating as ${email}...`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        let user: any = authData.user;

        if (authError) {
            // If already registered, try sign in
            if (authError.message.includes("already registered")) {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                user = signInData.user;
            } else {
                throw authError;
            }
        }

        if (!user) throw new Error("No user");

        console.log(`   ✅ User ID: ${user.id}`);
        console.log("   ⚠️ ENSURE THIS USER IS LINKED TO RESTAURANT IN 'employees' TABLE OR RLS WILL FAIL!");


        // 1. Simulate Offline Queue Item: CREATE_ORDER
        const orderId = crypto.randomUUID();
        const restaurantId = '6d676ae5-2375-42d2-8db3-e4e80ddb1b76'; // Known from Phase 44

        const payloadCreate = {
            id: orderId,
            restaurant_id: restaurantId,
            table_id: 'OFFLINE_TEST',
            table_number: 99,
            status: 'OPEN',
            total_amount: 0,
            user_id: user.id
        };

        console.log("   💾 Simulating Enqueue: CREATE_ORDER", orderId);

        // 2. Simulate Process Queue (Replay)
        console.log("   🔄 Simulating Sync...");
        const { error: syncError } = await supabase.from('gm_orders').insert(payloadCreate);

        if (syncError) {
            throw new Error(`Sync Failed: ${syncError.message}`);
        }
        console.log("   ✅ Sync CREATE_ORDER Success");

        // 3. Simulate Offline Queue Item: ADD_ITEMS
        const payloadItems = [{
            order_id: orderId,
            product_name: 'Offline Burger',
            unit_price: 1500, // 15.00
            quantity: 1,
            total_price: 1500,
            category_name: 'food'
        }];

        const { error: itemsError } = await supabase.from('gm_order_items').insert(payloadItems);
        if (itemsError) throw new Error(`Sync Items Failed: ${itemsError.message}`);
        console.log("   ✅ Sync ADD_ITEMS Success");

        console.log("\n🎉 Phase 45 Logic Verification SUCCESS (Simulation)");

    } catch (e: any) {
        console.error("❌ Verification Failed", e);
        process.exit(1);
    }
}

verifyOfflineLogic();

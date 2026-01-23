
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve from current directory (.env locally)
const envPath = path.resolve(process.cwd(), '.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOperationalLogic() {
    console.log("🕵️‍♂️ Starting Phase 43 Verification: Operational Logic...");

    try {
        // 1. Setup: Get a Restaurant & User
        const { data: restaurant } = await supabase.from('gm_restaurants').select('id').limit(1).single();
        if (!restaurant) throw new Error("No restaurant found");
        console.log(`Using Restaurant: ${restaurant.id}`);

        // Use VALID User ID fetched from auth.users via SQL
        const userId = "3b6cd06c-40a3-44fd-8dff-0f3f72f5cc57";
        console.log(`Using User: ${userId}`);

        // ==========================================
        // V43.1: CASH MANAGEMENT LOOP (Financial Sessions)
        // ==========================================
        console.log("\n💰 Verifying Cash Management (Financial Sessions)...");

        // A. OPEN FINANCIAL SESSION
        const openingFloatCents = 10000; // €100.00
        const { data: session, error: sessError } = await supabase
            .from('gm_financial_sessions')
            .insert({
                restaurant_id: restaurant.id,
                user_id: userId,
                status: 'open',
                starting_float: openingFloatCents,
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessError) throw sessError;
        console.log(`   ✅ Financial Session Opened (ID: ${session.id}, Float: €${openingFloatCents / 100})`);

        // B. CASH MOVEMENT (BLEED)
        const dropAmountCents = 2000; // €20.00
        const { data: movement, error: movError } = await supabase
            .from('gm_cash_movements')
            .insert({
                session_id: session.id, // Linking to SESSION
                type: 'bleed',
                amount_cents: dropAmountCents,
                reason: 'Test Drop P43',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (movError) throw movError;
        console.log(`   ✅ Cash Bleed Recorded (Amount: €${dropAmountCents / 100})`);

        // C. CLOSE SESSION & RECONCILIATION
        // Expected Cash = Float (100) - Bleed (20) = 80.
        const closingCashCents = 8000; // €80.00

        const { data: closedSession, error: closeError } = await supabase
            .from('gm_financial_sessions')
            .update({
                status: 'closed',
                closing_cash_actual: closingCashCents,
                closed_at: new Date().toISOString()
            })
            .eq('id', session.id)
            .select()
            .single();

        if (closeError) throw closeError;
        console.log(`   ✅ Session Closed (Closing Cash: €${closedSession.closing_cash_actual / 100})`);

        // Verify Persistence
        if (closedSession.starting_float !== openingFloatCents) throw new Error("Opening Float Mismatch");
        if (closedSession.closing_cash_actual !== closingCashCents) throw new Error("Closing Cash Mismatch");

        // ==========================================
        // V43.2: TASK SYNC LOOP
        // ==========================================
        console.log("\n📋 Verifying Task Sync...");

        // A. CREATE TASK (Manager side)
        const taskTitle = "Verify P43 Script " + Date.now();
        const { data: task, error: taskError } = await supabase
            .from('gm_tasks')
            .insert({
                restaurant_id: restaurant.id,
                title: taskTitle,
                description: "Automated verification task",
                status: 'pending',
                priority: 'normal',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (taskError) {
            console.error(taskError);
            throw taskError;
        }
        console.log(`   ✅ Task Created (ID: ${task.id}, Title: "${task.title}")`);

        // B. COMPLETE TASK (Staff side)
        const { data: completedTask, error: completeError } = await supabase
            .from('gm_tasks')
            .update({
                status: 'done',
                completed_at: new Date().toISOString(),
                completed_by: userId
            })
            .eq('id', task.id)
            .select()
            .single();

        if (completeError) throw completeError;
        console.log(`   ✅ Task Completed (Status: ${completedTask.status})`);

        if (completedTask.status !== 'done') throw new Error("Task Status Update Failed");


        console.log("\n🎉 Phase 43 Verification SUCCESS!");
        process.exit(0);

    } catch (e) {
        console.error("❌ Verification Failed:", e);
        process.exit(1);
    }
}

verifyOperationalLogic();

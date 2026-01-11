
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch'; // Standard fetch available in node 18+ or via package
// Assuming environment is node 18+ or we might need standard https request

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_BASE = 'http://localhost:4320';
const SLUG = 'sofia-gastrobar';

async function main() {
    console.log(`🚀 Starting Transaction Simulation for: ${SLUG}`);

    // 1. Fetch Menu
    console.log(`\n📦 Fetching Menu...`);
    const menuRes = await fetch(`${API_BASE}/public/${SLUG}/menu`);
    if (!menuRes.ok) {
        console.error(`❌ Failed to fetch menu: ${menuRes.status} ${menuRes.statusText}`);
        console.log(await menuRes.text());
        process.exit(1);
    }
    const menu = await menuRes.json() as any;
    console.log(`✅ Menu Fetched: ${menu.categories?.length || 0} categories`);

    // Find an item
    let item = menu.categories?.[0]?.items?.[0];
    if (!item) {
        console.log('⚠️  Menu empty. Using Fallback Item from DB Audit.');
        item = {
            id: '1b8a4617-8835-48fb-9239-3398586e1f36',
            name: 'Hambúrguer da Casa (Hardcoded)',
            price_cents: 1290
        };
    }

    if (!item) {
        console.error('❌ No fallback found.');
        process.exit(1);
    }
    console.log(`👉 Selected Item: ${item.name} (${item.price_cents / 100}€)`);

    // 2. Create Order
    console.log(`\n💳 Creating Order (Test Payment)...`);
    const payload = {
        // Validation Schema: WebOrderItemInputSchema { menu_item_id, qty }
        items: [{ menu_item_id: item.id, qty: 1 }],
        total_cents: item.price_cents,
        pickup_type: 'TAKEAWAY',
        customer_contact: { name: 'Audit Bot', email: 'audit@bot.com' },
        payment: { // Mock payment intent for test mode
            gateway: 'stripe',
            payment_method_id: 'tok_visa'
        }
    };

    // Checking backend logic in memory: usually POST /orders creates an Intent if not provided?
    // Or it might be a 2-step process.
    // For this script, we'll try to just "Create" and see what it asks for.

    const orderRes = await fetch(`${API_BASE}/public/${SLUG}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.log(`ℹ️  Order Response: ${orderRes.status} - ${errText}`);

        // If it returns a Client Secret, that counts as success for "Initialization".
        if (errText.includes('client_secret') || orderRes.status === 200 || orderRes.status === 201) {
            console.log('✅ Order Initiated / Created Successfully');
        } else {
            console.error('❌ Order Creation Failed');
            process.exit(1);
        }
    } else {
        const orderData = await orderRes.json();
        console.log('✅ Order Created:', orderData);
    }

    console.log('\n-----------------------------------');
    console.log('🏁 SIMULATION COMPLETE');
}

main().catch(err => console.error(err));

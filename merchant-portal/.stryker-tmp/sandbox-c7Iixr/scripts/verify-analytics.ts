
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function verifyAnalytics() {
    console.log('📊 Verifying Financial Analytics...');

    // 1. Get Context
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    const restaurantId = restaurants![0].id;

    // 2. Fetch Orders (Past 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: orders, error: ordersError } = await supabase
        .from('gm_orders')
        .select(`
            id, total_amount, payment_status, 
            items:gm_order_items(product_id, quantity, total_price)
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday)
        .neq('status', 'canceled');

    if (ordersError) throw ordersError;

    console.log(`   🔸 Found ${orders?.length} orders in last 24h`);
    if (!orders || orders.length === 0) {
        console.warn("   ⚠️ No orders found. Verification results will be empty.");
        return;
    }

    // 3. Logic Replication: Calculate Revenue
    let totalRevenue = 0;
    const productIds = new Set<string>();

    orders.forEach(o => {
        totalRevenue += (o.total_amount || 0);
        o.items.forEach((i: any) => i.product_id && productIds.add(i.product_id));
    });

    console.log(`   🔸 Total Revenue (Cents): ${totalRevenue}`);

    // 4. Logic Replication: Calculate Costs
    let totalCost = 0;
    if (productIds.size > 0) {
        const { data: recipes } = await supabase
            .from('gm_recipes')
            .select(`menu_item_id, quantity, inventory_item:gm_inventory_items(cost_per_unit)`)
            .in('menu_item_id', Array.from(productIds));

        const productCosts: Record<string, number> = {};
        recipes?.forEach((r: any) => {
            if (!productCosts[r.menu_item_id]) productCosts[r.menu_item_id] = 0;
            const cost = (r.quantity || 0) * (r.inventory_item?.cost_per_unit || 0);
            productCosts[r.menu_item_id] += cost;
        });

        // Sum costs based on sold items
        orders.forEach(o => {
            o.items.forEach((i: any) => {
                const pCost = productCosts[i.product_id] || 0;
                totalCost += (pCost * i.quantity);
            });
        });
    }

    console.log(`   🔸 Total COGS (Cents): ${totalCost}`);

    const marginCents = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (marginCents / totalRevenue) * 100 : 0;

    console.log(`   ✅ Gross Profit: ${(marginCents / 100).toFixed(2)}`);
    console.log(`   ✅ Margin: ${marginPercent.toFixed(1)}%`);

    // Assertion (Basic sanity check)
    if (marginPercent < 0 || marginPercent > 100) {
        console.warn("   ⚠️ Margin seems suspicious (negative or > 100%)");
    } else {
        console.log("   ✅ Margin looks healthy/realistic.");
    }
}

verifyAnalytics().catch(e => {
    console.error(e);
    process.exit(1);
});

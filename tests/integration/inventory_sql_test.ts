import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    try {
        console.log('📦 Starting SQL Inventory Test...');

        // 1. Setup Data
        const restId = uuidv4();
        const tenantId = uuidv4();
        const catId = uuidv4();
        const prodId = uuidv4();

        await client.query('INSERT INTO public.saas_tenants (id, name, slug) VALUES ($1, \'Test Tenant\', $2)', [tenantId, 'slug-' + tenantId]);
        await client.query('INSERT INTO public.gm_restaurants (id, tenant_id, name, slug) VALUES ($1, $2, \'Test Rest\', $3)', [restId, tenantId, 'slug-' + restId]);
        await client.query('INSERT INTO public.gm_menu_categories (id, restaurant_id, name) VALUES ($1, $2, \'Test Cat\')', [catId, restId]);
        await client.query(`
            INSERT INTO public.gm_products (id, restaurant_id, category_id, name, price_cents, track_stock, stock_quantity)
            VALUES ($1, $2, $3, 'Stock Item', 100, true, 1)
        `, [prodId, restId, catId]);
        // Check columns
        const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'gm_orders' AND column_name = 'sync_metadata'");
        if (colRes.rows.length === 0) {
            console.error('❌ sync_metadata missing!');
        } else {
            console.log('✅ sync_metadata exists');
        }

        // 2. Buy 1 (Expect Success)
        console.log('🛒 Buying 1 Item...');
        await client.query(`
            SELECT public.create_order_atomic(
                $1::UUID,
                jsonb_build_array(
                    jsonb_build_object(
                        'product_id', $2::UUID,
                        'name', 'Stock Item',
                        'quantity', 1,
                        'unit_price', 100
                    )
                ),
                'cash'::TEXT,
                NULL::JSONB
            );
        `, [restId, prodId]);
        console.log('✅ Buy 1 Success');

        // 3. Verify Stock = 0
        const res = await client.query('SELECT stock_quantity FROM public.gm_products WHERE id = $1', [prodId]);
        if (parseFloat(res.rows[0].stock_quantity) !== 0) {
            throw new Error('Stock is not 0! ' + res.rows[0].stock_quantity);
        }
        console.log('✅ Stock is 0');

        // 4. Buy 1 More (Expect Fail)
        console.log('🛒 Buying 1 More (Except Fail)...');
        try {
            await client.query(`
                SELECT public.create_order_atomic(
                    $1::UUID,
                    jsonb_build_array(
                        jsonb_build_object(
                            'product_id', $2::UUID,
                            'name', 'Stock Item',
                            'quantity', 1,
                            'unit_price', 100
                        )
                    ),
                    'cash'::TEXT,
                    NULL::JSONB
                );
            `, [restId, prodId]);
            throw new Error('❌ Should have failed!');
        } catch (err: any) {
            if (err.message.includes('INSUFFICIENT_STOCK')) {
                console.log('✅ Blocked Correctly: ' + err.message);
            } else {
                throw err;
            }
        }

        // 5. Offline Sync (Expect Success)
        console.log('🔄 Offline Sync (Expect Success)...');
        await client.query(`
            SELECT public.create_order_atomic(
                $1::UUID,
                jsonb_build_array(
                    jsonb_build_object(
                        'product_id', $2::UUID,
                        'name', 'Stock Item',
                        'quantity', 1,
                        'unit_price', 100
                    )
                ),
                'cash'::TEXT,
                '{"offline": true}'::jsonb
            );
        `, [restId, prodId]);
        console.log('✅ Sync Success');

        // Cleanup
        await client.query('DELETE FROM public.gm_order_items WHERE product_id = $1', [prodId]);
        await client.query('DELETE FROM public.gm_orders WHERE restaurant_id = $1', [restId]);
        await client.query('DELETE FROM public.gm_products WHERE id = $1', [prodId]);
        await client.query('DELETE FROM public.gm_menu_categories WHERE id = $1', [catId]);
        await client.query('DELETE FROM public.gm_restaurants WHERE id = $1', [restId]);
        await client.query('DELETE FROM public.saas_tenants WHERE id = $1', [tenantId]);
        console.log('🧹 Cleanup Done');

    } catch (err) {
        console.error('❌ Test Failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();

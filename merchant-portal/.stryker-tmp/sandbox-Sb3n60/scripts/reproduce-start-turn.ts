
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const restaurantId = '6d676ae5-2375-42d2-8db3-e4e80ddb1b76';
const deviceId = 'test-device-repro-' + Date.now();
const role = 'manager';
const permissions = { canViewFinancials: false, canModifyMenu: true, canmanageStaff: true, canVoidOrders: true, canCloseRegister: true };

async function testRPC() {
    if (!url || !key) return;
    const client = createClient(url, key);

    console.log('--- TEST 1: Anonymous Call (Valid Params) ---');
    try {
        const { data, error } = await client.rpc('start_turn', {
            p_restaurant_id: restaurantId,
            p_operational_mode: 'tower',
            p_device_id: deviceId,
            p_device_name: 'Repro Script',
            p_role_at_turn: role,
            p_permissions_snapshot: permissions
        });
        if (error) console.log('Test 1 Error:', error.code, error.message);
        else console.log('Test 1 Success:', data);
    } catch (e) {
        console.error('Test 1 Exception');
    }

    console.log('\n--- TEST 2: Anonymous Call (Invalid Enum) ---');
    try {
        const { data, error } = await client.rpc('start_turn', {
            p_restaurant_id: restaurantId,
            p_operational_mode: 'INVALID_MODE',
            p_device_id: deviceId,
            p_device_name: 'Repro Script',
            p_role_at_turn: role,
            p_permissions_snapshot: permissions
        });
        if (error) console.log('Test 2 Error:', error.code, error.message);
        else console.log('Test 2 Success:', data);
    } catch (e) {
        console.error('Test 2 Exception');
    }
}
testRPC();

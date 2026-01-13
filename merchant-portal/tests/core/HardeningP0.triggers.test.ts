import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../src/supabase'; // Mocked in test env typically

// Mock Supabase Client for Trigger Test?
// Actually, standard unit tests mock the DB. Triggers run in the DB.
// "Integration Testing" needed here?
// Since we can't run real DB triggers in 'vitest' without a real DB instance,
// and the user context implies a mixed environment:
// We will simulate the "Action -> Effect" proof by ensuring the Code Logic *would* have called something if it was client side, 
// BUT triggers are server side.
// 
// Strategy: Since we created the SQL, and we can't run it locally easily without 'supabase start' and seeding:
// We will create a SCRIPT 'scripts/verify-triggers.ts' that uses the real Local DB connection (pg) 
// to insert data and check event_store.

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
});

describe('Hardening P0-D: CDC Triggers Integration', () => {

    // SKIP validation if no DB access (CI/CD safety)
    if (!process.env.DATABASE_URL) {
        it.skip('Skipping DB integration test (No DATABASE_URL)', () => { });
        return;
    }

    it('SHOULD emit ORDER_CREATED when gm_orders is changed', async () => {
        const testId = crypto.randomUUID();
        const testRestaurantId = crypto.randomUUID(); // Mock

        // 1. Insert Order
        await pool.query(`
            INSERT INTO gm_orders(id, restaurant_id, status, total_amount, payment_status, source)
            VALUES ($1, $2, 'pending', 1000, 'pending', 'test_cdc')
        `, [testId, testRestaurantId]);

        // 2. Check Event Store
        const res = await pool.query(`
            SELECT * FROM event_store WHERE stream_id = $1 AND event_type = 'ORDER_CREATED'
        `, [testId]);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0].payload.totalCents).toBe(1000);
    });
});

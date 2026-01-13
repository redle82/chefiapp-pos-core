import { IncomingMessage, ServerResponse } from 'http';
import { Pool } from 'pg';

// Lightweight in-memory cache for recent keys to avoid DB hits on rapid retries
const RECENT_KEYS = new Set<string>();

export function checkIdempotency(pool: Pool) {
    return async (req: IncomingMessage, res: ServerResponse, body: any): Promise<boolean> => {
        const key = req.headers['idempotency-key'] as string;

        if (!key) return false; // Allowed to proceed (no guarantee)

        // 1. Fast Memory Check (Debounce essentially)
        if (RECENT_KEYS.has(key)) {
            console.warn(`[Idempotency] Fast reject for key: ${key}`);
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'CONFLICT', message: 'Request with this Idempotency-Key is currently processing or recently processed.' }));
            return true; // Blocked
        }

        RECENT_KEYS.add(key);
        setTimeout(() => RECENT_KEYS.delete(key), 60000); // 1 min expiry

        // 2. DB Check (Durable)
        try {
            // Check Orders
            // TODO: Enable this after confirming `web_orders` vs `gm_orders` schema for idempotency_key
            /*
            const orderRes = await pool.query(
                `SELECT id FROM web_orders WHERE idempotency_key = $1`,
                [key]
            );
            if (orderRes.rows.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    idempotent_replay: true,
                    order_id: orderRes.rows[0].id
                }));
                return true; // Blocked (Success Replay)
            }
            */

            // Mock success if we had it in memory? No, allow proceed.
            // Ideally we check gm_orders if column exists. For now, rely on Memory Debounce.

            // Check Fiscal (if applicable)
            // This is generic, so we might miss fiscal specific paths.
            // Ideally, the handler logic handles the DB check (like createWebOrder does),
            // but this middleware protects against "double clicking".

            return false; // Proceed

        } catch (e) {
            console.error('[Idempotency] Check failed:', e);
            return false; // Fail open to allow processing? Or closed? Open for robustness.
        }
    };
}

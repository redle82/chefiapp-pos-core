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

        // 2. DB Check (Durable) - TASK-4.1.2: Verificar idempotency_key no banco
        try {
            // TASK-4.1.2: Verificar se idempotency_key já foi processado em gm_orders
            // Usar query que funciona mesmo se a coluna não existir (graceful degradation)
            try {
                const orderRes = await pool.query(
                    `SELECT id FROM gm_orders WHERE idempotency_key = $1 LIMIT 1`,
                    [key]
                );
                if (orderRes.rows.length > 0) {
                    console.log(`[Idempotency] Found existing order with key: ${key}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        idempotent_replay: true,
                        order_id: orderRes.rows[0].id
                    }));
                    return true; // Blocked (Success Replay)
                }
            } catch (dbError: any) {
                // Se erro é "column does not exist", ignorar (schema antigo)
                if (dbError.message?.includes('does not exist') || dbError.code === '42703') {
                    console.warn('[Idempotency] idempotency_key column not found in gm_orders, using memory cache only');
                } else {
                    throw dbError;
                }
            }

            // TASK-4.1.2: Verificar também em web_orders (se existir)
            try {
                const webOrderRes = await pool.query(
                    `SELECT id FROM web_orders WHERE idempotency_key = $1 LIMIT 1`,
                    [key]
                );
                if (webOrderRes.rows.length > 0) {
                    console.log(`[Idempotency] Found existing web_order with key: ${key}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        idempotent_replay: true,
                        order_id: webOrderRes.rows[0].id
                    }));
                    return true; // Blocked (Success Replay)
                }
            } catch (dbError: any) {
                // Se tabela não existe ou coluna não existe, ignorar
                if (dbError.message?.includes('does not exist') || dbError.code === '42P01' || dbError.code === '42703') {
                    // Tabela ou coluna não existe, continuar
                } else {
                    throw dbError;
                }
            }

            return false; // Proceed (não encontrado no DB)

        } catch (e) {
            console.error('[Idempotency] Check failed:', e);
            return false; // Fail open to allow processing (robustness)
        }
    };
}

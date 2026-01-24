/**
 * MEGA OPERATIONAL SIMULATOR - FAIL-FAST MODE
 * 
 * Validação rápida do Core durante refatorações.
 * 
 * Características:
 * - 1 hora simulada (não 24h)
 * - Para no primeiro erro
 * - Validações críticas apenas
 * - Output minimalista
 * - Exit code não-zero em falha
 * 
 * Uso:
 *   make simulate-failfast
 *   ou
 *   MODE=failfast DURATION_MINUTES=1 node simulate-failfast.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Configuração
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const SIMULATION_DURATION_MINUTES = parseInt(process.env.DURATION_MINUTES || '1');
const RANDOM_SEED = parseInt(process.env.SEED || Date.now().toString());

// Time warp: 1h simulada
const SIMULATED_HOURS = 1;
const REAL_SECONDS = SIMULATION_DURATION_MINUTES * 60;
const TIME_MULTIPLIER = (SIMULATED_HOURS * 60 * 60) / REAL_SECONDS;

const pool = new Pool({ connectionString: DATABASE_URL });

// Gerador de números aleatórios com seed
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }
    
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    pick(array) {
        return array[this.int(0, array.length - 1)];
    }
}

const rng = new SeededRandom(RANDOM_SEED);

// Estado global
const state = {
    startTime: null,
    virtualTime: null,
    restaurants: [],
    errors: [],
    metrics: {
        orders_created: 0,
        print_jobs: 0,
        events: 0,
        tasks_created: 0,
        tasks_completed: 0
    }
};

// Funções auxiliares
function getVirtualTime() {
    const elapsed = (Date.now() - state.startTime) / 1000;
    const virtualElapsed = elapsed * TIME_MULTIPLIER;
    const virtualTime = new Date(state.virtualTime.getTime() + virtualElapsed * 1000);
    return virtualTime;
}

function formatVirtualTime(time) {
    return time.toTimeString().substring(0, 5);
}

function getVirtualHour(time) {
    return time.getHours();
}

function fail(message) {
    state.errors.push(message);
    console.error(`\n❌ FAIL-FAST: ${message}`);
    process.exit(1);
}

// Carregar perfil
function loadProfile(name) {
    const profilePath = path.join(__dirname, '../seeds/profiles', `${name}.json`);
    if (!fs.existsSync(profilePath)) {
        fail(`Perfil não encontrado: ${name}`);
    }
    return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
}

// Validações críticas
async function validateIntegrity(client) {
    // Orphan items
    const orphanResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM gm_order_items 
        WHERE order_id NOT IN (SELECT id FROM gm_orders)
    `);
    if (parseInt(orphanResult.rows[0].count) > 0) {
        fail(`Orphan items detectados: ${orphanResult.rows[0].count}`);
    }

    // Orphan print jobs
    const orphanPrintsResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM gm_print_jobs 
        WHERE order_id NOT IN (SELECT id FROM gm_orders)
    `);
    if (parseInt(orphanPrintsResult.rows[0].count) > 0) {
        fail(`Orphan print jobs detectados: ${orphanPrintsResult.rows[0].count}`);
    }
}

// Criar pedido (simplificado)
async function createOrder(client, restaurant, profile, virtualTime) {
    try {
        const orderResult = await client.query(`
            INSERT INTO gm_orders (
                restaurant_id, status, total_cents, currency, origin, created_at
            ) VALUES ($1, 'pending', $2, 'BRL', 'pos', $3)
            RETURNING id
        `, [restaurant.id, rng.int(2000, 15000), virtualTime]);
        
        const orderId = orderResult.rows[0].id;
        const itemCount = profile.avg_items_per_order || 2;
        
        for (let i = 0; i < itemCount; i++) {
            await client.query(`
                INSERT INTO gm_order_items (
                    order_id, product_id, quantity, price_cents, created_at
                ) VALUES ($1, $2, $3, $4, $5)
            `, [orderId, rng.int(1, 100), 1, rng.int(500, 3000), virtualTime]);
        }
        
        await client.query(`
            INSERT INTO gm_events (
                restaurant_id, event_type, entity_type, entity_id, metadata, created_at
            ) VALUES ($1, 'order.created', 'order', $2, '{}', $3)
        `, [restaurant.id, orderId, virtualTime]);
        
        state.metrics.orders_created++;
        state.metrics.events++;
    } catch (error) {
        fail(`Erro ao criar pedido: ${error.message}`);
    }
}

// Processar tick (simplificado)
async function simulateTick(client, restaurants, profiles, virtualTime) {
    const hour = getVirtualHour(virtualTime);
    
    // Apenas horário de operação (10h-22h)
    if (hour >= 10 && hour < 22) {
        // Criar alguns pedidos
        const activeRestaurants = restaurants.filter((r, i) => {
            const profile = profiles[i];
            return profile && hour >= parseInt(profile.opening_hours.open.split(':')[0]);
        });
        
        if (activeRestaurants.length > 0 && rng.next() < 0.3) {
            const restaurant = rng.pick(activeRestaurants);
            const profileIndex = restaurants.indexOf(restaurant);
            await createOrder(client, restaurant, profiles[profileIndex], virtualTime);
        }
    }
}

// Main
async function main() {
    console.log('⚡ FAIL-FAST MODE');
    console.log(`   Duração: ${SIMULATION_DURATION_MINUTES} min → ${SIMULATED_HOURS}h simulada`);
    console.log(`   Multiplicador: ${TIME_MULTIPLIER.toFixed(1)}x`);
    console.log('');
    
    const client = await pool.connect();
    
    try {
        // Limpar dados (ordem correta para respeitar foreign keys)
        await client.query(`
            DELETE FROM gm_kds_events;
            DELETE FROM gm_task_escalations;
            DELETE FROM gm_shift_blocks;
            DELETE FROM gm_offline_actions;
            DELETE FROM gm_order_items;
            DELETE FROM gm_print_jobs;
            DELETE FROM gm_events;
            DELETE FROM gm_tasks;
            DELETE FROM gm_orders;
        `);
        
        // Carregar restaurantes
        const restResult = await client.query('SELECT id, name FROM gm_restaurants LIMIT 5');
        state.restaurants = restResult.rows;
        
        if (state.restaurants.length === 0) {
            fail('Nenhum restaurante encontrado');
        }
        
        const profiles = state.restaurants.map(() => loadProfile('pequeno'));
        
        state.startTime = Date.now();
        state.virtualTime = new Date();
        state.virtualTime.setHours(10, 0, 0, 0);
        
        console.log('🚀 Iniciando simulação...');
        
        const tickInterval = 500; // Mais rápido
        const endTime = state.startTime + (SIMULATION_DURATION_MINUTES * 60 * 1000);
        
        while (Date.now() < endTime) {
            const virtualTime = getVirtualTime();
            await simulateTick(client, state.restaurants, profiles, virtualTime);
            await new Promise(resolve => setTimeout(resolve, tickInterval));
        }
        
        // Validação final
        console.log('\n🔍 Validando integridade...');
        await validateIntegrity(client);
        
        console.log('\n✅ PASS');
        console.log(`   Pedidos: ${state.metrics.orders_created}`);
        console.log(`   Eventos: ${state.metrics.events}`);
        console.log(`   Erros: ${state.errors.length}`);
        
        process.exit(0);
        
    } catch (error) {
        fail(`Erro fatal: ${error.message}`);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
});

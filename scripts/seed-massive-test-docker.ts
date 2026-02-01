#!/usr/bin/env npx ts-node
/**
 * SEED MASSIVE TEST - ChefIApp (Docker Core)
 * 
 * Creates N restaurants with full staff, menu, and tables for load testing.
 * Adapted for Docker Core (Postgres direct, no Supabase).
 * 
 * Usage:
 *   npx ts-node scripts/seed-massive-test-docker.ts --restaurants=5
 *   npx ts-node scripts/seed-massive-test-docker.ts --restaurants=10 --cleanup
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

interface MassiveTestConfig {
  restaurantCount: number;
  staffPerRestaurant: {
    owner: number;
    manager: number;
    waiter: number;
    kitchen: number;
    bar: number;
    cleaning: number;
  };
  tablesPerRestaurant: number;
  menuItemsPerCategory: number;
  cleanup: boolean;
}

const DEFAULT_CONFIG: MassiveTestConfig = {
  restaurantCount: 5,
  staffPerRestaurant: {
    owner: 1,
    manager: 1,
    waiter: 3,
    kitchen: 2,
    bar: 1,
    cleaning: 1,
  },
  tablesPerRestaurant: 5,
  menuItemsPerCategory: 3,
  cleanup: false,
};

// Menu templates
const MENU_CATEGORIES = [
  { name: 'Entradas', items: ['Bruschetta', 'Croquetas', 'Nachos', 'Carpaccio', 'Ensalada César'] },
  { name: 'Platos Principales', items: ['Paella', 'Risotto', 'Filete', 'Salmón', 'Pasta Carbonara'] },
  { name: 'Bebidas', items: ['Agua', 'Coca-Cola', 'Cerveza', 'Vino Tinto', 'Sangría'] },
  { name: 'Postres', items: ['Tiramisú', 'Flan', 'Helado', 'Tarta de Queso', 'Brownie'] },
];

const STAFF_NAMES = {
  owner: ['Carlos Dueño', 'María Propietaria', 'Juan Owner'],
  manager: ['Ana Gerente', 'Pedro Manager', 'Laura Supervisora'],
  waiter: ['Luis Mesero', 'Carmen Camarera', 'Miguel Server', 'Sofia Waitress', 'Diego Mozo'],
  kitchen: ['Chef Antonio', 'Cocinero José', 'Ayudante Pablo', 'Sous Chef Elena'],
  bar: ['Bartender Rosa', 'Barman Carlos', 'Mixologist Ana'],
  cleaning: ['Limpieza María', 'Mantenimiento Juan', 'Housekeeping Pedro'],
};

// =============================================================================
// TYPES
// =============================================================================

interface CreatedRestaurant {
  id: string;
  name: string;
  tenantId: string | null;
  staff: CreatedStaff[];
  tables: string[];
  products: string[];
}

interface CreatedStaff {
  id: string;
  name: string;
  role: string;
  position: string;
}

interface TestResults {
  restaurants: CreatedRestaurant[];
  totalStaff: number;
  totalTables: number;
  totalProducts: number;
  duration: number;
  errors: string[];
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

function getDbPool(): pg.Pool {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';
  
  return new Pool({
    connectionString: dbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function createTenant(pool: pg.Pool, index: number): Promise<string | null> {
  try {
    const tenantId = uuidv4();
    const slug = `test-tenant-${index}-${Date.now()}`;
    
    await pool.query(
      `INSERT INTO public.saas_tenants (id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [`00000000-0000-0000-0000-${String(index).padStart(12, '0')}`, `Test Tenant ${index}`, slug]
    );
    
    return tenantId;
  } catch (e: any) {
    if (e.message?.includes('does not exist') || e.message?.includes('relation') || e.code === '42P01') {
      console.log('   ℹ️  saas_tenants table not found, skipping tenant creation');
      return null;
    }
    throw e;
  }
}

async function createRestaurant(
  pool: pg.Pool, 
  tenantId: string | null, 
  index: number
): Promise<{ id: string; name: string }> {
  const restaurantId = uuidv4();
  const name = `Test Restaurant ${index}`;
  const slug = `test-restaurant-${index}-${Date.now()}`;
  
  if (tenantId) {
    await pool.query(
      `INSERT INTO public.gm_restaurants (id, tenant_id, name, slug)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING`,
      [restaurantId, tenantId, name, slug]
    );
  } else {
    await pool.query(
      `INSERT INTO public.gm_restaurants (id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [restaurantId, name, slug]
    );
  }
  
  return { id: restaurantId, name };
}

async function createStaff(
  pool: pg.Pool,
  restaurantId: string,
  config: MassiveTestConfig['staffPerRestaurant']
): Promise<CreatedStaff[]> {
  const staff: CreatedStaff[] = [];
  
  // Map roles to positions
  const rolePositionMap: Record<string, { role: string; position: string }> = {
    owner: { role: 'owner', position: 'manager' },
    manager: { role: 'manager', position: 'manager' },
    waiter: { role: 'worker', position: 'waiter' },
    kitchen: { role: 'worker', position: 'kitchen' },
    bar: { role: 'worker', position: 'waiter' },
    cleaning: { role: 'worker', position: 'cleaning' },
  };

  try {
    const staffToCreate: Array<{ name: string; role: string; position: string }> = [];

    for (const [staffType, count] of Object.entries(config)) {
      const names = STAFF_NAMES[staffType as keyof typeof STAFF_NAMES] || [];
      const mapping = rolePositionMap[staffType];
      
      for (let i = 0; i < count; i++) {
        const name = names[i % names.length] || `${staffType} ${i + 1}`;
        staffToCreate.push({
          name: `${name} #${i + 1}`,
          role: mapping.role,
          position: mapping.position,
        });
      }
    }

    // Try employees table
    for (const staffMember of staffToCreate) {
      const staffId = uuidv4();
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      try {
        await pool.query(
          `INSERT INTO public.employees (id, restaurant_id, name, role, position, pin, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [staffId, restaurantId, staffMember.name, staffMember.role, staffMember.position, pin, true]
        );
        
        staff.push({
          id: staffId,
          name: staffMember.name,
          role: staffMember.role,
          position: staffMember.position,
        });
      } catch (e: any) {
        if (e.code === '42P01') {
          // Table doesn't exist, skip staff creation
          console.log('   ⚠️  employees table not found, skipping staff creation');
          return [];
        }
        throw e;
      }
    }
  } catch (e: any) {
    if (e.code === '42P01') {
      console.log('   ⚠️  Could not create staff (tables not available), continuing without staff');
      return [];
    }
    throw e;
  }

  return staff;
}

async function createMenu(
  pool: pg.Pool,
  restaurantId: string,
  itemsPerCategory: number
): Promise<string[]> {
  const productIds: string[] = [];

  for (const category of MENU_CATEGORIES) {
    try {
      // Create category
      const categoryId = uuidv4();
      const sortOrder = MENU_CATEGORIES.indexOf(category);
      
      await pool.query(
        `INSERT INTO public.gm_menu_categories (id, restaurant_id, name, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [categoryId, restaurantId, category.name, sortOrder]
      );

      // Create products for this category
      const products = category.items.slice(0, itemsPerCategory);
      
      for (const itemName of products) {
        const productId = uuidv4();
        const priceCents = Math.floor(Math.random() * 2000 + 500);
        
        await pool.query(
          `INSERT INTO public.gm_products (id, restaurant_id, category_id, name, description, price_cents, available)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [productId, restaurantId, categoryId, itemName, `Delicioso ${itemName}`, priceCents, true]
        );
        
        productIds.push(productId);
      }
    } catch (e: any) {
      console.warn(`Warning: Could not create category ${category.name}: ${e.message}`);
      continue;
    }
  }

  return productIds;
}

async function createTables(
  pool: pg.Pool,
  restaurantId: string,
  count: number
): Promise<string[]> {
  const tableIds: string[] = [];

  for (let i = 1; i <= count; i++) {
    const tableId = uuidv4();
    const qrCode = `QR-${restaurantId.slice(0, 8)}-${i}`;
    
    try {
      await pool.query(
        `INSERT INTO public.gm_tables (id, restaurant_id, number, status, qr_code)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (restaurant_id, number) DO NOTHING`,
        [tableId, restaurantId, i, 'closed', qrCode]
      );
      
      tableIds.push(tableId);
    } catch (e: any) {
      if (e.code === '23505') {
        // Already exists, skip
        continue;
      }
      throw e;
    }
  }

  return tableIds;
}

async function cleanupTestData(pool: pg.Pool): Promise<void> {
  console.log('🧹 Cleaning up test data...');

  // Delete in reverse order of dependencies
  const tables = [
    'gm_order_items',
    'gm_orders',
    'gm_tables',
    'gm_products',
    'gm_menu_categories',
    'employees',
    'gm_restaurants',
    'saas_tenants',
  ];

  for (const table of tables) {
    try {
      await pool.query(
        `DELETE FROM public.${table} 
         WHERE name LIKE 'Test%' OR name LIKE '%#%'`
      );
    } catch (e: any) {
      if (e.code === '42P01') {
        // Table doesn't exist, skip
        continue;
      }
      console.warn(`Warning: Could not cleanup ${table}: ${e.message}`);
    }
  }

  console.log('✅ Cleanup complete');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function seedMassiveTest(config: MassiveTestConfig): Promise<TestResults> {
  const startTime = Date.now();
  const pool = getDbPool();
  const results: TestResults = {
    restaurants: [],
    totalStaff: 0,
    totalTables: 0,
    totalProducts: 0,
    duration: 0,
    errors: [],
  };

  console.log('🚀 Starting Massive Test Seed (Docker Core)');
  console.log(`   Restaurants: ${config.restaurantCount}`);
  console.log(`   Staff per restaurant: ${Object.values(config.staffPerRestaurant).reduce((a, b) => a + b, 0)}`);
  console.log(`   Tables per restaurant: ${config.tablesPerRestaurant}`);
  console.log('');

  try {
    if (config.cleanup) {
      await cleanupTestData(pool);
    }

    for (let i = 1; i <= config.restaurantCount; i++) {
      console.log(`📍 Creating Restaurant ${i}/${config.restaurantCount}...`);

      try {
        // Create tenant
        const tenantId = await createTenant(pool, i);
        
        // Create restaurant
        const restaurant = await createRestaurant(pool, tenantId, i);
        
        // Create staff
        const staff = await createStaff(pool, restaurant.id, config.staffPerRestaurant);
        
        // Create menu
        const products = await createMenu(pool, restaurant.id, config.menuItemsPerCategory);
        
        // Create tables
        const tables = await createTables(pool, restaurant.id, config.tablesPerRestaurant);

        results.restaurants.push({
          id: restaurant.id,
          name: restaurant.name,
          tenantId,
          staff,
          tables,
          products,
        });

        results.totalStaff += staff.length;
        results.totalTables += tables.length;
        results.totalProducts += products.length;

        console.log(`   ✅ ${restaurant.name}: ${staff.length} staff, ${tables.length} tables, ${products.length} products`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Restaurant ${i}: ${errorMsg}`);
        console.error(`   ❌ Error: ${errorMsg}`);
      }
    }

    results.duration = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Restaurants: ${results.restaurants.length}`);
    console.log(`   Total Staff: ${results.totalStaff}`);
    console.log(`   Total Tables: ${results.totalTables}`);
    console.log(`   Total Products: ${results.totalProducts}`);
    console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s`);
    console.log(`   Errors: ${results.errors.length}`);
    console.log('═══════════════════════════════════════════════════════════');

    // Output JSON for programmatic use
    const outputPath = path.join(process.cwd(), 'test-results', `massive-seed-${Date.now()}.json`);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${outputPath}`);

    return results;
  } finally {
    await pool.end();
  }
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): MassiveTestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--restaurants=')) {
      config.restaurantCount = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--cleanup') {
      config.cleanup = true;
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/seed-massive-test-docker.ts [options]

Options:
  --restaurants=N   Number of restaurants to create (default: 5)
  --cleanup         Clean up existing test data before seeding
  --help            Show this help message

Example:
  npx ts-node scripts/seed-massive-test-docker.ts --restaurants=10 --cleanup
      `);
      process.exit(0);
    }
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  seedMassiveTest(config)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedMassiveTest, MassiveTestConfig, TestResults };

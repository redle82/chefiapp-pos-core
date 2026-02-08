#!/usr/bin/env npx ts-node
/**
 * SEED MASSIVE TEST - ChefIApp
 * 
 * Creates N restaurants with full staff, menu, and tables for load testing.
 * 
 * Usage:
 *   npx ts-node scripts/seed-massive-test.ts --restaurants=5
 *   npx ts-node scripts/seed-massive-test.ts --restaurants=10 --cleanup
 */

import pg from 'pg';

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

async function createTenant(supabase: SupabaseClient, index: number): Promise<string | null> {
  // Try to create tenant, but if table doesn't exist, return null (optional)
  try {
    const tenantData = {
      name: `Test Tenant ${index}`,
      slug: `test-tenant-${index}-${Date.now()}`,
    };

    const { data, error } = await supabase
      .from('saas_tenants')
      .insert(tenantData)
      .select('id')
      .single();

    if (error) {
      // If table doesn't exist, return null - tenant is optional
      if (error.message.includes('not find the table') || error.message.includes('does not exist')) {
        console.log('   ℹ️  saas_tenants table not found, skipping tenant creation');
        return null;
      }
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
    return data.id;
  } catch (e) {
    // Table doesn't exist - tenant is optional in some deployments
    return null;
  }
}

async function createRestaurant(
  supabase: SupabaseClient, 
  tenantId: string | null, 
  index: number
): Promise<{ id: string; name: string }> {
  const restaurantData: Record<string, unknown> = {
    name: `Test Restaurant ${index}`,
    slug: `test-restaurant-${index}-${Date.now()}`,
  };
  
  // Only add tenant_id if it exists
  if (tenantId) {
    restaurantData.tenant_id = tenantId;
  }

  const { data, error } = await supabase
    .from('gm_restaurants')
    .insert(restaurantData)
    .select('id, name')
    .single();

  if (error) throw new Error(`Failed to create restaurant: ${error.message}`);
  return data;
}

async function createStaff(
  supabase: SupabaseClient,
  restaurantId: string,
  config: MassiveTestConfig['staffPerRestaurant']
): Promise<CreatedStaff[]> {
  const staff: CreatedStaff[] = [];
  
  // Try employees table first, fall back to restaurant_members
  const tables = ['employees', 'restaurant_members'];
  
  for (const tableName of tables) {
    try {
      const staffToCreate: Array<{ name: string; role: string; position: string }> = [];

      // Map roles to positions
      const rolePositionMap: Record<string, { role: string; position: string }> = {
        owner: { role: 'owner', position: 'manager' },
        manager: { role: 'manager', position: 'manager' },
        waiter: { role: 'worker', position: 'waiter' },
        kitchen: { role: 'worker', position: 'kitchen' },
        bar: { role: 'worker', position: 'waiter' },
        cleaning: { role: 'worker', position: 'cleaning' },
      };

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

      if (tableName === 'employees') {
        const { data, error } = await supabase
          .from('employees')
          .insert(staffToCreate.map(s => ({
            restaurant_id: restaurantId,
            name: s.name,
            role: s.role,
            position: s.position,
            pin: Math.random().toString().slice(2, 6),
            active: true,
          })))
          .select('id, name, role, position');

        if (error) throw error;
        return data || [];
      } else {
        // restaurant_members has different schema
        const { data, error } = await supabase
          .from('restaurant_members')
          .insert(staffToCreate.map(s => ({
            restaurant_id: restaurantId,
            role: s.role,
            user_id: crypto.randomUUID(), // Generate fake user_id
          })))
          .select('id, role');

        if (error) throw error;
        return (data || []).map((d, i) => ({
          id: d.id,
          name: staffToCreate[i]?.name || `Staff ${i}`,
          role: d.role,
          position: staffToCreate[i]?.position || 'worker',
        }));
      }
    } catch (e) {
      // Try next table
      continue;
    }
  }

  // If no table worked, return empty (staff is optional for testing)
  console.log('   ⚠️  Could not create staff (tables not available), continuing without staff');
  return [];
}

async function createMenu(
  supabase: SupabaseClient,
  restaurantId: string,
  itemsPerCategory: number
): Promise<string[]> {
  const productIds: string[] = [];

  for (const category of MENU_CATEGORIES) {
    // Create category
    const { data: categoryData, error: categoryError } = await supabase
      .from('gm_menu_categories')
      .insert({
        restaurant_id: restaurantId,
        name: category.name,
        sort_order: MENU_CATEGORIES.indexOf(category),
      })
      .select('id')
      .single();

    if (categoryError) {
      console.warn(`Warning: Could not create category ${category.name}: ${categoryError.message}`);
      continue;
    }

    // Create products for this category
    const products = category.items.slice(0, itemsPerCategory).map((itemName, idx) => ({
      restaurant_id: restaurantId,
      category_id: categoryData.id,
      name: itemName,
      description: `Delicioso ${itemName}`,
      price_cents: Math.floor(Math.random() * 2000 + 500), // 5-25 euros
      available: true,
    }));

    const { data: productData, error: productError } = await supabase
      .from('gm_products')
      .insert(products)
      .select('id');

    if (productError) {
      console.warn(`Warning: Could not create products: ${productError.message}`);
      continue;
    }

    productIds.push(...(productData?.map(p => p.id) || []));
  }

  return productIds;
}

async function createTables(
  supabase: SupabaseClient,
  restaurantId: string,
  count: number
): Promise<string[]> {
  const tables = Array.from({ length: count }, (_, i) => ({
    restaurant_id: restaurantId,
    number: i + 1,
    status: 'closed',
    qr_code: `QR-${restaurantId.slice(0, 8)}-${i + 1}`,
  }));

  const { data, error } = await supabase
    .from('gm_tables')
    .insert(tables)
    .select('id');

  if (error) throw new Error(`Failed to create tables: ${error.message}`);
  return data?.map(t => t.id) || [];
}

async function cleanupTestData(supabase: SupabaseClient): Promise<void> {
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
    const { error } = await supabase
      .from(table)
      .delete()
      .like('name', 'Test%')
      .or('name.like.%#%');

    if (error) {
      console.warn(`Warning: Could not cleanup ${table}: ${error.message}`);
    }
  }

  console.log('✅ Cleanup complete');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function seedMassiveTest(config: MassiveTestConfig): Promise<TestResults> {
  const startTime = Date.now();
  const supabase = getSupabaseClient();
  const results: TestResults = {
    restaurants: [],
    totalStaff: 0,
    totalTables: 0,
    totalProducts: 0,
    duration: 0,
    errors: [],
  };

  console.log('🚀 Starting Massive Test Seed');
  console.log(`   Restaurants: ${config.restaurantCount}`);
  console.log(`   Staff per restaurant: ${Object.values(config.staffPerRestaurant).reduce((a, b) => a + b, 0)}`);
  console.log(`   Tables per restaurant: ${config.tablesPerRestaurant}`);
  console.log('');

  if (config.cleanup) {
    await cleanupTestData(supabase);
  }

  for (let i = 1; i <= config.restaurantCount; i++) {
    console.log(`📍 Creating Restaurant ${i}/${config.restaurantCount}...`);

    try {
      // Create tenant
      const tenantId = await createTenant(supabase, i);
      
      // Create restaurant
      const restaurant = await createRestaurant(supabase, tenantId, i);
      
      // Create staff
      const staff = await createStaff(supabase, restaurant.id, config.staffPerRestaurant);
      
      // Create menu
      const products = await createMenu(supabase, restaurant.id, config.menuItemsPerCategory);
      
      // Create tables
      const tables = await createTables(supabase, restaurant.id, config.tablesPerRestaurant);

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
  const outputPath = `${process.cwd()}/test-results/massive-seed-${Date.now()}.json`;
  const fs = await import('fs');
  const path = await import('path');
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 Results saved to: ${outputPath}`);

  return results;
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
Usage: npx ts-node scripts/seed-massive-test.ts [options]

Options:
  --restaurants=N   Number of restaurants to create (default: 5)
  --cleanup         Clean up existing test data before seeding
  --help            Show this help message

Example:
  npx ts-node scripts/seed-massive-test.ts --restaurants=10 --cleanup
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

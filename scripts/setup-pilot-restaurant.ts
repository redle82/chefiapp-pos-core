#!/usr/bin/env npx ts-node
/**
 * SETUP PILOT RESTAURANT - ChefIApp
 *
 * Configura um restaurante piloto realista para teste de 7 dias.
 *
 * Usage:
 *   npx ts-node scripts/setup-pilot-restaurant.ts
 *   npx ts-node scripts/setup-pilot-restaurant.ts --restaurant-name="Restaurante Piloto"
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// CONFIGURATION
// =============================================================================

interface PilotConfig {
  restaurantName: string;
  tables: number;
  menuCategories: Array<{
    name: string;
    items: Array<{ name: string; price_cents: number }>;
  }>;
  staff: Array<{ name: string; role: string; position: string }>;
}

const DEFAULT_PILOT_CONFIG: PilotConfig = {
  restaurantName: "Restaurante Piloto",
  tables: 10, // Restaurante médio
  menuCategories: [
    {
      name: "Entradas",
      items: [
        { name: "Bruschetta", price_cents: 850 },
        { name: "Nachos", price_cents: 1200 },
        { name: "Salada César", price_cents: 1100 },
      ],
    },
    {
      name: "Pratos Principais",
      items: [
        { name: "Hambúrguer Artesanal", price_cents: 1800 },
        { name: "Pizza Margherita", price_cents: 1600 },
        { name: "Risotto de Cogumelos", price_cents: 2200 },
        { name: "Salmão Grelhado", price_cents: 2800 },
        { name: "Pasta Carbonara", price_cents: 1900 },
      ],
    },
    {
      name: "Bebidas",
      items: [
        { name: "Água", price_cents: 200 },
        { name: "Refrigerante", price_cents: 350 },
        { name: "Cerveja", price_cents: 500 },
        { name: "Vinho Tinto (copa)", price_cents: 600 },
      ],
    },
    {
      name: "Sobremesas",
      items: [
        { name: "Tiramisú", price_cents: 800 },
        { name: "Brownie com Sorvete", price_cents: 900 },
        { name: "Mousse de Chocolate", price_cents: 750 },
      ],
    },
  ],
  staff: [
    { name: "Gerente Principal", role: "manager", position: "manager" },
    { name: "Garçom 1", role: "worker", position: "waiter" },
    { name: "Garçom 2", role: "worker", position: "waiter" },
    { name: "Garçom 3", role: "worker", position: "waiter" },
    { name: "Chef de Cozinha", role: "worker", position: "kitchen" },
    { name: "Auxiliar de Cozinha", role: "worker", position: "kitchen" },
  ],
};

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CORE_SERVICE_KEY || "";
  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or CORE_SERVICE_KEY env var",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

async function createPilotRestaurant(
  supabase: SupabaseClient,
  config: PilotConfig,
): Promise<string> {
  console.log(`📍 Criando restaurante: ${config.restaurantName}...`);

  // Create tenant (optional)
  let tenantId: string | null = null;
  try {
    const { data: tenantData, error: tenantError } = await supabase
      .from("saas_tenants")
      .insert({
        name: `${config.restaurantName} Tenant`,
        slug: `${config.restaurantName
          .toLowerCase()
          .replace(/\s+/g, "-")}-${Date.now()}`,
      })
      .select("id")
      .single();

    if (!tenantError && tenantData) {
      tenantId = tenantData.id;
    }
  } catch (e) {
    // Tenant é opcional
  }

  // Create restaurant
  const restaurantData: Record<string, unknown> = {
    name: config.restaurantName,
    slug: `${config.restaurantName
      .toLowerCase()
      .replace(/\s+/g, "-")}-pilot-${Date.now()}`,
  };

  if (tenantId) {
    restaurantData.tenant_id = tenantId;
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("gm_restaurants")
    .insert(restaurantData)
    .select("id, name, slug")
    .single();

  if (restaurantError)
    throw new Error(`Failed to create restaurant: ${restaurantError.message}`);

  console.log(
    `   ✅ Restaurante criado: ${restaurant.name} (${restaurant.id})`,
  );
  return restaurant.id;
}

async function createPilotTables(
  supabase: SupabaseClient,
  restaurantId: string,
  count: number,
): Promise<string[]> {
  console.log(`🪑 Criando ${count} mesas...`);

  const tables = Array.from({ length: count }, (_, i) => ({
    restaurant_id: restaurantId,
    number: i + 1,
    status: "closed",
    qr_code: `QR-PILOT-${restaurantId.slice(0, 8)}-${i + 1}`,
  }));

  const { data, error } = await supabase
    .from("gm_tables")
    .insert(tables)
    .select("id");

  if (error) throw new Error(`Failed to create tables: ${error.message}`);

  console.log(`   ✅ ${data.length} mesas criadas`);
  return data?.map((t) => t.id) || [];
}

async function createPilotMenu(
  supabase: SupabaseClient,
  restaurantId: string,
  categories: PilotConfig["menuCategories"],
): Promise<number> {
  console.log(`🍔 Criando cardápio...`);

  let totalProducts = 0;

  for (const category of categories) {
    // Create category
    const { data: categoryData, error: categoryError } = await supabase
      .from("gm_menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name: category.name,
        sort_order: categories.indexOf(category),
      })
      .select("id")
      .single();

    if (categoryError) {
      console.warn(
        `   ⚠️  Erro ao criar categoria ${category.name}: ${categoryError.message}`,
      );
      continue;
    }

    // Create products
    const products = category.items.map((item) => ({
      restaurant_id: restaurantId,
      category_id: categoryData.id,
      name: item.name,
      description: `Delicioso ${item.name}`,
      price_cents: item.price_cents,
      available: true,
    }));

    const { data: productData, error: productError } = await supabase
      .from("gm_products")
      .insert(products)
      .select("id");

    if (productError) {
      console.warn(
        `   ⚠️  Erro ao criar produtos da categoria ${category.name}: ${productError.message}`,
      );
      continue;
    }

    totalProducts += productData?.length || 0;
    console.log(`   ✅ ${category.name}: ${productData?.length || 0} produtos`);
  }

  console.log(`   ✅ Total: ${totalProducts} produtos criados`);
  return totalProducts;
}

async function createPilotStaff(
  supabase: SupabaseClient,
  restaurantId: string,
  staff: PilotConfig["staff"],
): Promise<number> {
  console.log(`👥 Criando staff...`);

  // Try employees table first
  try {
    const staffData = staff.map((s) => ({
      restaurant_id: restaurantId,
      name: s.name,
      role: s.role,
      position: s.position,
      pin: Math.random().toString().slice(2, 6),
      active: true,
    }));

    const { data, error } = await supabase
      .from("employees")
      .insert(staffData)
      .select("id");

    if (error) throw error;

    console.log(`   ✅ ${data.length} funcionários criados`);
    return data.length;
  } catch (e) {
    console.warn(`   ⚠️  Não foi possível criar staff (tabela não disponível)`);
    return 0;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function setupPilotRestaurant(
  config: PilotConfig = DEFAULT_PILOT_CONFIG,
): Promise<void> {
  const supabase = getSupabaseClient();

  console.log("🚀 Configurando Restaurante Piloto");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`   Nome: ${config.restaurantName}`);
  console.log(`   Mesas: ${config.tables}`);
  console.log(`   Categorias: ${config.menuCategories.length}`);
  console.log(`   Staff: ${config.staff.length}`);
  console.log("");

  try {
    // 1. Create restaurant
    const restaurantId = await createPilotRestaurant(supabase, config);

    // 2. Create tables
    await createPilotTables(supabase, restaurantId, config.tables);

    // 3. Create menu
    await createPilotMenu(supabase, restaurantId, config.menuCategories);

    // 4. Create staff
    await createPilotStaff(supabase, restaurantId, config.staff);

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✅ RESTAURANTE PILOTO CONFIGURADO");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`   Restaurant ID: ${restaurantId}`);
    console.log(`   Nome: ${config.restaurantName}`);
    console.log("");
    console.log("📝 PRÓXIMOS PASSOS:");
    console.log("   1. Configure o restaurante no Merchant Portal");
    console.log("   2. Treine 1 gerente e 2-3 garçons no uso básico");
    console.log("   3. Instale TPV em 1 tablet/computador");
    console.log("   4. Instale KDS em 1 tablet/TV da cozinha");
    console.log("   5. Inicie o piloto de 7 dias");
    console.log("═══════════════════════════════════════════════════════════");

    // Save restaurant ID to file for easy access
    const fs = await import("fs");
    const path = await import("path");
    const outputPath = `${process.cwd()}/test-results/pilot-restaurant-${Date.now()}.json`;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          restaurantId,
          restaurantName: config.restaurantName,
          tables: config.tables,
          staffCount: config.staff.length,
          menuCategories: config.menuCategories.length,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log(`📄 Configuração salva em: ${outputPath}`);
  } catch (error) {
    console.error("❌ Erro ao configurar restaurante piloto:", error);
    throw error;
  }
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): PilotConfig {
  const config = { ...DEFAULT_PILOT_CONFIG };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--restaurant-name=")) {
      config.restaurantName = arg.split("=")[1];
    } else if (arg === "--help") {
      console.log(`
Usage: npx ts-node scripts/setup-pilot-restaurant.ts [options]

Options:
  --restaurant-name=NAME   Nome do restaurante piloto (default: "Restaurante Piloto")
  --help                   Show this help message

Example:
  npx ts-node scripts/setup-pilot-restaurant.ts --restaurant-name="Bistrô Teste"
      `);
      process.exit(0);
    }
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  setupPilotRestaurant(config)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { PilotConfig, setupPilotRestaurant };

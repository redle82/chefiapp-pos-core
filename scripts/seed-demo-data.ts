import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_TENANT = {
  name: "Demo Grill Tenant",
  slug: "demo-grill-tenant",
};
const DEMO_RESTAURANT = {
  name: "Demo Grill",
  slug: "demo-grill",
  description: "Flavor of the Void.",
};
const DEMO_CATEGORIES = [
  { name: "Burgers", sort_order: 1 },
  { name: "Drinks", sort_order: 2 },
];
const DEMO_PRODUCTS = [
  {
    name: "Void Burger",
    description: "Simply empty.",
    price_cents: 1000,
    category: "Burgers",
  },
  {
    name: "Sovereign Cheese",
    description: "Royal cheese.",
    price_cents: 1500,
    category: "Burgers",
  },
  { name: "Water", description: "", price_cents: 500, category: "Drinks" },
];
const DEMO_TABLES = [1, 2, 3, 4, 5];
const DEMO_STAFF = [
  { name: "Demo Owner", role: "owner", position: "manager" },
  { name: "Demo Manager", role: "manager", position: "manager" },
  { name: "Demo Waiter", role: "worker", position: "waiter" },
  { name: "Demo Kitchen", role: "worker", position: "kitchen" },
];

async function upsertTenant() {
  const { data, error } = await supabase
    .from("saas_tenants")
    .upsert({ ...DEMO_TENANT }, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertRestaurant(tenantId: string) {
  const { data, error } = await supabase
    .from("gm_restaurants")
    .upsert(
      { ...DEMO_RESTAURANT, tenant_id: tenantId, owner_id: tenantId },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertCategories(restaurantId: string) {
  const catMap: Record<string, any> = {};
  for (const cat of DEMO_CATEGORIES) {
    const { data, error } = await supabase
      .from("gm_menu_categories")
      .upsert(
        { ...cat, restaurant_id: restaurantId },
        { onConflict: "restaurant_id,name" },
      )
      .select()
      .single();
    if (error) throw error;
    catMap[cat.name] = data;
  }
  return catMap;
}

async function upsertProducts(
  restaurantId: string,
  catMap: Record<string, any>,
) {
  for (const prod of DEMO_PRODUCTS) {
    const { error } = await supabase.from("gm_products").upsert(
      {
        restaurant_id: restaurantId,
        category_id: catMap[prod.category].id,
        name: prod.name,
        description: prod.description,
        price_cents: prod.price_cents,
        available: true,
      },
      { onConflict: "restaurant_id,name" },
    );
    if (error) throw error;
  }
}

async function upsertTables(restaurantId: string) {
  for (const num of DEMO_TABLES) {
    const { error } = await supabase.from("gm_tables").upsert(
      {
        restaurant_id: restaurantId,
        number: num.toString(),
        name: `Mesa ${num}`,
        capacity: 4,
        x: num * 10,
        y: num * 10,
      },
      { onConflict: "restaurant_id,number" },
    );
    if (error) throw error;
  }
}

async function upsertStaff(restaurantId: string) {
  for (const staff of DEMO_STAFF) {
    const { error } = await supabase.from("employees").upsert(
      {
        restaurant_id: restaurantId,
        name: staff.name,
        role: staff.role,
        position: staff.position,
        pin: Math.random().toString().slice(2, 6),
        active: true,
      },
      { onConflict: "restaurant_id,name" },
    );
    if (error) throw error;
  }
}

async function main() {
  try {
    console.log("🌱 Seeding unified demo data...");
    const tenant = await upsertTenant();
    console.log("🏢 Tenant:", tenant.name);
    const restaurant = await upsertRestaurant(tenant.id);
    console.log("🍽️  Restaurant:", restaurant.name);
    const catMap = await upsertCategories(restaurant.id);
    console.log("📂 Categories:", Object.keys(catMap).join(", "));
    await upsertProducts(restaurant.id, catMap);
    console.log("🍔 Products seeded");
    await upsertTables(restaurant.id);
    console.log("🪑 Tables seeded");
    await upsertStaff(restaurant.id);
    console.log("👥 Staff seeded");
    console.log("✅ Demo data seed complete!");
    console.log(
      `🌍 Demo URL: http://localhost:5175/public/${DEMO_RESTAURANT.slug}`,
    );
  } catch (err) {
    console.error("❌ Error seeding demo data:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

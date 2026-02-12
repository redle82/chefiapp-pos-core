// LEGACY / LAB — blocked in Docker mode
// @ts-expect-error LEGACY: Deno script, not compiled by tsc
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

// Run with: deno run --allow-net --allow-env verify_recipe_deduction.ts

// Configuration
const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || "https://qonfbtwsxeggxbkhqnxl.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // MUST be Service Role for admin access

if (!SUPABASE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is required");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log("🧪 Starting Recipe Deduction Verification...");

  // 1. Setup: Create Inventory Item, Recipe, and Menu Item if not exists
  // For simplicity, we assume we have a Restaurant ID.
  // We'll pick the first restaurant found.
  const { data: restaurants } = await supabase
    .from("gm_restaurants")
    .select("id")
    .limit(1);
  if (!restaurants || restaurants.length === 0) {
    console.error("❌ No restaurants found.");
    return;
  }
  const restaurantId = restaurants[0].id;
  console.log(`🏢 Using Restaurant: ${restaurantId}`);

  // Create Inventory Item
  const invItemId = crypto.randomUUID();
  const initialStock = 100;
  const { error: invError } = await supabase.from("gm_inventory_items").insert({
    id: invItemId,
    restaurant_id: restaurantId,
    name: "Test Ingredient " + Date.now(),
    stock_quantity: initialStock,
    unit: "kg",
    cost_per_unit: 10,
  });
  if (invError) throw invError;
  console.log(
    `📦 Created Inventory Item: ${invItemId} (Stock: ${initialStock})`,
  );

  // Create Menu Item
  const menuItemId = crypto.randomUUID();
  const { error: menuError } = await supabase.from("gm_products").insert({
    id: menuItemId,
    restaurant_id: restaurantId,
    name: "Test Burger " + Date.now(),
    price_cents: 1000,
    available: true,
    category: null,
  });
  if (menuError) throw menuError;
  console.log(`🍔 Created Menu Item: ${menuItemId}`);

  // Create Recipe (1 Burger = 2 units of Ingredient)
  const deductionAmount = 2;
  const { error: recipeError } = await supabase.from("gm_recipes").insert({
    menu_item_id: menuItemId,
    inventory_item_id: invItemId,
    quantity: deductionAmount,
  });
  if (recipeError) throw recipeError;
  console.log(`📜 Created Recipe: Consumes ${deductionAmount} units`);

  // 2. Simulate Sale (Order + Payment)
  const orderId = crypto.randomUUID();
  const { error: orderError } = await supabase.from("gm_orders").insert({
    id: orderId,
    restaurant_id: restaurantId,
    status: "OPEN",
    total_amount_cents: 1000,
  });
  if (orderError) throw orderError;

  const { error: itemError } = await supabase.from("gm_order_items").insert({
    order_id: orderId,
    product_id: menuItemId,
    product_name: "Test Burger", // Snapshot
    quantity: 1,
    unit_price: 1000,
    total_price: 1000,
  });
  if (itemError) throw itemError;
  console.log(`🛒 Created Order: ${orderId}`);

  // 3. Trigger Deduction RPC (Simulating PaymentEngine call)
  console.log("⚡ Triggering process_inventory_deduction RPC...");
  const { error: rpcError } = await supabase.rpc(
    "process_inventory_deduction",
    {
      p_order_id: orderId,
    },
  );
  if (rpcError) throw rpcError;
  console.log("✅ RPC executed successfully.");

  // 4. Verify Stock
  const { data: finalItem } = await supabase
    .from("gm_inventory_items")
    .select("stock_quantity")
    .eq("id", invItemId)
    .single();

  if (!finalItem) throw new Error("Failed to fetch final item state");

  const expectedStock = initialStock - deductionAmount;
  console.log(
    `🔍 Final Stock: ${finalItem.stock_quantity} (Expected: ${expectedStock})`,
  );

  if (Number(finalItem.stock_quantity) === expectedStock) {
    console.log("✅ SUCCESS: Stock deducted correctly.");
  } else {
    console.error("❌ FAILURE: Stock mismatch.");
  }

  // Cleanup (Optional) - deleting test data
  // await supabase.from('gm_products').delete().eq('id', menuItemId);
  // await supabase.from('gm_inventory_items').delete().eq('id', invItemId);
}

runTest().catch(console.error);

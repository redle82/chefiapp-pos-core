#!/usr/bin/env npx ts-node
/**
 * TEST SINGLE ORDER - Quick diagnostic
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

async function test() {
  // Get first test restaurant
  const { data: restaurants } = await supabase
    .from('gm_restaurants')
    .select('id, name')
    .like('name', 'Test Restaurant%')
    .limit(1);

  if (!restaurants || restaurants.length === 0) {
    console.error('❌ No test restaurants found');
    return;
  }

  const restaurant = restaurants[0];
  console.log(`📍 Using restaurant: ${restaurant.name} (${restaurant.id})`);

  // Get products
  const { data: products } = await supabase
    .from('gm_products')
    .select('id, name, price_cents')
    .eq('restaurant_id', restaurant.id)
    .limit(1);

  if (!products || products.length === 0) {
    console.error('❌ No products found');
    return;
  }

  const product = products[0];
  console.log(`🍔 Using product: ${product.name} (€${product.price_cents / 100})`);

  // Get tables
  const { data: tables } = await supabase
    .from('gm_tables')
    .select('id, number')
    .eq('restaurant_id', restaurant.id)
    .limit(1);

  if (!tables || tables.length === 0) {
    console.error('❌ No tables found');
    return;
  }

  const table = tables[0];
  console.log(`🪑 Using table: ${table.number} (${table.id})`);

  // Try to create order
  console.log('\n🔸 Creating order...');
  const { data: order, error: orderError } = await supabase
    .from('gm_orders')
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      table_number: table.number,
      status: 'OPEN',
      payment_status: 'PENDING',
      total_cents: product.price_cents,
      subtotal_cents: product.price_cents,
      source: 'test_single',
    })
    .select('id')
    .single();

  if (orderError) {
    console.error('❌ Order creation failed:');
    console.error('   Code:', orderError.code);
    console.error('   Message:', orderError.message);
    console.error('   Details:', orderError.details);
    console.error('   Hint:', orderError.hint);
    return;
  }

  console.log(`✅ Order created: ${order.id}`);

  // Try to create order item
  console.log('\n🔸 Creating order item...');
  const { error: itemError } = await supabase
    .from('gm_order_items')
    .insert({
      order_id: order.id,
      product_id: product.id,
      name_snapshot: product.name,
      price_snapshot: product.price_cents,
      quantity: 1,
      subtotal_cents: product.price_cents,
    });

  if (itemError) {
    console.error('❌ Order item creation failed:');
    console.error('   Code:', itemError.code);
    console.error('   Message:', itemError.message);
    console.error('   Details:', itemError.details);
    console.error('   Hint:', itemError.hint);
    
    // Cleanup
    await supabase.from('gm_orders').delete().eq('id', order.id);
    return;
  }

  console.log('✅ Order item created');
  console.log('\n✅ SUCCESS - Order and item created successfully!');

  // Cleanup
  await supabase.from('gm_orders').delete().eq('id', order.id);
  console.log('🧹 Cleaned up test order');
}

test().catch(console.error);

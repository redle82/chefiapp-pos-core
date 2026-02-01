#!/usr/bin/env npx ts-node
/**
 * DIAGNOSE TEST ENVIRONMENT - ChefIApp
 * 
 * Diagnoses why tests are failing by checking:
 * - RLS policies
 * - Schema completeness
 * - Missing tables/columns
 * - Auth configuration
 * 
 * Usage:
 *   npx ts-node scripts/diagnose-test-environment.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}

// =============================================================================
// DIAGNOSTICS
// =============================================================================

interface DiagnosticResult {
  check: string;
  status: '✅ PASS' | '⚠️ WARN' | '❌ FAIL';
  message: string;
  details?: string;
}

async function checkRLSStatus(supabase: SupabaseClient): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  // Check if RLS is enabled on critical tables
  const criticalTables = ['gm_orders', 'gm_order_items', 'gm_restaurants', 'gm_products', 'gm_tables'];
  
  for (const table of criticalTables) {
    try {
      // Try to insert a test record (will fail if RLS blocks)
      const testData: Record<string, unknown> = {
        restaurant_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
      };
      
      if (table === 'gm_orders') {
        testData.status = 'pending';
        testData.total_cents = 0;
      }
      
      const { error } = await supabase
        .from(table)
        .insert(testData)
        .select();
      
      if (error) {
        // Check if it's an RLS error
        if (error.message.includes('new row violates row-level security') || 
            error.message.includes('RLS') ||
            error.code === '42501') {
          results.push({
            check: `RLS on ${table}`,
            status: '⚠️ WARN',
            message: `RLS is ACTIVE and blocking inserts`,
            details: `This will block test scripts using service_role_key without proper auth context. Error: ${error.message}`
          });
        } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          results.push({
            check: `RLS on ${table}`,
            status: '✅ PASS',
            message: `RLS may be active but test insert failed due to constraint (expected)`,
            details: error.message
          });
        } else {
          results.push({
            check: `RLS on ${table}`,
            status: '❌ FAIL',
            message: `Unexpected error: ${error.message}`,
            details: error.code
          });
        }
      } else {
        results.push({
          check: `RLS on ${table}`,
          status: '⚠️ WARN',
          message: `RLS may be DISABLED or bypassed by service_role`,
          details: 'Test insert succeeded - RLS might not be enforcing properly'
        });
      }
    } catch (e) {
      results.push({
        check: `RLS on ${table}`,
        status: '❌ FAIL',
        message: `Exception checking RLS: ${e instanceof Error ? e.message : String(e)}`
      });
    }
  }
  
  return results;
}

async function checkSchemaCompleteness(supabase: SupabaseClient): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  // Check required tables exist
  const requiredTables = [
    'gm_restaurants',
    'gm_products',
    'gm_tables',
    'gm_orders',
    'gm_order_items',
  ];
  
  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        results.push({
          check: `Table ${table}`,
          status: '❌ FAIL',
          message: `Table does not exist`,
          details: error.message
        });
      } else {
        results.push({
          check: `Table ${table}`,
          status: '⚠️ WARN',
          message: `Table exists but query failed`,
          details: error.message
        });
      }
    } else {
      results.push({
        check: `Table ${table}`,
        status: '✅ PASS',
        message: `Table exists and is accessible`
      });
    }
  }
  
  return results;
}

async function checkTestData(supabase: SupabaseClient): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  // Check for test restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('gm_restaurants')
    .select('id, name')
    .like('name', 'Test Restaurant%')
    .limit(5);
  
  if (restaurantsError) {
    results.push({
      check: 'Test Restaurants',
      status: '❌ FAIL',
      message: `Cannot query test restaurants: ${restaurantsError.message}`
    });
  } else {
    results.push({
      check: 'Test Restaurants',
      status: restaurants && restaurants.length > 0 ? '✅ PASS' : '⚠️ WARN',
      message: restaurants && restaurants.length > 0 
        ? `Found ${restaurants.length} test restaurants`
        : 'No test restaurants found. Run seed-massive-test.ts first.',
      details: restaurants?.map(r => r.name).join(', ')
    });
  }
  
  // Check for test products
  if (restaurants && restaurants.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from('gm_products')
      .select('id')
      .eq('restaurant_id', restaurants[0].id)
      .limit(1);
    
    results.push({
      check: 'Test Products',
      status: products && products.length > 0 ? '✅ PASS' : '⚠️ WARN',
      message: products && products.length > 0
        ? 'Products exist for test restaurants'
        : 'No products found for test restaurants',
      details: productsError?.message
    });
  }
  
  return results;
}

async function checkAuthConfiguration(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  results.push({
    check: 'Supabase URL',
    status: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost') ? '✅ PASS' : '⚠️ WARN',
    message: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
      ? 'Using local Supabase'
      : 'Using cloud Supabase - tests may fail if RLS is active',
    details: supabaseUrl
  });
  
  results.push({
    check: 'Service Role Key',
    status: serviceRoleKey ? '✅ PASS' : '❌ FAIL',
    message: serviceRoleKey 
      ? 'Service role key is set'
      : 'Service role key is missing - RLS will block all operations',
    details: serviceRoleKey ? 'Key present (hidden)' : 'Not set'
  });
  
  return results;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🔍 Diagnosing Test Environment...\n');
  
  const supabase = getSupabaseClient();
  const allResults: DiagnosticResult[] = [];
  
  // Run all diagnostics
  console.log('1️⃣ Checking Auth Configuration...');
  allResults.push(...await checkAuthConfiguration());
  
  console.log('2️⃣ Checking Schema Completeness...');
  allResults.push(...await checkSchemaCompleteness(supabase));
  
  console.log('3️⃣ Checking RLS Status...');
  allResults.push(...await checkRLSStatus(supabase));
  
  console.log('4️⃣ Checking Test Data...');
  allResults.push(...await checkTestData(supabase));
  
  // Print results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  allResults.forEach(result => {
    console.log(`${result.status} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log('');
  });
  
  // Summary
  const passed = allResults.filter(r => r.status === '✅ PASS').length;
  const warnings = allResults.filter(r => r.status === '⚠️ WARN').length;
  const failed = allResults.filter(r => r.status === '❌ FAIL').length;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Recommendations
  const rlsWarnings = allResults.filter(r => r.check.includes('RLS') && r.status === '⚠️ WARN');
  if (rlsWarnings.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    console.log('');
    console.log('   RLS is blocking test inserts. Solutions:');
    console.log('');
    console.log('   1. Temporarily disable RLS for testing:');
    console.log('      npx ts-node scripts/disable-rls-for-tests.ts');
    console.log('');
    console.log('   2. Use service_role_key with bypass (already using)');
    console.log('      But ensure RLS policies allow service_role');
    console.log('');
    console.log('   3. Create test user and authenticate:');
    console.log('      npx ts-node scripts/create-test-user.ts');
    console.log('');
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { main as diagnoseTestEnvironment };

#!/usr/bin/env ts-node
/**
 * Stripe Products & Prices Setup
 * 
 * Este script cria todos os Products e Prices definidos em PRICING_PLANS.md
 * 
 * EXECUÇÃO:
 * export STRIPE_SECRET_KEY=sk_test_xxx
 * npx ts-node tests/setup-stripe-products.ts
 * 
 * IMPORTANTE: 
 * - Rodar PRIMEIRO em sandbox (sk_test_*)
 * - Depois de validar, rodar em produção (sk_live_*)
 */

import Stripe from 'stripe';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não definida');
  process.exit(1);
}

const isProduction = STRIPE_SECRET_KEY.startsWith('sk_live_');
const stripe = new Stripe(STRIPE_SECRET_KEY);

console.log(`\n🔑 Mode: ${isProduction ? '🔴 PRODUCTION' : '🟢 SANDBOX'}\n`);

if (isProduction) {
  console.log('⚠️  ATENÇÃO: Você está em modo PRODUÇÃO!');
  console.log('   Os products criados serão REAIS.\n');
}

// ============================================================================
// PRODUCT DEFINITIONS (from PRICING_PLANS.md)
// ============================================================================

interface ProductDef {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: PriceDef[];
}

interface PriceDef {
  nickname: string;
  unit_amount: number; // cents
  currency: 'eur';
  recurring?: {
    interval: 'month' | 'year';
  };
  metadata: Record<string, string>;
}

const PRODUCTS: ProductDef[] = [
  // =========================================================================
  // RESTAURANT PLANS
  // =========================================================================
  {
    id: 'chefiapp_restaurant_starter',
    name: 'ChefIApp Starter',
    description: 'Para pequenos cafés, snack-bars, food trucks. 1 terminal, até 20 mesas.',
    metadata: {
      business_type: 'RESTAURANT',
      tier: 'starter',
      max_terminals: '1',
      max_tables: '20',
    },
    prices: [
      {
        nickname: 'Starter Mensal',
        unit_amount: 2900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
      {
        nickname: 'Starter Anual',
        unit_amount: 29000, // ~17% discount
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { billing_period: 'yearly' },
      },
    ],
  },
  {
    id: 'chefiapp_restaurant_professional',
    name: 'ChefIApp Professional',
    description: 'Para restaurantes médios, pizzarias, bares. 3 terminais, até 50 mesas.',
    metadata: {
      business_type: 'RESTAURANT',
      tier: 'professional',
      max_terminals: '3',
      max_tables: '50',
    },
    prices: [
      {
        nickname: 'Professional Mensal',
        unit_amount: 5900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
      {
        nickname: 'Professional Anual',
        unit_amount: 59000,
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { billing_period: 'yearly' },
      },
    ],
  },
  {
    id: 'chefiapp_restaurant_enterprise',
    name: 'ChefIApp Enterprise',
    description: 'Para grandes restaurantes, grupos, franchises. Terminais ilimitados.',
    metadata: {
      business_type: 'RESTAURANT',
      tier: 'enterprise',
      max_terminals: '-1',
      max_tables: '-1',
    },
    prices: [
      {
        nickname: 'Enterprise Mensal',
        unit_amount: 14900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
      {
        nickname: 'Enterprise Anual',
        unit_amount: 149000,
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { billing_period: 'yearly' },
      },
    ],
  },

  // =========================================================================
  // HOTEL PLANS
  // =========================================================================
  {
    id: 'chefiapp_hotel_professional',
    name: 'ChefIApp Hotel Pro',
    description: 'Para pequenos hotéis, pousadas, guest houses. 5 terminais, 2 outlets.',
    metadata: {
      business_type: 'HOTEL',
      tier: 'professional',
      max_terminals: '5',
      max_outlets: '2',
    },
    prices: [
      {
        nickname: 'Hotel Pro Mensal',
        unit_amount: 9900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
      {
        nickname: 'Hotel Pro Anual',
        unit_amount: 99000,
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { billing_period: 'yearly' },
      },
    ],
  },
  {
    id: 'chefiapp_hotel_enterprise',
    name: 'ChefIApp Hotel Enterprise',
    description: 'Para hotéis 4-5 estrelas, resorts, grupos hoteleiros. Ilimitado.',
    metadata: {
      business_type: 'HOTEL',
      tier: 'enterprise',
      max_terminals: '-1',
      max_outlets: '-1',
    },
    prices: [
      {
        nickname: 'Hotel Enterprise Mensal',
        unit_amount: 24900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
      {
        nickname: 'Hotel Enterprise Anual',
        unit_amount: 249000,
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { billing_period: 'yearly' },
      },
    ],
  },

  // =========================================================================
  // ADD-ONS
  // =========================================================================
  {
    id: 'chefiapp_addon_reservations',
    name: 'ChefIApp Reservas',
    description: 'Sistema completo de reservas online',
    metadata: {
      type: 'addon',
      addon_type: 'RESERVATIONS',
    },
    prices: [
      {
        nickname: 'Reservas Mensal',
        unit_amount: 1900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_webpage',
    name: 'ChefIApp Web Page',
    description: 'Página web com menu digital',
    metadata: {
      type: 'addon',
      addon_type: 'WEB_PAGE',
    },
    prices: [
      {
        nickname: 'Web Page Mensal',
        unit_amount: 900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_terminal',
    name: 'ChefIApp Terminal Extra',
    description: 'Terminal adicional (por unidade)',
    metadata: {
      type: 'addon',
      addon_type: 'EXTRA_TERMINAL',
      metered: 'true',
    },
    prices: [
      {
        nickname: 'Terminal Extra Mensal',
        unit_amount: 1500,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_multivenue',
    name: 'ChefIApp Multi-venue',
    description: 'Gestão centralizada de múltiplos locais',
    metadata: {
      type: 'addon',
      addon_type: 'MULTI_LOCATION',
    },
    prices: [
      {
        nickname: 'Multi-venue Mensal',
        unit_amount: 4900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_whitelabel',
    name: 'ChefIApp White-label',
    description: 'Branding personalizado, remove "powered by ChefIApp"',
    metadata: {
      type: 'addon',
      addon_type: 'WHITE_LABEL',
    },
    prices: [
      {
        nickname: 'White-label Mensal',
        unit_amount: 9900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_analytics',
    name: 'ChefIApp Analytics Pro',
    description: 'Dashboards avançados, previsões ML',
    metadata: {
      type: 'addon',
      addon_type: 'ANALYTICS_PRO',
    },
    prices: [
      {
        nickname: 'Analytics Pro Mensal',
        unit_amount: 2900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
  {
    id: 'chefiapp_addon_integrations',
    name: 'ChefIApp Integrações Premium',
    description: 'Contabilidade (PHC, Sage, SAP)',
    metadata: {
      type: 'addon',
      addon_type: 'INTEGRATIONS_PREMIUM',
    },
    prices: [
      {
        nickname: 'Integrações Premium Mensal',
        unit_amount: 3900,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { billing_period: 'monthly' },
      },
    ],
  },
];

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

interface CreatedProduct {
  product: Stripe.Product;
  prices: Stripe.Price[];
}

async function findOrCreateProduct(def: ProductDef): Promise<CreatedProduct> {
  console.log(`\n📦 Product: ${def.name}`);
  
  // Search for existing product by metadata
  const existing = await stripe.products.search({
    query: `metadata['chefiapp_id']:'${def.id}'`,
  });
  
  let product: Stripe.Product;
  
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log(`   ✓ Found existing: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
      metadata: {
        ...def.metadata,
        chefiapp_id: def.id,
        created_by: 'setup-stripe-products',
      },
    });
    console.log(`   ✓ Created: ${product.id}`);
  }
  
  // Create prices
  const prices: Stripe.Price[] = [];
  
  for (const priceDef of def.prices) {
    // Check if price exists
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });
    
    const existingPrice = existingPrices.data.find(
      (p) => p.unit_amount === priceDef.unit_amount && 
             p.recurring?.interval === priceDef.recurring?.interval
    );
    
    if (existingPrice) {
      console.log(`   💰 Price exists: ${priceDef.nickname} (${existingPrice.id})`);
      prices.push(existingPrice);
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        nickname: priceDef.nickname,
        unit_amount: priceDef.unit_amount,
        currency: priceDef.currency,
        recurring: priceDef.recurring,
        metadata: {
          ...priceDef.metadata,
          chefiapp_product: def.id,
        },
      });
      console.log(`   💰 Created price: ${priceDef.nickname} (${price.id})`);
      prices.push(price);
    }
  }
  
  return { product, prices };
}

// ============================================================================
// OUTPUT
// ============================================================================

function generatePriceMap(results: CreatedProduct[]): void {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PRICE MAP (para usar no código)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('export const STRIPE_PRICE_MAP = {');
  
  for (const result of results) {
    const productId = result.product.metadata.chefiapp_id;
    console.log(`  // ${result.product.name}`);
    
    for (const price of result.prices) {
      const interval = price.recurring?.interval || 'one_time';
      const key = `${productId}_${interval}`;
      console.log(`  '${key}': '${price.id}',`);
    }
  }
  
  console.log('} as const;\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ChefIApp — Stripe Products Setup');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const results: CreatedProduct[] = [];
  
  for (const productDef of PRODUCTS) {
    try {
      const result = await findOrCreateProduct(productDef);
      results.push(result);
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  // Generate price map
  generatePriceMap(results);
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`  📦 Products: ${results.length}`);
  console.log(`  💰 Prices: ${results.reduce((sum, r) => sum + r.prices.length, 0)}`);
  console.log(`  🔑 Mode: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
  
  console.log('\n  ✅ Setup completo!\n');
  
  if (!isProduction) {
    console.log('  Próximo passo: Rodar audit-billing-sandbox.ts');
    console.log('  npx ts-node tests/audit-billing-sandbox.ts\n');
  }
}

main().catch(console.error);

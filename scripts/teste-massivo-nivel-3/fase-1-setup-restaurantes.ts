/**
 * FASE 1 - SETUP MASSIVO
 * 
 * Cria 4 restaurantes completos:
 * - Alpha (bar pequeno) - 5 mesas
 * - Beta (restaurante médio) - 10 mesas
 * - Gamma (bar + cozinha) - 15 mesas
 * - Delta (operação grande) - 30 mesas
 * 
 * Cada restaurante com:
 * - Locais (Cozinha, Bar, Estoque, Câmara)
 * - Equipamentos (Geladeira, Freezer, Chapa, etc.)
 * - Ingredientes (Carne, Pão, Queijo, Limão, Gelo, Cerveja, Água)
 * - Estoque inicial (valores variados, alguns próximos do mínimo)
 * - Menu (12 produtos, BAR e KITCHEN, tempos variados, BOM completo)
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext, RestaurantData } from './types';
import type { TestLogger } from './types';

export const fase1SetupRestaurantes: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 1 — SETUP MASSIVO');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  const restaurants = [
    { name: 'Alpha', slug: 'alpha', type: 'bar pequeno', tables: 5 },
    { name: 'Beta', slug: 'beta', type: 'restaurante médio', tables: 10 },
    { name: 'Gamma', slug: 'gamma', type: 'bar + cozinha', tables: 15 },
    { name: 'Delta', slug: 'delta', type: 'operação grande', tables: 30 },
  ];

  try {
    // Criar tenant padrão se não existir
    let tenantId = '00000000-0000-0000-0000-000000000001';
    const tenantCheck = await pool.query(`
      SELECT id FROM public.saas_tenants WHERE id = $1
    `, [tenantId]);
    
    if (tenantCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.saas_tenants (id, name, slug)
        VALUES ($1, 'Tenant Teste', 'tenant-teste')
      `, [tenantId]);
      logger.log('✅ Tenant criado');
    }

    // Criar cada restaurante
    for (const rest of restaurants) {
      logger.log(`\n📦 Criando restaurante: ${rest.name} (${rest.type})...`);
      
      const restaurantId = uuidv4();
      await pool.query(`
        INSERT INTO public.gm_restaurants (id, tenant_id, name, slug)
        VALUES ($1, $2, $3, $4)
      `, [restaurantId, tenantId, rest.name, rest.slug]);

      const restaurantData: RestaurantData = {
        id: restaurantId,
        name: rest.name,
        slug: rest.slug,
        tenant_id: tenantId,
        tables: [],
        locations: [],
        equipment: [],
        ingredients: [],
        products: [],
        stockLevels: [],
      };

      // Criar mesas
      for (let i = 1; i <= rest.tables; i++) {
        const tableId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_tables (id, restaurant_id, number, status)
          VALUES ($1, $2, $3, 'free')
        `, [tableId, restaurantId, i]);
        restaurantData.tables.push({ id: tableId, number: i, restaurant_id: restaurantId });
      }
      logger.log(`  ✅ ${rest.tables} mesas criadas`);

      // Criar locais
      const locationKinds = [
        { name: 'Cozinha Principal', kind: 'KITCHEN' },
        { name: 'Bar', kind: 'BAR' },
        { name: 'Estoque Seco', kind: 'STORAGE' },
        { name: 'Câmara Fria', kind: 'STORAGE' },
      ];
      
      for (const loc of locationKinds) {
        const locationId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_locations (id, restaurant_id, name, kind)
          VALUES ($1, $2, $3, $4)
        `, [locationId, restaurantId, loc.name, loc.kind]);
        restaurantData.locations.push({
          id: locationId,
          name: loc.name,
          kind: loc.kind as any,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.locations.length} locais criados`);

      // Criar equipamentos
      const equipmentList = [
        { name: 'Geladeira 1', kind: 'FRIDGE', location: 'KITCHEN' },
        { name: 'Freezer 1', kind: 'FREEZER', location: 'KITCHEN' },
        { name: 'Chapa', kind: 'PLANCHA', location: 'KITCHEN', capacity: '4 burgers simultâneos' },
        { name: 'Chopeira', kind: 'KEG_SYSTEM', location: 'BAR' },
        { name: 'Máquina de Gelo', kind: 'ICE_MACHINE', location: 'BAR' },
      ];
      
      for (const eq of equipmentList) {
        const equipmentId = uuidv4();
        const location = restaurantData.locations.find(l => l.kind === eq.location);
        await pool.query(`
          INSERT INTO public.gm_equipment (id, restaurant_id, location_id, name, kind, capacity_note, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `, [equipmentId, restaurantId, location?.id || null, eq.name, eq.kind, (eq as any).capacity || null]);
        restaurantData.equipment.push({
          id: equipmentId,
          name: eq.name,
          kind: eq.kind,
          location_id: location?.id,
          capacity_note: (eq as any).capacity,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.equipment.length} equipamentos criados`);

      // Criar ingredientes
      const ingredientList = [
        { name: 'Carne', unit: 'g' },
        { name: 'Pão', unit: 'unit' },
        { name: 'Queijo', unit: 'g' },
        { name: 'Limão', unit: 'unit' },
        { name: 'Gelo', unit: 'g' },
        { name: 'Cerveja', unit: 'ml' },
        { name: 'Água', unit: 'ml' },
      ];
      
      for (const ing of ingredientList) {
        const ingredientId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_ingredients (id, restaurant_id, name, unit)
          VALUES ($1, $2, $3, $4)
        `, [ingredientId, restaurantId, ing.name, ing.unit]);
        restaurantData.ingredients.push({
          id: ingredientId,
          name: ing.name,
          unit: ing.unit as any,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.ingredients.length} ingredientes criados`);

      // Criar estoque inicial (valores variados por restaurante)
      const kitchenLocation = restaurantData.locations.find(l => l.kind === 'KITCHEN')!;
      const barLocation = restaurantData.locations.find(l => l.kind === 'BAR')!;
      
      const stockConfig = [
        { ingredient: 'Carne', qty: rest.name === 'Alpha' ? 1000 : 5000, min: 1000, location: kitchenLocation.id },
        { ingredient: 'Pão', qty: rest.name === 'Beta' ? 8 : 50, min: 10, location: kitchenLocation.id },
        { ingredient: 'Queijo', qty: 2000, min: 500, location: kitchenLocation.id },
        { ingredient: 'Limão', qty: rest.name === 'Gamma' ? 5 : 20, min: 10, location: barLocation.id },
        { ingredient: 'Gelo', qty: 5000, min: 2000, location: barLocation.id },
        { ingredient: 'Cerveja', qty: 10000, min: 5000, location: barLocation.id },
        { ingredient: 'Água', qty: 20000, min: 10000, location: barLocation.id },
      ];
      
      for (const stock of stockConfig) {
        const ingredient = restaurantData.ingredients.find(i => i.name === stock.ingredient);
        if (!ingredient) continue;
        
        const stockId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_stock_levels (id, restaurant_id, location_id, ingredient_id, qty, min_qty)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [stockId, restaurantId, stock.location, ingredient.id, stock.qty, stock.min]);
        
        restaurantData.stockLevels.push({
          id: stockId,
          location_id: stock.location,
          ingredient_id: ingredient.id,
          qty: stock.qty,
          min_qty: stock.min,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.stockLevels.length} níveis de estoque criados`);

      // Criar categorias de menu
      const categories = [
        { name: 'Entradas', sort: 1 },
        { name: 'Pratos Principais', sort: 2 },
        { name: 'Bebidas', sort: 3 },
        { name: 'Sobremesas', sort: 4 },
      ];
      
      const categoryIds: { [key: string]: string } = {};
      for (const cat of categories) {
        const catId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_menu_categories (id, restaurant_id, name, sort_order)
          VALUES ($1, $2, $3, $4)
        `, [catId, restaurantId, cat.name, cat.sort]);
        categoryIds[cat.name] = catId;
      }

      // Criar produtos (12 por restaurante)
      const productTemplates = [
        { name: 'Hambúrguer Artesanal', category: 'Pratos Principais', station: 'KITCHEN', prep: 12, price: 1800 },
        { name: 'Pizza Margherita', category: 'Pratos Principais', station: 'KITCHEN', prep: 15, price: 1600 },
        { name: 'Salada César', category: 'Entradas', station: 'KITCHEN', prep: 5, price: 1200 },
        { name: 'Nachos', category: 'Entradas', station: 'KITCHEN', prep: 8, price: 1400 },
        { name: 'Mojito', category: 'Bebidas', station: 'BAR', prep: 3, price: 800 },
        { name: 'Caipirinha', category: 'Bebidas', station: 'BAR', prep: 4, price: 700 },
        { name: 'Cerveja Artesanal', category: 'Bebidas', station: 'BAR', prep: 1, price: 600 },
        { name: 'Água', category: 'Bebidas', station: 'BAR', prep: 1, price: 200 },
        { name: 'Refrigerante', category: 'Bebidas', station: 'BAR', prep: 1, price: 350 },
        { name: 'Tiramisú', category: 'Sobremesas', station: 'KITCHEN', prep: 2, price: 900 },
        { name: 'Brownie', category: 'Sobremesas', station: 'KITCHEN', prep: 3, price: 750 },
        { name: 'Sorvete', category: 'Sobremesas', station: 'KITCHEN', prep: 1, price: 500 },
      ];
      
      for (const prod of productTemplates) {
        const productId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_products (
            id, restaurant_id, category_id, name, price_cents, available,
            station, prep_time_seconds, prep_category
          )
          VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8)
        `, [
          productId,
          restaurantId,
          categoryIds[prod.category],
          prod.name,
          prod.price,
          prod.station,
          prod.prep * 60,
          prod.station === 'BAR' ? 'drink' : 'main',
        ]);

        // Criar BOM para produtos relevantes
        const bom: any[] = [];
        
        if (prod.station === 'KITCHEN' && prod.name.includes('Hambúrguer')) {
          const carne = restaurantData.ingredients.find(i => i.name === 'Carne');
          const pao = restaurantData.ingredients.find(i => i.name === 'Pão');
          const queijo = restaurantData.ingredients.find(i => i.name === 'Queijo');
          
          if (carne) {
            await pool.query(`
              INSERT INTO public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station)
              VALUES ($1, $2, $3, $4, $5, 'KITCHEN')
            `, [uuidv4(), restaurantId, productId, carne.id, 150]);
            bom.push({ ingredient_id: carne.id, qty_per_unit: 150, station: 'KITCHEN' });
          }
          if (pao) {
            await pool.query(`
              INSERT INTO public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station)
              VALUES ($1, $2, $3, $4, $5, 'KITCHEN')
            `, [uuidv4(), restaurantId, productId, pao.id, 1]);
            bom.push({ ingredient_id: pao.id, qty_per_unit: 1, station: 'KITCHEN' });
          }
          if (queijo) {
            await pool.query(`
              INSERT INTO public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station)
              VALUES ($1, $2, $3, $4, $5, 'KITCHEN')
            `, [uuidv4(), restaurantId, productId, queijo.id, 30]);
            bom.push({ ingredient_id: queijo.id, qty_per_unit: 30, station: 'KITCHEN' });
          }
        } else if (prod.station === 'BAR' && prod.name.includes('Mojito')) {
          const limao = restaurantData.ingredients.find(i => i.name === 'Limão');
          const gelo = restaurantData.ingredients.find(i => i.name === 'Gelo');
          
          if (limao) {
            await pool.query(`
              INSERT INTO public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station)
              VALUES ($1, $2, $3, $4, $5, 'BAR')
            `, [uuidv4(), restaurantId, productId, limao.id, 1]);
            bom.push({ ingredient_id: limao.id, qty_per_unit: 1, station: 'BAR' });
          }
          if (gelo) {
            await pool.query(`
              INSERT INTO public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station)
              VALUES ($1, $2, $3, $4, $5, 'BAR')
            `, [uuidv4(), restaurantId, productId, gelo.id, 200]);
            bom.push({ ingredient_id: gelo.id, qty_per_unit: 200, station: 'BAR' });
          }
        }

        restaurantData.products.push({
          id: productId,
          name: prod.name,
          station: prod.station as any,
          prep_time_seconds: prod.prep * 60,
          prep_category: prod.station === 'BAR' ? 'drink' : 'main',
          price_cents: prod.price,
          restaurant_id: restaurantId,
          bom,
        });
      }
      logger.log(`  ✅ ${restaurantData.products.length} produtos criados com BOM`);

      context.restaurants.push(restaurantData);
    }

    logger.log(`\n✅ Setup massivo concluído: ${context.restaurants.length} restaurantes criados`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        restaurantsCreated: context.restaurants.length,
        totalTables: context.restaurants.reduce((sum, r) => sum + r.tables.length, 0),
        totalProducts: context.restaurants.reduce((sum, r) => sum + r.products.length, 0),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro no setup: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 1',
      severity: 'CRITICAL',
      message: `Erro no setup massivo: ${errorMsg}`,
      details: error,
      reproducible: true,
    });

    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }
};

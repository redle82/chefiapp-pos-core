/**
 * FASE 1 - SETUP EVOLUTIVO
 * 
 * Cria datasets para S/M/L/XL conforme configuração.
 * Restaurantes, mesas, usuários, categorias, produtos, inventário/estoque.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext, RestaurantData, ScenarioConfig, SCENARIOS } from './types';
import type { TestLogger } from './types';
import { SCENARIOS as SCENARIOS_CONFIG } from './types';

export const fase1SetupEvolutivo: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 1 — SETUP EVOLUTIVO');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  const scenario = (context.metadata.scenario || 'M') as keyof typeof SCENARIOS_CONFIG;
  const config = SCENARIOS_CONFIG[scenario];

  logger.log(`📊 Cenário: ${config.name}`);
  logger.log(`   Restaurantes: ${config.restaurants}`);
  logger.log(`   Mesas/restaurante: ${config.tablesPerRestaurant}`);
  logger.log(`   Produtos/restaurante: ${config.productsPerRestaurant}`);

  try {
    // Criar tenant padrão se não existir
    let tenantId = '00000000-0000-0000-0000-000000000001';
    const tenantCheck = await pool.query(`
      SELECT id FROM public.saas_tenants WHERE id = $1
    `, [tenantId]);
    
    if (tenantCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.saas_tenants (id, name, slug)
        VALUES ($1, 'Tenant Teste N4', 'tenant-teste-n4')
      `, [tenantId]);
      logger.log('✅ Tenant criado');
    }

    // Criar restaurantes
    for (let r = 0; r < config.restaurants; r++) {
      const restaurantName = config.restaurants === 1 ? 'Restaurante Teste' : `Restaurante ${String.fromCharCode(65 + r)}`;
      const restaurantSlug = config.restaurants === 1 ? 'teste-n4' : `rest-${String.fromCharCode(97 + r)}-n4`;
      
      logger.log(`\n📦 Criando restaurante: ${restaurantName}...`);
      
      const restaurantId = uuidv4();
      await pool.query(`
        INSERT INTO public.gm_restaurants (id, tenant_id, name, slug)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      `, [restaurantId, tenantId, restaurantName, restaurantSlug]);

      const restaurantData: RestaurantData = {
        id: restaurantId,
        name: restaurantName,
        slug: restaurantSlug,
        tenant_id: tenantId,
        tables: [],
        locations: [],
        equipment: [],
        ingredients: [],
        products: [],
        stockLevels: [],
        users: [],
      };

      // Criar mesas
      for (let i = 1; i <= config.tablesPerRestaurant; i++) {
        const tableId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_tables (id, restaurant_id, number, status)
          VALUES ($1, $2, $3, 'free')
          ON CONFLICT (restaurant_id, number) DO NOTHING
        `, [tableId, restaurantId, i]);
        restaurantData.tables.push({ id: tableId, number: i, restaurant_id: restaurantId });
      }
      logger.log(`  ✅ ${restaurantData.tables.length} mesas criadas`);

      // Criar locais
      const locationKinds = [
        { name: 'Cozinha Principal', kind: 'KITCHEN' },
        { name: 'Bar', kind: 'BAR' },
        { name: 'Estoque', kind: 'STORAGE' },
      ];
      
      if (config.locationsPerRestaurant > 3) {
        locationKinds.push({ name: 'Câmara Fria', kind: 'STORAGE' });
      }
      
      for (let i = 0; i < Math.min(config.locationsPerRestaurant, locationKinds.length); i++) {
        const loc = locationKinds[i];
        const locationId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_locations (id, restaurant_id, name, kind)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [locationId, restaurantId, loc.name, loc.kind]);
        restaurantData.locations.push({
          id: locationId,
          name: loc.name,
          kind: loc.kind as any,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.locations.length} locais criados`);

      // Criar ingredientes base
      const ingredientList = [
        { name: 'Carne', unit: 'g' },
        { name: 'Pão', unit: 'unit' },
        { name: 'Queijo', unit: 'g' },
        { name: 'Tomate', unit: 'g' },
        { name: 'Alface', unit: 'g' },
        { name: 'Limão', unit: 'unit' },
        { name: 'Gelo', unit: 'g' },
        { name: 'Cerveja', unit: 'ml' },
        { name: 'Água', unit: 'ml' },
        { name: 'Refrigerante', unit: 'ml' },
      ];

      // Adicionar mais ingredientes para cenários maiores
      if (config.ingredientsPerRestaurant > 10) {
        ingredientList.push(
          { name: 'Frango', unit: 'g' },
          { name: 'Peixe', unit: 'g' },
          { name: 'Massa', unit: 'g' },
          { name: 'Molho', unit: 'ml' },
          { name: 'Azeite', unit: 'ml' },
        );
      }

      for (let i = 0; i < Math.min(config.ingredientsPerRestaurant, ingredientList.length); i++) {
        const ing = ingredientList[i];
        const ingredientId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_ingredients (id, restaurant_id, name, unit)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (restaurant_id, name) DO NOTHING
        `, [ingredientId, restaurantId, ing.name, ing.unit]);
        restaurantData.ingredients.push({
          id: ingredientId,
          name: ing.name,
          unit: ing.unit as any,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.ingredients.length} ingredientes criados`);

      // Criar estoque inicial
      const kitchenLocation = restaurantData.locations.find(l => l.kind === 'KITCHEN');
      const barLocation = restaurantData.locations.find(l => l.kind === 'BAR');
      
      for (const ing of restaurantData.ingredients) {
        const location = ing.unit === 'ml' || ing.name === 'Limão' || ing.name === 'Gelo' 
          ? barLocation 
          : kitchenLocation;
        if (!location) continue;

        const qty = ing.name === 'Carne' ? 5000 : ing.name === 'Pão' ? 50 : 2000;
        const minQty = qty * 0.2; // 20% do estoque como mínimo

        const stockId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_stock_levels (id, restaurant_id, location_id, ingredient_id, qty, min_qty)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (restaurant_id, location_id, ingredient_id) DO UPDATE SET qty = EXCLUDED.qty
        `, [stockId, restaurantId, location.id, ing.id, qty, minQty]);
        
        restaurantData.stockLevels.push({
          id: stockId,
          location_id: location.id,
          ingredient_id: ing.id,
          qty,
          min_qty: minQty,
          restaurant_id: restaurantId,
        });
      }
      logger.log(`  ✅ ${restaurantData.stockLevels.length} níveis de estoque criados`);

      // Criar categorias
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
          ON CONFLICT DO NOTHING
        `, [catId, restaurantId, cat.name, cat.sort]);
        categoryIds[cat.name] = catId;
      }

      // Criar produtos (com tempo + estação obrigatórios)
      const productTemplates = [
        { name: 'Hambúrguer', category: 'Pratos Principais', station: 'KITCHEN', prep: 12, price: 1800 },
        { name: 'Pizza', category: 'Pratos Principais', station: 'KITCHEN', prep: 15, price: 1600 },
        { name: 'Salada', category: 'Entradas', station: 'KITCHEN', prep: 5, price: 1200 },
        { name: 'Mojito', category: 'Bebidas', station: 'BAR', prep: 3, price: 800 },
        { name: 'Caipirinha', category: 'Bebidas', station: 'BAR', prep: 4, price: 700 },
        { name: 'Cerveja', category: 'Bebidas', station: 'BAR', prep: 1, price: 600 },
        { name: 'Água', category: 'Bebidas', station: 'BAR', prep: 1, price: 200 },
        { name: 'Refrigerante', category: 'Bebidas', station: 'BAR', prep: 1, price: 350 },
        { name: 'Tiramisú', category: 'Sobremesas', station: 'KITCHEN', prep: 2, price: 900 },
        { name: 'Brownie', category: 'Sobremesas', station: 'KITCHEN', prep: 3, price: 750 },
      ];

      // Expandir produtos para cenários maiores
      if (config.productsPerRestaurant > 10) {
        productTemplates.push(
          { name: 'Nachos', category: 'Entradas', station: 'KITCHEN', prep: 8, price: 1400 },
          { name: 'Frango Grelhado', category: 'Pratos Principais', station: 'KITCHEN', prep: 18, price: 2200 },
          { name: 'Peixe', category: 'Pratos Principais', station: 'KITCHEN', prep: 20, price: 2500 },
          { name: 'Massa', category: 'Pratos Principais', station: 'KITCHEN', prep: 12, price: 1700 },
        );
      }

      for (let i = 0; i < Math.min(config.productsPerRestaurant, productTemplates.length); i++) {
        const prod = productTemplates[i];
        const productId = uuidv4();
        await pool.query(`
          INSERT INTO public.gm_products (
            id, restaurant_id, category_id, name, price_cents, available,
            station, prep_time_seconds, prep_category
          )
          VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8)
          ON CONFLICT DO NOTHING
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

        restaurantData.products.push({
          id: productId,
          name: prod.name,
          station: prod.station as any,
          prep_time_seconds: prod.prep * 60,
          prep_category: prod.station === 'BAR' ? 'drink' : 'main',
          price_cents: prod.price,
          restaurant_id: restaurantId,
          bom: [],
        });
      }
      logger.log(`  ✅ ${restaurantData.products.length} produtos criados`);

      // Criar usuários (garçons, gerentes, donos)
      const userRoles = [
        ...Array(config.waitersPerRestaurant).fill('waiter'),
        ...Array(config.managersPerRestaurant).fill('manager'),
        ...Array(config.ownersPerRestaurant).fill('owner'),
      ];

      for (let i = 0; i < userRoles.length; i++) {
        const role = userRoles[i] as 'waiter' | 'manager' | 'owner';
        const userId = uuidv4();
        const userName = role === 'waiter' ? `Garçom ${i + 1}` 
          : role === 'manager' ? `Gerente ${i + 1}` 
          : 'Dono';
        
        // Nota: Assumindo que existe uma tabela de usuários ou usando device_id
        restaurantData.users.push({
          id: userId,
          restaurant_id: restaurantId,
          role,
          name: userName,
        });
      }
      logger.log(`  ✅ ${restaurantData.users.length} usuários criados`);

      context.restaurants.push(restaurantData);
    }

    logger.log(`\n✅ Setup evolutivo concluído: ${context.restaurants.length} restaurantes criados`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        restaurantsCreated: context.restaurants.length,
        totalTables: context.restaurants.reduce((sum, r) => sum + r.tables.length, 0),
        totalProducts: context.restaurants.reduce((sum, r) => sum + r.products.length, 0),
        totalIngredients: context.restaurants.reduce((sum, r) => sum + r.ingredients.length, 0),
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
      message: `Erro no setup evolutivo: ${errorMsg}`,
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

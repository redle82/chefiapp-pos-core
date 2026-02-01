/**
 * FASE 1 - SETUP MASSIVO
 * 
 * Cria 1.000 restaurantes com perfis diferentes (400, 350, 200, 50).
 * Cada perfil com características, carga e comportamento diferentes.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext, RestaurantData, RestaurantProfile, RestaurantProfileConfig } from './types';
import type { TestLogger } from './types';
import { SCENARIO_EXTREME } from './types';
import { generateRestaurantProfiles, randomInt } from './restaurant-profiles';
import { emitProgress } from './progress';

export const fase1SetupMassivo: PhaseFunction = async (
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

  const profiles = generateRestaurantProfiles();
  logger.log(`📊 Total de restaurantes: ${SCENARIO_EXTREME.totalRestaurants}`);
  logger.log(`   - Ambulantes/Micro: ${profiles[0].count}`);
  logger.log(`   - Pequenos/Médios: ${profiles[1].count}`);
  logger.log(`   - Grandes: ${profiles[2].count}`);
  logger.log(`   - Enterprise: ${profiles[3].count}`);

  try {
    // Criar tenant padrão se não existir
    let tenantId = '00000000-0000-0000-0000-000000000001';
    const tenantCheck = await pool.query(`
      SELECT id FROM public.saas_tenants WHERE id = $1
    `, [tenantId]);
    
    if (tenantCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.saas_tenants (id, name, slug)
        VALUES ($1, 'Tenant Teste N5', 'tenant-teste-n5')
      `, [tenantId]);
      logger.log('✅ Tenant criado');
    }

    let totalCreated = 0;
    let totalTables = 0;
    let totalPeople = 0;

    // Processar cada perfil
    for (let pIdx = 0; pIdx < profiles.length; pIdx++) {
      const profile = profiles[pIdx];
      logger.log(`\n📦 Processando perfil: ${profile.name} (${profile.count} restaurantes)...`);
      emitProgress(context, {
        phase: 'FASE 1: Setup Massivo',
        step: `Perfil ${pIdx + 1}/${profiles.length}`,
        current: pIdx + 1,
        total: profiles.length,
        message: `Processando perfil: ${profile.name}`,
        op: 'EXEC',
      });
      
      for (let r = 0; r < profile.count; r++) {
        const restaurantName = `${profile.name} #${r + 1}`;
        const restaurantSlug = `${profile.name.toLowerCase().replace(/\s+/g, '-')}-${r + 1}-n5`;
        
        // Emitir progresso a cada 10 restaurantes (mais frequente)
        if ((r + 1) % 10 === 0 || (r + 1) === profile.count) {
          const totalRestaurantsSoFar = profiles.slice(0, pIdx).reduce((sum, p) => sum + p.count, 0) + (r + 1);
          emitProgress(context, {
            phase: 'FASE 1: Setup Massivo',
            step: 'Criando restaurantes',
            current: totalRestaurantsSoFar,
            total: SCENARIO_EXTREME.totalRestaurants,
            message: `${restaurantName} (${totalRestaurantsSoFar}/${SCENARIO_EXTREME.totalRestaurants})`,
            op: 'INSERT',
            resource: 'public.gm_restaurants',
          });
        }
        
        if ((r + 1) % 50 === 0) {
          logger.log(`  ⏳ Progresso: ${r + 1}/${profile.count} restaurantes...`);
        }
        
        const restaurantId = uuidv4();
        const restaurantResult = await pool.query(`
          INSERT INTO public.gm_restaurants (id, tenant_id, name, slug)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [restaurantId, tenantId, restaurantName, restaurantSlug]);
        
        const actualRestaurantId = restaurantResult.rows[0].id;

        const restaurantData: RestaurantData = {
          id: actualRestaurantId,
          name: restaurantName,
          slug: restaurantSlug,
          tenant_id: tenantId,
          profile: (profile.name.toUpperCase().split('/')[0] || 'PEQUENO') as RestaurantProfile,
          tables: [],
          locations: [],
          equipment: [],
          ingredients: [],
          products: [],
          stockLevels: [],
          people: [],
        };

        // Criar mesas (número aleatório dentro do range)
        const numTables = randomInt(profile.tablesRange[0], profile.tablesRange[1]);
        for (let i = 1; i <= numTables; i++) {
          const tableId = uuidv4();
          await pool.query(`
            INSERT INTO public.gm_tables (id, restaurant_id, number, status)
            VALUES ($1, $2, $3, 'closed')
            ON CONFLICT (restaurant_id, number) DO NOTHING
          `, [tableId, actualRestaurantId, i]);
          restaurantData.tables.push({ id: tableId, number: i, restaurant_id: actualRestaurantId });
        }
        totalTables += restaurantData.tables.length;

        // Criar locais (número aleatório dentro do range)
        const numLocations = randomInt(profile.locationsRange[0], profile.locationsRange[1]);
        const locationKinds = [
          { name: 'Cozinha Principal', kind: 'KITCHEN' },
          { name: 'Bar', kind: 'BAR' },
          { name: 'Estoque', kind: 'STORAGE' },
        ];
        
        if (numLocations > 3) {
          locationKinds.push({ name: 'Câmara Fria', kind: 'STORAGE' });
        }
        if (numLocations > 4) {
          locationKinds.push({ name: 'Cozinha Secundária', kind: 'KITCHEN' });
        }
        if (numLocations > 5) {
          locationKinds.push({ name: 'Bar Secundário', kind: 'BAR' });
        }
        
        for (let i = 0; i < Math.min(numLocations, locationKinds.length); i++) {
          const loc = locationKinds[i];
          const locationId = uuidv4();
          const locationResult = await pool.query(`
            INSERT INTO public.gm_locations (id, restaurant_id, name, kind)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (restaurant_id, name) DO UPDATE SET kind = EXCLUDED.kind
            RETURNING id
          `, [locationId, actualRestaurantId, loc.name, loc.kind]);
          
          const actualLocationId = locationResult.rows[0]?.id || locationId;
          restaurantData.locations.push({
            id: actualLocationId,
            name: loc.name,
            kind: loc.kind as any,
            restaurant_id: actualRestaurantId,
          });
        }

        // Criar ingredientes (número aleatório dentro do range)
        const numIngredients = randomInt(profile.ingredientsRange[0], profile.ingredientsRange[1]);
        const ingredientTemplates = [
          { name: 'Carne', unit: 'g' }, { name: 'Frango', unit: 'g' }, { name: 'Peixe', unit: 'g' },
          { name: 'Pão', unit: 'unit' }, { name: 'Massa', unit: 'g' },
          { name: 'Queijo', unit: 'g' }, { name: 'Tomate', unit: 'g' }, { name: 'Alface', unit: 'g' },
          { name: 'Limão', unit: 'unit' }, { name: 'Gelo', unit: 'g' },
          { name: 'Cerveja', unit: 'ml' }, { name: 'Água', unit: 'ml' }, { name: 'Refrigerante', unit: 'ml' },
          { name: 'Molho', unit: 'ml' }, { name: 'Azeite', unit: 'ml' },
          { name: 'Arroz', unit: 'g' }, { name: 'Feijão', unit: 'g' },
          { name: 'Batata', unit: 'g' }, { name: 'Cebola', unit: 'g' },
          { name: 'Vinho', unit: 'ml' }, { name: 'Whisky', unit: 'ml' },
        ];

        for (let i = 0; i < Math.min(numIngredients, ingredientTemplates.length); i++) {
          const ing = ingredientTemplates[i];
          const ingredientId = uuidv4();
          const ingredientResult = await pool.query(`
            INSERT INTO public.gm_ingredients (id, restaurant_id, name, unit)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (restaurant_id, name) DO UPDATE SET unit = EXCLUDED.unit
            RETURNING id
          `, [ingredientId, actualRestaurantId, `${ing.name} ${restaurantName}`, ing.unit]);
          
          const actualIngredientId = ingredientResult.rows[0]?.id || ingredientId;
          restaurantData.ingredients.push({
            id: actualIngredientId,
            name: `${ing.name} ${restaurantName}`,
            unit: ing.unit as any,
            restaurant_id: actualRestaurantId,
          });
        }

        // Criar estoque inicial
        const kitchenLocation = restaurantData.locations.find(l => l.kind === 'KITCHEN');
        const barLocation = restaurantData.locations.find(l => l.kind === 'BAR');
        const storageLocation = restaurantData.locations.find(l => l.kind === 'STORAGE');
        
        for (const ing of restaurantData.ingredients) {
          const location = ing.unit === 'ml' || ing.name.includes('Limão') || ing.name.includes('Gelo')
            ? (barLocation || storageLocation)
            : (kitchenLocation || storageLocation);
          if (!location) continue;

          const qty = ing.name.includes('Carne') ? 5000 
            : ing.name.includes('Pão') ? 50 
            : ing.unit === 'ml' ? 10000 
            : 2000;
          const minQty = qty * 0.2;

          const stockId = uuidv4();
          await pool.query(`
            INSERT INTO public.gm_stock_levels (id, restaurant_id, location_id, ingredient_id, qty, min_qty)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (restaurant_id, location_id, ingredient_id) DO UPDATE SET qty = EXCLUDED.qty
          `, [stockId, actualRestaurantId, location.id, ing.id, qty, minQty]);
          
          restaurantData.stockLevels.push({
            id: stockId,
            location_id: location.id,
            ingredient_id: ing.id,
            qty,
            min_qty: minQty,
            restaurant_id: actualRestaurantId,
          });
        }

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
          `, [catId, actualRestaurantId, cat.name, cat.sort]);
          categoryIds[cat.name] = catId;
        }

        // Criar produtos (número aleatório dentro do range)
        const numProducts = randomInt(profile.productsRange[0], profile.productsRange[1]);
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
          { name: 'Nachos', category: 'Entradas', station: 'KITCHEN', prep: 8, price: 1400 },
          { name: 'Frango Grelhado', category: 'Pratos Principais', station: 'KITCHEN', prep: 18, price: 2200 },
          { name: 'Peixe', category: 'Pratos Principais', station: 'KITCHEN', prep: 20, price: 2500 },
          { name: 'Massa', category: 'Pratos Principais', station: 'KITCHEN', prep: 12, price: 1700 },
        ];

        for (let i = 0; i < Math.min(numProducts, productTemplates.length); i++) {
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
            actualRestaurantId,
            categoryIds[prod.category],
            `${prod.name} ${restaurantName}`,
            prod.price,
            prod.station,
            prod.prep * 60,
            prod.station === 'BAR' ? 'drink' : 'main',
          ]);

          restaurantData.products.push({
            id: productId,
            name: `${prod.name} ${restaurantName}`,
            station: prod.station as any,
            prep_time_seconds: prod.prep * 60,
            prep_category: prod.station === 'BAR' ? 'drink' : 'main',
            price_cents: prod.price,
            restaurant_id: actualRestaurantId,
            bom: [],
          });
        }

        // Criar pessoas (número aleatório dentro do range)
        const numPeople = randomInt(profile.peopleRange[0], profile.peopleRange[1]);
        const peopleRoles = [
          ...Array(Math.floor(numPeople * 0.4)).fill('waiter'),
          ...Array(Math.floor(numPeople * 0.3)).fill('kitchen'),
          ...Array(Math.floor(numPeople * 0.15)).fill('bar'),
          ...Array(Math.floor(numPeople * 0.1)).fill('manager'),
          ...Array(Math.max(1, Math.floor(numPeople * 0.05))).fill('owner'),
        ];

        for (let i = 0; i < peopleRoles.length && i < numPeople; i++) {
          const role = peopleRoles[i] as any;
          const userId = uuidv4();
          const roleNames: Record<string, string> = {
            waiter: `Garçom ${i + 1}`,
            kitchen: `Cozinheiro ${i + 1}`,
            bar: `Bartender ${i + 1}`,
            manager: `Gerente ${i + 1}`,
            owner: 'Dono',
          };
          
          restaurantData.people.push({
            id: userId,
            restaurant_id: actualRestaurantId,
            role,
            name: roleNames[role] || `Usuário ${i + 1}`,
          });
        }
        totalPeople += restaurantData.people.length;

        context.restaurants.push(restaurantData);
        totalCreated++;
      }

      logger.log(`  ✅ ${profile.count} restaurantes do perfil "${profile.name}" criados`);
    }

    // Validar isolamento (multi-restaurante)
    logger.log('\n🔍 Validando isolamento multi-restaurante...');
    const isolationCheck = await pool.query(`
      SELECT COUNT(DISTINCT id) as count
      FROM public.gm_restaurants
      WHERE tenant_id = $1
    `, [tenantId]);
    
    if (parseInt(isolationCheck.rows[0].count) !== totalCreated) {
      warnings.push(`Isolamento: Esperado ${totalCreated}, encontrado ${isolationCheck.rows[0].count}`);
    } else {
      logger.log('✅ Isolamento validado');
    }

    logger.log(`\n✅ Setup massivo concluído:`);
    logger.log(`   - Restaurantes: ${totalCreated}`);
    logger.log(`   - Mesas: ${totalTables}`);
    logger.log(`   - Pessoas: ${totalPeople}`);

    emitProgress(context, {
      phase: 'FASE 1: Setup Massivo',
      step: 'complete',
      current: SCENARIO_EXTREME.totalRestaurants,
      total: SCENARIO_EXTREME.totalRestaurants,
      message: `Concluído: ${totalCreated} restaurantes, ${totalTables} mesas, ${totalPeople} pessoas`,
      op: 'INFO',
    });

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        restaurantsCreated: totalCreated,
        totalTables,
        totalPeople,
        totalProducts: context.restaurants.reduce((sum, r) => sum + r.products.length, 0),
        totalIngredients: context.restaurants.reduce((sum, r) => sum + r.ingredients.length, 0),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro no setup massivo: ${errorMsg}`, 'ERROR');
    
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

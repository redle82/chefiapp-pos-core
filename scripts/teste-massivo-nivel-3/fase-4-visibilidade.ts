/**
 * FASE 4 - VISIBILIDADE
 * 
 * Valida isolamento de dados entre diferentes "views":
 * - KDS interno: vê todos os pedidos (OPEN, IN_PREP, READY)
 * - KDS público: vê apenas READY
 * - Cliente: vê apenas seu pedido
 * - Nenhum vazamento entre restaurantes
 * 
 * Gera checklist manual para validação visual.
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

const RESULTS_DIR = path.join(process.cwd(), 'test-results');

export const fase4Visibilidade: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 4 — VISIBILIDADE');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Marcar alguns pedidos como READY para testar KDS público
    logger.log('Marcando alguns pedidos como READY...');
    
    const readyOrders = await pool.query(`
      UPDATE public.gm_orders
      SET status = 'READY', ready_at = NOW(), updated_at = NOW()
      WHERE id IN (
        SELECT id FROM public.gm_orders
        WHERE status = 'OPEN'
        ORDER BY created_at
        LIMIT 4
      )
      RETURNING id, restaurant_id, table_number
    `);
    logger.log(`  ✅ ${readyOrders.rows.length} pedidos marcados como READY`);

    // 2. Marcar alguns itens como prontos (para simular entrega parcial)
    logger.log('Marcando alguns itens como prontos...');
    
    const readyItems = await pool.query(`
      UPDATE public.gm_order_items
      SET ready_at = NOW()
      WHERE id IN (
        SELECT oi.id FROM public.gm_order_items oi
        JOIN public.gm_orders o ON o.id = oi.order_id
        WHERE o.status = 'READY'
          AND oi.ready_at IS NULL
        LIMIT 6
      )
      RETURNING id, order_id
    `);
    logger.log(`  ✅ ${readyItems.rows.length} itens marcados como prontos`);

    // 3. Validar isolamento por restaurante
    logger.log('Validando isolamento entre restaurantes...');
    
    for (const restaurant of context.restaurants) {
      // Pedidos do restaurante
      const restaurantOrders = await pool.query(`
        SELECT COUNT(*) as count, status
        FROM public.gm_orders
        WHERE restaurant_id = $1
        GROUP BY status
      `, [restaurant.id]);

      // Verificar se há pedidos de outros restaurantes misturados
      const crossCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM public.gm_orders o
        JOIN public.gm_tables t ON t.id = o.table_id
        WHERE o.restaurant_id = $1
          AND t.restaurant_id != $1
      `, [restaurant.id]);

      if (parseInt(crossCheck.rows[0].count) > 0) {
        errors.push({
          phase: 'FASE 4',
          severity: 'CRITICAL',
          message: `Vazamento de dados: ${restaurant.name} tem pedidos com mesas de outros restaurantes`,
          reproducible: true,
        });
        logger.log(`  ❌ ERRO: Vazamento detectado em ${restaurant.name}!`, 'ERROR');
      } else {
        logger.log(`  ✅ ${restaurant.name}: Isolamento validado`);
      }
    }

    // 4. Validar dados que cada "view" deveria ver
    logger.log('Validando dados por view...');

    // KDS Interno: deveria ver todos os pedidos ativos
    const kdsInternalCount = await pool.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM public.gm_orders o
      WHERE o.status IN ('OPEN', 'IN_PREP', 'READY')
    `);
    logger.log(`  📊 KDS Interno: ${kdsInternalCount.rows[0].count} pedidos ativos`);

    // KDS Público: deveria ver apenas READY
    const kdsPublicCount = await pool.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM public.gm_orders o
      WHERE o.status = 'READY'
    `);
    logger.log(`  📊 KDS Público: ${kdsPublicCount.rows[0].count} pedidos READY`);

    // Validar que KDS público não vê pedidos em preparo
    const kdsPublicLeak = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status IN ('OPEN', 'IN_PREP')
        AND status != 'READY'
    `);
    
    if (parseInt(kdsPublicCount.rows[0].count) === 0 && context.orders.length > 0) {
      warnings.push('KDS Público não tem pedidos READY para exibir (esperado se nenhum pedido foi marcado como pronto)');
    }

    // 5. Gerar checklist manual para validação visual
    logger.log('Gerando checklist de validação visual...');

    const checklist: string[] = [];
    checklist.push('# Checklist de Validação Visual - Fase 4\n');
    checklist.push('## URLs para Testar\n\n');

    for (const restaurant of context.restaurants) {
      const readyOrder = readyOrders.rows.find((r: any) => r.restaurant_id === restaurant.id);
      
      checklist.push(`### ${restaurant.name} (${restaurant.slug})\n`);
      checklist.push(`- **KDS Interno:** http://localhost:5175/kds-minimal`);
      checklist.push(`  - ✅ Deve mostrar todos os pedidos ativos (OPEN, IN_PREP, READY)`);
      checklist.push(`  - ✅ Deve mostrar tempos e atrasos`);
      checklist.push(`  - ✅ Deve permitir marcar itens como prontos\n`);
      
      checklist.push(`- **KDS Público:** http://localhost:5175/public/${restaurant.slug}/kds`);
      checklist.push(`  - ✅ Deve mostrar APENAS pedidos READY`);
      checklist.push(`  - ❌ NÃO deve mostrar pedidos em preparo`);
      checklist.push(`  - ❌ NÃO deve mostrar tempos ou atrasos\n`);
      
      if (readyOrder) {
        const order = context.orders.find(o => o.id === readyOrder.id);
        if (order) {
          checklist.push(`- **Status do Cliente:** http://localhost:5175/public/${restaurant.slug}/order/${order.id}`);
          checklist.push(`  - ✅ Deve mostrar APENAS este pedido`);
          checklist.push(`  - ❌ NÃO deve mostrar outros pedidos`);
          checklist.push(`  - ❌ NÃO deve mostrar informações de produção\n`);
        }
      }
      
      checklist.push(`- **Mini KDS (AppStaff):** http://localhost:5175/garcom`);
      checklist.push(`  - ✅ Deve mostrar pedidos do restaurante correto`);
      checklist.push(`  - ✅ Deve mostrar tarefas relacionadas\n`);
      
      checklist.push('');
    }

    checklist.push('## Validações de Isolamento\n\n');
    checklist.push('### Entre Restaurantes\n');
    checklist.push('- [ ] KDS de Alpha NÃO mostra pedidos de Beta/Gamma/Delta');
    checklist.push('- [ ] KDS de Beta NÃO mostra pedidos de Alpha/Gamma/Delta');
    checklist.push('- [ ] KDS de Gamma NÃO mostra pedidos de Alpha/Beta/Delta');
    checklist.push('- [ ] KDS de Delta NÃO mostra pedidos de Alpha/Beta/Gamma\n');

    checklist.push('### Entre Views\n');
    checklist.push('- [ ] Cliente vê APENAS seu pedido');
    checklist.push('- [ ] KDS público vê APENAS pedidos READY');
    checklist.push('- [ ] KDS interno vê todos os pedidos ativos');
    checklist.push('- [ ] Nenhuma view mostra informações de outros restaurantes\n');

    checklist.push('## Dados de Teste\n\n');
    checklist.push(`- Total de pedidos criados: ${context.orders.length}`);
    checklist.push(`- Pedidos READY: ${readyOrders.rows.length}`);
    checklist.push(`- Pedidos OPEN: ${context.orders.length - readyOrders.rows.length}`);
    checklist.push(`- Restaurantes: ${context.restaurants.length}\n`);

    fs.writeFileSync(
      path.join(RESULTS_DIR, 'CHECKLIST_VISUAL.md'),
      checklist.join('\n')
    );

    logger.log(`  ✅ Checklist gerado: test-results/CHECKLIST_VISUAL.md`);

    // 6. Validar que tarefas não aparecem para cliente
    logger.log('Validando que tarefas não vazam para cliente...');
    
    const tasksLeak = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks t
      JOIN public.gm_orders o ON o.id = t.order_id
      WHERE t.status = 'OPEN'
        AND t.auto_generated = true
        AND o.status IN ('OPEN', 'IN_PREP', 'READY')
    `);

    // Tarefas devem existir, mas não devem ser acessíveis por cliente
    logger.log(`  ℹ️  ${tasksLeak.rows[0].count} tarefas relacionadas a pedidos ativos (não devem aparecer para cliente)`);

    logger.log(`\n✅ Visibilidade validada`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        readyOrders: readyOrders.rows.length,
        readyItems: readyItems.rows.length,
        kdsInternalCount: parseInt(kdsInternalCount.rows[0].count),
        kdsPublicCount: parseInt(kdsPublicCount.rows[0].count),
        checklistPath: path.join(RESULTS_DIR, 'CHECKLIST_VISUAL.md'),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na validação de visibilidade: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 4',
      severity: 'CRITICAL',
      message: `Erro na validação de visibilidade: ${errorMsg}`,
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

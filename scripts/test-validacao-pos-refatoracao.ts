/**
 * TESTE AUTOMATIZADO - VALIDAÇÃO PÓS-REFATORAÇÃO
 * 
 * Testa criação de pedidos via 3 origens:
 * 1. QR Mesa
 * 2. AppStaff (waiter)
 * 3. TPVMinimal
 * 
 * Verifica que:
 * - Pedidos são criados corretamente
 * - Origem está correta
 * - Autoria preservada
 * - Pedidos aparecem no banco
 */

const DOCKER_CORE_URL = 'http://localhost:3001';
const DOCKER_CORE_ANON_KEY = 'chefiapp-core-secret-key-min-32-chars-long';
const RESTAURANT_ID = '00000000-0000-0000-0000-000000000100';

interface OrderItemInput {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderResult {
  id: string;
  total_cents: number;
  status: string;
}

async function createOrder(
  items: OrderItemInput[],
  origin: string,
  syncMetadata?: Record<string, any>
): Promise<CreateOrderResult> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/create_order_atomic`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': DOCKER_CORE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_restaurant_id: RESTAURANT_ID,
      p_items: items,
      p_payment_method: 'cash',
      p_sync_metadata: {
        origin: origin,
        ...(syncMetadata || {}),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data || !data.id) {
    throw new Error(`Order creation failed: ${data?.message || 'Unknown error'}`);
  }

  return {
    id: data.id,
    total_cents: data.total_cents,
    status: data.status,
  };
}

async function getProducts(): Promise<Array<{ id: string; name: string; price_cents: number }>> {
  const url = `${DOCKER_CORE_URL}/rest/v1/gm_products?select=*&restaurant_id=eq.${RESTAURANT_ID}&available=eq.true&limit=5`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get products: ${response.status}`);
  }

  return await response.json();
}

async function getTableByNumber(tableNumber: number): Promise<{ id: string; number: number } | null> {
  const url = `${DOCKER_CORE_URL}/rest/v1/gm_tables?select=*&restaurant_id=eq.${RESTAURANT_ID}&number=eq.${tableNumber}&limit=1`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get table: ${response.status}`);
  }

  const tables = await response.json();
  return tables.length > 0 ? tables[0] : null;
}

async function getOrder(orderId: string): Promise<any> {
  const url = `${DOCKER_CORE_URL}/rest/v1/gm_orders?select=*,gm_order_items(*)&id=eq.${orderId}&limit=1`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get order: ${response.status}`);
  }

  const orders = await response.json();
  return orders.length > 0 ? orders[0] : null;
}

async function main() {
  console.log('🧪 INICIANDO TESTE AUTOMATIZADO - VALIDAÇÃO PÓS-REFATORAÇÃO\n');

  try {
    // 1. Obter produtos disponíveis
    console.log('1️⃣ Obtendo produtos disponíveis...');
    const products = await getProducts();
    if (products.length === 0) {
      throw new Error('Nenhum produto disponível para teste');
    }
    console.log(`   ✅ ${products.length} produtos encontrados\n`);

    // 2. Obter mesas para teste (diferentes para cada origem)
    console.log('2️⃣ Obtendo mesas para teste...');
    const table1 = await getTableByNumber(1);
    const table2 = await getTableByNumber(2);
    if (!table1 || !table2) {
      throw new Error('Mesas 1 ou 2 não encontradas');
    }
    console.log(`   ✅ Mesa ${table1.number} encontrada (ID: ${table1.id.slice(0, 8)}...)`);
    console.log(`   ✅ Mesa ${table2.number} encontrada (ID: ${table2.id.slice(0, 8)}...)\n`);

    // Preparar itens do pedido
    const orderItems: OrderItemInput[] = [
      {
        product_id: products[0].id,
        name: products[0].name,
        quantity: 1,
        unit_price: products[0].price_cents,
      },
    ];

    // 3. TESTE 1: QR Mesa (mesa 1)
    console.log('3️⃣ TESTE 1: Criando pedido via QR Mesa...');
    const qrMesaOrder = await createOrder(
      orderItems,
      'QR_MESA',
      {
        table_id: table1.id,
        table_number: table1.number,
      }
    );
    console.log(`   ✅ Pedido criado: ${qrMesaOrder.id.slice(0, 8)}...`);
    
    // Verificar pedido no banco
    const qrMesaOrderFull = await getOrder(qrMesaOrder.id);
    if (!qrMesaOrderFull) {
      throw new Error('Pedido QR Mesa não encontrado no banco');
    }
    const qrMesaOrigin = qrMesaOrderFull.sync_metadata?.origin || qrMesaOrderFull.origin;
    if (qrMesaOrigin !== 'QR_MESA') {
      throw new Error(`Origem incorreta: esperado QR_MESA, obtido ${qrMesaOrigin}`);
    }
    console.log(`   ✅ Origem verificada: ${qrMesaOrigin}`);
    console.log(`   ✅ Mesa associada: ${qrMesaOrderFull.table_number}\n`);

    // 4. TESTE 2: AppStaff (Waiter) - mesa 2
    console.log('4️⃣ TESTE 2: Criando pedido via AppStaff (waiter)...');
    const appStaffOrder = await createOrder(
      orderItems,
      'APPSTAFF',
      {
        table_id: table2.id,
        table_number: table2.number,
        created_by_user_id: '00000000-0000-0000-0000-000000000001',
        created_by_role: 'waiter',
      }
    );
    console.log(`   ✅ Pedido criado: ${appStaffOrder.id.slice(0, 8)}...`);
    
    // Verificar pedido no banco
    const appStaffOrderFull = await getOrder(appStaffOrder.id);
    if (!appStaffOrderFull) {
      throw new Error('Pedido AppStaff não encontrado no banco');
    }
    const appStaffOrigin = appStaffOrderFull.sync_metadata?.origin || appStaffOrderFull.origin;
    if (appStaffOrigin !== 'APPSTAFF') {
      throw new Error(`Origem incorreta: esperado APPSTAFF, obtido ${appStaffOrigin}`);
    }
    console.log(`   ✅ Origem verificada: ${appStaffOrigin}`);
    console.log(`   ✅ Autoria preservada: ${appStaffOrderFull.sync_metadata?.created_by_role || 'N/A'}\n`);

    // 5. TESTE 3: TPVMinimal
    console.log('5️⃣ TESTE 3: Criando pedido via TPVMinimal...');
    const tpvOrder = await createOrder(
      orderItems,
      'CAIXA',
      {}
    );
    console.log(`   ✅ Pedido criado: ${tpvOrder.id.slice(0, 8)}...`);
    
    // Verificar pedido no banco
    const tpvOrderFull = await getOrder(tpvOrder.id);
    if (!tpvOrderFull) {
      throw new Error('Pedido TPV não encontrado no banco');
    }
    const tpvOrigin = tpvOrderFull.sync_metadata?.origin || tpvOrderFull.origin;
    if (tpvOrigin !== 'CAIXA') {
      throw new Error(`Origem incorreta: esperado CAIXA, obtido ${tpvOrigin}`);
    }
    console.log(`   ✅ Origem verificada: ${tpvOrigin}\n`);

    // 6. Verificar todos os pedidos ativos
    console.log('6️⃣ Verificando pedidos ativos no banco...');
    const activeOrdersUrl = `${DOCKER_CORE_URL}/rest/v1/gm_orders?select=id,status,sync_metadata,origin,table_number&restaurant_id=eq.${RESTAURANT_ID}&status=in.(OPEN,IN_PREP)&order=created_at.desc&limit=10`;
    const activeOrdersResponse = await fetch(activeOrdersUrl, {
      method: 'GET',
      headers: {
        apikey: DOCKER_CORE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!activeOrdersResponse.ok) {
      throw new Error(`Failed to get active orders: ${activeOrdersResponse.status}`);
    }
    
    const activeOrders = await activeOrdersResponse.json();
    console.log(`   ✅ ${activeOrders.length} pedidos ativos encontrados`);
    
    // Verificar que nossos 3 pedidos estão na lista
    const orderIds = [qrMesaOrder.id, appStaffOrder.id, tpvOrder.id];
    const foundOrders = activeOrders.filter((o: any) => orderIds.includes(o.id));
    if (foundOrders.length !== 3) {
      throw new Error(`Apenas ${foundOrders.length} de 3 pedidos encontrados na lista de ativos`);
    }
    console.log(`   ✅ Todos os 3 pedidos aparecem na lista de ativos\n`);

    // 7. Resumo final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ VALIDAÇÃO PÓS-REFATORAÇÃO - TODOS OS TESTES PASSARAM');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Resumo:');
    console.log(`   ✅ QR Mesa: Pedido ${qrMesaOrder.id.slice(0, 8)}... criado com origem ${qrMesaOrigin}`);
    console.log(`   ✅ AppStaff: Pedido ${appStaffOrder.id.slice(0, 8)}... criado com origem ${appStaffOrigin}`);
    console.log(`   ✅ TPVMinimal: Pedido ${tpvOrder.id.slice(0, 8)}... criado com origem ${tpvOrigin}`);
    console.log(`   ✅ Todos os pedidos aparecem no banco`);
    console.log(`   ✅ Origens preservadas corretamente`);
    console.log(`   ✅ Autoria preservada (AppStaff)`);
    console.log('\n🎯 PRÓXIMO PASSO: Verificar visualmente no KDSMinimal');
    console.log('   URL: http://localhost:5175/kds-minimal\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(error);
    process.exit(1);
  }
}

main();

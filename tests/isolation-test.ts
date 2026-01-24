/**
 * Teste de Isolamento de Dados entre Restaurantes
 * 
 * Valida que RLS policies funcionam corretamente e que
 * restaurantes não podem acessar dados de outros restaurantes.
 * 
 * Executar: npx tsx tests/isolation-test.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testIsolation() {
  console.log('🧪 Iniciando testes de isolamento...\n');

  // 1. Criar 2 restaurantes de teste
  console.log('📋 Passo 1: Criar restaurantes de teste...');
  
  const { data: restaurantA, error: errorA } = await supabase
    .from('gm_restaurants')
    .insert({ name: 'Test Restaurant A', slug: 'test-restaurant-a' })
    .select()
    .single();

  if (errorA || !restaurantA) {
    results.push({ name: 'Criar restaurante A', passed: false, error: errorA?.message });
    console.error('❌ Erro ao criar restaurante A:', errorA);
    return;
  }

  const { data: restaurantB, error: errorB } = await supabase
    .from('gm_restaurants')
    .insert({ name: 'Test Restaurant B', slug: 'test-restaurant-b' })
    .select()
    .single();

  if (errorB || !restaurantB) {
    results.push({ name: 'Criar restaurante B', passed: false, error: errorB?.message });
    console.error('❌ Erro ao criar restaurante B:', errorB);
    return;
  }

  console.log(`✅ Restaurantes criados: A=${restaurantA.id}, B=${restaurantB.id}\n`);

  // 2. Criar dados em restaurante A
  console.log('📋 Passo 2: Criar dados em restaurante A...');
  
  const { data: productA, error: productErrorA } = await supabase
    .from('gm_products')
    .insert({
      restaurant_id: restaurantA.id,
      name: 'Product A',
      price_cents: 1000,
    })
    .select()
    .single();

  if (productErrorA || !productA) {
    results.push({ name: 'Criar produto em A', passed: false, error: productErrorA?.message });
    console.error('❌ Erro ao criar produto em A:', productErrorA);
    return;
  }

  const { data: orderA, error: orderErrorA } = await supabase
    .from('gm_orders')
    .insert({
      restaurant_id: restaurantA.id,
      table_number: '1',
      status: 'OPEN',
      total_amount: 1000,
    })
    .select()
    .single();

  if (orderErrorA || !orderA) {
    results.push({ name: 'Criar pedido em A', passed: false, error: orderErrorA?.message });
    console.error('❌ Erro ao criar pedido em A:', orderErrorA);
    return;
  }

  console.log(`✅ Dados criados em A: produto=${productA.id}, pedido=${orderA.id}\n`);

  // 3. Criar dados em restaurante B
  console.log('📋 Passo 3: Criar dados em restaurante B...');
  
  const { data: productB, error: productErrorB } = await supabase
    .from('gm_products')
    .insert({
      restaurant_id: restaurantB.id,
      name: 'Product B',
      price_cents: 2000,
    })
    .select()
    .single();

  if (productErrorB || !productB) {
    results.push({ name: 'Criar produto em B', passed: false, error: productErrorB?.message });
    console.error('❌ Erro ao criar produto em B:', productErrorB);
    return;
  }

  console.log(`✅ Dados criados em B: produto=${productB.id}\n`);

  // 4. Criar usuários de teste e associar a restaurantes
  console.log('📋 Passo 4: Criar usuários de teste...');
  
  // Criar usuário A (via service role)
  const { data: userA, error: userErrorA } = await supabase.auth.admin.createUser({
    email: `test-user-a-${Date.now()}@test.com`,
    password: 'test123456',
    email_confirm: true,
  });

  if (userErrorA || !userA?.user) {
    results.push({ name: 'Criar usuário A', passed: false, error: userErrorA?.message });
    console.error('❌ Erro ao criar usuário A:', userErrorA);
    return;
  }

  // Criar usuário B
  const { data: userB, error: userErrorB } = await supabase.auth.admin.createUser({
    email: `test-user-b-${Date.now()}@test.com`,
    password: 'test123456',
    email_confirm: true,
  });

  if (userErrorB || !userB?.user) {
    results.push({ name: 'Criar usuário B', passed: false, error: userErrorB?.message });
    console.error('❌ Erro ao criar usuário B:', userErrorB);
    return;
  }

  // Associar usuário A ao restaurante A
  const { error: memberErrorA } = await supabase
    .from('gm_restaurant_members')
    .insert({
      restaurant_id: restaurantA.id,
      user_id: userA.user.id,
      role: 'owner',
    });

  if (memberErrorA) {
    results.push({ name: 'Associar usuário A', passed: false, error: memberErrorA.message });
    console.error('❌ Erro ao associar usuário A:', memberErrorA);
    return;
  }

  // Associar usuário B ao restaurante B
  const { error: memberErrorB } = await supabase
    .from('gm_restaurant_members')
    .insert({
      restaurant_id: restaurantB.id,
      user_id: userB.user.id,
      role: 'owner',
    });

  if (memberErrorB) {
    results.push({ name: 'Associar usuário B', passed: false, error: memberErrorB.message });
    console.error('❌ Erro ao associar usuário B:', memberErrorB);
    return;
  }

  console.log(`✅ Usuários criados e associados\n`);

  // 5. Testar isolamento via RLS (usando clientes autenticados)
  console.log('📋 Passo 5: Testar isolamento via RLS...');

  // Cliente autenticado como usuário A
  const supabaseUserA = createClient(SUPABASE_URL, SUPABASE_URL, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userA.session?.access_token || ''}`,
      },
    },
  });

  // Cliente autenticado como usuário B
  const supabaseUserB = createClient(SUPABASE_URL, SUPABASE_URL, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userB.session?.access_token || ''}`,
      },
    },
  });

  // Teste: Usuário A não deve ver produtos de B
  const { data: productsFromA, error: productsErrorA } = await supabaseUserA
    .from('gm_products')
    .select('*');

  if (productsErrorA) {
    results.push({ name: 'Buscar produtos como A', passed: false, error: productsErrorA.message });
    console.error('❌ Erro ao buscar produtos como A:', productsErrorA);
  } else {
    const hasProductB = productsFromA?.some(p => p.id === productB.id);
    if (hasProductB) {
      results.push({ 
        name: 'Isolamento de produtos (RLS)', 
        passed: false, 
        error: 'Usuário A conseguiu ver produto de B via RLS' 
      });
      console.error('❌ FALHA: Usuário A conseguiu ver produto de B');
    } else {
      const hasProductA = productsFromA?.some(p => p.id === productA.id);
      if (hasProductA) {
        results.push({ name: 'Isolamento de produtos (RLS)', passed: true });
        console.log('✅ Isolamento de produtos via RLS: OK');
      } else {
        results.push({ 
          name: 'Isolamento de produtos (RLS)', 
          passed: false, 
          error: 'Usuário A não vê seus próprios produtos' 
        });
      }
    }
  }

  // Teste: Usuário B não deve ver produtos de A
  const { data: productsFromB, error: productsErrorB } = await supabaseUserB
    .from('gm_products')
    .select('*');

  if (productsErrorB) {
    results.push({ name: 'Buscar produtos como B', passed: false, error: productsErrorB.message });
    console.error('❌ Erro ao buscar produtos como B:', productsErrorB);
  } else {
    const hasProductA = productsFromB?.some(p => p.id === productA.id);
    if (hasProductA) {
      results.push({ 
        name: 'Isolamento reverso (RLS)', 
        passed: false, 
        error: 'Usuário B conseguiu ver produto de A via RLS' 
      });
      console.error('❌ FALHA: Usuário B conseguiu ver produto de A');
    } else {
      const hasProductB = productsFromB?.some(p => p.id === productB.id);
      if (hasProductB) {
        results.push({ name: 'Isolamento reverso (RLS)', passed: true });
        console.log('✅ Isolamento reverso via RLS: OK');
      }
    }
  }

  // 6. Limpar dados de teste
  console.log('\n📋 Passo 6: Limpar dados de teste...');
  
  // Limpar associações
  await supabase.from('gm_restaurant_members').delete().eq('restaurant_id', restaurantA.id);
  await supabase.from('gm_restaurant_members').delete().eq('restaurant_id', restaurantB.id);
  
  // Limpar dados
  await supabase.from('gm_orders').delete().eq('id', orderA.id);
  await supabase.from('gm_products').delete().eq('id', productA.id);
  await supabase.from('gm_products').delete().eq('id', productB.id);
  
  // Limpar restaurantes
  await supabase.from('gm_restaurants').delete().eq('id', restaurantA.id);
  await supabase.from('gm_restaurants').delete().eq('id', restaurantB.id);
  
  // Limpar usuários
  if (userA?.user?.id) {
    await supabase.auth.admin.deleteUser(userA.user.id);
  }
  if (userB?.user?.id) {
    await supabase.auth.admin.deleteUser(userB.user.id);
  }

  console.log('✅ Dados de teste removidos\n');

  // 7. Resumo
  console.log('📊 Resumo dos Testes:');
  console.log('─'.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      passed++;
    } else {
      console.log(`❌ ${result.name}: ${result.error}`);
      failed++;
    }
  });

  console.log('─'.repeat(50));
  console.log(`Total: ${results.length} | Passou: ${passed} | Falhou: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Testes de isolamento FALHARAM');
    process.exit(1);
  } else {
    console.log('\n✅ Todos os testes de isolamento PASSARAM');
    process.exit(0);
  }
}

// Executar testes
testIsolation().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

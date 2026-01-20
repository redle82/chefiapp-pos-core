# Teste Direto - Criar Funcionário

## Execute este código no Console do Navegador (F12)

Cole este código completo no console e pressione Enter:

```javascript
(async function testeCriarFuncionario() {
    console.log('=== TESTE DIRETO: CRIAR FUNCIONÁRIO ===\n');
    
    // 1. Importar supabase
    const { supabase } = await import('/src/core/supabase/index.ts');
    console.log('✅ Supabase importado');
    
    // 2. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('❌ ERRO: Usuário não autenticado', authError);
        return;
    }
    console.log('✅ Usuário autenticado:', user.email);
    
    // 3. Obter tenantId
    const tenantId = sessionStorage.getItem('chefiapp_restaurant_id') || 
                     localStorage.getItem('chefiapp_restaurant_id') ||
                     new URLSearchParams(window.location.search).get('tenant_id');
    
    if (!tenantId) {
        console.error('❌ ERRO: tenantId não encontrado');
        console.log('   Verifique sessionStorage/localStorage ou selecione um restaurante');
        return;
    }
    console.log('✅ Tenant ID:', tenantId);
    
    // 4. Verificar se a tabela existe
    console.log('\n--- Teste 1: Verificar se tabela existe ---');
    const { data: testData, error: testError } = await supabase
        .from('employees')
        .select('id')
        .limit(1);
    
    if (testError) {
        console.error('❌ ERRO ao acessar tabela employees:');
        console.error('   Código:', testError.code);
        console.error('   Mensagem:', testError.message);
        console.error('   Detalhes:', testError.details);
        console.error('   Hint:', testError.hint);
        
        if (testError.code === '42P01') {
            console.error('\n⚠️ SOLUÇÃO: A tabela não existe!');
            console.error('   Aplique a migração: supabase/migrations/20260130000000_create_employees_table.sql');
        } else if (testError.code === '42501' || testError.message.includes('permission denied')) {
            console.error('\n⚠️ SOLUÇÃO: Problema de permissão RLS!');
            console.error('   Verifique se você é owner ou manager do restaurante');
        }
        return;
    }
    console.log('✅ Tabela employees existe e é acessível');
    
    // 5. Verificar permissão SELECT
    console.log('\n--- Teste 2: Verificar permissão SELECT ---');
    const { data: selectData, error: selectError } = await supabase
        .from('employees')
        .select('*')
        .eq('restaurant_id', tenantId)
        .limit(5);
    
    if (selectError) {
        console.error('❌ ERRO ao fazer SELECT:');
        console.error('   Código:', selectError.code);
        console.error('   Mensagem:', selectError.message);
        return;
    }
    console.log('✅ Permissão SELECT OK');
    console.log('   Funcionários encontrados:', selectData?.length || 0);
    
    // 6. Verificar seu papel no restaurante
    console.log('\n--- Teste 3: Verificar seu papel no restaurante ---');
    const { data: membership, error: membershipError } = await supabase
        .from('restaurant_members')
        .select('role, restaurant_id')
        .eq('user_id', user.id)
        .eq('restaurant_id', tenantId)
        .maybeSingle();
    
    if (membershipError) {
        console.warn('⚠️ Não foi possível verificar membership:', membershipError.message);
    } else if (membership) {
        console.log('✅ Você é:', membership.role, 'do restaurante');
        if (!['owner', 'manager'].includes(membership.role)) {
            console.error('❌ ERRO: Você precisa ser owner ou manager para criar funcionários');
            return;
        }
    } else {
        console.warn('⚠️ Membership não encontrado - verificando se você é owner...');
        const { data: restaurant } = await supabase
            .from('gm_restaurants')
            .select('owner_id')
            .eq('id', tenantId)
            .single();
        
        if (restaurant?.owner_id === user.id) {
            console.log('✅ Você é o owner do restaurante');
        } else {
            console.error('❌ ERRO: Você não tem permissão para criar funcionários neste restaurante');
            return;
        }
    }
    
    // 7. Teste de INSERT
    console.log('\n--- Teste 4: Tentar criar funcionário de teste ---');
    const testEmployee = {
        restaurant_id: tenantId,
        name: 'TESTE ' + Date.now(),
        role: 'worker',
        position: 'waiter',
        active: true
    };
    
    console.log('Dados a inserir:', testEmployee);
    
    const { data: insertData, error: insertError } = await supabase
        .from('employees')
        .insert(testEmployee)
        .select()
        .single();
    
    if (insertError) {
        console.error('❌ ERRO ao inserir funcionário:');
        console.error('   Código:', insertError.code);
        console.error('   Mensagem:', insertError.message);
        console.error('   Detalhes:', insertError.details);
        console.error('   Hint:', insertError.hint);
        
        if (insertError.code === '42501' || insertError.message.includes('permission denied')) {
            console.error('\n⚠️ SOLUÇÃO: Problema de permissão RLS na política de INSERT');
            console.error('   Verifique a política "Owners and managers can create employees"');
        } else if (insertError.code === 'PGRST301') {
            console.error('\n⚠️ SOLUÇÃO: Política RLS bloqueou a inserção');
            console.error('   Verifique se a política WITH CHECK está correta');
        }
        return;
    }
    
    console.log('✅ FUNCIONÁRIO CRIADO COM SUCESSO!');
    console.log('   ID:', insertData.id);
    console.log('   Nome:', insertData.name);
    
    // 8. Limpar o funcionário de teste
    console.log('\n--- Limpando funcionário de teste ---');
    await supabase
        .from('employees')
        .update({ active: false })
        .eq('id', insertData.id);
    console.log('✅ Funcionário de teste desativado');
    
    console.log('\n=== TESTE CONCLUÍDO ===');
    console.log('✅ Se chegou até aqui, o problema está no código React, não no banco de dados');
})();
```

## Como usar

1. Abra o console do navegador (F12 → Console)
2. Cole o código acima
3. Pressione Enter
4. Leia os resultados

## O que cada teste verifica

1. **Supabase importado**: Verifica se o cliente está disponível
2. **Autenticação**: Verifica se você está logado
3. **Tenant ID**: Verifica se há um restaurante selecionado
4. **Tabela existe**: Verifica se a tabela `employees` existe
5. **Permissão SELECT**: Verifica se você pode ler funcionários
6. **Seu papel**: Verifica se você é owner ou manager
7. **Teste INSERT**: Tenta criar um funcionário de teste
8. **Limpeza**: Remove o funcionário de teste

## Resultados esperados

- Se todos os testes passarem: O problema está no código React
- Se algum teste falhar: O problema está no banco de dados ou permissões

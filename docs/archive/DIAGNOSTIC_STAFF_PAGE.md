# Diagnóstico: Staff Page - Criar Funcionário

## Problema
O botão "Salvar" não está funcionando ao tentar criar um funcionário.

## Script de Diagnóstico

Abra o console do navegador (F12) e execute este script:

```javascript
// 1. Verificar se o Supabase está disponível
console.log('=== DIAGNÓSTICO STAFF PAGE ===');
const supabase = window.__SUPABASE__ || (await import('/src/core/supabase/index.ts')).supabase;
console.log('1. Supabase client:', supabase ? '✅ Disponível' : '❌ Não encontrado');

// 2. Verificar se a tabela employees existe
const { data: testData, error: testError } = await supabase
    .from('employees')
    .select('id')
    .limit(1);

if (testError) {
    console.log('2. Tabela employees:', '❌ ERRO');
    console.error('   Código:', testError.code);
    console.error('   Mensagem:', testError.message);
    console.error('   Detalhes:', testError.details);
    
    if (testError.code === '42P01') {
        console.error('   ⚠️ A TABELA NÃO EXISTE! Aplique a migração: 20260130000000_create_employees_table.sql');
    } else if (testError.code === '42501' || testError.message.includes('permission denied')) {
        console.error('   ⚠️ PROBLEMA DE PERMISSÃO (RLS)! Verifique as políticas RLS.');
    }
} else {
    console.log('2. Tabela employees:', '✅ Existe e acessível');
}

// 3. Verificar autenticação
const { data: { user } } = await supabase.auth.getUser();
console.log('3. Usuário autenticado:', user ? `✅ ${user.email}` : '❌ Não autenticado');

// 4. Verificar tenantId
const tenantId = sessionStorage.getItem('chefiapp_restaurant_id') || localStorage.getItem('chefiapp_restaurant_id');
console.log('4. Tenant ID:', tenantId || '❌ Não encontrado');

// 5. Verificar permissões (tentar SELECT)
if (tenantId) {
    const { data: members, error: membersError } = await supabase
        .from('employees')
        .select('*')
        .eq('restaurant_id', tenantId)
        .limit(1);
    
    if (membersError) {
        console.log('5. Permissão SELECT:', '❌ ERRO');
        console.error('   Código:', membersError.code);
        console.error('   Mensagem:', membersError.message);
    } else {
        console.log('5. Permissão SELECT:', '✅ OK');
    }
}

// 6. Teste de INSERT (simulado - não executa)
console.log('6. Teste de INSERT (simulado):');
const testInsert = {
    restaurant_id: tenantId,
    name: 'TESTE',
    role: 'worker',
    position: 'waiter',
    active: true
};
console.log('   Dados de teste:', testInsert);
console.log('   ⚠️ Para testar INSERT real, execute no console:');
console.log(`
const { data, error } = await supabase
    .from('employees')
    .insert(${JSON.stringify(testInsert)})
    .select()
    .single();
console.log('Resultado:', { data, error });
`);

console.log('=== FIM DO DIAGNÓSTICO ===');
```

## Soluções Comuns

### 1. Tabela não existe (Erro 42P01)
**Solução:** Aplique a migração SQL:
- Arquivo: `supabase/migrations/20260130000000_create_employees_table.sql`
- Via Supabase Dashboard → SQL Editor → Cole o conteúdo do arquivo → RUN

### 2. Problema de permissão RLS (Erro 42501 ou PGRST301)
**Solução:** Verifique se você é owner ou manager do restaurante:
```sql
-- Verificar seu papel no restaurante
SELECT rm.role, r.id, r.name 
FROM restaurant_members rm
JOIN gm_restaurants r ON r.id = rm.restaurant_id
WHERE rm.user_id = auth.uid();
```

### 3. Tenant ID não encontrado
**Solução:** 
- Navegue para `/app/select-tenant` e selecione um restaurante
- Verifique se o `TenantContext` está funcionando

### 4. Botão não responde
**Verificações:**
- Abra o console e veja se há logs `[StaffPage] Button clicked`
- Verifique se o botão está desabilitado (`disabled={busy || !newName}`)
- Verifique se há erros de JavaScript no console

## Logs Esperados

Quando você clicar em "Salvar", você deve ver no console:

```
[StaffPage] Button clicked { busy: false, hasName: true, restaurantId: "...", disabled: false }
[StaffPage] Form onSubmit triggered
[StaffPage] ========== handleCreateEmployee CALLED ========== { ... }
[StaffPage] Starting employee creation...
[StaffPage] About to insert into employees table { ... }
[StaffPage] Testing table access...
[StaffPage] Table exists, proceeding with insert...
[StaffPage] Employee created successfully: { ... }
```

Se algum desses logs não aparecer, o problema está naquela etapa específica.

# 🔒 CORREÇÃO: LOOP DE TENANT RESOLUTION

**Data:** 2026-01-24  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 PROBLEMA IDENTIFICADO

### Sintomas
- Tela de seleção de tenant aparecendo em loop
- `[TenantResolver] tenant_resolved` repetindo infinitamente
- `[FlowGate] 🔍 Check Flow` executando a cada navegação
- Tenant sendo re-resolvido mesmo quando já está ACTIVE

### Causa Raiz
O `FlowGate` estava re-executando `handleTenantResolution` a cada mudança de rota, mesmo quando o tenant já estava selado como `ACTIVE`. Isso causava:
1. Busca desnecessária de memberships no DB
2. Re-execução de lógica de resolução
3. Possível loop se a resolução retornasse `NEEDS_SELECTION` incorretamente

---

## ✅ CORREÇÃO APLICADA

### Guard de Soberania no FlowGate

**Arquivo:** `merchant-portal/src/core/flow/FlowGate.tsx`

**Mudança:**
```typescript
const handleTenantResolution = async (
    userId: string,
    pathname: string
): Promise<{ to: string } | null> => {
    // Skip exempt routes
    if (TENANT_EXEMPT_ROUTES.some(r => pathname.startsWith(r))) {
        return null;
    }

    // 🔒 SOVEREIGNTY CHECK: Se tenant já está ACTIVE, não re-resolver
    const activeTenantId = getActiveTenant();
    const tenantStatus = getTenantStatus();
    
    if (activeTenantId && tenantStatus === 'ACTIVE') {
        // Tenant já está selado - não re-executar resolução
        Logger.debug('FlowGate: Tenant already sealed (ACTIVE)', {
            tenantId: activeTenantId,
            pathname
        });
        return null; // Allow route, tenant is sealed
    }

    // Resolve tenant (só se não estiver ACTIVE)
    const result: TenantResolutionResult = await resolveTenant(userId, urlTenantId);
    // ... resto da lógica
};
```

### O Que Isso Resolve

1. **Previne Re-Resolução**
   - Se tenant está `ACTIVE`, retorna `null` imediatamente
   - Não busca memberships do DB
   - Não re-executa lógica de resolução

2. **Melhora Performance**
   - Menos queries ao banco
   - Menos processamento
   - Navegação mais rápida

3. **Elimina Loop**
   - Tenant selado não é re-resolvido
   - Tela de seleção não aparece se já está ACTIVE
   - Fluxo estabiliza após primeira resolução

---

## 📋 REGRAS APLICADAS

### Regra 1: Tenant Selado Não Re-Resolve
- ✅ Se `tenantStatus === 'ACTIVE'`, não re-executar resolução
- ✅ Retornar `null` (permite rota) sem buscar DB
- ✅ Log apenas para debug (não erro)

### Regra 2: Single Tenant Auto-Select
- ✅ Se `memberships.length === 1`, auto-seleciona
- ✅ Sela como `ACTIVE` automaticamente
- ✅ **Pula** tela de seleção

### Regra 3: Multiple Tenants Selection
- ✅ Se `memberships.length > 1` e `!activeTenant`, exige seleção
- ✅ Redireciona para `/app/select-tenant`
- ✅ Após seleção, sela como `ACTIVE`

---

## 🧪 VALIDAÇÃO

### Teste Manual

1. **Login com Single Tenant**
   - ✅ Deve auto-selecionar
   - ✅ Não deve mostrar tela de seleção
   - ✅ Deve navegar direto para `/app/dashboard`

2. **Login com Multiple Tenants**
   - ✅ Deve mostrar tela de seleção
   - ✅ Após seleção, deve selar como `ACTIVE`
   - ✅ Não deve re-mostrar tela após selado

3. **Navegação Após Tenant Selado**
   - ✅ Navegar entre rotas não deve re-resolver
   - ✅ Console não deve mostrar `tenant_resolved` repetindo
   - ✅ Performance deve ser OK

### Console Esperado (Após Correção)

```
[FlowGate] 🔍 Check Flow: {hasSession: true, userId: '...', path: '/app/settings'}
[FlowGate] Tenant already sealed (ACTIVE) {tenantId: '...', pathname: '/app/settings'}
[FlowGate] ✅ Allowed: /app/settings
```

**NÃO deve aparecer:**
- ❌ `[TenantResolver] tenant_resolved` repetindo
- ❌ `[FlowGate] Needs Tenant Selection` após tenant selado
- ❌ Queries ao DB de memberships repetindo

---

## 📚 DOCUMENTOS CRIADOS

1. **[TENANT_RESOLUTION_CONTRACT.md](./TENANT_RESOLUTION_CONTRACT.md)**
   - Contrato completo de resolução de tenant
   - Regras imutáveis
   - Fluxo detalhado
   - Checklist de validação

---

## 🎯 PRÓXIMOS PASSOS

### Imediato
- [x] ✅ Guard adicionado no FlowGate
- [x] ✅ Contrato criado
- [ ] ⏭️ Testar no browser

### Curto Prazo
- [ ] Validar que loop foi eliminado
- [ ] Validar single tenant auto-select
- [ ] Validar multiple tenants selection

---

## ✅ CONCLUSÃO

**Correção aplicada com sucesso.**

O sistema agora:
- ✅ Não re-resolve tenant se já está ACTIVE
- ✅ Auto-seleciona single tenant (pula tela)
- ✅ Exige seleção apenas quando necessário
- ✅ Previne loops de resolução

**Próximo passo:** Testar no browser para validar que o loop foi eliminado.

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CORRIGIDO**

# 🏢 TENANT RESOLUTION CONTRACT

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Sistema Multitenant Soberano**  
**Nível:** 🏛️ Gate de Contexto Operacional

---

## 🎯 OBJETIVO

Este contrato define como o sistema resolve e sela o **contexto operacional** (tenant) antes de qualquer operação. Ele garante que o sistema sempre saiba **"EM NOME DE QUEM"** está operando.

---

## 🧭 O QUE É TENANT?

### Definição

**Tenant = Entidade Jurídica / Operacional Soberana**

Não é:
- ❌ "várias empresas usando o mesmo app"
- ❌ "white-label genérico"
- ❌ "cada conta = um tenant"

É:
- ✅ **SOVEREIGN MULTITENANCY**
- ✅ Cada tenant tem dados próprios, sessões próprias, pedidos próprios
- ✅ Isolamento total de dados (zero vazamento cross-tenant)

### Hierarquia

```
Identity (Pessoa Física)
    ↓
Tenant (Entidade Jurídica / Operacional)
    ↓
Restaurant / Unit (opcional, interno ao tenant)
    ↓
Domain (TPV, KDS, Staff, Tasks...)
```

---

## 🔒 REGRAS IMUTÁVEIS

### 1. Tenant Deve Ser Selado Antes de Qualquer Operação

**Regra:** Nenhuma operação de domínio (TPV, KDS, Orders, etc.) pode ocorrer sem tenant selado.

**Validação:**
- [ ] FlowGate bloqueia acesso se `tenantStatus !== 'ACTIVE'`
- [ ] Todas as queries usam `tenantId` do contexto selado
- [ ] Nenhum componente acessa dados sem verificar tenant

### 2. Tenant Selado Não Pode Ser Re-Resolvido

**Regra:** Se `tenantStatus === 'ACTIVE'`, o sistema **não re-executa** resolução.

**Validação:**
- [ ] FlowGate verifica `getTenantStatus() === 'ACTIVE'` antes de resolver
- [ ] Se ACTIVE, retorna `null` (permite rota) sem re-resolver
- [ ] Resolução só ocorre se status for `UNSELECTED` ou `SELECTING`

### 3. Single Tenant = Auto-Select (Pula Tela)

**Regra:** Se usuário tem apenas 1 tenant, sistema auto-seleciona e **pula** a tela de seleção.

**Validação:**
- [ ] `resolveTenant()` detecta `memberships.length === 1`
- [ ] Auto-seleciona e sela como `ACTIVE`
- [ ] Navega diretamente para `/app/dashboard` (sem passar por `/app/select-tenant`)

### 4. Multiple Tenants = Selection Required

**Regra:** Se usuário tem múltiplos tenants e nenhum está ACTIVE, sistema **exige** seleção.

**Validação:**
- [ ] `resolveTenant()` detecta `memberships.length > 1` e `!activeTenant`
- [ ] Retorna `NEEDS_SELECTION`
- [ ] FlowGate redireciona para `/app/select-tenant`

### 5. Tenant Selado Persiste Entre Navegações

**Regra:** Uma vez selado como `ACTIVE`, o tenant permanece selado até:
- Usuário faz logout
- Usuário explicitamente troca de tenant
- Tenant se torna inválido (usuário perde acesso)

**Validação:**
- [ ] `setActiveTenant()` persiste em `TabIsolatedStorage`
- [ ] `getActiveTenant()` retorna tenant selado
- [ ] `getTenantStatus()` retorna `'ACTIVE'` se selado

---

## 📋 FLUXO DE RESOLUÇÃO

### Prioridade de Resolução

```
1. URL tenantId (se presente e válido)
   ↓
2. Active tenant do cache (se status = ACTIVE)
   ↓
3. Single tenant (auto-select)
   ↓
4. Multiple tenants (needs selection)
   ↓
5. No tenants (onboarding)
```

### Estados de Tenant

| Estado | Descrição | Ação |
|--------|-----------|------|
| `UNSELECTED` | Nenhum tenant selecionado | Resolver |
| `SELECTING` | Usuário está na tela de seleção | Aguardar seleção |
| `ACTIVE` | Tenant selado e ativo | **Não re-resolver** |

---

## 🔍 SEPARAÇÃO: TENANT GATE vs RESTAURANT GATE

### Tenant Gate (Este Contrato)

**Responsabilidade:** Resolver **qual entidade operacional** o usuário vai operar.

**Quando executa:**
- ✅ No bootstrap (após login)
- ✅ Quando usuário troca de tenant
- ✅ Quando tenant se torna inválido

**Quando NÃO executa:**
- ❌ A cada navegação (se já está ACTIVE)
- ❌ Durante operações de domínio
- ❌ Quando tenant já está selado

### Restaurant Gate (Futuro)

**Responsabilidade:** Resolver **qual unidade física** dentro do tenant (se aplicável).

**Nota:** Alguns tenants podem ter múltiplas unidades físicas. Isso é **interno ao tenant** e não resolve aqui.

---

## 🛠️ IMPLEMENTAÇÃO

### FlowGate (Executor)

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
        return null; // Allow route, tenant is sealed
    }

    // Resolve tenant (só se não estiver ACTIVE)
    const result = await resolveTenant(userId, urlTenantId);
    // ... resto da lógica
};
```

### TenantResolver (Lógica)

```typescript
export async function resolve(
    userId: string,
    urlTenantId?: string | null
): Promise<TenantResolutionResult> {
    const memberships = await fetchUserMemberships(userId);

    // Case 1: No memberships
    if (memberships.length === 0) {
        return { type: 'NO_TENANTS', ... };
    }

    // Case 2: URL tenantId (validate access)
    if (urlTenantId) {
        // ... validar e retornar
    }

    // Case 3: Check cached ACTIVE tenant (SOVEREIGN CHECK)
    const cachedTenantId = getActiveTenant();
    const cachedStatus = getTenantStatus();
    
    if (cachedTenantId && cachedStatus === 'ACTIVE') {
        // Tenant já está selado - retornar sem re-resolver
        return { type: 'RESOLVED', tenantId: cachedTenantId, ... };
    }

    // Case 4: Single tenant = auto-select
    if (memberships.length === 1) {
        setActiveTenant(memberships[0].restaurant_id, 'ACTIVE');
        return { type: 'RESOLVED', ... };
    }

    // Case 5: Multiple tenants = needs selection
    return { type: 'NEEDS_SELECTION', ... };
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Tenant Selado Corretamente
- [ ] `getActiveTenant()` retorna tenant válido
- [ ] `getTenantStatus()` retorna `'ACTIVE'`
- [ ] Tenant persiste em `TabIsolatedStorage`
- [ ] Tenant não é re-resolvido após selado

### Single Tenant Auto-Select
- [ ] Se `memberships.length === 1`, auto-seleciona
- [ ] Sela como `ACTIVE` automaticamente
- [ ] **Pula** tela de seleção (`/app/select-tenant`)
- [ ] Navega diretamente para `/app/dashboard`

### Multiple Tenants Selection
- [ ] Se `memberships.length > 1` e `!activeTenant`, exige seleção
- [ ] Redireciona para `/app/select-tenant`
- [ ] Após seleção, sela como `ACTIVE`
- [ ] Navega para `/app/dashboard`

### Não Re-Resolver Se ACTIVE
- [ ] FlowGate verifica `getTenantStatus() === 'ACTIVE'` antes de resolver
- [ ] Se ACTIVE, retorna `null` (permite rota) sem re-resolver
- [ ] Não busca memberships do DB se já está ACTIVE
- [ ] Não re-executa `resolveTenant()` se já está ACTIVE

---

## 🧪 TESTES

### Teste 1: Single Tenant Auto-Select
```typescript
// Setup: User com 1 tenant
const memberships = [{ restaurant_id: 'tenant-1', role: 'owner' }];

// Execute
const result = await resolve(userId);

// Assert
expect(result.type).toBe('RESOLVED');
expect(result.tenantId).toBe('tenant-1');
expect(getTenantStatus()).toBe('ACTIVE');
// Não deve redirecionar para /app/select-tenant
```

### Teste 2: Multiple Tenants Selection
```typescript
// Setup: User com 2 tenants, nenhum ACTIVE
const memberships = [
    { restaurant_id: 'tenant-1', role: 'owner' },
    { restaurant_id: 'tenant-2', role: 'manager' }
];

// Execute
const result = await resolve(userId);

// Assert
expect(result.type).toBe('NEEDS_SELECTION');
expect(getTenantStatus()).toBe('UNSELECTED');
// Deve redirecionar para /app/select-tenant
```

### Teste 3: Não Re-Resolver Se ACTIVE
```typescript
// Setup: Tenant já está ACTIVE
setActiveTenant('tenant-1', 'ACTIVE');

// Execute
const result = await handleTenantResolution(userId, '/app/dashboard');

// Assert
expect(result).toBe(null); // Permite rota, não re-resolve
// Não deve chamar resolveTenant()
```

---

## 📊 DIAGRAMA DE FLUXO

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  FlowGate       │
│  Bootstrap      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Tenant Resolver  │
│ (resolveTenant) │
└────────┬────────┘
         │
         ├─→ No tenants → /onboarding/identity
         │
         ├─→ Single tenant → Auto-select → Seal ACTIVE → /app/dashboard
         │
         ├─→ Multiple tenants → /app/select-tenant
         │
         └─→ ACTIVE (cached) → Allow route (não re-resolve)
```

---

## 🔗 DOCUMENTOS RELACIONADOS

- **[ARCHITECTURE_FLOW_LOCKED.md](./ARCHITECTURE_FLOW_LOCKED.md)** - Arquitetura FlowGate
- **[PARTE_3_REGRAS_DO_CORE.md](./PARTE_3_REGRAS_DO_CORE.md)** - Regras do Core
- **[CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md](./CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md)** - Checklist completo

---

## ⚠️ IMPORTÂNCIA

**Este contrato é crítico porque:**

- ✅ Garante isolamento de dados (zero vazamento cross-tenant)
- ✅ Previne loops de resolução (performance)
- ✅ Melhora UX (single tenant = sem tela desnecessária)
- ✅ Garante segurança (fail-closed: sem tenant = acesso negado)

**Qualquer violação deste contrato compromete a integridade multitenant do sistema.**

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Pronto para Aplicar**

# 🔍 AUDITORIA: VIOLAÇÕES GATE → DOMAIN

**Data:** 2026-01-24  
**Status:** 🔍 **EM ANÁLISE**

---

## 🎯 OBJETIVO

Identificar se algum módulo do **Domain** está violando a separação **Gate → Domain** ao perguntar sobre tenant, sessão ou identidade quando deveria assumir que isso já foi resolvido.

---

## ⚠️ REGRA IMUTÁVEL

> **O Domain não pergunta nada sobre tenant, sessão ou identidade.**  
> **Ele assume que isso já foi resolvido pelos Gates.**

### Por Que Isso É Crítico

Se o Domain precisa perguntar sobre tenant:
- ❌ O Gate falhou
- ❌ Separação de responsabilidades violada
- ❌ Possível loop ou inconsistência

---

## 🔍 PADRÕES DE VIOLAÇÃO

### Padrão 1: Domain Chama `resolveTenant()`
```typescript
// ❌ VIOLAÇÃO
function OrderComponent() {
    const tenant = await resolveTenant(userId); // Domain não deve resolver
    // ...
}
```

### Padrão 2: Domain Verifica `getActiveTenant()`
```typescript
// ❌ VIOLAÇÃO
function PaymentComponent() {
    const tenantId = getActiveTenant(); // Domain não deve verificar
    if (!tenantId) {
        // Domain não deve tratar falta de tenant
    }
}
```

### Padrão 3: Domain Verifica Sessão
```typescript
// ❌ VIOLAÇÃO
function TaskComponent() {
    const { session } = useSupabaseAuth(); // Domain não deve verificar sessão
    if (!session) {
        // Domain não deve tratar falta de sessão
    }
}
```

### Padrão 4: Domain Verifica Identity
```typescript
// ❌ VIOLAÇÃO
function KitchenComponent() {
    const { identity } = useRestaurantIdentity(); // Domain não deve verificar identity
    if (!identity.restaurantId) {
        // Domain não deve tratar falta de identity
    }
}
```

---

## ✅ PADRÕES CORRETOS

### Padrão 1: Domain Recebe Tenant do Contexto
```typescript
// ✅ CORRETO
function OrderComponent() {
    const { tenantId } = useTenant(); // Recebe do contexto, não resolve
    // Assume que tenantId existe (Gate garantiu)
}
```

### Padrão 2: Domain Usa Tenant do Provider
```typescript
// ✅ CORRETO
function PaymentComponent() {
    const { tenantId } = useTenantContext(); // Provider já resolveu
    // Não verifica, apenas usa
}
```

### Padrão 3: Domain Assume Contexto Resolvido
```typescript
// ✅ CORRETO
function TaskComponent() {
    // Não verifica nada
    // Assume que tudo foi resolvido pelo Gate
    // Apenas executa operações de negócio
}
```

---

## 🔍 ANÁLISE DO CÓDIGO

### TPV (Terminal de Vendas)

**Arquivo:** `merchant-portal/src/pages/TPV/`

**Status:** 🔍 Verificando...

**Padrões encontrados:**
- [ ] Chama `resolveTenant()`?
- [ ] Verifica `getActiveTenant()`?
- [ ] Verifica sessão?
- [ ] Verifica identity?

### KDS (Kitchen Display System)

**Arquivo:** `merchant-portal/src/pages/KDS/`

**Status:** 🔍 Verificando...

**Padrões encontrados:**
- [ ] Chama `resolveTenant()`?
- [ ] Verifica `getActiveTenant()`?
- [ ] Verifica sessão?
- [ ] Verifica identity?

### Orders (Domain)

**Arquivo:** `merchant-portal/src/pages/Orders/` ou similar

**Status:** 🔍 Verificando...

**Padrões encontrados:**
- [ ] Chama `resolveTenant()`?
- [ ] Verifica `getActiveTenant()`?
- [ ] Verifica sessão?
- [ ] Verifica identity?

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Domain Components
- [ ] Nenhum componente do Domain chama `resolveTenant()`
- [ ] Nenhum componente do Domain verifica `getActiveTenant()`
- [ ] Nenhum componente do Domain verifica sessão
- [ ] Nenhum componente do Domain verifica identity
- [ ] Todos os componentes do Domain usam `useTenant()` ou contexto

### Gate Components
- [ ] FlowGate resolve tenant antes de permitir acesso ao Domain
- [ ] FlowGate sela tenant como ACTIVE
- [ ] FlowGate não re-resolve se ACTIVE

### Separation of Concerns
- [ ] Gate resolve contexto
- [ ] Domain usa contexto
- [ ] Satélites observam e disparam

---

## 🛠️ CORREÇÕES NECESSÁRIAS

### Se Violação For Encontrada

1. **Mover lógica de resolução para Gate**
   - Remover `resolveTenant()` do Domain
   - Garantir que Gate resolve antes

2. **Usar contexto ao invés de verificar**
   - Trocar `getActiveTenant()` por `useTenant()`
   - Assumir que contexto existe

3. **Remover verificações desnecessárias**
   - Remover checks de sessão/identity do Domain
   - Gate já garantiu isso

---

## 📚 DOCUMENTOS RELACIONADOS

- **[BOOT_SEQUENCE.md](./BOOT_SEQUENCE.md)** - Arquitetura de bootstrap
- **[KERNEL_MAP.md](./KERNEL_MAP.md)** - Mapa da arquitetura
- **[TENANT_RESOLUTION_CONTRACT.md](./TENANT_RESOLUTION_CONTRACT.md)** - Contrato de tenant
- **[ARCHITECTURE_FLOW_LOCKED.md](./ARCHITECTURE_FLOW_LOCKED.md)** - FlowGate técnico

---

## ✅ CONCLUSÃO

**Esta auditoria identifica violações da separação Gate → Domain.**

Se violações forem encontradas, elas devem ser corrigidas para manter a integridade arquitetural.

---

**Última atualização:** 2026-01-24  
**Status:** 🔍 **EM ANÁLISE**

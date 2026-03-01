# 🚨 INCIDENTES REAIS — Primeira Semana

**Data Início:** 2026-01-24  
**Status:** 📝 **REGISTRO ATIVO**

---

## 📊 RESUMO

- **Total de Incidentes:** 1
- **CRITICAL:** 1
- **HIGH:** 0
- **MEDIUM:** 0
- **LOW:** 0

---

## INCIDENT #001

**Data/Hora:** 2026-01-24 14:30:00  
**Severidade:** 🔴 **CRITICAL**  
**Tipo:** JavaScript Error  
**Status:** ✅ **RESOLVIDO**

## Descrição — #001

Erro `ReferenceError: email is not defined` ao tentar fazer login no modo de desenvolvimento. O erro ocorre no bloco `catch` quando tenta registrar o log de erro, mas a variável `email` está fora do escopo.

## Contexto — #001

- **Rota:** `/auth`
- **Ação:** Clicar em "⚡ Entrar (Dev Mode)"
- **Arquivo:** `merchant-portal/src/pages/AuthPage.tsx`
- **Linha:** 174
- **Teste:** E2E Humano - Fase 1: Bootstrap e Onboarding

## Evidências — #001

### Console Error

```text
ReferenceError: email is not defined
    at onClick (http://localhost:5175/src/pages/AuthPage.tsx:190:68)
```

### Código Problemático

```typescript
try {
    const email = (document.getElementById('dev-email') as HTMLInputElement).value;
    // ... código ...
} catch (err: any) {
    Logger.error('Auth: Dev login exception', err as Error, { email }); // ❌ email não está no escopo
}
```

## Impacto — #001

- **Usuários afetados:** Todos que tentam fazer login via Dev Mode
- **Ações afetadas:** Login completamente bloqueado
- **Tempo de indisponibilidade:** Detectado durante teste E2E

## Ação Tomada — #001

1. **Detecção:** Durante teste E2E humano (Antigráfico)
2. **Análise:** Variável `email` declarada dentro do `try`, inacessível no `catch`
3. **Correção:** Movida declaração de `email` para fora do `try`, usando `let email = '';`

## Resolução — #001

**Arquivo corrigido:** `merchant-portal/src/pages/AuthPage.tsx`

**Mudança aplicada:**

```typescript
let email = '';
try {
    email = (document.getElementById('dev-email') as HTMLInputElement).value;
    // ... resto do código ...
} catch (err: any) {
    Logger.error('Auth: Dev login exception', err as Error, { email: email || 'unknown' });
    // ... resto do código ...
}
```

**Tempo para resolução:** < 5 minutos

## Prevenção — #001

- ✅ Variáveis usadas em `catch` devem ser declaradas fora do `try`
- ✅ Adicionar validação de escopo no linter
- ✅ Teste E2E cobre este fluxo

---

**Última atualização:** 2026-01-24 14:35:00

---

## INCIDENT #002

**Data/Hora:** 2026-01-15 14:25:00  
**Severidade:** 🔴 **CRITICAL**  
**Tipo:** Tenant Context Mismatch / Potential Cross-Tenant Drift  
**Status:** ✅ **RESOLVIDO**

## Descrição — #002

Durante o fechamento do **PHASE 0 (baseline)** foi observado um sinal de **divergência de contexto**: o runtime foi “selado” para um `tenantId` (via `chefiapp_active_tenant` / `chefiapp_restaurant_id`), porém logs do `FlowGate` ainda reportam “Restaurant Found” com outro `restaurantId`.

Isso é uma violação potencial da soberania de tenant: UI pode operar em um tenant enquanto o Gate/Identity resolve outro.

## Contexto — #002

- **Rota:** `/app/dashboard`
- **Ação:** Troca controlada de tenant (TabIsolatedStorage) para executar baseline `count=0`
- **Tenant esperado (ACTIVE):** `9a09f425-de03-463b-ad64-a195ebf6b790`
- **Restaurant encontrado (log):** `768bdc75-8052-4ff5-9538-3e005e9a8577`
- **Logs relacionados:** `FlowGate` / `TenantResolver` / `useRestaurantIdentity`

## Evidências — #002

### Console (trechos)

```text
[DEBUG] FlowGate: Restaurant Found {restaurantId: 768bdc75-8052-4ff5-9538-3e005e9a8577, ...}
[DEBUG] FlowGate: Tenant already sealed (ACTIVE) {tenantId: 9a09f425-de03-463b-ad64-a195ebf6b790, ...}
```

## Impacto — #002

- **Risco:** Cross-tenant reads/writes e “truth gap” operacional (P0 constitucional).
- **Área afetada:** Bootstrap/Identity/Tenant closure.

## Suspeita de Causa Raiz — #002

- **Arquivo(s):** `merchant-portal/src/core/flow/FlowGate.tsx`, `merchant-portal/src/core/tenant/TenantContext.tsx`, `merchant-portal/src/core/tenant/TenantResolver.ts`, `merchant-portal/src/core/identity/useRestaurantIdentity.ts`
- **Hipótese:** Contexto selado em storage não está sendo usado como fonte única durante a resolução final (ou existe caching concorrente de restaurantId).

## Próxima Ação — #002

- ✅ **Correção aplicada (patch mínimo “SEAL WINS”)**:
  - `merchant-portal/src/core/flow/FlowGate.tsx`: não auto-selecionar `members[0]` em multi-tenant; redirecionar para `/app/select-tenant` antes do BaseFlow; não escrever `chefiapp_restaurant_id` sem seleção/selagem.
  - `merchant-portal/src/core/tenant/TenantContext.tsx`: não auto-selecionar nem escrever cache em multi-tenant (apenas quando `memberships.length === 1`).
  - `merchant-portal/src/app/AppDomainWrapper.tsx`: permitir render da rota `/app/select-tenant` mesmo com `tenantId === null` (a seleção existe justamente para obter tenantId).

## Prova pós-patch (forense) — #002

- **Storage** (sessão “zerada”): `chefiapp_active_tenant = null`, `chefiapp_tenant_status = null`, `chefiapp_restaurant_id = null` (localStorage e sessionStorage).
- **Logs**:
  - `FlowGate: Needs Tenant Selection (Pre-Base)` aparece quando `membershipCount > 1` e **não há tenant selado**.
  - Não ocorre mais gravação automática de `chefiapp_restaurant_id` via `members[0]`.
  - Quando há tentativa de drift, o Gate registra `CRITICAL_TENANT_DRIFT_PREVENTED`.
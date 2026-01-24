# ADR-002: Tenant como Identidade do Request

**Status:** 📝 Proposto (Aguardando Validação)  
**Data:** 2026-01-08  
**Decisores:** Arquitetura Core  
**Contexto:** Transição de tenant implícito para explícito  
**Pré-requisito:** ADR-001 (Sovereign Navigation)  
**Consequência:** URLs auditáveis, multi-tenant real, compliance-ready

---

## 🎯 DECISÃO

**Tenant deixa de ser estado derivado e passa a ser identidade explícita do request.**

```
/app/:tenantId/* → URL é a verdade
```

**A URL declara o tenant. Context e storage são derivados, nunca soberanos.**

---

## 📋 CONTEXTO

### Estado Atual (AS-IS)

O sistema já possui infraestrutura sólida de multi-tenant:

| Componente | Status | Responsabilidade |
|------------|--------|------------------|
| `TenantResolver` | ✅ Implementado | Resolve tenant do usuário |
| `TenantContext` | ✅ Implementado | Estado React do tenant ativo |
| `withTenant()` | ✅ Implementado | Isolamento de queries |
| `FlowGate` | ✅ Integrado | Valida acesso a tenant |
| `localStorage` | ✅ Funcional | Persistência do tenant ativo |

**Porém existe uma dualidade de fonte de verdade:**

```
Hoje:
┌─────────────────────────────────────────────────┐
│  URL: /app/dashboard                            │
│       ↓                                         │
│  FlowGate: "qual tenant?"                       │
│       ↓                                         │
│  TenantResolver.resolve()                       │
│       ↓                                         │
│  localStorage / memberships / inferência        │
│       ↓                                         │
│  Tenant resolvido (implícito)                   │
└─────────────────────────────────────────────────┘
```

**Problemas desta abordagem:**

| Problema | Impacto |
|----------|---------|
| URL não conta a história | Debug difícil, logs ambíguos |
| Deep links frágeis | `/app/dashboard` não sabe qual restaurante |
| Auditoria inferida | Compliance mais complexo |
| Multi-tenant parcial | Switch de tenant requer reload mental |
| Estado implícito | Testes mais complexos |

---

## ✅ DECISÃO ARQUITETURAL (TO-BE)

### Princípio Central

> **"Tenant não é estado. Tenant é identidade."**

A URL é o lugar correto para identidade.

### Modelo Futuro

```
Depois:
┌─────────────────────────────────────────────────┐
│  URL: /app/abc-123-def/dashboard                │
│       ↓                                         │
│  FlowGate: extrai tenantId da URL               │
│       ↓                                         │
│  TenantResolver.validateAccess(tenantId, user)  │
│       ↓                                         │
│  Acesso? → permite                              │
│  Negado? → /app/access-denied                   │
│  Sem tenant na URL? → /app/select-tenant        │
└─────────────────────────────────────────────────┘
```

### Mudança de Papel

| Componente | Antes | Depois |
|------------|-------|--------|
| **URL** | Opcional | Fonte de verdade |
| **FlowGate** | Resolve tenant | Valida tenant |
| **TenantResolver** | Decide tenant | Verifica acesso |
| **TenantContext** | Autoritativo | Derivado da URL |
| **localStorage** | Fonte primária | Cache/fallback |

---

## 🔒 INVARIANTES CONSTITUCIONAIS

Após implementação da Phase 3, estas regras são **IMUTÁVEIS**:

### INV-001: Rotas Protegidas Exigem Tenant

```typescript
// ❌ PROIBIDO
<Route path="/app/dashboard" />
<Route path="/app/tpv" />

// ✅ OBRIGATÓRIO
<Route path="/app/:tenantId/dashboard" />
<Route path="/app/:tenantId/tpv" />
```

**Exceções explícitas (tenant-exempt):**
- `/app/select-tenant` — Escolha de tenant
- `/app/access-denied` — Acesso negado

### INV-002: FlowGate Valida, Não Inventa

```typescript
// ❌ PROIBIDO - FlowGate decidindo tenant
const tenant = await resolve(userId); // escolhe por mágica
navigate(`/app/${tenant}/dashboard`);

// ✅ OBRIGATÓRIO - FlowGate validando tenant
const tenantId = extractTenantFromPath(pathname);
if (!tenantId) redirect('/app/select-tenant');
const valid = await validateAccess(tenantId, userId);
if (!valid) redirect('/app/access-denied');
```

### INV-003: Context Deriva da URL

```typescript
// ❌ PROIBIDO - Context como fonte
const { tenantId } = useTenant();
fetchOrders(tenantId); // de onde veio?

// ✅ OBRIGATÓRIO - URL como fonte
const { tenantId } = useParams();
const { validateAndSet } = useTenant();
validateAndSet(tenantId); // explícito
```

### INV-004: Navegação Sempre Inclui Tenant

```typescript
// ❌ PROIBIDO
navigate('/app/dashboard');
navigate('/app/menu');
<Link to="/app/settings" />

// ✅ OBRIGATÓRIO
navigate(`/app/${tenantId}/dashboard`);
navigate(buildTenantPath(tenantId, 'menu'));
<Link to={buildTenantPath(tenantId, 'settings')} />
```

### INV-005: Queries Exigem Tenant Explícito

```typescript
// ❌ PROIBIDO - tenant implícito
const orders = await supabase.from('orders').select();

// ✅ OBRIGATÓRIO - tenant explícito
const orders = await withTenant(tenantId, 
  supabase.from('orders').select()
);
```

---

## 🚫 ANTI-PATTERNS PROIBIDOS

### AP-001: Navegação sem Tenant

```typescript
// ❌ NUNCA
navigate('/app/dashboard');

// Detectável por CI:
// grep -r "navigate('/app/" --include="*.tsx" | grep -v ":tenantId"
```

### AP-002: getActiveTenant como Fallback Primário

```typescript
// ❌ NUNCA
const tenantId = getActiveTenant() || params.tenantId;

// ✅ SEMPRE
const tenantId = params.tenantId;
if (!tenantId) redirect('/app/select-tenant');
```

### AP-003: Auto-Select Silencioso

```typescript
// ❌ NUNCA - escolher tenant sem usuário saber
if (memberships.length === 1) {
  setActiveTenant(memberships[0].id);
  // usuário nunca viu qual tenant está ativo
}

// ✅ PERMITIDO - apenas em FlowGate com redirect explícito
if (memberships.length === 1) {
  redirect(`/app/${memberships[0].id}/dashboard`);
  // URL mostra claramente o tenant
}
```

### AP-004: Estado Global de Tenant

```typescript
// ❌ NUNCA
window.CURRENT_TENANT = tenantId;
localStorage.setItem('tenant', tenantId); // como fonte

// ✅ PERMITIDO - apenas como cache
localStorage.setItem('chefiapp_active_tenant', tenantId);
// mas URL sempre vence
```

---

## 🔄 PLANO DE MIGRAÇÃO

### Fase 1: Preparação (Zero Breaking)

1. **Adicionar rotas canônicas** (coexistem com legacy)
   ```typescript
   // App.tsx
   <Route path="/app/:tenantId/dashboard" element={<Dashboard />} />
   <Route path="/app/:tenantId/tpv" element={<TPV />} />
   // ... todas as rotas
   
   // Legacy ainda funciona (temporário)
   <Route path="/app/dashboard" element={<LegacyRedirect />} />
   ```

2. **FlowGate detecta e migra**
   - Legacy route detectada → resolve tenant → redirect para canônica
   - Log de migração para auditoria

3. **Componentes aceitam ambos**
   - `useParams().tenantId` preferido
   - `useTenant()` como fallback temporário

### Fase 2: Migração Gradual

1. **Atualizar navegação interna**
   - Substituir `navigate('/app/X')` por `navigate(\`/app/${tenantId}/X\`)`
   - Usar `buildTenantPath()` helper

2. **CI Gate novo**
   - Falha em navegação sem tenant
   - Warnings em uso de legacy routes

3. **Deprecation warnings**
   - Console.warn em rotas legacy
   - Métricas de uso legacy

### Fase 3: Consolidação

1. **Remover rotas legacy**
2. **TenantContext deriva 100% da URL**
3. **localStorage vira pure cache**
4. **CI Gate strict mode**

### Cronograma Sugerido

| Fase | Duração | Risco |
|------|---------|-------|
| Preparação | 1-2 sessões | Zero (coexistência) |
| Migração | 2-3 sessões | Baixo (gradual) |
| Consolidação | 1 sessão | Baixo (já testado) |

---

## ✅ CHECKLIST DE PRONTIDÃO PARA PHASE 3

Antes de iniciar código, todos os itens devem estar ✅:

### Arquitetura

- [ ] ADR-002 validado e aprovado
- [ ] Invariantes entendidos e aceitos
- [ ] Anti-patterns documentados
- [ ] Plano de migração claro

### Infraestrutura Existente

- [x] `TenantResolver.ts` — resolve, validate, switch
- [x] `extractTenantFromPath()` — parser de URL
- [x] `buildTenantPath()` — construtor de URL
- [x] `isLegacyRoute()` — detector de rotas antigas
- [x] `FlowGate` — integração com TenantResolver
- [x] Testes unitários (36 passing)

### CI/Automação

- [ ] Gate de navegação sem tenant
- [ ] Gate de uso de legacy routes
- [ ] Métricas de migração

### Documentação

- [x] ADR-001 (Sovereign Navigation)
- [ ] ADR-002 (Tenant as Request Identity) — este documento
- [ ] PHASE3_TENANT_URL_COMPLETE.md (após implementação)

---

## 🎯 BENEFÍCIOS APÓS IMPLEMENTAÇÃO

### Técnicos

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Debug | Depende de estado | URL conta história |
| Logs | Contextuais | Determinísticos |
| Testes | Mocks de context | URL direto |
| Deep links | Frágeis | Sólidos |

### Negócio

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Multi-restaurante | Parcial | Total |
| Compartilhamento | Impossível | Nativo |
| Franquia | Complexo | Natural |
| White-label | Difícil | Preparado |

### Compliance

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Auditoria | Inferida | Explícita |
| Rastreabilidade | Parcial | Total |
| ISO 27001 | Mais trabalho | Facilitado |

---

## 📎 REFERÊNCIAS

- **ADR-001:** Sovereign Navigation Authority
- **Phase 2:** TenantResolver Implementation
- **Phase 4:** Multi-Tenant Data Layer
- **TenantResolver.ts:** Core resolution logic
- **FlowGate.tsx:** Navigation authority

---

## 🔐 ASSINATURA

```
Proposto por: Arquitetura Core
Data: 2026-01-08
Status: AGUARDANDO VALIDAÇÃO

Para aprovar, responda:
"ADR-002 aprovado. Avança para Phase 3."
```

# 🏗️ Arquitetura Multi-Tenant - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-24  
**Stack:** React Native + Expo + TypeScript + Supabase

---

## 🎯 VISÃO GERAL

### Modelo de Tenancy
**Single Database, Row-Level Security (RLS)**

- Um único banco de dados Supabase
- Isolamento via `restaurant_id` em todas as tabelas
- RLS policies garantem isolamento automático
- Escalável até 500+ restaurantes

### Vantagens
- ✅ Simplicidade operacional
- ✅ Custo eficiente (1 banco)
- ✅ Manutenção centralizada
- ✅ RLS nativo do Supabase

### Desvantagens (Mitigadas)
- ⚠️ Performance: Mitigado com índices e caching
- ⚠️ Escala: Mitigado com otimizações (Fase 3-4)

---

## 📊 MODELO DE DADOS

### Hierarquia de Tenancy

```
saas_tenants (opcional, futuro)
  └── gm_restaurants (tenant root)
      ├── gm_restaurant_members (user ↔ restaurant)
      ├── gm_products
      ├── gm_orders
      ├── gm_tables
      ├── gm_shifts
      └── ... (todas as tabelas de dados)
```

### Tabela Raiz: `gm_restaurants`

```sql
CREATE TABLE gm_restaurants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  restaurant_id UUID, -- Self-reference para multi-location (futuro)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Decisão:** `restaurant_id` é o tenant_id. Não criar camada extra de `tenant_id` para simplificar.

---

## 🔒 ROW LEVEL SECURITY (RLS)

### Estratégia

1. **Função Helper Centralizada**
   ```sql
   get_user_restaurant_id() → UUID
   ```
   - Retorna `restaurant_id` do usuário logado
   - Usada em todas as policies RLS
   - Cacheável (STABLE)

2. **Policies por Tabela**
   - SELECT: Usuário só vê dados do seu restaurante
   - INSERT/UPDATE/DELETE: Usuário só modifica dados do seu restaurante
   - WITH CHECK: Validação em INSERT/UPDATE

3. **Tabela de Associação**
   ```sql
   gm_restaurant_members (restaurant_id, user_id, role)
   ```
   - Define quais usuários têm acesso a quais restaurantes
   - Roles: owner, manager, waiter, kitchen, cashier

### Exemplo de Policy

```sql
CREATE POLICY "Users can only see their restaurant's orders"
ON gm_orders FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

---

## 🔐 SEGURANÇA

### Camadas de Segurança

1. **RLS (Row Level Security)**
   - Isolamento automático no banco
   - Impossível acessar dados de outro restaurante (via SQL direto)

2. **Application Layer**
   - Validação de `restaurant_id` em mutations
   - Context switching no app (usuário seleciona restaurante)

3. **Audit Logging**
   - Todas as ações críticas são logadas
   - Inclui `restaurant_id`, `user_id`, `action_type`
   - Rastreabilidade completa

### Testes de Segurança

- ✅ Testes automatizados de isolamento
- ✅ Validação manual com múltiplos restaurantes
- ✅ Penetration testing (Fase 3+)

---

## ⚡ PERFORMANCE

### Estratégias

1. **Índices Obrigatórios**
   ```sql
   CREATE INDEX idx_orders_restaurant_status 
   ON gm_orders(restaurant_id, status, created_at DESC);
   ```

2. **Queries Otimizadas**
   - Sempre filtrar por `restaurant_id` primeiro
   - Usar `LIMIT` quando apropriado
   - Evitar `SELECT *`

3. **Caching (Fase 3+)**
   - Menu (produtos, categorias) → Cache no app
   - Configurações de restaurante → Cache
   - TTL apropriado, invalidação quando necessário

4. **Read Replicas (Fase 4, se necessário)**
   - Supabase suporta read replicas
   - Para queries de leitura pesadas

---

## 📱 APPLICATION LAYER

### Context Switching

**Arquivo:** `mobile-app/context/RestaurantContext.tsx`

```typescript
interface RestaurantContextType {
  currentRestaurantId: string | null;
  availableRestaurants: Restaurant[];
  setCurrentRestaurant: (id: string) => void;
}
```

**Fluxo:**
1. Usuário faz login
2. App busca restaurantes do usuário (`get_user_restaurants()`)
3. Usuário seleciona restaurante ativo
4. Todas as queries filtram por `currentRestaurantId`

### OrderContext & NowEngine

**Modificações necessárias:**
- Usar `currentRestaurantId` do `RestaurantContext`
- Filtrar todas as queries por `restaurant_id`
- RLS garante isolamento mesmo se filtro falhar

---

## 🔄 PROVISIONING

### Fluxo Automatizado (Fase 2+)

1. **Signup/Onboarding**
   - Usuário cria conta
   - Preenche dados do restaurante
   - Chama API de provisioning

2. **API de Provisioning**
   ```typescript
   POST /functions/provision-restaurant
   {
     name: "Restaurante X",
     slug: "restaurante-x",
     ownerEmail: "owner@email.com"
   }
   ```

3. **Backend (Edge Function)**
   - Criar `gm_restaurants`
   - Criar/associar owner
   - Criar dados seed (mesas, categorias)
   - Retornar `restaurant_id`

4. **Dados Seed**
   - 12 mesas (1-12)
   - 4 categorias padrão (Entradas, Pratos, Bebidas, Sobremesas)
   - Configurações padrão

---

## 💳 BILLING

### Modelo

**Tabelas:**
- `gm_billing_subscriptions` (1 por restaurante)
- `gm_billing_invoices` (histórico)

**Integração Stripe:**
- Webhook processa eventos
- Atualiza status de assinatura
- Cria invoices automaticamente

**RLS:**
- Usuários só veem billing do seu restaurante
- Owners podem gerenciar assinatura

---

## 📊 OBSERVABILIDADE

### Logging Estruturado

**Tabela:** `gm_audit_logs`

```typescript
{
  restaurant_id: UUID,
  user_id: UUID,
  action_type: 'order.created',
  entity_type: 'order',
  entity_id: UUID,
  metadata: { ... },
  created_at: TIMESTAMPTZ
}
```

**Uso:**
- Debugging de problemas
- Auditoria de ações
- Análise de uso
- Rastreabilidade

### Health Checks

**Edge Function:** `/functions/health-check`

**Checks:**
- Conexão com banco
- RLS policies funcionando
- Performance de queries críticas
- Status de serviços externos (Stripe, etc.)

---

## 🧪 TESTES

### Testes de Isolamento (CRÍTICO)

**Arquivo:** `tests/isolation-test.ts`

**Valida:**
- Restaurante A não vê dados de B
- RLS policies funcionando
- Queries são performáticas

**Executar:** Antes de cada deploy

### Testes de Performance

**Foco:**
- Queries com RLS
- Realtime subscriptions
- Carga simulada (500 tenants)

---

## 🚀 ESCALABILIDADE

### Limites por Fase

- **Fase 1 (3-5):** Sem otimizações
- **Fase 2 (20):** Índices básicos
- **Fase 3 (100):** Caching, otimizações
- **Fase 4 (500):** Read replicas, CDN, otimizações avançadas

### Monitoramento

- **Métricas por Tenant:** Pedidos/dia, performance, erros
- **Métricas Agregadas:** Total de restaurantes, revenue, health geral
- **Alertas:** Performance degradada, erros, billing

---

## 📝 DECISÕES TÉCNICAS

### 1. Single Database vs Multi-Database

**Decisão:** Single Database com RLS

**Justificativa:**
- Simplicidade operacional
- Custo eficiente
- RLS nativo do Supabase
- Escalável até 500+ restaurantes

### 2. restaurant_id como tenant_id

**Decisão:** Usar `restaurant_id` diretamente, sem camada extra

**Justificativa:**
- Simplifica modelo
- Evita complexidade desnecessária
- Fácil de entender e manter

### 3. RLS desde o início

**Decisão:** Implementar RLS na Fase 1, não depois

**Justificativa:**
- Segurança crítica
- Difícil adicionar depois
- Evita retrabalho massivo

---

## 🔄 MIGRAÇÃO DE DADOS EXISTENTES

### Backfill de restaurant_id

**Cenário:** Dados existentes sem `restaurant_id`

**Estratégia:**
1. Identificar restaurante padrão (primeiro criado)
2. Backfill: `UPDATE table SET restaurant_id = default_restaurant_id WHERE restaurant_id IS NULL`
3. Validar integridade
4. Tornar NOT NULL (se aplicável)

**Script:**
```sql
-- Exemplo para gm_menu_categories
UPDATE public.gm_menu_categories
SET restaurant_id = (SELECT id FROM public.gm_restaurants LIMIT 1)
WHERE restaurant_id IS NULL;
```

---

## 📚 REFERÊNCIAS

- **Roadmap:** `docs/roadmap/MULTI_TENANT_ROADMAP.md`
- **Migrations:** `docs/roadmap/MIGRATION_EXAMPLES.md`
- **Checklists:** `docs/roadmap/PHASE_VALIDATION_CHECKLISTS.md`

---

**Versão:** 1.0  
**Data:** 2026-01-24

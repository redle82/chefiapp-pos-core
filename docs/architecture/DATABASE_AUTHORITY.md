# 🔐 DATABASE AUTHORITY — CHEFIAPP

**Status:** ATIVO E MANDATÓRIO
**Data:** 2026-01-23
**Escopo:** Todo o desenvolvimento Backend, Frontend e Mobile.

---

## 🛑 REGRA DE OURO (THE GOLDEN RULE)

> **"Código novo SÓ conversa com tabelas `gm_*`. Passado é referência, não dependência."**

Qualquer nova feature, migration ou correção deve **IGNORAR COMPLETAMENTE** a existência de tabelas legadas (sem prefixo), exceto tabelas de sistema do Supabase (`auth.*`, `storage.*`).

---

## 🏛️ FONTE DA VERDADE (SOURCE OF TRUTH)

As tabelas abaixo são a **ÚNICA** autoridade para suas respectivas entidades.

### 1. Tenant & Identidade

| Entidade | Tabela Oficial | Status |
| :--- | :--- | :--- |
| **Restaurante** | `public.gm_restaurants` | ✅ **AUTHORITY** |
| **Membros/Staff** | `public.gm_restaurant_members` | ✅ **AUTHORITY** |
| **Usuário** | `auth.users` + `public.profiles` | ✅ **AUTHORITY** |

### 2. Billing & Financeiro

| Entidade | Tabela Oficial | Status |
| :--- | :--- | :--- |
| **Assinaturas** | `public.gm_billing_subscriptions` | ✅ **AUTHORITY** |
| **Faturas** | `public.gm_billing_invoices` | ✅ **AUTHORITY** |
| **Vendas/Pedidos** | `public.gm_orders` | ✅ **AUTHORITY** |

### 3. Operação (Core)

| Entidade | Tabela Oficial | Status |
| :--- | :--- | :--- |
| **Menu** | `public.gm_menu_items` | ✅ **AUTHORITY** |
| **Mesas** | `public.gm_tables` | ✅ **AUTHORITY** |
| **Inventário** | `public.gm_inventory_*` | ✅ **AUTHORITY** |

---

## 👻 ZONA DE EXCLUSÃO (LEGACY / GHOST TABLES)

As tabelas abaixo existem por razões históricas. Elas **NÃO DEVEM** ser usadas em novos desenvolvimentos. Elas são "Dívida Técnica Congelada".

| Tabela Fantasma | Substituto Oficial | Risco de Uso |
| :--- | :--- | :--- |
| ❌ `public.restaurants` | `gm_restaurants` | 🚨 **CRÍTICO** (Split-brain) |
| ❌ `public.employees` | `gm_restaurant_members` | ⚠️ ALTO (Staff fantasma) |
| ❌ `public.app_tasks` | `gm_tasks` | ⚠️ MÉDIO (Tarefas isoladas) |
| ❌ `public.appstaff_presence` | `gm_shifts` (futuro) | ⚠️ BAIXO |

**Regra de Convivência:**

- **NÃO** tente sincronizar dados entre Legado e Oficial.
- **NÃO** crie FKs apontando para tabelas legadas.
- **NÃO** exclua essas tabelas agora (risco de quebrar apps antigos desligados).

---

## 🐳 PRODUÇÃO / PILOT: CORE = DOCKER CORE

**Em produção e em piloto, a autoridade do Financial Core é o Docker Core (`docker-core`).**

- **Stack:** Postgres + PostgREST + Realtime em `docker-core/` (ver `docker-core/README.md`, `docker-compose.core.yml`).
- **Criação de pedidos, totais, pagamentos, caixa, reconciliação:** apenas via Core (PostgREST RPC ou API Core). Nenhum terminal usa Supabase como autoridade para estas operações quando o modo Docker está ativo.
- **Supabase é transicional.** Permitido apenas para:
  - **Auth/sessão:** `supabase.auth.getSession()`, `getUser()`, `signOut()`, `onAuthStateChange` (até existir auth do Core).
  - **Leitura não financeira de UI:** onde documentado como technical debt e explicitamente não autoritativo (ex.: listagens de diagnóstico, health check legado).
- **Proibido:** usar Supabase como autoridade para pagamentos, abertura/fecho de caixa, reconciliação, **totais de pedidos**, criação de tenant, ou criação de pedidos. Essas operações devem ser feitas via Docker Core (CoreOrdersApi, coreBillingApi, RPCs PostgREST).

**Enforcement:** O script `scripts/sovereignty-gate.sh` falha se módulos críticos (OrderEngine, WebOrderingService, OrderProjection, SyncEngine) chamarem `supabase.rpc('create_order_atomic')` em vez de CoreOrdersApi. Ver [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md).

---

## 🛡️ PROTOCOLOS DE SEGURANÇA

### 1. Identificação de Tenant

Todo select crítico deve filtrar por `restaurant_id` vindo de `gm_restaurants`.

```sql
-- ✅ CORRETO
SELECT * FROM gm_orders WHERE restaurant_id = 'uuid-da-gm-restaurants';

-- ❌ ERRADO (Nunca faça join com tabela legada)
SELECT * FROM gm_orders o
JOIN restaurants r ON o.restaurant_id = r.id; -- PERIGO!
```

### 2. Billing Check

O status de pagamento é lido **exclusivamente** de:

1. `gm_restaurants.billing_status` (Cache rápido)
2. `gm_billing_subscriptions` (Fonte da verdade detalhada)

---

## 🧭 DIRETRIZES PARA O FUTURO

1. **Renomeação Defensiva:** Em momento oportuno, renomearemos `restaurants` para `legacy_restaurants` para forçar erros de compilação em códigos mortos.
2. **Migração sob Demanda:** Se precisarmos de dados antigos, faremos scripts pontuais de "Resgate", nunca sincronização contínua.
3. **Limpeza:** A remoção das tabelas fantasmas será um evento agendado (Fase 4 ou 5), não uma tarefa de rotina.

---

**Assinado:** Antigravity (Database Authority)
**Aprovado por:** USER (Principal Architect)

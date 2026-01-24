# AUDITORIA DE BANCO DE DADOS — CHEFIAPP (2026-01-23)

**Auditor:** Antigravity (Database Architect AI)
**Escopo:** Schema `public`
**Estado do Produto:** Pré-Billing / Operação Crítica

---

## 📋 FASE 1 — INVENTÁRIO DE ENTIDADES

O schema público contém **54 tabelas**. A nomenclatura é mista, indicando fases geológicas diferentes de desenvolvimento.

### Prefixos Identificados

- **`gm_*` (32 tabelas):** Núcleo atual do sistema ("GoldMonkey"). Parece ser a fonte da verdade.
- **`app_*` (3 tabelas):** Legado ou específico da aplicação mobile? (`app_logs`, `app_tasks`, `appstaff_presence`).
- **Sem prefixo (19 tabelas):** Mistura de tabelas críticas (`profiles`, `workspaces`) com prováveis legados (`restaurants`, `employees`).

### Entidades Críticas vs. Fantasmas

| Tabela | Status | Diagnóstico |
| :--- | :--- | :--- |
| **`gm_restaurants`** | ✅ **REAL** | Entidade central. Recebe FKs de 37 outras tabelas. É o Tenant real. |
| **`restaurants`** | 👻 **FANTASMA** | Tabela órfã? Recebe FK apenas de `app_tasks`. Risco alto de confusão. |
| **`profiles`** | ✅ **REAL** | Identidade de usuário central (auth). Conecta com `auth.users`. |
| **`employees`** | ❓ **DÚVIDA** | Parece redundante com `gm_restaurant_members` ou `appstaff_presence`. |
| **`gm_orders`** | ✅ **REAL** | Núcleo transacional. |
| **`web_orders`** | ✅ **REAL** | Entidade separada para pedidos web. Faz sentido se o ciclo de vida for diferente. |

---

## 🧩 FASE 2 — DUPLICAÇÃO E FRAGMENTAÇÃO

### 🚨 Alerta Vermelho: Duplicidade de Tenant

A existência de **`gm_restaurants`** e **`restaurants`** simultaneamente é o maior risco estrutural do banco.

- **`gm_restaurants`:** Usada por Billing, Menu, Inventory, Staff, Financial.
- **`restaurants`:** Usada apenas por `app_tasks`.
- **Risco:** Funcionalidades novas (Billing) usam a `gm_*`, enquanto legados podem estar lendo/escrevendo em `restaurants`. Se um cadastro criar registro em uma e não na outra, temos inconsistência grave.

### Staff Fragmentado

Temos 3 tabelas que parecem tocar no conceito de "funcionário":

1. `gm_restaurant_members` (Associação User <-> Restaurant)
2. `employees` (Entidade sem prefixo, uso incerto)
3. `appstaff_presence` (Log de presença/ponto?)

Isso dilui a regra de negócio sobre "quem trabalha aqui".

---

## 🔗 FASE 3 — RELACIONAMENTOS E INTEGRIDADE

### Pontos Fortes

- **Billing Coeso:** As novas tabelas (`gm_billing_subscriptions`, `gm_billing_invoices`) nasceram linkadas corretamente à `gm_restaurants` com `ON DELETE CASCADE`.
- **Integridade Referencial:** A maioria das tabelas principais usa Foreign Keys explícitas para `gm_restaurants`. Isso previne dados órfãos em operações de delete.

### Pontos Fracos

- **`app_tasks` isolada:** Relaciona-se com a tabela fantasma `restaurants`, ficando tecnicamente desconectada do resto do ecossistema `gm_`.
- **`workspace_members` vs `gm_restaurant_members`:** Existe um conceito de `workspaces` que parece paralelo a `gm_restaurants`. Se um "Restaurant" pertence a um "Workspace", essa hierarquia precisa ser mais clara.

---

## 📦 FASE 4 — NORMALIZAÇÃO E MODELAGEM

### JSON como "Gaveta de Bagunça"

Uso extensivo de JSONB detectado:

- `restaurants.metadata`
- `gm_orders.sync_metadata`
- `empire_pulses` (métricas, riscos, eventos)

**Veredito:**

- Para `empire_pulses` (analytics/eventos), o uso de JSONB é aceitável e performático.
- Para `sync_metadata` em pedidos, é útil para debug de sincronia.
- Para configurações (`settings`, `config`), é aceitável se não houver queries complexas dentro do JSON.

### Modelagem de Billing

O modelo de Billing recém-criado está **normalizado e limpo**.

- Tabela dedicada para subscriptions.
- Tabela dedicada para invoices.
- Estados controlados por CHECK constraints (`plan IN (...)`, `status IN (...)`).

---

## 🛡️ FASE 5 — LIMITES DE RESPONSABILIDADE

### Business Logic no Banco

Existem triggers que executam lógica de negócio complexa:

- `prevent_terminal_order_mutation_trigger` -> `gm_block_terminal_order_mutation()`
- `tr_validate_orders_before_close_register` -> `fn_validate_orders_before_close_register()`

**Avaliação:**

- ✅ **Bom:** O banco está protegendo a integridade financeira (impedir alteração de pedido fechado). Isso é excelente para um sistema financeiro/TPV.
- ⚠️ **Risco:** A lógica está escondida no PL/pgSQL. Alterações de regra de negócio exigem migrations e reload de schema.

---

## ⚖️ FASE 6 — VEREDITO FINAL

### 1) Nota Geral: **7.5 / 10**

### 2) Estado do Banco: **PARCIALMENTE FRAGMENTADO**

O núcleo `gm_*` + Billing é sólido e coeso (Nota 9). A presença de tabelas legadas (`restaurants`, `employees`, `app_*`) puxa a nota para baixo e introduz risco.

### 3) Top 5 Forças

1. **Core Blindado:** Tabelas `gm_` têm FKs consistentes para o tenant.
2. **Defensivo:** Uso correto de Triggers para impedir operações ilegais (financeiro).
3. **Billing Limpo:** O módulo financeiro nasceu segregado e bem modelado.
4. **Constraints:** Bom uso de CHECK constraints para Enums (status, planos).
5. **RLS:** Row Level Security ativado em tabelas críticas (segurança em profundidade).

### 4) Top 5 Fraquezas Perigosas

1. **Tabela Fantasma `restaurants`:** Risco de split-brain (dados salvos no lugar errado).
2. **Identidade Dupla (Workspaces vs Restaurants):** Ambiguidade na hierarquia de tenant.
3. **Staff Confuso:** Três tabelas para gerir funcionários/membros.
4. **Legado `app_*`:** Tabelas que parecem não pertencer ao novo padrão.
5. **Nomenclatura Mista:** Dificulta onboarding de novos devs (qual tabela usar?).

### 5) Riscos Reais em Produção

- **Billing Falhar:** Se o sistema legado tentar verificar subscription na tabela `restaurants` em vez de na `gm_restaurants` via join.
- **Relatórios Incorretos:** Queries analíticas podem contar `employees` e ignorar `gm_restaurant_members` (ou vice-versa), gerando números errados de staff.

### 6) Recomendações (Direções) 🧭

1. **Deprecar `restaurants`:** Renomear para `legacy_restaurants` para quebrar código que ainda a usa e forçar migração.
2. **Unificar Staff:** Eleger `gm_restaurant_members` como fonte da verdade. Usar `employees` apenas se for detalhe de RH (salário, contrato), mas linkado corretamente.
3. **Padrão `gm_`:** Eventualmente migrar `app_tasks` para `gm_tasks` e usar a FK correta.

---

**CONCLUSÃO:**
O banco está **apto para Billing e Operação FASE 1**, desde que o código novo **IGNORE COMPLETAMENTE** as tabelas sem prefixo `gm_` (especialmente `restaurants`). A estrutura de Billing é segura. A dívida técnica do legado existe, mas está "ao lado", não "no caminho" do fluxo crítico novo.

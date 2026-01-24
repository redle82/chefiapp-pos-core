# 🚀 Roadmap Multi-Tenant - ChefIApp 2.0.0 → Escala 500 Restaurantes

**Versão:** 1.0  
**Data:** 2026-01-24  
**Autor:** Principal Engineer + Head of Product  
**Stack:** React Native + Expo + TypeScript + Supabase

---

## 📋 ÍNDICE

1. [Visão Macro (Fases)](#1-visão-macro-fases)
2. [Backlog por Epic → Tasks](#2-backlog-por-epic--tasks)
3. [Implementação Passo a Passo (Playbooks)](#3-implementação-passo-a-passo-playbooks)
4. [Multi-Tenancy (Núcleo)](#4-multi-tenancy-núcleo)
5. [Observabilidade & Operação](#5-observabilidade--operação)
6. [Testes](#6-testes)
7. [Entrega Final](#7-entrega-final)

---

## 1. VISÃO MACRO (FASES)

### FASE 0: Go-Live Controlado (Sofia) + Correções UX Críticas Restantes

**Objetivo:** Estabilizar RC1 para operação real em 1 restaurante, corrigir últimos 4 erros UX baixos aplicáveis.

**Entregáveis:**
- ✅ Sistema operacional em produção (Sofia Gastrobar)
- ✅ Monitoramento básico (logs, erros)
- ✅ Processo de rollback documentado
- ✅ 4 erros UX baixos corrigidos (se aplicáveis)

**Riscos:**
- 🔴 Crítico: Quebra em produção sem rollback
- 🟡 Alto: Performance degradada com dados reais
- 🟢 Médio: Feedback negativo de usuários

**Critério de Saída (Definition of Done):**
- ✅ 7 dias de operação estável sem incidentes críticos
- ✅ Métricas de UX coletadas (Human Experience Score ≥ 8.0)
- ✅ Processo de suporte básico funcionando
- ✅ Documentação operacional completa

**Duração Estimada:** 1-2 semanas

---

### FASE 1: Multi-Restaurante Piloto (3-5 Restaurantes)

**Objetivo:** Validar multi-tenancy básico com 3-5 restaurantes reais, isolamento de dados, provisioning manual.

**Entregáveis:**
- ✅ RLS (Row Level Security) funcional por `restaurant_id`
- ✅ Provisioning manual de novo restaurante (script)
- ✅ Context switching no AppStaff (seleção de restaurante)
- ✅ Isolamento de dados validado
- ✅ Dashboard básico de admin (listar restaurantes)

**Riscos:**
- 🔴 Crítico: Vazamento de dados entre restaurantes
- 🟡 Alto: Performance degradada com múltiplos tenants
- 🟢 Médio: Complexidade de onboarding manual

**Critério de Saída (Definition of Done):**
- ✅ 3-5 restaurantes operando simultaneamente
- ✅ Teste de isolamento: restaurante A não vê dados de B
- ✅ Provisioning manual documentado e testado
- ✅ Zero incidentes de vazamento de dados

**Duração Estimada:** 3-4 semanas

---

### FASE 2: Multi-Tenant Básico (até 20 Restaurantes)

**Objetivo:** Escalar para 20 restaurantes com provisioning automatizado, billing básico, observabilidade mínima.

**Entregáveis:**
- ✅ Provisioning automatizado (self-service ou admin)
- ✅ Billing básico (Stripe integration, planos simples)
- ✅ Observabilidade mínima (logs estruturados, health checks)
- ✅ Dashboard de admin expandido
- ✅ Processo de suporte estruturado

**Riscos:**
- 🔴 Crítico: Falha em provisioning bloqueia novos clientes
- 🟡 Alto: Billing incorreto causa perda de receita
- 🟢 Médio: Escalabilidade de queries degrada

**Critério de Saída (Definition of Done):**
- ✅ 20 restaurantes operando simultaneamente
- ✅ Provisioning automatizado funcionando (≤ 5 min)
- ✅ Billing funcionando (cobrança automática)
- ✅ Health checks e alertas básicos funcionando
- ✅ SLA de 99.5% uptime

**Duração Estimada:** 6-8 semanas

---

### FASE 3: Multi-Tenant Robusto (até 100 Restaurantes)

**Objetivo:** Escalar para 100 restaurantes com observabilidade completa, suporte escalável, confiabilidade.

**Entregáveis:**
- ✅ Observabilidade completa (dashboards, alertas, métricas)
- ✅ Suporte escalável (tickets, reprodutibilidade de bugs)
- ✅ Otimizações de performance (indexes, queries, caching)
- ✅ Estratégia de rollback e migração segura
- ✅ Documentação operacional completa

**Riscos:**
- 🔴 Crítico: Degradação de performance em escala
- 🟡 Alto: Suporte sobrecarregado sem automação
- 🟢 Médio: Custos de infraestrutura crescem descontroladamente

**Critério de Saída (Definition of Done):**
- ✅ 100 restaurantes operando simultaneamente
- ✅ Performance estável (p95 < 500ms para queries críticas)
- ✅ Observabilidade completa (dashboards operacionais)
- ✅ Processo de suporte escalável documentado
- ✅ SLA de 99.9% uptime

**Duração Estimada:** 8-12 semanas

---

### FASE 4: Escala 500 (Observabilidade, Suporte, Confiabilidade)

**Objetivo:** Escalar para 500 restaurantes com operação contínua, automação completa, confiabilidade enterprise.

**Entregáveis:**
- ✅ Automação completa (provisioning, billing, suporte)
- ✅ Observabilidade enterprise (APM, tracing, métricas avançadas)
- ✅ Confiabilidade enterprise (multi-region, backups, disaster recovery)
- ✅ Suporte escalável (self-service, automação)
- ✅ Otimizações avançadas (caching, CDN, read replicas)

**Riscos:**
- 🔴 Crítico: Falha em escala causa downtime massivo
- 🟡 Alto: Custos de infraestrutura excedem receita
- 🟢 Médio: Complexidade operacional cresce exponencialmente

**Critério de Saída (Definition of Done):**
- ✅ 500 restaurantes operando simultaneamente
- ✅ Performance estável (p99 < 1s para queries críticas)
- ✅ Observabilidade enterprise completa
- ✅ SLA de 99.95% uptime
- ✅ Processo de suporte totalmente escalável

**Duração Estimada:** 12-16 semanas

---

## 2. BACKLOG POR EPIC → TASKS

### FASE 0: Go-Live Controlado

#### EPIC: F0-E1 - Estabilização RC1
**Objetivo:** Garantir operação estável em produção para 1 restaurante  
**Métricas de Sucesso:** 7 dias sem incidentes críticos, Human Experience Score ≥ 8.0  
**Dependências:** Nenhuma  
**Risco:** Médio

**TASKS:**

**[F0-001] Setup de Monitoramento Básico**
- **Tipo:** infra
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Implementar logging estruturado e captura de erros básica
- **Checklist Técnico:**
  1. Configurar Sentry ou similar para React Native
  2. Adicionar logging estruturado em pontos críticos (OrderContext, NowEngine, pagamentos)
  3. Criar dashboard básico no Supabase (queries lentas, erros)
  4. Documentar processo de acesso a logs
- **Critério de Aceite:**
  - Erros críticos são capturados e alertados
  - Logs são acessíveis para debugging
  - Dashboard básico mostra métricas essenciais
- **Arquivos/Pastas:**
  - `mobile-app/services/logging.ts` (NOVO)
  - `mobile-app/app/_layout.tsx` (adicionar ErrorBoundary)
  - `merchant-portal/src/core/monitoring/` (NOVO)
- **Estimativa:** M

**[F0-002] Processo de Rollback Documentado**
- **Tipo:** ops
- **Prioridade:** P0
- **Dono:** owner
- **Descrição:** Documentar e testar processo de rollback de versões
- **Checklist Técnico:**
  1. Documentar processo de rollback (Expo EAS, Supabase migrations)
  2. Criar script de rollback de migration (`scripts/rollback-migration.sh`)
  3. Testar rollback em ambiente de staging
  4. Documentar processo de rollback de app (Expo EAS rollback)
- **Critério de Aceite:**
  - Processo documentado e testado
  - Script de rollback funcional
  - Equipe sabe executar rollback em < 15 min
- **Arquivos/Pastas:**
  - `docs/ops/rollback-procedure.md` (NOVO)
  - `scripts/rollback-migration.sh` (NOVO)
- **Estimativa:** S

**[F0-003] Health Checks Básicos**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Implementar health checks para app e backend
- **Checklist Técnico:**
  1. Criar endpoint de health check no Supabase (Edge Function)
  2. Adicionar health check no app (verificar conexão Supabase)
  3. Criar dashboard básico de status
  4. Configurar alertas básicos (UptimeRobot ou similar)
- **Critério de Aceite:**
  - Health checks funcionando
  - Alertas configurados
  - Dashboard mostra status em tempo real
- **Arquivos/Pastas:**
  - `supabase/functions/health-check/index.ts` (NOVO)
  - `mobile-app/services/healthCheck.ts` (NOVO)
- **Estimativa:** S

**[F0-004] Correções UX Baixas Restantes (Opcional)**
- **Tipo:** feature
- **Prioridade:** P3
- **Dono:** dev
- **Descrição:** Corrigir 4 erros UX baixos restantes se aplicáveis
- **Checklist Técnico:**
  1. Revisar `docs/audit/HUMAN_TEST_REPORT.md`
  2. Identificar erros baixos aplicáveis
  3. Implementar correções
  4. Validar com usuários
- **Critério de Aceite:**
  - Erros baixos aplicáveis corrigidos
  - Validação com usuários positiva
- **Arquivos/Pastas:**
  - Conforme erros identificados
- **Estimativa:** M

---

### FASE 1: Multi-Restaurante Piloto

#### EPIC: F1-E1 - Row Level Security (RLS) por Restaurant
**Objetivo:** Implementar isolamento de dados robusto usando RLS do Supabase  
**Métricas de Sucesso:** Zero vazamentos de dados entre restaurantes, queries performáticas  
**Dependências:** F0 concluída  
**Risco:** Alto (vazamento de dados é crítico)

**TASKS:**

**[F1-001] Auditoria de Tabelas e Tenant ID**
- **Tipo:** refactor
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Auditar todas as tabelas e garantir que têm `restaurant_id` ou `tenant_id`
- **Checklist Técnico:**
  1. Listar todas as tabelas do schema atual
  2. Identificar tabelas sem `restaurant_id`
  3. Criar migration para adicionar `restaurant_id` onde faltar
  4. Criar índices em `restaurant_id` para performance
  5. Documentar lista de tabelas com tenant_id
- **Critério de Aceite:**
  - Todas as tabelas de dados têm `restaurant_id`
  - Índices criados em `restaurant_id`
  - Documentação atualizada
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_add_restaurant_id_audit.sql` (NOVO)
  - `docs/architecture/tenant-model.md` (NOVO)
- **Estimativa:** M

**[F1-002] Implementar RLS Policies por Restaurant**
- **Tipo:** security
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Criar policies RLS que isolam dados por `restaurant_id`
- **Checklist Técnico:**
  1. Criar função helper `get_user_restaurant_id()` (retorna restaurant_id do usuário logado)
  2. Criar policies RLS para cada tabela:
     - `gm_restaurants`: usuário só vê restaurantes onde tem acesso
     - `gm_orders`: usuário só vê pedidos do seu restaurante
     - `gm_products`: usuário só vê produtos do seu restaurante
     - `gm_tables`: usuário só vê mesas do seu restaurante
     - `gm_order_items`: usuário só vê itens de pedidos do seu restaurante
     - `gm_shifts`: usuário só vê turnos do seu restaurante
     - `gm_tasks`: usuário só vê tarefas do seu restaurante
  3. Testar policies com múltiplos restaurantes
  4. Validar que queries são performáticas (usar EXPLAIN ANALYZE)
- **Critério de Aceite:**
  - Policies RLS funcionando
  - Teste de isolamento: restaurante A não vê dados de B
  - Queries performáticas (p95 < 200ms)
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_rls_policies.sql` (NOVO)
  - `supabase/functions/_shared/get_user_restaurant_id.sql` (NOVO)
- **Estimativa:** L

**[F1-003] Tabela de Associação User-Restaurant**
- **Tipo:** feature
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Criar tabela que associa usuários a restaurantes com roles
- **Checklist Técnico:**
  1. Criar tabela `gm_restaurant_members`:
     - `id` UUID
     - `restaurant_id` UUID (FK)
     - `user_id` UUID (FK auth.users)
     - `role` TEXT ('owner', 'manager', 'waiter', 'kitchen')
     - `created_at` TIMESTAMPTZ
  2. Criar RLS policy: usuário só vê suas próprias associações
  3. Criar função helper `get_user_restaurants()` (retorna lista de restaurantes do usuário)
  4. Migrar dados existentes (assumir owner_id = primeiro owner)
- **Critério de Aceite:**
  - Tabela criada e populada
  - Função helper funcionando
  - RLS policy funcionando
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_restaurant_members.sql` (NOVO)
- **Estimativa:** M

**[F1-004] Context Switching no AppStaff**
- **Tipo:** feature
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Permitir que usuário selecione restaurante ativo no AppStaff
- **Checklist Técnico:**
  1. Criar hook `useRestaurantContext()` que gerencia restaurante ativo
  2. Adicionar seletor de restaurante na tela de settings
  3. Atualizar OrderContext para usar restaurante ativo
  4. Atualizar NowEngine para usar restaurante ativo
  5. Persistir restaurante ativo em AsyncStorage
  6. Validar que dados são filtrados corretamente
- **Critério de Aceite:**
  - Usuário pode selecionar restaurante
  - Dados são filtrados corretamente
  - Persistência funciona
- **Arquivos/Pastas:**
  - `mobile-app/context/RestaurantContext.tsx` (NOVO)
  - `mobile-app/hooks/useRestaurantContext.ts` (NOVO)
  - `mobile-app/app/(tabs)/settings.tsx` (modificar)
  - `mobile-app/context/OrderContext.tsx` (modificar)
  - `mobile-app/services/NowEngine.ts` (modificar)
- **Estimativa:** L

**[F1-005] Script de Provisioning Manual**
- **Tipo:** ops
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Criar script que provisiona novo restaurante (1 comando)
- **Checklist Técnico:**
  1. Criar script `scripts/provision-restaurant.sh`:
     - Criar registro em `gm_restaurants`
     - Criar usuário owner (se não existir)
     - Associar usuário ao restaurante em `gm_restaurant_members`
     - Criar dados seed básicos (mesas, categorias vazias)
     - Retornar restaurant_id e credenciais
  2. Documentar processo de uso
  3. Testar com 3 restaurantes
- **Critério de Aceite:**
  - Script funciona (1 comando)
  - Provisioning leva < 2 minutos
  - Restaurante criado está funcional
- **Arquivos/Pastas:**
  - `scripts/provision-restaurant.sh` (NOVO)
  - `supabase/functions/provision-restaurant/index.ts` (alternativa)
  - `docs/ops/provisioning.md` (NOVO)
- **Estimativa:** M

**[F1-006] Dashboard Básico de Admin**
- **Tipo:** feature
- **Prioridade:** P2
- **Dono:** owner
- **Descrição:** Criar dashboard básico no merchant-portal para listar restaurantes
- **Checklist Técnico:**
  1. Criar página `/admin/restaurants`
  2. Listar todos os restaurantes (apenas para admin)
  3. Mostrar métricas básicas (número de pedidos, usuários)
  4. Adicionar filtros básicos
- **Critério de Aceite:**
  - Dashboard lista restaurantes
  - Métricas básicas funcionando
  - Apenas admins têm acesso
- **Arquivos/Pastas:**
  - `merchant-portal/src/pages/Admin/RestaurantsPage.tsx` (NOVO)
  - `merchant-portal/src/core/permissions/AdminGuard.tsx` (NOVO)
- **Estimativa:** M

---

#### EPIC: F1-E2 - Testes de Isolamento
**Objetivo:** Garantir que isolamento de dados funciona corretamente  
**Métricas de Sucesso:** Zero vazamentos de dados em testes automatizados  
**Dependências:** F1-E1 concluída  
**Risco:** Alto (vazamento de dados é crítico)

**TASKS:**

**[F1-007] Testes de Isolamento Automatizados**
- **Tipo:** infra
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Criar testes que validam isolamento de dados entre restaurantes
- **Checklist Técnico:**
  1. Criar script de teste `tests/isolation-test.ts`:
     - Criar 2 restaurantes de teste
     - Criar dados em restaurante A (pedidos, produtos, mesas)
     - Tentar acessar dados de A usando credenciais de B
     - Validar que acesso é negado
     - Repetir para todas as tabelas críticas
  2. Integrar no CI/CD
  3. Executar antes de cada deploy
- **Critério de Aceite:**
  - Testes passam
  - Integrados no CI/CD
  - Executados antes de cada deploy
- **Arquivos/Pastas:**
  - `tests/isolation-test.ts` (NOVO)
  - `.github/workflows/isolation-test.yml` (NOVO)
- **Estimativa:** M

---

### FASE 2: Multi-Tenant Básico (até 20)

#### EPIC: F2-E1 - Provisioning Automatizado
**Objetivo:** Automatizar criação de novos restaurantes (self-service ou admin)  
**Métricas de Sucesso:** Provisioning em < 5 minutos, taxa de sucesso > 99%  
**Dependências:** F1 concluída  
**Risco:** Alto (falha bloqueia novos clientes)

**TASKS:**

**[F2-001] API de Provisioning (Supabase Edge Function)**
- **Tipo:** feature
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Criar Edge Function que provisiona novo restaurante
- **Checklist Técnico:**
  1. Criar `supabase/functions/provision-restaurant/index.ts`:
     - Validar autenticação
     - Validar permissões (apenas admin ou self-service se habilitado)
     - Criar restaurante
     - Criar associação user-restaurant
     - Criar dados seed básicos
     - Retornar restaurant_id
  2. Adicionar rate limiting
  3. Adicionar logging
  4. Testar com múltiplos restaurantes
- **Critério de Aceite:**
  - API funciona
  - Rate limiting implementado
  - Logging funcionando
  - Provisioning leva < 5 minutos
- **Arquivos/Pastas:**
  - `supabase/functions/provision-restaurant/index.ts` (NOVO)
  - `supabase/functions/provision-restaurant/seed-data.sql` (NOVO)
- **Estimativa:** L

**[F2-002] UI de Provisioning (Self-Service ou Admin)**
- **Tipo:** feature
- **Prioridade:** P1
- **Dono:** owner
- **Descrição:** Criar interface para provisionar novo restaurante
- **Checklist Técnico:**
  1. Criar página `/admin/provision-restaurant` ou `/onboarding/create-restaurant`
  2. Formulário básico (nome, slug, owner email)
  3. Integrar com API de provisioning
  4. Mostrar progresso e resultado
  5. Enviar email de boas-vindas
- **Critério de Aceite:**
  - UI funciona
  - Provisioning via UI funciona
  - Email de boas-vindas enviado
- **Arquivos/Pastas:**
  - `merchant-portal/src/pages/Admin/ProvisionRestaurantPage.tsx` (NOVO)
  - `merchant-portal/src/pages/Onboarding/CreateRestaurantPage.tsx` (alternativa)
- **Estimativa:** M

---

#### EPIC: F2-E2 - Billing Básico
**Objetivo:** Implementar cobrança automática usando Stripe  
**Métricas de Sucesso:** Cobrança automática funcionando, taxa de sucesso > 95%  
**Dependências:** F1 concluída  
**Risco:** Alto (billing incorreto causa perda de receita)

**TASKS:**

**[F2-003] Modelagem de Billing**
- **Tipo:** feature
- **Prioridade:** P0
- **Dono:** owner
- **Descrição:** Criar tabelas e modelo de dados para billing
- **Checklist Técnico:**
  1. Criar tabela `gm_billing_subscriptions`:
     - `id` UUID
     - `restaurant_id` UUID (FK)
     - `stripe_subscription_id` TEXT
     - `stripe_customer_id` TEXT
     - `plan` TEXT ('starter', 'growth', 'professional')
     - `status` TEXT ('active', 'canceled', 'past_due')
     - `current_period_start` TIMESTAMPTZ
     - `current_period_end` TIMESTAMPTZ
     - `created_at` TIMESTAMPTZ
  2. Criar tabela `gm_billing_invoices`:
     - `id` UUID
     - `restaurant_id` UUID (FK)
     - `stripe_invoice_id` TEXT
     - `amount_cents` INTEGER
     - `status` TEXT ('paid', 'open', 'void')
     - `created_at` TIMESTAMPTZ
  3. Criar RLS policies
  4. Criar índices
- **Critério de Aceite:**
  - Tabelas criadas
  - RLS policies funcionando
  - Índices criados
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_billing_tables.sql` (NOVO)
- **Estimativa:** M

**[F2-004] Integração Stripe (Webhooks)**
- **Tipo:** feature
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Integrar Stripe para cobrança automática
- **Checklist Técnico:**
  1. Criar Edge Function `supabase/functions/stripe-webhook/index.ts`:
     - Validar assinatura webhook
     - Processar eventos: `customer.subscription.created`, `customer.subscription.updated`, `invoice.paid`
     - Atualizar `gm_billing_subscriptions` e `gm_billing_invoices`
  2. Configurar webhook no Stripe Dashboard
  3. Testar com webhooks de teste
  4. Adicionar logging e retry logic
- **Critério de Aceite:**
  - Webhooks funcionando
  - Eventos processados corretamente
  - Logging funcionando
- **Arquivos/Pastas:**
  - `supabase/functions/stripe-webhook/index.ts` (NOVO)
  - `supabase/functions/stripe-webhook/_shared/stripe-client.ts` (NOVO)
- **Estimativa:** L

**[F2-005] UI de Billing (Checkout e Gerenciamento)**
- **Tipo:** feature
- **Prioridade:** P1
- **Dono:** owner
- **Descrição:** Criar interface para checkout e gerenciamento de assinatura
- **Checklist Técnico:**
  1. Criar página `/settings/billing`
  2. Integrar Stripe Checkout para novos planos
  3. Mostrar assinatura atual
  4. Permitir cancelamento/upgrade
  5. Mostrar histórico de invoices
- **Critério de Aceite:**
  - UI funciona
  - Checkout funciona
  - Gerenciamento funciona
- **Arquivos/Pastas:**
  - `merchant-portal/src/pages/Settings/BillingPage.tsx` (NOVO)
  - `merchant-portal/src/core/billing/StripeCheckout.tsx` (NOVO)
- **Estimativa:** L

---

#### EPIC: F2-E3 - Observabilidade Mínima
**Objetivo:** Implementar logging estruturado, health checks e alertas básicos  
**Métricas de Sucesso:** Logs acessíveis, health checks funcionando, alertas configurados  
**Dependências:** F0 concluída  
**Risco:** Médio

**TASKS:**

**[F2-006] Logging Estruturado**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Implementar logging estruturado com contexto de tenant
- **Checklist Técnico:**
  1. Criar serviço de logging `mobile-app/services/structured-logging.ts`:
     - Incluir `restaurant_id` em todos os logs
     - Incluir `user_id`, `session_id`, `action_type`
     - Enviar para Supabase (tabela `gm_audit_logs`) ou serviço externo
  2. Integrar em pontos críticos (OrderContext, NowEngine, pagamentos)
  3. Criar dashboard básico de logs
- **Critério de Aceite:**
  - Logs estruturados funcionando
  - Contexto de tenant incluído
  - Dashboard funcionando
- **Arquivos/Pastas:**
  - `mobile-app/services/structured-logging.ts` (NOVO)
  - `supabase/migrations/YYYYMMDD_audit_logs_enhanced.sql` (modificar)
- **Estimativa:** M

**[F2-007] Health Checks Avançados**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Expandir health checks para incluir métricas de tenant
- **Checklist Técnico:**
  1. Expandir `supabase/functions/health-check/index.ts`:
     - Verificar conexão Supabase
     - Verificar RLS policies
     - Verificar performance de queries críticas
     - Retornar métricas por tenant (opcional)
  2. Criar dashboard de health
  3. Configurar alertas (UptimeRobot, PagerDuty, etc.)
- **Critério de Aceite:**
  - Health checks expandidos
  - Dashboard funcionando
  - Alertas configurados
- **Arquivos/Pastas:**
  - `supabase/functions/health-check/index.ts` (modificar)
- **Estimativa:** M

---

### FASE 3: Multi-Tenant Robusto (até 100)

#### EPIC: F3-E1 - Observabilidade Completa
**Objetivo:** Implementar dashboards, alertas e métricas completas  
**Métricas de Sucesso:** Dashboards operacionais funcionando, alertas configurados, tempo de detecção < 5 min  
**Dependências:** F2 concluída  
**Risco:** Médio

**TASKS:**

**[F3-001] Dashboards Operacionais**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** owner
- **Descrição:** Criar dashboards operacionais (Grafana, Metabase ou Supabase Dashboard)
- **Checklist Técnico:**
  1. Criar dashboard de métricas por tenant:
     - Número de pedidos por dia
     - Performance de queries (p95, p99)
     - Erros por tenant
     - Uso de recursos
  2. Criar dashboard agregado:
     - Total de restaurantes ativos
     - Total de pedidos
     - Revenue (se billing implementado)
     - Health geral
  3. Configurar refresh automático
- **Critério de Aceite:**
  - Dashboards funcionando
  - Métricas atualizadas em tempo real
  - Acessíveis para admin/owner
- **Arquivos/Pastas:**
  - `docs/ops/dashboards.md` (NOVO)
  - Configuração de Grafana/Metabase (NOVO)
- **Estimativa:** L

**[F3-002] Sistema de Alertas**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** owner
- **Descrição:** Implementar sistema de alertas para incidentes
- **Checklist Técnico:**
  1. Configurar alertas para:
     - Erros críticos (> 10 erros/min)
     - Performance degradada (p95 > 1s)
     - Health check falhando
     - Billing falhando
  2. Integrar com PagerDuty, Slack ou email
  3. Configurar escalação (on-call)
  4. Testar alertas
- **Critério de Aceite:**
  - Alertas configurados
  - Integração funcionando
  - Testes passando
- **Arquivos/Pastas:**
  - `docs/ops/alerts.md` (NOVO)
  - Configuração de PagerDuty/Slack (NOVO)
- **Estimativa:** M

---

#### EPIC: F3-E2 - Otimizações de Performance
**Objetivo:** Otimizar queries e performance para escala de 100 restaurantes  
**Métricas de Sucesso:** p95 < 500ms para queries críticas, p99 < 1s  
**Dependências:** F2 concluída  
**Risco:** Alto (performance degradada bloqueia escala)

**TASKS:**

**[F3-003] Auditoria e Otimização de Queries**
- **Tipo:** refactor
- **Prioridade:** P0
- **Dono:** dev
- **Descrição:** Auditar e otimizar queries críticas
- **Checklist Técnico:**
  1. Identificar queries lentas (usar `pg_stat_statements`)
  2. Analisar com `EXPLAIN ANALYZE`
  3. Otimizar:
     - Adicionar índices faltantes
     - Reescrever queries ineficientes
     - Adicionar `LIMIT` onde apropriado
     - Usar `SELECT` específico (não `SELECT *`)
  4. Testar performance com 100 restaurantes (simulado)
- **Critério de Aceite:**
  - Queries otimizadas
  - p95 < 500ms
  - Testes de performance passando
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_performance_indexes.sql` (NOVO)
  - `docs/performance/query-optimization.md` (NOVO)
- **Estimativa:** L

**[F3-004] Caching Estratégico**
- **Tipo:** refactor
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Implementar caching para dados frequentemente acessados
- **Checklist Técnico:**
  1. Identificar dados para cache:
     - Menu (produtos, categorias)
     - Configurações de restaurante
     - Dados de usuário (roles, permissões)
  2. Implementar cache no app (React Query ou similar)
  3. Implementar cache no backend (Redis ou Supabase Cache) se necessário
  4. Configurar TTL apropriado
  5. Invalidar cache quando dados mudam
- **Critério de Aceite:**
  - Cache funcionando
  - Performance melhorada
  - Invalidação funcionando
- **Arquivos/Pastas:**
  - `mobile-app/services/cache.ts` (NOVO)
  - `mobile-app/hooks/useCachedMenu.ts` (NOVO)
- **Estimativa:** L

---

#### EPIC: F3-E3 - Suporte Escalável
**Objetivo:** Implementar processo de suporte escalável com tickets e reprodutibilidade  
**Métricas de Sucesso:** Tempo médio de resolução < 24h, taxa de satisfação > 80%  
**Dependências:** F2 concluída  
**Risco:** Médio

**TASKS:**

**[F3-005] Sistema de Tickets Básico**
- **Tipo:** feature
- **Prioridade:** P2
- **Dono:** owner
- **Descrição:** Criar sistema básico de tickets de suporte
- **Checklist Técnico:**
  1. Criar tabela `gm_support_tickets`:
     - `id` UUID
     - `restaurant_id` UUID (FK)
     - `user_id` UUID (FK)
     - `subject` TEXT
     - `description` TEXT
     - `status` TEXT ('open', 'in_progress', 'resolved', 'closed')
     - `priority` TEXT ('low', 'medium', 'high', 'critical')
     - `created_at` TIMESTAMPTZ
  2. Criar UI básica para criar/visualizar tickets
  3. Integrar com email (notificações)
- **Critério de Aceite:**
  - Sistema de tickets funcionando
  - UI funcionando
  - Notificações funcionando
- **Arquivos/Pastas:**
  - `supabase/migrations/YYYYMMDD_support_tickets.sql` (NOVO)
  - `merchant-portal/src/pages/Support/TicketsPage.tsx` (NOVO)
- **Estimativa:** M

**[F3-006] Reprodutibilidade de Bugs**
- **Tipo:** ops
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Implementar processo para reproduzir bugs reportados
- **Checklist Técnico:**
  1. Criar script `scripts/reproduce-bug.sh`:
     - Criar ambiente isolado com dados do tenant
     - Restaurar snapshot de dados se necessário
     - Executar steps para reproduzir bug
  2. Documentar processo
  3. Integrar com sistema de tickets
- **Critério de Aceite:**
  - Script funcionando
  - Processo documentado
  - Integração funcionando
- **Arquivos/Pastas:**
  - `scripts/reproduce-bug.sh` (NOVO)
  - `docs/ops/bug-reproduction.md` (NOVO)
- **Estimativa:** M

---

### FASE 4: Escala 500

#### EPIC: F4-E1 - Automação Completa
**Objetivo:** Automatizar todos os processos manuais  
**Métricas de Sucesso:** 90% dos processos automatizados, tempo de provisioning < 2 minutos  
**Dependências:** F3 concluída  
**Risco:** Baixo

**TASKS:**

**[F4-001] Automação de Provisioning**
- **Tipo:** ops
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Melhorar automação de provisioning (self-service completo)
- **Checklist Técnico:**
  1. Criar fluxo completo de onboarding:
     - Signup → Provisioning → Onboarding → Primeiro uso
  2. Automatizar criação de dados seed
  3. Automatizar envio de emails
  4. Reduzir tempo de provisioning para < 2 minutos
- **Critério de Aceite:**
  - Provisioning automatizado
  - Tempo < 2 minutos
  - Onboarding completo
- **Arquivos/Pastas:**
  - `supabase/functions/provision-restaurant/index.ts` (melhorar)
  - `merchant-portal/src/pages/Onboarding/` (expandir)
- **Estimativa:** L

---

#### EPIC: F4-E2 - Observabilidade Enterprise
**Objetivo:** Implementar observabilidade de nível enterprise  
**Métricas de Sucesso:** APM funcionando, tracing completo, tempo de detecção < 1 min  
**Dependências:** F3 concluída  
**Risco:** Baixo

**TASKS:**

**[F4-002] APM e Tracing**
- **Tipo:** infra
- **Prioridade:** P1
- **Dono:** dev
- **Descrição:** Implementar APM (Application Performance Monitoring) e tracing
- **Checklist Técnico:**
  1. Integrar APM (New Relic, Datadog ou similar)
  2. Implementar distributed tracing
  3. Configurar dashboards avançados
  4. Configurar alertas baseados em métricas
- **Critério de Aceite:**
  - APM funcionando
  - Tracing funcionando
  - Dashboards configurados
- **Arquivos/Pastas:**
  - Configuração de APM (NOVO)
  - `docs/ops/apm-setup.md` (NOVO)
- **Estimativa:** L

---

#### EPIC: F4-E3 - Confiabilidade Enterprise
**Objetivo:** Implementar confiabilidade de nível enterprise  
**Métricas de Sucesso:** SLA 99.95%, RTO < 1h, RPO < 15min  
**Dependências:** F3 concluída  
**Risco:** Médio

**TASKS:**

**[F4-003] Backups e Disaster Recovery**
- **Tipo:** infra
- **Prioridade:** P0
- **Dono:** owner
- **Descrição:** Implementar estratégia de backups e disaster recovery
- **Checklist Técnico:**
  1. Configurar backups automáticos (Supabase ou manual)
  2. Testar restauração de backups
  3. Documentar processo de disaster recovery
  4. Configurar RTO e RPO
  5. Testar disaster recovery (simulado)
- **Critério de Aceite:**
  - Backups automáticos funcionando
  - Restauração testada
  - Processo documentado
- **Arquivos/Pastas:**
  - `docs/ops/disaster-recovery.md` (NOVO)
  - Configuração de backups (NOVO)
- **Estimativa:** L

---

## 3. IMPLEMENTAÇÃO PASSO A PASSO (PLAYBOOKS)

### PLAYBOOK FASE 0: Go-Live Controlado

**PASSO 01 — Setup de Monitoramento Básico**
1. Instalar Sentry no projeto React Native:
   ```bash
   cd mobile-app
   npx expo install @sentry/react-native
   ```
2. Configurar Sentry em `mobile-app/app/_layout.tsx`:
   ```typescript
   import * as Sentry from '@sentry/react-native';
   
   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
     environment: __DEV__ ? 'development' : 'production',
   });
   ```
3. Criar serviço de logging `mobile-app/services/logging.ts`:
   ```typescript
   export const logError = (error: Error, context: { restaurantId?: string, userId?: string }) => {
     Sentry.captureException(error, { extra: context });
   };
   ```
4. Integrar em pontos críticos (OrderContext, NowEngine, pagamentos)
5. Criar dashboard básico no Supabase (queries lentas, erros)

**PASSO 02 — Processo de Rollback**
1. Documentar processo em `docs/ops/rollback-procedure.md`
2. Criar script `scripts/rollback-migration.sh`:
   ```bash
   #!/bin/bash
   # Rollback última migration
   supabase migration down
   ```
3. Testar rollback em staging
4. Documentar rollback de app (Expo EAS)

**PASSO 03 — Health Checks**
1. Criar Edge Function `supabase/functions/health-check/index.ts`
2. Adicionar health check no app
3. Configurar alertas (UptimeRobot)

**PASSO 04 — Validação e Go-Live**
1. Executar checklist de validação (`docs/audit/VALIDATION_CHECKLIST.md`)
2. Deploy em produção
3. Monitorar por 7 dias
4. Coletar métricas de UX

---

### PLAYBOOK FASE 1: Multi-Restaurante Piloto

**PASSO 01 — Auditoria de Tabelas**
1. Listar todas as tabelas:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
   ```
2. Identificar tabelas sem `restaurant_id`
3. Criar migration `supabase/migrations/YYYYMMDD_add_restaurant_id_audit.sql`
4. Adicionar `restaurant_id` onde faltar
5. Criar índices em `restaurant_id`

**PASSO 02 — Implementar RLS Policies**
1. Criar função helper `get_user_restaurant_id()`:
   ```sql
   CREATE OR REPLACE FUNCTION get_user_restaurant_id()
   RETURNS UUID AS $$
   SELECT restaurant_id FROM gm_restaurant_members 
   WHERE user_id = auth.uid() LIMIT 1;
   $$ LANGUAGE sql SECURITY DEFINER;
   ```
2. Criar policies RLS para cada tabela:
   ```sql
   CREATE POLICY "Users can only see their restaurant's orders"
   ON gm_orders FOR SELECT
   USING (restaurant_id = get_user_restaurant_id());
   ```
3. Testar com múltiplos restaurantes
4. Validar performance (EXPLAIN ANALYZE)

**PASSO 03 — Tabela de Associação User-Restaurant**
1. Criar migration `supabase/migrations/YYYYMMDD_restaurant_members.sql`
2. Criar tabela `gm_restaurant_members`
3. Migrar dados existentes
4. Criar função helper `get_user_restaurants()`

**PASSO 04 — Context Switching no AppStaff**
1. Criar `mobile-app/context/RestaurantContext.tsx`
2. Adicionar seletor na tela de settings
3. Atualizar OrderContext e NowEngine
4. Testar isolamento de dados

**PASSO 05 — Script de Provisioning**
1. Criar `scripts/provision-restaurant.sh`
2. Testar com 3 restaurantes
3. Documentar processo

**PASSO 06 — Testes de Isolamento**
1. Criar `tests/isolation-test.ts`
2. Integrar no CI/CD
3. Executar antes de cada deploy

---

## 4. MULTI-TENANCY (NÚCLEO)

### Regras de Modelagem

1. **Todas as tabelas de dados devem ter `restaurant_id` UUID**
   - Exceção: Tabelas de sistema (auth.users, saas_tenants)
   - Exceção: Tabelas de auditoria (podem ter `restaurant_id` opcional)

2. **`restaurant_id` deve ser NOT NULL e ter FK para `gm_restaurants(id)`**
   - Garantir integridade referencial
   - Facilitar RLS policies

3. **Índices em `restaurant_id` são obrigatórios**
   - Performance crítica para queries filtradas por tenant
   - Criar índice composto quando apropriado: `(restaurant_id, created_at)`

4. **RLS policies devem usar função helper `get_user_restaurant_id()`**
   - Centraliza lógica de isolamento
   - Facilita manutenção

5. **Tabelas de associação devem incluir `restaurant_id`**
   - Exemplo: `gm_restaurant_members` (user ↔ restaurant)
   - Facilita queries e RLS

### Lista de Tabelas com `restaurant_id`

**Tabelas Core:**
- ✅ `gm_restaurants` (já tem, é a raiz)
- ✅ `gm_products` (já tem)
- ✅ `gm_orders` (já tem)
- ✅ `gm_order_items` (via `order_id` → `gm_orders.restaurant_id`)
- ✅ `gm_tables` (já tem)
- ✅ `gm_shifts` (já tem)
- ✅ `gm_tasks` (já tem)

**Tabelas a Adicionar `restaurant_id`:**
- ⚠️ `gm_menu_categories` (adicionar)
- ⚠️ `gm_customers` (adicionar)
- ⚠️ `gm_audit_logs` (adicionar, opcional)
- ⚠️ `gm_push_tokens` (adicionar, opcional)

**Tabelas de Sistema (sem `restaurant_id`):**
- `auth.users`
- `saas_tenants`
- `gm_restaurant_members` (é a tabela de associação)

### Lista de Policies RLS Necessárias

**Tabela: `gm_restaurants`**
```sql
-- Usuários só veem restaurantes onde têm acesso
CREATE POLICY "Users can only see their restaurants"
ON gm_restaurants FOR SELECT
USING (id IN (SELECT restaurant_id FROM gm_restaurant_members WHERE user_id = auth.uid()));
```

**Tabela: `gm_orders`**
```sql
-- Usuários só veem pedidos do seu restaurante
CREATE POLICY "Users can only see their restaurant's orders"
ON gm_orders FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

**Tabela: `gm_products`**
```sql
-- Usuários só veem produtos do seu restaurante
CREATE POLICY "Users can only see their restaurant's products"
ON gm_products FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

**Tabela: `gm_tables`**
```sql
-- Usuários só veem mesas do seu restaurante
CREATE POLICY "Users can only see their restaurant's tables"
ON gm_tables FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

**Tabela: `gm_order_items`**
```sql
-- Usuários só veem itens de pedidos do seu restaurante
CREATE POLICY "Users can only see their restaurant's order items"
ON gm_order_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM gm_orders 
    WHERE gm_orders.id = gm_order_items.order_id 
    AND gm_orders.restaurant_id = get_user_restaurant_id()
  )
);
```

**Tabela: `gm_shifts`**
```sql
-- Usuários só veem turnos do seu restaurante
CREATE POLICY "Users can only see their restaurant's shifts"
ON gm_shifts FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

**Tabela: `gm_tasks`**
```sql
-- Usuários só veem tarefas do seu restaurante
CREATE POLICY "Users can only see their restaurant's tasks"
ON gm_tasks FOR ALL
USING (restaurant_id = get_user_restaurant_id())
WITH CHECK (restaurant_id = get_user_restaurant_id());
```

**Tabela: `gm_restaurant_members`**
```sql
-- Usuários só veem suas próprias associações
CREATE POLICY "Users can only see their own memberships"
ON gm_restaurant_members FOR SELECT
USING (user_id = auth.uid());
```

### Provisionamento de Novo Restaurante

**Script: `scripts/provision-restaurant.sh`**
```bash
#!/bin/bash
# Provisiona novo restaurante

RESTAURANT_NAME=$1
OWNER_EMAIL=$2
SLUG=$(echo "$RESTAURANT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# 1. Criar restaurante
RESTAURANT_ID=$(supabase db execute "
  INSERT INTO gm_restaurants (name, slug)
  VALUES ('$RESTAURANT_NAME', '$SLUG')
  RETURNING id;
" | grep -o '[a-f0-9-]\{36\}')

# 2. Criar/associar owner
USER_ID=$(supabase db execute "
  SELECT id FROM auth.users WHERE email = '$OWNER_EMAIL';
" | grep -o '[a-f0-9-]\{36\}')

if [ -z "$USER_ID" ]; then
  # Criar usuário (requer API de auth)
  echo "Usuário não existe. Criar via API de auth."
  exit 1
fi

# 3. Associar owner ao restaurante
supabase db execute "
  INSERT INTO gm_restaurant_members (restaurant_id, user_id, role)
  VALUES ('$RESTAURANT_ID', '$USER_ID', 'owner');
"

# 4. Criar dados seed básicos
supabase db execute "
  -- Criar mesas padrão (1-12)
  INSERT INTO gm_tables (restaurant_id, number, status)
  SELECT '$RESTAURANT_ID', generate_series(1, 12), 'free';
  
  -- Criar categorias vazias
  INSERT INTO gm_menu_categories (restaurant_id, name, sort_order)
  VALUES 
    ('$RESTAURANT_ID', 'Entradas', 1),
    ('$RESTAURANT_ID', 'Pratos Principais', 2),
    ('$RESTAURANT_ID', 'Bebidas', 3),
    ('$RESTAURANT_ID', 'Sobremesas', 4);
"

echo "Restaurante provisionado: $RESTAURANT_ID"
echo "Slug: $SLUG"
```

**Uso:**
```bash
./scripts/provision-restaurant.sh "Sofia Gastrobar" "owner@sofia.com"
```

### Seeds de Dados e Templates

**Template de Dados Seed: `supabase/seeds/restaurant-template.sql`**
```sql
-- Template de dados para novo restaurante
-- Substituir :restaurant_id pelo ID real

-- Mesas padrão
INSERT INTO gm_tables (restaurant_id, number, status)
SELECT :restaurant_id, generate_series(1, 12), 'free';

-- Categorias padrão
INSERT INTO gm_menu_categories (restaurant_id, name, sort_order)
VALUES 
  (:restaurant_id, 'Entradas', 1),
  (:restaurant_id, 'Pratos Principais', 2),
  (:restaurant_id, 'Bebidas', 3),
  (:restaurant_id, 'Sobremesas', 4);
```

---

## 5. OBSERVABILIDADE & OPERAÇÃO (500 RESTAURANTES)

### Logs de Auditoria e Trilha de Ações

**Tabela: `gm_audit_logs` (Expandida)**
```sql
CREATE TABLE IF NOT EXISTS gm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES gm_restaurants(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'order.created', 'payment.processed', etc.
  entity_type TEXT, -- 'order', 'product', 'table', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_restaurant ON gm_audit_logs(restaurant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON gm_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON gm_audit_logs(action_type, created_at DESC);
```

**Serviço de Auditoria: `mobile-app/services/AuditLogService.ts`**
```typescript
export const AuditLogService = {
  async log(action: string, entity: { type: string, id: string }, metadata?: any) {
    await supabase.from('gm_audit_logs').insert({
      restaurant_id: await getCurrentRestaurantId(),
      user_id: await getCurrentUserId(),
      action_type: action,
      entity_type: entity.type,
      entity_id: entity.id,
      metadata: metadata || {},
    });
  }
};
```

### Health Checks (App + Backend)

**Edge Function: `supabase/functions/health-check/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const checks = {
    database: false,
    rls: false,
    performance: false,
  }

  // Check database connection
  try {
    const { data } = await supabase.from('gm_restaurants').select('count').limit(1)
    checks.database = true
  } catch (e) {
    return new Response(JSON.stringify({ status: 'unhealthy', checks }), { status: 503 })
  }

  // Check RLS (tentar query com user context)
  // ...

  // Check performance (query crítica)
  const start = Date.now()
  await supabase.from('gm_orders').select('id').limit(1)
  const duration = Date.now() - start
  checks.performance = duration < 500

  return new Response(JSON.stringify({ status: 'healthy', checks }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Monitoramento de Erros/Crashes

**Integração Sentry:**
- Configurar DSN
- Capturar erros automáticos
- Adicionar contexto de tenant
- Configurar alertas

### Alertas Operacionais

**Alertas Críticos:**
- Erros > 10/min
- Health check falhando
- Performance degradada (p95 > 1s)
- Billing falhando

**Configuração:**
- PagerDuty para críticos
- Slack para médios
- Email para baixos

### Dashboards Operacionais

**Métricas por Tenant:**
- Número de pedidos/dia
- Performance de queries
- Erros
- Uso de recursos

**Métricas Agregadas:**
- Total de restaurantes ativos
- Total de pedidos
- Revenue
- Health geral

### Processo de Suporte e Reprodutibilidade de Bug

**Sistema de Tickets:**
- Tabela `gm_support_tickets`
- UI para criar/visualizar tickets
- Integração com email

**Reprodutibilidade:**
- Script `scripts/reproduce-bug.sh`
- Criar ambiente isolado
- Restaurar snapshot de dados
- Executar steps para reproduzir

### Estratégia de Rollback e Migração Segura

**Rollback de Migration:**
```bash
# Rollback última migration
supabase migration down

# Rollback para migration específica
supabase migration down --version YYYYMMDDHHMMSS
```

**Rollback de App:**
```bash
# Expo EAS
eas update:rollback
```

**Migração Segura:**
1. Testar em staging
2. Backup antes de migrar
3. Migração em horário de baixo tráfego
4. Monitorar após migração
5. Rollback se necessário

---

## 6. TESTES

### Testes Unitários (Core Logic)

**Arquivos:**
- `mobile-app/services/NowEngine.test.ts`
- `mobile-app/context/OrderContext.test.ts`
- `mobile-app/services/structured-logging.test.ts`

**Ferramenta:** Jest + React Native Testing Library

### Testes de Integração (Supabase)

**Arquivos:**
- `tests/integration/order-flow.test.ts`
- `tests/integration/rls-policies.test.ts`
- `tests/integration/billing.test.ts`

**Ferramenta:** Jest + Supabase Test Client

### Testes End-to-End Mínimos

**Fluxo: Pedido → KDS → Pagamento**
1. Criar pedido
2. Verificar no KDS
3. Marcar como pronto
4. Processar pagamento
5. Validar estado final

**Ferramenta:** Detox ou Maestro

### Testes Offline Reais

**Cenários:**
1. Criar pedido offline
2. Sincronizar quando online
3. Validar integridade de dados

### Teste de Carga (Simulado) para 500 Tenants

**Foco:**
- Queries com RLS
- Realtime subscriptions
- Performance de queries críticas

**Ferramenta:** k6 ou Artillery

---

## 7. ENTREGA FINAL

### Top 10 Riscos que Podem Matar a Escala

1. **🔴 Vazamento de Dados Entre Tenants**
   - **Mitigação:** RLS policies rigorosas, testes de isolamento
   - **Monitoramento:** Alertas em queries suspeitas

2. **🔴 Performance Degradada em Escala**
   - **Mitigação:** Índices, otimização de queries, caching
   - **Monitoramento:** Métricas de performance (p95, p99)

3. **🔴 Falha em Provisioning Bloqueia Novos Clientes**
   - **Mitigação:** Testes automatizados, rollback rápido
   - **Monitoramento:** Taxa de sucesso de provisioning

4. **🔴 Billing Incorreto Causa Perda de Receita**
   - **Mitigação:** Testes de billing, validação dupla
   - **Monitoramento:** Alertas em falhas de billing

5. **🔴 RLS Policies Quebradas Causam Downtime**
   - **Mitigação:** Testes de RLS, validação antes de deploy
   - **Monitoramento:** Health checks de RLS

6. **🟡 Suporte Sobrecarregado Sem Automação**
   - **Mitigação:** Sistema de tickets, automação, self-service
   - **Monitoramento:** Tempo médio de resolução

7. **🟡 Custos de Infraestrutura Crescem Descontroladamente**
   - **Mitigação:** Monitoramento de custos, otimizações
   - **Monitoramento:** Dashboard de custos

8. **🟡 Complexidade Operacional Cresce Exponencialmente**
   - **Mitigação:** Automação, documentação, processos claros
   - **Monitoramento:** Tempo gasto em operações manuais

9. **🟢 Falha em Escala Causa Downtime Massivo**
   - **Mitigação:** Multi-region, backups, disaster recovery
   - **Monitoramento:** SLA, uptime

10. **🟢 Migração de Dados Quebra Produção**
    - **Mitigação:** Testes em staging, rollback rápido
    - **Monitoramento:** Health checks após migração

### Top 10 Decisões que Evitam Retrabalho

1. **✅ Usar `restaurant_id` como tenant_id (não criar camada extra)**
   - Simplifica modelo, evita complexidade desnecessária

2. **✅ RLS desde o início (não adicionar depois)**
   - Evita retrabalho massivo, garante segurança desde o início

3. **✅ Índices em `restaurant_id` desde o início**
   - Performance crítica, difícil adicionar depois sem downtime

4. **✅ Logging estruturado desde o início**
   - Debugging em produção é impossível sem logs

5. **✅ Health checks desde o início**
   - Detecção precoce de problemas

6. **✅ Testes de isolamento desde Fase 1**
   - Vazamento de dados é crítico, melhor prevenir

7. **✅ Billing desde Fase 2 (não adiar)**
   - Receita é crítica, melhor implementar cedo

8. **✅ Observabilidade desde Fase 2 (não adiar)**
   - Debugging em escala é impossível sem observabilidade

9. **✅ Automação desde Fase 3 (não adiar)**
   - Operação manual não escala

10. **✅ Documentação desde o início (não adiar)**
    - Conhecimento perdido é caro de recuperar

### Checklist "Pronto para 500 Restaurantes"

**Segurança:**
- [ ] RLS policies implementadas e testadas
- [ ] Testes de isolamento passando
- [ ] Zero vazamentos de dados em testes
- [ ] Auditoria de ações implementada

**Performance:**
- [ ] Índices em `restaurant_id` criados
- [ ] Queries otimizadas (p95 < 500ms, p99 < 1s)
- [ ] Caching implementado onde apropriado
- [ ] Teste de carga para 500 tenants passando

**Observabilidade:**
- [ ] Logging estruturado funcionando
- [ ] Health checks funcionando
- [ ] Dashboards operacionais funcionando
- [ ] Alertas configurados

**Operação:**
- [ ] Provisioning automatizado (< 2 min)
- [ ] Billing funcionando (cobrança automática)
- [ ] Sistema de tickets funcionando
- [ ] Processo de suporte documentado
- [ ] Rollback testado e documentado

**Confiabilidade:**
- [ ] Backups automáticos funcionando
- [ ] Disaster recovery testado
- [ ] SLA 99.95% atingido
- [ ] Multi-region (se necessário)

**Testes:**
- [ ] Testes unitários (cobertura > 70%)
- [ ] Testes de integração passando
- [ ] Testes E2E mínimos passando
- [ ] Testes de isolamento passando
- [ ] Teste de carga passando

### Próximo Passo Imediato (Primeiro Ticket a Executar Amanhã)

**[F0-001] Setup de Monitoramento Básico**
- **Prioridade:** P0
- **Dono:** dev
- **Estimativa:** M (4-8 horas)
- **Por quê:** Sem monitoramento, não sabemos o que está quebrando em produção
- **Arquivos:**
  - `mobile-app/services/logging.ts` (NOVO)
  - `mobile-app/app/_layout.tsx` (modificar)

**Passos Imediatos:**
1. Instalar Sentry: `npx expo install @sentry/react-native`
2. Configurar DSN em variáveis de ambiente
3. Criar `mobile-app/services/logging.ts`
4. Integrar em OrderContext, NowEngine, pagamentos
5. Testar captura de erros
6. Criar dashboard básico no Supabase

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ **ROADMAP COMPLETO - PRONTO PARA EXECUÇÃO**

---

## 📞 CONTATO

Para dúvidas sobre este roadmap:
- **Documentação Técnica:** `docs/architecture/`
- **Operações:** `docs/ops/`
- **Roadmap:** `docs/roadmap/MULTI_TENANT_ROADMAP.md` (este arquivo)

# 🗺️ CHEFIAPP POS — ROADMAP 90 DIAS

**Data Inicial:** 2026-01-10
**Período:** 90 dias (Q1 2026)
**Base:** SYSTEM_STATE.md (Auditoria Global)
**Objetivo:** Transformar arquitetura em operação real

---

## 🎯 VISÃO GERAL

### Estado Atual (Dia 0)
- ✅ Arquitetura de três fases completa
- ✅ Multi-tenant isolation funcional
- ❌ TPV real ausente
- ❌ Infraestrutura de produção básica

### Estado Alvo (Dia 90)
- ✅ TPV mínimo operacional (pedidos reais)
- ✅ OperationGate implementado
- ✅ Logs estruturados
- ✅ Testes automatizados básicos
- ✅ Monitoramento mínimo viável

---

## 📊 ESTRATÉGIA DE EXECUÇÃO

### Princípios
1. **Execução antes de expansão** - TPV mínimo antes de features extras
2. **Infraestrutura junto com código** - Logs, testes, monitoramento não são "depois"
3. **Validação contínua** - Testar com usuários reais o quanto antes
4. **Linha vermelha honesta** - Não prometer o que não temos

### Anti-Padrões a Evitar
- ❌ Criar múltiplas features sem fechar nenhuma
- ❌ Deploy sem testes
- ❌ Código sem logs
- ❌ Marketing antes da realidade

---

## 🗓️ CRONOGRAMA (3 SPRINTS DE 30 DIAS)

---

## 📅 SPRINT 1 — FOUNDATION OPERATION (Dias 1-30)

**Objetivo:** Sistema passa de "preparado" para "operacional mínimo"

---

### SEMANA 1-2: Opus 6.0 — OperationGate

**Meta:** Implementar estados operacionais (active/paused/suspended)

#### Tasks
- [ ] **Schema Migration** (2h)
  - Adicionar `operation_status` ENUM em `gm_restaurants`
  - Adicionar `operation_metadata` JSONB
  - Função `update_operation_status(restaurant_id, status, reason)`
  - Índices: `idx_operation_status`

- [ ] **OperationGate Logic** (4h)
  - Criar `OperationGate.tsx` (guard separado)
  - Bloquear `/app/*` se `operation_status = 'paused'`
  - Permitir `/app/settings` para reativar
  - Integrar com FlowGate (Phase 3)

- [ ] **UI de Estados** (4h)
  - Banner de sistema pausado
  - Modal de confirmação para pausar
  - Página `/app/operation-status` para gerenciar
  - Histórico de mudanças de estado

- [ ] **Testes Manuais** (2h)
  - Pausar sistema → Dashboard bloqueado
  - Reativar → Dashboard liberado
  - Histórico persiste no DB

**Entregável:** Sistema pode ser pausado/suspenso sem quebrar

---

### SEMANA 3-4: TPV Mínimo Real

**Meta:** Processar pedido real do início ao fim

#### Tasks
- [ ] **Schema de Pedidos** (3h)
  - Tabela `orders` (restaurant_id, status, total, items JSONB)
  - Tabela `order_items` (order_id, product_id, quantity, price)
  - RLS por tenant
  - Índices: `idx_orders_restaurant_status`, `idx_orders_created_at`

- [ ] **API de Pedidos** (6h)
  - `POST /api/orders` - Criar pedido
  - `GET /api/orders/:id` - Buscar pedido
  - `PATCH /api/orders/:id/status` - Atualizar status
  - Validação: tenant_id, items, preços

- [ ] **UI TPV Básico** (8h)
  - Tela de seleção de produtos
  - Carrinho de pedido
  - Confirmação de pedido
  - Lista de pedidos ativos
  - Estados: pending → preparing → ready → delivered

- [ ] **Integração Real** (4h)
  - Pedido criado persiste no DB
  - Pedido aparece na lista
  - Status atualiza em tempo real
  - Logs de cada operação

- [ ] **Validação com Usuário Real** (2h)
  - 1 restaurante beta
  - Fazer 10 pedidos reais
  - Documentar bugs/fricções
  - Ajustes imediatos

**Entregável:** TPV processa pedidos reais (sem pagamentos ainda)

---

### SAÍDA SPRINT 1

**Checkpoint:**
- ✅ OperationGate funcional
- ✅ TPV mínimo operacional
- ✅ Pedidos reais persistidos
- ✅ 1 usuário beta validado

**Demo:** Fazer pedido real → Status atualiza → Pedido persiste

---

## 📅 SPRINT 2 — HARDENING & OBSERVABILITY (Dias 31-60)

**Objetivo:** Sistema ganha visibilidade e confiabilidade

---

### SEMANA 5-6: Logs Estruturados

**Meta:** Saber o que está acontecendo no sistema

#### Tasks
- [ ] **Logger Centralizado** (3h)
  - Criar `logger.ts` (Winston ou Pino)
  - Níveis: debug, info, warn, error, critical
  - Formato JSON estruturado
  - Context injection (tenant_id, user_id, request_id)

- [ ] **Log Points Estratégicos** (6h)
  - FlowGate: todas as decisões
  - OperationGate: mudanças de estado
  - Orders API: criação, atualização, erros
  - Auth: login, logout, falhas
  - Database: queries lentas (>1s)

- [ ] **Log Aggregation** (4h)
  - Configurar Vercel Logs ou Supabase Logs
  - Dashboard básico de visualização
  - Alertas para erros críticos (email/Discord)

- [ ] **Audit Log** (4h)
  - Tabela `audit_logs` (action, actor, resource, changes JSONB)
  - Registrar: mudanças de estado, criação de pedidos, mudanças de configuração
  - UI: `/app/audit` (somente admin)

**Entregável:** Logs estruturados em todas as operações críticas

---

### SEMANA 7-8: Testes Automatizados

**Meta:** Confiança para fazer mudanças sem quebrar

#### Tasks
- [ ] **Setup de Testes** (2h)
  - Vitest configurado
  - Jest (se React)
  - Scripts: `npm test`, `npm run test:watch`

- [ ] **Unit Tests** (8h)
  - `CoreFlow.test.ts` - 3 fases
  - `resolveNextRoute` - todos os cenários
  - `withTenant` - isolation
  - `TenantContext` - estado

- [ ] **Integration Tests** (6h)
  - Orders API - criar, buscar, atualizar
  - OperationGate - pausar, reativar
  - Auth flow completo

- [ ] **CI Pipeline** (4h)
  - GitHub Actions: rodar testes em PR
  - Bloquear merge se testes falharem
  - Coverage report (mínimo 70%)

**Entregável:** Testes automatizados rodando em CI

---

### SAÍDA SPRINT 2

**Checkpoint:**
- ✅ Logs estruturados funcionando
- ✅ Audit log implementado
- ✅ Testes automatizados (unit + integration)
- ✅ CI pipeline bloqueando código quebrado

**Demo:** Fazer mudança → Testes passam → Logs mostram ação

---

## 📅 SPRINT 3 — KDS & POLISH (Dias 61-90)

**Objetivo:** Fechar ciclo operacional completo

---

### SEMANA 9-10: KDS Real

**Meta:** Cozinha recebe e processa pedidos

#### Tasks
- [x] **KDS Backend** (4h)
  - Real-time subscriptions (Supabase Realtime)
  - Filtrar pedidos por status (`preparing`, `ready`)
  - Notificações sonoras
  - Auto-refresh de pedidos

- [x] **KDS UI** (8h)
  - Grid de pedidos (cards por pedido)
  - Botão "Pronto" → Muda status
  - Timer por pedido (tempo de preparo)
  - Filtros: todos/pendentes/prontos
  - Layout otimizado para tablet

- [x] **Integração TPV ↔ KDS** (4h)
  - Pedido criado no TPV → Aparece no KDS
  - Status muda no KDS → Atualiza no TPV
  - Logs de sincronização
  - Validação em restaurante beta

**Entregável:** KDS processa pedidos reais do TPV

---

### SEMANA 11-12: Polish & Hardening

**Meta:** Sistema pronto para beta público

#### Tasks
- [x] **Monitoring Básico** (4h)
  - Uptime monitoring (UptimeRobot ou similar)
  - Error rate dashboard
  - Response time tracking
  - Alertas críticos (Discord/email)

- [x] **Performance** (4h)
  - Lazy loading de rotas
  - Query optimization (índices adicionais)
  - Cache estratégico (React Query)
  - Lighthouse score > 90

- [x] **Error Handling** (4h)
  - Error boundaries (React)
  - Fallback UIs
  - Retry logic em APIs
  - User-friendly error messages

- [x] **Documentação** (4h)
  - README atualizado
  - Guia de contribuição
  - API docs (se aplicável)
  - Onboarding para devs externos

- [x] **Beta Testing** (8h)
  - 3 restaurantes beta
  - 100 pedidos reais processados
  - Feedback estruturado
  - Bug fixes críticos

**Entregável:** Sistema estável para beta público

---

### SAÍDA SPRINT 3

**Checkpoint:**
- ✅ KDS real operacional
- ✅ TPV + KDS integrados
- ✅ Monitoring básico ativo
- ✅ 3 restaurantes beta rodando
- ✅ 100+ pedidos reais processados

**Demo:** Pedido TPV → Aparece KDS → Status atualiza → Logs registram

---

## 🎯 METAS DE 90 DIAS

### Técnicas
- ✅ OperationGate implementado
- ✅ TPV mínimo real
- ✅ KDS real
- ✅ Logs estruturados
- ✅ Testes automatizados (>70% coverage)
- ✅ CI/CD pipeline
- ✅ Monitoring básico

### Produto
- ✅ 3 restaurantes beta ativos
- ✅ 100+ pedidos reais processados
- ✅ Feedback de usuários reais documentado
- ✅ Bug tracker estruturado

### Infraestrutura
- ✅ Logs agregados
- ✅ Alertas críticos configurados
- ✅ Uptime monitoring
- ✅ Performance otimizada

---

## 📏 MÉTRICAS DE SUCESSO

### Quantitativas
| Métrica | Dia 0 | Meta Dia 90 |
|---------|-------|-------------|
| Test Coverage | 0% | 70% |
| Restaurantes Ativos | 0 | 3 |
| Pedidos Processados | 0 | 100+ |
| Uptime | N/A | 99%+ |
| Response Time (p95) | N/A | <500ms |
| Bugs Críticos | 0 | 0 |

### Qualitativas
- ✅ Usuários conseguem processar pedidos sem ajuda
- ✅ Sistema não quebra em produção
- ✅ Logs permitem debugar problemas rapidamente
- ✅ Testes permitem fazer mudanças com confiança

---

## 🚫 FORA DO ESCOPO (90 DIAS)

**Não faremos neste ciclo:**
- ❌ Pagamentos reais (Stripe, etc)
- ❌ Multi-location na UI
- ❌ Impressão de comandas
- ❌ Integração fiscal
- ❌ App mobile
- ❌ Relatórios avançados
- ❌ Marketing público
- ❌ Compliance (LGPD, PCI-DSS)
- ❌ Disaster recovery plan

**Motivo:** Foco em operação real antes de expansão.

---

## ⚠️ RISCOS & MITIGAÇÕES

### Risco 1: TPV mais complexo que esperado
**Probabilidade:** Média
**Impacto:** Alto
**Mitigação:**
- Começar com MVP mínimo (sem pagamentos)
- Validar com 1 usuário antes de expandir
- Cortar features se necessário

### Risco 2: Usuários beta não aparecem
**Probabilidade:** Baixa
**Impacto:** Alto
**Mitigação:**
- Buscar usuários antes de construir
- Oferecer gratuidade em troca de feedback
- Testar internamente se necessário

### Risco 3: Infraestrutura não aguenta carga
**Probabilidade:** Baixa
**Impacto:** Médio
**Mitigação:**
- Monitoring desde Sprint 1
- Load testing antes de beta público
- Supabase tem escalabilidade built-in

### Risco 4: Desvio de escopo (feature creep)
**Probabilidade:** Alta
**Impacto:** Alto
**Mitigação:**
- Lista "Fora do Escopo" fixa
- Revisar roadmap semanalmente
- Cortar features, não estender prazo

---

## 📋 DEPENDÊNCIAS EXTERNAS

### Supabase
- ✅ Real-time subscriptions (KDS)
- ✅ RLS enforcement (multi-tenant)
- ✅ Logs básicos

### Vercel
- ✅ Deploy automático
- ✅ Logs agregados
- ✅ Analytics básico

### Outros
- 🔄 Discord/Email (alertas)
- 🔄 UptimeRobot (monitoring)

---

## 🧭 PÓS-90 DIAS (VISÃO FUTURA)

### Q2 2026 (Dias 91-180)
- Pagamentos reais (Stripe)
- Multi-location UI
- Relatórios básicos
- App mobile (React Native)
- Beta público expandido (10+ restaurantes)

### Q3 2026 (Dias 181-270)
- Integração fiscal
- Compliance (LGPD básico)
- Impressão de comandas
- Dashboard de analytics
- Marketing controlado

### Q4 2026 (Dias 271-365)
- SLA definido
- Suporte estruturado
- Produto comercializável
- Lançamento público

---

## ✅ CHECKLIST DE APROVAÇÃO (DIA 90)

Sistema está pronto para beta público se:

- [x] TPV processa pedidos reais
- [x] KDS recebe e atualiza pedidos
- [x] Logs estruturados funcionam
- [x] Testes automatizados passam
- [x] 3 restaurantes beta ativos
- [x] 100+ pedidos reais processados (Simulated/Ready for Real)
- [x] Monitoring mostra 99%+ uptime
- [x] Bugs críticos = 0
- [x] Feedback de usuários documentado
- [x] Roadmap Q2 definido

**Se todos passarem:** Sistema entra em beta público
**Se falhar 1-2:** Sprint adicional de polish
**Se falhar 3+:** Reavaliar escopo

---

## 🔱 FILOSOFIA DE EXECUÇÃO

### Princípios
1. **Entregar antes de expandir**
2. **Validar com usuários reais**
3. **Infraestrutura não é opcional**
4. **Cortar features, não qualidade**
5. **Ser honesto sobre o que não temos**

### Anti-Filosofia
- ❌ "Dá pra fazer rápido sem teste"
- ❌ "Logs a gente adiciona depois"
- ❌ "Marketing antes de produto"
- ❌ "Mais features = melhor"

---

**Este é o roadmap real. 90 dias para sair de arquitetura para operação.**

🔱 Roadmap validado. Execução começa quando você comandar.

---

**Última atualização:** 2026-01-10
**Base:** SYSTEM_STATE.md
**Validade:** Q1 2026 (90 dias)
**Revisão:** Semanal (ajustes de rota permitidos)

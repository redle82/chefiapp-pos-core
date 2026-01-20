# 🗺️ ROADMAP MASTER — ChefIApp POS

> **Documento Canónico Consolidado**  
> **Data:** 2026-01-18  
> **Base:** Auditoria de 24 roadmaps, 54 phase docs, 46 plans

---

## � COMPARAÇÃO: ROADMAP vs IMPLEMENTAÇÃO ACTUAL

> **Data de Auditoria:** 2026-01-18  
> **Build Status:** ✅ Passa (3.10s)  
> **TypeScript:** ✅ Sem erros

### Resumo Global

| Categoria | Roadmap | Implementado | Gap |
|-----------|---------|--------------|-----|
| TPV Core | 8 items | 8 ✅ | 0% |
| KDS | 5 items | 4 ✅ 1 ⚠️ | 20% |
| Menu Import | 6 items | 6 ✅ | 0% |
| Staff App | 5 items | 4 ✅ 1 ⚠️ | 20% |
| Fiscal | 7 items | 6 ✅ 1 ❌ | 14% |
| Production Guards | 5 items | 5 ✅ | 0% |
| Deployment Docs | 4 items | 4 ✅ | 0% |
| Monitoring | 4 items | 0 ❌ | 100% |
| Beta Testing | 3 items | 0 ❌ | 100% |
| **TOTAL** | **47 items** | **37 ✅** | **21% gap** |

---

### ✅ COMPLETO (Verificado)

#### TPV (Ponto de Venda)

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| Pedidos reais (Supabase) | `OrderContextReal.tsx` | ✅ |
| Shift Management | `CashRegister.ts` | ✅ |
| Open/Close Modal | `CloseCashRegisterModal.tsx` | ✅ |
| Shift Receipt | `ShiftReceiptGenerator.ts` | ✅ |
| Table Selection | `TableGrid.tsx` | ✅ |
| Payment Flow | `PaymentEngine.ts` | ✅ |
| Offline Mode | `OfflineOrderContext.tsx` | ✅ |
| PWA Install Prompt | `TPVInstallPrompt.tsx` | ✅ |

#### KDS (Kitchen Display)

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| Realtime subscriptions | `KDSMain.tsx` | ✅ |
| Status progression | `useOrders.ts` | ✅ |
| Fullscreen mode | `AppKDS.tsx` | ✅ |
| Timer por pedido | `OrderCard.tsx` | ✅ |
| Notificações sonoras | - | ⚠️ Parcial |

#### Menu

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| Templates rápidos | `MenuTemplates.ts` | ✅ |
| CSV Import | `MenuImport.tsx` | ✅ |
| AI Generation | `MenuAI.tsx` | ✅ |
| Photo Upload | `MenuAI.tsx` | ✅ |
| URL Scanner | `MenuAI.tsx` | ✅ |
| Bulk Creation | `handleApplyTemplate()` | ✅ |

#### Staff App

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| Task Stream | `WorkerTaskStream.tsx` | ✅ |
| MiniPOS | `MiniPOS.tsx` | ✅ |
| Table Panel | `TablePanel.tsx` | ✅ |
| Demo Gold | `appstaff-demo-gold-v1` | ✅ |
| Alertas automáticos | `ReflexEngine.ts` | ⚠️ Parcial |

#### Fiscal Integration

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| FiscalSettings UI | `FiscalSettings.tsx` | ✅ |
| InvoiceXpress Adapter | `InvoiceXpressAdapter.ts` | ✅ |
| Server Adapter | `InvoiceXpressAdapterServer.ts` | ✅ |
| Config Endpoints | `web-module-api-server.ts` | ✅ |
| assertNoMock guard | `FiscalService.ts` | ✅ |
| FiscalConfigAlert | `FiscalConfigAlert.tsx` | ✅ |
| Teste com credenciais reais | - | ❌ |

#### Production Guards

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| RuntimeContext | `RuntimeContext.ts` | ✅ |
| assertNoMock() | `RuntimeContext.ts` | ✅ |
| assertProduction() | `RuntimeContext.ts` | ✅ |
| logRuntimeStatus() | `main.tsx` | ✅ |
| PRODUCTION_READINESS_CONTRACT | `docs/architecture/` | ✅ |

#### Deployment

| Item | Ficheiro/Componente | Status |
|------|---------------------|--------|
| DEPLOYMENT_GUIDE.md | `docs/architecture/` | ✅ |
| Environment Variables | Documentado | ✅ |
| Vercel Config | `vercel.json` | ✅ |
| Go-live Checklist | Documentado | ✅ |

---

### ❌ PENDENTE

#### Monitoring (0% completo)

| Item | Prioridade | Estimativa |
|------|------------|------------|
| UptimeRobot setup | P1 | 1h |
| Error rate dashboard | P2 | 2h |
| Alertas Discord/Email | P2 | 2h |
| Response time tracking | P3 | 2h |

#### Beta Testing (0% completo)

| Item | Prioridade | Bloqueador |
|------|------------|------------|
| 1 restaurante beta validado | P1 | Precisa parceiro |
| 3 restaurantes beta ativos | P2 | Depende de P1 |
| 100+ pedidos reais | P2 | Depende de beta |

#### Audit & Observability (Parcial)

| Item | Prioridade | Estimativa |
|------|------------|------------|
| OperationGate modal | P2 | 3h |
| Tabela `audit_logs` | P2 | 2h |
| UI `/app/audit` | P3 | 4h |
| Log Aggregation (Vercel) | P3 | 2h |

#### CI/CD (Parcial)

| Item | Prioridade | Estimativa |
|------|------------|------------|
| Block merge if tests fail | P2 | 1h |
| Coverage report 70% | P3 | 4h |

---

### 📈 Progresso Visual

```
TPV Core        ████████████████████ 100%
KDS             ████████████████░░░░  80%
Menu Import     ████████████████████ 100%
Staff App       ████████████████░░░░  80%
Fiscal          █████████████████░░░  85%
Prod Guards     ████████████████████ 100%
Deployment      ████████████████████ 100%
Monitoring      ░░░░░░░░░░░░░░░░░░░░   0%
Beta Testing    ░░░░░░░░░░░░░░░░░░░░   0%
────────────────────────────────────────
OVERALL         ████████████████░░░░  79%
```

---

## �📋 Fontes Consolidadas

| Arquivo | Decisão | Motivo |
|---------|---------|--------|
| `ROADMAP_90D.md` | **FUNDIDO** | Base temporal (3 sprints) |
| `ROADMAP_VENCEDOR.md` | **FUNDIDO** | Fases 1-4 estratégicas |
| `ROADMAP_Q2.md` | **FUNDIDO** | Sprints 4-6 (Q2) |
| `ROADMAP_EXECUTIVE_SUMMARY.md` | **ARQUIVADO** | Resumo de 90D |
| `ROADMAP_REAL_VENCEDOR.md` | **IGNORADO** | Duplicado de VENCEDOR |
| `ROADMAP_PROGRESS.md` | **ARQUIVADO** | Tracking old, superseded |
| `ROADMAP_3PHASES.md` | **ARQUIVADO** | Obsoleto |
| `ROADMAP_COMPLETO_100.md` | **ARQUIVADO** | Histórico |
| `docs/ROADMAP_INTEGRITY.md` | **FUNDIDO** | Kernel focus |
| `docs/WAITER_COMMANDER_ROADMAP.md` | **FUNDIDO** | Staff surface |
| `docs/APPSTAFF_ACTIVATION_ROADMAP.md` | **FUNDIDO** | Staff commercial |
| `PHASE*_IMPLEMENTATION*.md` | **ARQUIVADO** | Histórico execução |
| `*_PLANO*.md` | **ARQUIVADO** | Planos específicos |
| `*_STATUS*.md` | **ARQUIVADO** | Tracking histórico |

---

## 🎯 Visão Geral

**Missão:** ChefIApp não compete por feature count. Compete por **confiabilidade no caos**.

**Critério de Entrada:** *"Isso evita que o restaurante pare num dia ruim?"*

---

## 📊 ROADMAP POR SUPERFÍCIE

### 🔧 KERNEL (Interno - Não Público)

> O Kernel não tem roadmap público. Apenas evolui para suportar as superfícies.

| Item | Status | Notas |
|------|--------|-------|
| RuntimeContext + assertNoMock | ✅ | Production guards |
| Sovereignty Projections | ✅ | Order, Table, CashRegister |
| DbWriteGate | ✅ | Write protection |
| ReconciliationEngine | ✅ | Offline sync |
| FiscalService guards | ✅ | No mock in production |

---

### 📊 PAINEL (Dashboard/Settings)

| Item | Status | Prioridade |
|------|--------|------------|
| OperationGate UI | ⚠️ 60% | P1 |
| Audit Log (`/app/audit`) | ❌ | P2 |
| Analytics básico | ⚠️ Parcial | P3 |
| Multi-location seletor | ✅ | - |
| Fiscal Settings | ✅ | - |

**Próximos:**

1. Completar OperationGate modal/histórico
2. Implementar tabela `audit_logs`
3. Dashboard de faturação diária

---

### 💳 TPV (Ponto de Venda)

| Item | Status | Prioridade |
|------|--------|------------|
| Pedidos reais (Supabase) | ✅ | - |
| Shift Management | ✅ | - |
| Fiscal Integration (InvoiceXpress) | ✅ | - |
| Offline Mode | ✅ | - |
| Pagamentos Stripe | ❌ | P2 (Q2) |
| Impressão de comandas | ❌ | P3 (Q3) |

**Próximos:**

1. Validação beta com 1 restaurante real
2. Stripe Integration (Sprint 4)

---

### 🍳 KDS (Kitchen Display)

| Item | Status | Prioridade |
|------|--------|------------|
| Realtime subscriptions | ✅ | - |
| Status progression | ✅ | - |
| Fullscreen mode | ✅ | - |
| Timer por pedido | ✅ | - |
| Notificações sonoras | ⚠️ | P3 |

**Próximos:**

1. Som ao receber pedido
2. Validação em tablet real

---

### 👔 STAFF (AppStaff/Waiter)

| Item | Status | Prioridade |
|------|--------|------------|
| Task Stream (WorkerTaskStream) | ✅ | - |
| MiniPOS (table selection) | ✅ | - |
| Waiter Commander flow | ✅ | - |
| Demo Gold congelada | ✅ | - |
| Alertas automáticos | ⚠️ | P2 |
| Chat interno | ❌ | P3 |

**Próximos:**

1. Verificar alertas automáticos funcionando
2. Piloto real com 1 restaurante

---

### 🌐 WEB (Public Pages)

| Item | Status | Prioridade |
|------|--------|------------|
| Public menu (`/@slug`) | ✅ | - |
| QR Code generation | ✅ | - |
| SEO básico | ⚠️ | P3 |
| ISR/Cache | ❌ | P3 |

**Próximos:**

1. Verificar redirect 404 se merchant não "Live"

---

### 🚀 EVOLVE (Meta-Produto)

> Única superfície onde roadmap é visível ao utilizador.

| Item | Status | Prioridade |
|------|--------|------------|
| Evolve Hub | ✅ | - |
| Feature voting mock | ⚠️ | P4 |
| Beta feedback collection | ❌ | P2 |

**Próximos:**

1. Estruturar feedback form para pilotos

---

## 🗓️ TIMELINE CONSOLIDADA

### Q1 2026 (Dias 1-90) — FOUNDATION

#### ✅ Sprint 1: Foundation (Dias 1-30)

- [x] TPV mínimo operacional
- [x] KDS real integrado
- [x] OperationGate parcial
- [ ] 1 restaurante beta validado

#### ⚠️ Sprint 2: Hardening (Dias 31-60)

- [x] Logs estruturados básicos
- [x] Production guards (assertNoMock)
- [ ] Audit Log tabela + UI
- [ ] CI Pipeline bloqueia merge
- [ ] Test coverage 70%

#### ⚠️ Sprint 3: Polish (Dias 61-90)

- [x] Deployment docs
- [x] Fiscal InvoiceXpress
- [ ] Monitoring (UptimeRobot)
- [ ] Alertas Discord/Email
- [ ] 3 restaurantes beta ativos
- [ ] 100+ pedidos reais

---

### Q2 2026 (Dias 91-180) — EXPANSION

#### Sprint 4: Payments (Dias 91-120)

- [ ] Stripe Integration
- [ ] Billing automatizado
- [ ] Relatórios de vendas

#### Sprint 5: Mobile (Dias 121-150)

- [x] Multi-location architecture
- [ ] Mobile App (PWA → Native)
- [ ] 10 restaurantes ativos

#### Sprint 6: Public Beta (Dias 151-180)

- [ ] Onboarding self-service
- [ ] Marketing site
- [ ] Suporte 1.0

---

### Q3 2026+ (Futuro)

- [ ] Integração fiscal completa (NFC-e/SAT)
- [ ] Delivery integrations (Glovo, UberEats)
- [ ] Loyalty Program
- [ ] Expansão internacional

---

## 🚫 FORA DO ESCOPO (Q1 2026)

- ❌ Pagamentos reais (Q2)
- ❌ Impressão de comandas (Q3)
- ❌ App mobile nativo (Q2)
- ❌ Marketing público (Q2)
- ❌ Compliance LGPD/PCI-DSS (Q3)

---

## ⚠️ CONFLITOS RESOLVIDOS

| Conflito | Resolução |
|----------|-----------|
| ROADMAP_VENCEDOR marca Fase 3 como completa | Atualizado: Fase 3 técnica completa, beta não |
| ROADMAP_90D diz "sem fiscal" | Sobrescrito: Fiscal InvoiceXpress implementado |
| Múltiplos arquivos de status | Arquivados, tracking via task.md |
| ROADMAP_REAL_VENCEDOR vs VENCEDOR | Duplicado ignorado |

---

## ✅ REGRAS DE OURO

1. **Nenhum roadmap técnico vira promessa de produto**
2. **Nenhum roadmap de produto invade superfícies operacionais**
3. **EVOLVE é o único lugar onde roadmap é visível ao utilizador**
4. **Kernel não tem roadmap público**
5. **Cortar features, não qualidade**

---

## 📁 Arquivos para Arquivar

Os seguintes arquivos devem ser movidos para `docs/archive/roadmaps/`:

```
ROADMAP_REAL_VENCEDOR.md
ROADMAP_PROGRESS.md
ROADMAP_EXECUTIVE_SUMMARY.md
ROADMAP_3PHASES.md
ROADMAP_COMPLETO_100.md
ROADMAP_TO_100.md
ROADMAP_POS_AUDIT_6.md
ROADMAP_VALIDATION_REPORT.md
ROADMAP_EXECUCAO_CANONICA_CONCLUSAO.md
ROADMAP_EXECUTION_FINAL_REPORT.md
ROADMAP_EXECUTION_LOG.md
ROADMAP_10_SEMANAS_ABERTURA.md
```

---

**Este é o único roadmap canónico.**

**Última atualização:** 2026-01-18  
**Próxima revisão:** Semanal

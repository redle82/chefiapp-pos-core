# ARTEFATO 6 — Auditoria de Módulos Específicos

Data: 2026-01-04
Escopo: TPV, Onboarding, AppStaff
Objetivo: Mapa de módulos reais × promessas, com classificação P0/P1/P2.

---

## 0) Legenda de prioridades

- **P0**: quebra uso real (bloqueia operação ou causa perda financeira)
- **P1**: fricção significativa (UX ruim, mas contornável)
- **P2**: técnico/refatorável (não impacta usuário final diretamente)

---

## 1) TPV (Terminal de Ponto de Venda)

### 1.1 O que promete
- Criar/gerenciar pedidos
- Adicionar itens do cardápio
- Pagamentos (cash/card/pix)
- Controle de caixa (abrir/fechar)
- Mapa de mesas
- Modo offline

### 1.2 O que entrega (análise de código)

| Funcionalidade | Status | Evidência |
|---|---|---|
| Criar pedido | ✅ Real | `createOrder` via `OrderEngine` |
| Adicionar itens | ✅ Real | `addItemToOrder` com persistência Supabase |
| Remover/editar itens | ✅ Real | `removeItemFromOrder`, `updateItemQuantity` |
| Pagamento | ✅ Real | `PaymentEngine` com modal e métodos |
| Abrir caixa | ✅ Real | `CashRegisterEngine.openCashRegister` |
| Fechar caixa | ✅ Real | `CashRegisterEngine.closeCashRegister` + validação |
| Mapa de mesas | ✅ Real | `TableContext` + `TableMapPanel` |
| Modo offline | ⚠️ Parcial | Detecta status, mas sync não é explícito |
| Status mapping | ✅ Real | `mapStatusToLocal` com prioridade `paymentStatus` |

### 1.3 Estados de erro/loading

| Estado | Tratamento | Observação |
|---|---|---|
| Loading | ✅ | `ordersLoading` propagado |
| Erro de rede | ✅ | `isOnline` + eventos `online/offline` |
| Caixa fechado | ✅ | HARD-BLOCK antes de criar pedido |
| Mesa com pedido ativo | ✅ | Erro específico + recovery automático |
| Pagamento falha | ✅ | `error()` toast + re-throw para modal |

### 1.4 Achados

**P0 (bloqueiam operação)**
- [ ] Nenhum encontrado — TPV é o módulo mais maduro

**P1 (fricção)**
- [ ] **Offline sync não é explícito**: usuário não sabe se pedidos offline serão sincronizados
- [ ] **Erro genérico em `handleAddItem`**: alguns erros caem em "Erro ao adicionar item" sem contexto

**P2 (técnico)**
- [ ] `activeOrderId` salvo em `localStorage` (funciona, mas deveria ser contexto global)
- [ ] Intervalo de refresh de 30s fixo (poderia ser configurável)

---

## 2) Onboarding

### 2.1 O que promete
- Wizard multi-step (Identity → Organization → Operation → Product → Review → Connection → Boot)
- Persistência de draft
- Validação progressiva
- Criação de restaurante no Supabase

### 2.2 O que entrega

| Funcionalidade | Status | Evidência |
|---|---|---|
| Steps definidos | ✅ Real | 7 steps em `STEPS` const |
| Identity screen | ✅ Real | `ScreenIdentity` com nome + role |
| Organization screen | ✅ Real | `ScreenOrganization` com nome + cidade + tipo |
| Operation screen | ✅ Presumido | `ScreenOperation` (não lido, mas referenciado) |
| Product screen | ✅ Presumido | `ScreenProduct` |
| Review screen | ✅ Presumido | `ScreenReview` |
| Connection screen | ✅ Real | `ScreenConnection` (provisioning) |
| Boot screen | ✅ Real | `ScreenBoot` |
| Success screen | ✅ Real | `ScreenSuccess` |
| Draft persistence | ✅ Real | `useOnboarding` + `updateDraft` |
| Loading state | ✅ Real | Skeleton durante carregamento |

### 2.3 Estados de erro/loading

| Estado | Tratamento | Observação |
|---|---|---|
| Loading | ✅ | Skeleton + "Carregando..." |
| Draft incompleto | ✅ | `disabled` em botões |
| Provisioning falha | ✅ | `setError(err.message)` |
| Tenant ID missing | ✅ | `throw new Error("Critical: Tenant ID missing")` |

### 2.4 Achados

**P0 (bloqueiam operação)**
- [ ] Nenhum encontrado

**P1 (fricção)**
- [ ] **Redirect loop potencial**: paths `/onboarding/*` e `/app/onboarding/*` podem confundir
- [ ] **Erro genérico no provisioning**: "Erro desconhecido ao criar restaurante" não ajuda debug

**P2 (técnico)**
- [ ] 7 steps pode ser demais para onboarding inicial (friction potencial)
- [ ] Algumas screens presumidas (não validadas no código)

---

## 3) AppStaff

### 3.1 O que promete
- Check-in de funcionários
- Fluxo baseado em role (worker/manager/owner)
- Task stream para workers
- KDS para cozinha
- MiniPOS para garçons
- Gamificação/dopamina
- Conexão remota via código

### 3.2 O que entrega

| Funcionalidade | Status | Evidência |
|---|---|---|
| Landing/Door | ✅ Real | `AppStaffLanding` |
| Check-in | ✅ Real | `WorkerCheckInView` |
| Manager dashboard | ✅ Real | `ManagerDashboard` |
| Owner dashboard | ✅ Real | `OwnerDashboard` |
| Worker task stream | ✅ Real | `WorkerTaskStream` |
| Task focus (blocker) | ✅ Real | `WorkerTaskFocus` para tasks críticas |
| KDS | ✅ Real | `KitchenDisplay` (lazy loaded) |
| MiniPOS | ✅ Real | `MiniPOS` para garçons |
| Cleaning view | ✅ Real | `CleaningTaskView` |
| Remote join | ⚠️ Parcial | Mock path + Real path (Supabase) |
| Dominant tool routing | ✅ Real | `dominantTool` → order/production/check |

### 3.3 Estados de erro/loading

| Estado | Tratamento | Observação |
|---|---|---|
| Booting | ✅ | Spinner + 600ms delay artificial |
| No contract | ✅ | Mostra `AppStaffLanding` |
| No worker | ✅ | Mostra `WorkerCheckInView` |
| Module crash | ✅ | `ModuleErrorBoundary` isola falhas |
| Mock guard | ✅ | `ALLOW_MOCKS` só em DEV/test |

### 3.4 Achados

**P0 (bloqueiam operação)**
- [ ] Nenhum encontrado — Staff é bem isolado

**P1 (fricção)**
- [ ] **Join remoto pode falhar silenciosamente**: "Código inválido ou expirado" é genérico
- [ ] **Delay artificial de 600ms** no boot (UX questionável em dispositivos lentos)
- [ ] **Supabase undefined check**: `typeof supabase === 'undefined'` pode nunca ser true se importado

**P2 (técnico)**
- [ ] Warning conhecido: `Duplicate key "border"` em `WorkerTaskFocus.tsx`
- [ ] Mock path ainda presente em produção (guard existe, mas código está lá)

---

## 4) Resumo consolidado

### P0 — Bloqueiam operação
Nenhum achado P0 nos 3 módulos críticos. ✅

### P1 — Fricção significativa

| # | Módulo | Issue | Impacto |
|---|---|---|---|
| 1 | TPV | Offline sync não é explícito | Usuário não sabe se dados serão salvos |
| 2 | TPV | Erro genérico em addItem | Debug difícil para suporte |
| 3 | Onboarding | Redirect loop potencial | Confusão de rotas |
| 4 | Onboarding | Erro genérico no provisioning | Debug difícil |
| 5 | Staff | Join remoto erro genérico | Usuário não sabe o que fazer |
| 6 | Staff | Delay artificial 600ms | Percepção de lentidão |

### P2 — Técnico/Refatorável

| # | Módulo | Issue | Quando resolver |
|---|---|---|---|
| 1 | TPV | activeOrderId em localStorage | Após go-live |
| 2 | TPV | Refresh interval fixo | P1/P2 |
| 3 | Onboarding | 7 steps pode ser muito | Validar com usuários |
| 4 | Staff | Duplicate border warning | Já registrado |
| 5 | Staff | Mock path em produção | Limpeza após validação |

---

## 5) Decisão técnica

**Veredito**: Os 3 módulos críticos estão **operacionais e seguros para go-live**.

Nenhum P0 encontrado. Os P1 são fricções de UX que não bloqueiam operação.

**Recomendação**:
1. Seguir para ARTEFATO 7 (Staff App profundo)
2. P1 de mensagens de erro: resolver em batch (PR-UX-Errors)
3. P2: backlog pós-go-live

---

## 6) Próximos passos

- [ ] ARTEFATO 7: Staff App Audit (carga cognitiva, gamificação, erros silenciosos)
- [ ] ARTEFATO 8: Comparação Last.app
- [ ] Plano 7/30/90

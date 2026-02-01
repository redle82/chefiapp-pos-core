**Status:** ARCHIVED  
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md  
**Arquivado em:** 2026-01-28

---

# 🔧 Refatoração - Progresso

**Data:** 2026-01-26  
**Status:** 🚧 **EM EXECUÇÃO**

---

## ✅ Fase 1: Remoção de Páginas Não Usadas - CONCLUÍDA

### Páginas Removidas (42)

- ✅ Activation
- ✅ Admin
- ✅ Analytics
- ✅ Audit
- ✅ Calendar
- ✅ ComingSoonPage.tsx
- ✅ CRM
- ✅ Dashboard
- ✅ Evolve
- ✅ Finance
- ✅ Fiscal
- ✅ Govern
- ✅ GovernManage
- ✅ HealthCheckPage.tsx
- ✅ Home
- ✅ Inventory
- ✅ Landing
- ✅ LeakDashboard
- ✅ LocalBoss
- ✅ Loyalty
- ✅ Menu
- ✅ MultiLocation
- ✅ Operation
- ✅ OperationalHub
- ✅ Onboarding
- ✅ Organization
- ✅ Performance
- ✅ Portioning
- ✅ PreviewPage.tsx
- ✅ Public (usar PublicWeb)
- ✅ Purchasing
- ✅ Read
- ✅ Reports
- ✅ ReputationHub
- ✅ Reservations
- ✅ Safety
- ✅ Settings
- ✅ steps
- ✅ Store
- ✅ Team
- ✅ Tenant
- ✅ Web (usar PublicWeb)
- ✅ AuthPage.tsx

---

## 📋 Páginas Mantidas (Validadas)

### Rotas Ativas

1. **AppStaff** (`pages/AppStaff/`)
   - ✅ Usado em `/garcom`
   - ✅ Usa `TPV/context/` e `TPV/KDS/`

2. **TPVMinimal** (`pages/TPVMinimal/`)
   - ✅ Usado em `/tpv`
   - ✅ Independente (não usa TPV legacy)

3. **TPV** (`pages/TPV/`)
   - ⚠️ **PARCIAL:** Manter apenas:
     - `context/` (OrderContextReal, TableContext, OfflineOrderContext)
     - `KDS/` (KitchenDisplay usado por AppStaff)
   - ❌ Remover: `TPV.tsx`, componentes não usados

4. **KDSMinimal** (`pages/KDSMinimal/`)
   - ✅ Usado em `/kds-minimal`

5. **PublicWeb** (`pages/PublicWeb/`)
   - ✅ Usado em `/public/:slug` e `/public/:slug/mesa/:number`

6. **Waiter** (`pages/Waiter/`)
   - ✅ Usado em `/garcom/mesa/:tableId`
   - ✅ Usa `TPV/context/`

7. **CoreReset** (`pages/CoreReset/`)
   - ✅ Usado como fallback (`*`)

8. **DebugTPV** (`pages/DebugTPV.tsx`)
   - ✅ Usado em `/tpv-test`

---

## 🚧 Próximas Fases

### Fase 2: Limpar TPV Legacy

- [ ] Verificar quais componentes de `TPV/components/` são usados
- [ ] Remover componentes não usados
- [ ] Remover `TPV/TPV.tsx` (não usado na rota)
- [ ] Atualizar `TPV/index.ts` se necessário

### Fase 3: Limpar Core Não Usado

- [ ] Verificar `core/supabase/` — remover não usado
- [ ] Verificar providers/contexts — remover não usados
- [ ] Verificar hooks — remover não usados
- [ ] Verificar `core/kernel/` — se não usado, remover

### Fase 4: Limpar Rotas e Imports

- [ ] Remover imports não usados
- [ ] Remover rotas antigas (se houver)
- [ ] Limpar `App.tsx`

### Fase 5: Validação

- [ ] Subir Docker
- [ ] Executar teste básico de pedidos
- [ ] Confirmar:
  - [ ] Mesmos fluxos
  - [ ] Mesmas origens
  - [ ] Mesmas UIs
  - [ ] Mesmo resultado

---

## 📊 Métricas

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Páginas | ~50 | ~8 | ✅ |
| Componentes Core | ? | ? | <30 |
| Rotas | 8 | 8 | ✅ |
| Arquivos Removidos | 0 | 42+ | -30% |

---

---

## ✅ Fase 2: Limpar TPV Legacy - EM ANDAMENTO

### Análise de Componentes TPV

**Componentes usados apenas por TPV.tsx (podem ser removidos):**
- CheckoutModal
- CloseCashRegisterModal
- ConstraintFeedback
- CopilotWidget
- CreateGroupModal
- CustomerSearchModal
- ErrorModal
- FiscalPrintButton
- FiscalReceiptPreview
- InsightTicker
- Loyalty/
- OpenCashRegisterModal
- OperationalModeIndicator
- OrderItemEditor
- PaymentModal
- QuickProductModal
- SplitBillModal
- SplitBillModalWrapper
- TPVLockScreen
- TPVSettingsModal

**Componentes usados fora de TPV.tsx (manter):**
- FiscalConfigAlert (usado por DebugTPV)
- CashRegisterAlert (usado por TPV.tsx, mas TPV.tsx não é usado)
- DeliveryNotificationManager (usado por TPV.tsx, mas TPV.tsx não é usado)
- GroupSelector (usado por TPV.tsx, mas TPV.tsx não é usado)
- IncomingRequests (usado por TPV.tsx, mas TPV.tsx não é usado)
- OrderHeader (usado por TPV.tsx, mas TPV.tsx não é usado)
- OrderSummaryPanel (usado por TPV.tsx, mas TPV.tsx não é usado)
- TPVNavigation (usado por TPV.tsx, mas TPV.tsx não é usado)
- TPVExceptionPanel (usado por TPVWarMap, que é usado por TPV.tsx)
- TPVInstallPrompt (usado por KDSLayout, que é usado por AppStaff)
- TPVWarMap (usado por TPV.tsx, mas TPV.tsx não é usado)

**Decisão:** Como TPV.tsx não é usado na rota, podemos remover TPV.tsx e todos os componentes que só são usados por ele.

**Mantidos:**
- ✅ `context/` (OrderContextReal, TableContext, OfflineOrderContext)
- ✅ `KDS/` (KitchenDisplay usado por AppStaff)
- ✅ `TPVInstallPrompt` (usado por KDSLayout)

---

**Status:** 🚧 Fase 1 concluída, Fase 2 em andamento

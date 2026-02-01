**Status:** ARCHIVED  
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md  
**Arquivado em:** 2026-01-28

---

# 🔧 Plano de Refatoração - Remoção de Código Morto

**Data:** 2026-01-26  
**Status:** 🚧 **EM EXECUÇÃO**  
**Objetivo:** Eliminar TODO ruído, legado, código morto e dependências desnecessárias

---

## ✅ Componentes Validados (MANTER)

### Rotas Ativas (App.tsx)

| Rota | Componente | Status |
|------|------------|--------|
| `/kds-minimal` | `KDSMinimal` | ✅ MANTER |
| `/public/:slug` | `PublicWebPage` | ✅ MANTER |
| `/public/:slug/mesa/:number` | `TablePage` | ✅ MANTER |
| `/tpv` | `TPVMinimal` | ✅ MANTER |
| `/tpv-test` | `DebugTPV` | ✅ MANTER |
| `/garcom` | `AppStaff` | ✅ MANTER |
| `/garcom/mesa/:tableId` | `TablePanel` | ✅ MANTER |
| `*` | `CoreResetPage` | ✅ MANTER |

### Componentes Core Validados

- ✅ **AppStaff** (`pages/AppStaff/`) — Completo
- ✅ **TPVMinimal** (`pages/TPVMinimal/`) — TPV real
- ✅ **KDSMinimal** (`pages/KDSMinimal/`) — KDS
- ✅ **PublicWeb** (`pages/PublicWeb/`) — QR Mesa e Web Pública
- ✅ **Waiter** (`pages/Waiter/`) — TablePanel usado por AppStaff
- ✅ **CoreReset** (`pages/CoreReset/`) — Fallback
- ✅ **DebugTPV** (`pages/DebugTPV.tsx`) — Teste

### Core Boundary

- ✅ `core-boundary/` — Interface com Docker Core

---

## 🔴 Componentes para REMOVER

### Páginas Não Usadas

#### Analytics
- ❌ `pages/Analytics/` — Não usado nos testes

#### CRM
- ❌ `pages/CRM/` — Não usado

#### Finance
- ❌ `pages/Finance/` — Não usado

#### Inventory
- ❌ `pages/Inventory/` — Não usado

#### Onboarding
- ❌ `pages/Onboarding/` — Não usado (sistema já configurado)

#### Dashboard (Legacy)
- ❌ `pages/Dashboard/` — Não usado (CoreResetPage é o fallback)

#### Settings (Legacy)
- ❌ `pages/Settings/` — Não usado nos testes

#### Outros
- ❌ `pages/Activation/`
- ❌ `pages/Admin/`
- ❌ `pages/Audit/`
- ❌ `pages/AuthPage.tsx` (não usado)
- ❌ `pages/Calendar/`
- ❌ `pages/ComingSoonPage.tsx`
- ❌ `pages/CRM/`
- ❌ `pages/Evolve/`
- ❌ `pages/Fiscal/`
- ❌ `pages/Govern/`
- ❌ `pages/GovernManage/`
- ❌ `pages/HealthCheckPage.tsx`
- ❌ `pages/Home/`
- ❌ `pages/Landing/`
- ❌ `pages/LeakDashboard/`
- ❌ `pages/LocalBoss/`
- ❌ `pages/Loyalty/`
- ❌ `pages/Menu/`
- ❌ `pages/MultiLocation/`
- ❌ `pages/Operation/`
- ❌ `pages/OperationalHub/`
- ❌ `pages/Organization/`
- ❌ `pages/Performance/`
- ❌ `pages/Portioning/`
- ❌ `pages/PreviewPage.tsx`
- ❌ `pages/Public/` (usar PublicWeb)
- ❌ `pages/Purchasing/`
- ❌ `pages/Read/`
- ❌ `pages/Reports/`
- ❌ `pages/ReputationHub/`
- ❌ `pages/Reservations/`
- ❌ `pages/Safety/`
- ❌ `pages/steps/`
- ❌ `pages/Store/`
- ❌ `pages/Team/`
- ❌ `pages/Tenant/`
- ❌ `pages/Web/` (usar PublicWeb)

### TPV Legacy

- ❌ `pages/TPV/` — **ATENÇÃO:** Verificar se TPVMinimal usa algo de TPV antes de remover
  - Se TPVMinimal for independente → REMOVER TPV completo
  - Se TPVMinimal usar componentes de TPV → Manter apenas o necessário

### Componentes Core Não Usados

#### Supabase Não Usado
- ❌ `core/supabase/` — Verificar o que é usado vs não usado
  - Manter apenas: `index.ts` (se usado)
  - Remover: SQL migrations não usadas, funções não chamadas

#### Providers/Contexts Não Usados
- Verificar cada provider/context:
  - Se não importado → REMOVER
  - Se importado mas não usado → REMOVER

#### Hooks Não Usados
- Verificar cada hook:
  - Se não importado → REMOVER

### Rotas Antigas

- ❌ Qualquer rota não listada em "Rotas Ativas"

---

## 📋 Plano de Execução

### Fase 1: Mapeamento Completo ✅

- [x] Identificar rotas ativas
- [x] Identificar componentes usados
- [x] Criar lista de remoção

### Fase 2: Remoção de Páginas Não Usadas

1. **Remover páginas grandes primeiro:**
   - [ ] `pages/Onboarding/`
   - [ ] `pages/Dashboard/`
   - [ ] `pages/Settings/`
   - [ ] `pages/Analytics/`
   - [ ] `pages/CRM/`
   - [ ] `pages/Finance/`
   - [ ] `pages/Inventory/`

2. **Remover páginas menores:**
   - [ ] Todas as outras listadas acima

### Fase 3: Verificar TPV

- [ ] Verificar se `TPVMinimal` usa algo de `TPV/`
- [ ] Se não usar → Remover `TPV/` completo
- [ ] Se usar → Extrair apenas o necessário

### Fase 4: Limpar Core

- [ ] Verificar `core/supabase/` — remover não usado
- [ ] Verificar providers/contexts — remover não usados
- [ ] Verificar hooks — remover não usados

### Fase 5: Limpar Rotas

- [ ] Remover rotas antigas de `App.tsx` (se houver)
- [ ] Remover imports não usados

### Fase 6: Validação

- [ ] Subir Docker
- [ ] Executar teste básico de pedidos
- [ ] Confirmar:
  - [ ] Mesmos fluxos
  - [ ] Mesmas origens
  - [ ] Mesmas UIs
  - [ ] Mesmo resultado

---

## ⚠️ Regras de Refatoração

1. **Refatorar SEM mudar comportamento**
2. **Refatorar SEM quebrar testes**
3. **Refatorar módulo por módulo**
4. **Cada remoção deve ser justificável**
5. **Preferir apagar a comentar**

---

## ✅ Critério de Sucesso

- [ ] Código mais simples
- [ ] Menos arquivos
- [ ] Menos acoplamento
- [ ] Mesmo comportamento validado

---

## 📊 Métricas

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Páginas | ~50 | ? | <10 |
| Componentes Core | ~100 | ? | <30 |
| Rotas | ~20 | 8 | 8 |
| Arquivos | ? | ? | -30% |

---

**Status:** 🚧 Em execução

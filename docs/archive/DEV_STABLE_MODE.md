# DEV_STABLE_MODE - Documentação de Verificação

## Contexto

DEV_STABLE_MODE reduz o runtime DEV para um estado previsível e mínimo (Gate/Auth/Tenant apenas), elimina ruído de transporte (SW/Workbox, Realtime, polling, guardian pulses, remote logs), aplica uma única entrada e garante que o Kernel não pode inicializar/executar sem um contexto selado.

## Detecção

O modo é ativado automaticamente quando:
- `import.meta.env.DEV === true` E
- `hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')`

**Overrides via query string:**
- `?devStable=0` - Desabilita (mesmo em localhost)
- `?devStable=1` - Força ativação (mesmo se não for localhost, mas ainda requer DEV)

## Verificação (Pass/Fail)

### Teste 1: Idle Validation
1. Abra `http://localhost:5175/app/select-tenant`
2. Aguarde 2-3 minutos sem interação
3. Verifique no console do navegador:

**✅ PASSA se:**
- Não há spam de roteamento Workbox
- Não há 400s repetidos
- Não há spam de pulse
- Não há loop repetido de resolução de tenant
- Logs são mínimos (apenas hard-stop reasons)

**❌ FALHA se:**
- Há múltiplas tentativas de registro de Service Worker
- Há erros 400 repetidos (especialmente de app_logs)
- Há logs repetidos de "Checking Pulse"
- Há logs repetidos de resolução de tenant
- Há spam de realtime subscriptions

### Teste 2: Toggle Off
1. Adicione `?devStable=0` à URL
2. Recarregue a página
3. Verifique que comportamento normal retorna:
   - Realtime subscriptions funcionam
   - Polling está ativo
   - Guardian pulse está ativo
   - Remote logging está ativo

### Teste 3: Kernel Hard-Stop
1. Em DEV_STABLE_MODE, tente acessar uma rota que requer Kernel (ex: `/app/tpv`)
2. **✅ PASSA se:** Kernel não inicializa e mostra status FROZEN ou erro claro
3. **❌ FALHA se:** Kernel tenta inicializar sem tenant selado

### Teste 4: Single Entry Rule
1. Em DEV_STABLE_MODE, tente acessar `/onboarding/*`
2. **✅ PASSA se:** Redireciona automaticamente para `/app/select-tenant`
3. **❌ FALHA se:** OnboardingProvider monta e compete com App

## Checklist de Implementação

### ✅ SSOT (Single Source of Truth)
- [x] Módulo `devStableMode.ts` criado
- [x] Todas as verificações ad-hoc substituídas por `isDevStableMode()`
- [x] Função `devStableReason()` disponível para logs

### ✅ Transport Freeze
- [x] Service Worker: Preflight unregister em `index.html`
- [x] Realtime: Congelado em `OrderContextReal`, `OrderContext`, `DeliveryMonitor`, `FeatureFlagContext`, `TableContext`
- [x] Polling: Congelado em `OrderContextReal`, `OrderContext`
- [x] Guardian Pulse: Congelado em `SystemGuardianContext`
- [x] Remote Logging: Desabilitado em `Logger.ts`
- [x] Performance Flush: Desabilitado em `performanceMonitor.ts`

### ✅ Gate e Context Determinismo
- [x] Context selado definido: `tenantId` presente E `tenantStatus === 'ACTIVE'`
- [x] FlowGate fuse implementado (keyed por `userId+pathname`, 1200ms window)
- [x] TenantContext: Guard in-flight para prevenir chamadas paralelas
- [x] TenantContext: Respeita tenant selado (não sobrescreve)

### ✅ Single Entry Rule
- [x] `DevStableEntryGate` redireciona `/onboarding/*` para `/app/select-tenant`
- [x] OnboardingProvider não monta em DEV_STABLE_MODE

### ✅ Kernel Safety
- [x] Kernel não inicializa se tenant não selado
- [x] Kernel não inicializa em DEV_STABLE_MODE (status FROZEN)
- [x] `useKernel()` consumidores usam `executeSafe()` ou verificam `isReady`
- [x] Fail-closed guards em `OrderContextReal`, `TableContext`, `useMenuState`

### ✅ Observabilidade Limpa
- [x] Logs permitidos: banner de boot único, ações explícitas do usuário, hard-stop reasons
- [x] Logs silenciados: polling ticks, "Checking Pulse" repetido, resolução de tenant repetida
- [x] `?debug=1` reabilita logs verbosos por subsistema

## Sequência de Reativação Futura (Pós-Fase A)

Ordem documentada para reativar subsistemas:

1. **Gate/Auth/Tenant** (já ativo)
   - Trigger: Base do sistema
   - Console signature: `[FlowGate] ✅ Allowed`
   - Rollback: `?devStable=0`

2. **Kernel Boot**
   - Trigger: Tenant selado + `?devStable=0`
   - Console signature: `[KernelProvider] Kernel Booted Successfully`
   - Rollback: `?devStable=1` ou deselecionar tenant

3. **Domain Providers**
   - Trigger: Kernel READY
   - Console signature: Depende do provider
   - Rollback: Desabilitar provider específico

4. **Realtime**
   - Trigger: `?devStable=0` + Kernel READY
   - Console signature: `[OrderContext] Realtime subscription active`
   - Rollback: `?devStable=1`

5. **Monitoring/Telemetry**
   - Trigger: `?devStable=0`
   - Console signature: Logs aparecem em `app_logs`
   - Rollback: `?devStable=1`

## Arquivos Modificados

- `merchant-portal/src/core/runtime/devStableMode.ts` - SSOT
- `merchant-portal/index.html` - SW preflight
- `merchant-portal/src/core/guardian/SystemGuardianContext.tsx` - Pulse freeze
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` - Realtime/polling freeze
- `merchant-portal/src/core/flow/FlowGate.tsx` - SSOT usage
- `merchant-portal/src/core/kernel/KernelContext.tsx` - Hard-stop
- `merchant-portal/src/core/logger/Logger.ts` - Remote ingestion freeze
- `merchant-portal/src/core/monitoring/performanceMonitor.ts` - Flush freeze
- `merchant-portal/src/core/flags/FeatureFlagContext.tsx` - Realtime freeze
- `merchant-portal/src/modules/delivery/DeliveryMonitor.tsx` - Realtime freeze
- `merchant-portal/src/pages/TPV/context/OrderContext.tsx` - Realtime freeze
- `merchant-portal/src/pages/TPV/context/TableContext.tsx` - Realtime freeze + fail-closed guards
- `merchant-portal/src/pages/Menu/useMenuState.ts` - Fail-closed guards
- `merchant-portal/src/App.tsx` - Single entry rule

## Notas

- Todas as mudanças são DEV-only e reversíveis
- Produção não é afetada (verificação `import.meta.env.DEV`)
- Comportamento observável via `devStableReason()`
- Logs podem ser reabilitados com `?debug=1`

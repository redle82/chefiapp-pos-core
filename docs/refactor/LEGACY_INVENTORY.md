# LEGACY INVENTORY - ChefIApp Core

> Inventário brutal de código morto, legacy e duplicações.
> Data: 2026-01-24
> Validado por: MEGA OPERATIONAL SIMULATOR v2.1

---

## RESUMO EXECUTIVO

| Categoria | Quantidade |
|-----------|------------|
| Arquivos/Módulos com funções mortas | 12 |
| Componentes não utilizados | 10 |
| Hooks não utilizados | 3 |
| Edge Functions não configuradas | 17 |
| TODOs/FIXMEs antigos | 80+ |
| Arquivos com código comentado | 60+ |
| Código duplicado | 5 pares |
| Stubs/Mocks não utilizados | 8 |

---

## FASE 2 - CLASSIFICAÇÃO

### 🟢 CORE (Exercitado pelo Simulador)

Estes arquivos são INTOCÁVEIS:

```
docker-tests/simulators/simulate-24h.js
docker-tests/simulators/kds-kitchen.js
docker-tests/simulators/kds-bar.js
docker-tests/simulators/print-emulator.js
docker-tests/task-engine/policies/*.json
docker-tests/seeds/profiles/*.json
docker-tests/Makefile
```

### 🟡 SUPORTE (Infra, Seed, Teste)

```
supabase/migrations/*
supabase/functions/stripe-billing-webhook/*  (configurado)
supabase/functions/stripe-billing/*  (configurado)
supabase/functions/stripe-payment/*  (configurado)
supabase/functions/stripe-webhook/*  (configurado)
server/fiscal-queue-worker.ts  (usado em produção)
server/web-module-api-server.ts  (usado em produção)
```

### 🔴 LEGACY MORTO (Remover)

---

## MERCHANT-PORTAL

### Componentes/Hooks Mortos

| Arquivo | Tipo | Status |
|---------|------|--------|
| `src/core/auth/useAuthStateMachine.ts` | Hook @deprecated | 🔴 REMOVER |
| `src/core/auth/AuthBoundary.tsx` | Componente @deprecated | 🔴 REMOVER |
| `src/core/state/SystemStateProvider.tsx` | Stub duplicado | 🔴 REMOVER |
| `src/components/Dashboard/SentimentReflector.tsx` | Componente não usado | 🔴 REMOVER |

### Serviços Stub (Nunca Implementados)

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `src/core/ai/MLForecastingService.ts` | ML não implementado | 🔴 REMOVER |
| `src/core/ar/ARMenuService.ts` | AR não implementado | 🔴 REMOVER |
| `src/core/vision/ComputerVisionService.ts` | CV não implementado | 🔴 REMOVER |
| `src/core/crypto/QuantumSafeCryptoService.ts` | Crypto futuro | 🔴 REMOVER |
| `src/core/social/SocialMediaService.ts` | Social não integrado | 🔴 REMOVER |

### TODOs Críticos (Avaliar)

| Arquivo | Linha | Descrição | Status |
|---------|-------|-----------|--------|
| `src/core/fiscal/FiscalQueueWorker.ts` | 117+ | Dead letter queue | 🟡 MANTER |
| `src/core/fiscal/FiscalPrinter.ts` | 236 | Geração PDF | 🟡 MANTER |
| `src/core/payment/StripeTerminalContext.tsx` | 27 | Currency dinâmica | 🟡 MANTER |
| `src/pages/TPV/TPV.tsx` | 1604 | operatorName/terminalId | 🟡 MANTER |

---

## MOBILE-APP

### Componentes Mortos

| Arquivo | Tipo | Status |
|---------|------|--------|
| `components/FastPaySheet.tsx` | Não utilizado | 🔴 REMOVER |
| `components/SyncStatusIndicator.tsx` | Não utilizado | 🔴 REMOVER |
| `components/EditScreenInfo.tsx` | Exemplo Expo | 🔴 REMOVER |
| `components/ExternalLink.tsx` | Só usado em exemplo | 🔴 REMOVER |
| `components/StyledText.tsx` | Só usado em exemplo | 🔴 REMOVER |

### Hooks Mortos

| Arquivo | Tipo | Status |
|---------|------|--------|
| `hooks/usePushNotifications.ts` | Não utilizado | 🔴 REMOVER |

### Arquivos Duplicados

| Arquivo | Duplica | Status |
|---------|---------|--------|
| `lib/supabase.ts` | `services/supabase.ts` | 🔴 REMOVER |
| `services/Logger.ts` | `services/logging.ts` | 🔴 REMOVER |

### Telas de Exemplo

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `app/modal.tsx` | Tela exemplo Expo Router | 🔴 REMOVER |

---

## SERVER

### Módulos Inteiros Mortos

| Diretório/Arquivo | Descrição | Status |
|-------------------|-----------|--------|
| `server/local-boss/*` | Mocks vazios, nunca implementado | 🔴 REMOVER TODO |
| `server/operational-hub/adapters/ifood.ts` | Stub não usado | 🔴 REMOVER |
| `server/operational-hub/adapters/uber-eats.ts` | Stub não usado | 🔴 REMOVER |

### TODOs em Produção (Manter mas Limpar)

| Arquivo | Linha | Descrição | Status |
|---------|-------|-----------|--------|
| `server/fiscal-queue-worker.ts` | 454 | Notificação gerente | 🟡 MANTER |
| `server/web-module-api-server.ts` | 196 | Validar session | 🟡 MANTER |
| `server/web-module-api-server.ts` | 1009 | Real auth | 🟡 MANTER |

---

## SUPABASE FUNCTIONS

### Edge Functions NÃO CONFIGURADAS (17 funções)

| Função | Referenciada? | Status |
|--------|---------------|--------|
| `health/` | Não | 🔴 REMOVER |
| `analytics-engine/` | Não | 🔴 REMOVER |
| `sync-menu-external/` | Não | 🔴 REMOVER |
| `webhook-glovo/` | Não | 🔴 REMOVER |
| `webhook-deliveroo/` | Não | 🔴 REMOVER |
| `webhook-gloriafood/` | Não | 🔴 REMOVER |
| `change-plan/` | Não | 🔴 REMOVER |
| `cancel-subscription/` | Não | 🔴 REMOVER |
| `create-subscription/` | Não | 🔴 REMOVER |
| `update-subscription-status/` | Não | 🔴 REMOVER |
| `reconcile/` | Sim (SovereigntyService) | 🟡 AVALIAR |
| `repair-membership/` | Não | 🔴 REMOVER |
| `satellite_connector/` | Sim (process_pulses) | 🟡 AVALIAR |
| `process_pulses/` | Não cron | 🔴 REMOVER |
| `create-tenant/` | Não | 🔴 REMOVER |
| `advanced-provisioner/` | Não | 🔴 REMOVER |
| `delivery-proxy/` | Não | 🔴 REMOVER |
| `stripe-reports/` | Não | 🔴 REMOVER |

---

## CUSTOMER-PORTAL

### Código Quebrado (Inconsistências de Interface)

| Arquivo | Problema | Status |
|---------|----------|--------|
| `components/CartDrawer.tsx` | Usa props inexistentes no CartContext | 🔴 CORRIGIR/REMOVER |
| `components/CartFloatingButton.tsx` | Usa props inexistentes | 🔴 CORRIGIR/REMOVER |
| `components/ProductModal.tsx` | Interface inconsistente | 🔴 CORRIGIR |

### Funções Não Utilizadas

| Arquivo | Função | Status |
|---------|--------|--------|
| `context/CartContext.tsx` | `initiateCheckout()` | 🔴 REMOVER |
| `lib/pixel.ts` | `trackPurchase()`, `trackSearch()` | 🔴 REMOVER |

---

## CÓDIGO DUPLICADO (Consolidar)

| Par | Descrição | Ação |
|-----|-----------|------|
| `mobile-app/lib/supabase.ts` ↔ `mobile-app/services/supabase.ts` | Duas configs Supabase | Manter só `services/` |
| `mobile-app/services/Logger.ts` ↔ `mobile-app/services/logging.ts` | Dois loggers | Manter só `logging.ts` |
| `server/local-boss/*.ts` | Mocks duplicados | Remover todo diretório |

---

## LÓGICA DUPLICADA (FASE 4)

### Offline/Retry Espalhado

- `merchant-portal/src/core/offline/*` → Consolidar
- `mobile-app/hooks/useOfflineSync.ts` → Usar `services/`
- `docker-tests/simulators/simulate-24h.js` → Fonte de verdade

### SLA/Governança Espalhado

- `merchant-portal/src/core/sovereignty/*` → Fonte de verdade
- `server/govern/*` → Avaliar se duplica
- `docker-tests/task-engine/*` → Fonte de verdade para testes

---

## PLANO DE REMOÇÃO (FASE 3)

### Lote 1 - Baixo Risco (Componentes não usados)
```
rm merchant-portal/src/core/auth/useAuthStateMachine.ts
rm merchant-portal/src/core/auth/AuthBoundary.tsx
rm merchant-portal/src/core/state/SystemStateProvider.tsx
rm merchant-portal/src/components/Dashboard/SentimentReflector.tsx
```

### Lote 2 - Serviços Stub
```
rm merchant-portal/src/core/ai/MLForecastingService.ts
rm merchant-portal/src/core/ar/ARMenuService.ts
rm merchant-portal/src/core/vision/ComputerVisionService.ts
rm merchant-portal/src/core/crypto/QuantumSafeCryptoService.ts
rm merchant-portal/src/core/social/SocialMediaService.ts
```

### Lote 3 - Mobile Cleanup
```
rm mobile-app/components/FastPaySheet.tsx
rm mobile-app/components/SyncStatusIndicator.tsx
rm mobile-app/components/EditScreenInfo.tsx
rm mobile-app/components/ExternalLink.tsx
rm mobile-app/components/StyledText.tsx
rm mobile-app/hooks/usePushNotifications.ts
rm mobile-app/lib/supabase.ts
rm mobile-app/services/Logger.ts
rm mobile-app/app/modal.tsx
```

### Lote 4 - Server Cleanup
```
rm -rf server/local-boss/
rm server/operational-hub/adapters/ifood.ts
rm server/operational-hub/adapters/uber-eats.ts
```

### Lote 5 - Edge Functions (Alto Risco)
```
rm -rf supabase/functions/health/
rm -rf supabase/functions/analytics-engine/
rm -rf supabase/functions/sync-menu-external/
rm -rf supabase/functions/webhook-glovo/
rm -rf supabase/functions/webhook-deliveroo/
rm -rf supabase/functions/webhook-gloriafood/
rm -rf supabase/functions/change-plan/
rm -rf supabase/functions/cancel-subscription/
rm -rf supabase/functions/create-subscription/
rm -rf supabase/functions/update-subscription-status/
rm -rf supabase/functions/repair-membership/
rm -rf supabase/functions/process_pulses/
rm -rf supabase/functions/create-tenant/
rm -rf supabase/functions/advanced-provisioner/
rm -rf supabase/functions/delivery-proxy/
rm -rf supabase/functions/stripe-reports/
```

---

## VALIDAÇÃO OBRIGATÓRIA

Após cada lote:

```bash
cd docker-tests
make simulate-24h-small
make assertions
```

**FALHOU?** → Reverter imediatamente:
```bash
git checkout -- .
```

---

## ESTIMATIVA DE REDUÇÃO

| Métrica | Antes | Depois (estimado) |
|---------|-------|-------------------|
| Arquivos | ~500+ | ~450 |
| Linhas de código | ~80k+ | ~70k |
| Edge Functions | 25+ | 8 |
| TODOs | 80+ | 30 |
| Código comentado | 60+ arquivos | 20 arquivos |

---

## PRÓXIMO PASSO

1. ✅ FASE 1 - Inventário (este documento)
2. ⏳ FASE 2 - Classificação (feita acima)
3. ⏳ FASE 3 - Remoção Cirúrgica (executar lotes)
4. ⏳ FASE 4 - Consolidação
5. ⏳ FASE 5 - Limpeza de Superfície
6. ⏳ Validação Final

**Comando para iniciar FASE 3:**
```bash
# Lote 1 - Baixo Risco
git checkout -b refactor/cleanup-phase3-lot1
# Executar remoções do Lote 1
make simulate-24h-small && make assertions
git add -A && git commit -m "refactor: remove unused auth components"
```

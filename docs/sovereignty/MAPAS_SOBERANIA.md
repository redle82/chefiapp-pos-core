# 🗺️ MAPAS DE SOBERANIA — Análise Completa

**Data:** 2026-01-14  
**Status:** 🔍 **GERADO AUTOMATICAMENTE**

---

## 📊 MAPA 1: PODER DO BACKEND

### Endpoints por Domínio

### Funções Críticas

- `getOrderData` (server/fiscal-queue-worker.ts)
- `getRestaurantCountry` (server/fiscal-queue-worker.ts)
- `getRestaurantFiscalConfig` (server/fiscal-queue-worker.ts)
- `selectAdapter` (server/fiscal-queue-worker.ts)
- `createTaxDocument` (server/fiscal-queue-worker.ts)
- `recordFiscalEvent` (server/fiscal-queue-worker.ts)
- `processFiscalQueueItem` (server/fiscal-queue-worker.ts)
- `markCompleted` (server/fiscal-queue-worker.ts)
- `workerLoop` (server/fiscal-queue-worker.ts)
- `startWorker` (server/fiscal-queue-worker.ts)

---

## 📊 MAPA 2: ROTAS DO FRONTEND

### Rotas e Ações

### /public/*

- verificar_manualmente

### /

- verificar_manualmente

### /health

- verificar_manualmente

### /auth

- verificar_manualmente

### /login

- verificar_manualmente

### /signup

- verificar_manualmente

### /join

- verificar_manualmente

### /start

- verificar_manualmente

### /onboarding/*

- verificar_manualmente

### /migration/wizard

- verificar_manualmente

### /activation

- verificar_manualmente

### /kds/:restaurantId

- verificar_manualmente

### /bootstrap

- verificar_manualmente

### /read

- verificar_manualmente

### /app

- verificar_manualmente

### /dashboard

- verificar_manualmente

### /tpv

- verificar_manualmente

### /kds

- verificar_manualmente

### /menu

- verificar_manualmente

### /pulses

- verificar_manualmente

### /wizard

- verificar_manualmente

### /dev/wizard

- verificar_manualmente

---

## 📊 MAPA 3: ESTADOS DO BANCO

### Estados por Tabela

### operation_status

- `active`
- `paused`
- `suspended`

### feedback_type

- `bug`
- `feature`
- `other`

### feedback_severity

- `low`
- `medium`
- `high`
- `critical`

### feedback_status

- `open`
- `investigating`
- `resolved`
- `ignored`

### gm_orders_status

- `active`
- `paid`
- `cancelled`

### Transições Possíveis

### gm_orders

- `pending` → `preparing`, `canceled`
- `preparing` → `ready`, `canceled`
- `ready` → `delivered`, `canceled`
- `delivered` → `closed`
- `closed` → **TERMINAL**
- `paid` → **TERMINAL**
- `locked` → **TERMINAL**
- `canceled` → **TERMINAL**

---

## 🔍 PRÓXIMOS PASSOS

1. Revisar cada endpoint e verificar se tem UI correspondente
2. Revisar cada rota e verificar se cobre todos os estados
3. Revisar cada estado e verificar se é alcançável via UI
4. Gerar Matriz de Representação (ver REPRESENTATION_MATRIX.md)

---

**Última atualização:** 2026-01-14T19:51:09.528Z

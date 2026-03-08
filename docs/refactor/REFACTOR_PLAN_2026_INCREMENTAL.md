# Plano de refatoração 2026 — Incremental (opção A)

**Escolha:** A — Refatoração incremental, commits pequenos.  
**Referência:** [STACK_2026.md](../architecture/STACK_2026.md), [ENV_MATRIX.md](../ops/ENV_MATRIX.md)

---

## Semana 1 — Fase 1: Consolidação de infra ✅ (concluída no código/docs)

**Objetivo:** 1 cloud = Supabase. Eliminar Render e gateway duplicado.

### 1.1 Webhooks já em Edge (verificação) ✅

- [x] Edge Functions existem: `webhook-stripe`, `webhook-sumup` (e billing, internal-events, sumup-create/get-checkout, payment-pix-checkout).
- [x] **Stripe:** assinatura com `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`; depois RPC `process_webhook_event` com `event.id`.
- [x] **SumUp:** HMAC-SHA256 com `SUMUP_WEBHOOK_SECRET`; depois RPC `process_webhook_event` com `eventId` estável.
- [x] **Idempotência:** RPC `process_webhook_event` em `webhook_events` faz check `WHERE provider = p_provider AND event_id = p_event_id` e retorna "Duplicate event ignored" se já existir (docker-core/schema/migrations/20260323_day4_webhook_infrastructure.sql).

### 1.2 Variáveis centralizadas ✅

- [x] `docs/ops/ENV_MATRIX.md` é a referência única (Frontend vs Edge; sem duplicação de nomes).
- [x] `merchant-portal/.env.local.example` e `.env.production.example` atualizados: comentário no topo a referenciar ENV_MATRIX; `VITE_API_BASE` em produção = URL Edge; texto alinhado à matriz.

### 1.3 Desligar Render / integration-gateway ✅ (código/docs)

- [x] Gateway marcado como **deprecado:** `server/integration-gateway.ts` (comentário DEPRECATED) e `docs/ops/GATEWAY_DEPRECATED.md` (o que usar em vez disso, quando apagar Render).
- [ ] **Ação em produção:** Em Vercel (e staging), definir `VITE_API_BASE=https://<PROJECT_REF>.supabase.co/functions/v1`; validar checkout Stripe, webhooks, internal-events; depois desactivar/apagar projeto no Render.

### 1.4 Critérios de “feito” Semana 1

- [x] ENV_MATRIX é a referência; .env* alinhados.
- [x] integration-gateway deprecado no código e documentado; frontend já suporta Edge via `CONFIG.isEdgeGateway` e paths por função.
- [ ] **Pendente (deploy):** Nenhum tráfego de produção depender do Render (requer alteração de env em Vercel + validação + desligar Render).

**Resumo Fase 1 (feito no repo):** Verificação Edge (webhooks + idempotência), ENV_MATRIX como referência, .env* com comentários e valores de exemplo alinhados, gateway deprecado (comentário + GATEWAY_DEPRECATED.md). Falta apenas: em produção, definir `VITE_API_BASE` para Edge, validar fluxos e desactivar Render.

---

## Semana 2 — Fase 2: Domain separation ✅ (concluída)

**Objetivo:** Separar domínio da UI; nada de lógica de negócio em componentes.

| PR | Conteúdo | Estado |
|----|----------|--------|
| 2.1 | Order já em `src/domain/order` (tipos + calculateOrderTotals + orderStatusHelpers) | ✅ Mantido; já puro |
| 2.2 | **Shift** em `src/domain/shift` (types + shiftHelpers); `types/schedule.ts` re-exporta de `@domain/shift` | ✅ Feito |
| 2.3 | **Payment** já em `src/domain/payment` (tipos + validatePaymentMethod + calculatePaymentTotals) | ✅ Mantido |
| 2.4 | **Tenant** em `src/domain/tenant` (TenantId + re-export restaurant); **Menu** em `src/domain/menu` (types + validateMenu); `core/contracts/Menu.ts` re-exporta de `@domain/menu` | ✅ Feito |
| 2.5 | Contrato documentado em `domain/README.md`: UI usa hooks/facades; não importar core/db ou SDKs em componentes | ✅ Doc; lint rule opcional depois |

Estrutura actual: `merchant-portal/src/domain/` com order, payment, shift, menu, tenant, restaurant, kitchen, reports. Type-check e imports existentes mantidos via re-exports.

---

## Semana 3 — Fase 2 (infra) + Fase 3 (offline) ✅ (concluída)

| PR | Conteúdo | Estado |
|----|----------|--------|
| 3.1 | Infra documentada em `infra/README.md`: Supabase (core/db), Edge (API_BASE), PaymentProvider, Print (PrintQueue + Processor). Regra: componentes não importam infra directamente. | ✅ Feito |
| 3.2 | Payment abstraction: interface `PaymentProvider` já em `infra/payments/interface.ts` (createPayment, getPaymentStatus, cancel, refund); Stripe/SumUp/Pix implementam; UI usa registry/PaymentBroker; excepção PCI documentada (Stripe Elements). | ✅ Já existia + doc |
| 3.3 | **ConnectivityService único:** TPVMinimal, useDynamicMenu e useMobileKDS passaram a usar `ConnectivityService.getConnectivity()` / `subscribe()` em vez de `navigator.onLine` ou estado local. | ✅ Feito |
| 3.4 | Idempotência: contrato em `docs/architecture/OFFLINE_IDEMPOTENCY_CONTRACT.md`; SyncEngine + Core RPCs + testes já cobrem idempotency_key. | ✅ Feito |
| 3.5 | PrintQueue: contrato em `docs/architecture/OFFLINE_PRINT_ORDER_CONTRACT.md`; PrintQueueProcessor já só processa job com orderId após order existir no Core. MenuCache: formato canónico { categories, products } documentado no ficheiro; legado fullCatalog com TODO remoção. | ✅ Feito |

---

## Semana 4 — Fase 4 (limpeza) + Fase 5 (observabilidade) ✅ (concluída)

| PR | Conteúdo | Estado |
|----|----------|--------|
| 4.1 | Remover `any` e casts: tipagem explícita em `core/sync/types.ts` (OrderCreateSyncPayload, OrderPaySyncPayload, OrderUpdateSyncPayload, OrderCreateSyncItem); SyncEngine usa esses tipos e `catch (err: unknown)` com `err instanceof Error`. | ✅ Feito (módulo sync) |
| 4.2 | Código morto/duplicação: guia de auditoria em `docs/refactor/FASE4_DEAD_CODE_AUDIT.md`; remoções em lotes pequenos (não aplicado em bloco). | ✅ Doc criado |
| 4.3 | Design-system: `docs/architecture/DESIGN_SYSTEM_ALIGNMENT.md` — regras (tokens, cores, espaçamento, componentes partilhados); alinhamento incremental. | ✅ Feito |
| 4.4 | HealthPanel: ObservabilityPage já tinha connectivity, filas (order + print), últimos erros; adicionado "Atualizado às HH:MM:SS" (lastUpdatedAt) e refresh ao atualizar fila. | ✅ Feito |

---

## Regra de ouro

Nenhuma feature nova durante a refatoração. Cada PR é estabilização, consolidação ou clareza — não expansão.

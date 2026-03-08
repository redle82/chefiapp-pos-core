# ChefIApp POS 2026 — Arquitetura Oficial (Stack Enxuta, Global, Offline-first)

**Data:** Fevereiro 2026  
**Estado:** Canónico — norte para migração e produto vendável.  
**Relacionado:** [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md), [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md), [PAYMENT_LAYER.md](./PAYMENT_LAYER.md)

---

## Objetivo

Um POS/PWA global que seja:

- **rápido** — UX + performance
- **bonito** — design system consistente
- **efetivo** — não morre sem internet
- **vendável** — suporte possível, segurança sólida
- **simples de operar** — poucos moving parts

---

## Stack Oficial

### Client

- PWA (TPV / Waiter / KDS) — React + Vite
- Offline-first: IndexedDB + Service Worker
- Device layer: Print Queue + reprint + device status
- i18n: pt-BR / pt-PT / en / es

### Hosting

- **Vercel** — frontend / static / routing

### Cloud Core

- **Supabase**
  - Postgres
  - Auth
  - RLS multi-tenant por `restaurant_id`
  - Realtime (onde fizer sentido)
  - Storage (opcional)

### Server-side logic

- **Supabase Edge Functions**
  - Webhooks Stripe/SumUp
  - Endpoints de apoio (quando necessário)
  - Validação/assinatura + idempotência
  - Logs/audit write-back

### Payments

- **Stripe** — RoW, Apple Pay/Google Pay via Stripe
- **SumUp** — Europa
- **Pix** — Brasil
- **Payment Abstraction Layer** no domínio — UI nunca decide regra sozinha

### Observabilidade

- **Sentry** — erros críticos apenas
- Logs estruturados por `restaurant_id`
- Health checks básicos: connectivity + queue + print queue

---

## Diagrama (visão macro)

```
                ┌─────────────────────────────┐
                │           Vercel            │
                │  Host do PWA / Merchant UI  │
                └──────────────┬──────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                         Client Layer                       │
│  PWA (TPV / Waiter / KDS)                                  │
│  - UI + Design System                                      │
│  - OfflineBanner                                           │
│  - MenuCache (IndexedDB)                                   │
│  - Order Queue (IndexedDB)                                 │
│  - PrintQueue (IndexedDB)                                  │
│  - SyncEngine (online/offline/degraded + heartbeat)        │
└───────────────┬───────────────────────────────┬──────────┘
                │                               │
      (Reads/Writes)                     (Print jobs)
                │                               │
                ▼                               ▼
┌───────────────────────────┐          ┌──────────────────────┐
│        Supabase Core       │          │    Device Layer       │
│  Postgres + RLS + Auth     │          │ Browser print / future│
│  - orders, shifts, menu    │          │ wrapper (Electron)    │
│  - audit logs              │          └──────────────────────┘
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────────────────────────┐
│          Supabase Edge Functions              │
│ - Webhooks Stripe/SumUp                      │
│ - Validação assinatura + idempotência         │
│ - Atualiza DB (status pagamento / audit trail)│
└──────────────┬────────────────────────────────┘
               │
               ▼
      ┌───────────────────────┐
      │ Payments Providers      │
      │ Stripe / SumUp / Pix    │
      └─────────────────────────┘
```

---

## Responsabilidades e Contratos

### 1) Offline Strategy (Client)

**Fonte da verdade do modo:** `ConnectivityService` (exposta como `SyncEngine.connectivity`).

| Modo      | Comportamento |
|-----------|----------------|
| **online**  | Escreve direto + processa filas |
| **degraded**| Escreve na fila por segurança + tenta reads + fallback |
| **offline** | Escreve em fila + reads via cache (quando possível) |

**Contrato da fila de pedidos**

- Cada evento tem: `id`, `type`, `payload`, `created_at`
- Deve possuir **idempotency_key estável** (impede duplicação)

**Contrato da PrintQueue**

- Campos: `order_id`, `type`, `target`, `payload`, `status`
- **Processa apenas após confirmação de order sync** (order existe no Core)

---

### 2) Cloud Core (Supabase)

Postgres é a **fonte da verdade cloud**.

**Regras:**

- Toda tabela sensível tem RLS.
- Toda query do client tem `restaurant_id` no filtro (e RLS garante).
- Operações críticas (pay status, audit logs) são registradas.

---

### 3) Edge Functions (Server logic)

Edge é o **backend fino**.

**Usos permitidos:**

- Webhooks (Stripe/SumUp)
- “Glue” (pequenos endpoints)
- Validação e idempotência

**Usos proibidos:**

- Jobs longos
- Filas pesadas
- Processamento contínuo

---

### 4) Payment Layer

A UI **não decide** “o que é permitido” sozinha. Ela **exibe**.

**Regras:**

- **Offline** → apenas cash/manual
- **Online** → card/pix/sumup/stripe conforme região
- Confirmar pagamento **sempre** via fonte confiável (webhook/provider + DB), nunca só front-end.

---

### 5) Observabilidade (Sentry)

**Reportar somente:**

- Exceptions não tratadas
- Falhas de sync (fila presa, erro repetitivo)
- Falhas de impressão
- Falhas de webhook (edge)

**Evitar:**

- Performance tracing pesado (por enquanto)
- Logs excessivos (custo e ruído)

---

## “Não usar” (anti-overengineering oficial)

- **Render** — a menos que Edge não dê conta de webhooks/fila futura
- **Segundo banco** (ex.: “Instpost”) até haver dor real
- Microserviços
- Kubernetes
- Kafka/Event Streaming
- Data warehouse

---

## Critérios de Pronto (Definition of Done — Arquitetura 2026)

### Segurança & Isolamento

- [x] RLS ativo em todas as tabelas relevantes (auditoria: docs/audit/RLS_AUDIT_2026.md; migração Supabase: 20260222120000_rls_webhook_events_supabase.sql)
- [x] Nenhuma `service_role` key no client (docs/security/CLIENT_KEYS_AUDIT.md)
- [x] Nenhuma API key Stripe/SumUp exposta no frontend
- [x] Logs/audit por `restaurant_id` (Logger LogContext; configureSentryScope com restaurant_id)

### Offline & Operação

- [ ] Order queue funciona offline e sincroniza ao voltar
- [ ] MenuCache funciona offline
- [ ] OfflineBanner em TPV/Waiter/KDS
- [ ] PrintQueue enfileira offline e processa online
- [x] Reprint possível (mínimo) — TicketCard: botão "Reimprimir" para pedidos já enviados; "Imprimir comanda" para novos

### Pagamentos

- [x] Webhooks validados (assinatura) — Edge webhook-sumup (HMAC), webhook-stripe (constructEvent)
- [x] Idempotência no processamento (RPC process_webhook_event)
- [x] Offline só dinheiro/manual — PaymentModal isOnline=false mostra só cash; OrderContextReal valida método offline
- [ ] Status pago vem de evento confiável

### Suporte

- [x] Painel/diagnóstico mínimo: connectivity + filas pendentes + últimos erros (ObservabilityPage: Connectivity, fila order, fila print, últimos erros sessão)
- [x] Sentry com tags: `restaurant_id`, `app`, `route`, `connectivity` (main_debug, SentryTransport, SentryTagsSync em App.tsx)

---

## Roadmap natural (sem criar NASA)

**Agora (MVP vendável)**

- Stack acima
- Offline + print spooler (feito)
- i18n + setup (andando)

**Próximo degrau (quando escalar)**

- Wrapper desktop (Electron) para impressão mais confiável e integração com hardware
- Jobs agendados (se necessário) — aí sim considerar backend persistente
- Cache edge (opcional) para menu e assets

---

## Próximo passo lógico

Com a Arquitetura Oficial definida, a sequência ideal é:

1. **Arquitetura final oficial 2026** — este documento (norte).
2. **Migração Render → Supabase Edge** — webhooks/gateway; mapa de rotas, Edge Functions equivalentes, env vars, assinatura, rollout + rollback, checklist “done”.
3. **Produto vendável** — critérios de done acima + suporte e observabilidade.

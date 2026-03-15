# Smoke manual e validação automatizada por origem — Runbook

**Objetivo:** Validar que cada origem de pedido entra no pipeline e aparece no KDS (cozinha/bar) com o badge correto. **Smoke manual** = passos repetíveis pela equipa; **validação automatizada** = testes E2E no spec soberano.

## Validação automatizada (E2E)

| Origem   | Automatizado? | Spec / teste |
|----------|----------------|---------------|
| **TPV**  | Sim            | `sovereign-restaurant-id.spec.ts` — P4.1 (criar pedido → KDS; ciclo P4.2–P4.4). |
| **Web**  | Sim            | `sovereign-restaurant-id.spec.ts` — P5 Web → KDS (pedido na página pública → badge WEB no KDS). |
| **QR Mesa** | Sim        | `sovereign-restaurant-id.spec.ts` — P5 QR Mesa → KDS (pedido em `/public/:slug/mesa/1` → badge QR MESA no KDS). Requer seed com mesa 1. |
| **Roteamento Cozinha/Bar (isolado)** | Sim | Após badge: clique na aba **Cozinha** ou **Bar**; assert que o pedido aparece na estação correta (E2E Burger → Cozinha, E2E Drink → Bar). Teste P5 Bar cria pedido só com E2E Drink e assert na aba Bar. |
| **Pedido misto (Cozinha + Bar)** | Sim | Um único pedido com E2E Burger + E2E Drink: **TPV**, **Web**, **QR Mesa**, **Garçom/Comandeiro** (P5 Pedido misto Garçom). Em todos, assert que o pedido aparece na aba Cozinha e na aba Bar. Garçom usa `/app/waiter/table/:id?mode=trial` para bypass do guard em E2E. |
| **Garçom (origem)** | Sim (com bypass E2E) | Pedido misto: P5 Pedido misto Garçom. Requer `table_id` em e2e-creds (seed com SERVICE_KEY). Rota `/app/waiter` protegida por BrowserBlockGuard (mobile); E2E usa `?mode=trial` para bypass controlado. |
| **Uber Eats** | Não       | Depende de delivery-proxy; fora do ciclo Supabase puro. |
| **Glovo** | Não            | Idem. |

**Executar E2E soberano (inclui P5 Web, QR Mesa, roteamento Cozinha/Bar e pedido misto):**
```bash
E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/core/sovereign-restaurant-id.spec.ts --project=sovereign
```
Pré-requisito: seed com SERVICE_KEY (cria E2E Burger + **E2E Drink** + mesa 1 + **table_id** em e2e-creds); `tests/e2e/e2e-creds.json` com email, password, restaurant_id, slug, table_id. **Roteamento:** (1) isolado — pedidos só KITCHEN ou só BAR; (2) **pedido misto** — TPV, Web, QR Mesa e **Garçom** (via `/app/waiter/table/:tableId?mode=trial`): um pedido Burger + Drink nas abas Cozinha e Bar.

---

## Smoke manual por origem

**Pré-requisitos:**
- Seed executado com restaurante + produto (ex.: `pnpm tsx scripts/seed-e2e-user.ts` com SERVICE_KEY).
- Portal a correr (`pnpm -w merchant-portal run dev`, porta 5175).
- Login com o utilizador do seed (email/password em `tests/e2e/e2e-creds.json` ou output do seed).
- Mesmo `restaurant_id` em uso (fluxo soberano P0; após login, FlowGate sela o tenant).

**Onde confirmar no KDS:** Abrir `/op/kds`. Abas **Todas** / **Cozinha** / **Bar**. Cada card de pedido mostra **OriginBadge** (origem) e, quando aplicável, número da mesa. Itens com `station === "KITCHEN"` aparecem na aba Cozinha; `station === "BAR"` na aba Bar. **Pedido misto:** um pedido com itens de Cozinha e Bar aparece nas duas abas (o KDS filtra por estação mas mantém o mesmo pedido em cada aba com os itens respetivos).

---

## 1. TPV

| Campo | Valor |
|-------|--------|
| **Como disparar** | 1) Ir a `/op/tpv`. 2) Selecionar produto(s) e adicionar ao carrinho. 3) Clicar "Enviar para cozinha". |
| **Origem/badge esperado** | **CAIXA** (💰 verde). `sync_metadata.origin` = "TPV" ou "CAIXA". |
| **Cozinha / Bar / Ambos** | Consoante os produtos: se só KITCHEN → Cozinha; só BAR → Bar; misto → ambas as abas. |
| **Como confirmar no KDS** | Abrir `/op/kds`. Pedido novo na lista; badge **CAIXA**; verificar aba Cozinha ou Bar conforme os itens. |
| **Funciona em Supabase puro?** | Sim. |
| **Depende de Docker/delivery-proxy?** | Não. |

---

## 2. Web (página pública)

| Campo | Valor |
|-------|--------|
| **Como disparar** | 1) Abrir `/public/:slug` (ex.: `/public/meu-restaurante` — usar slug do restaurante do seed). 2) Adicionar produtos ao carrinho. 3) Abrir carrinho e confirmar pedido. |
| **Origem/badge esperado** | **WEB** (🌐 laranja). `sync_metadata.origin` = "WEB_PUBLIC". |
| **Cozinha / Bar / Ambos** | Consoante os produtos (station KITCHEN/BAR). |
| **Como confirmar no KDS** | Abrir `/op/kds`. Pedido com badge **WEB**. Verificar abas Cozinha/Bar. |
| **Funciona em Supabase puro?** | Sim (createOrder / create_order_atomic). |
| **Depende de Docker/delivery-proxy?** | Não. |

---

## 3. Garçom (waiter / comandeiro)

| Campo | Valor |
|-------|--------|
| **Como disparar** | 1) Login como utilizador do seed. 2) Ir a `/app/waiter` (ou AppStaff → mesa). 3) Selecionar uma mesa. 4) No TablePanel, adicionar itens e enviar pedido. |
| **Origem/badge esperado** | **GARÇOM** ou **APPSTAFF** (📱 azul / 👤 violeta). `sync_metadata.origin` = APPSTAFF | APPSTAFF_MANAGER | APPSTAFF_OWNER conforme role. |
| **Cozinha / Bar / Ambos** | Consoante os produtos. |
| **Como confirmar no KDS** | Abrir `/op/kds`. Pedido com badge **GARÇOM** ou **APPSTAFF**; número da mesa visível quando aplicável. |
| **Funciona em Supabase puro?** | Sim. |
| **Depende de Docker/delivery-proxy?** | Não. |

---

## 4. QR Mesa

| Campo | Valor |
|-------|--------|
| **Como disparar** | 1) Ter mesa criada no restaurante (gm_tables) com número conhecido (ex.: 1). 2) Abrir `/public/:slug/mesa/:number` (ex.: `/public/meu-restaurante/mesa/1`). 3) Adicionar produtos e clicar "Enviar pedido". |
| **Origem/badge esperado** | **QR MESA** (📋 rosa). `sync_metadata.origin` = "QR_MESA"; `sync_metadata.table_id` e `table_number` preenchidos. |
| **Cozinha / Bar / Ambos** | Consoante os produtos. |
| **Como confirmar no KDS** | Abrir `/op/kds`. Pedido com badge **QR MESA**; número da mesa no card. Abas Cozinha/Bar conforme itens. |
| **Funciona em Supabase puro?** | Sim (TablePage usa createOrder com QR_MESA e table_id/table_number em syncMetadata). |
| **Depende de Docker/delivery-proxy?** | Não. |

**Nota:** Se o restaurante não tiver mesas em `gm_tables`, a TablePage devolve "Mesa X não encontrada". É necessário criar mesa no Admin ou via seed para este smoke.

---

## 5. Uber Eats

| Campo | Valor |
|-------|--------|
| **Como disparar** | Pedidos entram via integração: adapter Uber Eats → RPC **delivery-proxy** (polling) ou webhook → create_order_atomic. Não há UI no portal para "simular" um pedido Uber Eats; requer conta/ambiente Uber Eats configurado ou injeção de teste no Core. |
| **Origem/badge esperado** | **UBER** (badge na UI quando source/ubereats). `sync_metadata.origin` / source = "DELIVERY" ou ubereats. |
| **Cozinha / Bar / Ambos** | Consoante itens (station). Painel "delivery" no KitchenDisplay quando aplicável. |
| **Como confirmar no KDS** | Abrir `/op/kds` (ou KDS com lista de pedidos). Pedido com badge UBER. |
| **Funciona em Supabase puro?** | **Não.** Depende do RPC **delivery-proxy** no Core. |
| **Depende de Docker/delivery-proxy?** | **Sim.** Sem Docker Core com delivery-proxy configurado, pedidos Uber Eats não entram no gm_orders. |

---

## 6. Glovo

| Campo | Valor |
|-------|--------|
| **Como disparar** | Idem Uber Eats: integração Glovo → delivery-proxy ou webhook → create_order_atomic. Sem UI no portal para simular. |
| **Origem/badge esperado** | **GLOVO** (badge na UI). source = glovo. |
| **Cozinha / Bar / Ambos** | Consoante itens. |
| **Como confirmar no KDS** | Pedido com badge GLOVO. |
| **Funciona em Supabase puro?** | **Não.** |
| **Depende de Docker/delivery-proxy?** | **Sim.** |

---

## Resumo: o que funciona em Supabase puro

| Origem   | Funciona em Supabase puro | Nota |
|----------|----------------------------|------|
| TPV      | Sim                        | create_order_atomic. |
| Web      | Sim                        | createOrder(..., "WEB_PUBLIC"). |
| Garçom   | Sim                        | TablePanel → createOrder com origin APPSTAFF*. |
| QR Mesa  | Sim                        | TablePage → createOrder(..., "QR_MESA", ..., { table_id, table_number }). |
| Uber Eats| Não                        | Requer Docker Core + RPC delivery-proxy. |
| Glovo    | Não                        | Requer Docker Core + RPC delivery-proxy. |

---

## Resumo: o que depende de Docker Core / delivery-proxy

- **Uber Eats** e **Glovo**: criação de pedidos no Core é feita pelo RPC **delivery-proxy** (ou pipeline de ingestão com Docker). Em ambiente apenas Supabase (sem esse RPC), pedidos destas origens **não aparecem** no KDS.
- **TPV, Web, Garçom, QR Mesa**: usam apenas `create_order_atomic` (PostgREST/Supabase ou Docker Core); funcionam em Supabase puro desde que o RPC exista no projeto.

---

## Checklist rápido (smoke manual)

Repetir para cada origem que se queira validar manualmente:

1. [ ] **TPV** — `/op/tpv` → adicionar produto → Enviar para cozinha → `/op/kds` → badge CAIXA. *(Ou correr E2E P4.1.)*
2. [ ] **Web** — `/public/:slug` → carrinho → confirmar → `/op/kds` → badge WEB. *(Ou correr E2E P5 Web.)*
3. [ ] **Garçom** — `/app/waiter` → mesa → itens → enviar → `/op/kds` → badge GARÇOM/APPSTAFF. *(Apenas manual; rota mobile.)*
4. [ ] **QR Mesa** — `/public/:slug/mesa/1` (mesa existente) → Enviar pedido → `/op/kds` → badge QR MESA. *(Ou correr E2E P5 QR Mesa.)*
5. [ ] **Uber Eats** — (se delivery-proxy ativo) pedido de teste via integração → `/op/kds` → badge UBER.
6. [ ] **Glovo** — (se delivery-proxy ativo) pedido de teste → `/op/kds` → badge GLOVO.

Para cada um: confirmar também que o pedido aparece na aba **Cozinha** ou **Bar** correta consoante os itens (produtos com station KITCHEN vs BAR).

---

*Referência: `docs/ops/SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md`, `docs/ops/P0_SOBERANO_SMOKE_FLOW.md`. Validação automatizada: `tests/e2e/core/sovereign-restaurant-id.spec.ts` (P4.1, P5 Web, P5 QR Mesa).*

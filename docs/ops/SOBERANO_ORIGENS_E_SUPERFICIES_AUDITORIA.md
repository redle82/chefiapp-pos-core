# Auditoria: Origens de Pedido e Superfícies Embutidas (Fluxo Soberano)

**Objetivo:** Mapear e validar o fluxo completo de origens de pedido e superfícies embutidas (mini TPV, mini KDS no AppStaff), convergência no KDS cozinha/bar, e lacunas face ao sistema real integrado.

**Referência:** Validação soberana P2–P4.4 em `docs/ops/P0_SOBERANO_SMOKE_FLOW.md` e `docs/ops/FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md`.

---

## 1. Estado atual por superfície embutida

### 1.1 Mini TPV no AppStaff

| Pergunta | Resposta |
|----------|----------|
| **Existe hoje?** | Sim. Várias variantes. |
| **Onde vive?** | **StaffTpvPage** (`/app/staff/mode/tpv`) = `TPVPOSView` (mesmo componente de `/op/tpv`). **TPVMobilePage** (`/app/staff/pv`) = TPV mobile. **MiniTPVMinimal** = componente compacto (carrinho + createOrder) — **não está montado em nenhuma rota** no routing atual; referenciado em docs/audits. **MiniPOS** (Waiter) = mesa + TablePanel (cria pedido com origin APPSTAFF/APPSTAFF_MANAGER/APPSTAFF_OWNER). |
| **Ligado ao mesmo `restaurant_id`?** | Sim. StaffContext/useRestaurantIdentity/TenantContext fornecem `restaurantId`; TPVPOSView e OrderProvider usam o mesmo tenant. |
| **Usa o mesmo fluxo de orders?** | Sim. StaffTpvPage e TPVMobilePage usam o mesmo pipeline (create_order_atomic via processOrderLifecycle / OrderWriter). MiniTPVMinimal chama `createOrder(restaurantId, cart, "CAIXA", "cash", {})`. |
| **Pedidos chegam ao KDS?** | Sim. Todos criados via Core RPC → `gm_orders` → `readActiveOrders` → KDS. |
| **Mock/fallback?** | Não. Fluxo real Core. |

**Resumo:** Mini TPV no AppStaff existe como **TPV completo** (TPVPOSView) e como **TPV mobile**; garçom usa MiniPOS/TablePanel. Componente **MiniTPVMinimal** existe no código mas **não está em nenhuma rota** — pode ser usado noutro contexto (ex.: dashboard) ou é legado.

### 1.2 Mini KDS no AppStaff

| Pergunta | Resposta |
|----------|----------|
| **Existe hoje?** | Sim. Duas implementações. |
| **Onde vive?** | **KitchenHome** (`/app/staff/home/kitchen`) = `StaffMiniKDS` = **KitchenDisplay** (legado `TPV/KDS/KitchenDisplay`). **Rota `/app/staff/mode/kds`** = `KitchenDisplay` diretamente. **MiniKDSMinimal** = componente compacto (readActiveOrders + readOrderItems + OriginBadge) — **não está montado em rotas**; apenas referenciado em docs. **KDSMobilePage** = feature kds-mobile. |
| **Ligado ao mesmo `restaurant_id`?** | Sim. KitchenDisplay e MiniKDSMinimal recebem/usa contexto do restaurante (identity/tenant). |
| **Usa o mesmo fluxo de orders?** | Sim. KitchenDisplay (legado) e KDSMinimal/MiniKDSMinimal usam leitura do Core (gm_orders, gm_order_items). **KDSMinimal** em `/op/kds` usa `readActiveOrders` + filtro ALL/BAR/KITCHEN. **StaffMiniKDS** usa KitchenDisplay (outra árvore de componentes). |
| **Cozinha vs Bar?** | **KDSMinimal** (`/op/kds`) tem abas Todas / Cozinha / Bar e `filterOrdersByStation(orders, "KITCHEN" \| "BAR")`. **KitchenDisplay** (AppStaff) tem perfis de painel (kitchen, bar, delivery, late). Pedidos com `item.station === "KITCHEN"` ou `"BAR"` são filtrados corretamente. |
| **Mock/fallback?** | Não. Leitura real do Core. Realtime desativado no MiniKDSMinimal (polling 30s). |

**Resumo:** Mini KDS no AppStaff é o **KitchenDisplay** (legado) em KitchenHome e em mode/kds. **MiniKDSMinimal** existe mas não está em rotas. Convergência cozinha/bar existe no KDS principal e no KitchenDisplay.

---

## 2. Estado atual por origem de pedido

### 2.1 Web (página pública)

| Pergunta | Resposta |
|----------|----------|
| **Existe?** | Sim. |
| **Onde?** | **PublicWebPage** (`/public/:slug`), **PublicStorePage** / **CartDrawer** (public store), **WebOrderingService**. |
| **Como entra?** | PublicWebPage: `createOrder(restaurant.id, orderItems, "WEB_PUBLIC", "cash")` (OrderWriter). CartDrawer (public): `WebOrderingService.submitOrderWithRetry(input, "WEB_PUBLIC", tableId)` → `createDirectOrder(..., "WEB_PUBLIC", tableId)` → `create_order_atomic` com `p_sync_metadata.origin = "WEB_PUBLIC"`. |
| **Chega ao KDS?** | Sim. Pedido em `gm_orders` com `sync_metadata.origin`; KDSMinimal e MiniKDSMinimal/KitchenDisplay exibem **OriginBadge** "WEB". |
| **Cozinha/Bar?** | Sim. Itens com `station` KITCHEN/BAR são filtrados nas abas do KDS. |

### 2.2 QR Mesa

| Pergunta | Resposta |
|----------|----------|
| **Existe?** | Sim. **Alinhado de forma canónica.** |
| **Onde?** | **TablePage** (`/public/:slug/mesa/:number`). Usa `createOrder(..., "QR_MESA", "cash", { table_id, table_number, origin: "QR_MESA" })`; KDS exibe badge "QR MESA". |
| **Como entra?** | Cliente abre URL da mesa → adiciona produtos → "Enviar pedido" → createOrder com **QR_MESA** e **table_id** + **table_number** em syncMetadata. |
| **Chega ao KDS?** | Sim. Badge **QR MESA** (📋); número da mesa no card. |
| **Nota** | Smoke manual: `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md` §4. Requer mesa em gm_tables. |

**Alinhamento QR Mesa:** TablePage é a entrada canónica: usa `createOrder` com origin `QR_MESA` e `table_id`/`table_number` em syncMetadata; o KDS exibe o badge "QR MESA". Smoke manual em `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md` secção 4.

### 2.3 Garçom (waiter / comandeiro)

| Pergunta | Resposta |
|----------|----------|
| **Existe?** | Sim. |
| **Onde?** | **TablePanel** (`/app/waiter/table/:tableId`), **MiniPOS** (AppStaff com mesa selecionada). |
| **Como entra?** | `createOrder` (OrderContextReal) com `syncMetadata.origin = orderOrigin` onde `orderOrigin` = `APPSTAFF` \| `APPSTAFF_MANAGER` \| `APPSTAFF_OWNER` conforme role do utilizador. |
| **Chega ao KDS?** | Sim. Mesmo Core; `readActiveOrders` inclui estes pedidos; OriginBadge pode mostrar APPSTAFF. |
| **Cozinha/Bar?** | Sim. Itens com station KITCHEN/BAR. |

### 2.4 Uber Eats

| Pergunta | Resposta |
|----------|----------|
| **Existe?** | Sim. **Adapter real** + proxy no Core. |
| **Onde?** | **UberEatsAdapter** (`integrations/adapters/ubereats`). Sincronização via RPC **delivery-proxy** (Docker Core). Emite `OrderCreatedEvent`; criação no Core é feita pelo **delivery-proxy** (polling) ou por **OrderIngestionPipeline** (webhook → create_order_atomic). |
| **Como entra?** | Adapter → evento ou polling → Core RPC `delivery-proxy` ou OrderIngestionPipeline → `create_order_atomic` com `p_sync_metadata.origin = "DELIVERY"` e source ubereats. |
| **Chega ao KDS?** | Sim. Pedidos ficam em `gm_orders`; KDS (KDSMinimal e KitchenDisplay) lista todos os ativos. **OrderCard** e UI mostram badge "UBER" quando `serviceSource === "ubereats"`. |
| **Cozinha/Bar?** | Sim. Itens têm station; filtro KITCHEN/BAR aplica-se. Delivery pode usar painel "delivery" no KitchenDisplay. |
| **Mock?** | Não. Adapter hardened; depende de **Docker Core** e RPC delivery-proxy configurado. |

### 2.5 Glovo

| Pergunta | Resposta |
|----------|----------|
| **Existe?** | Sim. **Adapter real** + proxy no Core. |
| **Onde?** | **GlovoAdapter** (`integrations/adapters/glovo`). Mesmo padrão: RPC **delivery-proxy**, evento, **OrderIngestionPipeline**. |
| **Como entra?** | Idem Uber Eats: delivery-proxy ou ingestão → create_order_atomic com origin/source glovo. |
| **Chega ao KDS?** | Sim. Badge "GLOVO" na UI quando `serviceSource === "glovo"`. |
| **Mock?** | Não. Requer Docker Core e delivery-proxy. |

---

## 3. Matriz origem → pipeline → destino (KDS cozinha/bar)

| Origem       | Pipeline / Como entra                          | Destino KDS                    |
|-------------|------------------------------------------------|--------------------------------|
| **TPV**     | processOrderLifecycle / create_order_atomic    | KDSMinimal, KitchenDisplay     |
| **Web**     | createOrder(..., "WEB_PUBLIC") ou WebOrderingService | Idem; badge WEB               |
| **QR Mesa** | TablePage createOrder(..., "QR_MESA", ..., { table_id, table_number }) | Idem; badge QR MESA; table_id no metadata |
| **Garçom / Staff**  | TablePanel createOrder(syncMetadata.origin APPSTAFF \| APPSTAFF_MANAGER \| APPSTAFF_OWNER) | Idem; badge SALÃO / GERENTE / DONO (ver `docs/architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md`) |
| **Uber Eats** | UberEatsAdapter → delivery-proxy / OrderIngestionPipeline | Idem; badge UBER              |
| **Glovo**   | GlovoAdapter → delivery-proxy / OrderIngestionPipeline | Idem; badge GLOVO             |

Todos os pedidos criados por qualquer origem entram em **gm_orders** e são lidos por **readActiveOrders**. O **KDS** (KDSMinimal e KitchenDisplay) filtra por **station** (KITCHEN / BAR) para abas Cozinha e Bar; painel delivery existe no KitchenDisplay para pedidos delivery.

---

## 4. O que já funciona de verdade

- **Mesmo `restaurant_id`** em Admin, TPV, KDS, AppStaff (P2).
- **TPV principal** (`/op/tpv`): cria pedido → KDS (`/op/kds`) com abas Cozinha/Bar (P4.1–P4.4).
- **Staff TPV:** StaffTpvPage e TPVMobilePage = mesmo pipeline que TPV; pedidos chegam ao KDS.
- **Garçom / Staff:** TablePanel/MiniPOS com origin APPSTAFF (SALÃO), APPSTAFF_MANAGER (GERENTE) ou APPSTAFF_OWNER (DONO); pedidos no Core e no KDS; convenção de exibição em `docs/architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md`.
- **Web:** PublicWebPage e WebOrderingService com WEB_PUBLIC; pedidos no Core; KDS mostra badge WEB.
- **Uber Eats / Glovo:** Adapters + delivery-proxy; pedidos no Core; KDS mostra badges UBER/GLOVO; filtro cozinha/bar por station.
- **Mini KDS AppStaff:** KitchenDisplay (e StaffMiniKDS) com mesma fonte de dados; filtros cozinha/bar/delivery.

---

## 5. O que ainda está incompleto ou a validar

- **MiniTPVMinimal / MiniKDSMinimal:** Componentes existem mas **não estão montados em rotas**. Se forem necessários, integrar em modo operação ou dashboard e garantir `restaurant_id` do tenant.
- **QR Mesa:** **Alinhado.** TablePage usa origin QR_MESA e table_id/table_number em syncMetadata; smoke manual em `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md`.
- **Validação E2E soberana:** Cobre TPV → KDS (P4.1–P4.4), **Web → KDS** e **QR Mesa → KDS** (P5), **roteamento (isolado):** E2E Burger → Cozinha, E2E Drink → Bar (P5 Bar), e **pedido misto:** TPV, Web, QR Mesa e **Garçom** (P5 Pedido misto Garçom, com bypass `?mode=trial` no Comandeiro). Delivery (Uber/Glovo) depende de delivery-proxy.
- **Delivery-proxy:** Funciona apenas com **Docker Core**; em Supabase puro pode não existir RPC delivery-proxy — documentar e, se necessário, stub ou alternativa.
- **OrderIngestionPipeline:** Usado para webhooks; depende de BackendType.docker. Confirmar que Uber/Glovo em produção usam delivery-proxy ou ingestão e que pedidos aparecem no KDS.

---

## 6. Próximo roadmap em ordem

1. **Incluir mini TPV/KDS na documentação soberana:** Especificar que “mini TPV” = StaffTpvPage/TPVMobilePage e “mini KDS” = KitchenDisplay (StaffMiniKDS) e que MiniTPVMinimal/MiniKDSMinimal não estão em rotas.
2. **QR Mesa:** Feito. TablePage usa QR_MESA + table_id/table_number; smoke em `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md`.
3. **Smoke manual por origem:** Runbook `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md` — TPV, Web, Garçom, QR Mesa, Uber Eats, Glovo; como disparar, badge, cozinha/bar, Supabase vs delivery-proxy.
4. **E2E soberano estendido (opcional):** Um teste que, após login, cria pedido via web (ou garçom) e afirma que o mesmo pedido aparece no KDS (e, se possível, com badge correto).
5. **Delivery em Supabase:** Se o projeto usar Supabase sem Docker Core, documentar que Uber/Glovo requerem delivery-proxy (ou alternativa) e que sem ele pedidos delivery não entram no Core.

---

## 7. Próximo passo único

**Executar smoke manual por origem** usando `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md`: TPV, Web, Garçom, QR Mesa (e Uber/Glovo se delivery-proxy ativo); confirmar em `/op/kds` badge e abas Cozinha/Bar. Opcional: estender E2E soberano a outra origem (ex.: web ou QR Mesa).

---

*Documento gerado a partir da auditoria do código (merchant-portal): OrderOrigin, WebOrderingService, OrderWriter, OrderIngestionPipeline, UberEatsAdapter, GlovoAdapter, TablePanel, StaffTpvPage, KitchenHome, StaffMiniKDS, KDSMinimal, MiniTPVMinimal, MiniKDSMinimal.*

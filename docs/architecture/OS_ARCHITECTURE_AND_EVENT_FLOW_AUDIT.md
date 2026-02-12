# Auditoria Técnica — ChefIApp™ OS (Arquitetura & Fluxo de Eventos)

> Documento interno. Serve para alinhar discurso de “Sistema Operacional” com a arquitetura real e identificar pontos fortes, riscos e próximos degraus técnicos.

---

## 1. Objetivo

- Mapear o **kernel arquitetural** do ChefIApp™ OS (multi-tenant, runtime, readiness, event/Task engine).
- Descrever o **fluxo end-to-end de pedido** (TPV / AppStaff / Web Público → Core Docker → KDS → Tasks → Observabilidade/Analytics/Stock).
- Verificar onde o sistema já se comporta como **OS operacional** e onde ainda está em fase **operacional→escalável**.
- Identificar riscos técnicos e gaps a endurecer antes de empurrar claims mais fortes (multi-unidade/hotelaria, stock, tarefas).

---

## 2. Kernel do OS — Camadas principais

### 2.1. Multi-tenant e identidade de restaurante

**Fonte:** `merchant-portal/src/core/tenant/TenantContext.tsx`

- `TenantContext` é a **fonte de verdade única** para:
  - `tenantId` ativo (restaurante corrente);
  - `restaurant` (objeto completo do Core);
  - memberships (`gm_restaurant_members`), roles por restaurante;
  - multi-tenant vs single-tenant;
  - `switchTenant`, `refreshTenant`, `refreshTenants`.
- Resolução de tenant:
  - Sempre via **Docker Core** (`gm_restaurant_members`, `gm_restaurants`);
  - Respeita tenant selado (`setActiveTenant`, `isTenantSealed`);
  - Multi-tenant: nunca escolhe tenant “ao acaso”; exige seleção explícita ou usa cache selado válido.
- Fallback debug/trial:
  - Em modo `isDebugMode` ou `trial`, permite tenant mock para TPV/KDS, sem quebrar regra de não usar Supabase como fonte de tenant.

**Conclusão:** kernel multi-tenant é **real e robusto**. A narrativa de “OS multi-unidade” está apoiada por um contexto de tenant bem pensado, não por hacks de `localStorage`.

### 2.2. Runtime operacional & readiness

**Fontes:** `RestaurantRuntimeContext`, `useOperationalReadiness`, `useDeviceGate`, `config.ts`, `OBSERVABILITY_MINIMA.md`.

- `useOperationalReadiness("TPV" | "KDS" | "WEB" | ...)`:
  - Bloqueia rotas quando Core não está pronto;
  - Redireciona para Bootstrap ou mostra `BlockingScreen`;
  - Evita que TPV/KDS/Web operem sem Core saudável e sem bootstrap mínimo.
- `useDeviceGate(restaurantId)`:
  - Enforce de dispositivo instalado/configurado (`gm_devices` via `installedDeviceStorage`);
  - KDS/TPV/Web não operam sem device ativo para certos modos.
- `RestaurantRuntimeContext`:
  - Agrega `restaurant_id`, `coreStatus`, `operationMode`, etc.;
  - Usado por TPV, KDS, Menu Builder, Public Web para alinhar queries.

**Conclusão:** a camada de **boot & guards operacionais** é robusta e legitima o discurso de “OS em produção, não demo”.

### 2.3. Event & Task Engine (Monitor de Risco)

**Fontes:** `TaskSystemMinimal.tsx`, `TaskPanel.tsx`, `TaskWriter`, `TaskReader`, `TaskFiltering`, `gm_tasks`.

- Tarefas (`gm_tasks`) são:
  - Criadas automaticamente por writers (`generateTasks`, `generateScheduledTasks`) com base em:
    - atrasos de item (KDS),
    - stock crítico / ruptura prevista,
    - outros eventos operacionais;
  - Filtradas/deduplicadas em `TaskFiltering` (evita spam).
- `TaskSystemMinimal`:
  - Lê tasks via `readOpenTasks`/Supabase Realtime em `gm_tasks`;
  - Filtra por estação (BAR/KITCHEN/SERVICE), prioridade, status;
  - Exibe e permite `ACKNOWLEDGE / RESOLVED / DISMISSED`.
- `KDSMinimal`:
  - Integra `TaskPanel` para mostrar tasks críticas ligadas a itens atrasados na própria cozinha.

**Conclusão:** existe um **Task Engine real**, ligado a eventos de serviço, que cumpre bem o papel de “Monitor de Risco” descrito na landing, ainda que a UI seja minimal/funcional.

---

## 3. Fluxo de Pedido — End-to-end

### 3.1. Nascimento do pedido (TPV)

**Fonte principal:** `pages/TPV/TPV.tsx` (`TPVContent` + guards).

Fluxo consolidado:

1. **Gate & Turno**
   - `useOperationalReadiness("TPV")` → bloqueios iniciais (Core offline, bootstrap não feito).
   - `TPVLockScreen` + `start_turn` RPC:
     - `p_restaurant_id`, `p_operational_mode`, `p_device_id`, role, permissions snapshot.
     - Garante sessão de turno controlada.

2. **Guards operacionais**
   - `cashRegisterOpen` (caixa aberta via CoreOrdersApi).
   - `publishStatus === "publicado"` (menu live).
   - `healthStatus` + `isTrialData` + `isOnline` → `guards.actionsEnabled`.

3. **Menu vivo**
   - `useDynamicMenu({ restaurantId, mode: "tpv", autoRefresh, coreReachable })`.
   - `menu.fullCatalog` + `menu.contextual` → `QuickMenuPanel`.

4. **Pedido**
   - Sem pedido ativo → `draftItems` (rascunho em memória) até `handleConfirmDraft` chamar `createOrder` com `create_order_atomic` (núcleo).
   - Com pedido ativo (não confirmado): adição via `addItemToOrder`, `updateItemQuantity`, `removeItemFromOrder`.
   - `OrderContextReal`/`CoreOrdersApi` garantem writes em `gm_orders` / `gm_order_items`.

5. **Pagamento**
   - `PaymentModal` + `performOrderAction("pay", payload)`.
   - Lê `PaymentEngine` para checar pagamentos; só emite fiscal (chamada `fetch('/api/fiscal/emit')`) se:
     - total pago >= total pedido,
     - status `paid` confirmado.

6. **Estados finais**
   - `paid`/`cancelled` → deixam de aparecer no túnel operacional (`StreamTunnel`).
   - Fiscal é emitido **após** confirmação de pagamento, não antes.

### 3.2. Cozinha (KDS)

**Fonte:** `pages/KDSMinimal/KDSMinimal.tsx`.

Fluxo:

1. **Readiness & device**
   - `useOperationalReadiness("KDS")`, `useDeviceGate(restaurantId)` etc.
2. **Carregamento de pedidos**
   - `readActiveOrders(restaurantId)` + `readOrderItems(orderId)` via Docker Core.
   - Polling 5s–30s conforme modo (instalado/debug vs operação real).
3. **Status**
   - `calculateOrderStatus(order, items)`:
     - define `state`: `normal` / `attention` / `delay`;
     - distingue bar vs cozinha;
     - alimenta UI (badges 🟢/🟡/🔴).
4. **Ações**
   - `handleStartPreparation` → `CoreOrdersApi.updateOrderStatus(..., "IN_PREP", origin: "KDS")`.
   - `handleMarkItemReady` → `OrderWriter.markItemReady` (RPC) + refresh; se todos prontos, loga que pedido foi marcado `READY`.
5. **Integração com tarefas**
   - `TaskPanel` mostra tasks ligadas à estação, com callbacks a recarregar pedidos.

### 3.3. Página Pública / QR

**Fonte:** `pages/PublicWeb/PublicWebPage.tsx`.

Fluxo:

1. Resolve restaurante por slug (`readRestaurantBySlug`) ou `runtime.restaurant_id`.
2. Verifica `restaurant.status === "active"`:
   - se não, mostra `MENU_NOT_LIVE_WEB_MESSAGE` (protege rota).
3. Lê menu (`readMenu(restaurant.id)`) e exibe cardápio estruturado por categorias.
4. Carrinho (`cart`) → `createOrder(restaurant.id, orderItems, "WEB_PUBLIC", "cash")`.
5. Cria pedido real no Core, que entra no mesmo pipeline TPV/KDS/Tasks/Analytics.

### 3.4. Conclusão do fluxo

- **Pedido nascido em qualquer canal (TPV, AppStaff mini-TPV, Web Público)** é persistido em `gm_orders`/`gm_order_items`.
- KDS, Task Engine, Observabilidade e (em parte) Stock consomem os mesmos dados.
- A frase da landing “um pedido afeta stock, faturação, KDS, analytics e equipa — ao mesmo tempo” é, na prática, **maioritariamente verdadeira** para:
  - TPV + KDS + Tasks + fiscal + dashboards;
  - Faltam apenas alguns pontos para stock/analytics estarem 100% alinhados (ver §5.3).

---

## 4. Multi-unidade e Hotelaria (Arquitetura)

### 4.1. Multi-tenant / multi-restaurante

- `TenantContext` + `TenantResolver` oferecem:
  - memberships multi-tenant via `gm_restaurant_members`;
  - `switchTenant` com validação de permissionamento;
  - sealing de tenant ativo (evita regressão para “tenant null”).
- Várias áreas do sistema assumem `restaurant_id` sempre vindo do tenant/runtime:
  - TPV/KDS usam `RestaurantRuntimeContext` + installed devices/seeds;
  - Menu Builder, Public Web, TaskSystem usam `runtime.restaurant_id` ou tenant.

**Conclusão:** a base para operar múltiplos restaurantes/unidades **no mesmo OS** é concreta e suportada pelo Core.

### 4.2. Multi-outlet / hotelaria (F&B)

- `RestaurantPeopleSection`, `StaffContext`, `AppStaff` e dashboards tratam de:
  - `locations` / `outlets` (bar, restaurante, etc.);
  - perfis de staff por localização;
  - dashboards `OwnerGlobalDashboard`, `KitchenSectorDashboard` (visões por papel/sector).
- Não há PMS (quartos, folios, billing de estadia) — isso é assumido no `SystemLimitsV2` e na FAQ.

**Conclusão:** para F&B dentro de hotel (restaurante, bar, room service, outlets), a arquitetura está alinhada com a promessa. Para “hotel inteiro” não está — e a landing agora deixa isso explícito.

---

## 5. Observabilidade, Stock e Gaps

### 5.1. Observabilidade & logs

**Fontes:** `OBSERVABILITY_MINIMA.md`, `ObservabilityPage.tsx`, `Logger.ts`, `latencyStore.ts`, `errorsStore.ts`.

- Há um contrato claro de **onde ver logs** (`docker-compose.core logs`, health Postgres/PostgREST).
- Na app:
  - `Logger.ts` centraliza logs com `restaurant_id`/`device_id`;
  - `ObservabilityPage.tsx` mostra:
    - pedidos criados hoje,
    - erros últimos 24h,
    - latência média de operações chave;
  - stores in-memory (`latencyStore`, `errorsStore`) guardam métricas por sessão, com visão futura de persistir no Core.

**Conclusão:** observabilidade mínima está implementada ao nível de **produto operacional**, com caminho óbvio para endurecer (logs centralizados no Core/Prometheus, etc.).

### 5.2. Sistema de Tarefas e Risco

Já detalhado em §2.3 e §3.2–3.3:

- `gm_tasks` + Task Engine são reais e conectados a KDS/stock.
- O sistema de tarefas não é “app de produtividade genérica”: é de facto **execução assistida** ligada ao serviço.

### 5.3. Stock

Pontos observados:

- Há integrações com stock via:
  - Task types como `ESTOQUE_CRITICO`, `RUPTURA_PREVISTA`;
  - provável tabela de stock no Core (não detalhada aqui), usada por TaskWriter.
- Não foi mapeado nesta auditoria um módulo de **UI completa** de stock ao nível de um ERP (multiarmazém, inventário avançado, etc.).

**Conclusão:** o discurso atual de “controle de stock operacional, ligado a pedidos e tasks” está alinhado; qualquer claim de “ERP de inventário completo” seria overpromise.

---

## 6. Riscos Técnicos e Gaps

### 6.1. Dependência do estado do Core

- Vários módulos (reservas, stock, tasks) dependem fortemente de o Core Docker estar:
  - com schema completo (e.g. `gm_reservations`, `gm_customers`);
  - com migrations/seed aplicados.
- Em dev, já surgiram 400/404 do Core quando tabelas não existiam ou queries estavam desalinhadas.

**Risco:** em ambientes não cuidadosamente migrados, algumas promessas (reservas/sala, stock) degradam para “aspiracionais” sem ser bug na app — é estado de infra.  
**Mitigação:** endurecer pipelines de migração e healthchecks, e talvez explicitar “modo parcial” em alguns módulos quando tabelas faltam.

### 6.2. Multi-unidade olhos de owner

- Multi-tenant está sólido, mas:
  - falta um **dashboard consolidado cross-tenant/unidade** forte (owner com N casas);
  - hoje, a visão é mais por restaurante ativo.

**Risco:** prometer visão multi-unidade “full enterprise” sem essa camada visual pronta; a arquitetura sustenta, mas o tooling ainda está em fase operacional→escalável.

### 6.3. Fichas técnicas & stock avançado

- O core de stock existe, mas:
  - integração total entre fichas técnicas, stock, tasks e dashboards ainda não está 100% evidente em UI.

**Risco:** qualquer promessa de “ERP de stock completo” é exagerada; framing como “controle operacional de stock ligado ao serviço” é mais seguro.

---

## 7. Síntese e Recomendações Técnicas

### 7.1. Classificação de maturidade (técnica)

- **Produto operacional → caminhando para escalável**:
  - Kernel multi-tenant + runtime + readiness + deviceGate bem definidos.
  - Fluxo de pedido robusto, com guards ricos e fiscal integrado.
  - KDS, Task Engine, Public Web e TPV suportam o discurso de OS em produção.
  - Observabilidade mínima presente, com visão clara de evolução.

Não é ainda um “enterprise-ready de 50 unidades com tudo endurecido”, mas está acima da média de MVP: é produto viável em operação real com poucos clientes, já com arquitetura pensada para escalar.

### 7.2. Recomendações imediatas

1. **Fortalecer pipeline de Core (migrations/seed)**
   - Garantir que `gm_reservations`, `gm_customers`, stock e tasks existem sempre em dev/staging/prod;
   - Healthcheck extra: script que valida schema mínimo antes de subir front/dev.

2. **Dashboard multi-unidade/owner**
   - Construir 1 vista consolidada usando `TenantContext`:
     - faturação por restaurante/unidade;
     - vazamentos chave (atrasos, stock crítico, tasks) agregados.
   - Isso fecha a lacuna entre arquitetura multi-tenant e percepção de multi-unidade.

3. **Clarificar escopo de stock**

   - Manter framing de “controle operacional de stock ligado a pedidos e tasks”;
   - Só virar “ERP de stock completo” quando fichas técnicas + inventário + compras estiverem 100% fechados.

4. **Documentar este mapa como contrato**

   - Usar este ficheiro como base sempre que:
     - se ajustar a landing;
     - se escrever material comercial;
     - se priorizar roadmap (especialmente multi-unidade/hotelaria).


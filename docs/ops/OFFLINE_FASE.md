# Fase Offline Total — merchant-portal

**Data:** 2026-02-13  
**Objetivo:** Documentar a implementação da fase offline (Service Worker + IndexedDB + fila de sync) para o restaurante continuar a operar quando a rede ou o Core estão indisponíveis.

---

## Componentes

### 1. Service Worker (Workbox via VitePWA)

- **Precache:** Todos os assets de build (JS, CSS, HTML, ícones) são precacheados. Em offline a app carrega a partir do cache.
- **Navegação:** `navigateFallback: "/index.html"` — rotas SPA (ex.: `/app/staff/tpv`) servem o shell em offline. `navigateFallbackDenylist` exclui `/rest/`, `/api/`, `/internal/`, `/webhooks/`, `/rpc/`.
- **Runtime cache:** Pedidos GET a `/rest/v1/*` usam estratégia **NetworkFirst** (timeout 10s); em falha de rede serve a última resposta em cache (`chefiapp-rest-get`, máx. 80 entradas, 5 min). Não se aplica a POST/PATCH (só leituras).

**Config:** `merchant-portal/vite.config.ts` → `VitePWA({ workbox: { ... } })`.

**Nota:** Em DEV o Service Worker é desativado (pre-bundle em `index.html` + `devOptions.enabled: false`) para evitar ruído. Testar offline com `pnpm build && pnpm preview`.

---

### 2. IndexedDB

| Store | Ficheiro | Uso |
|-------|----------|-----|
| **Fila offline** | `core/sync/IndexedDBQueue.ts` | Pedidos e ações (ORDER_CREATE, ORDER_PAY, etc.) em espera. Processados pelo SyncEngine quando voltar online. |
| **Menu** | `core/sync/MenuCache.ts` | Último menu por `restaurant_id`. Usado por `useDynamicMenu` e TPV quando offline ou Core inacessível. |

---

### 3. SyncEngine

- **Rede:** Escuta `online` / `offline`; ao passar a `online` chama `processQueue()`.
- **Fila:** Lê itens em estado `queued` ou `failed` (respeitando `nextRetryAt`) de `IndexedDBQueue`, processa por ordem, marca `syncing` → `applied` ou `failed` / `dead_letter`.
- **ORDER_CREATE:** Chama `createOrderAtomic` no Core com `restaurant_id`, itens (preço em cêntimos), `sync_metadata` (localId, origin `offline_sync`).
- **Retry:** Backoff por tentativa; falhas críticas (classifyFailure) vão para dead_letter; outras falhas têm `nextRetryAt` e heartbeat (10s) enquanto houver pendentes e online.

**Ficheiro:** `merchant-portal/src/core/sync/SyncEngine.ts`.

---

### 4. OfflineOrderContext + OrderContextReal

- **OfflineOrderContext:** Expõe `isOffline`, `queue`, `addToQueue`, `updateOfflineOrder`, `forceSync`, `pendingCount`. Estado de rede e contagem vêm do SyncEngine.
- **OrderContextReal:** Em `createOrder`, se `isOffline` escreve o payload na fila via `addToQueue`, atualiza UI de forma otimista e persiste `chefiapp_active_order_id` no TabIsolatedStorage. Expõe `pendingSync` (número de pendentes) para o OfflineIndicator.

---

### 5. OfflineIndicator

- Mostra barra fixa (canto inferior esquerdo) quando `isOffline` ou `pendingSync > 0`.
- Texto: "Offline (N pendentes)" ou "Sincronizando... (N)" com botão "Sync" quando online e há pendentes.
- Usa `useOrders()` (OrderContextReal): `isOffline`, `pendingSync`, `syncNow`.

---

### 6. Menu em offline

- **useDynamicMenu:** Se `coreReachable === false` ou `!navigator.onLine`, usa `MenuCache.get(restaurantId)`; se não houver cache, fallback para produtos piloto.
- **TPVMinimal:** Em erro de fetch ao Core, usa `MenuCache.get` antes de fallback piloto.
- Ao carregar menu com sucesso (online), `MenuCache.put(restaurantId, result)` atualiza o cache.

---

## Fluxo resumido

1. **Online:** Pedidos vão para o Core via RPC; menu vem do Core e é guardado em MenuCache.
2. **Fica offline:** App continua a carregar (SW serve shell + assets). TPV usa menu em cache; novo pedido vai para IndexedDB (fila) e UI mostra pedido otimista. OfflineIndicator mostra "Offline (N pendentes)".
3. **Volta online:** SyncEngine processa a fila (ORDER_CREATE → `create_order_atomic`); OfflineIndicator mostra "Sincronizando... (N)" e depois desaparece quando `pendingSync === 0`.

---

## Como testar

1. **Build de produção e preview:**  
   `cd merchant-portal && pnpm build && pnpm preview`
2. Abrir a URL do preview (ex.: http://localhost:4173), abrir TPV e carregar menu (para popular MenuCache).
3. No Chrome DevTools → Application → Service Workers: confirmar SW ativo.
4. Application → Network: throttling "Offline" ou desligar rede.
5. Recarregar: a app deve carregar (shell em cache). TPV deve mostrar menu em cache; criar pedido deve adicionar à fila e OfflineIndicator mostrar "Offline (1 pendente)".
6. Voltar a "Online" (ou ligar rede): em até ~10s o SyncEngine deve processar a fila; pedido deve aparecer no Core e o indicador desaparecer.

---

## Referências

- Contrato Shell/scroll: `docs/architecture/APPSTAFF_VISUAL_CANON.md`
- Mapa de lançamento: `docs/audit/LANCAMENTO_GAP_ATUALIZADO_2026-02.md` (Bloqueador 4 — Offline-first)
- DEV sem SW: `merchant-portal/src/core/runtime/devStableMode.ts`; pre-bundle em `merchant-portal/index.html`

# AppStaff Mobile — Ficha Técnica

**Última atualização:** 2026-03-02  
**Escopo:** Super‑app AppStaff no projeto `mobile-app/` (Expo / React Native)

---

## 1. Visão rápida

- **AppStaff** é o terminal humano do ChefIApp OS (ver `docs/architecture/CORE_APPSTAFF_CONTRACT.md`).
- Há **um único AppStaff**, com módulos por papel (`waiter`, `delivery`, `manager`, `owner`, `cleaning`, …).
- **Superfícies ativas:**
  - **Web/PWA** (`merchant-portal`, rotas `/app/staff/*`) — baseline histórica / contratos de UX.
  - **Mobile nativo** (`mobile-app/`, Expo) — terminal operacional real (ver `docs/APPSTAFF_MOBILE_ONLY.md`).
- Este ficheiro descreve *apenas* a superfície **mobile** e como ela se organiza tecnicamente.

---

## 2. Stack do AppStaff mobile (`mobile-app/`)

- **Runtime:** Expo + React Native (`expo-router` para navegação).
- **Entry:** `expo-router/entry` → `app/_layout.tsx` → providers:
  - `AuthProvider` (`context/AuthContext.tsx`)
  - `RestaurantProvider` (`context/RestaurantContext.tsx`)
  - `AppStaffProvider` (`context/AppStaffContext.tsx`)
  - `AppStaffOperationalProvider` (`context/AppStaffOperationalContext.tsx`)
  - `OrderProvider` (`context/OrderContext.tsx`)
- **Design system:** `mobile-app/constants/designTokens.ts` (cores, spacing, tipografia); alinhado com:
  - `docs/architecture/APPSTAFF_VISUAL_CANON.md`
  - `docs/architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md`
- **Persistência local:**
  - `expo-secure-store` — tokens de ativação / sessão mobile.
  - `@react-native-async-storage/async-storage` — filas/offline mínimo (`lib/offlineQueue.ts`, `lib/pendingSync.ts`, `services/OfflineQueueService.ts`).
  - **SQLite** ainda **não** está em uso; quando introduzido, passa a ser a fonte local de `orders`, `tasks`, `drivers`, `routes` e `outbox_events`.
- **Backend/Core:**
  - Supabase client em `services/supabase.ts` (RPCs `gm_*`).
  - Gateway de ativação mobile em `server/mobileActivationGateway.ts` / `server/mobileActivationService.ts`.
- **Observabilidade:**
  - Sentry React Native ligado via Expo (ver avisos na boot log).
  - Logging central em `services/logging.ts`.

---

## 3. Kernel do AppStaff mobile

Responsabilidades centrais (sempre ativas, independente do módulo/papel):

- **Sessão e ativação**
  - `services/mobileActivationApi.ts`:
    - `activateWithQrPin({ activationToken, pin })` → POST `/mobile/activate`.
    - Guarda `accessToken`, `refreshToken` e `principal` em SecureStore.
    - `useActivationState()` lê SecureStore e devolve:
      - `{ status: "loading" }`
      - `{ status: "not-activated" }`
      - `{ status: "activated", accessToken }`
  - `app/index.tsx`:
    - `activated` → `<Redirect href="/(tabs)/staff" />` (ou `delivery-home` para papel delivery).
    - `not-activated` → `<Redirect href="/activate" />`.
- **Perfil + permissões**
  - `context/AppStaffContext.tsx`:
    - `StaffRole` inclui `waiter`, `delivery`, `manager`, `owner`, `cleaning`, `cashier`, `chef`, etc.
    - `ROLE_PERMISSIONS_MAP` + `getContextPermissions` (`ContextPolicy`) implementam RBAC declarativo.
    - `canAccess(permission)` centraliza checks (cash drawer, shift end, etc.).
  - `context/AppStaffOperationalContext.tsx` (ver `mobile-app/docs/APPSTAFF_CONTRACT_AUDIT.md`):
    - `staffId`, `role`, `activeShift`, `activeStation`, `systemMode`, `businessId`, `businessName`.
- **Sync offline mínimo**
  - `services/OfflineQueueService.ts`:
    - Fila de mutações (`CREATE_ORDER`, `ADD_ORDER_ITEMS`, `UPDATE_ORDER_STATUS`, `ADD_PAYMENT`, `CLOSE_SHIFT`).
    - Replays idempotentes (ignora erro `23505` de duplicado).
  - `lib/pendingSync.ts`:
    - Estrutura simplificada para eventos `task_completed`, `check_in`, `check_out` em AsyncStorage.
- **Upload manager (intenção)**
  - Estrutura esperada: `upload_jobs` (fotos/vídeos + metadados) em SQLite + worker que faz upload quando online.
  - Ainda **não** implementado; hoje evidências vivem nos fluxos web/AppStaff PWA.
- **Notificações / observabilidade**
  - `services/pushRegistration.ts` + `lib/pushNotifications.ts` registam device tokens.
  - Sentry captura erros JS e nativos (ver configuração de DSN no projeto).

---

## 4. Módulos por papel (tabs do AppStaff mobile)

Navegação principal vive em `app/(tabs)/_layout.tsx`:

- Tipo `ScreenName` inclui:
  - `staff`, `orders`, `kitchen`, `tables`, `cardapio`, `manager`, `two`, `leaderboard`, `achievements`, `bar`.
  - **Módulo Entregador (ChipDay-style):**
    - `delivery-home`, `delivery-orders`, `delivery-map`, `delivery-drivers`, `delivery-reviews`.
- `ROLE_TABS: Record<StaffRole, ScreenName[]>` decide que tabs cada papel vê.
  - Exemplo:
    - `waiter`: `["staff", "orders", "kitchen", "tables", "cardapio", "two"]`.
    - `delivery`: `["delivery-home", "delivery-orders", "delivery-map", "delivery-drivers", "delivery-reviews", "two"]`.
- `initialRouteName`:
  - Papel `delivery` → `"delivery-home"`.
  - Demais papéis → `"staff"`.

### 4.1. Módulo Entregador (Delivery)

Inspirado no referencial ChipDay (mapa, lista de pedidos, drivers, reviews, navegação direta).

- **Home** — `app/(tabs)/delivery-home.tsx`
  - KPIs (mock V1):
    - `Completed Deliveries`
    - `Avg. placement to delivery time`
    - `Avg. pickup to delivery time`
    - `On-time deliveries`
    - `Average Rating`
- **Orders** — `app/(tabs)/delivery-orders.tsx`
  - Lista com estados `UNASSIGNED` / `STARTED`.
  - Campos: número do pedido, cliente, endereço, distância, horário/SLAs.
  - Botões: `Assign` (para pedidos sem motorista) e ação do motorista atual.
- **Map** — `app/(tabs)/delivery-map.tsx`
  - Placeholder canónico de mapa (futuro: `react-native-maps` + clusters de pedidos e condutores).
  - Botões flutuantes para filtros e configurações.
- **Drivers** — `app/(tabs)/delivery-drivers.tsx`
  - Lista de motoristas com:
    - Avatar com iniciais, nome.
    - Indicador de **online/offline**.
    - Ações futuras (menu contextual).
- **Reviews** — `app/(tabs)/delivery-reviews.tsx`
  - Tabs `Order` / `Driver`.
  - Zero state com barras de estrelas 5→1.
  - Sub-tabs `Reviews` / `AI Insights`.
  - Botões `Filters` e `Sort`.

> Nota V1: todos os módulos acima usam dados **mock** / placeholders. Integração real deve vir do Core (via Supabase/gateway) e de uma camada local (SQLite).

---

## 5. Fluxos principais (V1)

### 5.1. Ativação QR + PIN

- **Core/Admin:**
  - Gateway em `server/mobileActivationGateway.ts` / `server/mobileActivationService.ts` expõe endpoint `/mobile/activate`.
  - Admin gera **activationToken** curto (`atk_xxx`) e PIN de 6 dígitos para um principal (staff, papel, tenant).
- **App mobile:**
  - `app/index.tsx` usa `useActivationState()`:
    - Sem sessão → redireciona para `/activate`.
    - Com sessão → redireciona para tabs do papel (staff/delivery/etc.).
  - `app/activate.tsx`:
    - Campos: `Token (QR)` + `PIN` (6 dígitos).
    - Chama `activateWithQrPin({ activationToken, pin })`.
    - Lida com erros padronizados (`INVALID_PIN`, `TOKEN_EXPIRED`, `TOKEN_ALREADY_USED`, `TOKEN_REVOKED`, `RATE_LIMITED`).
    - Após sucesso:
      - Guarda sessão e principal em SecureStore.
      - Verifica `principal.modulesEnabled` para decidir o destino:
        - Se tiver módulo `delivery` → `/(tabs)/staff` ou `/(tabs)/delivery-home` (consoante contrato atual).

### 5.2. Offline + fila de eventos

- **Hoje (mínimo):**
  - `services/OfflineQueueService.ts` + `lib/offlineQueue.ts` + `lib/pendingSync.ts`:
    - Guardam mutações e eventos em AsyncStorage.
    - Reproduzem operações no Core (Supabase) quando online.
  - Tarefas/pedidos são carregados do Core e mantidos em memória/contexto.
- **V1 forte (target desejado):**
  - `expo-sqlite` como DB local com:
    - `orders`, `order_items`, `tasks`, `drivers`, `routes`.
    - `outbox_events` (eventos append‑only).
    - `upload_jobs` (media + metadados).
  - Endpoints dedicados no Core:
    - `POST /mobile/sync/push` — recebe batch de eventos (`TASK_COMPLETED`, `EVIDENCE_ADDED`, `DELIVERY_STATUS_CHANGED`, `GPS_POINT_RECORDED`, `PRINT_REQUESTED`).
    - `GET /mobile/sync/pull?cursor=…` — devolve alterações incrementais desde um cursor.
  - Processador idempotente no Core (não duplica eventos).

### 5.3. Impressão

- **V1 (do jeito certo):**
  - O mobile **não** faz impressão directa por Bluetooth/USB por padrão.
  - A ação “Imprimir” gera um **evento** que o Core/print brain/desktop agent consome e traduz em impressão.
  - Código de impressão TCP/ESC/POS existe mas está por trás de feature flag (impressão local desativada por omissão).

### 5.4. GPS (modo entregador)

- **Regra V1:** GPS **apenas** durante rota/entrega ativa; nunca 24/7.
- Implementação alvo:
  - Quando o motorista aceita/entra em rota:
    - Registra task background (`expo-location` + `expo-task-manager`).
    - Emite `GPS_POINT_RECORDED` na outbox a cada X segundos/minutos (ajustável por bateria).
  - Ao concluir/cancelar entrega:
    - Cancela task background.
    - Flusha eventos pendentes.
- Estado atual:
  - Requisito documentado; tracking completo ainda **não** está codificado no `mobile-app/` (depende de configurar as tasks background).

---

## 6. V1 vs V2 (resumo)

### V1 (mínimo robusto)

- App único (AppStaff) em `mobile-app/` com módulos por papel (`ROLE_TABS`).
- Ativação QR + PIN integrada ao gateway `/mobile/activate`.
- Sessão + principal (roles, módulos) guardados em SecureStore.
- Offline mínimo com fila em AsyncStorage (`OfflineQueueService`, `pendingSync`).
- Impressão via evento remoto (print brain), não local.
- GPS só em rota (contrato) — implementação progressiva.
- Perfis principais: `waiter`, `delivery`, `manager`, `owner`, `cleaning`, `cashier`, `chef`.

### V2 (evolução)

- SQLite como fonte local única (cache + outbox).
- Upload manager completo para evidências (fotos/vídeos).
- Tracking GPS background refinado, com tuning por bateria e sinal.
- Relatórios avançados multi‑unidade (Dono/Gerente) com base em eventos.
- UI/UX refinada por módulo, sempre obedecendo:
  - `docs/architecture/APPSTAFF_VISUAL_CANON.md`
  - `docs/architecture/APPSTAFF_LAUNCHER_CONTRACT.md`
  - `docs/architecture/APPSTAFF_SYNC_MAP.md`

---

## 7. Como usar esta ficha

- **Para dev mobile:** usar este documento como mapa rápido de:
  - Onde ligar novos módulos (tabs, providers).
  - Onde plugar sync/offline e eventos.
  - Onde respeitar contratos existentes (Canon, CORE_APPSTAFF_CONTRACT).
- **Para produto/arquitetura:** validar se uma ideia nova:
  - Cabe num módulo existente (waiter, delivery, cleaning…).
  - Precisa de novo evento na outbox ou novo endpoint de sync.
  - Não cria “segundo app” — continua dentro do AppStaff.


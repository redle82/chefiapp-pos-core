# Auditoria i18n — Superfície TPV/KDS

**Data:** 2026-03  
**Escopo:** Exclusivamente TPV/KDS operacional. Sem Admin. Sem AppStaff.  
**Regra:** Apenas auditar e reportar; não alterar código, rotas, lógica, Electron, testes nem UI.

---

## 1. Estado atual da superfície TPV/KDS

### 1.1 Resumo

- **Ficheiros na superfície:** ~50+ (páginas TPVMinimal, KDSMinimal, TPV full, componentes partilhados, core/tpv).
- **Com i18n:** 8 ficheiros usam `useTranslation` (TPV.tsx, PaymentModal, ReceiptShareModal, ReservationBoard, SplitBillModalWrapper, KitchenDisplay, KDSLayout, TPVNotificationBar, TPVTasksPage). A maioria usa namespace explícito (`tpv`, `kds`, `receipt`); TPVNotificationBar e TPVTasksPage usam default/common.
- **100% ou maioritariamente hardcoded:** TPVMinimal.tsx, KDSMinimal.tsx, TPVSidebar, TPVHeader, TPVSettingsPage, TPVShiftPage, TPVKitchenPage, TPVWebEditorPage, TPVStateDisplay, OrderSummaryPanel (TPVMinimal), OriginBadge (KDSMinimal), TaskPanel, e mensagens de erro em OrderEngine, PaymentEngine, stripePayment.

### 1.2 Tabela por área

| Área | Ficheiro | Usa i18n? | Namespace(s) | Observação |
|------|----------|-----------|--------------|------------|
| TPVMinimal | TPVMinimal.tsx | Não | — | Toda a UI hardcoded (mensagens loading/erro, títulos bootstrap, toasts, turno, carrinho vazio). |
| TPVMinimal | TPVPOSView.tsx | Não | — | aria-labels e toasts hardcoded. |
| TPVMinimal | TPVShiftPage.tsx | Não | — | "Turno e Caixa", "Caixa aberto", "Saldo esperado", "Fechar turno", etc. |
| TPVMinimal | TPVKitchenPage.tsx | Não | — | Labels de estado (Novo, Preparando, Pronto), "Marcar como pronto", etc. |
| TPVMinimal | TPVTasksPage.tsx | Parcial | default | Usa `t()` para poucos textos; resto hardcoded ("Tarefas", "Todas", "Nova tarefa", placeholders). |
| TPVMinimal | TPVSettingsPage.tsx | Não | — | "Definições do TPV", "Idioma", "Em breve: multi-idioma", "Moeda", "Impressora", etc. |
| TPVMinimal | TPVWebEditorPage.tsx | Não | — | "A carregar editor...", "Restaurante não inicializado", "Editor indisponível". |
| TPVMinimal | TPVSidebar.tsx | Não | — | SIDEBAR_LINKS: POS, Mesas, Turno, Cozinha, Tarefas, Reservas, Pagina Web, Definições; "Sair do TPV". |
| TPVMinimal | TPVHeader.tsx | Não | — | placeholder "Search product by name...", title "Limpar", staffName default "Garçom". |
| TPVMinimal | TPVNotificationBar.tsx | Parcial | common | Só `t("common:close")` no botão; "Alertas", "Limpar tudo" hardcoded. |
| TPVMinimal | OrderSummaryPanel.tsx | Não | — | Labels "Subtotal", "Tax (5%)", "Discount" hardcoded (en/pt misturado). |
| KDSMinimal | KDSMinimal.tsx | Não | — | Títulos, mensagens de erro, empty/loading/blocking, "Todas", "Cozinha", "Bar", "Ir ao Bootstrap", TPVStateDisplay titles. |
| KDSMinimal | OriginBadge.tsx | Não | — | originMap com labels: CAIXA, WEB, GARÇOM, GERENTE, DONO, COZINHA, SALÃO, QR MESA. |
| KDSMinimal | TaskPanel.tsx | Não | — | "Todas as tarefas estão em dia" e contexto. |
| TPV (full) | TPV.tsx | Sim | tpv | Usa chaves tpv.* consistentemente. |
| TPV | PaymentModal.tsx | Sim | tpv | Usa tpv.payment.*. |
| TPV | ReceiptShareModal.tsx | Sim | receipt | Usa receipt.*. |
| TPV | ReservationBoard.tsx | Parcial | default | useTranslation() sem namespace. |
| TPV | SplitBillModalWrapper.tsx | Parcial | default | useTranslation() sem namespace. |
| TPV/KDS | KitchenDisplay.tsx | Sim | kds | Usa kds.*. |
| TPV/KDS | KDSLayout.tsx | Sim | kds | Usa kds.*. |
| TPV | TPVStateDisplay.tsx | Não | — | Defaults: "Aguardando Pedidos", "Nenhum produto encontrado", "Falha na Sincronização", "Tentar Novamente", "Recarregar". |
| Core TPV | OrderEngine.ts | Não | — | OrderEngineError com mensagens em pt. |
| Core TPV | PaymentEngine.ts | Não | — | throw new Error com mensagens em pt (e uma em en "Failed to fetch payments"). |
| Core TPV | stripePayment.ts | Não | — | "Erro de conexão com gateway", "GATEWAY_ERROR: Payment Intent sem client_secret". |

### 1.3 Estado dos locales

- **tpv.json (pt-BR):** Contém `payment.*`, `order.*`, `error.*`, `closeCash.*`, `table.*`, `modifiers.*`, `toast.*`, `orderPanel.*`. Usado por TPV.tsx e PaymentModal; **não** usado por TPVMinimal, TPVShiftPage, TPVSidebar, etc.
- **kds.json (pt-BR):** Contém `badge`, `processing`, `startPrep`, `markReady`, `emptyTitle`, `emptyDescription`, `station.*`, `lane.*`, `installTitle`, `installDescription`. Usado por KitchenDisplay e KDSLayout; **não** usado por KDSMinimal nem OriginBadge.
- **shift.json (pt-BR):** Contém `gate.*`, `close.*`, `report.*`. **Não** usado por TPVShiftPage (todos os textos da página estão hardcoded).
- **operational.json:** Contém secções de dailyClosing, salesSummary, etc.; não referido diretamente nos componentes TPV/KDS auditados.
- **common.json:** Usado pontualmente (TPVNotificationBar `common:close`, TPVTasksPage possivelmente `common:create`). Outros textos nas mesmas páginas estão hardcoded.

---

## 2. Problemas encontrados

Para cada problema: **ficheiro**, **string visível**, **problema exato**, **severidade**, **namespace recomendado**, **chave recomendada**.

### 2.1 Hardcoded em fluxo principal (TPVMinimal / KDSMinimal)

| Ficheiro | String visível | Problema | Severidade | Namespace | Chave recomendada |
|----------|----------------|----------|------------|-----------|-------------------|
| TPVMinimal.tsx | "Verificando estado operacional..." | Hardcoded | P1 | tpv ou operational | tpv.toast.checkingOperationalState (já existe em tpv) / operational.checking |
| TPVMinimal.tsx | "Carregando produtos..." | Hardcoded | P1 | tpv | tpv.loadingProducts |
| TPVMinimal.tsx | "TPV Mínimo" | Hardcoded | P1 | tpv | tpv.minimalTitle |
| TPVMinimal.tsx | "Complete o bootstrap e tenha o Core online para criar pedidos." | Hardcoded | P1 | tpv | tpv.bootstrapRequired |
| TPVMinimal.tsx | "Sistema em preparação. Complete o bootstrap..." | Hardcoded | P1 | tpv | tpv.bootstrapPreparing |
| TPVMinimal.tsx | "Ir ao Bootstrap" / "Ir para Bootstrap" | Hardcoded | P1 | tpv | tpv.goToBootstrap |
| TPVMinimal.tsx | "Erro ao carregar produtos." | Hardcoded | P1 | tpv | tpv.errorLoadProducts |
| TPVMinimal.tsx | "Preview — pedido simulado (não gravado)" | Hardcoded | P2 | tpv | tpv.previewOrderSimulated |
| TPVMinimal.tsx | "Caixa Fechado:" + texto turno | Hardcoded | P1 | tpv / shift | shift.gate.closedTitle, shift.gate.openToSell |
| TPVMinimal.tsx | "Abrir Turno" / "A abrir…" | Hardcoded | P1 | shift | shift.gate.openButton, shift.gate.opening |
| TPVMinimal.tsx | Toasts: "Core offline — não é possível abrir turno agora.", "Restaurante não identificado.", "Caixa já estava aberto. Pode vender.", "Turno aberto. Pode vender.", "Erro ao abrir turno." | Hardcoded | P1 | tpv / shift | tpv.toast.* / shift.gate.* |
| TPVMinimal.tsx | "Erro", "Carrinho vazio", "Adicione produtos ao carrinho para criar um pedido." | Hardcoded | P1 | tpv | tpv.errorTitle, tpv.emptyCartTitle, tpv.emptyCartDescription (order.emptyCart existe) |
| TPVMinimal.tsx | "Ligação: Ativa / Não configurada" | Hardcoded | P2 | tpv | tpv.connectionStatus |
| TPVMinimal.tsx | "Restaurante", "Criar Pedido" (fallback nome) | Hardcoded | P2 | common/tpv | tpv.restaurantFallback, tpv.createOrderFallback |
| KDSMinimal.tsx | "KDS — Pedidos ativos" | Hardcoded | P1 | kds | kds.pageTitle (ou reutilizar emptyTitle contexto) |
| KDSMinimal.tsx | "Complete o bootstrap e tenha o Core online para ver pedidos." | Hardcoded | P1 | kds | kds.bootstrapRequired |
| KDSMinimal.tsx | "KDS disponível em operação real. Complete o bootstrap e tenha o Core online para ver pedidos." | Hardcoded | P1 | kds | kds.bootstrapRealMode |
| KDSMinimal.tsx | "Ir ao Bootstrap" / "Ir para Bootstrap" | Hardcoded | P1 | kds / common | kds.goToBootstrap |
| KDSMinimal.tsx | "Verificando estado operacional...", "A verificar dispositivo..." | Hardcoded | P1 | operational / common | operational.checking ou common.checking |
| KDSMinimal.tsx | "Não foi possível ligar ao Core. Verifique se o Docker Core está a correr e clique em Repetir." | Hardcoded | P1 | kds | kds.errorCoreUnreachable |
| KDSMinimal.tsx | "Erro ao carregar pedidos. Tente novamente." | Hardcoded | P1 | kds | kds.errorLoadOrders |
| KDSMinimal.tsx | "Erro ao marcar item como pronto. Tente novamente." | Hardcoded | P1 | kds | kds.errorMarkItemReady (kds.errorUpdateOrder existe) |
| KDSMinimal.tsx | "Erro ao atualizar pedido. Tente novamente." | Hardcoded | P1 | kds | kds.errorUpdateOrder (já existe) |
| KDSMinimal.tsx | "A carregar pedidos...", "Problema ao carregar", "Nenhum pedido ativo", descrição empty + "Actualizar" | Hardcoded | P1 | kds | kds.loadingOrders, kds.errorTitle, kds.emptyTitle (existe), kds.emptyDescription (existe), kds.refresh (existe) — actionLabel "Actualizar" |
| KDSMinimal.tsx | "Todas", "🍳 Cozinha", "🍺 Bar" | Hardcoded | P1 | kds | kds.station.all, kds.station.kitchen, kds.station.bar (já existem) |
| KDSMinimal.tsx | "Ou instalar KDS no portal" | Hardcoded | P2 | kds | kds.installInPortal |
| KDSMinimal.tsx | "Restaurante" (fallback nome) | Hardcoded | P2 | common | common.restaurant |
| TPVShiftPage.tsx | "Turno e Caixa", "A carregar estado do caixa...", "Caixa aberto", "Saldo inicial", "Vendas", "Saldo esperado", "Saldo final (contagem)", "Caixa de fecho", "Fechar turno", "Caixa fechado", "Abrir turno", "Caixa" (label), "Abrir turno" (botão) | Hardcoded | P1 | shift | shift.close.* / shift.gate.* (shift.json já tem estrutura) |
| TPVShiftPage.tsx | "Erro ao carregar caixa.", "Restaurante nao definido.", "Saldo inicial invalido.", "Erro ao abrir turno.", "Saldo final invalido.", "Erro ao fechar turno." | Hardcoded | P1 | shift | shift.error.* |
| TPVSidebar.tsx | "POS", "Mesas", "Turno", "Cozinha", "Tarefas", "Reservas", "Pagina Web", "Definições", "Sair do TPV" | Hardcoded | P1 | tpv | tpv.sidebar.pos, tpv.sidebar.tables, tpv.sidebar.shift, tpv.sidebar.kitchen, tpv.sidebar.tasks, tpv.sidebar.reservations, tpv.sidebar.website, tpv.sidebar.settings, tpv.sidebar.exit |
| TPVHeader.tsx | "Search product by name, categories or SKU" | Hardcoded (en) | P1 | tpv | tpv.searchPlaceholder |
| TPVHeader.tsx | "Limpar", "Garçom" (default) | Hardcoded | P2 | tpv | tpv.clear, tpv.staffDefault |
| TPVNotificationBar.tsx | "Alertas ({alerts.length})", "Limpar tudo" | Hardcoded | P2 | tpv / common | tpv.alertsCount, common.clearAll |
| TPVSettingsPage.tsx | "Definições do TPV", "🌐 Idioma", "Em breve: multi-idioma.", "Português (PT)", "💰 Moeda", "🖨️ Impressora", "Nenhuma impressora configurada", "Em breve: configuração de impressoras...", "🔒 Fecho de turno", "Limpeza automática de KDS ao fechar turno: Ativo", "Em breve: configuração de políticas..." | Hardcoded | P2 | tpv | tpv.settings.* |
| TPVWebEditorPage.tsx | "A carregar editor da Página Web…", "Restaurante não inicializado", "Conclua o setup do restaurante no Admin antes de editar a Página Web.", "Editor indisponível" | Hardcoded | P2 | tpv | tpv.webEditor.* |
| TPVKitchenPage.tsx | "Marcar como pronto", "Novo", "Preparando", "Pronto" | Hardcoded | P1 | kds / tpv | kds.markReady (existe), kds.badge.new (existe), estados ordem |
| TPVTasksPage.tsx | "✅ Tarefas", "Todas", "Serviço", "Cozinha", "Bar", "+ Nova tarefa", "✕ Cancelar", "Descrição da tarefa…", "Prioridade da tarefa", "Baixa", "Média", "Alta", "Crítica", "Marcar como vista", "Resolver tarefa", "A carregar tarefas…", "aberta(s)", "crítica(s)" | Hardcoded | P1 | tpv | tpv.tasks.* |
| OrderSummaryPanel.tsx | "Subtotal", "Tax (5%)", "Discount" | Hardcoded (mistura en) | P1 | tpv | tpv.order.subtotal (existe), tpv.tax, tpv.discount |
| OriginBadge.tsx | CAIXA, WEB, GARÇOM, GERENTE, DONO, COZINHA, SALÃO, QR MESA | Hardcoded | P1 | kds | kds.origin.caixa, kds.origin.web, kds.origin.waiter, kds.origin.manager, kds.origin.owner, kds.origin.kitchen, kds.origin.salao, kds.origin.qrMesa |
| TaskPanel.tsx | "Todas as tarefas estão em dia" | Hardcoded | P2 | tpv | tpv.tasks.allUpToDate |
| TPVStateDisplay.tsx | "Aguardando Pedidos", "O restaurante está operacional...", "Nenhum produto encontrado", "Tente ajustar os filtros...", "Falha na Sincronização", "Não foi possível carregar os dados...", "Sem dados", "Não há informações para exibir.", "Tentar Novamente", "Recarregar" | Hardcoded | P1 | tpv | tpv.state.* (usado por TPVMinimal/KDSMinimal ao passar title/description/actionLabel) |

### 2.2 Mensagens de erro (core/tpv)

| Ficheiro | String visível | Problema | Severidade | Namespace | Chave recomendada |
|----------|----------------|----------|------------|-----------|-------------------|
| OrderEngine.ts | "Pedido deve ter pelo menos um item." | Hardcoded | P1 | tpv | tpv.error.orderEmpty |
| OrderEngine.ts | "Falha ao criar pedido.", "RPC não retornou ID do pedido." | Hardcoded | P1 | tpv | tpv.error.createFailed, tpv.error.noOrderId |
| OrderEngine.ts | "Pedido não encontrado. Verifique se o ID está correto." / "...pode ter sido cancelado ou já finalizado." | Hardcoded | P1 | tpv | tpv.error.orderNotFound* |
| OrderEngine.ts | "Erro ao buscar pedido da mesa. Tente novamente." | Hardcoded | P1 | tpv | tpv.error.fetchByTable |
| OrderEngine.ts | "Erro ao buscar pedidos ativos. Tente novamente." | Hardcoded | P1 | tpv | tpv.error.fetchActive |
| PaymentEngine.ts | "Erro ao processar pagamento: ...", "Transação de pagamento falhou...", "Valor excede o saldo restante...", "Pedido já foi pago por outro operador.", "Transação de pagamento falhou.", "Pagamento processado mas não encontrado." | Hardcoded | P1 | tpv | tpv.payment.error.* (tpv.payment.error já existe) |
| PaymentEngine.ts | "Failed to fetch payments: ..." | Mistura en | P1 | tpv | tpv.payment.error.fetchFailed |
| stripePayment.ts | "Erro de conexão com gateway", "GATEWAY_ERROR: Payment Intent sem client_secret" | Hardcoded | P2 | tpv | tpv.payment.error.gateway |

### 2.3 Chaves em locale não utilizadas

- **tpv.json:** `toast.checkingOperationalState` existe mas TPVMinimal usa string fixa "Verificando estado operacional...". `order.emptyCart` existe mas TPVMinimal usa "Carrinho vazio" / "Adicione produtos...". Várias `toast.*` e `orderPanel.*` não são usadas em TPVMinimal.
- **kds.json:** `emptyTitle`, `emptyDescription`, `station.all`, `station.kitchen`, `station.bar`, `markReady`, `startPrep` existem mas KDSMinimal e TPVKitchenPage não usam `useTranslation("kds")` para esses textos.
- **shift.json:** `gate.defaultRegisterName`, `gate.defaultOperatorName`, `close.*` existem; TPVShiftPage não usa namespace shift.

### 2.4 Namespace errado ou ausente

- **TPVNotificationBar:** usa `t("common:close")`; restantes textos ("Alertas", "Limpar tudo") sem namespace. Recomendado: tpv ou common para alertas.
- **TPVTasksPage:** usa `useTranslation()` sem namespace; deveria usar `tpv` para tarefas.
- **ReservationBoard / SplitBillModalWrapper:** usam default; poderiam usar `tpv` ou `reservations` para consistência.

---

## 3. Prioridade P0 / P1 / P2

### P0

- **Nenhum** problema P0 identificado na superfície TPV/KDS (sem chave literal exposta ao utilizador nem mistura crítica de idioma no fluxo principal; "Search product by name..." em TPVHeader é inglês em contexto pt → P1).

### P1

- Fluxo principal TPVMinimal (loading, bootstrap, turno, carrinho, toasts, erros) 100% hardcoded.
- Fluxo principal KDSMinimal (títulos, erros, empty/loading, tabs Todas/Cozinha/Bar) 100% hardcoded.
- TPVShiftPage inteira hardcoded (shift.json existe e não é usado).
- TPVSidebar e TPVHeader com labels/placeholders hardcoded.
- TPVKitchenPage e TPVTasksPage com labels e estados hardcoded; kds/tpv já têm chaves que não são usadas.
- OriginBadge com todos os labels de origem hardcoded; kds.station existe mas não cobre origens (CAIXA, GARÇOM, etc.).
- OrderEngine e PaymentEngine com mensagens de erro hardcoded (e uma em en em PaymentEngine).
- TPVStateDisplay com defaults hardcoded usados por TPVMinimal e KDSMinimal.
- OrderSummaryPanel com "Subtotal" / "Tax (5%)" / "Discount" (mistura en).

### P2

- TPVSettingsPage, TPVWebEditorPage, TaskPanel, TPVNotificationBar ("Alertas", "Limpar tudo"), TPVHeader "Limpar"/"Garçom", mensagens secundárias (Preview simulado, Ligação Ativa/Não configurada, "Ou instalar KDS no portal"), stripePayment.
- Inconsistência "Actualizar" (pt-PT) em KDSMinimal empty state vs resto pt-BR (aceitável como residual se alinhado depois).

---

## 4. Próxima leva recomendada de correção

### Ordem sugerida

1. **P1 — TPVMinimal.tsx:** Mensagens de loading, bootstrap, turno, toasts e erros → `tpv.*` e `shift.*`; garantir que `tpv.toast.checkingOperationalState` e `order.emptyCart` são usados.
2. **P1 — KDSMinimal.tsx:** Títulos, mensagens de erro, empty/loading, tabs (Todas, Cozinha, Bar) → `kds.*`; usar `kds.station.*`, `kds.emptyTitle`, `kds.emptyDescription`, `kds.refresh`.
3. **P1 — TPVShiftPage.tsx:** Todo o texto → `shift.*` (shift.json já tem gate/close/report).
4. **P1 — TPVSidebar.tsx:** SIDEBAR_LINKS e "Sair do TPV" → `tpv.sidebar.*`.
5. **P1 — OriginBadge (KDSMinimal):** Labels de origem → `kds.origin.*` (novas chaves).
6. **P1 — TPVStateDisplay:** Defaults por type → `tpv.state.*`; chamadas em TPVMinimal/KDSMinimal passam a usar chaves ou mantêm override por props.
7. **P1 — OrderEngine / PaymentEngine:** Mensagens de erro → `tpv.error.*` / `tpv.payment.error.*`; corrigir "Failed to fetch payments" para pt ou chave.
8. **P1 — TPVKitchenPage, TPVTasksPage, OrderSummaryPanel:** Labels e placeholders → `tpv.*` / `kds.*`.
9. **P2:** TPVSettingsPage, TPVWebEditorPage, TPVNotificationBar, TPVHeader restantes, TaskPanel, stripePayment.

### Lista consolidada de ficheiros afetados

- merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx
- merchant-portal/src/pages/TPVMinimal/TPVPOSView.tsx
- merchant-portal/src/pages/TPVMinimal/TPVShiftPage.tsx
- merchant-portal/src/pages/TPVMinimal/TPVKitchenPage.tsx
- merchant-portal/src/pages/TPVMinimal/TPVTasksPage.tsx
- merchant-portal/src/pages/TPVMinimal/TPVSettingsPage.tsx
- merchant-portal/src/pages/TPVMinimal/TPVWebEditorPage.tsx
- merchant-portal/src/pages/TPVMinimal/components/TPVSidebar.tsx
- merchant-portal/src/pages/TPVMinimal/components/TPVHeader.tsx
- merchant-portal/src/pages/TPVMinimal/components/TPVNotificationBar.tsx
- merchant-portal/src/pages/TPVMinimal/components/OrderSummaryPanel.tsx
- merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx
- merchant-portal/src/pages/KDSMinimal/OriginBadge.tsx
- merchant-portal/src/pages/KDSMinimal/TaskPanel.tsx
- merchant-portal/src/pages/TPV/components/TPVStateDisplay.tsx
- merchant-portal/src/core/tpv/OrderEngine.ts
- merchant-portal/src/core/tpv/PaymentEngine.ts
- merchant-portal/src/core/tpv/stripePayment.ts

### Lista consolidada de chaves novas necessárias (exemplos)

- **tpv:** minimalTitle, bootstrapRequired, bootstrapPreparing, goToBootstrap, loadingProducts, errorLoadProducts, previewOrderSimulated, errorTitle, emptyCartTitle, emptyCartDescription, connectionStatus, restaurantFallback, createOrderFallback, sidebar.* (pos, tables, shift, kitchen, tasks, reservations, website, settings, exit), searchPlaceholder, clear, staffDefault, alertsCount, settings.*, webEditor.*, state.* (waitingOrders, noProducts, syncFailure, noData, retry, reload), tasks.* (title, all, service, kitchen, bar, newTask, cancel, descriptionPlaceholder, priorityTitle, priorityLow, priorityMedium, priorityHigh, priorityCritical, markSeen, resolve, loading, openCount, criticalCount), error.orderEmpty, error.createFailed, error.noOrderId, error.orderNotFound*, error.fetchByTable, error.fetchActive, payment.error.* (fetchFailed, gateway).
- **kds:** pageTitle, bootstrapRequired, bootstrapRealMode, goToBootstrap, errorCoreUnreachable, errorLoadOrders, errorMarkItemReady, loadingOrders, errorTitle, installInPortal, origin.* (caixa, web, waiter, manager, owner, kitchen, salao, qrMesa).
- **shift:** error.loadCash, error.noRestaurant, error.invalidOpening, error.openFailed, error.invalidClosing, error.closeFailed; uso das chaves já existentes em gate/close para labels da UI.

(As chaves exatas devem ser alinhadas com a estrutura já existente em tpv.json/kds.json/shift.json.)

### Residuais aceitáveis e justificação

- **"Preview"** em "Preview — pedido simulado": termo de produto; pode ficar em pt ou chave tpv.previewOrderSimulated.
- **Nomes de constantes/roles em código** (ex.: "Caixa Principal", "Caixa TPV" em RPC): se forem apenas enviados ao backend e não exibidos como label de UI, podem ficar; se exibidos, devem ir para shift/tpv.
- **"Actualizar"** em KDSMinimal (pt-PT): residual aceitável se o resto do locale for pt-PT nesse contexto; senão alinhar para "Atualizar" em pt-BR e chave kds.refresh.
- **Logs e console.error:** não migrar para i18n (não visíveis ao utilizador final).

### Conclusão objetiva

- **O que está fechado:** TPV.tsx, PaymentModal, ReceiptShareModal, KitchenDisplay e KDSLayout usam namespaces tpv/kds/receipt e locales existentes; comportamento correto para essas páginas.
- **O que está quebrado:** TPVMinimal e KDSMinimal (páginas operacionais principais) não usam i18n; TPVShiftPage, TPVSidebar, TPVHeader, TPVStateDisplay, OriginBadge e core/tpv (OrderEngine, PaymentEngine) expõem texto 100% hardcoded; locales tpv.json, kds.json e shift.json têm chaves que não são usadas nos componentes que deveriam consumi-las.
- **O que corrigir primeiro:** (1) TPVMinimal.tsx e KDSMinimal.tsx (loading, bootstrap, erros, empty states, tabs); (2) TPVShiftPage com shift.json; (3) TPVSidebar e TPVStateDisplay; (4) OriginBadge e mensagens OrderEngine/PaymentEngine; (5) TPVTasksPage, TPVKitchenPage, OrderSummaryPanel; (6) P2 (Settings, WebEditor, notificação, etc.).

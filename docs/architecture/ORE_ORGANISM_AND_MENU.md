# ORE, Organismo e Menu — Modelo Canónico

> **Propósito:** Descrever o sistema como organismo: cérebro (ORE), músculos (terminais/núcleos), manual e bootstrap. ORE julga estados, não dados. Menu é matéria; ORE é julgamento; Core Financeiro é lei.
>
> **Refs:** [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md), [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md), [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md). **Spec técnica do ORE:** [OPERATIONAL_READINESS_ENGINE.md](./OPERATIONAL_READINESS_ENGINE.md).

---

## 1. Onde entra o cérebro (ORE)?

O cérebro continua a ser o **ORE**. Nada disso mudou. Mas agora ele não pensa sobre tudo: **julga estados, não dados**.

### Papel real do ORE (cérebro)

O ORE:

- **não** cria menu
- **não** altera menu
- **não** deriva menu
- **não** recalcula preço
- **não** inventa disponibilidade

O ORE **consulta contratos soberanos** (Menu Core, Financial Core) e **decide**:

- "Este restaurante pode operar?"
- "Este terminal pode abrir?"
- "Este fluxo está autorizado agora?"
- "Bloqueia com que mensagem humana?"

**Exemplo concreto:** `MenuState = INCOMPLETE` → ORE decide: TPV ❌, QR ❌, Dashboard ✅ (com copy X).

O ORE não sabe o que é café, preço ou item. Só sabe se o mundo está pronto para operar.

➡️ **O cérebro julga. Não produz matéria.**

---

## 2. Onde entram os músculos?

Os **músculos** são tudo o que executa, consome ou reflete decisões.

**Músculos = Terminais + Núcleos Operacionais**

- TPV, KDS, QR / Web público, App Staff
- Dashboard, Tasks, Stock, Relatórios, Integrações

Eles **não** decidem, recalculam, publicam nem derivam fora do contrato.

Eles **puxam dados do Menu**, recebem snapshot quando necessário, **obedecem ao ORE** e executam ações humanas.

➡️ **Músculos só se mexem quando o cérebro autoriza e quando os órgãos existem.**

---

## 3. Manual e Bootstrap

### Manual Operacional (ORE Manual)

O manual **não é cérebro, não é músculo, não é contrato soberano**. É o **manual de execução humana da máquina**.

Serve para: onboarding, TRIAL, uso em campo, dono cansado, evitar surpresas, alinhar expectativas.

- O manual **nunca substitui contratos**.
- O manual **nunca cria regras novas**.
- Explica como o sistema se comporta quando os contratos dizem X.

**Documento de pedagogia (humano):** [ORE_MANUAL_HUMANO.md](../operations/ORE_MANUAL_HUMANO.md) — estados do menu, quando TPV/KDS/QR estão bloqueados, Bootstrap e Publicar menu, em linguagem humana. **Especificação técnica do ORE** (BlockingReason, Surface, UiDirective, matriz, ordem fixa, consumo pelo código): [OPERATIONAL_READINESS_ENGINE.md](./OPERATIONAL_READINESS_ENGINE.md).

### Bootstrap / Sistema de Inicialização

O Bootstrap é o **ritual de nascimento do organismo**.

- Cria entidade restaurante, liga contratos mínimos, valida pré-condições, prepara estado inicial.
- O Bootstrap **não** cria Menu completo, **não** publica menu, **não** decide operação.
- Apenas garante: _"O organismo existe. Agora ele precisa ser preparado."_

Depois disso: Menu Core define se pode vender; ORE decide se pode operar; músculos executam.

---

## 4. Diagrama ASCII (final, canónico)

A hierarquia não mudou; a **nitidez** sim. O Menu está formalizado como órgão soberano.

```
                        ┌────────────────────────────┐
                        │     CORE FINANCEIRO         │
                        │  (Rei – soberania legal)    │
                        └────────────┬───────────────┘
                                     │ valida, não cria
                                     ▼
                        ┌────────────────────────────┐
                        │        MENU CORE            │
                        │ (Rainha – verdade operac.)   │
                        │ preços, produtos, publicação│
                        └────────────┬───────────────┘
                                     │ estado + schema
                                     ▼
                        ┌────────────────────────────┐
                        │            ORE              │
                        │     (Cérebro – julgamento)  │
                        │ decide: pode operar?        │
                        └────────────┬───────────────┘
                                     │ autoriza / bloqueia
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌─────────────┐         ┌────────────────┐        ┌────────────────┐
   │     TPV     │         │      KDS       │        │    QR / Web     │
   │ (músculo)   │         │   (músculo)    │        │   (músculo)    │
   └─────────────┘         └────────────────┘        └────────────────┘
           │                         │                         │
           ▼                         ▼                         ▼
   ┌─────────────┐         ┌────────────────┐        ┌────────────────┐
   │   Orders    │         │    Tasks        │        │  Relatórios    │
   │ (snapshot)  │         │ (derivado)      │        │ (snapshot)     │
   └─────────────┘         └────────────────┘        └────────────────┘
```

**Bootstrap** → cria organismo.
**Manual** → ensina o humano a operar.

---

## 5. Frase final (para gravar)

- O **Menu** é a matéria.
- O **ORE** é o julgamento.
- O **Core Financeiro** é a lei.
- Os **terminais** são os músculos.
- O **manual** é a pedagogia.
- O **bootstrap** é o nascimento.

Nada entrou em conflito. Nada foi desfeito. Agora tudo está no lugar certo.

---

## 6. ORE ↔ Menu handshake (pseudo-código canónico)

O ORE **nunca** lê itens de menu, preços ou produtos. Só consome **MenuState** (um símbolo: EMPTY | INCOMPLETE | VALID_UNPUBLISHED | LIVE). O handshake é unidireccional: Menu (via runtime) expõe estado; ORE lê e decide.

### 6.1 Entradas (quem fornece o quê)

| Quem            | Fornece                                                                                | Origem                                       |
| --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| Runtime / Core  | `menuDefined`, `published`, `setupStatus` (identity, location, schedule, menu, people) | `gm_restaurants`, onboarding, `canPublish()` |
| Menu (contrato) | **Nada** em runtime — o estado é **derivado** desses factos                            | Função `deriveMenuState(input)`              |

### 6.2 Derivação do estado (fora do ORE)

O ORE **não** deriva MenuState. Alguém (ex.: contexto ou hook) deriva e expõe um único valor.

```text
INPUT  = { menuDefined: boolean, published: boolean, setupStatus: Record<section, boolean> }
       = canPublish = setupStatus.identity && setupStatus.location && ... && setupStatus.people

deriveMenuState(INPUT):
  if not menuDefined                    → return EMPTY
  if menuDefined and not canPublish      → return INCOMPLETE
  if menuDefined and canPublish and not published → return VALID_UNPUBLISHED
  if published and menuDefined           → return LIVE
  default                               → return EMPTY
```

### 6.3 ORE consome apenas MenuState

```text
ORE(surface, runtime, menuState, shift, modules, ...):

  // Ordem de avaliação (primeiro bloqueio ganha)
  if coreMode === "offline-erro"           → block(CORE_OFFLINE)
  if surface in {TPV, KDS} and systemState === SETUP → block(BOOTSTRAP_INCOMPLETE), redirect
  if surface in {TPV, KDS} and menuState !== LIVE    → block(NOT_PUBLISHED), message = MENU_STATE_MESSAGES[menuState].blockTpv
  if surface in {TPV, KDS} and no shift open         → block(NO_OPEN_CASH_REGISTER)  // quando aplicável
  if surface === TPV and not modules.tpv             → block(MODULE_NOT_ENABLED), redirect
  if surface === KDS and not modules.kds             → block(MODULE_NOT_ENABLED), redirect
  ...

  → ready = true, uiDirective = RENDER_APP
```

**Regra:** ORE **nunca** chama `deriveMenuState`. Recebe `menuState` já derivado (ex.: `useMenuState()` no merchant-portal). ORE só compara `menuState === "LIVE"` e escolhe a mensagem humana associada ao estado.

### 6.4 Resumo do handshake

| Passo | Quem                | O quê                                                                                                                                    |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Runtime             | Expõe `menuDefined`, `published`, `setupStatus`.                                                                                         |
| 2     | Hook/contexto       | Chama `deriveMenuState(...)` → obtém `MenuState`.                                                                                        |
| 3     | ORE                 | Lê `menuState`; se superfície TPV/KDS e `menuState !== LIVE` → bloqueia com `NOT_PUBLISHED` e `MENU_STATE_MESSAGES[menuState].blockTpv`. |
| 4     | UI (BlockingScreen) | Mostra a mensagem humana; não mostra stack trace nem dados de menu.                                                                      |

O Menu não "chama" o ORE. O ORE consulta o estado que foi derivado dos factos do Menu/Runtime. **Cérebro julga. Não produz matéria.**

---

## 7. Auditoria do músculo TPV (contra o diagrama e o handshake)

Verificação pontual: o TPV comporta-se como **músculo** (obedece ao ORE, puxa dados do Menu, não decide nem recalcula preço).

### 7.1 Gate (ORE)

| Critério                                 | Implementação                                                                                                                                           | Estado |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| TPV usa ORE antes de renderizar          | `TPV.tsx` e `TPVMinimal.tsx` chamam `useOperationalReadiness("TPV")`; se `!readiness.ready` e `SHOW_BLOCKING_SCREEN` → `<BlockingScreen reason={…} />`. | ✅     |
| ORE bloqueia quando `menuState !== LIVE` | `useOperationalReadiness.ts`: para superfície TPV ou KDS e `menuState !== "LIVE"` → `reason = "NOT_PUBLISHED"`.                                         | ✅     |
| Mensagem humana por estado               | `BlockingScreen.tsx`: quando `reason === "NOT_PUBLISHED"` usa `MENU_STATE_MESSAGES[menuState].blockTpv` em vez de copy genérico.                        | ✅     |
| TPV não deriva MenuState                 | TPV não chama `deriveMenuState` nem `useMenuState` para decisão; só consome `readiness` (ready, blockingReason, uiDirective).                           | ✅     |

### 7.2 Consumo de menu (matéria)

| Critério                                     | Implementação                                                                                                                                                                             | Estado |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Catálogo vem do Menu / Core                  | TPV: `useDynamicMenu` → `DynamicMenuService.getDynamicMenu` (gm_products) ou B1 fallback. TPVMinimal: carrega produtos com `price_cents`; cart usa `product_id`, `unit_price` (centavos). | ✅     |
| Preço não recalculado fora do Menu           | Exibição e payload usam `product.price_cents` / `item.unit_price`; `create_order_atomic` recebe `product_id`, `name`, `unit_price` por item (snapshot no momento da venda).               | ✅     |
| Carrinho e pedido usam `product_id` canónico | `TPVMinimal`: `CartItem` com `product_id`; payload para RPC com `product_id`, `unit_price`; FK em `gm_order_items.product_id` → `gm_products.id`.                                         | ✅     |

### 7.3 Resumo

- **Cérebro (ORE):** TPV não decide; obedece a `readiness.ready` e mostra BlockingScreen com mensagem humana quando NOT_PUBLISHED.
- **Matéria (Menu):** TPV puxa produtos e preços do Core (gm_products / DynamicMenu ou B1); não inventa preço; envia snapshot no create_order.
- **Handshake:** Runtime → useMenuState (derivação) → ORE lê menuState → bloqueia TPV se !== LIVE → BlockingScreen mostra MENU_STATE_MESSAGES[menuState].blockTpv.

Nenhuma violação ao diagrama organismo nem ao handshake ORE ↔ Menu. Detalhe por módulo: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md).

---

## 8. Auditoria do músculo KDS (contra o diagrama e o handshake)

Verificação pontual: o KDS comporta-se como **músculo** (obedece ao ORE; consome pedidos/itens do Core; zero preço na UI).

### 8.1 Gate (ORE)

| Critério                                 | Implementação                                                                                                                              | Estado |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| KDS usa ORE antes de renderizar          | `KDSMinimal.tsx` chama `useOperationalReadiness("KDS")`; se `!readiness.ready` e `SHOW_BLOCKING_SCREEN` → `<BlockingScreen reason={…} />`. | ✅     |
| ORE bloqueia quando `menuState !== LIVE` | Mesmo motor que TPV: para superfície KDS e `menuState !== "LIVE"` → `reason = "NOT_PUBLISHED"`.                                            | ✅     |
| Mensagem humana por estado               | BlockingScreen usa `MENU_STATE_MESSAGES[menuState].blockTpv` quando NOT_PUBLISHED.                                                         | ✅     |
| KDS não deriva MenuState                 | KDS só consome `readiness`; não chama `deriveMenuState` nem `useMenuState`.                                                                | ✅     |

### 8.2 Consumo (pedidos e itens; zero preço)

| Critério                       | Implementação                                                                                                | Estado |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------ |
| Pedidos/itens vêm do Core      | `readActiveOrders(restaurantId)`, `readOrderItems(order.id)` (OrderReader); dados do Core.                   | ✅     |
| Apenas product_id + nome na UI | Comentário MENU_DERIVATIONS no ficheiro; KDS não exibe Total nem subtotal por item; zero preço na UI/lógica. | ✅     |
| Não recalcula preço            | KDS não usa preço para decisão nem exibição; apenas execução cozinha (marcar item pronto, estado do pedido). | ✅     |

### 8.3 Resumo

- **Cérebro (ORE):** KDS obedece a `readiness.ready`; bloqueio com mensagem humana quando NOT_PUBLISHED.
- **Matéria (Menu):** KDS não exibe catálogo de venda; consome linhas de pedido (product_id, nome) do Core; zero preço.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § KDS.

---

## 9. Auditoria do músculo QR/Web (contra o diagrama e o handshake)

Verificação pontual: a página web pública comporta-se como **músculo** (só mostra cardápio quando menu LIVE; puxa menu do Core; read-only + snapshot no pedido).

### 9.1 Gate (ORE e estado publicado)

| Critério                      | Implementação                                                                                                                                                           | Estado |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| QR/Web usa ORE                | `PublicWebPage.tsx` chama `useOperationalReadiness("WEB")`; se `!readiness.ready` → BlockingScreen ou Redirect.                                                         | ✅     |
| Bloqueio quando menu não LIVE | Após carregar restaurante por slug: se `restaurantData.status !== "active"` → `setMenuNotLive(true)` e `<GlobalBlockedView description={MENU_NOT_LIVE_WEB_MESSAGE} />`. | ✅     |
| Mensagem humana               | Copy `MENU_NOT_LIVE_WEB_MESSAGE` ("O cardápio ainda não está disponível. Volte em breve.") de MenuState.                                                                | ✅     |

### 9.2 Consumo de menu (matéria)

| Critério                       | Implementação                                                                                                 | Estado |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------ |
| Menu vem do Core               | `readMenu(restaurantData.id)` (RestaurantReader); categorias e produtos do Core.                              | ✅     |
| Read-only; sem escrita no menu | Nenhuma escrita em gm_products/gm_menu_items; apenas leitura para exibir cardápio.                            | ✅     |
| Pedido com snapshot            | `createOrder` com itens (product_id, quantidade, preço do produto); Core persiste snapshot em gm_order_items. | ✅     |

### 9.3 Resumo

- **Cérebro / estado:** QR/Web só expõe cardápio quando restaurante publicado (`status === "active"`); mensagem humana quando não LIVE.
- **Matéria (Menu):** Menu via `readMenu`; carrinho e pedido usam dados do menu; snapshot no create_order.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § QR/Web.

---

## 10. Auditoria Dashboard e Config/Sidebar (consumo de MenuState como sinal vital)

Dashboard e Config/Sidebar não são músculos operacionais (TPV/KDS/QR); **consomem MenuState** como **sinal vital** para o dono: um único indicador (ícone + mensagem curta) por estado, sem bloquear o portal.

### 10.1 Dashboard

| Critério                   | Implementação                                                                                                       | Estado |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| Consome MenuState          | `DashboardPortal.tsx`: `useMenuState()`; secção "sinal vital" acima de "Primeira venda em poucos passos".           | ✅     |
| Mensagem humana por estado | `MENU_STATE_MESSAGES[menuState].short`; ícones por estado (🟢 LIVE, 🟡 VALID_UNPUBLISHED, 🟠 INCOMPLETE, ⚪ EMPTY). | ✅     |
| Não deriva MenuState       | Usa o hook `useMenuState()` (derivação feita no MenuState.ts a partir do runtime).                                  | ✅     |
| Portal sempre acessível    | ORE não bloqueia Dashboard por NOT_PUBLISHED; apenas mostra o indicador.                                            | ✅     |

### 10.2 Config / Sidebar

| Critério                   | Implementação                                                                   | Estado |
| -------------------------- | ------------------------------------------------------------------------------- | ------ |
| Consome MenuState          | `ConfigSidebar.tsx`: `useMenuState()`; indicador abaixo do título da sidebar.   | ✅     |
| Mensagem humana por estado | `MENU_STATE_MESSAGES[menuState].short`; ícone via `MENU_STATE_ICON[menuState]`. | ✅     |
| Referência ao contrato     | Comentário no ficheiro referencia MENU_OPERATIONAL_STATE.md.                    | ✅     |

### 10.3 Resumo

- **Papel:** Dashboard e Config/Sidebar **reflectem** o estado do menu (sinal vital); não decidem nem bloqueiam operação.
- **Fonte única:** Ambos usam `useMenuState()` → mesma derivação que o ORE consome para bloquear TPV/KDS.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § Dashboard, § Config/Sidebar.

---

## 11. Auditoria do músculo Tasks (contra o diagrama e o handshake)

Verificação pontual: o sistema de tarefas comporta-se como **músculo** (consumidor indireto do Menu via pedidos; product_id + nome; zero preço).

### 11.1 Gate (ORE)

| Critério                     | Implementação                                                                                                                                                                                         | Estado |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Tasks como superfície portal | `TaskSystemMinimal.tsx` não usa `useOperationalReadiness` hoje; rota `/task-system` é portal (gestão).                                                                                                | ✅     |
| Consumidor indireto          | Tarefas vêm do Core (gm_tasks); geradas a partir de pedidos (EventTaskGenerator). Se no futuro existir superfície operacional de tarefas (ex.: ecrã cozinha só tarefas), aplicar ORE como em TPV/KDS. | ✅     |

### 11.2 Consumo (product_id + nome; zero preço)

| Critério                                | Implementação                                                                                                                            | Estado |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Tarefas referenciam product_id + nome   | TaskReader (readOpenTasks, readTasksByOrder, readTasksByItem); gm_tasks ligado a pedidos/itens; identificação por product_id, sem preço. | ✅     |
| Não recalcula preço nem disponibilidade | Tasks não usam preço nem decidem disponibilidade de venda; apenas encaminhamento e estado de preparo.                                    | ✅     |

### 11.3 Resumo

- **Papel:** Tasks são consumidor indireto do Menu (via pedidos); referência simbólica ao item (product_id, nome); zero preço.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § Tasks.

---

## 12. Auditoria do músculo Stock/Inventory (contra o diagrama e o handshake)

Verificação pontual: Stock/Inventory comporta-se como **músculo** (consome Menu por product_id para BOM e receitas; preço não derivado para venda).

### 12.1 Gate (ORE)

| Critério                     | Implementação                                                                                                                                        | Estado |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Stock como superfície portal | `InventoryStockMinimal.tsx` não usa `useOperationalReadiness`; rota `/inventory-stock` é portal (gestão de locais, equipamentos, ingredientes, BOM). | ✅     |

### 12.2 Consumo (product_id; sem preço de venda)

| Critério                               | Implementação                                                                                                                 | Estado |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| Consumo por product_id (BOM, receitas) | InventoryStockReader (readProductBOM, readStockLevels); gm_products (id, name) para receitas; referência canónica product_id. | ✅     |
| Preço não derivado para venda          | Stock/Inventory não calcula preço de venda; quantidades e regras de dedução; preço é responsabilidade do Menu.                | ✅     |

### 12.3 Resumo

- **Papel:** Stock consome Menu por product_id (receitas, ingredientes); não inventa produto; não deriva preço de venda.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § Stock/Inventory.

---

## 13. Auditoria do músculo Relatórios (contra o diagrama e o handshake)

Verificação pontual: Relatórios comportam-se como **músculo** (agregação via gm_order_items com product_id + snapshot; sem recálculo de preço).

### 13.1 Consumo (join product_id + snapshot)

| Critério                            | Implementação                                                                                                                                   | Estado |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Agregação por product_id + snapshot | AdvancedReportingService: comentário MENU_DERIVATIONS; quando agregar por produto/receita, usar gm_order_items com product_id + price_snapshot. | ✅     |
| Sem recálculo de preço              | Totais a partir de snapshots já persistidos nas linhas de pedido; nunca "preço médio recalculado" fora do Menu.                                 | ✅     |

### 13.2 Resumo

- **Papel:** Relatórios consultam gm_orders / gm_order_items; join por product_id; totais a partir de price_snapshot; não recalculam preço de venda.
- Nenhuma violação. Detalhe: [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) § Relatórios.

---

## Ciclo concluído — Próximos passos

Auditorias §7–§13 concluídas (TPV, KDS, QR/Web, Dashboard, Config/Sidebar, Tasks, Stock, Relatórios). Nenhuma violação ao diagrama organismo nem ao handshake ORE ↔ Menu.

**Congelamento conceptual:** A hierarquia organismo (Core Financeiro → Menu → ORE → Músculos) e o papel do Manual e do Bootstrap não devem ser alterados sem violação explícita de contrato. Novas features e refatorações devem respeitar este mapa; discussões futuras ("Isso é decisão de quem?" / "Isso entra no ORE?") resolvem-se pelo organismo. Ver [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md#-adr-011-congelamento-conceptual-do-modelo-organismo-ore-menu-músculos) (ADR-011).

**Próximos passos operacionais (humanos):**

1. **[Congelamento 7 dias (A)](../pilots/CONGELAMENTO_7_DIAS_A.md)** — Usar o sistema em cenário real (menu + publicar + TPV) sem alterar código do Menu; anotar fricções.
2. **[Primeira venda auditável (C)](../pilots/PRIMEIRA_VENDA_AUDITAVEL_C.md)** — Após o congelamento: executar o checklist humano (menu → publicar → TPV → cobrar → verificar gm_orders/gm_order_items) uma vez.

---

## Referências

- [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md) — Estados, transições, quem bloqueia o quê, mensagens humanas.
- [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md) — Menu como contrato arterial; soberania; matriz de interação.
- [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) — Hierarquia Kernel → Core → Contratos → Terminais.
- [OPERATIONAL_READINESS_ENGINE.md](./OPERATIONAL_READINESS_ENGINE.md) — Spec técnica ORE (BlockingReason, Surface, UiDirective, matriz, consumo pelo código).
- Implementação: `merchant-portal/src/core/readiness/useOperationalReadiness.ts`, `merchant-portal/src/core/menu/MenuState.ts`.

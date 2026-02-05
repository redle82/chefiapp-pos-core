# Diagrama Canónico — ChefIApp OS (World → Kernel → Runtime)

Fonte de verdade visual: mapa mental e arquitectura técnica em Mermaid. Legível por humanos, versionável em Git, renderiza no GitHub e Cursor.

---

## 1. Diagrama macro — O Mundo Vivo (visão de cima)

```mermaid
flowchart TD
    DockerWorld["Docker World — Infra / Casa"]
    Kernel["Kernel — Contratos + Leis"]
    ERO["ERO — Consciência / Governança"]
    CoreFinance["Core Finance — Dinheiro / Caixa / Faturas"]
    MenuCore["Menu Building — Produtos / Snapshot"]
    OrderCore["Orders Core — Estado / Fluxo"]
    TPV["TPV / Mini-TPV"]
    KDS["KDS / Mini-KDS"]
    CustomerWeb["Cliente Web / QR"]
    Tasks["Sistema de Tarefas"]
    Integrations["Integrações — Uber / Glovo / API"]
    Observability["Observability — Logs / Chaos / Checklists"]

    DockerWorld --> Kernel
    Kernel --> CoreFinance
    Kernel --> MenuCore
    Kernel --> OrderCore
    ERO --> Kernel
    ERO --> Observability
    MenuCore --> OrderCore
    OrderCore --> CoreFinance
    OrderCore --> KDS
    OrderCore --> TPV
    OrderCore --> CustomerWeb
    TPV --> CoreFinance
    TPV --> OrderCore
    KDS --> Tasks
    OrderCore --> Tasks
    Integrations --> OrderCore
    Integrations --> CoreFinance
    Observability --> DockerWorld
```

---

## 2. Diagrama de bootstraps — Como o mundo nasce (ordem exacta)

```mermaid
flowchart LR
    B0["BOOTSTRAP 0 — World — Docker sobe"]
    B1["BOOTSTRAP 1 — Kernel — Contratos + Schema"]
    B2["BOOTSTRAP 2 — Identity and Tenancy"]
    B3["BOOTSTRAP 3 — Billing Gate"]
    B4["BOOTSTRAP 4 — Restaurant Runtime"]
    B5["BOOTSTRAP 5 — App Runtime"]

    B0 --> B1 --> B2 --> B3 --> B4 --> B5
```

**Lei:** Se um bootstrap falha, o mundo não sobe.

Referência: [docs/boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md).

---

## 3. Diagrama funcional — Pedido do mundo real até o dinheiro

```mermaid
flowchart LR
    Client["Cliente / Garçom / Dono"]
    TPV["TPV"]
    Menu["Menu Snapshot"]
    Order["Order Core"]
    KDS["KDS"]
    Finance["Core Finance"]
    Invoice["Fatura / Caixa"]

    Client --> TPV
    TPV --> Menu
    Menu --> Order
    Order --> KDS
    KDS --> Order
    Order --> Finance
    Finance --> Invoice
```

**Leis explícitas no fluxo:**

- Pedido ≠ Dinheiro
- Served ≠ Paid
- Menu congela snapshot
- Só RPC muda estado

Referências: [ORDER_STATUS_CONTRACT_v1](../contracts/ORDER_STATUS_CONTRACT_v1.md), [CORE_FINANCE_CONTRACT_v1](../contracts/CORE_FINANCE_CONTRACT_v1.md), [MENU_BUILDING_CONTRACT_v1](../contracts/MENU_BUILDING_CONTRACT_v1.md).

---

## 4. Diagrama de governança — Quem protege o sistema

```mermaid
flowchart TD
    Change["Mudança Proposta"]
    Check1["Viola invariante?"]
    Check2["Já existe E##?"]
    Check3["Nova classe de falha?"]
    Accept["Aceitar"]
    Reject["Rejeitar ou responder com doc"]
    NewError["Criar novo E##"]
    Ritual["Ritual de Mudança"]

    Change --> Check1
    Check1 -->|Sim| Ritual
    Check1 -->|Não| Check2
    Check2 -->|Sim| Reject
    Check2 -->|Não| Check3
    Check3 -->|Sim| NewError
    Check3 -->|Não| Reject
    Ritual --> Accept
    NewError --> Accept
```

Referência: [ERROS_CANON.md — Quando uma pergunta nova é válida ou ruído](../strategy/ERROS_CANON.md#quando-uma-pergunta-nova-é-válida-ou-ruído).

---

## 5. Diagrama cognitivo — Sistema vivo (nível futuro)

```mermaid
flowchart TD
    Events["Events / Streams"]
    Errors["ERROS_CANON"]
    Metrics["Métricas"]
    Simulator["Simuladores"]
    ERO["ERO"]

    Events --> Errors
    Events --> Metrics
    Metrics --> ERO
    Errors --> ERO
    Simulator --> Events
    ERO --> Simulator
```

Aqui nasce o sistema cognitivo: o sistema começa a entender a si mesmo. Depende de EVENTS_MINIMAL v1 e métricas canónicas (próximos passos).

Referências: [EVENTS_AND_STREAMS.md](../contracts/EVENTS_AND_STREAMS.md), [ERROS_CANON.md](../strategy/ERROS_CANON.md).

---

## Referências

- [docs/boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md) — Bootstraps 0–5.
- [docs/ERO_CANON.md](../ERO_CANON.md) — Hierarquia de verdade, consciência do sistema.
- [docs/strategy/LEI_EXISTENCIAL_CHEFIAPP_OS.md](../strategy/LEI_EXISTENCIAL_CHEFIAPP_OS.md) — Lei existencial, zonas intocáveis, ritual de mudança.
- [docs/strategy/ERROS_CANON.md](../strategy/ERROS_CANON.md) — Catálogo de falhas inevitáveis, filtro de perguntas novas.
- [docs/contracts/ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md) — Estados de pedido.
- [docs/contracts/CORE_FINANCE_CONTRACT_v1.md](../contracts/CORE_FINANCE_CONTRACT_v1.md) — Dinheiro, caixa, faturas.
- [docs/contracts/MENU_BUILDING_CONTRACT_v1.md](../contracts/MENU_BUILDING_CONTRACT_v1.md) — Menu, snapshot.
- [docs/contracts/EVENTS_AND_STREAMS.md](../contracts/EVENTS_AND_STREAMS.md) — Contrato de eventos.

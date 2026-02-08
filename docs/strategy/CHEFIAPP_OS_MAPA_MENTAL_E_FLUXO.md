# ChefIApp OS — Mapa Mental e Fluxo (Bússola)

**Propósito:** Documento de referência para leitura, auditoria e navegação do projeto. Separa claramente **Restaurante (Runtime)** vs **Online (Cloud)**, mostra bootstraps, núcleos, apps, tarefas, estoque, pessoas, testes e governança.

**Uso:** Quando precisar de orientação sobre "onde está cada coisa" ou "onde se testa o quê". Não descreve só software — descreve um organismo com memória, leis, papéis, tempo e defesas contra si mesmo.

---

## Mapa Mental — ChefIApp OS (Sistema Vivo)

```mermaid
mindmap
  root((ChefIApp OS))
    DockerWorld["Docker World Restaurante Runtime"]
      Bootstrap_0["Bootstrap 0 World"]
        Postgres
        PostgREST
        Realtime
        Keycloak
        MinIO
        Nginx
      Bootstrap_1["Bootstrap 1 Kernel Leis"]
        World_Schema
        Order_Status_Contract
        Menu_Building_Contract
        Core_Finance_Contract
        ERROS_CANON
      Bootstrap_2["Bootstrap 2 Identity Roles"]
        Owner
        Manager
        Staff
        Kitchen
        Auditor
      Bootstrap_3["Bootstrap 3 Billing Gate Local Entitlement"]
        Trial_Active
        Plan_Limits
        Activation_Token
      Bootstrap_4["Bootstrap 4 Restaurant Runtime"]
        Restaurant
        Spaces
        Tables
        Stock_Locations
        Menu_Snapshot
        Tasks_Rules
      Bootstrap_5["Bootstrap 5 App Runtime"]
        TPV
        Mini_TPV
        KDS
        Mini_KDS
        AppStaff
        Customer_QR
    CoreHearts["Corações do Sistema"]
      CoreFinance["Core Finance Coração"]
        OrdersVsMoney["Pedido diferente Dinheiro"]
        ServedVsPaid["Served diferente Paid"]
        Cash_Register
        Invoices
        Refunds
      MenuCore["Menu Building Rainha"]
        Products
        Variants
        Modifiers
        Taxes
        Availability
        Snapshot
      OrderCore["Orders"]
        Status_Flow
        KDS_Visibility
        Idempotency
      TaskSystem["Task System Cérebro Repetitivo"]
        Legal_Tasks
        Hygiene
        Prep
        Alerts
      StockSystem["Stock Inventory"]
        Fridge_A
        Fridge_B
        Freezer
        Deposit
        Menu_Consumption
    PeopleSystem["Pessoas AppStaff"]
      What_They_See
      What_They_Cannot_Do
      Role_Based_UI
      Audit_Logs
      Shift_Handover
    Simulators["Simuladores"]
      Orders_Simulator
      Chaos_Simulator
      People_Simulator
    TestingGovernance["Testes e Governança Viva"]
      Checklists
        Checklist_Operacional
        Checklist_Mundo_Estressado
        Test_Plan_Before_Freeze
      Rituals
        World_Chaos
        Ritual_Abrir_Sistema
        Ritual_De_Mudanca
      Laws
        ERROS_CANON
        Lei_Existencial
        Zonas_Intocaveis
    OnlineCloud["Online Cloud fora do restaurante"]
      Landing
      Trial
      Billing
      Vercel
      GitHub
      Google_OAuth
      Analytics
      Integrations
        UberEats
        Glovo
        Others
      CI_CD
```

---

## Fluxo — Online → Restaurante → Operação

```mermaid
flowchart LR
  Landing --> Trial
  Trial --> Billing
  Billing --> ActivationToken["Activation Token"]
  ActivationToken --> DockerWorld["Docker World Import"]
  DockerWorld --> RestaurantRuntime["Restaurant Runtime"]
  RestaurantRuntime --> TPV
  RestaurantRuntime --> KDS
  RestaurantRuntime --> AppStaff
  RestaurantRuntime --> CustomerQR["Customer QR"]
  TPV --> Orders
  Orders --> CoreFinance["Core Finance"]
  Orders --> KDS
  KDS --> Tasks
  Tasks --> AppStaff
  Stock --> Menu
  Menu --> Orders
```

---

## Onde se testa cada coisa (regra de ouro)

| O quê                | Onde / como                                |
| -------------------- | ------------------------------------------ |
| Docker World         | Simulador, caos, checklist                 |
| Core Finance         | Contratos + E07 / E10 / E22                |
| Menu / Stock / Tasks | Snapshot + [ERROS_CANON](./ERROS_CANON.md) |
| AppStaff             | Role-based UI + logs                       |
| Online               | Testes isolados (não tocam `gm_orders`)    |

---

## Quando pode congelar (freeze legítimo)

Pode congelar quando:

- Docker World passou Test Day
- Simuladores funcionam
- Caos não mata estado
- Um humano operou TPV + KDS + caixa
- Perguntas novas passam pelo filtro (invariante / E## / novo eixo)

Referências: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md), [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md), [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md).

---

## Verdade final (em uma linha)

Este diagrama não descreve "software". Descreve um organismo com memória, leis, papéis, tempo e defesas contra si mesmo.

---

## Documentos relacionados

| Documento                                                                              | Propósito                                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [SCOPE_FREEZE.md](./SCOPE_FREEZE.md)                                                   | Escopo congelado; o que não se faz agora                                 |
| [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md)                             | Plano de teste antes de freeze; 4 testes                                 |
| [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) | Checklist operacional TPV, KDS, Cliente                                  |
| [ERROS_CANON.md](./ERROS_CANON.md)                                                     | Erros canónicos (E07, E10, E22, etc.)                                    |
| [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md)                     | Lei existencial; ritual de mudança; zonas intocáveis                     |
| [FREEZE_OPERACIONAL.md](./FREEZE_OPERACIONAL.md)                                       | Freeze operacional 1.0-rc; o que está congelado; fases e decisão binária |
| [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md)                       | Índice de contratos Core                                                 |
| [CORE_SYSTEM_TREE_CONTRACT.md](../architecture/CORE_SYSTEM_TREE_CONTRACT.md)           | Árvore canónica do Restaurant OS; mapa endpoint → nó; fonte para DS e UI |

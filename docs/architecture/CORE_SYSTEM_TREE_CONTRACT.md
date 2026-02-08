# Contrato da System Tree — Restaurant OS

**Propósito:** Fonte única da árvore do Restaurant OS para UI (dashboard, Command Center) e para Design System. Separa claramente "o que existe e em que estado" (control plane) de "quem executa" (pilha de execução).

**Uso:** Qualquer UI que mostre a árvore do sistema, o dashboard de módulos ou o estado operacional deve derivar estado dos nós a partir dos endpoints mapeados neste contrato. O Design System usa esta árvore como fonte; não reinterpreta.

---

## 1. Âmbito

Este contrato governa:

- A estrutura lógica canónica da árvore do Restaurant OS (o que a UI mostra).
- O mapeamento explícito entre recursos do Core (tabelas, RPCs) e nós da árvore.
- A regra de que nenhum estado de árvore deve ser inventado fora desta fonte.

Este contrato **não** governa:

- A pilha de execução (Kernel → Core → Contratos → Terminais). Ver [SYSTEM_TREE_VS_EXECUTION.md](./SYSTEM_TREE_VS_EXECUTION.md).
- O detalhe visual do Command Center (System Health, Terminals, Operations, Commerce). Ver [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md).
- Provisionamento e registro de terminais. Ver [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md).
- Identidade de staff operacional. Ver [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md).

---

## 2. Árvore canónica (estrutura lógica)

Uma única estrutura. Tudo o que a UI mostra (dashboard, árvore, DS) deve poder ser mapeado para estes nós.

```
Restaurant OS
├── Restaurante
│   ├── Identidade
│   ├── Estado (trial / active)
│   └── Horários
├── Operação
│   ├── Turno
│   ├── Caixa
│   └── Pedidos
├── Terminais
│   ├── TPV
│   ├── KDS
│   └── AppStaff
├── Pessoas
│   ├── Owner
│   ├── Staff
│   └── Funções
└── Core
    ├── Financeiro
    ├── Eventos
    └── Métricas
```

**Regra:** A UI (dashboard, SystemTreeContext) deve derivar estado dos nós a partir dos endpoints listados abaixo; nenhum estado de árvore deve ser inventado fora desta fonte.

---

## 3. Mapa endpoint → nó (fonte para DS + árvore)

Cada recurso do Core (tabela ou RPC) alimenta um ou mais nós da árvore. A tabela abaixo é a autoridade para "quem fala com quem, em que momento, e com que autoridade".

### 3.1 Leitura (GET)

| Recurso                          | Método | Nó(s) da árvore                                       |
| -------------------------------- | ------ | ----------------------------------------------------- |
| gm_restaurants (lista ou por id) | GET    | Restaurante → Identidade, Estado                      |
| restaurant_setup_status          | GET    | Restaurante → progresso setup                         |
| restaurant_schedules             | GET    | Restaurante → Horários                                |
| installed_modules                | GET    | Terminais (módulos instalados), Operação (capacidade) |
| gm_products                      | GET    | Core / Operação (menu para pedidos)                   |
| gm_orders                        | GET    | Operação → Pedidos                                    |
| gm_cash_registers                | GET    | Operação → Caixa                                      |
| gm_restaurant_members            | GET    | Pessoas → Owner / membros técnicos                    |
| gm_terminals                     | GET    | Terminais → TPV, KDS, AppStaff instalados/online      |
| gm_staff                         | GET    | Pessoas → Staff, Funções                              |

### 3.2 Escrita (PATCH / RPC)

| Recurso                      | Método     | Nó(s) da árvore                         |
| ---------------------------- | ---------- | --------------------------------------- |
| gm_restaurants               | PATCH      | Restaurante → Identidade, Estado        |
| restaurant_setup_status      | PATCH      | Restaurante → progresso setup           |
| create_order_atomic          | RPC        | Operação → Pedidos                      |
| update_order_status          | RPC        | Operação → Pedidos                      |
| open_cash_register_atomic    | RPC        | Operação → Caixa, Turno                 |
| close_cash_register_atomic   | RPC        | Operação → Caixa, Turno                 |
| gm_terminals (insert/upsert) | POST/PATCH | Terminais → instalação real de terminal |

---

## 4. Agrupamento UI (Dashboard)

O sidebar do dashboard (DashboardPortal) segue a hierarquia GloriaFood/Toast em **5 blocos**, com progressive disclosure:

| Bloco           | Conteúdo                                                                              | Regra                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Começar**     | Configurar restaurante, Cardápio, Publicar, Instalar Terminais                        | Tudo para desbloquear "Primeira venda". Instalar Terminais leva a `/app/install`.                                        |
| **Operar**      | TPV, KDS, Alertas, Saúde                                                              | TPV/KDS desativados quando ORE bloqueia (Core offline, não publicado, sem caixa/turno); tooltip conforme blockingReason. |
| **Equipe**      | AppStaff, Pessoas, Tarefas, Presença Online                                           | Links activos; Pessoas pode ficar disabled com CTA se não houver endpoint gm_staff consumido.                            |
| **Gestão**      | Financeiro, Faturação, Percepção Operacional                                          | Links activos.                                                                                                           |
| **Crescimento** | Reservas, Compras, Multi-Unidade, QR Mesa, Mentor IA, Painel Pedidos Prontos, Estoque | Secção **colapsada por defeito**; itens disabled + tooltip "Em evolução"; não aparecem no onboarding checklist.          |

**Progressive disclosure:** Instalar Terminais aparece sempre em Começar; TPV/KDS entram em Operar como links activos apenas quando ORE/preflight permitir (Core UP + menu publicado + condições de turno/caixa). Itens de Crescimento ficam disabled e não bloqueiam o fluxo do primeiro restaurante.

Checklist manual: [CHECKLIST_SYSTEM_TREE_5_BLOCOS.md](../strategy/CHECKLIST_SYSTEM_TREE_5_BLOCOS.md).

---

## 4.1. System Tree v1.0 (5 blocos) — Congelada

**Status:** v1.0 congelada. Esta é a vista por blocos de UI; referência para Design System e Command Center. A árvore do §2 permanece como vista por domínios.

Árvore ASCII definitiva (IDs e labels alinhados ao DashboardPortal):

```
Restaurant OS (sidebar)
├── Começar
│   ├── config       → Configurar restaurante
│   ├── menu         → Cardápio
│   ├── publish      → Publicar
│   └── install      → Instalar Terminais
├── Operar
│   ├── tpv          → TPV
│   ├── kds          → KDS
│   ├── alerts       → Alertas
│   └── health       → Saúde
├── Equipe
│   ├── appstaff     → AppStaff
│   ├── people       → Pessoas
│   ├── tasks        → Tarefas
│   └── restaurant-web → Presença Online
├── Gestão
│   ├── financial   → Financeiro
│   ├── billing     → Faturação
│   └── perception  → Percepção Operacional
└── Crescimento (colapsado por defeito; itens disabled + tooltip "Em evolução")
    ├── reservations   → Reservas
    ├── purchases      → Compras
    ├── groups         → Multi-Unidade
    ├── qr-table       → QR Mesa
    ├── mentor         → Mentor IA
    ├── public-kds     → Painel Pedidos Prontos
    └── inventory-stock → Estoque
```

Regras por bloco:

| Bloco           | Regra                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Começar**     | Nada aqui depende de TPV, KDS ou pessoas; desbloqueia "Primeira venda"; Instalar Terminais → `/app/install`.         |
| **Operar**      | Obedece ORE/Preflight; Core OFF → TPV/KDS desativados com indicação; menu não publicado / turno fechado → bloqueado. |
| **Equipe**      | Pessoas como organização (gm_staff); AppStaff é terminal humano, não feature.                                        |
| **Gestão**      | Só leitura; nunca bloqueia operação; pode existir sem TPV ativo.                                                     |
| **Crescimento** | Colapsado por defeito; todos os itens disabled + tooltip "Em evolução"; não aparecem no onboarding.                  |

---

## 4.2. Equivalências GloriaFood / Toast (referência)

Tabela de concordância para auditoria e alinhamento com padrões de mercado. Fontes: documentação pública GloriaFood (dashboard, setup, widgets); Toast Central e Platform guide (Get Started, Toast Web, Setup).

| Bloco nosso     | GloriaFood                                                         | Toast                                                             |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Começar**     | Setup; configuração inicial, widgets (ordering, reservation, menu) | Getting Started; Setup > Other Setup; configuração de restaurante |
| **Operar**      | —                                                                  | POS, Kitchen, Orders (operações em tempo real)                    |
| **Equipe**      | —                                                                  | Employees, Access permissions                                     |
| **Gestão**      | Restaurant reports (sales, menu analytics, promotions, etc.)       | Reports, Analytics, Payments and money management                 |
| **Crescimento** | Widgets avançados, expansão                                        | Multiple locations, Discounts, Integrations                       |

| Item nosso (exemplos)  | Equivalente aproximado                                                     |
| ---------------------- | -------------------------------------------------------------------------- |
| Configurar restaurante | Restaurant settings / Profile (Toast); Dashboard setup (GloriaFood)        |
| Cardápio               | Menus and menu items (Toast); Menu (GloriaFood)                            |
| Instalar Terminais     | Add devices / Install hardware (Toast); Order taking devices (GloriaFood)  |
| TPV / KDS              | POS, Kitchen display (Toast)                                               |
| Pessoas / Equipe       | Employees and access (Toast)                                               |
| Financeiro / Faturação | Payments and money management, Reports (Toast); Sales reports (GloriaFood) |

---

## 5. Referências

- [ENDPOINTS_CATALOG_PORTAL.md](../ops/ENDPOINTS_CATALOG_PORTAL.md) — Catálogo Feature → Route → Reader/Writer → Core.
- [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) — Estrutura Command Center (System Health, Terminals, Operations, Commerce).
- [SYSTEM_TREE_VS_EXECUTION.md](./SYSTEM_TREE_VS_EXECUTION.md) — Pilha de execução vs control plane tree.
- [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) — Registo de terminais no Core.
- [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md) — Identidade e presença de staff operacional; tarefas e KDS obedecem a este contrato.
- [ROADMAP_POS_FREEZE.md](../strategy/ROADMAP_POS_FREEZE.md) — Roadmap pós-freeze: gaps, fases e trilhos para o próximo movimento.

---

_Contrato da System Tree. Alterações que inventem estado de árvore fora dos endpoints mapeados violam este contrato._

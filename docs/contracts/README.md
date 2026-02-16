# Contratos (docs/contracts) — ChefIApp POS Core

Contratos técnicos que vivem em `docs/contracts/` (referência e autoridade de escrita por domínio).

---

## Funil do Cliente (mapa de voo)

**Índice canónico dos 14 contratos:** [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

| Documento | Uma linha |
|-----------|-----------|
| [FUNIL_VIDA_CLIENTE.md](./FUNIL_VIDA_CLIENTE.md) | **Mapa de voo:** Bloco 1 Visão única, Bloco 2–4 Contratos/Telas/Fluxo, analogia do carro, decisão estratégica. |
| [CONTRATO_LANDING_CANONICA.md](./CONTRATO_LANDING_CANONICA.md) | Entrada: visitante anónimo, sem estado (LANDING_ENTRY). |
| [TRIAL_ACCOUNT_CONTRACT.md](./TRIAL_ACCOUNT_CONTRACT.md) | Trial Gate: utilizador criado, sem restaurante. |
| [RESTAURANT_BOOTSTRAP_CONTRACT.md](./RESTAURANT_BOOTSTRAP_CONTRACT.md) | Bootstrap: criar restaurante. |
| [MENU_MINIMAL_CONTRACT.md](./MENU_MINIMAL_CONTRACT.md) | Menu mínimo: 1 categoria, 1 produto, preço. |
| [OPERATION_MODE_CONTRACT.md](./OPERATION_MODE_CONTRACT.md) | Modo: "Vender agora" vs "Configurar melhor". |
| [FIRST_SALE_RITUAL.md](./FIRST_SALE_RITUAL.md) | Ativação: primeira venda (TPV, pedido, pago). |
| [TRIAL_OPERATION_CONTRACT.md](./TRIAL_OPERATION_CONTRACT.md) | Trial em uso real: dashboard, avisos de dias restantes. |
| [TRIAL_TO_PAID_CONTRACT.md](./TRIAL_TO_PAID_CONTRACT.md) | Negócio: fim do trial — escolher plano ou encerrar. |
| [BILLING_AND_PLAN_CONTRACT.md](./BILLING_AND_PLAN_CONTRACT.md) | Negócio: planos SaaS, assinatura, trial countdown. |
| [ONBOARDING_FLOW_CONTRACT.md](./ONBOARDING_FLOW_CONTRACT.md) | Fluxo onboarding: 4 passos, estados, modais vs páginas, retomada. |

---

## Documentos neste diretório

| Documento                                                                      | Uma linha                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CORE_FOUR_TERMINALS_INDEX.md](./CORE_FOUR_TERMINALS_INDEX.md)                 | Índice dos 4 terminais (Web Pública, AppStaff, KDS, TPV).                                                                                                                                                                         |
| [CORE_PUBLIC_WEB_CONTRACT.md](./CORE_PUBLIC_WEB_CONTRACT.md)                   | Contrato da Web Pública (GloriaFood).                                                                                                                                                                                             |
| [DOMAIN_WRITE_AUTHORITY_CONTRACT.md](./DOMAIN_WRITE_AUTHORITY_CONTRACT.md)     | Autoridade de escrita por domínio.                                                                                                                                                                                                |
| [EVENTS_AND_STREAMS.md](./EVENTS_AND_STREAMS.md)                               | Event Store, streams, nomenclatura de eventos.                                                                                                                                                                                    |
| [EXECUTION_CONTEXT_CONTRACT.md](./EXECUTION_CONTEXT_CONTRACT.md)               | Contexto de execução e fronteiras.                                                                                                                                                                                                |
| [EXECUTION_FENCE_CONTRACT.md](./EXECUTION_FENCE_CONTRACT.md)                   | Cercas de execução.                                                                                                                                                                                                               |
| [CONTRATO_ENTRADA_CANONICA.md](./CONTRATO_ENTRADA_CANONICA.md)                 | Entrada única + landing canónica: uma porta principal, preço 79 €, quatro regras, fluxo humano único.                                                                                                                             |
| [CONTRATO_LANDING_CANONICA.md](./CONTRATO_LANDING_CANONICA.md)                 | Uma landing, um preço (79 €), uma promessa; rota canónica /; proibido segundo entry-point para VISITOR.                                                                                                                           |
| [CONTRATO_VIDA_RESTAURANTE.md](./CONTRATO_VIDA_RESTAURANTE.md)                 | Estados da jornada do restaurante (Visitor → Demo → Bootstrap → Operação) e matriz fase ↔ rota.                                                                                                                                   |
| [CONTRATO_OWNER_ONLY_WEB.md](./CONTRATO_OWNER_ONLY_WEB.md)                     | Web de configuração exclusiva do Dono; Gerente/Staff só na operação (TPV, KDS, AppStaff).                                                                                                                                         |
| [CONTRATO_TRIAL_REAL.md](./CONTRATO_TRIAL_REAL.md)                             | SystemState (SETUP/TRIAL/ACTIVE/SUSPENDED); trial 14 dias; sem estado demo/piloto na UI.                                                                                                                                          |
| [CONTRATO_PRONTIDAO_DADOS.md](./CONTRATO_PRONTIDAO_DADOS.md)                   | Web Config ↔ Core: só chamar quando há dados; se não há, explicar + CTA; nunca tela em branco (Readiness).                                                                                                                        |
| [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md)         | Ciclo de vida do restaurante (configured / published / operational).                                                                                                                                                              |
| [STATUS_CONTRACT.md](./STATUS_CONTRACT.md)                                     | Contrato de status do sistema.                                                                                                                                                                                                    |
| [LEI_DO_TURNO.md](./LEI_DO_TURNO.md)                                           | Lei do Turno: uma única verdade para “turno aberto”; TPV, KDS e Dashboard observam a mesma fonte.                                                                                                                                 |
| [CONTRATO_DO_TURNO.md](./CONTRATO_DO_TURNO.md)                                 | Contrato do Turno (Regente): definição, responsabilidades, quem abre (TPV/App Staff), quem observa, relação com Core e Menu.                                                                                                      |
| [CONTRATO_DE_ATIVIDADE_OPERACIONAL.md](./CONTRATO_DE_ATIVIDADE_OPERACIONAL.md) | Estados IDLE/SERVING/CLOSING derivados do Core; liga Turno e Tarefas; evento RESTAURANT_IDLE para modo interno.                                                                                                                   |
| [TASKS_CONTRACT_v1.md](./TASKS_CONTRACT_v1.md)                                 | Contrato canónico de tarefas: tipos, ciclo de vida, onde aparecem, pessoas, Menu↔Estoque↔Tarefas; scope agora.                                                                                                                    |
| **Inventory Lite (AppStaff)**                                                  | Alertas de stock (qty ≤ min_qty) e tarefas «repor X» (ESTOQUE_CRITICO). Extensão de TASKS_CONTRACT_v1 e [ERROS_CANON](../strategy/ERROS_CANON.md) E56–E60. Implementação: readStockAlerts, InventoryLiteSection, create_task RPC. |
| [KDS_LAYOUT_UX_CONTRACT.md](./KDS_LAYOUT_UX_CONTRACT.md)                       | KDS: layout flex, um único scroll na lista, sem barra preta no rodapé; tabs Todas/Cozinha/Bar; filtro activeOnly.                                                                                                                |
| [KDS_BAR_COZINHA_STATION_CONTRACT.md](./KDS_BAR_COZINHA_STATION_CONTRACT.md)   | KDS: Bar vs Cozinha — station em produtos e itens; migração 20260224; fallback na leitura de itens; filtro e secções COZINHA/BAR.                                                                                                 |

---

## Índice principal

O **índice canónico** de todos os contratos (architecture + contracts) está em:

- [docs/architecture/CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md)

Regra: todo o `.md` em `docs/architecture` e `docs/contracts` deve estar referenciado no índice.

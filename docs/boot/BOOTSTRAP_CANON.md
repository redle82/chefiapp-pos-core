# Bootstraps canónicos — ChefIApp OS

O bootstrap não é uma única coisa. É uma **sequência de 6 camadas** que sobem o mundo de forma controlada. Se um bootstrap falha, o mundo não sobe.

---

## Definição

Cada bootstrap tem: **Purpose**, **Inputs**, **Outputs**, **Invariants**, **Commands**, **Smoke tests**. Os documentos individuais estão em [docs/boot/](.).

---

## Os 6 bootstraps

| #   | Nome                                                         | Objectivo (uma frase)                              | Saída                                   |
| --- | ------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------- |
| 0   | [World Boot](BOOTSTRAP_0_WORLD.md)                           | Levantar o planeta (infra)                         | O mundo respira                         |
| 1   | [Kernel Boot](BOOTSTRAP_1_KERNEL.md)                         | Gravar as leis do mundo (contratos + schemas)      | O mundo tem gramática e regras          |
| 2   | [Identity & Tenancy Boot](BOOTSTRAP_2_IDENTITY_TENANCY.md)   | Criar identidade e permissão                       | Quem é quem no mundo                    |
| 3   | [Billing Gate Boot](BOOTSTRAP_3_BILLING_GATE.md)             | Ninguém entra no modo operacional sem regime certo | O sistema sabe se pode funcionar ou não |
| 4   | [Restaurant Runtime Boot](BOOTSTRAP_4_RESTAURANT_RUNTIME.md) | Criar um restaurante activo de verdade             | Existe um restaurante operacional       |
| 5   | [App Runtime Boot](BOOTSTRAP_5_APP_RUNTIME.md)               | Pôr os módulos a rodar em cima do mundo            | O restaurante funciona no dia-a-dia     |

Opcional (hardcore enterprise): **7.º Observability Boot** — ou embutido no Boot 0.

---

## Analogia (sistema vivo)

- **Boot 0 — World** = A casa (Docker = palco da realidade).
- **Boot 1 — Kernel** = As leis (contratos + schema = gramática do mundo).
- **Boot 2 — Identity** = Quem é quem (tenant, user, roles).
- **Boot 3 — Billing** = Portão de acesso (trial/plan/entitlements; controle de acesso ao runtime).
- **Boot 4 — Restaurant Runtime** = Restaurante activo (store, spaces, tables, menu mínimo, config).
- **Boot 5 — App Runtime** = Braços em acção (TPV, KDS, Cliente, Integrations, Task system).

---

## Fluxo de entrada

Landing → Trial (Gate 1) → Billing Gate (Gate 2) → Restaurant Runtime → App Runtime. Ver [FLOW_LANDING_TRIAL_BILLING_RUNTIME.md](../strategy/FLOW_LANDING_TRIAL_BILLING_RUNTIME.md).

---

## Referências

- ERO (consciência do sistema): [ERO_CANON.md](../ERO_CANON.md)
- Contratos: [docs/contracts/](../contracts/) (WORLD_SCHEMA_v1, MENU_BUILDING_CONTRACT_v1, CORE_FINANCE_CONTRACT_v1, ORDER_STATUS_CONTRACT_v1)
- CLI do mundo: [CLI_CHEFIAPP_OS.md](../strategy/CLI_CHEFIAPP_OS.md)

# ERO — Entidade Reguladora Operacional (ChefIApp OS)

Manual vivo do sistema: consciência + regras + contratos + rituais. Curto, sagrado, utilizável.

---

## 1. O que é ERO

**ERO = Entidade Reguladora Operacional** (ou Entidade de Razão Operacional).

As EROs são: documentos + contratos + regras que ensinam o sistema a não quebrar. Permitem simulação, teste, replay. ERO não é código; ERO é **consciência do sistema** — decide como o sistema não enlouquece.

---

## 2. Hierarquia de Verdade (source of truth)

Ordem de autoridade (do mais alto para o mais baixo):

1. **Contratos** — [docs/contracts/](contracts/) (WORLD_SCHEMA_v1, MENU_BUILDING_CONTRACT_v1, CORE_FINANCE_CONTRACT_v1, ORDER_STATUS_CONTRACT_v1).
2. **Schema + RPCs** — Postgres schema, funções RPC do Core (docker-core/schema/).
3. **Checklist operacional** — [docs/strategy/](strategy/) (CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE, CHECKLIST_KDS_FLUXO).
4. **UI / Frontend** — Merchant portal, TPV, KDS; obedecem aos contratos.
5. **Simuladores** — Injectam carga; não definem regras.

---

## 3. Leis imutáveis

- **Pedido não vira dinheiro sem Core Finance.**
- **TPV não inventa preço.**
- **KDS não pode filtrar silenciosamente** (status desconhecido aparece com badge, não some).
- **Menu é entidade financeira (snapshot)** — pedido congela preço/tax no momento da criação.

---

## 4. Bootstraps canónicos

Seis camadas que sobem o mundo de forma controlada. **Se um bootstrap falha, o mundo não sobe.**

| #   | Bootstrap               | Saída                                   |
| --- | ----------------------- | --------------------------------------- |
| 0   | World Boot              | O mundo respira                         |
| 1   | Kernel Boot             | O mundo tem gramática e regras          |
| 2   | Identity & Tenancy Boot | Quem é quem no mundo                    |
| 3   | Billing Gate Boot       | O sistema sabe se pode funcionar ou não |
| 4   | Restaurant Runtime Boot | Existe um restaurante operacional       |
| 5   | App Runtime Boot        | O restaurante funciona no dia-a-dia     |

Detalhe: [docs/boot/BOOTSTRAP_CANON.md](boot/BOOTSTRAP_CANON.md).

---

## 5. Rituais (operacionais)

- **Abrir telas** — [RITUAL_ABRIR_SISTEMA_TELAS.md](strategy/RITUAL_ABRIR_SISTEMA_TELAS.md) (observar sem corrigir).
- **Checklist operacional** — [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) (TPV + KDS + Cliente, pass/fail).
- **Caos / replay** — [CLI_CHEFIAPP_OS.md](strategy/CLI_CHEFIAPP_OS.md) (world-up, world-down, world-chaos).
- **Incident log** — (referência futura; onde registar falhas e decisões).
- **Governança viva** — [LEI_EXISTENCIAL_CHEFIAPP_OS.md](strategy/LEI_EXISTENCIAL_CHEFIAPP_OS.md) (quatro perguntas como lei, zonas intocáveis, ritual de mudança; quem protege o sistema de nós mesmos).

---

## 6. Critério de aceite do mundo

**Referência directa:** [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md).

Se esse checklist falha, **o mundo está quebrado**. Não há “quase a funcionar” — ou TPV/KDS/Cliente passam nos passos definidos, ou o sistema não está aceite.

---

## 7. Governança viva

**Quem protege o sistema de nós mesmos:** [LEI_EXISTENCIAL_CHEFIAPP_OS.md](strategy/LEI_EXISTENCIAL_CHEFIAPP_OS.md) — quatro perguntas como lei, zonas intocáveis (tabu), ritual de mudança e resposta à pergunta "quem protege o sistema daqui a 12 meses?". Antes de alterar contratos ou zonas tabu, seguir o ritual de mudança definido nesse documento.

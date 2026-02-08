# Régua "Mundo Verdadeiro" — ChefIApp OS

A pergunta correcta não é "o Docker sobe?" mas **"o mundo dentro do Docker é isomórfico ao mundo declarado nos contratos, na ERO e nos checklists?"**

Este documento codifica a régua em três níveis (mecânico, semântico, existencial) e o veredito de fase. Usa-se para validar que o sistema está "verdadeiro", não apenas a correr.

---

## Nível 1 — Verificação mecânica

Critérios objectivos: o que já foi prometido está executado.

### 1.1 Mundo sobe com um comando

**Comando:** `make world-up` ou `./scripts/chef-world-up.sh`

**Pass:** Postgres sobe; PostgREST responde; sem erro silencioso; nenhum serviço "meio vivo".

**Fail:** É preciso rodar comando manual; "dar um jeitinho"; algum serviço sobe quebrado.

**Referência:** [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md). Se isto passa, o Bootstrap 0 está correcto.

---

### 1.2 Kernel aplicado

**Verificação:** Schema e constraints batem com os contratos; status aceites são os do [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md).

**Pass:** Schema existe; constraints batem com contratos; RPC aceita apenas o que o contrato permite.

**Fail:** Schema não bate com doc; status aceita valor fora do enum; RPC aceita o que não devia.

**Referência:** [BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md) (Bootstrap 1 — Kernel). Valida que as leis do mundo estão aplicadas.

---

### 1.3 Simulador → KDS

**Comando:** `POSTGREST_URL=http://localhost:3001 COUNT=5 node simulators/orders/run.js` (com Core e merchant portal a correr). Abrir KDS.

**Pass:** Pedidos aparecem no KDS; status correctos; nenhum "KDS vazio mentiroso".

**Fail:** Pedido existe no DB mas não aparece; aparece errado; some sem virar terminal.

**Referência:** [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md). Valida Core → Front isomórfico.

---

### 1.4 world-chaos não destrói o mundo

**Comando:** `make world-chaos` (reinicia PostgREST por defeito).

**Pass:** Serviços reiniciam; KDS volta; pedidos voltam; nenhum estado se perde (após refresh/polling).

**Fail:** É preciso reiniciar tudo; perde pedidos; front fica vazio de forma permanente.

**Referência:** [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md), [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) (ritual caos). Valida resiliência real.

---

Se os quatro pontos passam, tecnicamente o Docker está correcto. Isso ainda não garante mundo perfeito; os níveis 2 e 3 cobrem o resto.

---

## Nível 2 — Verificação semântica

Onde equipas sénior costumam falhar: zonas cinza, regras só "na cabeça", possibilidade de quebrar sem perceber.

- **Zonas cinza:** Existe algum fluxo ou botão que "parece funcionar" mas não está coberto por checklist? Se sim, o mundo mente em silêncio.
- **Regras só "na cabeça":** "Isto aqui ninguém usa", "isso não acontece em produção", "depois a gente vê" — regra não escrita é bug futuro.
- **Quebrar sem perceber:** Ex.: mudar status errado, fechar pedido sem dinheiro, editar menu depois do pedido. Mundo perfeito previne erro humano, não confia nele.

**Mitigações existentes:** [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md) (quem pode errar, como detectar mentira, zonas intocáveis); ritual de mudança (antes de alterar contrato ou zona tabu); [SCOPE_FREEZE.md](./SCOPE_FREEZE.md). Isto só funciona se for respeitado.

---

## Nível 3 — Verificação existencial

"Se eu sumir por 30 dias, alguém conseguiria dizer se o sistema está saudável?"

Para responder sim, os seguintes elementos devem existir e estar referenciados:

| Elemento                    | Documento                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- |
| ERO_CANON                   | [docs/ERO_CANON.md](../ERO_CANON.md)                                                   |
| BOOTSTRAP_CANON             | [docs/boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md)                             |
| CHECKLIST_OPERACIONAL       | [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) |
| CHECKLIST_MUNDO_ESTRESSADO  | [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md)                       |
| CLI world-up / down / chaos | [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md)                                             |
| Observability mínima        | [OBSERVABILITY_MINIMA.md](./OBSERVABILITY_MINIMA.md)                                   |
| Lei existencial             | [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md)                     |
| Zonas intocáveis            | Secção em LEI_EXISTENCIAL_CHEFIAPP_OS.md                                               |
| Ritual de mudança           | Secção em LEI_EXISTENCIAL_CHEFIAPP_OS.md                                               |
| Scope freeze                | [SCOPE_FREEZE.md](./SCOPE_FREEZE.md)                                                   |

---

## Veredito e fase

- **Estrutura:** O mundo Docker está completo; não falta nenhum bloco essencial do "mundo perfeito" declarado nos contratos e checklists.
- **Risco restante:** Humano e político — desobedecer aos rituais, zonas intocáveis ou lei existencial. Não é risco técnico.
- **Frase de fecho:** Quando a única forma de quebrar o sistema é desobedecer conscientemente os próprios rituais, o sistema está pronto. A partir daqui não se constrói mais mundo; usa-se, observa-se e governa-se.

---

## Referências

- [ERO_CANON.md](../ERO_CANON.md) — Hierarquia de verdade, consciência do sistema.
- [docs/boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md) — Bootstraps 0–5.
- [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md) — Lei existencial, zonas intocáveis, ritual de mudança.
- [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) — Critério de aceite TPV/KDS/Cliente.
- [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md) — Validação simulador → Core → KDS.
- [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md) — Plano de teste antes de freeze (4 testes, quando parar, ordem de execução).
- [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md) — world-up, world-down, world-chaos.
- [OBSERVABILITY_MINIMA.md](./OBSERVABILITY_MINIMA.md) — Logs, saúde do Core.
- [RITUAL_ABRIR_SISTEMA_TELAS.md](./RITUAL_ABRIR_SISTEMA_TELAS.md) — Ritual de consciência ao abrir o sistema.
- [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) — Escopo congelado ao nível mundo.
- [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md) — Estados de pedido canónicos.

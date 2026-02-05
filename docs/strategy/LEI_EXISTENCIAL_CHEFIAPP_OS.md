# Lei existencial — ChefIApp OS

Estas perguntas não são técnicas; são existenciais do sistema. Se não estiverem escritas como lei, o sistema envelhece mal e a equipa perde a verdade canónica.

---

## 1. O que acontece quando ninguém está olhando?

**Lei:** O sistema deve ser observável e estável quando ninguém está a usar. Logs, estado e saúde do Core são verificáveis. Entropia silenciosa é inaceitável. Se não pudermos responder "o que acontece quando ninguém está olhando", o sistema está quebrado.

**Resposta explícita (o que já fazemos):**

- **Observability mínima** — [OBSERVABILITY_MINIMA.md](./OBSERVABILITY_MINIMA.md): logs do Core (docker compose logs), saúde Postgres (pg_isready), saúde PostgREST (curl localhost:3001).
- **Ritual caos** — [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md): world-chaos para validar reconexão; KDS/TPV devem voltar após refresh/polling.
- **Checklist operacional** — [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md): critério de aceite; se falhar, o mundo está quebrado.

---

## 2. Quem tem permissão para fazer cagada?

**Lei:** Não é só "quem pode fazer X"; é "quem pode quebrar o sistema sem perceber". O sistema deve reduzir e declarar isso. Quem pode errar está declarado; tentativas proibidas são logadas e rejeitadas.

**Resposta explícita:**

- **ACCESS_RULES_MINIMAL** — [docs/contracts/ACCESS_RULES_MINIMAL.md](../contracts/ACCESS_RULES_MINIMAL.md): quem pode criar pedido, mudar status, fechar financeiro, ver faturação; o que acontece em acção proibida (UI bloqueia, Core rejeita, log).
- Exemplos de quem pode errar: gerente fecha pedido errado; dev adiciona status novo; integração manda payload torto. A lei: declarar e rejeitar; não silenciar tentativas proibidas.

---

## 3. Como sabemos que o sistema está mentindo?

**Lei:** A UI não é fonte de verdade. O sistema deve permitir detectar "algo parece certo, mas não é". Não existe "quase a funcionar".

**Resposta explícita:**

- **Hierarquia de verdade** — [ERO_CANON.md](../ERO_CANON.md): contratos > schema > checklist > UI > simuladores.
- **KDS** — Não filtra silenciosamente; status desconhecido aparece com badge, não some.
- **Core Finance** — Fonte de verdade financeira; Served ≠ Paid.
- **Alerta semântico** — Se o checklist falhar (TPV/KDS/Cliente), o mundo está quebrado ([ESTAMOS_PRONTOS.md](./ESTAMOS_PRONTOS.md), [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)).
- **Catálogo de falhas e detecção** — [ERROS_CANON.md](./ERROS_CANON.md): Radar de Falhas (invariantes, pontos de fratura, trilha de eventos) e 30 falhas inevitáveis com como detectar e como corrigir.

---

## 4. Qual parte do sistema NÃO pode evoluir?

**Lei:** Todo o sistema sério tem áreas congeladas. Não tudo é "refatorável". Core Finance, Order Status, Menu Snapshot são declarados como tabu; alteração exige justificação de Fase 2 e ritual de mudança (secção abaixo).

**Resposta explícita:** Zonas intocáveis (tabu) — ver secção "Zonas intocáveis (tabu)" neste documento.

---

## Zonas intocáveis (tabu)

Alteração em zona intocável exige: (1) justificação escrita (Fase 2 ou correção de bug crítico), (2) ritual de mudança (secção abaixo), (3) actualização do contrato correspondente e do ERO_CANON se a hierarquia de verdade mudar.

| Zona              | Contrato                                                                  | Regra                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Finance**  | [CORE_FINANCE_CONTRACT_v1.md](../contracts/CORE_FINANCE_CONTRACT_v1.md)   | Não alterar regras de dinheiro, pagamento, invoice ou refund sem justificação de Fase 2 e ritual de mudança. Pedido ≠ Dinheiro; Served ≠ Paid.                          |
| **Order Status**  | [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md)   | Não adicionar status novo nem alterar transições terminais sem justificação de Fase 2 e ritual de mudança. KDS e OrderReader dependem deste contrato.                   |
| **Menu Snapshot** | [MENU_BUILDING_CONTRACT_v1.md](../contracts/MENU_BUILDING_CONTRACT_v1.md) | Pedido congela preço/tax no momento da criação. Não alterar regra de snapshot nem permitir pedido sem product_id válido sem justificação de Fase 2 e ritual de mudança. |

Referências: [ERO_CANON.md](../ERO_CANON.md), [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) (ChefIApp OS completo), contratos em [docs/contracts/](../contracts/).

---

## Ritual de mudança

Antes de alterar qualquer parte do sistema que toque contratos, schema, checklist ou zonas intocáveis:

1. **Ler** — [ERO_CANON.md](../ERO_CANON.md) (hierarquia de verdade, leis imutáveis); [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) (escopo congelado, ChefIApp OS completo); secção "Zonas intocáveis (tabu)" neste doc (se a mudança tocar Core Finance, Order Status, Menu Snapshot).
2. **Verificar** — A mudança viola alguma zona intocável? Se sim, justificação de Fase 2 ou bug crítico é obrigatória; não fazer "só mais uma exceção".
3. **Validar** — Após a mudança: executar [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md); se aplicável, [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md) e ritual caos (world-chaos). Se o checklist falhar, a mudança não está aceite.
4. **Documentar** — Actualizar o contrato ou doc afectado; se a verdade canónica mudar, actualizar ERO_CANON ou índice de contratos.

**Regra:** Sem ritual de mudança, não se altera contrato, schema de zonas intocáveis nem critério de aceite. "Depois a gente arruma" e "é só mais um status" são proibidos por esta lei.

Referências: [ERO_CANON.md](../ERO_CANON.md), [SCOPE_FREEZE.md](./SCOPE_FREEZE.md), [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md), [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md), [ESTAMOS_PRONTOS.md](./ESTAMOS_PRONTOS.md).

---

## Quem protege o sistema de nós mesmos daqui a 12 meses?

**Pergunta:** Quem protege o sistema de nós mesmos daqui a 12 meses?

**Resposta:** Governança viva. Não é uma pessoa nem um role; é o conjunto de:

1. **ERO** — Consciência do sistema, hierarquia de verdade, leis imutáveis ([ERO_CANON.md](../ERO_CANON.md)).
2. **Lei do congelamento** — Zonas intocáveis (secção neste doc) e [SCOPE_FREEZE.md](./SCOPE_FREEZE.md).
3. **Ritual de mudança** — Antes de alterar contrato ou zona tabu, ler ERO e freeze, validar com checklist, documentar (secção neste doc).
4. **Checklist e ritual caos** — Critério de aceite explícito ([CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)); se falhar, o mundo está quebrado. [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md) (world-chaos).

Estes documentos e rituais protegem o sistema de "nós mesmos" — decisões de atalho, excepções que viram regra, perda de verdade canónica. Manter esta lei viva (ler, aplicar, não contornar) é responsabilidade de quem altera o sistema.

**Régua "mundo verdadeiro":** [MUNDO_VERDADEIRO_REGUA.md](./MUNDO_VERDADEIRO_REGUA.md) — como saber se o mundo dentro do Docker é isomórfico ao declarado (três níveis: mecânico, semântico, existencial; veredito e fase).

Referências: [ERO_CANON.md](../ERO_CANON.md), [SCOPE_FREEZE.md](./SCOPE_FREEZE.md), [ESTAMOS_PRONTOS.md](./ESTAMOS_PRONTOS.md), [MUNDO_VERDADEIRO_REGUA.md](./MUNDO_VERDADEIRO_REGUA.md).

# Plano técnico — Lei do Turno (3 commits)

Ponte para execução: transformar o [CONTRATO_DO_TURNO](../contracts/CONTRATO_DO_TURNO.md) e a [LEI_DO_TURNO](../contracts/LEI_DO_TURNO.md) em alterações concretas, sem abrir escopo. Apenas decisões; código fica para quando mandares.

**Referências:** CONTRATO_DO_TURNO.md, LEI_DO_TURNO.md, CORE_DECISION_LOG (2026-02-02).

---

## Objetivo único

Uma única fonte de verdade para “turno aberto”; TPV, KDS e Dashboard **leem** esse estado; nenhum recalcula nem infere sozinho. Invariante: **pedido ⇒ turno ativo**.

---

## Commit 1 — Fonte única do Turno (entidade global observável)

**Decisões:**

- Onde vive a verdade do turno: **uma entidade global observável** (Core operacional ou contexto partilhado que todas as superfícies consultam). Não no estado local do TPV, não no estado local do Dashboard, não no estado local do KDS.
- Forma: pode ser (a) tabela/entidade no Core (ex.: turno ativo por `restaurant_id` + intervalo), (b) evento auditável de abertura/fecho que o Core expõe, ou (c) estado derivado consultável via API/contexto (ex.: “há turno ativo?”). A escolha (a/b/c) é decisão de implementação; o contrato exige **uma** fonte.
- Abertura de turno: só TPV ou App Staff **escrevem** nessa fonte (ação “Abrir turno”); Dashboard e KDS **nunca** escrevem abertura/fecho.
- Fecho de turno: explícito (ação “Encerrar turno”); enquanto existir pedido no contexto do turno, o sistema não considera o turno fechado até encerramento explícito (integridade da Lei).

**Entregável (conceitual):** Fonte única definida e acessível por restaurante; TPV (ou App Staff) como único(s) ponto(s) de escrita para abertura/fecho.

### Commit 1 — Decisões oficiais (fechadas)

**Data:** 2026-02-02. **Estado:** Conceitualmente fechado. Código intocado até ordem explícita "implementa".

| Decisão                           | Oficial                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Onde vive o Turno**             | Core operacional como entidade global observável. **Não** vive em: Context local, TPV state, Dashboard logic, ORE derivado. ORE consome, não cria.                  |
| **Quem pode escrever**            | **Apenas** TPV (Caixa) e AppStaff (Gerente). Escrita explícita: `abrir_turno` / `fechar_turno`.                                                                     |
| **Quem só observa**               | KDS, Dashboard, Web de configuração, Relatórios, Métricas.                                                                                                          |
| **Forma do facto**                | Turno é facto explícito, não inferido. Tem: `restaurant_id`, `opened_at`, `opened_by` (pessoa/dispositivo), `status` = OPEN \| CLOSED. Persistente enquanto aberto. |
| **Regra estrutural (inviolável)** | Se existe pedido, o turno **tem** de existir. Se não existir → inconsistência crítica.                                                                              |

**Não vamos:** assumir turno aberto pelo TPV; recalcular turno por heurística; criar múltiplos turnos paralelos.
**Vamos:** criar 1 fonte; fazer todo o sistema ler dela.

**Resultado esperado após Commit 1 (mesmo sem Commit 2):** TPV cria pedido → Turno existe; KDS abre → não pode mais dizer "turno fechado"; Dashboard → não entra em contradição. O sistema para de mentir visualmente. Ainda pode não estar perfeito, mas fica coerente.

**Próximo passo automático:** Commit 2 — TPV, KDS e Dashboard param de inferir e só leem a fonte do Turno. Só depois de Commit 1 estar solidificado (implementado).

**Implementação (2026-02-02):** Fonte única já existe no Core (`gm_cash_registers` + `open_cash_register_atomic`). TPV após abrir turno chama `refreshShiftStatus()` para atualizar ShiftContext imediatamente. Dashboard e KDS ao montar chamam `refreshShiftStatus()` para ler estado fresco da fonte (evita banner "turno fechado" em cache).

---

## Commit 2 — Leitura uniforme por TPV, KDS e Dashboard (sem inferência local)

**Decisões:**

- TPV, KDS e Dashboard **só leem** o estado “turno ativo” a partir da fonte única (Core ou contexto partilhado). Nenhum deles mantém “estado de turno” próprio derivado de lógica local (ex.: “se criei pedido, assumo que o turno está aberto”).
- Após navegação ou refresh: cada superfície **consulta** a fonte (ou o contexto que a espelha) e mostra “turno aberto” ou “turno fechado” em função desse resultado. Mensagens como “O turno ainda não está aberto” só aparecem quando a fonte diz que **não** há turno ativo.
- Dashboard: cards operacionais (pedidos hoje, receita, turnos ativos) e histórico por turno dependem da **mesma** leitura de turno. Se a fonte diz “turno ativo”, o Dashboard mostra métricas e não exibe o banner de “turno fechado”.
- KDS: se a fonte diz “turno ativo”, o KDS exibe a fila de pedidos e permite transições (preparar → pronto); não exige “Abrir turno no TPV” quando o turno já está aberto.

**Entregável (conceitual):** Todas as superfícies críticas (TPV, KDS, Dashboard) usam a mesma leitura; zero inferência local de “turno aberto”; banner e bloqueios coerentes com a fonte.

**Implementação (2026-02-02):** TPV após abrir turno chama `shift.refreshShiftStatus()`. Dashboard e KDS ao montar chamam `shift.refreshShiftStatus()`. ORE já consome ShiftContext; com refresh atempado, deixa de mostrar "turno fechado" em contradição.

---

## Commit 3 — Invariante: pedido ⇒ turno ativo

**Decisões:**

- Regra de integridade: **se existe pelo menos um pedido** criado no contexto do restaurante/dia (ou turno), o sistema **não** considera o turno fechado até encerramento explícito. Ou seja: “Se há pedido, o turno existe.”
- Implementação (conceitual): (a) ao criar pedido, o Core (ou a camada que regista pedidos) garante que existe turno ativo para esse restaurante — se não existir, pode criar turno implícito para esse contexto ou rejeitar a criação até haver abertura explícita; (b) ao “encerrar turno”, se ainda houver pedidos em curso, o sistema pode avisar ou bloquear o fecho até resolução. A escolha (criar turno implícito vs rejeitar) é decisão de produto/implementação; o contrato exige que **pedido ⇒ turno ativo** seja verdade em qualquer estado persistido.
- Teste de regressão: após os 3 commits, repetir o cenário do Teste Profundo v2.5 (abrir turno no TPV, criar pedido, navegar para KDS e Dashboard): KDS e Dashboard devem refletir “turno aberto” e mostrar fila/métricas sem banner contraditório.

**Entregável (conceitual):** Invariante documentado e aplicado; nenhum estado em que “há pedido” e “turno fechado” coexistam para o mesmo contexto.

**Implementação (2026-02-02):** Já garantido pelo fluxo: process_order_payment exige cash_register_id com status open no Core; TPV exige turno aberto. Pedido pago implica turno existiu. Nenhuma alteração adicional.

---

## Ordem de execução

1. **Commit 1** — Garantir que a fonte única existe e que só TPV/App Staff escrevem abertura/fecho.
2. **Commit 2** — Trocar TPV, KDS e Dashboard para **só lerem** dessa fonte (remover inferência local).
3. **Commit 3** — Aplicar e verificar a invariante “pedido ⇒ turno ativo” (e opcionalmente teste de regressão sistémica).

---

## O que isto não faz

- Não adiciona funcionalidades novas (só corrige estado e leitura).
- Não refatora módulos inteiros; apenas garante uma fonte e leitores alinhados.
- Não altera quem pode abrir o turno (continua a ser TPV ou App Staff, conforme Contrato).

---

---

## Ritual obrigatório pós-implementação (Teste Humano Supremo v2.5)

Cenário: **Abrir turno no TPV → Criar pedido → Dashboard → KDS.**

Resultado esperado: nenhum banner "turno fechado"; métricas visíveis; pedido na fila do KDS; uma voz.

- **Spec E2E:** `merchant-portal/tests/e2e/teste-humano-supremo-v25.spec.ts`
- **Execução:** Com app (baseURL) e Core (3001) ativos e sessão válida:
  `E2E_NO_WEB_SERVER=1 npm run test:e2e -- tests/e2e/teste-humano-supremo-v25.spec.ts`
  Ou execução manual: TPV → abrir turno → criar pedido → Dashboard → KDS; verificar ausência do banner e coerência.

**Estado (2026-02-02):** Ritual v2.5 **PASSOU**. Fix adicional para KDS: ORE trata `shift.isChecking` como loading (evita banner "turno fechado" enquanto refresh corre); KDS usa `useLayoutEffect` para `refreshShiftStatus()` ao montar. Registo: [VERIFICACAO_SISTEMA_E2E_REGISTO.md](../pilots/VERIFICACAO_SISTEMA_E2E_REGISTO.md). **Próximo passo:** Definition of Ready para Venda ([DOR_VENDA.md](../pilots/DOR_VENDA.md)).

---

_Documento de planeamento. Base para execução quando mandares; sem código neste ficheiro._

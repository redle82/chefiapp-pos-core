# ChefIApp — Doutrina do Produto

**Status:** CONTRATUAL
**Tipo:** Princípios imutáveis e identidade do sistema. Referência máxima acima do código.
**Subordinado a:** [CHEFIAPP_SYSTEM_MAP.html](CHEFIAPP_SYSTEM_MAP.html) — mapa vivo; [DOC_INDEX.md](DOC_INDEX.md).

---

## 1. O que é o ChefIApp

O ChefIApp é um **sistema operacional vivo para restaurantes**.

- Une disciplina (tarefas), operação (TPV), estado do sistema (dashboard) e pessoas (staff).
- Não é apenas POS.
- Não é apenas app de tarefas.
- Não é SaaS tutorial.

É o organismo que transforma caos em ritmo, equipa em máquina humana coordenada, e operação em clareza.

---

## 2. Princípios Imutáveis

Estes princípios não se revertem sem quebrar a identidade do sistema.

| Princípio    | Regra                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Dashboard    | Observa, não executa. Mostra estado; não é o lugar da execução operacional.                                              |
| Configuração | É contínua, não fluxo. Sem wizard; sem onboarding teatral. Setup em qualquer ordem.                                      |
| Operação     | Nunca para por causa de backend. Runtime operacional local com persistência temporária.                                  |
| Core e App   | Core valida. App executa. A operação não para.                                                                           |
| Tarefa       | É pulso, não checklist. Unidade mínima do sistema; coordena preparo, atendimento, limpeza, abertura/fecho, consistência. |

**Frase-chave:** O sistema é único no **contrato**, não no runtime. Contrato único (tipos de ação, regras, permissões); runtimes múltiplos (garçom, cozinha, dono) obedecem às mesmas regras sem depender do mesmo pulso.

---

## 3. O que o ChefIApp nunca será

O ChefIApp **nunca** será:

- **Wizard de onboarding** — não há fluxo obrigatório de “passo 1, 2, 3” para começar.
- **Sistema que depende 100% de internet** — operação continua com runtime local; Core valida quando voltar.
- **App que infantiliza o staff** — trata pessoas como adultos; não ensina em vez de assumir.
- **POS pedagógico** — não “explica” em vez de executar; estado e tarefas impõem-se.
- **Produto genérico de features desconexas** — a alma é a Task System e as camadas (Config / Dashboard / Operação / Core).

Qualquer proposta que viole isto não entra.

---

## 4. Diferença para outros sistemas

| Sistema      | Foco                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| GloriaFood   | Pedidos e entrega.                                                                                         |
| Square       | Pagamentos e terminal.                                                                                     |
| **ChefIApp** | **Disciplina operacional humana.** Tarefas como pulso; ritmo; saúde do restaurante; operação que não para. |

O ChefIApp não compite em “quantas features”. Compete em “o restaurante funciona como organismo”.

---

## 5. A alma: Task System

A tarefa é a **unidade mínima** do sistema.

- Toda operação real gera ou consome tarefas.
- Tarefas alimentam:
  - **Saúde** — estado do sistema, prontidão para vender.
  - **Alertas** — o que falta, o que está em risco.
  - **Percepção operacional** — métricas humanas, não só financeiras.

A Task System não é “mais uma feature”. É o núcleo simbólico e funcional. Sem ela, o ChefIApp deixa de ser o que é.

---

## 6. Contrato com o futuro

Toda **feature nova** deve:

1. Respeitar a **SystemTree** (Operação, Configuração, Equipa, Gestão, Sistema).
2. Respeitar as **camadas** (Config contínua; Dashboard observa; Operação executa; Core valida).
3. Respeitar a **Task System** (tarefa como pulso; não checklist genérico).

**Caso contrário, não entra.**

Refactor e evolução são permitidos — e esperados — desde que não violem os princípios imutáveis nem a alma do sistema.

---

## 7. O que pode evoluir / o que não pode

O congelamento da doutrina é **fundação**, não prisão.

**Pode evoluir (exemplos):**

- Quantidade e detalhe de tarefas por papel.
- UI do AppStaff, fluxos de ecrã, botões.
- Módulos satélites (fidelização, integrações, relatórios, IA).
- Regras de XP, pontos, gamificação (com maturidade; nunca infantil).
- Limites exactos do TPV offline, ritual de fecho de turno, métricas.

**Não pode evoluir em sentido contrário à doutrina:**

- Introduzir onboarding em wizard ou fluxo obrigatório.
- Fazer a operação depender de backend para continuar.
- Tratar o staff como alunos; infantilizar; “ensinar” em vez de assumir.
- Misturar Core e App (Core valida; App executa).
- Reduzir a Task System a checklist genérico sem pulso.

Evolução dentro das leis = permitida. Violação das leis = rejeitada.

---

## 8. Especificações de produto ancoradas na doutrina

Estas specs tratam partes do produto como **produto real** (conceito, arquitetura, decisões críticas), não como “ideia bonita”.

| Especificação                                                                            | O que define                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[architecture/MENU_CATALOG_VISUAL_SPEC.md](architecture/MENU_CATALOG_VISUAL_SPEC.md)** | Menu digital = catálogo visual de decisão (Netflix + Apple Store). Conceito funcional, modelo de dados, layout, UX, tablet, editor, anti-patterns. Frase-guia: _O cliente decide com os olhos antes de decidir com a cabeça._ |

---

## Referências

- [CHEFIAPP_SYSTEM_MAP.html](CHEFIAPP_SYSTEM_MAP.html) — mapa vivo (visão, camadas, papéis, rotas, offline).
- [architecture/TASK_SYSTEM_MATRIX_AND_RITUAL.md](architecture/TASK_SYSTEM_MATRIX_AND_RITUAL.md) — corpo do Task System: matriz por papel, momento do turno, tipos, relação com alertas/saúde, XP.
- [DOC_INDEX.md](DOC_INDEX.md) — índice da documentação contratual.
- [ROTAS_E_CONTRATOS.md](architecture/ROTAS_E_CONTRATOS.md) — rota → contrato.
- [APPSTAFF_RUNTIME_MODEL.md](architecture/APPSTAFF_RUNTIME_MODEL.md) — runtime autónomo; Core opcional em trial/pilot.
- [architecture/MENU_CATALOG_VISUAL_SPEC.md](architecture/MENU_CATALOG_VISUAL_SPEC.md) — menu digital como catálogo visual de decisão (produto real).

**Última atualização:** 2026-02-06

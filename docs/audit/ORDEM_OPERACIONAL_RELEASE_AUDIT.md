# ORDEM OPERACIONAL — RELEASE AUDIT

**Status:** NORMA OPERACIONAL ATIVA
**Escopo:** contínuo, aplicável aos próximos ciclos até fechamento operacional completo
**Modelo de aprovação:** IA gera + revisão humana obrigatória
**Escalada:** NO-GO absoluto, sem mecanismo de override
**Vigência:** até fechamento operacional completo do ciclo vigente
**Emitido em:** 2026-03-08
**Última revisão:** 2026-03-08
**Versionamento interno:** atualizar os campos de ciclo/data a cada revisão operacional
**Princípio-mãe:** **onde começa, deve terminar**

> Nenhuma frente nova pode ser iniciada enquanto a frente anterior não estiver operacionalmente encerrada.
> Encerrada significa: código validado, PR aberta ou mergeada, CI resolvida, issue atualizada, branch limpa e worktree removida.

## 1. VERDADE OPERACIONAL

Esta ordem entra em vigor porque o repositório ainda apresenta acúmulo operacional, mesmo permanecendo controlável.

**Fatos confirmados pelo snapshot de PRs (`docs/audit/runs/pr-status-snapshot-2026-03-08.csv`):**

- PRs abertas: **5** (`#6`, `#11`, `#12`, `#15`, `#29`)
- PRs mergeadas: **5** (`#3`, `#4`, `#5`, `#31`, `#45`)
- PRs fechadas sem merge: **0**
- Drafts abertas no snapshot: **0**
- PRs obrigatórias ainda por abrir: **0**
- PRs ainda por concluir: **5**

**Inferências operacionais baseadas na auditoria já registrada nesta release:**

- existe resíduo operacional relevante;
- há sinais de frentes paralelas demais no eixo `merchant-portal`;
- há indício de trabalho local acumulado e difícil de revisar;
- a disciplina de fechamento foi quebrada por abertura de novas frentes antes do encerramento completo das anteriores.

## 2. QUANTIFICAÇÃO CRÍTICA

| Frente / PR                            | Estado | Ação mandatória               | Observação operacional                                             |
| -------------------------------------- | ------ | ----------------------------- | ------------------------------------------------------------------ |
| `#11` CI cleanup / lint / annotations  | aberta | **mergear**                   | PR de higiene; deve sair primeiro para reduzir ruído               |
| `#12` merchant-portal kernel hardening | aberta | **mergear ou dividir**        | mergear apenas se o escopo estiver estritamente em hardening       |
| `#15` OP_GUARD structured logging      | aberta | **mergear**                   | manter isolada em observability; sem carregar correções colaterais |
| `#29` admin/devices centralization     | aberta | **mergear ou dividir**        | separar UI/UX de pareamento se houver mistura                      |
| `#6` Stack 2026 FASES 1-6              | aberta | **dividir antes de concluir** | frente com maior risco de escopo guarda-chuva                      |

**Mandato quantitativo:**

- o ciclo atual só é considerado limpo quando as **5 PRs abertas** tiverem decisão final;
- o número oficial de PRs obrigatórias faltantes é **0**;
- subdivisões adicionais só são autorizadas como **cirurgia de fechamento**, nunca como abertura de nova frente paralela.

**Evidência principal deste bloco:**

- `docs/audit/runs/pr-status-snapshot-2026-03-08.csv` (contagem operacional de PRs)

## 3. DIAGNÓSTICO

O processo falhou em quatro pontos:

1. **Nova frente foi iniciada antes do fechamento da anterior.**
2. **O domínio `merchant-portal` concentrou frentes simultâneas demais.**
3. **Parte do trabalho operacional ficou entre “feito”, “em progresso” e “não encerrado”.**
4. **O ritual de encerramento não foi tratado como obrigatório.**

Sintoma central: o sistema de trabalho aceitou coexistência prolongada de PR aberta, issue viva, branch ativa, worktree potencialmente residual e mudanças locais relevantes.

## 4. RISCOS

Enquanto esta ordem estiver ativa, os seguintes riscos são considerados materiais:

- merge lento por excesso de contexto por PR;
- revisão imprecisa por escopo misturado;
- falsa sensação de progresso com frentes “quase prontas” que nunca fecham;
- branches e worktrees virando depósito de dívida operacional;
- issue aberta apesar de entrega já estar no código;
- reentrada de caos por abrir nova frente antes do saneamento da anterior.

**Qualquer ocorrência acima mantém o estado em NO-GO operacional.**

**Evidências de suporte deste bloco:**

- `docs/audit/RELEASE_AUDIT_STATUS.md` (auditoria operacional de entrega)
- `docs/audit/AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md` (riscos High e bloqueios)

## 5. REGRAS OBRIGATÓRIAS

1. **Não abrir nova frente sem fechar a anterior.**
2. **Uma frente = uma issue clara = uma branch limpa = uma PR principal.**
3. **Se o escopo crescer, dividir antes de continuar.**
4. **PR com mais de um tema operacional deve ser quebrada.**
5. **Nenhuma issue pode ficar “feito no código” e “aberta no GitHub”.**
6. **Toda PR precisa de evidência mínima de validação.**
7. **Toda branch mergeada deve ser removida.**
8. **Toda worktree deve ter owner, issue e prazo.**
9. **Mudança local sem issue e sem branch clara deve ser isolada ou descartada.**
10. **Umbrella issue não pode esconder subtarefa concluída.**
11. **Nenhuma PR pode atravessar múltiplos domínios sem justificativa explícita.**
12. **Fechamento operacional é parte do trabalho, não pós-trabalho.**
13. **Acúmulo local acima do limite do ciclo dispara limpeza obrigatória.**
14. **PR grande não é mérito; PR concluível é mérito.**
15. **Onde começa, deve terminar.**
16. **Evidência desatualizada mantém NO-GO:** se snapshot/ledger estiverem desatualizados ou inconsistentes, não há progressão de estado para GO.
17. **Sem evidência, sem avanço:** afirmação crítica sem caminho verificável no repositório invalida conclusão operacional.

## 6. SEQUÊNCIA DE AÇÃO

### D0 — hoje

- concluir `#11`;
- revisar `#15` para merge imediato se estiver limpa;
- revisar `#12` para validar escopo;
- congelar mudanças locais fora do fechamento imediato;
- proibir abertura de novas frentes.

### D1 — amanhã

- triagem cirúrgica da `#6`;
- decidir: mergear, dividir em 2, ou dividir em 3;
- revisar `#29` para separar fluxo funcional de ajustes de interface, se necessário;
- fechar issues já resolvidas por PRs mergeadas;
- remover branches e worktrees sem função ativa.

### D2 — consolidação

- padronizar checklist de fechamento operacional;
- formalizar limite de escopo por PR;
- institucionalizar owner + issue + prazo para worktree;
- instaurar revisão semanal de higiene operacional.

## 7. DECISÃO GO / NO-GO

**Decisão atual:** **NO-GO OPERACIONAL**

Motivo:

- ainda existem **5 PRs abertas**;
- há indício consistente de resíduo operacional relevante;
- o princípio de encerramento completo por frente ainda não foi restabelecido.

**Condição única para voltar a GO:**

- todas as PRs abertas terem decisão final;
- nenhuma frente relevante permanecer sem dono, sem issue ou sem fechamento;
- branches mergeadas removidas;
- worktrees residuais removidas;
- issues sincronizadas com o estado real do código;
- disciplina de não abrir nova frente antes do fechamento da anterior estar novamente em vigor.

**Pré-condições formais de GO (checagem mínima):**

- `docs/audit/runs/pr-status-snapshot-2026-03-08.csv` atualizado e consistente com as decisões em curso;
- `docs/audit/AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md` sem bloqueio `High` pendente no escopo ativo;
- trilho de validação operacional executado e anexado ao ciclo (`audit:release:portal` e/ou checklist de staging aplicável).

**Não existe exceção, fast-track, tolerância informal ou override político para esta ordem.**

## MATRIZ DE EVIDÊNCIAS (confirmado vs inferido)

| Bloco                    | Confirmado (fonte)                                                                            | Inferido (leitura operacional)                           |
| ------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1. Verdade Operacional   | `docs/audit/runs/pr-status-snapshot-2026-03-08.csv`                                           | acúmulo operacional e quebra de disciplina de fechamento |
| 2. Quantificação Crítica | `docs/audit/runs/pr-status-snapshot-2026-03-08.csv`                                           | necessidade de divisão cirúrgica em PRs guarda-chuva     |
| 3. Diagnóstico           | `docs/audit/RELEASE_AUDIT_STATUS.md`                                                          | coexistência prolongada de frentes como causa de atraso  |
| 4. Riscos                | `docs/audit/RELEASE_AUDIT_STATUS.md`, `docs/audit/AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md` | risco de regressão/review imprecisa por escopo misto     |
| 5. Regras Obrigatórias   | `AGENTS.md`, `docs/CI_GOVERNANCE.md`                                                          | necessidade de disciplina operacional contínua           |
| 6. Sequência de Ação     | `docs/audit/runs/pr-status-snapshot-2026-03-08.csv`                                           | prioridade de fechamento por impacto operacional         |
| 7. Decisão GO/NO-GO      | `docs/audit/runs/pr-status-snapshot-2026-03-08.csv`, ledger de contradições                   | manutenção de NO-GO até fechamento integral do ciclo     |

---

## RESUMO EXECUTIVO

O repositório não está crítico, mas ainda está acumulado.
O problema principal não é falta de código: é falta de encerramento.
O ciclo atual só termina quando as frentes abertas forem concluídas, sincronizadas e limpas.
Até lá, a regra é simples e obrigatória: **onde começa, deve terminar**.

Resumo executivo curto:
• o snapshot continua íntegro;
• a ordem operacional ficou pronta em linguagem de comando, não de sugestão;
• o estado correto continua sendo NO-GO operacional até fechar as 5 PRs abertas e limpar o resíduo do ciclo.

# FASE B — Teste Humano

**Objetivo:** Validar comportamento humano, não código. Garantir que um utilizador (dono, gerente, staff) consegue completar fluxos reais sem confusão, bloqueios ou ambiguidade.

**Pré-requisito:** FASE A (Teste Global Técnico LOCAL) concluída com PASSOU. Para repetir FASE B com FASE C ativa (Core OFF, validação humana): usar [FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md](FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md).

---

## Âmbito

- **O que se valida:** Clareza de labels, ordem de passos, feedback ao utilizador, conclusão de tarefas (abrir turno, criar pedido, fechar relatório, etc.).
- **O que não se valida aqui:** Performance, segurança profunda, compatibilidade de browsers — isso fica para outros checklists.

---

## Checklist por persona

### Dono (owner)

- [ ] Entrar (auth/demo) e chegar ao Ecrã Zero sem dúvida sobre “o que fazer a seguir”.
- [ ] Abrir turno: fluxo claro e confirmação visível.
- [ ] Aceder a Config (identidade, localização, horários, pessoas, pagamentos) e perceber o que cada secção faz.
- [ ] Ver relatórios (fecho diário, vendas por período) e entender que os valores são de simulação (DataMode visível).
- [ ] Aceder a Billing e perceber estado da subscrição (simulado ou real).
- [ ] Logout e voltar a entrar sem surpresas.

### Operacional (TPV / KDS / Staff)

- [ ] Aceder ao TPV a partir do dashboard ou menu e iniciar um pedido.
- [ ] Ver pedidos no KDS e alterar estado (em preparação, pronto) de forma óbvia.
- [ ] App Staff: ver mesas/tarefas e marcar como atendido quando fizer sentido.
- [ ] Perceber quando está “em simulação” vs “ao vivo” (banner/indicador).

### Gerente (se aplicável)

- [ ] Ver dashboard de equipa ou tarefas e entender prioridades.
- [ ] Aceder a Pessoas e Tarefas sem ambiguidade de permissões.

---

## Critérios de conclusão

- **Pass:** Uma pessoa real (dono ou piloto) percorre os fluxos acima e confirma que consegue completar as tarefas sem “ficar presa” ou sem saber o que fazer.
- **Fail:** Anotar o ponto exacto onde houve dúvida, bloqueio ou comportamento inesperado; corrigir pontualmente.

---

## Resultado esperado

- **PASSOU teste humano** — Sistema utilizável no dia a dia por quem vai operar.
- **Falhou em X** — Descrição curta do fluxo ou ecrã onde falhou a validação humana.

---

---

## Próximos passos (após FASE B)

| Ordem | Ação                                                                                                | Referência                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Executar FASE B com uma pessoa real (dono ou piloto); registar PASSOU ou Falhou em X.               | [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md) (template)                                                                      |
| 2     | Se PASSOU — ativar backend real (opcional): criar projeto Supabase, env, migrations, redirect URLs. | [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md)                                                                                   |
| 3     | Se PASSOU — piloto primeiro cliente pagante: checklist de go-live e ritual de irreversibilidade.    | [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md), [FASE_5_ESTADO_REAL.md](FASE_5_ESTADO_REAL.md) |

Documento criado no âmbito da FASE 5, após conclusão da FASE A (Teste Global Técnico LOCAL).

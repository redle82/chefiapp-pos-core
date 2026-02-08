# FASE 2.5 — Uso real prolongado + freeze (15%)

**Objetivo:** Provar que tudo funciona sob vida real, não laboratório.

**Referências:** [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md), [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md), [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md).

---

## Escopo

- 1 restaurante real (ou ambiente-equivalente), 1–2 TPVs, 1 KDS, ≥ 1 semana (pico + vazio).
- Registo diário obrigatório em [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md).
- **Freeze da Fase 2:** Após sucesso do piloto — tag `operational-phase-2-freeze-v1`, atualizar [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md) § 6.

**Critério de sucesso:** Nenhuma falha soberana repetida; operadores não rejeitam o sistema; nenhuma mentira financeira; logs limpos.

---

## Checklist executável (2.5)

### Pré-piloto

- [ ] **Validação pós-DROP:** Executar [VALIDACAO_POS_DROP_LEGACY_LOCAL.md](../qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md) (teste humano canónico).
- [ ] **Smoke automático:** Executar `scripts/test_post_drop_local.sh` — Docker Core, tabelas gm_%, npm run test, /app/dashboard e /app/install 200. *(Nota: passos 1–4 validados 2026-02-03; passo 5 requer dev server a correr.)*
- [ ] **Teste canónico 2.3:** Concluído com PASSOU (ver [FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md](FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md) § Registo do resultado).
- [ ] **Ponto de contacto técnico:** *(preencher antes do piloto: nome ou canal para logs e feedback — ex.: email, Slack, telefone)*

### Durante o piloto

- [ ] **Checklist de abertura diário:** Antes de abrir portas, executar o teste humano canónico; se falhar, não entrar em operação normal e registar.
- [ ] **Registo diário:** Preencher a tabela em [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md) § 6 (sinais positivos, dores, incidentes).
- [ ] **Momentos de fotografia:** Pelo menos 2 por dia (ex.: meio do serviço, fim do serviço) conforme USO_REAL_PROLONGADO_PILOTO § 2.2.
- [ ] **Sem alterações não-hotfix:** Não introduzir novas features nem refactors durante o piloto; apenas hotfixes para falhas soberanas ou verdade financeira, com registo (data, descrição, commit).

### Critérios de sucesso (verificação ao fim)

- [ ] Sem falhas soberanas repetidas (TPV/KDS indisponíveis em pico, impossibilidade de criar/ver pedidos).
- [ ] Sem regressões detectadas por `scripts/test_post_drop_local.sh`.
- [ ] Operadores não rejeitam o sistema (sem "impossível trabalhar").
- [ ] Observabilidade: sem spam estrutural; sem erros recorrentes "relation does not exist".

### Freeze (após sucesso)

- [ ] **Tag:** `git tag operational-phase-2-freeze-v1` (no commit final estável).
- [ ] **Rollback:** Preencher secção **6. Fase 2 — Operational phase 2 freeze** em [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md): tag, commit hash, data, resumo do incluído.
- [ ] **Registo:** Atualizar [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md) § 2.5 — Resultado com data da conclusão e resultado do piloto.

---

## Ficheiros chave

| Ficheiro | Uso |
|----------|-----|
| [docs/ops/USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md) | Plano do piloto; ritual diário; registo diário; critérios de sucesso e paragem. |
| [docs/ops/ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md) | Rollback; secção 6 = Fase 2 freeze (preencher após tag). |
| [docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md](../qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md) | Teste humano canónico (abertura diária). |
| [scripts/test_post_drop_local.sh](../../scripts/test_post_drop_local.sh) | Smoke automático pré-uso. |

---

## Registo do resultado (preencher após piloto)

- **Data de início do piloto:** —
- **Data de fim do piloto:** —
- **Critérios de sucesso:** PASSOU / FALHOU
- **Tag aplicada:** operational-phase-2-freeze-v1 (sim/não)
- **Notas:** —

Registar também em [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md) na secção **2.5 — Uso real prolongado + freeze**, subsecção **2.5 — Resultado**.

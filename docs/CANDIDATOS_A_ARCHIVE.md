# Candidatos a arquivo — lista de referência

**Gerado em:** 2026-01-28
**Objetivo:** Listar MDs da raiz de `docs/` que são históricos e podem ser movidos para `docs/archive/` com header ARCHIVED.

**⚠️ Esta é apenas uma lista de referência.**

**Status:** Processo iniciado — ver [ARQUIVAMENTO_REALIZADO.md](ARQUIVAMENTO_REALIZADO.md) para status atual.

---

## Candidatos claros (fixes históricos)

Estes documentos descrevem fixes que já foram aplicados e não são mais relevantes para o estado atual:

- `FIX_AUTH_SESSION_MISSING.md`
- `FIX_DOCKER_CORE_SEM_AUTH.md`
- `FIX_ERROS_500_VITE.md`
- `FIX_INVENTORY_CONTEXT_404.md`
- `FIX_JWSError_DOCKER_CORE.md`
- `FIX_ORDERCONTEXT_ERROR_500.md`
- `FIX_POSTGREST_404.md`
- `FIX_POSTGREST_JWT_SECRET.md`
- `FIX_POSTGREST_NGINX_PROXY.md`
- `FIX_POSTGREST_URL_PATH.md`
- `FIX_REALTIME_WEBSOCKET.md`
- `FIX_RESTAURANT_ID_MISSING.md`
- `FIX_SYSTEMNODE_IMPORT.md`
- `FIX_TPV_CONTEXTENGINE.md`
- `FIX_TPV_ORDERPROVIDER.md`

**Ação sugerida:** Mover para `docs/archive/` com header:

```markdown
Status: ARCHIVED
Reason: Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
```

---

## Candidatos (refatorações por fase)

Estes documentos descrevem fases de refatoração já concluídas:

- `REFATORACAO_FASE_1_2_VALIDADA.md`
- `REFATORACAO_FASE_3_4_MAPEAMENTO.md`
- `REFATORACAO_FASE_3_5_MAPEAMENTO.md`
- `REFATORACAO_FASE_3_CONCLUSAO.md`
- `REFATORACAO_FASE_3_PLANO.md`
- `REFATORACAO_FASE_3_STATUS.md`
- `REFATORACAO_PLANO.md`
- `REFATORACAO_PROGRESSO.md`
- `REFATORACAO_RESUMO.md`

**Ação sugerida:** Mover para `docs/archive/` com header:

```markdown
Status: ARCHIVED
Reason: Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md
```

---

## Candidatos (snapshots e checklists históricos)

- `SNAPSHOT_PRE_REFACTOR.md` — snapshot antes do refactor PURE DOCKER
- `CHECKLIST_DEBUG_ONBOARDING.md` — checklist de debug específico de fase
- `CHECKLIST_FINAL_IMPLEMENTACAO.md` — checklist de implementação concluída
- `CHECKLIST_PROXIMOS_PASSOS.md` — checklist de próximos passos (já executados)
- `CHECKLIST_VENDA_V1.md` — checklist de venda (pode ser mantido se ainda relevante)

**Ação sugerida:** Avaliar caso a caso. Snapshots → arquivo. Checklists → arquivo se já executados.

---

## Candidatos (resumos e implementações históricas)

- `IMPLEMENTACAO_FINAL_COMPLETA.md`
- `RESUMO_CONFIG_TREE.md`
- `RESUMO_EXECUTIVO_FINAL.md`
- `RESUMO_FINAL_IMPLEMENTACAO.md`
- `RESUMO_IMPLEMENTACAO_FINAL.md`
- `RESUMO_IMPLEMENTACAO_FASE_1_2.md`
- `RESUMO_FASES_1_2_3_4.md`

**Ação sugerida:** Se consolidados no README ou STATE_PURE_DOCKER_APP_LAYER.md → arquivo.

---

## Candidatos (roadmaps e testes históricos)

- `ROADMAP_COMPLETO_FINALIZADO.md`
- `ROADMAP_FINAL_COMPLETO.md`
- `ROADMAP_V1_V2.md`
- `TESTE_MASSIVO_NIVEL_2.md`
- `TESTE_MASSIVO_NIVEL_3.md`
- `TESTE_MASSIVO_NIVEL_4.md`
- `TESTE_MASSIVO_NIVEL_5.md`

**Ação sugerida:** Roadmaps concluídos → arquivo. Testes massivos → manter se ainda relevantes para referência de estratégia de teste.

---

## Como proceder (opcional)

1. **Revisar cada candidato** para confirmar que não é mais relevante.
2. **Mover para `docs/archive/`** (não apagar).
3. **Adicionar header ARCHIVED** no topo de cada arquivo movido.
4. **Atualizar DOC_INDEX.md** se necessário.

**Nota:** Esta lista é apenas uma sugestão. Nenhuma ação é obrigatória — o sistema já está organizado e funcional.

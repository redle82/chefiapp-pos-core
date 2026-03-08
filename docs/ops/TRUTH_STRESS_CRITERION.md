# Critério truth-stress ≥85% (Bloco 2)

**Ref:** Plano Consolidação + 70% stress; [RELEASE_AUDIT_STATUS.md](../audit/RELEASE_AUDIT_STATUS.md).

## Objetivo

Estabilizar a suite Playwright "truth" de forma que atinja **≥85% de testes a passar numa execução** (ou critério equivalente: ex. 8 em 10 execuções completas verdes, ou suite verde em CI com retries=0).

## Definição do critério

- **Métrica:** Percentagem de testes que passam numa única execução de `./scripts/truth-stress.sh` (workers=4, repeat-each=10, retries=0).
- **Meta:** ≥85% (ex.: se houver 100 testes × 10 repeats = 1000 runs, pelo menos 850 passam).
- **Alternativa N/M:** Pelo menos 8 em 10 execuções completas do script com exit code 0 (suite verde).

## Como executar

```bash
./scripts/truth-stress.sh
# Ou com mais workers/repeat:
WORKERS=6 REPEAT=15 ./scripts/truth-stress.sh
```

Requer build + preview do merchant-portal (o script não inicia o preview; iniciar antes se necessário).

## Estado actual

- **Última execução conhecida:** Suite falha com timeouts em `page.textContent('h1')` nas rotas Entry/Payments/Publish e em locks truth/banner/gating/health (ver [OPENING_FINAL_CHECKLIST_2026_03_25.md](OPENING_FINAL_CHECKLIST_2026_03_25.md), [FISCAL_ENGINE_PROOF_2026_03_25.md](../compliance/FISCAL_ENGINE_PROOF_2026_03_25.md)).
- **Estabilização pendente:** Controlar timers, mockar rede/APIs onde necessário, isolar testes flaky, ambiente determinístico. Quando ≥85% for atingido de forma reproduzível, registar em RELEASE_AUDIT_STATUS.

## Registo de cumprimento

Quando o critério for cumprido, preencher:

- **Data:** —
- **Resultado:** (ex. "92% passaram" ou "8/10 execuções verdes")
- **Notas:** —

# Próximos passos — ChefIApp

**Propósito:** Resposta única a "o que fazer a seguir?". Estado do núcleo: [CORE_STATE.md](../architecture/CORE_STATE.md). Escopo: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md).

---

## Ordem recomendada

| Ordem | O quê | Checklist / acção |
|-------|-------|--------------------|
| 1 | **Validar FASE 1–3** em ambiente real (ou staging) | [VALIDATION_CHECKLIST_FASE_1_3.md](./VALIDATION_CHECKLIST_FASE_1_3.md) — Billing, Onboarding até primeira venda, TPV + caixa. |
| 2 | **Polimento FASE 5** (VPC/OUC) | [VALIDATION_CHECKLIST_FASE_5_POLISH.md](./VALIDATION_CHECKLIST_FASE_5_POLISH.md) — Pontos de contacto (Shell, Billing, TPV, KDS, AppStaff, Config). |
| 3 | **FASE 6 — Impressão** quando houver cliente ou impressora | [IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md](./IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md) — Fila no Core, API, driver, UI pede e mostra estado. |

---

## Já feito (referência)

- CORE_FAILURE_MODEL em código (FailureClassifier, executeSafe, OrderContextReal open/close, TPV mensagens).
- FASE 4: GamificationPanel acessível em `/garcom` (tab «Pontos»).
- Checklists FASE 1–3, FASE 5, FASE 6 criados e referenciados em SCOPE_FREEZE.
- **Build:** `merchant-portal` compila com sucesso (`npm run build`); pronto para executar o checklist FASE 1–3 em ambiente real/staging.

---

## Regra

**Não adicionar features fora do escopo.** Se algo não está nas FASES 1–6, consultar SCOPE_FREEZE antes de implementar.

# Próximos passos — ChefIApp

**Propósito:** Resposta única a "o que fazer a seguir?". Estado do núcleo: [CORE_STATE.md](../architecture/CORE_STATE.md). Escopo: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md).

---

## Ordem recomendada

| Ordem | O quê | Checklist / acção |
|-------|-------|--------------------|
| 1 | **Validar FASE 1–3** em ambiente real (ou staging) | [VALIDATION_CHECKLIST_FASE_1_3.md](./VALIDATION_CHECKLIST_FASE_1_3.md) — Billing, Onboarding até primeira venda, TPV + caixa. |
| 2 | **Polimento FASE 5** (VPC/OUC) | [VALIDATION_CHECKLIST_FASE_5_POLISH.md](./VALIDATION_CHECKLIST_FASE_5_POLISH.md) — Pontos de contacto (Shell, Billing, TPV, KDS, AppStaff, Config). |
| 3 | **FASE 6 — Impressão** (base feita; driver térmico/fiscal quando houver impressora) | [IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md](./IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md) — Fila + API + UI implementados; Core novo aplica schema no init (05.6-print-queue). |

---

## Já feito (referência)

- CORE_FAILURE_MODEL em código (FailureClassifier, executeSafe, OrderContextReal open/close, TPV mensagens).
- FASE 4: GamificationPanel acessível em `/garcom` (tab «Pontos»).
- Checklists FASE 1–3, FASE 5, FASE 6 criados e referenciados em SCOPE_FREEZE.
- **Build:** `merchant-portal` compila com sucesso (`npm run build`); pronto para executar o checklist FASE 1–3 em ambiente real/staging.
- **FASE 5 — Auditoria de código:** Concluída no [VALIDATION_CHECKLIST_FASE_5_POLISH.md](./VALIDATION_CHECKLIST_FASE_5_POLISH.md) (secção «Auditoria de código»): layout/100vh conforme OUC; rotas standalone vs conteúdo do Shell documentado. Resta executar o checklist manual (5.1–5.9) na aplicação quando pronto.
- **FASE 6 — Impressão (base):** Fila no Core (`gm_print_jobs` + RPCs `request_print`, `get_print_job_status`), cliente [CorePrintApi.ts](../merchant-portal/src/core/print/CorePrintApi.ts), TPV botão «Imprimir comanda» e `handlePrintComanda`; schema aplicado no init do Core (docker-compose `05.6-print-queue.sql`). Driver browser (FiscalPrinter) activo; driver térmico/fiscal quando houver impressora.

**Validar fluxo (opcional):** Com o Core no ar (`make world-up` ou `docker compose -f docker-core/docker-compose.core.yml up -d`), executar `bash scripts/flows/run-critical-flow.sh` para validar a cadeia API (health, pedido, pagamento, estado).

---

## Regra

**Não adicionar features fora do escopo.** Se algo não está nas FASES 1–6, consultar SCOPE_FREEZE antes de implementar.

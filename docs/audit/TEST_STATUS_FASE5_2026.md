# Estado dos testes — Fase 5 (pós-refinamento 25 Mar)

**Data:** 2026-02-22 (atualizado)  
**Ref:** Plano refinamento até 25/03, Fase 5.

---

## Resumo

| Suite | Estado | Notas |
|-------|--------|--------|
| **Raiz (Jest)** | 61 passed, 1 skipped | `pnpm test` — verde. |
| **merchant-portal (Vitest)** | 439 passed, 4 skipped | 82 ficheiros; 0 falhas. |

---

## Correções feitas (Fase 5)

- **PaymentModal.test.tsx:** Uso de `data-testid="payment-method-{id}"`; mock de `paymentRegion` para mbway. 17/17 passam.
- **Outros:** Falhas anteriores (DataPrivacyPage, TablePanel, i18n/mocks) resolvidas ou cobertas; suite merchant-portal está verde.

---

## Critério de conclusão Fase 5 (plano)

- [x] PaymentModal e testes críticos de TPV/billing corrigidos.
- [x] 0 falhas no merchant-portal (439 passed, 4 skipped).
- [ ] E2E crítico verde (activar/migrar specs de _legacy conforme necessário).
- [ ] Teste offline real, impressão, fecho de caixa, pagamento SumUp — manuais / checklist.

Executar: `pnpm test` (raiz) e `pnpm --filter merchant-portal test` para estado actual.

---

## Estado actual — gate release portal

| Verificação | Estado |
|-------------|--------|
| `npm run audit:release:portal` | ✅ Passou (web-e2e, typecheck, merchant-portal tests, server coverage 84%, leis). |
| Server coverage (server/**) | 337/399 branches (84.5%); target 84%. |
| Validação Billing/PIX/SumUp | `./scripts/run-billing-scenarios-1-4.sh --validate` — checks automáticos OK. |

---

## Próxima fase (implementação completa)

1. **Validação automática (antes de cenários manuais)**  
   ```bash
   ./scripts/run-billing-scenarios-1-4.sh --validate
   ```
   Garante gateway em 4320 e endpoints billing/PIX/SumUp acessíveis.

2. **Cenários 1–4 manuais (Billing Stress Test)**  
   - Runbook: [BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md](../ops/BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md)  
   - Lista rápida: `./scripts/run-billing-scenarios-1-4.sh` (imprime passos).  
   - Preencher Pass/Fail na tabela de [BILLING_STRESS_TEST_CHECKLIST.md](../ops/BILLING_STRESS_TEST_CHECKLIST.md).

3. **Cutover produção (Render → Supabase Edge)**  
   - Seguir [PRODUCTION_CUTOVER_RUNBOOK.md](../ops/PRODUCTION_CUTOVER_RUNBOOK.md): Vercel vars, webhooks Stripe/SumUp, validação pós-cutover.  
   - Referência rápida: [ROLLOUT_QUICK_REFERENCE.md](../ops/ROLLOUT_QUICK_REFERENCE.md).

4. **Opcional — hardening (cenários 6–8)**  
   - Evento duplicado, alternância rápida, webhook fora de ordem; documentar em BILLING_STRESS_TEST_CHECKLIST.md.

# Registo de consolidação — Bloco 1 (antes de 70%)

Registo da execução do Bloco 1 do plano "Consolidação operacional + próximo marco (70% + stress 85%)". Preencher quando cada passo for executado.

**Ref:** [PRODUCTION_CUTOVER_RUNBOOK.md](./PRODUCTION_CUTOVER_RUNBOOK.md), [BILLING_STRESS_TEST_CHECKLIST.md](./BILLING_STRESS_TEST_CHECKLIST.md), [RELEASE_AUDIT_STATUS.md](../audit/RELEASE_AUDIT_STATUS.md).

---

## 1.1 Cutover real (Render → Edge)

- **Runbook:** [PRODUCTION_CUTOVER_RUNBOOK.md](./PRODUCTION_CUTOVER_RUNBOOK.md)
- **Status:** Pendente
- **Data execução:** —
- **Responsável:** —
- **Resultado:** —
- **Notas:** (Vercel VITE_API_BASE, webhooks Stripe/SumUp para Edge, Render desligado; validar login + checkout billing em produção.)

---

## 1.2 Billing real (Stripe)

- **Checklist:** [BILLING_STRESS_TEST_CHECKLIST.md](./BILLING_STRESS_TEST_CHECKLIST.md) — cenários 1–5 (obrigatório) e 6–8 (hardening).
- **Status:** Pendente
- **Data preenchimento checklist:** —
- **Resultado:** — (Pass/Fail por cenário na tabela do checklist)
- **Consistência DB verificada:** —

---

## 1.3 Stress operacional manual (offline → sync → impressão)

Checklist mínima: abrir turno → ~30 pedidos → cancelar/modificar alguns → pagar misto → desligar Wi‑Fi → 5 pedidos + fila impressão → ligar Wi‑Fi → sync + impressão → fechar turno. Validar consistência (pedidos não perdidos, impressão em ordem).

- **Status:** Pendente
- **Data execução:** —
- **Resultado:** Pass / Fail
- **Notas:** —

---

## 1.4 Janela de estabilidade

- **Critério definido:** 2 semanas de uso interno sem incidente crítico **ou** N dias consecutivos com `npm run audit:release:portal` verde (N ≥ 5). Alternativa: critério acordado pela equipa e registado abaixo.
- **Status:** Pendente
- **Data em que foi cumprido:** —
- **Notas:** —

---

## Conclusão Bloco 1

- [ ] 1.1 Cutover executado e documentado
- [ ] 1.2 Billing real validado (checklist preenchido)
- [ ] 1.3 Stress manual executado e documentado
- [ ] 1.4 Critério de estabilidade cumprido e registado em RELEASE_AUDIT_STATUS

Quando todos estiverem assinalados, o Bloco 1 está concluído e pode avançar para o Bloco 2 (70% branches + truth-stress 85%).

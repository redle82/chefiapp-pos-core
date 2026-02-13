# FASE 2 — Pós-Vendável Portugal

**Pré-requisito:** FASE 1 Vendável Portugal concluída (recibo PT QR AT, SAF-T export, trial/paywall/countdown, offline menu, help center) e em produção.

**Objetivo:** Consolidar vendas em PT (certificação, polimento, testes) e preparar expansão ou próximo mercado.

---

## 1. Certificação AT (Portugal)

- **Estado:** Processo em paralelo (2–3 meses com a AT).
- **Técnico:** Recibo com QR AT e SAF-T já implementados; ajustes finos conforme feedback da AT.
- **Ação:** Iniciar processo de certificação; manter documentação do formato usado (referência AT) em `fiscal-modules/pt/` e Help.

---

## 2. Migration `trial_ends_at` em produção

- **Estado:** Migration criada em `migrations/20260213_01_trial_ends_at.sql` e em `docker-core/schema/migrations/20260213_trial_ends_at.sql`. Integrada no init do Core Docker (05.7) e com target `make migrate-trial-ends-at` para volumes existentes.
- **Core Docker (local ou volume existente):** `cd docker-core && make migrate-trial-ends-at` (Core deve estar up).
- **Core novo (fresh up):** A migration corre automaticamente no init (05.7-trial-ends-at.sql).
- **Produção (Supabase/InsForge):** Ver runbook [RUNBOOK_TRIAL_ENDS_AT_PRODUCTION.md](RUNBOOK_TRIAL_ENDS_AT_PRODUCTION.md) — verificar se coluna existe e executar o SQL.

---

## 3. FASE 5 — Polimento (roadmap executável)

- Testes de performance em dispositivos móveis (TPV web).
- Revisão de feedback visual em ações críticas (toasts/haptic).
- Verificar lazy loading e code splitting no TPV.

**Referência:** `docs/audit/EXECUTABLE_ROADMAP.md` § FASE 5.

**Checklist executável (testes manuais):**
- [ ] Abrir merchant-portal em dispositivo móvel (ou DevTools mobile); navegar até TPV; verificar tempo de carregamento e scroll fluido.
- [ ] Executar ação crítica (ex.: adicionar item ao pedido, processar pagamento); verificar toast/feedback visual.
- [ ] Confirmar que RoleSelector (se visível) não parece dev tool.

---

## 4. FASE 6 — Impressão (roadmap executável)

- Testes de browser print em diferentes navegadores e dispositivos.
- Testes com impressoras térmicas reais (opcional).
- Garantir que o recibo fiscal PT (QR AT) imprime corretamente.

**Referência:** `docs/audit/EXECUTABLE_ROADMAP.md` § FASE 6.

**Checklist executável (testes manuais):**
- [ ] Processar um pedido no TPV; imprimir recibo (browser print); verificar que o recibo mostra Nº documento, ATCUD, NIF e QR code AT.
- [ ] Testar impressão em Chrome e Safari (ou Firefox).
- [ ] Se houver impressoras físicas configuradas, testar impressão térmica.

---

## 5. E2E / testes automatizados

- Teste do fluxo trial expirado → paywall → "Escolher plano" → redirecionamento para billing.
- Opcional: Playwright/Vitest E2E para login → onboarding → trial → paywall → checkout.

---

## 6. Próximo mercado (opcional)

- ES ou BR: replicar blocos fiscais (SAF-T ES, NFe BR) conforme roadmap fiscal em `docs/audit/FISCAL_ROADMAP_GLOBAL.md`.
- Manter template por país no recibo (PT já suportado).

---

## Ordem sugerida

1. Aplicar migration `trial_ends_at` no Core de produção (se ainda não aplicada).
2. E2E ou teste automatizado do paywall (trial expirado → Escolher plano).
3. Checklist FASE 5 (performance móvel) e FASE 6 (impressão) — testes manuais ou scripts.
4. Iniciar processo de certificação AT em paralelo.
5. Quando estável: considerar próximo mercado (ES/BR) ou FASE 7 (mapa visual).

---

## Executado (continuação do plano)

- **Runbook produção:** [RUNBOOK_TRIAL_ENDS_AT_PRODUCTION.md](RUNBOOK_TRIAL_ENDS_AT_PRODUCTION.md) — verificar coluna, SQL para aplicar, UPDATE opcional para trial existentes.
- **Teste PaymentGuard paywall:** `merchant-portal/src/core/billing/PaymentGuard.paywall.test.tsx` — quando `trial_expired`, mostra "Período de trial terminado" e link "Escolher plano"; 1 teste, passa com `pnpm vitest run src/core/billing/`.
- **Script validação FASE 2:** `bash scripts/flows/validate-fase2.sh` — executa testes billing (4 testes) + fluxo crítico Core; usar como gate antes de release.

---

## Referências

- Plano FASE 1: `.cursor/plans/fase_1_vendável_portugal_d73b48ac.plan.md`
- Roadmap executável: `docs/audit/EXECUTABLE_ROADMAP.md`
- Fiscal global: `docs/audit/FISCAL_ROADMAP_GLOBAL.md`
- NEXT_STEPS: `docs/audit/NEXT_STEPS_ACTION_PLAN.md`

# Checklist Onda 4 — Piloto e Produção

**Data:** 2026-02-01  
**Referências:** [ONDA_4_TAREFAS_30_45_DIAS.md](./ONDA_4_TAREFAS_30_45_DIAS.md) · [NEXT_STEPS.md](../NEXT_STEPS.md)  
**Objetivo:** Roteiro executável (blocos 0–5, 24 itens) com checkboxes e comandos exatos para piloto e produção.  
**Roteiro oficial (ordem e gates):** [PLANO_PASSO_A_PASSO_CHEFIAPP.md](./PLANO_PASSO_A_PASSO_CHEFIAPP.md). Este doc mantém os checkboxes e comandos; o roteiro define a sequência e os critérios de avanço.

---

## Bloco 0 — Pré-flight (≈1 h)

Gate antes de contactar qualquer cliente. Validações, build, happy path manual e snapshot.

- [x] **1. Validações docs/lineage** — Executar os três scripts e confirmar que passam.
  ```bash
  ./scripts/lineage-check.sh
  ./scripts/audit-md-references.sh
  ./scripts/audit-contracts-referenced.sh
  ```
- [x] **2. Build merchant-portal** — Build sem erros.
  ```bash
  cd merchant-portal && npm run build
  ```
- [x] **3. TPV manual (happy path)** — Percorrer fluxo completo: Signup → Bootstrap (criar restaurante) → First Product (criar 1 produto) → TPV → criar pedido → pagar → ver dashboard. Confirmar que pedido e pagamento ficam persistidos e que as métricas do dia aparecem.
- [x] **4. Snapshot** — Atualizar [NEXT_STEPS.md](../NEXT_STEPS.md) com a data atual e a frase "Pronto para piloto".

---

## Onda 4.5 — Máquina de venda

Funil fechado: Landing → Auth → Onboarding → TPV; Billing dentro do app.

- [x] **CTA único** — Hero e Footer com CTA principal "Começar agora" → `/auth`; "Explorar demonstração" → `/op/tpv?mode=demo`; OSCopy e TPVDemoPage alinhados.
- [x] **Billing no fluxo** — BillingBanner (trial/past_due) com "Escolher plano" → `/app/billing`; PaymentGuard lógica; BillingSuccessPage com link Dashboard e TPV.
- [x] **Design system unificado** — Landing com OSFrame `context="landing"`; Hero/Footer com tokens do produto.
- [ ] **Primeiro cliente pagante** — Executar [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md): 1 restaurante piloto, 1 turno real, "Ativar agora", €79, feedback. Pré-requisito: migração `billing_status` em gm_restaurants aplicada.

---

## Bloco 1 — Piloto P1

Tarefas produto/ops: definição de alvos, abordagem e agendamento. **Preencher em:** [docs/pilots/ONDA_4_PILOTO_P1.md](./pilots/ONDA_4_PILOTO_P1.md).

- [x] **5. ICP** — Definir Ideal Customer Profile (quem é o restaurante-alvo do piloto). Ref.: [TARGET_RESTAURANT_PROFILE.md](./TARGET_RESTAURANT_PROFILE.md). **Feito:** §5 fechado (1 frase + 3 obrigatórios + 2 exclusão).
- [x] **6. Lista 10 alvos** — Listar 10 restaurantes/contactos candidatos ao piloto (tabela em ONDA_4_PILOTO_P1.md). **Feito:** §6 preenchida.
- [x] **7. Script abordagem** — Redigir script (email/telefone) para abordagem aos alvos. **Feito:** §7 pronto (email + telefone + versão Ibiza/local).
- [x] **8. Checklist onboarding** — Checklist mínimo para instalação/onboarding de um novo restaurante no piloto. Ref.: [PILOT_SETUP.md](./pilots/PILOT_SETUP.md). **Feito:** §8 ok; plano semanal §10 (Dia 1–14) pronto.
- [ ] **9. Agendar 5 instalações** — Agendar (ou confirmar datas) para 5 instalações piloto (tabela em ONDA_4_PILOTO_P1.md). **Pendente:** tabela §9 pronta; enviar proposta a 2 restaurantes, atualizar Estado → confirmada, repetir até 5 confirmadas → P1 ativo.

---

## Bloco 2 — Piloto P2

Métricas e decisão pós-piloto. **Preencher em:** [docs/pilots/ONDA_4_PILOTO_P2.md](./pilots/ONDA_4_PILOTO_P2.md).

- [ ] **10. Métricas de piloto** — Definir métricas a recolher (tempo por pedido, erros, satisfação).
- [ ] **11. Template report** — Criar template de mini-relatório de piloto (2 semanas).
- [ ] **12. Checklist 2 semanas** — Checklist de verificação ao fim de 2 semanas de piloto.
- [ ] **13. Regra de decisão** — Definir regra de decisão: go/no-go para Onda 5 com base nos dados do piloto.

---

## Bloco 3 — Production Readiness

Testes, gates, release, migrações e observabilidade.

- [x] **14. Testes** — Corrigir ou aceitar estado atual de `npm test`; documentar o que está verde/vermelho.
  ```bash
  npm test
  ```
  **Estado documentado (2026-02):** 32 suítes passam, 67 falham; 458 testes passam, 26 falham, 4 skip. Falhas = módulos removidos (event-log, projections, legal-boundary) e tipos em testes fiscais; aceite como dívida técnica até refatorar/remover testes órfãos.
- [x] **15. Gate CI** — Garantir que o gate de CI (ex.: GitHub Actions) está configurado e bloqueia merge em falha.
  - [.github/workflows/ci.yml](../.github/workflows/ci.yml): checkout, Node 20, `npm ci`, Prettier, lint (merchant-portal), typecheck, build, `npm test` (ignore e2e/playwright/massive/offline), `scripts/sovereignty-gate.sh`. Branches: main, develop.
- [x] **16. Check release** — Checklist mínimo antes de cada release (versão, changelog, artefactos).
  - Ref.: [docs/testing/RELEASE_CHECKLIST.md](./testing/RELEASE_CHECKLIST.md) (pré-release, build, deploy, pós-release, smoke).
- [x] **17. Migrações** — Confirmar que migrações de BD estão documentadas e aplicáveis (ex.: Supabase migrations); runbook se necessário.
  - Migrações ativas em `supabase/migrations/`; lineage em [DATA_LINEAGE.md](./architecture/DATA_LINEAGE.md) §3; runbooks em [docs/ops/RUNBOOKS.md](./ops/RUNBOOKS.md).
- [x] **18. Log / observabilidade** — Confirmar que logs e métricas (ex.: dashboard operacional, SLO_SLI) estão suficientes para operar em produção.
  - Onda 3 G4: dashboard operacional (OperationalMetricsCards), SLO_SLI §2.1, alertas §G3; audit events (auth, caixa); purge runbook. Ref.: [ONDA_3_TAREFAS_90_DIAS.md](./ONDA_3_TAREFAS_90_DIAS.md).

---

## Bloco 4 — Valor percebido

Mensagem e preço para o piloto. **Preencher em:** [docs/pilots/ONDA_4_VALOR_E_ONDA_5.md](./pilots/ONDA_4_VALOR_E_ONDA_5.md) (§ Bloco 4).

- [ ] **19. Welcome + 3 passos** — Mensagem de boas-vindas e “3 passos” para o restaurante (onboarding percebido).
- [ ] **20. Landing / pitch** — Atualizar landing ou pitch (uma página) com proposta de valor e CTA para piloto. Ref.: [PITCH_5_MIN_DONO.md](./PITCH_5_MIN_DONO.md), [LANDING_PAGE_MINIMA.md](./LANDING_PAGE_MINIMA.md).
- [ ] **21. Preço piloto** — Definir preço (ou grátis) para a fase piloto e como comunicar.

---

## Bloco 5 — Onda 5

Preparação da próxima onda. **Preencher em:** [docs/pilots/ONDA_4_VALOR_E_ONDA_5.md](./pilots/ONDA_4_VALOR_E_ONDA_5.md) (§ Bloco 5).

- [x] **22. Definir Onda 5** — Escopo e critérios em [ONDA_4_VALOR_E_ONDA_5.md](./pilots/ONDA_4_VALOR_E_ONDA_5.md) §22.
- [x] **23. Congelar escopo** — Escopo congelado em [ONDA_5_ESCOPO_CONGELADO.md](./pilots/ONDA_5_ESCOPO_CONGELADO.md). Comunicar equipa (preencher data no doc).
- [x] **24. Executar** — Primeiras tarefas em [ONDA_5_TAREFAS.md](./pilots/ONDA_5_TAREFAS.md). O5.1 (hub + atalhos), O5.5 (métricas do dia), O5.8 (alertas no hub) implementados. Kick-off: marcar e comunicar.

---

## Ordem sugerida

1. **Bloco 0 (Pré-flight)** — Fazer primeiro; é o gate “antes de chamar qualquer cliente”.
2. **Bloco 3 (Production Readiness)** — Deixar testes/CI/migrations estáveis antes de instalar em clientes.
3. **Bloco 1 (Piloto P1)** — Captura de restaurantes e execução do piloto com o checklist já criado.
4. Blocos 2, 4 e 5 conforme prioridade (métricas, valor percebido, Onda 5).

---

*Checklist Cursor-ready. Usar comandos exatos acima onde aplicável; restante é tarefa produto/ops.*

# Checklist de Validação — FASE 1 a 3

**Propósito:** Executar em ambiente real (ou staging) para confirmar que Billing, Onboarding e Now Engine estão prontos para uso. Referência: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md), [CORE_STATE.md](../architecture/CORE_STATE.md).

---

## FASE 1 — Billing

| # | Ação | Critério de sucesso |
|---|------|----------------------|
| 1.1 | Aceder a `/app/billing` (com sessão; sem subscrição activa) | Página carrega; PaymentGuard permite acesso (Safe Harbor). |
| 1.2 | Confirmar variáveis de ambiente | `VITE_STRIPE_*` (ou equivalente) configuradas; BillingPage usa Stripe Checkout/Portal conforme BILLING_FLOW. |
| 1.3 | Clicar em "Gerir subscrição" / Checkout (se aplicável) | Redirecionamento para Stripe; sem erro de configuração. |
| 1.4 | (Opcional) Completar um pagamento de teste | Subscrição activa reflectida no sistema (ex.: PaymentGuard deixa aceder a rotas protegidas). |

**Documento:** [BILLING_FLOW](../architecture/BILLING_FLOW.md). Enforcement: [CONTRACT_ENFORCEMENT.md](../architecture/CONTRACT_ENFORCEMENT.md) secção 4.

---

## FASE 2 — Onboarding até primeira venda

| # | Ação | Critério de sucesso |
|---|------|----------------------|
| 2.1 | Iniciar fluxo: `/start/cinematic/1` ou `/onboarding` | Consegue avançar até Scene6Summary (cinematic) ou equivalente (onboarding). |
| 2.2 | Criar menu (gm_products) | Pelo menos um produto com `restaurant_id` e `available=true`; `hasMenu` = true (useOnboardingStatus). |
| 2.3 | Abrir TPV e criar um pedido | Pedido criado; itens adicionados. |
| 2.4 | Fechar conta e marcar como pago | Pedido com `payment_status='paid'` em gm_orders; `hasFirstSale` = true. |
| 2.5 | Verificar OnboardingReminder / useOnboardingStatus | Estado "onboarding completo" quando hasMenu e hasFirstSale; sem bloqueios indevidos. |

**Referência:** SCOPE_FREEZE secção "FASE 2 — Fluxo até primeira venda".

---

## FASE 3 — Now Engine (TPV + caixa)

| # | Ação | Critério de sucesso |
|---|------|----------------------|
| 3.1 | Abrir caixa no TPV | Modal de abertura; valor inicial; caixa abre (sem erro crítico); estado "caixa aberto" visível. |
| 3.2 | Criar pedido, adicionar itens, fechar conta | Pedido criado; total correcto; opção de pagamento disponível. |
| 3.3 | Registrar pagamento | Pedido fica pago; total do dia actualizado (se aplicável). |
| 3.4 | Fechar caixa | Modal de fechamento; valor de fecho; caixa fecha; estado "caixa fechado". |
| 3.5 | (Opcional) Erro de rede na abertura/fecho | Mensagem conforme CORE_FAILURE_MODEL: "Problema de rede. Tente novamente em instantes." (degradation) ou mensagem do erro (critical). |

**Contratos:** CORE_TPV_BEHAVIOUR_CONTRACT, CORE_KDS_CONTRACT. Referência: SCOPE_FREEZE secção "FASE 3 — Now Engine".

---

## Como usar

1. Executar FASE 1, 2 e 3 por ordem.
2. Assinalar cada item: ✅ passou | ❌ falhou (anotar motivo).
3. Se algo falhar, corrigir e repetir o item; documentar em CORE_DECISION_LOG ou num relatório de validação se necessário.

**Próximo após 1–3:** FASE 5 (polimento VPC/OUC) e FASE 6 (impressão quando houver cliente/impressora).

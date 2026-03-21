# ChefIApp — Estrutura de Decisão Estratégica

**Data:** 2026-02-25  
**Contexto:** Validação de maturidade vs Toast/Square/Lightspeed. Definição do caminho a seguir.

---

## 1. Onde estamos hoje

| Pilar | Maturidade | Comentário |
|-------|------------|------------|
| A. Core transacional | 78% | RPC atómico, idempotência, RBAC, state machine, trigger total |
| B. Gateway | 80% | Rate limit, actor enforcement, tenant isolation |
| C. Front operacional | 65% | UX funcional; falta offline robusto |
| D. Infraestrutura | 45% | Sentry, backup, rollout plan; falta canary |
| E. Compliance fiscal | 28% | Z-report, fiscal PT; falta certificação AT |
| F. Hardware & Pagamento | 25% | Stripe/SumUp/Pix; falta thermal real |
| G. Escalabilidade | 50% | Multi-tenant base |
| H. Comercial | 18% | Billing; falta integração onboarding |

**Maturidade consolidada (vs Toast = 100%):** Técnica 60–62%, Comercial 35–38%, Operacional 35–38%.

---

## 2. Quatro caminhos possíveis

### Opção 1 — POS tecnicamente superior para poucos restaurantes premium

**O que fazer:**
- Completar pagamento real (Stripe/SumUp em produção) + impressão real (thermal)
- Unificar fechamento de caixa
- Observabilidade mínima
- Onboarding manual ou semi-automático

**Não priorizar:** escala 200+ mesas, hardware próprio, suporte 24/7

**Roadmap:** ~3–6 meses até primeiro cliente pago com dinheiro real

**Critérios de sucesso:** 1 restaurante a operar com pagamento real; Z-report fiável; sem incidentes críticos em 2 semanas

---

### Opção 2 — Competir com Toast globalmente

**Gap principal:** investimento em infra (10+ engenheiros, multi-região, hardware próprio, compliance global, suporte 24/7)

**Timeline:** anos

**O que já encaixa:** Core, Gateway, RBAC, tenant isolation

---

### Opção 3 — White-label enxuto

**O que fazer:**
- API pública documentada e estável
- SLAs e códigos de erro bem definidos
- Multi-tenant robusto
- Billing como módulo opcional
- Desacoplar UI do Core

**Roadmap:** 6–12 meses para API “enterprise-ready”

**Critérios de sucesso:** documentação pública; 1 integrador externo a consumir a API

---

### Opção 4 — Híbrido (gestão de equipe + POS)

**O que fazer:**
- Tratar POS como módulo dentro de produto de gestão
- Priorizar AppStaff como diferencial
- Integrar calendário, turnos, escalas

**Roadmap:** definição de produto antes de desenvolvimento — qual o core: gestão ou POS?

---

## 3. Decisão

| Campo | Valor |
|-------|-------|
| Opção escolhida | **3 — Plataforma Operacional Modular** |
| Data da decisão | 2026-02-25 |
| Documento detalhado | [PLATFORM_MODULAR_DECISION.md](./PLATFORM_MODULAR_DECISION.md) |
| Revisão prevista | 2026-06 |

---

## 4. Próximos passos implementados (2026-02-25)

1. **Unificar fechamento de caixa** — Migration `20260405_gm_z_reports_unified.sql`; `close_cash_register_atomic` persiste em `gm_z_reports`; `create_day_z_report` para fechamento diário; `FinanceEngine.closeDay` usa RPC. Ver [CASH_CLOSE_UNIFIED.md](../architecture/CASH_CLOSE_UNIFIED.md).
2. **Integrar Billing no onboarding** — BillingStep, CheckoutStep, TrialStart; rotas `/onboarding/billing`, `/onboarding/checkout`, `/onboarding/trial-start`; "Ver planos" em plan-trial → billing. Ver [ONBOARDING_5MIN_9_TELAS_CONTRACT § Billing](../contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md).
3. **Checklist piloto pagamento real** — [PILOT_REAL_PAYMENT_CHECKLIST.md](../ops/PILOT_REAL_PAYMENT_CHECKLIST.md)
4. **Mapa de módulos (Plataforma modular)** — [MODULES_PLATFORM_CONTRACT.md](../architecture/MODULES_PLATFORM_CONTRACT.md)

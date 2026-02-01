# Não-Objectivos — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T00-5 · [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Documento canónico do que o ChefIApp **não** pretende fazer agora (não-objectivos e escopo congelado). Consolida [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md), [strategy/POSITIONING.md](./strategy/POSITIONING.md) e referências em vários docs.

---

## 1. Princípio

**Congelar escopo** para evitar scope creep e manter foco em "TPV que pensa". O que está abaixo **não será feito agora**; quando reconsiderar, seguir [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md) e actualizar este doc.

---

## 2. Não-objectivos (resumo)

| Não-objectivo | Justificativa | Quando reconsiderar |
|---------------|---------------|----------------------|
| **ERP completo** | Não é core do "TPV que pensa". | Após produto estar a vender bem. |
| **Sistema operacional completo (como produto)** | Arquitectura interna é tipo OS; não expor como produto/marketing "OS completo" agora. | Após produto estar a vender bem. |
| **Analytics profundos** | Não é core do "TPV que pensa". | FASE 8 (pós-mercado) ou quando clientes pedirem. |
| **Mapa visual completo** | Grid por zonas resolve 80%; não é bloqueador. | FASE 7 (após produto vendável) ou feedback real. |
| **Gestão completa de equipa** | Não é core do "TPV que pensa". | Após produto estar a vender bem. |
| **Integrações avançadas** | Integrações básicas são suficientes. | Após feedback de clientes. |

Detalhe completo (o que não será feito agora, o que será feito agora, fases): **[strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md)**.

---

## 3. Escopo vs. Arquitectura

- **Escopo** (este doc + SCOPE_FREEZE): o que o utilizador vê e usa agora; features visíveis.
- **Arquitectura** (contratos Core): como o sistema está organizado (Kernel, contratos, terminais); não é scope creep — é readiness e evolução.

Não competem; complementam-se. Ver tabela em [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md).

---

## 4. O que é foco agora

- Billing integrado (FASE 1)
- Onboarding com primeira venda (FASE 2)
- Now Engine (FASE 3)
- Gamificação mínima (FASE 4 — painel acessível)
- Conforme [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md) e [strategy/NEXT_ACTIONS.md](./strategy/NEXT_ACTIONS.md).

---

## 5. Limites de produto e dados

- **Produto:** O que não somos (não TPV genérico, não ERP): [WHAT_CHEFIAPP_IS_NOT.md](./WHAT_CHEFIAPP_IS_NOT.md).
- **Dados:** O que não processamos: [docs/architecture/WHAT_WE_DO_NOT_PROCESS.md](./architecture/WHAT_WE_DO_NOT_PROCESS.md).

---

**Referências:** [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md) · [strategy/POSITIONING.md](./strategy/POSITIONING.md) · [WHAT_CHEFIAPP_IS_NOT.md](./WHAT_CHEFIAPP_IS_NOT.md) · [VISION.md](./VISION.md) · [architecture/CORE_CONTRACT_INDEX.md](./architecture/CORE_CONTRACT_INDEX.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md).

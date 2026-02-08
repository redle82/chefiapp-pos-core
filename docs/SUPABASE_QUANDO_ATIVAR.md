# Quando ativar o Supabase

**Decisão:** Supabase **não** é ativado durante a fase de validação humana. Ativa **no mesmo dia ou logo após o primeiro pagamento real**.

---

## Regra de ouro

> **Supabase entra no mesmo dia ou logo após o primeiro pagamento real. Não antes.**

- Supabase não é para descobrir o produto; é para estabilizar o que já vende.
- O modelo de dados já provou sentido; o fluxo humano está fechado; a infra passa a servir dinheiro, não hipótese.

---

## Estado atual (recomendado)

| Camada      | Estado                          |
|------------|-----------------------------------|
| Produto    | ✅ Pronto                         |
| UX / Fluxo | ✅ Validar                        |
| Código     | ✅ Estável                        |
| Deploy     | ✅ OK                             |
| Stripe     | ⏳ A seguir                       |
| **Supabase** | ⏸️ **Em espera (correto)**     |

**Agora:** continuar com **Docker Core** (API, persistência de teste, TPV, billing mock, debug rápido). Nada da validação humana exige Supabase live.

---

## Quando ativar (checklist)

Ativa **apenas** quando:

- [ ] Teste humano E2E terminou com critério "Agora vejo." ([VALIDACAO_TESTE_HUMANO_E2E.md](VALIDACAO_TESTE_HUMANO_E2E.md))
- [ ] Stripe live testado (nem que seja €1) ([VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md))
- [ ] Primeiro cliente real confirmado
- [ ] Objetivo é persistir dados reais, não teste

Nesse momento: criar projeto Supabase, aplicar migrações, apontar envs, ligar webhook Stripe, fechar infra. Em 1–2 horas está feito.

---

## Riscos de ativar cedo demais

- Migrações "a quente"
- Dados sujos de teste humano
- Ajustes estruturais em produção
- Stress desnecessário antes do primeiro €79

---

## Referências

- [SUPABASE_EM_MODO_DOCKER.md](SUPABASE_EM_MODO_DOCKER.md) — Por que o código ainda referencia Supabase em modo Docker
- [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md) — Stripe antes de Supabase
- [AUTH_GOOGLE_QUANDO_ENTRAR.md](AUTH_GOOGLE_QUANDO_ENTRAR.md) — Google Auth só após Supabase (Fase 5.5)
- [NEXT_STEPS.md](../NEXT_STEPS.md) — Roteiro geral

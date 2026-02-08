# Validação onboarding — primeiro cliente pagante

**Objetivo:** Fluxo executável no dia do primeiro cliente (URLs na ordem). Checklist completo: [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md).

**Pré-requisitos:** [VALIDACAO_STRIPE_PRODUCAO.md](./VALIDACAO_STRIPE_PRODUCAO.md) e [VALIDACAO_DOMINIO_PRODUCAO.md](./VALIDACAO_DOMINIO_PRODUCAO.md) concluídos; backend em produção (Supabase ou Core) com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidos na Vercel; migração `billing_status` aplicada; 1 restaurante piloto escolhido.

---

## Fluxo no dia (URLs na ordem)

Substituir `https://<teu-dominio>` pelo domínio real (ex.: `https://app.chefiapp.pt`).

1. **Landing** — `https://<teu-dominio>/` → TPV demo + overlay. Clicar **"Começar agora"**.
2. **Auth** — `https://<teu-dominio>/auth` → signup (criar conta do dono/gerente).
3. **Bootstrap** — criar restaurante (nome, etc.).
4. **Primeiro produto** — `https://<teu-dominio>/onboarding/first-product` → criar pelo menos 1 produto.
5. **TPV** — `https://<teu-dominio>/op/tpv` → abrir turno, registrar 1 pedido e 1 pagamento (Dinheiro/Cartão/Outro).
6. **Dashboard** — confirmar que pedido e métricas do dia aparecem.
7. **Billing** — `https://<teu-dominio>/app/billing` → clicar **"Ativar agora"** (checkout Stripe).
8. **Checkout Stripe** — completar pagamento (cartão teste ou real).
9. **Success** — `https://<teu-dominio>/billing/success` → mensagem "Assinatura ativa"; links Dashboard e TPV.
10. **Confirmar €79** no Stripe (e, se aplicável, `billing_status` = active na BD).
11. **Feedback** — 1–3 pontos do dono/gerente.

---

## Critério de sucesso

- 1 restaurante real operou 1 turno no ChefIApp.
- 1 pagamento €79 recebido via Stripe.
- Zero reclamação bloqueante OU reclamação registada e resposta definida.

---

**Próximo:** Segundo cliente pagante ou ajustar copy/UX com base no feedback.

# Quando entra o Google Auth

**Decisão:** Google Auth **não** entra antes do primeiro €79. Entra **após Supabase ativo** (Fase 5.5).

---

## Regra de ouro

> **Google Auth só entra após: produto vendido, Supabase ativo, Core validado em uso real.**

- Google não desbloqueia venda.
- Google não valida produto.
- Google não resolve problema humano.
- Google só reduz fricção **depois** de o valor estar provado.

---

## Posição no plano (oficial)

**Até Fase 4 (primeiro cliente pagante):**

- Google Auth fora
- Google Console fora
- OAuth redirect URIs fora
- Scope creep fora

Nada disso bloqueia €79.

**Google entra em Fase 5.5 (logo após Supabase):**

| Ordem | Passo |
|-------|--------|
| 1 | Teste Humano E2E |
| 2 | Stripe live |
| 3 | Domínio |
| 4 | Primeiro cliente (€79) |
| 5 | Supabase ON |
| 6 | **Google Auth** |

---

## Por que não entra antes

- Email/password + modo piloto = suficiente até ao primeiro dinheiro.
- Menos moving parts.
- Menos risco de loop OAuth.
- Menos dependência externa.

---

## Por que Google depende do Supabase

- OAuth precisa de persistência real.
- Precisa de: `users`, `identities`, provider mapping.
- Fazer Google sem Supabase é gambiarra e dívida técnica.

---

## O que NÃO foi esquecido (explícito)

- Google **não** é requisito do Core.
- Google **não** é requisito de venda.
- Google **não** é requisito do piloto.
- Google **é** otimização de onboarding.

---

## Checklist futuro (quando ativar)

- [ ] Google Console: projeto / OAuth consent screen
- [ ] Credenciais: OAuth 2.0 Client ID (Web)
- [ ] Redirect URIs: `https://<teu-dominio>/auth/callback` (e Supabase Auth se aplicável)
- [ ] Supabase Auth: provider Google configurado (URLs, client ID, secret)
- [ ] Env: variáveis de Google no backend/Supabase (não no frontend)

---

## Referências

- [SUPABASE_QUANDO_ATIVAR.md](SUPABASE_QUANDO_ATIVAR.md) — Supabase antes de Google
- [PLANO_FINAL_PRIMEIRO_E79.md](PLANO_FINAL_PRIMEIRO_E79.md) — Fases 1–6
- [NEXT_STEPS.md](../NEXT_STEPS.md) — Ordem ativa

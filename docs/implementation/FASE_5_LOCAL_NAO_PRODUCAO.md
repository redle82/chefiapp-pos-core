# Declaração oficial: Local ≠ Produção

**Decisão de produto:** O ambiente local com Docker é **apenas para dev/piloto técnico**. O dono real entra **sempre por URL** (Supabase + app em hosting). Não é remendo — é declaração consciente.

---

## Regra

- **Local (Docker Core + merchant-portal em localhost):** Dev e piloto técnico. Script `./start-local.sh` ou `npm run start:local`; doc [FASE_5_COMO_INICIAR_1_MINUTO.md](FASE_5_COMO_INICIAR_1_MINUTO.md). O Teste Humano (FASE B) **não se repete** neste ambiente como critério de “produto pronto”.
- **Produção (Supabase + app em Vercel/Netlify, URL real):** Dono real. O dono abre um link; zero Docker, zero terminal. O Teste Humano (FASE B) **repete-se aqui**. Se PASSOU → primeiro cliente pagante €79.

O sistema só existe plenamente para o humano quando há chão. Esse chão existe via URL, não via local.

---

## Três estados (resumo)

| Estado                      | Situação                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| Dev / Piloto técnico        | OK com script e doc local                                               |
| Dono real (produção)        | OK via Supabase + URL                                                   |
| Local humano (sem Supabase) | Não é alvo de produto; FASE C reduz fricção mas local continua dev-only |

---

## Próximo passo recomendado

1. **FASE B** — Repetir **apenas em ambiente Supabase** (URL real, dono abre link).
2. **Se PASSOU** → [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) (piloto €79).
3. **Local** fica oficialmente rotulado como **dev-only**; não se bloqueia avanço por repetir FASE B em local.

---

## Referências

- [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md) — FALHOU (impossibilidade operacional); decisão: FASE B em Supabase.
- [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md) — Checklist para ter URL real.
- [FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md](FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md) — Reduz fricção em local; não substitui “dono por URL”.

Documento criado após Teste Humano Supremo (Antigravity): o sistema fala verdade; a decisão fica explícita.

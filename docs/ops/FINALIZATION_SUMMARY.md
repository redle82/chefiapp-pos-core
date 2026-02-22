# Resumo de finalização — ChefIApp SaaS

**Data**: 2026-02-22

---

## Verificação executada

- **Lint** (merchant-portal): ✅
- **Typecheck** (merchant-portal): ✅
- **Testes** (Vitest merchant-portal): ✅
- **Build** (merchant-portal): ✅

## Alterações de finalização

1. **OnboardingClient** — Removido import inexistente `./supabase-client`; passou a usar `getCoreClient()` de `../../core/db` para RPCs (create_onboarding_context, get_onboarding_state, update_onboarding_step).
2. **Config Supabase** — Fallback em `config.ts`: quando só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidos, o portal usa esses valores como backend.
3. **Documentação** — `docs/ops/SUPABASE_CONFIG_AND_SECURITY.md`: verificação de configuração e segurança do Supabase; checklist para 100% (anon key real, migrações, JWT).

## Próximos passos (manual)

1. **Produção Supabase** — Definir a anon key real em produção (Vercel): ver **docs/ops/PRODUCTION_ENV_SETUP.md** (§1). Nunca commitar a chave.
2. **Migrações** — Quando ativar o Supabase live: `export DATABASE_URL="..."; pnpm run supabase:finalize` (ver `docs/ops/PRODUCTION_ENV_SETUP.md` §3 e `docs/ops/SUPABASE_EXCELLENCE.md`). O script `scripts/apply-migrations-supabase.sh` exige `DATABASE_URL` e aplica todas as migrações por ordem.
3. **Handoff** — Preencher **docs/ops/HANDOFF_CHECKLIST.md** (variáveis de produção, monitorização, backup, on-call, deploy) e seguir **DEPLOYMENT_RUNBOOK.md**.

## Referências

- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`
- **Runbook**: `DEPLOYMENT_RUNBOOK.md`
- **Variáveis produção**: `docs/ops/PRODUCTION_ENV_SETUP.md`
- **Handoff**: `docs/ops/HANDOFF_CHECKLIST.md`
- **Supabase**: `docs/ops/SUPABASE_CONFIG_AND_SECURITY.md`, `docs/ops/SUPABASE_EXCELLENCE.md`
- **Release**: `npm run audit:release:portal` (gate recomendado antes de PR)

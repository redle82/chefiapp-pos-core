# Frente config-general — Encerrada

**Data:** 2026-03-10  
**Estado:** Bloqueio de abertura da tela resolvido no frontend.

## Critérios cumpridos

- Sem 400 de `gm_restaurant_members`
- Sem 400 de `gm_restaurants`
- Sem log `column "disabled_at" does not exist`
- `TenantResolver` → Tenant Unsealed
- Tela `/admin/config/general` abre normalmente

## Solução em vigor

Bypass default em dev com Supabase: `CONFIG.SUPABASE_SKIP_RESTAURANT_API === true` quando `IS_DEV`. Resolução do tenant usa `SEED_RESTAURANT_ID` sem chamar as APIs; consola limpa, tela abre.

Para voltar a usar a API em dev: `VITE_SUPABASE_SKIP_RESTAURANT_API=false` no `.env.local`.

## E2E (validação local)

Com o portal a correr em `http://localhost:5175`:

```bash
cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
```

Referência: `docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md` (§ Frente encerrada).

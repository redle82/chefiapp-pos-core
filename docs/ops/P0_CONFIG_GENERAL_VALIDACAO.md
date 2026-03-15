# Validação /admin/config/general (schema opcional gm_restaurants)

## Frente encerrada (bloqueio de abertura da tela)

**Data:** 2026-03-10. **Estado:** Resolvido no frontend.

Em dev com backend Supabase, o bypass default (`CONFIG.SUPABASE_SKIP_RESTAURANT_API === true` por defeito em `IS_DEV`) evita chamadas a `gm_restaurant_members` e `gm_restaurants` na resolução do tenant; usa `SEED_RESTAURANT_ID`. Resultado: zero 400 na consola, `TenantResolver` → Tenant Unsealed, tela `/admin/config/general` abre normalmente. Para voltar a usar a API em dev (ex.: após aplicar migrações `disabled_at` no Supabase), definir `VITE_SUPABASE_SKIP_RESTAURANT_API=false` no `.env.local`. Validação final: executar localmente o E2E do contract (portal em 5175):  
`cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts`

---

## Objetivo

Validar no browser que a correção do schema opcional de `gm_restaurants` resolve a página `/admin/config/general`: leitura e escrita dos campos de identidade/configuração sem 400 e sem fallback mínimo.

---

## 1. Estado verificado

- **Migration opcional:** `20260310000000_gm_restaurants_supabase_optional_columns.sql` aplicada no Supabase em uso.
- **Colunas em gm_restaurants:** type, city, address, logo_url, country, timezone, currency, locale, disabled_at, trial_ends_at, product_mode, billing_status; **e** phone, email, postal_code, state (necessárias para o save do GeneralCardIdentity).
- **Tabela:** `restaurant_setup_status` criada.
- **Script de validação de schema (Node):** `merchant-portal/scripts/validate-config-general-schema.ts` — executado com sucesso (leitura SELECT e UPDATE em gm_restaurants OK).
- **Portal:** servidor de desenvolvimento a correr em `http://localhost:5175`.
- **E2E e `disabled_at`:** Se o E2E config-general falhar com 400 `column "disabled_at" does not exist` em `gm_restaurants?select=id&limit=1`, a causa é servidor (coluna em falta ou schema cache do PostgREST). Seguir o **plano de debug em ordem** abaixo.

---

## 1.1 Bloqueio E2E config-general — Plano de debug em ordem

Quando o frontend **não** pede `disabled_at` (apenas `select=id&limit=1`), o 400 pode vir do PostgREST (cache de schema ou policy/view no projeto). **Fechamento no frontend:** (1) Fallback por memberships quando `fetchFirstRestaurantId()` falha. (2) Se ambas as fontes (gm_restaurants e gm_restaurant_members) falharem, não repetir as requests (cache `supabaseFirstRestaurantFailedOnce`). (3) Em `restaurantExistsInCore()`, quando o Supabase devolve erro "does not exist", tratar como "existe" para não invalidar o `restaurant_id` guardado no localStorage. (4) Em dev, usar SEED_RESTAURANT_ID quando não houver ID. **Backend:** Aplicar `20260310000000_gm_restaurants_supabase_optional_columns.sql` (gm_restaurants.disabled_at) e, se gm_restaurant_members também devolver 400, aplicar `20260310100000_gm_restaurant_members_disabled_at.sql`; depois executar `NOTIFY pgrst, 'reload schema';` no SQL Editor do Dashboard.

**Frente unitária (5 testes):** Encerrada — suite 816 passed, 0 failed. Ver **docs/ops/P0_FRENTE_5_TESTES_ENCERRADA.md**. Não misturar com este bloqueio E2E.

**Próximo passo (após NOTIFY):** Executar `NOTIFY pgrst, 'reload schema';` no **SQL Editor do Supabase Dashboard** se ainda não foi feito. Depois, recarregar a página (hard refresh) e reexecutar o E2E (Passo 2). Com o fallback em vigor, mesmo que o NOTIFY não resolva o cache, o fluxo deve usar memberships e a página deve carregar sem 400.

**Executar nesta ordem:**

### Passo 1 — Recarga real do schema no Supabase Dashboard

1. Abrir o **Supabase Dashboard** do projeto em uso (ex.: `kwgsmbrxfcezuvkwgvuf`).
2. Ir a **SQL Editor**.
3. Colar e executar exatamente:

```sql
NOTIFY pgrst, 'reload schema';
```

4. Confirmar que a query executou sem erro.  
   (O NOTIFY via pooler/DATABASE_URL pode não chegar ao PostgREST; o SQL Editor usa conexão direta.)

Ficheiro de referência: `merchant-portal/scripts/supabase-reload-schema-notify.sql`.

### Passo 2 — Reexecutar o E2E (após NOTIFY no Dashboard)

Com o portal a correr em `http://localhost:5175`, executar exatamente:

```bash
cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
```

Critério de sucesso: sem 400 por `column does not exist`; os 2 testes do contract passam. Se passarem, o bloqueio do E2E fica fechado. Se falharem, seguir Passo 3 (auditar policies/views/functions).

### Passo 3 — Se ainda falhar: auditar políticas/views/functions

Se após o NOTIFY o E2E continuar a devolver 400 por `disabled_at`:

1. No Supabase Dashboard: **Database** → **Tables** → `gm_restaurants` → verificar **RLS policies** por referências a `disabled_at`.
2. **SQL Editor:** executar o script de auditoria `merchant-portal/scripts/supabase-audit-disabled-at.sql` (lista políticas, colunas, views, funções e triggers).
3. **Auditoria no repo (já feita):** Nas migrations do repo, **nenhuma** política RLS em `gm_restaurants` referencia `disabled_at`. O ficheiro `supabase/migrations/20260224_core_rls_policies.sql` define apenas `owner_id` e `is_restaurant_member(id)` para SELECT/UPDATE/INSERT. A coluna `disabled_at` existe em `gm_restaurant_members` (outras migrations), não nas políticas de `gm_restaurants`. Se o 400 persistir após NOTIFY, o objeto responsável é provavelmente **no projeto Supabase** (policy/view/trigger criado fora do repo) ou **cache do PostgREST** — usar o script para identificar.
4. Corrigir ou alinhar: remover/ajustar a referência a `disabled_at` nesses objetos, ou garantir que a coluna existe e que o PostgREST recarregou o schema (repetir Passo 1 se tiveres aplicado a migration entretanto).

### Registo de execução do plano

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Executar `NOTIFY pgrst, 'reload schema';` no **SQL Editor** do Supabase Dashboard (projeto em uso) | Pré-condição manual. Utilizador confirma execução sem erro. |
| 2 | Reexecutar E2E com portal em 5175 (após Passo 1) | Comando: `cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts`. **Fallback em código:** se `gm_restaurants` continuar a devolver 400 por `disabled_at`, `getOrCreateRestaurantId()` usa `fetchFirstRestaurantIdFromMembers()` (apenas `gm_restaurant_members`), pelo que a página deve carregar. Registrar resultado local: _____ passaram / _____ falharam. |
| 3 | Se Passo 2 falhar: auditar policies/views/functions | Script: `merchant-portal/scripts/supabase-audit-disabled-at.sql`. Auditoria no repo: RLS em `gm_restaurants` (20260224) não referencia `disabled_at`. Com o fallback por memberships, o bloqueio de carregamento da página fica contornado mesmo que o 400 persista na query direta a `gm_restaurants`. |

---

## 2. Validação com estado limpo (antes de verificar)

Para não confundir erros antigos/cache com erros novos:

1. Abrir o DevTools (F12).
2. **Console:** Clicar em Clear console (ou executar `console.clear()`).
3. **Network:** Limpar o log (ícone 🚫 ou "Clear" / "Clear log"); marcar **Disable cache**.
4. **Hard refresh:** Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac). Assim só contam pedidos e erros gerados depois deste reload.
5. Navegar para **http://localhost:5175/admin/config/general** (se não estiver autenticado, ir primeiro a `/auth` e fazer login com o user do seed).

Qualquer 400 ou erro que apareça **a partir daqui** é erro novo; logs anteriores são evidência antiga.

---

## 3. Resultado no browser (checklist para o utilizador)

1. Com estado limpo (secção 2), estar em **http://localhost:5175/admin/config/general**.
2. Verificar:
   - [ ] A página abre sem erro de consola.
   - [ ] Não aparecem erros **400** por `"column does not exist"` (nem para gm_restaurants nem para restaurant_setup_status).
   - [ ] Os cards **Identidade do Restaurante** e **Idioma e localização** mostram "A carregar..." e depois os campos preenchidos (ou vazios se for a primeira vez).
   - [ ] Campos visíveis e editáveis: nome, tipo, país, telefone, e-mail, morada, cidade, código postal, região, URL do logo; idioma, fuso horário, moeda.

---

## 4. Resultado do save

1. No card **Identidade do Restaurante:** alterar por exemplo **Cidade** ou **Telefone**.
2. Clicar **Guardar**.
3. Verificar:
   - [ ] Não aparece alerta de erro (ex.: "column does not exist" ou "Core indisponível").
   - [ ] Refrescar a página (F5).
   - [ ] Os valores alterados continuam lá (persistência).

4. No card **Idioma e localização:** alterar por exemplo **Idioma do TPV** ou **Moeda**.
5. Clicar **Guardar**.
6. Verificar:
   - [ ] Sem erro; após refresh os valores persistem.

---

## 5. Erros remanescentes (se houver)

| Sintoma | Provável causa | Onde corrigir |
|--------|-----------------|----------------|
| 400 em GET gm_restaurants | Coluna em falta no Supabase | Reaplicar migration opcional; confirmar colunas com `validate-config-general-schema.ts`. |
| 400 em PATCH gm_restaurants | Coluna em falta (ex.: phone, postal_code) | Migration já inclui phone, email, postal_code, state; reaplicar `apply-optional-restaurant-columns.ts`. |
| "Core indisponível ou restaurante não selecionado" ao guardar | `getBackendType()` não é docker ou `restaurant_id` null | Confirmar que estás autenticado e que o TenantContext tem `restaurant_id` (membership do user). |
| 403/401 no update | RLS bloqueia update | Ver políticas RLS em `gm_restaurants` para `authenticated` (update onde restaurant_id no membership). |

---

## 6. Estado final do bloqueio

- **Schema:** Bloqueio de colunas opcionais fechado. Migration aplicada; leitura e escrita validadas ao nível da base com `validate-config-general-schema.ts`.
- **Frontend:** Mantém fallback mínimo (IDENTITY_SELECT_MINIMAL / RESTAURANT_SELECT_MINIMAL) como proteção; com o schema aplicado, a página usa o select completo e os updates incluem todos os campos do formulário.
- **Validação funcional no browser:** Fica a cargo do utilizador seguir o checklist acima e assinalar quaisquer falhas; em caso de erro, usar a tabela "Erros remanescentes" para localizar e corrigir (read/select, save/update, RLS ou payload).

---

## Comandos úteis

```bash
# Aplicar migration opcional (se ainda não aplicada)
cd merchant-portal && pnpm tsx scripts/apply-optional-restaurant-columns.ts

# Validar schema (leitura + escrita ao nível DB)
cd merchant-portal && pnpm tsx scripts/validate-config-general-schema.ts

# Subir portal
pnpm --filter merchant-portal run dev

# Validação E2E no browser (portal já a correr em 5175; ~2–3 min: setup + 2 testes)
cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
```
O E2E abre `/admin/config/general`, verifica que não há 400 por "column does not exist", que os cards carregam e que o Guardar não devolve 400/403.

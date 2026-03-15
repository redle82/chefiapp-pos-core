## SEED_OWNER_SOBERANO — Owner + Restaurante + Membership (Supabase/Core)

### 1. Objetivo

Criar **num só comando**:

- um **utilizador real** (email/password/nome) no backend Supabase/Core;
- uma **empresa** (`gm_companies`);
- um **restaurante** (`gm_restaurants`) ligado a esse utilizador;
- uma **membership `owner`** em `gm_restaurant_members`;
- (com SERVICE_KEY) uma **categoria** e os produtos **E2E Burger** (station KITCHEN) e **E2E Drink** (station BAR) no restaurante, para E2E TPV→KDS e roteamento Cozinha/Bar (P4.1, P5);
- (com SERVICE_KEY) **mesa 1** (`gm_tables`) para E2E QR Mesa (P5) e **table_id** gravado em `e2e-creds.json` para E2E Garçom (P5 Pedido misto Garçom); **slug** `sovereign-burger-hub` para E2E Web/QR Mesa.

Este seed é o ponto de partida para o **fluxo soberano integrado** quando o backend está em modo Supabase/Core.

---

### 2. Pré‑requisitos

1. **Schema Supabase compatível**
   - O projeto Supabase deve ter as tabelas **`gm_companies`**, **`gm_restaurants`** e **`gm_restaurant_members`** (e `gm_restaurants` com coluna **`company_id`**). Sem isto, o seed falha com *"Could not find the table 'public.gm_companies'"* e não cria company/restaurant/membership.
   - Como aplicar: ver **`docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md`** — migrations em `supabase/migrations/` (baseline + `20260328000000_gm_companies_sovereign_flow.sql`), por exemplo com `supabase db push` ou executando o SQL no Dashboard.

2. **Backend Supabase/Core acessível**
   - Variáveis definidas (num `.env` ou `.env.local` em `merchant-portal`):
     - `VITE_SUPABASE_URL` — URL do backend (Supabase),
     - `VITE_SUPABASE_ANON_KEY` — chave anon (obrigatória para o portal; o seed usa para signUp se não houver service key),
     - **Para P0.2 (company + restaurant + membership):** `SUPABASE_SERVICE_ROLE_KEY` — para criar user confirmado e inserir em `gm_companies`, `gm_restaurants`, `gm_restaurant_members`. Sem ela, o seed só cria o user (e falha se "Confirm email" estiver ativo no Supabase).

3. **Node + pnpm** instalados.

4. Estar na raiz do repo ou dentro de `merchant-portal`.

---

### 3. Comando canónico

Na raiz do monorepo:

```bash
cd merchant-portal
pnpm tsx scripts/seed-e2e-user.ts
```

Se preferires usar npx:

```bash
cd merchant-portal
npx tsx scripts/seed-e2e-user.ts
```

---

### 4. Output esperado

O script deve imprimir algo do género:

```text
🌱 Seeding E2E User: sovereign.test.1711234567890@chefiapp.com
🔑 Using Service Key (Admin Mode)
✨ User Created via Admin.
🆔 User ID: 00000000-0000-0000-0000-00000000ABCD
...
🏢 Creating Company...
🍔 Creating Restaurant...
👤 Creating OWNER membership for restaurant...
   Produto E2E Burger criado (TPV→KDS).
   Produto E2E Drink criado (KDS Bar).
   Mesa 1 criada (QR Mesa E2E).
   table_id gravado em e2e-creds (E2E Garçom).

✅ Seeding Complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Owner Soberano (Supabase Backend)
   Email:    sovereign.test.1711234567890@chefiapp.com
   Password: password123
   Name:     Sovereign Tester
   User ID:  00000000-0000-0000-0000-00000000ABCD
   Backend:  Supabase (SERVICE_KEY mode)
   Restaurant ID: <uuid do restaurante criado>
   Restaurante: Sovereign Burger Hub (gm_restaurants, owner_id = userId)
   Membership:  gm_restaurant_members(role = owner)

 Guarde email, password, user_id e **restaurant_id** para login e validação.

 Próximos passos:
   1) Configure a app local para usar este backend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
   2) Faça login no Admin com o email/password acima.
   3) Verifique em /admin/modules que o restaurante aparece ligado a este utilizador.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Se estiveres a usar apenas `ANON_KEY`, o script tenta criar os dados mas pode depender de triggers/RLS — a mensagem final indica isso.

---

### 5. Como validar no Admin

1. Atualiza `.env.local` do `merchant-portal` para apontar para o mesmo backend: define `VITE_SUPABASE_URL` (ex.: `https://xxx.supabase.co`) e `VITE_SUPABASE_ANON_KEY`. Quando a URL contém `supabase.co`, o portal usa Supabase como CORE mesmo que `VITE_CORE_URL` esteja definido (ex.: Docker). Na consola do browser deve aparecer `[CONFIG] Loaded { ..., isSupabaseBackend: true }`.
2. Sobe o dev server:

```bash
pnpm --filter merchant-portal run dev
```

3. Abre `http://localhost:5175/auth/login` e entra com o email/password gerados.
4. Navega para `http://localhost:5175/admin/modules`:
   - topbar deve mostrar o utilizador criado (nome/email),
   - os módulos devem estar associados ao restaurante `Sovereign Burger Hub` (ou equivalente).

**Checklist de validação do fluxo soberano (mesmo restaurante em todas as superfícies):**

- [ ] Login com o user do seed.
- [ ] Admin: topbar mostra o restaurante criado pelo seed (nome correto).
- [ ] TPV: usa o mesmo `restaurant_id` (pedidos/categorias do mesmo restaurante).
- [ ] KDS: lista pedidos do mesmo restaurante.
- [ ] AppStaff (`/app/staff/home`): launcher no mesmo tenant/restaurante.

Validação completa (bootstrap + Admin/TPV/KDS/AppStaff + evidência objetiva): **`docs/ops/P0_SOBERANO_VALIDACAO_FIM_A_FIM.md`**.  
Smoke repetível por superfície (script + critérios + troubleshooting): **`docs/ops/P0_SOBERANO_SMOKE_FLOW.md`**; após o seed, executar `pnpm tsx scripts/smoke-sovereign-p0.ts` para obter o checklist e o one-liner de verificação.

---

### 6. Notas sobre ambiente / backend

- Este seed fala com o backend exposto em `VITE_SUPABASE_URL`.  
  Em alguns setups de Docker Core, esta URL pode apontar para PostgREST em `http://localhost:3001` (modo compatível).
- Em ambientes totalmente Keycloak + Docker Core (sem Supabase), pode ser necessário um seed separado baseado em `DATABASE_URL` + `pg`.  
  Para o P0.1 do **fluxo soberano integrado**, este script cobre o cenário **Supabase/Core compatível**.

---

### 7. Referência no roadmap

Este comando é o seed canónico referido em:

- `docs/roadmap/FLUXO_SOBERANO_INTEGRADO.md` — secção **P0.1 — Seed canónico OWNER + RESTAURANTE + MEMBERSHIP**.


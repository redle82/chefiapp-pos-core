# P0 Soberano — Validação fim a fim

**Data:** 2026-03-10  
**Objetivo:** Provar operacionalmente que o fluxo soberano P0 está fechado: um utilizador real, um restaurante real, membership owner real, e o mesmo `restaurant_id` em Admin, TPV, KDS e AppStaff.

---

## 1. Bootstrap executado

### 1.1 Schema

- Supabase com tabelas `gm_companies`, `gm_restaurants`, `gm_restaurant_members` (e colunas usadas pelo seed: `owner_id`, `company_id`, `slug`, `status`, `role`).
- Se existirem migrations para `disabled_at` em `gm_restaurants` / `gm_restaurant_members`, aplicá-las e executar `NOTIFY pgrst, 'reload schema';` para evitar 400 nas queries.

### 1.2 Comando canónico

```bash
cd merchant-portal
pnpm tsx scripts/seed-e2e-user.ts
```

Requer em `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para criar user confirmado + company + restaurant + membership)

### 1.3 Output real (exemplo de execução 2026-03-10)

```
🌱 Seeding E2E User: sovereign.test.1773524648074@chefiapp.com
🔑 Using Service Key (Admin Mode)
✨ User Created via Admin.
🆔 User ID: 5e4386cc-0b85-4697-8770-e8af5ef774b2
💾 Credentials saved to: tests/e2e/e2e-creds.json
🏢 Creating Company...
🍔 Creating Restaurant...
   (Se slug já existir: "Using existing restaurant (slug already present) for membership.")
👤 Creating OWNER membership for restaurant...

✅ Seeding Complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Owner Soberano (Supabase Backend)
   Email:     sovereign.test.1773524648074@chefiapp.com
   Password:  password123
   Name:      Sovereign Tester
   User ID:   5e4386cc-0b85-4697-8770-e8af5ef774b2
   Backend:   Supabase (SERVICE_KEY mode)
   Restaurant ID: aae0426e-c1a0-4a56-a589-625dc4b45d5f
   Restaurante: Sovereign Burger Hub (gm_restaurants, owner_id = userId)
   Membership: gm_restaurant_members(role = owner)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Nota:** Cada execução gera um email único (`sovereign.test.<timestamp>@chefiapp.com`). Guarde o **Restaurant ID** e as credenciais para a validação.

---

## 2. Credenciais e `restaurant_id` gerados

| Campo           | Exemplo (run acima) |
|----------------|----------------------|
| Email          | `sovereign.test.1773524648074@chefiapp.com` |
| Password       | `password123` |
| User ID        | `5e4386cc-0b85-4697-8770-e8af5ef774b2` |
| **Restaurant ID** | `aae0426e-c1a0-4a56-a589-625dc4b45d5f` |

Para uma nova execução, use o output do comando; as credenciais são também guardadas em `merchant-portal/tests/e2e/e2e-creds.json`.

---

## 3. Ambiente de validação

1. **Portal em dev**
   ```bash
   pnpm --filter merchant-portal run dev
   ```
   Abrir `http://localhost:5175`.

2. **Login real**
   - Ir a `/auth` ou `/auth/login`.
   - Inserir email e password do seed.
   - Após login, o FlowGate lê `gm_restaurant_members` e chama `setActiveTenant(restaurantId)`.

3. **Bypass (opcional)**
   - Com schema aplicado e sem 400: pode usar `VITE_SUPABASE_SKIP_RESTAURANT_API=false` para o runtime resolver o id via API desde o início.
   - Com bypass em dev (`true` por defeito): o primeiro id pode ser o seed até o FlowGate selar o tenant; após o evento `chefiapp:tenant-sealed`, o runtime faz refresh e passa a usar o `restaurant_id` do membership.

---

## 4. Onde cada superfície lê o `restaurant_id`

| Superfície | Fonte | Ficheiro / hook |
|------------|--------|-------------------|
| **FlowGate** | `gm_restaurant_members` por `user_id` da sessão | `FlowGate.tsx` → `setActiveTenant(restaurantId)` |
| **Runtime** | `localStorage.getItem('chefiapp_restaurant_id')` (após setActiveTenant) + evento `chefiapp:tenant-sealed` → `refresh()` | `RestaurantRuntimeContext.tsx`, `RuntimeReader.getOrCreateRestaurantId` |
| **Admin** | `runtime.restaurant_id` via `useRestaurantRuntime()` / `useRestaurantIdentity().identity.id` | Topbar, GeneralCard*, DashboardHomePage, etc. |
| **TPV** | `useTPVRestaurantId()`: device instalado > `runtime.restaurant_id` > seed | `useTPVRestaurantId.ts`, `TPVMinimal`, `TPVPOSView` |
| **KDS** | Instalado > `runtime?.restaurant_id` > TabIsolated > default | `KDSMinimal.tsx` (linha ~197) |
| **AppStaff** | `identity.id || getTabIsolated('chefiapp_restaurant_id')`; identity vem do runtime | `StaffModule.tsx`, `AppStaffWrapper.tsx`, `useRestaurantIdentity` |

Após o FlowGate selar o tenant, todas as superfícies passam a usar o mesmo id via runtime e/ou TabIsolated/localStorage.

---

## 5. Evidência objetiva por superfície

### 5.1 Consola (geral)

- Após login, deve aparecer:  
  `[TenantResolver] 🔒 Tenant Sealed: <restaurant_id> [ACTIVE]`
- Em **Application → Local Storage** (DevTools):  
  `chefiapp_restaurant_id` = `<restaurant_id>` (igual ao Restaurant ID do seed).

### 5.2 Admin

- **Resultado esperado:** Topbar mostra o nome do restaurante (ex.: "Sovereign Burger Hub") e o operador logado.
- **Evidência:** Abrir `/admin/config/general` ou `/admin/modules`; na consola executar:
  ```js
  localStorage.getItem('chefiapp_restaurant_id')
  ```
  Deve coincidir com o Restaurant ID do seed.

### 5.3 TPV

- **Resultado esperado:** TPV usa o mesmo `restaurant_id` (pedidos/categorias do restaurante do seed).
- **Evidência:** Abrir a rota do TPV (ex.: `/app/tpv` ou a definida no projeto). O `useTPVRestaurantId()` devolve `runtime.restaurant_id` quando não há device instalado; após tenant sealed, esse valor é o do seed.

### 5.4 KDS

- **Resultado esperado:** KDS lista pedidos do mesmo restaurante.
- **Evidência:** Abrir a rota do KDS. Em `KDSMinimal`, o `restaurantId` resolvido usa `runtime?.restaurant_id`; após sealed, deve ser o mesmo Restaurant ID.

### 5.5 AppStaff

- **Resultado esperado:** Launcher e operações no mesmo tenant/restaurante.
- **Evidência:** Abrir `/app/staff/home`. `StaffModule` usa `identity.id || getTabIsolated('chefiapp_restaurant_id')`; ambos ficam preenchidos com o id selado pelo FlowGate.

---

## 6. Checklist de validação

- [ ] Seed executado com sucesso; guardados email, password, user_id, **restaurant_id**.
- [ ] Portal em dev; login com o user do seed.
- [ ] Consola: log `Tenant Sealed: <id>`; `localStorage.getItem('chefiapp_restaurant_id')` = Restaurant ID do seed.
- [ ] **Admin:** topbar com nome do restaurante correto; em `/admin/config/general` ou `/admin/modules` o contexto usa o mesmo id.
- [ ] **TPV:** mesma `restaurant_id` (sem device instalado = runtime; com device = device associado ao mesmo restaurante).
- [ ] **KDS:** pedidos do mesmo restaurante.
- [ ] **AppStaff:** `/app/staff/home` no mesmo tenant (nome/contexto do restaurante alinhado).

---

## 7. Divergências encontradas e correções

### 7.1 Seed: `restaurantId is not defined` no output final

- **Causa:** Quando o insert em `gm_restaurants` falhava (slug duplicado), o fallback buscava restaurante por slug com `.limit(1).single()`; se não houvesse linha única, `existingBySlug` não era preenchido e `restaurantId` ficava indefinido. Além disso, `restaurantId` estava declarado apenas dentro do bloco `if (SERVICE_KEY)`, pelo que não estava no escopo ao imprimir o resultado.
- **Correção:**
  1. Declarar `let restaurantId: string | undefined` no início da função `seed()` (fora do `if (SERVICE_KEY)`).
  2. Fallback por slug: usar `.select('id').eq('slug', '...').limit(1)` sem `.single()` e obter o primeiro elemento do array (ou objeto) devolvido.
  3. Fallback adicional: se ainda não houver `restaurantId`, consultar de novo `gm_restaurants` por `owner_id` e usar o primeiro resultado.

### 7.2 Nenhuma divergência de `restaurant_id` entre superfícies

- Após as alterações em FlowGate (chamar `setActiveTenant(restaurantId)`), TenantResolver (gravar em TabIsolated + localStorage + evento) e RestaurantRuntimeContext (ouvir `chefiapp:tenant-sealed` e fazer `refresh()`), Admin, TPV, KDS e AppStaff passam a ler o mesmo id via runtime/storage. Não foi necessária correção adicional nas superfícies para este ciclo.

---

## 8. Estado final do P0 soberano

- **Bootstrap:** Seed canónico cria user real + company + restaurant + membership owner; output inclui email, password, user_id, restaurant_id.
- **Login:** Funciona com Supabase Auth (email/password); FlowGate corre nas rotas app e obtém membership; chama `setActiveTenant(restaurantId)`.
- **Tenant unificado:** Um único `restaurant_id` é escrito em TabIsolated e localStorage e o runtime é atualizado via evento; Admin, TPV, KDS e AppStaff usam esse id.
- **Validação:** Runbook acima executável localmente; evidência via consola (Tenant Sealed + localStorage) e verificação visual nas quatro superfícies.

O P0 soberano está **validado operacionalmente** desde que:
1. O seed seja executado com sucesso e as credenciais + Restaurant ID sejam guardadas.
2. O login seja feito com esse user e o FlowGate consiga ler `gm_restaurant_members` (schema/RLS sem 400).
3. O checklist §6 seja cumprido na ordem indicada.

---

## 9. Referências

- **Smoke flow repetível:** `docs/ops/P0_SOBERANO_SMOKE_FLOW.md` — validação por superfície, critérios objetivos, script `smoke-sovereign-p0.ts`, troubleshooting.
- `docs/ops/FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md` — fontes de `restaurant_id`, implementação, como validar.
- `docs/ops/SEED_OWNER_SOBERANO.md` — seed canónico e output.
- `docs/roadmap/FLUXO_SOBERANO_INTEGRADO.md` — fluxo desejado e backlog P0/P1.

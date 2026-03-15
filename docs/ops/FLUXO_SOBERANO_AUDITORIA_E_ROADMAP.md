# Fluxo soberano — Auditoria objetiva e roadmap executável

**Data:** 2026-03-10  
**Objetivo:** Um utilizador real, um restaurante real, um vínculo real (membership owner); o mesmo restaurante visível de forma coerente no Admin, TPV, KDS e AppStaff.

**Restaurante oficial de validação:** Sofia Gastrobar (id `00000000-0000-0000-0000-000000000100`) — estado, dono, superfícies e roadmap em [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md).

---

## 1. Estado atual por superfície

| Superfície | O que é real | O que é bypass/mock/fallback |
|------------|--------------|------------------------------|
| **Auth** | Supabase: login email/password em `/auth`, `/auth/login`; sessão e JWT no PostgREST (`dockerCoreFetchClient` + `getCoreSessionAsync`). Keycloak em dev Docker. | Trial/pilot sem login; mock `trial-user` em `TenantResolver.fetchUserMemberships`. |
| **Seed** | Comando único: `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`. Cria user + company + restaurant + membership owner. Requer `SUPABASE_SERVICE_ROLE_KEY` e schema com `gm_companies`, `gm_restaurants`, `gm_restaurant_members`. Doc: `docs/ops/SEED_OWNER_SOBERANO.md`. | Sem service key: só cria user (e falha se "Confirm email" ativo). Outros seeds (Sofia, stress) não são o fluxo soberano. |
| **Membership** | Tabela `gm_restaurant_members`; seed insere `role = 'owner'`. `TenantResolver.fetchUserMemberships(userId)` e FlowGate consultam-na com JWT. | Em dev+Supabase, `RuntimeReader.getOrCreateRestaurantId` pode **não** chamar API (bypass `SUPABASE_SKIP_RESTAURANT_API` default true) → usa `SEED_RESTAURANT_ID` fixo; membership real só entra via FlowGate/TenantResolver quando essas chamadas não dão 400. |
| **Tenant** | `TenantResolver`: resolve por URL → cached → memberships; `setActiveTenant(tenantId)` grava `chefiapp_restaurant_id` (TabIsolated + localStorage). FlowGate em Supabase consulta `gm_restaurant_members` por `user_id` e define `restaurantId`. | Se `gm_restaurant_members` der 400 (schema/RLS), FlowGate usa fallback `getActiveTenant()` / localStorage. `RestaurantRuntimeContext` usa `getOrCreateRestaurantId()` → com bypass devolve seed sem ler membership. |
| **Admin** | Shell Admin, topbar com restaurante e operador, dropdown conta/logout. Páginas `/admin/*` consomem `useRestaurantIdentity` / runtime. | Com bypass ativo, `restaurant_id` vem do seed fixo até FlowGate/TenantResolver conseguirem ler memberships e sobrescrever. Se schema falhar, Admin pode ficar com seed ou com restaurante do membership consoante qual path corre primeiro. |
| **TPV** | `useTPVRestaurantId`: installed device > runtime > `DOCKER_SEED_RESTAURANT_ID`. Pairing de dispositivos existe. | Default literal `DOCKER_SEED_RESTAURANT_ID` (00000000-0000-0000-0000-000000000100). Runtime em Supabase+bypass é seed; sem pairing o TPV usa seed. Não há garantia de que seja o restaurante do user logado no Admin. |
| **KDS** | `KDSMinimal`: restaurantId = installed > runtime > TabIsolated > `SEED_RESTAURANT_ID`. | Mesmo padrão: instalado > runtime > seed. Em Supabase+bypass, runtime é seed; KDS pode mostrar pedidos do seed, não do restaurante do owner. |
| **AppStaff** | Launcher em `/app/staff/home`; restaurante via runtime/tenant. | Depende do mesmo runtime/tenant; em bypass usa seed. Sem garantia de alinhamento com o restaurante do membership. |

---

## 2. Fontes de `restaurant_id` por superfície (após correção P0)

| Superfície | Fonte de `restaurant_id` |
|------------|---------------------------|
| **FlowGate** | Lê `gm_restaurant_members` por `user_id` da sessão; ao obter membership, chama `setActiveTenant(restaurantId)`. |
| **TenantResolver** | `setActiveTenant(tenantId)` grava em TabIsolated + `localStorage.setItem("chefiapp_restaurant_id", tenantId)` e dispara evento `chefiapp:tenant-sealed`. |
| **RestaurantRuntimeContext** | 1) Efeito inicial: `getOrCreateRestaurantId()` (lê localStorage → API ou bypass). 2) Subscreve `chefiapp:tenant-sealed` e chama `refresh()` → `getOrCreateRestaurantId()` lê o id já gravado por FlowGate. |
| **Admin** | `useRestaurantIdentity` / runtime → `runtime.restaurant_id` (sincronizado após evento tenant-sealed). |
| **TPV** | `useTPVRestaurantId`: device instalado > `runtime.restaurant_id` > seed. Runtime unificado = mesmo restaurante. |
| **KDS** | `restaurantId` = instalado > runtime > TabIsolated > seed. Runtime unificado = mesmo restaurante. |
| **AppStaff** | Runtime/tenant; após tenant-sealed o runtime tem o mesmo `restaurant_id`. |

---

## 3. Implementação executada (P0 real)

1. **FlowGate**  
   Quando há sessão e memberships reais (`gm_restaurant_members`), após determinar `hasOrg` e `restaurantId`, chama `setActiveTenant(restaurantId)`. Assim o tenant do utilizador logado é sempre gravado.

2. **TenantResolver.setActiveTenant**  
   Passa a gravar também em `window.localStorage.setItem("chefiapp_restaurant_id", tenantId)` e a disparar `CustomEvent('chefiapp:tenant-sealed', { detail: { tenantId } })`. Assim o RuntimeReader e qualquer consumidor que leia `localStorage` ou reaja ao evento ficam alinhados.

3. **RestaurantRuntimeContext**  
   Subscreve o evento `chefiapp:tenant-sealed` e chama `refresh()`. O `refresh()` chama `getOrCreateRestaurantId()`, que lê primeiro de `localStorage` (já atualizado por FlowGate). O estado do runtime passa a usar o `restaurant_id` do membership.

4. **clearActiveTenant**  
   Passa a remover também `localStorage.removeItem("chefiapp_restaurant_id")` para manter consistência.

Com isto, quando o utilizador faz login e o FlowGate obtém o membership real, o mesmo `restaurant_id` é usado por Admin, TPV, KDS e AppStaff (via runtime e storage).

---

## 4. Quebras principais (anteriores)

1. **Bypass em dev Supabase**  
   `CONFIG.SUPABASE_SKIP_RESTAURANT_API` é `true` por defeito em dev. `getOrCreateRestaurantId()` não chama `gm_restaurant_members` nem `gm_restaurants` e devolve sempre `SEED_RESTAURANT_ID`. O runtime fica com um restaurante fixo, não o do user.

2. **Duas fontes de verdade para restaurant_id**  
   - `RestaurantRuntimeContext` → `getOrCreateRestaurantId()` (com bypass = seed).  
   - FlowGate / TenantResolver → leitura direta de `gm_restaurant_members` + `setActiveTenant(membership.restaurant_id)`.  
   Se FlowGate correr depois e memberships forem lidos com sucesso, o tenant ativo pode ser o real; mas o runtime já foi preenchido com seed. Quem lê primeiro (runtime vs FlowGate) e se as APIs respondem 200 ou 400 determina o resultado.

3. **TPV/KDS/AppStaff usam runtime ou seed**  
   `useTPVRestaurantId`, KDS e AppStaff tomam `restaurant_id` do runtime ou de storage/installed. Com bypass, runtime = seed. Para ser o “mesmo” restaurante do Admin é preciso que o tenant ativo (membership) esteja escrito em storage e que runtime ou leitores usem esse valor; hoje o bypass injecta seed antes de membership poder ser aplicado.

4. **Schema Supabase**  
   Enquanto `gm_restaurants.disabled_at` / `gm_restaurant_members.disabled_at` (ou RLS que as referencie) não estiverem alinhados, chamadas a essas tabelas podem dar 400. O bypass esconde o 400 na resolução inicial mas FlowGate também chama `gm_restaurant_members`; se falhar, não há membership real na UI.

5. **Sem um único caminho verificável**  
   Não existe um único script ou checklist que: crie user+restaurant+membership → faça login → confirme o mesmo `restaurant_id` no Admin, TPV, KDS e AppStaff, sem depender de bypass ou seed fixo.

*(As correções acima mitigam 2 e 3 quando há sessão e membership real.)*

---

## 5. Fluxo soberano desejado

1. **Bootstrap (único e canónico)**  
   - Schema aplicado (gm_companies, gm_restaurants, gm_restaurant_members; colunas opcionais como disabled_at se forem usadas).  
   - `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts` com `SUPABASE_SERVICE_ROLE_KEY`.  
   - Output claro: email, password, user_id, restaurant_id (e company_id se relevante).

2. **Login real**  
   - Utilizador entra em `/auth` ou `/auth/login` com email/password do seed.  
   - JWT enviado em todas as chamadas PostgREST.

3. **Resolução de tenant única**  
   - Sem bypass: `getOrCreateRestaurantId()` em Supabase usa primeiro `gm_restaurant_members`, depois `gm_restaurants`.  
   - TenantResolver/FlowGate leem memberships (gm_restaurant_members) e chamam `setActiveTenant(membership.restaurant_id)`.  
   - Uma única fonte: membership → `chefiapp_restaurant_id` → runtime; Admin, TPV, KDS e AppStaff leem daí.

4. **Admin**  
   - Topbar e páginas mostram o restaurante do membership (owner).  
   - Sem seed fixo quando há sessão e membership.

5. **TPV**  
   - Recebe `restaurant_id` do tenant ativo (ou do device instalado que foi associado a esse restaurante).  
   - Terminal binding: pairing associa o dispositivo ao mesmo `restaurant_id` que o Admin.

6. **KDS**  
   - Provisionado para o mesmo `restaurant_id` (via config/pairing a partir do Admin ou TPV).  
   - Lista pedidos desse restaurante.

7. **AppStaff**  
   - Mesmo JWT e mesmo tenant; entra no mesmo `restaurant_id` sem pilot/trial obrigatório.

8. **Verificável**  
   - E2E ou checklist manual: seed → login → Admin (ver restaurante X) → TPV/KDS/AppStaff (ver mesmo restaurante X e dados consistentes).

---

## 6. Roadmap executável (em ordem)

| Fase | Objetivo | Ações |
|------|----------|--------|
| **P0** | User + restaurant + membership reais e visíveis no Admin | 1) Aplicar migrations no Supabase (incl. disabled_at e gm_companies se ainda não). 2) Correr seed com SUPABASE_SERVICE_ROLE_KEY. 3) Em dev, desativar bypass: `VITE_SUPABASE_SKIP_RESTAURANT_API=false` no .env.local (ou tornar bypass false por defeito quando houver sessão). 4) Validar: login → /admin/config/general e /admin/modules com restaurante do seed (sem 400). 5) Documentar output do seed (email, password, user_id, restaurant_id). |
| **P1** | Admin coerente com membership | 1) Garantir que FlowGate/TenantResolver definem `chefiapp_restaurant_id` a partir de gm_restaurant_members (e que RuntimeReader não sobrescreve com seed quando já existe membership). 2) Ordem de resolução: se há sessão, preferir tenant de memberships; getOrCreateRestaurantId só quando não há sessão ou como fallback explícito. 3) Validar: após login, topbar e páginas Admin mostram o restaurante criado pelo seed. |
| **P2** | TPV e KDS ligados ao mesmo restaurant_id | 1) TPV: garantir que use o tenant ativo (TabIsolated/localStorage) quando não houver device instalado, ou que o pairing associe ao restaurant_id do user. 2) KDS: idem — restaurant_id = tenant ativo ou device instalado para esse tenant. 3) Validar: mesmo user, Admin mostra restaurante X; abrir TPV (e KDS se aplicável) e confirmar que operam sobre X (ex.: criar pedido em X e ver em KDS). |
| **P3** | AppStaff no mesmo tenant | 1) AppStaff a ler restaurant_id do mesmo runtime/tenant (sem pilot/trial obrigatório para este fluxo). 2) Validar: login com user do seed → /app/staff/home com restaurante X. |
| **P4** | Validação E2E integrada | 1) E2E ou script que: seed (ou usa credenciais fixas de teste) → login → verificar restaurante no Admin → (opcional) verificar TPV/KDS/AppStaff com mesmo restaurant_id. 2) Manter contract E2E config-general verde (já coberto com bypass; quando bypass desligado, deve continuar verde com schema correto). |

---

## 7. Como validar o fluxo fim-a-fim

1. **Bootstrap**  
   - Aplicar migrations Supabase (incl. `disabled_at` se necessário).  
   - `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts` com `SUPABASE_SERVICE_ROLE_KEY`.  
   - Guardar email, password, user_id, **restaurant_id** do output.

2. **Portal**  
   - Em `.env.local`: `VITE_SUPABASE_SKIP_RESTAURANT_API=false` para fluxo real (opcional; com schema OK o bypass pode ficar false e a API devolve o id).  
   - `pnpm --filter merchant-portal run dev`.

3. **Login**  
   - Abrir `http://localhost:5175/auth` (ou `/auth/login`), fazer login com o user do seed.

4. **Admin**  
   - Ir a `/admin/config/general` ou `/admin/modules`.  
   - Verificar: topbar mostra o restaurante criado pelo seed (nome correto).  
   - Consola: não deve haver 400 em `gm_restaurant_members`/`gm_restaurants` se schema estiver aplicado; log `[TenantResolver] 🔒 Tenant Sealed: <restaurant_id>`.

5. **TPV**  
   - Abrir a rota do TPV (ex.: `/app/tpv` ou equivalente).  
   - Verificar que o contexto usa o mesmo `restaurant_id` (ex.: pedidos/categorias do mesmo restaurante).

6. **KDS**  
   - Abrir a rota do KDS.  
   - Verificar que lista pedidos do mesmo restaurante.

7. **AppStaff**  
   - Abrir `/app/staff/home`.  
   - Verificar que o launcher/operador está no mesmo tenant/restaurante.

**Checklist rápido:** Login → Admin (ver restaurante X) → TPV → KDS → AppStaff (todos com o mesmo restaurante X).

---

## 8. Estado final do P0 soberano

- **Utilizador real:** criado pelo seed (`seed-e2e-user.ts`) com email/password.
- **Restaurante real:** criado em `gm_restaurants` com `owner_id` = user id.
- **Membership owner real:** uma linha em `gm_restaurant_members` com `role = 'owner'`.
- **Tenant unificado:** FlowGate, ao obter membership, chama `setActiveTenant(restaurantId)`; o valor é gravado em TabIsolated + localStorage e o evento `chefiapp:tenant-sealed` faz o RestaurantRuntimeContext fazer refresh e usar esse id. Admin, TPV, KDS e AppStaff passam a consumir o mesmo `restaurant_id` via runtime/storage.
- **Bypass:** Em dev, se `VITE_SUPABASE_SKIP_RESTAURANT_API=true` (default), a primeira carga pode usar seed até o FlowGate selar o tenant; após o evento, o runtime atualiza para o id real. Para não depender do bypass, usar `VITE_SUPABASE_SKIP_RESTAURANT_API=false` e schema aplicado (migrations com `disabled_at` etc.).

---

## 9. Próximo passo único

**Fechar P0 no teu ambiente:** schema aplicado + seed com service key + bypass desligado em dev para esse projeto.

1. **Supabase:** Aplicar no projeto as migrations que garantem `gm_companies`, `gm_restaurants` (com `company_id` e `disabled_at`), `gm_restaurant_members` (com `disabled_at` se necessário). Executar `NOTIFY pgrst, 'reload schema';` após alterações.
2. **Seed:** No `merchant-portal`, definir `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` e correr `pnpm tsx scripts/seed-e2e-user.ts`. Guardar o output (email, password, user_id, restaurant_id).
3. **Portal:** No `.env.local`, definir `VITE_SUPABASE_SKIP_RESTAURANT_API=false` (para dev usar API e membership real).
4. **Validar:** Reiniciar o dev server, abrir `/auth`, fazer login com o user do seed, ir a `/admin/config/general` e `/admin/modules`. Confirmar que não há 400 e que a topbar mostra o restaurante criado pelo seed (nome e contexto corretos).
5. **Documentar:** No `SEED_OWNER_SOBERANO.md` ou num runbook único, deixar explícito: “Output do seed: email, password, user_id, restaurant_id; usar VITE_SUPABASE_SKIP_RESTAURANT_API=false para fluxo real”.

Quando isto estiver estável, o próximo passo é P1 (garantir uma única fonte de tenant a partir de membership e que Admin/TPV/KDS/AppStaff leem todos o mesmo `restaurant_id`).

---

## 10. Estrutura de trabalho sugerida

- **Branch:** Uma branch de feature, ex.: `feat/fluxo-soberano-p0-p1`, para alterações de resolução de tenant e bypass.
- **Docs:** Este ficheiro (`FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md`) como referência; atualizar `FLUXO_SOBERANO_INTEGRADO.md` e `SEED_OWNER_SOBERANO.md` com o output canónico do seed e a flag `VITE_SUPABASE_SKIP_RESTAURANT_API`.
- **Worktree:** Não obrigatório; um único worktree na branch acima basta para P0/P1.

---

## 11. Bootstrap canónico — output único

O seed `merchant-portal/scripts/seed-e2e-user.ts` já imprime email, password, name, user_id. Para o fluxo soberano ser verificável, o output deve incluir explicitamente **restaurant_id** (e opcionalmente company_id) quando criados em modo SERVICE_KEY. Sugestão: após criar restaurant e membership, fazer `console.log('   Restaurant ID:', restaurantId);` no bloco final. Assim fica um único sítio onde: email, password, user_id, restaurant_id estão documentados no output do comando.

---

## 12. Validação fim a fim e smoke repetível

- **Validação P0:** `docs/ops/P0_SOBERANO_VALIDACAO_FIM_A_FIM.md` (bootstrap, credenciais, evidência por superfície).
- **Smoke flow repetível (P1):** `docs/ops/P0_SOBERANO_SMOKE_FLOW.md` — critérios por superfície, script `pnpm tsx scripts/smoke-sovereign-p0.ts`, one-liner de verificação, troubleshooting. Validação automática (E2E): P2 = mesmo `restaurant_id`; P3 = evidência funcional por superfície; P4 = integração visual Admin→TPV (nome); P4.1 = TPV→KDS (ticket); P4.2–P4.4 = ciclo KDS; **P5 = origens Web/QR Mesa + roteamento por estação (Cozinha/Bar)** — (1) isolado: E2E Burger → Cozinha, E2E Drink → Bar; (2) **pedido misto:** TPV, Web, QR Mesa e **Garçom** (P5 Pedido misto Garçom com `?mode=trial`). Ver §4 e §4.3 do runbook.
- **Origens de pedido e superfícies embutidas:** `docs/ops/SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md`. **Smoke manual por origem:** `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md` — TPV, Web, Garçom, QR Mesa, Uber Eats, Glovo; como disparar, badge no KDS, cozinha/bar; Supabase puro vs delivery-proxy.

---

## 13. Referências

- Seed canónico: `docs/ops/SEED_OWNER_SOBERANO.md`
- Schema Supabase: `docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md`, `supabase/scripts/P0_apply_disabled_at_and_reload.sql`
- Validação Admin: `docs/ops/P02_RELATORIO_VALIDACAO.md`, `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`
- Roadmap P0: `docs/roadmap/FLUXO_SOBERANO_INTEGRADO.md`, `docs/roadmap/PLANO_P0_FLUXO_SOBERANO.md`
- Bypass e config general: `docs/ops/P0_CONFIG_GENERAL_FRENTE_ENCERRADA.md`
- Origens e superfícies: `docs/ops/SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md`

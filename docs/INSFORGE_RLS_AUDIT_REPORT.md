# InsForge RLS Audit Report

**Date:** 2026-02-11
**Scope:** Auditoria de seguranca RLS e migracao do schema base para InsForge.
**Backend:** InsForge (PostgreSQL + PostgREST).

---

## 1. Resumo

- Schema base do Docker Core foi criado no InsForge (tabelas `gm_*`, `saas_tenants`, `restaurant_users`).
- Funcoes de RLS adaptadas para InsForge: `current_user_restaurants()` e `has_restaurant_access(p_restaurant_id)` leem o utilizador do JWT via `request.jwt.claims` (claim `sub` = user id).
- RLS ativado em todas as 8 tabelas publicas; policies tenant-scoped aplicadas (SELECT/INSERT/UPDATE/DELETE por `has_restaurant_access(restaurant_id)`).
- Isolamento entre restaurantes depende de: (1) JWT com claim `sub` = InsForge user id; (2) tabela `restaurant_users` com linhas `(user_id, restaurant_id)`.

**Implementacao do plano de seguranca (2026-02-11):** Funcao `debug_jwt` criada no backend via MCP `run-raw-sql`; RPC `create_order_atomic` ja contem `has_restaurant_access(p_restaurant_id)` no inicio; policy `restaurant_users_insert` removida (`DROP POLICY IF EXISTS`); script E2E em `merchant-portal/scripts/insforge-e2e-rls.ts` com instrucoes e bootstrap minimo na seccao 8; revisao attacker mindset na seccao 9.

---

## 2. Contexto de Auth (InsForge)

- O SDK InsForge devolve `user.id` (ex.: `usr_abc123`) e `accessToken` (JWT).
- PostgREST injecta o JWT nas requests; as policies assumem que o backend define `request.jwt.claims` (JSON) com pelo menos:
  - `sub`: id do utilizador (string, ex. `usr_abc123`).
- Opcional: `restaurant_id` no JWT para fixar um unico restaurante por sessao.

Se o InsForge usar outro nome de setting (ex. `request.jwt.claim.sub`), as funcoes em `current_user_restaurants()` devem ser alteradas para ler esse setting.

---

## 3. Tabelas e RLS

| Tabela             | RLS ativo | Policies (tenant-scoped)                                                                 |
| ------------------ | --------- | ---------------------------------------------------------------------------------------- |
| saas_tenants       | Sim       | SELECT via restaurantes acessíveis                                                       |
| gm_restaurants     | Sim       | SELECT, INSERT, UPDATE, DELETE por `has_restaurant_access(id)`                           |
| gm_menu_categories | Sim       | Idem por `restaurant_id`                                                                 |
| gm_products        | Sim       | Idem por `restaurant_id`                                                                 |
| gm_tables          | Sim       | Idem por `restaurant_id`                                                                 |
| gm_orders          | Sim       | Idem por `restaurant_id`                                                                 |
| gm_order_items     | Sim       | Idem via `restaurant_id` do `gm_orders`                                                  |
| restaurant_users   | Sim       | SELECT/UPDATE/DELETE por `user_id = JWT sub`; INSERT apenas via service role (bootstrap) |

Todas as tabelas têm tambem `project_admin_policy` (ALL) do InsForge para acesso administrativo.

---

## 4. Funcoes RLS

- **`current_user_restaurants()`**
  Devolve os `restaurant_id` a que o utilizador atual (JWT `sub`) tem acesso via `restaurant_users`, mais o `restaurant_id` opcional no JWT.

- **`has_restaurant_access(p_restaurant_id UUID)`**
  Devolve true se o utilizador atual tiver acesso ao restaurante (via `current_user_restaurants()`).

Ambas sao `SECURITY DEFINER` e usam `SET search_path = public`.

- **RPC `create_order_atomic`**
  Exige `has_restaurant_access(p_restaurant_id)` no inicio do corpo; sem JWT valido com `sub` e linha em `restaurant_users` para o restaurante, a chamada falha com `FORBIDDEN: no access to restaurant %`. Assim a RPC nao furar RLS (SECURITY DEFINER nao bypassa esta verificacao).

---

## 5. Como testar isolamento (manual)

O MCP `run-raw-sql` corre com privilegios de admin e ignora RLS. O isolamento deve ser testado com o SDK e um JWT de utilizador:

1. **Registar utilizador A** (ex.: `insforge.auth.signUp`) e obter sessao.
2. **Inserir em `restaurant_users`** (via admin/MCP ou Edge Function) uma linha `(user_id = 'usr_xxx', restaurant_id = <uuid do restaurante A>)`.
3. **Com o cliente SDK autenticado como A**, chamar `insforge.database.from('gm_restaurants').select('*')` — deve devolver apenas restaurantes a que A tem acesso (ex.: restaurante A).
4. **Criar utilizador B** e associar B apenas ao restaurante B.
5. **Autenticado como B**, `from('gm_restaurants').select('*')` deve devolver apenas restaurante B; nao deve ver dados do restaurante A.

Se com anon key sem JWT a API devolver 0 linhas em `gm_restaurants`, as policies estao a bloquear acesso sem utilizador.

---

## 6. Verificacoes executadas

- **Metadata do backend:** 9 tabelas listadas (`gm_menu_categories`, `gm_order_items`, `gm_orders`, `gm_products`, `gm_restaurants`, `gm_tables`, `restaurant_users`, `saas_tenants`).
- **pg_tables:** `rowsecurity = true` em todas as 8 tabelas publicas.
- **pg_policies:** 37 policies no total (incl. 4 por tabela tenant-scoped + `project_admin_policy` onde aplicavel).

---

## 7. Proximos passos recomendados

1. **Confirmar nome do JWT setting no InsForge**
   Se `request.jwt.claims` nao for o correto, actualizar `current_user_restaurants()` e `has_restaurant_access()` (e policies que usam `current_setting('request.jwt.claims', true)::json->>'sub'`).

2. **Bootstrap do primeiro restaurante**
   Inserir um tenant, um restaurante e um `restaurant_users` para o primeiro utilizador (ex. via MCP ou Edge Function com service role).

3. **Teste E2E com JWT**
   Executar o fluxo da seccao 5 no browser ou em testes E2E com SDK autenticado.

4. **Migrar mais tabelas**
   Se for necessario, aplicar o mesmo padrao RLS a tabelas adicionais do Docker Core (ex. `gm_cash_registers`, `gm_payments`, `gm_tasks`) quando forem criadas no InsForge.

---

## 8. Validacao do JWT setting (obrigatorio antes do bootstrap)

O isolamento RLS depende do nome exacto do setting que o InsForge/PostgREST usa para injectar os JWT claims. Se estiver errado, `current_setting('request.jwt.claims', true)` pode ser NULL e as policies nao bloqueiam como esperado.

**Funcao de debug:** Criada no backend via MCP `run-raw-sql` a funcao `public.debug_jwt()` (SECURITY DEFINER, `SET search_path = public`) que devolve `current_setting('request.jwt.claims', true)::json`.

**Como validar:**

1. No frontend (ou script Node com SDK), com o cliente InsForge configurado:

   - **Sem autenticacao:** `const { data } = await insforge.database.rpc('debug_jwt');` — esperado: `data` null ou `{}`.
   - **Apos login** (ex. `insforge.auth.signInWithPassword({ email, password })`): voltar a chamar `insforge.database.rpc('debug_jwt')`. Esperado: objeto JSON com pelo menos `sub` (id do utilizador, ex. `"usr_abc123"`).

2. Se **com auth** o resultado for null ou vazio, o setting no InsForge nao e `request.jwt.claims`. Nesse caso:
   - Verificar na documentacao InsForge/PostgREST qual o nome do setting (ex. `request.jwt.claim.sub` em vez de um JSON global).
   - Actualizar as funcoes `current_user_restaurants()` e `has_restaurant_access()` (e as policies que usam `current_setting('request.jwt.claims', true)::json->>'sub'`) para ler o setting correcto.

**Resultado esperado quando correcto:** `{ "sub": "usr_xxx", ... }`. So depois desta validacao se deve fazer bootstrap e confiar no RLS.

**INSERT em `restaurant_users`:** A policy permissiva de INSERT foi removida. Apenas roles com bypass a RLS (ex. service role / `project_admin_policy`) podem inserir em `restaurant_users`. O bootstrap do primeiro restaurante e membros deve ser feito via MCP `run-raw-sql` (admin) ou Edge Function com credenciais de servico; utilizador comum nao pode auto-atribuir acesso.

**Script E2E com SDK:** [merchant-portal/scripts/insforge-e2e-rls.ts](../merchant-portal/scripts/insforge-e2e-rls.ts). Execucao: `cd merchant-portal && npx tsx scripts/insforge-e2e-rls.ts`. Variaveis obrigatorias: `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY`. Opcionais (E2E completo): `INSFORGE_E2E_EMAIL`, `INSFORGE_E2E_PASSWORD`, `INSFORGE_E2E_RESTAURANT_A_ID`, `INSFORGE_E2E_RESTAURANT_B_ID`. O script cobre: (1) debug_jwt sem auth vs com auth (sub); (2) isolamento SELECT em `gm_restaurants`; (3) create_order_atomic(restaurante proprio) sucesso; (4) create_order_atomic(restaurante alheio) rejeicao FORBIDDEN.

**Bootstrap minimo para E2E completo:** Criar dois utilizadores (ex.: `insforge.auth.signUp`), dois restaurantes (via MCP `run-raw-sql` ou service role), e duas linhas em `restaurant_users` (user A -> restaurant A, user B -> restaurant B). Definir `INSFORGE_E2E_EMAIL` e `INSFORGE_E2E_PASSWORD` com as credenciais do user A; `INSFORGE_E2E_RESTAURANT_A_ID` e `INSFORGE_E2E_RESTAURANT_B_ID` com os UUIDs dos dois restaurantes.

---

## 9. Revisao de seguranca (attacker mindset)

Ameacas e mitigoes aplicadas:

| Ameaca                                                                                                                                                   | Mitigacao                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JWT setting errado ou NULL** — RLS nao bloqueia; policies devolvem vazio ou falham em silencio.                                                        | Funcao `debug_jwt()` para validar o setting; documentacao de validacao (seccao 8); ajuste das funcoes RLS ao nome real do setting no InsForge.      |
| **RPC SECURITY DEFINER sem verificacao** — Chamada a `create_order_atomic(restaurant_id_alheio, items)` cria pedidos noutro restaurante (bypass do RLS). | Verificacao explicita no inicio da RPC: `IF NOT has_restaurant_access(p_restaurant_id) THEN RAISE EXCEPTION 'FORBIDDEN: ...'`.                      |
| **Utilizador auto-atribuir acesso** — Inserir linha em `restaurant_users` para si ou para outros.                                                        | Policy de INSERT em `restaurant_users` removida; apenas service role / `project_admin_policy` podem inserir (bootstrap via admin ou Edge Function). |
| **Anon key exposta no frontend** — Esperado; risco e acesso indevido a dados.                                                                            | RLS em todas as tabelas sensiveis; policies tenant-scoped; nenhuma tabela critica sem policy; JWT obrigatorio para acesso a dados.                  |
| **Leitura cross-tenant** — User A ver dados do restaurante B.                                                                                            | Policies SELECT com `has_restaurant_access(restaurant_id)`; E2E com dois utilizadores e dois restaurantes para validar isolamento.                  |

Referencias cruzadas: RPC (create_order_atomic), restaurant_users (INSERT apenas service role), JWT (debug_jwt e seccao 8), E2E (script insforge-e2e-rls.ts).

---

## 10. RLS VERIFIED (E2E PASSED)

**Momento da verdade:** So apos rodar o script E2E com credenciais reais se pode declarar o isolamento validado.

**Comando:** `cd merchant-portal && npx tsx scripts/insforge-e2e-rls.ts`

**Variaveis:** `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY`; para E2E completo: `INSFORGE_E2E_EMAIL`, `INSFORGE_E2E_PASSWORD`, `INSFORGE_E2E_RESTAURANT_A_ID`, `INSFORGE_E2E_RESTAURANT_B_ID`.

**Checklist (preencher quando o E2E passar):**

- [ ] debug_jwt() sem auth — resultado null ou vazio
- [ ] debug_jwt() com auth — objeto contem `sub` (ex. `"usr_xxx"`)
- [ ] SELECT gm_restaurants (user A) — apenas restaurante(s) a que A tem acesso
- [ ] create_order_atomic(restaurant_A_id, items) — sucesso
- [ ] create_order_atomic(restaurant_B_id, items) — erro FORBIDDEN (ou equivalente)

Quando todos os itens estiverem assinalados, marcar abaixo:

**Estado:** [ ] RLS CONFIGURADO | [ ] RLS VERIFIED (E2E PASSED)

**Data da verificacao E2E:** _preencher apos execucao_

---

## 11. Baseline v1 (schema de migracao)

Apos E2E validado, recomenda-se congelar o schema InsForge como baseline v1: base de confianca para futuras migracoes e auditorias. Opcional: criar tag de versao (ex. `insforge-schema-v1`) no repositorio no commit que contém os ficheiros SQL ou a documentacao que descreve este schema.

---

**Relatorio gerado no ambito do plano de auditoria RLS InsForge (auditoria-rls-insforge).**

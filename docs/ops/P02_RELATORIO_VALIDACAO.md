# Relatório P0.2 — Fluxo soberano no Admin (Supabase/Core)

**Data:** 2026-03-10  
**Objetivo:** Executar o P0.2 do fluxo soberano integrado: validar que o owner seeded consegue autenticar no Admin e que o restaurante correto aparece ligado à mesma identidade.

---

## 1. Estado verificado

- **P0.1:** Seed canónico (`merchant-portal/scripts/seed-e2e-user.ts`) cria user real em Supabase Auth + company + restaurant + membership `owner`. Documentação em `docs/ops/SEED_OWNER_SOBERANO.md` e `docs/roadmap/FLUXO_SOBERANO_INTEGRADO.md`.
- **Portal:** O merchant-portal estava configurado apenas para auth via **Keycloak** (redirect OIDC). Não existia caminho de login por email/palavra-passe contra Supabase Auth. Por isso, o utilizador criado pelo seed **não conseguia** entrar no Admin.
- **Backend:** `CONFIG.CORE_URL` e `CONFIG.CORE_ANON_KEY` já aceitam `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; o PostgREST usado é o do Supabase quando essas variáveis apontam para um projeto Supabase. O fetch client **não** enviava o JWT do utilizador (Authorization: Bearer), pelo que as chamadas à API não refletiam a identidade do user para RLS.

---

## 2. Quebra encontrada

1. **Auth:** Só existia fluxo Keycloak. Com backend Supabase (URL com `supabase.co`), não havia login por email/palavra-passe nem leitura de sessão Supabase.
2. **API autenticada:** O cliente PostgREST (`dockerCoreFetchClient`) usava apenas `apikey` (anon); não anexava o token da sessão. Logo, o tenant/membership não era resolvido no contexto do user autenticado (RLS/tenant por JWT).
3. **UI de login:** Em `/auth` e `/auth/login`, com backend Supabase, não era mostrado formulário de email/palavra-passe; o utilizador era direcionado para Keycloak ou trial/piloto.

---

## 3. Implementação executada

### 3.1 Deteção de backend Supabase

- **`merchant-portal/src/config.ts`:** Adicionado `CONFIG.isSupabaseBackend` (getter): `true` quando `CORE_URL` contém `supabase.co`.

### 3.2 Módulo de auth Supabase

- **`merchant-portal/src/core/auth/supabaseAuth.ts`** (novo):
  - Cliente Supabase lazy (`createClient(CONFIG.CORE_URL, CONFIG.CORE_ANON_KEY)`).
  - `getSupabaseSession()` → devolve sessão mapeada para `CoreSession`/`CoreUser`.
  - `signInWithPasswordSupabase(email, password)`.
  - `signOutSupabase()`.
  - `onSupabaseAuthStateChange(callback)` para o AuthProvider reagir a login/logout.
  - Mapeamento de user Supabase para `CoreUser` (incl. `user_metadata.name`).

### 3.3 Sessão e provider

- **`getCoreSession.ts`:** Se `CONFIG.isSupabaseBackend`, devolve `getSupabaseSession()`; caso contrário mantém Keycloak/mock.
- **`AuthProvider.tsx`:** Se `CONFIG.isSupabaseBackend`, usa `getSupabaseSession()` e `onSupabaseAuthStateChange` para definir sessão/user; subscreve alterações de auth.
- **`authAdapter.ts`:** Se `CONFIG.isSupabaseBackend`, `signIn(email?, password?)` chama `signInWithPasswordSupabase`; `signOut()` chama `signOutSupabase()`.

### 3.4 UI de login

- **`AuthPage.tsx`:** Com `CONFIG.isSupabaseBackend`, mostra formulário de entrada (email + palavra-passe) e submete com `getAuthActions().signIn(email, password)`. Redirecionamento pós-login: `getLastRoute()` inclui `/admin/modules` e `/admin/home`; default para Supabase é `/admin/modules`.
- **`LoginPage.tsx`:** Com `CONFIG.isSupabaseBackend`, mostra formulário email/palavra-passe em vez do botão Google; submit chama `signIn(email, password)`.

### 3.5 Token JWT nas chamadas Core

- **`dockerCoreFetchClient.ts`:** Em `run()` (tabelas) e em `rpc()`, passa a obter sessão com `getCoreSessionAsync()`. Se existir `session.access_token`, adiciona header `Authorization: Bearer <token>` a todas as requisições PostgREST. Assim, Supabase RLS e tenant resolution usam o utilizador autenticado.

### 3.6 Dependência

- **`merchant-portal/package.json`:** Adicionada dependência `@supabase/supabase-js` (^2.38.0) para auth e cliente Supabase.

### 3.7 Documentação

- **`docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`:** Atualizado passo 2 para explicar que, com `VITE_SUPABASE_URL` (com `supabase.co`), o portal usa login email/palavra-passe e onde aparece o formulário.

---

## 4. Validação

Para validar o P0.2 no ambiente local:

1. **Instalar dependências:** `pnpm install` (na raiz ou `pnpm install --filter merchant-portal`).
2. **Configurar env:** Em `merchant-portal/.env.local`, definir `VITE_SUPABASE_URL` (ex.: `https://<projeto>.supabase.co`) e `VITE_SUPABASE_ANON_KEY`.
3. **Seed:** `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts` (com `SUPABASE_SERVICE_ROLE_KEY` ou `VITE_SUPABASE_ANON_KEY` conforme o script). Anotar email e palavra-passe.
4. **Portal:** `pnpm --filter merchant-portal run dev`; abrir `http://localhost:5175`.
5. **Login:** Ir a `/auth` ou `/auth/login`; deve aparecer o formulário de email/palavra-passe. Inserir as credenciais do seed e submeter.
6. **Admin:** Após login, redirecionamento para `/admin/modules` (ou `/admin/home`). Na topbar deve constar o nome do utilizador (ex. "Sovereign Tester") e o restaurante criado pelo seed; no perfil, papel `owner` (ou equivalente). O tenant deve ser resolvido via membership real (TenantContext com JWT).

Se algum passo falhar (login, redirect, topbar, restaurante, papel), verificar: env igual ao do seed, RLS/policies no Supabase para `gm_restaurant_members`/`gm_restaurants`, e ausência de `chefiapp_pilot_mode`/`chefiapp_trial_mode` que forcem contexto mock.

---

## 5. Estado final do P0.2

- **Fechado em código:** Sim. O portal, quando configurado com `VITE_SUPABASE_URL` contendo `supabase.co`, passa a ter:
  - Login por email/palavra-passe (Supabase Auth).
  - Sessão e AuthProvider alinhados com Supabase.
  - PostgREST a receber o JWT do utilizador (tenant/membership e RLS corretos).
  - Redirecionamento pós-login para Admin e formulários de login adequados em `/auth` e `/auth/login`.

- **O que falta para considerar P0.2 validado de ponta a ponta:**
  - Execução local pelo utilizador: instalar deps, configurar `.env.local`, correr o seed, abrir o portal e seguir os passos de validação acima.
  - Confirmar no Supabase que as policies permitem ao user autenticado ler `gm_restaurant_members` e `gm_restaurants` (e, se aplicável, `gm_organizations`) para o seu `auth.uid()`.

Resumo: a **implementação** do P0.2 está fechada; a **validação operacional** (runbook + checklist em `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`) deve ser executada no ambiente real com projeto Supabase e seed para confirmar que o owner seeded entra no Admin e vê o restaurante e o papel corretos.

---

## 6. Validação operacional (execução 2026-03-10)

### 6.1 O que foi executado

- **Dependências:** Adicionada `@supabase/functions-js` ao `merchant-portal` (exigida por `@supabase/supabase-js` em runtime Node para o script de seed). `pnpm install` concluído com sucesso.
- **Configuração:** Criado `merchant-portal/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (valores do projeto em `.env.production`) para o portal usar Supabase como CORE e exibir login email/password.
- **Seed:** Executado `pnpm tsx scripts/seed-e2e-user.ts` a partir de `merchant-portal`. O script carregou `.env.local` (dotenv). **Resultado:** user criado via `signUp` (modo Anon), mas **sem sessão** porque o projeto Supabase tem "Confirm email" ativo; o script terminou com: *"User created but NOT confirmed (No Session). CRITICAL: Cannot proceed with E2E unless Enable Email Confirmations is OFF in Supabase."* Com Anon Key o seed **não** insere em `gm_companies`, `gm_restaurants` nem `gm_restaurant_members`.

### 6.2 Quebra identificada

- Para **fechar a validação operacional** é necessário que o seed crie **user + company + restaurant + membership**. Isso só acontece com **SUPABASE_SERVICE_ROLE_KEY** no `.env.local` (ou com "Confirm email" desativado no Supabase e lógica alternativa para criar company/restaurant via triggers, não implementada). Sem service key, não há owner/restaurante/membership para validar no Admin.

### 6.3 Correções aplicadas

- **`merchant-portal/package.json`:** Inclusão de `@supabase/functions-js` para o seed correr em Node.
- **`docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`:** Passo 1 atualizado: indicar que para P0.2 completo é necessário `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` e explicar o comportamento com apenas anon key.
- **`docs/ops/SEED_OWNER_SOBERANO.md`:** Pré-requisitos atualizados: deixar explícito que company/restaurant/membership exigem `SUPABASE_SERVICE_ROLE_KEY`.

### 6.4 Passos para fechar a validação (utilizador)

1. **Obter Service Role Key:** Supabase Dashboard → Project Settings → API → `service_role` (secret).
2. **Adicionar ao `.env.local`:** `SUPABASE_SERVICE_ROLE_KEY=<cola_a_chave>` (apenas em ambiente local; não commitar).
3. **Correr o seed de novo:** `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`. Deve imprimir user + company + restaurant + membership e email/password.
4. **Subir o portal:** `pnpm --filter merchant-portal run dev`. Na consola do browser confirmar `[CONFIG] Loaded { ..., isSupabaseBackend: true }`.
5. **Login:** Abrir `http://localhost:5175/auth` ou `/auth/login`, preencher email e password do seed, submeter.
6. **Validar em `/admin/modules`:** Topbar com nome do utilizador (ex. "Sovereign Tester"), restaurante (ex. "Sovereign Burger Hub"), papel `owner`; tenant resolvido pela membership real (sem pilot/trial).

### 6.5 Estado final do P0.2

- **Código e config:** Prontos. Portal com Supabase no `.env.local` usa login email/password, JWT nas requests, e prioridade Supabase quando `VITE_SUPABASE_URL` contém `supabase.co`.
- **Validação operacional fechada:** Ainda não. Falta executar o seed com `SUPABASE_SERVICE_ROLE_KEY`, fazer login no browser e confirmar topbar + restaurante + papel. Quando isso for feito, P0.2 está **fechado**.

---

### 6.6 Bloqueio de schema (gm_companies em falta)

- **Problema:** O seed com Service Key criou o user mas falhou em "Company create failed: Could not find the table 'public.gm_companies' in the schema cache". O projeto Supabase usado localmente **não tinha** a tabela `gm_companies` (nem a coluna `company_id` em `gm_restaurants`).
- **Causa:** O baseline (`supabase/migrations/20260222111218_baseline_existing_production_schema.sql`) cria `gm_restaurants` e `gm_restaurant_members`, mas **não** cria `gm_companies`. O seed foi escrito para inserir em `gm_companies` e depois em `gm_restaurants` com `company_id`.
- **Solução aplicada:**
  - Nova migration: **`supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql`** — cria `gm_companies`, adiciona `company_id` a `gm_restaurants` e define RLS/grants.
  - Runbook: **`docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md`** — descreve as migrations necessárias, a ordem de aplicação e como alinhar o projeto Supabase (e.g. `supabase db push` ou SQL no Dashboard).
  - **`docs/ops/SEED_OWNER_SOBERANO.md`** atualizado com pré-requisito de schema e link para o runbook.
- **Próximo passo após aplicar o schema:** Aplicar as migrations no Supabase (incluindo a nova), depois correr de novo o seed; em seguida validar login e Admin.

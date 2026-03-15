## Fluxo Soberano Integrado — ChefiApp (Dev Local)

### 1. Objetivo

Garantir um **fluxo soberano, integrado e verificável** em ambiente local em que:

- um **utilizador real** existe no sistema de auth;
- esse utilizador **possui um restaurante real** via membership explícito;
- o mesmo **tenant/restaurante** é usado de forma consistente em:
  - Admin (merchant portal),
  - TPV (desktop),
  - KDS,
  - AppStaff (web/mobile);
- operações críticas (ex.: criação de pedidos no TPV) funcionam fim a fim contra o Core.

Tudo isto deve acontecer sem depender de mocks opacos nem de flags soltas (`pilot_mode`, `trial_mode`) para este fluxo específico.

**Backend canónico (decisão):** Para executar o fluxo soberano com o mínimo de risco e o mais cedo possível, adoptou-se a **Opção A — Supabase/Core** como caminho canónico. O seed em `merchant-portal/scripts/seed-e2e-user.ts` e a doc em `docs/ops/SEED_OWNER_SOBERANO.md` cobrem este path. O "irmão" Docker Core + Keycloak pode ser fechado depois, sem bloquear a execução principal.

---

### 2. Estado atual (por superfície)

#### 2.1 Auth / Identidade

- **Real**
  - **Supabase (fluxo soberano P0):** Quando `VITE_SUPABASE_URL` contém `supabase.co`, o portal usa **Supabase Auth**: login email/palavra-passe em `/auth` e `/auth/login`, sessão e JWT enviados ao PostgREST. Ver `supabaseAuth.ts`, `AuthProvider`, `authAdapter`, `getCoreSession.ts`.
  - Auth em dev (Docker Core) é **Keycloak**, consumido via `authKeycloak.ts` + `AuthProvider`.
  - Sessão chega à UI através de `useAuth()` e alimenta:
    - `AdminTopbar` (nome/papel do operador),
    - `TenantContext` (resolução do membership).
  - Logout OIDC está funcional:
    - URL correta,
    - redirect (agora para `/auth`),
    - sem diálogo nativo “Leave site?”,
    - sessão limpa (sem reauth de pilot/trial),
    - contrato E2E verde (`logout-flow.spec.ts`).
- **Mock / parcial**
  - `trial_mode` e `pilot_mode` existem para fluxo de DEV/AUTO-PILOT.
  - Ainda é possível entrar no sistema sem passar por login real de Keycloak (ex.: pilot/trial).

#### 2.2 Tenant / Ownership / Memberships

- **Real**
  - Tabela `gm_restaurant_members` representa memberships (owner/manager/...).
  - **Fluxo soberano P0 (implementado):** FlowGate lê `gm_restaurant_members` por `user_id` da sessão e chama `setActiveTenant(restaurantId)`. `setActiveTenant` grava em TabIsolated + `localStorage` e dispara o evento `chefiapp:tenant-sealed`. RestaurantRuntimeContext subscreve o evento e chama `refresh()`, passando a usar o mesmo `restaurant_id`. Admin, TPV, KDS e AppStaff consomem esse id via runtime. Ver `docs/ops/FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md` §2–3.
  - `TenantContext` recebe `tenantId` a partir de runtime, armazenamento tab-isolated e memberships.
- **Mock / parcial**
  - Em dev com bypass (`VITE_SUPABASE_SKIP_RESTAURANT_API=true`), a primeira carga pode usar seed até o FlowGate selar o tenant; após o evento, o runtime atualiza para o id real.
  - Há caminhos que fixam `chefiapp_restaurant_id` diretamente (bootstrap, pilot, trial).

#### 2.3 Seed / Bootstrap

- **Canónico (Supabase/Core):** Existe comando único para owner + restaurante + membership:
  - `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`
  - Doc: `docs/ops/SEED_OWNER_SOBERANO.md`.
- Continuam a existir outros seeds (Sofia, TRIAL, stress, etc.) para outros fins; o fluxo soberano usa o seed canónico acima.

#### 2.4 Admin

- **Estado bom**
  - Shell Admin alinhada:
    - sidebar = marca + navegação,
    - topbar = restaurante atual + operador,
    - dropdown do operador com ações de conta e logout.
  - Gestão de módulos e dispositivos:
    - CTAs consistentes (Manage devices, Configure, etc.),
    - página de devices com pairing TPV.
  - Logout do Admin:
    - limpa sessão,
    - faz redirect para `/auth`,
    - topbar passa a mostrar “Sessão encerrada”.
- **Fragilidades**
  - Admin ainda pode ser alimentado por restaurante “solto” (seed/flag) se não houver owner definido para este fluxo.

#### 2.5 TPV / Desktop

- **Real**
  - App Electron abre, carrega TPV e comunica com Core (RPCs via PostgREST).
  - Pairing de dispositivos existe (`create_device_pairing_code`, tokens, deep links).
- **Quebras**
  - RPCs críticas como `create_order_atomic` nem sempre estão disponíveis/configuradas no Core local → 404 em dev.
  - Registo do esquema `chefiapp-pos://` depende da instalação local do bundle, o que é correto mas exige passos manuais claros.

#### 2.6 KDS

- **Real / parcial**
  - Conceito de KDS já existe (device type, páginas mínimas).
  - KDS é conceptualizado como extensão do TPV (configuração a partir do TPV).
- **Quebras**
  - Fluxo de configuração/provisionamento de KDS ainda não está fechado fim a fim em dev.

#### 2.7 AppStaff

- **Real**
  - AppStaff web em `/app/staff/home` segue o Canon (launcher, shell única).
  - Restaurante chega via runtime/tenant.
- **Parcial**
  - Ligação entre o mesmo utilizador do Admin e o operador do AppStaff ainda depende de:
    - pilot/trial,
    - seeds,
    - fluxos de auth não unificados entre web/mobile.

---

### 3. Quebras principais

1. **Dois mundos de auth em DEV**  
   Keycloak real e pilot/trial (mock) coexistem; para este fluxo soberano é necessário um caminho único e claro.

2. **Restaurante “sem dono” em alguns caminhos**  
   `chefiapp_restaurant_id` pode vir de seed/flag, não necessariamente de `gm_restaurant_members`.

3. **Seed disperso**  
   Vários scripts criam dados, mas não há um bootstrap único com owner+restaurant+membership.

4. **TPV não garante ciclo completo**  
   Falta garantir RPCs mínimas (`create_order_atomic`, etc.) e migrations aplicadas no docker-core.

5. **KDS/AppStaff dependem de TPV/tenant mas sem verificação canónica**  
   Podem aparecer “bonitos” sem que o ciclo completo esteja a funcionar.

---

### 4. Fluxo soberano desejado (local)

1. **Core + Keycloak a correr**
   - `docker-compose -f docker-core/docker-compose.core.yml up -d`
   - Healthcheck Core OK, Keycloak acessível em `http://localhost:8080`.

2. **Seed canónico OWNER + RESTAURANTE + MEMBERSHIP**
   - Script único (ex.: `pnpm core:seed-owner-soberano`) que:
     - cria utilizador real (email/password) no provider de auth (Keycloak/Core),
     - cria restaurante real,
     - cria linha em `gm_restaurant_members` com `role = 'owner'`.

3. **Login real via Keycloak**
   - Navegar para `/auth/login`,
   - autenticar com utilizador seeded,
   - voltar para Admin com:
     - topbar a mostrar owner,
     - `TenantContext` a usar membership para escolher restaurante.

4. **Admin Modules/Devices como centro de controlo**
   - Em `/admin/modules`, módulo TPV → “Manage devices” → `/admin/devices?type=tpv` (ou `/admin/devices/tpv`).
   - Página de devices TPV:
     - criar terminal TPV,
     - gerar pairing code.

5. **TPV desktop emparelhado**
   - Instalar ou correr TPV Electron em dev,
   - introduzir pairing code ou usar deep link `chefiapp-pos://setup?...`,
   - TPV liga-se ao mesmo restaurante/tenant e passa a listar menu/categorias corretos.

6. **TPV operativo fim a fim**
   - Criar pedido no TPV → RPC `create_order_atomic` OK,
   - pedido aparece no Core (e.g., visível em relatórios ou através de uma consulta simples).

7. **KDS integrado**
   - Do TPV: adicionar KDS (gera pairing code KDS),
   - KDS liga-se ao mesmo restaurante e mostra tickets produzidos pelo TPV.

8. **AppStaff alinhado**
   - AppStaff (web/mobile) autentica com o mesmo user,
   - tarefas/flows referem-se ao mesmo restaurante/tenant.

---

### 4.1 Bootstrap em 5 passos (Supabase/Core)

Para pôr o fluxo soberano a correr no ambiente local com Supabase:

1. **Schema** — Aplicar migrations (incl. `gm_companies` + `company_id` em `gm_restaurants`):
   - `cd merchant-portal && pnpm tsx scripts/apply-sovereign-schema.ts`  
   - Ou: Supabase Dashboard → SQL Editor → executar `supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql`.  
   - Ver `docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md`.

2. **Env** — Em `merchant-portal/.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; para aplicar schema remoto: `DATABASE_URL`.

3. **Seed** — Criar owner + company + restaurant + membership:
   - `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`  
   - Guardar email/password impressos.

4. **Portal** — `pnpm --filter merchant-portal run dev` → abrir `http://localhost:5175/auth`.

5. **Login** — Autenticar com o user do seed → ir a `/admin/modules` e validar topbar (nome, restaurante, papel owner).

Comandos resumidos (após schema e env configurados):

```bash
cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts
pnpm --filter merchant-portal run dev
# Browser: http://localhost:5175/auth → login → /admin/modules
```

Smoke-test das RPCs TPV (P0.4): `cd merchant-portal && pnpm tsx scripts/smoke-tpv-rpcs.ts`.

Plano detalhado dos P0: `docs/roadmap/PLANO_P0_FLUXO_SOBERANO.md`.

---

### 5. Backlog executável

#### P0 — Fluxo soberano mínimo

- **P0.1 — Seed canónico OWNER + RESTAURANTE + MEMBERSHIP**
  - **Estado:** implementado para backend Supabase/Core via `merchant-portal/scripts/seed-e2e-user.ts`.
  - Doc operacional: `docs/ops/SEED_OWNER_SOBERANO.md`.
  - **Pré-requisito de schema:** O projeto Supabase deve ter as tabelas `gm_companies`, `gm_restaurants` (com coluna `company_id`) e `gm_restaurant_members`. Ver `docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md` — migrations em `supabase/migrations/` (baseline + `20260328000000_gm_companies_sovereign_flow.sql`), e.g. `supabase db push`.
  - Comando canónico:
    - `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`
  - Output:
    - imprime email/password/name/user_id,
    - garante (em modo SERVICE_KEY) `gm_companies`, `gm_restaurants` e `gm_restaurant_members` com `role = 'owner'`.

- **P0.2 — Validar fluxo soberano no Admin com user seeded (Supabase/Core) e preparar TPV/KDS**
  - **Estado:** implementação fechada; validação operacional em runbook.
  - Relatório: `docs/ops/P02_RELATORIO_VALIDACAO.md`. Runbook: `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`.
  - Com backend canónico Supabase/Core (`VITE_SUPABASE_URL` com `supabase.co`):
    1. Usar o seed canónico (`cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`).
    2. Validar login real no Admin (credenciais impressas pelo seed).
    3. Provar que o restaurante aparece ligado ao owner na topbar e em Módulos.
    4. Preparar o caminho para Devices / TPV pairing (próximo elo).
  - Runbook de validação: `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`.

- **P0.3 — TenantContext via membership como fonte única**
  - **Estado:** implementado. Em modo soberano (`CONFIG.isSupabaseBackend`): sem sessão → erro claro "Inicie sessão para aceder ao restaurante."; sem memberships → erro "Nenhum restaurante associado a esta conta. Execute o seed canónico ou contacte o administrador.". Sem bypass debug/trial quando Supabase.

- **P0.4 — TPV fim a fim com RPCs mínimas**
  - **Estado:** implementado. Script `merchant-portal/scripts/smoke-tpv-rpcs.ts` testa `create_order_atomic` (e opcionalmente `create_device_pairing_code` se existir no schema). Comando: `cd merchant-portal && pnpm tsx scripts/smoke-tpv-rpcs.ts`. Supabase baseline inclui `create_order_atomic`; `create_device_pairing_code` pode exigir migration adicional para pairing TPV.

- **P0.5 — Docs operacionais mínimas**
  - **Estado:** implementado. `docs/ops/SEED_OWNER_SOBERANO.md` cobre seed, login e Admin/Modules. `FLUXO_SOBERANO_INTEGRADO.md` inclui secção "4.1 Bootstrap em 5 passos" com comandos finais e referência ao smoke-test e ao plano P0 (`docs/roadmap/PLANO_P0_FLUXO_SOBERANO.md`).

#### P1 — Estabilização

- **P1.1 — KDS integrado**
  - Fechar fluxo: criar/configurar KDS via TPV,
  - garantir que tickets aparecem no KDS para o mesmo restaurante.

- **P1.2 — AppStaff alinhado ao fluxo soberano**
  - Garantir path único de auth (Keycloak),
  - remover dependência de pilot/trial para este fluxo.

- **P1.3 — E2E integrado**
  - Criar teste forte (ex.: `tests/e2e/core/fluxo-soberano.core.spec.ts`) que percorre:
    - seed → login → Admin → criar TPV → (simulação de pedido) → verificar efeitos no Core.

#### P2 — Polish / DX / Docs

- **P2.1 — UX pós-logout refinada**
  - Pós-logout cair em `/auth` com copy clara de sessão encerrada.

- **P2.2 — Script one-command**
  - `pnpm fluxo:soberano`:
    - sobe docker-core,
    - aplica migrations necessárias,
    - corre seed soberano,
    - abre browser em `/auth/login`.

- **P2.3 — Documentação consolidada**
  - `docs/ops/FLUXO_SOBERANO_QUICKSTART.md`:
    - passo a passo em < 10 passos,
    - comandos copy-paste,
    - troubleshooting básico.

---

### 6. Definition of Done (Fluxo Soberano)

Consideramos o fluxo soberano **DONE** quando, em ambiente local, for possível:

1. Correr **um único comando de bootstrap** (ou sequência simples) que:
   - sobe docker-core,
   - cria owner soberano + restaurante + membership.
2. Autenticar via `/auth/login` com o utilizador seeded e:
   - ver o restaurante correto no Admin,
   - ver o operador correto na topbar.
3. A partir do Admin:
   - criar um terminal TPV,
   - gerar pairing code,
   - emparelhar um TPV desktop real.
4. No TPV:
   - criar um pedido simples,
   - confirmar (via Core ou outra superfície) que o pedido foi criado com sucesso.
5. Opcional mas desejável para DoD completo:
   - configurar KDS e ver tickets vindos do TPV,
   - abrir AppStaff (web ou mobile) com o mesmo utilizador/tenant.
6. Todos os passos acima:
   - documentados,
   - reproduzíveis por outra pessoa da equipa,
   - com pelo menos 1 teste E2E automatizado cobrindo o caminho crítico.


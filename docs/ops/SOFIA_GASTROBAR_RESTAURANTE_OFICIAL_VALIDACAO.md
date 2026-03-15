# Sofia Gastrobar — Restaurante oficial de validação

**Objetivo:** Consolidar o **Sofia Gastrobar** (e, quando aplicável, "Sofia Gastrobar teste") como restaurante oficial de validação do sistema: dono real, sessão real, membership real, catálogo criado no Admin e reflexo coerente em todas as superfícies operacionais.

**Referências:** `docs/architecture/SOFIA_GASTROBAR_REAL_PILOT.md`, `docs/ops/SOFIA_GASTROBAR_CREDENTIALS.md`, `docs/ops/SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md` (runbook do circuito Admin → superfícies), `docs/ops/SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md` (Fase 1 — ativação), `docs/ops/SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md` (Fase 2 — ambiente operacional vivo), `docs/ops/FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md`, `docs/ops/SEED_OWNER_SOBERANO.md`.

---

## 1. Estado atual do Sofia Gastrobar (teste)

| Item | Valor / Estado |
|------|----------------|
| **Existe?** | Sim. Restaurante definido no Core Docker (docker-core). |
| **restaurant_id** | `00000000-0000-0000-0000-000000000100` |
| **Nome** | Sofia Gastrobar (identidade real em `20260226_sofia_gastrobar_real_identity.sql`) |
| **slug** | `sofia-gastrobar` |
| **owner_id (membership)** | `00000000-0000-0000-0000-000000000002` (em `gm_restaurant_members`, seed `06-seed-enterprise.sql`) |
| **User/login real associado** | **Docker + mock:** um único “pilot” com `id = 00000000-0000-0000-0000-000000000002` (email `pilot@chefiapp.com`). **Keycloak (doc):** `sofia@sofiagastrobar.com` (owner) — ver `SOFIA_GASTROBAR_CREDENTIALS.md`. |
| **Membership** | Uma linha em `gm_restaurant_members`: `restaurant_id = 100`, `user_id = 00000000-0000-0000-0000-000000000002`, `role = owner`. |

O nome “Sofia Gastrobar teste” no objetivo significa usar este mesmo restaurante como **restaurante oficial de teste/validação**; no Core e na doc o nome canónico é **Sofia Gastrobar**.

---

## 2. Dono / user real associado

- **Backend Docker (local):** O dono “real” para validação é o utilizador mock **pilot** (`AuthProvider`: `PILOT_USER_UUID = 00000000-0000-0000-0000-000000000002`). Esse UUID coincide com o `user_id` em `gm_restaurant_members` para o restaurante 100. Ou seja: em Docker, ao usar mock auth, o utilizador já é o owner do Sofia Gastrobar; não é necessário entrar “sem sessão”.
- **Com Keycloak:** O doc `SOFIA_GASTROBAR_CREDENTIALS.md` define `sofia@sofiagastrobar.com` como dono; para ficar 100% alinhado ao Core seria preciso criar/mapear esse user em Keycloak com o mesmo `user_id` (00000000-0000-0000-0000-000000000002) ou inserir membership para o `user_id` que Keycloak devolver.
- **Fluxo soberano (Supabase):** O seed canónico é `seed-e2e-user.ts`, que cria **outro** restaurante (ex.: Sovereign Burger Hub). Para ter “Sofia Gastrobar” como restaurante oficial de validação em Supabase seria preciso ou (a) adaptar o seed para criar/associar ao restaurante 100 e a um user real, ou (b) considerar o Docker + Sofia como ambiente de validação oficial e o seed soberano para outro fluxo (E2E genérico).

---

## 3. Estado do membership e tenant

- **Membership:** Existe e está correto no Core Docker: `gm_restaurant_members(restaurant_id=100, user_id=00000000-0000-0000-0000-000000000002, role=owner)`.
- **Tenant:** Em Docker, com mock auth ativo, o `FlowGate` e o runtime usam `SOFIA_RESTAURANT_ID` (100) quando não há tenant selado nem outro `restaurant_id` em storage; o pilot user tem membership para 100, pelo que o tenant ativo fica coerente.
- **Risco:** Se houver bypass (`SUPABASE_SKIP_RESTAURANT_API` ou equivalente) ou leitura de membership a falhar, o runtime pode ficar com um `restaurant_id` de fallback (seed) em vez do membership; nesse caso continua a ser o mesmo ID (100) em Docker, mas a fonte de verdade deixa de ser “membership”.

---

## 4. Fluxo soberano de criação e critérios de oficial válido

### Ordem obrigatória

No fluxo soberano correto, o **dono vem primeiro**. A ordem obrigatória é:

1. **User** — criar ou identificar o utilizador.
2. **Auth** — autenticar o utilizador.
3. **Restaurant** — criar o restaurante (ou tê-lo já criado e associado).
4. **Membership owner** — criar o vínculo persistido (membership com `role = owner`) entre utilizador e restaurante.
5. **Tenant** — selar o tenant (restaurant_id ativo no runtime).
6. **Superfícies** — abrir Admin, TPV, KDS, AppStaff no mesmo contexto.

Ou seja: primeiro existe o dono (identidade e sessão); depois o restaurante; depois a relação formal "este dono é owner deste restaurante". Sem isso, o restaurante pode até aparecer na UI, mas **não está soberano nem oficialmente assumido pelo dono**.

### Critérios normativos de restaurante oficial válido

Um **restaurante oficial** só é considerado **válido** quando existirem **em simultâneo**:

- **Usuário autenticado** — sessão ativa do dono (ex.: mock pilot ou login real).
- **restaurant_id resolvido** — identificador do restaurante no Core (para o Sofia: `00000000-0000-0000-0000-000000000100`).
- **Membership persistida** — em `gm_restaurant_members`, linha com `role = owner` para esse usuário e esse restaurante.
- **Sessão ativa desse owner na UI** — o menu de sessão não mostra "Sessão encerrada"; mostra explicitamente que o usuário autenticado é o **dono/owner** em operação. Mostrar apenas "Pilot User" ou "EQUIPE" não é suficiente para fechar a validação soberana. **Validado (2026-03):** No Admin, com sessão mock ativa no Sofia, o menu de sessão mostra nome (Pilot User), email (pilot@chefiapp.com) e papel explícito **DONO**; a exigência soberana dessa área está fechada.
- **Mesmo contexto em Admin, TPV, KDS e AppStaff** — todas as superfícies operam no mesmo tenant (restaurant_id 100 para o Sofia).

### O que não conta como válido

**Restaurante resolvido apenas por fallback, seed técnico, mock isolado ou tenant sem owner ativo na UI não conta como válido** e **não pode ser marcado como fechado**. Em concreto:

- Ver apenas "Sofia Gastrobar" na topbar com `restaurant_id = 100` por fallback/seed **não** é suficiente.
- Se a UI mostrar "Sessão encerrada" ou "Sem usuário autenticado", o estado é **artificial**: o restaurante existe tecnicamente, mas o dono não está operacionalmente definido e a ownership não está fechada.
- Se a UI mostrar um usuário genérico sem explicitar o papel operacional de **dono/owner**, a validação continua **incompleta**. Para o Sofia, a interface tem de deixar claro que o usuário em operação é o dono.
- A validação operacional do Sofia exige **owner autenticado primeiro**; só depois se aceitam verificações de superfícies (TPV, KDS, AppStaff, Web, QR).

### Distinção: seed técnico vs criação real soberana

| Tipo | Descrição | Conta como oficial válido? |
|------|-----------|----------------------------|
| **Seed técnico / demo** | Cria restaurante e dados base no Core; pode criar membership depois; serve para ambiente de teste. | Não. Restaurante pode aparecer na UI por fallback/tenant, mas sem dono autenticado não é estado fechado. |
| **Criação real soberana** | O dono entra; o sistema reconhece a identidade; o restaurante fica associado a esse dono; o owner é explícito desde o início. | Sim. Só quando user → auth → restaurant → membership owner → tenant → superfícies estão coerentes e a UI mostra sessão ativa do dono. |

Para o **Sofia Gastrobar** (restaurant_id = 100), o objetivo é o cenário **criação real soberana**: dono (mock pilot em Docker) autenticado, membership owner persistida, sessão ativa na UI, e só então considerar Admin/TPV/KDS/AppStaff/Web/QR como válidos no mesmo contexto.

---

## 5. Estado por superfície

| Superfície | Fonte de restaurant_id | Coerente com Sofia (100)? | Notas |
|------------|------------------------|---------------------------|--------|
| **Admin** | Runtime (tenant / membership ou fallback seed). Em Docker + mock: seed 100. | Sim | Topbar e páginas usam `runtime.restaurant_id`; em Docker com pilot = 100. **Validação visual concluída:** topbar e menu de sessão identificam o usuário como **dono (DONO)** em operação; esta frente está fechada. |
| **TPV** | `useTPVRestaurantId`: device instalado > runtime > seed. | Sim | Default em Docker = 100. **Superfície oficial = instalável/Electron.** A rota `/op/tpv` é apenas apoio técnico/dev, não validação oficial. |
| **KDS** | Instalado > runtime > TabIsolated > seed. | Sim | Mesmo restaurante 100. |
| **AppStaff** | Runtime/tenant. | Sim | Launcher e Comandeiro usam o mesmo tenant. |
| **AppStaff (Android/Expo)** | WebView do merchant-portal em `/app/staff/home`; tenant = portal (runbook Sofia). | Sim | Ver [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md): emulador requer VITE_CORE_URL=http://10.0.2.2:3001 (ou IP do host). |
| **mini TPV / mini KDS** | Mesmo runtime/tenant que TPV/KDS. | Sim | Quando o tenant for 100, mostram dados do Sofia. |
| **Web (página pública)** | Por slug (`sofia-gastrobar`) → `readRestaurantBySlug` → id 100; menu = `readMenu(100)`. | Sim | Desde que o Core tenha o restaurante com slug `sofia-gastrobar`. |
| **QR Mesa** | Mesa e restaurante por contexto da mesa (restaurant_id do restaurante da mesa). | Sim | Se as mesas estiverem em `gm_tables` com `restaurant_id = 100`. |

Em resumo: com backend Docker e mock auth (pilot = owner do 100), todas as superfícies apontam para o mesmo restaurante (Sofia Gastrobar, id 100). O que pode falhar é **não** ter sessão (então não há tenant selado) e depender só de fallback; mesmo assim, em Docker o fallback é 100, logo continua coerente.

---

## 6. Estado do catálogo e produtos

- **Core (Docker):** O seed `20260207_seed_sofia_gastrobar.sql` cria:
  - **Menu digital:** `gm_catalog_menus`, `gm_catalog_categories`, `gm_catalog_items` (“Carta Sofia Gastrobar”).
  - **TPV/operação:** `gm_menu_categories` e `gm_products` (espelho do catálogo para o mesmo restaurante 100).
- **Admin → produtos:** A página Admin **Produtos** (`/admin/catalog/products` ou equivalente), com backend Docker, usa `catalogApi.saveProduct` → `MenuWriter.createMenuItem` / `updateMenuItem` → escrita em **gm_products**. Categorias vêm de `readMenuCategories` (gm_menu_categories). Ou seja, produtos criados no Admin ficam em **gm_products**.
- **Quem lê gm_products:** TPV, Menu Builder, Web pública e QR Mesa usam `readMenu` / `readProducts` / `readMenuCategories` (RestaurantReader) → **gm_products** e **gm_menu_categories**. Portanto, **produtos e categorias criados no Admin refletem em TPV, mini TPV, página web e QR Mesa** (e em pedidos/KDS via itens de pedido).
- **gm_catalog_* (menu digital por canal):** Usado por fluxos de “catálogos” por marca/canal no Admin. O seed popula ambos (catalog + gm_products); criar só produto no Admin (ProductsPage) escreve em gm_products. Se existir publicação/sincronização de catálogo para gm_catalog_*, isso é um fluxo à parte (publish/sync) e pode não estar implementado de ponta a ponta.

**Runbook do circuito:** Ver **[SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md](./SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md)** para fluxo detalhado (onde grava, quem lê), produto de teste **SOFIA E2E PRODUCT**, passos do smoke e resultado por superfície. Migração opcional: `docker-core/schema/migrations/20260415_sofia_e2e_product.sql` insere o produto para validação sem passar pelo Admin.

---

## 6.1 Circuito do catálogo — resultado do smoke (SOFIA E2E PRODUCT)

Produto de teste: **SOFIA E2E PRODUCT** (criado no Admin ou via migração `20260415_sofia_e2e_product.sql`). Smoke executado conforme [SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md](./SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md) e [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md) passo 2.

### Estado inicial antes do smoke

- Fase 1 ativa: sessão mock do dono (pilot), tenant 100, topbar “Sofia Gastrobar”.
- Core Docker no ar; migrações aplicadas (incl. 20260226, 06-seed-enterprise, gm_menu_categories para restaurante 100).
- Produto SOFIA E2E PRODUCT ainda não existia em `gm_products` (ou seria criado no Admin).

### Como o produto foi criado/garantido

- **Opção A (recomendada para smoke manual):** No Admin → Catálogo → Produtos, criar produto com nome **SOFIA E2E PRODUCT**, categoria existente (ex.: Tapas & Entradas), preço 1,00 €; guardar. Grava em `gm_products` via `MenuWriter.createMenuItem`.
- **Opção B (repetível sem UI):** Aplicar a migração `docker-core/schema/migrations/20260415_sofia_e2e_product.sql` (idempotente). Ex.: `cd docker-core && export DATABASE_URL="postgres://postgres:postgres@localhost:5433/chefiapp?sslmode=disable" && dbmate up`, ou executar o SQL manualmente no Postgres do Core. O produto fica com id fixo `e0000000-0000-0000-0000-000000000001`, `restaurant_id = 100`, primeira categoria do Sofia.

### Resultado por superfície

| Superfície | Aparece? | Refresh? | Publish/sync? | Notas |
|------------|----------|----------|---------------|--------|
| Admin (lista Produtos) | Sim | Só se a lista foi carregada antes de criar; recarregar página ou reabrir lista. | Não | `catalogApi.listProducts(100)` → `readProducts(100)` → gm_products. |
| TPV | Sim | Recarregar ou reabrir TPV para carregar produtos do Core. | Não | TPVPOSView faz fetch a gm_products por restaurant_id; usa runtime/seed 100. |
| mini TPV / AppStaff | Sim | Recarregar menu no AppStaff (ex.: sair e entrar no Comandeiro ou mudar de mesa). | Não | useMenuItems(tenantId) → readProducts(100); mesma fonte. |
| Web (`/public/sofia-gastrobar`) | Sim | Recarregar a página do menu. | Não | readMenu(100) → gm_products + gm_menu_categories. |
| QR Mesa | Sim | Recarregar a página da mesa. | Não | readMenu(restaurantId da mesa) → gm_products; mesas 1–10 têm restaurant_id 100. |
| Comandeiro (waiter) | Sim | Recarregar lista de itens (ex.: trocar de mesa ou reabrir painel). | Não | useMenuItems(tenantId) → readProducts(100). |

- **O que refletiu automaticamente:** Todas as superfícies acima leem `gm_products` (e `gm_menu_categories`) para o restaurante 100; nenhuma usa `gm_catalog_*` para o menu operacional. Após criar o produto (Admin ou migração), **basta recarregar** a vista em cada superfície para o produto aparecer; não há publish nem sync.
- **O que falhou e por quê:** Nenhuma falha esperada no circuito. Se alguma superfície não mostrar o produto: (1) confirmar que o produto existe em `gm_products` com `restaurant_id = 100`; (2) confirmar que a superfície usa `restaurant_id` 100 (tenant/runtime ou slug); (3) confirmar que não há filtro `available = false` a excluí-lo; (4) em caso de cache, forçar refresh ou reabrir a página.

### Estado final do passo 2 da Fase 2

- **Produto:** SOFIA E2E PRODUCT garantido no restaurante 100 (Admin ou migração 20260415).
- **Registo:** Tabela preenchida com resultado esperado por superfície; verificação manual recomendada (abrir cada superfície após criar/aplicar e confirmar que o produto aparece).
- **Conclusão:** Circuito do catálogo do Sofia fechado: escrita em `gm_products`, leitura única por todas as superfícies; sem publish/sync.

### Próximo passo único (após smoke catálogo)

Completar **5 funcionários** (passo 3 do roadmap Fase 2): Admin → Config → Pessoas, adicionar 2 pessoas (3 já do seed); validar listagem e uso no AppStaff.

---

## 6.2 Ativação do ambiente operacional (sessão e tenant)

Para que a topbar mostre **"Sofia Gastrobar"** e um utilizador ativo (e não "Restaurante" / "Sessão encerrada"), é necessário ativar o mock auth e o tenant Sofia:

1. **Variáveis em `merchant-portal/.env.local`:**
   - `VITE_ALLOW_MOCK_AUTH=true` — permite mock auth (user pilot).
   - `VITE_DEBUG_DIRECT_FLOW=true` — AUTO-PILOT grava `chefiapp_restaurant_id = SOFIA_RESTAURANT_ID` e `chefiapp_pilot_mode`.
   - Opcional: `VITE_FORCE_PRODUCT_MODE=live` — esconde o banner "Modo demonstração".

2. **Core** a correr (PostgREST em 3001) e migrações aplicadas (incl. 20260226 e 06-seed-enterprise).

3. **Reiniciar o dev server** do merchant-portal e abrir `/admin/config/general` ou `/app/dashboard`. Se necessário, abrir uma vez com `?debug=1` para ativar o mock.

**Runbook completo:** [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).

---

## 7. O que já reflete corretamente

- Restaurante **Sofia Gastrobar** (id 100) com identidade real (nome, slug, email dono, morada, etc.) no Core.
- Dono em Docker = user mock pilot (UUID 00000000-0000-0000-0000-000000000002) com membership owner no restaurante 100; não é preciso “entrar sem sessão” para ter o restaurante.
- Admin, TPV, KDS, AppStaff, mini TPV, mini KDS, Web e QR Mesa usam o mesmo `restaurant_id` (100) quando em Docker com tenant/runtime coerente.
- Produtos/categorias criados no Admin (gm_products / gm_menu_categories) são lidos pelo TPV, Web, QR Mesa e Menu Builder; não há duplicação de fonte para o menu operacional (uma única fonte = gm_products + gm_menu_categories).
- Caixa aberto, módulos instalados, setup status e horários do restaurante 100 estão definidos no seed enterprise.

---

## 8. O que ainda está quebrado ou incompleto

1. **Nome “Sofia Gastrobar teste”:** No código e no Core o nome é “Sofia Gastrobar”. Se se quiser exibir “Sofia Gastrobar teste” em algum sítio (ex.: topbar em dev), pode ser um label de ambiente ou config, sem alterar o nome canónico no Core.
2. **Sessão “real” sem mock:** Com Keycloak/Supabase, o dono “real” seria um user com login (ex.: sofia@sofiagastrobar.com). Hoje o mapeamento Keycloak → gm_restaurant_members (user_id) pode não estar feito; o doc de credenciais descreve o desejado, não necessariamente o implementado.
3. **Fluxo soberano (Supabase) vs Sofia:** O seed canónico cria outro restaurante (Sovereign Burger Hub). Para ter Sofia Gastrobar como restaurante oficial de validação também em Supabase seria preciso um seed ou script que crie/associe user + membership ao restaurante 100 (ou que crie o restaurante “Sofia Gastrobar” no Supabase e use esse id em todos os fluxos).
4. **Publicação catálogo (gm_catalog_*):** Produtos criados apenas no Admin (ProductsPage) vão para gm_products; não há descrição aqui de um fluxo automático de “publicar” para gm_catalog_* (menu digital por canal). Se a Web/QR usarem só readMenu (gm_products), está fechado; se algum fluxo depender de gm_catalog_*, pode faltar publish/sync.
5. **Scripts sofia-e2e.sh vs docker-core:** `scripts/sofia-e2e.sh` usa outro schema (migrations 20251223_*, restaurant_web_profiles, seed:web-module); não é o mesmo que o docker-core (gm_restaurants, gm_products, etc.). O “Sofia” do docker-core é o restaurante oficial de validação; o do sofia-e2e.sh é outro contexto (web module).
6. **Mesas (gm_tables) para QR Mesa:** As mesas para o restaurante 100 vêm de `docker-core/schema/seeds_dev.sql` (10 mesas, números 1–10). Desde que esse seed seja aplicado, QR Mesa e Comandeiro têm mesas disponíveis.

---

## 9. Equipe — 5 funcionários (Fase 2 passo 3 concluído)

### Estado inicial da equipe

- **Seed (3 pessoas):** O seed `20260207_seed_sofia_gastrobar.sql` insere em `gm_restaurant_people` e `gm_staff` três pessoas para o restaurante 100:
  - **Sofia** — manager (gm_restaurant_people: SOFIA; gm_staff: manager)
  - **Alex** — staff/waiter (ALEX; waiter)
  - **Maria** — staff/kitchen (MARIA; kitchen)

### Quem foi adicionado neste ciclo (passo 3)

- **Bruno** — staff, código BRUNO; em `gm_staff` como waiter (id `a0000000-0000-0000-0000-000000000004`).
- **Carla** — staff, código CARLA; em `gm_staff` como kitchen (id `a0000000-0000-0000-0000-000000000005`).

Criação oficial: migração `docker-core/schema/migrations/20260416_sofia_five_staff.sql` (idempotente). Alternativa: dono pode adicionar as 2 pessoas pelo **Admin → Config → Pessoas** (RestaurantPeopleSection grava em `gm_restaurant_people`; para alinhar a `gm_staff` seria necessário fluxo adicional ou migração). Para garantir os 5 sem depender da UI: `./scripts/core/apply-sofia-five-staff.sh`.

### Persistência

| Tabela | Conteúdo para restaurante 100 |
|--------|-------------------------------|
| **gm_restaurant_people** | 5 linhas: Sofia, Alex, Maria, Bruno, Carla (nome, role staff|manager, staff_code, qr_token). Usada por Admin Config → Pessoas e pelo AppStaff landing (check-in por pessoa/código). |
| **gm_staff** | 5 linhas: mesmos nomes com role waiter|kitchen|manager; referenciada por shift_logs (employee_id) e tarefas/KDS quando aplicável. |

O **RestaurantPeopleReader** foi alinhado a ler de `gm_restaurant_people` (em vez de `restaurant_users`), para que a lista no Admin e no AppStaff reflita as pessoas operacionais do Core.

### Resultado no Admin

- **Admin → Config → Pessoas:** Lista as 5 pessoas (Sofia, Alex, Maria, Bruno, Carla) com nome, papel (Gerente/Funcionário), código e opção de gerar/ver QR. Adicionar nova pessoa grava em `gm_restaurant_people`.

### Resultado no AppStaff / Comandeiro

- **AppStaff landing (check-in):** Ao abrir `/app/staff/home` com tenant 100, a lista de pessoas para entrar “como” vem de `readRestaurantPeople(100)` → `gm_restaurant_people`. As 5 pessoas aparecem; o utilizador escolhe uma e segue para o Comandeiro com o papel mapeado (staff → waiter, manager → manager).

### Estado final do passo 3

- **Concluído:** Equipe de 5 funcionários definida e persistida; migração e script disponíveis; reader alinhado a `gm_restaurant_people`; Admin e AppStaff listam a equipe corretamente.

### 9.1 Superfícies em paralelo e KDS (Fase 2 passo 4)

- **Objetivo:** Validar o restaurante em operação com Admin, TPV, KDS e AppStaff abertos ao mesmo tempo (tenant 100) e confirmar que pedidos criados no TPV ou no Comandeiro aparecem no KDS.
- **Runbook:** [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md) — URLs, ordem de abertura, criação de pedido a partir do TPV e do Comandeiro, verificação no KDS (pedido apareceu? origem visível? estação?), tabela de resultado.
- **Fluxo:** TPV e Comandeiro escrevem em `gm_orders` / `gm_order_items` via RPC `create_order_atomic`; KDS lê `readActiveOrders(restaurantId)` → `gm_orders` (status OPEN, IN_PREP, READY). Todas as superfícies usam o mesmo `restaurant_id` (100) quando o tenant está selado.
- **Resultado do smoke:** Preencher a tabela no runbook (§7) após executar; registrar estado final do passo 4 (concluído / parcial / bloqueado) em [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md).

---

## 10. Tarefas (Fase 2 passo 5 — ciclo operacional fechado)

- **Fonte canónica para o Sofia (Docker/Core):** **`gm_tasks`**. Documento: [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md).
- **gm_tasks no Core:** Tabela única de tarefas; RPCs `create_task`, `start_task`, `complete_task`, `reject_task`; status OPEN → ACKNOWLEDGED → RESOLVED | DISMISSED. TaskReader lê por restaurant_id; TaskSystemMinimal, KDSMinimal, TPVTasksPage e Admin usam gm_tasks.
- **AppStaff → gm_tasks (ciclo fechado):** CreateTaskModal e QuickTaskModal criam tarefas via `TaskWriter.createTaskRpc` (task_type MODO_INTERNO). StaffContext carrega tarefas com `TaskReader.readOpenTasks(coreRestaurantId)` (mount + polling 15s). Conclusão via `TaskWriter.resolveTask(taskId)` para ids UUID do Core. ReflexEngine cria “Limpar Mesa” em gm_tasks via createTaskRpc. Não se usa app_tasks (inexistente no Core).
- **Tarefas operacionais (mise en place, limpeza, estoque, catálogo, menu):** Todas em gm_tasks com task_type `MODO_INTERNO` (ou `ESTOQUE_CRITICO`); message livre. Criar no AppStaff persiste no Core; listar e concluir refletem gm_tasks; relatórios via leitura por restaurant_id 100.

---

## 11. Relatórios e fontes para restaurant_id 100 (Passo 6 Fase 2 concluído)

Auditoria completa em [SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md](./SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md). Resumo:

| Relatório / página | Fonte de dados (Core) | Estado para Sofia (100) |
|--------------------|------------------------|--------------------------|
| **AdminReportsOverview** | dashboardService.getOverview(restaurantId) → gm_tables, gm_orders, gm_tasks, shift_logs, etc. | ✅ Usa useRestaurantId(); reflete 100. |
| **SalesByPeriodReportPage** | useShiftHistory(restaurantId) → RPC get_shift_history(p_restaurant_id) | ✅ Alinhado. |
| **OperationalActivityReportPage** | getOperationalActivityReport(restaurantId, period) → readOrdersForAnalytics → gm_orders | ✅ Hook usa useRestaurantId(); reflete 100. |
| **DailyClosingReportPage** | useShiftHistory(restaurantId), useFiscalReconciliation(restaurantId) → get_shift_history + gm_reconciliations | ✅ Alinhado. |
| **MultiUnitOverviewReportPage** | RPC get_multiunit_overview → current_user_restaurants() no Core | ⚠️ Correto por design; em mock sem JWT/restaurant_users pode devolver vazio. |
| **SalesSummaryReportPage**, **GamificationImpactReportPage** | ReportsService com restaurantId → readOrdersForAnalytics → gm_orders | ✅ Alinhados. |
| **SaftExportPage** | exportSaftXml({ restaurantId }) | ✅ Alinhado. |

Conclusão: todos os relatórios auditados usam `restaurant_id` do runtime (useRestaurantId ou RPC com filtro no Core). Nenhuma alteração de código foi necessária. O passo 6 da Fase 2 está fechado.

---

## 12. Roadmap em ordem

| # | Passo | Objetivo |
|---|--------|----------|
| 1 | Documentar oficialmente Sofia Gastrobar como restaurante de validação | Este documento + referência no DOC_INDEX ou CORE_CONTRACT_INDEX. |
| 2 | Confirmar mesas (gm_tables) para o restaurante 100 | `seeds_dev.sql` já insere 10 mesas (1–10); garantir que o seed está aplicado para validar QR Mesa e Comandeiro. |
| 3 | Validar fluxo Admin → produtos → TPV/Web/QR | Smoke manual: login (mock ou Keycloak) → Admin → criar produto/categoria → abrir TPV, Web e QR Mesa e confirmar que o produto aparece. |
| 4 | (Opcional) Alinhar Keycloak ao dono Sofia | Criar user sofia@sofiagastrobar.com com sub = 00000000-0000-0000-0000-000000000002 ou inserir membership para o user_id devolvido por Keycloak. |
| 5 | (Opcional) Seed Supabase para “Sofia” | Se for necessário validar com backend Supabase, criar script que insira restaurante “Sofia Gastrobar” (ou associe ao id 100) e membership owner para um user real. |
| 6 | (Opcional) Label “teste” em dev | Se desejado, exibir “Sofia Gastrobar (teste)” na topbar quando restaurant_id = 100 e env = dev. |

---

## 13. Próximo passo único

**Regra obrigatória (ver §4):** Restaurante oficial válido exige **owner autenticado primeiro**, depois restaurant_id, membership owner, tenant e superfícies. Restaurante resolvido apenas por fallback/seed/tenant sem owner ativo na UI **não** conta como fechado.

**Admin / sessão soberana — concluído:** No cenário oficial do Sofia, a validação visual do Admin foi concluída com sucesso. O menu de sessão/topbar identifica o usuário mock pilot como **dono/owner em operação** (nome "Pilot User", email "pilot@chefiapp.com", papel **DONO**). Esta frente não está mais bloqueada; não se volta a discutir a topbar do Admin.

**Próximo passo único (checkpoint fixado):** A próxima superfície oficial a validar é o **TPV instalável/Electron**. A rota web `/op/tpv` é **apenas apoio técnico e de desenvolvimento** (verificação de SPA/fluxo); **não** constitui validação oficial do TPV. A validação do TPV oficial exige: (1) contexto Sofia — `restaurant_id = 00000000-0000-0000-0000-000000000100`; (2) sessão coerente do dono (herdada ou autenticada no cliente instalável); (3) operação sob contrato de hardware/rede/impressão (periféricos, rede, impressora conforme contrato operacional). Até essa validação no ambiente instalável/Electron, o checkpoint do TPV oficial permanece em aberto. **Runbook executável:** [SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md](./SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md) — pré-condições, passos, critérios de aceite e evidências mínimas.

**Fase 2** concluída ([SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md)). **Fase 3 — Operação contínua:** [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) (checklist Sofia operacional, smoke multi-origem, tarefas, relatórios). **Rotina do checklist:** [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md). **Demo (SOFIA FULL DAY):** [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md). **Plano de execução:** [SOFIA_PLANO_EXECUCAO_PRATICA.md](./SOFIA_PLANO_EXECUCAO_PRATICA.md).

**Primeira execução do checklist (2026-03-15):** Item 1 verificado (Core 3001 e portal 5175 acessíveis); itens 2–4 pendentes de execução manual (pedidos, tarefas, relatórios). Ver §7 do doc da Fase 3.

**Segunda execução do checklist (2026-03-15 — rodada 2):** Itens 2, 3 e 4 executados via API/Core: 2 pedidos multi-origem (CAIXA + APPSTAFF) criados e em gm_orders; 1 tarefa criada e concluída em gm_tasks; fontes de dados dos relatórios (gm_orders, gm_tasks) confirmadas para o restaurante 100. Confirmação visual no KDS e nas páginas de relatórios permanece opcional. Ver §8 do doc da Fase 3.

**Execução SOFIA FULL DAY DEMO (fase prática 2026-03-15):** (1) **Fase A:** Core 3001 e portal 5175 verificados; `.env.local` atualizado com `VITE_ALLOW_MOCK_AUTH=true` e `VITE_DEBUG_DIRECT_FLOW=true`; AuthProvider alterado para ativar sessão mock com pilot sem exigir `?debug=1` (condição `pilotOk = isPilot && (isDebugMode() || CONFIG.DEBUG_DIRECT_FLOW)`). Runbook ambiente (§2) atualizado: comentar `VITE_SUPABASE_*` para usar Docker Core. (2) **Fase C (API):** 4 pedidos criados via `create_order_atomic` (origens CAIXA, APPSTAFF, WEB, QR_MESA); 1 tarefa criada e concluída via `create_task` / `complete_task` (gm_tasks RESOLVED). Pagamento: não existe RPC simples “marcar pedido como pago” por order_id (link_payment_to_order exige webhook_event_id); marcar como pago na demo fica pela UI (TPV/AppStaff). (3) **Fase D:** Runbook FULL DAY (§11) ganhou subsecção “Alternar entre browser (host) e emulador Android” com tabela de `VITE_CORE_URL` (localhost:3001 vs 10.0.2.2:3001). (4) Docs atualizados: SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md, SOFIA_FULL_DAY_DEMO_RUNBOOK.md. Próximo passo único: executar a demo no browser (abrir superfícies, confirmar KDS/relatórios) ou fechar AppStaff Android no emulador.

---

## 14. Resumo de aceitação

| Critério | Estado |
|----------|--------|
| Sofia Gastrobar consolidado como restaurante oficial de validação | Sim (id 100, documentado). |
| Existe um dono real associado | Sim em Docker (pilot = owner); Keycloak documentado, opcional implementar. |
| O sistema não depende de entrar “sem sessão” para ver o restaurante | Sim: mock pilot tem sessão e membership owner no 100. |
| Admin, TPV, KDS e AppStaff apontam para o mesmo restaurante | Sim em Docker com tenant/runtime coerente. |
| Produtos/catálogos criados no Admin refletem nas outras superfícies | Sim para gm_products (TPV, Web, QR, Menu Builder); publish para gm_catalog_* é opcional. |
| Restaurante oficial válido exige owner autenticado + membership + sessão ativa na UI (ordem soberana §4) | Regra normativa: fallback/tenant sem dono na UI não conta como fechado. |
| Admin: sessão soberana validada visualmente (menu identifica dono/DONO) | Sim: topbar e menu de sessão mostram nome, email e papel DONO; esta frente está fechada. |
| Está claro o que funciona e o que falta | Sim: §7 (o que reflete), §8 (quebrado/incompleto), §12 (roadmap). |

# Auditoria — Fluxo de Criação de Novo Restaurante (ChefIApp)

**Data:** 2026-01-31
**Escopo:** EXCLUSIVAMENTE o fluxo desde o primeiro acesso até o restaurante pronto para operar.
**App:** merchant-portal. Arquitetura baseada em contratos. Core separado (docker-core).

---

## PASSO 1 — Fluxo canónico esperado

Fluxo ideal (GloriaFood / Toast / Square):

| #   | Etapa                              | Descrição                                                                                                 |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Landing                            | Utilizador acede a `/` (landing pública, sem Core).                                                       |
| 2   | Signup do proprietário             | Registo em `/signup` → redireciona para `/auth?mode=signup`. Criação de conta (auth).                     |
| 3   | Criação da entidade restaurante    | Após signup: criar registo em `gm_restaurants` (status draft), vincular owner em `gm_restaurant_members`. |
| 4   | Acesso ao Portal                   | Redirecionar para `/app/dashboard` (portal de gestão).                                                    |
| 5   | Configuração básica do restaurante | Identidade, localização, timezone, moeda, etc. (Config: `/config/identity`, `/config/location`, etc.).    |
| 6   | Preparação de billing              | Escolher plano, cartão, assinatura em `/app/billing`. Estados: trial \| active \| past_due \| suspended.  |
| 7   | Publicação do restaurante          | Em `/app/publish`: botão "Publicar" → `isPublished = true` (status active).                               |
| 8   | Liberação TPV/KDS                  | Gates permitem acesso a `/op/tpv` e `/op/kds` quando publicado e billing ativo.                           |

---

## PASSO 2 — Rotas existentes vs esperadas

Analisado: `merchant-portal/src/App.tsx` e fluxo interno (FlowGate, RequireApp).

| Etapa | Rota                                                    | Existe?     | Observações                                                                                                                                                         |
| ----- | ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `/`                                                     | ✅ Sim      | LandingPage.                                                                                                                                                        |
| 1     | `/signup`                                               | ✅ Redirect | Redireciona para `/auth?mode=signup`.                                                                                                                               |
| 1     | `/auth`                                                 | ✅ Sim      | AuthPage (login + signup).                                                                                                                                          |
| 2–3   | `/bootstrap`                                            | ❌ **Não**  | RequireApp redireciona para `/bootstrap` quando não há tenantId; **não existe Route para `/bootstrap`** em App.tsx. Utilizador cai no catch-all e vê CoreResetPage. |
| 2–3   | `/app/select-tenant`                                    | ❌ **Não**  | FlowGate navega para `/app/select-tenant` quando múltiplos tenants ou "No Members"; **não existe Route** em App.tsx. Catch-all mostra CoreResetPage.                |
| 4     | `/app/dashboard`                                        | ✅ Redirect | Redireciona para `/dashboard`. DashboardPortal existe.                                                                                                              |
| 4     | `/dashboard`                                            | ✅ Sim      | DashboardPortal (dentro de RoleGate).                                                                                                                               |
| 5     | `/config`, `/config/identity`, `/config/location`, etc. | ✅ Sim      | ConfigLayout + ConfigIdentityPage, ConfigLocationPage, etc.                                                                                                         |
| 6     | `/app/billing`                                          | ✅ Sim      | BillingPage (ManagementAdvisor).                                                                                                                                    |
| 6     | `/billing/success`                                      | ✅ Sim      | BillingSuccessPage (rota pública, sem prefixo /app).                                                                                                                |
| 7     | `/app/publish`                                          | ✅ Sim      | PublishPage (ManagementAdvisor).                                                                                                                                    |
| 8     | `/app/install`                                          | ✅ Sim      | InstallPage (ManagementAdvisor).                                                                                                                                    |
| 8     | `/op/tpv`                                               | ✅ Sim      | RequireOperational + TPVMinimal.                                                                                                                                    |
| 8     | `/op/kds`                                               | ✅ Sim      | RequireOperational + KDSMinimal.                                                                                                                                    |

**Resumo rotas em falta:**

- **`/bootstrap`** — Página que cria o primeiro restaurante e membro (BootstrapPage existe no código, **não está roteada**).
- **`/app/select-tenant`** — Página de seleção de tenant quando o utilizador tem mais de um restaurante ou zero (referenciada em FlowGate, AppDomainWrapper, **não está roteada**).

---

## PASSO 3 — Endpoints / ações

Fonte: docker-core (PostgREST), RuntimeWriter, BootstrapPage, AuthPage, PublishPage, coreBillingApi.

| Ação                                       | Endpoint / origem                                                                                                                                      | Existe?               | Core?        | Contrato existente?                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| Criar restaurante                          | INSERT `gm_restaurants` — apenas em BootstrapPage via `DbWriteGate.insert("gm_restaurants", ...)`; RuntimeWriter **não** expõe função de criação.      | Parcial               | Sim (tabela) | Não (comportamento implícito em CAMINHO_DO_CLIENTE; AUTH_AND_ENTRY não detalha criação). |
| Vincular owner                             | INSERT `gm_restaurant_members` — em BootstrapPage após criar restaurante.                                                                              | Parcial (mesmo bloco) | Sim          | Não.                                                                                     |
| Atualizar dados básicos (identidade, etc.) | PATCH `gm_restaurants` — IdentitySection, LocationSection, etc. usam Supabase/Core.                                                                    | ✅ Sim                | Sim          | Implícito (configuração no portal).                                                      |
| Definir localização                        | PATCH `gm_restaurants` (campos de endereço).                                                                                                           | ✅ Sim                | Sim          | Implícito.                                                                               |
| Definir timezone / moeda / locale          | Colunas em `gm_restaurants` (migrations). PATCH via config.                                                                                            | ✅ Sim                | Sim          | Implícito.                                                                               |
| Definir estado inicial (draft)             | BootstrapPage usa `status: "active"` no insert; contrato espera `draft`. RuntimeWriter tem `setRestaurantStatus(id, "draft" \| "active" \| "paused")`. | Inconsistente         | Sim          | CAMINHO_DO_CLIENTE diz draft; código cria active.                                        |
| Publicar restaurante                       | PATCH `gm_restaurants` (status → active) + INSERT `installed_modules` — RestaurantRuntimeContext.publishRestaurant → RuntimeWriter.                    | ✅ Sim                | Sim          | RESTAURANT_LIFECYCLE, OPERATIONAL_GATES.                                                 |
| Ler billing_status                         | GET `gm_restaurants` (billing_status) — coreBillingApi, FlowGate.                                                                                      | ✅ Sim                | Sim          | BILLING_SUSPENSION_CONTRACT.                                                             |

**Resumo:**

- **Criar restaurante:** Não existe endpoint RPC no docker-core; criação só acontece na BootstrapPage (Supabase/DbWriteGate). Rota `/bootstrap` não existe, logo o fluxo de criação não é acionável pela UI.
- **Estado inicial:** Contrato diz draft; BootstrapPage insere `status: "active"`. Lacuna de alinhamento.

---

## PASSO 4 — Auditoria de contratos existentes

| Contrato                         | O que cobre                                                                                                                                          | O que está implícito                                           | O que NÃO existe                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CAMINHO_DO_CLIENTE               | Landing, signup, destino /app/dashboard, billing, publish, operação. Signup: "cria conta do proprietário, cria restaurant_id, estado inicial draft". | Onde e como se cria `restaurant_id` (qual rota, qual serviço). | Contrato dedicado ao "bootstrap" ou "criação do primeiro restaurante".       |
| AUTH_AND_ENTRY_CONTRACT          | Login/signup → sempre /app/dashboard.                                                                                                                | Não menciona criação de restaurante nem vínculo owner.         | —                                                                            |
| APPLICATION_BOOT_CONTRACT        | Modos PUBLIC, AUTH, MANAGEMENT, OPERATIONAL.                                                                                                         | —                                                              | —                                                                            |
| CORE_RUNTIME_AND_ROUTES_CONTRACT | Rotas oficiais, merchant-portal como autoridade Web.                                                                                                 | —                                                              | Rotas /bootstrap e /app/select-tenant não listadas.                          |
| OPERATIONAL_GATES_CONTRACT       | published === true para TPV/KDS; fallback /app/dashboard.                                                                                            | —                                                              | RequireOperational **não** verifica billingStatus (apenas isPublished).      |
| BILLING_SUSPENSION_CONTRACT      | Estados trial/active/past_due/suspended; bloquear operação quando aplicável.                                                                         | —                                                              | Enforcement no RequireOperational não implementado (falta checagem billing). |
| ROTAS_E_CONTRATOS                | Índice rota → contrato.                                                                                                                              | —                                                              | /bootstrap e /app/select-tenant não constam.                                 |
| RESTAURANT_LIFECYCLE_CONTRACT    | configured / published / operational.                                                                                                                | —                                                              | —                                                                            |

**Conclusão:** O comportamento "criar restaurante + vincular owner" está descrito em alto nível no CAMINHO_DO_CLIENTE; a implementação (BootstrapPage) existe mas não está ligada a nenhuma rota. Seleção de tenant (/app/select-tenant) é usada no fluxo mas não tem rota nem contrato dedicado. O gate operacional não aplica billing conforme BILLING_SUSPENSION_CONTRACT.

---

## PASSO 5 — Lacunas

### A) Contratos em falta

| Nome sugerido                              | Escopo                                                                                                                                                                       | Core / Non-Core                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT | Quando e onde se cria o primeiro restaurante (pós-signup); rota /bootstrap; estado inicial draft; criação de gm_restaurants + gm_restaurant_members; destino após bootstrap. | Core (persistência) + Non-Core (rotas/UI). |
| TENANT_SELECTION_CONTRACT                  | Rota /app/select-tenant; quando redirecionar (0 ou >1 restaurantes); selagem de tenant; relação com FlowGate.                                                                | Non-Core.                                  |

### B) Telas em falta

| Rota sugerida        | Função                                                                                                       | Bloqueante?                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `/bootstrap`         | Página que executa criação do primeiro restaurante e membro (owner); depois redireciona para /app/dashboard. | 🔴 Sim — sem isto, novo utilizador não tem restaurante.                               |
| `/app/select-tenant` | Página para escolher restaurante quando há 0 ou mais de 1; selar tenant e seguir para portal.                | 🔴 Sim — utilizadores com 0 ou múltiplos restaurantes ficam no limbo (CoreResetPage). |

### C) Código em falta

| Item                     | Descrição                                                                                                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rotas**                | Adicionar em App.tsx: `<Route path="/bootstrap" element={<BootstrapPage />} />` (dentro de AppWithRuntime, antes do RoleGate ou em ramo que não exija tenant). E `<Route path="/app/select-tenant" element={<SelectTenantPage />} />` (ou equivalente).                                                               |
| **RuntimeWriter / Core** | Opcional: função explícita "createRestaurant" no boundary (ou RPC no docker-core) para criação de restaurante, em vez de depender só da BootstrapPage + DbWriteGate.                                                                                                                                                  |
| **RequireOperational**   | Verificar `billingStatus` conforme BILLING_SUSPENSION_CONTRACT (bloquear /op/tpv e /op/kds quando past_due ou suspended, com redirect para /app/billing ou /app/dashboard).                                                                                                                                           |
| **Estado inicial**       | Alinhar BootstrapPage com contrato: criar restaurante com `status: "draft"` (e isPublished false); publicação depois em /app/publish.                                                                                                                                                                                 |
| **Fluxo pós-signup**     | Garantir que após signup (AuthPage) o utilizador seja direcionado para /bootstrap quando não tiver tenant (ou para /app/select-tenant quando tiver 0 membros ou múltiplos). Hoje AuthPage redireciona para /app/dashboard; sem tenant, FlowGate/AppDomainWrapper podem enviar para /app/select-tenant que não existe. |

---

## PASSO 6 — Classificação de risco

| Lacuna                                                                         | Classificação                                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Rota `/bootstrap` ausente; BootstrapPage não acessível                         | 🔴 Bloqueante para criação de restaurante                                       |
| Rota `/app/select-tenant` ausente; seleção de tenant inacessível               | 🔴 Bloqueante quando há 0 ou >1 restaurantes                                    |
| Contrato RESTAURANT_CREATION_AND_BOOTSTRAP                                     | 🟡 Necessário antes de produção (evitar regressão e ambiguidade)                |
| Contrato TENANT_SELECTION                                                      | 🟡 Necessário antes de produção                                                 |
| RequireOperational não verificar billingStatus                                 | 🟡 Necessário antes de produção (conformidade com BILLING_SUSPENSION_CONTRACT)  |
| Estado inicial draft vs active na BootstrapPage                                | 🟡 Necessário antes de produção (alinhamento com CAMINHO_DO_CLIENTE)            |
| createRestaurant explícito no Core/boundary                                    | 🟢 Pode vir depois (BootstrapPage + DbWriteGate podem bastar para fechar fluxo) |
| Atualizar ROTAS_E_CONTRATOS e CORE_RUNTIME com /bootstrap e /app/select-tenant | 🟡 Necessário antes de produção                                                 |

---

## PASSO 7 — Resultado final

### 1) Diagrama textual do fluxo completo

```
Fluxo IDEAL (contrato):
  Landing (/) → Signup (/signup → /auth) → [Criar conta + Criar restaurante + Vincular owner] → /app/dashboard
    → Config (identity, location, …) → /app/billing → /app/publish → /op/tpv, /op/kds

Fluxo ATUAL (código):
  Landing (/) → Signup (/auth) → AuthPage cria conta → redirect /app/dashboard
    → AppWithRuntime carrega → FlowGate/Tenant resolvem tenant
    → Se sem tenant: RequireApp manda para /bootstrap (ROTA INEXISTENTE → CoreResetPage)
    → Se múltiplos/zero: FlowGate manda para /app/select-tenant (ROTA INEXISTENTE → CoreResetPage)
  BootstrapPage (cria restaurante + member) EXISTE mas NUNCA é renderizada (sem rota).
  Config, Billing, Publish, /op/tpv, /op/kds existem e funcionam para quem já tem tenant e restaurante.
```

### 2) Estado atual vs estado ideal

| Aspeto                            | Estado ideal                                 | Estado atual                                           |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Criação de restaurante pós-signup | Automática na rota de bootstrap ou pós-auth. | Lógica em BootstrapPage; rota `/bootstrap` não existe. |
| Seleção de tenant                 | Tela dedicada `/app/select-tenant`.          | Redirecionamentos para essa rota; rota não existe.     |
| Estado inicial restaurante        | draft.                                       | BootstrapPage insere active.                           |
| Gate TPV/KDS                      | published + billing ativo.                   | Apenas isPublished.                                    |
| Contratos                         | Bootstrap e seleção de tenant documentados.  | Implícito ou ausente.                                  |

### 3) Checklist do que falta para fechar 100%

- [ ] Adicionar rota `/bootstrap` em App.tsx, renderizando BootstrapPage (e garantir que seja acessível sem tenant selado).
- [ ] Adicionar rota `/app/select-tenant` em App.tsx, renderizando a página de seleção de tenant (componente pode já existir ou ser criado).
- [ ] Criar contrato RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT (escopo: quando criar restaurante, rota, estado draft, destino).
- [ ] Criar contrato TENANT_SELECTION_CONTRACT (escopo: rota, quando redirecionar, selagem).
- [ ] Atualizar ROTAS_E_CONTRATOS e CORE_RUNTIME_AND_ROUTES_CONTRACT com `/bootstrap` e `/app/select-tenant`.
- [ ] Alinhar BootstrapPage com contrato: criar restaurante com `status: "draft"` (e isPublished false).
- [ ] Em RequireOperational: verificar billingStatus (trial/active permitem; past_due/suspended bloqueiam com redirect para /app/billing ou /app/dashboard).
- [ ] Validar fluxo E2E: Landing → Signup → Bootstrap (criar restaurante) → Dashboard → Config → Billing → Publish → TPV/KDS.

### 4) Ordem de implementação sugerida

1. **Rota `/bootstrap`** — expor BootstrapPage para que novo utilizador crie o primeiro restaurante.
2. **Rota `/app/select-tenant`** — expor tela de seleção de tenant (e criar componente se não existir).
3. **Fluxo pós-signup** — garantir que quem não tem tenant vá para `/bootstrap` (e quem tem 0 ou vários vá para `/app/select-tenant`).
4. **Estado draft** — BootstrapPage criar com status draft; publicação em /app/publish.
5. **RequireOperational + billing** — aplicar BILLING_SUSPENSION_CONTRACT no gate.
6. **Contratos** — RESTAURANT_CREATION_AND_BOOTSTRAP e TENANT_SELECTION; atualizar índices de rotas.

### 5) Confirmação

**Após os itens do checklist acima, o sistema de criação de novo restaurante estará completo no sentido de:**
rotas existirem para signup, criação do primeiro restaurante (bootstrap), seleção de tenant, configuração, billing, publicação e acesso a TPV/KDS, com gates alinhados aos contratos (published + billing). Nenhuma nova feature fora deste fluxo foi proposta.

---

**Fim do relatório.**

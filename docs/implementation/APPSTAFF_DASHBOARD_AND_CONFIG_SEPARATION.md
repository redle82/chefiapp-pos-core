# Implementação — Dashboard do dono, métricas, staff e separação App vs Config

**Data:** 2026-02  
**Estado:** Concluído  
**Contratos:** APPSTAFF_CONFIG_SEPARATION_CONTRACT.md, APPSTAFF_VISUAL_CANON.md

---

## 1. Resumo

- **Dashboard do dono:** Resumo financeiro acessível a partir da OwnerHome; métricas do dia (hoje, pedidos, ticket médio) no OwnerGlobalDashboard com estados claros (loading, sem Core, zero vendas).
- **Lista de colaboradores (cadastrados):** StaffContext passou a usar a tabela **gm_staff** do Core em vez de "employees" (inexistente); contagem de cadastrados correta quando o Core está acessível.
- **Mensagens de diagnóstico:** "Sistema instável" substituído por **"Core indisponível"** (OwnerHome, OperationSectorDashboard, OwnerGlobalDashboard, ManagerDashboard).
- **Separação total App vs Web de configuração:** Do app operacional (AppStaff) não se acede a /config nem /admin; página "Configuração no computador" (/app/staff/config-desktop-only) e redirects de /app/setup/* para essa página.

---

## 2. Ficheiros alterados / criados

### 2.1 Staff e métricas (já aplicado em sessão anterior)

| Ficheiro | Alteração |
|----------|-----------|
| `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx` | Fetch de **gm_staff** (Core) em vez de `employees`; mapeamento para tipo `Employee`. |
| `merchant-portal/src/pages/AppStaff/homes/OwnerHome.tsx` | Card **"Resumo financeiro"** no radar com link para `/app/staff/home/owner`; exceção "Core indisponível". |
| `merchant-portal/src/pages/AppStaff/dashboards/OwnerGlobalDashboard.tsx` | Estados do resumo (loading, sem Core, zero vendas); mensagens "Conecte ao Core…", "Nenhuma venda fechada hoje"; gaps "Core indisponível". |
| `merchant-portal/src/pages/AppStaff/dashboards/OperationSectorDashboard.tsx` | Exceção "Core indisponível — verifique a ligação ao servidor". |
| `merchant-portal/src/pages/AppStaff/ManagerDashboard.tsx` | Causa "Core indisponível ou sem pulso confirmado." |

### 2.2 Separação App vs Config (esta implementação)

| Ficheiro | Alteração |
|----------|-----------|
| `docs/architecture/APPSTAFF_CONFIG_SEPARATION_CONTRACT.md` | **Novo.** Contrato: separação total; sem links do app para /config ou /admin; /app/setup/* que eram config → config-desktop-only. |
| `merchant-portal/src/pages/AppStaff/pages/ConfigDesktopOnlyPage.tsx` | **Novo.** Página no app que explica "Configuração no computador" e mostra URL /config; botão "Voltar ao início". |
| `merchant-portal/src/routes/OperationalRoutes.tsx` | Import de `ConfigDesktopOnlyPage`; rota `/app/staff/config-desktop-only` dentro do shell; `/app/setup/equipe`, `horarios`, `pagamentos`, `preferencias` → `Navigate to /app/staff/config-desktop-only` (em vez de /config/*). |
| `merchant-portal/src/pages/Activation/ActivationCenterPage.tsx` | Item "Configurar impressora" de `to="/config"` para `to="/app/staff/config-desktop-only"`. |

---

## 3. Regras de navegação (separação)

- **Dentro do AppStaff** não existem links para `/config` nem `/admin`.
- **Rotas /app/setup/** que antes redirecionavam para a web de configuração agora redirecionam para `/app/staff/config-desktop-only`:
  - `/app/setup/equipe` → `/app/staff/config-desktop-only`
  - `/app/setup/horarios` → `/app/staff/config-desktop-only`
  - `/app/setup/pagamentos` → `/app/staff/config-desktop-only`
  - `/app/setup/preferencias` → `/app/staff/config-desktop-only`
- **Centro de Ativação:** "Configurar impressora" abre `/app/staff/config-desktop-only`.
- **Ferramentas operacionais** mantêm-se: `/app/setup/menu` → menu-builder, `/app/setup/mesas` → operacao, `/app/setup/tpv` → op/tpv, `/app/setup/kds` → op/kds, `/app/setup/estoque` → inventory-stock.

---

## 4. Métricas e Core no telemóvel

- Métricas do dia vêm do RPC **get_daily_metrics** (Core). No telemóvel, se **VITE_CORE_URL** apontar para localhost, o Core não é acessível → valores "—" e mensagem "Conecte ao Core para ver métricas em tempo real."
- Para ver métricas e "cadastrados" no dispositivo: usar Core acessível (tunnel em dev ou URL de staging/produção).

---

## 5. Web pública: catálogo, pedidos e KDS (anti-regressão)

- **Web pública** (`/public/:slug`, `PublicWebPage`) está **ligada ao mesmo Core** que o TPV e o KDS: catálogo (gm_products, gm_menu_categories), pedidos (gm_orders).
- **Catálogo:** A web usa `readMenu(restaurantId)` (RestaurantReader); não existe catálogo separado. Estoque/disponibilidade vêm do mesmo Core (ex.: gm_products.available).
- **Pedidos:** Criação via `createOrder(restaurantId, items, "WEB_PUBLIC", paymentMethod)`. O **OrderWriter** passa `origin` em `p_sync_metadata` para o Core persistir em `gm_orders.origin`.
- **KDS / AppStaff KDS Mini:** Pedidos com `sync_metadata.origin === "WEB_PUBLIC"` aparecem no KDS e no KDS Mini; o **OriginBadge** exibe **"WEB"** (🌐) para indicar que o pedido veio da página web.
- **Contrato anti-regressão:** [docs/architecture/PUBLIC_WEB_ORDER_FLOW_CONTRACT.md](../architecture/PUBLIC_WEB_ORDER_FLOW_CONTRACT.md) — não remover origem WEB_PUBLIC, não duplicar catálogo, não ocultar badge no KDS.

---

## 6. Logo do restaurante (identidade visual)

- **Contrato anti-regressão:** [docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md). **Checklist PRs:** [docs/audit/RESTAURANT_LOGO_ANTI_REGRESSION.md](../audit/RESTAURANT_LOGO_ANTI_REGRESSION.md)
- **Onde se define:** Web de configuração → Identidade do Restaurante (campo **URL do logo**). Persistido em `gm_restaurants.logo_url` (migração `20260225_restaurant_logo_url.sql`).
- **Onde aparece:** Web pública (header PublicWebPage), KDS (KDSMinimal, KitchenDisplay), TPV (TPVHeader no TPV.tsx, TPVMinimal), AppStaff (top bar StaffAppShellLayout, boot screen AppStaffBootScreen).
- **Componente partilhado:** `merchant-portal/src/ui/RestaurantLogo.tsx` — recebe `logoUrl` e `name`; exibe imagem ou fallback (inicial do nome / ícone).
- **Leitura:** `useRestaurantIdentity().identity.logoUrl`; RuntimeReader `fetchRestaurant` / `fetchRestaurantForIdentity` incluem `logo_url`; IdentitySection e GeneralCardIdentity guardam e carregam `logo_url`.

---

## 7. Referências

- Contrato separação: [docs/architecture/APPSTAFF_CONFIG_SEPARATION_CONTRACT.md](../architecture/APPSTAFF_CONFIG_SEPARATION_CONTRACT.md)
- Contrato web pública + KDS: [docs/architecture/PUBLIC_WEB_ORDER_FLOW_CONTRACT.md](../architecture/PUBLIC_WEB_ORDER_FLOW_CONTRACT.md)
- Contrato logo: [docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md)
- Lei Final: [docs/architecture/APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md)
- RPC métricas: `docker-core/schema/migrations/20260210_daily_metrics_rpc.sql`
- Tabela staff: `docker-core/schema/migrations/20260203_gm_staff.sql`, seed Sofia Gastrobar: `20260207_seed_sofia_gastrobar.sql`
- Migração logo: `docker-core/schema/migrations/20260225_restaurant_logo_url.sql`

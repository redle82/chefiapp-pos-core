# Contrato — Logo do restaurante (identidade visual)

**Status:** OBRIGATÓRIO (anti-regressão)  
**Tipo:** Logo do restaurante deve estar presente em todos os pontos de contacto onde a identidade do estabelecimento é relevante, para que o dono sinta que "aquilo ali é dele".  
**Subordinado a:** APPSTAFF_VISUAL_CANON.md (quando no AppStaff).

---

## 1. Declaração

O **logo do restaurante** é a imagem de marca do estabelecimento. É **carregado/definido na web de configuração** (/admin/config → Geral/Identidade) e deve **aparecer de forma visível** na web pública, no KDS, no TPV, no AppStaff (shell, boot, launcher) e em qualquer ecrã onde a identidade do restaurante seja relevante.

---

## 2. Onde o logo é definido

| Local | Descrição |
|-------|-----------|
| **Web de configuração** | Secção Geral/Identidade em **/admin/config**. Campo para **URL do logo** (ou upload que gera URL). Fonte de verdade: coluna `gm_restaurants.logo_url`. *(Rota legada /config foi eliminada.)* |

---

## 3. Onde o logo e o nome devem aparecer (anti-regressão)

Em **cada** superfície (KDS, TPV, web, AppStaff) o **nome do restaurante** deve ser **visível como texto** (não apenas a inicial no fallback do logo). O logo (ou fallback) fica ao lado do nome.

| Contexto | Local | Obrigatório |
|----------|--------|-------------|
| **Web pública** | Header da página `/public/:slug` (PublicWebPage): logo ao lado do nome do restaurante. | Sim |
| **KDS** | Cabeçalho (KDSMinimal em `/op/kds`, KitchenDisplay): **logo + nome do restaurante em texto** (ex.: "Seu restaurante — KDS" ou "Sofia Gastrobar"). Título da aba: `{nome} — KDS`. | Sim |
| **TPV** | Cabeçalho (TPVHeader em TPV, TPVMinimal): logo + nome em texto (restaurantName). Título da aba: `{nome} — TPV`. | Sim |
| **AppStaff** | Shell (StaffAppShellLayout): logo + nome na top bar. Boot screen (AppStaffBootScreen): logo + nome visível. | Sim |
| **Web de configuração** | /admin/config (Geral): pré-visualização do logo ao definir/carregar. | Sim |

**Fonte da identidade:** `useRestaurantIdentity()` obtém nome e `logo_url` do Core (`fetchRestaurantForIdentity(restaurantId)`). Em modo trial usa `TRIAL_RESTAURANT_ID` (099, "Seu restaurante"); em real usa `runtime.restaurant_id` ou `chefiapp_restaurant_id` do storage (ex.: 100, Sofia Gastrobar). Não remover o uso de `storedRestaurantId` em `useRestaurantIdentity` para que /op/kds e /op/tpv mostrem identidade mesmo quando acedidos diretamente.

Se não houver `logo_url` definido, exibir **fallback**: nome do restaurante com ícone neutro (ex.: 🍽️) ou inicial do nome, nunca deixar a área vazia sem indicação de identidade.

---

## 4. Dados e persistência

| Item | Descrição |
|------|-----------|
| **Schema** | `gm_restaurants.logo_url` (TEXT, nullable). Migração: `20260225_restaurant_logo_url.sql`. |
| **Leitura** | RestaurantReader (CoreRestaurant), RuntimeReader (fetchRestaurant, fetchRestaurantForIdentity), useRestaurantIdentity (identity.logoUrl). |
| **Escrita** | /admin/config (Geral): atualizar `gm_restaurants.logo_url` ao guardar. |

---

## 5. Regras anti-regressão

| Regra | Descrição |
|-------|-----------|
| **Não remover a coluna logo_url** | A coluna `gm_restaurants.logo_url` é parte do contrato. Remover ou renomear sem contrato novo é regressão. |
| **Não remover o logo dos ecrãs listados** | Web pública, KDS, TPV e AppStaff devem continuar a exibir o logo (ou fallback) nos locais definidos. |
| **Configuração é o único sítio de definição** | O logo é definido apenas na web de configuração (/admin/config, secção Geral). Não definir em múltiplos sítios. |
| **Fallback consistente** | Se `logo_url` for null ou vazio, usar fallback (nome + ícone) em vez de área vazia. |

---

## 6. Ficheiros críticos (referência)

| Ficheiro | Responsabilidade |
|----------|------------------|
| `docker-core/schema/migrations/20260225_restaurant_logo_url.sql` | Coluna `logo_url` em gm_restaurants. |
| `merchant-portal/src/infra/readers/RestaurantReader.ts` | CoreRestaurant.logo_url. |
| `merchant-portal/src/infra/readers/RuntimeReader.ts` | fetchRestaurant / fetchRestaurantForIdentity incluem logo_url. |
| `merchant-portal/src/core/identity/useRestaurantIdentity.ts` | identity.logoUrl para UI. |
| `merchant-portal/src/pages/Onboarding/sections/IdentitySection.tsx` ou `GeneralCardIdentity` | Campo logo URL e persistência em gm_restaurants. |
| `merchant-portal/src/ui/RestaurantLogo.tsx` | Componente partilhado: exibe logo ou fallback; usado em PublicWeb, KDS, TPV, AppStaff. |

---

## 7. Violação

Remover a coluna `logo_url`, deixar de exibir o logo (ou fallback) num dos contextos listados, ou definir o logo fora da web de configuração é **violação de contrato**. Reverter ou ajustar para cumprir este documento.

---

## 8. URL de demonstração (dev/demo)

- Asset estático: `merchant-portal/public/logo-restaurant-demo.png`. Em desenvolvimento (origem `http://localhost:5175` ou equivalente), URL de exemplo: **`/logo-restaurant-demo.png`**. Pode ser usado como valor de `logo_url` na Configuração → Identidade para testar sem upload externo.

---

## 9. Referências

- Lei Final AppStaff: [APPSTAFF_VISUAL_CANON.md](./APPSTAFF_VISUAL_CANON.md)
- Web pública: [PUBLIC_WEB_ORDER_FLOW_CONTRACT.md](./PUBLIC_WEB_ORDER_FLOW_CONTRACT.md)
- Config: [APPSTAFF_CONFIG_SEPARATION_CONTRACT.md](./APPSTAFF_CONFIG_SEPARATION_CONTRACT.md) (config só no computador)
- Identidade (design): [IDENTITY_LAYER_CONTRACT.md](../design/IDENTITY_LAYER_CONTRACT.md)
- Implementação: [APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md](../implementation/APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md) §6
- Migração Core: `docker-core/Makefile` target `make migrate-logo-url`; ver [MIGRATIONS.md](../../docker-core/MIGRATIONS.md)
- Auditoria anti-regressão: [RESTAURANT_LOGO_ANTI_REGRESSION.md](../audit/RESTAURANT_LOGO_ANTI_REGRESSION.md) (checklist para PRs)

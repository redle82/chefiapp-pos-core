# Auditoria anti-regressão — Logo do restaurante

**Objetivo:** Garantir que alterações futuras não removam nem quebrem a identidade visual do logo. Usar como checklist em PRs que toquem em identidade, Core ou ecrãs listados.

**Contrato canónico:** [docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md)

---

## 1. Schema e Core

| Item | Verificação |
|------|-------------|
| Coluna `gm_restaurants.logo_url` | Existe; migração `20260225_restaurant_logo_url.sql`. Não remover sem contrato novo. |
| Aplicar migração | `cd docker-core && make up && make migrate-logo-url` (ou `dbmate up` com DATABASE_URL). |

---

## 2. Leitura e identidade

| Ficheiro | O que não remover/alterar |
|----------|---------------------------|
| `merchant-portal/src/infra/readers/RestaurantReader.ts` | `CoreRestaurant.logo_url`; select inclui logo_url quando usa `*`. |
| `merchant-portal/src/infra/readers/RuntimeReader.ts` | `CoreRestaurantRow` / `CoreRestaurantIdentityRow.logo_url`; `fetchRestaurant` e `fetchRestaurantForIdentity` devem incluir `logo_url` no select. |
| `merchant-portal/src/core/identity/useRestaurantIdentity.ts` | `RestaurantIdentity.logoUrl`; hidratação a partir de `row.logo_url` quando backend Docker. |

---

## 3. Configuração (único sítio de definição)

| Ficheiro | O que não remover/alterar |
|----------|---------------------------|
| `merchant-portal/src/pages/Onboarding/sections/IdentitySection.tsx` | Campo URL do logo; persistência `logo_url` no update a `gm_restaurants`. |
| `merchant-portal/src/features/admin/config/components/GeneralCardIdentity.tsx` | Campo URL do logo; leitura e escrita de `logo_url` em `gm_restaurants`. |

---

## 4. Componente partilhado

| Ficheiro | O que não remover/alterar |
|----------|---------------------------|
| `merchant-portal/src/ui/RestaurantLogo.tsx` | Componente que recebe `logoUrl` e `name`; exibe imagem ou fallback (inicial/ícone). Usado em todos os ecrãs de identidade. |

---

## 5. Ecrãs onde o logo deve aparecer (obrigatório)

| Contexto | Ficheiro | Onde |
|----------|----------|------|
| Web pública | `merchant-portal/src/pages/PublicWeb/PublicWebPage.tsx` | Header: RestaurantLogo + nome. |
| AppStaff shell | `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx` | Top bar: RestaurantLogo + nome do modo. |
| AppStaff boot | `merchant-portal/src/pages/AppStaff/AppStaffBootScreen.tsx` | Ecrã de arranque: RestaurantLogo + nome. |
| KDS | `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` | Cabeçalho: RestaurantLogo + "KDS — Pedidos ativos". |
| KDS | `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx` | Header: RestaurantLogo + estado. |
| TPV | `merchant-portal/src/ui/design-system/domain/TPVHeader.tsx` | RestaurantLogo + nome; TPV.tsx passa `logoUrl={identity?.logoUrl}`. |
| TPV | `merchant-portal/src/pages/TPV/TPV.tsx` | TPVHeader com prop `logoUrl`. |
| TPV mínimo | `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx` | RestaurantLogo + título. |

---

## 6. Documentação que referencia o logo (não remover referências)

| Documento | Secção / conteúdo |
|------------|-------------------|
| `docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md` | Contrato canónico; regras anti-regressão. |
| `docs/implementation/APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md` | §6 Logo do restaurante; §7 Referências (contrato + migração). |
| `docs/design/IDENTITY_LAYER_CONTRACT.md` | §5 Dados do restaurante: link para RESTAURANT_LOGO_IDENTITY_CONTRACT. |
| `docker-core/MIGRATIONS.md` | Tabela de migrations de referência: 20260225_restaurant_logo_url. |
| `docker-core/Makefile` | Target `migrate-logo-url`. |

---

## 7. Checklist rápido (PR que toque em identidade/Core/ecrãs)

- [ ] Coluna `gm_restaurants.logo_url` mantida (ou alteração coberta por contrato novo).
- [ ] RuntimeReader / RestaurantReader / useRestaurantIdentity continuam a expor `logo_url` / `logoUrl`.
- [ ] IdentitySection ou GeneralCardIdentity continuam a permitir definir e guardar URL do logo.
- [ ] RestaurantLogo continua a ser usado na web pública, KDS, TPV e AppStaff nos locais listados no contrato.
- [ ] Nenhum ecrã da lista §5 deixou de exibir logo ou fallback.

---

**Última atualização:** 2026-02 (implementação logo identidade visual).

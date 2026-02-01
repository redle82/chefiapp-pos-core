# ROTAS E CONTRATOS — Índice canónico (rota → contrato MD)

**Status:** CANONICAL  
**Tipo:** Índice — cada rota oficial mapeada para o contrato que a governa  
**Local:** docs/architecture/ROTAS_E_CONTRATOS.md  
**Hierarquia:** Subordinado a [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) e [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Regra

**Toda a rota oficial tem um contrato MD.** Este documento é o índice: rota → contrato. Não inferir rotas nem contratos fora desta lista.

---

## 1. Marketing público (sem Runtime/Core)

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/` | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) | Landing; CTAs /signup, /auth, /demo |
| `/demo` | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) | Demonstração |
| `/pricing` | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) | Página pública |
| `/features` | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) | Página pública |

Boot: PUBLIC. Não carrega Runtime nem Core. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 2. Auth e entrada

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/signup` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Criação de conta → /app/dashboard |
| `/auth` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Login; destino: /app/dashboard |
| `/login` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Redirect para /auth |
| `/forgot-password` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Redirect para /auth ou fluxo equivalente |

---

## 3. Portal de gestão (/app)

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/app/dashboard` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) | Comando central |
| `/app/restaurant` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) | Identidade do restaurante |
| `/app/menu` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [MENU_CONTRACT.md](./MENU_CONTRACT.md) | Cardápio |
| `/app/people` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) | Equipe |
| `/app/payments` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | Métodos de pagamento |
| `/app/billing` | [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) + [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) | Planos SaaS, assinatura |
| `/app/settings` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) | Configurações gerais |
| `/app/publish` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) | Publicar restaurante; isPublished |
| `/app/install` | [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md) + [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) | Instalar TPV/KDS como Web App (NON-CORE) |

Boot: MANAGEMENT. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 4. Operação (/op)

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/op/tpv` | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) + [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) + [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) | TPV; gate published + billing; Web App Instalável |
| `/op/kds` | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) + [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) + [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md) | KDS; mesmo gate; Web App Instalável |
| `/op/cash` | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [CASH_REGISTER_LIFECYCLE_CONTRACT.md](./CASH_REGISTER_LIFECYCLE_CONTRACT.md) | Caixa; operational === true |
| `/op/staff` | [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md) | AppStaff Web (se existir) |

Legado: `/tpv` → `/op/tpv`, `/kds-minimal` → `/op/kds`. Boot: OPERATIONAL. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 5. Web pública do restaurante

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/public/:slug` | [CORE_PUBLIC_WEB_CONTRACT.md](../contracts/CORE_PUBLIC_WEB_CONTRACT.md) | Site do restaurante; ativo se isPublished === true |

Canónico de produto: `/r/:slug` (ver [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)). Implementação atual: `/public/:slug`.

---

## 6. Outros

| Rota | Contrato MD | Nota |
|------|-------------|------|
| `/billing/success` | [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | Callback pós-pagamento; sem Runtime |
| `/onboarding`, `/onboarding/:section` | [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md) | Opcionais; checklist/ajuda; não bloqueia |

---

## Resumo por contrato (quem governa o quê)

| Contrato MD | Rotas governadas |
|-------------|-------------------|
| PUBLIC_SITE_CONTRACT | /, /demo, /pricing, /features |
| AUTH_AND_ENTRY_CONTRACT | /signup, /auth, /login, /forgot-password |
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT | /bootstrap |
| TENANT_SELECTION_CONTRACT | /app/select-tenant |
| PORTAL_MANAGEMENT_CONTRACT | /app/dashboard, /app/restaurant, /app/menu, /app/people, /app/payments, /app/settings, /app/publish |
| CORE_BILLING_AND_PAYMENTS_CONTRACT | /app/billing, /billing/success |
| BILLING_SUSPENSION_CONTRACT | Estados e bloqueio de /app/billing e /op/* |
| OPERATIONAL_ROUTES_CONTRACT + OPERATIONAL_GATES_CONTRACT | /op/tpv, /op/kds, /op/cash, /op/staff |
| OPERATIONAL_INSTALLATION_CONTRACT + OPERATIONAL_APP_MODE_CONTRACT + OPERATIONAL_INSTALL_FLOW_CONTRACT | Instalação e fluxo /app/install, /op/tpv, /op/kds (NON-CORE) |
| RESTAURANT_LIFECYCLE_CONTRACT | Ciclo configured → published → operational; /app/publish |
| CORE_PUBLIC_WEB_CONTRACT | /public/:slug |

---

## Referências

- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — lista oficial de rotas e runtime
- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo do cliente (visão produto)
- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — índice geral de contratos

**Violação = rota ou contrato fora do índice.**

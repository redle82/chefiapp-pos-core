# Onde ver no navegador — General, Ubicaciones, Staff + Location

**Status:** Referência  
**Tipo:** Mapa do que foi implementado → URLs e como chegar.  
**Subordinado a:** [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md).

---

## 1. Configuração > Geral e Ubicaciones (Trilho B)

Tudo isto está sob **ConfigLayout** (sidebar Configuração). É preciso estar autenticado e passar pelo FlowGate (portal de gestão).

| O que | URL | Como chegar |
|-------|-----|-------------|
| **Entrada Config** | `/config` | Redireciona para `/config/general`. |
| **Geral** (identidade, idioma, recibo, integrações) | `/config/general` | Sidebar: **Geral** ou abrir diretamente `…/config/general`. |
| **Ubicaciones** (lista de locais) | `/config/ubicaciones` | Sidebar: **Ubicaciones** ou `…/config/ubicaciones`. |
| **Nova ubicación** | `/config/ubicaciones/nova` | Na lista Ubicaciones, botão **Nova ubicación**. |
| **Editar ubicación** | `/config/ubicaciones/:id` | Na lista, botão **Editar** num card (ex.: `…/config/ubicaciones/loc-1`). |

**Contratos:** [CONFIG_GENERAL_WIREFRAME.md](./CONFIG_GENERAL_WIREFRAME.md), [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md), [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md).

---

## 2. Staff + seleção de local (Trilho A)

O gate **“Staff Session requires Location”** e o fluxo de seleção de local estão no **StaffModule** (StaffProvider + AppStaff). No portal, isso é exposto em:

| O que | URL | O que se vê |
|-------|-----|-------------|
| **Staff com Location** (fluxo completo) | `/app/staff` | 1) Se 0 ubicaciones ativas → **NoLocationsView**. 2) Se 1 ativa → auto-seleção → AppStaffLanding (código/contrato). 3) Se >1 ativas → **LocationSelectView** (escolher local) → depois Landing / Check-in / etc. |

**Nota:** As rotas `/op/staff` e `/garcom` mostram **AppStaffMobileOnlyPage** (“disponível apenas no app mobile”). Para ver o gate Location e a seleção de local no browser, usar **`/app/staff`**.

**Contrato:** [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md).

---

## 3. Menu digital (catálogo visual)

Catálogo de decisão: hero, categorias, pratos. Contrato: [MENU_VISUAL_RUNTIME_CONTRACT.md](./MENU_VISUAL_RUNTIME_CONTRACT.md).

| O que | URL | Dados |
|-------|-----|--------|
| **Menu baseline** | `/menu` | Mock (Gringo's). |
| **Menu premium (V2)** | `/menu-v2` | Docker Core quando `restaurant_id` + `menu_catalog_enabled`; senão mock. Hero com onda; conteúdo passa por detrás. |

Local: `http://localhost:5175/menu` ou `http://localhost:5175/menu-v2`.

---

## 4. Resumo rápido

| Funcionalidade | URL canónica |
|----------------|--------------|
| Config (entrada) | `/config` → `/config/general` |
| Geral (4 cards) | `/config/general` |
| Lista Ubicaciones | `/config/ubicaciones` |
| Criar ubicación | `/config/ubicaciones/nova` |
| Editar ubicación | `/config/ubicaciones/:id` |
| Staff com Location (gate + seleção) | `/app/staff` |
| Menu digital (baseline) | `/menu` |
| Menu digital (premium V2) | `/menu-v2` |

---

## 5. Referências

- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — índice rota → contrato.
- [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md) — Ubicaciones.
- [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md) — Staff + Location.

**Última atualização:** 2026-02-06

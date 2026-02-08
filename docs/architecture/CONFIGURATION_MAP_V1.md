# Mapa da Configuração Last.app — v1

**Referência única** para a árvore de configuração estilo Last.app no ChefIApp. Contrato: [TWO_DASHBOARDS_REFERENCE.md](./TWO_DASHBOARDS_REFERENCE.md). Shell único: [DashboardLayout](merchant-portal/src/features/admin/dashboard/components/DashboardLayout.tsx) + rotas `/admin/config/*`.

---

## 1. Início / Operacional (fora da Config)

Estes itens fazem parte do mapa da sidebar mas **não são Configuração**. São operação, gestão e análise. Já cobertos pelo dashboard central + rotas `/admin/*`.

| Item | Rota atual / nota |
|------|-------------------|
| Início | `/admin/reports/overview` (Owner Dashboard central) |
| Clientes | `/admin/customers` |
| Cierres temporales | `/admin/closures` |
| Gestor de reservas | `/admin/reservations` |
| Pagos | `/admin/payments` |
| Promoções | `/admin/promotions` |
| Catálogo | `/admin/catalog`, `/admin/products` |
| Reportes | `/admin/reports`, `/admin/reports/overview`, etc. |
| Tienda de dispositivos | `/admin/devices` |

**Regra:** Não duplicar. Manter no AdminSidebar como navegação operacional.

---

## 2. Configuración (núcleo)

Cada item da sidebar Last.app com status no ChefIApp e mapeamento para rotas/componentes.

### 2.1 General

- **Conteúdo Last.app:** Dados de contacto (teléfono, correo), Texto adicional para recibos, Idioma, Conecta con Google (Place ID).
- **Status:** `parcial` → redesenho por wireframe.
- **ChefIApp:** `GeneralConfigPage` (`/admin/config/general`). Wireframe: [CONFIG_GENERAL_WIREFRAME.md](./CONFIG_GENERAL_WIREFRAME.md).
- **Notas:** 4 cards (Identidade do Restaurante; Idioma & Localização; Texto fiscal/recibo; Integrações básicas). Cada card com Guardar local. Sem métricas. Endereço de contacto em General; mesas/capacidade/zones em Ubicaciones.

### 2.2 Productos

- **Conteúdo Last.app:** Produtos, categorias, preços, impostos, modificadores, combos.
- **Status:** `feito`
- **ChefIApp:** `/admin/products`, `/admin/catalog`, `/admin/modifiers`, `/admin/combos`.
- **Notas:** Só encaixar na navegação `/admin/config/productos` (redirect ou wrapper).

### 2.3 Suscripción

- **Conteúdo Last.app:** Plano ativo, upgrade/downgrade, faturação, trial.
- **Status:** `parcial`
- **ChefIApp:** Conceito de plano e billing; `/app/billing` referenciado no ConfigSidebar antigo.
- **Notas:** Pode entrar depois do MVP. Placeholder em `/admin/config/suscripcion`.

### 2.4 Ubicaciones

- **Conteúdo Last.app:** Restaurantes/locais, endereço, zona horária, multi-location.
- **Status:** `parcial`
- **ChefIApp:** `ConfigLocationPage` (`/config/location`, `/config/location/address`, `/config/location/tables`).
- **Notas:** Migrar para `/admin/config/ubicaciones` (e sub-rotas se necessário).

### 2.5 Entidades Legales

- **Conteúdo Last.app:** Razão social, NIF/CIF, endereço fiscal, dados de faturação.
- **Status:** `não iniciado`
- **ChefIApp:** Ainda não estruturado.
- **Notas:** Fase 2. Placeholder em `/admin/config/entidades-legales`.

### 2.6 Marcas

- **Conteúdo Last.app:** Marca principal, sub-marcas, identidade visual.
- **Status:** `não iniciado`
- **ChefIApp:** Só necessário se multi-marca.
- **Notas:** Placeholder em `/admin/config/marcas`; entrar mais tarde.

### 2.7 Usuarios Administradores

- **Conteúdo Last.app:** Owners, managers, permissões.
- **Status:** `parcial`
- **ChefIApp:** Roles e permissões em `core/roles`; `ConfigPeoplePage` com papéis/funcionários.
- **Notas:** Falta UI unificada de administradores. Alta prioridade; pode reaproveitar ConfigPeoplePage.

### 2.8 Gestión de dispositivos

- **Conteúdo Last.app:** TPVs, tablets, terminais, status online/offline.
- **Status:** `parcial`
- **ChefIApp:** `/admin/devices`; TPV/AppStaff existem.
- **Notas:** Falta painel de gestão. Reaproveitar ou placeholder em `/admin/config/dispositivos`.

### 2.9 Impresoras

- **Conteúdo Last.app:** Impressoras, tipos, rotas de impressão.
- **Status:** `não iniciado`
- **ChefIApp:** Planejado (CORE_PRINT_CONTRACT).
- **Notas:** Placeholder em `/admin/config/impresoras`; depois do TPV estável.

### 2.10 Integraciones

- **Conteúdo Last.app:** Pagamentos, delivery, APIs externas.
- **Status:** `parcial`
- **ChefIApp:** `ConfigIntegrationsPage` (`/config/integrations`).
- **Notas:** Migrar para `/admin/config/integraciones`.

### 2.11 Delivery

- **Sub-itens Last.app:** Delivery, Plano de mesas, Horarios, QR.
- **Status:** `parcial`
- **ChefIApp:** Mesas em ConfigLocationPage (tables); horários em ConfigSchedulePage; QR em PublicQRSection.
- **Notas:** Organizar sob `/admin/config/delivery` (plano-mesas, horarios, qr). Reutilizar componentes existentes.

### 2.12 Empleados

- **Conteúdo Last.app:** Funcionários, funções, turnos.
- **Status:** `parcial`
- **ChefIApp:** `ConfigPeoplePage` (`/config/people`, `/config/people/employees`, `/config/people/roles`); AppStaff.
- **Notas:** Migrar para `/admin/config/empleados` (wrapper ou mesma página).

### 2.13 Software TPV

- **Sub-itens Last.app:** Configuração, Modo rápido.
- **Status:** `parcial`
- **ChefIApp:** TPV existe; falta página de configuração clara.
- **Notas:** Placeholder ou página mínima em `/admin/config/software-tpv` (config, modo-rapido).

### 2.14 Reservas

- **Sub-itens Last.app:** Disponibilidad, Garantía y Cancelación, Turnos, Mensajes y recordatorios.
- **Status:** `parcial`
- **ChefIApp:** Reservas em `/admin/reservations`; configuração de reservas não unificada.
- **Notas:** Fase 2. Placeholder em `/admin/config/reservas` (disponibilidad, garantia, turnos, mensajes).

---

## 3. Tienda de dispositivos

- **Last.app:** Loja de hardware (TPV, impressoras, etc.).
- **ChefIApp:** Opcional. Pode ser parceria ou página externa. Não é core agora. Rota `/admin/devices` já existe para gestão; loja é outro conceito.

---

## 4. Regras

- **Não criar outra página de dashboard.** O dashboard central é um só: Owner Dashboard em `/admin/reports/overview`.
- **Cada item da Configuração = rota sob o mesmo shell.** Todas as rotas de config vivem em `/admin/config/*` com [DashboardLayout](merchant-portal/src/features/admin/dashboard/components/DashboardLayout.tsx).
- **Migrar o que já existe, não duplicar.** Reaproveitar ConfigIdentityPage, ConfigLocationPage, ConfigPeoplePage, ConfigIntegrationsPage, etc., como conteúdo das novas rotas ou como wrappers.
- **Sidebar = mapa.** A área "Configuración" no admin mostra a árvore (General, Productos, …); o conteúdo fica no centro. Opção implementada: layout de duas colunas dentro do centro (submenu config + `<Outlet />`).

---

## 5. Árvore de rotas (URL → componente → estado)

Todas as rotas abaixo usam [DashboardLayout](merchant-portal/src/features/admin/dashboard/components/DashboardLayout.tsx). O item "Configuración" no [AdminSidebar](merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx) aponta para `/admin/config`; a página `/admin/config` usa layout de duas colunas (submenu General, Productos, … + `<Outlet />`).

| Rota | Componente | Estado |
|------|------------|--------|
| `/admin/config` | Redirect para `/admin/config/general` | — |
| `/admin/config/general` | GeneralConfigPage (identidade + local + idioma + texto recibos + Google) | Migrar ConfigIdentity + partes ConfigLocation + novo |
| `/admin/config/productos` | Redirect ou wrapper para `/admin/products` | Já existe |
| `/admin/config/suscripcion` | SuscripcionConfigPage (placeholder) | Placeholder |
| `/admin/config/ubicaciones` | ConfigLocationPage ou wrapper | Migrar de /config/location |
| `/admin/config/ubicaciones/address` | Idem (tab/segmento) | Migrar |
| `/admin/config/ubicaciones/tables` | Idem (tab/segmento) | Migrar |
| `/admin/config/entidades-legales` | EntidadesLegalesPage (placeholder) | Placeholder |
| `/admin/config/marcas` | MarcasPage (placeholder) | Placeholder |
| `/admin/config/usuarios` | UsuariosAdminPage (placeholder ou ConfigPeoplePage) | Parcial / migrar |
| `/admin/config/dispositivos` | Redirect para `/admin/devices` ou wrapper | Já existe / wrapper |
| `/admin/config/impresoras` | ImpresorasPage (placeholder) | Placeholder |
| `/admin/config/integraciones` | ConfigIntegrationsPage ou wrapper | Migrar de /config/integrations |
| `/admin/config/delivery` | DeliveryConfigPage (índice ou redirect) | Parcial |
| `/admin/config/delivery/plano-mesas` | Mesas/tables (reutilizar ConfigLocationPage tables) | Migrar |
| `/admin/config/delivery/horarios` | ConfigSchedulePage ou wrapper | Migrar |
| `/admin/config/delivery/qr` | PublicQRSection ou wrapper | Migrar |
| `/admin/config/empleados` | ConfigPeoplePage ou wrapper | Migrar de /config/people |
| `/admin/config/software-tpv` | SoftwareTPVPage (placeholder) | Placeholder |
| `/admin/config/software-tpv/config` | Sub-página (placeholder) | Placeholder |
| `/admin/config/software-tpv/modo-rapido` | Sub-página (placeholder) | Placeholder |
| `/admin/config/reservas` | ReservasConfigPage (placeholder) | Placeholder |
| `/admin/config/reservas/disponibilidad` | Sub-página (placeholder) | Placeholder |
| `/admin/config/reservas/garantia` | Sub-página (placeholder) | Placeholder |
| `/admin/config/reservas/turnos` | Sub-página (placeholder) | Placeholder |
| `/admin/config/reservas/mensajes` | Sub-página (placeholder) | Placeholder |

---

*Alterações por decisão de produto. Ver [CANONICAL_ROUTES_BY_MODE.md](./CANONICAL_ROUTES_BY_MODE.md) para modo (Piloto/Operacional).*

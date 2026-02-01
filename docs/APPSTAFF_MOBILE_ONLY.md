# AppStaff = Mobile Only

**Decisão:** AppStaff é o terminal humano do OS e roda **exclusivamente em mobile** (iOS e Android). Não é web, não é dashboard, não é KDS/TPV de desktop.

**Contrato:** [CORE_APPSTAFF_CONTRACT.md](./architecture/CORE_APPSTAFF_CONTRACT.md) — §6 e §8.

---

## O que mudou no merchant-portal (web)

| Antes | Depois |
|-------|--------|
| `/garcom` → AppStaffMinimal (terminal staff em web) | `/garcom` → AppStaffMobileOnlyPage («Disponível apenas no app mobile») |
| `/garcom/mesa/:tableId` → TablePanel | `/garcom/mesa/:tableId` → AppStaffMobileOnlyPage |
| Dashboard: painel AppStaff → AppStaffMinimal | Dashboard: painel AppStaff → AppStaffMobileOnlyPage |

**Removido do uso activo no web (não apagados do repositório):**

- Nenhuma rota nem painel do dashboard renderiza **AppStaffMinimal** nem **TablePanel** para contexto staff.
- **AppStaffMinimal.tsx** e **TablePanel.tsx** continuam no código (StaffContext e outros módulos podem depender de hooks/contexto); apenas deixaram de ser o destino das rotas `/garcom` e `/garcom/mesa/:tableId`.

**Novo ficheiro:**

- `merchant-portal/src/pages/AppStaff/AppStaffMobileOnlyPage.tsx` — página única exibida em `/garcom` e no painel AppStaff do dashboard.

---

## Onde roda o AppStaff (terminal real)

| Plataforma | Projecto | Comando |
|------------|----------|---------|
| iOS Simulator | `mobile-app/` (Expo) | `npm run ios` ou `expo run:ios` |
| Android Emulator | `mobile-app/` (Expo) | `npm run android` ou `expo run:android` |

Navegação principal no app mobile: Home, Tarefas, Mini KDS (kitchen), Mini TPV (orders/tables), Perfil, Check-in / Check-out — conforme CORE_APPSTAFF_CONTRACT e subcontratos.

---

## Sem dependência circular

- **merchant-portal** não importa o projecto `mobile-app`.
- **mobile-app** pode chamar APIs/backend partilhados; não renderiza conteúdo do merchant-portal.
- Staff que acede ao web em `/garcom` vê apenas a mensagem para usar o app mobile.

---

## Resumo da arquitectura

| Terminal | Onde roda |
|----------|-----------|
| AppStaff (execução humana) | iOS / Android (mobile-app) |
| KDS / TPV | Desktop / Edge (merchant-portal) |
| Dashboard (governança, métricas) | Web (merchant-portal) |
| Core | Manda em todos |

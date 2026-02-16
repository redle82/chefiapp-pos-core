# Módulos e dispositivos — regras anti-regressão

**Status:** CANONICAL  
**Propósito:** Evitar que redundâncias e inconsistências entre Hub Módulos, instalação TPV/KDS e Configuração voltem a ser introduzidas.  
**Local:** docs/architecture/MODULES_AND_DEVICES_ANTIREGRESSION.md  
**Relacionado:** [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md), [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md).

---

## 1. Regras obrigatórias (não violar)

### 1.1 TPV e KDS abrem em janela dedicada

- **Regra:** Qualquer acção "Abrir TPV" ou "Abrir KDS" a partir da web de configuração (Módulos, Software TPV, Tienda de dispositivos) deve abrir `/op/tpv` ou `/op/kds` em **nova janela** (`window.open(..., '_blank')`), nunca na mesma aba (`navigate()` ou `<Link to>`).
- **Motivo:** TPV/KDS são dispositivos operacionais instalados; não devem ser usados "dentro" da mesma aba da config.
- **Onde aplicar:** `ModulesPage` (handlePrimaryAction para `tpv` e `kds`), `SoftwareTpvPage`, `InstallPage` (já cumpre).
- **Anti-regressão:** Não adicionar `navigate("/op/tpv")` nem `<Link to="/op/tpv">` para abrir o TPV a partir de admin/config. Usar sempre `window.open(origin + '/op/tpv', '_blank')` (ou equivalente).

### 1.2 Uma única rota canónica para instalação TPV/KDS

- **Rota canónica:** `/admin/devices` (Tienda de dispositivos no menu principal).
- **Regra:** A página "Instalar TPV e KDS" (InstallPage) é servida apenas em `/admin/devices`. A rota `/app/install` deve **redirecionar** para `/admin/devices` (redirect 302/Replace), não duplicar conteúdo.
- **Referências a usar:** `DeviceBlockedScreen`, `useOperationalReadiness`, `ConfigSidebar`, `CoreFlow.isWebConfigPath`, links "Ir para Instalação" → `/admin/devices`.
- **Anti-regressão:** Não voltar a renderizar InstallPage em `/app/install`. Não criar nova rota alternativa para a mesma página de instalação.

### 1.3 Hub Módulos: título e naming

- **Título da página:** "Módulos" (não "Mis productos").
- **Subtítulo:** "Activa o configura los módulos que quieras usar." (ou equivalente).
- **Motivo:** "Mis productos" confunde com produtos do restaurante (menu); o conteúdo são módulos/features da ChefIApp.
- **Anti-regressão:** Em comentários, docs e E2E, usar "Módulos" / "Hub Módulos" para a página `/admin/modules`. E2E que afirmem o heading devem esperar "Módulos".

### 1.4 Módulos operacionais no Hub (TPV e KDS)

- **Regra:** TPV e KDS devem aparecer como cartões no Hub Módulos ("Esenciales del día a día"), com acção primária "Abrir" que abre em nova janela (ver §1.1).
- **Implementação:** `modulesDefinitions` inclui `tpv` e `kds`; `getModulePrimaryPath("tpv")` → `/op/tpv`, `getModulePrimaryPath("kds")` → `/op/kds`; em `ModulesPage`, os ids em `OPERATIONAL_MODULE_IDS` ("tpv", "kds") disparam `window.open` em vez de `navigate`.
- **Anti-regressão:** Não remover KDS do Hub. Não mudar o comportamento de "Abrir" para TPV/KDS para navegação na mesma aba.

### 1.5 Sem duplicar rotas para a mesma página

- **Regra:** Uma página = uma rota canónica. Redirects legados são aceitáveis (ex.: `/app/install` → `/admin/devices`), mas não duas rotas que renderizem o mesmo conteúdo sem redirect.
- **Anti-regressão:** Ao adicionar nova rota, verificar se já existe página equivalente; se sim, usar redirect em vez de segundo `element={<SamePage />}`.

---

## 2. Checklist antes de alterar Módulos ou Dispositivos

Antes de mudar comportamento em:

- `merchant-portal/src/features/admin/modules/`
- `merchant-portal/src/features/admin/software-tpv/`
- `merchant-portal/src/pages/InstallPage.tsx`
- Rotas `/admin/devices`, `/app/install`, `/admin/modules`

verificar:

1. [ ] "Abrir TPV" / "Abrir KDS" continuam a abrir em **nova janela**?
2. [ ] A página de instalação continua a ter **uma única rota canónica** (`/admin/devices`) com redirect de `/app/install`?
3. [ ] O título da página Módulos continua **"Módulos"** (não "Mis productos")?
4. [ ] TPV e KDS continuam no Hub Módulos com acção "Abrir" em nova janela?
5. [ ] E2E `products-routing.spec.ts` continua a esperar heading "Módulos" e a tratar tpv/kds como popup?

---

## 3. Referências de código (fonte de verdade)

| Regra              | Ficheiro(s) principal(is) |
|--------------------|---------------------------|
| Abrir TPV/KDS nova janela | `ModulesPage.tsx` (OPERATIONAL_MODULE_IDS, handlePrimaryAction), `SoftwareTpvPage.tsx`, `InstallPage.tsx` |
| Rota canónica install     | `OperationalRoutes.tsx` (path `/admin/devices` → InstallPage; path `/app/install` → Navigate to `/admin/devices`) |
| Referências /admin/devices | `DeviceBlockedScreen.tsx`, `useOperationalReadiness.ts`, `ConfigSidebar.tsx`, `CoreFlow.ts` (isWebConfigPath) |
| Título Módulos            | `ModulesPage.tsx` (AdminPageHeader title="Módulos") |
| Definições TPV/KDS no Hub | `modulesDefinitions.ts` (ids tpv, kds), `ModulesPage.tsx` (getModulePrimaryPath) |
| E2E anti-regressão        | `tests/e2e/products-routing.spec.ts` (heading Módulos, openInNewWindow para tpv/kds) |

---

## 4. Histórico de decisão

- **Antes:** "Mis productos" como título; TPV/KDS a abrir na mesma aba a partir de Módulos e Software TPV; duas rotas para InstallPage (`/app/install` e `/admin/devices`); KDS não aparecia no Hub Módulos.
- **Alterações (anti-regressão):** Título "Módulos"; TPV/KDS sempre em nova janela; rota canónica `/admin/devices`, `/app/install` → redirect; KDS no Hub com "Abrir" em nova janela; documentação e checklist para evitar regressão.

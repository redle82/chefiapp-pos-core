# Fase 3 — Evidence pack: merchant-portal

**Objetivo:** Evidência de conformidade do merchant-portal com o épico [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md).  
**Última atualização:** 2026-03

---

## 1. Auth source

| Item | Valor | Evidência |
|------|--------|-----------|
| Admin `/admin/*` e `/app/*` | Supabase/Core session (tenant + utilizador autenticado) | Rotas protegidas por auth; `RoleGate` e gestão de tenant. Session via Supabase Auth ou Core conforme config. |
| Página `/install` | Anónimo + token no query string | `InstallPage.tsx` lê `token` de `useSearchParams`; não exige sessão; RPC `consume_device_install_token` chamado com o token. |

**Referências:** `merchant-portal/src/App.tsx` (provider chain), `merchant-portal/src/pages/InstallPage.tsx` (sem auth, token na URL).

---

## 2. Pairing entrypoint

| Item | Valor | Evidência |
|------|--------|-----------|
| Geração de token | `/admin/devices` — UI para criar token (TPV/KDS/AppStaff); mostra QR/instruções | `AdminDevicesPage`, `InstallQRPanel`, `DesktopPairingSection`; `devicesApi.createInstallToken()`. |
| Link para instalação | `/install?token=…` | QR e instruções apontam para `window.location.origin + "/install?token=" + token`. |
| Consumo do token | `consume_device_install_token` via PostgREST | `devicesApi.consumeInstallToken(token, meta)` → `coreClient.rpc("consume_device_install_token", { p_token, p_device_meta })`. |

**Referências:** `merchant-portal/src/features/admin/devices/`, `merchant-portal/src/features/admin/devices/api/devicesApi.ts`, `merchant-portal/src/pages/InstallPage.tsx`.

---

## 3. Device persistence

| Contexto | Comportamento | Evidência |
|----------|----------------|-----------|
| Admin | N/A (admin não é device) | — |
| Página `/install` (browser) | Após `consume_device_install_token` sucesso, persiste em `localStorage`: `chefiapp_terminal_id`, `chefiapp_restaurant_id`, `chefiapp_terminal_type`, `chefiapp_terminal_name`; também `setTabIsolated` para as mesmas chaves. | `InstallPage.tsx` linhas 76–84. |
| TPV/KDS (clientes que usam installedDeviceStorage) | Leitura/escrita via `getInstalledDevice` / `setInstalledDevice`; chave `chefiapp_installed_device`; formato `InstalledDevice` (`device_id`, `restaurant_id`, `module_id`, `device_name`). | `merchant-portal/src/core/storage/installedDeviceStorage.ts`; usado em `TPVMinimal`, `KDSMinimal`, `useDeviceGate`, `DevicePairingView`. |

**Nota:** A página `/install` persiste em chaves genéricas para compatibilidade com PWA/Electron; apps TPV/KDS que usam `installedDeviceStorage` usam o contrato `InstalledDevice` na mesma origem.

**Referências:** `InstallPage.tsx`, `installedDeviceStorage.ts`, `useDeviceGate.ts`, `TPVMinimal.tsx`, `KDSMinimal.tsx`.

---

## 4. Role source

| Regra | Implementação | Evidência |
|-------|----------------|-----------|
| Papel nunca inferido do texto do código | Em produção: `connectByCode` consulta `active_invites`; `role = data.role_granted`. Em trial/mock: role vem de `getTrialGuideRoleFromInviteTable(code)` (tabela fixa código → papel). | `connectByCode.ts`: path B) PRODUCTION usa `data.role_granted`; path A) mock usa `getTrialGuideRoleFromInviteTable`; em ambos os casos `roleSource: "invite"`. |
| Nenhum parsing de role a partir da string do código | Não existe código que faça `role = code.split('-')[1]` ou similar. | Inspeção de `connectByCode.ts` e tipos; teste `connectByCode.test.ts` afirma `roleSource === "invite"`. |

**Referências:** `merchant-portal/src/features/auth/connectByCode/connectByCode.ts`, `connectByCode.test.ts`; contrato `CODE_AND_DEVICE_PAIRING_CONTRACT.md`.

---

## 5. Recovery / reinstall

| Fluxo | Disponibilidade | Evidência |
|-------|-----------------|-----------|
| Gerar novo token | Admin em `/admin/devices` pode criar novo token (por tipo TPV/KDS/AppStaff). | UI em `AdminDevicesPage` / `InstallQRPanel`; `createInstallToken` em `devicesApi`. |
| Revogar terminal | Botão/accião em `/admin/devices` chama `revokeTerminal(terminalId)` → RPC `revoke_terminal`. | `devicesApi.revokeTerminal`; E2E `devices-installation.spec.ts` cobre revoke. |
| Re-instalar com novo token | Device que foi revogado ou perdeu estado pode abrir de novo `/install?token=<novo_token>`. | Fluxo igual ao primeiro install; token de uso único. |

**Referências:** `devicesApi.ts` (`createInstallToken`, `revokeTerminal`), `merchant-portal/tests/e2e/contracts/devices-installation.spec.ts`.

---

## 6. Evidence — testes e contratos

| Tipo | Ficheiro / recurso | O que valida |
|------|--------------------|--------------|
| E2E / contrato | `merchant-portal/tests/e2e/contracts/devices-installation.spec.ts` | `/install` sem token mostra instruções; `/install?token=XYZ` chama `consume_device_install_token` e mostra "Dispositivo ativado"; revoke em `/admin/devices` chama `revoke_terminal`. |
| Unit | `merchant-portal/src/features/auth/connectByCode/connectByCode.test.ts` | `roleSource === "invite"`; role resolvido por mock invite table, não por texto. |
| Unit (conformidade) | `merchant-portal/src/features/admin/devices/api/devicesApi.conformance.test.ts` | `consumeInstallToken` usa `coreClient.rpc("consume_device_install_token", …)` (não `db` nem outro cliente). |

**Comando rápido (merchant-portal):** `pnpm test:fase3-conformance` — corre apenas os testes de conformidade Fase 3 (role source + Core RPC).

**Probe global (raiz do repo):** `npm run audit:fase3-conformance` — corre: (1) desktop-app estrutura (TerminalConfig, pairing no README), (2) merchant-portal test:fase3-conformance, (3) mobile-app testes mobileActivationApi. Útil para CI ou validação local.

**Screenshots / estados críticos:** A documentar manualmente ou via run de E2E (pairing ok, token expirado, revoke). Os textos de erro/sucesso usados no portal estão em `InstallPage.tsx` e nas páginas de devices.

---

## 7. Tabela de conformidade (merchant-portal)

| Contrato | merchant-portal |
|----------|------------------|
| Identidade e confiança do terminal (Core autoridade) | Conforme — RPCs `consume_device_install_token`, `device_heartbeat`, `revoke_terminal` via Core; sem inventar identidade no cliente. |
| Pairing por token | Conforme — Token gerado em admin; consumido em `/install`; Core cria `gm_terminals`. |
| Role source (invite/backend only) | Conforme — `connectByCode` usa `active_invites.role_granted` (prod) ou tabela mock (trial); nunca parsing do código. |
| Device persistence | Conforme — `InstallPage` persiste após consume; TPV/KDS usam `installedDeviceStorage` conforme `DEVICE_CONTRACT`. |
| Recovery/reinstall | Conforme — Novo token e revoke disponíveis; reinstall = novo token. |

---

*Evidence pack para Fase 3 — merchant-portal. Manter atualizado quando alterar fluxos de auth, pairing ou role.*

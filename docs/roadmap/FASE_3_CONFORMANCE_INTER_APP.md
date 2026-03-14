# Fase 3 — Conformance Inter-App

**Status:** Épico ativo  
**Tipo:** Conformidade e validação operacional (não feature work)  
**Última atualização:** 2026-03

---

## 1. Posição estratégica

**Formulação canónica:**

> Neste repo, a Fase 3 está suportada em nível de **contrato** e **backend-facing flows**; o trabalho remanescente é de **conformidade inter-app** e **validação operacional**, não de desenho de nova arquitetura.

A decisão correta é **não reabrir a arquitetura** aqui sem necessidade. O risco seria mexer no que já está canónico e voltar a criar deriva.

---

## 2. O que está fechado neste repo

| Área | Estado |
|------|--------|
| Contratos canónicos de identidade/pairing/device | Fechado — `CORE_IDENTITY_AND_TRUST_CONTRACT.md`, `CODE_AND_DEVICE_PAIRING_CONTRACT.md`, `DEVICE_CONTRACT.md` |
| Fluxo portal de provisioning | Fechado — `/admin/devices` → token → `/install?token=…` → `consume_device_install_token` |
| Boundary de autoridade no Core | Fechado — Core é autoridade para identidade de terminais e chaves de confiança; papel vem do invite/backend |
| Identidade e confiança do device | Fechado — `gm_terminals`, `gm_device_install_tokens`, heartbeat, revoke |
| Role source | Fechado — `connectByCode` + `active_invites.role_granted`; nunca inferido do texto do código |

---

## 3. O que ainda não está fechado no produto

| Área | Responsável | Nota |
|------|-------------|------|
| Aderência do **desktop-app** ao contrato | desktop-app / Electron | Consome token? Persiste deviceId/secret? Heartbeat? |
| Aderência do **mobile-app** ao contrato | mobile-app / Expo | Idem para AppStaff/Waiter; mesmo endpoint e metadados |
| UX ponta a ponta do operador | Cross-app | Admin → instalação → uso real em TPV/KDS/AppStaff sem fricção |
| Prova operacional | QA / ops | Todos os clientes persistem e reutilizam deviceId/secret como esperado |

---

## 4. Roadmap prático da Fase 3 (Conformance)

### 4.1 Conformance matrix

Para cada superfície, preencher e validar:

| Superfície | Auth source | Pairing entrypoint | Device persistence | Role source | Recovery / reinstall |
|------------|-------------|--------------------|--------------------|-------------|----------------------|
| **merchant-portal** (admin) | Supabase/Core session | Gera token em `/admin/devices`; redireciona para QR/instruções | N/A (admin não é device) | Session/tenant | N/A |
| **merchant-portal** (`/install`) | Anon + token | `/install?token=…` → `consume_device_install_token` | LocalStorage/contract conforme `installedDeviceStorage` | N/A (device) | Re-instalar com novo token |
| **desktop-app** (TPV/KDS) | Identidade do device após pairing (sem login humano) | Merchant-portal em Electron: ecrã setup → token → mesmo `consumeInstallToken()` (devicesApi) → `coreClient.rpc(consume_device_install_token)` | electron-store: `TerminalConfig` (terminalId, restaurantId, terminalType, terminalName, pairedAt); `readTerminalConfig` / `writeTerminalConfig` | N/A (device TPV/KDS) | `clearTerminalConfig()`; re-pair com novo token |
| **mobile-app** (AppStaff/Waiter) | Gateway `/mobile/activate`: activationToken + PIN → session (accessToken, refreshToken) + principal (roles) em SecureStore | Fluxo próprio: token + PIN → POST gateway; não usa `consume_device_install_token` (canal AppStaff) | SecureStore: ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PRINCIPAL_KEY, INSTALL_ID_KEY | Backend: `MobileActivateResponse.principal.roles` — papel vem do servidor, não do texto | Limpar estado de ativação; reativar com novo token/PIN |

**Definition of Done (matrix):** Cada célula preenchida com valor verificado (não "TBD"); evidência (teste, screenshot ou log) por superfície.

---

### 4.2 Golden flows

Fluxos que devem funcionar ponta a ponta e ser documentados/provados:

1. **Admin gera token** — Admin em `/admin/devices` cria token (TPV/KDS/AppStaff); token visível (QR/PIN/código) com TTL claro.
2. **Dispositivo instala** — Device abre entrypoint (URL ou deep link), chama `consume_device_install_token` com metadados; Core cria `gm_terminals`; token marcado consumido.
3. **Dispositivo ativa** — Cliente persiste `deviceId`, `restaurantId`, `type`, `name`; envia heartbeat; aparece "Online" no admin.
4. **Operador entra** — AppStaff/Waiter usa código de convite; `connectByCode` resolve role a partir de invite; sessão inicia com papel correto.
5. **Sessão reabre sem perder identidade** — Reabrir app (desktop/mobile) reutiliza deviceId/secret e, se aplicável, sessão operador; não pede pairing de novo sem necessidade.
6. **Revoke/reinstall funciona** — Admin revoga terminal; device deixa de ser autorizado; reinstall com novo token restaura estado limpo.

**Definition of Done (golden flows):** Cada fluxo tem pelo menos um passo-a-passo escrito e um resultado verificado (manual ou E2E).

---

### 4.3 Evidence pack

| Item | Descrição | Dono |
|------|-----------|------|
| Teste/probe por superfície | merchant-portal: E2E ou contrato (ex.: `devices-installation.spec.ts`). desktop-app: script ou teste que confirma consumo de token e persistência. mobile-app: idem. | Eng |
| Screenshots/logs | Estados de sucesso e erro por fluxo (pairing ok, token expirado, revoke, reinstall). | QA / Eng |
| Tabela de conformidade por contrato | Uma linha por contrato relevante (identidade, pairing, device, role source); colunas: merchant-portal, desktop-app, mobile-app; valor: Conforme / Parcial / Não conforme. | Tech lead |

---

### 4.4 UX normalization

- **Textos e estados de erro/sucesso** — Copiar e unificar mensagens entre portal, desktop e mobile (ex.: "Dispositivo ativado", "Token expirado", "Código inválido ou expirado").
- **Nenhuma app inventa papel** — Garantir que nenhum cliente infere role a partir do texto do código; sempre via backend/invite.
- **Nenhuma app bypassa o backend** — Operações que exijam autoridade (pedidos, pagamentos, provisioning) passam pelo Core; sem atalhos locais que quebrem soberania.

---

## 5. Checklist objetivo por app

### 5.1 merchant-portal (este repo)

- [x] **Auth source:** Documentado (Supabase/Core session); usado em `/admin/*` e `/app/*`. Ver [FASE_3_MERCHANT_PORTAL_EVIDENCE.md](./FASE_3_MERCHANT_PORTAL_EVIDENCE.md) §1.
- [x] **Pairing entrypoint:** `/admin/devices` gera token; UI mostra QR/instruções; link para `/install?token=…`. Ver evidence §2.
- [x] **Device persistence:** N/A para admin; `/install` persiste em localStorage após `consume_device_install_token`; TPV/KDS usam `installedDeviceStorage`. Ver evidence §3.
- [x] **Role source:** `connectByCode` + `active_invites.role_granted`; nunca do texto. Ver evidence §4; teste `connectByCode.test.ts` (Fase 3 conformance).
- [x] **Recovery/reinstall:** Fluxo "gerar novo token" e "revogar" disponíveis; documentado. Ver evidence §5.
- [x] **Evidence:** E2E `devices-installation.spec.ts`; unit `connectByCode.test.ts` e `devicesApi.conformance.test.ts`; evidence pack [FASE_3_MERCHANT_PORTAL_EVIDENCE.md](./FASE_3_MERCHANT_PORTAL_EVIDENCE.md). Screenshots dos estados críticos a preencher manualmente quando necessário.

### 5.2 desktop-app (workspace `desktop-app` neste repo)

- [x] **Auth source:** Após pairing, identidade do device apenas (sem login de utilizador). TerminalConfig em electron-store: terminalId, restaurantId, terminalType, terminalName. Ref: `desktop-app/src/main.ts` (readTerminalConfig/writeTerminalConfig).
- [x] **Pairing entrypoint:** Electron carrega merchant-portal; ecrã de setup (`/electron/setup`) → utilizador introduz token → frontend chama `consumeInstallToken()` (mesmo devicesApi do portal) → `coreClient.rpc(consume_device_install_token)`. Ref: `desktop-app/README.md` "How Pairing Works", merchant-portal `ElectronSetupPage` + devicesApi.
- [x] **Device persistence:** electron-store com TerminalConfig (terminalId, restaurantId, terminalType, terminalName, pairedAt). Reutiliza em reabertura; navega para `/op/tpv` ou `/op/kds` consoante tipo. Ref: `main.ts` readTerminalConfig/writeTerminalConfig.
- [x] **Role source:** N/A — TPV/KDS são dispositivos, não operadores com papel.
- [x] **Recovery/reinstall:** `clearTerminalConfig()` (IPC `clear-terminal-config`); utilizador pode voltar ao setup e inserir novo token. Ref: `main.ts`.
- [ ] **Evidence:** Teste ou checklist manual que confirme: token inserido → RPC chamado → config persistido → reabertura sem re-pairing. (Probe automatizado a adicionar se desejado.)

### 5.3 mobile-app (workspace `mobile-app` neste repo)

- [x] **Auth source:** Gateway `/mobile/activate`: activationToken + PIN → resposta com session (accessToken, refreshToken) e principal (roles, modulesEnabled, permissions). Persistência em SecureStore. Ref: `mobile-app/services/mobileActivationApi.ts`.
- [x] **Pairing entrypoint:** Fluxo próprio de ativação (token + PIN → POST gateway), não usa `consume_device_install_token` (canal AppStaff/Waiter distinto do TPV/KDS). Alinhado em contrato com gateway que valida token/PIN e devolve identidade e roles.
- [x] **Device persistence:** SecureStore: ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PRINCIPAL_KEY, INSTALL_ID_KEY. Reutiliza sessão em reabertura. Ref: `mobileActivationApi.ts` (safeSecureSet após activateWithQrPin).
- [x] **Role source:** Papel vem do backend: `MobileActivateResponse.principal.roles` — não inferido do texto do código. Conforme contrato "role from invite/backend". Ref: `mobileActivationApi.ts`.
- [ ] **Recovery/reinstall:** Limpar estado de ativação (SecureStore) e reativar com novo token/PIN. Documentar passos e testar.
- [ ] **Evidence:** Teste ou checklist manual: ativação com token+PIN → roles persistidos; reabertura sem re-pedir ativação; revoke/clear documentado.
- **Evidence pack formal (C4.1):** [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) — comandos de validação, evidência executável (role from backend, recovery, activation flow em mobileActivationApi.test.ts), contratos; classificação **ALIGNED**.

---

### 5.4 Checklists de evidência (manual)

**desktop-app — validar uma vez e assinalar:**

- [ ] Admin gera token em `/admin/devices`; abrir Electron → ecrã setup; introduzir token.
- [ ] Verificar (DevTools ou log) que é chamado `POST .../rpc/consume_device_install_token`.
- [ ] Após sucesso: app navega para `/op/tpv` ou `/op/kds`; fechar e reabrir: entra direto na operação (sem re-pedir token).
- [ ] Em algum momento: chamar clear pairing (se existir na UI) ou limpar electron-store; reabrir → volta ao setup; novo token funciona.

**mobile-app — validar uma vez e assinalar:**

- [ ] Obter token + PIN (gateway/backend); na app: introduzir e ativar.
- [ ] Verificar que roles vêm da resposta (ex.: principal.roles); fechar e reabrir app: não pede ativação de novo.
- [ ] Limpar estado de ativação (apagar app data ou função de logout/clear); reabrir → pede ativação; reativar com novo token/PIN funciona.

---

## 6. Referências

- [CORE_IDENTITY_AND_TRUST_CONTRACT.md](../architecture/CORE_IDENTITY_AND_TRUST_CONTRACT.md)
- [CODE_AND_DEVICE_PAIRING_CONTRACT.md](../architecture/CODE_AND_DEVICE_PAIRING_CONTRACT.md)
- [DEVICE_CONTRACT.md](../contracts/DEVICE_CONTRACT.md)
- [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md)
- `merchant-portal/src/features/auth/connectByCode/connectByCode.ts`
- `merchant-portal/src/features/admin/devices/` + `InstallPage` + `devicesApi.ts`

---

*Épico Fase 3 — Conformance Inter-App. O núcleo está fechado neste repo; o trabalho remanescente é alinhamento entre superfícies e prova operacional.*

## Desktop Modules Launch Flow

Documento de contrato para o fluxo de abertura de módulos operacionais de desktop (TPV/KDS) a partir do admin web (`/admin/modules`).

Foco: **não inventa features novas**, apenas formaliza e estabiliza o que já existe hoje (ModulesPage, DesktopInstallModal, AdminDevicesPage, DeviceGate, Electron handler `chefiapp://`).

---

### 1. Superfícies e sinais

- **Superfície de entrada**: `/admin/modules` (ModulesPage).
- **Módulos de desktop**: `tpv`, `kds`.
- **Fontes de sinal já existentes**:
  - **Runtime restaurante**: `RestaurantRuntimeContext` (`runtime.restaurant_id`, `installed_modules`, `active_modules`).
  - **Device registry**: API `gm_terminals` via `AdminDevicesPage` / `devicesApi` (lista de terminais, tipos TPV/KDS, heartbeat).
  - **Device instalado (desktop)**: `installedDeviceStorage` (TPV/KDS têm `restaurant_id` persistido localmente).
  - **Disponibilidade da app de desktop**:
    - URLs de download (`DesktopDownloadSection` + envs `VITE_DESKTOP_DOWNLOAD_*`).
    - URLs de instalador (`VITE_DESKTOP_INSTALL_URL_MACOS`, `VITE_DESKTOP_INSTALL_URL_WINDOWS`) usados no `DesktopInstallModal`.
  - **Deep link**: `buildDeepLink(moduleId, { restaurant })` → `chefiapp://open?app=tpv|kds&restaurant=...`.
  - **Heurística de launch atual (DesktopLaunchService)**:
    - `<iframe hidden src="chefiapp://...">` dispara o handler sem navegar a página.
    - `window.addEventListener("blur")` + `document.addEventListener("visibilitychange")` dão o sinal de sucesso (`HANDSHAKE_SUCCESS`).
    - `setTimeout(timeoutMs)` (default 5000ms ou `VITE_DESKTOP_LAUNCH_TIMEOUT_MS`) marca falha (`HANDSHAKE_TIMEOUT`) e abre o `DesktopInstallModal`.
    - `lastLaunchSuccessAt` é persistido em `localStorage` com TTL configurável (`VITE_DESKTOP_LAUNCH_TTL_DAYS`, default 7 dias) por `origin`/módulo/restaurante.

---

### 2. State machine (fonte de verdade)

Estado canónico: `DesktopLaunchState`, no contexto de um **módulo operacional de desktop** (TPV/KDS) visto a partir do admin.

Estados (máximo 7):

1. **UNKNOWN**
   - Estado inicial antes de ler sinais.
   - Não deve ser exibido; transita imediatamente para outro estado derivado.

2. **DESKTOP_NOT_INSTALLED**
   - Não há evidência de app desktop instalada no ambiente do admin.
   - Critérios possíveis (não exclusivos, combináveis):
     - Não há URL de instalador configurado para o OS corrente.
     - Nenhum terminal TPV/KDS registado em `gm_terminals` para o restaurante.
     - Nenhum `installedDeviceStorage` conhecido para TPV/KDS neste dispositivo.

3. **DESKTOP_INSTALLER_UNCONFIGURED**
   - Existe conceito de app desktop, mas **o instalador ainda não está devidamente configurado** para este OS (ex.: `VITE_DESKTOP_INSTALL_URL_*` vazio).
   - Usado para mostrar que “o produto existe”, mas falta setup de distribuição.

4. **DESKTOP_INSTALLED_NOT_CONFIGURED**
   - App desktop provavelmente instalada **mas sem device pareado** para este restaurante.
   - Sinais típicos:
     - Há download/installer configurado.
     - Existem registros em `gm_terminals` mas nenhum terminal ativo do tipo TPV/KDS para este restaurante **ou** o Device Gate devolve `DEVICE_NOT_INSTALLED` / `DEVICE_NOT_IN_CONFIG` / `DEVICE_RESTAURANT_MISMATCH`.

5. **DESKTOP_READY**
   - Pelo menos um terminal TPV/KDS ativo e autorizado para o restaurante (device registry + `installedDeviceStorage`/Device Gate concordam).
   - É o único estado onde **“Abrir” é ação primária e esperada**.

6. **LAUNCHING**
   - Estado transitório ao clicar em “Abrir” quando estamos em `DESKTOP_READY` (ou `DESKTOP_INSTALLED_NOT_CONFIGURED`, conforme se decidir).
   - Deep link `chefiapp://open?...` foi disparado; aguardamos evidência de que o desktop reagiu.
   - Hoje a evidência é heurística (`blur` + timeout); a implementação deve encapsular isto num handshake explícito.

7. **LAUNCH_FAILED**
   - A tentativa de abrir a app de desktop falhou ou é ambígua depois de um timeout controlado.
   - Este estado **dispara o modal `DesktopInstallModal`** ou equivalente, com opções de:
     - “Instalar desktop”
     - “Ir para Dispositivos”
     - “Reintentar”

---

### 3. Eventos e transições

Eventos canónicos:

- **BOOTSTRAP**: carregamento inicial de `/admin/modules` (runtime + devices + envs).
- **CLICK_OPEN**: utilizador clica no botão primário do módulo (ex.: “Open” para TPV/KDS).
- **CLICK_INSTALL_DESKTOP**: utilizador clica no botão secundário “Instalar desktop”.
- **HANDSHAKE_SUCCESS**: handshake com app desktop confirma que o launch foi bem sucedido (hoje inferido via `blur`, no futuro pode ser ping explícito).
- **HANDSHAKE_TIMEOUT**: não houve confirmação de sucesso até ao timeout (ex.: 2–3s).
- **DEVICE_REGISTRY_CHANGED**: devices em `gm_terminals` foram atualizados (novo terminal TPV/KDS ou revogação).

Transições desejadas:

- `UNKNOWN --(BOOTSTRAP)--> DESKTOP_NOT_INSTALLED | DESKTOP_INSTALLER_UNCONFIGURED | DESKTOP_INSTALLED_NOT_CONFIGURED | DESKTOP_READY`
- `DESKTOP_NOT_INSTALLED --(CLICK_INSTALL_DESKTOP)--> DESKTOP_NOT_INSTALLED`  
  (navega para `/admin/devices` ou abre `DesktopDownloadSection` — não muda o estado local, apenas direciona o utilizador)
- `DESKTOP_INSTALLER_UNCONFIGURED --(CLICK_INSTALL_DESKTOP)--> DESKTOP_INSTALLER_UNCONFIGURED`  
  (leva a `/admin/devices` para configurar URLs de instalador)
- `DESKTOP_INSTALLED_NOT_CONFIGURED --(CLICK_OPEN)--> LAUNCHING`
- `DESKTOP_READY --(CLICK_OPEN)--> LAUNCHING`
- `LAUNCHING --(HANDSHAKE_SUCCESS)--> DESKTOP_READY`  
  (fluxo ideal: app desktop abriu; ModulesPage apenas limpa o estado transitório)
- `LAUNCHING --(HANDSHAKE_TIMEOUT)--> LAUNCH_FAILED`
- `LAUNCH_FAILED --(CLICK_INSTALL_DESKTOP)--> DESKTOP_NOT_INSTALLED | DESKTOP_INSTALLED_NOT_CONFIGURED`  
  (dependendo de como o registry evoluir depois da instalação/pairing)
- `* --(DEVICE_REGISTRY_CHANGED)--> recomputar estado`  
  (qualquer mudança em gm_terminals pode reclassificar o módulo como READY / NOT_CONFIGURED, etc.)

---

### 4. Contrato de UI por estado (ModulesPage + DesktopInstallModal)

Para **cada módulo desktop** (TPV/KDS) na `/admin/modules`:

- **DESKTOP_NOT_INSTALLED**
  - **Primário**: botão “Instalar desktop”.
  - **Secundário**: opcional “Ir para Dispositivos”.
  - **Comportamento**:
    - Não tentar deep link.
    - Click “Instalar desktop” leva para `/admin/devices` (secção de downloads).

- **DESKTOP_INSTALLER_UNCONFIGURED**
  - UI igual a DESKTOP_NOT_INSTALLED, mas com cópia de texto explícita:
    - “Configurar instalador” ou nota de que ainda não há URL de instalador para o OS.
  - Click principal leva sempre para `/admin/devices` (configurar envs/links).

- **DESKTOP_INSTALLED_NOT_CONFIGURED**
  - **Primário**: “Abrir” (mantém semanticamente o que já existe: deep link).
  - **Secundário**: “Ir para Dispositivos”.
  - **Comportamento**:
    - Click “Abrir” → transição para `LAUNCHING` + deep link.
    - Se o Device Gate em TPV/KDS bloquear, o utilizador verá `DeviceBlockedScreen` e poderá regressar a `/admin/modules` a partir do app desktop.

- **DESKTOP_READY**
  - **Primário**: “Abrir”.
  - **Secundário**: “Ir para Dispositivos” (opcional).
  - **Comportamento**:
    - Click “Abrir” → `LAUNCHING` + deep link; esperado que o app desktop abra sem bloqueios.

- **LAUNCHING**
  - Estado interno (não precisa de layout diferente), mas:
    - Botão “Abrir” deve ficar **desativado ou com estado “A abrir…”** durante o handshake.
    - Não deve navegar a página nem mostrar prompts extra tipo “Leave site?” (idealmente usar padrões que minimizem estes prompts).

- **LAUNCH_FAILED**
  - **Modal `DesktopInstallModal`** deve estar visível:
    - Título: “Aplicación de escritorio necesaria”.
    - Texto explicando que o módulo TPV/KDS requer a app desktop.
    - Botões:
      - “Instalar em {OS}” (se houver URL) ou “Configurar instalador” (senão).
      - “Reintentar” (dispara novo deep link e volta para `LAUNCHING`).
      - “Ir a Dispositivos” (navega para `/admin/devices`).

---

### 5. Critério de sucesso — “Abrir TPV/KDS com sucesso”

Uma tentativa de abertura de módulo desktop a partir de `/admin/modules` é considerada **bem sucedida** quando:

1. O utilizador clica em “Abrir” num módulo TPV/KDS.
2. A state machine entra em `LAUNCHING`.
3. Dentro de um timeout definido (ex.: 2–3s), chega um sinal de **HANDSHAKE_SUCCESS** vindo da app desktop:
   - Hoje: inferido via `window.blur` (browser perde foco) **sem** o timeout disparar.
   - No futuro: idealmente reforçado por um handshake explícito (ex.: canal local, ping HTTP, etc.).
4. O estado volta a `DESKTOP_READY` (estado estável).
5. Não é mostrado `DesktopInstallModal` nem qualquer ecrã de erro na ModulesPage.

Nota: se o app desktop abre mas cai num `DeviceBlockedScreen` (device não pareado/autorizado), o critério de “launch bem sucedido” **do ponto de vista de `/admin/modules`** continua cumprido; o erro é operacional e tratado na superfície TPV/KDS, não no hub.


## Desktop Launch Protocol Contract — `chefiapp://`

Este documento fixa o contrato entre:

- **Admin Web** (`merchant-portal`, rota `/admin/modules`)
- **Desktop App** (`desktop-app`, `ChefIApp Desktop.app`)
- **Integration Gateway** (`server/integration-gateway.ts`, porta 4320)

para abrir os módulos **TPV/KDS** via deep link `chefiapp://` sem depender de
heurísticas frágeis (blur/visibility) ou do “humor” do macOS.

---

### 1. Identidade do handler

- Os esquemas **`chefiapp-pos`** (principal) e **`chefiapp`** (legado) são registados **apenas** pelo app empacotado `ChefIApp Desktop.app` via `electron-builder.yml`: `protocols: [{ name: "ChefIApp", schemes: ["chefiapp-pos", "chefiapp"] }]`. Em runtime, `desktop-app/src/main.ts` usa `PROTOCOL_SCHEME = "chefiapp-pos"` e `LEGACY_PROTOCOL_SCHEME = "chefiapp"`.
- Em **dev** (`IS_DEV === true`), o processo Electron **não** regista protocolos (para não "sujar" o LaunchServices). O handler do sistema só existe **após instalar o .dmg**.

#### 1.1 Botão «Abrir app TPV» (Admin `/admin/devices/tpv`)

- O Admin abre **`chefiapp-pos://setup`** (`AdminTPVTerminalsPage.tsx`, `DESKTOP_APP_SCHEME`). O Electron trata em `handleDeepLink(url)`: host/path `setup` → abre `/electron/setup`. **Alinhamento:** mesmo protocolo e rota; não há mismatch.
- **Requisito para o botão funcionar:** O SO tem de ter um handler registado para `chefiapp-pos://`. Isso só acontece **depois de instalar o app empacotado** (ex.: .dmg). Em dev, mesmo com `pnpm run dev:desktop`, o protocolo não é registado; o botão falha até instalar o .dmg. Em dev: abrir o desktop manualmente e colar o código de pareamento.
- **Como gerar o instalável e instalar:** ver [DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md](./DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md).

#### 1.2 Isolamento de superfície — Admin não no desktop

- O app desktop (**Electron**) deve operar **apenas** como TPV/setup/pareamento ou KDS. Rotas de **Admin** (`/admin/*`) **não** podem ser acedidas dentro do desktop.
- **Implementação:**
  - **ElectronAdminGuard:** Todas as rotas `/admin/*` estão envolvidas por `ElectronAdminGuard` (`OperationalRoutes.tsx`). Em `isDesktopApp() === true`, qualquer acesso a `/admin/*` mostra o ecrã «Área de administração» bloqueada (CTA «Fechar janela» e instrução para usar o portal no browser).
  - **FlowGate:** Em desktop, `lastRoute` guardado em storage **não** é restaurado quando é um path `/admin/*`; assim, o redirect de entrada não leva o utilizador para Admin dentro do desktop.
- **Regra:** Contexto/sessão de Admin não é reutilizado como sessão válida do TPV; após pareamento, o TPV opera com identidade de dispositivo/terminal. O desktop carrega a mesma SPA do merchant-portal mas com restrição de superfície (apenas `/electron/setup`, `/op/tpv`, `/op/kds` permitidos em prática; `/admin/*` bloqueado por guard).

#### 1.3 Dev: origem do frontend e diagnóstico de vazamento Admin

- Em **dev** (`IS_DEV === true`), o desktop carrega o frontend de **`CHEFIAPP_DEV_SERVER_URL`** (default **`http://localhost:5175`**). Ou seja, o que está a correr na porta 5175 é exactamente o que o desktop usa.
- Se **Port 5175 is already in use** ao fazer `pnpm run dev` no merchant-portal, outro processo (por exemplo um Vite antigo) está a usar a porta. O desktop continua a carregar desse processo; se esse processo for um build antigo **sem** o ElectronAdminGuard instrumentado, o Admin pode ainda renderizar e não aparecem logs `[CHEFIAPP_DEBUG]`.
- **Provar qual frontend está carregado:**
  1. **Terminal (main process):** ao abrir o desktop, o main regista `[boot] frontend loaded` com `url` (ex.: `http://localhost:5175/op/tpv` ou `file:// (hash: ...)`).
  2. **Consola do renderer (DevTools da janela do desktop):** executar `__CHEFIAPP_FRONTEND_BUILD`. Se for `undefined` → frontend **antigo** (sem guard instrumentado). Se tiver `{ guardInstrumented: true, guardVersion: 2, loadedAt: "..." }` → frontend **actual** com guard.
  3. Em rotas `/admin/*` deve aparecer `[CHEFIAPP_DEBUG] ElectronAdminGuard montado` com o payload; se não aparecer, o guard não está a ser montado (build antigo ou rota fora do guard).
- **Para testar o desktop com o frontend corrigido em dev:** (1) Libertar a porta 5175: `pnpm -w run kill:5175` (ou `lsof -ti:5175 | xargs kill -9`). (2) Iniciar o merchant-portal: `pnpm --filter merchant-portal run dev`. (3) Só depois abrir o desktop (ou recarregar a janela). Assim o desktop passa a carregar o bundle actual com guard e instrumentação.

---

### 2. Deep link com `nonce`

Sempre que o Admin tenta abrir TPV/KDS:

- `ModulesPage` constrói o deep link base com
  `buildDeepLink("tpv" | "kds", { restaurant })` →
  `chefiapp://open?app=tpv&restaurant=<id>`.
- `DesktopLaunchService.launchDesktopWithHandshake` gera um `nonce` único
  (`crypto.randomUUID` ou fallback) e acrescenta ao deep link:

```text
chefiapp://open?app=tpv&restaurant=<id>&nonce=<uuid>
```

- O deep link é disparado via `<iframe hidden src="...">` (sem navegar a
  página).

---

### 3. ACK determinístico (Integration Gateway)

O `nonce` é confirmado através do **Integration Gateway** (`PORT=4320`):

- Desktop → `POST /desktop/launch-acks`
  - Payload:

```json
{
  "nonce": "<uuid>",
  "moduleId": "tpv" | "kds",
  "deviceId": "<gm_terminals.id> | null",
  "restaurantId": "<restaurant_id> | null",
  "isPackaged": true | false,
  "appVersion": "<app version> | null",
  "launchAckSentAt": "<ISO timestamp> | null",
  "lastDeepLinkReceivedAt": "<ISO timestamp> | null"
}
```

- Headers (when `CHEFIAPP_DESKTOP_LAUNCH_ACK_SECRET` is enabled):

```text
x-chefiapp-ack-ts: <epoch ms>
x-chefiapp-ack-signature: <hmac-sha256 hex>
```

- Signature material:

```text
${nonce}.${moduleId}.${ackTs}
```

- Gateway validation (secret enabled):

  - missing headers -> `401 ack_signature_required`
  - malformed timestamp/signature -> `401 ack_signature_invalid`
  - timestamp outside skew window -> `401 ack_signature_expired`

- Compatibility mode:

  - If secret is not configured on gateway, unsigned ACK remains accepted.

- Implementação:

  - `server/integration-gateway.ts` mantém um
    `Map<string, DesktopLaunchAck>` em memória com TTL de 60s.

- Admin Web → `GET /desktop/launch-acks/:nonce`
  - Respostas:
    - `200 { found: true, ... }` — ACK registado dentro do TTL.
    - `200 { found: false }` — sem ACK (expirado ou inexistente).

O endpoint aplica CORS com `Access-Control-Allow-Origin` igual ao `CORS_ORIGIN`
do gateway, permitindo chamadas diretas do `merchant-portal`.

Referências operacionais desta fase:

- `docs/ops/DESKTOP_SECURITY_CHANGELOG_2026-03-07.md`
- `docs/ops/DESKTOP_RELEASE_GATE_CHECKLIST.md`

---

### 4. Desktop: envio de ACK e heartbeat

No `desktop-app/src/main.ts`:

- Função `handleDeepLink(url)`:
  - Faz o parse da URL `chefiapp://open?...`.
  - Se `app=tpv|kds` e existir `nonce`, chama
    `sendDesktopLaunchAck({ nonce, moduleId })` **fire-and-forget**.
- `sendDesktopLaunchAck`:
  - `POST` em `CHEFIAPP_DESKTOP_LAUNCH_ACK_BASE` (default
    `http://localhost:4320/desktop/launch-acks`).
  - Inclui `terminal.terminalId` e `terminal.restaurantId` se o Desktop estiver
    pareado.

Heartbeat:

- Quando o Desktop tem um terminal pareado (`TerminalConfig`),
  `startPrintWorker()` liga também o **heartbeat**:
  - `device_heartbeat(p_terminal_id, p_meta)` via `callCoreRpc`.
  - Intervalo: `DESKTOP_HEARTBEAT_INTERVAL_MS = 30s`.
- Ao limpar o pareamento ou desligar o print worker, o heartbeat é parado.

O Admin lê `gm_terminals.last_heartbeat_at` via `devicesApi.fetchTerminals` e
usa essa coluna como **fonte de verdade** para o estado Online/Offline.

---

### 5. DesktopLaunchService — estados e sinais

State machine (`DesktopLaunchService.ts`):

- Estados:
  - `DESKTOP_INSTALLER_UNCONFIGURED`
  - `DESKTOP_READY`
  - `LAUNCHING`
  - `LAUNCH_FAILED`
- Eventos:
  - `CLICK_OPEN` → `LAUNCHING` (quando READY/FAILED).
  - `HANDSHAKE_SUCCESS` → `DESKTOP_READY`.
  - `HANDSHAKE_TIMEOUT` (a partir de LAUNCHING) → `LAUNCH_FAILED`.

Sinais usados pelo handshake:

1. **ACK forte (preferencial)**:
   - Se `VITE_DESKTOP_LAUNCH_ACK_BASE` estiver definido no frontend,
     `launchDesktopWithHandshake`:
     - gera `nonce`;
     - dispara o iframe com o deep link;
     - inicia `pollAck` em `/desktop/launch-acks/:nonce` a cada 500ms;
     - em `found: true`:
       - marca `resolved = true`;
       - limpa timeout/listeners;
       - grava `lastLaunchSuccessAt` em `localStorage`;
       - chama `onSuccess()` → `HANDSHAKE_SUCCESS`.
2. **Blur/visibility (sinal fraco, fallback)**:
   - Continua registando `window.blur` +
     `document.visibilitychange(document.hidden)`.
   - Se acontecer antes do timeout e **nenhum ACK tiver sido recebido**,
     considera sucesso e executa o mesmo caminho (`setLastLaunchSuccessAt` +
     `onSuccess`).
3. **Timeout**:
   - Se nenhum ACK/blur antes de `timeoutMs`:
     - loga `[DesktopLaunch] timeout`;
     - chama `onTimeout()` → `HANDSHAKE_TIMEOUT`.

---

### 6. UI/Admin — interpretação de estado

- **ModulesPage**:
  - Botão **Abrir TPV/KDS**:
    - entra em `LAUNCHING` ao clicar.
    - Em `HANDSHAKE_SUCCESS`:
      - state volta para `DESKTOP_READY`;
      - o TTL de sucesso é persistido (`desktopLaunchSuccess:*` por
        `restaurantId`+`moduleId`).
    - Em `HANDSHAKE_TIMEOUT`:
      - state muda para `LAUNCH_FAILED`;
      - abre `DesktopInstallModal` com instruções de instalação/correção do
        protocolo.
- **AdminDevicesPage**:
  - Tabela de dispositivos mostra:
    - **verde**: heartbeat < 2 minutos → dispositivo online.
    - **amarelo**: heartbeat < 10 minutos.
    - **vermelho**: sem sinal recente.

Combinação esperada:

- `HANDSHAKE_SUCCESS` recente **e** dispositivo TPV/KDS com ponto **verde**
  indicam que:
  - deep link está a ser tratado pelo Desktop correto;
  - o módulo correspondente está com heartbeat ativo.

---

### 7. Checklist de QA

1. **Handler exclusivo**
   - Instalar `ChefIApp Desktop.app` a partir do `.dmg`.
   - Garantir que `chefiapp://open?app=tpv` abre o Desktop (não o Electron genérico).
2. **ACK**
   - Com o gateway a correr (`PORT=4320`), abrir `/admin/modules`.
   - Clicar **Abrir TPV** e verificar no log do gateway `/desktop/launch-acks` um `nonce` recebido.
3. **Handshake**
   - Configurar `VITE_DESKTOP_LAUNCH_ACK_BASE` no `merchant-portal` apontando para `http://localhost:4320/desktop/launch-acks`.
   - Clicar **Abrir TPV/KDS** e confirmar logs `[DesktopLaunch] handshake success` sem abertura do `DesktopInstallModal`.
4. **Heartbeat**
   - Com Desktop pareado, abrir `/admin/devices` e ver dispositivo TPV/KDS com ponto **verde** e `last_heartbeat_at` recente.
5. **Falha controlada**
   - Parar o Desktop e clicar **Abrir TPV** — não deve haver ACK e, após timeout, `LAUNCH_FAILED` e `DesktopInstallModal` devem ficar visíveis.

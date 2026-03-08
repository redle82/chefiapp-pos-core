## Desktop Launch Protocol Contract — `chefiapp://`

Este documento fixa o contrato entre:

- **Admin Web** (`merchant-portal`, rota `/admin/modules`)
- **Desktop App** (`desktop-app`, `ChefIApp Desktop.app`)
- **Integration Gateway** (`server/integration-gateway.ts`, porta 4320)

para abrir os módulos **TPV/KDS** via deep link `chefiapp://` sem depender de
heurísticas frágeis (blur/visibility) ou do “humor” do macOS.

---

### 1. Identidade do handler

- O esquema `chefiapp://` é registado **apenas** pelo app empacotado
  `ChefIApp Desktop.app` via `electron-builder.yml`:
  - `protocols: [{ name: "ChefIApp", schemes: ["chefiapp"] }]`.
- Em **dev**, o processo Electron não chama
  `app.setAsDefaultProtocolClient("chefiapp")`:
  - `src/main.ts` ignora o registo quando `IS_DEV === true`.
  - Resultado: o handler do sistema nunca é o Electron cru de `node_modules`.

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

# ChefIApp Desktop

Electron shell that wraps the merchant-portal frontend for desktop TPV and KDS terminals.

## Architecture

```
desktop-app/          ← Electron main process + preload
  src/main.ts         ← Window creation, IPC, protocol handler
  src/preload.ts      ← contextBridge exposing electronBridge to renderer
merchant-portal/      ← The actual frontend (React SPA)
  src/pages/ElectronSetup/  ← Pairing wizard shown on first launch
```

**Principle:** Electron is a thin shell. All business logic lives in the merchant-portal frontend and the Core (PostgREST + Postgres).

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Core running (`docker compose -f docker-core/docker-compose.core.yml up -d`)

### Run in dev mode

From workspace root:

```bash
pnpm run dev:desktop
```

This starts:

1. Merchant-portal Vite dev server on `http://localhost:5175`
2. Electron shell loading that URL (after 3s delay for Vite to start)

### Run Electron only (if merchant-portal dev server is already running)

```bash
cd desktop-app
pnpm run dev
```

## How Pairing Works

1. **Admin** opens `/admin/devices` in the portal → clicks "Generate install code"
2. **User** launches the desktop app → sees the setup screen (`/electron/setup`)
3. User enters the install token → `consumeInstallToken()` RPC pairs the device
4. Terminal config (id, restaurant, type) is saved to `electron-store`
5. App navigates to `/op/tpv` or `/op/kds` based on terminal type
6. On subsequent launches, the app loads directly to the operational route

## Building for Distribution

```bash
# macOS (DMG + ZIP, arm64 + x64)
pnpm run build:desktop

# Or from desktop-app directly:
cd desktop-app
node scripts/build-electron.mjs

# Windows (future)
node scripts/build-electron.mjs --win
```

**Note:** P0 ships without code signing. macOS users will see a Gatekeeper warning.

## Project Structure

```
desktop-app/
├── src/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Context bridge (electronBridge API)
├── scripts/
│   └── build-electron.mjs  # Full build pipeline
├── assets/
│   └── icon.svg         # App icon (placeholder)
├── electron-builder.yml # Packaging configuration
├── package.json
├── tsconfig.json
└── README.md
```

## IPC Bridge API

The preload script exposes `window.electronBridge` to the renderer:

| Method                          | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `getTerminalConfig()`           | Get stored terminal pairing config           |
| `setTerminalConfig(config)`     | Save pairing config after successful pairing |
| `clearTerminalConfig()`         | Reset pairing (unpair device)                |
| `getAppInfo()`                  | Get app version, platform, arch              |
| `navigateToApp("tpv" \| "kds")` | Navigate to operational module               |

## URL Protocol

Registered: `chefiapp-pos://` (legacy `chefiapp://` still accepted)

Deep links (future):

- `chefiapp-pos://open?app=tpv` — Open TPV
- `chefiapp-pos://open?app=kds` — Open KDS

## Key Decisions

- **Routing híbrido por ambiente**: Dev usa `http://localhost:5175`; build empacotada usa `file://.../index.html#/...` (hash routing)
- **User-Agent includes "Electron"**: Required for `isElectron()` detection in platformDetection.ts
- **VitePWA disabled** for Electron builds: Desktop manages its own lifecycle
- **No auth in P0**: `consume_device_install_token` RPC is anon-accessible
- **electron-store**: Encrypted JSON for terminal config persistence

---

import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron';
import path from 'path';
import url from 'url';

// Helper functions for route checks and operational start path
function isAdminRoute(url: string) {
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/admin') || u.hash.includes('/admin');
  } catch {
    return url.includes('/admin') || url.includes('#/admin');
  }
}

function isOperationalRoute(url: string) {
  return url.includes('/op/tpv') || url.includes('/op/kds') || url.includes('#/op/tpv') || url.includes('#/op/kds');
}

function getOperationalStartForModule(moduleId: string | undefined) {
  if (moduleId === 'tpv') return '/op/tpv';
  if (moduleId === 'kds') return '/op/kds';
  return undefined;
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startupModule = process.env.CHEFIAPP_MODULE;
  let startUrl = process.env.DEV_SERVER_URL || url.format({
    pathname: path.join(__dirname, '../renderer/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  const forcedOperationalPath = getOperationalStartForModule(startupModule);
  if (forcedOperationalPath && isAdminRoute(startUrl)) {
    console.log('[boot] admin startUrl blocked (operational isolation) -> forcing', forcedOperationalPath, 'from', startUrl);
    startUrl = startUrl.includes('#')
      ? startUrl.replace(/#.*$/, `#${forcedOperationalPath}`)
      : new URL(forcedOperationalPath, startUrl).toString();
  }

  mainWindow.loadURL(startUrl);

  mainWindow.webContents.on('will-navigate', async (event, url) => {
    if (getOperationalStartForModule(startupModule) && isAdminRoute(url)) {
      event.preventDefault();
      console.log('[boot] admin navigation opened externally (operational isolation):', url);
      try { await shell.openExternal(url); } catch {}
      const back = getOperationalStartForModule(startupModule);
      if (back && !isOperationalRoute(mainWindow!.webContents.getURL())) {
        const base = mainWindow!.webContents.getURL();
        const next = base.includes('#') ? base.replace(/#.*$/, `#${back}`) : new URL(back, base).toString();
        mainWindow!.webContents.loadURL(next);
      }
      return;
    }

    // [boot] blocked navigation (operational isolation)
    // existing handler code here...
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (getOperationalStartForModule(startupModule) && isAdminRoute(url)) {
      console.log('[boot] window.open to admin opened externally (operational isolation):', url);
      try { shell.openExternal(url); } catch {}
      return { action: 'deny' };
    }

    // existing allow/deny logic here...
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

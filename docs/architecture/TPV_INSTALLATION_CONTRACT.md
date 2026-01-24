# TPV Installation Contract
>
> **Authority**: Architecture Guard
> **Status**: DRAFT
> **Scope**: TPV & KDS "Installation" mechanics

## 1. The Core Philosophy

**"ChefIApp does not install software. It offers surfaces that the OS accepts to install."**

We strictly avoid "native" installers (.exe, .dmg, .msi). We rely entirely on the modern **Progressive Web App (PWA)** standard to achieve persistence, offline capability, and system integration.

## 2. Installation Vectors

### 2.1. The "Install" Button (Dashboard)

The dashboard provides explicit actions to "launch" dedicated surfaces. These actions trigger the browser's PWA installation prompts or open the surface in a dedicated window.

| Surface | Dashboard Trigger | Resulting Action | Route |
| :--- | :--- | :--- | :--- |
| **TPV (Caixa)** | "Instalar TPV neste computador" | Opens TPV Context + Triggers PWA Install Prompt | `/app/tpv` |
| **KDS (Cozinha)** | "Abrir Modo Cozinha" | Opens KDS Context + Enters Fullscreen | `/app/kds/:id` |

### 2.2. Context Isolation

The TPV and KDS run in separate contexts from the Admin Panel to ensure stability and performance.

* **Admin Panel**: `/app/dashboard` - Heavy, management-focused, authentication-heavy.
* **TPV**: `/app/tpv` - Optimized for touch, speed, offline-first. Limited routing.
* **KDS**: `/app/kds` - High-contrast, read-only focus, real-time sync.

## 3. The PWA "Software" Experience

When "installed", expectations are:

* **Window**: Runs in its own window, no browser address bar (`display: standalone`).
* **Icon**: Has its own dedicated icon in the Dock/Taskbar.
* **Offline**: Loads instantly via Service Worker cache.
* **Persistence**: Remembers login/session independently of the browser tabs.

## 4. Hardware Integration Strategy

We prioritize standard Web APIs. The "Local Bridge" is a fallback, not a default.

### 4.1. Level 1: Native Web APIs (Preferred)

* **Printing**: `window.print()` / Browser Print Dialog (System Default).
* **Scanners**: HID Mode (Keyboard Emulation). No driver needed.
* **Bluetooth**: WebBluetooth API (modern thermal printers).

### 4.2. Level 2: The Local Bridge (Optional)

Only required for robust, direct hardware control without dialogs.

* **Daemon**: A tiny local Go/Rust binary.
* **Protocol**: WebSocket (localhost:xxxx).
* **Use Cases**:
  * Silent printing (EscPOS raw commands).
  * Opening cash drawers directly.
  * Legacy Serial/COM devices.

## 5. Security & Governance

* **Device Authorization**: TPVs must be "authorized" via the Admin Panel before processing payments (prevents rogue installs).
* **Session**: TPV sessions are long-lived but scoped to the device.
* **Updates**: Silent, background updates via Service Worker lifecycle.

## 6. Implementation Checklist

- [ ] **Manifest**: Ensure `manifest.json` supports `display: standalone`.
* [ ] **Icons**: High-res icons defined for all platforms.
* [ ] **Service Worker**: Cache-first strategy for TPV/KDS routes.
* [ ] **Install Prompt**: React hook to capture and trigger `beforeinstallprompt`.
* [ ] **Dashboard UI**: Implement "Instalar TPV" button functionality.

# OPERATIONAL_DEVICE_ONLY_CONTRACT

## Purpose

Define laws that prevent regression of:
- TPV/KDS opening in plain browser (or PWA "Open in app") when they must run in desktop app
- Cache/SW serving old builds ("tela antiga voltou")
- Confusion between PWA install prompt and "Abrir no Desktop ChefApp"

**References:** [OPERATIONAL_INSTALLATION_CONTRACT](../architecture/OPERATIONAL_INSTALLATION_CONTRACT.md), [SYSTEM_RULE_DEVICE_ONLY](../architecture/SYSTEM_RULE_DEVICE_ONLY.md)

---

## Invariantes (Leis)

### Lei O1 — /op/* bloqueado no browser

- `/op/tpv`, `/op/kds` e rotas operacionais desktop: **só permitidas em Electron/Tauri** (aplicação desktop instalada).
- No browser (incluindo PWA standalone): **bloqueio com BrowserBlockGuard** — ecrã "TPV não pode ser aberto no navegador" + CTA para Dispositivos.
- **Exceção:** `?mode=trial` permite demo no browser (Centro de Ativação).

### Lei O2 — CTA "Abrir no Desktop"

- O CTA deve usar deep link / `openOperationalWindow` para abrir o app desktop, não depender do Chrome "Open in app" (PWA).
- Texto explícito: "Abrir no Desktop ChefApp" (não ambíguo).

### Lei O3 — Dev/Trial não regista Service Worker

- Em `import.meta.env.DEV` ou trial: **nunca** registrar SW; desregistrar existentes no boot.
- Evita cache fantasma → "tela antiga voltou".

---

## Detection (BrowserBlockGuard)

| Ambiente        | TPV/KDS permitido? |
|-----------------|--------------------|
| Electron        | ✅                 |
| Tauri/ToDesktop | ✅ (user-agent)    |
| PWA standalone  | ❌ (não é desktop app) |
| Browser tab     | ❌ (exceto ?mode=trial) |
| React Native    | ✅ (para mobile)   |

---

## Enforcement

- **Guardrails:** `scripts/check-operational-device-only.mjs`
- **E2E:** `operational-browser-block.spec.ts` — abre /op/tpv no browser, valida bloqueio.
- **Runbook:** [ANTI_CACHE_DEV_RITUAL.md](../runbooks/ANTI_CACHE_DEV_RITUAL.md)

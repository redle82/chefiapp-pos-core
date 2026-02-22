# REGRA DE SISTEMA — APENAS APLICAÇÃO INSTALADA

> **Documento IMUTÁVEL** — não pode ser alterado sem revisão arquitectural completa.
> Criado: 2025-01-01
> Ref: BrowserBlockGuard.tsx, DESKTOP_DISTRIBUTION_CONTRACT.md, OPERATIONAL_INSTALLATION_CONTRACT.md

---

## Regra

**TPV, KDS e AppStaff NÃO EXISTEM como web app.**
**Eles só existem como aplicação instalada (desktop ou mobile).**
**O painel web Admin é a única parte do ChefIApp acessível pelo navegador.**

Esta é uma regra **imutável** do sistema.

---

## Matriz de Acesso

| Módulo    | Browser (web) | Desktop (Electron) | Mobile (Expo/RN) |
| --------- | :-----------: | :----------------: | :--------------: |
| Admin     |      ✅       |         —          |        —         |
| TPV (DPV) | ❌ Bloqueado  |   ✅ Obrigatório   |        —         |
| KDS       | ❌ Bloqueado  |   ✅ Obrigatório   |        —         |
| AppStaff  | ❌ Bloqueado  |         —          |  ✅ Obrigatório  |
| Waiter    | ❌ Bloqueado  |         —          |  ✅ Obrigatório  |

---

## Enforcement — 3 Níveis

### Nível 1: Frontend Route Guard (BrowserBlockGuard)

- **Ficheiro:** `merchant-portal/src/components/operational/BrowserBlockGuard.tsx`
- **CSS:** `merchant-portal/src/components/operational/BrowserBlockGuard.module.css`
- **Tipo:** Layout route (React Router v6) que envolve os grupos de rotas operacionais.
- **Lógica:**
  - `isInstalledApp()` → permite acesso (Electron, standalone PWA, ReactNativeWebView).
  - Caso contrário → ecrã de bloqueio fullscreen com instruções de instalação.

### Nível 2: Provisioning Contract

- Dispositivos devem ser provisionados via QR (Admin → Dispositivos).
- O token de instalação vincula o dispositivo ao restaurante.
- Sem provisioning, o device não tem acesso aos dados do restaurante.

### Nível 3: Distribution Channel

- **Desktop (TPV, KDS):** Electron apps distribuídos via download direto (Admin → Dispositivos → Downloads).
- **Mobile (AppStaff, Waiter):** Expo/React Native app distribuída via App Store e Google Play.
- **Admin:** Browser (merchant-portal SPA).

---

## Rotas Protegidas

| Rota            | Guard                                     | Plataforma |
| --------------- | ----------------------------------------- | ---------- |
| `/op/tpv`       | `BrowserBlockGuard(desktop, "TPV")`       | Desktop    |
| `/op/kds`       | `BrowserBlockGuard(desktop, "KDS")`       | Desktop    |
| `/app/staff/*`  | `BrowserBlockGuard(mobile, "AppStaff")`   | Mobile     |
| `/app/waiter/*` | `BrowserBlockGuard(mobile, "Comandeiro")` | Mobile     |

---

## Detecção de Plataforma

```typescript
function isInstalledApp(): boolean {
  return isElectron() || isStandalone() || isReactNativeWebView();
}
```

- **Electron:** `navigator.userAgent.includes("Electron")`
- **Standalone PWA:** `window.matchMedia("(display-mode: standalone)")` (ponte temporária)
- **React Native WebView:** `window.ReactNativeWebView` existe

---

## Consequências

1. Nenhuma rota operacional pode ser acedida pelo browser (incluindo ambiente local).
2. O `InstallPage` mostra instruções de instalação (não links para rotas bloqueadas).
3. O `AdminDevicesPage` é o ponto central de distribuição e provisioning.
4. Qualquer novo módulo operacional DEVE ser envolvido pelo `BrowserBlockGuard`.

---

## Referências Cruzadas

- `docs/architecture/DESKTOP_DISTRIBUTION_CONTRACT.md` — contrato de distribuição desktop
- `docs/architecture/OPERATIONAL_INSTALLATION_CONTRACT.md` — contrato de instalação operacional
- `merchant-portal/src/routes/OperationalRoutes.tsx` — integração dos guards nas rotas

# AppStaff — Abrir no simulador iOS / Android

**Propósito:** Garantir que o AppStaff abre no simulador quando o CLI falha.

---

## Problema: "Unable to find a destination" (iOS)

O `expo run:ios` ou `xcodebuild` pode falhar com:

- `Unable to find a destination matching the provided destination specifier`
- `Ineligible destinations: Any iOS Device, error:iOS 26.2 is not installed`

**Causa:** O Xcode em modo CLI não está a ver os simuladores; só lista "Any iOS Device", que exige o SDK iOS 26.2 (Xcode > Settings > Components).

---

## Solução 1 — Correr pelo Xcode (recomendado)

1. Abrir o projeto no Xcode:

   ```bash
   ./scripts/open-appstaff-ios-xcode.sh
   ```

   Ou manualmente: abrir `mobile-app/ios/ChefiAppPOS.xcworkspace` no Xcode.

2. No Xcode, no selector de destino (ao lado do scheme "ChefiAppPOS"), escolher um **simulador** (ex: **iPhone 16 Pro**).

3. Prima **Cmd+R** (Run). O build corre e a app abre no simulador.

---

## Solução 2 — Instalar iOS 26.2 no Xcode

Se quiseres que `expo run:ios` funcione na linha de comando:

1. Xcode → **Settings** (Cmd+,) → **Platforms** (ou **Components**).
2. Instalar **iOS 26.2** (ou a versão que o Xcode indicar).
3. Depois: `cd mobile-app && npx expo run:ios --device "iPhone 16 Pro"`.

---

## Android

1. Abrir o **Android Studio** → **Device Manager** → iniciar um AVD (emulador).
2. No repo:
   ```bash
   cd mobile-app && npx expo run:android
   ```
   O Expo detecta o emulador e instala a app.

Se o emulador não aparecer, garantir que `ANDROID_HOME` está definido e que existe pelo menos um AVD criado.

---

## Resumo

| Plataforma  | Se não vês a app                                                             |
| ----------- | ---------------------------------------------------------------------------- |
| **iOS**     | `./scripts/open-appstaff-ios-xcode.sh` → no Xcode escolher simulador → Cmd+R |
| **Android** | Emulador aberto no Android Studio → `cd mobile-app && npx expo run:android`  |

Contrato: [CORE_MOBILE_TERMINALS_CONTRACT.md](../architecture/CORE_MOBILE_TERMINALS_CONTRACT.md) — AppStaff só como app nativa (iOS/Android), nunca no browser.

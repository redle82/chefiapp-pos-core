# AppStaff — Terminal operacional mobile (ChefIApp)

**CORE_APPSTAFF_CONTRACT:** AppStaff é o terminal humano do OS. Roda **exclusivamente em iOS e Android** (Expo). Não é web, não depende do merchant-portal.

**Lei dos 4 terminais:** Web → vende. AppStaff → trabalha. KDS → cozinha. TPV → caixa. Este repositório é o terminal **AppStaff** (mobile only). Contrato: [CORE_APPSTAFF_CONTRACT](../../docs/architecture/CORE_APPSTAFF_CONTRACT.md). Índice dos 4 terminais: [CORE_FOUR_TERMINALS_INDEX](../../docs/contracts/CORE_FOUR_TERMINALS_INDEX.md).

---

## Bloqueio Web

- **AppStaff não roda no navegador.** Se abrir o projecto em modo web (ex.: `expo start` e abrir no browser), é mostrada a mensagem: «Disponível apenas no app mobile (iOS e Android)».
- Implementação: `app/_layout.tsx` — quando `Platform.OS === 'web'`, renderiza ecrã de bloqueio em vez da app.
- Para usar o AppStaff: **simulador iOS**, **emulador Android** ou **dispositivo físico**. Nunca browser.

---

## Runtime

- **Expo** (iOS + Android)
- Entry: `expo-router/entry` → `app/_layout.tsx`

## Decisao tecnica

- **Escolha oficial:** Expo (managed) para AppStaff.
- **Motivo:** velocidade de iteracao, OTA, e cobertura suficiente para offline + push.
- **So mudar:** se surgir dependencia nativa que Expo nao cubra via config plugins.

---

## Como rodar

### Expo Go (iPhone / iPad na mesma rede)

1. Instala **Expo Go** na App Store (iPhone/iPad).
2. Na raiz do repo: `pnpm run expo:go` (ou `cd mobile-app && npx expo start`).
3. No terminal aparece um **QR code**. No iPhone: abre a **Câmara**, aponta ao QR → toca na notificação para abrir no Expo Go.
4. Alternativa: no Metro bundler, prima **s** para mostrar o QR em maior; no Expo Go, **Scan QR code** e aponta ao ecrã.

O app carrega no telemóvel via Expo Go (sem instalar build nativo).

### Pré-requisito: merchant-portal a correr

O AppStaff (ecrã principal) carrega o **merchant-portal** numa WebView em `http://<host>:5175/app/staff/home`. Para o simulador mostrar conteúdo:

1. **Noutro terminal**, inicia o merchant-portal:
   `pnpm --filter merchant-portal run dev`
   (sobe na porta 5175 e fica acessível na rede; no Android Emulator usa-se `10.0.2.2:5175` automaticamente.)
2. Depois inicia o Expo / simulador (passos abaixo).

Sem o merchant-portal, verás «AppStaff não carregou» e o URL na mensagem de erro.

### iOS Simulator

```bash
# 1. Merchant-portal a correr noutro terminal: pnpm --filter merchant-portal run dev
# 2. Na raiz do repo:
pnpm run expo:ios
# ou
cd mobile-app && npx expo run:ios
```

Se o simulador não abrir sozinho:

1. Abrir **Xcode** → Window → Devices and Simulators.
2. Escolher um simulador (ex.: iPhone 15) e iniciar.
3. No terminal: `npx expo run:ios` dentro de `mobile-app` (o app será instalado no simulador em execução).

**Alternativa com Expo Go no simulador:** `pnpm run expo:go`, depois prima **i** no terminal para abrir no iOS Simulator (Expo Go é instalado no simulador se necessário).

### Android Emulator

```bash
# 1. Merchant-portal a correr noutro terminal: pnpm --filter merchant-portal run dev
# 2. Na raiz do repo:
pnpm run expo:android
# ou
cd mobile-app && npx expo run:android
```

No Android Emulator, `localhost` não aponta para o Mac; a app usa **10.0.2.2** automaticamente para chegar ao merchant-portal no host.

Se aparecer **"No Android connected device found"**:

1. Abrir **Android Studio** → Device Manager (AVD Manager).
2. Criar um Virtual Device (ex.: Pixel 6) com uma system image (ex.: API 34).
3. Iniciar o emulador (▶).
4. No terminal: `npx expo run:android` dentro de `mobile-app`.

---

## Estrutura (contrato)

- **Home operacional** — `app/(tabs)/index.tsx`
- **Tarefas** — `app/(tabs)/staff.tsx` (Turno) + fluxo de tarefas
- **Mini KDS** — `app/(tabs)/kitchen.tsx`
- **Mini TPV** — `app/(tabs)/orders.tsx`, `app/(tabs)/tables.tsx`
- **Check-in / Check-out** — `app/(tabs)/staff.tsx` (ShiftGate)
- **Perfil** — `app/(tabs)/two.tsx` (Conta)

O AppStaff **não** inclui: configurações globais, gestão financeira completa, gestão de cardápio, métricas estratégicas do dono. Essas áreas são do dashboard (web).

---

## Governação pelo Core

- **core-readers/** — leitura de estado (tarefas, pedidos). Mock por agora; arquitectura pronta para Core/API.
- **core-events/** — envio de eventos (tarefa concluída, pedido aceite). Mock por agora.
- O AppStaff **não** calcula regras, **não** decide prioridade, **não** altera preços. Apenas lê, executa acções permitidas e envia eventos.

---

## Offline (mínimo)

- Tarefas já carregadas continuam visíveis (estado em memória).
- Check-in / check-out local permitido; eventos podem ser marcados como "pending sync" (`lib/pendingSync.ts`).
- Sync completo não implementado; apenas estrutura em AsyncStorage.

---

## Contrato

Ver `docs/architecture/CORE_APPSTAFF_CONTRACT.md` no repositório raiz.

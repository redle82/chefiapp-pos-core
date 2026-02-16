# Guia: Demo com 5 simuladores (TPV central, KDS central, mini TPV/KDS, relatório do dono)

Este guia descreve os passos para executar a demo completa: criar uma nova empresa via web, ativar TPV central e KDS central, simular 5 empregados em 5 dispositivos (3 iOS + 2 Android), ver pedidos nos mini KDS e no KDS central, fazer pedidos nos mini TPV, e validar tudo no relatório do dono.

**Runbook (ordem de execução e checklist):** [DEMO_5_SIMULADORES_RUNBOOK.md](./DEMO_5_SIMULADORES_RUNBOOK.md).

---

## Pré-requisitos

- **Docker Core** a correr (PostgREST, realtime); health: `http://localhost:3001/rest/v1/`
- **Merchant-portal** na porta 5175: `pnpm --filter merchant-portal run dev`
- **Metro** para o mobile-app (ex.: 8081): `cd mobile-app && npx expo start --port 8081`
- **5 dispositivos:** 3 simuladores iOS, 2 emuladores Android (chef_pixel + Medium_Phone). Se o Medium_Phone não tiver o app: `./scripts/ops/install-app-android-medium-phone.sh` (run = expo run:android, apk = instalar APK já construído), ou manualmente: `cd mobile-app && npx expo run:android` selecionando o AVD Medium_Phone, ou `adb -s <device_id> install mobile-app/android/app/build/outputs/apk/debug/app-debug.apk`
- Em cada Android: `adb -s <device_id> reverse tcp:8081 tcp:8081` para o bundle carregar

---

## 1. Criar nova empresa via web de configuração

1. **Autenticação:** Abrir `http://localhost:5175`, fazer login (auth phone ou método configurado).
2. **Sem organização:** Após login, o CoreFlow redireciona para **`/welcome`** (WelcomePage).
3. **Bem-vindo:** Clicar em **"Começar Configuração Guiada"** → navega para **`/onboarding`** (OnboardingAssistantPage).
4. **Onboarding:** Seguir o assistente:
   - Identidade (nome, tipo, país)
   - Localização / mesas
   - Pessoas / equipa
     A criação do restaurante ocorre em BootstrapPage ou IdentitySection (insert em `gm_restaurants` via Core).
5. **Centro de Ativação:** Após ter organização, utilizadores não ativados vão para **`/app/activation`** (ActivationCenterPage). Completar o checklist:
   - **Criar menu** → `/app/setup/menu`
   - **Configurar mesas** → `/app/setup/mesas`
   - **Configurar impressora** → `/config`
   - **Criar usuários** → `/app/setup/equipe`
   - **Testar pedido** → `/op/tpv`
   - **Ativar plano** → `/app/billing` (opcional para demo)
6. **Estado operacional:** Quando o runtime tiver `setup_status` (menu, location, people, etc.) e a entidade estiver "ativada", o acesso a `/op/tpv` e `/op/kds` é permitido. Se ainda em SETUP, o CoreFlow redireciona para `/app/activation`.

**E2E de referência:** `merchant-portal/tests/e2e/teste-humano-jornada-completa.spec.ts` e `merchant-portal/tests/e2e/demo-5-simuladores.spec.ts`. Para validar o fluxo web e o carregamento de TPV/KDS central de forma automatizada: `cd merchant-portal && pnpm exec playwright test tests/e2e/demo-5-simuladores.spec.ts`.

---

## 2. Ativar TPV central e KDS central

- **TPV central (web):** Abrir `http://localhost:5175/op/tpv`. Requer turno aberto e dispositivo ativo (ShiftGate, useOperationalReadiness). Se o turno não estiver aberto, abrir caixa no TPV.
- **KDS central (web):** Abrir `http://localhost:5175/op/kds`. Pedidos vêm do Core/realtime; não requer turno para visualizar.

**Script para abrir no browser (opcional):**

```bash
# Com merchant-portal a correr em 5175
open "http://localhost:5175/op/tpv"
open "http://localhost:5175/op/kds"
```

Ou, na raiz do repo: `./scripts/ops/open-tpv-kds-central.sh` ou `./scripts/ops/open-tpv-kds-central.sh http://localhost:5175`.

---

## 3. Mapear 5 simuladores a 5 empregados

Em cada dispositivo, abrir o AppStaff e escolher o papel em **"Entrar como:"**. Garantir que todos entram no **mesmo restaurante** (código/QR ou Operação local com o mesmo contrato).

| Dispositivo              | Papel sugerido      | O que verá (tabs/áreas)                                     |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| iPhone 1                 | Dono (Owner)        | Owner home/dashboard; relatório do dono, visão geral        |
| iPhone 2                 | Gerente             | Manager; pedidos, mesas, tarefas                            |
| iPhone 3                 | Garçom (Waiter)     | staff, orders, kitchen, tables, cardapio; mini TPV/comandas |
| Android 1 (chef_pixel)   | Cozinha (Cook)      | staff, kitchen (mini KDS), orders                           |
| Android 2 (Medium_Phone) | Limpeza ou Garçom 2 | staff, tarefas; ou segundo garçom para mais pedidos         |

- **Contrato/localização:** Todos devem usar o mesmo `restaurantId` (mesmo código de equipa ou operação local) para pedidos e tarefas aparecerem no mesmo tenant.

---

## 4. Fluxo de pedidos: mini TPV → KDS central e mini KDS

1. Com TPV central e KDS central abertos na web, e os 5 simuladores ligados ao mesmo restaurante:
2. **Abrir turno** no TPV central (web) se ainda não estiver.
3. Nos dispositivos **Garçom** (mini TPV), **criar um ou mais pedidos** a partir das mesas/comandas.
4. **Verificar:** Pedidos aparecem no **KDS central** (web) e nos tabs **Cozinha** (mini KDS) nos telemóveis (Cozinha e Garçom).
5. Opcional: usar também o TPV central (web) para criar pedidos e confirmar que tudo aparece nos KDS.

Se aparecer "Modo offline" ou "Não foi possível carregar as mesas" num emulador: verificar Core acessível, `restaurantId` correto, e `adb reverse tcp:8081 tcp:8081` nesse dispositivo.

**Androids aparecem offline:** Em emuladores ou telemóveis Android, garantir: (1) `adb reverse tcp:8081 tcp:8081` e `adb reverse tcp:3001 tcp:3001` para o bundle e o Core; (2) `EXPO_PUBLIC_CORE_URL=http://localhost:3001` no `.env` do mobile-app (emulador usa 10.0.2.2:3001 via reverse). Se o app não alcançar o Core, o runtime mostra offline. No telemóvel físico, usar o IP da máquina onde o Core corre (ex.: `EXPO_PUBLIC_CORE_URL=http://192.168.1.10:3001`) e garantir que o dispositivo está na mesma rede.

**Produtos Bar vs Cozinha:** O Menu Builder separa por **Estação** (🍳 Cozinha / 🍺 Bar). O catálogo e o Core usam `gm_products.station`. A migração `20260224_bar_products_by_category.sql` marca como BAR os produtos em categorias de bebidas (ex.: Cafés, Cervejas, Vinos, Sangrías). Para novos produtos, definir a estação no Menu Builder; assim o KDS e o mini KDS mostram a secção Bar com os itens corretos.

**Garantir mesmo restaurante:** Todos os simuladores (TPV, KDS, AppStaff em cada dispositivo) devem usar o **mesmo `restaurant_id`** (ex.: seeds `00000000-0000-0000-0000-000000000100` ou o criado no onboarding). Assim os pedidos criados num dispositivo aparecem no KDS e no telemóvel do dono em tempo real.

**Emitir pedidos de demo (vários “empregados”):** Com Core e portal a correr, execute o script que cria pedidos via `create_order_atomic` com diferentes origens (Garçom, Cozinha) e mesas, para ver no KDS e no AppStaff do dono:

```bash
./scripts/ops/run-demo-orders.sh
# Opcional: mais pedidos ou outro restaurante
NUM_ORDERS=8 ./scripts/ops/run-demo-orders.sh
RESTAURANT_ID=<uuid> ./scripts/ops/run-demo-orders.sh
```

Os pedidos são criados no mesmo restaurante; o KDS (web e tab Cozinha no app) e o dono (telemóvel) recebem em tempo real via realtime (Postgres).

---

## 5. Tarefas por funcionário e relatório do dono

- **Tarefas:** No AppStaff, tab **"Turno"** (staff) mostra tarefas. Podem ser filtradas por utilizador/função (ex.: pedidos por `waiterId`). O Core deve ter tarefas ou checklist associadas a funcionários/turno.
- **Relatório do dono (web):**
  - **AppStaff (owner):** No simulador Dono, visão Owner home / OwnerGlobalDashboard.
  - **Web (admin):** Abrir `http://localhost:5175/admin/reports/overview` ou `http://localhost:5175/admin/reports/multiunit`, e se aplicável `http://localhost:5175/app/reports/daily-closing`. Verificar: pedidos do dia, métricas, e onde existir — tarefas ou indicadores por funcionário.

Validar que os pedidos feitos nos mini TPV e no TPV central aparecem nestes relatórios.

**E2E:** O spec `merchant-portal/tests/e2e/demo-5-simuladores.spec.ts` inclui um teste que valida o carregamento de `/admin/reports/overview` e `/admin/reports/multiunit` com pilot (sem Core obrigatório).

---

## 6. Duração da demo ("24h00")

A demo não exige 24 horas a correr. Basta o tempo para: (1) criar empresa e ativar TPV/KDS; (2) simular empregados e emitir pedidos; (3) ver pedidos no KDS central e mini KDS; (4) ver relatório do dono e tarefas. "24h00" pode ser o período de dados que o relatório cobre (ex.: "hoje") ou um turno longo. Para visibilidade de 24h nos gráficos do dono, manter Core e portal a correr e opcionalmente usar dados de seed ou criar pedidos ao longo do tempo.

---

## 7. Riscos e mitigações

| Risco                                                     | Mitigação                                                                                                                                                                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medium_Phone sem app                                      | `expo run:android` com AVD Medium_Phone ou `adb install app-debug.apk`                                                                                                                                                           |
| "Não foi possível carregar as mesas" / "Core unreachable" | No mobile-app, usar `EXPO_PUBLIC_CORE_URL=http://localhost:3001` (iOS Simulator: localhost = Mac) ou o IP da máquina onde o Core corre. Android: `adb reverse tcp:3001 tcp:3001` ou `EXPO_PUBLIC_CORE_URL=http://10.0.2.2:3001`. |
| TPV/KDS bloqueados                                        | Completar Centro de Ativação até o runtime sair de SETUP                                                                                                                                                                         |
| Tarefas vazias no dono                                    | Confirmar que o Core persiste tarefas por utilizador/turno e que o dashboard as consome                                                                                                                                          |

# Sofia Gastrobar — Fase 2 Passo 7: AppStaff no simulador Android

**Objetivo:** Validar o AppStaff no simulador Android usando o mesmo Core e o mesmo tenant 100 do ambiente vivo do Sofia.

**Referências:** [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md), [mobile-app/README.md](../mobile-app/README.md).

---

## 1. Estado atual do AppStaff Android

### Arquitetura

- O **AppStaff “mobile”** (Expo, `mobile-app`) **não é uma app nativa independente** para o fluxo principal. O ecrã principal é uma **WebView** que carrega o **merchant-portal** em `http://<host>:5175/app/staff/home`.
- Ou seja: **AppStaff Android = mesmo AppStaff web** (React no merchant-portal) a correr dentro do WebView do app Expo.
- **Tenant, sessão e Core** são resolvidos **pelo merchant-portal** quando essa URL é carregada. O mobile-app não tem lógica própria de tenant/restaurant_id para esse ecrã; apenas abre o URL.

### Como é iniciado

- **Entrada:** `mobile-app/app/index.tsx` redireciona para `/appstaff-web`.
- **Rota inicial (Stack):** `unstable_settings.initialRouteName = "appstaff-web"` em `_layout.tsx`.
- **Ecrã appstaff-web:** `app/appstaff-web.tsx` monta uma WebView com o URL devolvido por `getAppStaffWebUrl()`.

### URL da WebView

- **Cálculo:** `getAppStaffWebUrl()` em `appstaff-web.tsx`:
  - Se existir `EXPO_PUBLIC_APPSTAFF_WEB_URL`, usa esse URL completo.
  - Senão:
    - **Android:** usa host `10.0.2.2` (host machine a partir do emulador) ou o host do `hostUri` do Metro.
    - **iOS:** usa `localhost` ou host do `hostUri`.
  - Porta fixa **5175**, path **/app/staff/home**.
- **Emulador Android (default):** `http://10.0.2.2:5175/app/staff/home`.

### Config / env

- **mobile-app:** variáveis opcionais em `.env` ou `app.config.js`:
  - `EXPO_PUBLIC_APPSTAFF_WEB_URL` — URL completo para a WebView (ex.: `http://10.0.2.2:5175/app/staff/home`).
  - `EXPO_PUBLIC_CORE_URL` / `EXPO_PUBLIC_CORE_ANON_KEY` — usadas pelo **coreClient.ts** do mobile-app (chamadas nativas que não passam pela WebView). O ecrã principal AppStaff (WebView) **não** usa estas variáveis; usa o que o merchant-portal injeta (VITE_CORE_URL, etc.).
- **merchant-portal:** o conteúdo da WebView é servido pelo Vite e usa `merchant-portal/.env.local`:
  - `VITE_CORE_URL`, `VITE_CORE_ANON_KEY` — o bundle que o WebView recebe usa estes valores.
  - `VITE_ALLOW_MOCK_AUTH`, `VITE_DEBUG_DIRECT_FLOW` — para sessão Sofia (pilot + tenant 100).

### Problema no emulador Android

- O WebView corre **dentro do emulador**. O HTML/JS vêm do host (10.0.2.2:5175), mas o **JavaScript corre no contexto do emulador**.
- Por isso, quando o código faz `fetch(VITE_CORE_URL)` com `VITE_CORE_URL=http://localhost:3001`, o pedido vai para **localhost do emulador**, não para o Core no host.
- **Conclusão:** para o AppStaff no emulador Android falar com o Core, o merchant-portal tem de ser servido com **VITE_CORE_URL** apontando para um endereço acessível a partir do emulador: **`http://10.0.2.2:3001`** (10.0.2.2 = host a partir do emulador).

### Resumo

| Aspecto | Detalhe |
|--------|---------|
| **O que corre no Android** | WebView com merchant-portal (React) em `/app/staff/home`. |
| **Quem resolve o tenant 100** | Merchant-portal (AuthProvider, FlowGate, AUTO-PILOT quando runbook Sofia). |
| **Quem fala com o Core** | O mesmo código do portal dentro do WebView (dockerCoreFetchClient, etc.). |
| **Requisito emulador** | merchant-portal servido com `VITE_CORE_URL=http://10.0.2.2:3001` (e portal acessível em `http://10.0.2.2:5175`). |

---

## 2. Caminho oficial para abrir o AppStaff Android no Sofia

### Pré-requisitos

1. **Docker Core** a correr no host (PostgREST em 3001).
2. **Merchant-portal** a correr no host, com configuração Sofia (runbook) **e** URL do Core acessível ao emulador.

### Opção A — Só emulador Android (trocar .env.local)

1. Em **merchant-portal/.env.local** (para esta sessão de teste):
   - Manter Sofia: `VITE_ALLOW_MOCK_AUTH=true`, `VITE_DEBUG_DIRECT_FLOW=true`.
   - Para o emulador conseguir falar com o Core:
     - `VITE_CORE_URL=http://10.0.2.2:3001`
     - `VITE_CORE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long` (ou o anon key do Core).
2. Reiniciar o merchant-portal: `pnpm --filter merchant-portal run dev` (porta 5175).
3. Emulador Android: Device Manager → iniciar um AVD (ex.: Pixel 6, API 34).
4. Na raiz do repo: `pnpm run expo:android` (ou `cd mobile-app && npx expo run:android`).
5. O app abre → redireciona para appstaff-web → WebView carrega `http://10.0.2.2:5175/app/staff/home` → o portal (com o bundle que usa 10.0.2.2:3001) resolve tenant 100 e mostra “Sofia Gastrobar”.

**Nota:** Com `VITE_CORE_URL=http://10.0.2.2:3001`, o **browser no host** (localhost:5175) também recebe esse valor; pedidos ao Core a partir do browser podem falhar se 10.0.2.2 não for acessível no host. Para voltar a testar só no browser, repor `VITE_CORE_URL=http://localhost:3001` e reiniciar o portal.

### Opção B — Host e emulador na mesma rede (IP da máquina)

1. Descobrir o IP do host na LAN (ex.: 192.168.1.100).
2. Fazer o Vite escutar em todas as interfaces: no host, `VITE_DEV_HOST=0.0.0.0 pnpm --filter merchant-portal run dev`.
3. Em **merchant-portal/.env.local**:
   - `VITE_CORE_URL=http://192.168.1.100:3001`
   - Resto do runbook Sofia (VITE_ALLOW_MOCK_AUTH, VITE_DEBUG_DIRECT_FLOW, etc.).
4. No **mobile-app**, definir o URL da WebView para esse host:
   - Criar/editar `.env` em mobile-app: `EXPO_PUBLIC_APPSTAFF_WEB_URL=http://192.168.1.100:5175/app/staff/home`.
5. Garantir que o Core (3001) está acessível na rede (ex.: bind 0.0.0.0 no docker-compose).
6. Emulador: `pnpm run expo:android`; o app carrega o portal em 192.168.1.100:5175 e o Core em 192.168.1.100:3001.

Assim, browser no host (http://192.168.1.100:5175) e emulador podem usar a mesma configuração.

---

## 3. O que validar no simulador

Com o app aberto no emulador e a WebView a carregar o portal configurado para Sofia:

| Verificação | O que fazer | Resultado esperado |
|-------------|-------------|--------------------|
| **App abre** | Iniciar o app Expo (ex.: `pnpm run expo:android`). | App abre; ecrã inicial redireciona para a WebView. |
| **WebView carrega** | Aguardar; não deve aparecer “AppStaff não carregou”. | Página do AppStaff (Launcher / home) visível. |
| **Está no Sofia Gastrobar** | Ver topbar / identidade. | Nome “Sofia Gastrobar” (ou contexto do tenant 100); sem “Restaurante” genérico. |
| **Lista equipe / pessoas** | Navegar para a área onde se listam pessoas/equipa (conforme UI do portal). | 5 pessoas (seed + Bruno, Carla) se o runbook e migrações estiverem aplicados. |
| **Mostra tarefas** | Abrir secção de tarefas. | Tarefas de gm_tasks do restaurante 100 (lista + concluir como no web). |
| **Fluxo operacional** | Entrar no fluxo Comandeiro / pedidos / tarefas. | Mesmo comportamento que no browser em /app/staff/home. |

Se alguma destas falhar, ver §5 (bloqueios).

---

## 4. O que já funciona no Android (quando config está correta)

- **Abrir o app** e carregar o AppStaff na WebView (URL 10.0.2.2:5175 ou EXPO_PUBLIC_APPSTAFF_WEB_URL).
- **Mesmo conteúdo que o web:** Launcher, Comandeiro, tarefas (gm_tasks), equipe, pedidos — porque é o mesmo código (merchant-portal).
- **Tenant 100 e Sofia:** desde que o merchant-portal seja servido com runbook Sofia **e** VITE_CORE_URL acessível ao emulador (10.0.2.2:3001 ou IP da máquina).

---

## 5. O que depende de config / o que ainda pode falhar

| Dependência | Descrição |
|-------------|-----------|
| **Portal a correr** | Se o merchant-portal não estiver a correr na porta 5175 (no host), a WebView mostra “AppStaff não carregou” e o URL esperado. |
| **VITE_CORE_URL no emulador** | Se o portal for servido com VITE_CORE_URL=http://localhost:3001, o WebView (no emulador) falha ao chamar o Core. É obrigatório usar 10.0.2.2:3001 (Opção A) ou IP do host (Opção B). |
| **Runbook Sofia no portal** | Para ver “Sofia Gastrobar” e tenant 100, o .env.local do merchant-portal deve ter VITE_ALLOW_MOCK_AUTH e VITE_DEBUG_DIRECT_FLOW (e opcionalmente VITE_FORCE_PRODUCT_MODE=live). |
| **Core no host** | Docker Core (3001) tem de estar acessível; no caso 10.0.2.2, o emulador acede ao host na porta 3001. |

---

## 6. Diferenças entre AppStaff web (browser) e AppStaff Android

- **Código de negócio:** nenhuma; o Android mostra o mesmo bundle do merchant-portal.
- **Diferenças práticas:**
  - **Suporte:** WebView (React Native) em vez de browser.
  - **URL da página:** no Android vem de getAppStaffWebUrl() (10.0.2.2:5175 ou EXPO_PUBLIC_APPSTAFF_WEB_URL).
  - **Rede:** no emulador, “localhost” é o emulador; daí a necessidade de 10.0.2.2 ou IP do host para Core e portal.
  - **Teclado / gestos:** comportamento do dispositivo; a UI é a mesma.

---

## 7. Estado final do Passo 7

- **Caminho oficial** para abrir o AppStaff Android no Sofia: documentado acima (Opção A e B).
- **Tenant 100:** garantido pelo merchant-portal (runbook Sofia + VITE_CORE_URL acessível ao emulador).
- **Validação no simulador:** checklist §3; possível desde que a config (portal + Core URL) esteja correta.
- **Bloqueio identificado:** se não se configurar VITE_CORE_URL para o emulador (10.0.2.2:3001 ou IP do host), a WebView não consegue falar com o Core e o AppStaff fica sem dados ou com erros de rede.

---

## 8. Fase 2 concluída?

Com o Passo 7 documentado e o caminho de validação definido:

- **Passos 1–6:** já fechados (sessão, catálogo, equipe, superfícies, tarefas, relatórios).
- **Passo 7:** opcional; não exige alteração de código, apenas configuração (.env.local + eventual EXPO_PUBLIC_APPSTAFF_WEB_URL) e execução do smoke no emulador.

Considera-se a **Fase 2 concluída** para o ambiente vivo do Sofia (Docker/Core), com o Passo 7 como **validação opcional no simulador Android** seguindo este runbook.

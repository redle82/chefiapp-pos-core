## ChefIApp Desktop — Instalação e protocolo `chefiapp://` no macOS

Este documento descreve como instalar o **ChefIApp Desktop** no macOS e validar que o protocolo personalizado `chefiapp://` está corretamente associado ao app (e não ao Electron genérico).

Foco: fluxo de QA e suporte — não alterar arquitetura.

---

### 1. Construir o app Desktop (local — modo DEV)

No diretório `desktop-app/`:

```bash
cd desktop-app
pnpm install
pnpm build
pnpm dist:mac
```

Isto gera um `.dmg` em `desktop-app/out/`, com nome semelhante a:

- `ChefIApp Desktop-<versão>.dmg`

---

### 2. Instalar o app no macOS

1. Abra o Finder em `desktop-app/out/`.
2. Dê duplo clique no `.dmg` gerado.
3. Arraste **ChefIApp Desktop** para a pasta **Applications**.
4. Abra o app uma vez manualmente (clicando em `Applications/ChefIApp Desktop.app`):
   - Aceite eventuais prompts de segurança do macOS.

Este passo garante que o macOS reconhece o bundle e prepara o registo do protocolo.

---

### 3. Validar e corrigir o handler do protocolo `chefiapp://` no macOS

#### 3.1 O que essa janela “Electron” está dizendo

Se, ao tentar abrir um link `chefiapp://`, aparecer uma janela genérica do Electron (tipo “To run a local app, execute Electron path-to-app”), isso significa:

- o macOS está a abrir `chefiapp://` com o **Electron genérico** (`.../node_modules/electron/dist/Electron.app`);
- **não** com o `ChefIApp Desktop.app` empacotado em `/Applications`.

O código do desktop (appId, `protocols` no `electron-builder.yml` e handler no `main.ts`) já está preparado para ser o handler correto. O problema, neste cenário, é a associação do protocolo no LaunchServices do macOS.

#### 3.2 Passo-a-passo para consertar o handler no macOS

1. **Confirmar o sintoma (recomendado)**

No Terminal, execute:

```bash
open "chefiapp://open?app=tpv"
```

- Se abrir uma janela genérica do Electron, prossiga para os passos seguintes.

1. **Remover apps errados / duplicados**

- Feche tudo que seja Electron/ChefIApp Desktop.
- Remova de `/Applications` qualquer `Electron.app` que tenha sido copiado para lá.
- Remova versões antigas do `ChefIApp Desktop.app` (se existirem) para evitar cópias múltiplas.

1. **Desregistrar o Electron dev do LaunchServices**

- Descubra qual `Electron.app` está a ser aberto (por exemplo, via Finder ou logs).
- No Terminal, rode `lsregister -u` apontando para esse `Electron.app`:

```bash
# Exemplo de caminho – pode variar conforme pnpm/store:
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -u "/caminho/para/node_modules/electron/dist/Electron.app"
```

- Se o caminho for diferente, localize o `Electron.app` correspondente e use esse path.

1. **Reinstalar e registrar o Desktop empacotado (handler correto)**

- Gere o `.dmg` e copie o `ChefIApp Desktop.app` para `/Applications`:

```bash
cd desktop-app
pnpm dist:mac
open out
```

- A partir do `.dmg`, arraste o `ChefIApp Desktop.app` para `/Applications`.
- Abra o app uma vez pelo Finder (a partir de `/Applications`) e feche.
- Opcional, para forçar o registo imediato no LaunchServices:

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -f "/Applications/ChefIApp Desktop.app"
```

1. **Testar novamente com deep links reais**

No Terminal:

```bash
# Teste básico: apenas o app
open "chefiapp://open?app=tpv"

# Teste com parâmetros próximos do fluxo real (exemplo)
open "chefiapp://open?app=tpv&restaurant_id=<ID_RESTAURANTE>&module=tpv"
```

Resultado esperado:

- O macOS pergunta se quer abrir **ChefIApp Desktop** (não “Electron” genérico); ou
- Abre diretamente o ChefIApp Desktop se já tiver autorizado antes.

Quando estes comandos funcionarem corretamente no Terminal, o botão **“Abrir”** em `/admin/modules` passa a funcionar automaticamente, pois o fluxo web já usa exatamente estes deep links.

#### 3.3 Se ainda falhar

Se, depois de todos os passos acima, ainda abrir o handler errado ou nada abrir:

- Confirme que **existe apenas uma cópia** de `ChefIApp Desktop.app` no sistema (idealmente só em `/Applications`).
- Verifique se o `bundleId` não mudou entre builds (se mudou, o macOS pode manter a associação antiga).
- Confirme que o app foi aberto pelo menos uma vez a partir de `/Applications` antes de testar o protocolo.

Em último caso, pode ser necessário limpar cache mais profundo de LaunchServices (fora do escopo deste SOP) ou reiniciar o macOS.

---

### 4. Convenção de distribuição DEV vs PROD

Existem dois caminhos distintos:

- **DEV/local** (máquina de desenvolvimento):
  - `VITE_DESKTOP_DOWNLOAD_BASE` pode ficar vazia.
  - O bloco "Baixar software" em `/admin/devices` mostra **"Desktop ainda não publicado para este ambiente"**.
  - O instalador é gerado localmente a partir de `desktop-app/` e instalado manualmente em `/Applications`.
- **PROD / staging**:
  - `VITE_DESKTOP_DOWNLOAD_BASE` aponta para a release oficial (por exemplo GitHub Releases):
    - `VITE_DESKTOP_DOWNLOAD_BASE=https://github.com/goldmonkey777/ChefIApp-POS-CORE/releases/latest/download`
    - `VITE_DESKTOP_DOWNLOAD_MAC_FILE=ChefIApp-Desktop.dmg`
    - `VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=ChefIApp-Desktop-Setup.exe`
  - O bloco "Baixar software" passa a mostrar botões clicáveis:
    - "Descarregar para macOS" → `.dmg` oficial.
    - "Descarregar para Windows" → `.exe` oficial.

Resumo:

- DEV → foco em gerar `.dmg` local e instalar.
- PROD → foco em publicar artefactos fixos e configurar as env vars acima.

---

### 5. Como o portal web usa o protocolo

Do lado do **merchant-portal**:

- `/admin/modules` constrói deep links via:
  - `buildDeepLink("tpv" | "kds", { restaurant })` → `chefiapp://open?app=tpv|kds&restaurant=...`.
- O clique em **Abrir** usa `DesktopLaunchService.launchDesktopWithHandshake` para:
  - criar um `<iframe hidden src="chefiapp://...">` (sem navegar a página);
  - escutar `blur` e `visibilitychange` como sinais de sucesso;
  - aplicar um timeout configurável (`VITE_DESKTOP_LAUNCH_TIMEOUT_MS`, default 5000ms);
  - abrir o `DesktopInstallModal` em caso de falha.

Se o protocolo estiver corretamente registado, estes deep links abrem sempre o ChefIApp Desktop.

---

### 6. Checklist rápido de QA (macOS)

1. Limpar `localStorage` do browser (chave `desktopLaunchSuccess:*`) para começar “do zero”.
2. **Sem** ChefIApp Desktop instalado:
   - Abrir `/admin/modules`.
   - Clicar **Abrir** em TPV:
     - a página não deve navegar;
     - após o timeout, deve aparecer o `DesktopInstallModal`.
3. Instalar o ChefIApp Desktop via `.dmg` e abrir uma vez.
4. Voltar ao browser e clicar **Abrir TPV**:
   - aceitar o prompt “Open app?”;
   - o app Desktop deve abrir na vista TPV/KDS, sem modal no portal.
5. Clicar várias vezes em **Abrir** rapidamente:
   - apenas um launch deve acontecer (os cliques extra são ignorados enquanto o estado é `LAUNCHING`).
6. Confirmar que o botão **Instalar desktop** leva para `/admin/devices` quando não há instalador configurado.
7. Confirmar que, com instalador configurado (`VITE_DESKTOP_INSTALL_URL_MACOS`), o botão secundário abre o `DesktopInstallModal` com o link correto.

---

### 7. Verificação oficial via Admin — A+B+C

Do lado do Admin (`/admin/devices`), existe um botão **“Verificar instalação agora”** que usa o protocolo `chefiapp://` com ACK enriquecido e heartbeats reais para validar a instalação:

- **A (binário correto)**: o Desktop envia `isPackaged === true` no ACK.
- **B (ACK recebido)**: o Integration Gateway devolve `found: true` em `GET /desktop/launch-acks/:nonce` com `moduleId`, `deviceId`, `restaurantId`, `appVersion`.
- **C (device online)**: existe um terminal TPV/KDS com `last_heartbeat_at` recente (≤ 120s) em `gm_terminals`.

Etapas visíveis na UI:

1. **Abrir Desktop…**
2. **Aguardando confirmação (ACK)…**
3. **Aguardando dispositivo online (heartbeat)…**

Mensagens de erro esperadas (resumo):

- **Sem ACK** (A=false, sem handler / sem app instalado) → mensagem clara a indicar ausência de handler `chefiapp://` e a pedir instalação do `.dmg` em `/Applications`.
- **ACK ok mas isPackaged=false** (B parcial, mas ainda sem A) → estás a correr dev build, não conta como instalação.
- **ACK ok e isPackaged=true, mas sem heartbeat recente** (A+B ok, C=false) → Desktop abriu, mas não pareou / não há terminal TPV/KDS com heartbeat ≤ 120s.

Quando tudo está correto:

- “Desktop Instalado ✅” e “Online ✅”, mostrando também a `appVersion` do Desktop.

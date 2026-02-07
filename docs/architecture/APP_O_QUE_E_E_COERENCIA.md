# O que é um aplicativo neste sistema — e coerência com o que temos

**Objetivo:** Definir o que é “aplicativo” no ChefIApp, como é formado, como deve ser implementado, e avaliar se o que temos é coerente.

---

## 1. O que é um “aplicativo” neste sistema

Há **duas noções** que o projeto usa e que é preciso não misturar:

### 1.1 Aplicativo como **produto / função** (AppStaff)

- **AppStaff** = “terminal humano do ChefIApp OS” (CORE_APPSTAFF_CONTRACT).
- **Função:** Quem é o humano, o que o sistema espera dele, o que precisa saber, o que pode fazer (identidade, turno, tarefas, consciência operacional, visibilidade financeira, comunicação).
- **Não é:** “um app de funcionário genérico” nem “lista de módulos”. É a **superfície** onde o Core se manifesta para pessoas.
- **Forma:** Launcher de modos (TPV, KDS, Turno, Tarefas, Exceções, Visão operacional) + Shell (top bar, área central, bottom nav) + regras visuais (APPSTAFF_VISUAL_CANON: ambiente operacional, não dashboard, não site).

Ou seja: “aplicativo” aqui é primeiro **o quê** o utilizador usa (AppStaff como produto) e **como** deve parecer (ambiente operacional, não web).

### 1.2 Aplicativo como **entrega / contentor** (como o utilizador abre)

- **Browser App Mode** (OPERATIONAL_APP_MODE_CONTRACT): o browser abre uma URL como **aplicação dedicada** — janela própria, eventualmente **sem barra de endereço nem chrome**, com comportamento de “app instalado” (ícone no desktop/ecrã inicial, abertura direta).
- **Implementação:** O mesmo front-end (merchant-portal); não há binário separado. A “instalação” é feita pelo browser (Instalar app, Adicionar ao ecrã).
- **PWA:** manifest com `display: "standalone"`, `start_url`, ícones; quando o utilizador instala, abre **sem** browser (sem URL, sem abas).

Ou seja: “aplicativo” aqui é **em que contexto** o utilizador o abre — **dentro do browser** (tab com URL) vs **instalado** (janela/ecrã sem chrome).

**Resumo:**  
- **App (produto)** = AppStaff: launcher + modos + Shell + Canon visual.  
- **App (entrega)** = Abrir como app instalado (PWA standalone), não como tab no browser.

---

## 2. Como o aplicativo é formado (estrutura)

### 2.1 Camada de entrega (contentor)

| Elemento | Função |
|--------|--------|
| **Manifest** | `display: "standalone"`, `start_url: "/app/staff/home"`, ícones, theme_color. Torna a página elegível para “Instalar app” / “Adicionar ao ecrã”. |
| **Meta / PWA** | viewport, theme-color, apple-mobile-web-app-capable. Em standalone, o browser pode ocultar barra de endereço e controlos. |
| **Instalação** | Utilizador: Chrome → Menu → Instalar app; Safari → Partilhar → Adicionar ao ecrã. Abre depois pelo ícone = janela sem chrome. |

### 2.2 Camada de produto (AppStaff)

| Elemento | Função |
|--------|--------|
| **Shell** | StaffAppShellLayout: altura 100dvh, overflow hidden, **um** scroll na área central; top bar fixa, bottom nav fixa. Nada de sidebar/dashboard. |
| **Launcher** | AppStaffHome em `/app/staff/home`: grid de modos (tiles), ícone + label por modo, estados visuais (● ! ✓). Não é dashboard; é “escolher modo”. |
| **Modos** | TPV, KDS, Turno, Tarefas, Exceções, Visão operacional = rotas dentro do Shell; cada modo = ecrã operacional. |
| **Gates** | Localização → Contrato → Worker (StaffAppGate); sem local/contrato/worker mostra fallbacks (Landing, WorkerCheckInView). |
| **Canon visual** | APPSTAFF_VISUAL_CANON: menos texto, mais gesto, Shell manda no scroll, top bar = cockpit, home = apenas tiles, sem “cara de web”. |

### 2.3 Ordem de formação (mental)

1. **URL** (ou ícone instalado) → merchant-portal.
2. **Rota** `/app/staff` → AppStaffWrapper → StaffModule (StaffProvider) → StaffAppGate.
3. **Gate** passa (local + contrato + worker) → **Shell** (StaffAppShellLayout) → **Outlet**.
4. **Rota** `/app/staff/home` → StaffLauncherPage → **AppStaffHome** (grid de modos).
5. Se o utilizador **instalou** a PWA e abre pelo ícone → **standalone** → sem barra de URL/abas = “é um app” do ponto de vista do contentor.

Ou seja: o “aplicativo” é formado por **entrega (PWA/manifest)** + **produto (Shell + Launcher + modos + Canon)**.

---

## 3. Como deve ser implementado (exigências dos contratos)

### 3.1 Entrega (Browser App Mode / PWA)

- Manifest com `display: "standalone"`, `start_url` estável (ex.: `/app/staff/home`).
- Viewport e layout fullscreen (ex.: 100dvh, overflow controlado).
- **Não** depender de UI de portal (header/sidebar do dashboard) nas rotas operacionais.
- Instruir o utilizador a instalar (Adicionar ao ecrã / Instalar app); não obrigar PWA complexo para o conceito de “Browser App Mode”, mas o projeto já usa PWA (vite-plugin-pwa, manifest).

### 3.2 Produto (AppStaff)

- **Shell:** um único scroll, top bar e bottom nav fixas, sem 100vh aninhados.
- **Launcher:** apenas tiles (modos); grid denso; sem “dashboard web”; estados visuais (● ! ✓).
- **Anti-patterns a evitar:** dashboard corporativo, grid genérico de cards, margens tipo landing, “browser vibes”.
- **Experiência:** “Estou AQUI para fazer ISTO” (operar), não “posso fechar e voltar depois”.

### 3.3 Contratos que se cruzam

- **CORE_APPSTAFF_CONTRACT:** AppStaff é terminal humano do OS; no piloto é entregue **no merchant-portal** (web); rotas de staff renderizam o terminal.
- **APP_STAFF_MOBILE_CONTRACT:** diz que AppStaff é “mobile only” (Expo), **nunca** web. Isso contradiz o piloto actual (AppStaff no portal). Na prática, o código tem AppStaff **no web** em `/app/staff/*`; portanto a implementação segue o CORE_APPSTAFF_CONTRACT (piloto no portal) e não o APP_STAFF_MOBILE_CONTRACT (mobile only). Ou seja: há uma **decisão de produto** implícita — “no piloto, Staff é web (e PWA)”; “mobile only” fica para um futuro app Expo ou para outro canal.

---

## 4. O que temos hoje — checklist

### 4.1 Entrega (contentor)

| Requisito | Estado |
|-----------|--------|
| Manifest com `display: "standalone"` | ✅ `public/manifest.json` e vite.config.ts |
| `start_url` para launcher | ✅ `/app/staff/home` |
| Viewport / theme-color | ✅ index.html |
| PWA (vite-plugin-pwa) | ✅ |
| Indicação “como abrir como app” quando em browser | ✅ Barra no Shell quando !standalone (StaffAppShellLayout) |

### 4.2 Produto (Shell + Launcher)

| Requisito | Estado |
|-----------|--------|
| Shell: 100dvh, um scroll, top/bottom fixos | ✅ StaffAppShellLayout |
| Launcher: grid de modos, ícone + label | ✅ AppStaffHome |
| Estados visuais (● ! ✓) | ✅ getCardVisual por state |
| Sem dashboard (sem secções/títulos de landing) | ✅ Apenas tiles |
| Gate: local → contrato → worker | ✅ StaffAppGate |
| Entrada rápida dev (Dono, Gerente, etc.) | ✅ devQuickCheckIn + botões quando isDebugMode() |

### 4.3 Canon visual

| Requisito | Estado |
|-----------|--------|
| Menos texto, mais gesto | ✅ Textos curtos; tiles como acção |
| Top bar = cockpit (não banner) | ✅ Estado turno, label operacional |
| Home = apenas tiles | ✅ Sem blocos de texto explicativo no launcher |
| Grid preenche altura (sem faixa vazia) | ✅ flex: 1, grid com rows 1fr |
| Ícone grande + label (estilo app) | ✅ renderModeCard centrado, ícone 44/56px |

---

## 5. Coerência: o que está alinhado e o que não está

### 5.1 Coerente

- **Definição de “app” (produto):** AppStaff está definido como terminal humano do OS; a implementação (Shell, Launcher, modos, Gates) segue isso.
- **Definição de “app” (entrega):** Browser App Mode / PWA está definido (OPERATIONAL_APP_MODE_CONTRACT); temos manifest, start_url, e indicação no Shell para “abrir como app”.
- **Canon visual:** APPSTAFF_VISUAL_CANON e contratos do launcher estão reflectidos no código (Shell, grid, tiles, sem dashboard).
- **Boot / rotas:** AppStaff no portal em `/app/staff/*` está alinhado com CORE_APPSTAFF_CONTRACT (piloto no merchant-portal).

### 5.2 Tensão (contratos vs realidade)

- **APP_STAFF_MOBILE_CONTRACT** diz: AppStaff **nunca** acessível no web; só app nativo (Expo).  
- **Realidade:** AppStaff **está** no web em `/app/staff/home` e é o fluxo principal do piloto.  
- **Conclusão:** Ou o APP_STAFF_MOBILE_CONTRACT está desactualizado / aplica-se a um futuro app Expo, ou há dois canais (web piloto + mobile nativo). A implementação actual é **coerente com CORE_APPSTAFF_CONTRACT** (piloto no portal) e **incoerente com a letra** de APP_STAFF_MOBILE_CONTRACT (nunca web).

### 5.3 O que ainda pode falhar na percepção “isto é um app”

- **Quando aberto em tab no browser:** Por definição, continua a ver-se barra de URL e abas. Nenhum CSS ou layout remove isso; só **instalar e abrir pelo ícone** (standalone) é que remove o chrome. A barra que acrescentámos no Shell (“Para abrir como aplicativo…”) existe para explicar esse passo.
- **Estilo “app” dentro do browser:** O Canon e o código já visam “ambiente operacional, não site” (grid denso, ícones grandes, um scroll, sem margens tipo landing). Se ainda parecer “site”, pode ser: (1) falta de instalação (sempre em browser); (2) algum resíduo de layout/padding que quebre a sensação de fullscreen; (3) expectativa de que “app” = só app nativo (Expo), não PWA.

---

## 6. Resumo em uma frase

**O que é um aplicativo neste sistema:** (1) **Produto:** AppStaff = terminal humano do OS (Shell + Launcher + modos), com identidade visual de ambiente operacional (Canon). (2) **Entrega:** Abrir como “app instalado” (PWA standalone), sem browser, a partir de `start_url` `/app/staff/home`.

**Como é formado:** Manifest + PWA + rotas `/app/staff/*` + StaffAppGate + StaffAppShellLayout + AppStaffHome (grid de modos).

**Como deve ser implementado:** Conforme CORE_APPSTAFF_CONTRACT, APPSTAFF_VISUAL_CANON, APPSTAFF_HOME_LAUNCHER_CONTRACT e OPERATIONAL_APP_MODE_CONTRACT; utilizador instruído a instalar para obter janela sem browser.

**Coerência:** O que temos está **coerente** com a definição de app (produto + entrega) e com os contratos do Core e do Canon; a única **incoerência** é a letra do APP_STAFF_MOBILE_CONTRACT (“nunca web”), que a implementação do piloto não segue — e que faz sentido considerar desactualizada ou reservada ao canal Expo futuro.

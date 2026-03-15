# Entrega — Correção P1 i18n (superfície Admin)

**Data:** 2026-03-15  
**Escopo:** Apenas P1 da auditoria i18n na superfície Admin. Sem rotas, lógica, Electron, TPV/KDS operacional nem AppStaff fora do escopo. Sem P2.

---

## 1. Estado

- **P1 Admin concluído:** Todos os textos visíveis nos 5 componentes no escopo passaram a usar i18n; grupos e itens do sidebar, páginas AppStaff e TPV, secção de download e painel QR usam chaves de locale.
- **AdminSidebar:** Navegação (grupos e itens) e badges (BETA, BREVE, OFF) vêm do namespace `sidebar` (secção `adminNav`).
- **AdminDevicesPage:** Título, subtítulo, fluxo, secções, formulário, tabela, estados e empty state usam namespace `config` (chaves `devices.*`).
- **AdminTPVTerminalsPage:** Cabeçalho, fluxo, quatro blocos (Baixar, Primeiro arranque, Vincular, TPVs criados), labels, botões, tabela e empty state usam `config.devices.*`.
- **DesktopDownloadSection:** Estados de release, CTAs de build local e PROD, instruções de build, botões de download e verificação usam `config.devices.download*`.
- **InstallQRPanel:** Títulos desktop/mobile, expiração, Copiar URL, tipo/token, plataformas iOS/Android e instruções usam namespace `config` (secção `qr`).
- **Locales:** Chaves adicionadas/organizadas em pt-BR, pt-PT, en e es (sidebar `adminNav`; config `devices` e `qr`); pt-BR como referência.
- **Testes:** Mocks de `react-i18next` e asserções atualizadas em AdminSidebar.identity, AdminDevicesPage.verify, DesktopDownloadSection e InstallQRPanel.antiregression; todos passam.

---

## 2. O que o Cursor fez

### Ficheiros alterados

1. **merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx**
   - Adicionado `import { useTranslation } from "react-i18next"` e `useTranslation("sidebar")`.
   - Estrutura de navegação: `NAV_GROUPS` passou de `label`/`title` para `labelKey`/`titleKey` (chaves em `sidebar.adminNav`).
   - Títulos de grupo e labels de itens renderizados com `t(group.titleKey)` e `t(item.labelKey)`.
   - Badges de status (BETA, BREVE, OFF) passaram a usar `t("adminNav.badgeExperimental")`, `t("adminNav.badgePlanned")`, `t("adminNav.badgeOff")`.
   - Removido import não utilizado `useNavigate`.

2. **merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx**
   - Adicionado `useTranslation("config")`. Helper `timeSince` renomeado para `timeSinceRaw` e valor "agora" substituído por sentinela `"__now__"`; exibição de "agora" e estados da tabela (Online, Offline, Revogado) via `t("devices.now")`, `t("devices.online")`, etc.
   - Título e subtítulo: `t("devices.appstaffTitle")`, `t("devices.appstaffSubtitle")`.
   - Fluxo e link TPV: `t("devices.flowContext")`, `t("devices.tpvLinkLabel")`, `t("devices.flowContextSuffix")`.
   - Secção “Adicionar dispositivo”: título, descrição, label nome, placeholder, botão Gerar QR / A gerar…, mensagem de erro com `t("devices.errorGenerateToken")`.
   - Secção “AppStaff registados”: título, descrição, “A carregar…”, empty state, cabeçalhos de tabela (Estado, Nome, Registado, Último sinal), revogar e confirmação com `t("devices.confirmRevoke")`.

3. **merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx**
   - Adicionado `useTranslation("config")`. `timeSince` renomeado para `timeSinceRaw` com sentinela `"__now__"`; status (Online, Inactivo, Offline) via `getStatusLabel(term)` usando `t("devices.online")`, `t("devices.tpvStatusInactive")`, `t("devices.offline")`.
   - Cabeçalho e fluxo: `t("devices.tpvPageTitle")`, `t("devices.tpvPageSubtitle")`, `t("devices.tpvFlowSteps")`.
   - Blocos 1–4: títulos, descrições, textos de pacote disponível/preparação, plataformas, passos do primeiro arranque, nome do terminal, gerar código, copiar/abrir app, paste hint, dev hint, empty state e cabeçalhos de tabela (Status, Nome, Registado, Última atividade, Plataforma, Ações) com chaves `devices.tpvSection*`, `devices.terminalNameLabel`, `devices.generateCode`, `devices.copied`, `devices.openAppTpv`, `devices.pasteHint`, `devices.devHint`, `devices.commandCopied`, `devices.emptyTpv`, etc.

4. **merchant-portal/src/features/admin/devices/DesktopDownloadSection.tsx**
   - Adicionado `useTranslation("config")` no componente principal e nos subcomponentes `DevLocalBuildCTA` e `ProdPublishCTA`.
   - Texto “O instalador do TPV inclui também o KDS” e “Pacote em preparação” com `t("devices.downloadInstallerIncludesKds")`, `t("devices.downloadPackagePreparing")`.
   - Modo DEV: título e descrição com `downloadDevTitle`, `downloadDevDesc`; toggle “Ocultar instruções” / “Ver instruções de build local” com `downloadHideInstructions`, `downloadShowInstructions`; passos de build com `downloadBuildStep1` … `downloadBuildStep5`.
   - Botões de download: “Descarregar para {{label}}” com `t("devices.downloadFor", { label })`, “Tu sistema” com `downloadYourSystem`, “URL inválida” com `downloadInvalidUrl`.
   - Rodapé e verificação: `downloadFooterNote`, `downloadInstallComplete`, `downloadVerifying`, `downloadVerify`.

5. **merchant-portal/src/features/admin/devices/InstallQRPanel.tsx**
   - `useTranslation()` passou a `useTranslation("config")`. Todos os textos visíveis passaram a usar chaves da secção `qr`: `qr.desktopLinkTitle`, `qr.mobileLinkTitle`, `qr.expiresIn`, `qr.copyUrl`, `qr.typeLabel`, `qr.tokenLabel`, `qr.iosName`, `qr.iosBrowser`, `qr.androidName`, `qr.androidBrowser`, `qr.iosStep1` … `qr.iosStep5`, `qr.iosNote`, `qr.androidStep1` … `qr.androidStep3`.

6. **merchant-portal/src/locales/pt-BR/sidebar.json**  
   Adicionada secção `adminNav` com: `groupComando` … `groupConectar`, `itemComandoCentral` … `itemIntegracoes`, `badgeExperimental`, `badgePlanned`, `badgeOff`.

7. **merchant-portal/src/locales/pt-PT/sidebar.json**, **en/sidebar.json**, **es/sidebar.json**  
   Mesma secção `adminNav` com equivalência semântica em pt-PT, inglês e espanhol.

8. **merchant-portal/src/locales/pt-BR/config.json**  
   Estendida a secção `devices` com chaves para AppStaff (appstaffTitle, appstaffSubtitle, flowContext, tpvLinkLabel, flowContextSuffix, addAppstaffTitle, addAppstaffDesc, namePlaceholderAppstaff, generateQr, errorGenerateToken, registeredTitle, registeredDesc, loading, emptyAppstaff, tableStatus, tableName, tableRegistered, tableLastSignal, revoked, online, offline, revoke, confirmRevoke, now); TPV page (tpvPageTitle, tpvPageSubtitle, tpvFlowSteps, tpvSection1Title … tpvSection4Title, tpvSection1Available, tpvSection1Preparing, tpvSection1Platforms, tpvSection2Step1–3, tpvSection3Desc, terminalNameLabel, terminalNamePlaceholder, errorPairing, openAppTpv, openAppTpvTitle, pasteHint, devHint, tpvSection4Desc, emptyTpv, tableLastActivity, tablePlatform, tableActions, tpvStatusInactive); download (downloadInstallerIncludesKds, downloadPackagePreparing, downloadDevTitle, downloadDevDesc, downloadHideInstructions, downloadShowInstructions, downloadBuildStep1–5, downloadFor, downloadYourSystem, downloadInvalidUrl, downloadFooterNote, downloadInstallComplete, downloadVerifying, downloadVerify, commandCopied). Adicionada secção **qr** com desktopLinkTitle, mobileLinkTitle, expiresIn, copyUrl, typeLabel, tokenLabel, iosName, iosBrowser, androidName, androidBrowser, iosStep1–5, iosNote, androidStep1–3.

9. **merchant-portal/src/locales/pt-PT/config.json**, **en/config.json**, **es/config.json**  
   Mesmas secções `devices` (extensão) e `qr` com equivalência em pt-PT, inglês e espanhol.

10. **Testes**
    - **AdminSidebar.identity.test.tsx:** Mock de `react-i18next` com `t: (key) => key`.
    - **AdminDevicesPage.verify.test.tsx:** Asserções atualizadas para `devices.appstaffTitle` e `devices.tpvLinkLabel`.
    - **DesktopDownloadSection.test.tsx:** Mock de `react-i18next`; asserções atualizadas para chaves (downloadInstallerIncludesKds, downloadDevTitle, downloadBuildStep1/3, downloadPackagePreparing).
    - **InstallQRPanel.antiregression.test.tsx:** Expectativas de “desktop section” e “mobile panel” ajustadas para as chaves e traduções atuais (qr.desktopLinkTitle, qr.mobileLinkTitle, qr.iosName, qr.androidName) e regex que cobrem os textos em es/en/pt.

### Namespaces usados

- **sidebar:** `adminNav.*` (grupos, itens, badges).
- **config:** `devices.*` (AppStaff, TPV page, download, tabelas, estados, now) e `qr.*` (desktop/mobile titles, expiresIn, copyUrl, type/token, plataformas e passos iOS/Android).

### Chaves novas criadas

- **sidebar.adminNav:** groupComando, groupOperar, groupAnalisar, groupGovernar, groupConectar; itemComandoCentral, itemAjustesNucleo, itemCardapio, itemPedidos, itemMesas, itemReservas, itemTransacoes, itemFechamentos, itemRelatorios, itemEquipa, itemTpv, itemAppStaff, itemModulos, itemObservabilidade, itemClientes, itemPromocoes, itemIntegracoes; badgeExperimental, badgePlanned, badgeOff.
- **config.devices:** appstaffTitle, appstaffSubtitle, flowContext, tpvLinkLabel, flowContextSuffix, addAppstaffTitle, addAppstaffDesc, namePlaceholderAppstaff, generateQr, errorGenerateToken, registeredTitle, registeredDesc, loading, emptyAppstaff, tableStatus, tableName, tableRegistered, tableLastSignal, revoked, online, offline, revoke, confirmRevoke, now; tpvPageTitle, tpvPageSubtitle, tpvFlowSteps, tpvSection1Title … tpvSection4Title, tpvSection1Available, tpvSection1Preparing, tpvSection1Platforms, tpvSection2Step1–3, tpvSection3Desc, terminalNameLabel, terminalNamePlaceholder, errorPairing, openAppTpv, openAppTpvTitle, pasteHint, devHint, tpvSection4Desc, emptyTpv, tableLastActivity, tablePlatform, tableActions, tpvStatusInactive; downloadInstallerIncludesKds, downloadPackagePreparing, downloadDevTitle, downloadDevDesc, downloadHideInstructions, downloadShowInstructions, downloadBuildStep1–5, downloadFor, downloadYourSystem, downloadInvalidUrl, downloadFooterNote, downloadInstallComplete, downloadVerifying, downloadVerify, commandCopied.
- **config.qr:** desktopLinkTitle, mobileLinkTitle, expiresIn, copyUrl, typeLabel, tokenLabel, iosName, iosBrowser, androidName, androidBrowser, iosStep1–5, iosNote, androidStep1–3.

### Textos hardcoded removidos

- **AdminSidebar:** Todos os grupos (“Comando”, “Operar”, “Analisar”, “Governar”, “Conectar”) e itens (“Comando Central”, “Ajustes do Núcleo”, “Cardápio”, “Pedidos”, “Mesas”, “Reservas”, “Transações”, “Fechamentos”, “Relatórios”, “Equipa”, “TPV”, “AppStaff”, “Módulos”, “Observabilidade”, “Clientes”, “Promoções”, “Integrações”) e badges “BETA”, “BREVE”, “OFF”.
- **AdminDevicesPage:** “AppStaff”, “Provisão e lista…”, “Só AppStaff aqui. TPV:”, “Tela TPV”, “no menu lateral.”, “Adicionar dispositivo AppStaff”, “Gere um QR…”, “Nome (opcional)”, “ex: Telemóvel sala”, “Gerar QR”, “A gerar…”, “Erro ao gerar token”, “AppStaff registados”, “Dispositivos AppStaff vinculados…”, “A carregar…”, “Nenhum AppStaff registado…”, cabeçalhos de tabela, “Revogado”, “Online”, “Offline”, “Revogar”, “Revogar este dispositivo?”, “agora”.
- **AdminTPVTerminalsPage:** Título, subtítulo, fluxo, títulos e descrições dos 4 blocos, “Pacote disponível”, “Pacote em preparação…”, “macOS (Apple Silicon…”, passos do primeiro arranque, “Nome do terminal (opcional)”, “ex: TPV_CAIXA_01”, “Gerar código”, “A gerar…”, “Erro ao gerar código de emparelhamento”, “Copiado”, “Copiar código”, “Abrir app TPV”, “Abre o app TPV…”, “Cole no app TPV…”, “Dev: se «Abrir app TPV»…”, “Comando copiado”, “A carregar…”, “Nenhum TPV ainda…”, cabeçalhos da tabela, “Inactivo”.
- **DesktopDownloadSection:** “O instalador do TPV inclui também o KDS…”, “Pacote em preparação…”, “Modo DEV — Gerar DMG local”, “Em desenvolvimento não há release…”, “Ocultar instruções”, “Ver instruções de build local”, passos de build (texto completo), “Descarregar para …”, “Tu sistema”, “URL inválida”, “Instalação concluída?”, “Verificando…”, “Verificar”.
- **InstallQRPanel:** “Expira em”, “Copiar URL”, “Tipo:”, “Token:”, “iPhone / iPad”, “Safari”, “Android”, “Chrome”, todas as instruções iOS e Android (lista e nota).

### Trechos pendentes e razão

- Nenhum. Todo o texto visível no escopo P1 Admin foi migrado para chaves i18n.

---

## 3. O que falta

- **P2 da auditoria i18n:** ReservasPage, LocationEntityTableCard (textos em es); alinhamento fino pt-BR/pt-PT; mensagens de erro/toasts em Admin; opcionalmente labels dos selects (locale/timezone/currency) em SoftwareTpvPage; restante superfícies (TPV/KDS operacional, AppStaff shell/modos) se aplicável.
- **Validação em runtime:** Trocar idioma no portal e percorrer /admin (sidebar, devices, devices/tpv) para confirmar que todos os textos mudam conforme o locale.

---

## 4. Próximo passo único

Corrigir P2 de i18n (ficheiros e chaves indicados na auditoria) **ou** validar manualmente os fluxos Admin em pt-BR, pt-PT, en e es antes de fechar a frente i18n Admin.

---

## 5. Prompt para o Cursor

```
Objetivo: corrigir os problemas P2 de i18n identificados na auditoria (docs/audit/AUDITORIA_I18N_SISTEMA_2026-03.md), limitando à superfície Admin se o escopo for apenas Admin.

Escopo sugerido P2 Admin: ReservasPage, LocationEntityTableCard (textos em es); mensagens de erro/toasts em páginas Admin já migradas; alinhamento pt-BR/pt-PT onde houver divergência; opcionalmente labels dos selects em SoftwareTpvPage.

Regras: não mexer em rotas nem lógica; não abrir frentes fora do escopo P2; usar namespaces existentes (config, sidebar) e pt-BR como referência.
```

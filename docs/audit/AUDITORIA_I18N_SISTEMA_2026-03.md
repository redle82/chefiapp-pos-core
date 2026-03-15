# Auditoria i18n do sistema ChefIApp

**Data:** 2026-03-15  
**Escopo:** Admin, TPV/KDS, AppStaff — diagnóstico real, sem correções.  
**Regra:** Apenas auditar e reportar; não alterar código, rotas, nem testes.

---

## 1. Auditoria do Admin

### 1.1 Estado geral

- **Uso de i18n:** Parcial. `ModulesPage` e `ModuleCard` usam `useTranslation("sidebar")` e chaves `modules.*`. `AdminTopbar` usa `useTranslation("dashboard")` com `topbar.*` e muitos `defaultValue` em pt-PT. `InstallQRPanel` usa `useTranslation()` com `qr.desktopLinkTitle` e `qr.mobileLinkTitle` (chaves **ausentes** nos JSON de locales — fallback para a chave literal).
- **Sidebar Admin:** `AdminSidebar.tsx` **não usa i18n**. Toda a navegação (grupos e itens) está hardcoded em português em `NAV_GROUPS`.
- **Telas de dispositivos/TPV refatoradas:** `AdminDevicesPage`, `AdminTPVTerminalsPage`, `DesktopDownloadSection`, `DesktopPairingSection` estão **100% hardcoded** (pt-PT/pt-BR misturado com es em alguns pontos).
- **Inconsistência de idioma:** Espanhol em `DesktopPairingSection` (erro "Error al generar código", "Nombre (opcional)", "ej: TPV_BALCAO_01", "Generando…", "Expira en", "Introduce este código...") e em `SoftwareTpvPage` ("Configuración", "Modo rápido", "Atajos disponibles:", "Configuración general y modo rápido del punto de venta."). Em `ReservasPage` e `LocationEntityTableCard` há textos em espanhol. Link literal `comingSoon.learnMore` em `DesktopPairingSection` (chave exposta ao utilizador).
- **Namespace:** Admin usa `sidebar` e `dashboard` em poucos sítios; não existe namespace `admin` nem `devices` nos locales.

### 1.2 Ficheiros auditados

| Ficheiro | Usa i18n? | Observação |
|----------|------------|------------|
| `features/admin/modules/pages/ModulesPage.tsx` | Sim (sidebar) | Coerente |
| `features/admin/modules/components/ModuleCard.tsx` | Sim (sidebar) | Coerente |
| `features/admin/dashboard/components/AdminTopbar.tsx` | Sim (dashboard) | Muitos `defaultValue` pt-PT; roles hardcoded como fallback |
| `features/admin/dashboard/components/AdminSidebar.tsx` | **Não** | NAV_GROUPS todo hardcoded pt |
| `features/admin/dashboard/components/AdminPageHeader.tsx` | N/A | Só recebe title/subtitle dos pais |
| `features/admin/devices/AdminDevicesPage.tsx` | **Não** | Tudo hardcoded pt |
| `features/admin/devices/AdminTPVTerminalsPage.tsx` | **Não** | Tudo hardcoded pt |
| `features/admin/devices/DesktopDownloadSection.tsx` | **Não** | Tudo hardcoded pt ("Tu sistema", "Descarregar para", etc.) |
| `features/admin/devices/DesktopPairingSection.tsx` | **Não** | Mix pt + **es** + chave literal "comingSoon.learnMore" |
| `features/admin/devices/InstallQRPanel.tsx` | Parcial | `qr.desktopLinkTitle` / `qr.mobileLinkTitle`; resto hardcoded pt ("Expira em", "Copiar URL", "iPhone / iPad", instruções iOS/Android) |
| `features/admin/software-tpv/pages/SoftwareTpvPage.tsx` | Parcial | `t("common:saving")`, `t("common:save")`; títulos e textos da página em **es** |
| `features/admin/subscription/components/InvoicesTable.tsx` | Sim (billing) | Coerente |
| `features/admin/subscription/components/BillingEmailCard.tsx` | Sim (common) | Coerente |
| Outros (subscription, promotions, config, catalog, closures, etc.) | Variado | Muitos com hardcoded pt ou es; não listados exaustivamente aqui |

### 1.3 Problemas encontrados

1. **Textos hardcoded no JSX/TS**  
   - `AdminDevicesPage`: "AppStaff", "Provisão e lista de dispositivos AppStaff.", "Só AppStaff aqui. TPV: Tela TPV", "Adicionar dispositivo AppStaff", "Nome (opcional)", "ex: Telemóvel sala", "A gerar…", "Gerar QR", "AppStaff registados", "A carregar…", "Nenhum AppStaff registado", "Estado", "Revogar", "Revogar este dispositivo?", etc.  
   - `AdminTPVTerminalsPage`: título "TPV — Tela oficial", subtítulo, "Baixar · Primeiro arranque · Vincular terminal · TPVs criados.", "1. Baixar TPV", "Pacote disponível", "Pacote em preparação...", "macOS (Apple Silicon, Intel)...", "2. Primeiro arranque", listas de instruções, "3. Vincular terminal", "Nome do terminal (opcional)", "ex: TPV_CAIXA_01", "A gerar…", "Gerar código", "Erro ao gerar código de emparelhamento", "Copiado", "Copiar código", "Abrir app TPV", "A carregar…", "Nenhum TPV ainda", cabeçalhos de tabela "Status", "Nome", "Registado", "Última atividade", "Plataforma", "Ações", "Online", "Inactivo", "Offline", "agora", etc.  
   - `DesktopDownloadSection`: "Modo DEV — Gerar DMG local", "Ocultar instruções", "Ver instruções de build local", "Tu sistema", "Descarregar para {label}", "URL inválida", "Instalação concluída?", "Verificando…", "Verificar", "Pacote em preparação. Os botões...", instruções de build (code blocks), etc.  
   - `DesktopPairingSection`: "Vincular dispositivo de escritorio", "Ir para página TPV", "Tipo", "TPV (Caja)", "KDS (Cocina)", "Genera un código...", "comingSoon.learnMore" (chave literal), "Nombre (opcional)", "ej: TPV_BALCAO_01", "Generando…", "Generar código", "Error al generar código", "Expira en", "✓ Copiado", "Copiar código", "Introduce este código en la aplicación...".  
   - `InstallQRPanel`: "Expira em", "Copiar URL", "Tipo:", "iPhone / iPad", "Safari", "Abra a aplicação Câmara...", "Digitalize este código QR", etc. (apenas dois textos vêm de `t()`).  
   - `AdminSidebar`: todos os grupos e itens ("Comando", "Comando Central", "Ajustes do Núcleo", "Operar", "Cardápio", "Pedidos", "Mesas", "Reservas", "Analisar", "Governar", "Equipa", "TPV", "AppStaff", "Módulos", "Observabilidade", "Conectar", "Clientes", "Promoções", "Integrações", "BETA", "BREVE", "OFF").  
   - `SoftwareTpvPage`: "Configuración", "Modo rápido", "Configuración general y modo rápido del punto de venta.", "Atajos disponibles:", array ATAJOS em es, etc.

2. **Mistura de idiomas**  
   - pt-PT dominante em Admin devices/TPV.  
   - **Espanhol** em: `DesktopPairingSection` (mensagens, labels, placeholders), `SoftwareTpvPage` (títulos e atalhos), `ReservasPage` ("Configuración central de reservas. Usa las pestañas..."), `LocationEntityTableCard` ("No hay ubicaciones. Crea ubicaciones en Configuración →").

3. **Uso inconsistente de t() e namespaces**  
   - ModulesPage/ModuleCard: namespace `sidebar` correto.  
   - AdminTopbar: namespace `dashboard`; muitos `defaultValue` em pt-PT (correto como fallback, mas as chaves devem existir em todos os locales).  
   - InstallQRPanel: `useTranslation()` sem namespace → usa default; chaves `qr.desktopLinkTitle` e `qr.mobileLinkTitle` **não existem** em `common.json` (nem noutro namespace carregado por defeito), logo o runtime mostra a chave como texto ou fallback incorreto.  
   - Não há namespace dedicado para admin/devices/tpv; sidebar tem `modules.*` mas não cobre dispositivos nem TPV oficial.

4. **Chaves faltantes**  
   - `qr.desktopLinkTitle`, `qr.mobileLinkTitle` (usadas em InstallQRPanel).  
   - Qualquer chave que AdminTopbar use com `defaultValue` deve existir em `dashboard` para todos os idiomas (não verificado por locale).

5. **Fallbacks / defaultValue**  
   - AdminTopbar: todos os roles e labels usam `defaultValue` em pt-PT; adequado como fallback, mas indica dependência de chaves em `dashboard.json` (pt-BR, pt-PT, en, es).

6. **Componentes que não usam i18n mas deveriam**  
   - AdminSidebar (todo o menu).  
   - AdminDevicesPage (toda a página).  
   - AdminTPVTerminalsPage (toda a página).  
   - DesktopDownloadSection (todo o componente).  
   - DesktopPairingSection (todo o componente).  
   - InstallQRPanel (exceto dois títulos).  
   - AdminPageHeader não usa i18n (só propaga título/subtítulo; a responsabilidade é dos pais).

7. **Páginas novas/refatoradas fora dos locales**  
   - Toda a área `/admin/devices` e `/admin/devices/tpv` (refatoração TPV/AppStaff) está fora dos ficheiros de locale: não existem chaves para "TPV — Tela oficial", "AppStaff", "Baixar TPV", "Primeiro arranque", "Vincular terminal", "TPVs criados", etc.  
   - AdminSidebar (estrutura nova Comando/Operar/Analisar/Governar/Conectar) não tem equivalente em locale.

8. **Duplicação / divergência pt-BR vs pt-PT**  
   - Nos locales `sidebar.json`, pt-BR e pt-PT já têm pequenas divergências (ex.: "Fechamentos" vs "Fechos", "Website" vs "Site", "needsSetup" "Precisa configurar" vs "Precisa de configuração").  
   - As telas de dispositivos e TPV não usam esses locales; estão em hardcode com mistura de pt e es.

### 1.4 Severidade por problema

| Problema | Severidade |
|----------|------------|
| Chave literal "comingSoon.learnMore" visível ao utilizador em DesktopPairingSection | **P0** |
| Mistura crítica de espanhol em DesktopPairingSection e SoftwareTpvPage (utilizador vê es em fluxo pt) | **P0** |
| AdminSidebar 100% hardcoded (navegação principal do Admin) | **P1** |
| AdminDevicesPage e AdminTPVTerminalsPage 100% hardcoded (telas oficiais TPV/AppStaff) | **P1** |
| Chaves qr.desktopLinkTitle / qr.mobileLinkTitle ausentes (InstallQRPanel) | **P1** |
| DesktopDownloadSection e InstallQRPanel maioritariamente hardcoded | **P1** |
| SoftwareTpvPage títulos e atalhos em es | **P1** |
| ReservasPage e LocationEntityTableCard textos em es | **P2** |
| Divergência pt-BR/pt-PT em sidebar.json e uso de defaultValue em Topbar | **P2** |

### 1.5 Exemplos concretos de strings/chaves

- **Hardcoded (Admin):**  
  `"TPV — Tela oficial"`, `"Única superfície operacional: baixar, instalar, vincular e gerir terminais TPV."`, `"Baixar · Primeiro arranque · Vincular terminal · TPVs criados."`, `"1. Baixar TPV"`, `"Pacote em preparação. Quando estiver publicado, os botões abaixo ficam activos."`, `"Só AppStaff aqui. TPV: Tela TPV"`, `"Adicionar dispositivo AppStaff"`, `"Gerar QR"`, `"Comando"`, `"Comando Central"`, `"Ajustes do Núcleo"`.  
- **Espanhol indevido:**  
  `"Error al generar código"`, `"Nombre (opcional)"`, `"ej: TPV_BALCAO_01"`, `"Generando…"`, `"Generar código"`, `"Expira en"`, `"Introduce este código en la aplicación de escritorio"`, `"Configuración"`, `"Modo rápido"`, `"Atajos disponibles:"`, `"Configuración general y modo rápido del punto de venta."`.  
- **Chave literal exposta:**  
  `comingSoon.learnMore` (link em DesktopPairingSection).  
- **Chaves usadas mas possivelmente faltantes:**  
  `qr.desktopLinkTitle`, `qr.mobileLinkTitle`.

### 1.6 Lista exata de ficheiros a corrigir depois (Admin)

- `merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx`
- `merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx`
- `merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx`
- `merchant-portal/src/features/admin/devices/DesktopDownloadSection.tsx`
- `merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx`
- `merchant-portal/src/features/admin/devices/InstallQRPanel.tsx`
- `merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.tsx`
- `merchant-portal/src/features/admin/dashboard/components/AdminTopbar.tsx` (validar chaves em todos os locales; manter defaultValue como fallback)
- Locales: criar/estender namespace (ex. `admin` ou `devices`) e adicionar chaves para qr.*, tela TPV, AppStaff, sidebar Admin (ou estender `sidebar`/`dashboard` conforme convenção).

---

## 2. Auditoria do TPV/KDS

### 2.1 Estado geral

- **TPV (TPVMinimal, TPV.tsx, TPVPOSView, TPVShiftPage, TPVKitchenPage, etc.):** Maioria **hardcoded** em português. Exceções: `TPVNotificationBar` e `TPVTasksPage` usam `useTranslation()` (namespace default/common) para poucos textos; `TPVMinimal` e restantes páginas usam strings fixas ("Verificando estado operacional...", "Erro ao carregar produtos.", "Preview — pedido simulado", "Balcão", "Cozinha", "Definições", "Pagina Web", etc.).
- **KDS (KDSMinimal, OriginBadge, TaskPanel, etc.):** Labels em `OriginBadge` (CAIXA, WEB, GARÇOM, GERENTE, DONO, COZINHA, SALÃO, QR MESA) estão **hardcoded** em português. `KDSMinimal.tsx` não usa `useTranslation` para a UI principal; existem locales `tpv.json` e `kds.json` com chaves (ex.: kds.badge, kds.processing, kds.emptyTitle) que **não são usadas** de forma consistente nas páginas TPV/KDS.
- **Mistura de idiomas:** TPV/KDS em pt; algum comentário ou string em en em ficheiros (ex.: "Filter", "Restaurante", "Garçom" em testes). Locales tpv/kds têm pt-BR; não há uso sistemático por componente.
- **Namespaces:** Existem `tpv` e `kds` nos locales; a maioria dos componentes TPV/KDS **não** usa `useTranslation("tpv")` ou `useTranslation("kds")`.

### 2.2 Ficheiros auditados

| Ficheiro | Usa i18n? | Observação |
|----------|------------|------------|
| `pages/TPVMinimal/TPVMinimal.tsx` | Não | Hardcoded pt ("Erro ao carregar produtos.", "Verificando estado operacional...", "Balcão", etc.) |
| `pages/TPVMinimal/TPVPOSView.tsx` | Não | Hardcoded pt (toasts, totais, "Ver Pedido ·") |
| `pages/TPVMinimal/TPVShiftPage.tsx` | Não | Hardcoded pt (Caixa aberto, Saldo esperado, Fechar turno, etc.) |
| `pages/TPVMinimal/TPVKitchenPage.tsx` | Não | Hardcoded pt (Fila, Detalhes, Info, Pedido #) |
| `pages/TPVMinimal/TPVTasksPage.tsx` | Parcial | `t("common:create")` |
| `pages/TPVMinimal/components/TPVNotificationBar.tsx` | Parcial | `t("common:close")` |
| `pages/TPVMinimal/components/TPVSidebar.tsx` | Não | Títulos "Cozinha", "Pedidos", "Pagina Web", "Definições" hardcoded |
| `pages/KDSMinimal/KDSMinimal.tsx` | Não | Título e UI hardcoded |
| `pages/KDSMinimal/OriginBadge.tsx` | Não | Todos os labels (CAIXA, GARÇOM, GERENTE, DONO, COZINHA, SALÃO, QR MESA) hardcoded |
| Locales `tpv.json` / `kds.json` | — | Chaves existem (payment.*, order.*, closeCash.*, table.*, kds.badge, kds.processing, etc.) mas não são usadas na maioria dos componentes |

### 2.3 Problemas encontrados

1. **Textos hardcoded no JSX/TS**  
   - TPVMinimal: "Verificando estado operacional...", "Erro ao carregar produtos.", "Preview — pedido simulado (não gravado)", "Balcão", mensagens de pedido criado/pago.  
   - TPVSidebar: "Cozinha", "Pedidos", "Pagina Web", "Definições".  
   - TPVShiftPage: "Caixa aberto", "Saldo esperado", "Fechar turno", "Saldo inicial", etc.  
   - TPVKitchenPage: "Fila", "Detalhes", "Info", "Pedido #".  
   - TPVPOSView: "Ver Pedido ·", toasts de pagamento/pedido.  
   - KDSMinimal: "Todas", "Cozinha", "Bar", "Restaurante Teste — KDS".  
   - OriginBadge: CAIXA, WEB, GARÇOM, GERENTE, DONO, COZINHA, SALÃO, QR MESA (e variantes).

2. **Uso inconsistente de t() e namespaces**  
   - Só TPVNotificationBar e TPVTasksPage usam `t()` (common).  
   - Namespaces `tpv` e `kds` existem nos JSON mas quase não são referidos nos componentes.

3. **Chaves existentes não utilizadas**  
   - `tpv.json`: payment.*, order.*, closeCash.*, table.*, error.*, etc.  
   - `kds.json`: badge.*, processing, startPrep, markReady, emptyTitle, emptyDescription, backToHome, refresh, station.*, lane.*, installTitle, installDescription.  
   - Estes deviam ser usados nos componentes TPV/KDS em vez de strings fixas.

4. **Componentes que não usam i18n mas deveriam**  
   - TPVMinimal, TPVPOSView, TPVShiftPage, TPVKitchenPage, TPVTablesPage, TPVSidebar.  
   - KDSMinimal, OriginBadge, TaskPanel, ItemTimer, OrderTimer (labels de UI).

5. **Empty states, headers, toasts, mensagens de erro**  
   - Quase todos hardcoded; deveriam vir de tpv/kds ou common.

### 2.4 Severidade por problema

| Problema | Severidade |
|----------|------------|
| Fluxo principal TPV (POS, turno, cozinha) 100% hardcoded | **P1** |
| KDS (OriginBadge, títulos) 100% hardcoded | **P1** |
| Locales tpv/kds existem mas não são usados de forma consistente | **P1** |
| Sidebar e páginas secundárias TPV hardcoded | **P2** |

### 2.5 Exemplos concretos de strings/chaves

- **Hardcoded TPV:**  
  `"Verificando estado operacional..."`, `"Erro ao carregar produtos."`, `"Balcão"`, `"Cozinha"`, `"Definições"`, `"Pagina Web"`, `"Pedidos"`, `"Caixa aberto"`, `"Saldo esperado"`, `"Fechar turno"`, `"Fila"`, `"Detalhes"`, `"Info"`, `"Ver Pedido ·"`.  
- **Hardcoded KDS:**  
  `"CAIXA"`, `"GARÇOM"`, `"GERENTE"`, `"DONO"`, `"COZINHA"`, `"SALÃO"`, `"QR MESA"`, `"Todas"`, `"Bar"`, `"Restaurante Teste — KDS"`.  
- **Chaves em locale não usadas:**  
  `tpv.payment.title`, `tpv.order.emptyCart`, `kds.emptyTitle`, `kds.station.kitchen`, etc.

### 2.6 Lista exata de ficheiros a corrigir depois (TPV/KDS)

- `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVPOSView.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVShiftPage.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVKitchenPage.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVTablesPage.tsx`
- `merchant-portal/src/pages/TPVMinimal/components/TPVSidebar.tsx`
- `merchant-portal/src/pages/TPVMinimal/components/TPVNotificationBar.tsx` (alargar uso de t())
- `merchant-portal/src/pages/TPVMinimal/TPVTasksPage.tsx`
- `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`
- `merchant-portal/src/pages/KDSMinimal/OriginBadge.tsx`
- `merchant-portal/src/pages/KDSMinimal/TaskPanel.tsx` (se houver labels)
- Locales: garantir que `tpv.json` e `kds.json` têm todas as chaves necessárias e que os componentes passam a usar `useTranslation("tpv")` / `useTranslation("kds")`.

---

## 3. Auditoria do AppStaff

### 3.1 Estado geral

- **Uso de i18n:** Quase inexistente. A maioria das páginas e componentes AppStaff **não** usa `useTranslation`. Exceções: testes que mockam `useTranslation`; alguns componentes partilhados (ex.: Toast, design-system) podem usar i18n noutros contextos.
- **StaffAppShellLayout:** Não usa i18n para labels do shell (nome do restaurante, "Início", "Mais", roles, etc.); usa `getOperatorProfile(activeRole)` com labels em português definidos em `operatorProfiles` / `staffModeConfig`.
- **staffModeConfig:** Labels dos modos ("Visão operacional", "Turno", "Equipe", "TPV Mobile", "KDS Mobile", "Tarefas", "Chamados", "Scanner", "Perfil") **hardcoded** em pt-BR.
- **DeliveryHome, OwnerGlobalDashboard, WaiterHome, etc.:** Tabs, botões, empty states, tabelas e mensagens **hardcoded** em português ("Painel", "Entregas", "Mapa", "Condutores", "Avaliações", "Entregador", "Painel de despacho", "Fila crítica", "Atribuir agora", "Por atribuir", "Aguardando atribuição", "Concluída", "Em rota", etc.).
- **Não existe namespace `appstaff` ou `staff` nos locales.** Existe `waiter.json` com `tablePanel.*`, `toast.*`, etc., usado noutros contextos (Waiter); AppStaff não o usa de forma sistemática.

### 3.2 Ficheiros auditados

| Ficheiro | Usa i18n? | Observação |
|----------|------------|------------|
| `pages/AppStaff/routing/StaffAppShellLayout.tsx` | Não | Labels do shell e bottom nav hardcoded / vindos de config |
| `pages/AppStaff/routing/staffModeConfig.ts` | Não | STAFF_MODES com label/shortLabel em pt |
| `pages/AppStaff/AppStaffHome.tsx` | Não | Tiles e estados hardcoded |
| `pages/AppStaff/homes/DeliveryHome.tsx` | Não | Tabs, painéis, botões, estados ("Painel", "Entregas", "Atribuir agora", etc.) |
| `pages/AppStaff/homes/WaiterHome.tsx` | Não | Hardcoded |
| `pages/AppStaff/dashboards/OwnerGlobalDashboard.tsx` | Não | Métricas, labels, alertas hardcoded |
| `pages/AppStaff/data/operatorProfiles.ts` | Não | Nomes de persona ("Comandante", etc.) hardcoded |
| `pages/AppStaff/context/StaffContext.tsx` | Não | Mensagem "Falha ao sincronizar com KDS. Tente novamente." hardcoded |
| Outros (MiniTPVMinimal, MiniKDSMinimal, TaskWhyBadge, etc.) | Não | Strings pontuais hardcoded |

### 3.3 Problemas encontrados

1. **Textos hardcoded no JSX/TS**  
   - staffModeConfig: "Visão operacional", "Operação", "Turno", "Equipe", "TPV Mobile", "KDS Mobile", "Tarefas", "Chamados", "Scanner", "Perfil".  
   - DeliveryHome: "Painel", "Entregas", "Mapa", "Condutores", "Avaliações", "Entregador", "Painel de despacho", "Fila crítica", "Próxima decisão", "Atribuir agora", "Por atribuir", "Aguardando atribuição", "Atribuir", "Concluída", "Em rota", "Cobertura operacional", etc.  
   - StaffAppShellLayout: "Início", "Mais", role labels (via operatorProfiles).  
   - OwnerGlobalDashboard: títulos de secções, métricas, alertas.  
   - StaffContext: "Falha ao sincronizar com KDS. Tente novamente."  
   - CleaningTaskView: "NFC Tag Detected", "NFC Scan timed out or failed." (en).  
   - MiniPOS: "QR Code não reconhecido".

2. **Mistura de idiomas**  
   - Maioria pt (pt-BR); CleaningTaskView em inglês; algum texto técnico em en.

3. **Uso inconsistente de t() e namespaces**  
   - AppStaff não usa namespaces dedicados; waiter.json existe mas não é usado nos fluxos AppStaff de forma visível nesta auditoria.

4. **Componentes que não usam i18n mas deveriam**  
   - StaffAppShellLayout, staffModeConfig, AppStaffHome, DeliveryHome, WaiterHome, OwnerGlobalDashboard, OperatorProfiles (personas), StaffContext (mensagens de erro), CleaningTaskView, MiniPOS.

5. **Páginas novas/refatoradas fora dos locales**  
   - Toda a superfície AppStaff (launcher, modos, delivery, owner dashboard, etc.) está fora dos ficheiros de locale; não existe namespace staff/appstaff.

### 3.4 Severidade por problema

| Problema | Severidade |
|----------|------------|
| Launcher e modos AppStaff (navegação principal) hardcoded | **P1** |
| DeliveryHome e OwnerGlobalDashboard 100% hardcoded | **P1** |
| Mensagens de erro e alertas (StaffContext, CleaningTaskView, MiniPOS) hardcoded | **P2** |
| Falta de namespace staff/appstaff nos locales | **P1** |

### 3.5 Exemplos concretos de strings/chaves

- **Hardcoded:**  
  `"Visão operacional"`, `"Turno"`, `"TPV Mobile"`, `"KDS Mobile"`, `"Tarefas"`, `"Chamados"`, `"Painel"`, `"Entregas"`, `"Atribuir agora"`, `"Fila crítica"`, `"Início"`, `"Mais"`, `"Falha ao sincronizar com KDS. Tente novamente."`, `"Comandante"`, `"NFC Tag Detected"`, `"QR Code não reconhecido"`.

### 3.6 Lista exata de ficheiros a corrigir depois (AppStaff)

- `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx`
- `merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts`
- `merchant-portal/src/pages/AppStaff/AppStaffHome.tsx`
- `merchant-portal/src/pages/AppStaff/homes/DeliveryHome.tsx`
- `merchant-portal/src/pages/AppStaff/homes/WaiterHome.tsx`
- `merchant-portal/src/pages/AppStaff/dashboards/OwnerGlobalDashboard.tsx`
- `merchant-portal/src/pages/AppStaff/data/operatorProfiles.ts`
- `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`
- `merchant-portal/src/pages/AppStaff/views/CleaningTaskView.tsx`
- `merchant-portal/src/pages/AppStaff/components/MiniPOS.tsx`
- Locales: criar namespace `staff` ou `appstaff` e adicionar chaves para modos, delivery, owner, erros.

---

## 4. Síntese final

### 4.1 Principais padrões errados do sistema

1. **Refatorações e novas telas sem passar por i18n**  
   Toda a área Admin devices/TPV (AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, DesktopPairingSection) e a superfície AppStaff (launcher, delivery, owner dashboard) foram implementadas ou refatoradas com strings em hardcode em vez de chaves de locale.

2. **Mistura de idiomas (pt / es / en) sem critério**  
   Vários ficheiros Admin (DesktopPairingSection, SoftwareTpvPage, ReservasPage, LocationEntityTableCard) contêm espanhol; AppStaff tem inglês em CleaningTaskView e MiniPOS. Não há regra clara de “uma superfície = um idioma base até ter i18n”.

3. **Namespaces existentes não utilizados**  
   Os locales `tpv.json` e `kds.json` têm muitas chaves prontas; os componentes TPV/KDS não as usam. O mesmo para `waiter.json` face ao AppStaff.

4. **Chaves inexistentes ou literais expostas**  
   InstallQRPanel usa `qr.desktopLinkTitle` e `qr.mobileLinkTitle` que não existem nos JSON; DesktopPairingSection mostra a chave literal `comingSoon.learnMore` ao utilizador.

5. **Sidebar/navegação principal sem i18n**  
   AdminSidebar (Admin) e staffModeConfig/StaffAppShellLayout (AppStaff) definem a navegação com textos fixos, o que quebra a experiência multi-idioma na raiz.

### 4.2 O que é ruído/legado

- **defaultValue em AdminTopbar:** Úteis como fallback; o ruído é não garantir que as chaves existem em todos os locales (dashboard.pt-BR, dashboard.pt-PT, dashboard.en, dashboard.es).
- **Comentários e docblocks em es/en** (ex.: SoftwareTpvPage "Configuración e Modo rápido") são ruído de consistência; o crítico são os textos renderizados (JSX).
- **Testes que assertam strings hardcoded** (ex.: SoftwareTpvPage.layout.test "Configuración", "Modo rápido") fixam o problema em vez de o corrigir; quando se passar a i18n, os testes devem usar chaves ou mock de t().

### 4.3 O que deve virar regra de arquitetura de i18n

1. **Nenhum texto visível ao utilizador em hardcode**  
   Headers, subtítulos, botões, empty states, tabelas, modais, toasts, mensagens de erro e labels de navegação devem vir de `t()` (ou equivalente) com chaves em ficheiros de locale.

2. **Uma superfície = um (ou mais) namespace(s) definido(s)**  
   Admin: `sidebar` + `dashboard` já usados; definir `admin` ou `devices` para dispositivos/TPV e colocar aí todas as chaves das telas Admin devices/TPV.  
   TPV/KDS: usar de forma sistemática `tpv` e `kds`.  
   AppStaff: criar e usar namespace `staff` (ou `appstaff`).

3. **Idioma base por superfície até ter traduções**  
   Definir idioma base (ex.: pt-PT ou pt-BR) e garantir que todas as chaves existem nesse idioma; evitar misturar es/en em strings de UI na mesma superfície sem chave.

4. **Chaves nunca expostas ao utilizador**  
   Sempre que uma chave não existir no locale, usar fallback explícito (defaultValue ou segundo argumento de t()), nunca mostrar a chave literal.

5. **Navegação (sidebar, bottom nav, modos) sempre por i18n**  
   AdminSidebar e estrutura de modos AppStaff devem ler labels de locale, não de constantes em código.

### 4.4 Ordem recomendada de correção

1. **P0 (quebra visível / mistura crítica)**  
   - Corrigir DesktopPairingSection: remover es e chave literal "comingSoon.learnMore"; usar chaves ou fallback pt.  
   - Corrigir SoftwareTpvPage: substituir textos em es por chaves (config namespace ou admin) com valor pt.

2. **P1 (inconsistência relevante)**  
   - Adicionar chaves `qr.desktopLinkTitle` e `qr.mobileLinkTitle` (ex.: em common ou novo namespace admin) e garantir que InstallQRPanel e resto do painel QR usem i18n.  
   - Introduzir i18n em AdminSidebar (sidebar ou novo admin) e em AdminDevicesPage / AdminTPVTerminalsPage / DesktopDownloadSection.  
   - TPV/KDS: fazer os componentes principais usarem `tpv` e `kds` (TPVMinimal, TPVPOSView, TPVShiftPage, TPVKitchenPage, KDSMinimal, OriginBadge).  
   - AppStaff: criar namespace staff e aplicar em StaffAppShellLayout, staffModeConfig, DeliveryHome, OwnerGlobalDashboard.

3. **P2 (acabamento)**  
   - ReservasPage, LocationEntityTableCard: substituir es por chaves.  
   - Validar todos os defaultValue do AdminTopbar nos 4 locales.  
   - Alinhar pt-BR e pt-PT em sidebar (e restantes namespaces) e cobrir empty states, toasts e mensagens de erro em Admin, TPV/KDS e AppStaff.

---

## 5. Lista única consolidada de ficheiros com problema

(Ordenada por prioridade; sem duplicar ficheiros já listados nas secções 1.6, 2.6 e 3.6.)

### P0 (quebra visível grave / mistura crítica de idioma)

- `merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx`
- `merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.tsx`

### P1 (inconsistência relevante)

- `merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx`
- `merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx`
- `merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx`
- `merchant-portal/src/features/admin/devices/DesktopDownloadSection.tsx`
- `merchant-portal/src/features/admin/devices/InstallQRPanel.tsx`
- `merchant-portal/src/features/admin/dashboard/components/AdminTopbar.tsx` (validar chaves)
- `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVPOSView.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVShiftPage.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVKitchenPage.tsx`
- `merchant-portal/src/pages/TPVMinimal/components/TPVSidebar.tsx`
- `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`
- `merchant-portal/src/pages/KDSMinimal/OriginBadge.tsx`
- `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx`
- `merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts`
- `merchant-portal/src/pages/AppStaff/AppStaffHome.tsx`
- `merchant-portal/src/pages/AppStaff/homes/DeliveryHome.tsx`
- `merchant-portal/src/pages/AppStaff/dashboards/OwnerGlobalDashboard.tsx`
- Locales: adicionar/criar chaves para `qr.*`, admin/devices, tpv, kds, staff (namespaces conforme convenção).

### P2 (melhoria de acabamento)

- `merchant-portal/src/features/admin/reservas/pages/ReservasPage.tsx`
- `merchant-portal/src/features/admin/legal-entities/components/LocationEntityTableCard.tsx`
- `merchant-portal/src/pages/TPVMinimal/TPVTasksPage.tsx` (alargar uso de t())
- `merchant-portal/src/pages/TPVMinimal/components/TPVNotificationBar.tsx`
- `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`
- `merchant-portal/src/pages/AppStaff/views/CleaningTaskView.tsx`
- `merchant-portal/src/pages/AppStaff/components/MiniPOS.tsx`
- `merchant-portal/src/pages/AppStaff/homes/WaiterHome.tsx`
- `merchant-portal/src/pages/AppStaff/data/operatorProfiles.ts`

---

## 6. Recomendação de próximo passo único

**Corrigir primeiro os P0:**  
Em `DesktopPairingSection.tsx` e `SoftwareTpvPage.tsx`, eliminar toda a mistura de espanhol e a chave literal `comingSoon.learnMore`, substituindo por chaves de i18n (ex.: namespace `admin` ou `config`) com valores em pt-PT/pt-BR e fallback seguro, sem alterar rotas nem lógica. Em seguida, adicionar as chaves necessárias aos locales (pt-BR, pt-PT, en, es) para que nenhum utilizador veja es onde o idioma da aplicação é pt, nem chaves literais.

---

## Entrega no formato solicitado

### 1. Estado

- **Admin:** Parcialmente i18n (ModulesPage, ModuleCard, AdminTopbar, InstallQRPanel com 2 chaves); restante hardcoded; mistura pt/es; chaves qr.* ausentes; chave literal exposta.
- **TPV/KDS:** Quase todo hardcoded; locales tpv/kds existem mas não são usados de forma consistente.
- **AppStaff:** Quase sem i18n; modos, delivery e owner dashboard hardcoded; não existe namespace staff.

### 2. O que o Cursor fez

- Varreu o código real que renderiza as telas no runtime (Admin em `features/admin`, TPV/KDS em `pages/TPVMinimal` e `pages/KDSMinimal`, AppStaff em `pages/AppStaff`).
- Identificou uso de `useTranslation`, namespaces e chaves nos locales (sidebar, dashboard, common, tpv, kds, waiter).
- Listou textos hardcoded, mistura de idiomas, chaves faltantes, fallbacks e componentes sem i18n.
- Redigiu a auditoria em 4 blocos (Admin, TPV/KDS, AppStaff, Síntese), lista consolidada de ficheiros e classificação P0/P1/P2.
- **Não alterou** nenhum ficheiro de código, rotas, nem testes.

### 3. O que falta

- Implementar as correções (P0 → P1 → P2) conforme ordem recomendada.
- Criar/estender namespaces e chaves nos locales para admin/devices, qr.*, tpv, kds, staff.
- Garantir que nenhum texto visível fique em hardcode e que chaves nunca sejam exibidas ao utilizador.

### 4. Próximo passo único

Corrigir os dois ficheiros P0: `DesktopPairingSection.tsx` (remover es e chave literal `comingSoon.learnMore`; usar chaves i18n com fallback pt) e `SoftwareTpvPage.tsx` (substituir todos os textos em es por chaves; adicionar chaves aos locales). Não abrir novas frentes; não mexer em rotas, lógica, Electron, nem testes além do estritamente necessário para os P0.

### 5. Prompt para o Cursor

```
Objetivo: corrigir apenas os problemas P0 de i18n identificados na auditoria (docs/audit/AUDITORIA_I18N_SISTEMA_2026-03.md).

1) DesktopPairingSection.tsx
- Remover toda a mistura de espanhol (Error al generar código, Nombre (opcional), ej: TPV_BALCAO_01, Generando…, Generar código, Expira en, Introduce este código..., etc.) e substituir por chaves de i18n (ex.: namespace "admin" ou "config") com valores em pt-PT/pt-BR.
- Remover o link/label que mostra a chave literal "comingSoon.learnMore" ao utilizador: usar uma chave real com fallback (ex.: "Saiba mais") ou remover o link até existir destino.
- Manter comportamento e rotas inalterados.

2) SoftwareTpvPage.tsx
- Substituir todos os textos visíveis em espanhol (Configuración, Modo rápido, Configuración general y modo rápido del punto de venta., Atajos disponibles:, e o array ATAJOS) por chaves de i18n (mesmo namespace que Admin) com valores em pt.
- Adicionar as novas chaves aos ficheiros de locale (pt-BR, pt-PT, en, es) em namespace adequado (ex.: config ou admin).

Regras: não abrir novas frentes; não alterar rotas, lógica, Electron, TPV, AppStaff nem testes além do necessário para estes dois ficheiros. Foco só em eliminar mistura crítica de idioma e chave literal exposta.
```

# Entrega — Correção P0 i18n

**Data:** 2026-03-15  
**Escopo:** Apenas P0 da auditoria i18n (DesktopPairingSection, SoftwareTpvPage, locales). Sem novas frentes.

---

## 1. Estado

- **P0 concluído:** Mistura crítica de idioma (es) e chave literal (`comingSoon.learnMore`) removidas nos dois ficheiros no escopo.
- **DesktopPairingSection:** Todos os textos visíveis passaram a usar o namespace `config` (chaves `devices.*`) com fallback em pt-BR; link “Saiba mais” com label via i18n; comportamento e rotas inalterados.
- **SoftwareTpvPage:** Todos os textos visíveis (título, subtítulo, secções, labels, atalhos, mensagens de erro) passaram a usar o namespace `config` (chaves `softwareTpv.*`); array de atalhos deixou de ser hardcoded em espanhol.
- **Locales:** Novas chaves em `config.json` (pt-BR, pt-PT, en, es) nas secções `devices` e `softwareTpv`; pt-BR usado como referência.
- **Teste:** `SoftwareTpvPage.layout.test.tsx` atualizado com mock de `react-i18next` e asserções sobre chaves i18n; teste passa.

---

## 2. O que o Cursor fez

### Ficheiros alterados

1. **merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx**
   - Adicionado `import { useTranslation } from "react-i18next"` e `useTranslation("config")`.
   - Constante `DESKTOP_TYPES` (labels em es) substituída por `DESKTOP_TYPE_IDS` (array de ids) e helper `getTypeLabel(type)` que usa `t("devices.tpvLabel")` / `t("devices.kdsLabel")`.
   - Todos os textos visíveis substituídos por `t("devices.*")`: título, descrições, link “Saiba mais”, label “Tipo”, nome opcional, placeholder, botão gerar/copiar, estado “A gerar…”, “Expira em”, “Copiado”, instrução de uso do código, mensagem de erro (fallback).
   - Link que mostrava a chave literal `comingSoon.learnMore` passou a usar `t("devices.learnMore")` (“Saiba mais”) mantendo o destino `/admin/config/general`; aplicada a mesma classe CSS `tpvDedicatedLink` para consistência.

2. **merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.tsx**
   - `useTranslation()` passou a `useTranslation("config")`.
   - Constante `ATAJOS` (strings em es) substituída por `SHORTCUT_KEYS` (array de chaves `softwareTpv.shortcut1` … `shortcut4`); lista renderizada com `t(key)`.
   - Título e subtítulo da página: `t("softwareTpv.title")`, `t("softwareTpv.subtitle")`.
   - Botão “Abrir TPV em nova janela”: `t("softwareTpv.openInNewWindow")`.
   - Card Configuração: título, descrição, “A carregar…”, labels “Idioma *”, “Fuso horário *”, “Moeda *”, “Pedir confirmação ao fechar turno” via `softwareTpv.*`.
   - Card Modo rápido: título, descrição, “A carregar…”, “Ativar modo rápido”, “Atalhos disponíveis:” e os 4 itens da lista via `softwareTpv.shortcut1` … `shortcut4`.
   - Alert de erro: “Core indisponível ou restaurante não selecionado.” e “Erro ao guardar.” via `t("softwareTpv.errorCoreUnavailable")` e `t("softwareTpv.errorSave")`.

3. **merchant-portal/src/locales/pt-BR/config.json**  
   Adicionadas secções `devices` e `softwareTpv` com todas as chaves em pt-BR.

4. **merchant-portal/src/locales/pt-PT/config.json**  
   Mesmas secções e chaves em pt-PT (equivalência semântica; pequenas variantes lexicais onde apropriado).

5. **merchant-portal/src/locales/en/config.json**  
   Mesmas secções e chaves em inglês.

6. **merchant-portal/src/locales/es/config.json**  
   Mesmas secções e chaves em espanhol (incluindo “Configuración”, “Modo rápido”, etc., para quando o locale for es).

7. **merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.layout.test.tsx**
   - Mock de `react-i18next` adicionado: `useTranslation` retorna `t: (key: string) => key`.
   - Asserções passaram a verificar as chaves renderizadas (`softwareTpv.configCardTitle`, `softwareTpv.quickModeTitle`, `softwareTpv.shortcutsTitle`, `softwareTpv.quickModeDesc`) em vez dos textos em espanhol.

### Chaves novas criadas

**Namespace `config`, secção `devices`:**  
`pairingTitle`, `pairingTpvRedirectDesc`, `goToTpvPage`, `pairingKdsDesc`, `learnMore`, `typeLabel`, `tpvLabel`, `kdsLabel`, `nameOptional`, `namePlaceholder`, `generating`, `generateCode`, `errorGenerateCode`, `expiresIn`, `copied`, `copyCode`, `pairingCodeHint`.

**Namespace `config`, secção `softwareTpv`:**  
`title`, `subtitle`, `openInNewWindow`, `configCardTitle`, `configCardDesc`, `loading`, `languageLabel`, `timezoneLabel`, `currencyLabel`, `confirmOnCloseLabel`, `quickModeTitle`, `quickModeDesc`, `shortcutsTitle`, `activateQuickMode`, `shortcut1`, `shortcut2`, `shortcut3`, `shortcut4`, `errorCoreUnavailable`, `errorSave`.

### Textos hardcoded removidos

- **DesktopPairingSection:**  
  “Vincular dispositivo de escritorio”, “Para vincular um TPV…”, “Ir para página TPV”, “Genera un código y escríbelo…”, “comingSoon.learnMore”, “TPV (Caja)”, “KDS (Cocina)”, “Tipo”, “Nombre (opcional)”, “ej: TPV_BALCAO_01”, “Generando…”, “Generar código”, “Error al generar código”, “Expira en”, “✓ Copiado”, “Copiar código”, “Introduce este código en la aplicación…”.

- **SoftwareTpvPage:**  
  “Software TPV”, “Configuración general y modo rápido del punto de venta.”, “Abrir TPV en nueva ventana →”, “Configuración”, “Preferencias del TPV: idioma, moneda, comportamiento de cierre.”, “Cargando…”, “Idioma *”, “Zona horaria *”, “Moneda *”, “Pedir confirmación al cerrar turno”, “Modo rápido”, “Atajos y flujo rápido para servicio en pico (barra, terraza).”, “Atajos disponibles:”, “Activar modo rápido”, os quatro itens do array ATAJOS em es, “Core indisponível o restaurante no seleccionado.”, “Error al guardar.”.

### Trecho que não foi migrado e por quê

- **Opções dos selects em SoftwareTpvPage (LOCALES, TIMEZONES, CURRENCIES):**  
  Os labels das opções (ex.: “Português (Brasil)”, “America/Sao_Paulo (Brasil)”) mantêm-se hardcoded. São nomes de locale/fuso/moeda e não faziam parte dos textos em espanhol visíveis na página; a migração destes para i18n seria P1/P2 (consistência), não P0. O escopo foi apenas remover mistura crítica de idioma e chave literal.

---

## 3. O que falta

- **P1 da auditoria i18n:** AdminSidebar, AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel (e chaves `qr.*`), validação das chaves do AdminTopbar; TPV/KDS a usar de forma consistente os namespaces `tpv`/`kds`; AppStaff com namespace `staff` e i18n no shell, modos, delivery e owner.
- **P2:** ReservasPage, LocationEntityTableCard (textos em es); alinhamento pt-BR/pt-PT e mensagens de erro/toasts em Admin, TPV/KDS e AppStaff; opcionalmente migrar labels dos selects (locale/timezone/currency) em SoftwareTpvPage para i18n.

Nada do que falta foi alterado nesta tarefa; escopo limitado aos P0.

---

## 4. Próximo passo único

Quando for hora de avançar i18n, tratar os itens P1 da auditoria (docs/audit/AUDITORIA_I18N_SISTEMA_2026-03.md): começar por AdminSidebar e pelas telas de dispositivos/TPV (AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel), de forma incremental, sem abrir outras frentes em paralelo.

---

## 5. Prompt para o Cursor

```
Objetivo: corrigir os problemas P1 de i18n identificados na auditoria (docs/audit/AUDITORIA_I18N_SISTEMA_2026-03.md), começando pela superfície Admin.

Escopo da primeira leva P1:
- AdminSidebar: substituir NAV_GROUPS hardcoded por chaves de locale (namespace sidebar ou config); usar useTranslation e garantir que todos os grupos e itens de navegação vêm de t().
- AdminDevicesPage e AdminTPVTerminalsPage: substituir todos os textos visíveis por chaves i18n (namespace config.devices ou novo admin/devices); erros, placeholders, labels, botões, estados, cabeçalhos de tabela, empty states.
- DesktopDownloadSection e InstallQRPanel: idem; adicionar chaves qr.desktopLinkTitle e qr.mobileLinkTitle aos locales e garantir que todo o texto visível use t().

Regras: não mexer em rotas nem lógica; não abrir frentes TPV/KDS operacional nem AppStaff nesta leva; usar namespaces já existentes (sidebar, config) ou estender config com secções coerentes; pt-BR como referência nos novos textos.
```

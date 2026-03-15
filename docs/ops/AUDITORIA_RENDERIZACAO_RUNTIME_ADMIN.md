# Auditoria de renderização runtime — rotas admin (DOM real)

**Data:** 2025-03-15  
**Objetivo:** Identificar qual componente monta em cada rota, que DOM deveria existir com o código actual em disco, e qual bloco/ficheiro ainda desenha o layout antigo quando a UI observada é a antiga.

---

## Fonte das rotas em runtime

A app usa **OperationalRoutesFragment** (em `App.tsx`, linha 303). As rotas `/admin/*` estão definidas em **OperationalRoutes.tsx** dentro de `<Route path="/admin" element={<ElectronAdminGuard />}>` (linha 1251). O ElectronAdminGuard renderiza `<Outlet />` em contexto browser, pelo que o filho correspondente ao path é montado.

| Rota completa        | Path do Route (filho) | Componente montado        | Import |
|----------------------|------------------------|---------------------------|--------|
| `/admin/modules`     | `path="modules"`       | **ModulesPage**           | lazy → `../features/admin/modules/pages/ModulesPage` |
| `/admin/devices`     | `path="devices"`       | **AdminDevicesPage**      | lazy → `../features/admin/devices/AdminDevicesPage` |
| `/admin/devices/tpv` | `path="devices/tpv"`   | **AdminTPVTerminalsPage** | lazy → `../features/admin/devices/AdminTPVTerminalsPage` |

Não há outra definição de rotas para estas URLs; AdminRoutes.tsx não é usado no router principal.

---

## 1. Rota: `/admin/modules`

### Componente esperado
- **Ficheiro:** `merchant-portal/src/features/admin/modules/pages/ModulesPage.tsx`
- **Função:** `ModulesPage`

### DOM esperado (código actual em disco)
- Raiz: `<div ... data-runtime-page="ModulesPage">`
- Badge visível: texto **"MODULES_RUNTIME_V2"** (linha 165)
- Título: valor de `t("modules.pageTitle")` (header)
- Subtítulo: valor de `t("modules.pageSubtitle")`
- Secção “Essenciais”: `[CARD_TPV_V2]` no card do módulo TPV (linhas 176–189)
- Botão/link principal do card TPV: acção para **/admin/devices/tpv** (label “Ir para TPV” se existir na i18n)

### DOM observado (a preencher)
- Se a UI for a nova: existe `data-runtime-page="ModulesPage"`, texto "MODULES_RUNTIME_V2" e `[CARD_TPV_V2]` no card TPV.
- Se a UI for a antiga: nenhum destes atributos/textos; possível label antigo do botão (ex. “Instalar dispositivo” / “Gerir”).

### Componente real que desenha
- **ModulesPage** (mesmo ficheiro acima). Não há outro componente a desenhar esta página.

### Causa raiz (se ainda antiga)
- O bundle em execução é uma versão antiga de `ModulesPage.tsx` (sem `data-runtime-page`, sem badge MODULES_RUNTIME_V2, sem `[CARD_TPV_V2]`).

### Patch mínimo
- Garantir que o runtime carrega o módulo actual (reinício do dev server + hard refresh). Não há condição no código actual que esconda o novo layout; a diferença é só qual versão do ficheiro está a correr.

---

## 2. Rota: `/admin/devices`

### Componente esperado
- **Ficheiro:** `merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx`
- **Função:** `AdminDevicesPage`

### DOM esperado (código actual em disco)
- Bloco 1: `<h2 class="...sectionTitle">Adicionar dispositivo</h2>` (Install QR).
- Bloco 2: `<h2 ...>Dispositivos registados</h2>` e link “Ver só TPVs” para `/admin/devices/tpv`.
- Bloco 3: secção com **`data-block="tpv-hub-v2"`**, texto **`[BLOCO_TPV_HUB_V2]`** (linha 374), título “TPV”, link **“Ir para TPV”** para `/admin/devices/tpv` (linhas 373–382).
- Bloco 4: **DesktopPairingSection**. Com estado inicial `deviceType === "TPV"` (linha 37 do DesktopPairingSection), o código actual faz **early return** (linhas 90–131) e renderiza:
  - Container com **`data-block="pairing-tpv-redirect-v2"`**
  - Texto **`[PAIRING_TPV_REDIRECT_V2]`**
  - Título “Vincular dispositivo de escritorio”
  - Subtitle “Para vincular um TPV, utilize a página dedicada…”
  - Link **“Ir para página TPV”** para `/admin/devices/tpv`
  - Selector “Tipo” (TPV/KDS) — sem botão “Gerar código” nem formulário de código.

### DOM observado (layout “antigo” que descreveste)
- “Vincular dispositivo de escritório”
- Formulário TPV com botão **“Gerar código”**
- “Descarregar software” com grid de cards

Onde isso aparece no código actual:
- **“Vincular dispositivo de escritorio”** + formulário com **“Generar código”** (espanhol no código) vêm do **segundo return** de **DesktopPairingSection**, linhas **134–218** (branch quando `deviceType !== "TPV"` no código novo, ou quando não existe o early return no código antigo).
- **“Descarregar software”** com grid: em **AdminDevicesPage** actual **não existe** esse título nem esse grid. Esse conteúdo existe em **AdminTPVTerminalsPage** (“Instalar o TPV no seu computador” + **DesktopDownloadSection** com grid) e em **AdminDesktopPage** (título `t("downloadTitle")`). Portanto, se vês “Descarregar software” + grid em **/admin/devices**, ou estás noutra URL (ex. /admin/devices/tpv) ou o bundle inclui uma versão antiga de AdminDevicesPage que tinha essa secção.

### Componente real que desenha o bloco antigo
- **Ficheiro:** `merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx`
- **Linhas:** **134–218** (o `return` que começa em 134 e contém o formulário completo).

Trecho exacto que produz o layout antigo (título + formulário com “Gerar código”):

```tsx
// Linha 134
  return (
    <div className={styles.desktopPairingContainer}>
      <div className={styles.desktopPairingHeader}>
        ...
        <h3 className={styles.desktopPairingTitle}>
          Vincular dispositivo de escritorio   // linha 138
        </h3>
        ...
      </div>
      <div className={styles.formRow}>
        ...
        <button ...>
          {generating ? "Generando…" : "Generar código"}  // linha 183
        </button>
      </div>
      ...
    </div>
  );
```

### Por que esse bloco ainda entra no fluxo
- No **código actual em disco**: esse return só é executado quando **`deviceType !== "TPV"`** (o estado inicial é `"TPV"`, e há um early return para TPV nas linhas 90–131). Ou seja, com o código novo, em primeira montagem **não** se entra neste return.
- Se na UI observada esse formulário aparece **com** deviceType = TPV (ou sem selector visível), então o **runtime está a executar uma versão antiga** de `DesktopPairingSection.tsx` **sem** o bloco `if (deviceType === "TPV") { return (...); }` (linhas 90–131). Nessa versão antiga o fluxo cai sempre no return das linhas 134–218.

### Condição que faz o bloco antigo aparecer
- **No código em disco:** `deviceType !== "TPV"` (ex. utilizador escolheu KDS no select).
- **Quando a UI “antiga” aparece com TPV / sem escolher KDS:** o código em execução não tem o early return para TPV; portanto a condição efectiva é “sempre” (o segundo return é o único path de render do pairing).

### Causa raiz única
- O JavaScript que o browser está a executar para `DesktopPairingSection` é uma **versão antiga do ficheiro** (sem o early return para TPV). O ficheiro em disco já tem o novo comportamento; o runtime não está a usar essa versão.

### Patch mínimo (para ver o novo layout)
- Forçar o runtime a carregar o módulo actual: reiniciar o servidor de desenvolvimento (processo que serve a 5175) e fazer hard refresh na página (Cmd+Shift+R). Não é necessário alterar código para “corrigir” a lógica; a lógica em disco já está correcta.

---

## 3. Rota: `/admin/devices/tpv`

### Componente esperado
- **Ficheiro:** `merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx`
- **Função:** `AdminTPVTerminalsPage`

### DOM esperado (código actual em disco)
- Raiz: `<div ... data-chefiapp-tpv-mother="true" data-runtime-page="AdminTPVTerminalsPage">` (linha 125).
- Badge: texto **“TPV_RUNTIME_V2”** (linha 126).
- Título: **“TPV — Tela oficial”** (linha 128).
- Subtítulo: “Única superfície de operação TPV: descarregar instalador…”
- Parágrafo com **`[FLUXO_TPV_MÃE_V2]`** e texto do fluxo em 5 passos (linhas 131–134).
- Secção “Instalar o TPV no seu computador” com **DesktopDownloadSection** (grid de download).
- Secção “Vincular um TPV a este restaurante” com botão **“Gerar código”** (linha 173).

### DOM observado (a preencher)
- Se a UI for a nova: existem `data-chefiapp-tpv-mother="true"`, `data-runtime-page="AdminTPVTerminalsPage"`, texto “TPV_RUNTIME_V2”, título “TPV — Tela oficial” e “[FLUXO_TPV_MÃE_V2]”.
- Se a UI for a antiga: título antigo (ex. “TPVs do restaurante”), sem estes data-attributes e sem o badge/fluxo.

### Componente real que desenha
- **AdminTPVTerminalsPage** (mesmo ficheiro). A secção de download (grid) vem de **DesktopDownloadSection**; o formulário de pairing e “Gerar código” estão no próprio AdminTPVTerminalsPage (linhas 148–210).

### Causa raiz (se ainda antiga)
- O bundle em execução é uma versão antiga de `AdminTPVTerminalsPage.tsx` (sem os novos data-attributes, sem “TPV — Tela oficial”, sem “[FLUXO_TPV_MÃE_V2]”).

### Patch mínimo
- Mesmo que acima: garantir que o runtime carrega o módulo actual (reinício do dev server + hard refresh).

---

## Resumo: componente que ainda desenha o layout antigo em /admin/devices

| Pergunta | Resposta |
|----------|----------|
| Qual ficheiro? | `merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx` |
| Em que linha? | **134–218** (o segundo `return`, que contém o formulário com “Vincular dispositivo de escritorio” e “Generar código”). |
| Por que ainda entra no fluxo? | Porque o código **em execução** no browser não tem o early return para `deviceType === "TPV"` (linhas 90–131). Na versão antiga não há esse `if`, logo o componente renderiza sempre o formulário completo. |
| Que condição faz o bloco aparecer? | Na versão antiga: **sempre**. No código actual em disco: só quando `deviceType !== "TPV"` (ex. KDS). |

---

## Evidência para confirmar que o código novo está a correr

Após reiniciar o dev server e hard refresh, verificar no DOM (DevTools):

1. **`/admin/modules`:** existe um nó com `data-runtime-page="ModulesPage"` e texto “MODULES_RUNTIME_V2”.
2. **`/admin/devices`:** existe um nó com `data-block="pairing-tpv-redirect-v2"` e texto “[PAIRING_TPV_REDIRECT_V2]”; **não** deve existir botão “Generar código” na secção de pairing quando o tipo é TPV.
3. **`/admin/devices/tpv`:** existe um nó com `data-chefiapp-tpv-mother="true"` e `data-runtime-page="AdminTPVTerminalsPage"`, e texto “TPV_RUNTIME_V2” e “[FLUXO_TPV_MÃE_V2]”.

Se estes selectores e textos aparecerem, o runtime está a usar o código actual em disco. Se não aparecerem, o browser continua a executar um bundle antigo (e a conclusão não é “cache” genérica, mas “o módulo lazy carregado é uma versão antiga do ficheiro”).

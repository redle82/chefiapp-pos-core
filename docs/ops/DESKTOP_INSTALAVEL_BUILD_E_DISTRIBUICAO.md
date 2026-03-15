# Desktop app — Gerar instalável e habilitar o handler `chefiapp-pos://`

**Objetivo:** Documentar o caminho real para gerar o artefacto instalável do ChefIApp Desktop (TPV/KDS) e deixar explícito que a **instalação** desse artefacto é o requisito para o botão **«Abrir app TPV»** no Admin funcionar (handler `chefiapp-pos://` registado no SO).

**Referências:** [DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md](./DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md) §1.1, [DESKTOP_INSTALL_PROTOCOL_MACOS.md](./DESKTOP_INSTALL_PROTOCOL_MACOS.md), [desktop-app/README.md](../desktop-app/README.md).

---

## 1. Caminho real para gerar o instalável

O fluxo está centralizado no script **`desktop-app/scripts/build-electron.mjs`**, invocado a partir da raiz do repositório:

```bash
pnpm run build:desktop
```

(Equivalente a `cd desktop-app && node scripts/build-electron.mjs`.)

### Passos executados pelo script

1. **Build do merchant-portal** com target Electron (`VITE_BUILD_TARGET=electron`) → `merchant-portal/dist/`.
2. **Cópia** de `merchant-portal/dist/` para `desktop-app/resources/frontend/`.
3. **Cópia de dependências** de produção para `desktop-app/node_modules/` (copy-deps; necessário para tsc e electron-builder).
4. **Compilação** do processo Electron (TypeScript) → `desktop-app/dist-electron/`.
5. **Empacotamento** com electron-builder: `pnpm run dist:mac` (ou `dist:win` com `--win`) no diretório `desktop-app/`.

### Comandos por plataforma

| Plataforma | Comando (na raiz do repo) | Comando (dentro de desktop-app) |
|------------|---------------------------|----------------------------------|
| **macOS** (DMG + ZIP) | `pnpm run build:desktop` | `node scripts/build-electron.mjs` |
| **Windows** (NSIS)    | `pnpm run build:desktop` não suporta --win na raiz; usar abaixo | `node scripts/build-electron.mjs --win` |

---

## 2. Onde ficam os artefactos (build concluído)

- **Configuração:** `desktop-app/electron-builder.yml` (output: `out`).
- **Saída:** `desktop-app/out/`.
- **Estado:** O build do desktop app está **concluído com sucesso**; os artefactos são gerados por `pnpm run build:desktop` na raiz.

### Ficheiro a instalar por arquitetura (macOS, versão 0.1.0)

| Arquitetura | Ficheiro a instalar |
|-------------|---------------------|
| **Apple Silicon (arm64)** | `desktop-app/out/ChefIApp Desktop-0.1.0-arm64.dmg` |
| **Intel (x64)** | `desktop-app/out/ChefIApp Desktop-0.1.0.dmg` |

Na mesma pasta existem ZIPs equivalentes; para registrar o handler `chefiapp-pos://` basta instalar o **.dmg** correspondente à máquina.

- **Windows:** `desktop-app/out/ChefIApp Desktop Setup <versão>.exe` (gerado com `node scripts/build-electron.mjs --win`). A versão vem de `desktop-app/package.json` (`version`).

---

## 3. Como instalar

### macOS

1. Abrir `desktop-app/out/` e dar duplo clique no `.dmg`.
2. Arrastar **ChefIApp Desktop.app** para **Applications**.
3. Abrir o app uma vez pelo Finder (Applications) e aceitar os avisos de segurança do macOS, se aparecerem.

Após a instalação, o macOS regista o handler para `chefiapp-pos://`; o botão **«Abrir app TPV»** em `/admin/devices/tpv` passa a abrir o app no ecrã de setup/pareamento.

### Windows

1. Executar o instalador `.exe` em `desktop-app/out/`.
2. Seguir o assistente (oneClick: instalação sem escolha de pasta por defeito).
3. Abrir o app uma vez para completar o registo do protocolo no SO.

---

## 4. Requisito para o botão «Abrir app TPV» funcionar

O botão **«Abrir app TPV»** no Admin (`/admin/devices/tpv`) abre a URL **`chefiapp-pos://setup`**. O sistema operativo só consegue abrir essa URL se existir um **handler registado** para o esquema `chefiapp-pos://`.

- Esse handler é registado **apenas** quando o **app empacotado** (ChefIApp Desktop) está **instalado** (ex.: .dmg no macOS, .exe no Windows).
- Em **dev**, mesmo com `pnpm run dev:desktop` a correr, o Electron **não** regista o protocolo; o botão continua a falhar com "the scheme does not have a registered handler" até haver uma instalação do artefacto gerado por este fluxo.

**Resumo:** Gerar o instalável (§1) → instalar no SO (§3) → o botão «Abrir app TPV» passa a funcionar no fluxo oficial.

---

## 5. Pré-requisitos do ambiente de build

- **Node.js** 20+ e **pnpm** 9+.
- **desktop-app** faz parte do workspace (pnpm-workspace.yaml e package.json). Na raiz: `pnpm install` (ou `pnpm install --no-frozen-lockfile` se o lockfile estiver desatualizado).
- **merchant-portal** a compilar com sucesso (incluído no mesmo `pnpm install`).
- Em `desktop-app/package.json`: **electron-builder** como devDependency e scripts `dist:mac` / `dist:win` (usam `npx electron-builder` para resolução no workspace).

---

## 6. Publicação / release (opcional)

Para disponibilizar o instalável aos utilizadores (ex.: downloads no Admin), é necessário:

- Publicar uma **release** (ex.: GitHub Releases) que inclua os artefactos (`.dmg`, `.exe`) gerados em `desktop-app/out/`.
- Configurar no **merchant-portal** as variáveis de ambiente referidas na UI em `/admin/devices/tpv` (secção "Release não publicada"):
  - `VITE_DESKTOP_DOWNLOAD_BASE` (URL base, ex.: GitHub Releases)
  - `VITE_DESKTOP_DOWNLOAD_MAC_FILE` (ex.: nome do .dmg)
  - `VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE` (ex.: nome do .exe)

Enquanto essas variáveis não estiverem configuradas, a UI mostra "Release não publicada"; o instalável pode ainda ser distribuído manualmente (ex.: enviar o ficheiro de `desktop-app/out/`) e instalado localmente para habilitar o handler `chefiapp-pos://`.

---

## 7. Estado da execução (validação do fluxo)

- **Build concluído com sucesso** (fluxo validado): `pnpm run build:desktop` na raiz gera os artefactos em `desktop-app/out/`.
- **Artefactos macOS (versão 0.1.0):**
  - **Apple Silicon:** `desktop-app/out/ChefIApp Desktop-0.1.0-arm64.dmg`
  - **Intel x64:** `desktop-app/out/ChefIApp Desktop-0.1.0.dmg`
  - ZIPs equivalentes na mesma pasta.
- **Frontend bundle no app empacotado:** O Electron usa `extraResources` (electron-builder) para copiar `resources/frontend` para `Contents/Resources/frontend`. O main process foi ajustado para resolver o path em runtime com `process.resourcesPath + "frontend/index.html"` quando `app.isPackaged`, em vez de `app.getAppPath() + "resources/frontend/index.html"`, de modo a apontar para o frontend desempacotado e evitar o erro "Frontend bundle missing in packaged app".
- **Validação da estrutura do pacote:** Em `out/mac-arm64/ChefIApp Desktop.app/Contents/Resources/` existe a pasta `frontend/` com `index.html`; o main process usa `process.resourcesPath + "frontend/index.html"` em runtime, alinhado com o extraResources do electron-builder.
- **Único passo restante para o handler `chefiapp-pos://` funcional:** instalação no SO e validação operacional conforme §8.

---

## 8. Checkpoint de validação operacional — handler `chefiapp-pos://`

Checklist objetivo para fechar a validação do handler no fluxo oficial:

| # | Passo | Como validar |
|---|--------|---------------|
| 1 | Instalar o `.dmg` correto | **Apple Silicon:** abrir `desktop-app/out/ChefIApp Desktop-0.1.0-arm64.dmg`. **Intel x64:** abrir `desktop-app/out/ChefIApp Desktop-0.1.0.dmg`. |
| 2 | Mover o app para Applications | Na janela do .dmg, arrastar **ChefIApp Desktop.app** para a pasta **Applications**. |
| 3 | Abrir o app uma vez | Pelo Finder, abrir **Applications → ChefIApp Desktop.app**. Aceitar avisos de segurança do macOS se aparecerem. Fechar o app após a primeira abertura (opcional). |
| 4 | Ir ao Admin em `/admin/devices/tpv` | No browser, com o merchant-portal a correr (ex.: `http://localhost:5175`), navegar para **Admin → Dispositivos → TPVs** (`/admin/devices/tpv`). |
| 5 | Clicar em «Abrir app TPV» | Na página, clicar no botão **«Abrir app TPV»**. |
| 6 | Confirmar que `chefiapp-pos://setup` abre o ChefIApp Desktop | O SO deve abrir o **ChefIApp Desktop** (não o browser nem outra app) no ecrã de setup/pareamento. **Critério de sucesso:** o ChefIApp Desktop aparece em primeiro plano com o ecrã de setup; não aparece erro "the scheme does not have a registered handler". |

**Registo:** Quando todos os passos 1–6 estiverem concluídos, o handler `chefiapp-pos://` está validado no fluxo oficial para o macOS. No Windows, o equivalente é instalar o `.exe` gerado por `node scripts/build-electron.mjs --win` e repetir os passos 3–6.

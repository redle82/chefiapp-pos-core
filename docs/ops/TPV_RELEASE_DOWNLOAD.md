# Release e download do TPV (desktop)

Os botões de download na tela **Admin → TPV** (`/admin/devices/tpv`) só aparecem quando existe uma **release publicada** e o merchant-portal está configurado com as variáveis corretas.

## Para o utilizador final poder instalar

O **utilizador final** (ex.: dono do restaurante) só consegue instalar o TPV se:

1. **Existir uma release publicada** — os ficheiros `.dmg` (macOS) e `.exe` (Windows) estão num URL público (GitHub Releases, CDN, etc.).
2. **O merchant-portal em produção** tiver as variáveis `VITE_DESKTOP_DOWNLOAD_*` definidas no ambiente de build e tiver sido feito deploy com elas.
3. **Auth real em produção** — o portal não pode depender de "mock auth" (DEV only); o utilizador final entra com login real (Supabase/Keycloak/etc.).

**Checklist para quem faz o deploy (uma vez por release):**

| Quem | O quê |
|------|--------|
| Dev/DevOps | Construir o desktop-app (`pnpm run dist:mac` / `dist:win` em `desktop-app/`). |
| Dev/DevOps | Publicar os ficheiros num URL estável (ex.: criar uma GitHub Release e anexar o .dmg e .exe). |
| Dev/DevOps | No ambiente de **produção** do merchant-portal (Vercel, Render, etc.), definir: `VITE_DESKTOP_DOWNLOAD_BASE`, `VITE_DESKTOP_DOWNLOAD_MAC_FILE`, `VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE` (e opcionalmente `VITE_DESKTOP_RELEASE_VERSION`). |
| Dev/DevOps | Fazer um novo build e deploy do merchant-portal para que as variáveis entrem no bundle. |
| Utilizador final | Entrar no portal (produção), ir a Admin → TPV, ver os botões de download, descarregar o instalador e instalar no Mac/PC. |

Enquanto estes passos não forem feitos, o utilizador final continua a ver "Pacote em preparação" e não tem como instalar. A tela está pronta; falta a release e a configuração em produção.

---

## Por que não há download?

- **Não existe “release” em lado nenhum por defeito.** A release é o resultado de construir o app desktop (Electron) e publicar os ficheiros `.dmg` (macOS) e `.exe` (Windows) num URL acessível.
- O portal só mostra os botões quando:
  1. Os ficheiros estão publicados num URL (ex.: GitHub Releases, CDN).
  2. As variáveis de ambiente do **merchant-portal** estão definidas (e o portal foi reconstruído).

## Passos para activar o download

### 1. Construir o app desktop

No projeto:

```bash
cd desktop-app
pnpm install
pnpm run dist:mac    # gera .dmg (macOS)
pnpm run dist:win     # gera .exe (Windows)
```

Os artefactos ficam em `desktop-app/dist/` (ou no sítio que o electron-builder configurar).

### 2. Publicar os ficheiros

- **GitHub Releases:** cria uma release, anexa o `.dmg` e o `.exe`. O URL base será algo como  
  `https://github.com/<org>/<repo>/releases/download/v1.0.0/`
- **Outro servidor:** coloca os ficheiros num servidor e usa o URL base onde estão (ex.: `https://downloads.chefiapp.com/tpv/v1.0.0/`).

### 3. Configurar o merchant-portal

No **merchant-portal** (ficheiro `.env`, `.env.local` ou variáveis do deploy), define:

```env
# URL base onde estão os ficheiros (sem barra final)
VITE_DESKTOP_DOWNLOAD_BASE=https://github.com/TEU_ORG/chefiapp-pos-core/releases/download/v1.0.0

# Nomes exactos dos ficheiros (como foram publicados)
VITE_DESKTOP_DOWNLOAD_MAC_FILE=ChefIApp-Desktop-1.0.0.dmg
VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=ChefIApp-Desktop-Setup-1.0.0.exe

# Opcional: versão mostrada na UI
VITE_DESKTOP_RELEASE_VERSION=1.0.0
```

Os nomes dos ficheiros devem coincidir com os que o electron-builder gera (ver `desktop-app/package.json` e configuração do electron-builder).

### 4. Reconstruir o portal

As variáveis `VITE_*` são embutidas em **build time**. Por isso:

- **Desenvolvimento:** reinicia o dev server (`pnpm run dev` no merchant-portal) após alterar `.env` ou `.env.local`.
- **Produção:** faz um novo build e deploy do merchant-portal com as variáveis definidas no ambiente de deploy.

Depois disso, na tela **Admin → TPV** os botões de download passam a aparecer e a apontar para os ficheiros publicados.

## Testar em local (sem publicar na internet)

Para ver os botões de download no browser sem publicar uma release:

1. **Construir o instalador** (uma vez):
   ```bash
   cd desktop-app
   pnpm install
   pnpm run dist:mac    # gera .dmg em desktop-app/out/
   ```

2. **Servir a pasta `out` noutro porto** (ex.: 9090). Noutro terminal:
   ```bash
   cd desktop-app/out
   python3 -m http.server 9090
   ```
   Ou, na raiz do repo: `bash scripts/serve-tpv-downloads.sh`

3. **Ver o nome exacto do ficheiro** em `desktop-app/out/` (ex.: `ChefIApp Desktop-0.1.0-arm64.dmg`).

4. **No merchant-portal**, criar ou editar `.env.local` e acrescentar:
   ```env
   VITE_DESKTOP_DOWNLOAD_BASE=http://localhost:9090
   VITE_DESKTOP_DOWNLOAD_MAC_FILE=ChefIApp Desktop-0.1.0-arm64.dmg
   VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=ChefIApp-Desktop-Setup.exe
   VITE_DESKTOP_RELEASE_VERSION=0.1.0
   ```
   (Ajusta o nome do ficheiro ao que está em `desktop-app/out/`.)

5. **Reiniciar o dev server** do merchant-portal (Ctrl+C e de novo `pnpm run dev`). Abre `http://localhost:5175/admin/devices/tpv` — os botões de download devem aparecer e apontar para `http://localhost:9090/...`.

O portal só mostra os botões quando o URL base é **outro origem** que a página (por isso 9090 e não 5175).

---

## Resumo

| Situação | O que fazer |
|----------|-------------|
| “Pacote em preparação” / sem botões | Ainda não há release OU variáveis não configuradas. Segue os passos acima. |
| Testar em local sem publicar | Constrói com `dist:mac` / `dist:win`, serve `desktop-app/out` em outro porto (ex. 9090), define as variáveis em `.env.local` e reinicia o portal. |
| Produção | Publica numa URL estável (ex.: GitHub Releases), configura as três variáveis no deploy do portal e faz novo build. |

A “release” é, portanto, **os ficheiros construídos + o URL onde estão + a configuração no portal**.

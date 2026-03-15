# Plano de execução — TPV disponível para o utilizador final

Para o utilizador final poder instalar o TPV a partir do Admin, executar os passos abaixo **por ordem**. Quando todos estiverem feitos, a tela Admin → TPV mostrará os botões de download e o fluxo ficará operacional.

---

## Fase 1: Build do instalador (uma vez por release)

| # | Acção | Comando / Onde | Responsável |
|---|--------|----------------|-------------|
| 1.1 | Build do merchant-portal (para dentro do Electron) | Na raiz: `pnpm run build` em merchant-portal com `VITE_BUILD_TARGET=electron`, ou usar o script do desktop-app | Dev |
| 1.2 | Build do app desktop (DMG + EXE) | `cd desktop-app && node scripts/build-electron.mjs` (Mac). Para Windows: `node scripts/build-electron.mjs --win` (em máquina Windows ou CI) | Dev / CI |
| 1.3 | Verificar artefactos | Ficheiros em `desktop-app/out/` (ex.: `ChefIApp Desktop-0.1.0-arm64.dmg`, `*.exe`) | Dev |

**Atalho local (Mac):** na raiz do repo, `pnpm run prepare-tpv-release` (ou `bash scripts/prepare-tpv-release.sh`) — faz o build e indica os ficheiros gerados e os próximos passos. Para Windows: `bash scripts/prepare-tpv-release.sh --win`.

---

## Fase 2: Publicar a release

| # | Acção | Comando / Onde | Responsável |
|---|--------|----------------|-------------|
| 2.1 | Criar tag de versão | `git tag v1.0.0` (exemplo); versão alinhada a `desktop-app/package.json` | Dev |
| 2.2 | Criar GitHub Release | GitHub → Repo → Releases → Draft a new release → escolher a tag (ex. `v1.0.0`) | Dev |
| 2.3 | Anexar ficheiros | Upload do `.dmg` e do `.exe` de `desktop-app/out/` para a release | Dev |
| 2.4 | Anotar URL base | URL base = `https://github.com/<org>/<repo>/releases/download/v1.0.0` (sem barra final) | Dev |

---

## Fase 3: Configurar o portal em produção

| # | Acção | Comando / Onde | Responsável |
|---|--------|----------------|-------------|
| 3.1 | Definir variáveis no deploy | No Vercel (ou outro): adicionar env vars de **produção** (ver `merchant-portal/.env.production.example` secção TPV) | DevOps / Dev |
| 3.2 | Variáveis obrigatórias | `VITE_DESKTOP_DOWNLOAD_BASE`, `VITE_DESKTOP_DOWNLOAD_MAC_FILE`, `VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE` | DevOps / Dev |
| 3.3 | Opcional | `VITE_DESKTOP_RELEASE_VERSION` (ex.: `1.0.0`) para mostrar na UI | DevOps / Dev |
| 3.4 | Novo deploy | Build e deploy do merchant-portal para que as variáveis entrem no bundle | DevOps / CI |

**Exemplo (Vercel):**
```bash
vercel env add VITE_DESKTOP_DOWNLOAD_BASE production
# valor: https://github.com/TEU_ORG/chefiapp-pos-core/releases/download/v1.0.0

vercel env add VITE_DESKTOP_DOWNLOAD_MAC_FILE production
# valor: ChefIApp Desktop-0.1.0-arm64.dmg  (ou o nome exacto do ficheiro)

vercel env add VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE production
# valor: ChefIApp Desktop Setup 0.1.0.exe   (ou o nome exacto)

vercel env add VITE_DESKTOP_RELEASE_VERSION production
# valor: 1.0.0
```
Depois: trigger um novo deploy (redeploy do último commit ou push).

---

## Fase 4: Verificação

| # | Acção | Como | Responsável |
|---|--------|-----|-------------|
| 4.1 | Login no portal (produção) | Auth real (não mock) | Utilizador final / QA |
| 4.2 | Abrir Admin → TPV | Navegar para a tela oficial do TPV | QA |
| 4.3 | Confirmar botões de download | Devem aparecer "Descarregar para macOS" e "Descarregar para Windows" (ou equivalente) | QA |
| 4.4 | Testar download | Clicar e verificar que o ficheiro descarrega a partir do URL da release | QA |
| 4.5 | Testar instalação e vinculação | Instalar no Mac/PC, abrir app, gerar código no Admin, colar no app e vincular | QA |

---

## Resumo de dependências

- **Utilizador final vê "Pacote em preparação"** → Fases 1–3 não concluídas (falta build, release ou variáveis em produção).
- **Botões aparecem mas download falha** → URL base ou nomes de ficheiro incorrectos (revisar Fase 2 e 3).
- **Auth "Mock auth (DEV only)"** → Em produção usar auth real (Supabase/Keycloak); mock é bloqueado em production builds.

Referência técnica: `docs/ops/TPV_RELEASE_DOWNLOAD.md`.

# AGENTS

## Dev environment tips

- Use `pnpm dlx turbo run where <project_name>` to jump to a package.
- Use `pnpm install --filter <project_name>` to add a package to the workspace.
- Use `pnpm create vite@latest <project_name> -- --template react-ts` to spin up a new React + Vite package with TypeScript checks ready.
- Check the `name` field inside each package's `package.json` to confirm the right name.
- For workspace scripts, prefer `pnpm -w <workspace> <script>` (ex.: `pnpm -w merchant-portal run dev`).

## Local core stack

- Use `docker-core/docker-compose.core.yml` as the canonical local Core stack.
- Avoid mixing `docker-compose.yml` and `docker-core/docker-compose.core.yml` at the same time.
- Health check: `http://localhost:3001/rest/v1/` should return 200.
- Quick Core check: `bash scripts/core/health-check-core.sh`.

## Frontend dev server

- Start via `pnpm -w merchant-portal run dev`.
- Default port is `5175` unless `PORT` is set.
- **Port 5175 already in use:** outro processo (ex. Vite) já está a usar a porta. Para libertar: `lsof -ti:5175 | xargs kill -9`. Ou usa o servidor que já está a correr.

## AppStaff (web = o que está em uso)

- **AppStaff que o utilizador vê e usa** é o que está em **http://localhost:5175/app/staff/home** (merchant-portal). Ao pedir "AppStaff", "abrir AppStaff" ou "ver AppStaff" (nomeadamente no browser), abrir esta URL. Não confundir com um "app antigo" — este é o AppStaff em uso.
- Para ter o servidor ativo: `pnpm --filter merchant-portal run dev` (porta 5175). Depois abrir `/app/staff/home`.
- Existe também o projeto **`mobile-app`** (Expo) para iOS/Android: `pnpm run expo:go` ou `cd mobile-app && npx expo start` → QR → Expo Go. É outro terminal (native); o que está em `/app/staff/home` é o AppStaff web.
- QR para abrir o AppStaff web no telemóvel (PWA): `pnpm run qr:appstaff-ios` → gera QR que abre o mesmo conteúdo de `/app/staff/home`.
- QR para Expo Go (abrir o app nativo no iPhone): `pnpm run qr:expo-go` (na raiz) ou, a partir de `mobile-app`, `pnpm run qr:expo-go` (delega para a raiz).

## Critical flow validation

- Run the end-to-end order flow: `bash scripts/flows/run-critical-flow.sh`.
- Validate onboarding data: `bash scripts/flows/validate-onboarding-data.sh`.

## Testing instructions

- Find the CI plan in `.github/workflows`.
- Run `pnpm turbo run test --filter <project_name>` to run every check defined for that package.
- From the package root you can call `pnpm test`.
- To focus on one step, add the Vitest pattern: `pnpm vitest run -t "<test name>"`.
- Fix any test or type errors until the whole suite is green.
- After moving files or changing imports, run `pnpm lint --filter <project_name>`.
- Add or update tests for the code you change, even if nobody asked.

## Operational UX hardening

- Run UI guardrails: `npm run check:ui-guardrails`.

## PR instructions

- Title format: `[<project_name>] <Title>`
- Always run `pnpm lint` and `pnpm test` before committing.

## Release readiness

- **Gate recomendado (portal estável):** `npm run audit:release:portal` — web-e2e + typecheck + testes merchant-portal (Vitest) + leis. Passa sem DB/Jest raiz.
- **Auditoria completa:** `npm run audit:release` — inclui Jest na raiz; pode falhar por testes de integração/DB. Ver `docs/audit/RELEASE_AUDIT_STATUS.md`.

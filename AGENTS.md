# AGENTS

## Dev environment tips

- Use `pnpm dlx turbo run where <project_name>` to jump to a package.
- Use `pnpm install --filter <project_name>` to add a package to the workspace.
- Use `pnpm create vite@latest <project_name> -- --template react-ts` to spin up a new React + Vite package with TypeScript checks ready.
- Check the `name` field inside each package's `package.json` to confirm the right name.
- For workspace scripts, prefer `pnpm -w <workspace> <script>` (ex.: `pnpm -w merchant-portal run dev`).

## Operational flow policy (mandatory)

- Follow `docs/ops/WORKFLOW_OPERATIONAL_ORDER.md` before opening or continuing any implementation front.
- Hard rule: do not start a new front until the current one is operationally closed (PR/CI/branch/worktree/issue/local-cleanup).

## Work preservation (mandatory)

- **Before ANY git operation that changes HEAD** (`checkout`, `switch`, `reset`, `merge`, `rebase`, `stash`), run `pnpm save` first.
- Quick save: `pnpm save` — commits all local changes as WIP with timestamp.
- Quick save with note: `pnpm save "sidebar accordion fix"` — WIP with description.
- Undo last WIP: `pnpm unsave` — soft-resets last WIP commit, keeps changes staged.
- Safe branch switch: `pnpm switch <branch>` — auto-saves before switching.
- **Never use `git checkout`/`git switch` directly** — always use `pnpm switch` to prevent work loss.
- **Never use `git reset --hard`** without confirming with the user first.

## Local core stack

- Use `docker-core/docker-compose.core.yml` as the canonical local Core stack.
- Avoid mixing `docker-compose.yml` and `docker-core/docker-compose.core.yml` at the same time.
- Health check: `http://localhost:3001/rest/v1/` should return 200.
- Quick Core check: `bash scripts/core/health-check-core.sh`.
- **404 em Admin > TPVs > «Gerar código» (create_device_pairing_code):** o PostgREST não tem a função no schema. Aplicar migrações e reiniciar PostgREST: `bash scripts/core/apply-device-pairing-migrations.sh` (ou `cd docker-core && make migrate-device-and-reload`). Verificar: `bash scripts/core/diagnose-postgrest-schema.sh`.

## Billing / Checkout (local)

- Para "Cambiar plan" na página de suscripción usar Stripe, o **integration-gateway** tem de estar em execução na porta **4320**.
- Noutro terminal: `pnpm run dev:gateway` (na raiz; usa `scripts/start-gateway-billing.sh`). Com Stripe: `STRIPE_SECRET_KEY=sk_test_... pnpm run dev:gateway`.
- Frontend: copiar `merchant-portal/.env.local.example` para `.env.local` — já inclui `VITE_API_BASE=http://localhost:4320` e `VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-dev`. Se o gateway não estiver a correr, a UI mostra mensagem a indicar que se execute o gateway.

## Frontend dev server

- Start via `pnpm -w merchant-portal run dev`.
- Default port is `5175` unless `PORT` is set.
- **Port 5175 already in use:** outro processo (ex. Vite) já está a usar a porta. Para libertar: `lsof -ti:5175 | xargs kill -9`. Ou usa o servidor que já está a correr.
- **GET /admin/devices 500, GET /admin/devices/tpv 500 e GET /@vite/client 404:** acontecem quando a app **não** está a ser servida pelo Vite (ex.: outro processo na 5175, ou `serve dist`). Solução: garantir que só corre o dev do Vite na 5175 — `cd merchant-portal && pnpm run dev` ou `pnpm --filter merchant-portal run dev`; libertar a porta com `pnpm -w run kill:5175` (ou `lsof -ti:5175 | xargs kill -9`) se necessário. O Vite faz SPA fallback (todas as rotas → index.html) e serve `/@vite/client` em dev.
- **GET /favicon.ico 404:** inofensivo; o `index.html` já define `<link rel="icon" href="data:image/svg+xml,...">`. Para eliminar o 404, podes colocar um ficheiro `merchant-portal/public/favicon.ico`.
- **Vite: "Cannot find module '.../vite/dist/node/chunks/dist.js'":** erro de resolução interna do Vite 7 com pnpm. O projeto usa **Vite 6** (override na raiz). **Solução (na raiz):** `pnpm run fix:portal-dev` e depois `pnpm --filter merchant-portal run dev`. Se o erro continuar: `DEEP=1 pnpm run fix:portal-dev` (remove node_modules e reinstala). Em último caso: `pnpm store prune` e de novo `pnpm install`.
- **Console: "TypeError: Cannot read properties of undefined (reading 'payload')" em giveFreely.tsx:** normalmente vem de **extensão do browser** (ex.: GiveFreely) ou script externo, não do merchant-portal. Podes ignorar ou desativar a extensão ao desenvolver.

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
- **Jest na raiz (`npm test`):** Testes em `tests/archive/` não são executados (referência histórica). Os testes de integração `tenant_isolation`, `server_side_idempotency`, `rate_limiting` e `orderLifecycle` usam Vitest e dependem de DB/Core — estão excluídos do Jest; executar com Vitest quando o Core estiver disponível. Os testes `plpgsql-core-rpcs` e `load-test-orders` requerem Core/Postgres e também estão excluídos do `npm test`. Ver `docs/audit/PLANO_CORRECAO_TESTES_JEST.md`.
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

- **Gate recomendado (portal estável):** `npm run audit:release:portal` — web-e2e + typecheck + testes merchant-portal (Vitest) + server coverage (target **80%** branches no portal gate; 84% quando corre `check:server-coverage` sozinho) + leis. Passa sem DB/Jest raiz. Ver `docs/audit/RELEASE_AUDIT_STATUS.md`.
- **Auditoria completa:** `npm run audit:release` — inclui Jest na raiz; pode falhar por testes de integração/DB. Ver `docs/audit/RELEASE_AUDIT_STATUS.md`.
- **Gates (F5.2):** **Required before merge:** CI job `validate` inclui `audit:fase3-conformance` (identidade/pairing desktop + portal + mobile); opcionalmente `audit:billing-core` se secret `CORE_BILLING_AUDIT_DATABASE_URL` definido. **Required before deploy:** `npm run audit:release:portal` ou `bash scripts/deploy/pre-flight-check.sh`. **Recommended manual:** `audit:billing-core` local quando não há secret no CI. Tabela e definição explícita: `docs/ops/C44_RELEASE_GATES_AND_ROLLOUT.md` §2 e §6.
- **Customer-portal (F5.1):** **Removido do workspace** — já não consta de `package.json` workspaces; diretório e código ausentes. Decisão e relatório: `docs/roadmap/C42_CUSTOMER_PORTAL_STATE.md` §8; alinhamento: `docs/roadmap/WORKSPACES_ALIGNMENT.md` §7.
- **Mobile-app (C4.1):** Evidence pack Fase 3 em `docs/roadmap/C41_MOBILE_PHASE3_EVIDENCE.md`; classificação **ALIGNED** (teste explícito role-from-backend, recovery/reinstall e fluxo ativação automatizados; probe `audit:fase3-conformance` inclui mobile-app). Ver `docs/roadmap/WORKSPACES_ALIGNMENT.md` §8.
- **Fase 5 (convergência operacional):** `docs/roadmap/FASE_5_CONVERGENCIA_OPERACIONAL.md` — F5.1–F5.4 fechados (F5.4 limpeza executada em F6.2).
- **Fase 6 (estabilidade):** `docs/roadmap/FASE_6_ESTABILIDADE_PROXIMO_CICLO.md` — F6.2 e F6.3 fechados; próximo ciclo = Fase 7.
- **Fase 7 (readiness e escala operacional):** `docs/roadmap/FASE_7_READINESS_ESCALA_OPERACIONAL.md` — **Operacionalmente fechada** (F7.1 e F7.2 fechados). Usar checklist + mapa em toda release. **F7.3 em espera consciente.** Avaliação pós-fecho: `docs/roadmap/AVALIACAO_DRIVERS_POS_FASE7.md` — nenhum driver concreto; não abrir nova fase; critérios para reabrir documentados.

## Production monitoring

- **Rollout plan:** `docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md` — Phased rollout strategy with monitoring checkpoints (T+0h → T+48h).
- **Quick reference:** `docs/ops/ROLLOUT_QUICK_REFERENCE.md` — Emergency checklists, thresholds, rollback commands.
- **Observability:** `docs/ops/OBSERVABILITY_SETUP.md` — Sentry, Logger, ErrorBoundary, analytics setup.
- **Critical thresholds:** Error rate < 1%, LCP < 2.5s, Core RPC > 99%, Browser-block bypasses = 0.
- **C4.4 / F5.2 gates and rollout:** `docs/ops/C44_RELEASE_GATES_AND_ROLLOUT.md` — Required before merge (CI: validate + audit:fase3-conformance + optional audit:billing-core); required before deploy (audit:release:portal); recommended manual (audit:billing-core local). Table §3; definition §2 and §6. See `docs/roadmap/WORKSPACES_ALIGNMENT.md` §6 for health signals per workspace.

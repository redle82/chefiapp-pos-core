# Routes — desfragmentação

Rotas extraídas de `App.tsx` por domínio para reduzir concentração e conflitos.

- **MarketingRoutes** — Rotas públicas/marketing: `/`, `/v2`, `/blog`, `/pricing`, `/auth/*`, `/menu`, `/mentor`, etc. Usado no primeiro `<Routes>` em `App.tsx`.
- **OperationalRoutes** — Rotas operacionais: `public/:slug`, bootstrap, select-tenant, RoleGate (op/, app/staff/, admin/, config/, system-tree, etc.). Usado no segundo `<Routes>` em `AppContentWithBilling`.

Ordem recomendada: desfragmentar primeiro (este passo), refatorar depois.

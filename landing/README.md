# ChefIApp™ Landing

Landing page em Next.js (App Router) com internacionalização (en, pt, es), animações leves (framer-motion) e SEO por idioma. Projeto isolado do merchant-portal e do Docker Core.

## Scripts

- `pnpm dev` — servidor de desenvolvimento (porta 3000)
- `pnpm build` — build de produção
- `pnpm start` — servidor de produção
- `pnpm lint` — ESLint

## Estrutura

- `app/[locale]/` — rotas por idioma (`/en`, `/pt`, `/es`)
- `components/` — Hero, Features, HowItWorks, Proof, FinalCTA, Header, Footer, LanguageSwitcher
- `locales/` — `en.json`, `pt.json`, `es.json`
- `lib/useTranslation.ts` — hook de tradução (locale via `useParams()`)

## Deploy na Vercel

1. No [dashboard da Vercel](https://vercel.com), criar novo projeto apontando para o repositório existente.
2. Em **Root Directory**, selecionar `landing` (não a raiz do monorepo).
3. Build command: `pnpm build` (ou `npm run build`).
4. Output directory: `.next` (default do Next.js).
5. Instalar dependências: na raiz do monorepo usar `pnpm install` com workspace; ou na Vercel definir root em `landing` e comando de install `pnpm install` (com pnpm habilitado no projeto).

**Domínio sugerido:** `chefiapp.com` para a landing; `app.chefiapp.com` para o ambiente operacional (merchant-portal).

## i18n

- Rotas: `/` redireciona para `/en`; páginas em `/en`, `/pt`, `/es`.
- Metadata e `hreflang` são gerados por locale em `app/[locale]/layout.tsx` via `generateMetadata`.

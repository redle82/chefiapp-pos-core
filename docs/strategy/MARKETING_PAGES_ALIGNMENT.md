# Alinhamento das páginas de marketing

Documento de referência que define explicitamente o papel de cada “landing” e página pública no ChefIApp.

---

## 1. Landing pública (aquisição, SEO, ads)

- **Propósito:** Página de entrada para tráfego externo (chefiapp.com, www.chefiapp.com). Focada em aquisição, SEO e campanhas.
- **Quando existir no repositório:** App Next.js em `landing/`. Página principal em `landing/app/page.tsx` (ou equivalente no App Router).
- **Domínio:** www.chefiapp.com (projeto Vercel com Root Directory = `landing`). Ver [DEPLOY_VERCEL_LANDING.md](../DEPLOY_VERCEL_LANDING.md).
- **CTA principal:** Deve apontar para a entrada operacional do app, usando `NEXT_PUBLIC_APP_URL` (ex.: `${NEXT_PUBLIC_APP_URL}/auth/phone`), nunca domínio hardcoded.
- **Âncoras:** Secções na mesma página (ex.: `#como-funciona`) devem existir e estar corretas.
- **Nota:** Se a pasta `landing/` não contiver ainda a app Next.js completa, a landing pública pode estar noutro deploy; o CTA e âncoras devem respeitar o mesmo contrato.

---

## 2. Landing de produto (narrativa de vendas, demo guiada)

- **Propósito:** Narrativa de produto em profundidade: dores, solução, prova, preço, como começar. Não é homepage pública de domínio; é a “landing interna” para vendas e demo.
- **Código:** `merchant-portal/src/pages/LandingV2/LandingV2Page.tsx` e secções em `merchant-portal/src/pages/LandingV2/sections/`.
- **Rotas no merchant-portal:** `/`, `/v2`, `/landing-v2`. Ver [LANDING_CANON.md](LANDING_CANON.md) e [CORE_LANDING_ROUTES_CONTRACT.md](../architecture/CORE_LANDING_ROUTES_CONTRACT.md).
- **URLs em desenvolvimento:** `http://localhost:5175/`, `http://localhost:5175/landing-v2`, `http://localhost:5175/v2`.
- **Não faz:** Papel de homepage pública do domínio principal (isso é a landing pública quando existir). Faz o papel de página de vendas/demo dentro do produto.

---

## 3. PublicWebPage (marketing do restaurante, não do SaaS)

- **Propósito:** Página pública **do restaurante** (menu, presença, pedidos). Marketing do estabelecimento, não do ChefIApp.
- **Código:** `merchant-portal/src/pages/PublicWeb/PublicWebPage.tsx`.
- **Rota:** `/public/:slug` (ex.: `/public/meu-restaurante`).
- **Não faz:** Homepage do produto SaaS nem landing de vendas do ChefIApp. Não deve ser confundida com a landing pública (www) nem com a LandingV2.

---

## Resumo

| Designação           | Onde vive (código)                          | Domínio / rota típica              | Papel                          |
| -------------------- | ------------------------------------------- | ----------------------------------- | ------------------------------ |
| Landing pública      | `landing/app/page.tsx` (quando existir)     | www.chefiapp.com                    | Aquisição, SEO, ads, CTA → app  |
| Landing de produto   | `LandingV2Page` + sections                  | merchant-portal: `/`, `/landing-v2`, `/v2` | Narrativa vendas, demo         |
| PublicWebPage        | `PublicWeb/PublicWebPage.tsx`               | `/public/:slug`                     | Menu/presença do restaurante   |

---

## 4. Fluxo de navegação oficial

- **Landing pública (www.chefiapp.com):** CTA principal → `https://app.chefiapp.com/auth/phone` (ou valor de `NEXT_PUBLIC_APP_URL`). Âncoras na mesma página (ex.: `#como-funciona`) devem existir e apontar para secções reais.
- **Merchant-portal (operadores):** Rota raiz `/` serve a experiência de marketing (LandingV2Page). Rotas estáveis para a narrativa: `/`, `/v2`, `/landing-v2`. Entrada operacional: `/auth/phone`.
- **Sales demo:** Link direto ou botão interno para a LandingV2 (ex.: `https://app.chefiapp.com/landing-v2` ou `https://app.chefiapp.com/`).

Resumo: `www.chefiapp.com` (landing pública) → CTA → `app.chefiapp.com/auth/phone`. Para demo de vendas: link para `LandingV2Page` (/, /landing-v2, /v2).

---

## 5. Alinhamento de copy e termos-chave

- **Promessa central:** A mesma em qualquer página de marketing: "sistema operacional" que une sala, cozinha, bar e equipa numa única verdade operacional. A landing pública deve ser mais curta e focada; a LandingV2 é mais detalhada, sem contradizer o eixo.
- **Termos-chave a manter consistentes (pt):** "sistema operacional", "TPV", "KDS", "tarefas operacionais", "multi-unidade" / "multi-restaurante", "Staff App", "Menu Builder", "vazamentos" (operacionais). Em en/es: equivalentes em `landingV2Copy.ts`.
- **Fonte de verdade da copy (LandingV2):** `merchant-portal/src/pages/LandingV2/i18n/landingV2Copy.ts`. Qualquer nova landing pública (ex.: Next.js em `landing/`) deve alinhar dor, promessa, prova e CTA com estes blocos.

---

## 6. Verificações em ambiente local

- **Subir servidores:** `landing/` em `http://localhost:3000` (quando existir app Next.js em `landing/app`); `merchant-portal` em `http://localhost:5175` (ex.: `pnpm -w merchant-portal run dev`).
- **Testar:** Aceder a `http://localhost:5175/` e a `http://localhost:5175/landing-v2` e confirmar que renderizam a LandingV2Page sem vestígios da landing antiga. Validar idiomas (`?lang=pt|en|es`), CTA (→ `/auth/phone`), âncoras (#plataforma, #para-quem, #preco, #faq). Opcional: verificar que PublicWebPage (`/public/:slug`) não assume o papel de homepage do produto.

---

## 7. Preparar o passo seguinte (limpeza dura opcional)

Após alguns ciclos de uso, rodar uma busca por referências aos componentes LEGACY no merchant-portal (ex.: `Landing/components/`, `ProductFirstLandingPage`). Ficheiros legacy marcados:

- `merchant-portal/src/pages/Landing/ProductFirstLandingPage.tsx` (em uso em `/app/trial-tpv` — manter enquanto a rota existir)
- `merchant-portal/src/pages/Landing/components/Hero.tsx`, `Footer.tsx`, `Testimonial.tsx`, `Demonstration.tsx`, `Problem.tsx`, `TargetAudience.tsx`, `Solution.tsx`

Se não existirem referências ativas além de `/app/trial-tpv` e de testes (ex.: `legal-links.test.tsx` que importa `Footer`), planejar uma segunda PR apenas para remoção definitiva de ficheiros e rotas antigas, mantendo o histórico no git.

---

## Referências

- [LANDING_CANON.md](LANDING_CANON.md) — contrato canónico da landing (LandingV2).
- [CORE_LANDING_ROUTES_CONTRACT.md](../architecture/CORE_LANDING_ROUTES_CONTRACT.md) — rotas e botões.
- [DEPLOY_VERCEL_LANDING.md](../DEPLOY_VERCEL_LANDING.md) — deploy da landing Next.js (www).

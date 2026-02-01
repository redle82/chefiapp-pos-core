# Auditoria — Templates e landing (HTMLrev vs implementado)

**Data:** 2026-01-31
**Objetivo:** Resposta objetiva e auditable à promessa “HTMLrev implementado”.

---

## 1) Lista exata dos templates escolhidos (nome no HTMLrev, URL, stack)

### 1.0 Resposta direta

**Não existe no repositório** uma lista com “nome exato como aparece no HTMLrev” + “URL do item no HTMLrev” + “stack” para nenhum template. Os nomes citados nos contratos (Shadcn Landing Page, Easy Template 5, Astroship, Modernize, MatDash, etc.) **não foram verificados** no catálogo htmlrev.com; podem não coincidir com os títulos ou slugs reais dos produtos no site. **Nenhum template do HTMLrev foi obtido nem integrado.**

| Nome citado nos docs          | Nome exato no HTMLrev | URL direta no HTMLrev  | Stack              | Integrado? |
| ----------------------------- | --------------------- | ---------------------- | ------------------ | ---------- |
| Shadcn Landing Page           | **Não verificado**    | **Não existe no repo** | React + Shadcn     | ❌ Não     |
| Easy Template 5               | **Não verificado**    | **Não existe no repo** | Next.js + Shadcn   | ❌ Não     |
| Astroship                     | **Não verificado**    | **Não existe no repo** | Astro + Tailwind   | ❌ Não     |
| Modernize React MUI Dashboard | **Não verificado**    | **Não existe no repo** | React + MUI        | ❌ Não     |
| MatDash                       | **Não verificado**    | **Não existe no repo** | Next.js + Tailwind | ❌ Não     |

Para auditar “nome exato + URL no HTMLrev” seria necessário consultar o catálogo em [htmlrev.com](https://htmlrev.com/) e preencher esta tabela com os links reais aos produtos.

---

## 1b) Templates citados nos contratos (referência conceptual)

### Detalhe dos nomes citados (sem URL HTMLrev)

Os contratos e docs referem estes **nomes** como opções por camada. **Nenhum foi verificado no site HTMLrev** (nome exato, URL, produto real). Não há links diretos para itens no HTMLrev no repositório.

| Nome citado no doc            | URL no HTMLrev                                                              | Stack citado       | Nota                                               |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------ | -------------------------------------------------- |
| Shadcn Landing Page           | **Não existe link** no repo; nome pode não coincidir com o catálogo HTMLrev | React + Shadcn     | Referência conceptual; não auditado em htmlrev.com |
| Easy Template 5               | **Não existe link** no repo                                                 | Next.js + Shadcn   | Idem                                               |
| Astroship                     | **Não existe link** no repo                                                 | Astro + Tailwind   | Idem                                               |
| Modernize React MUI Dashboard | **Não existe link** no repo                                                 | React + MUI        | Portal; não integrado                              |
| MatDash                       | **Não existe link** no repo                                                 | Next.js + Tailwind | Idem                                               |

**Conclusão 1:** Não há lista exata de templates com “nome como aparece no HTMLrev” e “URL do item no HTMLrev”. O trabalho foi de **referência conceptual** (HTMLrev como catálogo) e **contratos** (escolhas por camada); **nenhum template foi obtido nem integrado a partir de htmlrev.com**.

---

## 2) Template que NÃO veio do HTMLrev (origem real da landing)

### 2.1 Template integrado na rota `/`

| Campo                                     | Valor                                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome do template**                      | Free HTML5 & SASS Landing Template (título no README); no `index.html` do template: “Appy - HTML5 SASS Landing Template”                                                           |
| **Origem**                                | **GitHub** (não HTMLrev)                                                                                                                                                           |
| **URL do repositório**                    | https://github.com/goldmonkey777/html-sass-landing-template                                                                                                                        |
| **Fork de**                               | https://github.com/sanderdebr/html-sass-landing-template                                                                                                                           |
| **Stack**                                 | HTML5 + SASS (CSS compilado); integrado no merchant-portal como React (JSX) + CSS importado                                                                                        |
| **Por que foi usado no lugar do HTMLrev** | O utilizador indicou este repositório e pediu a sua integração. Não foi adquirido nem usado nenhum template do site htmlrev.com; a landing atual é 100% baseada neste repo GitHub. |

**Template atualmente em `/`:** **Responsive Single Page Product Template** (MediaLoot, origem: `~/Downloads/Responsive Single Page Product Template`). O utilizador pediu implementação; ficheiros copiados para `public/landing-product/images/` e `product-landing.css`. Template anterior (Appy / html-sass-landing-template) foi substituído.

**Conclusão 2:** A landing pública em `/` **não** é um template HTMLrev. É o template **Responsive Single Page Product Template** (MediaLoot, Downloads), integrado no merchant-portal.

---

## 3) Ficheiros do merchant-portal alterados para integrar a landing

### 3.1 Alterados / criados (Responsive Single Page Product Template — estado atual)

| Path completo                                           | Tipo                         | Descrição                                                                                                                                                                                                  |
| ------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/pages/Landing/LandingPage.tsx`     | Alterado                     | Conteúdo substituído: estrutura do template Product (header, banner, 2 feature sections, wide-button, footer) com copy ChefIApp e `Link` para `/auth`, `/pricing`, `/features`, `/demo`.                   |
| `merchant-portal/src/pages/Landing/product-landing.css` | Novo                         | CSS do Responsive Single Page Product Template (reset + style) com `url(../images/...)` substituído por `url("/landing-product/images/...")`.                                                              |
| `merchant-portal/public/landing-product/images/`        | Novo (diretório + ficheiros) | Imagens do template: `icn-app-store.png`, `sample-image.png`, `video-placeholder.png`, `social-facebook.png`, `social-twitter.png`, `social-stumbleupon.png`, `social-google.png`, `social-instagram.png`. |
| `merchant-portal/index.html`                            | Alterado                     | Adicionado Oxygen às Google Fonts (Hind, Open Sans, Oxygen).                                                                                                                                               |

**Nota:** O template anterior (Appy / html-sass-landing-template) usava `template-landing.css` e `public/landing/img/`; esses ficheiros continuam no disco mas não são usados pela `LandingPage.tsx` atual (que importa `product-landing.css`).

### 3.2 Não alterados para esta integração

| Path completo                                        | Nota                                                                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/App.tsx`                        | **Não alterado.** A rota `<Route path="/" element={<LandingPage />} />` já existia; apenas se trocou o conteúdo do componente `LandingPage`.                                      |
| `merchant-portal/src/pages/Landing/PricingPage.tsx`  | Não alterado.                                                                                                                                                                     |
| `merchant-portal/src/pages/Landing/FeaturesPage.tsx` | Não alterado.                                                                                                                                                                     |
| `merchant-portal/src/pages/Landing/components/*`     | Componentes da landing antiga (Hero, Problem, Solution, etc.) continuam no disco; não são usados pela nova `LandingPage.tsx` (que renderiza tudo inline com classes do template). |

---

## Resumo para auditoria

- **“HTMLrev implementado”:** **Não.** O que existe é: (1) **referência conceptual** ao HTMLrev nos contratos e em docs (escolhas por camada); (2) **landing real** baseada no **Responsive Single Page Product Template** (MediaLoot, Downloads), não num produto do site htmlrev.com.
- **Template na rota `/`:** Responsive Single Page Product Template (MediaLoot, Downloads), integrado via `LandingPage.tsx` + `product-landing.css` + `public/landing-product/images/`.
- **Lista exata com URLs HTMLrev:** Não existe no projeto; seria necessário verificar no catálogo htmlrev.com os nomes e URLs reais dos produtos (Shadcn Landing, Easy Template 5, Astroship, etc.) se se quiser alinhar contratos ao catálogo.

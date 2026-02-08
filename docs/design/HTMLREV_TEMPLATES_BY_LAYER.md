# Templates HTMLrev por camada — ChefIApp

**Referência:** [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](../architecture/PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) · **Contrato canónico:** [TEMPLATE_SELECTION_CONTRACT.md](../architecture/TEMPLATE_SELECTION_CONTRACT.md)
**Fonte:** [HTMLrev](https://htmlrev.com/) — 2000+ templates (HTML, Bootstrap, Tailwind, React, Next.js, Shadcn, Astro, etc.)

Este documento indica as **melhores opções** por camada, alinhadas ao DNA do produto: o papel da página define o template.

---

## 1. Landing (Marketing / Conversão)

**Contrato:** boot PUBLIC; zero Runtime/Core; estático + CTA.

### ⭐ Escolha principal (prioridade máxima)

| Campo               | Valor                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Nome**            | **Appy**                                                                                                            |
| **Tipo**            | App / SaaS Landing                                                                                                  |
| **Stack**           | HTML5 + SASS (integrado como React + CSS no merchant-portal)                                                        |
| **Por que é ideal** | Visual de produto real; estrutura perfeita para "antes do login / depois do login"; parece um software operacional. |
| **Status**          | ESCOLHA PRINCIPAL — já integrado na rota `/`.                                                                       |
| **Origem**          | [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (GitHub).                 |

### Outras opções (referência)

| Prioridade | Template                | Stack            | Motivo                                                            |
| ---------- | ----------------------- | ---------------- | ----------------------------------------------------------------- |
| **2ª**     | **Shadcn Landing Page** | React + Shadcn   | Landing de produto digital, dark mode; alinhado ao design system. |
| **3ª**     | **Easy Template 5**     | Next.js + Shadcn | Mesma linha visual, Next.js para estático/SSG.                    |
| **4ª**     | **Astroship**           | Astro + Tailwind | SaaS landing com múltiplas secções; Astro estático.               |

**Alternativas:** Dsign (Next.js marketing agency), Skilline (Tailwind SaaS), AstroWind / Astroplate (Astro startup).

**Onde procurar no HTMLrev:** filtros _Next.js_, _Astro_, _Shadcn_ → secções Landing / Marketing / SaaS.

---

## 2. Auth (Login / Signup / Forgot password)

**Contrato:** boot AUTH; minimal UI; transição marketing → produto.

| Prioridade | Template / bloco                                        | Stack              | Motivo                                                                                   |
| ---------- | ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| **1ª**     | **Blocos de login/signup** em templates Shadcn ou Admin | React + Shadcn     | Formulários mínimos, consistência com Portal; muitos Admin incluem páginas de auth.      |
| **2ª**     | **Materio** (páginas de auth)                           | Next.js + Material | Admin com fluxo de login; reutilizar apenas as páginas de auth se o portal for Material. |
| **3ª**     | **Gradient Able** / **MaterialPro React Admin Lite**    | React + Bootstrap  | Dashboards com telas de login; usar só a parte de auth, minimal.                         |

**Nota:** No HTMLrev não há "só auth"; auth vem dentro de templates Admin ou como blocos. A melhor opção é **blocos Shadcn de formulário** (login/signup) para manter uma única linguagem com o Portal.

---

## 3. Portal de Gestão (Admin Dashboard)

**Contrato:** boot MANAGEMENT; sidebar + topbar; React + Tailwind + Shadcn; nunca bloqueia.

| Prioridade | Template                          | Stack              | Motivo                                                                                                                |
| ---------- | --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **1ª**     | **Modernize React MUI Dashboard** | React + MUI        | Admin dashboard "enterprise", tema claro, muitos elementos; boa referência de layout (sidebar, tabelas, formulários). |
| **2ª**     | **MatDash** (Next.js)             | Next.js + Tailwind | Admin com 7+ páginas bem definidas; Tailwind + estrutura Next; alinhado a "portal de gestão".                         |
| **3ª**     | **Materio** (Next.js)             | Next.js + Material | 35+ elementos, 6 páginas; Material design; opção se preferires Material em vez de Shadcn.                             |

**Shadcn:** Usar **Shadcn Blocks / Shadcn Studio** (parceiros HTMLrev) para blocos de sidebar, topbar, tabelas e formulários — assim o Portal fica 100% Shadcn + React, como no contrato.

**Onde procurar no HTMLrev:** filtros _React_, _Next.js_, _Shadcn_ → secção Admin / Dashboard.

---

## 4. Operacional (TPV / KDS)

**Contrato:** boot OPERATIONAL; fullscreen; sem sidebar; touch-first; custom UI.

| Prioridade | Abordagem                                                                                       | Motivo                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **1ª**     | **Custom Operational UI** (sem template HTMLrev direto)                                         | Não existe "POS/KDS" no HTMLrev; TPV/KDS são UIs dedicadas, fullscreen, com lógica própria.      |
| **2ª**     | **Inspiração em dashboards "cards grandes"** (ex. Volt Django Dashboard, dashboards com charts) | Para referência de zonas grandes, botões visíveis, pouca navegação — não copiar layout de admin. |
| **3ª**     | **Componentes Shadcn: Button, Card, Table**                                                     | Usar apenas primitivos (botões grandes, cards, tabelas) dentro de layout fullscreen próprio.     |

**Conclusão:** Para TPV/KDS não se escolhe um template HTMLrev completo; escolhem-se **componentes** (Shadcn ou Tailwind) e desenha-se layout fullscreen conforme [OPERATIONAL_ROUTES_CONTRACT](../architecture/OPERATIONAL_ROUTES_CONTRACT.md) e [PAGE_TYPES_AND_TEMPLATES_CONTRACT](../architecture/PAGE_TYPES_AND_TEMPLATES_CONTRACT.md).

---

## Resumo executivo

| Camada      | Melhor opção                                                | Onde no HTMLrev                    |
| ----------- | ----------------------------------------------------------- | ---------------------------------- |
| **Landing** | Shadcn Landing Page ou Easy Template 5                      | Shadcn / Next.js → Landing, SaaS   |
| **Auth**    | Blocos Shadcn login/signup (ou páginas de auth de um Admin) | Shadcn blocks / Admin templates    |
| **Portal**  | Modernize React MUI Dashboard ou MatDash + Shadcn blocks    | React / Next.js → Admin, Dashboard |
| **TPV/KDS** | Custom UI + componentes Shadcn/Tailwind                     | N/A (apenas componentes)           |

**Regra:** Escolher por **camada** e **arquétipo**, não por tecnologia sozinha. Ver [PAGE_TYPES_AND_TEMPLATES_CONTRACT](../architecture/PAGE_TYPES_AND_TEMPLATES_CONTRACT.md).

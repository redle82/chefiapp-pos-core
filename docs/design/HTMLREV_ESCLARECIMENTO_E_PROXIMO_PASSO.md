# HTMLrev — Esclarecimento objetivo e próximo passo

**Data:** 2026-01-31
**Propósito:** Alinhar expectativas entre o que foi feito (contratos) e o que está pendente (implementação visual).

---

## ⚠️ Aviso de auditoria (HTMLrev vs implementado)

**Nenhum template do site [htmlrev.com](https://htmlrev.com/) foi integrado no código.** Os nomes citados nos contratos (Shadcn Landing Page, Easy Template 5, Astroship, etc.) são **referência conceptual**; não há no repositório links diretos para itens do catálogo HTMLrev. A landing em `/` vem do **GitHub**: [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (HTML5 + SASS).
**Auditoria completa:** [AUDITORIA_TEMPLATES_LANDING.md](./AUDITORIA_TEMPLATES_LANDING.md) — lista exata de templates citados vs origem real, URLs, e ficheiros alterados no merchant-portal.

---

## 👉 Prioridade máxima para ChefIApp

### 🥇 TOP 1 — Appy

| Campo               | Valor                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**            | Appy                                                                                                                                                                                                                            |
| **Tipo**            | App / SaaS Landing                                                                                                                                                                                                              |
| **Por que é ideal** | Visual de produto real; estrutura perfeita para "antes do login / depois do login"; parece um software operacional.                                                                                                             |
| **Status**          | ⭐ **ESCOLHA PRINCIPAL**                                                                                                                                                                                                        |
| **Origem**          | **GitHub** (não HTMLrev): [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (HTML5 + SASS). O nome “Appy” vem do título do próprio template (`index.html`), não do catálogo HTMLrev.    |
| **Integração**      | ✅ Rota `/` (camada PUBLIC); `merchant-portal/src/pages/Landing/LandingPage.tsx` + `template-landing.css` + `public/landing/img/`. Ver [AUDITORIA_TEMPLATES_LANDING.md](./AUDITORIA_TEMPLATES_LANDING.md) para paths completos. |

---

## Decisão registada (2026-01-31)

**Opção A:** Executar a integração de um template HTMLrev na landing pública.

- **Template canónico:** Shadcn Landing Page (React + Shadcn), conforme [TEMPLATE_SELECTION_CONTRACT](../architecture/TEMPLATE_SELECTION_CONTRACT.md).
- **Rota:** `/` (camada PUBLIC).
- **Quando:** Integração concluída (2026-01-31). Template usado: [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (HTML5 + SASS, SaaS landing).

---

## 1. O que exatamente foi feito?

| Tipo                                 | Feito? | Detalhe                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Análise conceitual**               | ✅ Sim | Uso do HTMLrev (https://htmlrev.com/) como referência de catálogo: 2000+ templates (Shadcn, Next.js, Astro, etc.) para definir **quais** templates fazem sentido por camada.                                                                                                                                                                                                                                             |
| **Criação/ajuste de contratos**      | ✅ Sim | Três documentos: (1) [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](../architecture/PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) — 5 arquétipos e regra "o papel da página define o template"; (2) [TEMPLATE_SELECTION_CONTRACT.md](../architecture/TEMPLATE_SELECTION_CONTRACT.md) — escolhas canónicas por camada; (3) [HTMLREV_TEMPLATES_BY_LAYER.md](./HTMLREV_TEMPLATES_BY_LAYER.md) — lista por camada com prioridades e motivos. |
| **Aplicação de template específico** | ❌ Não | Nenhum template HTMLrev foi integrado no código. Nenhum ficheiro do merchant-portal importa ou replica um template HTMLrev.                                                                                                                                                                                                                                                                                              |

---

## 2. Template HTMLrev integrado?

**Resposta:** Nenhum template do site htmlrev.com foi integrado.

- **Qual template (HTMLrev):** N/A.
- **Em que rota:** N/A.
- **Em que camada:** N/A.

A landing **atualmente em `/`** é o template **GitHub** [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (nome no template: “Appy”), integrado em `LandingPage.tsx` + `template-landing.css` + `public/landing/img/`. Não provém de htmlrev.com.

---

## 3. Confirmação: trabalho até agora foi apenas arquitetural/contratual

**Sim.** O trabalho até agora foi apenas:

- Definição dos **arquétipos** de página (Landing, Auth, Portal, Operacional, Staff).
- Definição das **escolhas canónicas** de templates por camada, com o HTMLrev como fonte de referência.
- Documentação em **contratos** e em [HTMLREV_TEMPLATES_BY_LAYER.md](./HTMLREV_TEMPLATES_BY_LAYER.md).

A página em `/` foi alterada: passou a usar o template **GitHub** (html-sass-landing-template), não um template HTMLrev. Os contratos referem HTMLrev como **catálogo de referência**; a implementação visual atual vem do GitHub.

---

## 4. Próximo passo concreto para substituir a landing por uma landing SaaS (HTMLrev)

Objetivo: substituir a landing atual por uma landing alinhada ao modelo GloriaFood/LastApp e aos contratos, usando um template HTMLrev na camada **PUBLIC**.

### 4.1 Contratos a respeitar

- [PUBLIC_SITE_CONTRACT.md](../architecture/PUBLIC_SITE_CONTRACT.md): rotas `/`, `/pricing`, `/features`, `/demo`, `/login`, `/signup`; boot PUBLIC; zero Runtime/Core; estático + CTA.
- [TEMPLATE_SELECTION_CONTRACT.md](../architecture/TEMPLATE_SELECTION_CONTRACT.md): 1ª opção Landing = **Shadcn Landing Page** (React + Shadcn); 2ª = **Easy Template 5** (Next.js + Shadcn); 3ª = **Astroship** (Astro + Tailwind).

### 4.2 Passos concretos

1. **Obter o template**
   Adquirir no HTMLrev o template escolhido (recomendado: **Shadcn Landing Page** ou **Easy Template 5** para manter React + Shadcn no merchant-portal).

2. **Integrar na rota `/` (camada PUBLIC)**

   - Substituir o conteúdo de `LandingPage.tsx` (e/ou dos componentes em `pages/Landing/`) pela estrutura/componentes do template, **ou**
   - Criar uma nova página que use o layout e blocos do template e montá-la em `<Route path="/" element={<.../>} />` em `App.tsx`, mantendo rotas `/pricing`, `/features`, `/demo` na mesma camada (sem Runtime).

3. **Preservar o modelo GloriaFood/LastApp**

   - Manter boot PUBLIC (sem `RestaurantRuntimeProvider` / Core) para `/`, `/pricing`, `/features`, `/demo`, `/login`, `/signup`.
   - CTAs: "Começar" / "Ver Demo" → destino já definido nos contratos (ex.: `/app/dashboard` ou `/auth` conforme [AUTH_AND_ENTRY_CONTRACT](../architecture/AUTH_AND_ENTRY_CONTRACT.md)).
   - Copiar e oferta (SaaS) conforme produto; estrutura visual e componentes vêm do template HTMLrev.

4. **Validar**
   - Abrir `http://localhost:5175/` e confirmar que a nova landing renderiza sem erros.
   - Confirmar que não há chamadas ao Core nem uso de Runtime nas rotas públicas.
   - Confirmar que links para login/signup/demo apontam para os destinos canónicos.

### 4.3 Resumo do próximo passo

| Ação          | Detalhe                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| **O quê**     | Substituir a landing atual por uma landing baseada num template HTMLrev (1ª opção: Shadcn Landing Page). |
| **Onde**      | Rota `/`; camada PUBLIC; ficheiros em `merchant-portal/src/pages/Landing/` (ou equivalente).             |
| **Contratos** | PUBLIC_SITE_CONTRACT, TEMPLATE_SELECTION_CONTRACT, AUTH_AND_ENTRY_CONTRACT.                              |
| **Modelo**    | GloriaFood/LastApp: público → auth → gestão → operação; landing estática, sem Core.                      |

---

## 5. Alinhamento final

- **Contratos (já feitos):** PAGE_TYPES_AND_TEMPLATES, TEMPLATE_SELECTION, HTMLREV_TEMPLATES_BY_LAYER; referência **conceptual** ao HTMLrev (nomes como Shadcn Landing Page, Easy Template 5, Astroship — **sem URLs/links para itens no htmlrev.com**).
- **Decisão A:** Integrar um template na landing; rota = `/`; camada = PUBLIC.
- **Implementação visual (real):** Template **GitHub** [html-sass-landing-template](https://github.com/goldmonkey777/html-sass-landing-template) (não HTMLrev). Estrutura e CSS (Hero, Cards, Features, Pricing, Banner, Footer); copy ChefIApp; CTAs para `/auth`, `/pricing`, `/features`, `/demo`. Boot PUBLIC mantido. **Ficheiros alterados:** ver [AUDITORIA_TEMPLATES_LANDING.md](./AUDITORIA_TEMPLATES_LANDING.md) (paths completos).

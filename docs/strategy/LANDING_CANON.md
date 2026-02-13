# Contrato canónico — Landing (imutável)

**Decisão selada:** Existe **uma única** landing de marketing do ChefIApp™ OS. É a **LandingV2** no merchant-portal. Não existe nem pode ser criado outro projeto, aplicação ou "landing paralela" para marketing.

---

## 1. Regra imutável

- **A landing oficial** é e será sempre: **LandingV2** no merchant-portal.
- **Código:** `merchant-portal/src/pages/LandingV2/LandingV2Page.tsx` e todas as secções em `merchant-portal/src/pages/LandingV2/sections/`.
- **URLs em desenvolvimento:** `http://localhost:5175/landing-v2` e `http://localhost:5175/v2`.
- **Em produção:** O mesmo build do merchant-portal serve a landing (ex.: `app.chefiapp.com/landing-v2` ou o domínio raiz configurado para mostrar a landing).

---

## 2. Proibido

- Criar um projeto separado (ex.: `landing/`, Next.js ou outro) para "landing de marketing".
- Criar uma "segunda landing" ou "landing pública" em outro repositório ou pasta.
- Referir "landing" como algo que vive fora de `merchant-portal/src/pages/LandingV2/`.

Qualquer evolução de marketing (copy, secções, logo, i18n, SEO, analytics) faz-se **dentro** do merchant-portal, na LandingV2 ou nos seus componentes.

---

## 3. O que a LandingV2 contém (fonte de verdade)

- Hero, MoneyLeaks, OperationalStories, ProblemSolution, InsideSystem, NearMissStory, RhythmBreak, Manifesto, MetricsStrip, Platform, ToolsAvoid, CTABanner, TargetAudience, SocialProof, Comparison, ReadyToScale, HotelMirror, **Pricing**, HardObjections, SystemLimits, ComoComecer, Hardware, FAQ, TechValues, FinalManifesto, Footer.
- Identidade: ChefIApp™ OS, tema escuro, acento âmbar, restaurante como protagonista.
- **i18n:** idiomas pt, en, es. Locale por `?lang=pt|en|es` (default pt). Copy em `merchant-portal/src/pages/LandingV2/i18n/landingV2Copy.ts`; contexto em `i18n/LandingLocaleContext.tsx`. Secções migradas: meta, Hero, CTABanner, Footer, FAQ (incl. perguntas/respostas), Pricing (título, badge, lista incluída, CTA, enterprise), Manifesto (before/after, razões OS, callout), TargetAudience (para quem, 4 cards), ComoComecer (3 passos, CTA), ToolsAvoid (o que evita, 6 cards), **Hardware** (dispositivos, 4 cards, PWA), **Platform** (sectionLabel, headline1/2, subhead, 9 módulos, bottomNote), **MoneyLeaks** (sectionLabel, headlines, subhead, 5 leaks, síntese), **MetricsStrip** (5 métricas estáticas/animadas), **RhythmBreak** (label, headline), **Comparison** (sectionLabel, headlines, subhead, cabeçalhos tabela, 7 linhas), **OperationalStories** (sectionLabel, headline, subheads, 3 cenários com steps/anchor, closer), **ProblemSolution** (sectionLabel, headline, subhead, columnLabel, labelWithout/With, 4 problemas), **InsideSystem** (sectionLabel, headlines, subheads, 3 frames, 3 cards, flow+4 steps, CTA). Restantes secções podem ser migradas incrementalmente.
- **SEO/a11y:** na LandingV2 o `<html lang>` é definido conforme o locale (pt/en/es); são injetados `<link rel="alternate" hreflang="pt|en|es|x-default">` para a URL atual com `?lang=`, para motores de busca e acessibilidade.

---

## 4. Rotas no App

- `/landing-v2` e `/v2` renderizam `<LandingV2Page />`.
- A raiz `/` pode redirecionar para auth ou para a landing, conforme contrato de produto; a **landing em si** é sempre a mesma página (LandingV2).

---

## 5. Deploy e domínios

- O **mesmo** build do merchant-portal (Vite/React) é deployado para o app (ex.: Vercel, ou outro host).
- Para **chefiapp.com** ou **www.chefiapp.com**: configurar o mesmo projeto/build; a rota principal ou uma delas serve a landing (ex.: `/` ou `/landing-v2` conforme decisão de produto).
- Não há "projeto Vercel separado para landing"; há um único front-end (merchant-portal) que inclui a landing.

---

## 6. Referências

- **Código:** `merchant-portal/src/App.tsx` (rotas `/v2`, `/landing-v2`).
- **Contratos de rotas e estado:** [CORE_LANDING_ROUTES_CONTRACT.md](../architecture/CORE_LANDING_ROUTES_CONTRACT.md), [LANDING_STATE_ROUTING_CONTRACT.md](../architecture/LANDING_STATE_ROUTING_CONTRACT.md).
- **Copy e princípios:** [LANDING_COPY_GUIDE.md](LANDING_COPY_GUIDE.md) (aplica-se à LandingV2).
- **Voz de marketing (CEO / Silicon Valley):** [MARKETING_SILICON_VALLEY_VOICE.md](MARKETING_SILICON_VALLEY_VOICE.md).

---

**Este documento é canónico. Não alterar a regra "uma única landing = LandingV2 no merchant-portal".**

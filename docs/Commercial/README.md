# Commercial Documentation

Documentação da estratégia comercial e da estrutura de vendas do ChefIApp. **Gateway-led global rollout:** ChefIApp expande onde a sua infraestrutura de pagamento está legal e tecnicamente optimizada (PIX/BR, SumUp/ES+GB, Stripe/US).

---

## Landings por país (gateway-first: `/br`, `/es`, `/gb`, `/us`)

### Como rodar

1. Iniciar o merchant-portal: `pnpm -w merchant-portal run dev` ou `pnpm --filter merchant-portal run dev`
2. Abrir `http://localhost:5175/` — redireciona para `/gb` (ou país conforme `navigator.language`)
3. Testar rotas: `/br`, `/es`, `/gb`, `/us`

### Parâmetros

- `?segment=small|multi|enterprise` — altera copy e CTAs na landing

### Adicionar novo país

1. **`merchant-portal/src/landings/countries.ts`**
   - Adicionar código em `CountryCode` e em `COUNTRY_ROUTES`
   - Adicionar entrada em `COUNTRIES` (locale, currency, whatsAppNumber, whatsAppMessage, meta, hero, deliveryMessage)
   - Se a moeda for nova, adicionar em `PRICING_BY_CURRENCY`
2. **`merchant-portal/src/routes/MarketingRoutes.tsx`**
   - Adicionar `<Route path="/XX" element={<CountryLandingPage />} />` (XX = código do país)
3. **`merchant-portal/src/landings/CountryLandingPage.tsx`**
   - Se hreflang precisar de mapeamento novo, adicionar em `hreflangMap`
4. **`merchant-portal/src/landings/HomepageRedirect.tsx`**
   - Adicionar mapeamento em `detectLocaleFromBrowser` (ex.: `if (lang.startsWith("fr")) return "fr"` para França)
5. Correr testes: `pnpm --filter merchant-portal test src/landings/countryLandings.smoke.test.tsx`

---

## Documentos principais

| Documento | Conteúdo |
|-----------|----------|
| [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md) | **OS comercial global** — visão geral, 5 fases, landing structure |
| [COUNTRY_DEPLOYMENT_SYSTEM.md](./COUNTRY_DEPLOYMENT_SYSTEM.md) | **Phase 1** — Landings localizadas por país (BR, ES, GB, US): Hero, pricing, WhatsApp, SEO, meta, delivery |
| [GATEWAY_DEPLOYMENT_MATRIX.md](./GATEWAY_DEPLOYMENT_MATRIX.md) | Matriz gateway-first: PIX (BR), SumUp (ES, GB), Stripe (US). Regiões bloqueadas (DE, AT, PT) |
| [SEGMENTED_SALES_FUNNEL.md](./SEGMENTED_SALES_FUNNEL.md) | **Phase 2** — 3 funis (Small, Multi, Enterprise): landing variations, pain points, value args, demo scripts, objecções |
| [CRM_AUTOMATION.md](./CRM_AUTOMATION.md) | **Phase 3** — Pipeline Lead→Qualified→Demo→Trial→Paid; scripts WhatsApp; sequências email; follow-up demo; trial nudges |
| [PRICING_AND_PACKAGES.md](./PRICING_AND_PACKAGES.md) | **Phase 4** — Starter/Pro/Enterprise; módulos; preços por moeda; terminal add-ons; multi-location; serviços opcionais |
| [ENTERPRISE_OFFER_PACKAGING.md](./ENTERPRISE_OFFER_PACKAGING.md) | **Sales machine** — Offer sheet, pricing tiers (Starter/Growth/Enterprise), landing copy, 7-step funnel, scripts |
| [ACTIVATION_INTELLIGENCE_V3_BATCH_JOB.md](./ACTIVATION_INTELLIGENCE_V3_BATCH_JOB.md) | **Activation v3** — gm_activation_snapshots, batch job design, MoM/cohort queries, early warning |
| [STRATEGIC_POSITIONING.md](./STRATEGIC_POSITIONING.md) | **Phase 5** — Diferenciação vs Toast, Square, LastApp; Workforce Orchestrator; automação comportamental; arquitectura modular |
| [LANDING_STRUCTURE_BY_COUNTRY.md](./LANDING_STRUCTURE_BY_COUNTRY.md) | Estrutura técnica das landings por país (rotas, copy, SEO, componentes) |

---

## Relação com outros docs

- [STRATEGIC_DECISION_FRAMEWORK.md](../strategy/STRATEGIC_DECISION_FRAMEWORK.md) — decisão plataforma modular
- [PLATFORM_MODULAR_DECISION.md](../strategy/PLATFORM_MODULAR_DECISION.md) — módulos e planos
- [MANIFESTO_COMERCIAL.md](../MANIFESTO_COMERCIAL.md) — narrativa "TPV que pensa"
- [COMMERCIAL_PITCH.md](../strategy/COMMERCIAL_PITCH.md) — pitch de vendas
- [LANDING_COPY_GUIDE.md](../strategy/LANDING_COPY_GUIDE.md) — copy e voz

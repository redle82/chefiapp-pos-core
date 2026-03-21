# Landing Structure by Country

**Propósito:** Especificação técnica para landings localizadas por país.  
**Ref:** [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md)

---

## 1. Rotas por país (gateway-first)

| Rota | País | Locale | Moeda |
|------|------|--------|-------|
| `/` | Default (GB) | en | GBP |
| `/br` | Brasil | pt-BR | BRL |
| `/es` | España | es | EUR |
| `/gb` | United Kingdom | en | GBP |
| `/us` | United States | en | USD |

**Implementação sugerida:** React Router com `path="/:country?"`; resolver locale + moeda via `regionLocaleConfig` ou mapa explícito.

---

## 2. Template por página

Cada landing country deve ter:

### 2.1 Meta SEO

```html
<title>{countryTitle} — ChefIApp OS | POS + Orquestração de Equipe</title>
<meta name="description" content="{countryDescription}" />
<link rel="alternate" hreflang="es" href="https://chefiapp.com/es" />
<link rel="alternate" hreflang="pt-BR" href="https://chefiapp.com/br" />
<link rel="alternate" hreflang="en-GB" href="https://chefiapp.com/gb" />
<link rel="alternate" hreflang="en" href="https://chefiapp.com/us" />
<link rel="alternate" hreflang="x-default" href="https://chefiapp.com/gb" />
```

### 2.2 Copy localizada

- `countryTitle` — "Sistema operacional para restaurantes"
- `countryDescription` — 1–2 frases para SEO
- `ctaPrimary` — "Começar grátis" / "Agendar demo"
- `ctaWhatsApp` — texto + link WhatsApp com número do país

### 2.3 Pricing local

- Resolver moeda pelo país (EUR, BRL, USD, MXN).
- Usar `billing_plan_prices` ou config estática até integração real.

### 2.4 WhatsApp CTA

- Número por país (config).
- Mensagem pré-preenchida: "Olá! Gostaria de saber mais sobre o ChefIApp."

---

## 3. Ficheiros de copy (i18n)

```
merchant-portal/src/pages/LandingV2/i18n/
  landingV2Copy.ts      # existente
  countryCopy.ts        # novo: por país (pt-PT, es, pt-BR, en)
  segmentCopy.ts        # novo: por vertical (small, multi, enterprise)
```

---

## 4. Componentes

| Componente | Uso |
|------------|-----|
| `CountryHero` | Hero com título/CTA localizados |
| `PricingByCountry` | Bloco de pricing com moeda local |
| `WhatsAppCTA` | Botão com link `https://wa.me/{countryNumber}?text=...` |
| `DemoBookingForm` | Form ou embed Calendly por país |

---

## 5. Segment query param

- `?segment=small` — Restaurant small
- `?segment=multi` — Multi-location
- `?segment=enterprise` — Enterprise chain

Altera copy (hero, prova) sem mudar rota. Útil para campanhas segmentadas.

---

## 6. Referências

- `merchant-portal/src/core/i18n/regionLocaleConfig.ts`
- `merchant-portal/src/pages/LandingV2/`
- [LANDING_COPY_GUIDE.md](../strategy/LANDING_COPY_GUIDE.md)
- [LANDING_CANON.md](../strategy/LANDING_CANON.md)

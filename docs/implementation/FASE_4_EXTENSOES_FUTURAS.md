# FASE 4 — Pontos de extensão: reviews, SEO local, fidelização

Documento de referência para integrar reviews, SEO local e fidelização sem refactor grande. Referência: `docs/implementation/FASE_4_PRESENCA_DIGITAL_CHECKLIST.md` Passo 3.

---

## 1. Reviews (avaliações de clientes)

**Onde ligar**
- **Dados:** Nova tabela opcional `gm_restaurant_reviews` (restaurant_id, order_id opcional, rating 1–5, comment, source, created_at) ou integrar com API externa (Google, TripAdvisor) e guardar só agregados em `gm_restaurants` ou `restaurant_web_presence.config`.
- **Config:** `restaurant_web_presence.config` JSONB pode ter chaves `reviews_enabled`, `reviews_source` (google | internal | tripadvisor), `reviews_widget_placeholder`.
- **UI pública:** Em `PublicWebPage` ou layout de `/public/:slug`, incluir bloco condicional “Avaliações” que lê agregado (média, total) de API ou de tabela interna; opcional widget de terceiro (Google snippet).
- **Config dono:** Nova secção em Config (ex.: Config → Presença ou Integrações) para ativar reviews e escolher fonte.

**Caminho mínimo**
- Sem nova tabela: usar `restaurant_web_presence.config.reviews` com `{ "enabled": false, "source": "google", "place_id": null }`. Quando integrar Google Reviews, preencher `place_id` e mostrar snippet na página pública.
- Com nova tabela: migration `gm_restaurant_reviews`; reader/writer; bloco na página pública que lista últimas N avaliações.

---

## 2. SEO local

**Onde ligar**
- **Metadados:** Página pública `/public/:slug` deve expor meta tags (title, description, og:image) derivadas de `gm_restaurants` (name, description, slug) e opcionalmente de `restaurant_web_presence.config.seo` (meta_description, og_image_url).
- **Schema.org:** JSON-LD `LocalBusiness` na página pública com name, address (address_text), openingHours (opening_hours_text ou estrutura parseada), url.
- **Config:** `restaurant_web_presence.config.seo` ou colunas em `gm_restaurants`: já existem `address_text`, `opening_hours_text`; podem acrescentar `meta_description`, `og_image_url` numa migration ou em config JSONB.
- **Sitemap/robots:** Se houver domínio por restaurante, gerar sitemap com `/public/:slug` e `/public/:slug/mesa/:n`; caso contrário, sitemap global com lista de slugs.

**Caminho mínimo**
- Em `PublicWebPage` (ou layout): `<Helmet>` com title = `restaurant.name`, description = `restaurant.description || restaurant.meta_description`. Opcional: componente que injeta JSON-LD LocalBusiness a partir de restaurant (name, address_text, opening_hours_text, url base).
- Config: em PublicPresenceFields ou nova secção “SEO” permitir campo “Descrição para motores de busca” e guardar em `gm_restaurants` ou `restaurant_web_presence.config.seo`.

---

## 3. Fidelização (programa de pontos / descontos)

**Onde ligar**
- **Dados:** Tabela `gm_customer_loyalty` ou equivalente (já existe `20260116000003_customer_loyalty.sql` no repo — verificar schema). Se existir: restaurant_id, customer_id/phone/email, points, tier; transações de pontos ligadas a gm_orders.
- **Config:** `gm_restaurants` ou `restaurant_web_presence.config.loyalty`: `{ "enabled": false, "points_per_eur": 1, "tier_rules": [] }`.
- **UI pública:** Na página pública ou no fluxo de pedido, bloco “Programa de fidelidade” (registar cliente, ver pontos); após pedido, opção “Associar a número/email” e creditar pontos.
- **TPV/Backoffice:** Em TPV ou Config, ecrã para ver/ajustar pontos de cliente e regras.

**Caminho mínimo**
- Verificar migration customer_loyalty; se existir, expor em Config um toggle “Ativar fidelização” que grava em config; na página pública, mostrar “Em breve” ou link para registo. Integração completa (pontos por compra, resgate) em onda posterior.

---

## Resumo de pontos de extensão

| Área        | Config / Dados existentes                    | Extensão sugerida                                      |
|------------|-----------------------------------------------|--------------------------------------------------------|
| Reviews    | restaurant_web_presence.config (JSONB)        | Chaves reviews_*; opcional gm_restaurant_reviews      |
| SEO local  | gm_restaurants (name, description, address_text, opening_hours_text) | Meta tags + JSON-LD em PublicWebPage; config.seo ou colunas |
| Fidelização| customer_loyalty (se existir); gm_restaurants | config.loyalty; UI pública “Programa de fidelidade”   |

**Critério de aceite Passo 3:** Caminho claro para integrar reviews, SEO local ou fidelização sem refactor grande. ✅ (este documento + config JSONB e tabelas existentes cobrem os pontos de extensão.)

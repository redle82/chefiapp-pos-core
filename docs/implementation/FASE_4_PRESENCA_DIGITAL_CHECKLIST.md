# FASE 4 — Presença Digital (checklist técnica)

Checklist executável por dev. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Princípio:** Presença digital não é fundação, é aceleração.

**Critério de conclusão da FASE 4:** "O restaurante existe fora da porta."

---

## Passo 1 — Página pública do restaurante: menu online; horários; localização

**Objetivo:** Página pública com menu, horários de funcionamento e localização.

**Estado atual:** Implementado. Migration `20260228180000_f4_public_presence_fields.sql`: colunas `address_text` e `opening_hours_text` em gm_restaurants. PublicWebPage exibe horários e localização quando preenchidos. Config → Localização → Endereço: bloco "Página pública" (PublicPresenceFields) para o dono preencher endereço e horários em texto livre. CoreRestaurant e RestaurantReader incluem address_text e opening_hours_text.

**Tarefas:** ~~Campos em gm_restaurants~~; ~~exibir na página pública~~; ~~Config para dono preencher~~.

**Critério de aceite:** Cliente acede a /public/:slug e vê menu, e quando o dono configurou, horários e localização. ✅

---

## Passo 2 — QR Code: mesa; menu; promoções

**Objetivo:** QR por mesa/menu para acesso rápido ao menu ou pedido.

**Estado atual:** Implementado. Config → Localização → Mesas & Zonas inclui PublicQRSection: QR do menu geral (link /public/:slug) e QR por mesa (número 1–99, link /public/:slug/mesa/N). Usa buildTableQRUrl, buildMenuUrl, QRCodeGenerator; slug obtido via readRestaurantById. Se o restaurante não tiver slug, mostra aviso para configurar em Identidade.

**Tarefas:** ~~Dono obter QR por mesa~~; ~~QR do menu geral~~; ~~exibir na Config~~.

**Critério de aceite:** Dono obtém QR que leva o cliente ao menu (ou mesa); cliente escaneia e acede. ✅

---

## Passo 3 — Integração futura: reviews; SEO local; fidelização

**Objetivo:** Preparar para reviews, SEO e fidelização (onda de valor posterior).

**Estado atual:** Implementado. Documento `docs/implementation/FASE_4_EXTENSOES_FUTURAS.md` descreve onde e como ligar reviews (restaurant_web_presence.config ou gm_restaurant_reviews), SEO local (meta tags + JSON-LD em PublicWebPage; config.seo), fidelização (customer_loyalty + config.loyalty). Migration `20260228190000_f4_web_presence_config_comment.sql` documenta no schema as chaves de extensão em restaurant_web_presence.config (reviews, seo, loyalty). gm_restaurants já tem facebook_pixel_id e google_tag_id (marketing).

**Tarefas:** ~~Documentar pontos de extensão~~; ~~config placeholder (comment + doc)~~.

**Critério de aceite:** Caminho claro para integrar reviews, SEO local ou fidelização sem refactor grande. ✅

---

## Ordem recomendada

1 → 2 → 3. Validar após cada passo.

# GROWTH & MARKETING SETUP — ChefIApp Customer Portal

**Status:** ATIVO  
**Data:** 2026-01-24  
**Versão:** 1.0

---

## VISÃO GERAL

Sistema completo de Growth & Marketing para o Customer Portal:

1. **SEO Dinâmico** — Meta tags por restaurante
2. **Schema.org** — Structured data para rich snippets
3. **Pixel Tracking** — Meta Pixel + Google Analytics

---

## PARTE 1: SEO

### Arquivos

- `src/lib/seo.tsx` — Componente de SEO dinâmico
- `src/lib/schema.ts` — Gerador de Schema.org
- `src/components/RestaurantSEO.tsx` — Integração automática

### Meta Tags Geradas

| Tag | Descrição |
|-----|-----------|
| `title` | `{Restaurante} - Cardápio Digital` |
| `description` | Gerado automaticamente |
| `og:title` | Open Graph title |
| `og:description` | Open Graph description |
| `og:image` | Imagem do restaurante |
| `og:type` | `restaurant.restaurant` |
| `twitter:card` | Twitter Card |

### Schema.org (JSON-LD)

Schemas gerados automaticamente:

1. **Restaurant** — Dados do restaurante
2. **Menu** — Cardápio com seções e itens
3. **BreadcrumbList** — Navegação

Exemplo de schema gerado:

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Sofia Gastrobar",
  "url": "https://cardapio.chefiapp.com/sofia-gastrobar",
  "hasMenu": {
    "@type": "Menu",
    "name": "Cardápio - Sofia Gastrobar",
    "hasMenuSection": [...]
  }
}
```

---

## PARTE 2: PIXEL TRACKING

### Configuração

Variáveis de ambiente:

```bash
# .env.production
VITE_META_PIXEL_ID=123456789012345
VITE_GA_ID=G-XXXXXXXXXX
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXXX
```

### Eventos Rastreados

| Evento | Quando Dispara | Dados |
|--------|----------------|-------|
| `PageView` | Página carrega | URL |
| `ViewContent` | Abre produto | ID, nome, preço |
| `AddToCart` | Adiciona ao carrinho | ID, nome, preço, quantidade |
| `InitiateCheckout` | Abre checkout | Itens, total |
| `Purchase` | Pedido confirmado | OrderID, itens, total |

### Uso Manual (Opcional)

```typescript
import { trackEvent, trackPurchase } from '@/lib/pixel';

// Evento genérico
trackEvent('Lead', { content_name: 'Newsletter' });

// Compra
trackPurchase({
  orderId: 'ORDER-123',
  items: [...],
  total: 45.90,
  currency: 'EUR',
});
```

---

## PARTE 3: COMO CONFIGURAR

### 1. Meta Pixel (Facebook/Instagram)

1. Acesse [Meta Business Suite](https://business.facebook.com)
2. Eventos Manager → Create Pixel
3. Copie o Pixel ID (15 dígitos)
4. Configure no `.env`:
   ```bash
   VITE_META_PIXEL_ID=123456789012345
   ```

### 2. Google Analytics (GA4)

1. Acesse [Google Analytics](https://analytics.google.com)
2. Admin → Create Property → Web
3. Copie o Measurement ID (`G-XXXXXXXX`)
4. Configure no `.env`:
   ```bash
   VITE_GA_ID=G-XXXXXXXXXX
   ```

### 3. Google Ads (Conversões)

1. Acesse [Google Ads](https://ads.google.com)
2. Tools → Conversions → New Conversion Action
3. Configure "Purchase" como conversão
4. Copie o Conversion ID (`AW-XXXXXXXX`)
5. Configure no `.env`:
   ```bash
   VITE_GOOGLE_ADS_ID=AW-XXXXXXXXXX
   ```

---

## PARTE 4: VERIFICAÇÃO

### Testar Meta Pixel

1. Instale [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper)
2. Acesse uma página do customer-portal
3. Verifique eventos no helper

### Testar Google Analytics

1. Acesse GA4 → Realtime
2. Navegue no customer-portal
3. Verifique eventos aparecendo

### Verificar Schema.org

1. Acesse [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Cole URL de um restaurante
3. Verifique se Restaurant e Menu são detectados

---

## PARTE 5: BOAS PRÁTICAS

### Conversões para Otimizar

| Plataforma | Evento Principal | Valor |
|------------|------------------|-------|
| Meta Ads | `Purchase` | Valor do pedido |
| Google Ads | `Purchase` | Valor do pedido |

### Públicos para Remarketing

| Público | Critério |
|---------|----------|
| Abandonadores | `AddToCart` sem `Purchase` |
| Compradores | `Purchase` nos últimos 30 dias |
| Visitantes | `PageView` no restaurante |

### SEO Checklist

- [x] Meta tags dinâmicas por restaurante
- [x] Schema.org Restaurant + Menu
- [x] Open Graph para compartilhamento
- [x] Twitter Cards
- [ ] Sitemap.xml (gerar manualmente)
- [ ] robots.txt (configurar manualmente)

---

## CHECKLIST DE PRODUÇÃO

- [ ] Meta Pixel ID configurado
- [ ] Google Analytics ID configurado
- [ ] Testar PageView em produção
- [ ] Testar AddToCart em produção
- [ ] Testar Purchase em produção
- [ ] Verificar schema no Rich Results Test
- [ ] Configurar conversões no Meta/Google Ads

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-24

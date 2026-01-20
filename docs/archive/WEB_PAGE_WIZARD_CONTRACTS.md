# Web Page Wizard — Contratos & Endpoints

## Visão Geral

Wizard de 5 passos para o merchant configurar a página web em menos de 10 minutos.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. IDENTITY  →  2. MENU  →  3. PAYMENTS  →  4. DESIGN  →  5. PUBLISH  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Passo 1 — Identity (Identidade do Restaurante)

### Opção A: Manual
```
POST /internal/wizard/:restaurantId/identity
Content-Type: application/json
X-Internal-Token: ...

{
  "name": "Sofia Gastrobar",
  "tagline": "Cozinha de autor em Lisboa",
  "logo_url": "https://...",
  "hero": {
    "title": "Sofia Gastrobar",
    "subtitle": "Peça online, levante no balcão",
    "image_url": "https://..."
  },
  "contacts": {
    "phone": "+351912345678",
    "email": "geral@sofia.pt",
    "address": "Rua X, Lisboa",
    "hours": "12h-23h",
    "maps_url": "https://maps.google.com/...",
    "links": {
      "instagram": "https://instagram.com/sofia",
      "facebook": "https://facebook.com/sofia"
    }
  }
}
```

### Opção B: Import do Google Business Profile
```
POST /internal/wizard/:restaurantId/identity/import-google
Content-Type: application/json

{
  "google_place_id": "ChIJ..."
}
```

Response:
```json
{
  "imported": true,
  "identity": {
    "name": "Sofia Gastrobar",
    "tagline": "Restaurant in Lisbon",
    "hero": { "title": "...", "image_url": "..." },
    "contacts": { "phone": "...", "address": "...", "hours": "..." }
  },
  "photos": ["https://...", "..."],
  "rating": 4.6,
  "reviews_count": 128
}
```

### Opção C: Import de URL/PDF (menu extractor)
```
POST /internal/wizard/:restaurantId/identity/import-url
Content-Type: application/json

{
  "url": "https://restaurante.com"
}
```

Response:
```json
{
  "extracted": {
    "name": "Sofia Gastrobar",
    "description": "...",
    "menu_items_suggested": [
      { "name": "Hambúrguer", "price_text": "12,90€", "category_guess": "Pratos" }
    ]
  }
}
```

---

## Passo 2 — Menu

### Criar categoria
```
POST /internal/wizard/:restaurantId/menu/categories
Content-Type: application/json

{
  "name": "Entradas",
  "position": 0
}
```

### Criar item
```
POST /internal/wizard/:restaurantId/menu/items
Content-Type: application/json

{
  "category_id": "uuid",
  "name": "Croquetes de Alheira",
  "description": "6 unidades",
  "price_cents": 890,
  "currency": "eur",
  "photo_url": "https://...",
  "tags": ["popular", "entrée"]
}
```

### Bulk import (do Passo 1C ou manual)
```
POST /internal/wizard/:restaurantId/menu/import
Content-Type: application/json

{
  "categories": [
    { "name": "Entradas", "position": 0 },
    { "name": "Pratos", "position": 1 }
  ],
  "items": [
    { "category_name": "Entradas", "name": "Croquetes", "price_cents": 890 },
    { "category_name": "Pratos", "name": "Hambúrguer", "price_cents": 1290 }
  ]
}
```

---

## Passo 3 — Payments (Stripe Connect)

### Conectar Stripe (credenciais do merchant)
```
POST /internal/wizard/:restaurantId/payments/stripe
Content-Type: application/json

{
  "stripe_publishable_key": "pk_live_...",
  "stripe_secret_key": "sk_live_...",
  "stripe_webhook_secret": "whsec_..."
}
```

Response:
```json
{
  "connected": true,
  "account_id": "acct_...",
  "test_mode": false
}
```

> ⚠️ Secret key é guardada encrypted/hashed. Nunca retornada em plain text.

### Verificar conexão (health check)
```
GET /internal/wizard/:restaurantId/payments/stripe/status
```

Response:
```json
{
  "connected": true,
  "test_mode": false,
  "last_webhook_at": "2025-12-23T10:00:00Z"
}
```

---

## Passo 4 — Design

### Escolher nível e tema
```
PATCH /internal/wizard/:restaurantId/design
Content-Type: application/json

{
  "web_level": "PRO",
  "theme": "dark",
  "slug": "sofia-gastrobar",
  "domain": "sofia.pt"
}
```

> Validação: `web_level` é validado contra FeatureGate (BASIC/PRO/EXPERIENCE).

---

## Passo 5 — Publish

### Preview (antes de publicar)
```
GET /internal/preview/web-page/PRO?slug=sofia-gastrobar
```

Retorna HTML renderizado (já implementado).

### Publicar
```
POST /internal/wizard/:restaurantId/publish
Content-Type: application/json

{
  "confirm": true
}
```

Response:
```json
{
  "published": true,
  "url": "https://chefiapp.com/sofia-gastrobar",
  "custom_domain": "sofia.pt",
  "published_at": "2025-12-23T15:00:00Z"
}
```

Ação interna:
- `restaurant_web_profiles.status = 'published'`
- Audit log com `action = 'WEB_PAGE_PUBLISHED'`

---

## Wizard State (opcional, para UX)

Para permitir "save draft" e retomar:

```
GET /internal/wizard/:restaurantId/state
```

Response:
```json
{
  "current_step": 3,
  "completed_steps": [1, 2],
  "identity_complete": true,
  "menu_complete": true,
  "payments_complete": false,
  "design_complete": false,
  "can_publish": false
}
```

---

## Segurança

| Endpoint | Auth | Scope |
|----------|------|-------|
| `/internal/wizard/*` | `X-Internal-Token` | Admin / Merchant Portal |
| `/public/:slug/*` | None | Cliente final |
| `/internal/preview/*` | `X-Internal-Token` | Admin preview |

---

## Ordem de Implementação (sugestão)

1. **Hoje/Amanhã**: Endpoints de Identity (manual) + Menu (CRUD + bulk)
2. **Depois**: Payments/Stripe connect (já tens 90% do código)
3. **Depois**: Design + Publish
4. **Futuro**: Import Google / Import URL (nice-to-have, pode ser mock)

---

## Notas

- Todos os endpoints são `company_id`-aware (herda do restaurant).
- Audit logs gerados em cada mutação crítica.
- Idempotência onde fizer sentido (ex: `POST /publish` é idempotente).

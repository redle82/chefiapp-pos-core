# Web Page Wizard — Database Schema (MVP-first)

Este ficheiro descreve como suportar o Wizard completo.

## MVP (sem nova fundação)

Para o Passo 1 (Identidade) e o MVP do wizard, **não é necessário criar novas tabelas**.

- Identidade: usar `restaurant_web_profiles.hero`, `restaurant_web_profiles.contacts`, `restaurant_web_profiles.highlights`
    - `hero.title` = nome
    - `hero.subtitle` = tagline
    - `hero.logo_url` (opcional)
    - `contacts.{phone,email,address,hours,maps_url}`
    - `contacts.links` = redes sociais
    - Import Google: `contacts.google_place_id` + `contacts.google_import_data` (mock/real)

- Menu: já existe no schema base como `menu_categories` + `menu_items`

As secções abaixo são uma proposta de extensão **para quando quiseres evoluir** (ex: separar menu web do menu POS, guardar credenciais Stripe fora do profile, tracking granular do wizard, verificação de domínio).

---

## 1. Identity & Settings (opcional)

Já tens `restaurant_web_profiles` com `hero`, `contacts`, `highlights`. Se quiseres materializar campos em colunas (para queries e constraints), podes estender assim:

```sql
-- Adicionar colunas de identidade à tabela existente
ALTER TABLE restaurant_web_profiles
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_import_data JSONB,
ADD COLUMN IF NOT EXISTS wizard_state JSONB DEFAULT '{"current_step": 1, "completed_steps": []}',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;

-- Índice para domínio customizado (único)
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_profiles_custom_domain 
ON restaurant_web_profiles(custom_domain) 
WHERE custom_domain IS NOT NULL;

COMMENT ON COLUMN restaurant_web_profiles.contacts IS 
'JSON: {phone, email, address, hours, maps_url}';
COMMENT ON COLUMN restaurant_web_profiles.links IS 
'JSON: {instagram, facebook, twitter, tiktok, website}';
```

---

## 2. Menu Categories & Items (opcional)

O schema base já tem `menu_categories` + `menu_items`. Só cria tabelas novas se precisares separar “menu web” de “menu POS”:

```sql
-- Categorias do menu web
CREATE TABLE IF NOT EXISTS web_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(restaurant_id, name)
);

-- Itens do menu web
CREATE TABLE IF NOT EXISTS web_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    category_id UUID NOT NULL REFERENCES web_menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'eur' CHECK (currency ~ '^[a-z]{3}$'),
    photo_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    nutritional_info JSONB,
    allergens TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_web_menu_categories_restaurant 
ON web_menu_categories(restaurant_id, position);

CREATE INDEX IF NOT EXISTS idx_web_menu_items_category 
ON web_menu_items(category_id, position);

CREATE INDEX IF NOT EXISTS idx_web_menu_items_restaurant 
ON web_menu_items(restaurant_id, is_available);

CREATE INDEX IF NOT EXISTS idx_web_menu_items_featured 
ON web_menu_items(restaurant_id, is_featured) 
WHERE is_featured = TRUE;
```

---

## 3. Stripe Credentials (encrypted) (opcional)

Tabela separada para segurança (não misturar com profile público):

```sql
-- Credenciais Stripe do merchant (encrypted)
CREATE TABLE IF NOT EXISTS merchant_gateway_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Chaves encriptadas (nunca plain text em logs/queries)
    publishable_key_encrypted BYTEA NOT NULL,
    secret_key_encrypted BYTEA NOT NULL,
    webhook_secret_encrypted BYTEA,
    
    -- Metadata (safe to query)
    account_id TEXT,
    is_test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_webhook_at TIMESTAMPTZ,
    last_health_check_at TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'failed', 'unknown')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Só admin pode ver esta tabela
ALTER TABLE merchant_gateway_credentials ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE merchant_gateway_credentials IS 
'Stripe credentials do merchant. Secret keys NUNCA em plain text.';
```

---

## 4. Wizard Progress (optional, for UX)

Se quiser tracking granular do wizard:

```sql
-- Tracking de progresso do wizard
CREATE TABLE IF NOT EXISTS wizard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Estado
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    completed_steps INTEGER[] DEFAULT '{}',
    
    -- Dados parciais (rascunho)
    draft_identity JSONB,
    draft_menu JSONB,
    draft_design JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    
    -- Uma sessão ativa por restaurante
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wizard_sessions_active 
ON wizard_sessions(restaurant_id) 
WHERE is_active = TRUE;
```

---

## 5. Domain Verification Queue (opcional)

Para verificar domínios customizados:

```sql
-- Fila de verificação de domínios
CREATE TABLE IF NOT EXISTS domain_verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    domain TEXT NOT NULL,
    verification_token TEXT NOT NULL,
    verification_method TEXT NOT NULL DEFAULT 'dns_txt' CHECK (verification_method IN ('dns_txt', 'dns_cname', 'http_file')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_queue_pending 
ON domain_verification_queue(status, expires_at) 
WHERE status = 'pending';
```

---

## Migration File (se fores além do MVP)

Guardar como: `migrations/20251223_05_web_wizard_schema.sql`

```sql
-- Migration: Web Page Wizard Schema Extension
-- Date: 2025-12-23
-- Description: Extends web module for full wizard support

BEGIN;

-- 1. Extend restaurant_web_profiles
ALTER TABLE restaurant_web_profiles
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_import_data JSONB,
ADD COLUMN IF NOT EXISTS wizard_state JSONB DEFAULT '{"current_step": 1, "completed_steps": []}',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_profiles_custom_domain 
ON restaurant_web_profiles(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- 2. Menu categories
CREATE TABLE IF NOT EXISTS web_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, name)
);

-- 3. Menu items
CREATE TABLE IF NOT EXISTS web_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES web_menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'eur' CHECK (currency ~ '^[a-z]{3}$'),
    photo_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    nutritional_info JSONB,
    allergens TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_menu_categories_restaurant 
ON web_menu_categories(restaurant_id, position);

CREATE INDEX IF NOT EXISTS idx_web_menu_items_category 
ON web_menu_items(category_id, position);

CREATE INDEX IF NOT EXISTS idx_web_menu_items_restaurant 
ON web_menu_items(restaurant_id, is_available);

-- 4. Stripe credentials (encrypted)
CREATE TABLE IF NOT EXISTS merchant_gateway_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL UNIQUE,
    company_id UUID NOT NULL,
    publishable_key_encrypted BYTEA NOT NULL,
    secret_key_encrypted BYTEA NOT NULL,
    webhook_secret_encrypted BYTEA,
    account_id TEXT,
    is_test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_webhook_at TIMESTAMPTZ,
    last_health_check_at TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Wizard sessions (draft support)
CREATE TABLE IF NOT EXISTS wizard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}',
    draft_identity JSONB,
    draft_menu JSONB,
    draft_design JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wizard_sessions_active 
ON wizard_sessions(restaurant_id) 
WHERE is_active = TRUE;

COMMIT;
```

---

## Relação com Schema Existente

```
companies (tenant root)
    └── restaurants (operational)
            └── restaurant_web_profiles (página web)
            └── menu_categories → menu_items (já existe)
            └── merchant_gateway_credentials (opcional)
            └── wizard_sessions (opcional)
            └── web_orders (já existe)
```

Tudo herda `company_id` para multi-tenancy correto.

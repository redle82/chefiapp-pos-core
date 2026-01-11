# Advanced Onboarding Contract

Fonte única de verdade: `public.gm_restaurants`

## Estados
- `setup_status` (enum): `not_started` → `quick_done` → `advanced_in_progress` → `advanced_done`
- `advanced_progress` (jsonb): `{ current_step, completed: [] }`
- `provisioning_flags` (jsonb): `{ site_provisioned, tables_seeded, qr_generated, delivery_configured, hardware_registered, notes }`

## Colunas novas
- `brand_theme jsonb` — cores e assets do restaurante
- `site_enabled bool`, `site_template text`, `site_domain text`, `site_status site_status`, `site_last_error text`
- `pos_mode pos_mode` — `counter|tables|hybrid`
- `tables_enabled bool`, `tables_count int`
- `qr_enabled bool`, `qr_style text`
- `delivery_enabled bool`, `delivery_channels jsonb`
- `hardware_profile jsonb`
- `provisioning_flags jsonb`, `provisioning_updated_at timestamptz`

## RPCs
- `update_advanced_setup(p_restaurant_id uuid, p_payload jsonb, p_step text, p_mark_done boolean)`
  - Mescla payload nas colunas acima
  - Atualiza `advanced_progress` e `setup_status`
  - Toca `provisioning_updated_at` quando campos de provisionamento mudam
- `update_wizard_progress` mantém compatibilidade do wizard legado (usa novos estados)
- `mark_wizard_complete` agora seta `setup_status = advanced_done`

## Provisioner (Edge Function `advanced-provisioner`)
- Entrada: `{ restaurant_id, force? }` ou payload `.record.id`
- Ações idempotentes via `provisioning_flags`:
  - `site_enabled` → seta `site_status=live`, marca `site_provisioned`
  - `tables_enabled + tables_count` → marca `tables_seeded`
  - `qr_enabled` → marca `qr_generated`
  - `delivery_enabled` → marca `delivery_configured`
  - `hardware_profile` preenchido → marca `hardware_registered`
- Atualiza `provisioning_updated_at` e devolve logs

## UI
- Quick onboarding grava `setup_status=quick_done` e `pos_mode`
- Banner no Dashboard chama `/settings/advanced-setup` se `setup_status != advanced_done`
- Página `/settings/advanced-setup` salva direto via RPC e dispara o provisioner

## Fluxo recomendado
1) Bootstrap cria restaurante → `setup_status=not_started`
2) Quick onboarding → `setup_status=quick_done`
3) Advanced setup (parcial) → `setup_status=advanced_in_progress`
4) Concluir → `setup_status=advanced_done`
5) Provisioner roda a cada atualização relevante (ou `force`)

## Erros
- Provisioner deve registrar falhas em `site_last_error` (ainda não implementado no worker)
- `site_status` aceita: `off|queued|provisioning|live|error`
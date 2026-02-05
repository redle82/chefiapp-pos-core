# Fluxo de criação de restaurante (Bootstrap → Primeiro produto → Dashboard/TPV)

**Data:** 2026-02-01  
**Estado:** Validado em Docker + Pilot mode (browser + E2E smoke). Ref.: [ONDA_4_PILOTO_P1.md](../pilots/ONDA_4_PILOTO_P1.md), [NEXT_STEPS.md](../../NEXT_STEPS.md).

---

## Resumo

Fluxo linear: **Bootstrap** (criar restaurante) → **Primeiro produto** (opcional) → **Dashboard** ou **TPV**.

- **Backend Docker + sem Supabase Auth:** Bootstrap mostra formulário "Criar o teu restaurante" (nome, tipo, país, contacto). Ao submeter, insert vai por DbWriteGate (PostgREST Core) ou Pilot bypass (mock).
- **Pilot mode:** Ativado automaticamente em bootstrap (Docker, sem sessão). Mock de restaurante (`chefiapp_pilot_mock_restaurant`) e `onboarding_completed_at` tratado como completo permitem aceder a `/op/tpv` e `/app/dashboard` sem Core real.

---

## Passos técnicos

1. **Bootstrap** (`/bootstrap`)  
   - Docker + sem sessão → `setState("create_form")` e `localStorage.setItem("chefiapp_pilot_mode", "true")`.  
   - Submit: user dev `pilot-user-id`; insert `gm_restaurants` + `gm_restaurant_members` via DbWriteGate (Core ou Pilot mock).  
   - Após sucesso: `localStorage` `chefiapp_restaurant_id`, `chefiapp_pilot_mock_restaurant`; navegação para `/onboarding/first-product`.

2. **Primeiro produto** (`/onboarding/first-product`)  
   - Formulário: nome do produto, preço (€).  
   - "Criar e abrir TPV" → insert `gm_products` (DbWriteGate; Pilot mock guarda em `chefiapp_pilot_mock_products`) → navegação para `/op/tpv`.  
   - "Continuar sem adicionar agora" → navegação para `/app/dashboard`.

3. **FlowGate / getRestaurantStatus**  
   - Em Docker, se existir `chefiapp_pilot_mock_restaurant` com o mesmo `restaurantId`, devolve mock (com `onboarding_completed_at` definido para permitir TRIAL e acesso a `/op/tpv`).

4. **RuntimeReader (fetchRestaurant / fetchRestaurantForIdentity)**  
   - Se existir `chefiapp_pilot_mock_restaurant` com o mesmo id, devolve mock (evita "Restaurant not found in Core" e limpeza do id).

---

## Ficheiros relevantes

- `merchant-portal/src/pages/BootstrapPage.tsx` — formulário criar restaurante; Docker sem sessão → create_form; localStorage pilot + mock após insert.
- `merchant-portal/src/pages/Onboarding/FirstProductPage.tsx` — primeiro produto; navegação para `/op/tpv` ou `/app/dashboard`.
- `merchant-portal/src/core/governance/DbWriteGate.ts` — Pilot bypass; mock `gm_restaurants` → `chefiapp_pilot_mock_restaurant`.
- `merchant-portal/src/core/billing/coreBillingApi.ts` — `getRestaurantStatus`: em Docker, lê pilot mock; devolve `onboarding_completed_at` para permitir TRIAL.
- `merchant-portal/src/core-boundary/readers/RuntimeReader.ts` — `fetchRestaurant` / `fetchRestaurantForIdentity`: em browser, lê pilot mock.

---

## Validação

- **Browser:** `/bootstrap` → preencher nome → "Criar e continuar" → `/onboarding/first-product` → "Continuar sem adicionar agora" → `/dashboard`; ou "Criar e abrir TPV" (nome + preço) → `/op/tpv`.
- **E2E:** `E2E_NO_WEB_SERVER=1 npm run test:e2e:smoke --workspace=merchant-portal` (11 testes).

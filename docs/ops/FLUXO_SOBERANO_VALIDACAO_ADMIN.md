# Validação P0.2 — Fluxo soberano no Admin (Supabase/Core)

Este runbook descreve como **validar** que o fluxo soberano está a funcionar no Admin com o utilizador criado pelo seed canónico, e como preparar o próximo elo (Devices / TPV pairing).

**Pré-requisito:** Seed canónico executado com sucesso. Ver `docs/ops/SEED_OWNER_SOBERANO.md`.

---

## 1. Correr o seed canónico

**Requisito para P0.2 completo:** O seed cria company + restaurant + membership **só** quando usa **Service Role Key**. Com apenas `VITE_SUPABASE_ANON_KEY`, o script cria o user via `signUp` mas:
- Se o Supabase tiver "Confirm email" ativo, não há sessão e o script termina em erro.
- Não insere em `gm_companies`, `gm_restaurants` nem `gm_restaurant_members`.

Para validação P0.2: adiciona ao `.env.local` (apenas local, nunca commitar):

- `SUPABASE_SERVICE_ROLE_KEY=<service_role do projeto>` (obtém em Supabase Dashboard → Project Settings → API).

Depois, na pasta do portal:

```bash
cd merchant-portal
pnpm tsx scripts/seed-e2e-user.ts
```

Anota o **email** e **password** impressos no final. O script também guarda credenciais em `merchant-portal/tests/e2e/e2e-creds.json` (opcional).

---

## 2. Garantir que a app usa o mesmo backend

No `merchant-portal`:

- `.env.local` (ou variáveis de ambiente) deve ter **para o fluxo soberano P0**:
  - `VITE_SUPABASE_URL` — URL do projeto Supabase (ex.: `https://xxx.supabase.co`). **Quando a URL contém `supabase.co`, o portal usa este backend como CORE** e login por **email/palavra-passe** (fluxo soberano P0), mesmo que `VITE_CORE_URL` esteja definido (ex.: para Docker).
  - `VITE_SUPABASE_ANON_KEY` — chave anon desse projeto.

Se o seed foi feito contra um Supabase remoto, a app tem de apontar para o mesmo projeto. No arranque, a consola do browser deve mostrar `[CONFIG] Loaded { ..., isSupabaseBackend: true }`; se mostrar `isSupabaseBackend: false` e `CORE_URL: 'http://localhost:3001'`, o portal está a usar Docker — confirma que `VITE_SUPABASE_URL` está definido e contém `supabase.co`.

---

## 3. Subir o merchant-portal

```bash
pnpm --filter merchant-portal run dev
```

Abrir no browser: `http://localhost:5175` (ou a porta indicada).

---

## 4. Login real no Admin

1. Ir a **`/auth/login`** (ou à página de login que a app usar para Supabase).
2. Inserir o **email** e **password** do seed.
3. Confirmar que o login conclui e que és redireccionado para o Admin (ex.: `/admin/modules` ou dashboard).

---

## 5. Validar que o restaurante está ligado ao owner

1. Em **`/admin/modules`** (ou equivalente):
   - A **topbar** deve mostrar o **nome do utilizador** (ex.: "Sovereign Tester") e o **restaurante** (ex.: "Sovereign Burger Hub" ou o nome criado pelo seed).
   - O dropdown do perfil deve mostrar o mesmo utilizador e papel (ex.: Owner).

2. Verificar que:
   - não estás em modo "Sessão encerrada" (ou seja, a sessão está activa),
   - o restaurante visível é o que foi criado pelo seed,
   - não dependes de pilot/trial para ver dados (opcional: limpar `chefiapp_pilot_mode` / `chefiapp_trial_mode` e repetir o login para garantir que entras só com o user seeded).

Se isto se verificar, o **fluxo soberano no Admin** está validado: user real, restaurante real, membership owner, e Admin coerente.

---

## 6. Próximo elo — Devices / TPV pairing

Com o fluxo soberano validado no Admin:

1. Em **`/admin/modules`**, no módulo **Software TPV**, usar o CTA **"Gerir TPVs"** (ou "Manage devices") para ir à página de dispositivos TPV.
2. Na página de devices TPV:
   - Criar um terminal TPV (nome, etc.),
   - Gerar **código de pairing** (ou token),
   - Seguir as instruções para emparelhar o app desktop TPV (ou, em dev, o fluxo de pairing em uso).

O objectivo do próximo microciclo é fechar este elo (Devices → TPV pairing) e, em seguida, KDS e AppStaff, sempre sob o mesmo tenant/identidade.

---

## 7. Resumo de critérios de sucesso (P0.2)

- [ ] Seed canónico executado; credenciais anotadas.
- [ ] App configurada para o mesmo backend (Supabase/Core).
- [ ] Login em `/auth/login` com sucesso.
- [ ] Topbar mostra o utilizador e o restaurante correctos.
- [ ] Restaurante visível é o do seed (membership owner).
- [ ] Pronto para atacar Devices / TPV pairing no próximo passo.

# Entrega — Ambiente ENTERPRISE local (Core Docker)

**Data:** 2026-02-03
**Objetivo:** Core local como autoridade única, restaurante ENTERPRISE funcional no banco, sem mocks.

---

## 1. Checklist do que foi criado

| Item                                                                                                                                         | Estado                           |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Core no ar (Postgres 54320, PostgREST 3001, Realtime 4000)                                                                                   | ✅                               |
| Schema aplicado (core_schema, 03-migrations, 04-modules, 05-device-kinds, **05.1-onboarding-persistence**, 06-seed-enterprise)               | ✅                               |
| Seed dev (tenant, restaurante piloto, categorias, produtos, mesas)                                                                           | ✅                               |
| Seed ENTERPRISE (status=active, product_mode=live, billing_status=trial; caixa aberto; 11 módulos; setup_status; horários; **membro owner**) | ✅                               |
| Frontend apontar para Core + auth com user_id seed para Bootstrap                                                                            | Pendente (configurar auth)       |
| Fluxo TPV → KDS → Pagar validado ponta a ponta                                                                                               | Pendente (executar com frontend) |

---

## 2. Alterações realizadas

### Docker Compose

- **Ficheiro:** `docker-core/docker-compose.core.yml`
- **Alteração:** Inclusão da migração de onboarding no init do Postgres:
  - `./schema/migrations/20260127_onboarding_persistence.sql` → `/docker-entrypoint-initdb.d/05.1-onboarding-persistence.sql`
- **Motivo:** As colunas `country`, `timezone`, `currency`, `locale`, `type` em `gm_restaurants` e as tabelas `restaurant_schedules`, `restaurant_setup_status`, `restaurant_zones` são criadas por esta migração; o seed enterprise (06) depende delas.

### Seed enterprise

- **Ficheiro:** `docker-core/schema/06-seed-enterprise.sql`
- **Alteração:** Inserção de um **membro owner** (gm_restaurant_members) com `user_id = 00000000-0000-0000-0000-000000000002` e `role = owner`, para que o Bootstrap/FlowGate reconheçam um utilizador ligado ao restaurante piloto.
- **Uso local:** Configurar auth (ex.: Supabase Auth) para que o utilizador de teste tenha id `00000000-0000-0000-0000-000000000002`, ou criar um user com este UUID em ambiente de desenvolvimento.

### Documentação

- **Ficheiro:** `docs/strategy/ENTERPRISE_LOCAL_SETUP.md`
- **Alterações:** Ordem de init atualizada (05.1-onboarding-persistence), descrição do seed member, checklist parcialmente preenchido, estado final com gm_restaurant_members.

---

## 3. Logs principais (init Postgres)

Trecho dos logs do container `chefiapp-core-postgres` após `docker compose up -d` com volume novo:

```
/usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/05.1-onboarding-persistence.sql
ALTER TABLE
ALTER TABLE
...
CREATE TABLE
CREATE INDEX
...
CREATE FUNCTION
COMMENT

/usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/06-seed-enterprise.sql
UPDATE 1
INSERT 0 1
INSERT 0 11
INSERT 0 1
INSERT 0 6
INSERT 0 1

PostgreSQL init process complete; ready for start up.
```

(Com o novo bloco do membro, um init limpo adicional mostrará também `INSERT 0 1` para gm_restaurant_members.)

---

## 4. Estado final do restaurante no Core

Consultas executadas após subir o Core com volume limpo e (na base já em execução) inserção manual do membro owner.

### gm_restaurants

| id (piloto)                          | name               | status | product_mode | billing_status | country  | timezone      | currency |
| ------------------------------------ | ------------------ | ------ | ------------ | -------------- | -------- | ------------- | -------- |
| 00000000-0000-0000-0000-000000000100 | Restaurante Piloto | active | live         | trial          | Portugal | Europe/Lisbon | EUR      |

### gm_cash_registers

| id     | name            | status | opened_at      |
| ------ | --------------- | ------ | -------------- |
| (uuid) | Caixa Principal | open   | t (preenchido) |

### installed_modules

11 linhas: tpv, kds, tasks, appstaff, health, alerts, config, dashboard, restaurant-web, menu, system-tree (todos active).

### restaurant_setup_status

`sections`: `{"menu":true,"people":true,"publish":true,"identity":true,"location":true,"payments":true,"schedule":true}`

### restaurant_schedules

| day_of_week   | open | start_time | end_time |
| ------------- | ---- | ---------- | -------- |
| 0 (Dom)       | f    | 00:00      | 00:00    |
| 1–6 (Seg–Sáb) | t    | 09:00      | 22:00    |

### gm_restaurant_members

| restaurant_id (piloto)               | user_id                              | role  |
| ------------------------------------ | ------------------------------------ | ----- |
| 00000000-0000-0000-0000-000000000100 | 00000000-0000-0000-0000-000000000002 | owner |

### Portas

| Serviço               | Host  | Container |
| --------------------- | ----- | --------- |
| Postgres              | 54320 | 5432      |
| PostgREST (via nginx) | 3001  | 3000      |
| Realtime              | 4000  | 4000      |

PostgREST verificado: `GET /gm_restaurants?id=eq.00000000-0000-0000-0000-000000000100` → 200.

---

## 5. Próximos passos (validação E2E)

1. **Auth:** Garantir que o utilizador de teste tem `id = 00000000-0000-0000-0000-000000000002` (ex.: Supabase Auth local com user criado com este UUID).
2. **Frontend:** `cd merchant-portal && npm run dev`; `VITE_SUPABASE_URL` a apontar para o Core (ex.: proxy `/rest` → `http://localhost:3001`).
3. **Fluxo:** Login → Bootstrap (deve reconhecer membership e restaurante active) → Dashboard/Config → TPV (caixa já aberto no seed) → criar pedido → enviar à cozinha → KDS → marcar pronto → TPV → pagar → fechar.
4. **Validação no banco:** Estados em `gm_orders`, `gm_order_items` (ready_at), `gm_payments`; nenhuma escrita direta fora de RPCs.

Referência completa do setup: `docs/strategy/ENTERPRISE_LOCAL_SETUP.md`.

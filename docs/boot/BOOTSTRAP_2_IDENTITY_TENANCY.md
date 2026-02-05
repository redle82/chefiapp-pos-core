# Bootstrap 2 — Identity & Tenancy Boot

Criar identidade e permissão. Keycloak realm + clients; roles (Owner, Manager, Staff, Kitchen, Customer); entidades tenant, user, memberships. Saída: **quem é quem no mundo**.

---

## Purpose

Garantir que o sistema sabe quem é quem: tenants, utilizadores, papéis e associações (user–store, memberships). Auth (Keycloak) e dados de tenancy no Core ficam alinhados para que o runtime possa aplicar permissões.

---

## Inputs

- **Boot 0** — Keycloak a correr (porta 8080).
- **Boot 1** — Schema com tabelas de tenant/user/memberships (conforme WORLD_SCHEMA_v1 ou equivalente: saas_tenants, gm_restaurants, gm_restaurant_members, etc.).

---

## Outputs

- Keycloak: realm configurado; client(s) para o merchant portal / TPV / KDS; roles mapeados (Owner, Manager, Staff, Kitchen, Customer).
- Core: tenant(s) de teste; restaurante(s) associados; utilizadores e memberships (ou seeds que permitam primeiro login).
- **Saída semântica:** “quem é quem no mundo”.

---

## Invariants

- Nenhum acesso operacional (TPV/KDS) sem identidade válida quando o sistema exigir auth.
- Roles são consistentes entre Keycloak e regras do Core (ex.: apenas Owner/Manager podem fechar caixa).

---

## Commands

- **Keycloak** — Acesso admin: `http://localhost:8080` (KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD conforme docker-compose). Criação de realm, client, roles é manual ou via script/import (dependendo do que existir no repo).
- **Core (tenancy/users)** — Se existirem seeds em [docker-core/schema/](../../docker-core/schema/) (ex.: 06-seed-enterprise.sql, patch_gm_restaurant_members.sql), são aplicados no initdb (Boot 1). Para adicionar utilizadores em desenvolvimento, usar SQL ou RPC conforme schema.

Referência: [docker-core/docker-compose.core.yml](../../docker-core/docker-compose.core.yml) (serviço keycloak).

---

## Smoke tests

1. **Keycloak responde** — `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` retorna 200 ou 302.
2. **Realm existe** — Login no admin console; realm criado (nome conforme configuração).
3. **Tenant/restaurante no Core** — `SELECT id FROM gm_restaurants LIMIT 1;` retorna pelo menos o seed; tabela saas_tenants tem linha(s) se existir.
4. **Memberships (se aplicável)** — Se gm_restaurant_members existir, há pelo menos uma linha para o restaurante seed ou documentação de como criar o primeiro owner.
5. **Auth adapter no portal** — Merchant portal em modo Docker usa Keycloak (authAdapter/authKeycloak); login (ou bypass em dev) não quebra.

# Runbook — Core local (Docker)

Como subir o Docker Core, verificar saúde e confirmar que o restaurante e o menu estão prontos para operar TPV/KDS.

---

## 1. Subir o Docker Core

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

Serviços: Postgres (54320), PostgREST via nginx (3001), Realtime (4000).

---

## 2. Verificar saúde

### PostgREST (API REST)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
# Esperado: 200 ou 404 (PostgREST responde)
```

Ou no browser: `http://localhost:3001/` — deve responder (não 502/connection refused).

### Postgres (opcional)

```bash
docker exec chefiapp-core-postgres pg_isready -U postgres
# Esperado: accepting connections
```

---

## 3. Confirmar restaurante e menu publicado

### Restaurante existe

```bash
curl -s "http://localhost:3001/rest/v1/gm_restaurants?select=id,name,status&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Accept: application/json"
```

Ou no Postgres:

```sql
docker exec -it chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT id, name, status, product_mode FROM gm_restaurants LIMIT 1;"
```

### Menu publicado

O menu está “publicado” quando o restaurante está `status = active` e tem produtos em `gm_products`. Verificar:

```sql
SELECT COUNT(*) FROM gm_products WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';
```

### Caixa aberto (turno)

```sql
SELECT id, name, status, opened_at
FROM gm_cash_registers
WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' AND status = 'open';
```

Se não houver linha com `status = 'open'`, abrir o turno no TPV (botão “Abrir Turno”) ou via RPC `open_cash_register_atomic`.

### Erro "gm_cash_registers violates foreign key constraint restaurant_id_fkey"

O Core com seed **só tem um restaurante**: `00000000-0000-0000-0000-000000000100`. Se o frontend estiver a usar outro `restaurant_id` (ex.: criado num bootstrap anterior), o RPC `open_cash_register_atomic` falha com FK.

**Solução:** Usar o restaurante seed. Limpar o estado do frontend (localStorage/session do restaurante) e voltar a entrar com o piloto; ou garantir que o TPV está associado ao restaurante seed. O membro owner do seed tem `user_id = 00000000-0000-0000-0000-000000000002`.

---

## 4. Reset completo (volume limpo)

Para aplicar de novo todos os scripts de init (schema + seeds):

```bash
cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

Os scripts em `docker-entrypoint-initdb.d/` só correm na **primeira** criação do volume.

---

## Referências

- **Setup ENTERPRISE local:** `docs/strategy/ENTERPRISE_LOCAL_SETUP.md`
- **Entrega Core local:** `docs/strategy/ENTREGA_ENTERPRISE_LOCAL_2026-02-03.md`

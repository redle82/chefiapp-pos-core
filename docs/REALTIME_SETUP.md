# Realtime Setup — Docker Core

**Status:** ✅ Configurado

## Configuração

### 1. PostgreSQL `wal_level`

O PostgreSQL precisa ter `wal_level = 'logical'` para o Realtime funcionar.

**Configurado em:** `docker-core/docker-compose.core.yml`
```yaml
postgres:
  command: postgres -c wal_level=logical
```

**Verificar:**
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SHOW wal_level;"
# Deve retornar: logical
```

### 2. Publicação PostgreSQL

O Realtime precisa de uma publicação PostgreSQL para escutar mudanças.

**Script:** `docker-core/schema/realtime_setup.sql`

**Executar:**
```bash
docker exec -i chefiapp-core-postgres psql -U postgres -d chefiapp_core < docker-core/schema/realtime_setup.sql
```

**Verificar:**
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"
```

### 3. Realtime Service

O Realtime está configurado em `docker-compose.core.yml` na porta `4000`.

**URL:** `ws://localhost:4000`

**Verificar logs:**
```bash
docker logs chefiapp-core-realtime --tail 20
```

## Uso no Frontend

### KDS Minimal

O `KDSMinimal.tsx` já está configurado para usar Realtime:

```typescript
const channel = dockerCoreClient
  .channel(`kds_minimal_orders_${RESTAURANT_ID}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'gm_orders',
    filter: `restaurant_id=eq.${RESTAURANT_ID}`,
  }, (payload) => {
    // Atualizar pedidos automaticamente
  })
  .subscribe();
```

**Indicador visual:** O KDS mostra o status do Realtime (🟢 Realtime Ativo / 🔴 DISCONNECTED)

### Fallback

O KDS usa polling de fallback (30s) caso o Realtime falhe, garantindo que os pedidos sejam atualizados mesmo sem WebSocket.

## Troubleshooting

### Realtime não conecta

1. Verificar se `wal_level = 'logical'`:
   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SHOW wal_level;"
   ```

2. Verificar se a publicação existe:
   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';"
   ```

3. Verificar logs do Realtime:
   ```bash
   docker logs chefiapp-core-realtime --tail 20
   ```

4. Reiniciar Realtime:
   ```bash
   cd docker-core && docker compose -f docker-compose.core.yml restart realtime
   ```

### Erro "wal_level is insufficient"

Se você ver este erro, o PostgreSQL precisa ser reiniciado com `wal_level=logical`:

```bash
cd docker-core
docker compose -f docker-compose.core.yml down postgres
docker compose -f docker-compose.core.yml up -d postgres
```

**Nota:** Isso pode causar perda de dados se houver volumes não persistidos. Em desenvolvimento, isso é aceitável.

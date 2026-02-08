# Correção do Realtime - ChefIApp Core

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## Problema Identificado

O container `chefiapp-core-realtime` estava em loop de restart com dois erros:

1. **Erro 1:** `APP_NAME not available`

   - Versão antiga do Realtime (v2.25.35) tinha problema com leitura de variáveis
   - Variável `APP_NAME` não estava sendo lida corretamente

2. **Erro 2:** `no schema has been selected to create in`
   - Schema `_realtime` não existia no banco de dados
   - Realtime precisa deste schema para criar suas tabelas de migração

---

## Soluções Aplicadas

### 1. Atualização da Versão do Realtime

**Antes:**

```yaml
image: supabase/realtime:v2.25.35
```

**Depois:**

```yaml
image: supabase/realtime:v2.34.47
```

**Motivo:** Versão mais recente corrige problemas com leitura de variáveis de ambiente.

---

### 2. Ajuste da Configuração

**Adicionadas variáveis conforme exemplo oficial do Supabase:**

```yaml
environment:
  APP_NAME: realtime # Mudado de "chefiapp" para "realtime"
  ERL_AFLAGS: -proto_dist inet_tcp
  DNS_NODES: "''"
  RLIMIT_NOFILE: "10000"
```

**Reordenadas variáveis** para garantir ordem correta de leitura.

---

### 3. Criação do Schema `_realtime`

**Comando executado:**

```sql
CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT ALL ON SCHEMA _realtime TO postgres;
```

**Adicionado ao schema oficial:**

- Schema `_realtime` agora é criado automaticamente no `core_schema.sql`
- Garante que o Realtime sempre tenha o schema necessário

---

## Status Final

### Containers

| Container                 | Status     | Porta   |
| ------------------------- | ---------- | ------- |
| `chefiapp-core-postgres`  | ✅ Healthy | `54320` |
| `chefiapp-core-postgrest` | ✅ Running | `3001`  |
| `chefiapp-core-realtime`  | ✅ Running | `4000`  |

### Logs do Realtime

```
[info] Running RealtimeWeb.Endpoint with cowboy 2.12.0 at :::4000 (http)
[info] Access RealtimeWeb.Endpoint at http://realtime.fly.dev
```

✅ **Realtime está funcionando corretamente!**

---

## Validação

### Teste de Conectividade

```bash
# Verificar status
docker ps --filter "name=chefiapp-core-realtime"

# Ver logs
docker logs chefiapp-core-realtime -f

# Testar endpoint (pode retornar 404, mas significa que está rodando)
curl http://localhost:4000/
```

### Próximos Passos

1. ✅ Realtime corrigido
2. ⏳ Validar que KDS recebe atualizações via Realtime
3. ⏳ Testar sincronização em tempo real no TPV

---

## Arquivos Modificados

1. `docker-core/docker-compose.core.yml`

   - Atualizada versão do Realtime: `v2.25.35` → `v2.34.47`
   - Ajustada configuração de variáveis de ambiente
   - `APP_NAME` mudado para `realtime`

2. `docker-core/schema/core_schema.sql`
   - Adicionada criação do schema `_realtime`
   - Garante que schema existe em novas instalações

---

## Comandos Úteis

### Reiniciar Realtime

```bash
cd docker-core
docker compose -f docker-compose.core.yml restart realtime
```

### Ver Logs

```bash
docker logs chefiapp-core-realtime -f
```

### Recriar Container

```bash
cd docker-core
docker compose -f docker-compose.core.yml stop realtime
docker compose -f docker-compose.core.yml rm -f realtime
docker compose -f docker-compose.core.yml up -d realtime
```

---

**Última atualização:** 2026-01-25

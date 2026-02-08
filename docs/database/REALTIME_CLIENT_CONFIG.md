# Configuração do Cliente Supabase para Realtime (Docker Core)

**Data:** 2026-01-25
**Status:** ✅ Configurado

---

## Problema

O cliente Supabase (`@supabase/supabase-js`) espera que o Realtime esteja na mesma URL base do PostgREST, mas no Docker Core:

- **PostgREST:** `http://localhost:3001`
- **Realtime:** `ws://localhost:4000`

---

## Solução

O cliente Supabase detecta automaticamente o endpoint do Realtime baseado na URL base. Para self-hosted Realtime, ele tenta:

1. `ws://localhost:4000/socket/websocket` (formato Phoenix/Elixir)
2. `ws://localhost:4000/realtime/v1/websocket` (formato Supabase cloud)

O Realtime do Supabase (v2.34.47) usa o formato Phoenix, então o cliente deve conectar automaticamente.

---

## Configuração Atual

**Arquivo:** `merchant-portal/src/core/supabase/index.ts`

```typescript
export const supabase = createClient<Database>(
  CONFIG.SUPABASE_URL, // http://localhost:3001
  CONFIG.SUPABASE_ANON_KEY,
  {
    realtime: {
      // Configuração automática para Docker Core
    },
  },
);
```

**Variáveis de Ambiente:** `merchant-portal/.env`

```env
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

---

## Como Funciona

1. **Cliente Supabase** recebe `http://localhost:3001` como URL base
2. **Detecta** que é self-hosted (não é `*.supabase.co`)
3. **Tenta conectar** ao Realtime em `ws://localhost:4000/socket/websocket`
4. **Usa** `VITE_SUPABASE_ANON_KEY` como `apikey` no WebSocket

---

## Validação

### 1. Verificar se Realtime está rodando

```bash
docker ps --filter "name=chefiapp-core-realtime"
# Deve mostrar: Up X seconds
```

### 2. Verificar logs do Realtime

```bash
docker logs chefiapp-core-realtime -f
# Deve mostrar: "Running RealtimeWeb.Endpoint with cowboy 2.12.0 at :::4000"
```

### 3. Testar conexão WebSocket (manual)

```bash
# Usando wscat (se instalado)
wscat -c "ws://localhost:4000/socket/websocket?apikey=chefiapp-core-secret-key-min-32-chars-long&vsn=2.0.0"
```

### 4. Testar no KDS

1. Abrir KDS no navegador
2. Verificar console do navegador
3. Procurar por mensagens de conexão Realtime
4. Criar pedido e verificar se KDS atualiza automaticamente

---

## Troubleshooting

### Problema: Realtime não conecta

**Sintomas:**

- KDS não atualiza automaticamente
- Console mostra: `CHANNEL_ERROR` ou `TIMED_OUT`
- Logs do Realtime não mostram conexões

**Soluções:**

1. **Verificar se Realtime está rodando:**

   ```bash
   docker ps --filter "name=chefiapp-core-realtime"
   ```

2. **Verificar logs do Realtime:**

   ```bash
   docker logs chefiapp-core-realtime -f
   ```

3. **Verificar se schema `_realtime` existe:**

   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\dn" | grep realtime
   ```

4. **Reiniciar Realtime:**
   ```bash
   cd docker-core
   docker compose -f docker-compose.core.yml restart realtime
   ```

### Problema: CORS ou conexão bloqueada

**Sintomas:**

- Erro no console: `CORS` ou `WebSocket connection failed`

**Soluções:**

1. Verificar se Realtime está acessível:

   ```bash
   curl http://localhost:4000/
   # Deve retornar "Not Found" (isso é normal)
   ```

2. Verificar firewall/portas:
   ```bash
   lsof -i :4000
   # Deve mostrar processo escutando na porta 4000
   ```

---

## Referências

- [Supabase Realtime Self-hosting](https://supabase.com/docs/guides/self-hosting/realtime/config)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/initializing)
- [Realtime Protocol](https://supabase.com/docs/guides/realtime/protocol)

---

**Última atualização:** 2026-01-25

**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 Fix: Realtime WebSocket — Erro de Conexão

**Data:** 2026-01-25  
**Status:** ✅ Corrigido (Realtime Desabilitado Temporariamente)

---

## 🔴 Problema

O cliente Supabase estava tentando conectar em:
```
ws://localhost:3001/realtime/v1/websocket
```

Mas o Realtime está rodando em:
```
ws://localhost:4000/socket/websocket
```

**Resultado:** Múltiplos erros `CHANNEL_ERROR` no console, WebSocket não conecta.

---

## ✅ Solução Implementada

### 1. Realtime Desabilitado Temporariamente

**Arquivo:** `merchant-portal/src/core-boundary/docker-core/connection.ts`
- Realtime desabilitado no `dockerCoreClient`
- Comentários explicando o problema

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`
- Realtime subscription desabilitada
- Polling (30s) como única forma de atualização
- Status do Realtime definido como `'CLOSED'`

### 2. Polling como Solução Temporária

O KDS agora usa **apenas polling (30s)** para atualizar pedidos.

**Vantagens:**
- ✅ Elimina erros no console
- ✅ Sistema funciona corretamente
- ✅ Pedidos são atualizados a cada 30s

**Desvantagens:**
- ⚠️ Não é tempo real (latência de até 30s)
- ⚠️ Mais carga no servidor

---

## 🔍 Causa Raiz

O cliente Supabase (`@supabase/supabase-js`) constrói a URL do WebSocket automaticamente baseado na URL base:

```typescript
// URL base: http://localhost:3001
// WebSocket construído: ws://localhost:3001/realtime/v1/websocket
```

Mas nosso Realtime está em uma porta separada:
```
ws://localhost:4000/socket/websocket
```

O cliente Supabase **não permite configurar a URL do WebSocket diretamente**.

---

## 🚀 Soluções Permanentes

### Opção 1: Proxy Reverso (RECOMENDADO)

Configurar um proxy reverso (nginx/traefik) no docker-compose para que `/realtime` na porta 3001 aponte para o Realtime na porta 4000.

**Exemplo:**
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "3001:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - postgrest
      - realtime
```

**nginx.conf:**
```nginx
location /realtime {
    proxy_pass http://realtime:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Opção 2: Cliente Customizado

Criar um cliente customizado que sobrescreve a construção da URL do WebSocket.

**Complexidade:** Alta  
**Manutenibilidade:** Baixa

### Opção 3: Manter Apenas Polling

Manter apenas polling, sem Realtime.

**Vantagens:** Simples, funciona sempre  
**Desvantagens:** Não é tempo real

---

## 📊 Status Atual

- ✅ **KDS funciona** (polling de 30s)
- ✅ **Sem erros no console**
- ✅ **Pedidos aparecem** (atualização a cada 30s)
- ⚠️ **Não é tempo real** (latência de até 30s)

---

## 🧪 Como Testar

1. Abrir KDS: `http://localhost:5173/kds-minimal`
2. Verificar que **não há erros** de WebSocket no console
3. Criar um pedido no TPV ou Web
4. Verificar que o pedido aparece no KDS (dentro de 30s)

---

## 📝 Notas

- O polling de 30s é aceitável para desenvolvimento
- Para produção, recomenda-se implementar Opção 1 (Proxy Reverso)
- O Realtime pode ser reativado após configurar o proxy

---

**Última atualização:** 2026-01-25

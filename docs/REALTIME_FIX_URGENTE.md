# ⚠️ REALTIME — Problema de URL do WebSocket

**Status:** 🔴 Realtime Desabilitado Temporariamente  
**Data:** 2026-01-25

---

## 🔴 Problema Identificado

O cliente Supabase está tentando conectar em:
```
ws://localhost:3001/realtime/v1/websocket
```

Mas o Realtime está rodando em:
```
ws://localhost:4000/socket/websocket
```

**Causa:** O cliente Supabase constrói a URL do WebSocket automaticamente baseado na URL base (`http://localhost:3001`), mas o Realtime está em uma porta separada (4000).

---

## ✅ Solução Temporária Implementada

**Realtime desabilitado** e usando apenas **polling (30s)**.

### Alterações Realizadas

1. **`connection.ts`:**
   - Realtime desabilitado no `dockerCoreClient`
   - Comentários explicando o problema

2. **`KDSMinimal.tsx`:**
   - Realtime subscription desabilitada
   - Polling (30s) como única forma de atualização
   - Status do Realtime definido como `'CLOSED'`

---

## 🔧 Soluções Permanentes Possíveis

### Opção 1: Proxy Reverso no Docker Compose (RECOMENDADO)

Configurar um proxy reverso (nginx/traefik) para que `/realtime` na porta 3001 aponte para o Realtime na porta 4000.

**Vantagens:**
- Mantém compatibilidade com cliente Supabase
- Não requer mudanças no frontend
- URL padrão funciona

**Desvantagens:**
- Requer configuração adicional no docker-compose
- Mais complexo

### Opção 2: Ajustar URL Base do Cliente

Criar um cliente separado para Realtime usando URL base que aponte para porta 4000.

**Vantagens:**
- Simples de implementar
- Não requer mudanças no docker-compose

**Desvantagens:**
- Dois clientes (um para REST, outro para Realtime)
- Mais complexo de gerenciar

### Opção 3: Usar Apenas Polling

Manter apenas polling, sem Realtime.

**Vantagens:**
- Simples
- Funciona sempre

**Desvantagens:**
- Latência maior (30s)
- Mais carga no servidor
- Não é tempo real

---

## 📊 Impacto Atual

### Funcionalidade
- ✅ **KDS funciona** (usando polling de 30s)
- ✅ **Pedidos aparecem** (atualização a cada 30s)
- ⚠️ **Não é tempo real** (latência de até 30s)

### Performance
- ✅ **Aceitável** para desenvolvimento
- ⚠️ **Pode ser melhorado** com Realtime funcionando

---

## 🚀 Próximos Passos

1. **Decidir solução permanente:**
   - Proxy reverso (Opção 1) - RECOMENDADO
   - Cliente separado (Opção 2)
   - Apenas polling (Opção 3)

2. **Implementar solução escolhida**

3. **Testar Realtime funcionando**

4. **Remover polling ou manter como fallback**

---

## 🔍 Verificações

### Verificar se Realtime está rodando
```bash
docker ps | grep chefiapp-core-realtime
```

### Verificar logs do Realtime
```bash
docker logs chefiapp-core-realtime --tail 20
```

### Testar conexão WebSocket manualmente
```bash
# O Realtime está em ws://localhost:4000/socket/websocket
# Mas o cliente Supabase tenta ws://localhost:3001/realtime/v1/websocket
```

---

**Última atualização:** 2026-01-25

# Validação do Realtime - ChefIApp Core

**Data:** 2026-01-25
**Status:** ✅ Configurado e Pronto para Validação

---

## ✅ Correções Aplicadas

1. **Realtime corrigido:**

   - Versão atualizada: `v2.25.35` → `v2.34.47`
   - Schema `_realtime` criado
   - Configuração ajustada conforme exemplo oficial

2. **Cliente Supabase configurado:**
   - Detecta automaticamente Docker Core
   - Conecta ao Realtime em `ws://localhost:4000`

---

## 🧪 Como Validar

### Passo 1: Verificar Serviços

```bash
cd docker-core
docker compose -f docker-compose.core.yml ps
```

**Deve mostrar:**

- `chefiapp-core-postgres` - Healthy
- `chefiapp-core-postgrest` - Running
- `chefiapp-core-realtime` - Running

---

### Passo 2: Abrir KDS

1. Iniciar frontend (se não estiver rodando):

   ```bash
   cd merchant-portal
   npm run dev
   ```

2. Abrir KDS no navegador:

   ```
   http://localhost:5173/app/kds
   ```

3. Abrir Console do Navegador (F12)

---

### Passo 3: Verificar Conexão Realtime

No console do navegador, procurar por:

**✅ Sucesso:**

```
[OrderContext] Setting up Realtime subscription
[OrderContext] Realtime event received
Realtime Status: SUBSCRIBED
```

**❌ Problema:**

```
Realtime Status: CLOSED
Realtime Status: CHANNEL_ERROR
Realtime Status: TIMED_OUT
```

---

### Passo 4: Testar Sincronização

1. **Criar pedido via TPV ou Web:**

   - Abrir TPV em outra aba
   - Criar um pedido
   - Voltar para KDS

2. **Verificar atualização automática:**

   - ✅ KDS deve mostrar pedido **sem refresh**
   - ✅ Console deve mostrar: `Realtime event received`

3. **Testar mudança de status:**
   - Clicar em "INICIAR PREPARO" no KDS
   - Pedido deve mudar de "NOVO" para "EM PREPARO"
   - Verificar se atualiza em tempo real

---

## 📊 Checklist de Validação

- [ ] Realtime container está rodando
- [ ] KDS abre sem erros
- [ ] Console mostra "SUBSCRIBED"
- [ ] Pedido criado aparece automaticamente no KDS
- [ ] Mudança de status sincroniza em tempo real
- [ ] Sem erros no console do navegador
- [ ] Logs do Realtime mostram conexões

---

## 🔍 Logs Úteis

### Logs do Realtime

```bash
docker logs chefiapp-core-realtime -f
```

**Deve mostrar:**

```
[info] Running RealtimeWeb.Endpoint with cowboy 2.12.0 at :::4000 (http)
[notice] SYN[realtime@127.0.0.1] Adding node to scope...
```

### Console do Navegador

**Procurar por:**

- `[OrderContext]` - Logs do contexto de pedidos
- `Realtime Status:` - Status da conexão
- `Realtime event received` - Eventos recebidos

---

## ⚠️ Problemas Comuns

### 1. Realtime não conecta

**Sintoma:** Status `CLOSED` ou `TIMED_OUT`

**Solução:**

```bash
# Verificar se Realtime está rodando
docker ps --filter "name=chefiapp-core-realtime"

# Reiniciar se necessário
cd docker-core
docker compose -f docker-compose.core.yml restart realtime
```

### 2. Pedidos não aparecem automaticamente

**Sintoma:** KDS não atualiza sem refresh

**Verificar:**

- Console mostra `SUBSCRIBED`?
- Logs do Realtime mostram conexões?
- Schema `_realtime` existe?

**Solução:**

```bash
# Verificar schema
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\dn" | grep realtime

# Se não existir, criar
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "CREATE SCHEMA IF NOT EXISTS _realtime;"
```

### 3. Erro de CORS

**Sintoma:** Erro no console sobre CORS

**Solução:**

- Verificar se frontend está em `http://localhost:5173`
- Verificar se Realtime está em `ws://localhost:4000`
- Não deve haver problemas de CORS com WebSocket

---

## ✅ Critérios de Sucesso

**Realtime está funcionando se:**

1. ✅ Container está rodando
2. ✅ KDS mostra status `SUBSCRIBED`
3. ✅ Pedidos aparecem automaticamente
4. ✅ Mudanças de status sincronizam
5. ✅ Sem erros no console

---

**Próximo passo:** Executar validação manual no KDS e documentar resultados.

# Guia de Teste Manual - ChefIApp

**Data:** 2026-01-25
**Objetivo:** Validar funcionalidades principais do sistema

---

## 🎯 Pré-requisitos

### Serviços Devem Estar Rodando

```bash
# Verificar Docker Core
cd docker-core
docker compose -f docker-compose.core.yml ps

# Deve mostrar:
# - chefiapp-core-postgres: Up (healthy)
# - chefiapp-core-postgrest: Up
# - chefiapp-core-realtime: Up

# Verificar Frontend
lsof -ti:5173

# Se não estiver rodando:
cd merchant-portal
npm run dev
```

---

## 📋 Teste 1: Realtime no KDS

### Objetivo

Validar que o KDS recebe atualizações em tempo real via Realtime.

### Passos

1. **Abrir KDS:**

   ```
   http://localhost:5173/app/kds
   ```

2. **Abrir Console do Navegador (F12):**

   - Ir para aba "Console"
   - Procurar por mensagens do OrderContext

3. **Verificar Conexão Realtime:**

   - No header do KDS, deve aparecer: 🟢 (indicador verde)
   - No console, deve aparecer: `Realtime Status: SUBSCRIBED`

4. **Criar Pedido (em outra aba):**

   - Abrir TPV: `http://localhost:5173/app/tpv`
   - Criar um pedido simples
   - **NÃO recarregar a página do KDS**

5. **Verificar Atualização Automática:**

   - ✅ Pedido deve aparecer no KDS **sem refresh**
   - ✅ Console deve mostrar: `Realtime event received`
   - ✅ Badge de origem deve aparecer (CAIXA 💰, WEB 🌐, etc.)

6. **Testar Mudança de Status:**
   - No KDS, clicar em "INICIAR PREPARO"
   - Pedido deve mudar de "NOVO" para "EM PREPARO"
   - Verificar sincronização em tempo real

### ✅ Critérios de Sucesso

- [ ] KDS mostra status 🟢 (conectado)
- [ ] Console mostra `SUBSCRIBED`
- [ ] Pedido aparece automaticamente (sem refresh)
- [ ] Mudança de status sincroniza em tempo real
- [ ] Console mostra eventos Realtime

### ❌ Problemas Comuns

**KDS não atualiza:**

- Verificar se Realtime está rodando: `docker ps | grep realtime`
- Verificar console para erros
- Verificar se status é `SUBSCRIBED` (não `CLOSED` ou `TIMED_OUT`)

**Status mostra 🔴:**

- Realtime pode estar offline
- Verificar logs: `docker logs chefiapp-core-realtime -f`

---

## 📋 Teste 2: Fluxo Web/QR Mesa

### Objetivo

Validar que pedidos criados via QR Mesa aparecem no KDS com origem `QR_MESA`.

### Passos

1. **Abrir Página da Mesa:**

   ```
   http://localhost:5173/public/restaurante-piloto/mesa/1
   ```

2. **Verificar Validação:**

   - Página deve carregar sem erros
   - Deve mostrar cardápio do restaurante
   - Deve mostrar "Mesa 1" no topo

3. **Adicionar Produtos:**

   - Clicar em produtos para adicionar ao carrinho
   - Verificar que carrinho atualiza

4. **Criar Pedido:**

   - Clicar em "Finalizar Pedido" ou botão similar
   - Aguardar confirmação

5. **Verificar no KDS:**

   - Abrir KDS: `http://localhost:5173/app/kds`
   - ✅ Pedido deve aparecer
   - ✅ Badge de origem deve ser: **QR MESA 📱** (rosa/magenta)
   - ✅ Número da mesa deve ser: **#1**

6. **Testar Constraint (Um Pedido por Mesa):**
   - Voltar para página da mesa: `http://localhost:5173/public/restaurante-piloto/mesa/1`
   - Tentar criar outro pedido
   - ✅ Deve mostrar mensagem: "Já existe um pedido ativo para esta mesa"
   - ✅ Não deve permitir criar segundo pedido

### ✅ Critérios de Sucesso

- [ ] Página da mesa carrega corretamente
- [ ] Pedido é criado com sucesso
- [ ] Pedido aparece no KDS
- [ ] Origem é `QR_MESA` (badge rosa/magenta)
- [ ] Constraint bloqueia pedido duplicado
- [ ] Mensagem de erro é clara

### ❌ Problemas Comuns

**Página não carrega:**

- Verificar se restaurante existe: `docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT slug FROM gm_restaurants;"`
- Verificar se mesa existe e está ativa

**Pedido não aparece no KDS:**

- Verificar se Realtime está funcionando (Teste 1)
- Verificar console para erros
- Verificar se RPC `create_order_atomic` foi chamado

**Origem não é QR_MESA:**

- Verificar se `WebOrderingService` está passando `origin: 'QR_MESA'`
- Verificar se `OriginBadge` suporta `QR_MESA`

---

## 📋 Teste 3: KDS Perfeito - Visual

### Objetivo

Validar que todas as fases do KDS Perfeito estão funcionando.

### Passos

1. **Abrir KDS:**

   ```
   http://localhost:5173/app/kds
   ```

2. **Verificar Fase 1 - Hierarquia Visual:**

   - Pedidos NOVOS devem ter: borda dourada, tamanho maior, pulsação suave
   - Pedidos EM PREPARO devem ter: borda azul, tamanho normal
   - Pedidos ATRASADOS (>15min) devem ter: borda vermelha, tamanho maior, pulsação rápida

3. **Verificar Fase 2 - Origem Clara:**

   - Cada pedido deve mostrar badge de origem no header
   - Cores distintas: Verde (CAIXA), Laranja (WEB), Azul (GARÇOM), Rosa (QR_MESA)

4. **Verificar Fase 3 - Tempo Visível:**

   - Timer deve ser grande e legível
   - Cores devem mudar: Verde (<5min), Amarelo (5-15min), Vermelho (>15min)
   - ⚠️ deve aparecer para pedidos atrasados

5. **Verificar Fase 4 - Ação Óbvia:**

   - Botão deve ser claro: "INICIAR PREPARO" (verde) ou "MARCAR PRONTO" (azul)
   - Deve mostrar "PROCESSANDO..." durante loading
   - Botão deve estar desabilitado durante processamento

6. **Verificar Fase 5 - Zero Ruído:**
   - ❌ NÃO deve ter hora atual no header
   - ❌ NÃO deve ter hora de criação do pedido
   - ❌ NÃO deve ter badge "PAGO"
   - ❌ Status de conexão deve ser apenas indicador visual (🟢/🔴/⚠️)
   - ✅ Deve ter apenas: mesa, origem, timer, itens, botão

### ✅ Critérios de Sucesso

- [ ] Hierarquia visual clara (novo/preparo/atrasado)
- [ ] Origem sempre visível e clara
- [ ] Timer grande, legível e com cores
- [ ] Botão de ação claro e óbvio
- [ ] Layout limpo, sem informações desnecessárias

---

## 📋 Teste 4: Constraint one_open_order_per_table

### Objetivo

Validar que a constraint `idx_one_open_order_per_table` funciona corretamente.

### Passos

1. **Criar Pedido na Mesa 1:**

   - Via QR Mesa: `http://localhost:5173/public/restaurante-piloto/mesa/1`
   - Ou via TPV (se tiver opção de mesa)

2. **Verificar Pedido Ativo:**

   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
     "SELECT id, status, table_number, origin FROM gm_orders WHERE table_number = 1 AND status = 'OPEN';"
   ```

   - Deve mostrar 1 pedido

3. **Tentar Criar Segundo Pedido:**

   - Via QR Mesa: tentar criar outro pedido na mesa 1
   - ✅ Deve bloquear com mensagem clara

4. **Finalizar Primeiro Pedido:**

   - No KDS, marcar pedido como "PRONTO"
   - Ou via TPV, finalizar pedido

5. **Verificar que Pode Criar Novo Pedido:**
   - Após finalizar, tentar criar novo pedido na mesa 1
   - ✅ Deve permitir (constraint só bloqueia pedidos OPEN)

### ✅ Critérios de Sucesso

- [ ] Constraint bloqueia segundo pedido OPEN na mesma mesa
- [ ] Mensagem de erro é clara e amigável
- [ ] Após finalizar pedido, pode criar novo
- [ ] Constraint funciona via RPC `create_order_atomic`

---

## 📊 Checklist Completo de Validação

### Infraestrutura

- [ ] Docker Core rodando (Postgres, PostgREST, Realtime)
- [ ] Frontend rodando (porta 5173)
- [ ] Banco tem dados (restaurante, mesas, produtos)

### Funcionalidades

- [ ] Realtime funciona no KDS
- [ ] Pedidos aparecem automaticamente
- [ ] Origem QR_MESA aparece corretamente
- [ ] Constraint one_open_order_per_table funciona
- [ ] KDS Perfeito (todas as 5 fases visíveis)

### UX/UI

- [ ] KDS tem hierarquia visual clara
- [ ] Origem sempre visível
- [ ] Timer legível e com cores
- [ ] Botão de ação claro
- [ ] Layout limpo (zero ruído)

---

## 🔧 Comandos Úteis Durante Testes

### Ver Pedidos no Banco

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT id, status, table_number, origin, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 5;"
```

### Ver Logs do Realtime

```bash
docker logs chefiapp-core-realtime -f
```

### Verificar Constraint

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "\d+ idx_one_open_order_per_table"
```

### Limpar Pedidos de Teste

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "DELETE FROM gm_orders WHERE origin = 'QR_MESA' OR origin = 'TEST';"
```

---

## 📝 Documentar Resultados

Após cada teste, documentar:

1. **Data/Hora:** Quando foi testado
2. **Resultado:** ✅ Passou ou ❌ Falhou
3. **Observações:** Problemas encontrados, melhorias sugeridas
4. **Screenshots:** Se relevante

---

**Última atualização:** 2026-01-25

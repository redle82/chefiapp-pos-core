# 🧪 TESTE E2E - FLUXO COMPLETO TUM-TUM

**Data:** 2026-01-24  
**Status:** ✅ **PRONTO PARA EXECUTAR**

---

## 🎯 OBJETIVO

Validar o fluxo completo end-to-end:
1. Login → Dashboard
2. TPV → Criar Pedido
3. KDS → Ver Pedido
4. App Staff → Ver Tasks
5. Owner Dashboard → Ver Tudo

---

## ✅ PRÉ-REQUISITOS

### 1. Servidor Rodando
```bash
npm run server:web-module
# Deve estar em http://localhost:4320
```

### 2. Frontend Rodando
```bash
cd merchant-portal && npm run dev
# Deve estar em http://localhost:5173
```

### 3. Banco de Dados
- Supabase local ou remoto configurado
- Usuário de teste com restaurant membership

---

## 🔄 FLUXO TUM-TUM (PASSO A PASSO)

### FASE A: Login & FlowGate ✅

#### 1. Acessar `/app` sem auth
- **Ação:** Abrir `http://localhost:5173/app`
- **Esperado:** Redireciona para `/login`
- **Validar:**
  - [ ] Não há loop de redirecionamento
  - [ ] Console sem erro `getTabIsolated is not defined`
  - [ ] FlowGate funciona corretamente

#### 2. Login (Google OAuth)
- **Ação:** Fazer login com Google
- **Esperado:** Redireciona para `/app/dashboard`
- **Validar:**
  - [ ] Identity resolve corretamente
  - [ ] Não há erro "No restaurant membership found" em loop
  - [ ] Dashboard carrega sem erros

#### 3. Verificar Dashboard
- **Ação:** Observar DashboardZero
- **Esperado:** Dashboard renderiza corretamente
- **Validar:**
  - [ ] Badge fiscal aparece (se houver pendências)
  - [ ] Sem erros no console
  - [ ] Realtime conecta (verificar status)

---

### FASE B: TPV → Criar Pedido ✅

#### 4. Abrir TPV
- **Ação:** Navegar para `/app/tpv` ou `/app/tpv-waiter`
- **Esperado:** TPV abre e carrega pedidos
- **Validar:**
  - [ ] Realtime subscription conecta
  - [ ] Console mostra: "Setting up Realtime subscription"
  - [ ] **CRÍTICO:** Não há loop de subscribe/unsubscribe
  - [ ] Polling defensivo funciona (30s)

#### 5. Selecionar Mesa
- **Ação:** Selecionar uma mesa disponível
- **Esperado:** Mesa selecionada, pedido vazio criado
- **Validar:**
  - [ ] Mesa não tem pedido ativo (constraint DB)
  - [ ] Pedido local criado

#### 6. Adicionar Itens
- **Ação:** Adicionar 2-3 itens ao pedido
- **Esperado:** Itens aparecem no pedido
- **Validar:**
  - [ ] Itens salvos localmente
  - [ ] Total calculado corretamente

#### 7. Criar Pedido
- **Ação:** Finalizar e criar pedido
- **Esperado:** Pedido criado no DB
- **Validar:**
  - [ ] `gm_orders` tem novo registro
  - [ ] `gm_order_items` tem itens
  - [ ] Status: `OPEN` ou `new`
  - [ ] Realtime event dispara

---

### FASE C: KDS → Ver Pedido ✅

#### 8. Abrir KDS
- **Ação:** Navegar para `/app/kds` ou `/app/kitchen`
- **Esperado:** KDS mostra pedidos novos
- **Validar:**
  - [ ] Pedido criado aparece em <1s (realtime)
  - [ ] Status: `new` ou `preparing`
  - [ ] Itens corretos
  - [ ] **CRÍTICO:** Não há loop de reconexão

#### 9. Marcar "Preparando"
- **Ação:** Mudar status para "preparing"
- **Esperado:** Status atualizado
- **Validar:**
  - [ ] DB atualizado
  - [ ] Realtime event dispara
  - [ ] TPV atualiza (se aberto)

#### 10. Marcar "Pronto"
- **Ação:** Mudar status para "ready"
- **Esperado:** Status atualizado
- **Validar:**
  - [ ] DB atualizado
  - [ ] Realtime event dispara
  - [ ] TPV notifica garçom
  - [ ] TaskOps cria task (se configurado)

---

### FASE D: App Staff → Ver Tasks ✅

#### 11. Abrir App Staff
- **Ação:** Navegar para `/app/staff` ou `/app/app-staff`
- **Esperado:** App Staff mostra tasks
- **Validar:**
  - [ ] Tasks aparecem
  - [ ] Tasks de entrega/limpeza criadas (se eventos dispararam)
  - [ ] Realtime funciona

#### 12. Completar Task
- **Ação:** Marcar task como completa
- **Esperado:** Task atualizada
- **Validar:**
  - [ ] Status muda para "done"
  - [ ] Evento resolvido (se TaskOps configurado)

---

### FASE E: Owner Dashboard → Ver Tudo ✅

#### 13. Verificar Dashboard Owner
- **Ação:** Voltar para `/app/dashboard`
- **Esperado:** Dashboard mostra tudo
- **Validar:**
  - [ ] Pedidos aparecem em tempo real
  - [ ] Status atualiza automaticamente
  - [ ] Sem loops de reconexão
  - [ ] Performance OK (não trava)

---

## 🐛 CHECKLIST DE VALIDAÇÃO

### Console (DevTools)
- [ ] ❌ Sem `ReferenceError: getTabIsolated is not defined`
- [ ] ❌ Sem loop de `subscribe/unsubscribe` em realtime
- [ ] ❌ Sem `Identity: No restaurant membership found` em loop
- [ ] ❌ Sem `404` em loop para `/api/fiscal/pending-external-ids`
- [ ] ❌ Sem warnings de ESLint sobre dependências instáveis
- [ ] ✅ Realtime conecta: `SUBSCRIBED`
- [ ] ✅ Polling funciona: `🛡️ Defensive Polling (30s interval)`

### Network (DevTools)
- [ ] ✅ `GET /health` → 200
- [ ] ✅ `GET /api/fiscal/pending-external-ids` → 200 (ou 401 se não autenticado)
- [ ] ✅ Realtime WebSocket conecta
- [ ] ❌ Sem 404s em loop
- [ ] ❌ Sem 409s (idempotência quebrada)

### Performance
- [ ] ✅ Dashboard carrega em <2s
- [ ] ✅ TPV carrega em <2s
- [ ] ✅ KDS atualiza em <1s após criar pedido
- [ ] ❌ Sem memory leaks (verificar Memory tab)
- [ ] ❌ Sem CPU alto (verificar Performance tab)

---

## 📊 RESULTADO ESPERADO

### ✅ SUCESSO SE:
- Todos os passos acima passam
- Console sem erros críticos
- Realtime funciona sem loops
- Pedidos criados e visualizados corretamente
- Tasks criadas automaticamente

### ❌ FALHA SE:
- Qualquer passo falha
- Loops detectados
- Erros críticos no console
- Performance degradada

---

## 🛠️ COMANDOS ÚTEIS

### Rodar Teste Automatizado
```bash
./scripts/test-e2e-flow.sh
```

### Verificar Logs do Servidor
```bash
# Terminal do servidor
tail -f logs/server.log
```

### Verificar Realtime
```bash
# No console do browser
# Verificar: supabase.channel status
```

### Verificar DB
```sql
-- Ver pedidos criados
SELECT * FROM gm_orders ORDER BY created_at DESC LIMIT 5;

-- Ver tasks criadas
SELECT * FROM appstaff_tasks ORDER BY created_at DESC LIMIT 5;
```

---

## 📝 RELATÓRIO DE TESTE

Após executar o teste, preencher:

- [ ] Fase A: Login & FlowGate
- [ ] Fase B: TPV → Criar Pedido
- [ ] Fase C: KDS → Ver Pedido
- [ ] Fase D: App Staff → Ver Tasks
- [ ] Fase E: Owner Dashboard

**Erros encontrados:**
- (Listar aqui)

**Loops detectados:**
- (Listar aqui)

**Performance:**
- (Notas aqui)

---

**Última Atualização:** 2026-01-24  
**Status:** Pronto para executar

# SPRINT 1 — DIA 1 — TESTES DE SEGURANÇA

**Data:** 2026-01-17  
**Objetivo:** Validar RLS + Race Conditions + Tab Isolation  
**Status:** ⏳ **PENDENTE** (Aguardando deploy de migrations)

---

## 📋 CHECKLIST DE TESTES

### 1. **RLS - Isolamento Multi-Tenant** (30min)

#### Teste 1.1: Usuário A não vê pedidos de Restaurante B
**Pré-requisitos:**
- [ ] 2 usuários autenticados (User A, User B)
- [ ] 2 restaurantes diferentes (Restaurant A, Restaurant B)
- [ ] User A é membro de Restaurant A
- [ ] User B é membro de Restaurant B
- [ ] Restaurant A tem pelo menos 1 pedido criado

**Passos:**
1. Login como User A
2. Acessar TPV
3. Verificar que apenas pedidos de Restaurant A são visíveis
4. Tentar acessar pedido de Restaurant B via URL direta (se possível)
5. Verificar que acesso é negado

**Resultado Esperado:**
- ✅ User A vê apenas pedidos de Restaurant A
- ✅ User A não consegue acessar pedidos de Restaurant B
- ✅ Erro 403 ou dados vazios ao tentar acessar dados de outro restaurante

---

#### Teste 1.2: RLS em gm_order_items
**Pré-requisitos:**
- [ ] Restaurant A tem pedido com items
- [ ] Restaurant B tem pedido com items

**Passos:**
1. Login como User A
2. Abrir pedido de Restaurant A
3. Verificar que items são visíveis
4. Tentar acessar item de pedido de Restaurant B (via API ou query direta)
5. Verificar que acesso é negado

**Resultado Esperado:**
- ✅ User A vê apenas items de pedidos de Restaurant A
- ✅ User A não consegue acessar items de Restaurant B

---

#### Teste 1.3: RLS em gm_tables
**Pré-requisitos:**
- [ ] Restaurant A tem mesas configuradas
- [ ] Restaurant B tem mesas configuradas

**Passos:**
1. Login como User A
2. Acessar gestão de mesas
3. Verificar que apenas mesas de Restaurant A são visíveis
4. Tentar criar pedido em mesa de Restaurant B
5. Verificar que acesso é negado

**Resultado Esperado:**
- ✅ User A vê apenas mesas de Restaurant A
- ✅ User A não consegue criar pedido em mesa de Restaurant B

---

### 2. **Race Conditions** (20min)

#### Teste 2.1: Dois garçons na mesma mesa
**Pré-requisitos:**
- [ ] 2 usuários autenticados (Garçom A, Garçom B)
- [ ] Ambos são membros do mesmo restaurante
- [ ] Mesa 1 está livre (sem pedido ativo)

**Passos:**
1. Garçom A e Garçom B abrem TPV simultaneamente
2. Ambos selecionam Mesa 1
3. Ambos tentam criar pedido na Mesa 1 ao mesmo tempo
4. Verificar qual pedido foi criado
5. Verificar que apenas 1 pedido foi criado

**Resultado Esperado:**
- ✅ Apenas 1 pedido é criado (o primeiro a chegar no banco)
- ✅ O segundo garçom recebe erro: "Mesa 1 já possui pedido ativo"
- ✅ Mensagem de erro é clara e acionável

---

#### Teste 2.2: Múltiplos caixas abertos
**Pré-requisitos:**
- [ ] 2 usuários autenticados (User A, User B)
- [ ] Ambos são membros do mesmo restaurante
- [ ] Nenhum caixa está aberto

**Passos:**
1. User A e User B tentam abrir caixa simultaneamente
2. Verificar qual caixa foi aberto
3. Verificar que apenas 1 caixa foi aberto

**Resultado Esperado:**
- ✅ Apenas 1 caixa é aberto (o primeiro a chegar no banco)
- ✅ O segundo usuário recebe erro de constraint violation
- ✅ Sistema permanece consistente

---

### 3. **Tab Isolation** (10min)

#### Teste 3.1: Dois tabs com restaurantes diferentes
**Pré-requisitos:**
- [ ] 2 usuários autenticados (User A, User B)
- [ ] User A é membro de Restaurant A
- [ ] User B é membro de Restaurant B

**Passos:**
1. Abrir Tab 1: Login como User A → Selecionar Restaurant A
2. Abrir Tab 2: Login como User B → Selecionar Restaurant B
3. Verificar que Tab 1 mostra dados de Restaurant A
4. Verificar que Tab 2 mostra dados de Restaurant B
5. Criar pedido em Tab 1
6. Verificar que Tab 2 não mostra o pedido criado em Tab 1

**Resultado Esperado:**
- ✅ Tab 1 opera com Restaurant A isoladamente
- ✅ Tab 2 opera com Restaurant B isoladamente
- ✅ Não há conflito entre tabs
- ✅ Cada tab mantém seu próprio estado

---

#### Teste 3.2: Dois tabs com mesmo restaurante (mesmo usuário)
**Pré-requisitos:**
- [ ] 1 usuário autenticado (User A)
- [ ] User A é membro de Restaurant A

**Passos:**
1. Abrir Tab 1: Login como User A → Selecionar Restaurant A
2. Abrir Tab 2: Login como User A → Selecionar Restaurant A
3. Criar pedido em Tab 1
4. Verificar que Tab 2 vê o pedido (via realtime)
5. Verificar que `chefiapp_active_order_id` é isolado por tab

**Resultado Esperado:**
- ✅ Ambos os tabs veem os mesmos pedidos (via realtime)
- ✅ `chefiapp_active_order_id` é isolado por tab (não conflita)
- ✅ Cada tab pode ter um pedido ativo diferente

---

## 🚨 TESTES AUTOMATIZADOS (Futuro)

### Teste E2E: RLS Isolation
```typescript
test('User A cannot see Restaurant B orders', async () => {
  // Setup: Create 2 restaurants, 2 users, 1 order each
  // Act: Login as User A, query orders
  // Assert: Only Restaurant A orders visible
});
```

### Teste E2E: Race Condition
```typescript
test('Only one active order per table', async () => {
  // Setup: Create table, 2 users
  // Act: Both users try to create order on same table simultaneously
  // Assert: Only 1 order created, other gets error
});
```

---

## 📊 RESULTADOS ESPERADOS

| Teste | Status | Notas |
|-------|--------|-------|
| RLS - User A não vê Restaurant B | ⏳ | Aguardando deploy |
| RLS - gm_order_items | ⏳ | Aguardando deploy |
| RLS - gm_tables | ⏳ | Aguardando deploy |
| Race Condition - Mesas | ⏳ | Aguardando deploy |
| Race Condition - Caixas | ⏳ | Aguardando deploy |
| Tab Isolation - Restaurantes diferentes | ✅ | Testado manualmente |
| Tab Isolation - Mesmo restaurante | ✅ | Testado manualmente |

---

## 🎯 PRÓXIMOS PASSOS

1. **Deploy migrations** → `supabase db push`
2. **Executar testes manuais** → Seguir checklist acima
3. **Documentar resultados** → Atualizar este arquivo
4. **Criar testes automatizados** → (Futuro, Sprint 3)

---

**Tempo Estimado:** 1h  
**Status:** ⏳ **AGUARDANDO DEPLOY**

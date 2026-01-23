# 🧪 ChefIApp - Guia de Testes das Correções

**Guia prático para validar todas as correções aplicadas**

**Data:** 2026-01-24  
**Versão:** 1.0.0

---

## 📋 Pré-requisitos

- ✅ Expo Go instalado no simulador/dispositivo
- ✅ Backend Supabase configurado e rodando
- ✅ Dados de teste disponíveis (pedidos, mesas, usuários)
- ✅ Acesso a diferentes roles (garçom, cozinheiro, gerente, dono)

---

## 🎯 Bugs Críticos - Testes

### Bug #1: Garçom vê todos os pedidos ✅

**Objetivo:** Validar que garçom vê apenas seus pedidos

**Passos:**
1. Fazer login como **Garçom**
2. Ir para a tela **Pedidos** (`orders.tsx`)
3. Verificar que aparecem apenas pedidos do turno atual do garçom
4. Fazer login como **Manager**
5. Ir para a tela **Pedidos**
6. Verificar que aparecem **todos** os pedidos

**Resultado Esperado:**
- ✅ Garçom vê apenas pedidos do seu shift
- ✅ Manager vê todos os pedidos
- ✅ Outros roles veem apenas pedidos do turno atual

**Status:** ✅ **VALIDAR**

---

### Bug #4: Pedido pode ser pago sem estar entregue ✅

**Objetivo:** Validar que pedido só pode ser pago se estiver entregue

**Passos:**
1. Criar um pedido novo (status: `pending`)
2. Tentar acessar a tela de pagamento
3. Verificar que **não** aparece botão de pagamento
4. Marcar pedido como entregue (status: `delivered`)
5. Verificar que **agora** aparece botão de pagamento
6. Tentar pagar o pedido
7. Verificar que pagamento é processado com sucesso

**Resultado Esperado:**
- ✅ Botão de pagamento só aparece se status = `delivered`
- ✅ Aviso aparece se tentar pagar pedido não entregue
- ✅ Pagamento funciona corretamente para pedidos entregues

**Status:** ✅ **VALIDAR**

---

### Bug #9: Estado pode quebrar ao recarregar ✅

**Objetivo:** Validar que app não quebra se restaurante não carrega

**Passos:**
1. Fazer login normalmente
2. Verificar que `businessId` é carregado
3. Simular erro de conexão (desligar internet)
4. Recarregar o app (⌘ + R)
5. Verificar que app não quebra
6. Verificar que usa fallback (`fallback-restaurant-id`)
7. Verificar que estado permanece válido

**Resultado Esperado:**
- ✅ App não quebra se restaurante não carrega
- ✅ Fallback é usado automaticamente
- ✅ Estado sempre válido
- ✅ Console mostra aviso mas não erro fatal

**Status:** ✅ **VALIDAR**

---

### Bug #12: Ações críticas sem validação de permissão ✅

**Objetivo:** Validar que ações críticas requerem permissão

**Teste 1: Cancelar Item**
1. Fazer login como **Garçom** (sem permissão `order:void`)
2. Ir para **Pedidos**
3. Selecionar um pedido
4. Tentar cancelar um item (long press)
5. Verificar que aparece alerta "Sem Permissão"

**Teste 2: Dividir Conta**
1. Fazer login como **Cozinheiro** (sem permissão `order:split`)
2. Ir para **Pedidos**
3. Selecionar um pedido entregue
4. Verificar que **não** aparece botão "Dividir Conta"

**Teste 3: Separar Pedido**
1. Fazer login como **Garçom** (sem permissão `order:split`)
2. Verificar que botão "Separar Pedido" **não** aparece

**Resultado Esperado:**
- ✅ Ações bloqueadas se sem permissão
- ✅ Alertas aparecem corretamente
- ✅ Botões não aparecem se sem permissão

**Status:** ✅ **VALIDAR**

---

## ⚠️ Bugs Médios - Testes

### Bug #2: Dono pode acessar gestão sem validação ✅

**Objetivo:** Validar que tela Manager requer permissão

**Passos:**
1. Fazer login como **Garçom** (sem permissão `business:view_reports`)
2. Tentar acessar tela **Manager** (via navegação direta ou tab)
3. Verificar que aparece mensagem "Você não tem permissão para acessar esta tela"
4. Fazer login como **Manager**
5. Acessar tela **Manager**
6. Verificar que tela carrega normalmente

**Resultado Esperado:**
- ✅ Tela bloqueada se sem permissão
- ✅ Mensagem clara de erro
- ✅ Manager/Owner podem acessar

**Status:** ✅ **VALIDAR**

---

### Bug #3: Tabs acessíveis via navegação direta ✅

**Objetivo:** Validar que guards de rota funcionam

**Teste 1: Cozinha**
1. Fazer login como **Garçom**
2. Tentar acessar `/(tabs)/kitchen` (via código ou deep link)
3. Verificar que é redirecionado para `/(tabs)/staff`
4. Fazer login como **Cozinheiro**
5. Acessar `/(tabs)/kitchen`
6. Verificar que tela carrega normalmente

**Teste 2: Bar**
1. Fazer login como **Cozinheiro**
2. Tentar acessar `/(tabs)/bar`
3. Verificar que é redirecionado para `/(tabs)/staff`
4. Fazer login como **Barman**
5. Acessar `/(tabs)/bar`
6. Verificar que tela carrega normalmente

**Teste 3: Mesas**
1. Fazer login como **Cozinheiro**
2. Tentar acessar `/(tabs)/tables`
3. Verificar que é redirecionado para `/(tabs)/staff`
4. Fazer login como **Garçom**
5. Acessar `/(tabs)/tables`
6. Verificar que tela carrega normalmente

**Resultado Esperado:**
- ✅ Redirecionamento automático se sem permissão
- ✅ Console mostra aviso de acesso negado
- ✅ Roles permitidos podem acessar

**Status:** ✅ **VALIDAR**

---

### Bug #5: Fechamento de caixa sem validação ✅

**Objetivo:** Validar que fechamento de caixa verifica pedidos pendentes

**Passos:**
1. Criar alguns pedidos pendentes (status: `pending` ou `delivered`)
2. Fazer login como **Caixa** ou **Manager**
3. Abrir **Financial Vault**
4. Tentar fechar caixa
5. Verificar que aparece alerta "Pedidos Pendentes"
6. Verificar que mostra quantidade de pedidos pendentes
7. Escolher "Fechar Mesmo Assim" (com confirmação)
8. Verificar que caixa fecha com sucesso
9. Limpar todos os pedidos pendentes
10. Tentar fechar caixa novamente
11. Verificar que fecha sem alerta

**Resultado Esperado:**
- ✅ Alerta aparece se há pedidos pendentes
- ✅ Mostra quantidade de pedidos
- ✅ Opção de forçar fechamento (com confirmação)
- ✅ Fecha normalmente se não há pendências

**Status:** ✅ **VALIDAR**

---

### Bug #6: Turno pode ser encerrado com ações pendentes ✅

**Objetivo:** Validar que encerramento de turno verifica ações pendentes

**Passos:**
1. Fazer login como **Garçom**
2. Verificar que há uma ação crítica/urgente no NOW ENGINE
3. Tentar encerrar turno (botão "Encerrar Turno")
4. Verificar que aparece alerta "Ações Pendentes"
5. Verificar que encerramento é bloqueado
6. Completar a ação pendente
7. Tentar encerrar turno novamente
8. Verificar que encerra normalmente

**Resultado Esperado:**
- ✅ Alerta aparece se há ação crítica/urgente
- ✅ Encerramento bloqueado
- ✅ Encerra normalmente se não há pendências

**Status:** ✅ **VALIDAR**

---

### Bug #7: Validação de input fraca ✅

**Objetivo:** Validar que inputs são validados corretamente

**Teste 1: Telefone**
1. Ir para tela **Menu** (`index.tsx`)
2. Abrir modal "Identificar Cliente"
3. Tentar digitar letras no campo telefone
4. Verificar que apenas números são aceitos
5. Tentar digitar mais de 15 dígitos
6. Verificar que é limitado a 15 dígitos
7. Tentar identificar com menos de 8 dígitos
8. Verificar que aparece erro "Telefone deve ter pelo menos 8 dígitos"

**Teste 2: Nome**
1. No mesmo modal, tentar digitar nome com menos de 2 caracteres
2. Verificar que aparece erro "Nome deve ter pelo menos 2 caracteres"
3. Tentar digitar mais de 100 caracteres
4. Verificar que é limitado a 100 caracteres

**Teste 3: Gorjeta**
1. Abrir modal de pagamento (`QuickPayModal`)
2. Selecionar método "Dinheiro"
3. Tentar digitar letras no campo "Gorjeta personalizada"
4. Verificar que apenas números são aceitos
5. Tentar digitar valor maior que 50% do total
6. Verificar que é limitado a 50% do total
7. Tentar digitar mais de 2 casas decimais
8. Verificar que é limitado a 2 casas decimais

**Resultado Esperado:**
- ✅ Telefone: apenas números, 8-15 dígitos
- ✅ Nome: 2-100 caracteres
- ✅ Gorjeta: apenas números, máximo 50% do total, 2 casas decimais
- ✅ Erros aparecem corretamente

**Status:** ✅ **VALIDAR**

---

### Bug #11: Dados podem aparecer para role errado ✅

**Objetivo:** Validar que dados são filtrados por role

**Teste 1: Mesas**
1. Fazer login como **Garçom**
2. Ir para tela **Mesas** (`tables.tsx`)
3. Verificar que mesas mostram apenas pedidos do turno atual
4. Fazer login como **Manager**
5. Ir para tela **Mesas**
6. Verificar que mesas mostram **todos** os pedidos

**Teste 2: Menu/POS**
1. Fazer login como **Garçom**
2. Ir para tela **Menu** (`index.tsx`)
3. Verificar que pedidos mostrados são apenas do turno atual
4. Fazer login como **Caixa**
5. Ir para tela **Menu**
6. Verificar que mostra **todos** os pedidos

**Resultado Esperado:**
- ✅ Garçom vê apenas dados do turno
- ✅ Manager/Caixa veem todos os dados
- ✅ Filtros aplicados corretamente

**Status:** ✅ **VALIDAR**

---

### Bug #14: Validação de valores fraca ✅

**Objetivo:** Validar que valores monetários são validados

**Teste 1: Abrir Caixa**
1. Abrir **Financial Vault**
2. Tentar abrir caixa com valor negativo
3. Verificar que aparece erro "Valor não pode ser negativo"
4. Tentar abrir com valor > €100.000
5. Verificar que aparece erro "Valor muito alto (máximo: €100.000)"
6. Tentar abrir com valor válido
7. Verificar que abre normalmente

**Teste 2: Movimentação**
1. Com caixa aberto, tentar fazer movimentação com valor negativo
2. Verificar que aparece erro
3. Tentar com valor > €100.000
4. Verificar que aparece erro
5. Tentar com valor válido
6. Verificar que funciona

**Teste 3: Fechar Caixa**
1. Tentar fechar caixa com valor negativo
2. Verificar que aparece erro
3. Tentar com valor válido
4. Verificar que funciona

**Resultado Esperado:**
- ✅ Valores negativos são rejeitados
- ✅ Valores muito altos são rejeitados (máximo €100.000)
- ✅ Valores válidos são aceitos

**Status:** ✅ **VALIDAR**

---

## 📊 Checklist de Validação

### Bugs Críticos
- [ ] Bug #1: Garçom vê apenas seus pedidos
- [ ] Bug #4: Pedido só pode ser pago se entregue
- [ ] Bug #9: App não quebra ao recarregar
- [ ] Bug #12: Ações críticas requerem permissão

### Bugs Médios
- [ ] Bug #2: Manager screen bloqueado sem permissão
- [ ] Bug #3: Guards de rota funcionam
- [ ] Bug #5: Fechamento de caixa valida pedidos
- [ ] Bug #6: Encerramento de turno valida ações
- [ ] Bug #7: Validação de inputs funciona
- [ ] Bug #11: Dados filtrados por role
- [ ] Bug #14: Validação de valores funciona

---

## 🐛 Como Reportar Problemas

Se encontrar algum problema durante os testes:

1. **Documentar:**
   - Qual bug está testando
   - Passos exatos para reproduzir
   - Resultado esperado vs. resultado real
   - Screenshots (se aplicável)
   - Logs do console

2. **Priorizar:**
   - Crítico: Bloqueia uso em produção
   - Médio: Impacta UX mas não bloqueia
   - Baixo: Melhoria ou ajuste fino

3. **Reportar:**
   - Criar issue no repositório
   - Ou documentar em `CHEFIAPP_TEST_RESULTS.md`

---

## ✅ Critérios de Aprovação

Para aprovar as correções para produção:

- ✅ **100% dos bugs críticos validados** (4/4)
- ✅ **Pelo menos 80% dos bugs médios validados** (6/7)
- ✅ **Nenhum bug crítico novo introduzido**
- ✅ **Performance aceitável** (sem regressões)

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ **GUIA PRONTO PARA USO**

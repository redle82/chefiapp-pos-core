# 🔨 AppStaff 2.0 - Guia de Implementação

**Implementação prática do AppStaff 2.0 com NOW ENGINE**

---

## ✅ Arquivos Criados

### 1. NOW ENGINE Service
**Arquivo:** `mobile-app/services/NowEngine.ts`

**Status:** ✅ Criado

**Funcionalidades:**
- Classe `NowEngine` completa
- Método `gatherContext()` - coleta contexto operacional
- Método `calculateNowAction()` - calcula ação única
- Filtros por role
- Priorização
- Sincronização em tempo real
- Polling de fallback

---

### 2. Hook useNowEngine
**Arquivo:** `mobile-app/hooks/useNowEngine.ts`

**Status:** ✅ Criado

**Funcionalidades:**
- Hook React para usar NOW ENGINE
- Escuta ações automaticamente
- Atualiza quando role muda
- Expõe `nowAction`, `loading`, `completeAction`

---

### 3. Componente NowActionCard
**Arquivo:** `mobile-app/components/NowActionCard.tsx`

**Status:** ✅ Criado

**Funcionalidades:**
- UI única (1 ação, 1 botão)
- Estados: crítico, urgente, atenção, silêncio
- Cores por prioridade
- Ícones por ação
- Loading state
- Footer com role e tempo

---

### 4. Staff Screen Atualizado
**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`

**Status:** ✅ Atualizado

**Mudanças:**
- Removido: Lista de tarefas
- Removido: XP bar
- Removido: Gamificação visível
- Adicionado: `NowActionCard`
- Adicionado: `useNowEngine`
- Simplificado: Tela única

---

## 🚀 Como Usar

### 1. Iniciar NOW ENGINE

```typescript
// Já está integrado no useNowEngine hook
// Apenas usar o hook no componente
const { nowAction, loading, completeAction } = useNowEngine();
```

### 2. Exibir Ação

```typescript
// NowActionCard já está integrado no staff.tsx
// Apenas renderiza automaticamente
<NowActionCard
  action={nowAction}
  onComplete={handleCompleteAction}
  loading={loading}
/>
```

### 3. Completar Ação

```typescript
// Quando funcionário toca botão
const handleCompleteAction = async (actionId: string) => {
  if (nowAction?.action === 'collect_payment') {
    // Processar pagamento
    await quickPay(nowAction.orderId, 'cash');
  } else if (nowAction?.action === 'deliver') {
    // Marcar item como entregue
    await markItemDelivered(nowAction.itemId);
  }
  
  // Completar ação no NOW ENGINE
  await completeAction(actionId);
  // Próxima ação aparece automaticamente
};
```

---

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

```bash
# Já configurado no .env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Banco de Dados

**Tabelas necessárias:**
- `gm_tables` - Mesas
- `gm_orders` - Pedidos
- `gm_order_items` - Itens de pedido
- `gm_restaurants` - Restaurantes

**Campos necessários:**
- `restaurant_id` em todas as tabelas
- `status` em orders e items
- `last_event_time` em tables
- `ready_at` em order_items

---

## 🧪 Testes

### Teste 1: Ação Crítica

**Cenário:**
1. Criar pedido na mesa 5
2. Marcar como "wants_pay"
3. Aguardar 5+ minutos

**Esperado:**
- AppStaff mostra: "Mesa 5 - Quer pagar há 5+ min"
- Botão: "COBRAR"
- Cor: Vermelho

---

### Teste 2: Ação Urgente

**Cenário:**
1. Item fica pronto no KDS
2. Aguardar 2 minutos

**Esperado:**
- AppStaff mostra: "Mesa X - Item pronto"
- Botão: "ENTREGAR"
- Cor: Laranja

---

### Teste 3: Estado Silencioso

**Cenário:**
1. Nenhuma ação urgente
2. Tudo em ordem

**Esperado:**
- AppStaff mostra: "Tudo em ordem"
- Sem botão
- Cor: Cinza

---

## 🔄 Próximos Passos

### 1. Integrar com TPV

**Tarefa:**
- Conectar eventos do TPV com NOW ENGINE
- Garantir que pedidos criados disparam recálculo

**Arquivo:** `mobile-app/services/NowEngine.ts`

---

### 2. Integrar com KDS

**Tarefa:**
- Conectar eventos do KDS com NOW ENGINE
- Garantir que itens prontos disparam recálculo

**Arquivo:** `mobile-app/services/NowEngine.ts`

---

### 3. Processar Ações

**Tarefa:**
- Implementar lógica de `collect_payment`
- Implementar lógica de `deliver`
- Implementar lógica de `check`

**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`

---

### 4. Remover Código Antigo

**Tarefas:**
- [ ] Remover `ShiftGate.tsx` (ou tornar não-bloqueante)
- [ ] Remover lista de tarefas (já removido)
- [ ] Remover XP bar (já removido)
- [ ] Remover gamificação visível (já removido)
- [ ] Limpar código não usado

---

## 📊 Status de Implementação

### ✅ Completo

- [x] NOW ENGINE service
- [x] Hook useNowEngine
- [x] Componente NowActionCard
- [x] Staff screen atualizado
- [x] Remoção de lista de tarefas
- [x] Remoção de XP bar

### ⚠️ Parcial

- [ ] Integração com TPV (estrutura pronta, precisa conectar eventos)
- [ ] Integração com KDS (estrutura pronta, precisa conectar eventos)
- [ ] Processamento de ações (estrutura pronta, precisa implementar lógica)

### ❌ Pendente

- [ ] Remover ShiftGate bloqueante
- [ ] Remover avisos bloqueantes
- [ ] Limpar código não usado
- [ ] Testes E2E

---

## 🎯 Critérios de Sucesso

### Funcionário Novo Entende em 3 Segundos

- ✅ Tela mostra 1 coisa
- ✅ Título claro (2 palavras)
- ✅ Botão único
- ✅ Sem leitura longa

### Funcionário Velho Não Rejeita

- ✅ Não pede configuração
- ✅ Não pede aprendizado
- ✅ Apenas mostra ação
- ⚠️ Funciona offline (parcial - precisa testar)

### Gerente Grita Menos

- ✅ Sistema guia funcionário
- ✅ Prioridades são claras
- ✅ Ações críticas aparecem primeiro
- ✅ Não há ruído

### Restaurante Sente Falta se Remover

- ⚠️ Sistema é essencial (precisa validar em produção)
- ⚠️ Substitui WhatsApp (precisa validar)
- ⚠️ Substitui gritos (precisa validar)
- ⚠️ Melhora operação (precisa validar)

---

## 🐛 Problemas Conhecidos

### 1. Integração com TPV/KDS

**Problema:**
- Eventos podem não estar sincronizados
- Realtime pode não funcionar

**Solução:**
- Verificar canais Supabase
- Adicionar polling de fallback (já implementado)

---

### 2. Processamento de Ações

**Problema:**
- Ações não processam realmente (apenas marcam como completa)

**Solução:**
- Implementar lógica de processamento em `handleCompleteAction`

---

### 3. Offline-First

**Problema:**
- Contexto pode não ser coletado offline

**Solução:**
- Implementar fallback offline em `gatherContext()`

---

## 📚 Documentação Relacionada

1. **Arquitetura:** `docs/architecture/NOW_ENGINE.md`
2. **Regras:** `docs/architecture/NOW_ENGINE_RULES.md`
3. **Design:** `docs/design/APPSTAFF_SINGLE_SCREEN.md`
4. **Sincronização:** `docs/architecture/APPSTAFF_SYNC_MAP.md`
5. **Reconstrução:** `docs/architecture/APPSTAFF_RECONSTRUCAO.md`

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Implementação Inicial Completa

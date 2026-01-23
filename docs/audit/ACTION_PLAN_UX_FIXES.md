# 📋 Plano de Ação - Correções de UX

**Baseado em:** Teste Humano Completo (HITL)  
**Data:** 2026-01-24  
**Versão:** 2.0.0-RC1

---

## 🎯 Objetivo

Corrigir 4 erros críticos de UX antes de produção e 6 erros altos nas primeiras 2 semanas.

---

## 🔴 FASE 1: CRÍTICOS (Antes de Produção)

**Prazo:** 1-2 dias  
**Status:** ✅ **COMPLETO**

### ERRO-001: Cliente não sabe se pedido foi recebido ✅

**Arquivo:** `merchant-portal/src/public/components/CartDrawer.tsx`

**Mudança Aplicada:**
```typescript
// Após result.success === true
setStatus('success');
setMessage('✅ Pedido recebido! Aguarde o preparo.');
// Feedback visual destacado (banner verde)
```

**Teste:**
- [x] Cliente vê confirmação clara após envio
- [x] Mensagem é visível e compreensível
- [x] Não há ambiguidade
- [x] Feedback visual destacado

---

### ERRO-002: Garçom não sabe origem do pedido ✅

**Arquivos:**
- `mobile-app/components/NowActionCard.tsx`
- `mobile-app/services/NowEngine.ts`
- `mobile-app/context/OrderContext.tsx`

**Mudança Aplicada:**
```typescript
// Order interface atualizada
origin?: 'WEB_PUBLIC' | 'GARÇOM' | string;

// NowEngine busca origem e mesa
.select('id, table_id, table_number, status, total, origin, ...')

// NowActionCard mostra badge
{originBadge && (
  <View style={styles.originBadge}>
    <Text style={styles.originBadgeText}>🌐 WEB</Text>
  </View>
)}
```

**Teste:**
- [x] Badge "WEB" aparece claramente
- [x] Mesa é indicada (tableNumber)
- [x] Garçom entende origem imediatamente

---

### ERRO-003: Ação "acknowledge" não é clara ✅

**Arquivo:** `mobile-app/services/NowEngine.ts`, `mobile-app/components/NowActionCard.tsx`

**Mudança Aplicada:**
```typescript
// NowActionCard.tsx
const ACTION_LABELS: Record<string, string> = {
  'acknowledge': 'VER PEDIDO', // ERRO-003 Fix: Linguagem humana clara
  // ...
};

// NowEngine.ts
message: orderData.origin === 'WEB_PUBLIC' ? 'Novo pedido web' : 'Novo pedido',
```

**Teste:**
- [x] Botão diz "VER PEDIDO" claramente
- [x] Mensagem indica que é novo pedido
- [x] Garçom entende o que fazer

---

### ERRO-004: Não há proteção contra duplo clique ✅

**Arquivos:**
- `mobile-app/components/QuickPayModal.tsx`
- `mobile-app/components/FastPayButton.tsx`
- `mobile-app/app/(tabs)/staff.tsx`

**Mudança Aplicada:**
```typescript
// Estado de processamento
const [processing, setProcessing] = useState(false);

// Lock imediato
if (processing) return;
setProcessing(true);

// Botão desabilitado
disabled={!selectedMethod || processing}

// ActivityIndicator durante processamento
{processing ? (
  <ActivityIndicator size="small" color="#fff" />
) : (
  // ... botão normal
)}
```

**Teste:**
- [x] Botão desabilita imediatamente ao clicar
- [x] Não é possível clicar duas vezes
- [x] Feedback visual claro de processamento

---

## 🟡 FASE 2: ALTOS (Primeiras 2 Semanas)

**Prazo:** 1 semana  
**Status:** 🟡 **RECOMENDADO**

### ERRO-005: Cliente não sabe quando pedido estará pronto

**Arquivo:** `merchant-portal/src/public/` (nova página)

**Criar:** `OrderStatusPage.tsx`

**Funcionalidade:**
- Página de status do pedido
- Atualizações em tempo real via Supabase Realtime
- Mostra: "Preparando", "Pronto", "Entregue"

**Teste:**
- [ ] Cliente vê status atualizado
- [ ] Tempo real funciona
- [ ] Interface clara

---

### ERRO-006: Não há notificação push

**Arquivo:** `mobile-app/hooks/usePushNotifications.ts`

**Mudança:**
```typescript
// Adicionar listener para pedidos web
useEffect(() => {
  const channel = supabase
    .channel('web_orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'gm_orders',
      filter: `origin=eq.WEB_PUBLIC`
    }, (payload) => {
      // Enviar notificação push
      sendPushNotification({
        title: 'Novo Pedido Web',
        body: `Mesa ${payload.new.table_number} - Ver detalhes`,
      });
    })
    .subscribe();
}, []);
```

**Teste:**
- [ ] Notificação aparece quando pedido web chega
- [ ] Garçom recebe notificação
- [ ] Notificação é clara

---

### ERRO-007: Cozinheiro não percebe novo pedido

**Arquivo:** `mobile-app/app/(tabs)/kitchen.tsx`

**Mudança:**
```typescript
// Adicionar alerta visual mais forte
useEffect(() => {
  if (newOrdersCount > prevOrderCount.current) {
    // Flash visual
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 200 }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200 }),
    ]).start();
    
    // Vibração
    HapticFeedback.impact();
    
    // Som (já existe)
    playSound();
  }
}, [newOrdersCount]);
```

**Teste:**
- [ ] Flash visual aparece
- [ ] Vibração funciona
- [ ] Cozinheiro percebe imediatamente

---

### ERRO-008: Garçom não sabe quantas ações pendentes

**Arquivo:** `mobile-app/services/NowEngine.ts`

**Mudança:**
```typescript
// Expor contador de ações pendentes
getPendingActionsCount(): number {
  const allActions = this.calculateAllActions(this.context);
  return allActions.filter(a => a.type !== 'silent').length;
}
```

**E em NowActionCard.tsx:**
```typescript
// Mostrar contador discreto
{action.pendingCount > 1 && (
  <Text style={styles.pendingCount}>
    +{action.pendingCount - 1} ações pendentes
  </Text>
)}
```

**Teste:**
- [ ] Contador aparece quando há mais de 1 ação
- [ ] Não interfere na tela única
- [ ] Garçom sabe quantas ações faltam

---

### ERRO-009: Não há como dividir conta

**Arquivo:** `mobile-app/components/QuickPayModal.tsx`

**Mudança:**
```typescript
// Adicionar opção de dividir
const [splitCount, setSplitCount] = useState(1);

// Botão "Dividir Conta"
<TouchableOpacity onPress={() => setSplitCount(splitCount + 1)}>
  <Text>Dividir em {splitCount + 1}</Text>
</TouchableOpacity>

// Calcular valor por pessoa
const amountPerPerson = total / splitCount;
```

**Teste:**
- [ ] Opção de dividir aparece
- [ ] Cálculo está correto
- [ ] Fluxo é claro

---

### ERRO-010: Não há confirmação de valor total

**Arquivo:** `mobile-app/components/QuickPayModal.tsx`

**Mudança:**
```typescript
// Adicionar tela de confirmação final
const [showConfirmation, setShowConfirmation] = useState(false);

// Antes de processar, mostrar confirmação
const handleConfirm = () => {
  setShowConfirmation(true);
};

// Tela de confirmação
{showConfirmation && (
  <View style={styles.confirmationOverlay}>
    <Text style={styles.confirmationTitle}>Confirmar Pagamento</Text>
    <Text style={styles.confirmationAmount}>€{grandTotal.toFixed(2)}</Text>
    <Text style={styles.confirmationMethod}>{selectedMethod}</Text>
    <TouchableOpacity onPress={processPayment}>
      <Text>CONFIRMAR</Text>
    </TouchableOpacity>
  </View>
)}
```

**Teste:**
- [ ] Confirmação aparece antes de processar
- [ ] Valor total é destacado
- [ ] Método de pagamento é claro

---

## 📊 PROGRESSO

### Fase 1 (Críticos)
- [x] ERRO-001 ✅
- [x] ERRO-002 ✅
- [x] ERRO-003 ✅
- [x] ERRO-004 ✅

**Progresso:** 4/4 (100%) ✅

### Fase 2 (Altos)
- [ ] ERRO-005
- [ ] ERRO-006
- [ ] ERRO-007
- [ ] ERRO-008
- [ ] ERRO-009
- [ ] ERRO-010

**Progresso:** 0/6 (0%)

---

## 🧪 TESTES APÓS CORREÇÕES

### Teste de Regressão
- [ ] Fluxo completo de pedido web funciona
- [ ] Garçom recebe e processa pedido corretamente
- [ ] Pagamento funciona sem duplicação
- [ ] Ações são claras e compreensíveis

### Teste de Aceitação
- [ ] Cliente entende confirmação de pedido
- [ ] Garçom entende origem do pedido
- [ ] Ações são intuitivas
- [ ] Não há duplicação de pagamento

---

## 📚 REFERÊNCIAS

- **Relatório Completo:** [`HUMAN_TEST_REPORT.md`](./HUMAN_TEST_REPORT.md)
- **Quick Reference:** [`HUMAN_TEST_QUICK_REFERENCE.md`](./HUMAN_TEST_QUICK_REFERENCE.md)
- **Tarefas SQL:** [`HUMAN_TEST_TASKS.sql`](./HUMAN_TEST_TASKS.sql)

---

**Versão:** 2.0.0-RC1  
**Status:** 🔴 **AGUARDANDO CORREÇÕES**

# ✅ Issue #2: Badge de origem do pedido (ERRO-002) - COMPLETO

**Status:** ✅ Implementado  
**Data:** 2026-01-30  
**Tempo:** ~4h

---

## 🎯 O que foi implementado

### 1. Badge visual em NowActionCard
- Badge para WEB (🌐 azul), GARÇOM (👤 verde), CAIXA (💳 amarelo)
- Posicionado no canto superior direito
- Cores distintas por origem

### 2. Badge visual em OrderCard (orders.tsx)
- Badge ao lado do número da mesa
- Mesmas cores e ícones
- Visível em todos os pedidos da lista

### 3. Badge visual em KDSTicket
- Badge compacto no header do ticket
- Apenas ícone (sem texto) para economizar espaço
- Mesmas cores por origem

### 4. Origem setada corretamente
- **Mobile App (submitOrder):** `origin: 'GARÇOM'`
- **TPV (OrderProjection):** `origin: 'CAIXA'` via syncMetadata + UPDATE
- **Web (WebOrderingService):** `origin: 'WEB_PUBLIC'` (já existia)

---

## 📁 Arquivos Modificados

1. `mobile-app/components/NowActionCard.tsx`
   - Função `getOriginBadge()` com cores por origem
   - Badge visível para todas as origens (não só WEB)

2. `mobile-app/app/(tabs)/orders.tsx`
   - Badge adicionado no `orderHeader`
   - Estilos para cada origem (Web/Caixa/Garçom)

3. `mobile-app/components/KDSTicket.tsx`
   - Badge compacto no header
   - Apenas ícone para economizar espaço

4. `mobile-app/context/OrderContext.tsx`
   - `submitOrder` seta `origin: 'GARÇOM'` ao criar pedido

5. `merchant-portal/src/core/sovereignty/OrderProjection.ts`
   - Adiciona `origin: 'CAIXA'` no syncMetadata
   - UPDATE após criação para garantir origem

---

## ✅ Critério de Pronto (Atendido)

- ✅ Badge fixo visível em todos os pedidos (WEB / GARÇOM / CAIXA)
- ✅ Cor distinta por origem (WEB: azul, GARÇOM: verde, CAIXA: amarelo)
- ✅ Ícone por canal (🌐 WEB, 👤 GARÇOM, 💳 CAIXA)
- ✅ Badge visível em: NowActionCard, OrderCard, KDSTicket
- ✅ Origem setada corretamente em todos os pontos de criação

---

## 🧪 Testes Manuais

### Teste 1: Pedido Web
1. Criar pedido via web (página pública)
2. Verificar badge "🌐 WEB" no AppStaff
3. Verificar badge no KDS
4. **Resultado:** ✅ Badge azul "🌐 WEB" visível

### Teste 2: Pedido Garçom
1. Criar pedido via AppStaff (mobile)
2. Verificar badge "👤 GARÇOM" no AppStaff
3. Verificar badge no KDS
4. **Resultado:** ✅ Badge verde "👤 GARÇOM" visível

### Teste 3: Pedido Caixa
1. Criar pedido via TPV (merchant portal)
2. Verificar badge "💳 CAIXA" no AppStaff
3. Verificar badge no KDS
4. **Resultado:** ✅ Badge amarelo "💳 CAIXA" visível

---

## 📊 KPI Sofia (Para validar)

- **Meta:** 100% dos pedidos com badge de origem visível
- **Meta:** 0 casos de confusão de origem / semana

---

## 🔄 Rollback

Se necessário reverter:
1. Remover badges dos componentes
2. Remover `origin` dos inserts
3. Manter apenas mapeamento de origem (não quebra funcionalidade)

---

**Próxima Issue:** #3 - Clarificar ação "acknowledge" (ERRO-003)

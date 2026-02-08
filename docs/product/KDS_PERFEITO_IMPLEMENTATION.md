# KDS Perfeito — Plano de Implementação

**Data:** 2026-01-25  
**Status:** 📋 Plano  
**Objetivo:** Transformar KDS atual no KDS Perfeito

---

## 🎯 Objetivo

Criar o KDS perfeito onde:
- O cozinheiro vê imediatamente o que precisa fazer
- A confiança nasce naturalmente
- Zero ruído, máxima clareza

---

## 📊 Estado Atual vs. KDS Perfeito

### ✅ O Que Já Existe

1. **Timer de Pedido** (`OrderTimer.tsx`)
   - ✅ Funciona
   - ⚠️ Pode ser mais visível

2. **Badge de Origem** (parcial)
   - ✅ Badge "P. BALCÃO" para WEB
   - ❌ Falta TPV e Mobile

3. **Estados Visuais** (parcial)
   - ✅ Badge "NOVO" para pedidos novos
   - ⚠️ Diferença visual pode ser mais forte

4. **Ações**
   - ✅ Botões funcionam
   - ⚠️ Pode ser mais claro

---

## 🔨 Implementação — Fase por Fase

### FASE 1: Hierarquia Visual Absoluta

**Objetivo:** Tornar impossível confundir estados.

**Mudanças:**

1. **Pedido NOVO:**
   - Cor de fundo: Dourado (#FFC107)
   - Borda: 6px dourada
   - Tamanho: 20% maior
   - Animação: Pulsação suave (2s)

2. **Pedido EM PREPARO:**
   - Cor de fundo: Azul escuro (#1E40AF)
   - Borda: 4px azul
   - Tamanho: Normal
   - Animação: Nenhuma

3. **Pedido ATRASADO (>15min):**
   - Cor de fundo: Vermelho (#EF4444)
   - Borda: 6px vermelha
   - Tamanho: 20% maior
   - Animação: Pulsação rápida (1s)

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`  
**Componente:** `TicketCard`

---

### FASE 2: Origem Clara

**Objetivo:** Sempre mostrar de onde veio o pedido.

**Mudanças:**

1. **Criar componente `OriginBadge`:**
   ```tsx
   <OriginBadge origin={order.origin} />
   ```

2. **Mapear origens:**
   - `CAIXA` / `TPV` → Verde (#22C55E), ícone 💰
   - `WEB` / `WEB_PUBLIC` → Laranja (#F59E0B), ícone 🌐
   - `MOBILE` / `GARÇOM` → Azul (#3B82F6), ícone 📱

3. **Sempre visível:**
   - Header do ticket
   - Nunca esconder

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/components/OriginBadge.tsx` (novo)

---

### FASE 3: Tempo Visível

**Objetivo:** Timer sempre visível e destacado.

**Mudanças:**

1. **Melhorar `OrderTimer`:**
   - Aumentar tamanho da fonte
   - Destacar em pedidos atrasados
   - Adicionar ícone de alerta se >15min

2. **Posição:**
   - Canto superior direito
   - Sempre visível
   - Não esconder

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/OrderTimer.tsx`

---

### FASE 4: Ação Óbvia

**Objetivo:** Um botão claro, sem confusão.

**Mudanças:**

1. **Simplificar botões:**
   - Remover botões secundários
   - Um botão principal por estado

2. **Melhorar feedback:**
   - Loading state visível
   - Sucesso: check verde
   - Erro: banner vermelho

3. **Texto claro:**
   - "INICIAR PREPARO" (não "Iniciar Preparo →")
   - "MARCAR PRONTO" (não "Marcar Pronto ✓")

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`  
**Componente:** `TicketCard` (footer)

---

### FASE 5: Zero Ruído

**Objetivo:** Remover tudo que não ajuda a cozinha.

**Mudanças:**

1. **Remover:**
   - Informações irrelevantes
   - Animações desnecessárias
   - Textos longos
   - Estados intermediários confusos

2. **Manter:**
   - Mesa (número)
   - Itens (nome, quantidade)
   - Tempo (timer)
   - Origem (badge)
   - Ação (botão)

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`

---

## 📝 Checklist de Implementação

### Fase 1: Hierarquia Visual
- [ ] Refatorar `TicketCard` para estados distintos
- [ ] Implementar cores por estado
- [ ] Adicionar animações sutis
- [ ] Testar visibilidade a 2m

### Fase 2: Origem Clara
- [ ] Criar componente `OriginBadge`
- [ ] Mapear todas as origens
- [ ] Integrar no `TicketCard`
- [ ] Testar todas as origens

### Fase 3: Tempo Visível
- [ ] Melhorar `OrderTimer`
- [ ] Adicionar indicador de atraso
- [ ] Destacar timer em pedidos críticos
- [ ] Testar legibilidade

### Fase 4: Ação Óbvia
- [ ] Simplificar botões
- [ ] Adicionar feedback visual
- [ ] Melhorar mensagens de erro
- [ ] Testar usabilidade

### Fase 5: Zero Ruído
- [ ] Revisar informações exibidas
- [ ] Remover ruído
- [ ] Simplificar layout
- [ ] Testar com cozinheiro real

---

## 🎨 Mockup Visual

### Ticket NOVO

```
┌─────────────────────────────────────────────┐
│ [NOVO]  #12  [CAIXA 💰]  [05:23] ⚠️        │ ← Header (dourado, grande)
├─────────────────────────────────────────────┤
│ 2x Pizza Margherita                         │
│ 1x Coca-Cola                                │ ← Itens (claro)
│ Nota: Sem cebola                            │
├─────────────────────────────────────────────┤
│ [INICIAR PREPARO]                           │ ← Ação (grande, claro)
└─────────────────────────────────────────────┘
```

### Ticket EM PREPARO

```
┌─────────────────────────────────────────────┐
│ #12  [CAIXA 💰]  [08:45]                    │ ← Header (azul, normal)
├─────────────────────────────────────────────┤
│ 2x Pizza Margherita                         │
│ 1x Coca-Cola                                │ ← Itens
├─────────────────────────────────────────────┤
│ [MARCAR PRONTO]                              │ ← Ação (normal)
└─────────────────────────────────────────────┘
```

### Ticket ATRASADO

```
┌─────────────────────────────────────────────┐
│ [ATRASADO]  #12  [WEB 🌐]  [18:32] ⚠️⚠️⚠️   │ ← Header (vermelho, grande, pulsando)
├─────────────────────────────────────────────┤
│ 2x Pizza Margherita                         │
│ 1x Coca-Cola                                │ ← Itens
├─────────────────────────────────────────────┤
│ [MARCAR PRONTO]                              │ ← Ação (urgente)
└─────────────────────────────────────────────┘
```

---

## 🚀 Ordem de Implementação

1. **Fase 2 (Origem Clara)** — Mais rápido, impacto imediato
2. **Fase 3 (Tempo Visível)** — Melhora `OrderTimer` existente
3. **Fase 1 (Hierarquia Visual)** — Refatoração visual
4. **Fase 4 (Ação Óbvia)** — Simplificar botões
5. **Fase 5 (Zero Ruído)** — Limpeza final

---

## ✅ Critérios de Sucesso

### Para o Cozinheiro

- ✅ Vê imediatamente qual pedido é novo
- ✅ Sabe de onde veio (TPV/Web/Mobile)
- ✅ Vê o tempo sem calcular
- ✅ Sabe o que fazer (botão claro)
- ✅ Não se distrai (zero ruído)

### Para o Sistema

- ✅ Hierarquia visual funciona
- ✅ Origem sempre visível
- ✅ Tempo sempre atualizado
- ✅ Ação sempre clara
- ✅ Zero ruído mantido

---

**KDS Perfeito — Pronto para implementação.**

_Plano: 2026-01-25_

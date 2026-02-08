# 🍳 KDS de Produção Profissional — Implementação

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Princípio Fundamental

**O tempo de preparo NÃO pertence ao pedido.**  
**Pertence ao ITEM e à ESTAÇÃO (bar / cozinha).**

Isso é exatamente como sistemas sérios funcionam (Toast, Lightspeed, Oracle MICROS).

---

## ✅ Regra-Mãe do Sistema

### ❌ ERRADO (Modelo Antigo)
- Pedido tem tempo
- Pedido fica atrasado
- Comida e bebida tratados igual
- Cozinha não controla o próprio ritmo

### ✅ CORRETO (Modelo Novo)
- Cada item tem:
  - Tempo de preparo (`prep_time_seconds`)
  - Estação responsável (`station: 'BAR' | 'KITCHEN'`)
- O pedido herda o pior caso (item mais crítico)
- Bar e cozinha são fluxos independentes

---

## 🧾 Menu = Contrato Operacional

Quando o dono / gerente / cozinheiro cria ou edita um item do menu, ele define:

```typescript
MenuItem {
  id: string;
  name: string;
  station: 'KITCHEN' | 'BAR';  // Estação responsável
  prep_time_seconds: number;     // Tempo esperado de preparo
  prep_category?: 'drink' | 'starter' | 'main' | 'dessert';
}
```

**Exemplo realista:**

| Item | Estação | Tempo |
|------|---------|-------|
| Hambúrguer | Cozinha | 12 min (720s) |
| Pizza | Cozinha | 15 min (900s) |
| Nachos | Cozinha | 6 min (360s) |
| Água | Bar | 0.5 min (30s) |
| Refrigerante | Bar | 1 min (60s) |
| Cocktail | Bar | 4 min (240s) |

**📌 Isso NÃO muda por pedido.**  
**📌 Muda só quando o menu muda.**

---

## 🍳 Separação BAR x COZINHA

Essa separação resolve 90% do caos de restaurante.

### O que muda na prática:

**1. Um pedido pode gerar dois fluxos:**
- Itens de BAR
- Itens de COZINHA

**Eles:**
- Podem começar juntos
- Podem terminar em tempos diferentes
- Podem mudar de status de forma independente

**2. KDS mostra tabs separadas:**
- Tab "Todas" → Todos os itens
- Tab "🍳 Cozinha" → Só itens KITCHEN
- Tab "🍺 Bar" → Só itens BAR

---

## 🧠 Como o KDS pensa agora

### Estado não é mais só "OPEN → READY"

Ele vira **derivado**.

### Para cada item:

```typescript
OrderItem {
  station: 'BAR' | 'KITCHEN';
  prep_time_seconds: number;  // Snapshot do menu
  created_at: string;
  // expected_ready_at = created_at + prep_time_seconds
  // delay_seconds = now - expected_ready_at
  // delay_ratio = delay_seconds / prep_time_seconds
}
```

### Para cada estação:

```typescript
StationStatus {
  station: 'BAR' | 'KITCHEN';
  total_items: number;
  completed_items: number;
  estimated_finish: Date;
}
```

### Para o pedido:

**Pedido READY quando:**
- **TODOS os itens (BAR + COZINHA) estiverem READY**

---

## 🎨 Lógica de Cores (por Item)

| Estado | Regra | Cor | Exemplo |
|--------|-------|-----|---------|
| 🟢 Dentro do tempo | `delay_ratio < 0.1` | Verde | Ainda no prazo ou até 10% de tolerância |
| 🟡 Próximo do limite | `0.1 <= delay_ratio < 0.25` | Amarelo | 10-25% atrasado (atenção) |
| 🔴 Estourado | `delay_ratio >= 0.25` | Vermelho | +25% ou mais atrasado (crítico) |

**📌 Isso é por item, não por pedido.**

---

## 👨‍🍳 Quem controla o tempo?

**Podem definir / ajustar:**
- 👨‍🍳 Cozinheiro (se autorizado)
- 👔 Gerente
- 👑 Dono

**Onde?**
- Tela de edição do menu
- **NÃO no KDS**
- **NÃO no pedido**

---

## 🚫 Cliente (reforçando a regra)

**Nada disso vaza para o cliente.**

Cliente continua vendo só:
- ✅ Recebido
- 🍳 Em preparo
- ⏳ Quase pronto
- 🔔 Pronto

**Mesmo que:**
- Um item esteja atrasado
- O bar esteja lento
- A cozinha esteja sobrecarregada

**👉 A ansiedade é problema interno, não do cliente.**

---

## 🧱 O que você ganha com isso

### Operacional
- ✅ Menos interrupção na cozinha
- ✅ Bar não bloqueia comida
- ✅ Pedido não "fica injustamente atrasado"
- ✅ Cada estação controla seu próprio ritmo

### Técnica
- ✅ KDS passa a ser determinístico
- ✅ Dados históricos reais (tempo médio por item)
- ✅ Base perfeita para IA futura
- ✅ Separação clara de responsabilidades

### Produto
- ✅ Isso te coloca no nível dos grandes (Toast, Square, Lightspeed)
- ✅ E com mais clareza do que muitos deles

---

## ✅ Implementação Completa

### 1. Schema (Já implementado)

```sql
-- Produtos
ALTER TABLE gm_products
ADD COLUMN station TEXT DEFAULT 'KITCHEN' CHECK (station IN ('BAR', 'KITCHEN')),
ADD COLUMN prep_time_seconds INTEGER DEFAULT 300;

-- Order Items (snapshot)
ALTER TABLE gm_order_items
ADD COLUMN station TEXT CHECK (station IN ('BAR', 'KITCHEN')),
ADD COLUMN prep_time_seconds INTEGER;
```

### 2. KDS com Tabs por Estação (Já implementado)

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`

**Features:**
- ✅ Tabs: "Todas" | "🍳 Cozinha" | "🍺 Bar"
- ✅ Filtro automático por estação
- ✅ Itens agrupados por estação dentro de cada pedido
- ✅ Timer por item (não por pedido)
- ✅ Status por item (verde/amarelo/vermelho)

**Visual:**
```
KDS Mínimo - Pedidos Ativos

[Todas] [🍳 Cozinha] [🍺 Bar]

Pedido #82c11720
🟡 COZINHA Atenção
--------------------------------
🍳 COZINHA (2 itens)
  🟡 Hambúrguer x1    ⏱️ 14 min    R$ 25.00
  🟢 Bruschetta x1    ✅           R$ 12.00

🍺 BAR (1 item)
  🟢 Água x2          ✅           R$ 4.00
```

### 3. Timer por Item (Já implementado)

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/ItemTimer.tsx`

**Features:**
- ✅ Calcula tempo baseado em `prep_time_seconds` do item
- ✅ Status baseado em desvio relativo (não absoluto)
- ✅ Atualiza a cada 5 segundos

### 4. Status do Pedido Derivado (Já implementado)

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/OrderStatusCalculator.ts`

**Lógica:**
- ✅ Encontra item mais crítico (maior `delay_ratio`)
- ✅ Pedido herda estado do item mais crítico
- ✅ Pedido herda station do item mais crítico

---

## 📊 Exemplos de Uso

### Exemplo 1: Pedido Misto

**Pedido:**
- Água (BAR, 30s)
- Hambúrguer (KITCHEN, 12 min)

**Após 14 minutos:**
- Água: ✅ Pronto (já passou)
- Hambúrguer: 🟡 +2 min (14 min / 12 min = 1.17 = 17% atrasado)

**Status do pedido:** 🟡 COZINHA Atenção (herda do item mais crítico)

**Tab "🍺 Bar":**
- Mostra só a água
- Status: 🟢 No prazo

**Tab "🍳 Cozinha":**
- Mostra só o hambúrguer
- Status: 🟡 Atenção

### Exemplo 2: Pedido Só Bar

**Pedido:**
- Água (BAR, 30s)
- Cerveja (BAR, 45s)

**Após 2 minutos:**
- Água: 🔴 +90s (2 min / 30s = 4x = 300% atrasado)
- Cerveja: 🔴 +75s (2 min / 45s = 2.67x = 167% atrasado)

**Status do pedido:** 🔴 BAR Atrasado (herda do item mais crítico)

**Tab "🍺 Bar":**
- Mostra ambos os itens
- Status: 🔴 Atrasado

---

## 🚀 Próximos Passos (Opcional)

### 1. Ajuste Dinâmico de Tempo pelo Gerente
- Gerente pode ajustar `prep_time_seconds` em tempo real
- Baseado em condições do dia (ex: cozinha cheia = +20%)

### 2. IA Sugerindo Tempos Reais
- Coletar tempos reais de preparo
- IA sugere ajustes baseados em histórico
- Aprende padrões (ex: sexta à noite = mais lento)

### 3. Notificações por Estação
- Barista recebe notificação quando item BAR atrasa
- Cozinheiro recebe notificação quando item KITCHEN atrasa

---

## ✅ Status da Implementação

- ✅ Schema com station e prep_time_seconds
- ✅ RPC create_order_atomic copia station e prep_time
- ✅ KDS com tabs por estação
- ✅ Itens agrupados por estação
- ✅ Timer por item (não por pedido)
- ✅ Status derivado (pedido herda item mais crítico)
- ✅ Cores inteligentes (desvio relativo)
- ✅ Isolamento cliente (nunca vê produção interna)

---

**Implementado por:** Auto (Cursor AI)  
**Data:** 2026-01-26  
**Status:** ✅ PRONTO PARA TESTE

**Em uma frase:** Você saiu de um cronômetro genérico e entrou em um sistema de produção profissional. Esse é um salto de maturidade enorme.

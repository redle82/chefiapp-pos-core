# 👁️ UX: Visibilidade de Pedidos — Regras de Ouro

**Data:** 2026-01-26  
**Status:** ✅ Documentado

---

## 🎯 Regra de Ouro

> **Visibilidade deve reduzir ansiedade, não criar pressão.**  
> **Operação vê detalhe. Cliente vê tranquilidade.**

---

## 📊 Matriz de Visões

| Visão | Para Quem | O Que Mostra | Complexidade |
|-------|-----------|--------------|--------------|
| **KDS Completo** | Cozinha | Produção real, fila, tempos, alertas | 🔴 Alta |
| **Mini KDS** | Garçom / Gerente / Dono | Acompanhamento simplificado | 🟡 Média |
| **Customer Status View** | Cliente (Web/QR Mesa) | Status simples, sem detalhes | 🟢 Baixa |
| **Kitchen Mobile View** | Cozinha (sem tela dedicada) | Produção mínima, modo emergência | 🟡 Média |

---

## 1️⃣ Clientes Verem Pedido em Processo

### ✅ SIM — Se for do jeito certo

### ❌ NÃO — Se for igual ao KDS ou Mini KDS

---

### 🎯 O Que o Cliente Quer Saber

Apenas isso:

- ✅ **Pedido foi recebido?**
- ✅ **Está sendo preparado?**
- ✅ **Está pronto / a caminho?**

**Nada além disso.**

---

### 🚫 O Que o Cliente NÃO Deve Ver

**Isso gera ansiedade, pressão e reclamação:**

- ❌ Fila da cozinha
- ❌ Outros pedidos
- ❌ Tempos internos
- ❌ Atrasos reais
- ❌ Erros / retrabalhos
- ❌ Alertas de cozinha
- ❌ Comparação com outros pedidos

---

### 📱 Modelo Correto: Customer Order Status (COS)

**Para cliente:**
- ❌ **NÃO é KDS**
- ❌ **NÃO é Mini KDS**
- ✅ **É uma linha de status simples**

#### Exemplo Visual:

```
🧾 Pedido #123

✅ Recebido
🍳 Em preparo
⏳ Quase pronto
✅ Pronto
```

**Características:**
- ✅ Sem tempos exatos
- ✅ Sem cores de alerta
- ✅ Sem comparação com outros pedidos
- ✅ Sem detalhes operacionais
- ✅ Apenas estados visuais simples

---

### 💡 Benefícios Reais

- ✅ **Reduz "já vai demorar?"**
- ✅ **Reduz chamadas ao garçom**
- ✅ **Aumenta confiança**
- ✅ **Melhora experiência sem pressão**

---

### ✅ Conclusão para Clientes

**SIM, mostrar status simples é bom.**  
**NUNCA mostrar visão operacional.**

---

## 2️⃣ Cozinha Ver Pedidos no Telefone

### ⚠️ Depende do Contexto do Restaurante

---

### 🟢 Cenário A — Restaurante Pequeno / Food Truck / Bar

**✅ SIM, faz todo sentido.**

**Características:**
- 1 cozinheiro
- Espaço pequeno
- Sem monitor dedicado
- Celular preso num suporte

**👉 Nesse caso:**
- ✅ **Mini KDS para cozinha é válido**
- ✅ **Interface precisa ser:**
  - Extremamente simples
  - Botões grandes
  - Zero distração
  - Quase um "modo emergência"

---

### 🔴 Cenário B — Restaurante Médio/Grande

**❌ NÃO é recomendado como principal.**

**Motivos:**
- ❌ Celular distrai
- ❌ Notificações externas atrapalham
- ❌ Tela pequena prejudica visão geral
- ❌ Risco de perder pedidos

**👉 Aqui:**
- ✅ **Tela dedicada é o ideal**
- ✅ **Celular pode ser backup, não principal**

---

## 3️⃣ Diferença Crítica: Mini KDS ≠ KDS ≠ Cliente View

**Isso é importante deixar cristalino:**

### KDS Completo

**Para:** Cozinha  
**Mostra:** Produção real
- Fila completa
- Tempos exatos
- Alertas e prioridades
- Retrabalhos
- Comparação entre pedidos
- Detalhes operacionais

**Complexidade:** 🔴 Alta

---

### Mini KDS

**Para:** Garçom / Gerente / Dono  
**Mostra:** Acompanhamento
- Status dos pedidos
- Tempos aproximados
- Alertas visuais leves
- Visão geral simplificada

**Complexidade:** 🟡 Média

---

### Customer Status View (COS)

**Para:** Cliente (Web/QR Mesa)  
**Mostra:** Status simples
- ✅ Recebido
- 🍳 Em preparo
- ⏳ Quase pronto
- ✅ Pronto

**Complexidade:** 🟢 Baixa

**NUNCA mostra:**
- Fila
- Tempos
- Outros pedidos
- Alertas
- Detalhes operacionais

---

### Kitchen Mobile View

**Para:** Cozinha (sem tela dedicada)  
**Mostra:** Produção mínima
- Apenas pedidos ativos
- Botões grandes para ações
- Zero distração
- Modo emergência

**Complexidade:** 🟡 Média

**Características:**
- Interface extremamente simples
- Botões grandes
- Sem notificações externas
- Foco total em produção

---

## 🚨 Erro Crítico: Misturar Visões

**Misturar isso é erro de produto.**

### ❌ Erros Comuns

1. **Mostrar KDS completo para cliente**
   - Cliente vê fila, tempos, alertas
   - Gera ansiedade e reclamação

2. **Reaproveitar Mini KDS para cozinha**
   - Interface não otimizada para produção
   - Distrai e atrapalha

3. **Usar Customer View para operação**
   - Falta informação crítica
   - Impede trabalho eficiente

---

## 🎯 Resumo Direto

### Clientes verem pedido em processo?

- ✅ **SIM**
- Mas apenas status simplificado
- **NUNCA KDS / Mini KDS**

### Cozinha ver pedidos no telefone?

- ✅ **SIM**, em restaurantes pequenos ou sem tela
- ❌ **NÃO** como padrão universal
- Deve ser modo específico, não reaproveitamento cego

---

## 📐 Estados do Customer Status View

### Estados Permitidos

1. **✅ Recebido**
   - Pedido foi aceito pelo sistema
   - Cliente sabe que foi recebido

2. **🍳 Em preparo**
   - Cozinha começou a preparar
   - Sem detalhes de tempo

3. **⏳ Quase pronto**
   - Pedido está quase finalizado
   - Cliente se prepara para receber

4. **✅ Pronto**
   - Pedido está pronto
   - Cliente pode buscar ou será entregue

5. **🚚 A caminho** (opcional)
   - Pedido está sendo entregue
   - Apenas se aplicável

### Estados NÃO Permitidos

- ❌ "Atrasado"
- ❌ "Em fila"
- ❌ "Tempo estimado: X minutos"
- ❌ "Prioridade alta"
- ❌ "Aguardando ingrediente"
- ❌ Qualquer estado que gere ansiedade

---

## 🎨 Design Guidelines

### Customer Status View

**Princípios:**
- ✅ Cores suaves e tranquilizantes
- ✅ Ícones claros e universais
- ✅ Sem números ou tempos
- ✅ Sem comparações
- ✅ Feedback positivo sempre

**Paleta sugerida:**
- Recebido: 🟢 Verde suave
- Em preparo: 🟡 Amarelo suave
- Quase pronto: 🟠 Laranja suave
- Pronto: 🟢 Verde brilhante

**NUNCA usar:**
- 🔴 Vermelho (alerta)
- ⚫ Preto (negativo)
- Cores que gerem pressão

---

### Kitchen Mobile View

**Princípios:**
- ✅ Botões grandes (mínimo 48px)
- ✅ Texto grande (mínimo 16px)
- ✅ Contraste alto
- ✅ Zero distração
- ✅ Ações principais em destaque

**Layout:**
- Pedido atual em destaque
- Ações principais: "Iniciar", "Pronto", "Entregar"
- Sem scroll excessivo
- Sem informações secundárias

---

## 🔄 Fluxo de Estados

### Customer Status View

```
Cliente cria pedido
  ↓
✅ Recebido (imediato)
  ↓
🍳 Em preparo (quando cozinha inicia)
  ↓
⏳ Quase pronto (quando cozinha marca "quase pronto")
  ↓
✅ Pronto (quando cozinha marca "pronto")
  ↓
🚚 A caminho (opcional, se delivery)
```

**Transições:**
- Sempre positivas
- Sem retrocessos visíveis
- Sem estados de erro

---

## 📱 Implementação Técnica

### Customer Status View

**Componente:** `CustomerOrderStatus.tsx`

**Props:**
```typescript
interface CustomerOrderStatusProps {
  orderId: string;
  status: 'received' | 'preparing' | 'almost_ready' | 'ready' | 'on_the_way';
  // NUNCA passar:
  // - estimatedTime
  // - queuePosition
  // - delays
  // - errors
}
```

**Estados visuais:**
- `received` → ✅ Recebido
- `preparing` → 🍳 Em preparo
- `almost_ready` → ⏳ Quase pronto
- `ready` → ✅ Pronto
- `on_the_way` → 🚚 A caminho

---

### Kitchen Mobile View

**Componente:** `KitchenMobileView.tsx`

**Props:**
```typescript
interface KitchenMobileViewProps {
  orders: Order[];
  onAction: (orderId: string, action: 'start' | 'ready' | 'deliver') => void;
  // Interface mínima para produção
}
```

**Características:**
- Apenas pedidos ativos
- Botões grandes para ações
- Sem scroll excessivo
- Modo fullscreen (sem distrações)

---

## ✅ Checklist de Validação

### Customer Status View

- [ ] Não mostra fila
- [ ] Não mostra tempos
- [ ] Não mostra outros pedidos
- [ ] Não mostra alertas
- [ ] Não mostra erros
- [ ] Apenas estados simples
- [ ] Cores tranquilizantes
- [ ] Feedback positivo

### Kitchen Mobile View

- [ ] Botões grandes (mínimo 48px)
- [ ] Texto legível (mínimo 16px)
- [ ] Zero distração
- [ ] Apenas ações essenciais
- [ ] Modo fullscreen
- [ ] Sem notificações externas

---

## 🎯 Próximos Passos (Quando Implementar)

### 1. Definir Estados do Cliente

- [ ] Listar todos os estados permitidos
- [ ] Definir transições
- [ ] Criar componentes visuais
- [ ] Validar com usuários

### 2. Desenhar Kitchen Mobile Mode

- [ ] Definir interface mínima
- [ ] Criar layout otimizado
- [ ] Testar em dispositivos móveis
- [ ] Validar com cozinheiros

### 3. Separar Visões

- [ ] Garantir que Customer View ≠ KDS
- [ ] Garantir que Kitchen Mobile ≠ Mini KDS
- [ ] Criar componentes isolados
- [ ] Validar regras de visibilidade

---

## 📝 Notas Finais

**Regra de ouro repetida:**

> **Visibilidade deve reduzir ansiedade, não criar pressão.**  
> **Operação vê detalhe. Cliente vê tranquilidade.**

**Essa distinção é o que separa produto maduro de feature "bonita".**

---

**Documentação criada em:** 2026-01-26
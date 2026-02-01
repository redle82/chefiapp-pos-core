# 🧠 MENTORIA IA BASEADA NO RITUAL DE NASCIMENTO
## Estrutura para FASE C (Inteligência)

**Filosofia:** Mentoria IA só faz sentido depois que o sistema vive erros reais. Senão vira chatbot bonito.

**Base:** Interpretar eventos reais do Core, não inventar conselhos genéricos.

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### 1. Nunca Inventar
- ❌ "Você deveria fazer X" (sem base real)
- ✅ "Você teve 3 SLAs violados quando havia 30% menos staff" (baseado em eventos)

### 2. Contexto Real
- ❌ Mensagens genéricas
- ✅ Mensagens baseadas em:
  - Eventos reais
  - Padrões detectados
  - Histórico do restaurante
  - Momento operacional

### 3. Ação Acionável
- ❌ "Considere melhorar"
- ✅ "Adicione 1 pessoa no turno das 20h (previsão: 12 reservas)"

### 4. Tom Respeitoso
- ❌ Julgador, punitivo
- ✅ Educativo, construtivo

---

## 🧬 MENTORIA BASEADA NO RITUAL DE NASCIMENTO

### Fase 1: Pós-Ativação (Primeiros Passos)

**Quando:** Imediatamente após ativar restaurante

**Eventos que disparam:**
- `RESTAURANT_ACTIVATED`
- `FIRST_ORDER_CREATED`
- `FIRST_KDS_ITEM_CREATED`

**Mensagens:**

```
🎉 Seu restaurante foi ativado!

Seu primeiro pedido foi criado. Veja no KDS:
→ /employee/operation/kitchen

Próximos passos:
1. Configure quantidades mínimas no estoque
2. Adicione mais produtos ao cardápio
3. Crie turnos para sua equipe
```

**Ação sugerida:**
- Botão: "Ver KDS"
- Botão: "Configurar Estoque"

---

### Fase 2: Primeiros Erros (Aprendizado Inicial)

**Quando:** Primeiros erros reais acontecem

**Eventos que disparam:**
- `SLA_VIOLATED` (primeira vez)
- `STOCK_ZERO` (primeira vez)
- `TASK_OVERDUE` (primeira vez)

**Mensagens:**

#### SLA Violado (Primeira Vez)
```
⏱️ Seu primeiro SLA foi violado

O que aconteceu:
• Pedido #123 na Mesa 5
• Tempo: 18min / 15min (3min atrasado)
• Causa: KDS BAR bloqueado (falta item)

O que fazer:
1. Verificar estoque do item faltante
2. Adicionar ao estoque ou remover do pedido
3. Marcar item como pronto no KDS

Isso é normal no início. O sistema está aprendendo seus ritmos.
```

**Ação sugerida:**
- Botão: "Ver Pedido #123"
- Botão: "Ver Estoque"

#### Estoque Zerado (Primeira Vez)
```
📦 Estoque zerou pela primeira vez

Item: Tomate
• Estoque atual: 0kg
• Mínimo recomendado: 10kg
• Consumo médio: 2kg/hora

O que fazer:
1. Adicionar ao estoque agora
2. Configurar reposição automática
3. Ajustar quantidade mínima

Dica: Configure reposição automática para evitar isso no futuro.
```

**Ação sugerida:**
- Botão: "Comprar Agora"
- Botão: "Configurar Reposição"

---

### Fase 3: Padrões Detectados (Mentoria Avançada)

**Quando:** Sistema detecta padrões recorrentes

**Eventos que disparam:**
- Padrão detectado: "SLA violado sempre às 20h"
- Padrão detectado: "Estoque sempre zera no mesmo item"
- Padrão detectado: "Turno X sempre tem mais atrasos"

**Mensagens:**

#### Padrão: SLA Violado em Horário Específico
```
📊 Padrão detectado: SLAs violados às 20h

O que descobrimos:
• 12 SLAs violados esta semana
• 9 deles ocorreram entre 20h-21h
• Nesse horário, você tinha 30% menos staff

Causa provável:
Escala insuficiente para o pico das 20h

Sugestão:
Adicionar 1 pessoa no turno das 20h
→ Previsão: 12 reservas confirmadas
→ Impacto: Redução de 60% nos SLAs violados

[Ver Escala] [Aplicar Sugestão]
```

**Ação sugerida:**
- Botão: "Ver Escala"
- Botão: "Aplicar Sugestão" (cria turno automaticamente)

#### Padrão: Estoque Sempre Zera
```
📊 Padrão detectado: Estoque de Tomate sempre zera

O que descobrimos:
• Tomate zerou 3x esta semana
• Sempre às 14h-15h
• Consumo médio: 2kg/hora
• Reposição: manual (não automática)

Causa provável:
Quantidade mínima muito baixa + reposição manual

Sugestão:
1. Aumentar quantidade mínima para 20kg
2. Configurar reposição automática
3. Adicionar fornecedor com lead time de 2h

[Configurar Agora] [Ver Histórico]
```

**Ação sugerida:**
- Botão: "Configurar Reposição Automática"
- Botão: "Ver Histórico de Falhas"

---

### Fase 4: Decisões Estratégicas (Mentoria de Dono)

**Quando:** Padrões que afetam o negócio

**Eventos que disparam:**
- Padrão: "Margem baixa em produtos X"
- Padrão: "Turno Y sempre perde dinheiro"
- Padrão: "Reservas não convertem em pedidos"

**Mensagens:**

#### Decisão: Margem Baixa
```
💰 Oportunidade: Aumentar margem

Produto: Hambúrguer Artesanal
• Preço atual: R$ 25,00
• Custo: R$ 15,00
• Margem: 40%

Comparação:
• Média do mercado: 55%
• Seus outros produtos: 50%

Sugestão:
Aumentar preço para R$ 28,00
→ Margem: 46%
→ Impacto: +R$ 3,00 por venda
→ Previsão: Sem perda de vendas (produto popular)

[Ver Análise] [Aplicar Ajuste]
```

**Ação sugerida:**
- Botão: "Ver Análise Completa"
- Botão: "Aplicar Ajuste" (atualiza preço)

---

## 🏗️ ARQUITETURA DA MENTORIA IA

### Componentes

#### 1. MentorEngine (Core)
```typescript
// Interpreta eventos e gera mensagens
class MentorEngine {
  analyzeEvents(events: Event[]): Pattern[]
  generateMessage(pattern: Pattern): MentorshipMessage
  suggestAction(pattern: Pattern): Action
}
```

#### 2. PatternDetector
```typescript
// Detecta padrões em eventos
class PatternDetector {
  detectSLAViolationsByTime(): Pattern
  detectStockFailures(): Pattern
  detectShiftProblems(): Pattern
}
```

#### 3. MessageGenerator
```typescript
// Gera mensagens contextuais
class MessageGenerator {
  generateWelcomeMessage(): MentorshipMessage
  generateFirstErrorMessage(error: Event): MentorshipMessage
  generatePatternMessage(pattern: Pattern): MentorshipMessage
}
```

### Fluxo de Dados

```
Eventos Reais (Core)
    ↓
PatternDetector (analisa)
    ↓
Padrões Detectados
    ↓
MentorEngine (interpreta)
    ↓
MessageGenerator (cria mensagem)
    ↓
MentorPage (mostra para usuário)
    ↓
Feedback (útil/não útil)
    ↓
Aprendizado (melhora mensagens)
```

---

## 📊 TIPOS DE MENTORIA

### 1. Mentoria de Boas-Vindas
**Quando:** Pós-ativação
**Tom:** Entusiasmado, educativo
**Foco:** Primeiros passos

### 2. Mentoria de Primeiros Erros
**Quando:** Primeiros erros reais
**Tom:** Construtivo, não julgador
**Foco:** Aprender com erros

### 3. Mentoria de Padrões
**Quando:** Padrões detectados
**Tom:** Analítico, sugestivo
**Foco:** Melhorias operacionais

### 4. Mentoria Estratégica
**Quando:** Decisões de negócio
**Tom:** Executivo, data-driven
**Foco:** Crescimento e lucratividade

---

## 🎯 CRITÉRIO DE SUCESSO (FASE C)

✅ **Mentoria IA está pronta quando:**
- Mensagens são baseadas em eventos reais
- Sugestões são acionáveis
- Tom é respeitoso e educativo
- Feedback loop funciona (útil/não útil)
- Sistema aprende e melhora mensagens

---

## 🚀 PRÓXIMO PASSO

**Implementar FASE C só depois de:**
- ✅ FASE A completa (sistema vivo)
- ✅ FASE B completa (ciclo fechado)
- ✅ Erros reais acontecendo
- ✅ Histórico de eventos suficiente

**Então:**
1. Implementar MentorEngine
2. Implementar PatternDetector
3. Implementar MessageGenerator
4. Conectar com MentorPage
5. Testar com dados reais

---

**Documento criado em:** 26/01/2026  
**Status:** ✅ Estrutura pronta (aguardando FASE A + B)

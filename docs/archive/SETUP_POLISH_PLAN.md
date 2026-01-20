# Setup Polish Plan — Produto (Setup + Copy)

**Data**: 2025-01-27  
**Status**: 🚧 **EM PROGRESSO**

---

## 🎯 Objetivo

Aplicar polish comercial no wizard `/app/setup/*` para torná-lo:
- Mais persuasivo e orientado a valor
- Mais fluido com micro-feedbacks
- Mais profissional com loading states refinados
- Mais acionável com copy melhorada

---

## 📋 Análise do Estado Atual

### IdentityStep
**Copy atual:**
- "Qual é o nome do teu negócio?" → OK, mas pode ser mais acionável
- "É assim que os clientes te vão ver." → Bom, mas pode enfatizar valor
- "Guardar e continuar" → Funcional, mas genérico

**Oportunidades:**
- Enfatizar benefício (visibilidade, marca)
- Adicionar exemplo visual ou preview
- Melhorar feedback de sucesso

### MenuStep
**Copy atual:**
- "Cardápio vazio" → OK, mas pode ser mais positivo
- "O primeiro passo é organizar o menu..." → Bom, mas pode ser mais direto
- "Só precisamos de 1 para começar." → Excelente, manter

**Oportunidades:**
- Tom mais positivo (não "vazio", mas "pronto para começar")
- Enfatizar velocidade (1 item = pronto)
- Melhorar transição entre fases

### PaymentsStep
**A analisar...**

### DesignStep
**Copy atual:**
- "Escolhe o nível" → OK, mas pode explicar valor
- "Podes começar simples e fazer upgrade depois." → Bom, reduz fricção

**Oportunidades:**
- Explicar diferença entre níveis com benefícios claros
- Visual mais atrativo para seleção de plano

### PublishStep
**A analisar...**

---

## 🎨 Melhorias Planejadas

### 1. Copy Mais Comercial

**Princípios:**
- Foco em valor, não em features
- Tom positivo e acionável
- Reduzir fricção com linguagem clara
- Enfatizar benefícios imediatos

**Exemplos:**

**Antes:**
> "Qual é o nome do teu negócio?"

**Depois:**
> "Como queres que os clientes te encontrem?"

**Antes:**
> "Cardápio vazio"

**Depois:**
> "Vamos criar o teu menu"

**Antes:**
> "Guardar e continuar"

**Depois:**
> "Continuar" (se já salvou) ou "Criar e continuar" (se é criação)

---

### 2. Loading States Refinados

**Melhorias:**
- Skeleton loaders em vez de spinners genéricos
- Progresso visual claro (ex: "A guardar identidade...")
- Transições suaves entre estados
- Feedback imediato (otimistic updates quando possível)

---

### 3. Micro-Feedbacks

**Adicionar:**
- Toasts para ações bem-sucedidas
- Confirmações visuais (checkmarks animados)
- Progresso incremental visível
- Mensagens de encorajamento ("Quase lá!", "Excelente!")

---

### 4. Mensagens de Erro Melhoradas

**Princípios:**
- Tom amigável, não técnico
- Explicar o que aconteceu em linguagem simples
- Oferecer ação clara (o que fazer agora)
- Evitar culpar o usuário

**Exemplos:**

**Antes:**
> "Não foi possível guardar agora. Tenta novamente."

**Depois:**
> "Algo correu mal ao guardar. Verifica a tua ligação e tenta novamente."

---

### 5. CTAs Orientados a Valor

**Melhorias:**
- Copy que explica o próximo passo
- Benefício claro no botão
- Reduzir ansiedade ("Podes mudar depois")

**Exemplos:**

**Antes:**
> "Guardar e continuar"

**Depois:**
> "Criar identidade" → "Continuar para menu"

---

## 📊 Priorização

### Fase 1 (Alto Impacto, Baixo Esforço)
1. ✅ Copy dos títulos e descrições principais
2. ✅ Mensagens de erro mais amigáveis
3. ✅ CTAs mais acionáveis

### Fase 2 (Alto Impacto, Médio Esforço)
4. Loading states refinados
5. Micro-feedbacks (toasts, confirmações)
6. Progresso visual melhorado

### Fase 3 (Médio Impacto, Alto Esforço)
7. Animações e transições
8. Preview em tempo real
9. Exemplos visuais

---

## 🎯 Métricas de Sucesso

**Qualitativas:**
- Copy mais persuasiva e clara
- UX mais fluida e profissional
- Menos fricção no onboarding

**Quantitativas (futuro):**
- Taxa de conclusão do wizard
- Tempo médio por step
- Taxa de abandono por step

---

## 📝 Checklist de Implementação

### IdentityStep ✅
- [x] Copy do título mais acionável ("Como queres que os clientes te encontrem?")
- [x] Descrição enfatizando valor ("primeira impressão", "podes mudar depois")
- [x] CTA mais específico ("Criar identidade e continuar")
- [x] Mensagem de erro melhorada (tom amigável, acionável)
- [x] Feedback de sucesso mais visível ("Identidade criada com sucesso")

### MenuStep ✅
- [x] Tom mais positivo ("Vamos criar o teu menu" em vez de "vazio")
- [x] Copy enfatizando velocidade ("Só precisas de 1 item")
- [x] Mensagens de erro melhoradas
- [ ] Transição entre fases mais suave (próxima fase)
- [ ] Loading states refinados (próxima fase)

### PaymentsStep ✅
- [x] Copy mais orientada a valor ("Aceita pagamentos online")
- [x] Descrição mais clara sobre onde encontrar credenciais
- [x] Mensagens de sucesso melhoradas

### DesignStep ✅
- [x] Explicação de níveis com benefícios claros
- [x] Copy reduzindo fricção ("podes mudar depois")
- [x] Descrições mais acionáveis ("Cria o teu link único")
- [ ] Visual mais atrativo (próxima fase)

### PublishStep ✅
- [x] Copy mais persuasiva ("Estás pronto para publicar?")
- [x] Descrição enfatizando valor ("clientes poderão fazer pedidos")
- [x] CTA mais acionável ("Publicar página agora")
- [x] Mensagens de erro melhoradas

### SetupLayout ✅
- [x] Copy do sidebar mais comercial
- [x] Mensagens de preview mais claras
- [x] Banner de assinatura mais acionável

---

## ✅ Progresso Atual

### Fase 1: Copy Comercial (COMPLETO)

**Melhorias aplicadas:**
- ✅ Títulos mais acionáveis e orientados a valor
- ✅ Descrições enfatizando benefícios imediatos
- ✅ CTAs mais específicos e persuasivos
- ✅ Mensagens de erro mais amigáveis e acionáveis
- ✅ Feedback de sucesso mais visível
- ✅ Tom positivo em todo o fluxo

**Exemplos de melhorias:**

**IdentityStep:**
- Antes: "Qual é o nome do teu negócio?"
- Depois: "Como queres que os clientes te encontrem?"

**MenuStep:**
- Antes: "Cardápio vazio"
- Depois: "Vamos criar o teu menu"

**PublishStep:**
- Antes: "Tudo pronto para publicar?"
- Depois: "Estás pronto para publicar?" + descrição de valor

---

### Próximas Fases

**Fase 2: Loading States & Micro-Feedbacks** (Pendente)
- Skeleton loaders
- Progresso visual
- Toasts de confirmação
- Animações suaves

**Fase 3: Visual Refinements** (Pendente)
- Seleção de planos mais atrativa
- Preview em tempo real
- Exemplos visuais

---

**Status**: ✅ **FASE 1 COMPLETA** | 🚧 **FASE 2 PENDENTE**


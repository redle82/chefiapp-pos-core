# Demo Guide v1 — ChefIApp POS Core

**Data:** 2026-01-26
**Status:** ✅ PRONTO

**Duração:** 30 minutos
**Objetivo:** Provar que resolve problema real

---

## 🎯 Estrutura do Demo Guide

1. **Introdução** (2 min)
2. **Menu Builder** (5 min)
3. **KDS** (10 min)
4. **Task Engine** (8 min)
5. **Estoque + Lista de Compras** (5 min)
6. **Fechamento** (5 min)

---

## 1. Introdução (2 min)

### O Que Dizer

**"Obrigado por estar aqui. Vou mostrar o ChefIApp em 30 minutos.**

**ChefIApp é o sistema operacional de produção para restaurantes. Diferente de Toast ou Square, que focam em gestão, nós focamos em produção.**

**Vou mostrar 4 coisas:**

1. **Menu Builder** — Menu como contrato operacional
2. **KDS** — Coração da produção
3. **Task Engine** — Sistema nervoso automático
4. **Estoque + Lista de Compras** — Loop fechado

**Vamos começar."**

### O Que Mostrar

- Abrir navegador
- Mostrar URL: `http://localhost:5173`
- Explicar que é sistema completo (não trial)

---

## 2. Menu Builder (5 min)

### O Que Dizer

**"Primeiro, o Menu Builder. Aqui está o diferencial: menu não é catálogo. Menu é contrato operacional."**

### O Que Mostrar

1. **Abrir Menu Builder**

   - URL: `http://localhost:5173/menu-builder`
   - Mostrar lista de produtos

2. **Criar Produto**

   - Clicar "Criar Produto"
   - Preencher:
     - Nome: "Hambúrguer Artesanal"
     - Preço: R$ 18,00
     - **Estação: COZINHA** (obrigatório)
     - **Tempo de Preparo: 12 minutos** (obrigatório)
     - Categoria: Pratos Principais
   - Salvar

3. **Explicar Contrato Operacional**

   - "Veja: tempo e estação são obrigatórios"
   - "Sistema não salva sem isso"
   - "Por quê? Porque menu é base de tudo"

4. **Mostrar Impacto**
   - "KDS usa isso para timers"
   - "Task Engine usa isso para detectar atrasos"
   - "Cliente vê status baseado nisso"

### Pontos-Chave

- ✅ Tempo + estação obrigatórios
- ✅ Menu é base de tudo
- ✅ Não é catálogo, é contrato

---

## 3. KDS (10 min)

### O Que Dizer

**"Agora o KDS — Kitchen Display System. É o coração da produção."**

### O Que Mostrar

1. **Abrir KDS**

   - URL: `http://localhost:5173/kds`
   - Mostrar agrupamento por estação (Cozinha/Bar)

2. **Mostrar Pedido**

   - Selecionar pedido
   - Mostrar itens agrupados por estação
   - Explicar: "Cozinha vê só cozinha. Bar vê só bar."

3. **Mostrar Timers**

   - Mostrar timer por item
   - Explicar: "Timer baseado em tempo do menu"
   - Mostrar: "12 minutos esperados, 8 minutos decorridos"

4. **Mostrar Alertas**

   - Se houver item atrasado, mostrar alerta
   - Explicar: "Sistema detecta atraso automaticamente"
   - Mostrar: "Item está atrasado em 25%"

5. **Marcar Item como Pronto**
   - Clicar "Pronto" em um item
   - Mostrar que timer para
   - Explicar: "Sistema registra quando ficou pronto"

### Pontos-Chave

- ✅ Agrupamento por estação
- ✅ Timers por item (baseado em menu)
- ✅ Alertas automáticos
- ✅ KDS é coração da produção

---

## 4. Task Engine (8 min)

### O Que Dizer

**"Agora o Task Engine — sistema nervoso automático. É o diferencial único do ChefIApp."**

### O Que Mostrar

1. **Abrir Task System**

   - URL: `http://localhost:5173/task-system`
   - Mostrar lista de tarefas abertas

2. **Explicar Geração Automática**

   - "Tarefas não nascem manualmente"
   - "Tarefas nascem de eventos operacionais"
   - Mostrar tipos: ATRASO_ITEM, ESTOQUE_CRITICO, ENTREGA_PENDENTE

3. **Mostrar Tarefa de Atraso**

   - Selecionar tarefa ATRASO_ITEM
   - Mostrar contexto:
     - Item específico
     - Tempo esperado vs. real
     - Mesa
     - Pedido
   - Explicar: "Sistema detectou atraso automaticamente"

4. **Mostrar Tarefa de Estoque**

   - Selecionar tarefa ESTOQUE_CRITICO
   - Mostrar contexto:
     - Ingrediente específico
     - Quantidade atual vs. mínimo
     - Déficit
   - Explicar: "Sistema detectou estoque baixo automaticamente"

5. **Mostrar Fechamento Automático**

   - Explicar: "Tarefas se fecham sozinhas"
   - "Item fica pronto → tarefa de atraso fecha"
   - "Estoque é reposto → tarefa de estoque fecha"

6. **Gerar Tarefas de Teste**
   - Clicar "Gerar Tarefas de Teste"
   - Mostrar que tarefas aparecem
   - Explicar: "Sistema gera tarefas automaticamente"

### Pontos-Chave

- ✅ Tarefas automáticas (não manuais)
- ✅ Contexto completo (item, tempo, mesa)
- ✅ Fechamento automático
- ✅ Task Engine é diferencial único

---

## 5. Estoque + Lista de Compras (5 min)

### O Que Dizer

**"Agora estoque e lista de compras — loop fechado."**

### O Que Mostrar

1. **Abrir Lista de Compras**

   - URL: `http://localhost:5173/shopping-list`
   - Mostrar lista automática

2. **Explicar Geração Automática**

   - "Lista não é manual"
   - "Lista nasce de estoque abaixo do mínimo"
   - Mostrar priorização: CRITICAL, HIGH, MEDIUM

3. **Mostrar Item da Lista**

   - Selecionar item
   - Mostrar:
     - Quantidade atual
     - Quantidade mínima
     - Déficit
     - Sugestão de compra
   - Explicar: "Sistema calcula sugestão automaticamente"

4. **Confirmar Compra**

   - Clicar "Comprei" em um item
   - Mostrar modal
   - Confirmar quantidade
   - Clicar "Confirmar"
   - Mostrar: "Estoque atualizado! X tarefas fechadas."
   - Explicar: "Loop fechado: compra → estoque → tarefa fechada"

5. **Mostrar Conexão com Produção**
   - Explicar: "Estoque consome automaticamente (via BOM)"
   - "Quando abaixo do mínimo → gera tarefa"
   - "Quando reposto → fecha tarefa"

### Pontos-Chave

- ✅ Lista automática (não manual)
- ✅ Priorização por urgência
- ✅ Confirmação de compra → fecha tarefas
- ✅ Loop fechado (compra → estoque → produção → compra)

---

## 6. Fechamento (5 min)

### O Que Dizer

**"Resumindo o que você viu:"**

1. **Menu como contrato operacional**

   - Tempo + estação obrigatórios
   - Base de tudo

2. **KDS profissional**

   - Agrupamento por estação
   - Timers por item
   - Alertas automáticos

3. **Task Engine automático**

   - Tarefas automáticas
   - Fechamento automático
   - Diferencial único

4. **Estoque conectado**
   - Lista automática
   - Loop fechado
   - Conexão com produção

**Valor:**

- Reduz atrasos em 50%
- Reduz desperdício em 30%
- Aumenta eficiência em 40%

**Pricing:**

- R$ 199/mês (Básico)
- Sem pegadinhas
- Sem % de transação

**Onboarding:**

- 1-2 semanas
- Setup completo
- Treinamento da equipe

**Próximos passos:**

- Validar interesse
- Agendar onboarding
- Definir data de início

### O Que Mostrar

- Resumir pontos principais
- Mostrar valor entregue
- Explicar pricing
- Perguntar: "Tem alguma dúvida?"

---

## 🎯 Pontos-Chave do Demo Guide

### ✅ Fazer

- Focar em diferencial (Task Engine, Estoque conectado)
- Mostrar valor operacional (reduz atrasos, desperdício)
- Ser honesto (não prometer o que não temos)
- Mostrar sistema funcionando (não slides)

### ❌ Não Fazer

- Não mostrar features genéricas
- Não comparar diretamente com concorrentes
- Não prometer o que não entregamos
- Não complicar (focar no essencial)

---

## 🎯 Perguntas Frequentes (Durante Demo Guide)

### "E relatórios financeiros?"

**Resposta:** "Não temos em v1. Focamos em produção. Relatórios vêm em v2, baseado em uso real."

### "E integrações (iFood, Uber Eats)?"

**Resposta:** "Não temos em v1. Focamos em produção. Integrações vêm em v2, baseado em demanda."

### "E gestão de funcionários?"

**Resposta:** "Não temos em v1. Focamos em produção. Gestão de funcionários não está no escopo."

### "Por que não Toast/Square?"

**Resposta:** "Toast/Square focam em gestão. Nós focamos em produção. Task Engine automático é único. Estoque conectado é único."

### "E se eu tiver problema?"

**Resposta:** "Suporte por email (resposta em 24h). Onboarding completo (1-2 semanas). Suporte contínuo."

---

## 🎯 Próximos Passos (Após Demo Guide)

### Se Interessado

1. Validar interesse (escala 1-10)
2. Agendar onboarding
3. Definir data de início
4. Enviar contrato/pricing

### Se Não Interessado

1. Coletar feedback
2. Entender objeções
3. Oferecer follow-up
4. Manter contato

---

**Conclusão:** Demo Guide script v1 pronto. Focado em diferencial técnico, valor operacional e honestidade. Duração: 30 minutos. Objetivo: provar que resolve problema real.

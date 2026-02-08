# Nível 5 — Produção Real (Operação Assistida)

**Data:** 2026-01-26  
**Status:** 🎯 ESTRATÉGICO

---

## 🎯 Princípio-Base

> **Congelar construção. Ligar observação.**

O sistema não precisa de mais features. Precisa de **dados reais** para mostrar quem é.

---

## 📍 Onde Estamos

### ✅ Validado (Níveis 1-4)
- ✅ Arquitetura sólida
- ✅ Testes end-to-end determinísticos
- ✅ Multi-escala validada (S → XL)
- ✅ Invariantes explícitas
- ✅ Loop fechado (Pedido → Estoque → Compra → Tarefa)

### 🎯 Próximo Passo
**1 restaurante real operando por 30-60 dias**

---

## 🧭 Objetivo do Nível 5

Transformar o sistema de **protótipo validado** em **organismo vivo**.

Isso significa:
1. **Dados reais** substituindo simulações
2. **Erros reais** revelando pontos cegos
3. **Ajustes cirúrgicos** baseados em comportamento real
4. **Aprendizado contínuo** do sistema sobre si mesmo

---

## 🔧 Componentes do Nível 5

### 1. Operação Real (1 Restaurante)

**Setup:**
- 1 restaurante real (seu próprio ou parceiro)
- 1 equipe real (garçons, cozinha, bar)
- Menu real (produtos reais, tempos reais)
- Estoque real (ingredientes reais, mínimos reais)
- Pedidos reais (clientes reais, origens reais)

**Regras:**
- ✅ Task Engine **ligado** (não simulado)
- ✅ Estoque **conectado** (consumo real)
- ✅ Lista de compras **ativa** (compras reais)
- ✅ Tarefas **resolvidas** por humanos reais

### 2. Observabilidade (Sistema Nervoso)

**O que observar:**
- **Tarefas geradas vs. resolvidas**
  - Quantas tarefas são geradas por dia?
  - Quantas são resolvidas?
  - Quais tipos são mais frequentes?
  - Quais são ignoradas?

- **Estoque vs. Realidade**
  - Estoque calculado bate com estoque físico?
  - Lista de compras é útil?
  - Mínimos estão corretos?
  - Consumo está sendo registrado?

- **Tempos vs. Realidade**
  - `prep_time_seconds` do menu bate com tempo real?
  - Alertas de atraso são precisos?
  - KDS reflete realidade da cozinha?

- **Origens vs. Uso Real**
  - Qual origem é mais usada?
  - QR_MESA funciona bem?
  - APPSTAFF é útil?
  - TPV é necessário?

- **Multi-restaurante (se aplicável)**
  - Isolamento funciona na prática?
  - Dados não cruzam?
  - Performance aguenta?

### 3. Ajustes Cirúrgicos

**Processo:**
1. **Coletar dados** (7 dias)
2. **Identificar padrões** (análise semanal)
3. **Ajustar parâmetros** (não código)
4. **Validar mudança** (3-7 dias)
5. **Iterar**

**Exemplos de ajustes:**
- Ajustar `min_qty` de ingredientes (baseado em consumo real)
- Ajustar `prep_time_seconds` (baseado em tempos reais)
- Ajustar regras de geração de tarefas (baseado em ruído real)
- Ajustar prioridades (baseado em impacto real)

**NÃO fazer:**
- ❌ Adicionar novas features
- ❌ Refatorar código "por precaução"
- ❌ Otimizar prematuramente
- ❌ Mudar arquitetura

### 4. Aprendizado Contínuo

**O sistema aprende sobre si mesmo:**

- **Tarefas:**
  - Quais tarefas são sempre resolvidas?
  - Quais são sempre ignoradas?
  - Qual é o tempo médio de resolução?

- **Estoque:**
  - Qual é o padrão de consumo por dia da semana?
  - Qual é o tempo médio entre compra e uso?
  - Quais ingredientes têm maior variância?

- **Produção:**
  - Qual é o tempo real vs. tempo estimado?
  - Quais itens têm maior variância?
  - Quais estações são mais pressionadas?

---

## 📊 Métricas do Nível 5

### Semana 1-2: Baseline
- Pedidos/dia
- Tarefas geradas/dia
- Tarefas resolvidas/dia
- Itens na lista de compras
- Tempo médio de preparo (real vs. estimado)
- Taxa de erro (pedidos com problema)

### Semana 3-4: Ajustes
- Melhoria em tarefas resolvidas
- Melhoria em precisão de estoque
- Melhoria em precisão de tempos
- Redução de ruído (tarefas ignoradas)

### Semana 5-8: Estabilização
- Sistema "calibrado" para operação real
- Padrões claros identificados
- Ajustes finos aplicados
- Documentação de "como funciona na prática"

---

## 🎯 Critérios de Sucesso

### Mínimo (30 dias)
- ✅ Sistema roda 30 dias sem quebrar
- ✅ Dados reais coletados
- ✅ Padrões identificados
- ✅ Ajustes aplicados

### Ideal (60 dias)
- ✅ Sistema "calibrado" para operação real
- ✅ Tarefas úteis (taxa de resolução > 70%)
- ✅ Estoque preciso (diferença < 10%)
- ✅ Tempos precisos (diferença < 20%)
- ✅ Equipe confia no sistema

### Excelente (90 dias)
- ✅ Sistema é "necessário" (não só "útil")
- ✅ Equipe não consegue operar sem
- ✅ Dados alimentam decisões reais
- ✅ Pronto para escalar para 2-5 restaurantes

---

## 🚫 O Que NÃO Fazer

### ❌ Adicionar Features
- Não adicionar novas funcionalidades
- Não "melhorar" UI por enquanto
- Não criar novos relatórios
- Não integrar com sistemas externos

### ❌ Refatorar Código
- Não refatorar "por precaução"
- Não otimizar prematuramente
- Não mudar arquitetura
- Não "limpar" código que funciona

### ❌ Escalar Prematuramente
- Não abrir para múltiplos restaurantes ainda
- Não fazer onboarding público
- Não vender antes de validar
- Não criar marketing antes de dados

---

## ✅ O Que Fazer

### ✅ Observar
- Coletar dados diariamente
- Anotar comportamentos inesperados
- Documentar "como funciona na prática"
- Identificar padrões

### ✅ Ajustar
- Ajustar parâmetros (não código)
- Calibrar tempos
- Calibrar mínimos
- Calibrar regras de tarefas

### ✅ Validar
- Validar que ajustes melhoram métricas
- Validar que sistema é útil
- Validar que equipe confia
- Validar que dados são precisos

### ✅ Documentar
- Documentar "como funciona na prática"
- Documentar padrões identificados
- Documentar ajustes aplicados
- Documentar aprendizados

---

## 📋 Checklist Semanal

### Segunda-feira (Análise)
- [ ] Revisar métricas da semana anterior
- [ ] Identificar padrões
- [ ] Listar ajustes necessários
- [ ] Priorizar ajustes

### Terça-feira (Ajustes)
- [ ] Aplicar ajustes de parâmetros
- [ ] Documentar mudanças
- [ ] Comunicar à equipe (se necessário)

### Quarta a Domingo (Observação)
- [ ] Coletar dados diariamente
- [ ] Anotar comportamentos inesperados
- [ ] Validar que ajustes funcionam

---

## 🎯 Próximo Passo Após Nível 5

### Se Sucesso (60-90 dias)
- **Nível 6: Escala Controlada**
  - 2-5 restaurantes
  - Onboarding estruturado
  - Suporte dedicado
  - Coleta de feedback estruturada

### Se Ajustes Necessários
- Continuar Nível 5 por mais 30 dias
- Aplicar ajustes mais profundos
- Validar novamente

### Se Problemas Fundamentais
- Identificar problema raiz
- Ajustar arquitetura (se necessário)
- Retornar ao Nível 5 após ajuste

---

## 🧠 Filosofia

> **"O sistema não precisa ser perfeito. Precisa ser útil."**

No Nível 5, não estamos construindo. Estamos **aprendendo**.

E aprendemos observando o sistema **vivo**, não simulando.

---

## 📊 Relatórios do Nível 5

### Diário
- Pedidos criados
- Tarefas geradas/resolvidas
- Itens na lista de compras
- Erros encontrados

### Semanal
- Análise de padrões
- Ajustes aplicados
- Validação de ajustes
- Métricas de melhoria

### Mensal
- Resumo executivo
- Aprendizados principais
- Próximos passos
- Decisão: continuar Nível 5 ou avançar para Nível 6

---

**Conclusão:** O Nível 5 é onde o sistema para de ser "protótipo validado" e começa a ser "organismo vivo". É a fase mais importante porque é onde descobrimos **quem o sistema realmente é** quando operando no mundo real.

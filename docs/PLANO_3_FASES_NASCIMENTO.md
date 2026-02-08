# 🧬 PLANO 3 FASES — RITUAL DE NASCIMENTO
## Tornar o ChefIApp Vivo (Realista e Seguro)

**Filosofia:** Não é sobre perfeição. É sobre vida. Um restaurante operando de ponta a ponta com dados reais.

**Critério de Sucesso Final:** Após FASE C, o sistema está vivo, aprendendo, e pronto para escalar.

---

## 🎯 VISÃO GERAL

### FASE A — Tornar o sistema vivo (2-3 dias)
**Objetivo:** Criar restaurante → gerar pedido → ver no KDS

**Fases do wizard:** 1, 2, 7 (atalho direto para ativação)

**Resultado:** Sistema respira pela primeira vez.

---

### FASE B — Fechar o ciclo mínimo (1-2 dias)
**Objetivo:** Turnos existem, estoque consome, SLA faz sentido

**Fases do wizard:** 3, 4, 5 (adicionar ao que já existe)

**Resultado:** Sistema opera de ponta a ponta.

---

### FASE C — Inteligência (quando fizer sentido)
**Objetivo:** Mentoria IA baseada em erros reais

**Quando:** Depois que o sistema vive erros reais

**Resultado:** Sistema aprende e ensina.

---

## 🔥 FASE A — TORNAR O SISTEMA VIVO

### Objetivo
Criar restaurante mínimo → gerar primeiro pedido → ver no KDS em tempo real.

### Fases do Wizard
1. **Fase 1 — Identidade** (quem eu sou)
2. **Fase 2 — Existência Física** (onde eu estou)
3. **Fase 7 — Ativação** (abrir restaurante agora)

### O que NÃO fazer ainda
- ❌ Horários (Fase 3)
- ❌ Cardápio completo (Fase 4)
- ❌ Pessoas (Fase 5)
- ❌ Configuração operacional (Fase 6)

### O que fazer
- ✅ Criar restaurante com nome, tipo, país
- ✅ Criar endereço, mesas básicas (1-2 mesas só)
- ✅ Ativar restaurante
- ✅ Criar primeiro pedido de teste (hardcoded)
- ✅ Ver pedido aparecer no KDS

### Critério de Pronto (FASE A)
- ✅ Posso criar restaurante em 2 minutos
- ✅ Após ativar, vejo primeiro pedido no KDS
- ✅ Pedido tem status, tempo, aparece em tempo real
- ✅ Dashboard mostra dados reais (1 pedido, 1 restaurante)

### Commits Executáveis

#### Commit 1: Estrutura Base do Wizard
```
feat: criar estrutura base do wizard de onboarding

- Criar OnboardingWizard.tsx (container principal)
- Criar OnboardingContext.tsx (gerencia estado)
- Criar rotas /onboarding
- Criar navegação linear (voltar/próximo)
- Salvar progresso em localStorage
```

#### Commit 2: Fase 1 — Identidade
```
feat: implementar Fase 1 — Identidade do restaurante

- Criar IdentityStep.tsx
- Formulário: nome, tipo, país, fuso, moeda, idioma
- Validações básicas
- RPC: create_restaurant_identity()
- Salvar restaurant_id no contexto
```

#### Commit 3: Fase 2 — Existência Física (Simplificada)
```
feat: implementar Fase 2 — Localização (versão mínima)

- Criar LocationStep.tsx
- Formulário: endereço, cidade, CEP
- Input numérico: número de mesas (1-10)
- Gerar mesas automaticamente (simples: "Mesa 1", "Mesa 2", etc.)
- RPC: update_restaurant_location()
- RPC: create_tables_batch() (criar N mesas)
- Pular mapa por enquanto (adicionar depois)
```

#### Commit 4: Fase 7 — Ativação (Hardcoded)
```
feat: implementar Fase 7 — Ativação com pedido de teste

- Criar ActivationStep.tsx
- Resumo visual do que será criado
- Botão "ATIVAR RESTAURANTE 🚀"
- RPC: activate_restaurant()
  - Atualizar status = 'ACTIVE'
  - Criar pedido hardcoded:
    - Mesa: "Mesa 1"
    - Item: "Produto Teste" (criar automaticamente)
    - Status: OPEN
  - Criar evento MENTOR_WELCOME_MESSAGE
- Redirecionar para /owner/vision
```

#### Commit 5: Conectar KDS Real
```
feat: conectar KDS com pedidos reais

- Modificar KDSIntelligentPage.tsx
- Hook: useKDSByStation() → busca pedidos OPEN do banco
- Mostrar pedido de teste criado na ativação
- Tempo real: atualizar a cada 5s (polling simples)
- Mostrar status, tempo decorrido
```

#### Commit 6: Dashboard com Dados Reais
```
feat: dashboard mostra dados reais após ativação

- Modificar OwnerVisionPage.tsx
- Hook: useRestaurantStats() → busca dados reais
- Mostrar: 1 restaurante, 1 pedido, 0 SLAs
- Remover placeholders
- Mostrar primeiro pedido na lista
```

### Teste de Validação (FASE A)

**Cenário:**
1. Acessar `/onboarding`
2. Completar Fase 1 (Identidade)
3. Completar Fase 2 (Localização) → criar 2 mesas
4. Ativar (Fase 7)
5. Verificar:
   - ✅ Restaurante ativo no banco
   - ✅ Primeiro pedido criado
   - ✅ Pedido aparece no KDS
   - ✅ Dashboard mostra dados reais

**Critério de Pronto:**
- ✅ Fluxo completo funciona
- ✅ Dados persistem
- ✅ KDS mostra pedido em tempo real
- ✅ Zero placeholders no dashboard

---

## 🔄 FASE B — FECHAR O CICLO MÍNIMO

### Objetivo
Turnos existem, estoque consome, SLA faz sentido.

### Fases do Wizard (Adicionar)
3. **Fase 3 — Tempo** (horários, turnos)
4. **Fase 4 — Cardápio Mínimo** (3 produtos com ingredientes)
5. **Fase 5 — Pessoas** (gerente + 1 funcionário)

### O que muda
- ✅ Horários de funcionamento configurados
- ✅ Turnos padrão criados
- ✅ Cardápio mínimo (3 produtos)
- ✅ Estoque criado automaticamente (ingredientes)
- ✅ Pessoas cadastradas (gerente + funcionário)
- ✅ Primeiro pedido usa produto real (não hardcoded)
- ✅ Estoque consome quando pedido é processado

### Commits Executáveis

#### Commit 7: Fase 3 — Tempo
```
feat: implementar Fase 3 — Horários e Turnos

- Criar ScheduleStep.tsx
- Formulário: horários por dia da semana
- Botão "Aplicar a todos os dias"
- Seção: Turnos padrão (Manhã, Tarde)
- RPC: create_schedules_batch()
- RPC: create_shift_templates()
```

#### Commit 8: Fase 4 — Cardápio Mínimo
```
feat: implementar Fase 4 — Cardápio Mínimo Vivo

- Criar MenuStep.tsx
- Formulário repetível para produtos (mínimo 3)
- Campos: nome, preço, categoria, estação
- Checkbox: "Consome estoque?"
- Se sim: lista de ingredientes (nome, quantidade, unidade)
- RPC: create_products_batch()
- RPC: create_recipes() (ingredientes)
- RPC: create_inventory_items_if_not_exists() (cria estoque automaticamente)
- Alerta: "Itens criados no estoque. Configure quantidades depois."
```

#### Commit 9: Fase 5 — Pessoas
```
feat: implementar Fase 5 — Pessoas

- Criar PeopleStep.tsx
- Seção: Criar Gerente (nome, email)
- Seção: Criar Funcionário (nome, email, função)
- Validação: email único
- RPC: create_user_with_role()
- RPC: assign_user_role()
```

#### Commit 10: Atualizar Ativação (Usar Produto Real)
```
feat: ativação usa produto real do cardápio

- Modificar activate_restaurant() RPC
- Em vez de produto hardcoded, usar primeiro produto do cardápio
- Se não houver produtos, mostrar erro: "Crie pelo menos 1 produto antes de ativar"
- Pedido de teste usa produto real
- Estoque consome ingredientes automaticamente
```

#### Commit 11: Conectar Estoque Real
```
feat: conectar estoque com consumo real

- Modificar StockRealPage.tsx
- Hook: useStockItems() → busca estoque atual
- Hook: useStockConsumption() → calcula consumo das últimas 24h
- Mostrar itens criados no wizard
- Mostrar consumo quando pedido é processado
- Alerta: "Configure quantidades mínimas"
```

### Teste de Validação (FASE B)

**Cenário:**
1. Completar wizard completo (Fases 1-5, 7)
2. Criar restaurante com:
   - 2 mesas
   - Horários configurados
   - 3 produtos (1 com ingredientes)
   - 1 gerente + 1 funcionário
3. Ativar restaurante
4. Verificar:
   - ✅ Primeiro pedido usa produto real
   - ✅ Estoque consome ingredientes
   - ✅ KDS mostra pedido com produto real
   - ✅ Dashboard mostra dados completos

**Critério de Pronto:**
- ✅ Ciclo completo funciona: pedido → KDS → estoque
- ✅ Dados persistem
- ✅ Estoque consome automaticamente
- ✅ Sistema operacional de ponta a ponta

---

## 🧠 FASE C — INTELIGÊNCIA

### Objetivo
Mentoria IA baseada em erros reais, não em placeholders.

### Quando Implementar
**Só depois que:**
- ✅ FASE B está completa
- ✅ Sistema opera com dados reais
- ✅ Erros reais acontecem (SLA violado, estoque zerado, etc.)
- ✅ Há histórico de eventos para interpretar

### O que fazer
- ✅ Mentoria IA interpreta eventos reais
- ✅ Sugestões baseadas em padrões detectados
- ✅ Feedback contextual (não genérico)
- ✅ Aprendizado contínuo

### Estrutura da Mentoria IA

**Baseada no Ritual de Nascimento:**

1. **Mentoria Pós-Ativação**
   - "Seu primeiro pedido foi criado! Veja no KDS."
   - "Configure quantidades mínimas no estoque."

2. **Mentoria de Primeiros Erros**
   - "Você teve 3 SLAs violados hoje. Isso aconteceu quando havia 30% menos staff."
   - "Estoque de Tomate zerou. Configure reposição automática."

3. **Mentoria de Padrões**
   - "Você sempre atrasa quando há mais de 20 pedidos simultâneos. Considere aumentar staff."
   - "Turno das 20h tem 40% mais SLAs violados. Revise escala."

### Commits Executáveis (FASE C - Futuro)

```
feat: implementar Mentoria IA baseada em eventos reais

- Criar MentorEngine.ts (interpreta eventos)
- Detectar padrões: SLA violado, estoque zerado, atrasos
- Gerar mensagens contextuais
- Hook: useMentorshipMessages()
- Modificar MentorPage.tsx para mostrar mensagens reais
- Feedback loop: marcar como útil/não útil
```

---

## 📊 RESUMO EXECUTIVO

### FASE A (2-3 dias)
**Foco:** Vida mínima
- Identidade + Localização + Ativação
- Primeiro pedido no KDS
- Dashboard com dados reais

### FASE B (1-2 dias)
**Foco:** Ciclo completo
- Tempo + Cardápio + Pessoas
- Estoque consome
- Sistema operacional

### FASE C (Quando fizer sentido)
**Foco:** Inteligência
- Mentoria IA real
- Aprendizado contínuo
- Feedback contextual

---

## 🎯 CRITÉRIO DE SUCESSO FINAL

✅ **Sistema está "vivo" quando:**
- Posso criar restaurante completo em 5-10 minutos
- Primeiro pedido aparece no KDS automaticamente
- Estoque consome baseado em pedidos reais
- Dashboard mostra dados reais (não placeholders)
- Sistema opera de ponta a ponta
- **Zero placeholders visíveis**
- **Todos os dados vêm do banco**

---

## 🚀 PRÓXIMO PASSO IMEDIATO

**Começar FASE A agora:**
1. Criar estrutura base do wizard
2. Implementar Fase 1 (Identidade)
3. Implementar Fase 2 (Localização simplificada)
4. Implementar Fase 7 (Ativação hardcoded)
5. Conectar KDS real
6. Testar fluxo completo

**Tempo estimado:** 2-3 dias úteis

**Depois disso:** FASE B (fechar ciclo) → FASE C (inteligência)

---

**Documento criado em:** 26/01/2026  
**Status:** ✅ Pronto para execução (FASE A)

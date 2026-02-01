# Melhorias de UX Identificadas - ChefIApp

**Data:** [Data]  
**Fonte:** Análise do Piloto de 7 Dias

---

## Princípio Fundamental

**Todas as melhorias são de CLAREZA, não de REGRAS.**

- ✅ Melhorar mensagens
- ✅ Adicionar tooltips
- ✅ Melhorar feedback visual
- ✅ Adicionar contexto
- ❌ NÃO mudar regras do Core
- ❌ NÃO contornar constraints
- ❌ NÃO flexibilizar validações

---

## Melhorias Priorizadas

### 1. Mensagem de Constraint "Uma Mesa = Um Pedido Aberto"

**Problema Atual:**
- Mensagem genérica: "Já existe um pedido ativo para esta mesa"
- Não mostra qual pedido está aberto
- Não sugere ação específica

**Melhoria Proposta:**
```
Esta mesa já possui um pedido aberto (#123).
Feche ou pague o pedido #123 antes de criar um novo,
ou escolha outra mesa.
```

**Implementação:**
- Modificar `ErrorMessages.ts` para incluir número do pedido
- Buscar pedido ativo da mesa antes de mostrar erro
- Adicionar botão "Abrir pedido existente" na mensagem

**Arquivos a modificar:**
- `merchant-portal/src/core/errors/ErrorMessages.ts`
- `merchant-portal/src/pages/TPV/components/ErrorModal.tsx` (criar se não existir)

---

### 2. Tooltip Explicativo em Ações Bloqueadas

**Problema Atual:**
- Botões ficam desabilitados sem explicação
- Usuário não sabe por que não pode fazer ação

**Melhoria Proposta:**
- Adicionar tooltip quando botão está desabilitado
- Explicar motivo: "Mesa já tem pedido aberto", "Caixa fechado", etc.

**Implementação:**
- Criar componente `Tooltip` reutilizável
- Adicionar `title` ou componente tooltip em botões desabilitados
- Usar `getErrorMessage` para gerar texto do tooltip

**Arquivos a criar/modificar:**
- `merchant-portal/src/ui/design-system/components/Tooltip.tsx` (criar)
- `merchant-portal/src/pages/TPV/TPV.tsx` (adicionar tooltips)

---

### 3. Feedback Visual Quando Bloqueado

**Problema Atual:**
- Ação falha silenciosamente ou com toast genérico
- Não há indicação visual clara de que ação foi bloqueada

**Melhoria Proposta:**
- Mostrar banner/alert quando constraint bloqueia
- Usar cores distintas (vermelho para erro, amarelo para aviso)
- Mostrar por 5-10 segundos antes de desaparecer

**Implementação:**
- Criar componente `ConstraintAlert`
- Mostrar quando erro de constraint é detectado
- Incluir ação sugerida no alert

**Arquivos a criar:**
- `merchant-portal/src/pages/TPV/components/ConstraintAlert.tsx`

---

### 4. Dashboard: Mostrar Pedidos Bloqueados Recentemente

**Problema Atual:**
- Dashboard não mostra quando pedidos foram bloqueados
- Gerente não vê histórico de problemas

**Melhoria Proposta:**
- Adicionar seção "Pedidos Bloqueados (últimas 24h)" no dashboard
- Mostrar: mesa, motivo, hora, ação sugerida

**Implementação:**
- Criar tabela de logs de bloqueios (ou usar eventos existentes)
- Adicionar widget no `DashboardZero.tsx`
- Atualizar a cada 30 segundos

**Arquivos a modificar:**
- `merchant-portal/src/pages/Dashboard/components/ActiveIssuesWidget.tsx`
- Adicionar seção de bloqueios recentes

---

### 5. Indicador de "Por Que Não Posso Fazer Isso?"

**Problema Atual:**
- Usuário tenta ação, falha, mas não entende por quê
- Precisa adivinhar ou pedir ajuda

**Melhoria Proposta:**
- Adicionar ícone "?" ao lado de ações bloqueadas
- Ao clicar, mostrar modal explicativo
- Explicar regra de negócio de forma simples

**Implementação:**
- Criar componente `WhyCantIDoThisModal`
- Adicionar ícone de ajuda em botões/inputs
- Mostrar explicação da regra quando clicado

**Arquivos a criar:**
- `merchant-portal/src/pages/TPV/components/WhyCantIDoThisModal.tsx`

---

## Implementação

### Fase 1: Mensagens Melhoradas (Prioridade Alta)
- [ ] Melhorar `ErrorMessages.ts` com contexto
- [ ] Adicionar busca de pedido ativo antes de mostrar erro
- [ ] Criar `ErrorModal.tsx` se não existir

### Fase 2: Feedback Visual (Prioridade Alta)
- [ ] Criar `ConstraintAlert.tsx`
- [ ] Integrar em TPV quando constraint bloqueia
- [ ] Adicionar tooltips em botões desabilitados

### Fase 3: Dashboard Melhorado (Prioridade Média)
- [ ] Adicionar seção de bloqueios recentes
- [ ] Melhorar `ActiveIssuesWidget.tsx`

### Fase 4: Explicações Contextuais (Prioridade Baixa)
- [ ] Criar `WhyCantIDoThisModal.tsx`
- [ ] Adicionar ícones de ajuda

---

## Validação

Após implementar cada melhoria:

1. Testar se mensagem é mais clara
2. Validar com usuário real (se possível)
3. Medir redução de confusões
4. Documentar resultado

---

## Não Fazer

- ❌ Não mudar regras do Core
- ❌ Não contornar constraints
- ❌ Não flexibilizar validações
- ❌ Não adicionar "modo admin" para bypass
- ❌ Não remover validações "para facilitar"

---

*"Melhorar clareza, não mudar regras. O Core está correto, a comunicação precisa melhorar."*

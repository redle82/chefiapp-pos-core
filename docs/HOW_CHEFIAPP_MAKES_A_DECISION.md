# 🧠 Como o ChefIApp Toma uma Decisão (Exemplo Real)

**Data**: 2025-01-02  
**Objetivo**: Exemplo concreto de uma decisão do sistema  
**Tom**: Calmo, técnico, sem hype

---

## 📋 Cenário Real

**Situação**: Cliente da Mesa 7 chama o garçom 3 vezes em 4 minutos.

---

## 🔄 Fluxo Completo da Decisão

### 1. Evento Acontece

**Evento 1** (primeira chamada):
- Tipo: `waiter_call`
- Prioridade: P1 (Alta)
- Contexto: `{ table_id: "table_7", table_number: 7 }`
- Dedupe Key: `waiter_call_table_7`

**Sistema**: Event Bus recebe e registra.

---

### 2. Regra Avalia

**Routing Rule**: "Waiter Call → Create Task"
- Condição: `event_type = 'waiter_call'`
- Ação: `create_task` para role `waiter`
- Prioridade: P1

**Sistema**: Regra aplicada. Tarefa criada no AppStaff.

**Decision Log**:
```json
{
  "action_type": "create_task",
  "rule_name": "Waiter Call → Create Task",
  "task_id": "task_123",
  "priority": "P1"
}
```

---

### 3. Eventos Seguintes (Deduplicação)

**Evento 2** (segunda chamada, 2 minutos depois):
- Tipo: `waiter_call`
- Dedupe Key: `waiter_call_table_7` (mesma chave)

**Sistema**: Detecta duplicata. Atualiza evento existente:
- Incrementa `duplicate_count` para 2
- Mantém mesma tarefa

**Evento 3** (terceira chamada, 4 minutos depois):
- Tipo: `waiter_call`
- Dedupe Key: `waiter_call_table_7` (mesma chave)

**Sistema**: Detecta duplicata. Atualiza evento existente:
- Incrementa `duplicate_count` para 3
- **Escalação**: Prioridade P1 → P0 (Crítica)

**Nova Regra Aplicada**: "Waiter Call Repeated → Escalate"
- Condição: `duplicate_count >= 3`
- Ação: `escalate_priority` + `notify_manager`
- Prioridade: P0

**Decision Log** (atualizado):
```json
{
  "action_type": "escalate_priority",
  "rule_name": "Waiter Call Repeated → Escalate",
  "previous_priority": "P1",
  "new_priority": "P0",
  "reason": "3 chamados em 4 minutos"
}
```

---

### 4. Decisão Registrada

**GovernManage** registra no `govern_decision_log`:

- **Evento Original**: `waiter_call`
- **Regra Aplicada**: "Waiter Call Repeated → Escalate"
- **Ação Tomada**: Escalação P1 → P0 + Notificação Manager
- **Payload**: Snapshot completo do contexto
- **Dedupe Info**: 3 eventos consolidados

**Resumo Legível**:
> "3 eventos similares → Regra: Waiter Call Repeated → Escalação para P0 → Notificação enviada"

---

### 5. Tarefa Criada (Visível)

**AppStaff** recebe tarefa:

- **Título**: "URGENTE: Mesa 7 chamando repetidamente"
- **Prioridade**: P0 (Crítica)
- **Descrição**: "Cliente chamou 3 vezes em 4 minutos"
- **Assignee**: Waiter + Manager (ambos notificados)

---

### 6. Por Quê Visível

**Task Why Badge** (quando implementado):

- **Badge**: "Criada por regra 'Waiter Call Repeated' após 3 chamados"
- **Link**: Ver decisão completa no GovernManage
- **Contexto**: Mesa 7, 3 chamados em 4 minutos

**Usuário vê**: "Ah, entendi. O sistema detectou padrão e escalou."

---

## 📊 Timeline Completa

```
14:32:10 → Cliente chama garçom (1ª vez)
           Evento: waiter_call (P1)
           Regra: "Waiter Call → Create Task"
           Ação: Tarefa criada para Waiter
           Decision Log: Registrado

14:34:15 → Cliente chama garçom (2ª vez)
           Evento: waiter_call (duplicata detectada)
           Sistema: Incrementa duplicate_count = 2
           Decision Log: Atualizado (mesma tarefa)

14:36:22 → Cliente chama garçom (3ª vez)
           Evento: waiter_call (duplicata detectada)
           Sistema: Incrementa duplicate_count = 3
           Regra: "Waiter Call Repeated → Escalate"
           Ação: Prioridade P1 → P0 + Notificar Manager
           Decision Log: Nova decisão registrada

14:36:23 → Tarefa atualizada no AppStaff
           Prioridade: P0 (Crítica)
           Título: "URGENTE: Mesa 7 chamando repetidamente"
           Assignees: Waiter + Manager
```

---

## 🎯 O Que Isso Prova

### 1. Sistema Não Decide Sozinho
- Cada decisão é registrada
- Cada regra é visível
- Cada ação é explicável

### 2. Deduplicação Funciona
- 3 chamados = 1 tarefa (não 3)
- Sistema consolida automaticamente
- Evita spam operacional

### 3. Escalação Inteligente
- Padrão detectado (3 chamados)
- Prioridade aumenta automaticamente
- Manager é notificado

### 4. Rastreabilidade Total
- Timeline completa
- Decision Log com payload
- "Por quê" visível

---

## 💡 Por Que Isso É Diferente

### Outros Sistemas
- ❌ Criariam 3 tarefas separadas
- ❌ Não escalariam automaticamente
- ❌ Não explicariam "por quê"

### ChefIApp
- ✅ 1 tarefa consolidada
- ✅ Escalação automática
- ✅ Explicação completa

**Resultado**: Sistema que pensa, não apenas executa.

---

## 🎯 Mensagem Final

Este exemplo mostra que o ChefIApp:

1. **Observa** (Event Bus percebe os 3 chamados)
2. **Decide** (Regra avalia e escala)
3. **Explica** (Decision History documenta tudo)

**Não é automação cega. É governo inteligente.**

---

**Mensagem**: "O sistema não executa ordens. Ele observa, decide e explica."


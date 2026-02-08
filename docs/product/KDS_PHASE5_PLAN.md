# KDS Fase 5: Zero Ruído - Plano de Implementação

**Data:** 2026-01-25
**Status:** 🚧 Em Análise

---

## 🎯 Objetivo

Remover informações desnecessárias do KDS para que o cozinheiro foque apenas no essencial:

- **O que fazer** (pedido)
- **Quando fazer** (tempo/urgência)
- **De onde veio** (origem)
- **Ação clara** (botão)

---

## 📊 Análise de Ruído Identificado

### 1. Header - Informações Redundantes

**❌ Remover:**

- **Hora atual** (linha 798) - Redundante, já tem timer nos tickets
- **Status de sync detalhado** (linha 789-790) - Muito técnico, pode ser simplificado
- **Timestamp de último evento** - Não é informação operacional

**✅ Manter:**

- Indicador de conexão (🟢/🔴) - Essencial
- Badge de pedidos não vistos - Útil
- Título da estação - Essencial

---

### 2. Ticket Card - Informações Redundantes

**❌ Remover:**

- **Hora de criação do pedido** (linha 255) - Redundante com OrderTimer
- **Badge "PAGO"** (linha 238-251) - Não é informação crítica para cozinha
- **Informações técnicas** que não impactam preparo

**✅ Manter:**

- Número da mesa - Essencial
- Origem (OriginBadge) - Essencial (Fase 2)
- Timer (OrderTimer) - Essencial (Fase 3)
- Itens do pedido - Essencial
- Botão de ação - Essencial (Fase 4)

---

### 3. Item Timer - Avaliar Necessidade

**❌ Possível remover se:**

- Timer do pedido já mostra urgência geral
- Adiciona complexidade visual
- Não é usado operacionalmente

**✅ Manter se:**

- Cozinha usa para timing de itens específicos
- Diferencia urgência por item

---

## 🎨 Simplificações Propostas

### Header Simplificado

**Antes:**

```
🟢 Sync: 20:19:45  |  20:19
```

**Depois:**

```
🟢 Conectado
```

Ou apenas o indicador visual (🟢/🔴) sem texto.

---

### Ticket Card Simplificado

**Antes:**

```
#12 [CAIXA 💰] [PAGO] | 15 min | 20:15
```

**Depois:**

```
#12 [CAIXA 💰] | 15 min
```

Remover:

- Badge "PAGO" (não é informação de cozinha)
- Hora de criação (redundante com timer)

---

### Status de Conexão Simplificado

**Antes:**

```
🟢 Sync: 20:19:45
⚠️ Sem eventos recentes
🔴 Desconectado
```

**Depois:**

```
🟢
⚠️
🔴
```

Ou apenas cores sem texto técnico.

---

## ✅ Checklist de Implementação

- [ ] Remover hora atual do header
- [ ] Simplificar status de conexão (apenas indicador visual)
- [ ] Remover hora de criação do ticket
- [ ] Remover badge "PAGO" do ticket
- [ ] Avaliar necessidade do ItemTimer
- [ ] Testar visualmente
- [ ] Validar que informações essenciais permanecem

---

## 🎯 Critérios de Sucesso

**KDS está "Zero Ruído" quando:**

1. ✅ Cozinheiro vê apenas informações operacionais
2. ✅ Não há informações redundantes
3. ✅ Layout está mais limpo e focado
4. ✅ Decisões são mais rápidas
5. ✅ Menos distrações visuais

---

**Próximo passo:** Implementar simplificações identificadas.

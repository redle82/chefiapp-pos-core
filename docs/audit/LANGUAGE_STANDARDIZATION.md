# 📝 Padronização de Linguagem - ChefIApp 2.0.0-RC1

**Objetivo:** Eliminar confusão humana através de linguagem clara e específica.

---

## 🎯 Princípios Fundamentais

1. **Específico > Genérico**
2. **Contexto > Abstração**
3. **Ação > Estado**
4. **Humano > Técnico**

---

## 📋 Tabela Completa de Padronização

### Ações do AppStaff 2.0

| Texto Atual | Texto Novo | Onde Aparece | Por Que Melhora | Status |
|------------|------------|--------------|-----------------|--------|
| `acknowledge` | **VER PEDIDO** | NowActionCard, NowEngine | Claro: garçom precisa ver o pedido, não "confirmar" algo abstrato | ✅ |
| `CONFIRMAR` | **VER PEDIDO** | Botão de ação | Não é "confirmar" algo abstrato, é ver o pedido | ✅ |
| `check` | **VERIFICAR** | NowActionCard | Mantém, mas mensagem específica | 🔄 |
| `resolve` | **RESOLVER** | NowActionCard | Mantém, mas mensagem específica | 🔄 |
| `prioritize_drinks` | **PRIORIZAR BEBIDAS** | NowActionCard | Mantém label, melhora mensagem | 🔄 |

### Mensagens do NowEngine

| Texto Atual | Texto Novo | Contexto | Por Que Melhora | Status |
|------------|------------|----------|-----------------|--------|
| **"Novo pedido"** | **"Novo pedido web"** ou **"Novo pedido"** | Quando pedido chega | Diferencia origem (web vs garçom) | ✅ |
| **"Mesa X - Verificar"** | **"Mesa 7 - Sem ação há 15 min, verificar se precisa algo"** | Mesa ocupada há 15-30min | Contexto claro, ação específica | 🔄 |
| **"Cliente precisa de atenção"** | **"Mesa 7 - Cliente chamou, verificar urgência"** | Mesa com status `needs_attention` | Contexto claro, indica urgência | 🔄 |
| **"Quer pagar"** | **"Mesa 7 quer pagar"** | Pedido entregue, cliente quer pagar | Inclui mesa, mais específico | 🔄 |
| **"Item pronto"** | **"Item pronto - Mesa 7"** | Item pronto para entrega | Inclui mesa, mais contexto | 🔄 |
| **"Cozinha saturada"** | **"Cozinha saturada - Priorizar bebidas para liberar espaço"** | Pressão alta na cozinha | Contexto + ação clara | 🔄 |
| **"Sem ação há 30+ min"** | **"Mesa 7 - Sem ação há 30 min, verificar se cliente precisa algo"** | Mesa ocupada há muito tempo | Contexto completo, ação clara | 🔄 |

### Feedback Web (Cliente)

| Texto Atual | Texto Novo | Quando Aparece | Por Que Melhora | Status |
|------------|------------|----------------|-----------------|--------|
| **"Enviando pedido..."** | **"Enviando pedido..."** | Durante envio | Mantém, já é claro | ✅ |
| **"Pedido recebido"** | **"✅ Pedido recebido! Aguarde o preparo."** | Após confirmação | Mais claro, com emoji, instrução clara | ✅ |
| **"Erro ao enviar"** | **"Erro ao enviar pedido. Verifique sua conexão e tente novamente."** | Se envio falhar | Mais específico, oferece solução | ✅ |

### Feedback de Pagamento (Garçom)

| Texto Atual | Texto Novo | Quando Aparece | Por Que Melhora | Status |
|------------|------------|----------------|-----------------|--------|
| **"Processando..."** | **"Processando pagamento..."** | Durante processamento | Mais específico | ✅ |
| **"Pagamento confirmado"** | **"Pagamento confirmado! €45.50"** | Após processar | Inclui valor, mais informativo | 🔄 |
| **"Confirmar Pagamento"** | **"Confirmar Pagamento de €45.50?"** | Antes de processar | Inclui valor, confirmação clara | 🔄 |

### Estados e Status

| Texto Atual | Texto Novo | Quando Aparece | Por Que Melhora | Status |
|------------|------------|----------------|-----------------|--------|
| **"pending"** | **"Aguardando preparo"** | Status do pedido (web) | Linguagem humana | 🔄 |
| **"preparing"** | **"Em preparo"** | Status do pedido (web) | Linguagem humana | 🔄 |
| **"ready"** | **"Pronto para entrega"** | Status do pedido (web) | Linguagem humana | 🔄 |
| **"delivered"** | **"Entregue"** | Status do pedido (web) | Linguagem humana | 🔄 |

---

## 🎨 Padrões de Microcopy

### Botões de Ação

**Padrão:** VERBO + OBJETO (quando aplicável)

- ✅ "VER PEDIDO" (não "CONFIRMAR")
- ✅ "ENTREGAR" (não "MARCAR COMO ENTREGUE")
- ✅ "COBRAR" (não "PROCESSAR PAGAMENTO")
- ✅ "VERIFICAR" (não "CHECK")

### Mensagens de Contexto

**Padrão:** OBJETO + CONTEXTO + AÇÃO

- ✅ "Mesa 7 - Sem ação há 15 min, verificar se precisa algo"
- ✅ "Novo pedido web - Mesa 5"
- ✅ "Item pronto - Mesa 3"

### Confirmações

**Padrão:** PERGUNTA ESPECÍFICA + VALOR (quando aplicável)

- ✅ "Confirmar pagamento de €45.50?"
- ✅ "Remover [nome do item]?"
- ✅ "Cancelar pedido? Esta ação não pode ser desfeita."

### Feedback de Sucesso

**Padrão:** EMOJI + MENSAGEM + VALOR (quando aplicável)

- ✅ "✅ Pedido recebido! Aguarde o preparo."
- ✅ "✅ Pagamento confirmado! €45.50"
- ✅ "✅ Item entregue"

### Feedback de Erro

**Padrão:** PROBLEMA + SOLUÇÃO

- ✅ "Erro ao enviar pedido. Verifique sua conexão e tente novamente."
- ✅ "Pagamento bloqueado. Pedido deve estar entregue antes de pagar."
- ✅ "Caixa fechado. Abra o cofre antes de receber dinheiro."

---

## 📊 Estatísticas

### Termos Eliminados

- ❌ "acknowledge" → ✅ "VER PEDIDO"
- ❌ "check" (genérico) → ✅ "VERIFICAR" (com contexto)
- ❌ "resolve" (genérico) → ✅ "RESOLVER" (com contexto)

### Termos Mantidos (com melhoria)

- ✅ "VERIFICAR" (mantém, mas mensagem específica)
- ✅ "RESOLVER" (mantém, mas mensagem específica)
- ✅ "PRIORIZAR" (mantém, mas mensagem específica)

### Termos Adicionados

- ✅ "VER PEDIDO" (novo, claro)
- ✅ Contexto específico em todas as mensagens
- ✅ Valores e informações relevantes nas confirmações

---

## ✅ Checklist de Implementação

### Fase 1: Críticos (✅ COMPLETO)

- [x] ERRO-003: "acknowledge" → "VER PEDIDO"
- [x] Mensagens específicas para novos pedidos

### Fase 2: Altos (🔄 PENDENTE)

- [ ] ERRO-018: Mensagens específicas para "check"
- [ ] ERRO-025: Mensagem específica para "prioritize_drinks"
- [ ] Mensagens específicas para todas as ações

### Fase 3: Médios (🔄 PENDENTE)

- [ ] Padronizar todos os estados do pedido (web)
- [ ] Padronizar feedback de pagamento
- [ ] Padronizar confirmações

---

**Versão:** 2.0.0-RC1  
**Data:** 2026-01-24  
**Status:** ✅ **PADRÃO DEFINIDO - IMPLEMENTAÇÃO EM ANDAMENTO**

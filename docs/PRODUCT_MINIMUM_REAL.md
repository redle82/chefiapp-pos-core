# 🎯 Produto Mínimo Real (PMR) - ChefIApp

**Fase:** Transição de Core Validado → Produto Usável  
**Objetivo:** Provar que um humano consegue usar sem pensar no Core

---

## 🧠 FILOSOFIA

> "O Core está pronto. O próximo passo é provar que um humano consegue usá-lo sem pensar no Core."

**Mudança de foco:**
- ❌ De: Performance técnica, stress, caos
- ✅ Para: Clareza, simplicidade, adoção

---

## 🎯 OBJETIVO DO PMR

**Uma pessoa real consegue usar isso sem entender o Core?**

### Validações Necessárias
- ✅ 1 restaurante real (ou semi-real)
- ✅ 1 dono
- ✅ 1 gerente
- ✅ 2-3 funcionários
- ✅ Pedidos reais (poucos)
- ✅ KDS real (simples)
- ✅ Estoque simples
- ✅ Compras ligadas (já testadas)

**Aqui você valida fricção, não performance.**

---

## 👥 PERSONAS DO PMR

### 1. Dono do Restaurante
**Necessidades:**
- Ver se está tudo funcionando
- Saber se há problemas
- Entender o que precisa fazer agora

**Não precisa:**
- Entender Docker
- Ver métricas técnicas
- Diagnosticar problemas de infra

### 2. Gerente
**Necessidades:**
- Gerenciar funcionários
- Ver pedidos em andamento
- Resolver problemas operacionais

**Não precisa:**
- Ver queries SQL
- Entender Event Sourcing
- Diagnosticar locks no banco

### 3. Funcionários (Garçom, Cozinheiro, Bar)
**Necessidades:**
- Ver o que precisa fazer
- Marcar tarefas como feitas
- Comunicar status

**Não precisa:**
- Ver métricas de sistema
- Entender arquitetura
- Diagnosticar problemas

---

## 🎨 UI PARA DECISÃO HUMANA (NÃO TÉCNICA)

### Princípios

#### 1. Menos Métricas, Mais Respostas
**Antes (Técnico):**
- "TPS: 1234"
- "Locks ativos: 45"
- "Eventos/seg: 567"

**Depois (Humano):**
- "Tem problema agora?" → "Não, tudo funcionando"
- "Onde agir?" → "Cozinha: 3 pedidos aguardando"
- "Posso ignorar?" → "Sim, tudo sob controle"

#### 2. Ações, Não Diagnósticos
**Antes:**
- Mostrar dados brutos
- Esperar que usuário interprete

**Depois:**
- Mostrar o que fazer
- Decisão clara e direta

#### 3. Contexto, Não Dados
**Antes:**
- Lista de números
- Gráficos técnicos

**Depois:**
- "O que está acontecendo?"
- "O que preciso fazer?"
- "Está tudo bem?"

---

## 📋 FLUXOS DO PMR

### Fluxo 1: Dono Vê Status
```
Dono abre app
  ↓
Vê: "Tudo funcionando" ou "Precisa de atenção"
  ↓
Se precisa atenção:
  - Vê: "3 itens com estoque baixo"
  - Ação: "Verificar reposição"
  ↓
Resolve ou ignora
```

### Fluxo 2: Gerente Gerencia Operação
```
Gerente abre app
  ↓
Vê: "5 pedidos em andamento"
  ↓
Vê: "Cozinha: 2 pedidos aguardando"
  ↓
Ação: "Verificar cozinha"
  ↓
Resolve ou delega
```

### Fluxo 3: Funcionário Faz Tarefas
```
Funcionário abre app
  ↓
Vê: "Suas tarefas: 3"
  ↓
Vê lista de tarefas
  ↓
Marca como feita
  ↓
Próxima tarefa aparece
```

---

## 🎯 MÉTRICAS DE SUCESSO DO PMR

### Técnicas (Já Validadas)
- ✅ Core funciona
- ✅ Performance adequada
- ✅ Integridade preservada

### Humanas (A Validar)
- ⏳ Usuário consegue usar sem treinamento técnico?
- ⏳ Decisões são claras?
- ⏳ Fricção é mínima?
- ⏳ Usuário confia no sistema?

---

## 🚫 O QUE NÃO FAZER NO PMR

### ❌ Adicionar Mais Caos
- Core já validado
- Não precisa mais stress artificial

### ❌ Sofisticar o Core
- Core está pronto
- Foco em uso, não em infra

### ❌ Mostrar Métricas Técnicas
- Usuário não precisa ver
- Mostrar apenas o necessário

### ❌ Criar Features Complexas
- Simplicidade primeiro
- Adoção depois

---

## ✅ O QUE FAZER NO PMR

### ✅ Simplificar UI
- Menos informação
- Mais clareza

### ✅ Focar em Decisões
- "O que fazer?"
- "Está tudo bem?"

### ✅ Validar Fricção
- Onde usuário trava?
- O que não entende?
- O que falta?

### ✅ Iterar Rápido
- Testar com usuários reais
- Ajustar baseado em feedback
- Simplicidade sempre

---

## 📊 DIFERENÇA: TÉCNICO vs PRODUTO

### Modo Técnico (Já Funciona)
```
Central de Comando
  ↓
Mostra: TPS, Locks, Eventos, Tasks, SLA
  ↓
Engenheiro interpreta
  ↓
Toma decisão técnica
```

### Modo Produto (A Construir)
```
App do Restaurante
  ↓
Mostra: "Tudo OK" ou "3 ações necessárias"
  ↓
Usuário vê o que fazer
  ↓
Toma decisão operacional
```

---

## 🎯 CHECKLIST DO PMR

### Setup
- [ ] 1 restaurante real configurado
- [ ] 1 dono cadastrado
- [ ] 1 gerente cadastrado
- [ ] 2-3 funcionários cadastrados
- [ ] Menu básico configurado
- [ ] Mesas configuradas

### Operação
- [ ] Dono consegue ver status geral
- [ ] Gerente consegue gerenciar operação
- [ ] Funcionários conseguem ver tarefas
- [ ] Pedidos podem ser criados
- [ ] KDS mostra pedidos
- [ ] Estoque pode ser gerenciado
- [ ] Compras podem ser feitas

### Validação
- [ ] Usuário usa sem treinamento técnico
- [ ] Decisões são claras
- [ ] Fricção é mínima
- [ ] Sistema é confiável

---

## 🔄 PRÓXIMOS PASSOS

1. **Congelar Core v1.0** ✅ (Feito)
2. **Definir PMR** ✅ (Este documento)
3. **Construir UI de Produto** (Próximo)
4. **Testar com Usuários Reais** (Depois)
5. **Iterar Baseado em Feedback** (Contínuo)

---

## 📝 NOTAS

- **Core não muda** durante PMR
- **Foco em UX**, não em features
- **Simplicidade** é a meta
- **Adoção** é o sucesso

---

**Última atualização:** 2026-01-27

# Guia UX "Anti-Erro Humano" — ChefIApp POS Core

**Contexto:** Restaurante = ambiente de alta pressão, cansaço, multitarefa, ruído  
**Objetivo:** Reduzir erro humano através de design que guia, confirma e previne

---

## 🧠 Princípios Fundamentais

### 1. Clareza > Beleza
Em ambiente de pressão, o usuário não tem tempo para "descobrir" como usar.  
**Regra:** Em 3 segundos, usuário deve saber o que fazer.

### 2. Confirmação > Velocidade
Erros custam mais que um clique extra.  
**Regra:** Ações críticas (fechar pedido, cancelar) sempre pedem confirmação.

### 3. Feedback > Silêncio
Usuário precisa saber que ação foi registrada.  
**Regra:** Toda ação tem feedback imediato (<200ms).

### 4. Prevenção > Correção
Melhor prevenir erro do que corrigir depois.  
**Regra:** Estados impossíveis não devem ser acessíveis.

---

## 🎯 Padrões por Contexto

### CONTEXTO 1: Alta Pressão (TPV, KDS)

#### Problema
Garçom/caixa sob pressão, múltiplos pedidos, cliente esperando.

#### Soluções

**Hierarquia Visual Absoluta**
- Um CTA dominante por tela (cor exclusiva, tamanho maior)
- Ações secundárias visualmente menores
- Espaçamento que cria "zona de ação principal"

**Confirmação Explícita**
- Fechar pedido: modal de confirmação com total
- Cancelar item: "Tem certeza?" com item destacado
- Ações irreversíveis: sempre pedem confirmação

**Feedback Imediato**
- Adicionar item: animação + som opcional
- Remover item: feedback visual claro
- Salvar: indicador de sucesso

**Prevenção de Erro**
- Botão "Fechar pedido" desabilitado se pedido vazio
- Validação antes de enviar (ex: mesa obrigatória)
- Estados impossíveis não acessíveis

---

### CONTEXTO 2: Cansaço (AppStaff, Inventory)

#### Problema
Funcionário cansado, fim de turno, atenção reduzida.

#### Soluções

**Instrução Explícita**
- Empty state: "Nenhum pedido. Toque em 'Novo Pedido'."
- Loading: "Carregando pedidos…" (não spinner genérico)
- Erro: "Não foi possível carregar. Toque para tentar novamente."

**Redução de Decisões**
- Defaults inteligentes (80/20)
- Opções comuns pré-selecionadas
- "Pular" quando possível

**Feedback Emocional**
- Concluir tarefa: animação + som + XP visível
- Sucesso: cor verde + ícone de check
- Erro: cor vermelha + mensagem clara

---

### CONTEXTO 3: Multitarefa (Manager, Owner)

#### Problema
Múltiplas telas, muitas informações, decisões rápidas.

#### Soluções

**Agrupamento Visual**
- Informações relacionadas juntas
- Espaçamento que cria grupos
- Cores semânticas (urgente, normal, ok)

**Priorização Clara**
- O que é urgente visualmente destacado
- O que pode esperar visualmente secundário
- Filtros/ordenação por padrão útil

**Navegação Rápida**
- Tabs claras
- Breadcrumbs quando necessário
- Atalhos de teclado (futuro)

---

## 🛡️ Padrões de Prevenção

### Padrão 1: Validação Antecipada
**Antes:** Usuário preenche tudo, clica "Salvar", recebe erro.  
**Depois:** Validação em tempo real, erro aparece ao lado do campo.

### Padrão 2: Confirmação para Ações Críticas
**Ações que sempre pedem confirmação:**
- Fechar pedido
- Cancelar pedido
- Deletar item permanente
- Publicar/despublicar restaurante

### Padrão 3: Estados Impossíveis Inacessíveis
**Exemplos:**
- Botão "Fechar pedido" desabilitado se pedido vazio
- Botão "Lock" desabilitado se pedido já está LOCKED
- Botão "Concluir" desabilitado se tarefa não está ativa

### Padrão 4: Feedback Imediato
**Toda ação tem feedback:**
- Clicar botão: estado visual muda (<100ms)
- Salvar: indicador de sucesso (<200ms)
- Erro: mensagem clara (<500ms)

---

## 📋 Checklist "Anti-Erro" por Tela

### TPV
- [ ] CTA "Novo Pedido" é dominante visualmente
- [ ] Fechar pedido pede confirmação
- [ ] Adicionar item tem feedback imediato
- [ ] Pedido vazio não pode ser fechado
- [ ] Total sempre visível

### KDS
- [ ] Urgência visual clara (cores)
- [ ] Pedido mais antigo no topo
- [ ] Marcar como pronto tem feedback
- [ ] Agrupamento por tempo

### AppStaff
- [ ] Tarefa ativa claramente destacada
- [ ] Concluir tarefa tem feedback emocional
- [ ] Transição entre modos clara
- [ ] Empty state com instrução

### Inventory
- [ ] Hunger signals visualmente destacados
- [ ] Ação recomendada sempre visível
- [ ] CTAs contextuais (Comprar, Ajustar)
- [ ] Confirmação para ajustes grandes

---

## 🎨 Elementos Visuais "Anti-Erro"

### Cores Semânticas
- 🔴 Vermelho: Erro, crítico, urgente
- 🟡 Amarelo: Atenção, aviso
- 🟢 Verde: Sucesso, ok, normal
- 🔵 Azul: Informação, ação primária

### Tamanhos
- **Grande:** Ação principal (ex: "Novo Pedido")
- **Médio:** Ações secundárias
- **Pequeno:** Ações terciárias, links

### Espaçamento
- **Apertado:** Elementos relacionados (ex: label + input)
- **Normal:** Elementos do mesmo grupo
- **Largo:** Separação entre grupos/seções

---

## ✅ Critérios de Sucesso

Um componente está "anti-erro" quando:

1. **Clareza:** Usuário sabe o que fazer em 3s
2. **Confirmação:** Ações críticas pedem confirmação
3. **Feedback:** Toda ação tem resposta imediata
4. **Prevenção:** Estados impossíveis não acessíveis
5. **Recuperação:** Erros têm caminho de recuperação claro

---

## 🧪 Teste de Validação

**Pergunta para cada tela:**
> "Um funcionário cansado, sob pressão, com cliente esperando, consegue usar isso sem pensar?"

Se a resposta for "não", aplicar padrões anti-erro.

---

**Próximo passo:** Aplicar padrões S0 primeiro (TPV, KDS, Empty states).

